---
name: PokerStories
description: Manage the PokerStories two-book series — Focalboard status tracking, Google Drive chapter sync, word count updates, and board overview. USE WHEN pokerstories board, update chapter status, sync chapters to drive, word count update, add chapter, book pipeline, pokerstories focalboard, pokerstories drive, pokerstories admin, band 1 band 2 status.
---

# PokerStories

Manages the PokerStories book series across two platforms:
- **Focalboard** (boards.pokerstories.wtf) — 📖 Book Pipeline board, 17 cards, Band 1 + Band 2
- **Google Drive** — markdown chapter files shared with Wladimir

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running WORKFLOWNAME in PokerStories"}' \
  > /dev/null 2>&1 &
```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Status** | "pokerstories status", "board overview", "word counts", "wie weit sind wir" | `Workflows/Status.md` |
| **FullSync** | "sync", "full sync", "update board", "alles updaten", "monad to drive" | `Workflows/FullSync.md` |
| **UpdateCard** | "update card", "change status", "set status", "kapitel status", "words changed" | `Workflows/UpdateCard.md` |
| **AddChapter** | "add chapter", "new chapter", "neues kapitel", "add exkurs" | `Workflows/AddChapter.md` |

## Quick Reference

- **Config & IDs:** `BoardConfig.md` — board ID, Drive folder IDs, VPS path, token refresh
- **Tool:** `Tools/BoardSync.ts` — CLI for all read/write operations
- **MONAD source:** `~/Documents/MONAD/02-PROJECTS/PokerStories-Series/`
- **API token expires:** ~30 days — see `BoardConfig.md` for refresh procedure

## Examples

**Example 1: Monthly admin session**
```
User: "pokerstories full sync"
→ Reads word counts from all MONAD chapter files
→ Updates Drive md folder with changed files
→ Updates Focalboard card Words property via SQLite
→ Reports: N files synced, N cards updated
```

**Example 2: After finishing a chapter**
```
User: "set B2 Ch 4 Economy to review"
→ UpdateCard workflow
→ Patches SQLite on VPS: status=review for cps_ch09_rakeback card
→ Confirms updated
```

**Example 3: Weekly check-in**
```
User: "pokerstories status"
→ Queries Focalboard API
→ Shows Band 1 / Band 2 word totals, status breakdown
→ Flags which chapters are below target word count
```

**Example 4: New excursus added**
```
User: "add chapter B2 Exkurs 5a: Late Registration Strategy, 1500 words, draft"
→ AddChapter workflow
→ Creates card on board via API with correct band/chapter/words properties
→ Confirms card ID
```
