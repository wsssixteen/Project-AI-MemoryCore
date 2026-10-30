/**
 * logic-blast-radius.discipline.hook.js — PreToolUse hook (Edit | Write)
 *
 * v2 2026-07-07 — quest-gate REMOVED per みや ("checks must always fire on etanah
 * fix work even outside quests"); relocated from .claude/hooks/logic-blast-radius-gate.js.
 * v1 (2026-07-02, QA-268273) required a status=active block in quest/active.txt,
 * which made the gate silently dark on ad-hoc "apply this fix" work outside quests.
 * v2 deletes the active.txt read entirely — the ONLY predicates are the path checks.
 *
 * HARD-BLOCK: forbids editing an etanah STATEFUL-FLOW .java file (Form lifecycle,
 * action handler, shared Service or Helper or Manager) until this session has emitted
 * a LOGIC BLAST RADIUS scenario-matrix (the mandatory Rubric step, quest-protocol.md
 * "Logic Blast Radius" section).
 *
 * WHAT THIS CAN AND CANNOT DO (read before trusting a PASS):
 *   CAN  (presence — near 100%): verify a Logic-Blast-Radius scenario matrix EXISTS
 *        this session before a stateful-flow etanah .java edit. Kills SKIPPING the check.
 *   CANNOT (correctness — stays human judgment): verify the matrix enumerated EVERY
 *        action or state path, or that each Safe? verdict is backed by real Evidence.
 *        A shape-valid but shallow matrix PASSES. NEVER read a PASS as "logic proven safe".
 *
 * Fail-OPEN: any error (no transcript, parse fail) → ALLOW.
 *   A gate must never block an edit because of its own bug.
 *
 * Bypass: include [skip-logic-blast: <reason>] anywhere in the session transcript —
 *   for a non-stateful change wrongly matched, or audit and compliance edits.
 *
 * Fires ONLY when the Edit or Write target is an etanah STATEFUL-FLOW .java path:
 *   path contains etanah-pelupusan or etanah-awam or etanah-common or etanah-teknikal
 *   followed by a path separator, AND the filename ends with Form or Bean or Handler
 *   or Helper or Service or Controller or Manager plus the .java extension.
 *   Example match: E:\Projects\Melaka\etanah-pelupusan\src\main\java\my\gov\MlkFooForm.java
 *   Otherwise → ALLOW (exit 0, silent). Templates, config, xhtml, docx never trigger it.
 *
 * Marker contract: the Logic Blast Radius emit carries the canonical banner
 *   with three box-drawing bars (or the ASCII === form) followed by the words
 *   LOGIC BLAST RADIUS. Banner-only by design — a loose phrase match false-passes
 *   on /verify output and meta-discussion.
 *
 * Log: appends fire records (blocked / allowed / bypassed) to log.jsonl beside this
 *   file; override the path with the LOGIC_BLAST_LOG env var (used by eval.js).
 */
const fs = require('fs');
const path = require('path');

function logFire(action, detail) {
  try {
    const logPath = process.env.LOGIC_BLAST_LOG || path.resolve(__dirname, 'log.jsonl');
    fs.appendFileSync(
      logPath,
      JSON.stringify(Object.assign({ ts: new Date().toISOString(), action }, detail)) + '\n'
    );
  } catch (e) {
    // logging must never break the gate
  }
}

