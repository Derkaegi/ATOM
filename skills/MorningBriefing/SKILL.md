---
name: MorningBriefing
description: Daily morning briefing with calendar, tasks, learnings, and weather. Automated via n8n workflow.
version: 1.0.0
author: Herbert
created: 2026-02-16
triggers:
  - morning briefing
  - daily briefing
  - today's schedule
  - morning summary
---

# Morning Briefing Skill

## Purpose

Automated daily briefing sent every morning at 7:00 CET with:
- Today's calendar events
- Active task overview
- Recent learnings from PAI memory
- Barcelona weather forecast
- Delivered via email, Telegram, and ntfy

## Architecture

**Token-Efficient Design:** No Claude API calls for data aggregation. n8n handles:
- Direct API calls (weather, calendar)
- File reads (PAI tasks, learnings)
- Template-based formatting (no LLM summarization)

**Data Sources:**
1. **Weather:** wttr.in API (free, no key required)
2. **Calendar:** Google Calendar API (OAuth read-only)
3. **Tasks:** Read from `~/.claude/tasks/`
4. **Learnings:** Read from `~/.claude/MEMORY/LEARNING/REFLECTIONS/algorithm-reflections.jsonl`

**Delivery:** Existing PAI notification system (email, Telegram, ntfy)

## Components

### 1. Data Formatter (`format-briefing.ts`)
TypeScript script that takes JSON input and outputs formatted briefing for each channel.
- No external API calls
- Pure template-based formatting
- Outputs: HTML (email), Markdown (Telegram), plain text (ntfy)

### 2. n8n Workflow
Visual workflow that:
- Triggers daily at 7:00 CET
- Fetches data from all sources
- Calls formatter script
- Sends to three channels

### 3. Calendar Integration
Google Calendar API setup:
- OAuth 2.0 read-only access
- Fetches today's events (00:00 - 23:59 CET)
- Returns: time, title, location, description

## Usage

**Manual Trigger:**
```bash
bun ~/.claude/skills/MorningBriefing/trigger-manual.ts
```

**Automated:** n8n workflow runs daily at 7:00 CET

## Setup Instructions

See `SETUP.md` for complete n8n workflow configuration.

## Data Privacy

- Calendar events: read-only OAuth, stored only in n8n credentials
- PAI data: local file reads, never sent to external services
- Weather: public API, no personal data
- All notifications encrypted in transit (HTTPS, TLS)
