#!/usr/bin/env node
/**
 * adhoc-lifecycle.js — the ACT side of the adhoc register (2026-08-19, miya build).
 *
 * The adhoc-register hook DETECTS open rows at ticket-time. This is the MOVER: it promotes a
 * matched adhoc into a ticket, archives an adhoc owned elsewhere, sweeps terminal rows, and
 * reverses any of it. NEVER deletes — every exit is a move that `unarchive` can undo.
 *
 * SAFETY INVARIANTS:
 *   - Register Status edits touch EXACTLY ONE row (matched by leading `| <id> |`); refuse if 0 or >1 match.
 *   - Directory moves are active<->archive only; never rm.
 *   - Every command appends one row to log.jsonl (ts + cmd + outcome + dur_ms) — system-rules Rule 5.
 *
 * STATE-SCOPE (system-design Rule 11): state-scoped: YES, keyed by <state> path segment
 *   (projects/coding-projects/active/etanah-knowledge/<state>/ADHOC-REGISTER.md). Defaults to
 *   melaka; pass --state <name> for a future Perak register. Resolves toward the MAIN repo when
 *   run from a worktree (projects/ is gitignored + main-only).
 *
 * USAGE:
 *   node domain/adhoc-lifecycle/adhoc-lifecycle.js match   --keys "<free text with ids>"
 *   node domain/adhoc-lifecycle/adhoc-lifecycle.js promote --row A18 --ticket QA-1234
 *   node domain/adhoc-lifecycle/adhoc-lifecycle.js archive --row A18 --reason "another module — MP handling"
 *   node domain/adhoc-lifecycle/adhoc-lifecycle.js unarchive --row A18
 *   node domain/adhoc-lifecycle/adhoc-lifecycle.js sweep   [--apply]
 *   (all accept --state <name> and --root <path> for tests)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = arg('root') || process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
// State via lib/states.js (2026-09-04 multi-state audit): --state <key> · ETANAH_STATE · else the registry's
// reference state, echoed to stderr so a default is never silent.
const statesLib = require(fs.existsSync(path.join(ROOT, 'lib', 'states.js')) ? path.join(ROOT, 'lib', 'states.js') : path.join(__dirname, '..', '..', 'lib', 'states.js'));
const STATE_ARG = arg('state') || process.env.ETANAH_STATE;
const STATE_REC = statesLib.get(STATE_ARG || statesLib.reference());
if (!STATE_REC) { console.error('adhoc-lifecycle: unknown state "' + STATE_ARG + '" — node lib/states.js list'); process.exit(2); }
const STATE = STATE_REC.knowledge_dir;
if (!STATE_ARG) console.error('adhoc-lifecycle: state = ' + STATE_REC.key + ' (reference-state default — pass --state <key>)');

function arg(name) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined; }
function has(name) { return process.argv.indexOf('--' + name) > 0; }

// ---- path resolution (main-repo-aware via lib/states.js) ----
function mainRoot() { return statesLib.mainRoot(ROOT); }
function registerPath() {
  return path.join(statesLib.knowledgeDir(STATE_REC.key, ROOT), 'ADHOC-REGISTER.md'); // canonical target even if absent (loud downstream)
}
function activeDir() { return path.join(mainRoot(), 'projects', 'coding-projects', 'active'); }
function archiveDir() { return path.join(mainRoot(), 'projects', 'coding-projects', 'archive'); }
const LOG = path.join(__dirname, 'log.jsonl');

// ---- log (system-rules Rule 5: ts + outcome + dur_ms) ----
function logRow(cmd, outcome, extra, started) {
  const row = { ts: nowIso(), cmd, outcome, dur_ms: started ? (hrms() - started) : null, ...extra };
  try { fs.appendFileSync(LOG, JSON.stringify(row) + '\n'); } catch (_) { /* logging must never crash the op */ }
  return row;
}
function nowIso() { try { return new Date().toISOString(); } catch (_) { return ''; } }
function hrms() { const h = process.hrtime(); return h[0] * 1000 + h[1] / 1e6; }

