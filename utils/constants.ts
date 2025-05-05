import { FUEL_NAMES_JSON } from "./types.ts";

export const COASTAL_FUEL_NAMES: FUEL_NAMES_JSON = {
    "95 LRP (c/l)": "_95_lrp",
    "95 ULP (c/l)": "_95_ulp",
    "Diesel 0.05% (c/l)": "diesel_005",
    "Diesel 0.005% (c/l)": "diesel_0005",
    "Illuminating Paraffin (c/l)": "illuminating_paraffin",
    "Liquefied Petroleum Gas (c/kg)": "liquefied_petroleum_gas"
}

export const INLAND_FUEL_NAMES: FUEL_NAMES_JSON = {
    "93 LRP (c/l)": "_93_lrp",
    "93 ULP (c/l)": "_93_ulp",
    "95 ULP (c/l)": "_95_ulp",
    "Diesel 0.05% (c/l)": "diesel_005",
    "Diesel 0.005% (c/l)": "diesel_0005",
    "Illuminating Paraffin (c/l)": "illuminating_paraffin",
    "Liquefied Petroleum Gas (c/kg)": "liquefied_petroleum_gas"
}

export const FULL_FUEL_NAMES: Array<FUEL_NAMES_JSON> = [
    {
        name:"93 LRP (c/l)",
        id: "_93_lrp"
    },
    {
        name:"93 ULP (c/l)",
        id: "_93_ulp"
    },
    {
        name:"95 ULP (c/l)",
        id: "_95_ulp"
    },
    {
        name:"Diesel 0.05% (c/l)",
        id: "diesel_005"
    },
    {
        name:"Diesel 0.005% (c/l)",
        id: "diesel_0005"
    },
    {
        name:"Illuminating Paraffin (c/l)",
        id: "illuminating_paraffin"
    },
    {
        name:"Liquefied Petroleum Gas (c/kg)",
        id: "liquefied_petroleum_gas"
    }
]
