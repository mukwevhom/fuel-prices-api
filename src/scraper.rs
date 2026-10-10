use scraper::{ElementRef, Html, Selector};

use crate::helpers::parse_float;

pub const SOURCE_URL: &str =
    "https://fuelsindustry.org.za/consumer-information/fuel-prices-current-past/";

#[derive(Debug, Clone, PartialEq)]
pub struct FuelInfo {
    pub name: String,
    /// One entry per month column; `None` when the cell is not a number.
    pub prices: Vec<Option<f64>>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FuelPrice {
    pub year: i32,
    pub coastal: Vec<FuelInfo>,
    pub inland: Vec<FuelInfo>,
}

fn sel(css: &str) -> Selector {
    Selector::parse(css).expect("valid selector")
}

fn text(el: ElementRef) -> String {
    el.text().collect::<String>().trim().to_string()
}

/// Parses the current-year coastal and inland tables.
pub fn parse_current(html: &str) -> Result<FuelPrice, String> {
    let doc = Html::parse_document(html);
    let coastal = doc
        .select(&sel("#table_1"))
        .next()
        .ok_or("coastal table (#table_1) not found")?;
    let inland = doc
        .select(&sel("#table_2"))
        .next()
        .ok_or("inland table (#table_2) not found")?;

    Ok(FuelPrice {
        year: get_year(coastal).ok_or("could not determine the table year")?,
        coastal: get_prices(coastal, 1, 6),
        inland: get_prices(inland, 1, 7),
    })
}

/// Parses every past-year accordion section.
pub fn parse_historical(html: &str) -> Vec<FuelPrice> {
    let doc = Html::parse_document(html);
    let (title_sel, content_sel) = (sel(".accordion-title"), sel(".accordion-content"));
    let mut out = Vec::new();

    for item in doc.select(&sel(".tf-accordion .tf-accordion-item")) {
        let (Some(title), Some(content)) = (
            item.select(&title_sel).next(),
            item.select(&content_sel).next(),
        ) else {
            continue;
        };

        let year_text = text(title);
        let Ok(year) = year_text.parse::<i32>() else {
            continue;
        };
        let Some(table) = content.select(&sel(&format!("#tablepress-{year_text}"))).next() else {
            continue;
        };

        out.push(FuelPrice {
            year,
            coastal: get_prices(table, 2, 7),
            inland: if year == 2023 {
                get_prices(table, 10, 16)
            } else {
                get_prices(table, 9, 15)
            },
        });
    }

    out
}

/// Reads the 1-based inclusive body rows `start..=end` of a table.
fn get_prices(table: ElementRef, start: usize, end: usize) -> Vec<FuelInfo> {
    let (row_sel, td_sel) = (sel("tbody tr"), sel("td"));
    let rows: Vec<ElementRef> = table.select(&row_sel).collect();

    (start..=end)
        .filter_map(|i| rows.get(i - 1))
        .filter_map(|row| {
            let mut cells = row.select(&td_sel);
            let name = text(cells.next()?);
            Some(FuelInfo {
                name: name.trim_end_matches(|c: char| c == '*' || c.is_whitespace()).to_string(),
                prices: cells.map(|c| parse_float(&text(c).replace(',', "."))).collect(),
            })
        })
        .collect()
}

fn get_year(table: ElementRef) -> Option<i32> {
    let header = table.select(&sel("thead tr th")).nth(1)?;
    let year = text(header).rsplit('-').next()?.trim().to_string();
    format!("20{year}").parse().ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn table(id: &str, header: &str, rows: &[(&str, &str)]) -> String {
        let body: String = rows
            .iter()
            .map(|(n, p)| format!("<tr><td>{n}</td><td>{p}</td><td>1,5</td></tr>"))
            .collect();
        format!(
            "<table id=\"{id}\"><thead><tr><th>Fuel</th><th>{header}</th><th>x</th></tr></thead><tbody>{body}</tbody></table>"
        )
    }

    #[test]
    fn parses_current_tables() {
        let coastal: Vec<(&str, &str)> = vec![
            ("95 LRP (c/l)", "10"),
            ("95 ULP (c/l) **", "20,5"),
            ("Diesel 0.05% (c/l)", "n/a"),
            ("Diesel 0.005% (c/l)", "1"),
            ("Illuminating Paraffin (c/l)", "2"),
            ("Liquefied Petroleum Gas (c/kg)", "3"),
        ];
        let html = format!(
            "<html><body>{}{}</body></html>",
            table("table_1", "07-Jan-26", &coastal),
            table("table_2", "07-Jan-26", &coastal)
        );
        let parsed = parse_current(&html).unwrap();
        assert_eq!(parsed.year, 2026);
        assert_eq!(parsed.coastal.len(), 6);
        assert_eq!(parsed.coastal[1].name, "95 ULP (c/l)");
        assert_eq!(parsed.coastal[1].prices, vec![Some(20.5), Some(1.5)]);
        assert_eq!(parsed.coastal[2].prices[0], None);
        assert_eq!(parsed.inland.len(), 6);
    }

    #[test]
    fn missing_table_is_an_error() {
        assert!(parse_current("<html></html>").is_err());
    }

    #[test]
    fn parses_historical_accordion() {
        let rows: Vec<(&str, &str)> = (0..16).map(|_| ("Fuel", "5")).collect();
        let html = format!(
            "<div class=\"tf-accordion\"><div class=\"tf-accordion-item\"><div class=\"accordion-title\"> 2022 </div><div class=\"accordion-content\">{}</div></div></div>",
            table("tablepress-2022", "x-22", &rows)
        );
        let parsed = parse_historical(&html);
        assert_eq!(parsed.len(), 1);
        assert_eq!(parsed[0].year, 2022);
        assert_eq!(parsed[0].coastal.len(), 6);
        assert_eq!(parsed[0].inland.len(), 7);
    }
}
