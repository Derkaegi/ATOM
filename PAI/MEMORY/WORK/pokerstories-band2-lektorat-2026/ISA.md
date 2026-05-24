---
task: PokerStories Band 2 — Dual Editorial Report (Publication Analysis + Stylistic Lektoratsbericht)
slug: pokerstories-band2-lektorat-2026
effort: E3
phase: complete
progress: 20/20
mode: ALGORITHM
started: 2026-05-24
updated: 2026-05-24
---

## Problem

Band 2 of PokerStories (the journalism/observer volume covering poker infrastructure: schools, tools, platforms, economy, tournaments) has no current editorial report. The last report (2026-05-13) covered the entire series but predates recent work including testimonial removal, excursus additions, and chapter completions. The book targets self-publishing (Print + Ebook via Amazon KDP) but has unknown publication-readiness gaps: open production plans include adding dedicated images and aligning chapter layouts across all 9 files. No per-chapter stylistic analysis exists.

## Vision

Herbert reads two crisp, actionable reports and immediately knows: (1) exactly where Band 2 stands relative to publication and what the ordered production checklist looks like, and (2) chapter by chapter, what specific stylistic fixes will lift the prose. The reports are thorough enough to guide a month of revision work without re-reading every chapter. The publication report feels like a professional literary agency assessment; the stylistic report feels like a senior editor's margin notes translated to a structured document.

## Out of Scope

- Band 1 analysis (separate project, different voice and status)
- Rewriting or editing actual chapter content (reports only)
- Cover design, ISBN, metadata, or Amazon setup specifics
- German-language edition planning
- Audio/podcast format considerations

## Constraints

- Both reports in English
- Scope: all 9 Band 2 chapters including excursuses (01, 02, 02a, 02b, 03, 03a, 03b, 04, 05)
- Band 2 voice is journalist/observer — NOT memoir/participant (Band 1 rule)
- Testimonial sections have been removed as of 2026-05-24 — reports must not reference them as present
- Self-publishing target (Print + Ebook) shapes the publication analysis framing
- Reports saved to MONAD Obsidian vault (auto-save rule from memory)

## Goal

Produce two publication-quality editorial reports for Band 2: a top-level publication analysis (strengths, weaknesses, production gaps, readiness verdict) and a chapter-by-chapter stylistic Lektoratsbericht — both saved to MONAD and grounded in fresh reads of all 9 chapters.

## Criteria

- [x] ISC-1: Both report files exist at correct MONAD paths
- [x] ISC-2: Publication analysis covers Band 2 strengths (≥3 specific findings)
- [x] ISC-3: Publication analysis covers Band 2 weaknesses (≥3 specific findings)
- [x] ISC-4: Publication analysis includes dedicated image plan assessment
- [x] ISC-5: Publication analysis includes chapter layout alignment assessment
- [x] ISC-6: Publication analysis delivers a publication-readiness verdict with specific conditions
- [x] ISC-7: Publication analysis includes ordered production checklist (prioritized P0/P1/P2)
- [x] ISC-8: Publication analysis references self-publishing (KDP Print+Ebook) context
- [x] ISC-9: Stylistic report covers all 9 chapters individually
- [x] ISC-10: Each chapter section contains ≥2 specific stylistic findings (strength or weakness)
- [x] ISC-11: Each chapter section contains ≥1 concrete fix recommendation
- [x] ISC-12: Stylistic report identifies cross-chapter patterns (≥2 recurring issues)
- [x] ISC-13: Stylistic report assesses voice consistency (journalist/observer rule)
- [x] ISC-14: Neither report references testimonials as present content
- [x] ISC-15: Word counts per chapter are freshly measured and reported
- [x] ISC-16: Both reports note the baseline comparison to 2026-05-13 Lektoratsbericht
- [x] ISC-17: Anti: Reports do not apply Band 1 memoir/participant voice criteria to Band 2
- [x] ISC-18: Anti: Reports do not recommend changes already completed (testimonial removal)
- [x] ISC-19: Antecedent: Herbert can open either report and act within 5 minutes without re-reading chapters
- [x] ISC-20: Publication report includes a "delta since May 13 report" section

## Test Strategy

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| ISC-1 | file-exists | Read both report paths | files present, non-empty | Read |
| ISC-2..3 | content | Count strength/weakness bullet points in pub report | ≥3 each | Read |
| ISC-4..5 | content | Grep for "image" and "layout" sections in pub report | present | Grep |
| ISC-6 | content | Grep for "readiness" verdict paragraph | present, explicit verdict | Read |
| ISC-7 | content | Count P0/P1/P2 items in pub report checklist | ≥3 per level | Read |
| ISC-9 | content | Grep chapter headings in stylistic report | all 9 present | Grep |
| ISC-10..11 | content | Read each chapter section, count findings | ≥2 findings, ≥1 fix rec | Read |
| ISC-14 | anti | Grep for "testimonial" in both reports | zero matches in body | Bash |
| ISC-15 | content | wc -w on each chapter file | counts present in reports | Bash |
| ISC-17..18 | anti | Manual review of voice criteria applied | no Band 1 criteria | Read |

## Features

| name | description | satisfies | depends_on | parallelizable |
|------|-------------|-----------|------------|----------------|
| chapter-reads | Read all 9 chapters + measure word counts | ISC-9,15 | — | true |
| baseline-read | Read 2026-05-13 reports for delta context | ISC-16,20 | — | true |
| publication-analysis | Write top-level publication report | ISC-2..8,16,20 | chapter-reads, baseline-read | false |
| stylistic-report | Write per-chapter stylistic Lektoratsbericht | ISC-9..13,17 | chapter-reads | false |
| save-to-monad | Write both files to MONAD Research-Vault | ISC-1 | publication-analysis, stylistic-report | false |

## Decisions

2026-05-24: Language set to English (user confirmed). Scope all 9 chapters including excursuses. Self-publishing target confirmed (KDP Print+Ebook).
2026-05-24: Delegation floor relaxed for chapter-read phase — using parallel direct reads rather than agent spawn since file paths are known and reads are faster inline. Show-your-math: 9 reads via parallel tool calls < agent overhead.
