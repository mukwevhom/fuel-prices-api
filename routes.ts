import { Router } from "oak/mod.ts";
import {getPrices, getScrap, index} from "./controllers.ts";

const router = new Router()

router.get('/', index)
router.get('/prices', getPrices)
router.get('/scrap', getScrap)

export default router;
