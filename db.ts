import { Pool } from "postgres/mod.ts";
import "@std/dotenv/load";

const POOL_CONNECTIONS = 20;
const dbPool = new Pool(Deno.env.get("POSTGRESQL_CONNECTION_URI"), POOL_CONNECTIONS);

export default dbPool;
