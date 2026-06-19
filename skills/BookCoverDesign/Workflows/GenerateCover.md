# GenerateCover Workflow

Produces front cover, back cover, spine, and full wraparound spread mockups for a book.

## Inputs needed from the user (ask if missing)

- Real book title + subtitle (don't proceed with a placeholder title if the real one is known —
  ask before generating final mockups)
- Author name
- Brand colors (background, accent, secondary text) — check for an existing brand/style guide
  in the project first
- A visual concept for the hero graphic (symbol, chart, illustration) — if narrative-driven
  (e.g. "the line should show X happening"), get the exact shape/behavior described, phase by
  phase if it's a chart
- Blurb/back-cover copy, advance-praise quote, author bio, ISBN — if not supplied, generate
  clearly-labeled placeholder text and disclose it

## Steps

1. **Check environment.** Confirm `GOOGLE_API_KEY` is set in `~/.env` (required for
   nano-banana-pro). If missing, stop and tell the user — don't fabricate a result.

2. **Generate background art at 1K** (see `../Gotchas.md` #1 — 2K is broken for flat/vector
   backgrounds). Prompt must explicitly exclude lettering/text/numbers. Use
   `~/.claude/skills/Media/Art/Tools/Generate.ts --model nano-banana-pro --size 1K
   --aspect-ratio 2:3 --output ~/Downloads/<name>.png`. Save to `~/Downloads/` first.

3. **Review the background** with the Read tool (image preview) before compositing anything.
   If it's noisy, garbled, or off-brief, regenerate — don't composite text on top of a flawed
   background hoping it'll look fine.

4. **Composite the front cover** with ImageMagick `-annotate` calls for title, subtitle, author.
   Reset `-gravity` explicitly before each annotate/draw call (see Gotchas #2).

5. **Composite the back cover** on a plain/flat background (Gotchas #4) with blurb, quote,
   author bio, publisher wordmark, and a placeholder ISBN/barcode block.

6. **Build the spine** as a separate small image (brand background color, vertically rotated
   title text via `-annotate 90`).

7. **Assemble the full wraparound**: `convert back.jpg spine.jpg front.jpg +append spread.jpg`.

8. **Review every output** with the Read tool before presenting to the user.

9. **Present results with an explicit placeholder disclosure** (font, ISBN/barcode, blurb copy,
   advance praise quote) — never imply a draft is print-ready.

10. **Save all outputs into the project's `Brand/Cover-Drafts/` folder** (or equivalent draft
    folder) — never into a read-only reference/moodboard folder.

## When the user gives design feedback on an existing draft

Don't patch text in place if the feedback changes the underlying graphic's structure (e.g. "the
line should show four growth phases and a crash marker" instead of "move the title up"). Treat a
structural visual change as a full regeneration: new background prompt → new review → new
composite → new wraparound. Reserve in-place ImageMagick edits for genuinely cosmetic feedback
(text placement, color tweak, font size).
