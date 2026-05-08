#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3000}"
export PORT

export USE_LOCAL_JSON_DB="${USE_LOCAL_JSON_DB:-true}"

# Gubi się częsty „default Node”; README i toolchain są ustawione pod Node 20 LTS.
if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  if command -v nvm >/dev/null 2>&1; then
    nvm use 20 >/dev/null 2>&1 || nvm use 22 >/dev/null 2>&1 || true
  fi
fi

major="$(node -p "parseInt(process.versions.node.split('.')[0],10)")"
if (( major < 20 )); then
  echo "UWAGA: masz Node $(node -v); projekt jest ustawiony pod Node 20+ — ustaw np. „nvm use 20” w shellu lub uruchamiaj przez make play." >&2
fi

echo "→ „Starting…” = socket włączony; dopiero „Ready in …” = możesz otworzyć http://localhost:${PORT}" >&2
echo "→ Pierwszy raz na WSL często 1–5 min — nie przerywaj Ctrl+C (wtedy zwykle kod wyjścia 130)." >&2

exec npm run dev -- -p "$PORT"
