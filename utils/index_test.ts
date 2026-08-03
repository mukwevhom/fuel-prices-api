import { assertEquals } from "@std/assert";
import { createInsertValues } from "./index.ts";

Deno.test("createInsertValues() quotes the first column and leaves the rest as raw values", () => {
    const result = createInsertValues([["2024-01", 20.5, 18.0]]);

    assertEquals(result, "('2024-01',20.5,18)");
});

Deno.test("createInsertValues() joins multiple rows with a comma", () => {
    const result = createInsertValues([
        ["2024-01", 20.5],
        ["2024-02", 21.0],
    ]);

    assertEquals(result, "('2024-01',20.5),('2024-02',21)");
});

Deno.test("createInsertValues() returns an empty string for an empty input", () => {
    const result = createInsertValues([]);

    assertEquals(result, "");
});
