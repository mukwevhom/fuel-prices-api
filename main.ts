import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";

import router from "./routes.ts";

const APP_PORT = Number(Deno.env.get("APP_PORT")) || 4000;

const app = new Application();

app.use(router.routes());

app.listen({ port: APP_PORT });

Deno.cron("Scrap Latest Petrol Prices", "*\/2  * * * *", async () => {
    console.log("Scraping Latest Petrol Prices", APP_PORT);
    await fetch(`https://uc-fuel-scrapper.deno.dev/scrap`);
});