// --- v3 arrival paths (2026-10-30, 287048) ------------------------------------------------------
// his-words: not an approval reader — reads assistant text and the quest doc, never his messages
const GATE_TOKEN = /setHantarSeterusnyaDisabled\(|HantarSeterusnyaDisabled|adalahBolehDihantar|submitDisabled|\bverifySign\b|\bisSigned\w*|\w*BolehDihantar\w*/;
const LITE = ['OPLPS', 'OMLPS', 'OPRU', 'OPRBB', 'OPLBP', 'OPPJK', 'OPPTPB'];
const SHARED = [
  { file: /BasePelupusanLiteForm\.java$/i, urusan: LITE },
  { file: /PelupusanService\.java$/i, token: /isSignedAllReport/, urusan: LITE.concat(['PRBB', 'MLPS', 'PLPS']) },
];
const ADMIN_IDS = ['alter', 'initiate', 'reassign', 'migrated'];
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');

function enclosingMethod(filePath, oldStr) {
  try {
    const file = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    const at = file.indexOf(String(oldStr || '').replace(/\r\n/g, '\n'));
    if (at < 0 || !oldStr) return '';
    const lines = file.slice(0, at + 1).split('\n');
    for (let i = lines.length - 1; i >= 0; i--) if (/^\s*(public|protected|private)\s[^=;]*\(/.test(lines[i])) return lines[i];
  } catch (e) {}
  return '';
}

function assistantText(raw) {
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch (e) { out.push(line); continue; }
    const m = o.message || o;
    if ((m.role || o.type) !== 'assistant') continue;
    const c = m.content;
    if (typeof c === 'string') out.push(c);
    else if (Array.isArray(c)) c.forEach(b => { if (b && b.type === 'text') out.push(b.text); });
  }
  return out.join('\n').replace(/```[\s\S]*?```/g, '');
}

function activeTickets() {
  try {
    const raw = fs.readFileSync(process.env.ARRIVAL_ACTIVE_FILE || path.join(ROOT, 'quest', 'active.txt'), 'utf8');
    const out = [];
    for (const b of raw.split(/\r?\n\s*\r?\n/)) { const q = b.match(/^qa=QA-(\d{5,7})\s*$/m); if (q && /^status=active\s*$/m.test(b)) out.push(q[1]); }
    return out;
  } catch (e) { return null; }
}

function docText(text) {
  const out = [];
  for (const m of text.matchAll(/ARRIVAL PATHS DOC:\s*QA-(\d{5,7})/g)) {
    const rel = path.join('projects', 'coding-projects', 'active', 'QA-' + m[1], 'QA-' + m[1] + '.md');
    for (const base of [process.env.ARRIVAL_DOC_ROOT, ROOT, path.resolve(ROOT, '..', '..', '..')].filter(Boolean)) {
      try { out.push(fs.readFileSync(path.join(base, rel), 'utf8').replace(/```[\s\S]*?```/g, '')); } catch (e) {}
    }
  }
  return out.join('\n');
}

function parseTables(text) {
  const tables = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((l, i) => {
    const m = l.match(/ARRIVAL PATHS\s*·\s*#?(\d{5,7})\s*·\s*([A-Z0-9_]+)\s*·\s*([A-Z0-9_]+)\s*·\s*source:\s*(.+?)\s*$/);
    if (!m) return;
    const rows = {};
    for (let j = i + 1; j < lines.length && (lines[j].trim().startsWith('|') || !lines[j].trim()); j++) {
      if (!lines[j].trim()) { if (Object.keys(rows).length) break; continue; }
      const c = lines[j].trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());
      if (/^id$/i.test(c[0]) || /^-+$/.test(c[0])) continue;
      rows[c[0]] = c;
    }
    tables.push({ ticket: m[1], urusan: m[2], tugasan: m[3], source: m[4], rows });
  });
  return tables;
}

function cacheFor(urusan, tugasan) {
  try { return JSON.parse(fs.readFileSync(path.join(process.env.ARRIVAL_CACHE_DIR || path.join(__dirname, 'arrival'), `${urusan}-${tugasan}.json`), 'utf8')); } catch (e) { return null; }
}

function checkTable(t, active) {
  const errs = [];
  if (active && !active.includes(t.ticket)) errs.push(`${t.ticket} is not an active quest (a table from an earlier ticket does not count)`);
  const cache = cacheFor(t.urusan, t.tugasan);
  if (!cache && !/^NOT VERIFIED: no BPMN/.test(t.source)) errs.push(`no scenario list for ${t.urusan} ${t.tugasan}: run node domain/logic-blast-radius/arrival-paths.js ${t.urusan} ${t.tugasan} --env <mlit|stg>`);
  if (cache && cache.source !== t.source) errs.push(`source line says "${t.source}", the script says "${cache.source}"`);
  const need = cache ? cache.ids : ADMIN_IDS;
  for (const id of need) {
    const c = t.rows[id];
    if (!c) { errs.push(`${t.urusan} ${t.tugasan}: row "${id}" is missing`); continue; }
    const rowsCell = c[2] || '';
    const verdict = (c[c.length - 1] || '').trim();
    const flowRow = /^(first-pass|loop:|entry:|subflow:)/.test(id);
    if (!/SELECT/i.test(rowsCell) && (flowRow || !/n\/a\s*[—-]/i.test(rowsCell))) errs.push(`${t.urusan} ${t.tugasan}: row "${id}" has no SELECT for the rows on arrival${flowRow ? ' (the flowable has this path, n/a is not allowed)' : ''}`);
    if (!/^(✓|✗|BA-Q)/.test(verdict)) errs.push(`${t.urusan} ${t.tugasan}: row "${id}" verdict must be ✓, ✗ or BA-Q`);
  }
  return errs;
}

function arrivalErrors(filePath, combined, rawTranscript) {
  const assistant = assistantText(rawTranscript);
  const tables = parseTables(assistant + '\n' + docText(assistant));
  const active = activeTickets();
  if (!tables.length) return ['no ARRIVAL PATHS table this session.'];
  const latest = new Map();
  tables.forEach(t => latest.set(t.urusan + '/' + t.tugasan, t));
  const errs = [];
  latest.forEach(t => errs.push(...checkTable(t, active)));
  for (const s of SHARED) {
    if (s.file.test(filePath) && (!s.token || s.token.test(combined))) {
      const have = new Set([...latest.values()].map(t => t.urusan));
      const missing = s.urusan.filter(u => !have.has(u));
      if (missing.length) errs.push(`${path.basename(filePath)} is shared: a table is also owed for ${missing.join(', ')}`);
    }
  }
  return errs;
}
// -------------------------------------------------------------------------------------------------

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || toolInput.path || '';

    // Predicate — etanah STATEFUL-FLOW .java path (the ONLY gate condition in v2)
    const isEtanahJava =
      /etanah-(pelupusan|awam|common|teknikal)[\\/]/i.test(filePath) &&
      /\.java$/i.test(filePath);
    const isStatefulFlow =
      /(Form|Bean|Handler|Helper|Service|Controller|Manager)\.java$/i.test(filePath);
    const newStr = toolInput.new_string || toolInput.content || '';
    const oldStr = toolInput.old_string || '';
    const isGateXhtml = /etanah-(pelupusan|awam|common|teknikal)[\\/]/i.test(filePath) && /\.xhtml$/i.test(filePath) && /\bdisabled\s*=/.test(newStr);
    const isJavaFlow = isEtanahJava && isStatefulFlow;
    if (!isJavaFlow && !isGateXhtml) process.exit(0);

    // Read this session's transcript (fail-open if unavailable — never block on our bug)
    let transcript = '';
    try {
      transcript = fs.readFileSync(data.transcript_path, 'utf8');
    } catch (e) {
      process.exit(0);
    }

    // Bypass token — current-turn assistant text only (2026-08-21 self-disarm fix)
    if ((function(){ try { return require((process.env.CLAUDE_PROJECT_DIR || require('path').resolve(__dirname, '..', '..')) + '/lib/bypass-scope.js').bypassInCurrentTurn; } catch (_) { return function () { return false; }; } })()(data.transcript_path, /\[skip-logic-blast:/i)) {
      logFire('bypassed', { file: filePath });
      process.exit(0);
    }

    // Logic-Blast-Radius marker: the BANNER only (box-char ═══ or ASCII === form).
    // Banner-only by design — NOT a loose phrase match: "logic blast radius" +
    // "Evidence" or "Safe?" appear in normal /verify output + meta-discussion, which
    // would false-PASS the gate. Requiring the banner means the matrix was deliberate.
    // v3: a change to a tugasan state check must carry the arrival paths the flowable lists
    const combined = newStr + '\n' + oldStr + '\n' + (isJavaFlow ? enclosingMethod(filePath, oldStr) : '');
    if (isGateXhtml || GATE_TOKEN.test(combined)) {
      const errs = arrivalErrors(filePath, combined, transcript);
      if (errs.length) {
        logFire('blocked-arrival', { file: filePath, errs: errs.slice(0, 6) });
        process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: ['🚫 logic-blast-radius v3: this edit changes a state check on a tugasan, so every way the permohonan can ARRIVE there must be proven first.', ...errs.map(e => '   - ' + e), '   List the paths from the flowable: node domain/logic-blast-radius/arrival-paths.js <URUSAN> <TUGASAN> --env <mlit|stg>', '   Fill the table under its header line (rows on arrival = a SELECT, verdict = ✓ ✗ BA-Q) in the quest doc under ## Arrival paths, then write the line: ARRIVAL PATHS DOC: QA-<num>', '   Not a tugasan state check? [skip-logic-blast: <reason>]'].join('\n') } }));
        process.exit(0);
      }
      logFire('arrival-ok', { file: filePath });
      if (isGateXhtml) process.exit(0);
    }

    const hasLogicMatrix =
      /(?:═══|===)\s*LOGIC[\s-]*BLAST[\s-]*RADIUS/i.test(transcript);
    if (hasLogicMatrix) {
      logFire('allowed', { file: filePath });
      process.exit(0); // logic matrix emitted → allow
    }

    const reason = [
      '🚫 logic-blast-radius-gate: no LOGIC BLAST RADIUS scenario matrix emitted this session.',
      `   Edit blocked: ${filePath}`,
      '   You are about to edit a stateful-flow etanah class without the mandatory logic',
      '   check. Enumerate EVERY action/state path the change participates in',
      '   (page init/entry · each action handler · re-entry/reload) and verify it is SAFE per path:',
      '',
      '     ═══ LOGIC BLAST RADIUS ═══',
      '     | Scenario (action × state) | Change fires? | Outcome | Safe? | Evidence (file:line/test) |',
      '',
      '   Each Outcome/Safe? verdict MUST cite OBSERVED file:line or a live test in Evidence —',
      '   an ASSUMED verdict = STOP, go read/observe first. (quest-protocol.md "Logic Blast Radius".)',
      '   This gate checks the matrix EXISTS (anti-skip); it does NOT verify it is complete/correct.',
      '   Genuinely non-stateful change wrongly matched, or audit edit? add',
      '   [skip-logic-blast: <reason>] to your message.',
    ].join('\n');

    logFire('blocked', { file: filePath });
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: reason,
        },
      })
    );
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
