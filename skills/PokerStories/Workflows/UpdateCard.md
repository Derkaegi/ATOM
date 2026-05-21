# PokerStories UpdateCard Workflow

Change the status, word count, or assignee of a single Focalboard card.

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running UpdateCard in PokerStories"}' \
  > /dev/null 2>&1 &
```

## Intent-to-Field Mapping

| User Says | Field | Value |
|-----------|-------|-------|
| "set to outline" / "outline" | `status` | `outline` |
| "set to draft" / "draft" | `status` | `draft` |
| "set to review" / "zur review" | `status` | `review` |
| "revise" / "überarbeiten" | `status` | `revise` |
| "final" / "fertig" / "done" | `status` | `final` |
| "assign to Herbert" | `assignee` | `herbert` |
| "assign to Wladimir" | `assignee` | `wladimir` |
| "N words" / "N Wörter" | `words` | N |
| "add link <URL>" | `url_prop` | URL |

## Chapter Name Resolution

Map user-provided chapter name to card ID using `BoardConfig.md`:

| User Says | Card ID |
|-----------|---------|
| "B2 Ch 4" / "Economy" / "Rakeback" | `cps_ch09_rakeback_00000000000` |
| "B2 Ch 3" / "Platforms" | `cps_ch08_platforms_0000000000` |
| "B2 Ch 1" / "Schools" / "Poker Schools" | `cps_ch06_training_00000000000` |
| "B2 Ch 2" / "Tools" | `cps_ch07_pokertools_000000000` |
| "B2 Ch 5" / "Tournaments" | `cps_ch10_virtualfelt_0000000a` |
| "B2 Exkurs 2a" / "ICM" / "GTO" | `cps_ch7a_icmgto_000000000000a` |
| "B1 Ch 5" / "Black Friday" | `cps_ch05_blackfri_00000000000` |
| etc. | see full table in BoardConfig.md |

If ambiguous, query the board and show matching cards:
```bash
bun ~/.claude/skills/PokerStories/Tools/BoardSync.ts status | grep -i "<SEARCH_TERM>"
```

## Steps

### 1. Identify card and field change from user request

Parse: which card? which field? new value?

### 2. Update via SQLite (for status/words/assignee/band)

```bash
bun ~/.claude/skills/PokerStories/Tools/BoardSync.ts update-card \
  --id <CARD_ID> \
  --status <STATUS>          # optional
  --words <N>                # optional
  --assignee <ASSIGNEE>      # optional
```

The tool writes directly to the VPS SQLite DB using `json_set` on the fields column.

### 3. Update title via REST API (if title changed)

```bash
curl -s -X PATCH \
  -H "Authorization: Bearer $(source ~/.env && echo $FOCALBOARD_TOKEN)" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Content-Type: application/json" \
  "https://boards.pokerstories.wtf/api/v2/boards/b3tk9ri75otfidnartfnass9a8a/blocks/<CARD_ID>" \
  -d '{"title": "<NEW_TITLE>"}'
```

### 4. Confirm

Run `bun BoardSync.ts status` and show the updated card row.

## Token Refresh Check

Before any write, check token freshness:
```bash
source ~/.env && curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $FOCALBOARD_TOKEN" \
  -H "X-Requested-With: XMLHttpRequest" \
  "https://boards.pokerstories.wtf/api/v2/teams"
```
If not 200, run the token refresh procedure from `BoardConfig.md` and update `~/.env`.
