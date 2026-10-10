# Fuel Price API

Fuel Price API is an API for fuel prices in South Africa. The source is [FIASA](https://fuelsindustry.org.za/consumer-information/fuel-prices-current-past/).

It is a Rust [Cloudflare Worker](https://developers.cloudflare.com/workers/languages/rust/) (workers-rs) that stores prices in D1 and runs on [celld](https://celld.dev) (or Cloudflare). A Cron Trigger scrapes the latest prices.

## Endpoints

| Route | Description |
| --- | --- |
| `GET /` | All stored coastal and inland prices |
| `GET /prices` | Current inland prices; `?compare=latest` adds price changes |
| `GET /scrap` | Scrape current-year prices into the database |
| `GET /scrap-past` | Scrape historical prices into the database |

## Developing

```bash
rustup target add wasm32-unknown-unknown
cargo install worker-build

cargo test                 # unit tests (native)
worker-build --release     # builds build/worker/shim.mjs + wasm
```

Apply the schema in `migrations/` (`celld d1 migrations apply`, or `wrangler d1 migrations apply fuel-prices`), then run with `celld` (see its docs) using `wrangler.jsonc`, and deploy with `celld deploy`. Set the real D1 `database_id` in `wrangler.jsonc`.

The cron schedule (`triggers.crons`) is `0 0 1-15 * FRI`: celld and Cloudflare number weekdays from Sunday = 1, so a name is used instead of `5`.
