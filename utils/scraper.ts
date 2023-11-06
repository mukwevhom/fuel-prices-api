import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { fuelInfo, FuelPrice } from "./types.ts";

const url = 'https://www.sapia.org.za/fuel-prices/';

const scraper = async () => {
    try {
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html)

        const fuelPriceTable = $('.tablepress')

        const year = fuelPriceTable.find("thead tr th:first-child").text()

        const fuelPrices: FuelPrice = {
            "year": Number(year),
            "coastal": [],
            "inland": []
        }

        fuelPrices.coastal = getPrices(fuelPriceTable, 2, 7)
        fuelPrices.inland = getPrices(fuelPriceTable, 10, 16)
    
        return fuelPrices
    } catch(error) {
        throw error
    }
}

const getPrices = (fuelPriceTable: cheerio.Cheerio<cheerio.Element>, start: number, end: number) => {
    const $ = cheerio.load(fuelPriceTable[0])
    const tempInfoArr:fuelInfo[] = []

    for (let i = start; i <= end; i++) {
        const currRow = $(`tbody tr:nth-child(${i})`)

        const fuelName = currRow.find('td:first-child').text().trim()
        const elFuelPrices = currRow.find('td:not(:first-child)')

        const tmpFuelInfo:fuelInfo = {
            name: fuelName,
            prices: []
        }

        elFuelPrices.each((_, el: cheerio.Element) => {
            const tmpPrice = $(el).text().trim().replaceAll(",", ".")
            tmpFuelInfo.prices.push(parseFloat(tmpPrice))
        });

        tempInfoArr.push(tmpFuelInfo)
    }

    return tempInfoArr

}

export default scraper
