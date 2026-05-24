# Plan: Workflow-Verbesserungen nach erstem Build

## Context

Der erste vollständige Build (EPUB 226KB, PDF 250 Seiten, 6×9 in) hat 5 konkrete
Schwachstellen im Workflow offenbart. Dieser Plan behebt sie und ergänzt zwei neue
Make-Targets die den täglichen Umgang mit dem Manuskript verbessern.

---

## Festgestellte Probleme (in Priorität)

| # | Problem | Symptom | Status |
|---|---|---|---|
| 1 | Lua-Filter fehlt im EPUB-Build | `\n` im Text führt zu kaputtem Fließtext im Kindle | Nicht gefixed |
| 2 | Staler `epub-chapter-level: 1` in metadata-ebook.yml | Deprecated field, wird ignoriert, verwirrend | Nicht gefixed |
| 3 | Font-Erkennung hardcoded | Linux Libertine O fehlt → Error ohne Fallback | Nicht gefixed |
| 4 | Gutter-Margin falsch kommentiert | Sagt "700+ Seiten" aber PDF hat 250 → falscher Wert | Nicht gefixed |
| 5 | Kein `make lint` | Bekannte Content-Probleme (`\n`, Emojis, Google-Doc-IDs) unsichtbar | Fehlend |

---

## Änderungen

### 1. Makefile: Lua-Filter in EPUB-Build (ISC: Konsistenz EPUB/PDF)

```makefile
# In $(EPUB_OUT) target — nach --split-level=1 einfügen:
--lua-filter=$(TEMPLATES)/fix-literal-newlines.lua \
```

### 2. Makefile: Font-Auto-Erkennung mit Fallback

Oben im Makefile, neue Variable:

```makefile
# Font detection: Linux Libertine O preferred, Liberation Serif as fallback
MAINFONT := $(shell fc-list | grep -q "Linux Libertine O" && echo "Linux Libertine O" || echo "Liberation Serif")
SANSFONT  := $(shell fc-list | grep -q "Linux Biolinum O" && echo "Linux Biolinum O" || echo "DejaVu Sans")
```

In `$(PDF_OUT)` target ersetzen die hardcoded `--metadata mainfont` durch:

```makefile
--metadata mainfont="$(MAINFONT)" \
--metadata sansfont="$(SANSFONT)" \
```

### 3. metadata-ebook.yml: Stale field entfernen

`epub-chapter-level: 1` löschen (wird von Makefile via `--split-level=1` gehandelt).

### 4. metadata-print.yml: Gutter-Kommentar korrigieren

```yaml
# Gutter (inner margin) — adjust based on final page count:
# 150pp or less → 0.375in | 151-300pp → 0.5in | 301-500pp → 0.625in
# Current draft ~250pp → use 0.5in; update when final page count known
inner=0.5in
```

### 5. Makefile: `make lint` Target (neues Target)

Sucht nach bekannten Content-Problemen ohne Dateien zu verändern:

```makefile
lint:
    @echo "=== Linting chapter content ==="
    @echo "--- Literal \\n sequences (cause LaTeX errors) ---"
    @grep -rn '\\n' $(CHAPTERS_DIR) --include="*.md" | grep -v '```' || echo "None found ✓"
    @echo "--- Emoji in H1/H2 headings (PDF warnings) ---"
    @grep -rn '^#.*[📋🔄✓✗]' $(CHAPTERS_DIR) --include="*.md" || echo "None found ✓"
    @echo "--- Google Doc source leaks in YAML frontmatter ---"
    @grep -rn '^source:' $(CHAPTERS_DIR) --include="*.md" || echo "None found ✓"
    @echo "--- Scaffold placeholders ---"
    @grep -rln 'TODO\|PLACEHOLDER\|\[TBD\]' $(CHAPTERS_DIR) --include="*.md" || echo "None found ✓"
```

### 6. Makefile: `make info` Target (neues Target)

```makefile
info:
    @echo "=== PokerStories Band 2 — Manuscript Stats ==="
    @echo "Word counts per chapter:"
    @for f in $(CHAPTERS); do \
        wc -w "$$f" | awk '{printf "  %-50s %6s words\n", "$(notdir $$f)", $$1}'; \
    done
    @echo ""
    @echo "Total word count:"
    @cat $(CHAPTERS) | wc -w | awk '{printf "  %d words total\n", $$1}'
    @if [ -f $(PDF_OUT) ]; then \
        echo ""; \
        echo "Last build:"; \
        pdfinfo $(PDF_OUT) | grep -E "Pages|File size"; \
        ls -lh $(PDF_OUT); \
    fi
```

### 7. README.md: Gotchas-Sektion ergänzen

Am Ende von README.md anhängen:

```markdown
## Known Content Issues (do not fix in build — fix in source)

| Issue | Files | Fix |
|---|---|---|
| Literal `\n` in narrative text | `05-Tournaments.md:119` | Replace `\n\n` with actual blank line |
| `📋 Change Log` emoji in headings | Multiple chapters | Remove emoji from heading line |
| `source: Google Doc ...` in YAML | Chapter frontmatters | Remove `source:` field from frontmatter |
| `00-Title-Page.md` is draft | `01-Frontmatter/` | Replace with final title page before upload |

## Pandoc Gotchas (learned in production)

- `--metadata-file` does NOT override per-file YAML frontmatter. Use explicit `--metadata key=value` CLI flags for title/date.
- `epub-chapter-level` is deprecated in pandoc 3.x. Use `--split-level` instead.
- `setspace` package is incompatible with the memoir LaTeX class. Use memoir's `\setSpacing{}` or drop linestretch.
- Font names are case-sensitive in fontspec. `"Liberation Serif"` works; `"liberation serif"` fails.
```

---

## Verification

```bash
cd Band-2-Deep-Dive/99-Publication/

# 1. Lint runs clean (or shows known issues only)
make lint

# 2. Info shows word counts
make info

# 3. Both builds succeed
make all

# 4. PDF page size confirmed
pdfinfo build/band2-print.pdf | grep "Page size"
# Expected: 432 x 648 pts (= 6 x 9 in)

# 5. EPUB metadata confirmed
unzip -p build/band2-ebook.epub EPUB/content.opf | grep dc:title
# Expected: PokerStories Band 2: Inside the Machine
```

---

## Files to modify

| File | Change |
|---|---|
| `Makefile` | Font detection vars, Lua filter in EPUB, `lint` + `info` targets, CHAPTERS_DIR var |
| `metadata-ebook.yml` | Remove `epub-chapter-level: 1` |
| `metadata-print.yml` | Fix gutter comment + value (0.875in → 0.5in), remove hardcoded fonts (now in Makefile) |
| `README.md` | Append Gotchas + Known Content Issues sections |
