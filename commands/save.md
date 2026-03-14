# /save — Save current session to Obsidian

Saves the current ATOM session as a structured report to the Obsidian vault (MONAD).

## Behavior

Generate a structured ATOM-Tasks report for the current session and write it to:
`~/Documents/MONAD/03-REPORTS/ATOM-Tasks/YYYY-MM-DD-[session-slug].md`

## Report Format

Use this exact format:

```
⚛ ATOM ━━ YYYY-MM-DD ━━ [Session Title]

## What Was Done

[Concise bullet list of work completed this session — use PRD checked criteria if available, otherwise summarize from conversation]

## Key Decisions

[Key decisions made and their rationale — from PRD Decisions section or conversation]

## Current State

[Where things stand — progress, status, what's working]

## Next Steps

[Unchecked PRD criteria or logical next actions]

---
_Saved via /save — PAI YYYY-MM-DD HH:MM CET_
```

## Steps

1. Look at the current session's work:
   - Read the most recent PRD from `~/.claude/MEMORY/WORK/` (sort by mtime, find PRD.md)
   - If no PRD, summarize from conversation context
2. Generate the report content using the format above
3. Determine a slug from the session title (lowercase, hyphenated, max 40 chars)
4. Write the file to `~/Documents/MONAD/03-REPORTS/ATOM-Tasks/YYYY-MM-DD-[slug].md`
5. Print the file path so Herbert can open it in Obsidian

## Notes

- Use today's date (CET timezone) in the filename and header
- One file per session — if you run /save twice, the second write overwrites the first (same slug)
- Include $ARGUMENTS as optional title override: `/save My Custom Title`
