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
                price: Math.abs(diff).toFixed(2),
                change: diff > 0 ? 'down' : 'up'
                
            })
        }
    }

    return changeData
}

const getCurrentMonth = (monthChange: number = 1) => {
    const date = new Date()
    const month = date.getMonth() + monthChange
    const year = date.getFullYear()

    return `${year}-${month.toString().padStart(2, '0')}`
}

export { comparePrices, getCurrentMonth }
