import { Application } from "https://deno.land/x/oak@v11.1.0/mod.ts";

import router from "./routes.ts";

const APP_PORT = Number(Deno.env.get("APP_PORT")) || 4000;

const app = new Application();

app.use(router.routes());

app.listen({ port: APP_PORT });
