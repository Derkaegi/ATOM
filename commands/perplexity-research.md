#!/usr/bin/env bun
/**
 * perplexity-research - Integrated workflow for Perplexity research → Fabric processing → Obsidian
 *
 * Usage:
 *   perplexity-research "your research query"
 *   perplexity-research --help
 *
 * Description:
 *   This command performs the complete research workflow:
 *   1. Queries Perplexity AI with your research question
 *   2. Processes the output through Fabric's research_perplexity pattern
 *   3. Saves formatted note to Obsidian MONAD vault
 *   4. Returns the file path for immediate access
 *
 * Requirements:
 *   - PERPLEXITY_API_KEY in ~/.env
 *   - fabric binary in PATH or FABRIC_PATH in ~/.env
 *   - Obsidian vault at ~/Documents/MONAD/
 *
 * @author Herbert Okolowitz
 * @date 2025-10-01
 */

import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { homedir } from 'os';

const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
perplexity-research - End-to-end Perplexity research workflow

USAGE:
  perplexity-research "your research query"

EXAMPLES:
  perplexity-research "What are the latest AI workflow automation tools?"
  perplexity-research "Best practices for RAG implementation in 2025"

WORKFLOW:
  1. Query Perplexity API
  2. Process through Fabric research_perplexity pattern
  3. Save to Obsidian MONAD vault
  4. Return file path

ENVIRONMENT VARIABLES:
  PERPLEXITY_API_KEY - Your Perplexity API key (required)
  FABRIC_PATH - Path to fabric executable (default: fabric in PATH)
`);
  process.exit(0);
}

// Load ~/.env
const envPath = resolve(homedir(), '.env');
try {
  const envContent = await Bun.file(envPath).text();
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#') && t.includes('=')) {
      const eq = t.indexOf('=');
      const key = t.slice(0, eq).trim();
      const val = t.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {}

// Configuration
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const FABRIC_PATH = process.env.FABRIC_PATH || 'fabric';
const OBSIDIAN_RESEARCH_DIR = resolve(homedir(), 'Documents/MONAD/Research');

if (!PERPLEXITY_API_KEY) {
  console.error('❌ Error: PERPLEXITY_API_KEY not found in ~/.env');
  console.error('Add: PERPLEXITY_API_KEY=your_key_here');
  process.exit(1);
}

// Ensure output directory exists
if (!existsSync(OBSIDIAN_RESEARCH_DIR)) {
  mkdirSync(OBSIDIAN_RESEARCH_DIR, { recursive: true });
}

const query = args.join(' ');
console.log(`🔍 Researching: "${query}"\n`);

// Step 1: Query Perplexity API
console.log('📡 Querying Perplexity API...');

try {
  const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.2,
      max_tokens: 4000,
    }),
  });

  if (!perplexityResponse.ok) {
    throw new Error(`Perplexity API error: ${perplexityResponse.status} ${perplexityResponse.statusText}`);
  }

  const data = await perplexityResponse.json();
  const researchOutput = data.choices[0].message.content;
  const citations = data.citations || [];

  console.log('✅ Research completed\n');

  // Step 2: Process through Fabric
  console.log('🧵 Processing through Fabric pattern...');

  // Combine research output with citations
  const fabricInput = `${researchOutput}\n\n## Citations\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join('\n')}`;

  // Write temp file for fabric input
  const tempInputPath = `/tmp/perplexity-research-${Date.now()}.txt`;
  writeFileSync(tempInputPath, fabricInput, 'utf-8');

  // Run fabric pattern
  const fabricOutput = execSync(
    `${FABRIC_PATH} --pattern research_perplexity < "${tempInputPath}"`,
    { encoding: 'utf-8', shell: true }
  );

  console.log('✅ Fabric processing complete\n');

  // Step 3: Save to Obsidian
  console.log('💾 Saving to Obsidian...');

  const today = new Date().toISOString().split('T')[0];
  const topicSlug = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  const filename = `[RESEARCH] ${topicSlug} - ${today}.md`;
  const filepath = resolve(OBSIDIAN_RESEARCH_DIR, filename);

  writeFileSync(filepath, fabricOutput, 'utf-8');

  console.log('✅ Research note saved\n');
  console.log(`📄 File: ${filepath}`);
  console.log(`\n🎯 Open in Obsidian: obsidian://open?vault=MONAD&file=Research%2F${encodeURIComponent(filename)}`);

  // Cleanup
  try { unlinkSync(tempInputPath); } catch {}

} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
