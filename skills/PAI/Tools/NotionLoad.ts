#!/usr/bin/env bun
/**
 * NotionLoad.ts — Read Notion cache and output token-friendly summary
 *
 * Reads the local cache file (zero API calls) and outputs a concise summary
 * of tasks/projects for injection into PAI session context.
 * Called by hooks — must be fast and silent on error.
 *
 * Usage:
 *   bun NotionLoad.ts                        # text summary (default)
 *   bun NotionLoad.ts --format json           # full cache dump
 *   bun NotionLoad.ts --format tasks          # task lines only
 *   bun NotionLoad.ts --db "My Database"      # filter to one database
 *   bun NotionLoad.ts --stale-warn            # warn if cache >60min old
 *   bun NotionLoad.ts --check                 # exit 0 fresh, exit 1 stale/missing
 *
 * Cache: ~/.claude/MEMORY/STATE/notion-cache.json
 * Dependencies: none (Bun built-ins only)
 */

import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// ─── Load ~/.env ────────────────────────────────────────────────────────────
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

// ─── Relative time helper ───────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Cache freshness check ─────────────────────────────────────────────────
function isCacheStale(syncedAt: string): boolean {
  const diff = Date.now() - new Date(syncedAt).getTime();
  return diff > 60 * 60 * 1000; // >60 minutes
}

// ─── Status filtering ───────────────────────────────────────────────────────
const DONE_STATUSES = new Set([
  "done", "archived", "completed",
  "Done", "Archived", "Completed",
  "DONE", "ARCHIVED", "COMPLETED",
]);

function isDoneStatus(status: string): boolean {
  return DONE_STATUSES.has(status) || DONE_STATUSES.has(status.trim());
}

// ─── Extract property values from Notion page objects ───────────────────────
function extractTitle(page: any): string {
  if (!page?.properties) return "Untitled";
  for (const prop of Object.values(page.properties) as any[]) {
    if (prop?.type === "title" && Array.isArray(prop.title)) {
      return prop.title.map((t: any) => t?.plain_text ?? "").join("") || "Untitled";
    }
  }
  // Fallback: check for a "Name" or "Title" property with rich_text
  for (const [key, prop] of Object.entries(page.properties) as [string, any][]) {
    if ((key === "Name" || key === "Title") && prop?.type === "rich_text") {
      return prop.rich_text.map((t: any) => t?.plain_text ?? "").join("") || "Untitled";
    }
  }
  return "Untitled";
}

function extractStatus(page: any): string {
  if (!page?.properties) return "";
  for (const prop of Object.values(page.properties) as any[]) {
    if (prop?.type === "status" && prop.status?.name) {
      return prop.status.name;
    }
    if (prop?.type === "select" && prop.select?.name) {
      // Check if this looks like a status field
      const name = prop.select.name;
      if (["Todo", "In Progress", "Done", "Not Started", "Blocked", "Completed", "Archived",
           "Active", "Planning", "On Hold", "Cancelled"].some(s =>
        name.toLowerCase().includes(s.toLowerCase()))) {
        return name;
      }
    }
  }
  // Fallback: look for property named "Status"
  const statusProp = page.properties?.Status;
  if (statusProp?.type === "select" && statusProp.select?.name) return statusProp.select.name;
  if (statusProp?.type === "status" && statusProp.status?.name) return statusProp.status.name;
  return "";
}

function extractDueDate(page: any): string | null {
  if (!page?.properties) return null;
  for (const [key, prop] of Object.entries(page.properties) as [string, any][]) {
    if (prop?.type === "date" && prop.date?.start) {
      // Prefer properties named "Due", "Due Date", "Deadline"
      if (["due", "due date", "deadline", "date"].includes(key.toLowerCase())) {
        return prop.date.start;
      }
    }
  }
  // Fallback: return first date property found
  for (const prop of Object.values(page.properties) as any[]) {
    if (prop?.type === "date" && prop.date?.start) {
      return prop.date.start;
    }
  }
  return null;
}

