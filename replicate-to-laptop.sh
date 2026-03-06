#!/usr/bin/env bash
# Replicates ATOM setup from this desktop to the laptop.
# Usage: bash replicate-to-laptop.sh [ssh-target]
# Default target: notebook (requires ~/.ssh/config entry)

set -euo pipefail

TARGET="${1:-notebook}"
SRC="$HOME/.claude"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${YELLOW}→${NC} $1"; }

echo "Replicating ATOM setup → $TARGET"
echo ""

# 1. Verify SSH works
info "Verifying SSH connection..."
ssh "$TARGET" 'echo ok' > /dev/null || { echo "SSH failed. Complete SSH setup first (see instructions)."; exit 1; }
ok "SSH connection verified"

# 2. Create target directory on laptop
ssh "$TARGET" 'mkdir -p ~/.claude'

# 3. Top-level config files
info "Syncing CLAUDE.md, settings.json, package.json..."
rsync -az --progress \
  "$SRC/CLAUDE.md" \
  "$SRC/settings.json" \
  "$SRC/package.json" \
  "$SRC/bun.lock" \
  "$TARGET:~/.claude/"
ok "Config files synced"

# 4. Skills (all of them)
info "Syncing skills/ (may take a moment)..."
rsync -az --progress --delete \
  "$SRC/skills/" \
  "$TARGET:~/.claude/skills/"
ok "Skills synced"

# 5. Hooks (including lib/ and handlers/)
info "Syncing hooks/..."
rsync -az --progress --delete \
  "$SRC/hooks/" \
  "$TARGET:~/.claude/hooks/"
ok "Hooks synced"

# 6. Commands (slash commands)
if [[ -d "$SRC/commands" ]]; then
  info "Syncing commands/..."
  rsync -az --progress --delete \
    "$SRC/commands/" \
    "$TARGET:~/.claude/commands/"
  ok "Commands synced"
fi

# 7. Agents
if [[ -d "$SRC/agents" ]]; then
  info "Syncing agents/..."
  rsync -az --progress --delete \
    "$SRC/agents/" \
    "$TARGET:~/.claude/agents/"
  ok "Agents synced"
fi

# 8. Verify ATOM identity on laptop
info "Verifying ATOM identity on laptop..."
NAME=$(ssh "$TARGET" "python3 -c \"import json; d=json.load(open('$HOME/.claude/settings.json')); print(d.get('daidentity',{}).get('name','NOT FOUND'))\"" 2>/dev/null || echo "check failed")
if [[ "$NAME" == "ATOM" ]]; then
  ok "ATOM identity confirmed (daidentity.name = ATOM)"
else
  echo "WARNING: daidentity.name = '$NAME' — check settings.json on laptop"
fi

echo ""
echo "Done. Remaining manual steps on the laptop:"
echo ""
echo "  1. Set up ~/.env with API keys (from Bitwarden)"
echo "     e.g.: ANTHROPIC_API_KEY=sk-..."
echo ""
echo "  2. Add to ~/.zshrc (or ~/.bashrc):"
echo "     source ~/.env"
echo ""
echo "  3. Install bun if not present:"
echo "     curl -fsSL https://bun.sh/install | bash"
echo ""
echo "  4. Install hook dependencies:"
echo "     cd ~/.claude && bun install"
echo ""
echo "  5. Start a new Claude session — ATOM should greet you"
