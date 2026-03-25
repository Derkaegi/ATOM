# Plan: Translate Leibniz Dissertation (DE → EN)

## Context
Translate Herbert Okolowitz's 2006 PhD dissertation "Virtualität bei G.W. Leibniz. Eine Retrospektive" (~64,000 words, 11,637-line LaTeX file) from German to English. This is Herbert's own work, so "his style" means preserving the dense, scholarly, citation-heavy academic philosophical register of the original. Goal: token-efficient pipeline using free APIs for bulk translation, Claude only for style-editing the core chapters, fully automated via cron.

---

## Document Profile
- **Source:** `/home/herbert/Documents/Virtualität bei Leibniz/Virtualität bei Leibniz. Eine Retrospektive.tex`
- **Encoding:** latin-1, 11,637 lines, ~595KB
- **Languages:** German body + Latin/French/Italian/Greek quotes (non-German MUST NOT be translated)
- **57 LaTeX errors:** mostly brace-balance and `\foreignlanguage` nesting issues from Writer2LaTeX conversion

### Chapter Scope for Translation
| Chapter | Lines | Action |
|---|---|---|
| Vorwort (Ch.0) | 287-327 | Machine-translate + Claude style-edit |
| Ch.1 Leibniz und Virtualität (8 sections) | 328-6517 | Machine-translate + Claude style-edit |
| Ch.2 Monadologie als Ontologie | 6518-7396 | Machine-translate + Claude style-edit |
| Ch.3 Quellen intro (~300 words) | 7397-7440 | Machine-translate + Claude style-edit (light) |
| Ch.3 Latin citation entries | 7441-10350 | Extract German annotations only, skip Latin quotes |
| Ch.4 Literatur (bibliography) | 10351-11477 | Skip (bibliographic entries) |
| Ch.5 Siglenverzeichnis | 11478-11637 | Skip (abbreviations list) |

---

## Pipeline Architecture

### Output Directory
```
~/Documents/Virtualität bei Leibniz/pipeline/
├── types.ts
├── utils/latex-parser.ts       # brace-depth scanner + placeholder system
├── utils/api-client.ts         # DeepL + MyMemory wrappers
├── utils/encoding.ts           # latin-1 handling
├── fix-latex-errors.ts         # Phase 0
├── extract-segments.ts         # Phase 1
├── translate-segments.ts       # Phase 2 (runs via cron)
├── reassemble.ts               # Phase 3
├── style-edit-claude.ts        # Phase 4 (Claude calls)
├── pipeline-runner.ts          # Orchestrator
├── state/                      # JSON checkpoint files
└── output/                     # dissertation-fixed.tex → dissertation-en.tex → dissertation-final.tex
```

---

## Phase 0: Fix LaTeX Errors (0 tokens)
**Script:** `fix-latex-errors.ts`

Targeted fixes for the 57 errors from the `.log` file:
- **22 × Extra }:** Merge adjacent `\foreignlanguage{ngerman}{}` with empty content; they create ghost brace groups
- **7 × Missing }:** Brace-balance scanner per paragraph block; append `}` at last safe position before `\chapter`/`\section`
- **3 × \begin{document} ended by \end{center}:** Title page (lines 192-284) has unclosed `\begin{center}`; add missing `\end{center}`
- **7 × Missing number:** Wrap `\textsuperscript{N}YEAR` as `{\textsuperscript{N}}YEAR`

Writes `state/error-fix-report.json` (audit of all changes), outputs `output/dissertation-fixed.tex`.

---

## Phase 1: Extract Segments (0 tokens)
**Script:** `extract-segments.ts`

Parses the fixed .tex into a JSON segment array using a **character-level brace-depth state machine** (not a full LaTeX parser):

```typescript
interface Segment {
  id: string;           // "seg_0001"
  type: 'german' | 'foreign' | 'latex_only' | 'skip';
  lang?: string;        // 'ngerman' | 'french' | 'latin' | 'italian' | 'greek'
  content: string;      // original LaTeX text
  plaintext?: string;   // German plain text with LaTeX replaced by placeholders
  placeholders: Map<string, string>;  // PLACEHOLDER_NN -> original LaTeX
  startLine: number;
  chapterId: number;    // 0-5
}
```

**Key extraction rules:**
- `{\selectlanguage{ngerman} ...}` and `\foreignlanguage{ngerman}{...}` → `type: 'german'`
- `\foreignlanguage{french/latin/italian/greek}{...}` → `type: 'foreign'` (pass through untouched)
- `\footnote{...}` content: extract German text, translate inline with parent segment
- Chapters 4+5: all segments marked `type: 'skip'`
- Ch.3 lines 7441+: foreign-language quote blocks marked `type: 'foreign'`; German annotation text remains `type: 'german'`

**Placeholder system:** Within German text, all LaTeX commands (`\textit{...}`, `\footnote{...}`, `\guillemotright`, etc.) are replaced with `PLACEHOLDER_NN` before sending to the API. Maps are saved in `state/segments.json`.

**Note on encoding:** Read file as `latin1`. Send only plaintext strings as UTF-8 to the HTTP API. Never decode `\"o`, `\"a`, etc. — keep them as LaTeX commands.

---

## Phase 2: Machine Translation (0 tokens, free API)
**Script:** `translate-segments.ts` — called by cron

