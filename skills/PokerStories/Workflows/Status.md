# PokerStories Status Workflow

Show the current state of the Book Pipeline board — word counts, status breakdown, and progress against targets.

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running Status in PokerStories"}' \
  > /dev/null 2>&1 &
```

## Steps

### 1. Load config

Read `~/.claude/skills/PokerStories/BoardConfig.md` for board ID and token.

Get token:
```bash
source ~/.env && echo $FOCALBOARD_TOKEN
```
If empty, run the token refresh procedure from BoardConfig.md.

### 2. Query board

```bash
bun ~/.claude/skills/PokerStories/Tools/BoardSync.ts status
```

This outputs:
- All cards grouped by Band (B1 / B2)
- Per card: chapter ID, title, status, word count
- Band totals vs. targets
- Any chapters below target word count (flagged)

### 3. Format output

Present as a clean table. Flag:
- `outline` status cards that have words > 0 (should be promoted to draft)
- Any card with `words: 0` other than scaffolds
- Chapters significantly below target (< 80% of target)

### 4. Optional: compare with MONAD

If the user asks "is the board up to date?", count words in MONAD files:
```bash
wc -w ~/Documents/MONAD/02-PROJECTS/PokerStories-Series/Band-1-Golden-Age/02-Chapters/*.md
wc -w ~/Documents/MONAD/02-PROJECTS/PokerStories-Series/Band-2-Deep-Dive/02-Chapters/*.md
```
Compare with board values. Surface any drift > 500 words.
