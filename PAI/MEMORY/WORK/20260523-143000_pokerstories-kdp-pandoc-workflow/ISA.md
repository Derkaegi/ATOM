---
task: "Build Pandoc KDP publication workflow for PokerStories Band 2"
slug: 20260523-143000_pokerstories-kdp-pandoc-workflow
effort: E3
effort_source: classifier
phase: build
progress: 32/36
mode: interactive
started: 2026-05-23T14:30:00Z
updated: 2026-05-23T14:30:00Z
---

## Problem

PokerStories Band 2 (Inside the Machine, ~65K words, English, publication target Aug-Sept 2026) has no build system. The manuscript exists as ~15 Markdown files in `Band-2-Deep-Dive/` but there is no way to produce a KDP-ready EPUB or print PDF from them. Every output format must be manually assembled. The ideal state requires a single `make ebook` or `make print` command that produces a fully structured, KDP-compliant artifact.

## Vision

Herbert types `make all` in a terminal, two files appear in `build/`: a validated EPUB ready to upload to KDP Kindle, and a print PDF laid out as a 6x9 trade paperback with proper typography. Both files reflect the current state of the manuscript with no manual editing required. Running the build for the first time reveals exactly where the manuscript is — what's complete, what's skeletal — making the remaining publication work concrete and scoped.

## Out of Scope

- Cover image creation or design (cover is a separate deliverable)
- Actual KDP upload or publishing
- Band 1 workflow (same structure will apply later, but not built now)
- AI upscaling of screenshots (research confirmed it degrades text; ship with native resolution)
- Color interior (B&W confirmed, ~5x cheaper per page)
- mcp-pandoc MCP server integration (the Makefile/shell approach is more portable and reproducible than an MCP daemon; mcp-pandoc noted for reference only)
- German language support (Band 2 is English)
- Font subsetting or PDF/X compliance (standard KDP PDF is sufficient)

## Principles

- Source files are never modified by the build system — the Makefile is read-only over all .md sources.
- Reproducible by design — any machine with pandoc + xelatex can run `make all` with identical output.
- Separation of concerns — EPUB and print paths share source files but use independent metadata and templates.
- Fail audibly — build errors surface immediately; no silent partial outputs.

## Constraints

- Trim size: 6x9 in (152.4 × 228.6 mm) — KDP Trade Paperback standard, confirmed by user.
- Interior: Black & White — confirmed by user, mandatory for cost-efficiency.
- Language: English — `lang: en`, XeLaTeX babel English hyphenation.
- PDF engine: XeLaTeX — required for Unicode + font flexibility.
- EPUB target: EPUB 3 — KDP requires EPUB 3 (not EPUB 2).
- Chapter source files must remain in their current locations; the build directory is the only write target.
- Pandoc version: 3.x or later (native EPUB 3 support).

## Goal

Create a self-contained build system in `Band-2-Deep-Dive/99-Publication/` that converts the existing Band 2 Markdown sources into a KDP-ready EPUB and a 6x9 B&W print PDF, and run a test build to reveal the current manuscript state.

## Criteria