**API Choice:** DeepL Free (preferred) or MyMemory with email registration
- **DeepL Free:** Register at deepl.com → 500K chars/month free, `DEEPL_API_KEY` in `~/.env`. 500K covers the entire dissertation (estimated ~200K translatable chars) with room to spare.
- **MyMemory fallback:** Register at mymemory.translated.net with `herboko@gmail.com` → 10M chars/month. Add `&de=herboko@gmail.com` to query string.

**Chunk strategy:**
- Short segments (< 500 chars): batch up to 4,500 chars/request, join with `\n\n[SEP]\n\n`, split response on `[SEP]`
- Long segments (> 4,500 chars): split at sentence boundaries, translate sub-parts, rejoin

**Checkpoint state (`state/translation-state.json`):**
```json
{
  "dailyCharsSent": 0,
  "dailyResetDate": "2026-03-25",
  "completedSegmentIds": [...],
  "translations": { "seg_0001": { "translatedText": "...", "translatedAt": "..." } },
  "translationComplete": false
}
```

**Rate limiting:** 1.5s delay between requests. Daily character counter resets by date. When `DAILY_LIMIT_REACHED`, exit with that code and notify via PAI notify script.

**Resume logic:** On startup, load state, skip already-completed segment IDs.

---

## Phase 3: Reassemble (0 tokens)
**Script:** `reassemble.ts`

1. Load `dissertation-fixed.tex` + `state/segments.json` + `state/translation-state.json`
2. For each segment in document order:
   - `type: skip/foreign/latex_only` → output original unchanged
   - `type: german` with translation → restore placeholders into translated text, output
   - `type: german` without translation → output original (partial run safety)
3. Strip `{\selectlanguage{ngerman} CONTENT }` wrappers → replace with just `CONTENT` (document is now English)
4. Keep `{\selectlanguage{french} ...}` and other non-German wrappers intact
5. Update title: `Virtualit\"at bei G.W. Leibniz` → `Virtuality in G.W. Leibniz`

Output: `output/dissertation-en.tex`

---

## Phase 4: Claude Style-Editing (~120K tokens total)
**Script:** `style-edit-claude.ts`

Processes machine-translated text section by section. Each call sends one `\section{}` block (~2,800-4,200 words) to Claude.

**System prompt (constant, ~400 tokens):**
> Academic philosophy editor. Correct machine-translation phrasing to fluent scholarly English. Maintain dense academic register. On FIRST occurrence: add German term in parentheses (e.g. "virtuality (*Virtualität*)"). Do NOT translate Latin/French/Italian/Greek passages. Do NOT modify LaTeX commands (`\textit{}`, `\footnote{}`, `\begin{quote}`). Return ONLY the edited LaTeX.

**13 calls scheduled:**

| Call | Section | Est. tokens (in+out) |
|---|---|---|
| 1 | Vorwort | ~1,100 |
| 2-9 | Ch.1 sections 1-8 | ~9,500 avg each = ~76,000 |
| 10-12 | Ch.2 sections 1-3 | ~7,000 avg each = ~21,000 |
| 13 | Ch.3 intro | ~1,200 |
| **Total** | | **~118,000 tokens** |

**State tracking:** `state/style-edit-state.json` — section IDs with timestamps. Script resumes from last incomplete section.

Output: `output/dissertation-final.tex`

---

## Orchestrator + Cron
**Script:** `pipeline-runner.ts`

Checks each stage's output file for existence; skips completed stages. On `DAILY_LIMIT_REACHED`, sends PAI notification and exits cleanly.

**Cron job** (add to crontab — nightly at 2 AM Barcelona time):
```
0 2 * * * cd "/home/herbert/Documents/Virtualität bei Leibniz/pipeline" && bun pipeline-runner.ts >> logs/pipeline.log 2>&1
```

**Notifications:** Uses `bun ~/.claude/skills/PAI/Tools/Notify.ts --title "..." --message "..."` at stage completion and on errors.

**Estimated timeline:**
- Day 0 (manual, ~30 min): Write scripts, run Phase 0+1 manually, verify, set cron
- Day 1 (automated): Phase 2 translates ~100K chars (first half)
- Day 2 (automated): Phase 2 finishes; Phase 3+4 run (~10 min total)
- Day 3: Final PDF compiled, done

---

## Prerequisites (before running)
1. **DeepL Free key:** Register at deepl.com/pro#developer → add `DEEPL_API_KEY=...` to `~/.env`
2. Run `pdflatex` on `dissertation-fixed.tex` to verify error reduction (should drop from 57 to ~0)

---

## Verification
1. `pdflatex output/dissertation-fixed.tex` — error count drops from 57 to 0
2. `grep -c "seg_" state/translation-state.json` matches total German segment count → 100% translated
3. Diff structure: `grep -c "\\\\chapter" output/dissertation-final.tex` == 5 (same as original)
4. `pdflatex output/dissertation-final.tex` → PDF compiles, ~250-300 pages
5. Spot-check 3 passages: Vorwort, Ch.1 Section 4 (Virtualität), Ch.2 Section 2 (Repräsentation)
6. Verify non-German quotes untouched: `grep -c "\\\\selectlanguage{french}" output/dissertation-final.tex` matches original count
