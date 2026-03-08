# Workflow: Add New Penalty League

Integrates a new league into the SPT penalty pipeline end-to-end.

## Trigger

`/spt-add-new-league penalties`

## What This Workflow Does

1. Discovers or confirms the Transfermarkt source URL
2. Creates the per-league script
3. Adds the league to the batch runner
4. Creates/verifies Google Sheets tabs
5. Runs a dry-run test
6. Pushes data to Google Sheets (after confirmation)
7. Verifies WordPress TablePress display

---

## Step 1 — Gather League Info (prompt herbert if needed)

Collect the following. Prompt for any that are missing:

| Field | Example | Source |
|-------|---------|--------|
| League name | `Primeira Liga` | User |
| League slug | `primeira-liga` | Derive from name (lowercase, hyphens) |
| Transfermarkt league code | `PT1` | TM URL or user |
| Transfermarkt TLD | `.com`, `.de`, `.co.uk` | Test which works (usually `.com`) |
| Google Sheet ID | `1abc...xyz` | User — must create sheet first if new |
| Expected team count | `18` | User or TM page |

**Confirm TM URL works:**
```bash
curl -s -o /dev/null -w "%{http_code}" \
  "https://www.transfermarkt.com/{league-slug}/elfmeterschuetzen/wettbewerb/{TM_CODE}" \
  -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
```
Should return 200. If not, try alternate TLD or URL slug from the TM website.

**Verify page has player data (not club-only):**
The page must contain `class="extrarow"` rows (club headers) followed by `class="odd"` / `class="even"` rows (players). If it only has 3 rows for the full competition, it's club-level only (like Europa League) — skip.

---

## Step 2 — Create Per-League Script

Create `workflows/scripts/penalties-{slug}.ts`:

```typescript
import { runLeague } from "./penalties-common.ts";

runLeague({
  id: "{slug}",
  name: "{League Name}",
  slug: "{slug}",
  tmUrl: "https://www.transfermarkt.{tld}/{tm-league-slug}/elfmeterschuetzen/wettbewerb/{TM_CODE}",
  sheetId: "{GOOGLE_SHEET_ID}",
  expectedTeams: {N},
}, process.argv.slice(2)).catch(e => { console.error(e.message); process.exit(1); });
```

---

## Step 3 — Add to Batch Runner

In `workflows/scripts/run-penalties.ts`, add to the `LEAGUES` array:

```typescript
{
  id: "{slug}",
  name: "{League Name}",
  slug: "{slug}",
  tmUrl: "https://www.transfermarkt.{tld}/{tm-league-slug}/elfmeterschuetzen/wettbewerb/{TM_CODE}",
  sheetId: "{GOOGLE_SHEET_ID}",
  expectedTeams: {N},
},
```

---

## Step 4 — Google Sheet Setup

The Google Sheet must exist and be shared with the service account (or OAuth user).

The script (`penalties-common.ts`) creates tabs automatically on first write via `createTabs()`. You do NOT need to create tabs manually.

**Tabs created automatically:**
- `{slug}-pen` (moved to index 0)
- `{slug}-pen-clubs`
- `{slug}-pen-players`

**Verify sheet access:**
```bash
bun run workflows/scripts/penalties-{slug}.ts
```
Dry-run should complete without auth errors.

---

## Step 5 — Dry-Run Test

```bash
cd /home/herbert/Projects/setpiecetakers.com
bun run workflows/scripts/run-penalties.ts {slug}
```

Check output in `workflows/output/{slug}/penalties/YYYY-MM-DD-penalties.md`:
- League total row present
- Multiple clubs listed
- Player rows with taken/scored/missed/conv%
- No "0 players" warning

If 0 players scraped, check:
1. Does the TM URL return 200?
2. Does the page have `extrarow` + player rows?
3. Run with debug: add `console.log(html.slice(0, 2000))` to `scrapeTransfermarkt` temporarily

---

## Step 6 — Push to Google Sheets

After dry-run looks good:

```bash
bun run workflows/scripts/run-penalties.ts {slug} --write
```

Confirm:
- Tab `{slug}-pen` is leftmost (index 0) in the sheet
- Tab `{slug}-pen-clubs` has club rows sorted by taken
- Tab `{slug}-pen-players` has player rows sorted by taken

---

## Step 7 — Supabase Upsert (optional — if SPT Supabase integration is live)

If `penalties-common.ts` has a Supabase upsert block, it runs automatically with `--write`.

Manual upsert pattern (if needed):
```typescript
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

await sb.from("stats").upsert(
  players.map(p => ({
    league_id: cfg.slug,
    category_id: "penalties",
    club: p.club,
    player: p.name,
    taken: p.taken,
    scored: p.scored,
    missed: p.missed,
    conversion_rate: p.convRate,
    season: SEASON,
  })),
  { onConflict: "league_id,category_id,player,season" }
);
```

---

## Step 8 — WordPress Verification

TablePress reads the leftmost tab. The `{slug}-pen` tab at index 0 is the feed.

To verify: go to the WordPress admin -> TablePress -> import from Google Sheets URL, or check an existing embed if the sheet is already connected.

---

## Checklist

- [ ] TM URL confirmed (200, has player data)
- [ ] Per-league script created
- [ ] Entry added to `run-penalties.ts` LEAGUES array
- [ ] Dry-run output looks correct
- [ ] `--write` executed, tabs created in Google Sheet
- [ ] `{slug}-pen` is at index 0 (leftmost)
- [ ] README league table updated
- [ ] Supabase upsert verified (if applicable)
- [ ] WordPress TablePress shows new data

---

## Common Issues

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| 0 players scraped | Page is club-level only (like EL) | Move to SKIPPED; find alternative source |
| 403/429 from TM | IP block or rate limit | Retry after delay; try alternate TLD |
| `Tab already exists` error | Sheet has stale tab from old run | `createTabs()` handles this — tab creation is idempotent |
| `Unable to parse range` | Tab name mismatch | Check `sheetsMeta()` output; tab name must match exactly |
| 429 from Sheets API | Too many writes too fast | Increase sleep between leagues; run single league |
