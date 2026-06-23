/**
 * codemap-recon-consult.discipline.hook.js — Stop hook (back-gate)
 *
 * Power: domain/codemap-recon-consult/  — back-gate paired with the front-gate
 * trigger.hook.js reminder.
 *
 * PURPOSE (per みや 2026-06-19, "you failed to use codegraph AGAIN today… don't
 * waste my time having to check you"): the front-gate reminder fires every
 * investigation turn but is ADVISORY — so a turn can still claim the diagnosis is
 * "exhausted / complete" WITHOUT ever running codegraph (the mandated tool for
 * shape / symbol-location / blast-radius). This Stop hook hard-blocks the turn end
 * when such a completion-claim is made in a quest-active context and NO codegraph
 * call ran this turn.
 *
 * This is the PRE-PLANNED promotion the trigger hook's header named:
 * "promote to a Stop-side back-gate if the slip-log later shows Recon emits still
 *  skip the codemap despite this reminder" — the 2026-06-19 slip-log entry is that
 *  evidence.
 *
 * BLOCK MECHANISM: Stop hook returns {"decision":"block","reason":...} → the model
 * does not stop; it runs codegraph (or adds the bypass) and continues.
 *
 * TRIGGER (ALL must hold):
 *   (a) last assistant text makes a completion/exhausted claim, AND
 *   (b) quest/active.txt has a status=active block, AND
 *   (c) NO mcp__codegraph__* tool_use appears in the transcript THIS turn
 *       (since the last real user prompt).
 * EXEMPT: bypass [skip-codegraph: <reason>] · ═══ banners / Domain Expansion /
 *   るり結界 closing turns · short replies (<400 chars).
 * FAIL-OPEN: any parse/read error → allow stop.
 *
 * FALSE-POSITIVE COST: a completion-claim turn that legitimately needed no codegraph
 * (pure .docx / DB-only diagnosis) is blocked until codegraph runs or the bypass is
 * added. Bypass is one line — acceptable.
 *
 * Created 2026-06-19 per みや, routed through /system-design + /system-rules.
 * v1.2 2026-06-22 (QA-266503): added UI-path branch — a root-cause for a UI-rendered symptom
 *   (panel/screen "papar/hilang") with NO .xhtml render-path cite is blocked (codegraph is blind to
 *   JSF EL bindings; only the .xhtml proves the UI→bean→method chain). Kills the wrong-form / render-
 *   method flip-flop slip (claimed the year-walk renders the panel without reading the .xhtml).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO_ROOT = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\0. AI\\Project-AI-MemoryCore';
// env override for eval/self-test only (mirrors archive-quest.js --tasks); defaults to the real file
const ACTIVE_TXT = process.env.CODEGRAPH_GATE_ACTIVE_TXT || path.join(REPO_ROOT, 'quest', 'active.txt');
const LOG = path.resolve(__dirname, 'log.jsonl');

const COMPLETION_CLAIM = /every searchable avenue|exhaust\w*\b[\s\S]{0,40}(avenue|search|method|option|investigat)|(avenue|search|method|option)[\s\S]{0,20}exhaust|diagnosis (is |was )?(complete|done|finished)|no further (fact|facts|investigation|searching)|nothing (left|more|else) to (investigate|search|look|check|find)/i;
// v1.1 2026-06-19 (QA-266215): also fire on a CODE root-cause claim made WITHOUT codegraph —
// the "matched the symptom's vocabulary, never enumerated the failing action's gates" misdiagnosis.
const ROOT_CAUSE_CLAIM = /\broot[- ]?cause\b[\s\S]{0,30}\b(is|was|=|:)|the (bug|error|issue|failure|problem) (is|was) caused by|the (real |actual )?cause (is|was)\b/i;
const CODE_SIGNAL = /\.java\b|\bException\b|\bvalidation\b|\bgetter\b|\b\w+\(\)|:\d{2,4}\b|PropertyNotFound|NullPointer|\bmethod\b/i;
const EXEMPT = /\[skip-codegraph:|═══|るり結界|Domain Expansion/;
const CODEGRAPH_CALL = /mcp__codegraph__/;
// v1.2 2026-06-22 (QA-266503): UI render-path grounding. A root-cause for a UI-rendered symptom
// (panel/screen "papar/hilang") claimed WITHOUT citing the .xhtml render path. Today's slip: claimed
// which method renders the "Rekod Pembaharuan" panel, flip-flopped 3x, edited the WRONG form — never
// read the .xhtml binding. codegraph cannot see JSF EL bindings; only the .xhtml does.
const UI_SYMPTOM = /\b(panel|skrin|screen|borang|dropdown|rekod pembaharuan)\b|\bpapar\b|\bhilang\b|tidak papar|not (shown|displayed?|appearing)|does ?n'?t (show|display|appear)|screenshot/i;
const XHTML_CITE = /\.xhtml\b/i;

function readLines(p) {
  try { return fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean); } catch (_) { return null; }
}

function questActive() {
  try { return /\bstatus=active\b/.test(fs.readFileSync(ACTIVE_TXT, 'utf8')); } catch (_) { return false; }
}

function lastAssistantText(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj; try { obj = JSON.parse(lines[i]); } catch (_) { continue; }
    const msg = obj.message || obj;
    if ((msg.role || obj.type) !== 'assistant') continue;
    const c = msg.content;
    let text = '';
    if (typeof c === 'string') text = c;
    else if (Array.isArray(c)) text = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
    if (text.trim()) return text;
  }
  return '';
}

// did a codegraph tool_use happen since the last real user prompt (this turn)?
function codegraphUsedThisTurn(lines) {
  let turnStart = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj; try { obj = JSON.parse(lines[i]); } catch (_) { continue; }
    const msg = obj.message || obj;
    if ((msg.role || obj.type) !== 'user') continue;
    const c = msg.content;
    const hasText = typeof c === 'string' || (Array.isArray(c) && c.some(b => b && b.type === 'text'));
    if (hasText) { turnStart = i; break; }
  }
  for (let i = turnStart + 1; i < lines.length; i++) {
    if (CODEGRAPH_CALL.test(lines[i])) return true;
  }
  return false;
}

function logFire(action) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), gate: 'codegraph-back', action }) + '\n'); } catch (_) {}
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    if (data.stop_hook_active) process.exit(0); // avoid re-block loop

    const lines = readLines(data.transcript_path || '');
    if (!lines) process.exit(0); // fail-open

    const text = lastAssistantText(lines);
    if (!text || text.length < 400) process.exit(0);
    if (EXEMPT.test(text)) process.exit(0);
    const completionClaim = COMPLETION_CLAIM.test(text);
    const codeRootCause = ROOT_CAUSE_CLAIM.test(text) && CODE_SIGNAL.test(text);
    const uiRootCause = ROOT_CAUSE_CLAIM.test(text) && UI_SYMPTOM.test(text); // v1.2 2026-06-22
    if (!completionClaim && !codeRootCause && !uiRootCause) process.exit(0);
    if (!questActive()) process.exit(0); // only enforce in quest context

    // v1.2 (QA-266503) — UI render-path grounding takes precedence: a UI symptom grounds in the
    // .xhtml render path, not codegraph (which is blind to JSF EL bindings).
    if (uiRootCause) {
      if (!XHTML_CITE.test(text)) {
        logFire('blocked-uipath');
        process.stdout.write(JSON.stringify({
          decision: 'block',
          reason: [
            '⛔ codegraph-back-gate (UI-path): you named a root cause for a UI-rendered symptom',
            '   (panel/screen "papar/hilang") WITHOUT confirming which .xhtml renders it.',
            '   QA-266503 lesson: I flip-flopped on the render method + edited the WRONG form because I',
            '   never read the JSF binding. codegraph cannot see EL bindings — the .xhtml can.',
            '   Confirm the UI→bean→method chain from the file: grep the panel label/red-text → the',
            '   .xhtml component → its value="#{...}" binding + populate/action method → THEN name the',
            '   path, citing the .xhtml.',
            '   Genuinely not a UI render-path claim? add [skip-codegraph: <reason>].',
          ].join('\n'),
        }));
        process.exit(0);
      }
      logFire('passed-uipath');
      process.exit(0);
    }

    if (codegraphUsedThisTurn(lines)) { logFire('passed'); process.exit(0); }

    logFire('blocked');
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: [
        '⛔ codegraph-back-gate: in an active quest you claimed the diagnosis is complete/exhausted',
        '   OR named a CODE root cause — with NO codegraph call this turn.',
        '   The QA-266215 lesson: do NOT name the cause by symptom-vocabulary — ENUMERATE every gate',
        '   on the failing action + trace from the literal error. codegraph is the mandated tool:',
        '     • codegraph_callees — every gate / WHAT CALLS the failing action (enumerate, do not name-match)',
        '     • codegraph_node    — the whole SHAPE of a class / its members',
        '     • codegraph_search  — WHERE a symbol lives / which codebase',
        '     • codegraph_impact  — what BREAKS if you change it (blast radius)',
        '   Run the relevant codegraph query (+ quote the literal error from server.log), THEN end the turn.',
        '   Genuinely a non-code diagnosis (pure .docx / DB-only)? add [skip-codegraph: <reason>].',
      ].join('\n'),
    }));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
