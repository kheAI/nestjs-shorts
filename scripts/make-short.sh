#!/bin/bash
# One command from script to upload-ready MP4: validate -> voice -> envelope -> render -> check -> copy.
# Usage: scripts/make-short.sh <short-id> [path-to-env-file-with-GEMINI_API_KEY]
# Voice step is skipped if public/audio/<id>/ already has every scene (re-voice with scripts/narrate.mjs --match).
set -euo pipefail
cd "$(dirname "$0")/.."
ID="${1:?usage: scripts/make-short.sh <short-id> [env-file]}"
ENV_FILE="${2:-$HOME/dev/intelligence-platform-backend/.env}"

node scripts/validate-shorts.mjs "$ID"

SCENES=$(node -e "console.log(require('./data/wetel-shorts.json').find(s=>s.id==='$ID').scenes.length)")
HAVE=$(find public/audio/"$ID" -name "*.mp3" 2>/dev/null | wc -l | tr -d ' ' || true)
if [ "$HAVE" != "$SCENES" ]; then
  KEY="$(grep '^GEMINI_API_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')"
  [ -n "$KEY" ] || { echo "GEMINI_API_KEY not found in $ENV_FILE"; exit 1; }
  GEMINI_API_KEY="$KEY" node scripts/narrate.mjs "$ID"
fi
node scripts/envelope.mjs

mkdir -p out/rendered out/ready-to-upload
caffeinate -i npx remotion render src/index.ts "$ID" "out/rendered/$ID.mp4" --concurrency=2 | tail -1
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/rendered/$ID.mp4")
SIZE=$(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "out/rendered/$ID.mp4")
echo "rendered ${DUR}s ${SIZE}"
awk -v d="$DUR" 'BEGIN{ if (d>180) { print "ERROR: over 180 s"; exit 1 } }'
cp "out/rendered/$ID.mp4" out/ready-to-upload/
echo "ready: out/ready-to-upload/$ID.mp4  (now write metadata/$ID.md and watch it once with sound)"
