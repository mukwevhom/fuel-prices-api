import { Application } from "oak/mod.ts";
import * as Sentry from "sentry/index.mjs";

Sentry.init({
    dsn: Deno.env.get("SENTRY_DSN"),
    tracesSampleRate: 1.0,
});

import router from "./routes.ts";

const APP_PORT = Number(Deno.env.get("APP_PORT")) || 4000;

const app = new Application();

app.use(router.routes());

app.listen({ port: APP_PORT });

Deno.cron("Scrap Latest Petrol Prices", "0 0 1-15 * 5", async () => {
    await fetch(`https://uc-fuel-scrapper.deno.dev/scrap`);
});
