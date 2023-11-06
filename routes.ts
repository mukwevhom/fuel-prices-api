import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {getPrices, getScrap, index} from "./controllers.ts";

const router = new Router()

router.get('/', index)
router.get('/prices', getPrices)
router.get('/scrap', getScrap)

export default router;
