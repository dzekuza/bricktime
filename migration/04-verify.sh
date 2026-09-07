#!/usr/bin/env bash
# Runs 04-verify.sql against both projects and diffs the results.
# Read-only against both.
set -euo pipefail
cd "$(dirname "$0")"
source ./_lib.sh

require_env SOURCE_DB_URL TARGET_DB_URL >/dev/null || exit 1
mkdir -p "$DUMP_DIR"

src="$DUMP_DIR/verify-source.txt"
tgt="$DUMP_DIR/verify-target.txt"

hr "COLLECTING"
psql "$SOURCE_DB_URL" -X -q -f ./04-verify.sql > "$src"
ok "source snapshot ($(wc -l < "$src" | tr -d ' ') lines)"
psql "$TARGET_DB_URL" -X -q -f ./04-verify.sql > "$tgt"
ok "target snapshot ($(wc -l < "$tgt" | tr -d ' ') lines)"

hr "DIFF"
if diff -u "$src" "$tgt" > "$DUMP_DIR/verify.diff"; then
  ok "PARITY OK — source and target are identical on every checked dimension."
  exit 0
fi

bad "differences found:"
echo
diff -u "$src" "$tgt" | sed -n '1,120p'
echo
warn "full diff: $DUMP_DIR/verify.diff"
echo
echo "  Expected-to-differ lines you can ignore:"
echo "    · nothing. This script is built to produce identical output on a"
echo "      correct migration. Every diff line is a real discrepancy."
exit 1
