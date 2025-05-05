import * as cheerio from "cheerio/";
import { fuelInfo, FuelPrice } from "./types.ts";

const url = 'https://fuelsindustry.org.za/consumer-information/fuel-prices-current-past/';

const scraper = async () => {
    try {
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html)

        // const fuelPriceTable = $('.tablepress')

        // const year = fuelPriceTable.find("thead tr th:first-child").text()

        const coastalTable = $('#table_1')
        const inlandTable = $('#table_2')

        const year = getYear(coastalTable)

        const fuelPrices: FuelPrice = {
            "year": year,
            "coastal": [],
            "inland": []
        }

        fuelPrices.coastal = getPrices(coastalTable, 1, 6)
        fuelPrices.inland = getPrices(inlandTable, 1, 6)
    
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

const getYear = (fuelPriceTable: cheerio.Cheerio<cheerio.Element>) => {
    const $ = cheerio.load(fuelPriceTable[0])

    const currYearFirstDate = $("thead tr th:nth-child(2)").text()
    const strYear = currYearFirstDate.split("-").at(-1)

    return Number('20'+strYear)
}

export default scraper
