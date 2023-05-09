import { CHANGE_JSON } from "./types.ts"

const comparePrices = (data:any[]) => {
    const currData = data[1]
    const prevData = data[0]
    const changeData: CHANGE_JSON = {}

    for(const key in currData) {
        if(!["id", "month"].includes(key)) {
            console.log(key, currData[key])
            const diff = currData[key] - prevData[key]

            changeData[key] = {
                diff,
                change: diff < 0 ? 'down' : 'up'
            }
        }
    }

    console.log(changeData)
}

export { comparePrices }