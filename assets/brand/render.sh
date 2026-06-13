#!/usr/bin/env bash
# Render an SVG to an exact-size PNG with headless Chrome.
# usage: render.sh <input.svg> <output.png> <width> <height>
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SVG="$1"; OUT="$2"; W="$3"; H="$4"
DIR="$(cd "$(dirname "$OUT")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Wrap the SVG inline in a zero-margin HTML page sized exactly W x H.
SVG_CONTENT="$(cat "$SVG")"
cat > "$TMP/page.html" <<HTML
<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0}svg{display:block;width:${W}px;height:${H}px}</style>
</head><body>${SVG_CONTENT}</body></html>
HTML

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor="${SCALE:-2}" \
  --default-background-color=00000000 \
  --window-size="${W},${H}" \
  --screenshot="$TMP/shot.png" \
  "file://$TMP/page.html" >/dev/null 2>&1

# scale-factor=2 yields a 2x png; keep it as the high-res master.
cp "$TMP/shot.png" "$OUT"
echo "rendered $OUT ($(node -e "const s=require('fs').statSync('$OUT');console.log(s.size+' bytes')"))"
