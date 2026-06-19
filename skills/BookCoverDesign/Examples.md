# BookCoverDesign — Worked Example

## The Virtual Gold Rush (PokerStories, Herbert Okolowitz)

Real session output, used here as the canonical reference. Files live in
`~/Documents/MONAD/02-PROJECTS/PokerStories/Brand/Cover-Drafts/`.

### Brief

Cover needed to visually narrate the book's actual timeline (1999–April 2011) as a single
chart-line motif, not a generic abstract symbol:

| Phase | Years | Line behavior |
|-------|-------|----------------|
| 1 | 1999–2003 | Slow start — nearly flat, gentle slope |
| 2 | 2003–2008 | Absolute boom — steep exponential climb |
| 3 | 2008–2011 | Still growing, but less exponential — slope moderates |
| 4 | April 2011 | Black Friday — marked with a single solid black dot on the line |
| 5 | after the dot | Only a short cut-off stub hinting the crash — explicitly NOT a full mirrored decline |

Color: the entire line (including the post-dot stub) stays a single warm gold/amber — color
itself isn't what signals the crash here, the cut-off line shape is. (An earlier full-length
version used a gold→violet color transition across a full rise/fall — superseded once the brief
was refined to the more literal four-phase timeline with the dot.)

### Background prompt pattern that worked (1K, no defects)

```
Flat 2D vector-style digital illustration, portrait poster format, minimalist graphic design.
Pure solid near-black charcoal background color, perfectly flat and clean, no gradient, no
grain, no vignette, no haze. A single thin glowing line chart spans the frame from lower-left
to upper-right in four distinct phases: phase 1 (first short stretch) is nearly flat with only
a very gentle, slow upward slope, representing a slow start; phase 2 transitions into a steep,
dramatic exponential upward curve climbing sharply, representing explosive boom growth; phase 3
continues upward but bends to a more moderate, less steep angle, representing continued growth
that is slowing down; the line then reaches a peak marked clearly by one small solid black
filled circle/dot sitting exactly on the line; immediately after the dot, the line drops sharply
downward for only a very short segment, just a brief hint of a steep decline, and then the line
simply ends/is cut off there — do not draw a long falling line, no second half, no mirrored
crash, just a short stub pointing down after the dot. The entire line (all phases, including the
short stub after the dot) glows in a warm GOLD/amber color, consistent glow, sharp clean vector
edges, high contrast, ample empty negative space at the top and around the line, minimalist
poster art style, no lettering of any kind, no text, no numbers, no axis labels.
```

Generated with:
```bash
cd ~/.claude/skills/Media/Art/Tools
export $(grep -v '^#' ~/.env | grep GOOGLE_API_KEY)
bun run Generate.ts --model nano-banana-pro --prompt "<above>" \
  --size 1K --aspect-ratio 2:3 --output ~/Downloads/<name>.png
```

### Front cover compositing (title top-left, author bottom-right)

```bash
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
FONTR=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
convert background.jpg \
  -gravity NorthWest -fill white -font "$FONT" -pointsize 52 -annotate +50+70 "THE VIRTUAL\nGOLD RUSH" \
  -gravity NorthWest -fill "#FFD24C" -font "$FONTR" -pointsize 20 -annotate +50+210 "Inside the Golden Age\nof Online Poker" \
  -gravity SouthEast -fill "#515151" -font "$FONT" -pointsize 20 -annotate +50+40 "HERBERT OKOLOWITZ" \
  front-cover.jpg
```

### Back cover (plain background, no graph repeated — per Gotcha #4)

```bash
convert -size 848x1264 xc:"#0B0B0B" \
  -gravity NorthWest -fill "#515151" -font "$FONT" -pointsize 22 -annotate +50+60 "THE VIRTUAL GOLD RUSH" \
  -gravity NorthWest -fill white -font "$FONTR" -pointsize 19 -annotate +50+110 "<blurb text>" \
  -gravity West -fill "#FFD24C" -font "$FONT" -pointsize 18 -annotate +50+0 "<advance praise quote>" \
  -gravity SouthWest -fill "#515151" -font "$FONTR" -pointsize 15 -annotate +50+170 "<author bio>" \
  -gravity SouthWest -fill "#515151" -font "$FONT" -pointsize 16 -annotate +50+60 "POKERSTORIES" \
  -gravity NorthWest -fill white -draw "rectangle 568,1124 798,1214" \
  -gravity NorthWest -fill black -draw "rectangle 578,1134 586,1184" \
  ... \
  -gravity NorthWest -fill black -font "$FONTR" -pointsize 13 -annotate +578+1196 "ISBN 978-0-00-000000-0" \
  back-cover.jpg
```

(Barcode bars are plain black rectangles — a visual placeholder, not a scannable barcode. Disclose this.)

### Spine + full wraparound

```bash
convert -size 70x1264 xc:"#0B0B0B" \
  -gravity Center -fill white -font "$FONT" -pointsize 22 -annotate 90 "THE VIRTUAL GOLD RUSH" \
  spine.jpg

convert back-cover.jpg spine.jpg front-cover.jpg +append full-wraparound-spread.jpg
```

### Iteration discipline observed in this session

- v1 used a full gold→violet rise/crash line — generated, reviewed, presented to user with clear
  "placeholder typography" disclosure.
- User feedback refined the brief to the literal 1999–2011 four-phase timeline with a Black
  Friday dot and a deliberately truncated crash stub, and explicitly asked that the back cover
  NOT repeat the graph.
- Each iteration was regenerated from scratch (new background + new composite) rather than
  patched, because the underlying chart shape was structurally different each time — not a text/
  layout tweak.
