/**
 * codemap-recon-consult.trigger.hook.js — UserPromptSubmit hook
 *
 * Power: domain/codemap-recon-consult/
 *
 * PURPOSE: during a quest's INVESTIGATION phases (Discovery / Recon / Rubric),
 * remind to consult the etanah-codemap data files for module-scope + blast-radius
 * BEFORE concluding — so the consult doesn't depend on Ruri remembering.
 *
 * TRIGGER: state-driven (NOT prompt-phrase). Reads quest/active.txt; fires when
 * any quest has status=active AND current_phase ∈ {discovery, recon, rubric}.
 * Chosen over scout-completeness-gate.js (prompt-triggered → misses autonomous
 * Recon, where みや's prompt contains no "recon"/"verify" phrase) and over
 * extending quest-active-grounding.js (keeps that hook a pure grounding emit).
 *
 * FALSE-POSITIVE COST: a few lines of reminder on investigation turns where
 * blast-radius isn't the immediate micro-task (e.g. a Discovery turn just reading
 * the brief). Low — report-only, never blocks.
 *
 * BLIND-SPOT HONESTY (per the #6 assessment 2026-06-16): SootUp's
 * callgraph_callers.json misses Java method-refs (util::populateX, invokedynamic)
 * → ~281/589 populators absent. A NEGATIVE (no callers found) is NOT authoritative;
 * the reminder says so, so the data never creates false confidence.
 *
 * Created 2026-06-16 per みや ("make sure all these new features run through hooks
 * when running our quests"), routed through /system-rules + /system-design.
 * Hook-only Power (no skill/eval yet — promote to a Stop-side back-gate if the
 * slip-log later shows Recon emits still skip the codemap despite this reminder).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO_ROOT = require('path').resolve(__dirname, '..', '..'); // machine-independent (GHOST-HOOKS-2 fix 2026-07-19)
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');
const LOG = path.resolve(__dirname, 'log.jsonl');
const INVESTIGATION_PHASES = ['discovery', 'recon', 'rubric', 'apply'];

function safeRead(p) { try { return fs.readFileSync(p, 'utf-8'); } catch { return null; } }

function parseBlocks(text) {
  const blocks = [];
  let current = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (line === '') { if (current.length) { blocks.push(current); current = []; } }
    else current.push(line);
  }
  if (current.length) blocks.push(current);
  return blocks;
}

function fieldOf(block, key) {
  for (const line of block) {
    const s = line.replace(/^\s+/, '');
    if (s.startsWith(key + '=')) return s.slice(key.length + 1).trim();
  }
  return null;
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const text = safeRead(ACTIVE_TXT);
    if (!text) process.exit(0);

    const hits = [];
    for (const block of parseBlocks(text)) {
      if (!block.some(l => /^\s*qa=/.test(l))) continue;
      if (fieldOf(block, 'status') !== 'active') continue;
      const phase = (fieldOf(block, 'current_phase') || '').toLowerCase();
      if (INVESTIGATION_PHASES.some(p => phase.includes(p))) {
        hits.push({ qa: fieldOf(block, 'qa'), phase: fieldOf(block, 'current_phase') });
      }
    }
    if (hits.length === 0) process.exit(0);

    try {
      fs.appendFileSync(LOG, JSON.stringify({
        ts: new Date().toISOString(),
        fired_for: hits.map(h => `${h.qa}:${h.phase}`),
      }) + '\n');
    } catch {}

    const who = hits.map(h => `${h.qa} (${h.phase})`).join(', ');
    const reminder = [
      '',
      `⚙️  codemap-recon-consult: investigation phase — ${who}`,
      '',
      'Before concluding blast-radius / module-scope, consult the codemap',
      '(projects/coding-projects/active/etanah-codemap/):',
      '  • bpmn_flow.json     — module-scope: is the tugasan a pelupusan <userTask> or a',
      '                          MLK_TKL_* teknikal callout? + sibling-tugasan spread',
      '  • callgraph_callers.json — who-calls-this for blast radius',
      '       ⚠️ SootUp blind spot: Java method-refs (util::populateX) invisible (~281/589',
      '          populators missing). A "no callers" result is NOT authoritative — confirm',
      '          with codegraph MCP / Grep before relying on a negative.',
      '  • codegraph MCP      — live callers/callees (etanah-pelupusan + common + AWAM indexed; pass projectPath)',
      '',
      '🔧 grep vs codegraph — pick the tool by QUESTION-TYPE (2026-06-18; callers caveat 2026-06-20):',
      '  • grep              → "where is this field/string SET or used" (text/field hunt)',
      '  • codegraph_node    → "whole SHAPE of a class / its members" (one call beats many reads)',
      '  • codegraph_callers → "WHAT CALLS this" — RELIABLE ONLY for class-inheritance dispatch.',
      '       🚨 BLIND to service-locator/interface dispatch (verified 2026-06-20, tujuanTKM_PI):',
      '          locator.getService().method() → codegraph_callers returned 0 while GREP on the',
      '          method name found the real callers. For *Service / *Repository / interface methods,',
      '          GREP the method name is AUTHORITATIVE; codegraph is a supplement, not the source.',
      '  • codegraph_search  → "WHERE does symbol X live / which codebase" (cross-module location)',
      '  • codegraph_impact  → "what BREAKS if I change this" — over-reports for interface methods',
      '          (pulls the whole interface surface; saw 301 symbols for a 2-caller method).',
      '  Tool by DISPATCH: class-inheritance (Base*→@Override) → codegraph OK · service-locator /',
      '  interface → GREP authoritative. Grep is the FLOOR for blast-radius; NEVER trust a',
      '  codegraph "0 callers" on a Service method without a grep confirm.',
      '',
    ].join('\n');

    process.stdout.write(reminder);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
