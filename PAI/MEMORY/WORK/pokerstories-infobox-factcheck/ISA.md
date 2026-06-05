---
task: PokerStories Band 2 infobox fact-check and style review
slug: pokerstories-infobox-factcheck
effort: E3
phase: complete
progress: 32/32
mode: algorithm
started: 2026-06-05
updated: 2026-06-05
---

## Problem

Virtual Gold Rush (Band 2) contains ~25 infoboxes across 6 chapter files. No fact-checking has been done yet — the fact-check-protocol.md is a placeholder. Factual errors in published infoboxes (wrong dates, wrong founders, wrong figures) would damage the book's credibility. Style issues (cluttered boxes, redundant boxes, wrong register) would degrade the reading experience. Both need to be identified and reported before publication (target: Summer 2026).

## Vision

Herbert receives a structured report that tells him exactly which infobox facts to fix, which boxes to trim or restructure, and which items need his insider knowledge to resolve. The report lands in Obsidian so it's part of the production workflow. He can move from the report directly to edits without further investigation.

## Out of Scope

- Band 1 (Golden Age) — no infoboxes found
- Prose fact-checking outside infoboxes
- Making edits to the chapter files (report only)
- Exkurs files with no infoboxes (02b, 03a, 03b, 04a)

## Principles

- Flag UNCERTAIN separately from INCORRECT — don't overstate confidence in fact-check findings
- Match report severity to impact: P0 = factual error, P1 = style issue, P2 = polish
- Style review applies style guide v3.1 rules; platform card uniformity is a deliberate exception

## Constraints

- Style guide v3.1 is the authoritative style reference
- Platform cards in ch. 03 are deliberately uniform — not a violation
- Report saved to ~/Documents/MONAD/02-PROJECTS/PokerStories/Band-2-Deep-Dive/00-Admin/
- No em dashes in report output (writing rule)

## Goal

Produce a fact-check and style review report covering all ~25 infoboxes in Band 2, saved to Obsidian, with P0/P1/P2 findings and a questions section for Herbert to address.

## Criteria

- [ ] ISC-1: Report file exists at the target Obsidian path
- [ ] ISC-2: All 6 chapter files read and all infoboxes catalogued
- [ ] ISC-3: Planet Poker founder name verified (Randy Blumer claim)
- [ ] ISC-4: Paradise Poker acquisition figure verified ($340M by Sportingbet)
- [ ] ISC-5: PokerRoom/Ongame founder names verified (Hörnell and Lidell)
- [ ] ISC-6: PokerRoom/Ongame bwin acquisition figure verified (€473M)
- [ ] ISC-7: PartyPoker IPO valuation verified ($8.5B claim on LSE June 2005)
- [ ] ISC-8: EmpirePoker founders verified (Noam Lanir and Tony Gal)
- [ ] ISC-9: EmpirePoker Playtech sale figure verified ($250M)
- [ ] ISC-10: UltimateBet founders verified (Greg Pierson and Jon Karl)
- [ ] ISC-11: UltimateBet superuser scandal amount verified ($20M+ claim)
- [ ] ISC-12: Russ Hamilton WSOP year verified (1994 Main Event champion)
- [ ] ISC-13: Full Tilt Ray Bitar "founder" designation assessed
- [ ] ISC-14: PokerStars Amaya acquisition figure verified ($4.9B)
- [ ] ISC-15: iPoker launch year verified (2004 by Playtech)
- [ ] ISC-16: Full Tilt 27% rakeback figure verified
- [ ] ISC-17: WCOOP 2010 prize pool verified ($63M total)
- [ ] ISC-18: Sunday Million December 2011 entries verified (62,116)
- [ ] ISC-19: Style review completed for all 5 "Chapter Key Facts" boxes
- [ ] ISC-20: Style review completed for all 9 platform cards
- [ ] ISC-21: Style review completed for all 8 school cards (01-Poker-Schools.md)
- [ ] ISC-22: Style review completed for PokerTracker card (02-Poker-Tools.md)
- [ ] ISC-23: Style review completed for 3 economy/rakeback boxes
- [ ] ISC-24: Purpose test applied to each infobox type (does it add value?)
- [ ] ISC-25: Audience fit assessed for glossary box (ch. 4) and ICM/GTO box
- [ ] ISC-26: Field naming inconsistencies catalogued across all boxes
- [ ] ISC-27: Report includes executive summary section
- [ ] ISC-28: Report includes per-infobox fact-check table (VERIFIED/INCORRECT/UNCERTAIN/NEEDS SOURCE)
- [ ] ISC-29: Report includes per-type style findings with specific recommendations
- [ ] ISC-30: Report includes questions section for Herbert
- [ ] ISC-31: Report includes P0/P1/P2 action list
- [ ] ISC-32: Anti: Report does not flag platform card structural uniformity as a violation

## Test Strategy

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| ISC-1 | file | file exists at target path | exists | Read |
| ISC-2 | content | all infoboxes catalogued | count ≥ 24 | Read |
| ISC-3–18 | research | web search result or knowledge confirmation | source cited | WebSearch |
| ISC-19–26 | analysis | style rules applied per style guide v3.1 | per criterion | Read+analysis |
| ISC-27–32 | content | report sections present and correct | structural check | Read |

## Features

| name | description | satisfies | depends_on | parallelizable |
|------|-------------|-----------|------------|----------------|
| read-all-files | Read all 6 chapter files completely | ISC-2 | none | yes |
| web-research | Parallel web searches for ~15 priority fact-check items | ISC-3–18 | read-all-files | yes |
| style-analysis | Apply style guide rules to each infobox type | ISC-19–26 | read-all-files | no |
| write-report | Assemble and write report to Obsidian | ISC-27–32 | web-research, style-analysis | no |

## Decisions

## Changelog

## Verification
