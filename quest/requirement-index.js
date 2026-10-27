#!/usr/bin/env node
/**
 * quest/requirement-index.js — the index of a state's Redmine Requirement tickets (born 2026-10-27).
 *
 * symptom: 2026-10-27 miya: "search through Redmine for Melaka Requirements ... creating an index of it.
 *          So that we can use in our Quest step during Phase 0 ... to confirm whether certain requests
 *          from TSO aligns with the original requirement of a skrin/feature/function."
 * goal: at Phase 0 every ticket names the Requirement ticket(s) that first specified its screen or
 *       feature, so a TSO ask is checked against the original requirement before it is built.
 * goal_signal: the Phase 0 hand-back carries a `REQUIREMENT-MATCH:` line for the ticket.
 * retention: regenerate (both index files are rebuilt from Redmine; nothing is hand-edited) ·
 *            keep (quest/requirement-index.log.jsonl: one small row per call, the usage + self-audit record).
 * footprint: on demand; a rebuild is ~21 Redmine list calls, run at most once a week by itself.
 * self_audit: --build reads both files back and checks the row count against Redmine's total_count
 *             (exit 1 on a mismatch); every call logs {ts, mode, ticket, outcome, top, dur_ms}.
 * state-scoped: yes; REQ_PROJECTS maps a state to its Redmine project. Index files live in
 *               lib/states.js knowledgeDir(<state>): REQUIREMENT-INDEX.jsonl (the data, read by this
 *               script) + REQUIREMENT-INDEX.md (the same list for miya, grouped by module).
 *
 * Listing and index only: the Description is kept as a short snippet for matching. The full
 * requirement is read on the ticket itself (node quest/redmine-sync.js <id>, or the link).
 *
 * CLI:
 *   node quest/requirement-index.js --ticket <num> [--state <key>]   Phase 0: requirements that match a ticket
 *   node quest/requirement-index.js --find "<words>" [--module <m>]  search by words (screen, urusan, field)
 *   node quest/requirement-index.js --build [--state <key>]          rebuild now
 *   node quest/requirement-index.js --status [--state <key>]         row count + age
 *   add --json for machine output · --top <n> (default 8) · --no-refresh (never rebuild)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');

const REDMINE_BASE = 'http://172.16.90.169/redmine';
const REDMINE_KEY  = '9565c21aa6cd9672fd3c7c2c7fec4c934c2f7c66'; // same constant as redmine-sync.js:14
// Requirement trackers: 13 "Requirements" · 28 "Requirement" (both in use, same meaning).
const REQ_TRACKERS = [13, 28];
// A state's Requirement tickets live in its parent project; Redmine includes the subprojects (MLK_01 .. MLK_17).
const REQ_PROJECTS = { melaka: 'e-tanah-melaka' };
const MODULE_CF = 17;
const STALE_DAYS = 7;
const SNIPPET = 400;
const DATA_FILE = 'REQUIREMENT-INDEX.jsonl';
const MD_FILE = 'REQUIREMENT-INDEX.md';

// Words that carry no screen or feature meaning. Everything else is weighted by how rare it is (idf).
const STOP = new Set(('dan yang di ke pada untuk dalam dengan tidak boleh ini itu bagi oleh dari daripada atau adalah ' +
  'akan telah sudah perlu sila mohon kami saya anda juga lagi ada semua setiap selepas sebelum semasa jika apabila ' +
  'seperti iaitu tersebut tiada bila mana nya kepada antara hendaklah sahaja tetapi namun ' +
  'the to of a an in is are and or for on at by be it this that with as from not no yes').split(/\s+/));

function statesLib() { try { return require('../lib/states.js'); } catch (_) { return null; } }
function roleLib() { try { return require('../lib/redmine-role.js'); } catch (_) { return null; } }

function tokenize(text) {
  return String(text == null ? '' : text).toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter(w => w.length >= 2 && !STOP.has(w) && !/^\d{1,3}$/.test(w));
}
// Urusan and screen codes are written in capitals in a subject ("PRBB", "PLTP", "SKM"): weight them up.
function codesOf(text) {
  return new Set((String(text || '').match(/\b[A-Z][A-Z0-9]{1,6}\b/g) || []).map(s => s.toLowerCase()));
}

function rowFromIssue(i) {
  const mod = (i.custom_fields || []).find(c => c.id === MODULE_CF);
  const desc = String(i.description || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
  return {
    id: i.id,
    subject: String(i.subject || '').trim(),
    module: mod && mod.value && !/^-/.test(mod.value) ? mod.value : '',
    project: i.project ? i.project.name : '',
    tracker: i.tracker ? i.tracker.name : '',
    status: i.status ? i.status.name : '',
    author: i.author ? i.author.name : '',
    assignee: i.assigned_to ? i.assigned_to.name : '',
    parent: i.parent ? i.parent.id : null,
    created: String(i.created_on || '').slice(0, 10),
    updated: String(i.updated_on || '').slice(0, 10),
    closed: i.closed_on ? String(i.closed_on).slice(0, 10) : '',
    snippet: desc.length > SNIPPET ? desc.slice(0, SNIPPET) + ' …' : desc,
  };
}

// ---- search ----
function prepare(rows) {
  const df = new Map();
  const docs = rows.map(r => {
    const subj = new Set(tokenize(r.subject));
    const body = new Set(tokenize(r.snippet + ' ' + r.module));
    const all = new Set([...subj, ...body]);
    for (const w of all) df.set(w, (df.get(w) || 0) + 1);
    return { r, subj, body };
  });
  const n = rows.length || 1;
  const idf = w => Math.log(1 + n / (df.get(w) || 0.5));
  return { docs, idf };
}

function search(rows, query, opts) {
  const o = opts || {};
  const prep = o.prep || prepare(rows);
  const qWords = [...new Set(tokenize(query))];
  const codes = codesOf(query);
  const wanted = String(o.module || '').toLowerCase();
  const exclude = new Set((o.exclude || []).map(Number));
  if (!qWords.length) return [];
  const out = [];
  for (const d of prep.docs) {
    if (exclude.has(d.r.id)) continue;
    let score = 0;
    const hits = [];
    for (const w of qWords) {
      const boost = codes.has(w) ? 2 : 1;
      if (d.subj.has(w)) { score += 3 * prep.idf(w) * boost; hits.push(w); }
      else if (d.body.has(w)) { score += prep.idf(w) * boost; hits.push(w); }
    }
    if (!score) continue;
    if (wanted && d.r.module.toLowerCase() === wanted) score *= 1.3;
    // A cancelled requirement is history, not the spec.
    if (/cancel|not applicable/i.test(d.r.status)) score *= 0.5;
    out.push({ row: d.r, score: Math.round(score * 10) / 10, hits });
  }
  out.sort((a, b) => b.score - a.score || b.row.id - a.row.id);
  return out.slice(0, o.top || 8);
}

// ---- files ----
function dirFor(stateKey) {
  const S = statesLib();
  return S ? S.knowledgeDir(stateKey) : null;
}
function load(stateKey) {
  const dir = dirFor(stateKey);
  const file = dir ? path.join(dir, DATA_FILE) : null;
  const out = { file, rows: [], built: null, ageDays: Infinity, missing: true };
  if (!file) return out;
  try {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
    const head = JSON.parse(lines[0]);
    out.built = head._built || null;
    out.rows = lines.slice(1).map(l => JSON.parse(l));
    out.missing = false;
    if (out.built) out.ageDays = (Date.now() - new Date(out.built).getTime()) / 86400000;
  } catch (_) { /* missing or unreadable = missing */ }
  return out;
}

