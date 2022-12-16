import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";

const POOL_CONNECTIONS = 20;
const dbPool = new Pool(Deno.env.get("POSTGRESQL_CONNECTION_URI"), POOL_CONNECTIONS);

export default dbPool;
