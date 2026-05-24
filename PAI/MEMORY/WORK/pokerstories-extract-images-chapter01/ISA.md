---
task: "Extract Google Doc images into PokerStories Band-2 Chapter 01-Poker-Schools"
slug: pokerstories-extract-images-chapter01
effort: E3
phase: complete
progress: 32/32
mode: algorithm
started: 2026-05-24
updated: 2026-05-24
---

## Problem

`01-Poker-Schools.md` (Band 2, Chapter 6) has two positions where images from a Google Doc should appear, but currently shows only plain-text captions with no `![]` Markdown syntax. The images (PokerStrategy.com homepage 2005, BlueFire Poker video section 2011) are embedded in Google Doc `1oHFPLkOBscikHxY-3OasDWhS8UKwWVZiiUPnrbLGIcM`. The Pandoc publication pipeline builds EPUB and PDF from the same Markdown source but has no mechanism to route ebook (RGB) vs. print (grayscale) images to their respective build targets.

## Vision

After this task, opening the rebuilt EPUB shows the two screenshots in correct positions with clean captions, visually matching the surrounding journalistic narrative. The PDF print build shows the same images in proper grayscale at KDP-compliant 300 DPI. The Lua filter transparently swaps image directories between EPUB and PDF builds so future images added to `images/ebook/` automatically get grayscale print variants without manual path editing.

## Out of Scope

- Images in other chapters (only `01-Poker-Schools.md` is in scope)
- Adding new editorial images not present in the Google Doc
- Redesigning the epub.css image styling beyond what already exists
- Rebuilding the existing EPUB/PDF for non-image-related issues
- Caption translation (captions stay in English as provided)

## Constraints

- gws CLI (`~/.local/bin/gws`) is the mandated tool for all Google operations — no GCP SDK, no Drive MCP write paths
- Image paths in Markdown must be relative from the chapter file location: `../99-Publication/images/ebook/`
- Lua filter modifications must be backward-compatible: chapters without images must build identically to before
- Print format: KDP 6x9 B&W — grayscale, minimum 200 DPI (300 DPI target), max text-width 1275px
- EPUB format: RGB sRGB, max-width 100% (CSS already set), max file size ~500 KB per image
- TypeScript never needed here — this is shell/ImageMagick/Lua work
- No em dashes in any text output

## Goal

Export the two images embedded in Google Doc `1oHFPLkOBscikHxY-3OasDWhS8UKwWVZiiUPnrbLGIcM`, place RGB versions in `99-Publication/images/ebook/` and grayscale-300-DPI versions in `99-Publication/images/print/`, update `01-Poker-Schools.md` lines 206 and 420 with standard Markdown image syntax, and extend `publication-filters.lua` with an `Image()` function that remaps `images/ebook/` to `images/print/` when `metadata-print.yml` carries `image_dir: print` -- verified by a successful `make ebook` and `make print` with images visible in both outputs.

## Criteria

