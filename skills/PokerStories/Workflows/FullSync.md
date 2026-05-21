# PokerStories FullSync Workflow

Full update cycle: read current word counts from MONAD, upload changed files to Drive, update Focalboard card Words property.

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running FullSync in PokerStories"}' \
  > /dev/null 2>&1 &
```

## Steps

### 1. Read MONAD word counts

Count words in all chapter files:
```bash
wc -w ~/Documents/MONAD/02-PROJECTS/PokerStories-Series/Band-1-Golden-Age/02-Chapters/*.md \
       ~/Documents/MONAD/02-PROJECTS/PokerStories-Series/Band-2-Deep-Dive/02-Chapters/*.md
```

Map filenames to board card IDs using the table in `BoardConfig.md`.

### 2. Sync to Google Drive

For each chapter file, upload to Drive using gws. Only upload if the local file is newer than the Drive version (check modifiedTime).

**Band 2** (target folder ID: `1EyMZfB-d9G9LHnXsufxJipPFDxP5acNq`):
```bash
~/.local/bin/gws drive files update \
  --params '{"fileId": "<DRIVE_ID>"}' \
  --upload <LOCAL_PATH>
```

**Band 1** (target folder ID: `1wlZw8Oo3mZ7Wdfh23VekClf0_HsPtl8S`):
Same pattern. File IDs in `BoardConfig.md`.

For new files not yet in Drive (no Drive ID in config):
```bash
~/.local/bin/gws drive +upload <LOCAL_PATH> --parent <FOLDER_ID> --name <FILENAME>
```
After uploading, record the new Drive file ID in `BoardConfig.md`.

### 3. Update Focalboard word counts via SQLite

```bash
bun ~/.claude/skills/PokerStories/Tools/BoardSync.ts update-words
```

This reads the current word counts from MONAD files and updates the `words` property on each card via direct SQLite write on the VPS.

SQL pattern for each card:
```sql
UPDATE blocks
SET fields = json_set(fields, '$.properties.words', <NEW_WORD_COUNT>),
    update_at = <EPOCH_MS>
WHERE id = '<CARD_ID>';
```

Executed via:
```bash
SSH_AUTH_SOCK= ssh -i ~/.ssh/atom -o IdentitiesOnly=yes root@72.60.80.232 \
  "sqlite3 /var/lib/docker/volumes/focalboard_focalboard_data/_data/focalboard.db '<SQL>'"
```

### 4. Report

Output:
- N files uploaded/updated to Drive
- N card word counts updated on board
- Any new files without Drive IDs (needs BoardConfig.md update)

## Scoped Sync

If the user specifies a band or chapter, sync only that scope:
- "sync Band 2 only" → only Band 2 files/cards
- "sync economy chapter" → only 04-Economy-Rakeback.md
