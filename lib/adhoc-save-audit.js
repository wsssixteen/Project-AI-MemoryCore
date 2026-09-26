#!/usr/bin/env node
// adhoc-save-audit — born via forge
// symptom: 2026-09-25 miya: 'Create a skill that you will always invoke to properly save every adhoc findings properly, make sure to always audit each round of save and apply the fixes straight-away'
// goal: no adhoc save round leaves a missing or inconsistent save-set part
// goal_signal: exit 0 after the fix loop
// retention: keep
//
// Audits the 4-part adhoc save-set for ONE adhoc id and prints PASS/FAIL per check with the fix.
//   1 active.txt block   (quest/active.txt, or quest/active-archive.txt once closed)
//   2 qa_doc             (projects/coding-projects/active|archive/ADHOC-*/ADHOC-*.md)
//   3 register row       (etanah-knowledge/<state>/ADHOC-REGISTER.md, row = adhoc_register_row)
//   4 Task folder        (task_folder= path: 0. Brief/ non-empty + notes file "1. <ADHOC-ID>.txt")
// Exit 0 = all PASS · 1 = any FAIL · 2 = usage error. Read-only: it never edits a file.
//
// USAGE: node lib/adhoc-save-audit.js <ADHOC-ID> [--state <key>] [--root <memorycore root>] [--json]
// state-scoped: yes, keyed by --state via lib/states.js (default = registry reference state, echoed).
// Log: system/telemetry/adhoc-save-audit.jsonl (one row per run: ts, id, outcome, fails, dur_ms).
'use strict';
const fs = require('fs');
const path = require('path');

const t0 = Date.now();
function arg(n) { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; }
const ID = (process.argv[2] || '').trim().toUpperCase();
if (!/^ADHOC-[A-Z0-9-]+$/.test(ID)) { console.error('usage: node lib/adhoc-save-audit.js <ADHOC-ID> [--state <key>] [--root <path>] [--json]'); process.exit(2); }

const ROOT = arg('root') || process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const statesLib = require(fs.existsSync(path.join(ROOT, 'lib', 'states.js')) ? path.join(ROOT, 'lib', 'states.js') : path.join(__dirname, 'states.js'));
const MAIN = statesLib.mainRoot(ROOT);
const STATE = statesLib.get(arg('state') || statesLib.reference());
if (!STATE) { console.error('adhoc-save-audit: unknown state "' + arg('state') + '"'); process.exit(2); }
if (!arg('state')) console.error('adhoc-save-audit: state = ' + STATE.key + ' (reference default — pass --state <key>)');

// branch + the Next-Steps Checklist heading are what domain/checklist-reactivate/resume-readiness.js requires (DE 12.6).
const REQUIRED_KEYS = ['phase', 'status', 'ticket_type', 'env', 'urusan', 'quest_start', 'adhoc_register_row', 'qa_doc', 'task_folder', 'issue_one_liner', 'branch'];
const OPEN_STATUSES = ['active', 'hold', 'blocked', 'delegated'];
const results = [];
function check(name, pass, fix) { results.push({ name, pass: !!pass, fix: pass ? '' : fix }); }
function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } }

// ---- 1. active.txt block ----
function blocks(text) {
  const out = [];
  let cur = null;
  for (const line of (text || '').split(/\r?\n/)) {
    const m = line.match(/^([a-z0-9_]+)=(.*)$/i);
    if (m && m[1] === 'qa') { cur = { qa: m[2].trim() }; out.push(cur); continue; }
    if (!line.trim()) { cur = null; continue; }
    if (m && cur) cur[m[1]] = m[2].trim();
  }
  return out;
}
const activeTxt = read(path.join(MAIN, 'quest', 'active.txt'));
const archiveTxt = read(path.join(MAIN, 'quest', 'active-archive.txt'));
const inActive = blocks(activeTxt).filter(b => b.qa.toUpperCase() === ID);
const inArchive = blocks(archiveTxt).filter(b => b.qa.toUpperCase() === ID);
const all = inActive.concat(inArchive);
check('block: exactly one active.txt/active-archive.txt block', all.length === 1,
  all.length ? `${all.length} blocks for ${ID} — merge into one` : `no block — node quest/active-cli.js start ${ID} ...`);
const B = all[0] || {};
const missing = REQUIRED_KEYS.filter(k => !B[k]);
check('block: required keys present', !missing.length, 'add ' + missing.join(', '));
const placeholders = Object.entries(B).filter(([, v]) => /<[^>]+>|\bTODO\b/.test(v)).map(([k]) => k);
check('block: no placeholders (<...>/TODO)', !placeholders.length, 'fill ' + placeholders.join(', '));
check('block: ticket_type=adhoc', !B.ticket_type || /^adhoc$/i.test(B.ticket_type), 'set ticket_type=adhoc (or promote via adhoc-lifecycle if it became a ticket)');
const isOpen = OPEN_STATUSES.includes((B.status || '').toLowerCase());
check('block: open ↔ file location', !all.length || (isOpen ? inActive.length === 1 : inArchive.length === 1),
  isOpen ? 'open status but block sits in active-archive.txt — move it back' : 'closed/archived status but block still in active.txt — move to active-archive.txt');

