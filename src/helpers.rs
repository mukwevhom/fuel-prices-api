use serde::Serialize;
use serde_json::Value;

use crate::constants::FULL_FUEL_NAMES;

#[derive(Debug, Serialize, PartialEq)]
pub struct PriceChange {
    pub id: String,
    pub name: Option<String>,
    pub price: String,
    pub change: &'static str,
}

/// Compares two inland rows (previous, current) over every fuel column.
pub fn compare_prices(prev: &Value, curr: &Value) -> Vec<PriceChange> {
    FULL_FUEL_NAMES
        .iter()
        .map(|(name, id)| {
            let value = |row: &Value| row.get(*id).and_then(Value::as_f64).unwrap_or(0.0);
            let diff = value(curr) - value(prev);
            PriceChange {
                id: (*id).to_string(),
                name: Some((*name).to_string()),
                price: format!("{:.2}", diff.abs()),
                // Kept from the original implementation: a rise is reported as "down".
                change: if diff > 0.0 { "down" } else { "up" },
            }
        })
        .collect()
}

/// Formats `year`/`month` (1-based) as `YYYY-MM`, rolling the month over year boundaries.
pub fn month_key(year: i32, month: i32) -> String {
    let zero_based = month - 1;
    let year = year + zero_based.div_euclid(12);
    let month = zero_based.rem_euclid(12) + 1;
    format!("{year}-{month:02}")
}

/// Returns `YYYY-MM` for `month_offset` months from the given 1-based month.
pub fn offset_month(year: i32, month: i32, month_offset: i32) -> String {
    month_key(year, month + month_offset)
}

/// Lenient float parse like JavaScript's `parseFloat`: takes the longest numeric prefix.
pub fn parse_float(text: &str) -> Option<f64> {
    let text = text.trim();
    let mut end = 0;
    let mut seen_dot = false;
    for (i, c) in text.char_indices() {
        let ok = c.is_ascii_digit()
            || (i == 0 && (c == '-' || c == '+'))
            || (c == '.' && !seen_dot);
        if !ok {
            break;
        }
        seen_dot |= c == '.';
        end = i + c.len_utf8();
    }
    text[..end].parse().ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn month_key_rolls_over() {
        assert_eq!(month_key(2026, 1), "2026-01");
        assert_eq!(month_key(2026, 0), "2025-12");
        assert_eq!(month_key(2026, 13), "2027-01");
        assert_eq!(offset_month(2026, 1, -1), "2025-12");
    }

    #[test]
    fn parse_float_is_lenient() {
        assert_eq!(parse_float("2125.5"), Some(2125.5));
        assert_eq!(parse_float(" 12abc"), Some(12.0));
        assert_eq!(parse_float("-3"), Some(-3.0));
        assert_eq!(parse_float("n/a"), None);
        assert_eq!(parse_float(""), None);
    }

    #[test]
    fn compares_prices() {
        let prev = json!({"_93_ulp": 100.0, "diesel_005": 50.0});
        let curr = json!({"_93_ulp": 90.5, "diesel_005": 60.0});
        let changes = compare_prices(&prev, &curr);
        assert_eq!(changes.len(), 7);
        let ulp = changes.iter().find(|c| c.id == "_93_ulp").unwrap();
        assert_eq!(ulp.price, "9.50");
        assert_eq!(ulp.change, "up");
        assert_eq!(ulp.name.as_deref(), Some("93 ULP (c/l)"));
        let diesel = changes.iter().find(|c| c.id == "diesel_005").unwrap();
        assert_eq!(diesel.price, "10.00");
        assert_eq!(diesel.change, "down");
    }
}