function extractCreatedTime(page: any): string {
  return page?.created_time ?? "1970-01-01T00:00:00.000Z";
}

// ─── Sort items: due date (soonest first), then created time ────────────────
function sortItems(items: any[]): any[] {
  return items.sort((a, b) => {
    const dueA = extractDueDate(a);
    const dueB = extractDueDate(b);
    // Items with due dates come first
    if (dueA && !dueB) return -1;
    if (!dueA && dueB) return 1;
    if (dueA && dueB) {
      const cmp = new Date(dueA).getTime() - new Date(dueB).getTime();
      if (cmp !== 0) return cmp;
    }
    // Fallback: sort by created time
    return new Date(extractCreatedTime(a)).getTime() - new Date(extractCreatedTime(b)).getTime();
  });
}

// ─── Parse CLI args ─────────────────────────────────────────────────────────
const args = Bun.argv.slice(2);
let format: "text" | "json" | "tasks" = "text";
let dbFilter: string | null = null;
let staleWarn = false;
let checkMode = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--format" && args[i + 1]) {
    const f = args[++i];
    if (f === "text" || f === "json" || f === "tasks") format = f;
  } else if (args[i] === "--db" && args[i + 1]) {
    dbFilter = args[++i];
  } else if (args[i] === "--stale-warn") {
    staleWarn = true;
  } else if (args[i] === "--check") {
    checkMode = true;
  }
}

// ─── Read cache file ────────────────────────────────────────────────────────
const CACHE_PATH = join(homedir(), ".claude", "MEMORY", "STATE", "notion-cache.json");

let raw: string;
try {
  raw = readFileSync(CACHE_PATH, "utf-8");
} catch {
  if (checkMode) process.exit(1);
  console.log("[NotionLoad] No cache. Run: bun NotionSync.ts");
  process.exit(0);
}

let cache: any;
try {
  cache = JSON.parse(raw);
} catch {
  if (checkMode) process.exit(1);
  console.log("[NotionLoad] Cache corrupt. Run: bun NotionSync.ts --refresh");
  process.exit(0);
}

// ─── Validate cache structure ───────────────────────────────────────────────
const syncedAt: string = cache?.synced_at ?? cache?.syncedAt ?? cache?.last_sync ?? "";
if (!syncedAt && !cache?.databases && !cache?.pages) {
  if (checkMode) process.exit(1);
  console.log("[NotionLoad] Cache corrupt. Run: bun NotionSync.ts --refresh");
  process.exit(0);
}

// ─── --check mode ───────────────────────────────────────────────────────────
if (checkMode) {
  if (!syncedAt || isCacheStale(syncedAt)) process.exit(1);
  process.exit(0);
}

// ─── Stale warning ──────────────────────────────────────────────────────────
if (staleWarn && syncedAt && isCacheStale(syncedAt)) {
  console.error(`[NotionLoad] Warning: cache is stale (synced ${relativeTime(syncedAt)}). Run: bun NotionSync.ts --refresh`);
}

// ─── --format json: dump everything ─────────────────────────────────────────
if (format === "json") {
  console.log(JSON.stringify(cache, null, 2));
  process.exit(0);
}

// ─── Build database map from cache ──────────────────────────────────────────
// Support multiple cache structures:
//   { databases: { "DB Name": [...pages], ... }, synced_at: "..." }
//   { databases: [{ id, title, pages: [...] }, ...], synced_at: "..." }
//   { "DB Name": [...pages], synced_at: "..." }
//   { pages: [...], synced_at: "..." }

interface DbEntry {
  name: string;
  pages: any[];
}

const databases: DbEntry[] = [];

