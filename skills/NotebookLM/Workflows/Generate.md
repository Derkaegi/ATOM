# Workflow: Generate

Generate content artifacts from a notebook.

## Available Types

| Type | What it creates |
|------|----------------|
| `audio` | Audio deep-dive podcast (2 AI hosts discussing your sources) |
| `report` | Briefing document / blog post |
| `study-guide` | Study guide with key concepts |
| `quiz` | Multiple choice quiz |
| `flashcards` | Flashcard deck |
| `infographic` | Visual infographic |
| `mind-map` | Mind map JSON |
| `slide-deck` | Slide deck (PDF/PPTX) |

## Steps

1. If notebook not specified, run `list` and ask user to pick.
2. If type not specified, ask user which type to generate.

3. Run (add `--wait` to block until complete):
```bash
python3 ~/.claude/skills/NotebookLM/Tools/nlm.py generate \
  --notebook NOTEBOOK_ID --type TYPE --wait
```

4. Returns artifact ID. To download:
```bash
python3 ~/.claude/skills/NotebookLM/Tools/nlm.py download \
  --notebook NOTEBOOK_ID --artifact ARTIFACT_ID --out ~/Downloads/output.mp3
```

## Notes
- Audio generation typically takes 2-5 minutes; use `--wait` or check status via `artifacts`
- Default audio format is DEEP_DIVE (two-host conversation)
- Downloaded audio saves as MP3, reports as PDF
