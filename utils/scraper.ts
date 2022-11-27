import { cheerio } from "https://deno.land/x/cheerio@1.0.7/mod.ts";

const url = 'https://www.sapia.org.za/fuel-prices/';

try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html)

    const fuelPriceTable = $('#tablepress-2022')
  
    console.log(fuelPriceTable)
} catch(error) {
    console.log(error);
}