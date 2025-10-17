import { Application } from "@oak/oak/application";
import * as Sentry from "sentry";

Sentry.init({
    dsn: Deno.env.get("SENTRY_DSN"),
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
    tracePropagationTargets: ["localhost", /^https:\/\/fuel\.underconstruction\.co\.za/],
    integrations: [Sentry.captureConsoleIntegration({
        levels: ["log", "info", "warn", "error", "debug", "assert"],
    })]
});

import router from "./routes.ts";

const APP_PORT = Number(Deno.env.get("APP_PORT")) || 4000;

const app = new Application();

app.use(router.routes());

app.listen({ port: APP_PORT });

Deno.cron("Scrap Latest Petrol Prices", "0 0 1-15 * 5", async () => {
    await fetch(`https://uc-fuel-scrapper.deno.dev/scrap`);
});
