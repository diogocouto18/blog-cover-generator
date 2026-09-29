#!/usr/bin/env bash
# Packs the project, installs the tarball into an empty directory and runs the
# installed CLI end to end (needs the Chromium build; run `npm run install-browser` first).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

TARBALL="$(cd "$ROOT" && npm pack --pack-destination "$WORK" --silent | tail -n 1)"
mkdir "$WORK/consumer"
cd "$WORK/consumer"
npm init -y >/dev/null
npm install --no-audit --no-fund "$WORK/$TARBALL"

BIN=./node_modules/.bin/blog-cover-generator
"$BIN" --version
"$BIN" --help | grep -q "Usage:"
"$BIN" --list-icons | grep -qx "server"
"$BIN" smoke-post server ./out --width 640 --height 360
file_type="$(head -c 4 out/smoke-post.png | tail -c 3)"
[ "$file_type" = "PNG" ] || { echo "Output is not a PNG" >&2; exit 1; }
echo "Smoke test passed: $(wc -c < out/smoke-post.png) bytes"
