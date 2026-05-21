# PokerStories Board Configuration

All IDs, paths, and credentials for the two-platform setup.

## Focalboard

| Key | Value |
|-----|-------|
| URL | https://boards.pokerstories.wtf |
| Board ID | `b3tk9ri75otfidnartfnass9a8a` |
| Board name | 📖 Book Pipeline |
| User | herbert@pokerstories.wtf (`uko856ynwd3bkim3bgein3mop4r`) |

**Card Properties (schema):**

| ID | Name | Type | Values |
|----|------|------|--------|
| `band` | Band | select | `band1` = B1, `band2` = B2 |
| `status` | Status | select | `outline`, `draft`, `review`, `revise`, `final` |
| `chapter` | Chapter | text | e.g. `B1-01`, `B2-2a` |
| `words` | Words | number | current word count |
| `assignee` | Assignee | select | `herbert`, `wladimir` |
| `url_prop` | URL | url | Google Doc link |

**Card IDs (stable, never renumber):**

Band 1:
- `cps_ch00_foreword_00000000000` — Foreword (B1-00)
- `cps_ch01_firsthands_000000000` — Ch 1 First Hands (B1-01)
- `cps_ch02_download_00000000000` — Ch 2 Download Qualify Ship (B1-02)
- `cps_ch03_sundayrit_0000000000` — Ch 3 Sunday Rituals (B1-03)
- `cps_ch04_nosebleed_0000000000` — Ch 4 Nosebleeds (B1-04)
- `cps_ch05_blackfri_00000000000` — Ch 5 Black Friday (B1-05)
- *(dynamic ID)* — Ch 6 Women of the Golden Age (B1-06)

Band 2:
- `cps_ch06_training_00000000000` — Ch 1 Poker Schools (B2-01)
- `cps_ch07_pokertools_000000000` — Ch 2 Poker Tools (B2-02)
- `cps_ch08_platforms_0000000000` — Ch 3 Poker Platforms (B2-03)
- `cps_ch09_rakeback_00000000000` — Ch 4 Economy Rakeback (B2-04)
- `cps_ch10_virtualfelt_0000000a` — Ch 5 Tournaments (B2-05)
- `cps_ch7a_icmgto_000000000000a` — Exkurs 2a ICM/GTO (B2-2a)
- *(dynamic IDs)* — Exkurse 2b/3a/3b/4a

> Dynamic IDs: query `bun ~/.claude/skills/PokerStories/Tools/BoardSync.ts status` to get all current IDs.

## API Token

**Current token:** stored in `~/.env` as `FOCALBOARD_TOKEN` (set after last refresh)

**Token lifetime:** ~30 days (session_expire_time=2592000 in Focalboard config)

**Refresh procedure:**
```bash
SSH_AUTH_SOCK= ssh -i ~/.ssh/atom -o IdentitiesOnly=yes root@72.60.80.232 \
  "sqlite3 /var/lib/docker/volumes/focalboard_focalboard_data/_data/focalboard.db \
   'SELECT token FROM sessions WHERE user_id=\"uko856ynwd3bkim3bgein3mop4r\" ORDER BY update_at DESC LIMIT 1;'"
```
Then update `~/.env`: `FOCALBOARD_TOKEN=<new_token>`

**API quirk — CRITICAL:**
The REST PATCH endpoint updates title only. `fields.properties` (band, status, words) must be updated via SQLite directly. Title updates always use REST PATCH; property updates always use SQLite.

## VPS / SQLite

| Key | Value |
|-----|-------|
| SSH | `SSH_AUTH_SOCK= ssh -i ~/.ssh/atom -o IdentitiesOnly=yes root@72.60.80.232` |
| DB path | `/var/lib/docker/volumes/focalboard_focalboard_data/_data/focalboard.db` |
| Container | `focalboard-focalboard-1` |
| DB owner | `nobody:nogroup` permissions `664` |

