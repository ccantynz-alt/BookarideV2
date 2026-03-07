#!/usr/bin/env bash
# =============================================================================
# sync-env-to-v2.sh
#
# Copies shared environment variables from BookARide V1's .env file into
# BookARide V2's GitHub repository secrets, so both apps stay in sync.
#
# Usage:
#   ./scripts/sync-env-to-v2.sh /path/to/BookARide/.env
#
# Requirements:
#   - GitHub CLI (gh) installed and authenticated
#   - gh auth login  (if not already done)
#
# What gets synced (V1 name → V2 name):
#   Identical names: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
#                    MAILGUN_API_KEY, MAILGUN_DOMAIN,
#                    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER,
#                    GOOGLE_MAPS_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
#
# V2-only vars (not touched by this script):
#   DATABASE_URL, JWT_SECRET_KEY, GEOAPIFY_API_KEY
# =============================================================================

set -euo pipefail

V2_REPO="ccantynz-alt/BookarideV2"

# ── Shared vars to copy (V1 name = V2 name) ──────────────────────────────────
SHARED_VARS=(
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  MAILGUN_API_KEY
  MAILGUN_DOMAIN
  TWILIO_ACCOUNT_SID
  TWILIO_AUTH_TOKEN
  TWILIO_PHONE_NUMBER
  GOOGLE_MAPS_API_KEY
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  GOOGLE_CALENDAR_ID
  PUBLIC_DOMAIN
)

# ── Validate input ────────────────────────────────────────────────────────────
ENV_FILE="${1:-}"
if [[ -z "$ENV_FILE" ]]; then
  echo "Usage: $0 /path/to/BookARide/.env"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env file not found at: $ENV_FILE"
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "Error: GitHub CLI (gh) is not installed."
  echo "Install it from: https://cli.github.com"
  exit 1
fi

echo "Reading from: $ENV_FILE"
echo "Syncing to:   $V2_REPO"
echo ""

# ── Parse .env file into associative array ────────────────────────────────────
declare -A env_values

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip comments and blank lines
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue

  # Split on first =
  key="${line%%=*}"
  value="${line#*=}"

  # Strip surrounding quotes from value
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  key="${key// /}"  # trim whitespace from key
  env_values["$key"]="$value"
done < "$ENV_FILE"

# ── Sync each shared var ──────────────────────────────────────────────────────
synced=0
skipped=0

for var in "${SHARED_VARS[@]}"; do
  if [[ -n "${env_values[$var]+_}" ]]; then
    val="${env_values[$var]}"
    if [[ -z "$val" ]]; then
      echo "  SKIP  $var  (empty in V1)"
      ((skipped++))
      continue
    fi
    echo -n "  SET   $var ... "
    echo -n "$val" | gh secret set "$var" --repo "$V2_REPO"
    echo "done"
    ((synced++))
  else
    echo "  SKIP  $var  (not found in V1 .env)"
    ((skipped++))
  fi
done

echo ""
echo "Done. Synced: $synced  Skipped: $skipped"
echo ""
echo "Note: DATABASE_URL, JWT_SECRET_KEY, and GEOAPIFY_API_KEY are V2-only"
echo "      and must be set separately in V2's GitHub secrets."
