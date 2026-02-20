# n8n Morning Briefing Setup Guide

Complete walkthrough for setting up the automated morning briefing workflow.

## Prerequisites

1. **n8n instance** (cloud or self-hosted on VPS)
2. **Google Calendar API** credentials (OAuth 2.0)
3. **OpenWeatherMap API key** (free tier) OR use wttr.in (no key)
4. **PAI notification credentials** (already configured in `~/.env`)

---

## Part 1: Set Up Data Sources

### 1.1 Weather API (Choose One)

**Option A: wttr.in (Recommended - No API Key)**
```
Endpoint: https://wttr.in/Barcelona?format=j1
Method: GET
No authentication required
Returns: JSON with detailed weather data
```

**Option B: OpenWeatherMap (Requires Free API Key)**
1. Go to https://openweathermap.org/api
2. Sign up for free account
3. Get API key from dashboard
4. Endpoint: `https://api.openweathermap.org/data/2.5/weather?q=Barcelona&appid=YOUR_KEY&units=metric`

### 1.2 Google Calendar API

1. **Create Google Cloud Project:**
   - Go to https://console.cloud.google.com/
   - Create new project "PAI Morning Briefing"
   - Enable Google Calendar API

2. **Create OAuth 2.0 Credentials:**
   - Go to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: Add your n8n OAuth callback URL
     - Self-hosted: `https://your-n8n-domain.com/rest/oauth2-credential/callback`
     - n8n Cloud: `https://app.n8n.cloud/rest/oauth2-credential/callback`
   - Save Client ID and Client Secret

3. **Add Credentials to n8n:**
   - In n8n: Credentials → Add Credential
   - Search for "Google Calendar OAuth2 API"
   - Enter Client ID and Client Secret
   - Click "Connect my account" and authorize
   - Test connection

---

## Part 2: Create n8n Workflow

### 2.1 Workflow Overview

```
[Schedule Trigger] → [Fetch Weather] → [Fetch Calendar] → [Read PAI Files] → [Format Data] → [Send Notifications]
        ↓                  ↓                 ↓                  ↓                 ↓                ↓
    7:00 CET          wttr.in API      Google Cal API      File reads      Bun script     Email+TG+ntfy
```

### 2.2 Node-by-Node Setup

#### Node 1: Schedule Trigger
- **Type:** Cron node
- **Cron Expression:** `0 7 * * *`
- **Timezone:** `Europe/Berlin`
- **Name:** "Daily 7am Trigger"

#### Node 2: Fetch Weather
- **Type:** HTTP Request node
- **Method:** GET
- **URL:** `https://wttr.in/Barcelona?format=j1`
- **Name:** "Get Barcelona Weather"
- **Output:** Full response
- **JavaScript code to parse (use Code node after):**

```javascript
const weather = $input.first().json;
const current = weather.current_condition[0];
const forecast = weather.weather[0];

return {
  json: {
    temp: `${current.temp_C}°C`,
    condition: current.weatherDesc[0].value,
    high: `${forecast.maxtempC}°C`,
    low: `${forecast.mintempC}°C`,
    precipitation: `${forecast.hourly[0].chanceofrain}% rain`
  }
};
```

#### Node 3: Fetch Calendar Events
- **Type:** Google Calendar node (or HTTP Request if using API directly)
- **Operation:** Get Many (Events)
- **Calendar ID:** primary
- **Start:** `{{ $now.startOf('day').toISO() }}`
- **End:** `{{ $now.endOf('day').toISO() }}`
- **Max Results:** 20
- **Order By:** startTime
- **Name:** "Get Today's Calendar"
- **JavaScript code to parse:**

```javascript
const events = $input.all();
return {
  json: events.map(event => ({
    time: new Date(event.json.start.dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }),
    title: event.json.summary,
    location: event.json.location || null
  }))
};
```

#### Node 4: Read PAI Task Files
- **Type:** Execute Command node
- **Command:**
```bash
cd /home/herbert/.claude/tasks && \
find . -name '*.json' -type f -exec cat {} \; | \
jq -s 'map(select(.status == "pending" or .status == "in_progress")) | {
  pending: map(select(.status == "pending")) | length,
  inProgress: map(select(.status == "in_progress")) | length,
  urgent: map(select(.status == "pending" and (.priority == "high" or .priority == "urgent"))) | .[0:3] | map({id: .id, subject: .subject})
}'
```
- **Name:** "Read PAI Tasks"

#### Node 5: Read Learnings
- **Type:** Execute Command node
- **Command:**
```bash
tail -n 5 /home/herbert/.claude/MEMORY/LEARNING/REFLECTIONS/algorithm-reflections.jsonl | \
jq -s 'map({
  date: .timestamp | split("T")[0],
  insight: .reflection_q2 // .reflection_q1 // "No recent insights"
}) | .[0:3]'
```
- **Name:** "Read Recent Learnings"

#### Node 6: Merge Data
- **Type:** Code node (JavaScript)
- **Name:** "Merge All Data"
- **Code:**

```javascript
const items = $input.all();

// Extract data from each node
const weather = items.find(i => i.json.temp)?.json;
const calendar = items.filter(i => i.json.time);
const tasks = items.find(i => i.json.pending)?.json;
const learnings = items.filter(i => i.json.insight);

const now = new Date();
const dateStr = now.toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

return {
  json: {
    date: dateStr,
    weather: weather || { temp: 'N/A', condition: 'Unknown', high: 'N/A', low: 'N/A' },
    calendar: calendar.map(c => c.json) || [],
    tasks: tasks || { pending: 0, inProgress: 0, urgent: [] },
    learnings: learnings.map(l => l.json) || []
  }
};
```

