#!/usr/bin/env bash
# Smoke-check the production marketing deployment at https://aivolearning.com.
#
# Asserts:
#   1. The root URL returns HTTP 200.
#   2. The response body contains all four "Friendly Universe" marker strings:
#        - "Learning adventures" (hero headline)
#        - "COPPA", "FERPA", "SOC 2" (footer trust lock box)
#
# Exits non-zero on the first failed assertion so post-deploy hooks /
# CI surface the regression loudly.
#
# Usage:
#   scripts/verify-marketing-deploy.sh                      # checks aivolearning.com
#   MARKETING_URL=https://staging.example.com \
#     scripts/verify-marketing-deploy.sh                    # override target
#
# Env:
#   MARKETING_URL  Target URL (default: https://aivolearning.com/)
#   CURL_TIMEOUT   Per-request timeout in seconds (default: 20)
#   CURL_RETRIES   Retries on transient failures (default: 3)

set -euo pipefail

URL="${MARKETING_URL:-https://aivolearning.com/}"
TIMEOUT="${CURL_TIMEOUT:-20}"
RETRIES="${CURL_RETRIES:-3}"

MARKERS=(
  "Learning adventures"
  "COPPA"
  "FERPA"
  "SOC 2"
)

echo "=== verify-marketing-deploy: GET ${URL} ==="

tmp_body="$(mktemp)"
tmp_headers="$(mktemp)"
trap 'rm -f "$tmp_body" "$tmp_headers"' EXIT

# Capture the HTTP status separately via --write-out so we can give a useful
# error message on non-200 responses (instead of relying on --fail, which
# would discard the body). --retry handles transient network blips.
http_code="$(
  curl --silent \
       --show-error \
       --location \
       --max-time "$TIMEOUT" \
       --retry "$RETRIES" \
       --retry-all-errors \
       --retry-delay 2 \
       --user-agent "aivo-marketing-smoke/1.0" \
       --output "$tmp_body" \
       --dump-header "$tmp_headers" \
       --write-out "%{http_code}" \
       "$URL"
)" || {
  echo "FAIL: curl could not reach ${URL}"
  echo "----- response headers (if any) -----"
  cat "$tmp_headers" || true
  exit 1
}

if [[ "$http_code" != "200" ]]; then
  echo "FAIL: expected HTTP 200, got ${http_code}"
  echo "----- response headers -----"
  cat "$tmp_headers"
  exit 1
fi
echo "OK: HTTP 200"

missing=()
for marker in "${MARKERS[@]}"; do
  if grep -qiF -- "$marker" "$tmp_body"; then
    echo "OK: found marker \"${marker}\""
  else
    echo "FAIL: missing marker \"${marker}\""
    missing+=("$marker")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo
  echo "=== verify-marketing-deploy: FAILED (${#missing[@]} marker(s) missing) ==="
  echo "Missing: ${missing[*]}"
  echo "Likely causes:"
  echo "  - Custom domain re-pointed away from the Replit autoscale deployment"
  echo "  - Build served a blank/old shell"
  echo "  - Friendly Universe redesign was modified and dropped a marker"
  echo "Inspect: curl -sI ${URL} ; check Deployments → Custom Domains in Replit"
  exit 1
fi

echo
echo "=== verify-marketing-deploy: PASS — all ${#MARKERS[@]} markers present ==="
