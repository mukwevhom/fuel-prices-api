import { Context } from "https://deno.land/x/oak/mod.ts"; 

const index = (ctx: Context) => {
    ctx.response.body = { msg: "test" }

    return;
};

const getPrices = (ctx: Context) => {
    ctx.response.body = { msg: "prices" }

    return;
};

const getScrap = (ctx: Context) => {
    ctx.response.body = { msg: "scrap" }

    return;
};
 
 export {index, getPrices, getScrap}