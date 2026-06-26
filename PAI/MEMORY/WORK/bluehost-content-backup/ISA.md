---
task: Bluehost content backup — 5 sites to local + GitHub
slug: bluehost-content-backup
effort: E3
phase: observe
progress: 0/22
mode: ALGORITHM
started: 2026-06-26
updated: 2026-06-26
---

## Problem

Sites have migrated from Bluehost to Hostinger (June 21-24 2026). Bluehost originals contain content not yet archived — uploads, themes, and databases. Account may be deleted; no local or GitHub backup exists of these originals.

## Vision

All five sites' content (uploads + themes + fresh DB dump) downloaded to local machine and pushed to the existing GitHub repos under Derkaegi, creating a permanent archive of the Bluehost originals before the account is retired.

## Out of Scope

Plugin files are explicitly excluded. The ~800M full-site tarballs (with plugins/WP core) are not needed — only content. No deployment, no server-side restoration. No Hostinger work.

## Principles

- Content-first: uploads and themes are the irreplaceable assets; plugins can be reinstalled
- Priority order must be respected: griffl > horse-ranch > pokerstories > herbertokolowitz > spt
- Each backup must include a fresh DB dump (not the stale 50-byte gzips already on disk)

## Constraints

- Bluehost SSH: `ssh bluehost` (grifflor@70.40.217.80)
- GitHub: Derkaegi account, SSH authenticated, repos cloned at ~/Projects/
- No plugins in any archive
- SPT actual content is in `setpiecetakers.RENAMETEST-20260624/` (original dir renamed during migration test)

## Goal

For each of the 5 sites, create a tar.gz containing wp-content/uploads + wp-content/themes + a fresh mysqldump; download to ~/Projects/<repo>/backups/bluehost-2026-06-26/; commit and push to GitHub.

## Criteria

- [ ] ISC-1: griffl DB dump created on Bluehost and is > 1KB (not empty)
- [ ] ISC-2: griffl uploads archived (103M source, tar.gz created on Bluehost)
- [ ] ISC-3: griffl themes archived (23M source)
- [ ] ISC-4: griffl combined archive downloaded to ~/Projects/ local
- [ ] ISC-5: griffl backup pushed to GitHub Griffl repo
- [ ] ISC-6: horse-ranch DB dump created and > 1KB
- [ ] ISC-7: horse-ranch uploads+themes archive created (46M+43M)
- [ ] ISC-8: horse-ranch archive downloaded locally
- [ ] ISC-9: horse-ranch backup pushed to GitHub (need repo — check if exists)
- [ ] ISC-10: pokerstories DB dump created and > 1KB
- [ ] ISC-11: pokerstories uploads+themes archive created (34M+25M)
- [ ] ISC-12: pokerstories archive downloaded locally
- [ ] ISC-13: pokerstories backup pushed to GitHub PokerStories-Collaboration repo
- [ ] ISC-14: herbertokolowitz DB dump created and > 1KB
- [ ] ISC-15: herbertokolowitz uploads+themes archive created (11M+15M)
- [ ] ISC-16: herbertokolowitz archive downloaded locally
- [ ] ISC-17: herbertokolowitz backup pushed to GitHub herbertokolowitz.com repo
- [ ] ISC-18: spt DB dump created and > 1KB (from grifflor_WPNLA)
- [ ] ISC-19: spt uploads+themes archive created (32M+9.7M)
- [ ] ISC-20: spt archive downloaded locally
- [ ] ISC-21: spt backup pushed to GitHub setpiecetakers.com repo
- [ ] ISC-22: Anti: no plugin files included in any archive (wp-content/plugins/ absent from all tarballs)

## Test Strategy

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| ISC-1..ISC-3,ISC-6..ISC-7,ISC-10..ISC-11,ISC-14..ISC-15,ISC-18..ISC-19 | remote-create | ssh bluehost "ls -lh ~/backups/*.tar.gz ~/backups/*.sql.gz" | file exists, size>1KB | Bash/ssh |
| ISC-4,ISC-8,ISC-12,ISC-16,ISC-20 | local-download | ls -lh ~/Projects/*/backups/bluehost-2026-06-26/ | tar.gz + sql.gz present | Bash |
| ISC-5,ISC-9,ISC-13,ISC-17,ISC-21 | git-push | git -C ~/Projects/<repo> log --oneline -1 | backup commit in log | Bash |
| ISC-22 | anti-check | tar tzf <archive> \| grep plugins | must return empty | Bash |

## Features

| name | description | satisfies | depends_on | parallelizable |
|------|-------------|-----------|------------|----------------|
| remote-archive | On Bluehost: wp db export + tar uploads+themes for each site | ISC-1..ISC-3,ISC-6..ISC-7,ISC-10..ISC-11,ISC-14..ISC-15,ISC-18..ISC-19 | ssh access | no — sequential for disk safety |
| download | rsync/scp each archive to local ~/Projects | ISC-4,ISC-8,ISC-12,ISC-16,ISC-20 | remote-archive | no — sequential by priority |
| github-push | git add/commit/push each backup to its repo | ISC-5,ISC-9,ISC-13,ISC-17,ISC-21 | download | no — sequential per repo |

## Decisions

2026-06-26: SPT directory on Bluehost is setpiecetakers.RENAMETEST-20260624/ (12K in setpiecetakers/, all content in renamed dir). Using renamed dir for SPT backup.
2026-06-26: Existing SQL gz files in home dir are all 50 bytes (empty/corrupt). Will generate fresh dumps via `wp db export` (reads wp-config credentials automatically).
2026-06-26: horse-sheep-ranch GitHub repo not confirmed — will check ~/Projects/ and create backups/ subdir in existing repo or note if missing.
2026-06-26: Archives created in ~/backups/ on Bluehost then scp'd; avoids cluttering public_html.
