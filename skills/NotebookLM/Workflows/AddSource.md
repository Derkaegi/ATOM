# Workflow: Add Source

Add a source (URL, file, or text) to an existing notebook.

## Steps

1. If notebook not specified, run `list` first and ask user to pick one.

2. Add by source type:

**URL / YouTube:**
```bash
python3 ~/.claude/skills/NotebookLM/Tools/nlm.py add-url \
  --notebook NOTEBOOK_ID --url "URL" --wait
```

**File (PDF, Word, text):**
```bash
python3 ~/.claude/skills/NotebookLM/Tools/nlm.py add-file \
  --notebook NOTEBOOK_ID --path "/path/to/file" --wait
```

**Pasted text:**
```bash
python3 ~/.claude/skills/NotebookLM/Tools/nlm.py add-text \
  --notebook NOTEBOOK_ID --text "TEXT CONTENT" --title "Source Title" --wait
```

3. Confirm source ID and title returned.
