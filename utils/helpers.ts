import { FULL_FUEL_NAMES } from "./constants.ts"
import { CHANGE_JSON } from "./types.ts"

const comparePrices = (data:any[]) => {
    const currData = data[1]
    const prevData = data[0]
    const changeData:Array<CHANGE_JSON> = []

    for(const key in currData) {
        if(!["id", "month"].includes(key)) {
            const diff = currData[key] - prevData[key]
            const currFuel = FULL_FUEL_NAMES.find(fuel => fuel.id === key)
            changeData.push({
                id: key,
                name: currFuel?.name,
                diff: Math.abs(diff).toFixed(2),
                change: diff > 0 ? 'down' : 'up'
                
            })
        }
    }

    return changeData
}

export { comparePrices }