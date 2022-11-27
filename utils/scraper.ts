import { cheerio } from "https://deno.land/x/cheerio@1.0.7/mod.ts";

const url = 'https://www.sapia.org.za/fuel-prices/';

const scraper = async () => {
    try {
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html)

        const fuelPriceTable = $('#tablepress-2022')

        for (let i = 2; i <= 7; i++) {
            let currRow = fuelPriceTable.find(`tbody tr:nth-child(${i})`)

            console.log('text', currRow)
        }
    
        return fuelPriceTable.text()
    } catch(error) {
        console.log(error);
    }
}

export default scraper
