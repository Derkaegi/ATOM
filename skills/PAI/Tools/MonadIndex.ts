#!/usr/bin/env bun
/**
 * MonadIndex.ts — Generate MONAD-INDEX.md for instant AI orientation
 *
 * Reads vault structure + frontmatter (no full file content) to produce
 * a single-file index ATOM reads instead of scraping 473+ files.
 *
 * Usage:
 *   bun MonadIndex.ts              ← regenerate index
 *   bun MonadIndex.ts --print      ← print only, don't write
 *
 * Output: ~/Documents/MONAD/MONAD-INDEX.md
 * Read time: ~1 Read call instead of 50+
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const VAULT = join(homedir(), "Documents/MONAD");
const INDEX_OUT = join(VAULT, "MONAD-INDEX.md");
const PRINT_ONLY = process.argv.includes("--print");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFrontmatter(filePath: string): Record<string, string> {
  try {
    const content = readFileSync(filePath, "utf-8");
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      // Try to get first heading as title
      const h1 = content.match(/^#\s+(.+)/m);
      return h1 ? { title: h1[1].trim() } : {};
    }
    const fm: Record<string, string> = {};
    for (const line of match[1].split("\n")) {
      const eq = line.indexOf(":");
      if (eq > 0) {
        fm[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      }
    }
    return fm;
  } catch {
    return {};
  }
}

function countFiles(dir: string, ext = ".md"): number {
  let count = 0;
  try {
    for (const entry of readdirSync(dir, { recursive: true }) as string[]) {
      if (entry.endsWith(ext)) count++;
    }
  } catch {}
  return count;
}

function recentFiles(dir: string, days = 14): Array<{ path: string; mtime: Date; rel: string }> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const results: Array<{ path: string; mtime: Date; rel: string }> = [];
  function scan(d: string) {
    try {
      for (const entry of readdirSync(d)) {
        if (entry.startsWith(".")) continue;
        const full = join(d, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
          scan(full);
        } else if (entry.endsWith(".md") && st.mtimeMs > cutoff) {
          results.push({ path: full, mtime: st.mtime, rel: full.replace(VAULT + "/", "") });
        }
      }
    } catch {}
  }
  scan(dir);
  return results.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

function getProjectInfo(projectDir: string): {
  name: string; status: string; description: string; files: number; keyFile: string;
} {
  const name = projectDir.split("/").pop() ?? "";
  let status = "Active";
  let description = "";
  let keyFile = "";

  // Look for an index/README file
  const candidates = [
    "00-PROJECT-INDEX.md", "Research-Index.md", "README.md", "TELOS_PROJECT_BRIEF.md",
    "Article-Development-Plan.md", "personal-telos---goals-and-vision.md",
  ];

  for (const c of candidates) {
    const p = join(projectDir, c);
    if (existsSync(p)) {
      keyFile = c;
      const fm = readFrontmatter(p);
      status = fm.status || fm.Status || status;
      description = fm.description || fm.Description || fm.title || fm.Title || "";
      // If no frontmatter description, get first non-heading line
      if (!description) {
        try {
          const lines = readFileSync(p, "utf-8").split("\n").slice(0, 20);
          const firstText = lines.find(l => l.trim() && !l.startsWith("#") && !l.startsWith("---") && !l.includes(":"));
          if (firstText) description = firstText.trim().slice(0, 100);
        } catch {}
      }
      break;
    }
  }

  // Fallback: read first .md file
  if (!keyFile) {
    try {
      const mds = readdirSync(projectDir).filter(f => f.endsWith(".md"));
      if (mds.length > 0) {
        keyFile = mds[0];
        const fm = readFrontmatter(join(projectDir, mds[0]));
        description = fm.description || fm.title || "";
      }
    } catch {}
  }

  return { name, status, description: description.slice(0, 120), files: countFiles(projectDir), keyFile };
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildProjectsSection(): string {
  const projectsDir = join(VAULT, "02-PROJECTS");
  const lines: string[] = ["## 02-PROJECTS — Active Work\n"];

  try {
    const projects = readdirSync(projectsDir)
      .filter(p => !p.startsWith(".") && statSync(join(projectsDir, p)).isDirectory())
      .sort();

    for (const proj of projects) {
      const info = getProjectInfo(join(projectsDir, proj));
      const desc = info.description ? ` — ${info.description}` : "";
      const key = info.keyFile ? ` | Key: \`${info.keyFile}\`` : "";
      lines.push(`### ${proj}`);
      lines.push(`- **Status:** ${info.status} | **Files:** ${info.files}${key}`);
      if (desc) lines.push(`- ${desc}`);
      lines.push("");
    }
  } catch (e) {
    lines.push(`_Error reading projects: ${e}_`);
  }

  return lines.join("\n");
}

function buildRecentActivity(days = 14): string {
  const recent = recentFiles(VAULT, days).slice(0, 20);
  if (recent.length === 0) return `## Recent Activity (${days}d)\n_No recent changes._\n`;

  const lines = [`## Recent Activity (last ${days} days)\n`];
  for (const f of recent) {
    const dateStr = f.mtime.toLocaleDateString("en-CA"); // YYYY-MM-DD
    lines.push(`- \`${f.rel}\` _(${dateStr})_`);
  }
  return lines.join("\n") + "\n";
}

function buildFolderGuide(): string {
  return `## Folder Guide — Where to Read/Write What

| Folder | Purpose | Write here when... |
|--------|---------|-------------------|
| \`01-INBOX\` | Unprocessed items, clippings | Capturing raw input, quick drops |
| \`02-PROJECTS\` | Active project workspaces | Working on a named project |
| \`03-REPORTS\` | Finished reports + documentation | Delivering analysis, PAI dev reports |
| \`04-CONTENT\` | Content production (blog, social, courses) | Writing for publication |
| \`05-JOURNAL\` | Daily notes, ATOM diary, weekly reviews | Daily notes, reflections |
| \`05-LITERATURE\` | Literature notes (Zotero-style) | Reading summaries, paper notes |
| \`06-REFERENCE\` | Templates, guidelines, style guides | Reference material, reusable templates |
| \`07-ARCHIVE\` | Completed/deprecated projects | Archiving old work |

### Key Sub-Destinations

| Content Type | Exact Path |
|-------------|-----------|
| PAI session reports | \`03-REPORTS/PAI-Development/\` |
| ATOM diary entries | \`05-JOURNAL/ATOM Diary/\` |
| Daily notes | \`05-JOURNAL/Daily-Notes/\` |
| Griffl articles | \`04-CONTENT/Griffl/02-Drafts/\` → \`03-Review/\` → \`04-Ready/\` |
| Griffl SEO briefs | \`04-CONTENT/Griffl/SEO-Briefs/\` |
| Noller-AI drafts | \`02-PROJECTS/Noller-AI/\` |
| PostDoc writing | \`02-PROJECTS/PostDoc/Article-Drafts/\` |
| Monadic Architecture | \`02-PROJECTS/Monadic-Architectures/Monadic Architecture Text/\` |
| Extract Wisdom outputs | \`03-REPORTS/Research/Extract-Wisdom/\` |
| Research reports | \`03-REPORTS/Research/\` |
`;
}

function buildContentSection(): string {
  const contentDir = join(VAULT, "04-CONTENT");
  const lines = ["## 04-CONTENT — Production Areas\n"];
  try {
    const areas = readdirSync(contentDir)
      .filter(p => !p.startsWith(".") && statSync(join(contentDir, p)).isDirectory())
      .sort();
    for (const area of areas) {
      const count = countFiles(join(contentDir, area));
      lines.push(`- **${area}** (${count} files)`);
    }
  } catch {}
  return lines.join("\n") + "\n";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const now = new Date();
const totalFiles = countFiles(VAULT);
const genTime = now.toISOString().slice(0, 16).replace("T", " ");

const sections = [
  `# MONAD Vault Index`,
  `_Generated: ${genTime} | Total files: ${totalFiles} | Regenerate: \`bun ~/.claude/skills/PAI/Tools/MonadIndex.ts\`_`,
  `_Read this file for instant orientation — one \`Read\` call instead of 50+ file scans._`,
  "",
  buildFolderGuide(),
  buildProjectsSection(),
  buildContentSection(),
  buildRecentActivity(14),
].join("\n");

if (PRINT_ONLY) {
  console.log(sections);
} else {
  writeFileSync(INDEX_OUT, sections, "utf-8");
  console.log(`✅ MONAD-INDEX.md written → ${INDEX_OUT}`);
  console.log(`   ${totalFiles} files indexed | ${sections.length} chars`);
}
