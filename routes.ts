import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import {getPrices, getScrap, index} from "./controllers.ts";

const router = new Router()

router
    .get('/', index)
    .get('/prices/:year/:month', getPrices)
    .get('/scrap', getScrap)

export default router;
