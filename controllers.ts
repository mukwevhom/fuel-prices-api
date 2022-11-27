import { Context } from "https://deno.land/x/oak/mod.ts"; 
import scraper from "./utils/scraper.ts";

const index = (ctx: Context) => {
    ctx.response.body = { msg: "test" }

    return;
};

const getPrices = (ctx: Context) => {
    ctx.response.body = { msg: "prices" }

    return;
};

const getScrap = async (ctx: Context) => {

    const scrap = await scraper()
    ctx.response.body = { msg: "scrap", scrap }

    return;
};
 
 export { index, getPrices, getScrap}