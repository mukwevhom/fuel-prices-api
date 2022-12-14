import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { fuelInfo, FuelPrice } from "./types.ts";

const url = 'https://www.sapia.org.za/fuel-prices/';

const scraper = async () => {
    try {
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html)

        const fuelPriceTable = $('#tablepress-2022')

        const year = fuelPriceTable.find("thead tr th:first-child").text()

        const fuelPrices: FuelPrice = {
            "year": Number(year),
            "coastal": [],
            "inland": []
        }

        console.log(getPrices(fuelPriceTable, Number(year), 2, 7))

        fuelPrices.coastal = getPrices(fuelPriceTable, Number(year), 2, 7)
        fuelPrices.inland = getPrices(fuelPriceTable, Number(year), 9, 15)
    
        return fuelPrices
    } catch(error) {
        console.log(error);
    }
}

const getPrices = (fuelPriceTable: cheerio.Cheerio<cheerio.Element>, year: number, start: number, end: number) => {

    const $ = cheerio.load(fuelPriceTable[0])
    const tempInfoArr:fuelInfo[] = []
    const monthlyFuelInfo = {}

    for (let i = start; i <= end; i++) {
        const currRow = $(`tbody tr:nth-child(${i})`)

        const fuelName = currRow.find('td:first-child').text().trim()
        const elFuelPrices = currRow.find('td:not(:first-child)')

        const tmpFuelInfo:fuelInfo = {
            name: fuelName,
            prices: []
        }

        elFuelPrices.each((idx, el: cheerio.Element) => {
            const currMonth = `${year}-${idx+1}`

            if(!monthlyFuelInfo[currMonth]) monthlyFuelInfo[currMonth] = {}

            

            const tmpPrice = $(el).text().trim().replaceAll(",", ".")
            tmpFuelInfo.prices.push(parseFloat(tmpPrice))
        });

        tempInfoArr.push(tmpFuelInfo)
    }

    return tempInfoArr

}

export default scraper
