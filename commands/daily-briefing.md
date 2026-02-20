# /daily-briefing — Send daily weather + calendar briefing

Fetches today's weather and Google Calendar events, sends to all PAI channels.

## Usage

```
/daily-briefing              ← send full briefing via email + ntfy + Telegram
/daily-briefing --print      ← print only, don't send
/daily-briefing Munich       ← override weather location
```

## Behavior

Run: `bun ~/.claude/skills/PAI/Tools/DailyBriefing.ts`

With optional args passed through from $ARGUMENTS.

## What it includes

- 🌤 Current weather + feels like + high/low + rain chance + sunrise/sunset
- 📅 All calendar events for today with times and locations
- Sent via Email + ntfy + Telegram simultaneously

## Config

- `WEATHER_LOCATION` in `~/.env` — default: Barcelona
- Google OAuth token auto-used from `~/.env`

## Schedule (optional)

To run automatically every morning at 07:00:
```bash
crontab -e
# Add: 0 7 * * * bun ~/.claude/skills/PAI/Tools/DailyBriefing.ts
```
