---
task: "git init and Stufe-1 KdP layout enhancements"
slug: 20260523-164455_kdp-layout-stufe1
effort: E2
effort_source: context-override
phase: complete
progress: 0/16
mode: interactive
started: 2026-05-23T16:44:55
updated: 2026-05-23T16:44:55
---

## Problem

The PokerStories Band 2 publication folder (`99-Publication/`) has no version control. Any change to the LaTeX templates is unrecoverable. The current print PDF uses the plain `book` class with no typographic enhancements, producing output that looks like an academic printout rather than a commercial non-fiction book. KDP prints exactly what is submitted — the layout must be polished before upload.

## Goal

Initialize git with a baseline commit in `99-Publication/`, add a `LAYOUT_STYLE` Makefile profile, and create `print-headers-enhanced.tex` with microtype + titlesec + pgfornament + EB Garamond — such that `make print LAYOUT_STYLE=enhanced` produces a visually improved PDF while `make print` still works unchanged.

## Criteria

- [ ] ISC-1: `git -C .../99-Publication status` returns "On branch main, nothing to commit"
- [ ] ISC-2: `git -C .../99-Publication log --oneline` shows exactly one commit with message containing "baseline"
- [ ] ISC-3: Makefile contains the line `LAYOUT_STYLE ?= minimal`
- [ ] ISC-4: Makefile contains a conditional block selecting `HEADER_TEX` based on `LAYOUT_STYLE`
- [ ] ISC-5: `LAYOUT_STYLE=enhanced` resolves `HEADER_TEX` to `print-headers-enhanced.tex`
- [ ] ISC-6: `LAYOUT_STYLE=minimal` (or unset) resolves `HEADER_TEX` to `print-headers.tex`
- [ ] ISC-7: `make print` (no LAYOUT_STYLE) produces `build/band2-print.pdf` without error
- [ ] ISC-8: `make print LAYOUT_STYLE=enhanced` produces `build/band2-print.pdf` without error
- [ ] ISC-9: `templates/print-headers-enhanced.tex` exists
- [ ] ISC-10: `print-headers-enhanced.tex` contains `\usepackage{microtype}`
- [ ] ISC-11: `print-headers-enhanced.tex` contains `\usepackage{titlesec}`
- [ ] ISC-12: `print-headers-enhanced.tex` contains `\usepackage{pgfornament}`
- [ ] ISC-13: Enhanced PDF chapter headings differ visually from baseline (titlesec active)
- [ ] ISC-14: `fonts-ebgaramond` is installed (`dpkg -l fonts-ebgaramond` shows `ii`)
- [ ] ISC-15: Enhanced Makefile MAINFONT falls back gracefully if EB Garamond absent
- [ ] ISC-16: Anti: `make print` (baseline) output is byte-identical to pre-change build (original workflow unaffected)

## Test Strategy

| ISC | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| ISC-1 | filesystem | `git status` output | no unstaged changes | Bash |
| ISC-2 | filesystem | `git log --oneline` | 1 commit, "baseline" in message | Bash |
| ISC-3 | file content | `grep "LAYOUT_STYLE ?= minimal" Makefile` | match found | Bash/Grep |
| ISC-4 | file content | `grep -A5 "ifeq.*LAYOUT_STYLE" Makefile` | conditional block present | Bash |
| ISC-5 | logic | `make print LAYOUT_STYLE=enhanced -n` dry-run includes enhanced tex | HEADER_TEX path in output | Bash |
| ISC-6 | logic | `make print -n` dry-run includes original tex | HEADER_TEX path in output | Bash |
| ISC-7 | build | `make print` exit code | 0, PDF exists | Bash |
| ISC-8 | build | `make print LAYOUT_STYLE=enhanced` exit code | 0, PDF exists | Bash |
| ISC-9 | filesystem | `ls templates/print-headers-enhanced.tex` | file exists | Bash |
| ISC-10 | file content | `grep microtype templates/print-headers-enhanced.tex` | match | Bash |
| ISC-11 | file content | `grep titlesec templates/print-headers-enhanced.tex` | match | Bash |
| ISC-12 | file content | `grep pgfornament templates/print-headers-enhanced.tex` | match | Bash |
| ISC-13 | visual | Read PDF or grep LaTeX log for titlesec activation | titlesec loaded | Bash |
| ISC-14 | system | `dpkg -l fonts-ebgaramond` | `ii` status | Bash |
| ISC-15 | logic | Makefile MAINFONT for enhanced uses fallback chain | grep fallback logic | Bash |
| ISC-16 | regression | baseline `make print` produces same page count as before | pdfinfo pages match | Bash |
