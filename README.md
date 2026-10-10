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

Run locally with `celld dev` (needs `esbuild` on `PATH`; serves on `http://127.0.0.1:9876`). The Worker creates its D1 tables on first use from `migrations/0001_init.sql`; on a deployed fleet you can also run `celld d1 migrations apply fuel-prices --bucket "$CELLD_BUCKET"`.

## Deploying

`celld deploy` needs `esbuild` and an S3-compatible bucket (for example Cloudflare R2). CI deploys on pushes to `main` using these repository secrets: `CELLD_BUCKET` (e.g. `s3://my-bucket`), `CELLD_S3_ENDPOINT`, `CELLD_AWS_ACCESS_KEY_ID`, `CELLD_AWS_SECRET_ACCESS_KEY`.

The D1 `database_id` in `wrangler.jsonc` is just a stable identity on celld; keep it unchanged once data exists. For Cloudflare proper, replace it with the id from `wrangler d1 create fuel-prices`.

The cron schedule (`triggers.crons`) is `0 0 1-15 * FRI`: celld and Cloudflare number weekdays from Sunday = 1, so a name is used instead of `5`.