#### Node 7: Format Briefing
- **Type:** Execute Command node
- **Command:**
```bash
echo '{{ JSON.stringify($json) }}' | bun /home/herbert/.claude/skills/MorningBriefing/format-briefing.ts
```
- **Name:** "Format for All Channels"

#### Node 8: Send Email
- **Type:** Send Email node
- **SMTP Settings:**
  - Host: `smtp.gmail.com`
  - Port: `587`
  - User: `{{ $env.GMAIL_USER }}`
  - Password: `{{ $env.GMAIL_APP_PASSWORD }}`
- **Email:**
  - From: `ATOM <{{ $env.GMAIL_USER }}>`
  - To: `{{ $env.GMAIL_RECIPIENT }}`
  - Subject: `{{ $json.email.subject }}`
  - Email Format: HTML
  - Text: `{{ $json.email.html }}`
- **Name:** "Send Email Briefing"

#### Node 9: Send Telegram
- **Type:** HTTP Request node
- **Method:** POST
- **URL:** `https://api.telegram.org/bot{{ $env.TELEGRAM_BOT_TOKEN }}/sendMessage`
- **Body:**
```json
{
  "chat_id": "{{ $env.TELEGRAM_CHAT_ID }}",
  "text": "{{ $json.telegram.text }}",
  "parse_mode": "HTML"
}
```
- **Name:** "Send Telegram Briefing"

#### Node 10: Send ntfy
- **Type:** HTTP Request node
- **Method:** POST
- **URL:** `https://ntfy.sh/{{ $env.NTFY_TOPIC }}`
- **Headers:**
  - `Title`: `{{ $json.ntfy.title }}`
  - `Priority`: `{{ $json.ntfy.priority }}`
  - `Tags`: `{{ $json.ntfy.tags }}`
- **Body:** `{{ $json.ntfy.message }}`
- **Name:** "Send ntfy Push"

---

## Part 3: Environment Variables in n8n

If n8n is running on your VPS, it can access `/home/herbert/.env` directly.

For n8n Cloud, add these as environment variables in n8n settings:
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `GMAIL_RECIPIENT`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `NTFY_TOPIC`

---

## Part 4: Testing

### Manual Test
1. In n8n workflow, click "Execute Workflow" button
2. Check all three channels (email, Telegram, ntfy) for delivery
3. Verify formatting looks good on each channel

### Data Source Tests
Run these commands individually to test data gathering:

```bash
# Test weather
curl -s "https://wttr.in/Barcelona?format=j1" | jq '.current_condition[0]'

# Test task reading
cd ~/.claude/tasks && find . -name '*.json' -type f | head -1 | xargs cat

# Test learnings
tail -n 1 ~/.claude/MEMORY/LEARNING/REFLECTIONS/algorithm-reflections.jsonl

# Test formatter
echo '{"date":"Test","weather":{"temp":"20°C","condition":"Sunny","high":"25°C","low":"15°C"},"calendar":[],"tasks":{"pending":3,"inProgress":1,"urgent":[]},"learnings":[]}' | bun ~/.claude/skills/MorningBriefing/format-briefing.ts
```

---

## Part 5: Deployment

1. **Save workflow** in n8n with name "Morning Briefing"
2. **Activate workflow** (toggle switch to ON)
3. **Set timezone** to Europe/Berlin in workflow settings
4. **Test schedule:** Set to trigger in 2 minutes, wait, verify delivery
5. **Set to 7am:** Change cron to `0 7 * * *`

---

## Part 6: Monitoring

### Check Workflow Execution
- n8n dashboard shows execution history
- Failed executions show error details
- Can set up n8n error notifications via webhook

### Verify Daily Delivery
- Check one channel each morning (Telegram fastest to verify)
- If missing, check n8n execution logs

### Backup: Manual Trigger
If automated trigger fails, run manually:
```bash
bun ~/.claude/skills/MorningBriefing/trigger-manual.ts
```

---

## Troubleshooting

### Weather Not Fetching
- Check wttr.in is accessible: `curl -I https://wttr.in`
- Try OpenWeatherMap as fallback

### Calendar Empty
- Verify OAuth token hasn't expired (re-authenticate in n8n)
- Check calendar has events for today
- Verify timezone in query (should be Europe/Berlin)

### Tasks Not Reading
- Check PAI task files exist: `ls ~/.claude/tasks/`
- Verify jq is installed: `which jq`
- Test task read command directly

### Notifications Not Sending
- Verify credentials in `~/.env`
- Test each channel individually with curl
- Check n8n has access to env variables

### Timezone Issues
- Workflow triggers at wrong time → check n8n server timezone
- Calendar shows wrong day → verify query uses correct timezone
- Fix: explicitly set `TZ=Europe/Berlin` in n8n environment

---

## Next Steps

Once working:
1. Customize briefing sections (add/remove data sources)
2. Add conditional logic (e.g., only show tasks if > 5 pending)
3. A/B test different formatting styles
4. Add weekend vs weekday variations
5. Integrate more PAI memory sources (relationship notes, project status)

---

**Token Usage: ZERO Claude API calls** ✅

All data gathering and formatting happens via direct API calls and template-based scripts. The only Claude involvement is if you manually ask ATOM to modify the workflow.
