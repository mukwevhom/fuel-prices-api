import { Router } from "@oak/oak/router";
import {getPrices, getScrap, getScrapPast, index} from "./controllers.ts";

const router = new Router()

router.get('/', index)
router.get('/prices', getPrices)
router.get('/scrap', getScrap)
router.get('/scrap-past', getScrapPast)

export default router;
