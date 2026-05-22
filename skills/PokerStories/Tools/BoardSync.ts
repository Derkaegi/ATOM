#!/usr/bin/env bun
/**
 * PokerStories BoardSync — CLI tool for Focalboard + Drive sync operations
 *
 * Commands:
 *   status                    — show all cards with band/status/words
 *   update-words              — read MONAD word counts, update board via SQLite
 *   update-card --id X [...]  — update a single card's properties via SQLite
 *   refresh-token             — get fresh token from VPS DB
 *
 * Focalboard API quirk: PATCH only updates title. Properties require SQLite.
 */

import { execSync, spawnSync } from "child_process";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";

const BOARD_ID = "b3tk9ri75otfidnartfnass9a8a";
const API_BASE = "https://boards.pokerstories.wtf/api/v2";
const VPS_SSH = "SSH_AUTH_SOCK= ssh -i ~/.ssh/atom -o IdentitiesOnly=yes -o StrictHostKeyChecking=no root@72.60.80.232";
const DB_PATH = "/var/lib/docker/volumes/focalboard_focalboard_data/_data/focalboard.db";
const USER_ID = "uko856ynwd3bkim3bgein3mop4r";

const MONAD_B1 = `${process.env.HOME}/Documents/MONAD/02-PROJECTS/PokerStories-Series/Band-1-Golden-Age/02-Chapters`;
const MONAD_B2 = `${process.env.HOME}/Documents/MONAD/02-PROJECTS/PokerStories-Series/Band-2-Deep-Dive/02-Chapters`;

// MONAD filename → { cardId, band, chapter, driveId }
const CHAPTER_MAP: Record<string, { cardId: string; band: string; chapter: string; driveId: string }> = {
  // Band 1
  "01-First-Hands-and-First-Hustles.md":            { cardId: "cps_ch01_firsthands_000000000", band: "band1", chapter: "B1-01", driveId: "1vHl-kC7RQ-c4wwi4CJaVN7y0knlUNKVS" },
  "02-Download-Qualify-Ship.md":                    { cardId: "cps_ch02_download_00000000000", band: "band1", chapter: "B1-02", driveId: "1N-CgzLZz_ThmiYJjuisSK_1f21hYXj3N" },
  "03-Sunday-Rituals-and-Million-Dollar-Clicks.md": { cardId: "cps_ch03_sundayrit_0000000000", band: "band1", chapter: "B1-03", driveId: "1YDAbzPrd564K3e4vcuGQEyhICASoDyS1" },
  "04-Nosebleeds-and-Railbird-Theatre.md":          { cardId: "cps_ch04_nosebleed_0000000000", band: "band1", chapter: "B1-04", driveId: "1jXwuoMk5HQqFENcX9boGZdd3y9MkQ12c" },
  "05-Black-Friday.md":                             { cardId: "cps_ch05_blackfri_00000000000", band: "band1", chapter: "B1-05", driveId: "1d6cdhobqwqjz2YLshgC7UQozROCoi0ZW" },
  "05a-Exkurs-Game-Variants.md":                    { cardId: "",                              band: "band1", chapter: "B1-5a", driveId: "1qV0pYBEQVjty0LT2XB0CCnykmOLtCBuh" },
  "06-Women-of-the-Golden-Age.md":                  { cardId: "c1jxp8jh17bn3d7yp5zq3i5kpzr",   band: "band1", chapter: "B1-06", driveId: "1egg2VtUIpg7JxlaQ8pY33h9PcXVlQrYf" },
  // Band 2
  "01-Poker-Schools.md":        { cardId: "cps_ch06_training_00000000000", band: "band2", chapter: "B2-01", driveId: "1ZYlu3M1PK1IO-IA2yk7QG-dUV-NRVioM" },
  "02-Poker-Tools.md":          { cardId: "cps_ch07_pokertools_000000000", band: "band2", chapter: "B2-02", driveId: "1iKTYIsd9-kW3k1NVdb0TuROfUAGBXCYn" },
  "02a-Exkurs-ICM-GTO.md":      { cardId: "cps_ch7a_icmgto_000000000000a", band: "band2", chapter: "B2-2a", driveId: "1tJ24xt0NrwtvXmE33yhACKSDElGB1FjD" },
  "02b-Exkurs-Data-Mining.md":  { cardId: "cp9b9gj5xpiyk5jox7ryz43my6r",  band: "band2", chapter: "B2-2b", driveId: "1Z5_XgjTg-NEs2sVBE4jJaVs635f7_otP" },
  "03-Poker-Platforms.md":      { cardId: "cps_ch08_platforms_0000000000", band: "band2", chapter: "B2-03", driveId: "12v1QD14N6vOhELKBcvENjlidNJCxTZ_2" },
  "03a-Exkurs-Networks.md":     { cardId: "cbmmsrn39djdaim1aaykbqy5w1o",   band: "band2", chapter: "B2-3a", driveId: "1a39z7w_rsogdrHlOHCzVN8f3BuM-kTfj" },
  "03b-Exkurs-Country-Pools.md":{ cardId: "c4cb4yxxtnjf1d7bdqkwjftk3pw",   band: "band2", chapter: "B2-3b", driveId: "1J59J59RE486NaQWXJZuMGZzDIVNnIXaY" },
  "04-Economy-Rakeback.md":     { cardId: "cps_ch09_rakeback_00000000000", band: "band2", chapter: "B2-04", driveId: "1G2V4Mn-idmkeJ0e1RbvKIYCqZe66vlf1" },
  "04a-Exkurs-Staking.md":      { cardId: "c1p1c9586cb8t1cj7b4n8cpkpso",   band: "band2", chapter: "B2-4a", driveId: "16suXVS8ip5fZJVRli9nBtf6Wh9wDPw1Q" },
  "05-Tournaments.md":          { cardId: "cps_ch10_virtualfelt_0000000a", band: "band2", chapter: "B2-05", driveId: "1B-MndNfnNoTDBMLiUk0aqpZJyFBQJuvy" },
};

