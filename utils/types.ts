export interface fuelInfo {
    name: string,
    prices: number[]
}

export interface JSON_Obj {
    [key: string]: any
}

export interface FUEL_NAMES_JSON {
    [key: string]: string
}

export interface FuelPrice {
    "year": number,
    "coastal": fuelInfo[],
    "inland": fuelInfo[]
}