// ---- register row parsing ----
// Row: | A18 | date | asked | ask | conclusion | evidence | Status |
function readRegister() {
  const p = registerPath();
  if (!fs.existsSync(p)) return { p, lines: null };
  return { p, lines: fs.readFileSync(p, 'utf8').split(/\r?\n/) };
}
function rowIndex(lines, id) {
  const re = new RegExp('^\\|\\s*' + escapeRe(id) + '\\s*\\|');
  const hits = [];
  lines.forEach((l, i) => { if (re.test(l.trim())) hits.push(i); });
  return hits;
}
function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function setStatusCell(line, newStatus) {
  // cells are '| a | b | ... | status |' — replace the LAST non-empty cell
  const parts = line.split('|');
  // parts[0]='' , parts[last]='' (trailing). status is parts[parts.length-2]
  const si = parts.length - 2;
  if (si < 1) return null;
  parts[si] = ' ' + newStatus + ' ';
  return parts.join('|');
}
function statusOf(line) {
  const parts = line.split('|');
  const si = parts.length - 2;
  return si >= 1 ? parts[si].replace(/[`*]/g, '').trim() : '';
}

// ---- unique-key extraction (R2) ----
const KEY_PATTERNS = [
  ['permohonan', /\bP[A-Z]{2,5}\/\d{2}\/[A-Z]\/[A-Z]{2,6}\/\d{4}\/\d+\b/g],
  ['aplikasi',   /\b3\d{6}\b/g],                                   // aplikasi ids are 3-millions in Melaka
  ['warta',      /\bNO\.?\s*\d{1,5}\b/gi],
  ['lesen',      /\b[A-Z]\d{2}\/\d{4}\/\d+(?:\/\d+)?\b/g],
  ['resit',      /\b\d{6}[A-Z]{2,6}\d{3,6}\b/g],
  ['hakmilik',   /\b\d{6}[A-Z]{2,4}\d{6,10}\b/g],
  ['kp',         /\b\d{6}-\d{2}-\d{4}\b/g],
];
function extractKeys(text) {
  const out = {};
  for (const [name, re] of KEY_PATTERNS) {
    const m = String(text).match(re);
    if (m) out[name] = Array.from(new Set(m.map(s => s.toUpperCase().replace(/\s+/g, ' ').trim())));
  }
  return out;
}

// ---- commands ----
function cmdMatch() {
  const t0 = hrms();
  const keysText = arg('keys') || '';
  const want = extractKeys(keysText);
  const wantFlat = new Set(Object.values(want).flat());
  const { p, lines } = readRegister();
  if (!lines) { console.error('adhoc-lifecycle: register not found at ' + p); logRow('match', 'no-register', { state: STATE }, t0); process.exit(3); }
  const results = [];
  for (const line of lines) {
    const t = line.trim();
    if (!/^\|\s*[A-Z]?\d+\s*\|/.test(t)) continue;
    const rowKeys = new Set(Object.values(extractKeys(line)).flat());
    const hits = [...wantFlat].filter(k => rowKeys.has(k));
    if (hits.length) {
      const id = t.split('|')[1].trim();
      results.push({ id, matchedKeys: hits, status: statusOf(line) });
    }
  }
  console.log(JSON.stringify({ query: want, matches: results }, null, 2));
  logRow('match', results.length ? 'matched' : 'no-match', { state: STATE, n: results.length, wantKeys: [...wantFlat] }, t0);
}

function editStatus(id, newStatus, cmd, extra) {
  const t0 = hrms();
  const { p, lines } = readRegister();
  if (!lines) { console.error('adhoc-lifecycle: register not found at ' + p); logRow(cmd, 'no-register', { id }, t0); process.exit(3); }
  const hits = rowIndex(lines, id);
  if (hits.length !== 1) {
    console.error('adhoc-lifecycle: refusing — row "' + id + '" matched ' + hits.length + ' lines (need exactly 1).');
    logRow(cmd, 'refused-ambiguous', { id, hitCount: hits.length }, t0);
    process.exit(4);
  }
  const i = hits[0];
  const before = statusOf(lines[i]);
  const updated = setStatusCell(lines[i], newStatus);
  if (!updated) { console.error('adhoc-lifecycle: could not locate status cell on row ' + id); logRow(cmd, 'no-status-cell', { id }, t0); process.exit(5); }
  lines[i] = updated;
  fs.writeFileSync(p, lines.join('\n'));
  console.log('adhoc-lifecycle: ' + id + ' status "' + before + '" -> "' + newStatus + '"');
  logRow(cmd, 'ok', { id, before, after: newStatus, ...(extra || {}) }, t0);
  return { p, i, before };
}

// move a qa_doc dir active<->archive by slug (best-effort; logs if absent)
function moveDir(slug, dir) {
  if (!slug) return { moved: false, why: 'no-slug' };
  const from = path.join(dir === 'archive' ? activeDir() : archiveDir(), slug);
  const to = path.join(dir === 'archive' ? archiveDir() : activeDir(), slug);
  if (!fs.existsSync(from)) return { moved: false, why: 'absent', from };
  try { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.renameSync(from, to); return { moved: true, from, to }; }
  catch (e) { return { moved: false, why: String(e && e.message || e), from, to }; }
}

function cmdPromote() {
  const id = arg('row'), ticket = arg('ticket'), slug = arg('slug');
  if (!id || !ticket) { console.error('usage: promote --row <id> --ticket <QA-n> [--slug <dir>]'); process.exit(2); }
  const mv = slug ? moveDir(slug, 'archive') : { moved: false, why: 'no-slug-given' };
  editStatus(id, 'TICKETED → ' + ticket + ' (' + nowIso().slice(0, 10) + ')', 'promote', { ticket, dirMove: mv });
  if (mv.moved) console.log('  qa_doc moved -> archive\\' + slug);
  else console.log('  qa_doc NOT moved (' + mv.why + ') — move by hand if needed');
}

function cmdArchive() {
  const id = arg('row'), reason = arg('reason') || 'archived', slug = arg('slug');
  if (!id) { console.error('usage: archive --row <id> [--reason <text>] [--slug <dir>]'); process.exit(2); }
  const mv = slug ? moveDir(slug, 'archive') : { moved: false, why: 'no-slug-given' };
  editStatus(id, 'OWNED-ELSEWHERE (' + reason + ', ' + nowIso().slice(0, 10) + ')', 'archive', { reason, dirMove: mv });
  if (mv.moved) console.log('  qa_doc moved -> archive\\' + slug);
}

function cmdUnarchive() {
  const id = arg('row'), slug = arg('slug'), status = arg('status') || 'OPEN';
  if (!id) { console.error('usage: unarchive --row <id> [--slug <dir>] [--status <OPEN>]'); process.exit(2); }
  const mv = slug ? moveDir(slug, 'active') : { moved: false, why: 'no-slug-given' };
  editStatus(id, status, 'unarchive', { dirMove: mv });
  if (mv.moved) console.log('  qa_doc restored -> active\\' + slug);
}

// Door B: list terminal-status rows aged > N days. --apply is a NO-OP placeholder for register
// rows (their dir slug is not in the row) — it reports; the operator confirms + runs promote/archive.
function cmdSweep() {
  const t0 = hrms();
  const { p, lines } = readRegister();
  if (!lines) { console.error('adhoc-lifecycle: register not found at ' + p); logRow('sweep', 'no-register', {}, t0); process.exit(3); }
  const TERMINAL = /\b(ANSWERED|OWNED-ELSEWHERE|TICKETED|RESOLVED)\b/;
  const rows = [];
  for (const line of lines) {
    const t = line.trim();
    if (!/^\|\s*[A-Z]?\d+\s*\|/.test(t)) continue;
    const cells = t.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 7) continue;
    const status = cells[6].replace(/[`*]/g, '');
    if (TERMINAL.test(status)) rows.push({ id: cells[0], date: cells[1], status: status.slice(0, 40) });
  }
  console.log(JSON.stringify({ terminalRows: rows, note: 'terminal-status rows — safe to archive folder + drop from active surfacing' }, null, 2));
  logRow('sweep', 'listed', { terminalCount: rows.length }, t0);
}

const cmd = process.argv[2];
const table = { match: cmdMatch, promote: cmdPromote, archive: cmdArchive, unarchive: cmdUnarchive, sweep: cmdSweep };
if (table[cmd]) table[cmd]();
else { console.error('usage: adhoc-lifecycle <match|promote|archive|unarchive|sweep> ...'); process.exit(2); }
