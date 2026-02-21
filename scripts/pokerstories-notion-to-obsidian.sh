#!/bin/bash
# PokerStories: Export Notion-only pages to Obsidian
# Scheduled one-time run to align Notion teamspace with Obsidian vault
# After completion, remove this cron entry

LOG="/tmp/pokerstories-sync-$(date +%Y%m%d).log"
echo "=== PokerStories Notion→Obsidian sync started $(date) ===" >> "$LOG"

/usr/local/bin/claude -p "Execute the following plan. Do NOT ask questions, just do it.

CONTEXT: PokerStories Obsidian vault at ~/Documents/MONAD/02-PROJECTS/PokerStories/ has 79 files from Google Drive. Notion has ~12 additional pages not in Obsidian. Your job: export those Notion pages to Obsidian markdown files.

NOTION API: Use 'export \$(grep NOTION_TOKEN ~/.env | tr -d \" \")' to load the token. Use Notion-Version: 2022-06-28.

STEPS:
1. For each Notion page below, fetch its block children via the Notion API, convert to markdown, and write to the specified Obsidian path.

PAGES TO EXPORT:
- Page ID: cb346632-... (search 'Vision and Strategy' under PokerStories HQ children) → ~/Documents/MONAD/02-PROJECTS/PokerStories/Brand/Vision-and-Strategy.md
- Page ID: eee32824-... (search 'Outreach / Invite') → ~/Documents/MONAD/02-PROJECTS/PokerStories/Brand/Outreach-Invite.md
- Page ID: 23bf11fc-6655-80b6-8bcb-c7a387a27487 children: brand-slides-outline.txt, Brand Email Draft → ~/Documents/MONAD/02-PROJECTS/PokerStories/Brand/Brand-Slides-Outline.md and Brand-Email-Draft.md
- Page ID: a7eac739-... (Guest Questionnaire) → ~/Documents/MONAD/02-PROJECTS/PokerStories/Episodes/Guest-Questionnaire.md
- Page ID: 1b046ca7-... (Podcast Article Workflow) → ~/Documents/MONAD/02-PROJECTS/PokerStories/Episodes/Podcast-Article-Workflow.md
- Page ID: 23bf11fc-... child: Media Kit → ~/Documents/MONAD/02-PROJECTS/PokerStories/Brand/Media-Kit.md
- Page ID: 23df11fc-6655-8077-995a-eea746f656b5 (important links) → ~/Documents/MONAD/02-PROJECTS/PokerStories/Collaboration/Important-Links.md

2. Create Chapter Status Tracker from PokerBook_Chapter_Plan_Notion database (ID: 22df11fc-6655-80c8-8c1b-d488f633880a). Query all entries, build a markdown table with columns: Chapter, Title, Status, Years, Section. Write to ~/Documents/MONAD/02-PROJECTS/PokerStories/Book-Manuscript/Chapter-Status-Tracker.md

3. Export 'Golden Age of Online Poker' page children (ID: 0520356e-ac08-48be-bbf0-76e1ccbf4cef) — 'Book Outline' and 'Research / Prompt' sub-pages → ~/Documents/MONAD/02-PROJECTS/PokerStories/Book-Manuscript/Golden-Age-Book-Outline.md and Golden-Age-Research-Prompts.md

4. Extract operational info from PokerStories HQ (ID: 7bde0b7b-b2d3-46d5-a764-e2c2128fc15a) — team contacts, tool links, podcast distribution — into ~/Documents/MONAD/02-PROJECTS/PokerStories/Notion-HQ-Operational.md

5. Update ~/Documents/MONAD/02-PROJECTS/PokerStories/_PokerStories-Index.md — add links to all new files under appropriate sections.

6. Run: bun ~/.claude/skills/PAI/Tools/MonadIndex.ts

7. Send completion report: bun ~/.claude/skills/PAI/Tools/Notify.ts --title 'PokerStories Alignment Complete' --message 'Exported ~12 Notion pages to Obsidian. Chapter tracker, brand docs, episode docs, operational info all synced. MONAD index updated.'

8. Remove this cron entry by running: crontab -l | grep -v 'pokerstories-notion-to-obsidian' | crontab -
" >> "$LOG" 2>&1

echo "=== Finished $(date) ===" >> "$LOG"
