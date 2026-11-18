#!/bin/sh
# Installs dependencies (only when package-lock.json changed) and runs the build.
# Arguments are passed to electron-builder, e.g. `--arm64` or `--linux deb`.
set -e

LOCK_HASH=$(sha256sum package-lock.json | cut -d' ' -f1)
STAMP=node_modules/.antares-lock-hash

if [ ! -f "$STAMP" ] || [ "$(cat "$STAMP")" != "$LOCK_HASH" ]; then
   echo "Installing dependencies..."
   npm ci
   echo "$LOCK_HASH" > "$STAMP"
fi

if [ $# -eq 0 ]; then
   set -- --linux
fi

npm run build -- "$@"
