---
task: PAI v5.0.0 remaining upgrades + report
slug: v5-remaining-upgrades
effort: E3
phase: observe
progress: 0/12
mode: ALGORITHM
started: 2026-05-15T17:00:00+02:00
updated: 2026-05-15T17:00:00+02:00
---

## Problem
PAI v5.0.0 integration is 80% complete. Remaining: (1) 25 new hooks exist on disk but are not registered in settings.json, (2) Pulse daemon is not installed or running, (3) memory v7.6 subdirectories not yet created, (4) current state not committed to git.

## Vision
System is fully upgraded to v5.0.0 behaviorally: new hooks fire on their triggers, Pulse serves on 31337, memory dirs exist for v7.6. A clear Obsidian report documents the upgrade. herbert notified.

## Out of Scope
- Pulse daemon configuration and TELOS/identity interview (/interview workflow)
- Memory content migration from old paths to new v7.6 paths
- http hooks that require Pulse to be running (Skill/Agent guards on localhost:31337)

## Principles
- Additive only: new hook registrations append, never overwrite existing ones
- Preserve existing hook behavior; only add net-new hooks
- systemd user service for Pulse, not system-wide

## Constraints
- Linux (Ubuntu 24.04), not macOS -- no launchd
- Pulse requires bun and PAI/PULSE/pulse.ts to exist locally
- settings.json must remain valid JSON after every edit

## Goal
Commit current state, register the net-new v5.0.0 hooks in settings.json, install Pulse as a systemd user service, create v7.6 memory subdirs, write Obsidian report, send /notify.

## Criteria
- [ ] ISC-1: `git -C ~/.claude log --oneline -1` shows a commit with "save" or "snapshot" after this session starts
- [ ] ISC-2: `git -C ~/.claude push` succeeds with up-to-date remote
- [ ] ISC-3: settings.json contains PromptProcessing.hook.ts in UserPromptSubmit
- [ ] ISC-4: settings.json contains PromptGuard.hook.ts in UserPromptSubmit
- [ ] ISC-5: settings.json contains RepeatDetection.hook.ts in UserPromptSubmit
- [ ] ISC-6: settings.json contains SatisfactionCapture.hook.ts in UserPromptSubmit
- [ ] ISC-7: settings.json contains PreCompact.hook.ts in PreCompact event
- [ ] ISC-8: settings.json contains ToolActivityTracker.hook.ts in PostToolUse
- [ ] ISC-9: settings.json contains SecurityPipeline.hook.ts in PreToolUse (Bash)
- [ ] ISC-10: settings.json contains WorkCompletionLearning.hook.ts in SessionEnd
- [ ] ISC-11: PAI/PULSE directory exists in ~/.claude/ with pulse.ts
- [ ] ISC-12: systemd user service file written for Pulse daemon
- [ ] ISC-13: `systemctl --user status pai-pulse` returns installed (even if not running yet)
- [ ] ISC-14: ~/.claude/MEMORY/KNOWLEDGE/ directory exists
- [ ] ISC-15: ~/.claude/MEMORY/OBSERVABILITY/ directory exists
- [ ] ISC-16: Obsidian report written at ~/Documents/MONAD/03-REPORTS/ATOM-Tasks/2026-05-15-pai-v5-upgrade-report.md
- [ ] ISC-17: Anti: no existing hooks removed from settings.json
- [ ] ISC-18: settings.json parses as valid JSON after all edits (`python3 -c "import json; json.load(open(...))"`)

## Test Strategy
| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| ISC-1 | bash | git log | commit present | Bash |
| ISC-3..10 | bash | grep in settings.json | string present | Bash |
| ISC-11 | bash | ls ~/.claude/PAI/PULSE/pulse.ts | file exists | Bash |
| ISC-12 | bash | cat ~/.config/systemd/user/pai-pulse.service | file exists | Bash |
| ISC-14..15 | bash | ls dirs | dirs exist | Bash |
| ISC-16 | read | Read report file | content present | Read |
| ISC-18 | bash | python3 json.load | no error | Bash |

## Features
| name | satisfies | depends_on | parallelizable |
|------|-----------|------------|----------------|
| git-save | ISC-1,2 | none | no |
| hook-registration | ISC-3..10,17,18 | git-save | no |
| pulse-install | ISC-11..13 | git-save | yes with memory |
| memory-dirs | ISC-14..15 | none | yes |
| report-and-notify | ISC-16 | all above | no |

## Decisions

## Changelog

## Verification
