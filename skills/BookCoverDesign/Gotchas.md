# BookCoverDesign — Gotchas

Field-tested failure modes from real cover-generation sessions. Read before generating.

## 1. nano-banana-pro at `--size 2K` is broken for flat/vector backgrounds

Reliably produces a grey/noise band across the top ~15% of the frame plus garbled pseudo-text/circle artifacts and washed-out contrast. This happens **regardless of prompt wording** — tried with/without reference images, with/without requested baked-in text, with/without "vector-style flat 2D illustration" framing. None of it fixed it.

**Root cause:** resolution-dependent rendering defect in the model/pipeline, not a prompt problem.

**Fix:** generate at `--size 1K` instead. The identical prompt renders clean, sharp-edged, correct flat colors at 1K. Always default to 1K for flat/minimal/vector-poster backgrounds. Only try 2K if the user explicitly needs higher resolution and is willing to accept more generation attempts.

## 2. ImageMagick `-draw "rectangle x1,y1 x2,y2"` ignores active `-gravity` the way `-annotate` respects it

`-gravity SouthEast -draw "rectangle 0,0 220,90"` does **not** draw near the bottom-right corner — `-draw` with explicit numeric coordinates is interpreted as absolute canvas coordinates from the top-left, regardless of the gravity setting. Negative coordinates intended as "offset from the gravity corner" also do not work as you'd expect for `-draw`.

**Fix:** Always explicitly set `-gravity NorthWest` immediately before any `-draw "rectangle ..."` (or other absolute-coordinate draw call), and compute the coordinates yourself using `identify` to get the canvas's exact width/height first. Mixed sequences of `-gravity West -annotate ...` followed by `-draw ...` without resetting gravity will place the rectangle using the leftover gravity's interpretation, not absolute coordinates — this produced a stray white box in the wrong corner in an earlier draft. Reset gravity explicitly every time before a `-draw`.

## 3. Don't ask the AI model to render cover title text

Image models render typography poorly (garbled letters, wrong kerning, can't iterate cleanly). Always:
1. Generate background art with an explicit prompt instruction like "no lettering of any kind, no text, no numbers, no axis labels."
2. Composite the real title/subtitle/author afterward with ImageMagick `-annotate`, using a locally installed font.
3. If the brand's actual font (e.g., Montserrat) isn't installed on the system, use a reasonable substitute (e.g., DejaVu Sans Bold) and **say so explicitly** — never present placeholder typography as final.

## 4. Back cover should not repeat the front cover's hero graphic

If the front cover's signature visual element (chart line, symbol, illustration) is mirrored or reused on the back, it competes with the blurb text and dilutes the front cover's uniqueness. Default to a plain/flat background color (the brand's dominant color, e.g., Midnight `#0B0B0B`) for the back cover, and reserve the hero graphic exclusively for the front. Only repeat/echo it on the back if the user explicitly asks for visual continuity.

## 5. Always disclose placeholders

A "decent draft" mockup almost always contains stand-in content. Call out each of these explicitly when presenting results, don't let them pass as final:
- Font substitution (brand font not installed locally)
- Placeholder ISBN and barcode (the barcode is drawn as plain black/white rectangles — not a real scannable barcode)
- Placeholder blurb copy / advance-praise quotes
- Placeholder author bio text

## 6. Workflow order matters

1. Generate background(s) to `~/Downloads/` first (standard Art-skill staging convention), review with the Read tool (image preview) before moving anywhere permanent.
2. Composite text via ImageMagick onto the reviewed background.
3. Build the spine as its own small image: `convert -size <spine-width>x<H> xc:"<brand-color>" -gravity Center -fill white -font "<font>" -pointsize <n> -annotate 90 "<TITLE>" spine.jpg` (the `90` rotates the text vertically).
4. Assemble the full wraparound with `convert back.jpg spine.jpg front.jpg +append output.jpg` — order is back, then spine, then front (matches how a physical wraparound cover unfolds left to right when viewed from outside).
5. Save iteration drafts into the project's `Brand/Cover-Drafts/` (or equivalent) folder, not into the read-only reference/moodboard folder.
