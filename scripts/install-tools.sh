#!/bin/sh
# Installs celld from a pinned release, verifying its SHA-256 before it is made executable.
# esbuild and worker-build are pinned to exact versions (npm and crates.io verify their own integrity).
set -eu

CELLD_VERSION=v0.6.2
ESBUILD_VERSION=0.28.2
WORKER_BUILD_VERSION=0.8.7
CELLD_SHA256_X86_64=ce0ee3552cc8d55dde3998dc3b1b0c8f547bbcb4bc803d2a94842368b047646c
CELLD_SHA256_AARCH64=4eca87c6797590000a344c1b768364e9696e8817f5fbc16193f459d2edac7cd0

install_dir="${INSTALL_DIR:-$HOME/.local/bin}"

case "$(uname -m)" in
  x86_64|amd64) target=x86_64-unknown-linux-gnu; expected=$CELLD_SHA256_X86_64 ;;
  aarch64|arm64) target=aarch64-unknown-linux-gnu; expected=$CELLD_SHA256_AARCH64 ;;
  *) echo "unsupported architecture $(uname -m)" >&2; exit 1 ;;
esac

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
curl --proto '=https' --tlsv1.2 -fsSL -o "$tmp/celld.gz" \
  "https://github.com/denoland/celld/releases/download/$CELLD_VERSION/celld-$target.gz"
echo "$expected  $tmp/celld.gz" | sha256sum -c -
mkdir -p "$install_dir"
gzip -dc "$tmp/celld.gz" > "$install_dir/celld"
chmod 755 "$install_dir/celld"

npm install -g --ignore-scripts "esbuild@$ESBUILD_VERSION"
