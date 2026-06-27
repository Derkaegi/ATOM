---
task: PokerStories print image audit and action plan
slug: pokerstories-print-images-audit
effort: E2
phase: plan
progress: 0/8
mode: interactive
started: 2026-06-27
updated: 2026-06-27
---

## Problem
56 images in `images/print/` are destined for the KDP B&W paperback PDF of "The Virtual Gold Rush." The checklist mandates grayscale (not RGB) for print, and minimum 300 DPI. Currently 50 of 56 images remain in sRGB color, and 13 images are critically too small in pixel dimensions for acceptable print quality.

## Vision
Every image in the print folder is grayscale, has correct DPI metadata, and is either at acceptable quality or flagged with a clear Wayback replacement task — so the next `make print` produces a PDF that passes KDP preflight without image-related warnings.

## Goal
Convert all 50 sRGB images to grayscale, update DPI metadata on the 6 already-gray images, and produce a prioritized action list for the 13 critically-small images.

## Criteria

- [ ] ISC-1: All 56 images in images/print/ report colorspace=Gray
- [ ] ISC-2: All 56 images report resolution metadata of 300 DPI
- [ ] ISC-3: Critically-small images (13) are individually flagged with decision
- [ ] ISC-4: Low-res images (14) are individually flagged with recommendation
- [ ] ISC-5: Batch conversion command is documented and reproducible
- [ ] ISC-6: Action plan written to Obsidian MONAD
- [ ] ISC-7: Anti: No ebook/ images accidentally overwritten by conversion
- [ ] ISC-8: Anti: No images deleted — archive/ preserved as-is

## Test Strategy

| ISC | Type | Check |
|-----|------|-------|
| ISC-1 | CLI | `identify -format "%[colorspace]" images/print/*.png` → all Gray |
| ISC-2 | CLI | `identify -format "%[resolution.x]" images/print/*.png` → all 300 |
| ISC-3 | Read | Action plan lists all 13 with explicit decision per image |
| ISC-4 | Read | Action plan lists all 14 with explicit recommendation |
| ISC-5 | Read | Single `convert` command documented |
| ISC-6 | CLI | File exists at MONAD output path |
| ISC-7 | CLI | `diff -r images/ebook/ images/ebook.bak/` — ebook unchanged |
| ISC-8 | CLI | `ls images/archive/` count unchanged |
