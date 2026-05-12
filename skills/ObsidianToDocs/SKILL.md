---
name: ObsidianToDocs
description: Compile Obsidian markdown chapters into a single Google Doc via gws. USE WHEN obsidian to google docs, compile chapters, export manuscript, create combined document from markdown files, obsidian export, share manuscript, publish to drive, compile book chapters.
---

# ObsidianToDocs Skill

Compiles Obsidian markdown files into a single Google Doc in a specified Drive folder. Strips YAML frontmatter and Obsidian hashtag lines. Uses `gws docs` to create the Google Doc and inserts content in chunks via batchUpdate.

## When to Use

- User wants to compile Obsidian chapters/sections into one Google Doc
- User wants to share a manuscript or collection of notes via Google Drive
- User says "create combined document", "export to Google Docs", "compile chapters"
- User wants a shareable version of markdown files

## Prerequisites

- `gws` CLI authenticated at `~/.local/bin/gws`
- Source files are markdown in Obsidian format (YAML frontmatter + hashtag tags)
- Target Google Drive folder ID available

## Workflow

### Step 1: Collect source files and order

Ask the user (or infer from context):
- Which folder contains the chapters? (e.g., `~/Documents/MONAD/02-PROJECTS/ProjectName/`)
- What is the correct chapter order?
- What is the target Google Drive folder ID?
- What should the document be named?

For PokerStories: chapters are at `~/Documents/MONAD/02-PROJECTS/PokerStories/Book-Manuscript/02-Chapters/`.

### Step 2: Compile chapters to temp file

Use this Python pattern to strip frontmatter/tags and combine in order:

```python
import re, os

def strip_frontmatter_and_tags(text):
    # Strip YAML frontmatter (--- delimited block at start of file)
    text = re.sub(r'^---\n.*?^---\n', '', text, flags=re.DOTALL | re.MULTILINE)
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        stripped = line.strip()
        # Skip Obsidian hashtag-only lines (not headings — headings have space after #)
        if stripped and re.match(r'^(#[a-z0-9_-]+\s*)+$', stripped):
            continue
        # Skip version/status metadata lines
        if re.match(r'^\*\*Version:\*\*.*\*\*Last Updated:\*\*', stripped):
            continue
        if re.match(r'^\*\*Status:\*\*.*\*\*Word Count:\*\*', stripped):
            continue
        cleaned.append(line)
    result = re.sub(r'\n{4,}', '\n\n\n', '\n'.join(cleaned))
    return result.strip()

# Define chapter list: (label, relative_path) — None path = section header
chapters = [
    ("TITLE", None),
    ("Foreword", "Foreword/00-Foreword.md"),
    # ... add all chapters in order
]

output_parts = ["BOOK TITLE\n\n" + "="*60 + "\n"]
section_divider = "\n\n" + "─"*60 + "\n\n"

for label, relpath in chapters:
    if relpath is None:
        output_parts.append(f"\n{'='*60}\n{label.upper()}\n{'='*60}\n")
        continue
    filepath = os.path.join(BASE, relpath)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    cleaned = strip_frontmatter_and_tags(content)
    output_parts.append(section_divider + cleaned)

with open('/tmp/compiled-manuscript.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_parts))
```

### Step 3: Create Google Doc

```bash
gws docs documents create \
  --json '{"title": "Document Title Here"}'
# Save the returned documentId
```

### Step 4: Move to target folder

```bash
gws drive files update \
  --params '{"fileId": "DOCUMENT_ID", "addParents": "FOLDER_ID", "removeParents": "root", "fields": "id,parents"}'
```

### Step 5: Insert content in chunks (CRITICAL — handles large files)

**Note:** Always use the two-pass approach below. Mixing insertText + updateParagraphStyle in one line-by-line loop hits the Docs API write quota (429 error). Two passes keeps quota usage manageable.

The Google Docs batchUpdate has OS arg-length limits. Insert in **reverse chunk order** at index 1 so the final document order is correct.

