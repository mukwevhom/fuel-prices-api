import { Context } from "@oak/oak";
import * as Sentry from "sentry";
import Model from "./model.ts";
import {scraper, historicalScraper} from "./utils/scraper.ts";
import { JSON_Obj, fuelInfo } from "./utils/types.ts";
import { COASTAL_FUEL_NAMES, INLAND_FUEL_NAMES } from "./utils/constants.ts";
import { comparePrices, getCurrentMonth } from "./utils/helpers.ts";

const coastalModel = new Model('coastal_prices')
const inlandModel = new Model('inland_prices')

const index = async (ctx: Context) => {
    try {
        const {rows: coastalResults} = await coastalModel.select()

        const {rows: inlandResults} = await inlandModel.select()
        
        ctx.response.body = { msg: "fuel prices", coastalResults, inlandResults }
        return;
    } catch (err) {
        Sentry.captureException(err);
    }
};

const getPrices = async (ctx: Context, next: () => Promise<unknown>) => {
    try {
        await next()
        const url = new URL(ctx.request.url);
        const compareParam = url.searchParams.get("compare")
        
        let pricesJSON, pricesChangesJSON

        let currMonth = getCurrentMonth()
        let prevMonthChange = 0

        let { rows: currMonthData } = await inlandModel.select('*', `WHERE month='${currMonth}'`)

        if(currMonthData.length === 0) {
            currMonth = getCurrentMonth(0)
            prevMonthChange = -1;

            ({rows: currMonthData} = await inlandModel.select('*', `WHERE month='${currMonth}'`))
        }

        if(compareParam) {
            if(compareParam === "latest") {
                pricesJSON = currMonthData[0]

                const prevDate = getCurrentMonth(prevMonthChange)

                const {rows: data} = await inlandModel.select('*', `WHERE month='${prevDate}' OR month='${currMonth}'`)

                if(data.length === 2) {
                    pricesChangesJSON = comparePrices(data)
                }
            }
        } else {
            pricesJSON = currMonthData[0]
        }

        ctx.response.body = { msg: "prices", prices: pricesJSON, priceChanges: pricesChangesJSON }

        return;
    } catch (err) {
        Sentry.captureException(err);
    }
};

const getScrap = async (ctx: Context) => {
    try {
        const scrap = await scraper()

        const coastalFuelData: JSON_Obj = {}

        scrap?.coastal.forEach((value:fuelInfo, _idx: number) => {
            value.prices.forEach((price: number, jdx: number) => {
                if(price){
                    const month = `${scrap.year}-${(jdx+1).toString().padStart(2, '0')}`
                    const key = COASTAL_FUEL_NAMES[value.name]
                    if(!coastalFuelData[month]) {
                        coastalFuelData[month]={}
                        coastalFuelData[month][key] = price
                    } else {
                        coastalFuelData[month][key] = price
                    }
                }
            })
        })

        const coastalValueArray: Array<string|number>[] = []

        for(const month in coastalFuelData) {
            const {rows: data} = await coastalModel.select('*', `WHERE month='${month}'`)

            if(data.length === 0) {
                const monthArray:Array<string|number> = []

                monthArray.push(month)

                for(const fuel in coastalFuelData[month]) {
                    monthArray.push(coastalFuelData[month][fuel])
                }

                coastalValueArray.push(monthArray)
            }
        }

        if(coastalValueArray.length > 0) {
            await coastalModel.insert("month, _95_lrp, _95_ulp, diesel_005, diesel_0005, illuminating_paraffin, liquefied_petroleum_gas", coastalValueArray)
        }

        // Inlands Indexing
        const inlandFuelData: JSON_Obj = {}

        scrap?.inland.forEach((value:fuelInfo, _idx: number) => {
            value.prices.forEach((price: number, jdx: number) => {
                if(price){
                    const month = `${scrap.year}-${(jdx+1).toString().padStart(2, '0')}`
                    const key = INLAND_FUEL_NAMES[value.name]
                    if(!inlandFuelData[month]) {
                        inlandFuelData[month]={}
                        inlandFuelData[month][key] = price
                    } else {
                        inlandFuelData[month][key] = price
                    }
                }
            })
        })

        const inlandValueArray: Array<string|number>[] = []

        for(const month in inlandFuelData) {
            const {rows: data} = await inlandModel.select('*', `WHERE month='${month}'`)

            if(data.length === 0) {
                const monthArray:Array<string|number> = []

                monthArray.push(month)
                for(const fuel in inlandFuelData[month]) {
                    monthArray.push(inlandFuelData[month][fuel])
                }

                inlandValueArray.push(monthArray)
            }
        }

        if(inlandValueArray.length > 0) {
            await inlandModel.insert("month, _93_lrp, _93_ulp, _95_ulp, diesel_005, diesel_0005, illuminating_paraffin, liquefied_petroleum_gas", inlandValueArray)
        }

        ctx.response.body = { msg: "scraping successful" }

        return;
    } catch (err) {
        Sentry.captureException(err);
    }
};

