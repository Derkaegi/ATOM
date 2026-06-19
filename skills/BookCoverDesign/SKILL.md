---
name: BookCoverDesign
description: Generate book cover mockups (front/back/spine wraparound) via nano-banana-pro background art + ImageMagick text compositing. USE WHEN "book cover", "cover mockup", "wraparound cover", "create cover draft", "back cover".
---

# BookCoverDesign

Produces draft book cover mockups: AI-generated background art (no text baked in) plus ImageMagick-composited title/subtitle/author typography, assembled into front, back, and full wraparound spread images.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| "create a cover", "cover mockup", "front cover" | `Workflows/GenerateCover.md` |
| "back cover", "wraparound", "full spread" | `Workflows/GenerateCover.md` (covers back + spine + spread too) |

## Quick Reference

- Generate background art at **1K**, never 2K (see Gotchas) — request NO lettering/text in the image prompt.
- Composite all typography afterward with ImageMagick `-annotate` — the AI model cannot render clean text.
- Always `-gravity NorthWest` before any `-draw "rectangle ..."` using absolute coordinates.
- Back cover background should be plain/flat — don't repeat the front's hero graphic.
- Always tell the user which elements are placeholders (font, blurb, ISBN/barcode, quotes).

**Full Documentation:**
- Field-tested failure modes and fixes: `Gotchas.md`
- Worked reference case (Virtual Gold Rush / PokerStories): `Examples.md`
