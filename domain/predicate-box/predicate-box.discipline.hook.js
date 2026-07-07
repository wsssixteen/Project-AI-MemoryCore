/**
 * predicate-box.discipline.hook.js — Stop hook (BLOCKING)
 *
 * Power: domain/predicate-box/
 *
 * v2 (2026-07-07): quest-gate REMOVED + advisory promoted to decision:block.
 *   Relocated from .claude/hooks/predicate-box-gate.js (v1). v1 was doubly
 *   toothless: (1) it required quest/active.txt to hold status=active, so it
 *   was dark outside formal quests; (2) it was a console.log advisory the model
 *   could ignore. Per みや 2026-07-07: checks must always fire.
 *
 * WHAT: fires at every Stop. HARD-BLOCKS the turn when ALL THREE hold:
 *   (a) transcript shows an Edit/Write to an etanah .java or .xhtml source file
 *       (heuristic: an etanah-pelupusan or etanah-awam or etanah-common or
 *       etanah-teknikal path ending .java/.xhtml near an edit-shaped cue —
 *       unchanged from v1);
 *   (b) the LAST USER MESSAGE carries fix-intent (fix/patch/bug/debug/error/
 *       issue/implement/apply/broken/salah/tak keluar) — this REPLACES the v1
 *       quest gate as the firing scope, so the gate does not nag on non-fix
 *       chatter;
 *   (c) the transcript's assistant text contains NEITHER "ASSUMPTION" nor
 *       "FALSIFIER" — i.e. the 3-node Predicate Diagram (CLAUDE.md section 10)
 *       was never emitted.
 *
 * BLOCK MECHANISM: prints {"decision":"block","reason":...} — the model must
 *   emit the Predicate Diagram (ASSUMPTION -> EVIDENCE -> matches/FALSIFIER)
 *   and re-send, or use the bypass token.
 *
 * ANTI-LOOP: stop_hook_active true in the Stop payload -> immediate silent
 *   exit (copied from domain/show-gate/show-gate.discipline.hook.js).
 *
 * Bypass: [skip-predicate-box: <reason>] anywhere in the session transcript.
 * Fail-OPEN: any read/parse error -> exit 0 silently.
 * Log: domain/predicate-box/log.jsonl — blocked / passed / bypassed /
 *   skipped-no-intent.
 *
 * CANNOT: verify the diagram's content is correct, that cited Evidence is
 *   real, or that it preceded the specific edit. Presence-only, same tier as
 *   v1 and rcrl-emit-check.js.
 *
 * Eval: domain/predicate-box/eval.js (7 fixtures; run before any change here).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const LOG = path.resolve(__dirname, 'log.jsonl');

const FIX_INTENT = /\b(fix|fixes|patch|bug|debug|error|issue|implement|apply|broken|salah|tak keluar)\b/i;
const BYPASS = /\[skip-predicate-box:\s*[^\]]+\]/i;
const ETANAH_PATH = /etanah-(pelupusan|awam|common|teknikal)[\\/][^\s"'`]*\.(java|xhtml)\b/i;
const EDIT_CUE = /\b(Edit|Write|old_string|new_string|file_path)\b/i;

function logFire(action, detail) {
  try {
    fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail }) + '\n');
  } catch (e) { /* best effort */ }
}

function blockTextFromContent(c) {
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) {
    return c.filter(b => b && b.type === 'text' && typeof b.text === 'string').map(b => b.text).join('\n');
  }
  return '';
}

// Parse the .jsonl transcript once into {raw, lastUserText, assistantText}.
function parseTranscript(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (e) { return null; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  let lastUserText = '';
  const assistantTexts = [];
  for (const line of lines) {
    let obj;
    try { obj = JSON.parse(line); } catch (e) { continue; }
    const msg = obj.message || obj;
    const role = msg.role || obj.type;
    const text = blockTextFromContent(msg.content);
    if (role === 'user' && text.trim()) lastUserText = text; // keep overwriting -> last wins
    else if (role === 'assistant' && text.trim()) assistantTexts.push(text);
  }
  return { raw, lastUserText, assistantText: assistantTexts.join('\n') };
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    // Anti-loop guard: if a Stop hook already fired for this stop, never re-block.
    if (data.stop_hook_active) process.exit(0);

    const t = parseTranscript(data.transcript_path || '');
    if (!t) process.exit(0); // fail-open: no transcript

    // Firing scope: last user message must carry fix-intent (replaces v1 quest gate).
    if (!FIX_INTENT.test(t.lastUserText)) { logFire('skipped-no-intent'); process.exit(0); }

    // Etanah-edit heuristic (unchanged from v1): path + edit-shaped cue in raw transcript.
    if (!(ETANAH_PATH.test(t.raw) && EDIT_CUE.test(t.raw))) process.exit(0);

    if (BYPASS.test(t.raw)) { logFire('bypassed'); process.exit(0); }

    // Predicate Diagram markers: both load-bearing nodes in assistant text.
    if (/\bASSUMPTION\b/i.test(t.assistantText) && /\bFALSIFIER\b/i.test(t.assistantText)) {
      logFire('passed');
      process.exit(0);
    }

    logFire('blocked', 'etanah edit + fix-intent, no ASSUMPTION+FALSIFIER pair');
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: [
        'BLOCKED — predicate-box: an etanah .java/.xhtml file was edited on a fix-intent turn but NO Predicate Diagram was emitted.',
        '   Emit the 3-node Predicate Diagram (CLAUDE.md section 10): ASSUMPTION -> EVIDENCE (file:line + quoted code) -> matches/FALSIFIER,',
        '   then re-send the reply. Genuinely not applicable? Add [skip-predicate-box: <reason>] and continue.',
      ].join('\n'),
    }));
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
