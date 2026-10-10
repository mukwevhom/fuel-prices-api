FROM rust:1-bookworm AS build
RUN rustup target add wasm32-unknown-unknown && cargo install worker-build --version 0.8.7 --locked
WORKDIR /app
COPY . .
RUN worker-build --release --locked

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl nodejs npm \
    && rm -rf /var/lib/apt/lists/*
COPY scripts/install-tools.sh /tmp/install-tools.sh
RUN INSTALL_DIR=/usr/local/bin /tmp/install-tools.sh && rm /tmp/install-tools.sh
WORKDIR /app
COPY --from=build /app/build ./build
COPY wrangler.jsonc ./
COPY migrations ./migrations
COPY docker-entrypoint.sh /usr/local/bin/
EXPOSE 8080
ENTRYPOINT ["docker-entrypoint.sh"]
