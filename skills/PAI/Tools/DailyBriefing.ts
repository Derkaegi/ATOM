#!/usr/bin/env bun
/**
 * DailyBriefing.ts — Daily briefing: weather + calendar + Notion tasks → all PAI channels
 *
 * Usage:
 *   bun DailyBriefing.ts                    ← send to all channels
 *   bun DailyBriefing.ts --print            ← print only, don't send
 *   bun DailyBriefing.ts --location Munich  ← override weather location
 *
 * Channel formats:
 *   ntfy + Telegram → compact (title + due date, max 10 tasks)
 *   email           → full (all fields, no task limit)
 *
 * Config in ~/.env:
 *   WEATHER_LOCATION=Barcelona
 *   GOOGLE_OAUTH_REFRESH_TOKEN / CLIENT_ID / CLIENT_SECRET
 *   NOTION_TOKEN
 *   NTFY_TOPIC / TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID
 *   GMAIL_USER / GMAIL_APP_PASSWORD / GMAIL_RECIPIENT
 */

import { readFileSync, writeFileSync } from "fs";
import { homedir, tmpdir } from "os";
import { join } from "path";
import { spawnSync } from "child_process";

// ─── Load ~/.env ──────────────────────────────────────────────────────────────
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    for (const line of readFileSync(join(homedir(), ".env"), "utf-8").split("\n")) {
      const t = line.trim();
      if (t && !t.startsWith("#") && t.includes("=")) {
        const eq = t.indexOf("=");
        env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
      }
    }
  } catch {}
  return env;
}

// ─── Parse args ───────────────────────────────────────────────────────────────
const args = Bun.argv.slice(2);
const printOnly = args.includes("--print");
const locIdx = args.indexOf("--location");
const locationOverride = locIdx !== -1 && args[locIdx + 1] ? args[locIdx + 1] : "";

const env = loadEnv();
const WEATHER_LOCATIONS: string[] = locationOverride
  ? [locationOverride]
  : (env.WEATHER_LOCATIONS ?? env.WEATHER_LOCATION ?? "Barcelona").split(",").map(s => s.trim()).filter(Boolean);
const NOTION_DB = "231f11fc-6655-80e8-8f51-d9ba5b7293b5";

// ─── Get Google access token ──────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ─── Weather via wttr.in ──────────────────────────────────────────────────────
interface WttrCondition {
  temp_C: string; FeelsLikeC: string; windspeedKmph: string;
  humidity: string; weatherDesc: [{ value: string }]; weatherCode: string;
}
interface WttrDay {
  date: string; hourly: Array<{ chanceofrain: string }>;
  astronomy: [{ sunrise: string; sunset: string }];
  maxtempC: string; mintempC: string;
}

function weatherIcon(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes("sunny") || d.includes("clear")) return "☀️";
  if (d.includes("partly cloudy")) return "⛅";
  if (d.includes("overcast") || d.includes("cloudy")) return "☁️";
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) return "🌧️";
  if (d.includes("thunder") || d.includes("storm")) return "⛈️";
  if (d.includes("snow") || d.includes("sleet") || d.includes("blizzard")) return "❄️";
  if (d.includes("fog") || d.includes("mist")) return "🌫️";
  if (d.includes("wind")) return "💨";
  return "🌤️";
}

async function getWeatherForLocation(location: string): Promise<string> {
  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
    const data = await res.json() as { current_condition: [WttrCondition]; weather: [WttrDay] };
    const c = data.current_condition[0];
    const day = data.weather[0];
    const icon = weatherIcon(c.weatherDesc[0].value);
    const rainChance = Math.max(...day.hourly.map(h => parseInt(h.chanceofrain)));
    return [
      `📍 ${location}`,
      `${icon} ${c.weatherDesc[0].value}`,
      `🌡 ${c.temp_C}°C (feels ${c.FeelsLikeC}°C)  ↑${day.maxtempC}° ↓${day.mintempC}°`,
      `💨 Wind ${c.windspeedKmph} km/h  💧 Humidity ${c.humidity}%`,
      `🌧 Rain chance ${rainChance}%`,
      `🌅 Sunrise ${day.astronomy[0].sunrise}  🌇 Sunset ${day.astronomy[0].sunset}`,
    ].join("\n");
  } catch (e) {
    return `📍 ${location}\n❌ Weather unavailable: ${e}`;
  }
}