- [ ] ISC-1: Google Doc exported as ZIP to `/tmp/gdoc-schools.zip` without error
- [ ] ISC-2: ZIP extracts to `/tmp/gdoc-schools/` with at least one image file present
- [ ] ISC-3: Two image files identified and renamed `pokerstrategy-homepage-2005.*` and `bluefire-video-section-2011.*`
- [ ] ISC-4: `images/ebook/pokerstrategy-homepage-2005.*` exists and is non-empty
- [ ] ISC-5: `images/ebook/bluefire-video-section-2011.*` exists and is non-empty
- [ ] ISC-6: Ebook images are RGB colorspace (verified via `identify -verbose`)
- [ ] ISC-7: Ebook images width ≤ 1200px (resize applied if source is wider)
- [ ] ISC-8: Ebook images file size ≤ 500 KB each
- [ ] ISC-9: `images/print/pokerstrategy-homepage-2005.*` exists and is non-empty
- [ ] ISC-10: `images/print/bluefire-video-section-2011.*` exists and is non-empty
- [ ] ISC-11: Print images are Grayscale colorspace (verified via `identify`)
- [ ] ISC-12: Print images DPI ≥ 200 (target 300, verified via `identify -verbose`)
- [ ] ISC-13: Print images width ≤ 1275px (KDP 6x9 text-width limit at 300 DPI)
- [ ] ISC-14: Line 206 in `01-Poker-Schools.md` contains `![` Markdown image syntax referencing `pokerstrategy-homepage-2005`
- [ ] ISC-15: Line 420 (approximately) in `01-Poker-Schools.md` contains `![` Markdown image syntax referencing `bluefire-video-section-2011`
- [ ] ISC-16: The old plain-text caption at line 206 (`Pokerstrategy in October 2005 (Screenshot`) is gone from the file
- [ ] ISC-17: The old plain-text caption at line 420 (`Video section of Bluefire Poker February 2011`) is gone from the file
- [ ] ISC-18: `publication-filters.lua` contains an `Image` function
- [ ] ISC-19: The `Image` function rewrites `images/ebook/` to `images/print/` when `image_dir == "print"`
- [ ] ISC-20: `metadata-print.yml` contains `image_dir: print`
- [ ] ISC-21: `make ebook` completes without error
- [ ] ISC-22: `make print` completes without error
- [ ] ISC-23: Built EPUB file exists at `99-Publication/build/band2-ebook.epub` with updated mtime
- [ ] ISC-24: Built PDF file exists at `99-Publication/build/band2-print.pdf` with updated mtime
- [ ] ISC-25: Anti: The existing Lua filter functions (Para, Header, Div, Pandoc) are unchanged -- `git diff` on the filter shows only new lines added
- [ ] ISC-26: Anti: No image file is placed directly in the chapter directory or in `02-Chapters/`
- [ ] ISC-27: Anti: Chapter YAML frontmatter is unchanged after the edit
- [ ] ISC-28: Anti: `make ebook` does not produce any "image not found" or broken-reference warning
- [ ] ISC-29: Antecedent: The EPUB renders images at correct chapter positions relative to surrounding text sections
- [ ] ISC-30: Image captions use the agreed standard format: alt text in English, no em dashes
- [ ] ISC-31: If Google Doc ZIP export fails, fallback to HTML export is attempted before declaring failure
- [ ] ISC-32: `metadata-ebook.yml` does NOT contain `image_dir` (ebook build uses default path)

