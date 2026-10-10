FROM rust:1-bookworm AS build
RUN rustup target add wasm32-unknown-unknown && cargo install worker-build
WORKDIR /app
COPY . .
RUN worker-build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates nodejs npm \
    && npm install -g esbuild && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://celld.dev/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"
WORKDIR /app
COPY --from=build /app/build ./build
COPY wrangler.jsonc ./
COPY migrations ./migrations
COPY docker-entrypoint.sh /usr/local/bin/
EXPOSE 8080
ENTRYPOINT ["docker-entrypoint.sh"]
