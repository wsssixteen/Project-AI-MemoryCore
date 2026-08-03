#!/usr/bin/env node
/**
 * quest-resume-preflight.js — UserPromptSubmit hook
 *
 * Catches the gap left by ticket-gate.js (which requires QA/FAT/UAT prefix).
 * Fires when みや mentions a BARE ticket number (e.g. "Let's start with 262233",
 * "262233", "PTMLK/.../PRZ/2026/X") that cross-matches a `quest/active.txt`
 * qa= entry. If the matched quest has status ∈ {hold, closed, archived,
 * blocked, delegated}, this is a RESUME/REWORK — Phase 0 preflight reads
 * must happen BEFORE any code-analysis tool call.
 *
 * Why this exists (2026-05-25 slip — QA-262233 cycle 2):
 *   みや: "Let's start with 262233"
 *   ticket-gate.js regex requires QA/FAT/UAT prefix → didn't fire.
 *   Quest never activated. Phase 0 entirely skipped.
 *   Notes.txt sat unread the entire session despite holding 5 cycle-1
 *   test apps. History.txt only tail-glanced despite holding BA's full
 *   thread. Folder never reactivated from Archive\.
 *
 * Pairs with:
 *   - ticket-gate.js (covers QA-prefixed mentions + initial activations)
 *   - open-quest-surfacer.js (SessionStart — surfaces open quests at boot)
 *   - CLAUDE.md Quest Workflow section (trigger TABLE restored 2026-05-25)
 *
 * v1: REPORT-ONLY — injects a checklist via additionalContext, never blocks.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');

// Statuses where re-engagement requires Phase 0 preflight (vs already-in-flight active phase-0/1)
const RESUME_STATUSES = new Set(['hold', 'closed', 'archived', 'blocked', 'delegated']);

function readActiveTxt() {
  try { return fs.readFileSync(ACTIVE_TXT, 'utf-8'); } catch { return ''; }
}

function findQABlock(text, qaNum) {
  // Match a `qa=QA-<num>` block — paragraph-bounded.
  const re = new RegExp(`^qa=QA-${qaNum}\\b[\\s\\S]*?(?=^qa=|\\Z)`, 'm');
  const m = text.match(re);
  if (!m) return null;
  const state = { qa: qaNum };
  for (const line of m[0].split('\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) state[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
  }
  return state;
}

function extractTicketCandidates(prompt) {
  const found = new Set();

  // Pattern A: QA/FAT/UAT prefixed (covered by ticket-gate.js, but include for completeness)
  for (const m of prompt.matchAll(/\b(?:QA|FAT-OR|UAT-CR|FAT|UAT)\s*#?\s*(\d{4,6})\b/gi)) {
    found.add(m[1]);
  }

  // Pattern B: bare 6-digit number (covers "262233", "Let's start with 262233", etc.)
  for (const m of prompt.matchAll(/\b(\d{6})\b/g)) {
    found.add(m[1]);
  }

  // Pattern C: PTMLK permohonan ID (extract the year/seq as candidate)
  // Note: permohonan IDs are NOT ticket #s — keep separate, don't add as ticket candidates.

  return Array.from(found);
}

let inputData = '';
process.stdin.resume();
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (d) => inputData += d);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);
    const prompt = input.prompt || '';
    if (!prompt) process.exit(0);

    const candidates = extractTicketCandidates(prompt);
    if (candidates.length === 0) process.exit(0);

    const activeText = readActiveTxt();
    if (!activeText) process.exit(0);

    // Find candidates that cross-match active.txt blocks with RESUME-class status
    const matches = [];
    for (const qaNum of candidates) {
      const state = findQABlock(activeText, qaNum);
      if (state && RESUME_STATUSES.has(state.status)) {
        matches.push({ qa: qaNum, state });
      }
    }

    if (matches.length === 0) process.exit(0);

    // Build the preflight reminder
    const lines = [
      `⚔️ QUEST-RESUME PREFLIGHT — bare ticket # detected matching active.txt entry with non-active status.`,
      ``,
      `MANDATORY Phase 0 reads BEFORE any code-analysis / fix-shape / SQL / Edit tool call:`,
      ``
    ];

    for (const { qa, state } of matches) {
      lines.push(`📌 QA-${qa} — status=${state.status} · phase=${state.phase || '?'} · rework_cycle=${state.rework_cycle || 'n/a'}`);
      if (state.task_folder) {
        const inArchive = /\\Archive\\/.test(state.task_folder);
        lines.push(`   ⬜ Confirm task folder location: ${state.task_folder}${inArchive ? '  🔴 IN ARCHIVE — propose reactivation move to active Tasks/Melaka/' : ''}`);
      }
      lines.push(`   ⬜ Read \`<task_folder>/1. <NNN NNN>.txt\` (legacy \`1. Notes.txt\`) — prior test data + logins (cycle-1 entries are gold for rework)`);
      lines.push(`   ⬜ Read full \`<task_folder>/0. Brief/History.txt\` — BA's complete journal (not just tail)`);
      if (state.qa_doc) {
        lines.push(`   ⬜ Open \`${state.qa_doc}\` cycle-N section`);
      } else if (state.early_diagnostic) {
        lines.push(`   ⬜ Open \`${state.early_diagnostic}\``);
      } else {
        lines.push(`   ⬜ Spawn /familiar Scout for cycle-N early-diagnostic if none present`);
      }
      lines.push(`   ⬜ Run \`/env-check\` (UAT/FAT target per ticket Env)`);
      lines.push(`   ⬜ Emit Recon Universal Checks block (per quest/quest-protocol.md Recon section)`);
      lines.push(``);
    }

    lines.push(`Banned until checklist clears: code-analysis tool calls, fix-shape proposals, BA-reply drafts, SQL on test data.`);
    lines.push(`Per CLAUDE.md "Re-engagement load before any judgement" hard rule + quest-protocol.md Re-engagement section.`);
    lines.push(`This hook restored 2026-05-25 after QA-262233 cycle-2 quest-protocol-skip slip — see system/slip-log.md.`);

    console.log(JSON.stringify({ additionalContext: lines.join('\n') }));
    process.exit(0);

  } catch (e) {
    // Never block on hook error
    process.exit(0);
  }
});
