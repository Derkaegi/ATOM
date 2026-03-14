# Workflow: Ask

Ask a question against a notebook's sources, get an answer with citations.

## Steps

1. If notebook not specified, run `list` and ask user to pick.

2. Run:
```bash
python3 ~/.claude/skills/NotebookLM/Tools/nlm.py ask \
  --notebook NOTEBOOK_ID --question "QUESTION"
```

3. Present the answer, then list citations as numbered sources below.
