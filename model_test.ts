import { assertEquals, assertRejects } from "@std/assert";

// db.ts eagerly constructs a Pool from POSTGRESQL_CONNECTION_URI at import time.
// Provide a well-formed (but unreachable) connection string before importing Model,
// so the module can be loaded in a test environment without a live database.
if (!Deno.env.get("POSTGRESQL_CONNECTION_URI")) {
    Deno.env.set(
        "POSTGRESQL_CONNECTION_URI",
        "postgres://user:pass@localhost:5432/testdb",
    );
}

const { default: Model } = await import("./model.ts");

// Builds a fake PoolClient/Transaction pair and records how many times
// release()/rollback()/commit() are called, so tests can assert connections
// are never leaked back to the pool.
function createMockClient(overrides: {
    queryObject?: () => unknown;
    createTransaction?: () => unknown;
} = {}) {
    const calls = {
        release: 0,
        begin: 0,
        commit: 0,
        rollback: 0,
        queryArray: 0,
    };

    const transaction = {
        begin: () => {
            calls.begin++;
            return Promise.resolve();
        },
        queryArray: (_query: string) => {
            calls.queryArray++;
            return Promise.resolve({ rows: [] });
        },
        commit: () => {
            calls.commit++;
            return Promise.resolve();
        },
        rollback: () => {
            calls.rollback++;
            return Promise.resolve();
        },
    };

    const client = {
        queryObject: overrides.queryObject ??
            (() => Promise.resolve({ rows: [] })),
        createTransaction: overrides.createTransaction ?? (() => transaction),
        release: () => {
            calls.release++;
        },
    };

    return { client, transaction, calls };
}

function createMockPool(client: unknown) {
    return { connect: () => Promise.resolve(client) };
}

Deno.test("select() releases the client back to the pool on success", async () => {
    const { client, calls } = createMockClient({
        queryObject: () => Promise.resolve({ rows: [{ id: 1 }] }),
    });
    const model = new Model("coastal_prices");
    // deno-lint-ignore no-explicit-any
    model.pool = createMockPool(client) as any;

    const result = await model.select();

    assertEquals(result.rows, [{ id: 1 }]);
    assertEquals(calls.release, 1);
});

Deno.test("select() still releases the client when the query throws", async () => {
    const { client, calls } = createMockClient({
        queryObject: () => Promise.reject(new Error("boom")),
    });
    const model = new Model("coastal_prices");
    // deno-lint-ignore no-explicit-any
    model.pool = createMockPool(client) as any;

    await assertRejects(() => model.select(), Error, "boom");
    assertEquals(calls.release, 1);
});

Deno.test("select() appends the WHERE clause when provided", async () => {
    const queries: string[] = [];
    const { client } = createMockClient({
        queryObject: (query?: unknown) => {
            queries.push(String(query));
            return Promise.resolve({ rows: [] });
        },
    });
    const model = new Model("inland_prices");
    // deno-lint-ignore no-explicit-any
    model.pool = createMockPool(client) as any;

    await model.select("*", "WHERE month='2024-01'");

    assertEquals(queries[0], "SELECT * FROM inland_prices WHERE month='2024-01'");
});

Deno.test("insert() commits the transaction and releases the client on success", async () => {
    const { client, calls } = createMockClient();
    const model = new Model("coastal_prices");
    // deno-lint-ignore no-explicit-any
    model.pool = createMockPool(client) as any;

    await model.insert("month, _95_lrp", [["2024-01", 10.5]]);

    assertEquals(calls.begin, 1);
    assertEquals(calls.queryArray, 1);
    assertEquals(calls.commit, 1);
    assertEquals(calls.rollback, 0);
    assertEquals(calls.release, 1);
});

Deno.test("insert() rolls back and releases the client when the insert query fails", async () => {
    const transaction = {
        begin: () => Promise.resolve(),
        queryArray: () => Promise.reject(new Error("insert failed")),
        commit: () => Promise.resolve(),
        rollback: () => Promise.resolve(),
    };
    let releaseCalls = 0;
    let rollbackCalls = 0;
    const client = {
        createTransaction: () => transaction,
        release: () => {
            releaseCalls++;
        },
    };
    const origRollback = transaction.rollback;
    transaction.rollback = () => {
        rollbackCalls++;
        return origRollback();
    };

    const model = new Model("coastal_prices");
    // deno-lint-ignore no-explicit-any
    model.pool = createMockPool(client) as any;

    await assertRejects(
        () => model.insert("month", [["2024-01"]]),
        Error,
        "insert failed",
    );

    assertEquals(rollbackCalls, 1);
    assertEquals(releaseCalls, 1);
});

Deno.test("insert() still releases the client when createTransaction() itself throws", async () => {
    // Regression test: the client must be released even if a transaction
    // could never be created, otherwise the connection leaks out of the pool.
    let releaseCalls = 0;
    const client = {
        createTransaction: () => {
            throw new Error("could not create transaction");
        },
        release: () => {
            releaseCalls++;
        },
    };

    const model = new Model("coastal_prices");
    // deno-lint-ignore no-explicit-any
    model.pool = createMockPool(client) as any;

    await assertRejects(
        () => model.insert("month", [["2024-01"]]),
        Error,
        "could not create transaction",
    );

    assertEquals(releaseCalls, 1);
});
