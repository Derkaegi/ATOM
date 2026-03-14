#!/usr/bin/env bun
/**
 * ObsidianSave.ts — Write current session's PRD as ATOM-Tasks report to Obsidian
 *
 * Usage:
 *   bun ObsidianSave.ts                          ← find most recent PRD in MEMORY/WORK/
 *   bun ObsidianSave.ts --prd /path/to/PRD.md   ← use specific PRD
 *   bun ObsidianSave.ts --title "My title"       ← override title
 *
 * Output:
 *   ~/Documents/MONAD/03-REPORTS/ATOM-Tasks/YYYY-MM-DD-[slug].md
 *   Prints path on success.
 *
 * Called by:
 *   - /save slash command (manual)
 *   - SessionSummary.hook.ts (automatic at session end)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const HOME = homedir();
const MEMORY_WORK_DIR = join(HOME, ".claude", "MEMORY", "WORK");
const MONAD_TASKS_DIR = join(HOME, "Documents", "MONAD", "03-REPORTS", "ATOM-Tasks");

// ─── Parse args ───────────────────────────────────────────────────────────────
const args = Bun.argv.slice(2);
const prdArgIdx = args.indexOf("--prd");
const prdPathArg = prdArgIdx !== -1 ? args[prdArgIdx + 1] : null;
const titleArgIdx = args.indexOf("--title");
const titleOverride = titleArgIdx !== -1 ? args[titleArgIdx + 1] : null;

// ─── Find PRD ─────────────────────────────────────────────────────────────────
function findMostRecentPRD(): string | null {
  if (!existsSync(MEMORY_WORK_DIR)) return null;

  const dirs = readdirSync(MEMORY_WORK_DIR)
    .map(name => {
      const path = join(MEMORY_WORK_DIR, name);
      try {
        const st = statSync(path);
        return st.isDirectory() ? { path, mtimeMs: st.mtimeMs } : null;
      } catch { return null; }
    })
    .filter((d): d is { path: string; mtimeMs: number } => d !== null)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const dir of dirs) {
    const prdPath = join(dir.path, "PRD.md");
    if (existsSync(prdPath)) return prdPath;
  }
  return null;
}

const prdPath = prdPathArg ?? findMostRecentPRD();

if (!prdPath || !existsSync(prdPath)) {
  console.log("ObsidianSave: No PRD found — nothing meaningful to save.");
  process.exit(0);
}

// ─── Parse PRD ────────────────────────────────────────────────────────────────
interface ParsedPRD {
  task: string;
  slug: string;
  phase: string;
  progress: string;
  checkedCriteria: string[];
  uncheckedCriteria: string[];
  decisionsSection: string;
  contextSection: string;
}

function parsePRD(content: string): ParsedPRD {
  // Extract frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const fm: Record<string, string> = {};
  if (fmMatch) {
    for (const line of fmMatch[1].split("\n")) {
      const eq = line.indexOf(":");
      if (eq !== -1) {
        fm[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
      }
    }
  }

  const task = fm.task ?? "ATOM Session";
  const slug = fm.slug ?? "session";
  const phase = fm.phase ?? "unknown";
  const progress = fm.progress ?? "0/0";

  // Extract criteria
  const checkedCriteria: string[] = [];
  const uncheckedCriteria: string[] = [];
  for (const line of content.split("\n")) {
    const checkedMatch = line.match(/^\s*-\s*\[x\]\s*(?:ISC-\d+:\s*)?(.+)/i);
    const uncheckedMatch = line.match(/^\s*-\s*\[\s*\]\s*(?:ISC-\d+:\s*)?(.+)/);
    if (checkedMatch) checkedCriteria.push(checkedMatch[1].trim());
    else if (uncheckedMatch) uncheckedCriteria.push(uncheckedMatch[1].trim());
  }

  // Extract ## Decisions section
  const decisionsMatch = content.match(/## Decisions\n([\s\S]*?)(?:\n## |\n---|\n$|$)/);
  const decisionsSection = decisionsMatch ? decisionsMatch[1].trim() : "";

  // Extract ## Context section (first paragraph only)
  const contextMatch = content.match(/## Context\n([\s\S]*?)(?:\n## |\n---|\n$|$)/);
  const contextSection = contextMatch ? contextMatch[1].trim() : "";

  return { task, slug, phase, progress, checkedCriteria, uncheckedCriteria, decisionsSection, contextSection };
}

const prdContent = readFileSync(prdPath, "utf-8");
const prd = parsePRD(prdContent);

// ─── Check if meaningful (has any criteria at all) ────────────────────────────
if (prd.checkedCriteria.length === 0 && prd.uncheckedCriteria.length === 0) {
  console.log("ObsidianSave: PRD has no criteria — session was not Algorithm mode. Skipping.");
  process.exit(0);
}

// ─── Build output ─────────────────────────────────────────────────────────────
const now = new Date();
const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

// Derive slug from PRD slug: strip leading timestamp prefix (YYYYMMDD-HHMMSS_)
const slugClean = prd.slug.replace(/^\d{8}-\d{6}_/, "").replace(/_/g, "-").slice(0, 40);
const title = titleOverride ?? prd.task;

const fileName = `${dateStr}-${slugClean}.md`;
const outputPath = join(MONAD_TASKS_DIR, fileName);


const whatWasDone = prd.checkedCriteria.length > 0
  ? prd.checkedCriteria.map(c => `- ${c}`).join("\n")
  : "_No criteria marked complete this session._";

const keyDecisions = prd.decisionsSection || "_No decisions recorded._";

const currentState = [
  `- Phase: ${prd.phase}`,
  `- Progress: ${prd.progress} criteria complete`,
  prd.contextSection ? `\n${prd.contextSection.split("\n").slice(0, 3).join("\n")}` : "",
].filter(Boolean).join("\n");

const nextSteps = prd.uncheckedCriteria.length > 0
  ? prd.uncheckedCriteria.map(c => `- [ ] ${c}`).join("\n")
  : "_All criteria complete._";

const report = `⚛ ATOM ━━ ${dateStr} ━━ ${title}

## What Was Done

${whatWasDone}

## Key Decisions

${keyDecisions}

## Current State

${currentState}

## Next Steps

${nextSteps}

---
_Generated by ObsidianSave.ts — PAI ${now.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}_
`;

// ─── Write to MONAD ───────────────────────────────────────────────────────────
try {
  mkdirSync(MONAD_TASKS_DIR, { recursive: true });
  writeFileSync(outputPath, report, "utf-8");
  console.log(`✅ ObsidianSave → ${outputPath}`);
} catch (e) {
  console.error(`❌ ObsidianSave failed to write: ${e}`);
  process.exit(1);
}