if (cache.databases && typeof cache.databases === "object") {
  if (Array.isArray(cache.databases)) {
    // Array of { id, title/name, pages/results }
    for (const db of cache.databases) {
      const name = db.title ?? db.name ?? db.id ?? "Unknown";
      const pages = db.pages ?? db.results ?? [];
      databases.push({ name, pages: Array.isArray(pages) ? pages : [] });
    }
  } else {
    // Object keyed by name
    for (const [name, pages] of Object.entries(cache.databases)) {
      databases.push({ name, pages: Array.isArray(pages) ? pages : [] });
    }
  }
} else if (cache.pages && Array.isArray(cache.pages)) {
  databases.push({ name: "Pages", pages: cache.pages });
} else {
  // Try top-level keys that look like arrays of pages
  for (const [key, val] of Object.entries(cache)) {
    if (key === "synced_at" || key === "syncedAt" || key === "last_sync" || key === "metadata") continue;
    if (Array.isArray(val) && (val as any[]).length > 0) {
      databases.push({ name: key, pages: val as any[] });
    }
  }
}

// ─── Apply --db filter ──────────────────────────────────────────────────────
const filteredDbs = dbFilter
  ? databases.filter(db =>
      db.name.toLowerCase().includes(dbFilter!.toLowerCase()) ||
      db.name === dbFilter
    )
  : databases;

if (filteredDbs.length === 0 && dbFilter) {
  console.log(`[NotionLoad] No database matching "${dbFilter}". Available: ${databases.map(d => d.name).join(", ")}`);
  process.exit(0);
}

// ─── Format item line ───────────────────────────────────────────────────────
function formatItemLine(page: any): string {
  const title = extractTitle(page);
  const status = extractStatus(page);
  const due = extractDueDate(page);
  let line = "  ";
  if (status) {
    line += `[${status}] ${title}`;
  } else {
    line += title;
  }
  if (due) line += ` (due: ${due})`;
  return line;
}

// ─── Detect if a database looks like "tasks" ───────────────────────────────
function isTaskDb(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("task") || n.includes("todo") || n.includes("to-do") || n.includes("to do");
}

// ─── Format output ──────────────────────────────────────────────────────────
const MAX_ITEMS_TEXT = 20;
const lines: string[] = [];

if (format === "text") {
  const timeLabel = syncedAt ? relativeTime(syncedAt) : "unknown";
  lines.push(`NOTION CONTEXT (cached ${timeLabel})`);
  lines.push("---");
}

for (const db of filteredDbs) {
  let pages = db.pages;
  const totalCount = pages.length;

  // Smart filtering: skip done items unless <5 total
  if (totalCount >= 5) {
    pages = pages.filter(p => !isDoneStatus(extractStatus(p)));
  }

  // Sort by due date then created time
  pages = sortItems(pages);

  if (format === "tasks") {
    // Tasks mode: only output task-like databases, bare lines
    if (!isTaskDb(db.name) && filteredDbs.length > 1 && !dbFilter) continue;
    const slice = pages.slice(0, MAX_ITEMS_TEXT);
    for (const page of slice) {
      console.log(formatItemLine(page).trim());
    }
    if (pages.length > MAX_ITEMS_TEXT) {
      console.log(`... and ${pages.length - MAX_ITEMS_TEXT} more (use --format json for full list)`);
    }
  } else {
    // Text mode
    lines.push(`${db.name} (${pages.length} items):`);
    const slice = pages.slice(0, MAX_ITEMS_TEXT);
    for (const page of slice) {
      lines.push(formatItemLine(page));
    }
    if (pages.length > MAX_ITEMS_TEXT) {
      lines.push(`  ... and ${pages.length - MAX_ITEMS_TEXT} more (use --format json for full list)`);
    }
    if (pages.length === 0) {
      lines.push("  (empty)");
    }
    lines.push("");
  }
}

if (format === "text") {
  lines.push("---");
  const cacheLabel = syncedAt ? `Cache: ${relativeTime(syncedAt)}` : "Cache: unknown age";
  lines.push(`[${cacheLabel}] [Run 'bun NotionSync.ts --refresh' to update]`);
  console.log(lines.join("\n"));
}
