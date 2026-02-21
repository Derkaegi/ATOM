#!/usr/bin/env bun
/**
 * NotionSync.ts — Fetch pinned Notion databases to local cache
 *
 * Usage:
 *   bun NotionSync.ts               <- sync if >60min old
 *   bun NotionSync.ts --refresh     <- force sync now
 *   bun NotionSync.ts --db <id>     <- also fetch extra DB
 *   bun NotionSync.ts --summary     <- print summary after sync
 *   bun NotionSync.ts --max-age 30  <- sync if >30min old
 *
 * Config in ~/.env:
 *   NOTION_TOKEN=ntn_...
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";

// ─── Load ~/.env ─────────────────────────────────────────────────────────────
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

// ─── Constants ───────────────────────────────────────────────────────────────
const PINNED_DBS: Record<string, string> = {
  tasks: "231f11fc665580e88f51d9ba5b7293b5",
  projects: "231f11fc66558096bf4ed377065f61d8",
};

const CACHE_PATH = join(homedir(), ".claude/MEMORY/STATE/notion-cache.json");
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const MAX_PAGES_PER_DB = 500;

// ─── Parse args ──────────────────────────────────────────────────────────────
const args = Bun.argv.slice(2);
const forceRefresh = args.includes("--refresh") || args.includes("-r");
const dryRun = args.includes("--dry-run");
const showSummary = args.includes("--summary");

let maxAgeMinutes = 60;
const maxAgeIdx = args.indexOf("--max-age");
if (maxAgeIdx !== -1 && args[maxAgeIdx + 1]) {
  maxAgeMinutes = parseInt(args[maxAgeIdx + 1], 10);
  if (isNaN(maxAgeMinutes) || maxAgeMinutes < 0) maxAgeMinutes = 60;
}

const extraDbs: Record<string, string> = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--db" && args[i + 1]) {
    const id = args[i + 1];
    extraDbs[id] = id;
    i++;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface CacheDB {
  db_id: string;
  fetched_at: string;
  title: string;
  schema: Record<string, string>;
  pages: SimplifiedPage[];
}

interface CacheFile {
  version: string;
  synced_at: string;
  databases: Record<string, CacheDB>;
}

interface SimplifiedPage {
  id: string;
  url: string;
  title: string;
  props: Record<string, unknown>;
}

// ─── Notion API helpers ──────────────────────────────────────────────────────
const env = loadEnv();
const NOTION_TOKEN = env.NOTION_TOKEN;

if (!NOTION_TOKEN) {
  process.stderr.write("NOTION_TOKEN not set in ~/.env\n");
  process.exit(1);
}

function notionHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${NOTION_TOKEN}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function notionFetch(url: string, options?: RequestInit, retried = false): Promise<Response> {
  try {
    const res = await fetch(url, { ...options, headers: notionHeaders() });
    return res;
  } catch (err) {
    if (!retried) {
      await new Promise(r => setTimeout(r, 2000));
      return notionFetch(url, options, true);
    }
    throw err;
  }
}

// ─── Extract simple property value ───────────────────────────────────────────
function extractPropertyValue(prop: any): unknown {
  if (!prop || !prop.type) return null;

  switch (prop.type) {
    case "title":
      return (prop.title ?? []).map((t: any) => t.plain_text ?? "").join("");
    case "rich_text":
      return (prop.rich_text ?? []).map((t: any) => t.plain_text ?? "").join("");
    case "number":
      return prop.number;
    case "select":
      return prop.select?.name ?? null;
    case "multi_select":
      return (prop.multi_select ?? []).map((s: any) => s.name);
    case "status":
      return prop.status?.name ?? null;
    case "checkbox":
      return prop.checkbox ?? false;
    case "date":
      if (!prop.date) return null;
      return prop.date.end
        ? { start: prop.date.start, end: prop.date.end }
        : prop.date.start;
    case "url":
      return prop.url;
    case "email":
      return prop.email;
    case "phone_number":
      return prop.phone_number;
    case "relation":
      return (prop.relation ?? []).map((r: any) => r.id);
    case "rollup":
      if (prop.rollup?.type === "number") return prop.rollup.number;
      if (prop.rollup?.type === "array") return prop.rollup.array?.map((i: any) => extractPropertyValue(i));
      return null;
    case "formula":
      if (prop.formula?.type === "string") return prop.formula.string;
      if (prop.formula?.type === "number") return prop.formula.number;
      if (prop.formula?.type === "boolean") return prop.formula.boolean;
      if (prop.formula?.type === "date") return prop.formula.date?.start ?? null;
      return null;
    case "people":
      return (prop.people ?? []).map((p: any) => p.name ?? p.id);
    case "files":
      return (prop.files ?? []).map((f: any) => f.name ?? f.external?.url ?? f.file?.url ?? "");
    case "created_time":
      return prop.created_time;
    case "last_edited_time":
      return prop.last_edited_time;
    case "created_by":
      return prop.created_by?.name ?? prop.created_by?.id ?? null;
    case "last_edited_by":
      return prop.last_edited_by?.name ?? prop.last_edited_by?.id ?? null;
    case "unique_id":
      return prop.unique_id ? `${prop.unique_id.prefix ?? ""}${prop.unique_id.number ?? ""}` : null;
    default:
      return null;
  }
}

// ─── Simplify a page ─────────────────────────────────────────────────────────
function simplifyPage(page: any): SimplifiedPage {
  const props: Record<string, unknown> = {};
  let title = "";

  for (const [name, prop] of Object.entries(page.properties ?? {})) {
    const p = prop as any;
    if (p.type === "title") {
      title = (p.title ?? []).map((t: any) => t.plain_text ?? "").join("");
    } else {
      const val = extractPropertyValue(p);
      if (val !== null && val !== undefined) {
        props[name] = val;
      }
    }
  }

  return {
    id: page.id,
    url: page.url,
    title,
    props,
  };
}

// ─── Fetch a single database ─────────────────────────────────────────────────
async function fetchDatabase(key: string, dbId: string): Promise<CacheDB | null> {
  // Step 1: Get database metadata/schema
  const metaRes = await notionFetch(`${NOTION_API}/databases/${dbId}`);

  if (metaRes.status === 401) {
    process.stderr.write(
      `Database ${dbId} not connected to Atom integration. Share it in Notion UI: ... menu -> Add connections -> Atom\n`
    );
    process.exit(1);
  }

  if (metaRes.status === 404) {
    process.stderr.write(`[NotionSync] Warning: Database ${key} (${dbId}) not found — skipping\n`);
    return null;
  }

  if (!metaRes.ok) {
    const body = await metaRes.text();
    process.stderr.write(`[NotionSync] Error fetching database ${key}: ${metaRes.status} ${body}\n`);
    process.exit(1);
  }

  const meta = await metaRes.json() as any;

  // Extract title
  const dbTitle = (meta.title ?? []).map((t: any) => t.plain_text ?? "").join("") || key;

  // Extract schema: property name -> type
  const schema: Record<string, string> = {};
  for (const [name, prop] of Object.entries(meta.properties ?? {})) {
    schema[name] = (prop as any).type;
  }

  // Step 2: Query all pages with pagination
  const pages: SimplifiedPage[] = [];
  let cursor: string | undefined = undefined;
  let fetchedCount = 0;

  while (fetchedCount < MAX_PAGES_PER_DB) {
    const body: any = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const queryRes = await notionFetch(`${NOTION_API}/databases/${dbId}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!queryRes.ok) {
      const errBody = await queryRes.text();
      process.stderr.write(`[NotionSync] Error querying ${key}: ${queryRes.status} ${errBody}\n`);
      process.exit(1);
    }

    const queryData = await queryRes.json() as any;
    const results = queryData.results ?? [];

    for (const page of results) {
      if (fetchedCount >= MAX_PAGES_PER_DB) break;
      pages.push(simplifyPage(page));
      fetchedCount++;
    }

    if (!queryData.has_more || !queryData.next_cursor) break;
    cursor = queryData.next_cursor;
  }

  return {
    db_id: dbId,
    fetched_at: new Date().toISOString(),
    title: dbTitle,
    schema,
    pages,
  };
}

// ─── Check cache freshness ──────────────────────────────────────────────────
function isCacheFresh(): boolean {
  if (forceRefresh) return false;
  if (!existsSync(CACHE_PATH)) return false;

  try {
    const cache = JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as CacheFile;
    if (!cache.synced_at) return false;

    const age = Date.now() - new Date(cache.synced_at).getTime();
    return age < maxAgeMinutes * 60 * 1000;
  } catch {
    return false;
  }
}

// ─── Print summary ───────────────────────────────────────────────────────────
function printSummary(cache: CacheFile): void {
  const dbKeys = Object.keys(cache.databases);
  const totalPages = dbKeys.reduce((sum, k) => sum + cache.databases[k].pages.length, 0);
  const age = Math.round((Date.now() - new Date(cache.synced_at).getTime()) / 1000 / 60);
  console.log(
    `[NotionSync] Cache: ${dbKeys.length} databases, ${totalPages} pages total, synced ${age}min ago`
  );
  for (const key of dbKeys) {
    const db = cache.databases[key];
    console.log(`  ${key}: "${db.title}" — ${db.pages.length} pages`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const startTime = Date.now();

  // Check if sync is needed
  if (isCacheFresh() && Object.keys(extraDbs).length === 0) {
    if (showSummary) {
      const cache = JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as CacheFile;
      printSummary(cache);
    } else {
      console.log("[NotionSync] Cache is fresh — skipping sync");
    }
    process.exit(0);
  }

  // Build the database map to fetch
  const dbsToFetch: Record<string, string> = { ...PINNED_DBS, ...extraDbs };

  if (dryRun) {
    console.log("[NotionSync] Dry run — would fetch:");
    for (const [key, id] of Object.entries(dbsToFetch)) {
      console.log(`  ${key}: ${id}`);
    }
    process.exit(0);
  }

  // Load existing cache to preserve extra DBs
  let existingCache: CacheFile | null = null;
  try {
    if (existsSync(CACHE_PATH)) {
      existingCache = JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as CacheFile;
    }
  } catch {}

  // Fetch all databases
  const databases: Record<string, CacheDB> = {};
  let totalPages = 0;

  for (const [key, id] of Object.entries(dbsToFetch)) {
    const db = await fetchDatabase(key, id);
    if (db) {
      databases[key] = db;
      totalPages += db.pages.length;
    }
  }

  // Preserve any extra DBs from previous cache that we did not re-fetch
  if (existingCache) {
    for (const [key, db] of Object.entries(existingCache.databases)) {
      if (!(key in databases)) {
        databases[key] = db;
      }
    }
  }

  // Build cache
  const cache: CacheFile = {
    version: "1",
    synced_at: new Date().toISOString(),
    databases,
  };

  // Ensure directory exists
  const cacheDir = dirname(CACHE_PATH);
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  // Write cache
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");

  const elapsed = Date.now() - startTime;
  const dbCount = Object.keys(databases).length;
  console.log(`[NotionSync] Synced ${dbCount} databases -> ${totalPages} pages total in ${elapsed}ms`);

  if (showSummary) {
    printSummary(cache);
  }
}

main().catch(err => {
  process.stderr.write(`[NotionSync] Fatal error: ${err}\n`);
  process.exit(1);
});
