# SetPieceTakers Data Pipeline Overhaul

## Context
The current pipeline has three pain points:
1. **Penalties scraped from Transfermarkt** — fragile HTML scraping, silent failures, requires manual CSV→Sheets push
2. **No data verification** — wrong team names and player counts reach the website without any cross-check
3. **No dedicated agent** — no reusable context for future maintenance

The friend's scraper ALREADY provides penalty feed tabs in separate Google Sheets (like corners/freekicks).
The user wants: (a) penalties read from that feed tab, (b) Perplexity MCP as a safeguard cross-check before writes, (c) bulletproof team name handling, (d) a dedicated SetPieceTakers sub-agent.

---

## 1. New Script: `penalties-sheets.ts`

**Mirrors `corners-sheets.ts` pattern exactly.** Replaces `update-sheets.ts` + `penalties_playwright.ts` workflow.

### Input: Penalty feed tab format
The feed tab in the existing penalty spreadsheets (already have sheet IDs in LEAGUE_CONFIG) has a **2nd tab** with columns:
- Col A: Team name (raw)
- Col B: Player name
- Col C: Penalties Taken
- Col D: Penalties Scored
- Col E: Penalties Missed
- (Conversion rate calculated on the fly)
- Last rows: Export Date / Latest Game Date / Latest Game metadata

### Processing
1. Read feed tab (tab index 1 = second tab) from existing penalty sheet IDs
2. Skip header row, stop at metadata rows
3. Apply `normalizeClub()` to team name
4. Aggregate by canonical team name (merge duplicates)
5. Validate: team count vs `expectedTeams`, all names canonical
6. **BLOCK write if unmapped names or team count exceeds expected**

### Output: Write to main tab (tab 0)
Same format as existing update-sheets.ts output.

### Key files to create/modify
- **NEW**: `workflows/scripts/penalties-sheets.ts`
- **MODIFY**: `workflows/scripts/club-names.ts` — add missing mappings found during audit
- **RETIRE**: `penalties_playwright.ts` + `update-sheets.ts` (keep as archive)

---

## 2. Perplexity MCP Verification Safeguard

### When it runs
After processing feed data, BEFORE writing to Google Sheets (in `--write` mode only).
Runs as an async parallel step during the "preview" summary phase.

### What it checks
For each league being updated:
1. Search: `"[League] penalty takers [Season] top scorers"`
2. Search: `"[Team] penalty taker [Season] [League]"` — for top 2-3 teams
3. Cross-reference: player names in top positions, penalty counts

### Implementation
```typescript
// New file: workflows/scripts/verify-perplexity.ts
// Uses Perplexity MCP tool (mcp__perplexity__search or similar)
// Returns: VerificationResult { confidence: 'high'|'medium'|'low', warnings: string[], sources: string[] }
```

### Behavior
- `confidence: high` → proceed to write
- `confidence: medium` → write with warning logged + notified
- `confidence: low` → BLOCK write, show discrepancies, notify herbert

### Integration point
In `penalties-sheets.ts` (and later corners-sheets.ts + freekicks-sheets.ts):
```typescript
if (write) {
  const verify = await verifyWithPerplexity(leagueKey, topPlayers);
  if (verify.confidence === 'low') { /* block */ }
}
```

---

## 3. Club Name Robustness Improvements

### In `club-names.ts`
- Run `--audit` on all leagues to find ALL currently unmapped names
- Add those mappings before any other work
- Add a `CANONICAL_SET` validation that runs at module load (throws if map has values not in set)

### In each sheets script
- Enhanced fallback: if `normalizeClub()` returns the original name (fallback), log it as UNMAPPED immediately
- `isKnownClub()` check happens BEFORE aggregation, not after
- Unmapped names → red-flag list appended to notification report

### Team count validation tightening
- **Corners/Freekicks**: currently warns if count != expected, but still writes if `teamCountOk=false`... wait, no — it BLOCKS. Good.
- **Penalties-sheets**: same strict behavior — block if count > expected, warn if count < expected (partial season OK)

### Player dedup improvement
- When aggregating players within a team, normalize player names: trim, normalize whitespace, compare lowercased
- (NOT fuzzy matching — that's overengineering. Simple normalization is enough)

---

## 4. Dedicated SetPieceTakers Sub-Agent

### File: `~/.claude/agents/SetPieceTakers.md`

A custom agent with full context about the SPT pipeline. Invoked as `subagent_type=general-purpose`.

### Agent capabilities
- Run `--audit` on all leagues and report unmapped names
- Detect duplicate teams in sheets
- Run Perplexity verification for any league
- Add new club name mappings to `club-names.ts`
- Run full update cycle (dry-run or write)
- Diagnose data quality issues

### Agent knows
- All script locations and commands
- Sheet IDs and league config
- Canonical naming rules
- How to interpret audit output
- How to use Perplexity MCP for verification

---

## Implementation Order

1. **Audit first** — run `corners-sheets.ts --audit` + `update-sheets.ts --audit` on all leagues → collect all unmapped names
2. **Fix club-names.ts** — add all unmapped names found in step 1
3. **Create penalties-sheets.ts** — new script reading from feed tab (need to discover tab name by reading sheet metadata)
4. **Create verify-perplexity.ts** — verification module
5. **Integrate verification** into penalties-sheets.ts (and optionally corners/freekicks)
6. **Create SetPieceTakers agent**
7. **Update run-spt-sheets.sh** — include penalties in the unified runner

---

## Critical Files

| File | Action |
|------|--------|
| `workflows/scripts/penalties-sheets.ts` | CREATE — new penalty feed reader |
| `workflows/scripts/verify-perplexity.ts` | CREATE — Perplexity verification module |
| `workflows/scripts/club-names.ts` | MODIFY — add unmapped names from audit |
| `~/.claude/agents/SetPieceTakers.md` | CREATE — dedicated sub-agent |
| `workflows/scripts/run-spt-sheets.sh` | MODIFY — add penalties to unified runner |

---

## Verification

1. `bun run workflows/scripts/corners-sheets.ts --audit` → zero unmapped names
2. `bun run workflows/scripts/penalties-sheets.ts --audit bundesliga` → zero unmapped
3. `bun run workflows/scripts/penalties-sheets.ts bundesliga` (dry-run) → correct team/player counts shown
4. Perplexity verification runs and returns at least `confidence: medium` for Bundesliga
5. `bun run workflows/scripts/penalties-sheets.ts bundesliga --write` → sheet updated
6. Agent invocation produces correct audit report

---

## Open Questions Before Build

- What is the exact tab name for the penalty feed tab? (e.g., "Penalties Bundesliga" or "Tab 2"?) → discover via sheet metadata call
- Does the feed tab have a header row? → assume yes, same pattern as corners
- Are column positions fixed (A=Team, B=Player, C=Taken, D=Scored, E=Missed) or different? → verify at runtime
