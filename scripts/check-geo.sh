#!/usr/bin/env bash
# Post-deploy GEO regression check: asserts that the pages AI assistants need are
# reachable for their crawlers and that the vehicle schema still carries the
# lease-takeover facts. Run against production (default) or any deployment:
#
#   ./scripts/check-geo.sh                     # https://www.buyauto.ch
#   ./scripts/check-geo.sh https://preview-url
#
# Exits non-zero if any check fails, so it can gate a deploy pipeline.

set -u

BASE_URL="${1:-https://www.buyauto.ch}"
BASE_URL="${BASE_URL%/}"

GPTBOT_UA="Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot"
CLAUDEBOT_UA="Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"

PASS=0
FAIL=0

ok()   { PASS=$((PASS + 1)); printf 'PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL + 1)); printf 'FAIL  %s\n' "$1"; }

status_for() { # url, user-agent
  curl -sS -o /dev/null -w '%{http_code}' -A "$2" --max-time 30 -L "$1" 2>/dev/null || echo "000"
}

check_status() { # path, label
  local url="${BASE_URL}$1"
  for bot in GPTBot ClaudeBot; do
    local ua="$GPTBOT_UA"
    [ "$bot" = "ClaudeBot" ] && ua="$CLAUDEBOT_UA"
    local code
    code=$(status_for "$url" "$ua")
    if [ "$code" = "200" ]; then
      ok "$2 as $bot → 200"
    else
      bad "$2 as $bot → $code (expected 200): $url"
    fi
  done
}

echo "== BuyAuto GEO check against ${BASE_URL} =="
echo

# A live listing URL, discovered from the sitemap so the check never pins an
# expired listing.
SITEMAP=$(curl -sS -A "$GPTBOT_UA" --max-time 30 "${BASE_URL}/sitemap.xml" 2>/dev/null || true)
LISTING_URLS=$(printf '%s' "$SITEMAP" | grep -o "${BASE_URL}/fahrzeug/[^<]*" | head -10)
FIRST_LISTING=$(printf '%s\n' "$LISTING_URLS" | head -1)

check_status "" "home"
check_status "/suche" "/suche"
check_status "/robots.txt" "robots.txt"
check_status "/llms.txt" "llms.txt"
check_status "/sitemap.xml" "sitemap.xml"

if [ -n "$FIRST_LISTING" ]; then
  check_status "${FIRST_LISTING#"$BASE_URL"}" "listing ${FIRST_LISTING#"$BASE_URL"}"
else
  bad "no /fahrzeug/ URL found in sitemap.xml — cannot check a listing page"
fi

# robots.txt must name the AI crawlers explicitly.
ROBOTS=$(curl -sS -A "$GPTBOT_UA" --max-time 30 "${BASE_URL}/robots.txt" 2>/dev/null || true)
for bot in GPTBot OAI-SearchBot ClaudeBot PerplexityBot Google-Extended; do
  if printf '%s' "$ROBOTS" | grep -q "User-agent: ${bot}"; then
    ok "robots.txt names ${bot}"
  else
    bad "robots.txt does not name ${bot}"
  fi
done

# llms.txt must come back as plain text, not an HTML fallback page.
LLMS_TYPE=$(curl -sS -o /dev/null -w '%{content_type}' -A "$CLAUDEBOT_UA" --max-time 30 "${BASE_URL}/llms.txt" 2>/dev/null || true)
case "$LLMS_TYPE" in
  text/plain*) ok "llms.txt content-type is text/plain" ;;
  *) bad "llms.txt content-type is '${LLMS_TYPE}' (expected text/plain)" ;;
esac

# Listing pages must ship JSON-LD, and at least one live lease takeover must carry
# offers.leaseLength — the property that tells an AI this is a transfer with N
# months remaining.
if [ -n "$FIRST_LISTING" ]; then
  FIRST_HTML=$(curl -sS -A "$GPTBOT_UA" --max-time 30 -L "$FIRST_LISTING" 2>/dev/null || true)
  if printf '%s' "$FIRST_HTML" | grep -q 'application/ld+json'; then
    ok "listing page carries application/ld+json"
  else
    bad "listing page has no application/ld+json: $FIRST_LISTING"
  fi

  FOUND_LEASE=""
  for url in $LISTING_URLS; do
    HTML=$(curl -sS -A "$GPTBOT_UA" --max-time 30 -L "$url" 2>/dev/null || true)
    if printf '%s' "$HTML" | grep -q 'leaseLength'; then
      FOUND_LEASE="$url"
      break
    fi
  done
  if [ -n "$FOUND_LEASE" ]; then
    ok "leaseLength present in listing schema (${FOUND_LEASE#"$BASE_URL"})"
  else
    bad "no leaseLength found in the first $(printf '%s\n' "$LISTING_URLS" | wc -l | tr -d ' ') sitemap listings — lease-takeover schema missing or no takeover inventory live"
  fi
fi

echo
echo "== Summary: ${PASS} passed, ${FAIL} failed =="
[ "$FAIL" -eq 0 ]