- [x] ISC-1: Directory `Band-2-Deep-Dive/99-Publication/` exists on disk
- [x] ISC-2: Directory `99-Publication/images/print/` exists
- [x] ISC-3: Directory `99-Publication/images/ebook/` exists
- [x] ISC-4: Directory `99-Publication/build/` exists
- [x] ISC-5: File `99-Publication/Makefile` exists
- [x] ISC-6: `make ebook` target is defined in Makefile (grep confirms)
- [x] ISC-7: `make print` target is defined in Makefile (grep confirms)
- [x] ISC-8: `make validate` target is defined in Makefile (grep confirms)
- [x] ISC-9: `make all` target is defined in Makefile (grep confirms)
- [x] ISC-10: File `99-Publication/metadata-ebook.yml` exists
- [x] ISC-11: File `99-Publication/metadata-print.yml` exists
- [x] ISC-12: `metadata-ebook.yml` contains `lang: en`
- [x] ISC-13: `metadata-print.yml` contains `documentclass: memoir`
- [x] ISC-14: File `99-Publication/chapter-order.txt` exists
- [x] ISC-15: `chapter-order.txt` lists all Band 2 chapter files in reading order
- [x] ISC-16: All file paths in `chapter-order.txt` resolve to existing files on disk (build succeeded with all 15 files)
- [x] ISC-17: File `99-Publication/templates/book.latex` exists
- [x] ISC-18: `book.latex` contains `\documentclass{memoir}` or `memoir` class reference
- [x] ISC-19: `book.latex` contains 6x9 geometry (`6in` and `9in`)
- [x] ISC-20: `book.latex` contains header/footer configuration (pagestyle)
- [x] ISC-21: File `99-Publication/templates/epub.css` exists
- [x] ISC-22: `epub.css` contains at least body and heading font-size rules
- [x] ISC-23: File `99-Publication/README.md` exists
- [x] ISC-24: `README.md` documents all make targets and dependency install commands
- [x] ISC-25: `make ebook` completes without fatal pandoc errors (exit code 0 or known missing-dep warning only)
- [x] ISC-26: File `99-Publication/build/band2-ebook.epub` exists after `make ebook`
- [x] ISC-27: `build/band2-ebook.epub` is larger than 50KB — actual: 226KB
- [x] ISC-28: EPUB contains correct title metadata — `PokerStories Band 2: Inside the Machine` confirmed via `unzip -p content.opf`
- [x] ISC-29: EPUB toc.ncx or nav.xhtml contains chapter entries — 147 TOC links confirmed
- [ ] ISC-30: `make print` completes without fatal XeLaTeX errors — DEFERRED: xelatex not installed
- [ ] ISC-31: File `99-Publication/build/band2-print.pdf` exists after `make print` — DEFERRED
- [ ] ISC-32: `build/band2-print.pdf` is larger than 200KB — DEFERRED
- [ ] ISC-33: PDF page count is > 50 (pdfinfo or grep confirms) — DEFERRED
- [x] ISC-34: Anti: No source .md file in Band-2-Deep-Dive/ has its mtime changed by the build
- [x] ISC-35: Anti: `metadata-print.yml` does not contain `a4paper` or `letter` (wrong paper size)
- [x] ISC-36: Anti: `make ebook` does not produce output in the source chapter directories (only in build/)

## Features

| name | description | satisfies | depends_on | parallelizable |
|---|---|---|---|---|
| folder-structure | Create 99-Publication/ with images/print, images/ebook, build, templates subdirs | ISC-1,2,3,4 | — | false |
| chapter-order | Create chapter-order.txt listing all Band 2 .md files in reading order | ISC-14,15,16 | folder-structure | false |
| metadata-ebook | Create metadata-ebook.yml with EPUB 3 KDP metadata | ISC-10,12 | folder-structure | true |
| metadata-print | Create metadata-print.yml with 6x9 memoir geometry | ISC-11,13,35 | folder-structure | true |
| latex-template | Create templates/book.latex memoir-class template for 6x9 B&W | ISC-17,18,19,20 | folder-structure | true |
| epub-css | Create templates/epub.css for Kindle typographic styling | ISC-21,22 | folder-structure | true |
| makefile | Create Makefile with ebook, print, validate, all targets | ISC-5,6,7,8,9 | chapter-order,metadata-ebook,metadata-print,latex-template,epub-css | false |
| readme | Create README.md with workflow documentation | ISC-23,24 | makefile | false |
| test-build-epub | Run `make ebook` and verify EPUB output | ISC-25,26,27,28,29,34,36 | makefile | false |
| test-build-print | Run `make print` and verify PDF output | ISC-30,31,32,33 | makefile | false |

## Test Strategy

| isc | type | check | threshold | tool |
|---|---|---|---|---|
| ISC-1..4 | filesystem | directory exists | present | Bash: ls |
| ISC-5..9 | filesystem + grep | file exists, target names present | exact match | Read + grep |
| ISC-10..13 | filesystem + grep | file exists, key fields present | exact match | Read |
| ISC-14..16 | filesystem + content | file exists, all paths resolve | all paths exist | Read + Bash ls |
| ISC-17..20 | filesystem + grep | file exists, key LaTeX macros present | exact match | Read + grep |
| ISC-21..22 | filesystem + grep | file exists, CSS rules present | exact match | Read |
| ISC-23..24 | filesystem + grep | file exists, targets documented | present | Read |
| ISC-25..29 | execution + inspection | make ebook runs, EPUB file > 50KB, metadata match | exit 0 / file size / grep in zip | Bash |
| ISC-30..33 | execution + inspection | make print runs, PDF > 200KB, page count > 50 | exit 0 / file size / pdfinfo | Bash |
| ISC-34 | filesystem | mtime of source .md files unchanged | no newer mtime | Bash: find -newer |
| ISC-35 | grep | no a4paper/letter in print metadata | grep returns empty | grep |
| ISC-36 | filesystem | no .epub in chapter directories | find returns empty | find |
