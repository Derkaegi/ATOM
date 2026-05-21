# PokerStories AddChapter Workflow

Add a new chapter or excursus card to the Book Pipeline board.

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running AddChapter in PokerStories"}' \
  > /dev/null 2>&1 &
```

## Required Information

Collect from user request (or ask if missing):
- **Band**: Band 1 or Band 2?
- **Chapter ID**: e.g. `B1-07`, `B2-06`, `B2-5a`
- **Title**: full chapter title
- **Type**: main chapter or Exkurs?
- **Words**: current word count (default 0 for new/scaffold)
- **Status**: default `outline`
- **Assignee**: herbert or wladimir (default herbert)

## Steps

### 1. Check for conflicts

Query board to confirm chapter ID doesn't already exist:
```bash
bun ~/.claude/skills/PokerStories/Tools/BoardSync.ts status | grep "<CHAPTER_ID>"
```

### 2. Create card via API

```bash
TOKEN=$(source ~/.env && echo $FOCALBOARD_TOKEN)
TS=$(date +%s%3N)

curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Content-Type: application/json" \
  "https://boards.pokerstories.wtf/api/v2/boards/b3tk9ri75otfidnartfnass9a8a/blocks" \
  -d "[{
    \"boardId\": \"b3tk9ri75otfidnartfnass9a8a\",
    \"type\": \"card\",
    \"title\": \"<TITLE>\",
    \"createAt\": $TS,
    \"updateAt\": $TS,
    \"fields\": {
      \"contentOrder\": [],
      \"properties\": {
        \"band\": \"<band1|band2>\",
        \"chapter\": \"<CHAPTER_ID>\",
        \"words\": <WORDS>,
        \"status\": \"<STATUS>\",
        \"assignee\": \"<ASSIGNEE>\",
        \"url_prop\": \"\"
      }
    },
    \"schema\": 1
  }]"
```

### 3. Create MONAD file if it doesn't exist

If a scaffold file is needed:
```bash
touch "~/Documents/MONAD/02-PROJECTS/PokerStories-Series/Band-X/02-Chapters/<filename>.md"
```
Add basic frontmatter:
```markdown
---
title: <Chapter Title>
band: <1|2>
chapter: <ID>
status: outline
words: 0
---
```

### 4. Upload empty file to Drive

Use the folder ID from BoardConfig.md for the appropriate band:
```bash
~/.local/bin/gws drive +upload <LOCAL_PATH> --parent <FOLDER_ID> --name <FILENAME>
```

Record the returned Drive file ID in `BoardConfig.md` under the appropriate band table.

### 5. Confirm

Show the new card in board status output and confirm Drive file created.
