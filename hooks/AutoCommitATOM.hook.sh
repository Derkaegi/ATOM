#!/bin/bash
# AutoCommitATOM — Daily auto-commit of ~/.claude/ changes to ATOM repo
# Designed to run via cron: 0 23 * * * ~/.claude/hooks/AutoCommitATOM.hook.sh
#
# Commits only if there are changes. Never pushes secrets (gitignore handles that).

REPO="$HOME/.claude"
cd "$REPO" || exit 1

# Check if there are any changes
if git diff --quiet HEAD 2>/dev/null && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  exit 0  # Nothing to commit
fi

DATE=$(date '+%Y-%m-%d %H:%M')
git add -A
git commit -m "Auto-sync: $DATE

Daily ATOM config checkpoint.

Co-Authored-By: ATOM <noreply@anthropic.com>"

git push origin main 2>&1