async function getAllWeather(): Promise<string> {
  const results = await Promise.all(WEATHER_LOCATIONS.map(getWeatherForLocation));
  return results.join("\n\n");
}

// ─── Google Calendar events today ────────────────────────────────────────────
interface CalEvent {
  summary?: string;
  start?: { dateTime?: string; date?: string };
  location?: string;
}

async function getTodayEvents(accessToken: string): Promise<string> {
  try {
    const today = new Date();
    const timeMin = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
    const timeMax = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "20");
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await res.json() as { items?: CalEvent[] };
    const events = data.items ?? [];
    if (events.length === 0) return "📭 No events today — free day!";
    const lines = events.map(e => {
      const startRaw = e.start?.dateTime ?? e.start?.date ?? "";
      let timeStr = "All day";
      if (startRaw.includes("T")) {
        timeStr = new Date(startRaw).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", hour12: false });
      }
      const loc = e.location ? `  📍 ${e.location}` : "";
      return `  ${timeStr}  ${e.summary ?? "(no title)"}${loc}`;
    });
    return `📅 ${events.length} event${events.length !== 1 ? "s" : ""} today:\n${lines.join("\n")}`;
  } catch (e) {
    return `❌ Calendar unavailable: ${e}`;
  }
}

// ─── Notion tasks ─────────────────────────────────────────────────────────────
interface NotionTask {
  name: string;
  dueDate: string | null;   // YYYY-MM-DD or null
  status: string;
  priority: string;
  taskType: string;
  project: string;
  daysUntilDue: number | null;
}

function dueLabel(days: number | null): string {
  if (days === null) return "📌 No date";
  if (days < 0) return `🔴 ${Math.abs(days)}d overdue`;
  if (days === 0) return "🟡 Today";
  if (days === 1) return "🟠 Tomorrow";
  return `🟢 ${days}d`;
}

async function getNotionTasks(): Promise<NotionTask[]> {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const in7days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Status", status: { does_not_equal: "Done" } },
            { property: "Due date", date: { on_or_before: in7days } },
            { property: "Due date", date: { is_not_empty: true } },
          ],
        },
        sorts: [{ property: "Due date", direction: "ascending" }],
      }),
    });

    const data = await res.json() as { results?: Array<{ properties: Record<string, unknown> }> };
    const results = data.results ?? [];

    return results.map(page => {
      const p = page.properties as Record<string, { type: string; title?: Array<{ plain_text: string }>; date?: { start: string } | null; status?: { name: string }; select?: { name: string } | null; multi_select?: Array<{ name: string }> }>;

      const name = p["Task name"]?.title?.[0]?.plain_text ?? "(untitled)";
      const dueDate = p["Due date"]?.date?.start ?? null;
      const status = p["Status"]?.status?.name ?? "";
      const priority = p["Priority"]?.select?.name ?? "";
      const taskType = (p["Task type"]?.multi_select ?? []).map(t => t.name).join(", ");
      const project = p["Project"]?.select?.name ?? "";

      let daysUntilDue: number | null = null;
      if (dueDate) {
        const due = new Date(dueDate + "T00:00:00");
        const todayMidnight = new Date(todayStr + "T00:00:00");
        daysUntilDue = Math.round((due.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
      }

      return { name, dueDate, status, priority, taskType, project, daysUntilDue };
    });
  } catch (e) {
    return [];
  }
}

function formatTasksCompact(tasks: NotionTask[], limit = 10): string {
  if (tasks.length === 0) return "✅ No tasks due this week!";
  const shown = tasks.slice(0, limit);
  const lines = shown.map(t => `  ${dueLabel(t.daysUntilDue)}  ${t.name}`);
  const more = tasks.length > limit ? `\n  … and ${tasks.length - limit} more` : "";
  return `📋 ${tasks.length} task${tasks.length !== 1 ? "s" : ""} due this week:\n${lines.join("\n")}${more}`;
}

function formatTasksFull(tasks: NotionTask[]): string {
  if (tasks.length === 0) return "✅ No tasks due this week!";
  const lines = tasks.map(t => {
    const parts = [
      `  ${dueLabel(t.daysUntilDue)}  ${t.name}`,
      t.status ? `    Status: ${t.status}` : "",
      t.priority ? `    Priority: ${t.priority}` : "",
      t.project ? `    Project: ${t.project}` : "",
      t.taskType ? `    Type: ${t.taskType}` : "",
    ].filter(Boolean);
    return parts.join("\n");
  });
  return `📋 ${tasks.length} task${tasks.length !== 1 ? "s" : ""} due this week:\n${lines.join("\n\n")}`;
}

