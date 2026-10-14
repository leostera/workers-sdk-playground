#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
SDK_DIR="${WORKERS_SDK_DIR:-$PWD/.workers-sdk}"

if ! git -C "$SDK_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git clone --depth 1 --filter=blob:none \
    --branch lostera/artifacts-devtools-integration \
    https://github.com/leostera/workers-sdk.git "$SDK_DIR"
fi

printf 'Testing workers-sdk %s\n' "$(git -C "$SDK_DIR" rev-parse HEAD)"
pnpm --dir "$SDK_DIR" install --frozen-lockfile
pnpm --dir "$SDK_DIR" exec turbo build --filter=miniflare
WORKERS_SDK_DIR="$SDK_DIR" node --test test/artifacts.test.mjs
