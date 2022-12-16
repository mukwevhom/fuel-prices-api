import { Context } from "https://deno.land/x/oak@v11.1.0/mod.ts"; 
import Model from "./model.ts";
import scraper from "./utils/scraper.ts";

const coastalModel = new Model('coastal_prices')
const inlandModel = new Model('inland_prices')

const index = async (ctx: Context) => {
    const {rows: coastalResults} = await coastalModel.select()

    await coastalModel.insert("month, _95_lrp, _95_ulp, diesel_005, diesel_0005, illuminating_paraffin, liquefied_petroleum_gas", [['2022-11', 1.2, 2, 3, 4, 5, 6], ['2022-12', 1.2, 2, 3, 4, 5, 6]])

    const {rows: inlandResults} = await inlandModel.select()
    
    ctx.response.body = { msg: "test", coastalResults, inlandResults }

    return;
};

const getPrices = async (ctx: Context, next: () => Promise<unknown>) => {
    await next()

    const scrap = await scraper()

    const columns = "month, _95_lrp, _95_ulp, diesel_005, diesel_0005, illuminating_paraffin, liquefied_petroleum_gas"

    

    ctx.response.body = { msg: "prices", scrap }

    return;
};

const getScrap = async (ctx: Context) => {

    const scrap = await scraper()

    let year = scrap?.year
    console.log(scrap)
    
    ctx.response.body = { msg: "scrap", scrap }

    return;
};
 
 export { index, getPrices, getScrap}