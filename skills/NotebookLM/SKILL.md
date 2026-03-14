---
name: NotebookLM
description: Google NotebookLM automation — create notebooks, add sources (URL/PDF/text/YouTube), ask questions with citations, generate audio deep-dives/podcasts, reports, quizzes, flashcards, study guides, mind maps, infographics. USE WHEN notebooklm, notebook, audio overview, deep dive, podcast, source research, add to notebook, ask notebook, generate audio, generate report, generate quiz.
---

# NotebookLM

**Tool:** `python3 ~/.claude/skills/NotebookLM/Tools/nlm.py <subcommand>`

**Auth required:** Run `python3 ~/.claude/skills/NotebookLM/Tools/nlm.py login` once to authenticate.

## Workflow Routing

| Trigger | Workflow | File |
|---------|----------|------|
| list notebooks, show notebooks, my notebooks | **List** | `Workflows/List.md` |
| create notebook, new notebook | **Create** | `Workflows/Create.md` |
| add source, add URL, add PDF, add file, add text, add to notebook, add YouTube | **AddSource** | `Workflows/AddSource.md` |
| ask, question, what does notebook say, chat | **Ask** | `Workflows/Ask.md` |
| generate audio, podcast, deep dive, generate report, generate quiz, flashcards, study guide, infographic, mind map | **Generate** | `Workflows/Generate.md` |

## Quick Reference — CLI Subcommands

```bash
NLM="python3 ~/.claude/skills/NotebookLM/Tools/nlm.py"

$NLM list
$NLM create --title "My Research"
$NLM sources --notebook NOTEBOOK_ID
$NLM artifacts --notebook NOTEBOOK_ID
$NLM add-url --notebook ID --url https://... [--wait]
$NLM add-file --notebook ID --path /path/to/file.pdf [--wait]
$NLM add-text --notebook ID --text "..." --title "My Note" [--wait]
$NLM ask --notebook ID --question "What are the key findings?"
$NLM generate --notebook ID --type audio [--wait]
$NLM generate --notebook ID --type report [--wait]
$NLM generate --notebook ID --type quiz [--wait]
$NLM generate --notebook ID --type flashcards [--wait]
$NLM generate --notebook ID --type study-guide [--wait]
$NLM generate --notebook ID --type infographic [--wait]
$NLM generate --notebook ID --type mind-map [--wait]
$NLM generate --notebook ID --type slide-deck [--wait]
$NLM download --notebook ID --artifact ARTIFACT_ID --out /path/to/file
```

## Examples

**Example 1: Research pipeline**
```
User: "Create a NotebookLM notebook from this article and generate an audio deep dive"
→ Invokes Create + AddSource + Generate workflows
```

**Example 2: Ask questions**
```
User: "Ask my NotebookLM notebook about the main conclusions"
→ Invokes Ask workflow
```

**Example 3: Generate study materials**
```
User: "Generate a quiz from my notebook"
→ Invokes Generate workflow with type=quiz
```

## Authentication

First-time setup:
```bash
python3 ~/.claude/skills/NotebookLM/Tools/nlm.py login
```
This opens a browser window. Log in with Herbert's Google account (`herboko@googlemail.com`). Auth saved to `~/.notebooklm/storage_state.json`.
