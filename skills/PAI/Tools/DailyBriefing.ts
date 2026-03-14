#!/usr/bin/env bun
/**
 * DailyBriefing.ts — Daily briefing: weather + calendar + Notion tasks → all PAI channels
 *
 * Usage:
 *   bun DailyBriefing.ts                    ← send to all channels
 *   bun DailyBriefing.ts --print            ← print only, don't send
 *   bun DailyBriefing.ts --location Munich  ← override weather location
 *
 * Channels:
 *   ntfy   → compact briefing (title + due date, max 10 tasks)
 *   Obsidian → full briefing saved to MONAD/05-JOURNAL/Daily-Notes/
 *
 * Config in ~/.env:
 *   WEATHER_LOCATION=Barcelona
 *   NOTION_TOKEN
 *   NTFY_TOPIC
 *
 * Calendar via gws CLI (~/.local/bin/gws) — no OAuth tokens needed.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { spawnSync } from "child_process";
const MONAD_DAILY_NOTES = join(homedir(), "Documents", "MONAD", "05-JOURNAL", "Daily-Notes");

// ─── Load ~/.env ──────────────────────────────────────────────────────────────
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    for (const line of readFileSync(join(homedir(), ".env"), "utf-8").split("\n")) {
      const t = line.trim();
      if (t && !t.startsWith("#") && t.includes("=")) {
        const eq = t.indexOf("=");
        const val = t.slice(eq + 1).trim();
        env[t.slice(0, eq).trim()] = val.replace(/^["']|["']$/g, "");
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

// ─── Weather via open-meteo + nominatim geocoding ────────────────────────────
// WMO weather code → description + icon
function wmoDescription(code: number): { desc: string; icon: string } {
  if (code === 0) return { desc: "Clear sky", icon: "☀️" };
  if (code === 1) return { desc: "Mainly clear", icon: "🌤️" };
  if (code === 2) return { desc: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { desc: "Overcast", icon: "☁️" };
  if (code <= 49) return { desc: "Fog / mist", icon: "🌫️" };
  if (code <= 59) return { desc: "Drizzle", icon: "🌦️" };
  if (code <= 69) return { desc: "Rain", icon: "🌧️" };
  if (code <= 79) return { desc: "Snow", icon: "❄️" };
  if (code <= 84) return { desc: "Rain showers", icon: "🌧️" };
  if (code <= 86) return { desc: "Snow showers", icon: "🌨️" };
  if (code <= 99) return { desc: "Thunderstorm", icon: "⛈️" };
  return { desc: "Unknown", icon: "🌡" };
}

async function geocode(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: { "User-Agent": "PAI-DailyBriefing/1.0" },
    });
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

async function getWeatherForLocation(location: string): Promise<string> {
  try {
    const coords = await geocode(location);
    if (!coords) return `📍 ${location}\n❌ Location not found`;

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", coords.lat.toString());
    url.searchParams.set("longitude", coords.lon.toString());
    url.searchParams.set("current", "temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "1");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as {
      current: { temperature_2m: number; apparent_temperature: number; weathercode: number; windspeed_10m: number; relativehumidity_2m: number };
      daily: { temperature_2m_max: [number]; temperature_2m_min: [number]; precipitation_probability_max: [number]; sunrise: [string]; sunset: [string] };
    };

    const c = data.current;
    const d = data.daily;
    const { desc, icon } = wmoDescription(c.weathercode);
    const sunrise = d.sunrise[0].split("T")[1];
    const sunset = d.sunset[0].split("T")[1];
    const rainChance = d.precipitation_probability_max[0] ?? 0;

    return [
      `📍 ${location}`,
      `${icon} ${desc}`,
      `🌡 ${c.temperature_2m}°C (feels ${c.apparent_temperature}°C)  ↑${d.temperature_2m_max[0]}° ↓${d.temperature_2m_min[0]}°`,
      `💨 Wind ${c.windspeed_10m} km/h  💧 Humidity ${c.relativehumidity_2m}%`,
      `🌧 Rain chance ${rainChance}%`,
      `🌅 Sunrise ${sunrise}  🌇 Sunset ${sunset}`,
    ].join("\n");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return `📍 ${location}\n❌ Weather unavailable: ${msg}`;
  }
}

async function getAllWeather(): Promise<string> {
  const results = await Promise.all(WEATHER_LOCATIONS.map(loc => getWeatherForLocation(loc)));
  return results.join("\n\n");
}

// ─── Google Calendar events today (via gws CLI) ───────────────────────────────
interface CalEvent {
  summary?: string;
  start?: { dateTime?: string; date?: string };
  location?: string;
}

function getTodayEvents(): string {
  try {
    const today = new Date();
    const timeMin = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
    const timeMax = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    const result = spawnSync(
      `${process.env.HOME}/.local/bin/gws`,
      ["calendar", "events", "list",
        "--params", JSON.stringify({
          calendarId: "primary",
          singleEvents: true,
          orderBy: "startTime",
          timeMin,
          timeMax,
          maxResults: 20,
        }),
        "--format", "json",
      ],
      { encoding: "utf-8", timeout: 15_000 }
    );

    if (result.status !== 0) {
      return `❌ Calendar unavailable: ${result.stderr || "gws error"}`;
    }

    const data = JSON.parse(result.stdout) as { items?: CalEvent[] };
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

    return `📅 Calendar\n${lines.join("\n")}`;
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

// ─── Main: fetch all in parallel ─────────────────────────────────────────────
const now = new Date();
const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const shortDate = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

console.log(`📋 Fetching briefing for ${dateStr}...`);

// Parallel: weather + notion tasks
const [weatherText, tasks] = await Promise.all([
  getAllWeather(),
  getNotionTasks(),
]);

// Calendar via gws CLI (synchronous)
const calendarText = getTodayEvents();

// ─── Compose two versions ─────────────────────────────────────────────────────
const divider = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

const header = [
  `🌅 Daily Briefing — ${dateStr}`,
  divider,
  "",
  "🌤  WEATHER",
  divider,
  weatherText,
  "",
  divider,
  "📆  CALENDAR",
  divider,
  calendarText,
].join("\n");

const compactBriefing = [
  header,
  "",
  divider,
  "📋  TASKS",
  divider,
  formatTasksCompact(tasks, 10),
  "",
  "— ATOM",
].join("\n");

const fullBriefing = [
  header,
  "",
  divider,
  "📋  TASKS",
  divider,
  formatTasksFull(tasks),
  "",
  "— ATOM",
].join("\n");

console.log("\n" + fullBriefing + "\n");

if (!printOnly) {
  console.log("📤 Sending...");

  // ntfy notification
  const ntfyResult = await sendNtfy(`Daily Briefing — ${shortDate}`, compactBriefing);
  console.log(ntfyResult);

  // Write to Obsidian
  try {
    mkdirSync(MONAD_DAILY_NOTES, { recursive: true });
    const isoDate = now.toISOString().split("T")[0];
    const obsidianPath = join(MONAD_DAILY_NOTES, `Daily-Briefing-${isoDate}.md`);
    writeFileSync(obsidianPath, fullBriefing, "utf-8");
    console.log(`✅ Obsidian → ${obsidianPath}`);
  } catch (e) {
    console.error(`❌ Obsidian write failed: ${e}`);
  }
} else {
  console.log("(--print mode: not sending)");
}