function getToken(): string {
  // Try ~/.env first
  try {
    const envContent = readFileSync(`${process.env.HOME}/.env`, "utf8");
    const match = envContent.match(/FOCALBOARD_TOKEN=([^\s\n]+)/);
    if (match?.[1]) return match[1];
  } catch {}

  // Fall back to live query from DB
  console.error("FOCALBOARD_TOKEN not in ~/.env — fetching from VPS...");
  const token = vpsQuery(
    `SELECT token FROM sessions WHERE user_id='${USER_ID}' ORDER BY update_at DESC LIMIT 1;`
  ).trim();
  if (!token) throw new Error("No token found. Log in to Focalboard manually to create a session.");
  console.error(`Got token: ${token.slice(0, 8)}...`);
  return token;
}

function vpsQuery(sql: string): string {
  const cmd = `${VPS_SSH} "sqlite3 ${DB_PATH} '${sql.replace(/'/g, "'\\''").replace(/\n/g, " ")}'"`;
  const result = spawnSync("bash", ["-c", cmd], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`VPS query failed: ${result.stderr}`);
  return result.stdout.trim();
}

function vpsExec(sql: string): void {
  const tmpFile = `/tmp/ps_update_${Date.now()}.sql`;
  require("fs").writeFileSync(tmpFile, sql);
  const scpCmd = `SSH_AUTH_SOCK= scp -i ~/.ssh/atom -o IdentitiesOnly=yes -o StrictHostKeyChecking=no ${tmpFile} root@72.60.80.232:/tmp/ps_update.sql`;
  const runCmd = `${VPS_SSH} "sqlite3 ${DB_PATH} < /tmp/ps_update.sql"`;
  execSync(scpCmd, { stdio: "inherit" });
  execSync(runCmd, { stdio: "inherit" });
}

function apiGet(path: string): any {
  const token = getToken();
  const result = spawnSync("curl", [
    "-s",
    "-H", `Authorization: Bearer ${token}`,
    "-H", "X-Requested-With: XMLHttpRequest",
    `${API_BASE}${path}`,
  ], { encoding: "utf8" });
  return JSON.parse(result.stdout);
}

