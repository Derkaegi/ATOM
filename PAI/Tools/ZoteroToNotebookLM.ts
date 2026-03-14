#!/usr/bin/env bun
/**
 * ZoteroToNotebookLM.ts
 * Bulk-add PDFs from a Zotero collection to a NotebookLM notebook.
 *
 * Usage:
 *   bun ~/.claude/PAI/Tools/ZoteroToNotebookLM.ts \
 *     --collection "Noller AI" \
 *     --notebook 73f65e0d-dc70-4816-8815-74e25e89ab11
 *
 *   bun ~/.claude/PAI/Tools/ZoteroToNotebookLM.ts --list-collections
 *
 * Prerequisites:
 *   - Zotero installed via snap (zotero-snap)
 *   - NotebookLM authenticated: python3 ~/.claude/skills/NotebookLM/Tools/nlm.py login
 */

import { execSync } from "child_process";
import { existsSync, copyFileSync, rmSync } from "fs";
import { join, basename } from "path";
import Database from "bun:sqlite";

const ZOTERO_DB = `${process.env.HOME}/snap/zotero-snap/common/Zotero/zotero.sqlite`;
const ZOTERO_STORAGE = `${process.env.HOME}/snap/zotero-snap/common/Zotero/storage`;
const NLM_CLI = `${process.env.HOME}/.claude/skills/NotebookLM/Tools/nlm.py`;
const DB_COPY = `/tmp/zotero_pai_copy.sqlite`;

interface PDF {
  itemId: number;
  title: string;
  attachKey: string;
  fname: string;
  fullPath: string;
}

function copyDb(): Database {
  copyFileSync(ZOTERO_DB, DB_COPY);
  return new Database(DB_COPY, { readonly: true });
}

function listCollections(db: Database): void {
  const rows = db.query("SELECT collectionID, collectionName, parentCollectionID FROM collections ORDER BY collectionName").all() as any[];
  console.log("\nZotero Collections:");
  for (const r of rows) {
    const indent = r.parentCollectionID ? "  └─ " : "  ";
    console.log(`${indent}[${r.collectionID}] ${r.collectionName}`);
  }
}

function getCollectionId(db: Database, name: string): number | null {
  const row = db.query(
    "SELECT collectionID FROM collections WHERE LOWER(collectionName) = LOWER(?)"
  ).get(name) as any;
  return row?.collectionID ?? null;
}

function getPdfsForCollection(db: Database, collectionId: number): PDF[] {
  // Get all parent item IDs in the collection
  const items = db.query(
    "SELECT itemID FROM collectionItems WHERE collectionID = ?"
  ).all(collectionId) as any[];

  const pdfs: PDF[] = [];

  for (const { itemID } of items) {
    // Get title
    const titleRow = db.query(`
      SELECT idv.value FROM itemData id2
      JOIN itemDataValues idv ON id2.valueID = idv.valueID
      WHERE id2.itemID = ? AND id2.fieldID = (SELECT fieldID FROM fields WHERE fieldName = 'title')
    `).get(itemID) as any;
    const title = titleRow?.value ?? "(no title)";

    // Get PDF attachments
    const attachments = db.query(`
      SELECT ia.itemID, ia.path, i2.key
      FROM itemAttachments ia
      JOIN items i2 ON ia.itemID = i2.itemID
      WHERE ia.parentItemID = ? AND ia.contentType = 'application/pdf'
    `).all(itemID) as any[];

    for (const att of attachments) {
      if (!att.path || !att.key) continue;
      const fname = att.path.startsWith("storage:") ? att.path.slice(8) : basename(att.path);
      const fullPath = join(ZOTERO_STORAGE, att.key, fname);
      if (existsSync(fullPath)) {
        pdfs.push({ itemId: itemID, title, attachKey: att.key, fname, fullPath });
      } else {
        console.warn(`  ⚠️  PDF on record but not on disk: ${att.key}/${fname}`);
      }
    }
  }

  return pdfs;
}

function addToNotebookLM(notebookId: string, pdfs: PDF[]): void {
  let success = 0;
  let failed = 0;

  for (const pdf of pdfs) {
    process.stdout.write(`  → ${pdf.title.slice(0, 65)}... `);
    try {
      const result = execSync(
        `python3 ${NLM_CLI} add-file --notebook ${notebookId} --path "${pdf.fullPath}" --wait`,
        { encoding: "utf-8", timeout: 120_000 }
      );
      const parsed = JSON.parse(result.trim());
      if (parsed.status === "ready") {
        console.log(`✅ ready`);
        success++;
      } else {
        console.log(`⚠️  ${parsed.status}`);
        failed++;
      }
    } catch (e: any) {
      console.log(`❌ error: ${e.message?.slice(0, 80)}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} added, ${failed} failed, ${pdfs.length - success - failed} skipped`);
}

// --- Main ---
const args = process.argv.slice(2);
const collectionArg = args.find((_, i) => args[i - 1] === "--collection");
const notebookArg = args.find((_, i) => args[i - 1] === "--notebook");
const listMode = args.includes("--list-collections");

if (!existsSync(ZOTERO_DB)) {
  console.error(`❌ Zotero DB not found: ${ZOTERO_DB}`);
  process.exit(1);
}

const db = copyDb();

try {
  if (listMode) {
    listCollections(db);
    process.exit(0);
  }

  if (!collectionArg || !notebookArg) {
    console.error("Usage: bun ZoteroToNotebookLM.ts --collection <name> --notebook <id>");
    console.error("       bun ZoteroToNotebookLM.ts --list-collections");
    process.exit(1);
  }

  const collectionId = getCollectionId(db, collectionArg);
  if (!collectionId) {
    console.error(`❌ Collection not found: "${collectionArg}"`);
    listCollections(db);
    process.exit(1);
  }

  console.log(`\n📚 Collection: "${collectionArg}" (ID: ${collectionId})`);
  const pdfs = getPdfsForCollection(db, collectionId);
  console.log(`   Found ${pdfs.length} PDFs on disk`);

  if (pdfs.length === 0) {
    console.log("   Nothing to upload.");
    process.exit(0);
  }

  console.log(`\n📤 Uploading to NotebookLM notebook: ${notebookArg}\n`);
  addToNotebookLM(notebookArg, pdfs);
} finally {
  db.close();
  if (existsSync(DB_COPY)) rmSync(DB_COPY);
}