**After modifying DB on host:** no restart needed — Focalboard reads SQLite on each request.
**After `docker cp` into container:** restart required; set perms `664 nobody:nogroup` first.

> Prefer modifying the volume-mounted DB directly (`/var/lib/docker/volumes/...`) — no copy or restart needed.

## Google Drive

| Folder | Drive ID | Contents |
|--------|----------|----------|
| Band 2 `md/` | `1EyMZfB-d9G9LHnXsufxJipPFDxP5acNq` | 10 Band 2 .md files |
| Band 1 Part-1-Narrative | `1wlZw8Oo3mZ7Wdfh23VekClf0_HsPtl8S` | 7 Band 1 .md files |

**Band 2 Drive file IDs:**

| MONAD filename | Drive ID |
|----------------|----------|
| 01-Poker-Schools.md | `1ZYlu3M1PK1IO-IA2yk7QG-dUV-NRVioM` |
| 02-Poker-Tools.md | `1iKTYIsd9-kW3k1NVdb0TuROfUAGBXCYn` |
| 02a-Exkurs-ICM-GTO.md | `1tJ24xt0NrwtvXmE33yhACKSDElGB1FjD` |
| 02b-Exkurs-Data-Mining.md | `1Z5_XgjTg-NEs2sVBE4jJaVs635f7_otP` |
| 03-Poker-Platforms.md | `12v1QD14N6vOhELKBcvENjlidNJCxTZ_2` |
| 03a-Exkurs-Networks.md | `1a39z7w_rsogdrHlOHCzVN8f3BuM-kTfj` |
| 03b-Exkurs-Country-Pools.md | `1J59J59RE486NaQWXJZuMGZzDIVNnIXaY` |
| 04-Economy-Rakeback.md | `1G2V4Mn-idmkeJ0e1RbvKIYCqZe66vlf1` |
| 04a-Exkurs-Staking.md | `16suXVS8ip5fZJVRli9nBtf6Wh9wDPw1Q` |
| 05-Tournaments.md | `1B-MndNfnNoTDBMLiUk0aqpZJyFBQJuvy` |

**Band 1 Drive file IDs:**

| MONAD filename | Drive ID |
|----------------|----------|
| 01-First-Hands-and-First-Hustles.md | `1vHl-kC7RQ-c4wwi4CJaVN7y0knlUNKVS` |
| 02-Download-Qualify-Ship.md | `1N-CgzLZz_ThmiYJjuisSK_1f21hYXj3N` |
| 03-Sunday-Rituals-and-Million-Dollar-Clicks.md | `1YDAbzPrd564K3e4vcuGQEyhICASoDyS1` |
| 04-Nosebleeds-and-Railbird-Theatre.md | `1jXwuoMk5HQqFENcX9boGZdd3y9MkQ12c` |
| 05-Black-Friday.md | `1d6cdhobqwqjz2YLshgC7UQozROCoi0ZW` |
| 05a-Exkurs-Game-Variants.md | `1qV0pYBEQVjty0LT2XB0CCnykmOLtCBuh` |
| 06-Women-of-the-Golden-Age.md | `1egg2VtUIpg7JxlaQ8pY33h9PcXVlQrYf` |

## MONAD Paths

| Band | Chapters dir |
|------|-------------|
| Band 1 | `~/Documents/MONAD/02-PROJECTS/PokerStories-Series/Band-1-Golden-Age/02-Chapters/` |
| Band 2 | `~/Documents/MONAD/02-PROJECTS/PokerStories-Series/Band-2-Deep-Dive/02-Chapters/` |
| Series admin | `~/Documents/MONAD/02-PROJECTS/PokerStories-Series/00-Admin/` |

## Word Count Targets

| Chapter | Target |
|---------|--------|
| B1 Ch 1-6 | 6.000-7.500 each |
| B2 Ch 1-5 | 10.000-15.000 each |
| B2 Exkurse | 2.500-7.000 each |
| B1 total | ~49.100 |
| B2 total | ~70.000 |