function countWords(filePath: string): number {
  try {
    const content = readFileSync(filePath, "utf8");
    // Strip frontmatter, count words
    const body = content.replace(/^---[\s\S]*?---\n/, "");
    return body.split(/\s+/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

function cmdStatus(): void {
  const cards = apiGet(`/boards/${BOARD_ID}/blocks?type=card`) as any[];

  const b1 = cards
    .filter(c => c.fields?.properties?.band === "band1")
    .sort((a, b) => (a.fields?.properties?.chapter ?? "").localeCompare(b.fields?.properties?.chapter ?? ""));
  const b2 = cards
    .filter(c => c.fields?.properties?.band === "band2")
    .sort((a, b) => (a.fields?.properties?.chapter ?? "").localeCompare(b.fields?.properties?.chapter ?? ""));
  const noBand = cards.filter(c => !c.fields?.properties?.band);

  console.log(`\nTotal cards: ${cards.length}\n`);

  const printCard = (c: any) => {
    const p = c.fields?.properties ?? {};
    const ch = (p.chapter ?? "?").padEnd(6);
    const title = (c.title ?? "").slice(0, 52).padEnd(52);
    const status = (p.status ?? "?").padEnd(7);
    const words = String(p.words ?? 0).padStart(6);
    const id = c.id.slice(0, 12);
    console.log(`  [${ch}] ${title} | ${status} | ${words} wds | ${id}`);
  };

  const b1Words = b1.reduce((s, c) => s + (Number(c.fields?.properties?.words) || 0), 0);
  const b2Words = b2.reduce((s, c) => s + (Number(c.fields?.properties?.words) || 0), 0);

  console.log(`=== BAND 1 — Golden Age (${b1.length} cards, ${b1Words.toLocaleString()} words / target ~49,100) ===`);
  b1.forEach(printCard);

  console.log(`\n=== BAND 2 — Deep Dive (${b2.length} cards, ${b2Words.toLocaleString()} words / target ~70,000) ===`);
  b2.forEach(printCard);

  if (noBand.length > 0) {
    console.log(`\n!!! NO BAND (${noBand.length} cards — need fixing) !!!`);
    noBand.forEach(c => console.log(`  ${c.id}: ${c.title}`));
  }

  console.log(`\nTotal: ${(b1Words + b2Words).toLocaleString()} words`);
}

function cmdUpdateWords(): void {
  const allFiles: { path: string; filename: string; band: "b1" | "b2" }[] = [];

  try {
    readdirSync(MONAD_B1).forEach(f => {
      if (f.endsWith(".md")) allFiles.push({ path: join(MONAD_B1, f), filename: f, band: "b1" });
    });
  } catch (e) { console.error(`Warning: Could not read B1 dir: ${e}`); }

  try {
    readdirSync(MONAD_B2).forEach(f => {
      if (f.endsWith(".md")) allFiles.push({ path: join(MONAD_B2, f), filename: f, band: "b2" });
    });
  } catch (e) { console.error(`Warning: Could not read B2 dir: ${e}`); }

  const updates: { cardId: string; words: number; filename: string }[] = [];

  for (const { path: filePath, filename } of allFiles) {
    const info = CHAPTER_MAP[filename];
    if (!info?.cardId) continue;

    const words = countWords(filePath);
    updates.push({ cardId: info.cardId, words, filename });
  }

  if (updates.length === 0) {
    console.log("No cards to update (no matching filenames in CHAPTER_MAP).");
    return;
  }

  const ts = Date.now();
  const sqls = updates.map(({ cardId, words }) =>
    `UPDATE blocks SET fields = json_set(fields, '$.properties.words', ${words}), update_at = ${ts} WHERE id = '${cardId}';`
  ).join("\n");

  console.log(`Updating ${updates.length} cards...`);
  vpsExec(sqls);

  updates.forEach(({ filename, words }) => console.log(`  ${filename} → ${words.toLocaleString()} words`));
  console.log("Done.");
}

function cmdUpdateCard(args: string[]): void {
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const id = get("--id");
  if (!id) { console.error("--id <CARD_ID> required"); process.exit(1); }

  const status = get("--status");
  const words = get("--words");
  const assignee = get("--assignee");
  const title = get("--title");

  const ts = Date.now();
  const setParts: string[] = [];

  if (status) setParts.push(`json_set(fields, '$.properties.status', '${status}')`);
  if (words) setParts.push(`json_set(fields, '$.properties.words', ${Number(words)})`);
  if (assignee) setParts.push(`json_set(fields, '$.properties.assignee', '${assignee}')`);

  if (setParts.length > 0) {
    // Chain json_set calls
    let fieldExpr = "fields";
    if (status) fieldExpr = `json_set(${fieldExpr}, '$.properties.status', '${status}')`;
    if (words) fieldExpr = `json_set(${fieldExpr}, '$.properties.words', ${Number(words)})`;
    if (assignee) fieldExpr = `json_set(${fieldExpr}, '$.properties.assignee', '${assignee}')`;

    const sql = `UPDATE blocks SET fields = ${fieldExpr}, update_at = ${ts} WHERE id = '${id}';`;
    vpsExec(sql);
    console.log(`Properties updated for ${id}`);
  }

  if (title) {
    const token = getToken();
    const body = JSON.stringify({ title });
    const result = spawnSync("curl", [
      "-s", "-o", "/dev/null", "-w", "%{http_code}",
      "-X", "PATCH",
      "-H", `Authorization: Bearer ${token}`,
      "-H", "X-Requested-With: XMLHttpRequest",
      "-H", "Content-Type: application/json",
      `${API_BASE}/boards/${BOARD_ID}/blocks/${id}`,
      "-d", body,
    ], { encoding: "utf8" });
    const code = result.stdout.trim();
    console.log(code === "200" ? `Title updated: "${title}"` : `Title update failed (HTTP ${code})`);
  }
}

function cmdRefreshToken(): void {
  const token = vpsQuery(
    `SELECT token FROM sessions WHERE user_id='${USER_ID}' ORDER BY update_at DESC LIMIT 1;`
  ).trim();

  if (!token) {
    console.error("No active session found. Log in to Focalboard at https://boards.pokerstories.wtf to create one.");
    process.exit(1);
  }

  console.log(`Fresh token: ${token}`);
  console.log(`\nTo save: echo 'FOCALBOARD_TOKEN=${token}' >> ~/.env`);
  console.log(`Or manually add/update FOCALBOARD_TOKEN=${token} in ~/.env`);
}

// --- Main ---

const [,, cmd, ...rest] = process.argv;

switch (cmd) {
  case "status":         cmdStatus(); break;
  case "update-words":   cmdUpdateWords(); break;
  case "update-card":    cmdUpdateCard(rest); break;
  case "refresh-token":  cmdRefreshToken(); break;
  default:
    console.log(`Usage: bun BoardSync.ts <command>

Commands:
  status                                  Show all cards with band/status/word counts
  update-words                            Read MONAD word counts and push to board
  update-card --id <ID> [options]         Update a single card
    --status <outline|draft|review|revise|final>
    --words <N>
    --assignee <herbert|wladimir>
    --title "New Title"
  refresh-token                           Get a fresh API token from VPS DB
`);
}
