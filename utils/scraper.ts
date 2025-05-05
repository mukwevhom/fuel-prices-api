import * as cheerio from "cheerio/";
import { fuelInfo, FuelPrice } from "./types.ts";

const url = 'https://fuelsindustry.org.za/consumer-information/fuel-prices-current-past/';

const scraper = async () => {
    try {
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html)

        const coastalTable = $('#table_1')
        const inlandTable = $('#table_2')

        const year = getYear(coastalTable)

        const fuelPrices: FuelPrice = {
            "year": year,
            "coastal": [],
            "inland": []
        }

        fuelPrices.coastal = getPrices(coastalTable, 1, 6)
        fuelPrices.inland = getPrices(inlandTable, 1, 7)
    
        return fuelPrices
    } catch(error) {
        throw error
    }
}

const historicalScraper = async () => {
    try {
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html)

        const pastFuelPrices: FuelPrice[] = []
        const pastFuelPricesItems = $('.tf-accordion .tf-accordion-item')

        for (const item of pastFuelPricesItems) {
            const el = $(item)
            const elTitle = el.find('.accordion-title')
            const elContent = el.find('.accordion-content')

            const year = elTitle.text().trim()

            if (year && elContent.length) {
                const fuelPrices: FuelPrice = {
                    "year": Number(year),
                    "coastal": [],
                    "inland": []
                }

                const fuelPriceTable = elContent.find(`#tablepress-${year}`)

                fuelPrices.coastal = getPrices(fuelPriceTable, 2, 7)
                fuelPrices.inland = Number(year) === 2023 ? getPrices(fuelPriceTable, 10, 16) : getPrices(fuelPriceTable, 9, 15)

                pastFuelPrices.push(fuelPrices)
            }
        }
    
        return pastFuelPrices
    } catch(error) {
        throw error
    }
}

const getPrices = (fuelPriceTable: cheerio.Cheerio<cheerio.Element>, start: number, end: number) => {
    const $ = cheerio.load(fuelPriceTable[0])
    const tempInfoArr:fuelInfo[] = []

    for (let i = start; i <= end; i++) {
        const currRow = $(`tbody tr:nth-child(${i})`)

        const fuelName = currRow.find('td:first-child').text().trim().replace(/\s*\*+$/gmi, "")
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

export { scraper, historicalScraper }
