pub const COASTAL_FUEL_NAMES: &[(&str, &str)] = &[
    ("95 LRP (c/l)", "_95_lrp"),
    ("95 ULP (c/l)", "_95_ulp"),
    ("Diesel 0.05% (c/l)", "diesel_005"),
    ("Diesel 0.005% (c/l)", "diesel_0005"),
    ("Illuminating Paraffin (c/l)", "illuminating_paraffin"),
    ("Liquefied Petroleum Gas (c/kg)", "liquefied_petroleum_gas"),
];

pub const INLAND_FUEL_NAMES: &[(&str, &str)] = &[
    ("93 LRP (c/l)", "_93_lrp"),
    ("93 ULP (c/l)", "_93_ulp"),
    ("95 ULP (c/l)", "_95_ulp"),
    ("Diesel 0.05% (c/l)", "diesel_005"),
    ("Diesel 0.005% (c/l)", "diesel_0005"),
    ("Illuminating Paraffin (c/l)", "illuminating_paraffin"),
    ("Liquefied Petroleum Gas (c/kg)", "liquefied_petroleum_gas"),
];

/// Same entries as `INLAND_FUEL_NAMES`, used to label price changes.
pub const FULL_FUEL_NAMES: &[(&str, &str)] = INLAND_FUEL_NAMES;

pub fn column_for(names: &[(&'static str, &'static str)], fuel_name: &str) -> Option<&'static str> {
    names.iter().find(|(n, _)| *n == fuel_name).map(|(_, c)| *c)
}
