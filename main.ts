import { Application } from "https://deno.land/x/oak/mod.ts";

import router from "./routes.ts";

const APP_HOST = Deno.env.get("APP_HOST") || "127.0.0.1";
const APP_PORT = Deno.env.get("APP_PORT") || 4000;

const app = new Application();

app.use(router.routes());

console.log(`Listening on port:${APP_PORT} ${APP_HOST}...`);

await app.listen(`${APP_HOST}:${APP_PORT}`);
