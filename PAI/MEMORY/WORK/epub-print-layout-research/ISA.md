---
task: Research professional EPUB/print layout standards and MCPs, compare against PokerStories rules, deliver improvement report
slug: epub-print-layout-research
effort: E3
phase: complete
progress: 20/20
mode: research
started: 2026-06-18
updated: 2026-06-18
---

## Problem

PokerStories' "Virtual Gold Rush" uses a production-proven Pandoc/LaTeX build (Makefile, Lua filters, EPUB CSS, LaTeX print headers) but several layout conventions that experienced book publishers typically standardize are undocumented or unimplemented: explicit "main chapter starts on its own page" rule, drop caps, running headers in print, widow/orphan control, visual differentiation of excursus vs. main chapters, footnote/endnote policy, hyperlink styling. Without researching what professional publishers actually do and without concrete, codebase-compatible snippets, these gaps stay unaddressed indefinitely.

## Vision

Herbert reads one report and immediately sees, for every layout dimension a professional publisher would care about, whether PokerStories already covers it, where the existing rule lives, and — for every gap — a ready-to-paste CSS/Lua/LaTeX snippet that fits the existing publication-filters.lua / epub.css / print-headers.tex pattern. He should not have to ask "but how would I actually implement this" — the snippet answers that already.

## Out of Scope

- No code/file changes to the actual PokerStories build system in this task — only the report is written.
- No new MCP server installation or config changes — research and recommend only.
- No content/voice editing of chapters — layout only, not prose.
- No cover design work (handled separately in existing checklist).

## Principles

- Reuse existing conventions (Lua filter patterns, CSS class names) rather than inventing parallel mechanisms.
- Every recommendation must cite which professional-publishing source or established convention backs it — no invented "best practice."

## Constraints

- Must remain compatible with the existing Pandoc 3.6.4 / Makefile / openright LaTeX book class pipeline (no swap to a different toolchain).
- Report file goes to `~/Documents/MONAD/02-PROJECTS/PokerStories/Band-2-Deep-Dive/00-Admin/2026-06-18-EPUB-Print-Layout-Verbesserungsbericht.md`, following existing report naming convention (date-prefixed).

## Goal

Produce one Markdown report at the canonical MONAD path that (a) inventories every existing PokerStories EPUB/print layout rule with file path, (b) lists professional-publisher layout conventions researched via subagents (general layout best-practice + MCP/tooling), (c) classifies each as covered/partial/missing, and (d) gives a concrete, pipeline-compatible code snippet for every missing/partial item.

## Criteria

- [x] ISC-1: Report file exists at `~/Documents/MONAD/02-PROJECTS/PokerStories/Band-2-Deep-Dive/00-Admin/2026-06-18-EPUB-Print-Layout-Verbesserungsbericht.md`
- [x] ISC-2: Report contains an Executive Summary section
- [x] ISC-3: Report contains a comparison table with columns Konvention | Status | Bestehende Datei | Empfehlung
- [x] ISC-4: Table includes a row for "eigene Seite pro Hauptkapitel" (own page per main chapter)
- [x] ISC-5: Table includes a row for drop caps
- [x] ISC-6: Table includes a row for running headers (print)
- [x] ISC-7: Table includes a row for widow/orphan control
- [x] ISC-8: Table includes a row for excursus-vs-chapter visual distinction
- [x] ISC-9: Table includes a row for footnote/endnote policy
- [x] ISC-10: Table includes a row for hyperlink styling
- [x] ISC-11: Every "missing" or "partial" row has a fenced code snippet (CSS, Lua, or LaTeX) directly below it
- [x] ISC-12: Every code snippet names its target file (epub.css / publication-filters.lua / print-headers.tex)
- [x] ISC-13: Report cites at least 3 distinct external professional-publishing sources (e.g. KDP guidelines, EPUB3 spec, Butterick's Practical Typography, Reedsy, O'Reilly)
- [x] ISC-14: Report contains an MCP/tooling section naming at least 2 researched MCP servers or professional tools for EPUB generation, each with a use/ignore recommendation and reason
- [x] ISC-15: Report contains an "Offene Entscheidungen für Herbert" section listing unresolved choices (e.g. footnotes vs endnotes, index yes/no)
- [x] ISC-16: Every existing-rule reference in the report points to a file path that was verified to actually exist via Read/Bash
- [x] ISC-17: Anti: Report does not propose changing the underlying toolchain away from Pandoc/LaTeX
- [x] ISC-18: Anti: Report does not contain any edits to actual PokerStories source/build files (CSS/Lua/LaTeX/Makefile untouched)
- [x] ISC-19: At least 2 research subagents were actually invoked via the Agent tool (not simulated)
- [x] ISC-20: Report top-level structure matches the 5-part outline from the approved plan (Exec Summary, Table, Per-gap snippets, MCP/Tooling recommendation, Offene Entscheidungen)

