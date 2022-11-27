import { Router } from "https://deno.land/x/oak/mod.ts";
import {getPrices, getScrap, index} from "./controllers.ts";

const router = new Router()

router
    .get('/', index)
    .get('/prices', getPrices)
    .get('/scrap', getScrap)

export default router;
