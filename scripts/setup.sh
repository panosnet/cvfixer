#!/usr/bin/env bash
set -euo pipefail

# CV Fixer — developer setup script
# Usage: curl -fsSL https://raw.githubusercontent.com/panosnet/cvfixer/main/scripts/setup.sh | bash
# Or locally: bash scripts/setup.sh

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

log()  { echo -e "${BOLD}${CYAN}▶ $*${RESET}"; }
ok()   { echo -e "${GREEN}✓ $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠ $*${RESET}"; }
die()  { echo -e "${RED}✗ $*${RESET}"; exit 1; }

echo ""
echo -e "${BOLD}CV Fixer — Setup${RESET}"
echo "─────────────────────────────"

# ── Node.js ────────────────────────────────────────────────────────────────────
log "Checking Node.js..."
if ! command -v node &>/dev/null; then
  die "Node.js not found. Install from https://nodejs.org (version 20+) then re-run this script."
fi
NODE_VER=$(node -e "process.exit(parseInt(process.version.slice(1)) < 20 ? 1 : 0)" 2>/dev/null && node --version || echo "old")
if [[ "$NODE_VER" == "old" ]]; then
  die "Node.js 20+ required. Current: $(node --version). Update at https://nodejs.org"
fi
ok "Node.js $(node --version)"

# ── npm install ────────────────────────────────────────────────────────────────
log "Installing dependencies..."
npm install
ok "Dependencies installed"

# ── Ollama (optional) ─────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Ollama (optional — for free local AI)${RESET}"
if command -v ollama &>/dev/null; then
  ok "Ollama already installed: $(ollama --version 2>/dev/null || echo 'found')"
else
  warn "Ollama not found."
  echo "  Install from: https://ollama.ai"
  echo "  Or run: curl -fsSL https://ollama.ai/install.sh | sh"
  echo "  (You can also use a paid API — Anthropic, OpenAI, or Google)"
fi

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}Ready!${RESET}"
echo ""
echo -e "  Start the app:  ${BOLD}npm run dev${RESET}"
echo ""
echo "  First time? The app will guide you to:"
echo "   1. Select an AI model (Ollama or paste an API key)"
echo "   2. Upload your CV (PDF, DOCX, or paste text)"
echo "   3. Add a job description (optional, improves results)"
echo "   4. Click Analyze & Rewrite"
echo ""
