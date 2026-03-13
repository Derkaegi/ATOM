# Fix: LaLiga Penalty Sheet "Tabellenblatt1" Error

## Context

The SPT Sheets Update on 12.03.2026 failed for LaLiga with:
```
Clear error: {"code":400,"message":"Unable to parse range: Tabellenblatt1!A1:H102","status":"INVALID_ARGUMENT"}
```

**Root cause:** The n8n workflow "SPT La Liga Penalty Takers Update" (`VmWlt708NvJKpJtz`) has two Google Sheets nodes that reference `sheetName.cachedResultName: "Tabellenblatt1"`. The actual first tab in the LaLiga sheet was renamed to `laliga-pen` by the newer `penalties-common.ts` script (which moves `{slug}-pen` to position 0). n8n constructs the range using the cached name → API rejects it.

## Files / Nodes to Change

**n8n workflow:** `VmWlt708NvJKpJtz` — "SPT La Liga Penalty Takers Update"

| Node ID | Node Name | Current cachedResultName | Fix to |
|---------|-----------|--------------------------|--------|
| `b01e2159-9f78-4065-b04a-833e7cfca50b` | Append or update row in Main | `"Tabellenblatt1"` | `"laliga-pen"` |
| `ca3eb8b5-f077-43b5-8b60-7d19bb6f840a` | Add Last updated on | `"Tabellenblatt1"` | `"laliga-pen"` |

Both nodes use `value: "gid=0"` (first tab) which is correct — `laliga-pen` is moved to position 0.

## Plan

1. Use `mcp__n8n-mcp__n8n_update_partial_workflow` with two `updateNode` operations to patch both nodes' `sheetName.cachedResultName` from `"Tabellenblatt1"` to `"laliga-pen"`.

## Secondary Issue (not part of this fix unless asked)

The active cron `50 6 * * *` points to `run-all-scrapers.sh` which only exists in `_archive/`. The script at the expected path doesn't exist → cron fails silently every day. The LaLiga error the user saw came from the OLD `run-spt-sheets.sh` cron (deactivated 12.03) calling `_archive/penalties-sheets.ts`. The actual TS pipeline (`run-penalties.ts`) doesn't cause this error.

## Verification

After applying: test-trigger the n8n workflow via webhook or manual execution to confirm no "Tabellenblatt1" range error.
