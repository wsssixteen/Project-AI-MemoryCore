/**
 * predicate-box.discipline.hook.js — Stop hook (BLOCKING)
 *
 * Power: domain/predicate-box/
 *
 * v4 (2026-10-04): confidence route. The probe requirement also passes when the
 *   LAST fix confidence the session states (assistant text or a .md it wrote,
 *   the word confidence then a number and the percent sign on one line) is 80 or
 *   more. Probes are for a diagnosis that is still uncertain; a fix the Rubric
 *   already rates 80+ goes to commit and deploy (miya 2026-10-04, #282924: a
 *   simple agreed fix was forced into probe loggers and a local test).
 *   A later, lower figure wins, so a diagnosis that drops below 80 owes the matrix.
 *   Spec preservation v3 -> v4: matrix route, cleanup route, skip token and its
 *   refusals (placeholder, short, size reason), exit 2 on stderr, every log row:
 *   all kept. Added: probe-passed row with detail 'confidence NN%'.
 *
 * v3 (2026-10-04): SECOND requirement added — the probe decision.
 *   An etanah .java file changed through an Edit/Write/MultiEdit tool call
 *   must be backed by ONE of:
 *     - a PROBE COVERAGE MATRIX table in assistant text or in a .md the
 *       session wrote (the quest doc): header cell "Probe placed", a separator
 *       row, >= 3 data rows (Ritual 6: >= 3 what-if scenarios) and one row
 *       marked FALLBACK / OUTERMOST — the probe that still fires when none of
 *       the expected paths run, so a failed test still tells something
 *       (みや 2026-10-04: "extensive & make fallbacks even for loggers"), or
 *     - every .java edit in the session is probe CLEANUP (the QA<num>-PROBE
 *       marker is in old_string and gone from new_string), or
 *     - [skip-probe-matrix: <reason>] in assistant text AFTER the last .java
 *       edit. A reason holding "<" (this help text quoted back), shorter than
 *       8 characters, or arguing from size (small / trivial / simple / minor /
 *       quick / one-line) is refused.
 *   A single probe placed with no matrix does NOT pass: one probe answers one
 *   hypothesis, which is the miss this requirement exists for.
 *   Missing all three -> exit 2, reason on stderr. Fires at every Stop until
 *   paid; independent of fix-intent (the #282442 edit turn carried none).
 *   Probes stay LOCAL (domain/probe-local-only-gate): the matrix may describe
 *   uncommitted probes; this gate never asks for a commit.
 *
 *   Spec preservation v2 -> v3:
 *   | v2 spec                                               | v3        |
 *   |-------------------------------------------------------|-----------|
 *   | block when etanah edit + fix-intent + no ASSUMPTION/FALSIFIER | kept |
 *   | block = {"decision":"block"} on stdout, exit 0        | kept      |
 *   | fix-intent regex on the LAST user message             | kept      |
 *   | etanah-edit heuristic (path + edit cue in raw text)   | kept      |
 *   | stop_hook_active -> silent exit                       | kept (both requirements) |
 *   | fail-open on read/parse error                         | kept (both requirements) |
 *   | log rows blocked/passed/bypassed/skipped-no-intent    | kept; + probe-* rows |
 *   | [skip-predicate-box: reason] anywhere in transcript   | CHANGED: a reason holding "<" no longer counts (the block text and the README quote the token with a placeholder and were disarming the gate) |
 *
 * v2 (2026-07-07): quest-gate REMOVED + advisory promoted to decision:block.
 *   Relocated from .claude/hooks/predicate-box-gate.js (v1). v1 was doubly
 *   toothless: (1) it required quest/active.txt to hold status=active, so it
 *   was dark outside formal quests; (2) it was a console.log advisory the model
 *   could ignore. Per みや 2026-07-07: checks must always fire.
 *
 * WHAT (requirement 1): HARD-BLOCKS the turn when ALL THREE hold:
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
 * BLOCK MECHANISM (requirement 1): prints {"decision":"block","reason":...} —
 *   the model must emit the Predicate Diagram (ASSUMPTION -> EVIDENCE ->
 *   matches/FALSIFIER) and re-send, or use the bypass token. When the probe
 *   requirement is also unmet its lines ride in the same reason.
 *
 * ANTI-LOOP: stop_hook_active true in the Stop payload -> immediate silent
 *   exit (copied from domain/show-gate/show-gate.discipline.hook.js).
 *
 * Fail-OPEN: any read/parse error -> exit 0 silently.
 * Log: domain/predicate-box/log.jsonl (PREDICATE_BOX_LOG overrides, eval only)
 *   — blocked / passed / bypassed / skipped-no-intent / probe-blocked /
 *   probe-passed / probe-bypassed (with the reason) / probe-refused.
 *
 * CANNOT: verify the diagram's or the matrix's content is correct, that cited
 *   Evidence is real, or that it preceded the specific edit. Presence-only.
 *   Does not see .java changes made through a shell command or a sub-agent.
 *
 * Eval: domain/predicate-box/eval.js (run before any change here).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const LOG = process.env.PREDICATE_BOX_LOG || path.resolve(__dirname, 'log.jsonl');

const FIX_INTENT = /\b(fix|fixes|patch|bug|debug|error|issue|implement|apply|broken|salah|tak keluar)\b/i;
const BYPASS = /\[skip-predicate-box:\s*([^\]]+)\]/gi;
const ETANAH_PATH = /etanah-(pelupusan|awam|common|teknikal)[\\/][^\s"'`]*\.(java|xhtml)\b/i;
const EDIT_CUE = /\b(Edit|Write|old_string|new_string|file_path)\b/i;

// Probe requirement (v3).
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit']);
const ETANAH_JAVA_FILE = /etanah-(pelupusan|awam|common|teknikal)[\\/].*\.java$/i;
const PROBE_MARKER = /QA\d+[A-Z]*-PROBE/;
const PROBE_SKIP = /\[skip-probe-matrix:\s*([^\]]+)\]/gi;
const CONFIDENCE = /confidence[^\n%]{0,60}?(\d{1,3})\s*%/gi;
const CONFIDENCE_FLOOR = 80;
const SIZE_REASON = /\b(too\s+small|small|tiny|trivial|simple|minor|quick|one[- ]?liner?|kecil)\b/i;

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

// Parse the .jsonl transcript once.
//   raw / lastUserText / assistantText — requirement 1 (unchanged).
//   javaEdits / lastJavaEditIdx / probeInEdit / mdWritten / assistantAt — requirement 2.
function parseTranscript(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (e) { return null; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  let lastUserText = '';
  const assistantTexts = [];
  const assistantAt = [];
  const mdWritten = [];
  let javaEdits = 0, lastJavaEditIdx = -1, cleanupEdits = 0;
  lines.forEach((line, idx) => {
    let obj;
    try { obj = JSON.parse(line); } catch (e) { return; }
    const msg = obj.message || obj;
    const role = msg.role || obj.type;
    const text = blockTextFromContent(msg.content);
    if (role === 'user' && text.trim()) lastUserText = text; // keep overwriting -> last wins
    else if (role === 'assistant' && text.trim()) { assistantTexts.push(text); assistantAt.push({ idx, text }); }
    if (role !== 'assistant' || !Array.isArray(msg.content)) return;
    for (const b of msg.content) {
      if (!b || b.type !== 'tool_use' || !EDIT_TOOLS.has(b.name) || !b.input) continue;
      const fp = String(b.input.file_path || '');
      if (ETANAH_JAVA_FILE.test(fp)) {
        javaEdits++; lastJavaEditIdx = idx;
        if (isProbeCleanup(b.input)) cleanupEdits++;
      } else if (/\.md$/i.test(fp)) {
        mdWritten.push(String(b.input.content || b.input.new_string || ''));
      }
    }
  });
  return { raw, lastUserText, assistantText: assistantTexts.join('\n'), assistantAt, mdWritten, javaEdits, lastJavaEditIdx, cleanupEdits };
}

// A bypass reason is real only when it is not the placeholder from the help text.
function hasRealBypass(text, rx) {
  let m; const re = new RegExp(rx.source, 'gi');
  while ((m = re.exec(text)) !== null) { if (!m[1].includes('<') && m[1].trim()) return true; }
  return false;
}

// Probe cleanup = the marker leaves the file: present in what is replaced, absent from what replaces it.
function isProbeCleanup(inp) {
  const pairs = Array.isArray(inp.edits) ? inp.edits : [inp];
  let removed = false;
  for (const p of pairs) {
    if (PROBE_MARKER.test(String(p.new_string || '') + String(p.content || ''))) return false;
    if (PROBE_MARKER.test(String(p.old_string || ''))) removed = true;
  }
  return removed;
}

// PROBE COVERAGE MATRIX = header row with a "Probe placed" cell + separator row + data rows.
// Returns the best table found: {rows, fallback}. Complete = rows >= 3 and a FALLBACK row.
const MIN_ROWS = 3;
const FALLBACK_ROW = /\b(fallback|outermost)\b/i;
function probeMatrix(text) {
  const L = String(text || '').split(/\r?\n/);
  let best = null;
  for (let i = 0; i < L.length - 2; i++) {
    if (!/\|/.test(L[i]) || !/probe\s+placed/i.test(L[i])) continue;
    if (!/^\s*\|?\s*:?-{2,}/.test(L[i + 1])) continue;
    let rows = 0, fallback = false;
    for (let j = i + 2; j < L.length && /\|/.test(L[j]); j++) {
      const cells = L[j].split('|').map(s => s.trim()).filter(Boolean);
      if (cells.length < 3 || !cells.some(c => /[A-Za-z]{3,}/.test(c))) continue;
      rows++;
      if (FALLBACK_ROW.test(L[j])) fallback = true;
    }
    if (!best || rows > best.rows || (rows === best.rows && fallback && !best.fallback)) best = { rows, fallback };
  }
  return best;
}
function matrixComplete(m) { return !!m && m.rows >= MIN_ROWS && m.fallback; }
// Requirement 1 verdict — v2 logic, order unchanged.
function predicateVerdict(t) {
  if (!FIX_INTENT.test(t.lastUserText)) return 'skipped-no-intent';
  if (!(ETANAH_PATH.test(t.raw) && EDIT_CUE.test(t.raw))) return 'no-edit';
  if (hasRealBypass(t.raw, BYPASS)) return 'bypassed';
  if (/\bASSUMPTION\b/i.test(t.assistantText) && /\bFALSIFIER\b/i.test(t.assistantText)) return 'passed';
  return 'blocked';
}

// Last fix confidence stated in the session (assistant text, then .md written). null = none stated.
function lastConfidence(t) {
  let last = null;
  for (const src of [t.assistantText].concat(t.mdWritten)) {
    let m; const re = new RegExp(CONFIDENCE.source, 'gi');
    while ((m = re.exec(String(src || ''))) !== null) { const n = parseInt(m[1], 10); if (n <= 100) last = n; }
  }
  return last;
}

// Requirement 2 verdict.
function probeVerdict(t) {
  if (!t.javaEdits) return { v: 'no-java-edit' };
  if (t.cleanupEdits === t.javaEdits) return { v: 'passed', how: 'probe-cleanup' };
  const conf = lastConfidence(t);
  if (conf !== null && conf >= CONFIDENCE_FLOOR) return { v: 'passed', how: 'confidence ' + conf + '%' };
  let matrix = null;
  for (const src of [t.assistantText].concat(t.mdWritten)) {
    const m = probeMatrix(src);
    if (matrixComplete(m)) return { v: 'passed', how: 'matrix ' + m.rows + ' rows' };
    if (m && (!matrix || m.rows > matrix.rows)) matrix = m;
  }
  let refused = matrix ? 'matrix incomplete: ' + matrix.rows + ' row(s), fallback row ' + (matrix.fallback ? 'present' : 'MISSING') : '';
  for (const a of t.assistantAt) {
    if (a.idx <= t.lastJavaEditIdx) continue; // a skip covers the edits before it, never later ones
    let m; const re = new RegExp(PROBE_SKIP.source, 'gi');
    while ((m = re.exec(a.text)) !== null) {
      const reason = m[1].trim();
      if (reason.includes('<')) { refused = refused || 'skip token is the placeholder'; continue; }
      if (reason.length < 8) { refused = 'skip reason too short: ' + reason; continue; }
      if (SIZE_REASON.test(reason)) { refused = 'skip reason argues from size: ' + reason; continue; }
      return { v: 'bypassed', reason };
    }
  }
  return { v: 'blocked', refused };
}

const PROBE_REASON = [
  'BLOCKED — probe-matrix: an etanah .java file was edited and the session carries NO probe decision.',
  '   Logging is not optional for a code fix (quest SKILL.md EXHAUSTIVE-BRANCH LOGGING, quest-protocol.md Ritual 6).',
  '   Emit the PROBE COVERAGE MATRIX and place the QA<num>-PROBE loggers it lists in the SAME build:',
  '   | # | Candidate writer (full address) | Probe placed? | If silent, what it proves |',
  '   At least 3 rows (every path that could produce the value, not only the favourite), and one row marked FALLBACK:',
  '   the outermost probe that still fires when none of the expected paths run, so a failed test still tells something.',
  '   Probes stay local and uncommitted (probe-local-only-gate) — do not commit or merge them.',
  '   Probes are for an uncertain diagnosis: a fix confidence stated at eighty percent or more in the reply passes with no probes.',
  '   No runtime path to probe? Add [skip-probe-matrix: <reason>] to the reply. A size reason (small / trivial / simple / one-line) is refused.',
];

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

    const pred = predicateVerdict(t);
    if (pred === 'blocked') logFire('blocked', 'etanah edit + fix-intent, no ASSUMPTION+FALSIFIER pair');
    else if (pred !== 'no-edit') logFire(pred);

    const probe = probeVerdict(t);
    if (probe.v === 'passed') logFire('probe-passed', probe.how);
    else if (probe.v === 'bypassed') logFire('probe-bypassed', probe.reason);
    else if (probe.v === 'blocked') {
      if (probe.refused) logFire('probe-refused', probe.refused);
      logFire('probe-blocked', t.javaEdits + ' etanah .java edit(s), no complete matrix');
    }

    if (pred === 'blocked') {
      const reason = [
        'BLOCKED — predicate-box: an etanah .java/.xhtml file was edited on a fix-intent turn but NO Predicate Diagram was emitted.',
        '   Emit the 3-node Predicate Diagram (CLAUDE.md section 10): ASSUMPTION -> EVIDENCE (file:line + quoted code) -> matches/FALSIFIER,',
        '   then re-send the reply. Genuinely not applicable? Add [skip-predicate-box: <reason>] and continue.',
      ];
      if (probe.v === 'blocked') reason.push('', ...PROBE_REASON);
      process.stdout.write(JSON.stringify({ decision: 'block', reason: reason.join('\n') }));
      process.exit(0);
    }
    if (probe.v === 'blocked') {
      const lines = PROBE_REASON.slice();
      if (probe.refused) lines.push('   Refused: ' + probe.refused + '.');
      process.stderr.write(lines.join('\n') + '\n');
      process.exit(2);
    }
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
