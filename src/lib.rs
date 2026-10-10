mod constants;
mod db;
mod helpers;
mod scraper;

use serde_json::{json, Value};
use worker::*;

use db::Region;
use helpers::{compare_prices, offset_month};

const SCHEMA: &str = include_str!("../migrations/0001_init.sql");

thread_local! {
    static SCHEMA_READY: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
}

/// Applies the idempotent schema once per isolate so a fresh database works without a manual migration.
async fn ensure_schema(env: &Env) -> Result<()> {
    if SCHEMA_READY.with(|r| r.get()) {
        return Ok(());
    }
    let db = env.d1("DB")?;
    let statements = SCHEMA
        .split(';')
        .map(str::trim)
        .filter(|sql| !sql.is_empty())
        .map(|sql| db.prepare(sql))
        .collect::<Vec<_>>();
    db.batch(statements).await?;
    SCHEMA_READY.with(|r| r.set(true));
    Ok(())
}

fn current_year_month() -> (i32, i32) {
    let now = js_sys::Date::new_0();
    (now.get_full_year() as i32, now.get_month() as i32 + 1)
}

async fn fetch_html() -> Result<String> {
    let url = Url::parse(scraper::SOURCE_URL)?;
    let mut res = Fetch::Url(url).send().await?;
    if !res.status_code().to_string().starts_with('2') {
        return Err(Error::RustError(format!("source returned {}", res.status_code())));
    }
    res.text().await
}

async fn scrape_current(env: &Env) -> Result<()> {
    let db = env.d1("DB")?;
    let prices = scraper::parse_current(&fetch_html().await?).map_err(Error::RustError)?;
    db::store_scrape(&db, Region::Coastal, &prices).await?;
    db::store_scrape(&db, Region::Inland, &prices).await?;
    Ok(())
}

async fn scrape_past(env: &Env) -> Result<()> {
    let db = env.d1("DB")?;
    for prices in scraper::parse_historical(&fetch_html().await?) {
        db::store_scrape(&db, Region::Coastal, &prices).await?;
        db::store_scrape(&db, Region::Inland, &prices).await?;
    }
    Ok(())
}

async fn index(env: &Env) -> Result<Response> {
    let db = env.d1("DB")?;
    let coastal = db::select_all(&db, Region::Coastal).await?;
    let inland = db::select_all(&db, Region::Inland).await?;
    Response::from_json(&json!({
        "msg": "fuel prices",
        "coastalResults": coastal,
        "inlandResults": inland,
    }))
}

async fn prices(req: &Request, env: &Env) -> Result<Response> {
    let db = env.d1("DB")?;
    let compare = req
        .url()?
        .query_pairs()
        .find(|(k, _)| k == "compare")
        .map(|(_, v)| v.into_owned())
        .filter(|v| !v.is_empty());

    let (year, month) = current_year_month();
    let mut curr_month = offset_month(year, month, 0);
    let mut curr = db::select_months(&db, Region::Inland, &[&curr_month]).await?;

    // The current month isn't published yet, so fall back to the previous one.
    let mut base = month;
    if curr.is_empty() {
        base = month - 1;
        curr_month = offset_month(year, base, 0);
        curr = db::select_months(&db, Region::Inland, &[&curr_month]).await?;
    }

    let mut prices: Option<Value> = None;
    let mut changes: Option<Vec<helpers::PriceChange>> = None;

    match compare.as_deref() {
        None => prices = curr.first().cloned(),
        Some("latest") => {
            prices = curr.first().cloned();
            let prev_month = offset_month(year, base, -1);
            let rows = db::select_months(&db, Region::Inland, &[&prev_month, &curr_month]).await?;
            if let [prev, curr] = rows.as_slice() {
                changes = Some(compare_prices(prev, curr));
            }
        }
        Some(_) => {}
    }

    let mut body = json!({ "msg": "prices" });
    if let Some(p) = prices {
        body["prices"] = p;
    }
    if let Some(c) = changes {
        body["priceChanges"] = json!(c);
    }
    Response::from_json(&body)
}

fn failure(err: Error) -> Result<Response> {
    console_error!("{err}");
    Response::from_json(&json!({ "msg": "internal error" })).map(|r| r.with_status(500))
}

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    if let Err(err) = ensure_schema(&env).await {
        return failure(err);
    }
    let result = match (req.method(), req.path().as_str()) {
        (Method::Get, "/") => index(&env).await,
        (Method::Get, "/prices") => prices(&req, &env).await,
        (Method::Get, "/scrap") => scrape_current(&env)
            .await
            .and_then(|_| Response::from_json(&json!({ "msg": "scraping successful" }))),
        (Method::Get, "/scrap-past") => scrape_past(&env)
            .await
            .and_then(|_| Response::from_json(&json!({ "msg": "scraping successful" }))),
        _ => return Response::error("Not Found", 404),
    };
    result.or_else(failure)
}

#[event(scheduled)]
async fn scheduled(_event: ScheduledEvent, env: Env, _ctx: ScheduleContext) {
    let outcome = match ensure_schema(&env).await {
        Ok(()) => scrape_current(&env).await,
        Err(e) => Err(e),
    };
    if let Err(err) = outcome {
        console_error!("scheduled scrape failed: {err}");
    }
}
