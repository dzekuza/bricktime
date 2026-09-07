#!/usr/bin/env bash
# Shared helpers + env loading for the migration scripts.

ENV_FILE="${ENV_FILE:-.env.migration}"
if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
fi

DUMP_DIR="${DUMP_DIR:-./dump}"

ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
hr()   { printf '\n\033[1m── %s ─────────────────────────────────────\033[0m\n' "${1:-}"; }

have() { command -v "$1" >/dev/null 2>&1; }

require_env() {
  local missing=0 v
  for v in "$@"; do
    if [ -z "${!v:-}" ]; then bad "$v is not set in $ENV_FILE"; missing=1; else ok "$v set"; fi
  done
  return $missing
}

# Refuse to keep going on a destructive step without an explicit yes.
confirm() {
  local prompt="$1"
  if [ "${ASSUME_YES:-0}" = "1" ]; then return 0; fi
  printf '\n\033[33m%s\033[0m\n' "$prompt"
  read -r -p "Type 'yes' to continue: " reply
  [ "$reply" = "yes" ] || { bad "aborted"; exit 1; }
}
