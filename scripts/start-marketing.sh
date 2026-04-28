#!/usr/bin/env bash
# Start the marketing Next.js dev server, then warm it up so Turbopack
# binds the port quickly enough for the workflow port-detector. We
# background a curl loop that pings localhost:5173 until it responds,
# which forces Turbopack to compile and bind the listening socket.
set -e
cd "$(dirname "$0")/../apps/marketing"

(
  for i in $(seq 1 60); do
    sleep 1
    if curl -sS -o /dev/null --max-time 3 http://localhost:5173/ >/dev/null 2>&1; then
      echo "[start-marketing] Warmup hit succeeded on attempt $i"
      exit 0
    fi
  done
  echo "[start-marketing] Warmup gave up after 60 attempts"
) &

exec ./node_modules/.bin/next dev --port 5173 --turbopack --hostname 0.0.0.0
