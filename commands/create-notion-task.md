#!/usr/bin/env bun

/**
 * create-notion-task - Create a task in Herbert's Notion Tasks Tracker
 *
 * Database: Tasks Tracker (231f11fc-6655-80e8-8f51-d9ba5b7293b5)
 * Properties: "Task name" (title), "Due date" (date)
 *
 * Usage (bun cannot run .md files directly — use the runner):
 *   sed -n '/^import/,$ p' ~/.claude/commands/create-notion-task.md > /tmp/cnt.ts && bun /tmp/cnt.ts "Title" "2026-02-18"
 *   (or invoke via Claude: /create-notion-task)
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';
import { homedir } from 'os';

// Load NOTION_TOKEN from ~/.env if not already in environment
if (!process.env.NOTION_TOKEN) {
  try {
    const envFile = readFileSync(`${homedir()}/.env`, 'utf8');
    const match = envFile.match(/^NOTION_TOKEN=(.+)$/m);
    if (match) process.env.NOTION_TOKEN = match[1].trim();
  } catch {}
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const TASKS_DB_ID = '231f11fc-6655-80e8-8f51-d9ba5b7293b5';

async function createTask(title: string, dueDate: string) {
  const response = await notion.pages.create({
    parent: { database_id: TASKS_DB_ID },
    properties: {
      'Task name': { title: [{ text: { content: title } }] },
      'Due date': { date: { start: dueDate } },
    },
  });

  console.log('✅ Task created successfully!');
  console.log('Task ID:', response.id);
  console.log('Title:', title);
  console.log('Due Date:', dueDate);
}

const title = process.argv[2] || 'TEST';
const dueDate = process.argv[3] || new Date().toISOString().split('T')[0];

await createTask(title, dueDate);