// ---- 2. qa_doc ----
const qaPath = B.qa_doc ? path.join(MAIN, B.qa_doc.replace(/\//g, path.sep)) : null;
const qa = qaPath ? read(qaPath) : null;
check('qa_doc: file exists', qa !== null, `create ${B.qa_doc || 'projects/coding-projects/active/' + ID + '/' + ID + '.md'}`);
if (qa !== null) {
  for (const h of ['## Issue Summary', '## Match Keys']) check(`qa_doc: has "${h}"`, qa.includes(h), `add the ${h} block (ADHOC-REGISTER.md standard header)`);
  for (const k of ['Symptom', 'Screen', 'Verdict']) check(`qa_doc: Issue Summary "${k}" line`, new RegExp('^-\\s*' + k + '\\s*:\\s*\\S', 'm').test(qa), `add "- ${k} : ..." under ## Issue Summary`);
  for (const k of ['permohonan', 'aplikasi']) check(`qa_doc: Match Keys "${k}" line`, new RegExp('^-\\s*' + k + '\\s*:\\s*\\S', 'm').test(qa), `add "- ${k} : <value or —>" under ## Match Keys`);
  check('qa_doc: "## Next-Steps Checklist" section', /^##\s.*next[- ]?steps?\s+checklist/im.test(qa), 'add a "## Next-Steps Checklist" section (resume-readiness requires it)');
  if (/^(hold|blocked|delegated)$/i.test(B.status || '')) check('qa_doc: "## 0. Resume Point" for a waiting adhoc', /^##\s*0\.\s*Resume Point/im.test(qa), 'add the ## 0. Resume Point table (expansion-protocol §Step 2b extra-robust rows)');
  check('qa_doc: no TODO / placeholders', !/\bTODO\b|<value|<A#>/.test(qa), 'resolve every TODO / placeholder');
}

// ---- 3. register row ----
const regPath = path.join(statesLib.knowledgeDir(STATE.key, ROOT) || '', 'ADHOC-REGISTER.md');
const reg = read(regPath);
check('register: file exists', reg !== null, 'missing ' + regPath);
const rowId = (B.adhoc_register_row || '').trim();
if (reg !== null && rowId) {
  const rows = reg.split(/\r?\n/).filter(l => l.startsWith('| ' + rowId + ' |'));
  check(`register: row ${rowId} exactly once`, rows.length === 1, rows.length ? `${rows.length} rows share ${rowId} — renumber` : `append row ${rowId}`);
  const row = rows[0] || '';
  check(`register: row ${rowId} cites ${ID}`, row.toUpperCase().includes(ID), `name ${ID} in the "Evidence lives at" cell`);
  const cells = row.split('|').map(c => c.trim()).filter(Boolean);
  const status = cells[cells.length - 1] || '';
  const statusOpen = /^`?OPEN\b/i.test(status);
  check('register: status cell uses the vocabulary', /^`?(OPEN|ANSWERED|OWNED-ELSEWHERE|LATENT|TICKETED|RESOLVED|BECAME|ARCHIVED)/i.test(status), 'start the Status cell with OPEN / ANSWERED / OWNED-ELSEWHERE / LATENT / TICKETED / RESOLVED');
  check('register: status ↔ block status', !B.status || statusOpen === isOpen,
    `block status=${B.status} but register says "${status.slice(0, 30)}" — make them agree`);
  const claimants = blocks(activeTxt).filter(b => (b.adhoc_register_row || '').trim() === rowId && b.qa.toUpperCase() !== ID).map(b => b.qa);
  check(`register: ${rowId} not claimed by another open block`, !claimants.length, `${rowId} also claimed by ${claimants.join(', ')} — pick the next free A#`);
}

// ---- 4. Task folder ----
const tf = B.task_folder;
const tfOk = tf && fs.existsSync(tf);
check('task folder: exists', tfOk, `create ${tf || '1. Tasks\\<State>\\<N+1>. AH - <ENV> - <URUSAN> - <desc>'}`);
if (tfOk) {
  const brief = path.join(tf, '0. Brief');
  check('task folder: 0. Brief/ has the BA material', fs.existsSync(brief) && fs.readdirSync(brief).length > 0, 'put brief.txt (BA verbatim) + screenshots in 0. Brief/');
  const names = fs.readdirSync(tf);
  check(`task folder: notes file "1. ${ID}.txt"`, names.includes(`1. ${ID}.txt`), `node quest/notes.js --folder "<folder>" --qa ${ID} ... --reset`);
  const broken = names.filter(n => /^1\. \d \d{3}\.txt$/.test(n));
  check('task folder: no digit-mangled notes file', !broken.length, `rename ${broken.join(', ')} → 1. ${ID}.txt`);
}

// ---- report ----
const fails = results.filter(r => !r.pass);
if (process.argv.includes('--json')) console.log(JSON.stringify({ id: ID, pass: !fails.length, results }, null, 1));
else {
  for (const r of results) console.log((r.pass ? 'PASS  ' : 'FAIL  ') + r.name + (r.pass ? '' : '  →  ' + r.fix));
  console.log(`\nadhoc-save-audit ${ID}: ${results.length - fails.length}/${results.length} PASS` + (fails.length ? ' — fix every FAIL, then re-run' : ' — save-set green'));
}
try {
  const logDir = path.join(ROOT, 'system', 'telemetry');
  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(path.join(logDir, 'adhoc-save-audit.jsonl'), JSON.stringify({ ts: new Date().toISOString(), id: ID, outcome: fails.length ? 'fail' : 'pass', fails: fails.map(f => f.name), dur_ms: Date.now() - t0 }) + '\n');
} catch (_) { /* logging never breaks the audit */ }
process.exit(fails.length ? 1 : 0);
