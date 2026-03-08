---
name: SetPieceTakers
description: SetPieceTakers.com data pipeline operations. USE WHEN user says spt-add-new-league, add new league, new penalty league, new corners league, new freekicks league, SPT pipeline, SPT integration, penalty scraper, add league to setpiecetakers.
---

# SetPieceTakers Skill

Manages the full data pipeline for setpiecetakers.com: scraping -> Google Sheets -> Supabase -> WordPress.

## Project Root

`/home/herbert/Projects/setpiecetakers.com/`

## Available Workflows

| Command | Workflow | Description |
|---------|----------|-------------|
| `/spt-add-new-league penalties` | `Workflows/AddLeaguePenalties.md` | Full integration of a new penalty league |
| `/spt-add-new-league corners` | `Workflows/AddLeagueCorners.md` | Add league to corners pipeline |
| `/spt-add-new-league freekicks` | `Workflows/AddLeagueFreekicks.md` | Add league to freekicks pipeline |

---

## Architecture Reference

### Penalty Pipeline

```
Transfermarkt (fetch, no Playwright)
  -> penalties-{slug}.ts (7-line config wrapper)
  -> penalties-common.ts (shared: scrape, parse, sheets, markdown)
  -> run-penalties.ts (batch runner, all leagues)
  -> Google Sheets ({slug}-pen at index 0, -clubs, -players)
  -> WordPress TablePress (reads first tab automatically)
```

**Key files:**
- `workflows/scripts/penalties-common.ts` — shared library, all logic here
- `workflows/scripts/run-penalties.ts` — batch runner, LEAGUES array
- `data/config/leagues-config.json` — league metadata

**Transfermarkt URL pattern:**
```
https://www.transfermarkt.{tld}/{league-slug}/elfmeterschuetzen/wettbewerb/{TM_CODE}
```

Common TM codes: L1 (Bundesliga), L2 (2.Bundesliga), ES1 (La Liga), IT1 (Serie A),
GB1 (Premier League), FR1 (Ligue 1), NL1 (Eredivisie), MLS1 (MLS),
PT1 (Primeira Liga), TR1 (Super Lig), A1 (Austrian BL)

**Skipped (no TM player-level page):** champions-league, national-teams, europa-league

### Corners/Freekicks Pipeline

```
Friend's live feed (Google Sheet feed tabs)
  -> corners-sheets.ts / freekicks-sheets.ts
  -> run-spt-sheets.sh (Mon/Tue/Thu 06:30 PST)
  -> Google Sheets live tabs
  -> WordPress TablePress
```

### Google Sheets tab structure (penalties)

| Tab | Content | Position |
|-----|---------|----------|
| `{slug}-pen` | League total + all players grouped by club | Index 0 (leftmost — WordPress reads this) |
| `{slug}-pen-clubs` | Club aggregates sorted by penalties taken | Any |
| `{slug}-pen-players` | All players sorted by penalties taken | Any |

---

## Supabase Schema

Database: PostgreSQL (Supabase)

**Table: `stats`**
```sql
CREATE TABLE stats (
  id          SERIAL PRIMARY KEY,
  league_id   TEXT NOT NULL,   -- e.g. "bundesliga1"
  category_id TEXT NOT NULL,   -- "penalties", "corners", "freekicks"
  club        TEXT,
  player      TEXT,
  taken       INTEGER,
  scored      INTEGER,
  missed      INTEGER,
  conversion_rate NUMERIC(5,2),
  season      TEXT,            -- e.g. "2025-26"
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

Aggregate views (club/league level) are computed via SQL views, not stored as rows.

---

## Env Variables Required

In `~/.env`:
```
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_SHEETS_REFRESH_TOKEN=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```