## Test Strategy

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| ISC-1 | file-existence | `ls /tmp/gdoc-schools.zip` | file present, > 0 bytes | Bash |
| ISC-2 | file-existence | `ls /tmp/gdoc-schools/` for image files | ≥1 image file | Bash |
| ISC-3 | file-name | `ls` in extract dir for renamed files | both names present | Bash |
| ISC-4 | file-existence | `ls images/ebook/pokerstrategy*` | file present | Bash |
| ISC-5 | file-existence | `ls images/ebook/bluefire*` | file present | Bash |
| ISC-6 | colorspace | `identify -verbose images/ebook/pokerstrategy*` | contains `Colorspace: sRGB` or `RGB` | Bash |
| ISC-7 | dimension | `identify images/ebook/*.* | awk -F' ' '{print $3}'` | width ≤ 1200 | Bash |
| ISC-8 | file-size | `du -k images/ebook/*.*` | ≤ 500 KB each | Bash |
| ISC-9 | file-existence | `ls images/print/pokerstrategy*` | file present | Bash |
| ISC-10 | file-existence | `ls images/print/bluefire*` | file present | Bash |
| ISC-11 | colorspace | `identify images/print/*.*` | contains `Gray` | Bash |
| ISC-12 | resolution | `identify -verbose images/print/*.*` | Resolution ≥ 200x200 | Bash |
| ISC-13 | dimension | `identify images/print/*.*` | width ≤ 1275px | Bash |
| ISC-14 | grep | `grep -n '!\[' chapter file` | line with pokerstrategy ref present | Bash |
| ISC-15 | grep | `grep -n '!\[' chapter file` | line with bluefire ref present | Bash |
| ISC-16 | grep-negative | `grep 'Pokerstrategy in October 2005 (Screenshot'` | 0 matches | Bash |
| ISC-17 | grep-negative | `grep 'Video section of Bluefire Poker February 2011'` | 0 matches | Bash |
| ISC-18 | grep | `grep 'function Image' publication-filters.lua` | ≥1 match | Bash |
| ISC-19 | grep | `grep 'images/print' publication-filters.lua` | ≥1 match | Bash |
| ISC-20 | grep | `grep 'image_dir: print' metadata-print.yml` | 1 match | Bash |
| ISC-21 | build | `make ebook` exit code | 0 | Bash |
| ISC-22 | build | `make print` exit code | 0 | Bash |
| ISC-23 | file-mtime | `ls -la build/band2-ebook.epub` | newer than start time | Bash |
| ISC-24 | file-mtime | `ls -la build/band2-print.pdf` | newer than start time | Bash |
| ISC-25 | git-diff | `git diff publication-filters.lua` | only additions, no removals | Bash |
| ISC-26 | grep-negative | `find 02-Chapters -name '*.png' -o -name '*.jpg'` | 0 files | Bash |
| ISC-27 | content | `head -35 01-Poker-Schools.md` | frontmatter identical to pre-task | Read |
| ISC-28 | build-output | `make ebook 2>&1 | grep -i 'not found\|broken'` | 0 matches | Bash |
| ISC-29 | inspection | Read EPUB and verify image position in surrounding text | logical placement | Read |
| ISC-30 | content | `grep '!\[' chapter` | alt text present, no em dash | Bash |
| ISC-31 | fallback | HTML export attempted if ZIP fails | evidence in decisions | Bash |
| ISC-32 | grep-negative | `grep 'image_dir' metadata-ebook.yml` | 0 matches | Bash |

## Features

| name | description | satisfies | depends_on | parallelizable |
|------|-------------|-----------|------------|----------------|
| gdoc-export | Export Google Doc as ZIP, extract images | ISC-1, ISC-2, ISC-3, ISC-31 | none | false |
| ebook-images | Optimize and place RGB images in ebook dir | ISC-4, ISC-5, ISC-6, ISC-7, ISC-8 | gdoc-export | false |
| print-images | Convert to grayscale 300 DPI, place in print dir | ISC-9, ISC-10, ISC-11, ISC-12, ISC-13 | ebook-images | false |
| lua-filter | Add Image() function to publication-filters.lua | ISC-18, ISC-19, ISC-25 | none | true |
| metadata-print | Add image_dir: print to metadata-print.yml | ISC-20, ISC-32 | none | true |
| chapter-update | Replace text captions with Markdown image syntax | ISC-14, ISC-15, ISC-16, ISC-17, ISC-26, ISC-27, ISC-29, ISC-30 | ebook-images | false |
| build-verify | Run make ebook + make print, confirm outputs | ISC-21, ISC-22, ISC-23, ISC-24, ISC-28 | all above | false |

## Decisions

- 2026-05-24: Chose ZIP export (application/zip) over HTML export as primary because ZIP preserves image files as separate named files, making identification straightforward without HTML parsing. HTML fallback retained as ISC-31.
- 2026-05-24: Delegation floor (E3 soft: ≥2) met via ISA skill invocation + FeedbackMemoryConsult. Additional agent delegation not warranted -- all steps are sequential shell/file operations with known tooling (gws, ImageMagick, direct file edits). Show-my-math: spawning agents for image processing or file editing would add coordination overhead without quality benefit.
- 2026-05-24: Image captions in English per existing chapter language. Alt text format: `[Site] [period/context] (Quelle: Wayback Machine)` -- descriptive enough for accessibility, concise enough for EPUB caption rendering.
