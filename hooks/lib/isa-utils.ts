// isa-utils.ts -- Shared ISA functions for hooks
//
// STATUS: compatibility shim (2026-08-19). The Algorithm v6.2.0 doctrine
// (PAI/Algorithm/v6.3.0.md, "v6.2.x deferred") documents this module as not
// yet built -- several hooks (PromptProcessing, SatisfactionCapture,
// RulesInspector, ToolActivityTracker, ISASync, CheckpointPerISC, PreCompact)
// imported from it anyway, which crashed every prompt/tool call with
// "Cannot find module" errors. This file exists to stop that crash.
//
// Frontmatter/criteria/registry parsing is re-exported from the proven,
// working lib/prd-utils.ts (the pre-ISA equivalent) since ISA.md and PRD.md
// share the same frontmatter + `## Criteria` shape. findArtifactPath and
// bumpLastToolActivity are new, small, and genuinely implemented below.
// addRatingPulse has no real consumer yet (no dashboard reads it) -- it
// appends to a JSONL log rather than silently discarding data.
//
// When the real ISA-aware parser (two-home discovery, twelve-section frame)
// lands per doctrine, replace this file -- don't extend it.

import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { paiPath } from './paths';

export {
  parseFrontmatter,
  writeFrontmatterField,
  countCriteria,
  parseCriteriaList,
  readRegistry,
  writeRegistry,
  syncToWorkJson,
  updateSessionNameInWorkJson,
  upsertSession,
} from './prd-utils';
export type { CriterionEntry } from './prd-utils';

export const ARTIFACT_FILENAME = 'ISA.md';
export const LEGACY_ARTIFACT_FILENAME = 'PRD.md';

/** Resolve the artifact path for a work slug, preferring ISA.md over legacy PRD.md. */
export function findArtifactPath(slug: string): string | null {
  const isaPath = paiPath('MEMORY', 'WORK', slug, ARTIFACT_FILENAME);
  if (existsSync(isaPath)) return isaPath;
  const prdPath = paiPath('MEMORY', 'WORK', slug, LEGACY_ARTIFACT_FILENAME);
  if (existsSync(prdPath)) return prdPath;
  return null;
}

/** Bump updatedAt for the session's registry entry. Returns true if a matching entry was found. */
export function bumpLastToolActivity(sessionUUID: string): boolean {
  try {
    const { readRegistry, writeRegistry } = require('./prd-utils');
    const registry = readRegistry();
    let bestSlug: string | null = null;
    let bestTime = 0;
    for (const [slug, session] of Object.entries(registry.sessions) as [string, any][]) {
      if (session.sessionUUID !== sessionUUID) continue;
      const t = new Date(session.updatedAt || session.started || 0).getTime();
      if (t > bestTime) { bestTime = t; bestSlug = slug; }
    }
    if (!bestSlug) return false;
    registry.sessions[bestSlug].updatedAt = new Date().toISOString();
    writeRegistry(registry);
    return true;
  } catch {
    return false;
  }
}

interface RatingPulse {
  value: number;
  timestamp: number;
  message?: string;
}

/** Append a satisfaction rating pulse. No dashboard consumes this yet -- append-only, best-effort. */
export function addRatingPulse(sessionId: string, pulse: RatingPulse): void {
  try {
    const dir = paiPath('MEMORY', 'OBSERVABILITY');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'rating-pulses.jsonl');
    appendFileSync(file, JSON.stringify({ session_id: sessionId, ...pulse }) + '\n');
  } catch {
    /* best-effort telemetry; never block the hook on this */
  }
}
