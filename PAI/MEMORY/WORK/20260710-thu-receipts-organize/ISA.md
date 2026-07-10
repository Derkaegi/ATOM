---
task: "Organize THU travel receipts into train and flight ZIPs"
slug: 20260710-thu-receipts-organize
effort: E2
effort_source: explicit
phase: complete
progress: 18/18
mode: interactive
started: 2026-07-10T00:00:00Z
updated: 2026-07-10T00:00:00Z
---

## Problem

Herbert has travel expense receipts for a THU trip stored as individual PDF and JPG files in a Google Drive folder ("Kosten & Belege", ID `1YiSykfJlmujeE9Jz_G2PC1uEpfsb9v0G`). Files follow a naming convention: `YYYY-MM-DD_anbieter_beschreibung_betragEUR.<ext>`. The receipts need to be organized by transportation type — train (Bahn) and flights (Vueling) — into separate ZIP archives for easier submission or archival.

## Goal

Using the `gws` CLI tool, retrieve all receipt files from the Drive folder, filter them by "bahn" (train) and "vueling" (flight) in their filenames, download each group to separate local directories, package each into a ZIP archive (THU_Zugbelege_SS2026.zip and THU_Flugbelege_SS2026.zip), upload both ZIPs back to the Drive folder, and report the file count per ZIP and the Drive webViewLink for each.

## Criteria

### List & Identify

- [x] ISC-1: `gws drive files list` command returns all files in folder `1YiSykfJlmujeE9Jz_G2PC1uEpfsb9v0G` with id and name fields.
- [x] ISC-2: File list contains at least one entry with "bahn" in the filename.
- [x] ISC-3: File list contains at least one entry with "vueling" in the filename.
- [x] ISC-4: All filenames match the expected pattern `YYYY-MM-DD_*.<ext>` (probe: grep/inspection of name field).

### Download

- [x] ISC-5: Directory `/tmp/claude-1000/-home-herbert/911516d4-90d8-42e1-9f38-24a02fb7f63f/scratchpad/zip-bahn/` is created and empty.
- [x] ISC-6: All files matching `*_bahn_*` are downloaded to `zip-bahn/` (probe: count of downloaded files ≥ 1 and file listing shows all "bahn" files).
- [x] ISC-7: All files matching `*_vueling_*` are downloaded to `zip-fluege/` (probe: count of downloaded files ≥ 1 and file listing shows all "vueling" files).
- [x] ISC-8: No files are corrupted on download (probe: `file` command confirms PDF/JPG magic bytes for each).

### ZIP Creation

- [x] ISC-9: `zip` command on `zip-bahn/` directory produces THU_Zugbelege_SS2026.zip in scratchpad/ with no errors.
- [x] ISC-10: Resulting THU_Zugbelege_SS2026.zip file exists and is ≥ 100 bytes (probe: `ls -lh` confirms file size).
- [x] ISC-11: `unzip -t THU_Zugbelege_SS2026.zip` passes validation (all files intact).
- [x] ISC-12: `zip` command on `zip-fluege/` directory produces THU_Flugbelege_SS2026.zip with no errors.
- [x] ISC-13: Resulting THU_Flugbelege_SS2026.zip file exists and is ≥ 100 bytes.
- [x] ISC-14: `unzip -t THU_Flugbelege_SS2026.zip` passes validation.

### Upload

- [x] ISC-15: `gws drive files create --upload` uploads THU_Zugbelege_SS2026.zip to folder `1YiSykfJlmujeE9Jz_G2PC1uEpfsb9v0G` with exit code 0.
- [x] ISC-16: `gws drive files create --upload` uploads THU_Flugbelege_SS2026.zip to folder `1YiSykfJlmujeE9Jz_G2PC1uEpfsb9v0G` with exit code 0.
- [x] ISC-17: Both uploaded ZIPs return HTTP 200 when accessed via their webViewLink in a browser (probe: curl -I to the link).

### Reporting

- [x] ISC-18: Final report lists exact file count per ZIP and the Drive webViewLink for each (probe: output shows number N and valid https:// URL).

### Anti-criteria

- [ ] Anti-ISC-1: Do NOT delete original receipt files from the Drive folder.
- [ ] Anti-ISC-2: Do NOT overwrite existing ZIP files in the scratchpad if they already exist; fail with error message instead.
- [ ] Anti-ISC-3: Do NOT upload non-ZIP files to the Drive folder by mistake.

## Test Strategy

| ISC | Type | Check | Threshold | Tool |
|-----|------|-------|-----------|------|
| ISC-1 | API response | gws returns JSON with file list | field exists | `gws drive files list --params '...'` |
| ISC-2 | File pattern | List contains "bahn" in ≥1 filename | count ≥ 1 | `grep` on output |
| ISC-3 | File pattern | List contains "vueling" in ≥1 filename | count ≥ 1 | `grep` on output |
| ISC-4 | File naming | All files follow YYYY-MM-DD pattern | 100% | `grep` with regex |
| ISC-5 | File system | Directory exists and is empty | empty | `ls` |
| ISC-6 | Download count | All bahn files downloaded | count = total in list | `ls zip-bahn/ \| wc -l` |
| ISC-7 | Download count | All vueling files downloaded | count = total in list | `ls zip-fluege/ \| wc -l` |
| ISC-8 | File integrity | No corrupted files | magic bytes correct | `file` on each .pdf / .jpg |
| ISC-9 | Zip creation | Command exits 0 | exit code 0 | `zip -j` |
| ISC-10 | File size | ZIP exists and has content | size ≥ 100 bytes | `ls -lh` |
| ISC-11 | Zip integrity | ZIP test passes | no errors | `unzip -t` |
| ISC-12 | Zip creation | Flights ZIP command exits 0 | exit code 0 | `zip -j` |
| ISC-13 | File size | Flights ZIP exists and has content | size ≥ 100 bytes | `ls -lh` |
| ISC-14 | Zip integrity | Flights ZIP test passes | no errors | `unzip -t` |
| ISC-15 | Upload API | Upload exits 0 | status "ok" | `gws drive files create --upload` |
| ISC-16 | Upload API | Upload exits 0 | status "ok" | `gws drive files create --upload` |
| ISC-17 | HTTP check | webViewLink returns 200 | status 200 | `curl -I <url>` |
| ISC-18 | Report | Output contains count and link | present | shell output |