```python
import json, subprocess

DOC_ID = "YOUR_DOCUMENT_ID"
CHUNK_SIZE = 30000  # chars per chunk

with open('/tmp/compiled-manuscript.txt', 'r', encoding='utf-8') as f:
    full_text = f.read()

# Split into chunks at newline boundaries
chunks = []
i = 0
while i < len(full_text):
    end = min(i + CHUNK_SIZE, len(full_text))
    if end < len(full_text):
        nl = full_text.rfind('\n', i, end)
        if nl > i:
            end = nl + 1
    chunks.append(full_text[i:end])
    i = end

# Insert in REVERSE order so chunk 1 ends up first
payload_file = '/tmp/gws_payload.json'
for chunk in reversed(chunks):
    payload = json.dumps({
        "requests": [{"insertText": {"text": chunk, "location": {"index": 1}}}]
    }, ensure_ascii=False)
    with open(payload_file, 'w', encoding='utf-8') as f:
        f.write(payload)
    cmd = f"gws docs documents batchUpdate --params '{{\"documentId\": \"{DOC_ID}\"}}' --json \"$(cat {payload_file})\""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Insert failed: {result.stderr}")
```

### Step 5b: Apply heading styles (Pass 2 — rate-limited)

After all text is inserted, read the document structure and apply heading styles:

```python
import json, subprocess, time

# Get paragraph structure (field mask limits response size)
params = json.dumps({
    "documentId": DOC_ID,
    "fields": "body.content(startIndex,endIndex,paragraph(elements(textRun(content))))"
})
r = subprocess.run(["gws", "docs", "documents", "get", "--params", params],
                   capture_output=True, text=True)
doc = json.loads(r.stdout)

HEADING_MAP = {
    "#### ": ("HEADING_4", 5), "### ": ("HEADING_3", 4),
    "## ":   ("HEADING_2", 3), "# ":   ("HEADING_1", 2),
}

heading_items = []
for element in doc["body"]["content"]:
    if "paragraph" not in element:
        continue
    text = "".join(el.get("textRun", {}).get("content", "")
                   for el in element["paragraph"].get("elements", []))
    start, end = element.get("startIndex", 1), element.get("endIndex", 1)
    for prefix, (style, plen) in HEADING_MAP.items():
        if text.startswith(prefix):
            heading_items.append((start, end, style, plen))
            break

# Sort REVERSE order — process end→start to avoid index shifting
heading_items.sort(key=lambda x: x[0], reverse=True)

all_reqs = []
for (start, end, style, plen) in heading_items:
    all_reqs.append({"updateParagraphStyle": {
        "range": {"startIndex": start, "endIndex": end},
        "paragraphStyle": {"namedStyleType": style},
        "fields": "namedStyleType"
    }})
    all_reqs.append({"deleteContentRange": {
        "range": {"startIndex": start, "endIndex": start + plen}
    }})

# Send in batches with sleep — stays under 300 write ops/minute quota
BATCH = 20
SLEEP = 4  # seconds between batches
for i in range(0, len(all_reqs), BATCH):
    batch = all_reqs[i:i+BATCH]
    gws_batch(batch)
    if i + BATCH < len(all_reqs):
        time.sleep(SLEEP)
```

**Rate limiting:** 20 requests per batch × 4s sleep = 300 requests/minute max. Never omit the sleep or you'll get 429 quota errors.

### Step 6: Verify

```bash
gws drive files list \
  --params '{"q": "\"FOLDER_ID\" in parents", "fields": "files(id,name,mimeType,webViewLink)"}'
```

Confirm the document is present with `mimeType: application/vnd.google-apps.document`.

## Key Patterns

**Reverse insertion:** Always insert chunks in reverse order at index 1. Inserting at index 1 prepends to document body, so last chunk first gives correct final order.

**Chunk size:** 30,000 chars per chunk stays well under OS argument limits (~2MB) even with JSON escaping overhead.

**YAML frontmatter detection:** The `^---\n.*?^---\n` pattern with DOTALL strips the frontmatter block. Only strips the FIRST such block (file start).

**Obsidian tag lines:** Pattern `^(#[a-z0-9_-]+\s*)+$` matches lines that are ONLY hashtags (no heading space). This preserves `## Heading` lines.

## PokerStories Defaults

For the PokerStories book manuscript:
- Source: `~/Documents/MONAD/02-PROJECTS/PokerStories/Book-Manuscript/02-Chapters/`
- Folder: `1ZwnvZcdmlNYNFS8kFuwISmUNjCIzHxYQ`
- Chapter order: Foreword, About-the-Authors, Part-1 (01-05a-05), Part-2 (06-07-07a-07b-08-08a-09-09a-10-11), Epilogue
- Exclude: Archive/, 00-Admin/, 01-Research/, 03-Index/, 05-Process/, Assets/