// ─── Channel send functions ───────────────────────────────────────────────────
async function sendEmail(subject: string, body: string): Promise<string> {
  const tmpFile = join(tmpdir(), `pai-briefing-${Date.now()}.py`);
  const pyScript = `
import smtplib, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
msg = MIMEMultipart()
msg['From'] = os.environ['GMAIL_USER']
msg['To'] = os.environ['GMAIL_RECIPIENT']
msg['Subject'] = os.environ['SUBJECT']
msg.attach(MIMEText(os.environ['BODY'], 'plain'))
with smtplib.SMTP_SSL('smtp.gmail.com', 465) as s:
    s.login(os.environ['GMAIL_USER'], os.environ['GMAIL_APP_PASSWORD'])
    s.sendmail(os.environ['GMAIL_USER'], os.environ['GMAIL_RECIPIENT'], msg.as_string())
print('sent')
`;
  writeFileSync(tmpFile, pyScript);
  const result = spawnSync("python3", [tmpFile], {
    encoding: "utf-8",
    env: {
      ...process.env,
      SUBJECT: subject,
      BODY: body,
      GMAIL_USER: env.GMAIL_USER,
      GMAIL_RECIPIENT: env.GMAIL_RECIPIENT,
      GMAIL_APP_PASSWORD: env.GMAIL_APP_PASSWORD,
    },
  });
  try { Bun.file(tmpFile); } catch {}
  return result.stdout?.includes("sent") ? `✅ Email → ${env.GMAIL_RECIPIENT}` : `❌ Email failed: ${result.stderr}`;
}

async function sendNtfy(title: string, body: string): Promise<string> {
  try {
    const ntfyTitle = title.replace(/[^\x00-\x7F]/g, c =>
      ({ "—": "-", "–": "-", "…": "...", "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"' })[c] ?? ""
    );
    const res = await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
      method: "POST",
      headers: { Title: ntfyTitle, Priority: "default", Tags: "bell" },
      body,
    });
    const data = (await res.json()) as { id?: string };
    return `✅ ntfy → ${env.NTFY_TOPIC} (id: ${data.id})`;
  } catch (e) {
    return `❌ ntfy failed: ${e}`;
  }
}

async function sendTelegram(title: string, body: string): Promise<string> {
  try {
    // Telegram Markdown: escape special chars in body, use plain text for safety
    const text = `${title}\n\n${body}`;
    const res = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
      }
    );
    const data = (await res.json()) as { ok: boolean; result?: { message_id: number }; description?: string };
    return data.ok ? `✅ Telegram (msg_id: ${data.result?.message_id})` : `❌ Telegram failed: ${data.description}`;
  } catch (e) {
    return `❌ Telegram failed: ${e}`;
  }
}

// ─── Main: fetch all in parallel ─────────────────────────────────────────────
const now = new Date();
const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const shortDate = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

console.log(`📋 Fetching briefing for ${dateStr}...`);

// Parallel: access token + weather + notion tasks
const [accessToken, weatherText, tasks] = await Promise.all([
  getAccessToken(),
  getAllWeather(),
  getNotionTasks(),
]);

// Calendar needs the access token from step above
const calendarText = await getTodayEvents(accessToken);

// ─── Compose two versions ─────────────────────────────────────────────────────
const header = `🌅 Daily Briefing — ${dateStr}\n\n🌤 Weather\n${weatherText}\n\n${calendarText}`;

const compactBriefing = [
  header,
  "",
  formatTasksCompact(tasks, 10),
  "",
  "— ATOM",
].join("\n");

const fullBriefing = [
  header,
  "",
  formatTasksFull(tasks),
  "",
  "— ATOM",
].join("\n");

console.log("\n" + fullBriefing + "\n");

if (!printOnly) {
  console.log("📤 Sending via all channels...");
  // ntfy + Telegram → compact, Email → full
  const [emailResult, ntfyResult, telegramResult] = await Promise.all([
    sendEmail(`Daily Briefing — ${shortDate}`, fullBriefing),
    sendNtfy(`Daily Briefing — ${shortDate}`, compactBriefing),
    sendTelegram(`🌅 Daily Briefing — ${shortDate}`, compactBriefing),
  ]);
  console.log(emailResult);
  console.log(ntfyResult);
  console.log(telegramResult);
} else {
  console.log("(--print mode: not sending)");
}