function renderMd(rows, meta) {
  const byId = new Map(rows.map(r => [r.id, r]));
  const groups = new Map();
  for (const r of rows) {
    const k = r.module || '(no module)';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const cell = s => String(s || '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
  const L = [];
  L.push(`# REQUIREMENT-INDEX — ${meta.label} Redmine Requirement tickets`);
  L.push('');
  L.push(`SCOPE: every Requirement ticket (trackers ${REQ_TRACKERS.join(' + ')}) in the Redmine project \`${meta.project}\` and its subprojects, any status. Use it at Quest Phase 0 to find the requirement that first specified a screen, feature or function, and check a TSO or BA ask against it. Search with \`node quest/requirement-index.js --ticket <num>\` or \`--find "<words>"\`; this file is the same list for reading by eye.`);
  L.push('');
  L.push(`Refreshed: ${meta.built.slice(0, 10)} by \`node quest/requirement-index.js --build\` (rebuilds itself when older than ${STALE_DAYS} days). Generated file, do not hand-edit.`);
  L.push('');
  const counts = [...groups.entries()].sort((a, b) => b[1].length - a[1].length).map(([k, v]) => `${k} ${v.length}`);
  L.push(`Rows: ${rows.length} · ${counts.join(' · ')}`);
  L.push('');
  L.push('Parent = the ticket this requirement sits under (often the urusan or feature it belongs to).');
  for (const [k, list] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    list.sort((a, b) => (a.parent || a.id) - (b.parent || b.id) || a.id - b.id);
    L.push('');
    L.push(`## ${k} (${list.length})`);
    L.push('');
    L.push('| # | Subject | Status | Parent | Author | Created |');
    L.push('|---|---|---|---|---|---|');
    for (const r of list) {
      const p = r.parent ? (byId.has(r.parent) ? `#${r.parent} ${cell(byId.get(r.parent).subject).slice(0, 60)}` : `#${r.parent}`) : '';
      L.push(`| ${r.id} | ${cell(r.subject)} | ${cell(r.status)} | ${cell(p)} | ${cell(r.author)} | ${r.created} |`);
    }
  }
  return L.join('\n') + '\n';
}

// ---- Redmine ----
function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(REDMINE_BASE + url, { headers: { 'X-Redmine-API-Key': REDMINE_KEY }, timeout: 30000 }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} on ${url}`));
        try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout on ' + url)));
    req.on('error', reject);
  });
}

async function build(stateKey) {
  const project = REQ_PROJECTS[stateKey];
  const dir = dirFor(stateKey);
  if (!project) throw new Error(`no Requirement project registered for ${stateKey} (REQ_PROJECTS in quest/requirement-index.js)`);
  if (!dir) throw new Error(`no knowledge dir for ${stateKey}`);
  let issues = [];
  let total = null;
  for (let off = 0; ; off += 100) {
    const r = await get(`/projects/${project}/issues.json?tracker_id=${REQ_TRACKERS.join('|')}&status_id=*&sort=id&limit=100&offset=${off}`);
    issues = issues.concat(r.issues || []);
    total = r.total_count;
    if (!r.issues || !r.issues.length || issues.length >= r.total_count) break;
  }
  const seen = new Set();
  const rows = issues.filter(i => !seen.has(i.id) && seen.add(i.id)).map(rowFromIssue).sort((a, b) => a.id - b.id);
  const S = statesLib();
  const meta = { _built: new Date().toISOString(), state: stateKey, project, trackers: REQ_TRACKERS, rows: rows.length, label: (S && S.get(stateKey) && S.get(stateKey).label) || stateKey };
  const dataTmp = path.join(dir, DATA_FILE + '.tmp');
  fs.writeFileSync(dataTmp, [JSON.stringify(meta), ...rows.map(r => JSON.stringify(r))].join('\n') + '\n');
  fs.renameSync(dataTmp, path.join(dir, DATA_FILE));
  fs.writeFileSync(path.join(dir, MD_FILE), renderMd(rows, { ...meta, built: meta._built }));
  // Self-audit: read both files back; the row count must equal what Redmine said it holds.
  const back = load(stateKey);
  const mdRows = (fs.readFileSync(path.join(dir, MD_FILE), 'utf8').match(/^\| \d+ \|/gm) || []).length;
  const audit = back.rows.length === total && mdRows === total ? 'PASS' : `FAIL: Redmine ${total} · jsonl ${back.rows.length} · md ${mdRows}`;
  return { rows, meta, total, audit };
}

// Load; rebuild when missing or older than STALE_DAYS. A failed rebuild keeps the old index and says so.
async function ensure(stateKey, { refresh = true } = {}) {
  let idx = load(stateKey);
  if (refresh && (idx.missing || idx.ageDays > STALE_DAYS) && REQ_PROJECTS[stateKey]) {
    try { await build(stateKey); idx = load(stateKey); idx.rebuilt = true; }
    catch (e) { idx.rebuildError = e.message; }
  }
  return idx;
}

// The ticket's own Task folder is read first: Redmine's single-issue read takes ~90 s on this server,
// and Phase 0 has always synced the folder already. Same lookup order as ticket-load-verify.js.
const REPO_ROOT = path.resolve(__dirname, '..');
const ACTIVE_TXT = process.env.REQ_ACTIVE_FILE
  || path.join(REPO_ROOT.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/i, ''), 'quest', 'active.txt');

function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch (_) { return false; } }
function folderOf(num) {
  try {
    let mine = false;
    for (const line of fs.readFileSync(ACTIVE_TXT, 'utf8').split(/\r?\n/)) {
      const head = line.match(/^qa=(\S+)/);
      if (head) { mine = head[1] === `QA-${num}` || head[1] === String(num); continue; }
      const tf = mine && line.match(/^task_folder=(.+?)\s*$/);
      if (tf && isDir(tf[1])) return tf[1];
    }
  } catch (_) { /* no active.txt */ }
  const S = statesLib();
  const rx = new RegExp(`(^|[^0-9])${num}([^0-9]|$)`);
  for (const s of S ? Object.values(S.all()) : []) {
    const root = S.taskFolder(s.key);
    for (const dir of [root, root && path.join(root, 'Archive')]) {
      if (!dir || !isDir(dir)) continue;
      const hit = fs.readdirSync(dir).find(n => rx.test(n) && isDir(path.join(dir, n)));
      if (hit) return path.join(dir, hit);
    }
  }
  return null;
}
function localTicket(num) {
  const folder = folderOf(num);
  if (!folder) return null;
  for (const b of ['1. Brief', '0. Brief']) {
    let text;
    try { text = fs.readFileSync(path.join(folder, b, 'Description.txt'), 'utf8'); } catch (_) { continue; }
    const subject = (text.match(/^Subject:\s*(.+)$/m) || [])[1] || path.basename(folder).replace(/^\d+\.\s*/, '');
    const body = text.replace(/^[\s\S]*?^Author:.*$/m, '').trim();
    return { id: Number(num), subject: subject.trim(), description: body, module: '', parent: null, source: 'Task folder' };
  }
  return null;
}

const LOG_FILE = path.join(__dirname, 'requirement-index.log.jsonl');
function logRow(row) {
  if (process.env.REQ_NO_LOG) return;
  try { fs.appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch (_) { /* a log failure never fails the call */ }
}

function roleTag(name, stateKey) {
  const R = roleLib();
  if (!R || !name) return 'role unknown';
  try { return R.tag(R.roleOf(name, { state: stateKey })); } catch (_) { return 'role unknown'; }
}

function fmtHit(h, n, stateKey) {
  const r = h.row;
  return `  ${n}. #${r.id} ${r.status} · ${r.module || '(no module)'} · "${r.subject}" · by ${r.author} [${roleTag(r.author, stateKey)}] · score ${h.score} · ${REDMINE_BASE}/issues/${r.id}`;
}

function idxLine(idx) {
  const age = idx.missing ? 'missing' : `built ${String(idx.built).slice(0, 10)}${idx.rebuilt ? ' (rebuilt now)' : ''}`;
  return `index ${idx.rows.length} rows, ${age}${idx.rebuildError ? ` ⚠ rebuild failed: ${idx.rebuildError} (using the old index)` : ''}`;
}

// ---- CLI ----
async function main(argv, log) {
  const flag = n => { const i = argv.indexOf('--' + n); return i >= 0 ? (argv[i + 1] || '') : null; };
  const has = n => argv.includes('--' + n);
  let stateKey = flag('state') || 'melaka';
  const S = statesLib();
  if (S && S.get(stateKey)) stateKey = S.get(stateKey).key;
  const json = has('json');
  const top = Number(flag('top')) || 8;
  const refresh = !has('no-refresh');

  if (!REQ_PROJECTS[stateKey]) {
    console.log(`REQUIREMENT-MATCH: n/a — no Requirement project registered for ${stateKey}. Add it to REQ_PROJECTS in quest/requirement-index.js.`);
    return 0;
  }
  if (has('build')) {
    const { rows, audit } = await build(stateKey);
    console.log(`requirement-index: ${rows.length} rows written to ${path.join(dirFor(stateKey), DATA_FILE)} + ${MD_FILE} · self-audit ${audit}`);
    log.outcome = audit; log.rows = rows.length;
    return audit === 'PASS' ? 0 : 1;
  }
  if (has('status')) {
    const idx = load(stateKey);
    console.log(`requirement-index ${stateKey}: ${idxLine(idx)}${idx.ageDays > STALE_DAYS ? ' · stale, rebuilds on the next search' : ''}`);
    return idx.missing ? 1 : 0;
  }
  const findQ = flag('find');
  const ticket = flag('ticket');
  if (findQ == null && !ticket) {
    console.log('usage: node quest/requirement-index.js --ticket <num> | --find "<words>" [--module <m>] | --build | --status  [--state <key>] [--json] [--top <n>] [--no-refresh]');
    return 2;
  }
  const idx = await ensure(stateKey, { refresh });
  if (idx.missing) { console.log(`REQUIREMENT-MATCH: unavailable — ${idxLine(idx)}. Run: node quest/requirement-index.js --build`); return 1; }

  if (findQ != null) {
    const hits = search(idx.rows, findQ, { module: flag('module'), top });
    Object.assign(log, { mode: 'find', query: findQ, outcome: hits.length ? 'hits' : 'none', top: hits[0] ? hits[0].row.id : null });
    if (json) { console.log(JSON.stringify({ query: findQ, hits }, null, 1)); return 0; }
    console.log(`REQUIREMENT-FIND "${findQ}" — ${idxLine(idx)}`);
    hits.forEach((h, n) => console.log(fmtHit(h, n + 1, stateKey)));
    if (!hits.length) console.log('  no match — try the urusan code, the tab name or the screen title');
    return 0;
  }

  // --ticket: the ticket's own subject + description are the query; its parent chain is listed first.
  const byId = new Map(idx.rows.map(r => [r.id, r]));
  let issue = byId.has(Number(ticket)) ? { ...byId.get(Number(ticket)), description: byId.get(Number(ticket)).snippet, source: 'index' } : localTicket(ticket);
  if (!issue) {
    try {
      const i = (await get(`/issues/${encodeURIComponent(ticket)}.json`)).issue;
      const m = (i.custom_fields || []).find(c => c.id === MODULE_CF);
      issue = { id: i.id, subject: i.subject, description: i.description, module: m && m.value && !/^-/.test(m.value) ? m.value : '', parent: i.parent ? i.parent.id : null, source: 'Redmine' };
    } catch (e) { console.log(`REQUIREMENT-MATCH #${ticket}: unavailable — no Task folder and the Redmine read failed (${e.message}). Run node quest/redmine-sync.js ${ticket} first, or search by hand: node quest/requirement-index.js --find "<screen or urusan words>"`); return 1; }
  }
  const module = issue.module || '';
  const chain = [];
  for (let p = issue.parent, guard = 0; p && guard < 6; guard++) {
    const r = byId.get(p);
    if (!r) break;
    chain.push(r);
    p = r.parent;
  }
  const query = `${issue.subject}\n${String(issue.description || '').slice(0, 600)}`;
  const hits = search(idx.rows, query, { module, top, exclude: [issue.id, ...chain.map(r => r.id)] });
  Object.assign(log, { mode: 'ticket', ticket: Number(ticket), source: issue.source, outcome: hits.length || chain.length ? 'hits' : 'none', top: chain[0] ? chain[0].id : hits[0] ? hits[0].row.id : null, rebuilt: !!idx.rebuilt });
  if (json) { console.log(JSON.stringify({ ticket: issue.id, subject: issue.subject, module, parents: chain, hits }, null, 1)); return 0; }
  console.log(`REQUIREMENT-MATCH #${issue.id} (${module || 'module not read'}) "${issue.subject}" [read from ${issue.source}] — ${idxLine(idx)}`);
  chain.forEach(r => console.log(`  parent: #${r.id} ${r.status} · "${r.subject}" · by ${r.author} [${roleTag(r.author, stateKey)}] · ${REDMINE_BASE}/issues/${r.id}`));
  hits.forEach((h, n) => console.log(fmtHit(h, n + 1, stateKey)));
  if (!hits.length && !chain.length) console.log('  no match — say "no original requirement found" in the hand-back, then try --find with the screen or tab name');
  console.log('  Next: open the closest match (node quest/redmine-sync.js <id> or the link) and compare its ask with this ticket\'s; write the verdict as REQUIREMENT-MATCH: aligned | extends | contradicts | none found.');
  return 0;
}

module.exports = { tokenize, codesOf, rowFromIssue, prepare, search, renderMd, load, localTicket, REQ_PROJECTS, REQ_TRACKERS, DATA_FILE, MD_FILE };

if (require.main === module) {
  const log = { mode: process.argv.slice(2).find(a => /^--(build|status|find|ticket)$/.test(a)) || 'usage' };
  const t0 = Date.now();
  const done = (code, err) => { log.mode = String(log.mode).replace(/^--/, ''); logRow({ ...log, exit: code, err: err || undefined, dur_ms: Date.now() - t0 }); process.exit(code); };
  main(process.argv.slice(2), log).then(code => done(code), e => { console.error('requirement-index: ' + e.message); done(2, e.message); });
}
