import { Pool } from "postgres";
import "@std/dotenv/load";

const POOL_CONNECTIONS = 20;
// `lazy: true` defers opening connections until they're first needed, instead of
// eagerly opening POOL_CONNECTIONS connections at module load time.
const dbPool = new Pool(Deno.env.get("POSTGRESQL_CONNECTION_URI"), POOL_CONNECTIONS, true);

export default dbPool;
