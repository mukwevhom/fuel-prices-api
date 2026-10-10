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

### Cloudflare

CI (`deploy-cloudflare`, on pushes to `main`) uses `wrangler.cloudflare.jsonc`. One-time setup: `wrangler d1 create fuel-prices`, then add repository secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_D1_ID` (the created database id). The Worker creates its tables on first request.

### Coolify (self-hosted, celld)

Create a Coolify application from this repo with the **Dockerfile** build pack and port `8080`. The container installs celld, deploys the Worker, then serves it. Set these environment variables in Coolify: `CELLD_BUCKET` (e.g. `s3://my-bucket`), `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optionally `S3_ENDPOINT` (R2/MinIO) and `AWS_REGION`. celld keeps all state in that bucket, so the container itself is stateless. Coolify's git webhook redeploys on push, so CI does not deploy to it.

`wrangler.jsonc` is the celld config (celld rejects unknown keys); the D1 `database_id` there is just a stable identity, so keep it unchanged once data exists.

The cron schedule (`triggers.crons`) is `0 0 1-15 * FRI`: celld and Cloudflare number weekdays from Sunday = 1, so a name is used instead of `5`.