const getScrapPast = async (ctx: Context) => {
    try {
        const historicalPrices = await historicalScraper()

        for(const scrap of historicalPrices) {
            const coastalFuelData: JSON_Obj = {}

            scrap?.coastal.forEach((value:fuelInfo, _idx: number) => {
                value.prices.forEach((price: number, jdx: number) => {
                    if(price){
                        const month = `${scrap.year}-${(jdx+1).toString().padStart(2, '0')}`
                        const key = COASTAL_FUEL_NAMES[value.name]
                        if(!coastalFuelData[month]) {
                            coastalFuelData[month]={}
                            coastalFuelData[month][key] = price
                        } else {
                            coastalFuelData[month][key] = price
                        }
                    }
                })
            })
        
            const coastalValueArray: Array<string|number>[] = []
        
            for(const month in coastalFuelData) {
                const {rows: data} = await coastalModel.select('*', `WHERE month='${month}'`)
        
                if(data.length === 0) {
                    const monthArray:Array<string|number> = []
        
                    monthArray.push(month)
        
                    for(const fuel in coastalFuelData[month]) {
                        monthArray.push(coastalFuelData[month][fuel])
                    }
        
                    coastalValueArray.push(monthArray)
                }
            }
        
            if(coastalValueArray.length > 0) {
                await coastalModel.insert("month, _95_lrp, _95_ulp, diesel_005, diesel_0005, illuminating_paraffin, liquefied_petroleum_gas", coastalValueArray)
            }

            const inlandFuelData: JSON_Obj = {}

            scrap?.inland.forEach((value:fuelInfo, _idx: number) => {
                value.prices.forEach((price: number, jdx: number) => {
                    if(price){
                        const month = `${scrap.year}-${(jdx+1).toString().padStart(2, '0')}`
                        const key = INLAND_FUEL_NAMES[value.name]
                        if(!inlandFuelData[month]) {
                            inlandFuelData[month]={}
                            inlandFuelData[month][key] = price
                        } else {
                            inlandFuelData[month][key] = price
                        }
                    }
                })
            })

            const inlandValueArray: Array<string|number>[] = []

            for(const month in inlandFuelData) {
                const {rows: data} = await inlandModel.select('*', `WHERE month='${month}'`)

                if(data.length === 0) {
                    const monthArray:Array<string|number> = []

                    monthArray.push(month)
                    for(const fuel in inlandFuelData[month]) {
                        monthArray.push(inlandFuelData[month][fuel])
                    }

                    inlandValueArray.push(monthArray)
                }
            }

            if(inlandValueArray.length > 0) {
                await inlandModel.insert("month, _93_lrp, _93_ulp, _95_ulp, diesel_005, diesel_0005, illuminating_paraffin, liquefied_petroleum_gas", inlandValueArray)
            }
        }

        ctx.response.body = { msg: "scraping successful" }
        return;
    } catch (err) {
        Sentry.captureException(err);
    }
}
 
export { index, getPrices, getScrap, getScrapPast}
