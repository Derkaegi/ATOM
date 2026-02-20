# Morning Briefing - Quick Start

**Goal:** Daily 7am briefing with calendar, tasks, learnings, weather → delivered to email, Telegram, ntfy

**Key Feature:** Zero Claude tokens used for data gathering and formatting

---

## Three Steps to Get Running

### 1. Set Up Google Calendar API (5 min)
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create project → Enable Calendar API → OAuth 2.0 credentials
- Copy Client ID + Secret into n8n credentials

### 2. Import n8n Workflow (10 min)
- Follow `N8N-SETUP.md` node-by-node instructions
- Or use the workflow JSON (create one with export feature)
- Set cron to `0 7 * * *` timezone `Europe/Berlin`

### 3. Test & Activate (2 min)
```bash
# Test data sources
curl -s "https://wttr.in/Barcelona?format=j1" | jq .current_condition

# Test formatter
echo '{"date":"Test","weather":{"temp":"20°C","condition":"Sunny","high":"25°C","low":"15°C"},"calendar":[],"tasks":{"pending":3,"inProgress":1,"urgent":[]},"learnings":[]}' | bun ~/.claude/skills/MorningBriefing/format-briefing.ts

# Manual trigger full workflow
# (run in n8n or create trigger-manual.ts script)
```

---

## What Gets Included

| Section | Data Source | API Cost |
|---------|-------------|----------|
| Weather | wttr.in | Free, no key |
| Calendar | Google Calendar API | Free quota |
| Tasks | PAI task files | Local read, free |
| Learnings | PAI reflection JSONL | Local read, free |

**Total Cost:** $0/month (within free tiers)

---

## File Structure

```
~/.claude/skills/MorningBriefing/
├── SKILL.md              # Skill documentation
├── format-briefing.ts    # Template formatter (no LLM calls)
├── N8N-SETUP.md          # Complete workflow setup guide
├── QUICK-START.md        # This file
└── trigger-manual.ts     # Manual trigger script (create if needed)
```

---

## Customization Ideas

**Add More Sections:**
- News headlines (RSS feed)
- PokerStories metrics (book sales, traffic)
- HP work context (pending reviews, tickets)
- Fitness/health data (sleep, steps)
- Financial summary (crypto, stocks)

**Conditional Logic:**
- Skip weekends if no events
- Highlight urgent tasks only if > 3
- Show learnings only if recent (< 3 days old)
- Weather alerts if rain > 70%

**Formatting:**
- Add images/charts to email
- Voice version (TTS via ElevenLabs)
- PDF attachment with full report
- Interactive buttons in Telegram

---

## Troubleshooting One-Liners

```bash
# Check skill files exist
ls -lh ~/.claude/skills/MorningBriefing/

# Test weather API
curl -s "https://wttr.in/Barcelona?format=j1" | jq '.current_condition[0]'

# Find PAI task files
find ~/.claude/tasks/ -name '*.json' -type f | wc -l

# Check recent learnings
tail -n 1 ~/.claude/MEMORY/LEARNING/REFLECTIONS/algorithm-reflections.jsonl

# Verify notification credentials
grep -E '(GMAIL|TELEGRAM|NTFY)' ~/.env

# Test n8n workflow execution
# (via n8n UI: Execute Workflow button)
```

---

## Next Steps After Setup

1. **Receive first briefing tomorrow at 7am**
2. **Rate the format** - too long? missing info? adjust
3. **Add calendar events** for tomorrow to test calendar section
4. **Check all three channels** - which one you check most?
5. **Customize sections** based on your preferences

---

**Need help?** Full details in `N8N-SETUP.md`

**Want to modify formatter?** Edit `format-briefing.ts` (TypeScript)

**Issues with n8n?** Check n8n execution logs for error details
