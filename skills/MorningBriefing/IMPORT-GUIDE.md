# Import Morning Briefing Workflow into n8n

## Quick Import (3 minutes)

### Step 1: Import Workflow
1. Open your n8n: https://n8n.srv988482.hstgr.cloud/
2. Click "+" button → "Import from File"
3. Select: `~/.claude/skills/MorningBriefing/morning-briefing-workflow.json`
4. Click "Import"

### Step 2: Configure Gmail Credentials
The workflow needs Gmail SMTP credentials for email sending:

1. In n8n, go to **Credentials** (left sidebar)
2. Click **"+ Add Credential"**
3. Search for **"SMTP"** and select it
4. Fill in:
   - **Name:** `Gmail SMTP`
   - **Host:** `smtp.gmail.com`
   - **Port:** `587`
   - **Security:** `STARTTLS`
   - **User:** `atompaherbert@gmail.com` (from your ~/.env)
   - **Password:** `hwsewcvjwzgjugcm` (Gmail app password from your ~/.env)
5. Click **"Create"**

### Step 3: Update Workflow Email Node
1. Open the workflow you just imported
2. Click on the **"Send Email"** node
3. In the "Credential to connect with" dropdown, select **"Gmail SMTP"** (the one you just created)
4. **Save** the workflow

### Step 4: Add Environment Variables
The workflow uses these environment variables (loaded from your ~/.env):

In n8n Settings → Environment:
- `GMAIL_USER` = `atompaherbert@gmail.com`
- `GMAIL_RECIPIENT` = `herboko@gmail.com`
- `TELEGRAM_BOT_TOKEN` = `8449656252:AAEAlitGf50VSNdz30ljegkkhlB35dLkZcc`
- `TELEGRAM_CHAT_ID` = `83283230`
- `NTFY_TOPIC` = `atompa-pai-sendbote`

**OR** if your n8n runs on the same VPS as herbert user, it can read `~/.env` directly (no setup needed).

### Step 5: Test the Workflow
1. In the workflow editor, click **"Execute Workflow"** button (top right)
2. Watch nodes execute one by one
3. Check all three channels:
   - Email inbox (herboko@gmail.com)
   - Telegram (@atompa_bot)
   - ntfy push notification

### Step 6: Activate
1. Toggle the workflow **Active** switch (top right)
2. Verify the schedule shows: **"Every day at 7:00 AM (Europe/Berlin)"**
3. Done! First briefing arrives tomorrow at 7:00 CET

---

## Workflow Overview

The workflow has 10 nodes:

1. **Daily 7am Trigger** - Cron schedule (0 7 * * *)
2. **Get Weather** - Fetches Barcelona weather from wttr.in
3. **Parse Weather** - Extracts temperature, condition, high/low
4. **Read PAI Tasks** - Reads task JSON files from ~/.claude/tasks/
5. **Read Learnings** - Reads recent reflections from algorithm-reflections.jsonl
6. **Merge Data** - Combines all data sources into one JSON object
7. **Format Briefing** - Runs format-briefing.ts to create email/telegram/ntfy versions
8. **Send Email** - Sends HTML email via Gmail SMTP
9. **Send Telegram** - Sends formatted message via Telegram bot API
10. **Send ntfy** - Sends push notification to ntfy.sh topic

---

## Troubleshooting

### Email Not Sending
- **Check:** Gmail SMTP credential is properly configured
- **Fix:** Re-create the credential with correct password
- **Test:** Click "Test" in the credential editor

### Tasks/Learnings Not Reading
- **Check:** n8n can access /home/herbert/.claude/ directory
- **Fix:** Run n8n as herbert user, or give n8n read access to PAI files
- **Test:** SSH to VPS, run the command manually:
  ```bash
  cd /home/herbert/.claude/tasks && find . -name '*.json' -type f | head -1
  ```

### Formatter Script Fails
- **Check:** Bun is installed and in PATH
- **Fix:** Install bun: `curl -fsSL https://bun.sh/install | bash`
- **Test:** `which bun` should return `/home/herbert/.bun/bin/bun`

### Workflow Doesn't Trigger at 7am
- **Check:** Workflow is **Active** (toggle switch on)
- **Check:** Timezone is set to "Europe/Berlin" in workflow settings
- **Fix:** Edit workflow settings → Timezone → Europe/Berlin

### No Notifications Received
- **Check:** Environment variables are accessible to n8n
- **Test:** In workflow, add a "Set" node and try to read `{{ $env.TELEGRAM_BOT_TOKEN }}`
- **Fix:** If empty, add env vars to n8n environment or load from ~/.env

---

## Optional: Add Google Calendar

The workflow currently shows an empty calendar section. To add real calendar events:

1. **Create Google OAuth2 Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create project → Enable Calendar API
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://n8n.srv988482.hstgr.cloud/rest/oauth2-credential/callback`

2. **Add Credential to n8n:**
   - In n8n: Credentials → "+ Add Credential"
   - Search "Google Calendar OAuth2 API"
   - Enter Client ID and Secret
   - Click "Connect my account" and authorize

3. **Add Calendar Node to Workflow:**
   - Insert between "Daily 7am Trigger" and "Merge Data"
   - Type: Google Calendar → "Get Many (Events)"
   - Calendar ID: `primary`
   - Start: `{{ $now.startOf('day').toISO() }}`
   - End: `{{ $now.endOf('day').toISO() }}`
   - Connect output to "Merge Data" node
   - Update "Merge Data" code to include calendar events

4. **Update Merge Data Code:**
   Replace `calendar: []` with:
   ```javascript
   const calendar = items.filter(i => i.json.summary).map(e => ({
     time: new Date(e.json.start.dateTime).toLocaleTimeString('en-US', {
       hour: '2-digit',
       minute: '2-digit',
       hour12: false
     }),
     title: e.json.summary,
     location: e.json.location || null
   }));
   ```

---

## Next Steps

Once working:
- Customize briefing sections in format-briefing.ts
- Add more data sources (news, metrics, etc.)
- Adjust notification formatting
- Create weekend vs weekday variations

**File Location:** `~/.claude/skills/MorningBriefing/morning-briefing-workflow.json`

**n8n Instance:** https://n8n.srv988482.hstgr.cloud/