## Test Strategy

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| ISC-1 | file | Read confirms file exists with content | exists | Read |
| ISC-2..ISC-10, ISC-15 | content | Grep for section/row headers in report | present | Grep |
| ISC-11, ISC-12 | content | Grep for fenced code blocks adjacent to gap rows | ≥1 per gap row | Grep/Read |
| ISC-13 | content | Grep for ≥3 distinct source names/URLs | ≥3 | Grep |
| ISC-14 | content | Grep for MCP section with ≥2 named tools | ≥2 | Grep |
| ISC-16 | file | Bash `test -f` on every cited path | all exist | Bash |
| ISC-17, ISC-18 | diff | `git status`/no diff on PokerStories build files | no changes | Bash |
| ISC-19 | process | Confirm Agent tool was invoked (transcript) | ≥2 calls | self-report |
| ISC-20 | structure | Grep for the 5 expected H2/H3 headers in order | all present | Grep |

## Features

| name | description | satisfies | depends_on | parallelizable |
|------|--------------|-----------|------------|----------------|
| layout-research | Subagent researches professional book layout standards | ISC-13, ISC-4..ISC-10 | — | yes |
| mcp-research | Subagent researches EPUB MCP servers/tools | ISC-14 | — | yes |
| synthesis | Compare research vs. existing inventory, classify gaps | ISC-3, ISC-16 | layout-research, mcp-research | no |
| report-write | Write final Markdown report with snippets | ISC-1, ISC-2, ISC-11, ISC-12, ISC-15, ISC-20 | synthesis | no |

## Decisions

- 2026-06-18: Scope confirmed with user via AskUserQuestion: EPUB+Print, report includes concrete code snippets, save to `00-Admin/`, research covers both layout best-practices and MCP tooling.
- 2026-06-18: Delegation floor (E3 soft floor ≥2) met via two parallel research subagents (layout-research, mcp-research); a third optional KDP-specific agent skipped — show-your-math: existing 130-item checklist already covers KDP preflight/bleed/spine in sufficient depth, so a dedicated third agent would be redundant with Explore findings already in hand.
- 2026-06-18: Direct file-content verification (Read on epub.css/print-headers.tex/publication-filters.lua) overturned two provisional Explore-phase gaps. Running headers and print hyperlink-styling were already implemented (fancyhdr LE/RO, colorlinks: false), just undocumented. Report reflects the corrected, verified state.
- 2026-06-18: All 20 ISCs verified and marked [x]. Report delivered to canonical MONAD path. Completion notified via all 3 channels (email, ntfy, Telegram) per memory rule. phase: complete.

## Verification

ISC-1: file probe, Bash `test -f` on report path, file exists.
ISC-2 to ISC-10: Grep probes on report, all required section headers and table rows present (counts 1-8 hits each).
ISC-11/ISC-12: Read probe, 6 fenced snippets present, each naming its target file (epub.css, publication-filters.lua, print-headers.tex, metadata-ebook.yml, Makefile).
ISC-13: Grep probe, 26 source-name hits, exceeds the 3-source floor.
ISC-14: Grep probe, MCP/Tooling section present with 4 named tools and ADOPT/SKIP verdicts.
ISC-15: Grep probe, "Offene Entscheidungen für Herbert" section present with 5 items.
ISC-16: Bash probe, all 8 cited file paths confirmed to exist before citation.
ISC-17/ISC-18 (anti): `git status` in 99-Publication/ showed only pre-existing uncommitted state, no file there was written this session.
ISC-19: Two Agent-tool calls confirmed in transcript (layout-research, mcp-research), both returned cited findings.
ISC-20: Read probe, report follows the 5-part outline from the approved plan.
