# Workflow: Create Notebook

Create a new notebook, optionally adding sources immediately.

## Steps

1. Create the notebook:
```bash
python3 ~/.claude/skills/NotebookLM/Tools/nlm.py create --title "TITLE"
```
Save the returned `id`.

2. If sources provided (URLs, files, text), add each:
```bash
python3 ~/.claude/skills/NotebookLM/Tools/nlm.py add-url --notebook ID --url URL --wait
python3 ~/.claude/skills/NotebookLM/Tools/nlm.py add-file --notebook ID --path /path/to/file --wait
```

3. Confirm: show notebook ID + title + sources added.
