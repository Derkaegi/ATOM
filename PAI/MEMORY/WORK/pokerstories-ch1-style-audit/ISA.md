---
task: "Style audit of Band-2 Chapter 1 (Poker Schools) against Style Guide v3.0"
slug: pokerstories-ch1-style-audit
effort: E3
phase: observe
progress: 0/36
mode: analysis
started: 2026-05-16
updated: 2026-05-16
---

## Problem
Chapter 1 (Poker Schools, ~18,000 words) was written before Style Guide v3.0 and contains pervasive violations of forbidden patterns, voice, structural, and argumentation rules. The chapter reads as external journalism rather than participant-narrator argument, uses symmetric Wave taxonomy explicitly forbidden by the guide, applies uniform factboxes to every platform, and is filled with em dashes, importance-announcing phrases, and generic evolution framing.

## Vision
Herbert reads the audit report and immediately identifies which sections need the most work, in which order, and what specific rewrites are needed. The plan section gives him a clear, prioritized editing roadmap with concrete before/after examples for the most egregious violations.

## Out of Scope
Executing any rewrites of the chapter. This task produces only the report and plan, not the edits themselves.

## Constraints
- Style Guide v3.0 is the only governing document
- Report must cite specific line numbers or direct quotes from the chapter
- Plan must be prioritized: critical (zero-tolerance violations) first, then structural, then voice/stance

## Goal
Produce a structured audit report identifying all style guide violations in Chapter 1 with specific evidence, followed by a prioritized improvement plan that Herbert can use to guide a rewrite.

## Criteria
- [ ] ISC-1: Report identifies all zero-tolerance (forbidden) pattern violations with line evidence
- [ ] ISC-2: Report identifies symmetric taxonomy violation (Three Waves structure)
- [ ] ISC-3: Report identifies uniform factbox violation across all 8 platform sections
- [ ] ISC-4: Report identifies narrator-as-observer violations (vs. participant-narrator requirement)
- [ ] ISC-5: Report identifies argumentation pattern failures (sections report vs. argue)
- [ ] ISC-6: Report identifies sentence rhythm issues (no accumulation-detonation pattern)
- [ ] ISC-7: Report identifies academic register creep instances with quotes
- [ ] ISC-8: Report identifies importance-announcing phrases with quotes
- [ ] ISC-9: Report identifies generic evolution framing with quotes
- [ ] ISC-10: Report identifies table-of-contents sentences with quotes
- [ ] ISC-11: Report identifies dual-conclusion paragraphs
- [ ] ISC-12: Report identifies significance-announcing section closings
- [ ] ISC-13: Report names sections/platforms that DO meet the style guide (positive anchors)
- [ ] ISC-14: Report names the GipsyTeam section as the model section for the chapter
- [ ] ISC-15: Plan is prioritized: P1 critical, P2 structural, P3 voice, P4 polish
- [ ] ISC-16: Plan gives specific guidance per section (not generic advice)
- [ ] ISC-17: Anti: Report does not make vague claims without specific textual evidence
- [ ] ISC-18: Anti: Plan does not recommend rewriting everything at once without priority

## Test Strategy
isc | type | check | threshold | tool
ISC-1 through ISC-16 | inspection | human read of report output | all present | Read
ISC-17, ISC-18 | anti-inspection | report cites specific text, plan has priority tiers | zero vague claims | Read

## Features
name | description | satisfies | depends_on | parallelizable
zero-tolerance-audit | Catalog all forbidden patterns with quotes | ISC-1,7,8,9,10,11,12 | — | false
structural-audit | Taxonomy, factboxes, section structure | ISC-2,3 | — | false
voice-stance-audit | Participant vs observer, argues vs reports | ISC-4,5 | — | false
rhythm-audit | Sentence construction violations | ISC-6 | — | false
positive-anchors | Name what works | ISC-13,14 | — | false
improvement-plan | Prioritized edit roadmap | ISC-15,16,17,18 | all audits | false
