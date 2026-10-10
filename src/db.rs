use std::collections::BTreeMap;

use serde_json::Value;
use wasm_bindgen::JsValue;
use worker::{D1Database, Result};

use crate::constants::{column_for, COASTAL_FUEL_NAMES, INLAND_FUEL_NAMES};
use crate::scraper::FuelPrice;

#[derive(Clone, Copy)]
pub enum Region {
    Coastal,
    Inland,
}

impl Region {
    pub fn table(self) -> &'static str {
        match self {
            Region::Coastal => "coastal_prices",
            Region::Inland => "inland_prices",
        }
    }

    fn fuel_names(self) -> &'static [(&'static str, &'static str)] {
        match self {
            Region::Coastal => COASTAL_FUEL_NAMES,
            Region::Inland => INLAND_FUEL_NAMES,
        }
    }
}

pub async fn select_all(db: &D1Database, region: Region) -> Result<Vec<Value>> {
    let sql = format!("SELECT * FROM {} ORDER BY month", region.table());
    db.prepare(sql).all().await?.results()
}

/// Rows for the given months, oldest first.
pub async fn select_months(db: &D1Database, region: Region, months: &[&str]) -> Result<Vec<Value>> {
    let placeholders = (1..=months.len()).map(|i| format!("?{i}")).collect::<Vec<_>>().join(", ");
    let sql = format!(
        "SELECT * FROM {} WHERE month IN ({placeholders}) ORDER BY month",
        region.table()
    );
    let params: Vec<JsValue> = months.iter().map(|m| JsValue::from_str(m)).collect();
    db.prepare(sql).bind(&params)?.all().await?.results()
}

/// Maps a scraped year to `month -> column -> price`, skipping empty prices.
fn group_by_month(region: Region, scrape: &FuelPrice) -> BTreeMap<String, BTreeMap<&'static str, f64>> {
    let fuels = match region {
        Region::Coastal => &scrape.coastal,
        Region::Inland => &scrape.inland,
    };
    let mut months: BTreeMap<String, BTreeMap<&'static str, f64>> = BTreeMap::new();

    for fuel in fuels {
        let Some(column) = column_for(region.fuel_names(), &fuel.name) else {
            continue;
        };
        for (idx, price) in fuel.prices.iter().enumerate() {
            if let Some(price) = price.filter(|p| *p != 0.0 && p.is_finite()) {
                months
                    .entry(format!("{}-{:02}", scrape.year, idx + 1))
                    .or_default()
                    .insert(column, price);
            }
        }
    }

    months
}

/// Inserts months that are not stored yet. Returns the number of months attempted.
pub async fn store_scrape(db: &D1Database, region: Region, scrape: &FuelPrice) -> Result<usize> {
    let months = group_by_month(region, scrape);
    let mut statements = Vec::with_capacity(months.len());

    for (month, prices) in &months {
        let columns = prices.keys().copied().collect::<Vec<_>>();
        let placeholders = (2..columns.len() + 2).map(|i| format!("?{i}")).collect::<Vec<_>>();
        let sql = format!(
            "INSERT OR IGNORE INTO {} (month, {}) VALUES (?1, {})",
            region.table(),
            columns.join(", "),
            placeholders.join(", ")
        );
        let mut params = vec![JsValue::from_str(month)];
        params.extend(prices.values().map(|p| JsValue::from_f64(*p)));
        statements.push(db.prepare(sql).bind(&params)?);
    }

    if statements.is_empty() {
        return Ok(0);
    }
    let count = statements.len();
    db.batch(statements).await?;
    Ok(count)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::scraper::FuelInfo;

    #[test]
    fn groups_prices_by_month_and_skips_empty() {
        let scrape = FuelPrice {
            year: 2026,
            coastal: vec![
                FuelInfo { name: "95 LRP (c/l)".into(), prices: vec![Some(10.0), Some(0.0), None] },
                FuelInfo { name: "Unknown".into(), prices: vec![Some(1.0)] },
                FuelInfo { name: "95 ULP (c/l)".into(), prices: vec![Some(20.0), Some(21.0)] },
            ],
            inland: vec![],
        };
        let grouped = group_by_month(Region::Coastal, &scrape);
        assert_eq!(grouped.len(), 2);
        assert_eq!(grouped["2026-01"]["_95_lrp"], 10.0);
        assert_eq!(grouped["2026-01"]["_95_ulp"], 20.0);
        assert_eq!(grouped["2026-02"].len(), 1);
    }
}
