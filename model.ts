import dbPool from "./db.ts";
import { createInsertValues } from "./utils/index.ts";

class Model {
    pool;
    table: string;

    constructor(table: string) {
        this.pool = dbPool
        this.table = table
    }

    async select(columns='*', clause='') {
        const client = await this.pool.connect();
        let result;

        try {
            let query = `SELECT ${columns} FROM ${this.table}`;

            if (clause) query += ` ${clause}`;

            result = await client.queryObject(query);
        } finally {
            client.release()
        }

        return result

    }

    async insert(columns: string, values: (string|number)[][]) {
        const client = await this.pool.connect();
        const transaction = client.createTransaction(`${this.table}_transact`);

        let result;

        try {
            await transaction.begin();

            const _valuesPlaceholder = columns.split(',').map((_t, i) => `$${i+1}`).join(', ')

            const query = `INSERT INTO ${this.table}(${columns}) VALUES ${createInsertValues(values)}`;
            
            result = await transaction.queryArray(query);

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        } finally {
            client.release()
        }

        return result
    }
}

export default Model
