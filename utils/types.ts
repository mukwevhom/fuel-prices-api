export interface fuelInfo {
    name: string,
    prices: number[]
}

export interface FuelPrice {
    "year": number,
    "coastal": fuelInfo[],
    "inland": fuelInfo[]
}