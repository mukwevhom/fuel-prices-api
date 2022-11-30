import { Context } from "https://deno.land/x/oak@v11.1.0/mod.ts"; 
import scraper from "./utils/scraper.ts";

const index = (ctx: Context) => {
    ctx.response.body = { msg: "test" }

    return;
};

const getPrices = async (ctx: Context, next: () => Promise<unknown>) => {
    await next()

    const scrap = await scraper()

    ctx.response.body = { msg: "prices", scrap }

    return;
};

const getScrap = async (ctx: Context) => {

    const scrap = await scraper()
    ctx.response.body = { msg: "scrap", scrap }

    return;
};
 
 export { index, getPrices, getScrap}