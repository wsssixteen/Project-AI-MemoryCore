#!/usr/bin/env node
/**
 * quest/requirement-index.js — the index of a state's Redmine Requirement tickets (born 2026-10-27).
 *
 * symptom: 2026-10-27 miya: "search through Redmine for Melaka Requirements ... creating an index of it.
 *          So that we can use in our Quest step during Phase 0 ... to confirm whether certain requests
 *          from TSO aligns with the original requirement of a skrin/feature/function."
 * goal (2026-10-28 miya, corrected): it is an INDEX, never a full load. It narrows a ticket to the
 *       probable Requirement(s) fast; then that requirement itself is opened and the TSO ask is checked
 *       against it (by then we know exactly what to search for). It also answers "what is the
 *       requirement for X" at once, instead of a long search with no idea where to look. A "Semua Urusan"
 *       hit is a right pointer: it says read the shared spec, then each urusan's own requirement.
 * goal_signal: the Phase 0 hand-back carries a `REQUIREMENT-MATCH:` line naming the requirement that was
 *       opened and compared; the right requirement sits in the top 3 (blind key: 151 of 174 on 2026-10-28).
 * retention: regenerate (both index files are rebuilt from Redmine; nothing is hand-edited) ·
 *            keep (quest/requirement-index.log.jsonl, git-ignored, local: one small row per call, the usage + self-audit record).
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
// The urusan code a subject names: the first capital code that is not a role or office word
// ("PPTPB > ...", "[SPOC] PLPS - ...", "PT - ..."). Used for a bonus, never a filter.
const NOT_URUSAN = new Set(['spoc', 'awam', 'apps', 'ptg', 'ptd', 'pdt', 'mmkn', 'fat', 'uat', 'pat', 'prod', 'mlkuat', 'internal', 'issue', 'id', 'tugasan', 'template', 'flow', 'integrasi', 'es', 'esokongan',
  'staging', 'stg', 'stg1', 'stg2', 'mlit', 'mcot', 'sit', 'plp']);
// A "Semua Urusan" ask has no one urusan: a capital code in it is a role ("peranan PT"), not the urusan (264006).
function urusanOf(subject) {
  if (/semua\s+urusan/i.test(String(subject || ''))) return null;
  const codes = (String(subject || '').match(/\b[A-Z][A-Z0-9]{1,6}\b/g) || []).map(s => s.toLowerCase());
  return codes.find(c => !NOT_URUSAN.has(c)) || null;
}

function prepare(rows) {
  const df = new Map();
  let subjTotal = 0;
  const docs = rows.map(r => {
    const subj = new Set(tokenize(r.subject));
    const body = new Set(tokenize(r.snippet + ' ' + r.module));
    const codes = codesOf(r.subject);
    // A "Semua Urusan" requirement specifies every urusan, so it earns any urusan's bonus.
    const allUrusan = /semua\s+urusan/i.test(r.subject);
    subjTotal += subj.size;
    for (const w of new Set([...subj, ...body])) df.set(w, (df.get(w) || 0) + 1);
    return { r, subj, body, codes, allUrusan };
  });
  const n = rows.length || 1;
  const idf = w => Math.log(1 + n / (df.get(w) || 0.5));
  return { docs, idf, avgSubj: subjTotal / n || 1 };
}

// A ticket read from its Task folder has no module: the urusan's own requirements tell it ("PT" lives in Pelupusan, 257569).
function moduleOf(prep, urusan) {
  if (!urusan) return '';
  const n = new Map();
  for (const d of prep.docs) if (d.r.module && d.codes.has(urusan)) n.set(d.r.module, (n.get(d.r.module) || 0) + 1);
  let best = '', top = 0;
  for (const [m, c] of n) if (c > top) { best = m; top = c; }
  return best;
}

// query = a string (searched as a subject) or { subject, body }. The subject carries the meaning;
// the body only breaks ties, so a long journal cannot outvote it.
// Each hit carries `match`: strong · possible · none, from how much of the query subject it covers and its score.
function search(rows, query, opts) {
  const o = opts || {};
  const prep = o.prep || prepare(rows);
  const q = typeof query === 'string' ? { subject: query, body: '' } : (query || {});
  const qSubj = [...new Set(tokenize(q.subject))];
  const qHint = [...new Set(tokenize(q.hint))].filter(w => !qSubj.includes(w));
  const qBody = [...new Set(tokenize(q.body))].filter(w => !qSubj.includes(w) && !qHint.includes(w));
  const urusan = urusanOf(q.subject);
  const qAll = /semua\s+urusan/i.test(String(q.subject || ''));
  const wanted = String(o.module || moduleOf(prep, urusan)).toLowerCase();
  // A guessed module counts less than a read one: the spec can sit in another module (265109: a PLPS fee lives in Sokongan).
  const modBonus = o.module ? 1.3 : 1.1;
  const exclude = new Set((o.exclude || []).map(Number));
  if (!qSubj.length && !qBody.length && !qHint.length) return [];
  const qTotal = qSubj.reduce((s, w) => s + prep.idf(w), 0) || 1;
  const out = [];
  for (const d of prep.docs) {
    if (exclude.has(d.r.id)) continue;
    // A long subject collects words by chance: weigh a subject hit down by its length (BM25-style).
    const lenNorm = 0.5 + 0.5 * (d.subj.size / prep.avgSubj);
    let score = 0, covered = 0;
    const hits = [];
    for (const w of qSubj) {
      if (d.subj.has(w)) { score += 3 * prep.idf(w) / lenNorm; covered += prep.idf(w); hits.push(w); }
      else if (d.body.has(w)) { score += prep.idf(w); covered += 0.3 * prep.idf(w); hits.push(w); }
    }
    // The tugasan / menu line of the description names the screen: nearly as strong as the subject, not counted in cover.
    for (const w of qHint) {
      if (d.subj.has(w)) { score += 2 * prep.idf(w) / lenNorm; hits.push(w); }
      else if (d.body.has(w)) { score += 0.5 * prep.idf(w); hits.push(w); }
    }
    for (const w of qBody) {
      if (d.subj.has(w)) { score += 0.6 * prep.idf(w) / lenNorm; hits.push(w); }
      else if (d.body.has(w)) { score += 0.2 * prep.idf(w); hits.push(w); }
    }
    if (!score) continue;
    if ((urusan && (d.codes.has(urusan) || d.allUrusan)) || (qAll && d.allUrusan)) score *= 1.5;
    if (wanted && d.r.module.toLowerCase() === wanted) score *= modBonus;
    // A cancelled requirement is history, not the spec.
    if (/cancel|not applicable/i.test(d.r.status)) score *= 0.5;
    const cover = covered / qTotal;
    // Cut points from the 2026-10-27 blind test (30 tickets): every right top-1 scored >= 29; cover alone did not separate right from none.
    // Strong also needs score >= 30: a short generic subject ("klik hantar papar ralat") covers itself cheaply.
    const match = score < 20 || cover < 0.15 ? 'none' : cover >= 0.4 && score >= 30 ? 'strong' : 'possible';
    out.push({ row: d.r, score: Math.round(score * 10) / 10, cover: Math.round(cover * 100) / 100, match, hits });
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
    // Slim on purpose (id · subject · status · parent id): the eye-list, not the data. Author and dates live in the JSONL.
    L.push('| # | Subject | Status | Parent |');
    L.push('|---|---|---|---|');
    for (const r of list) {
      const p = r.parent ? `${r.parent}${byId.has(r.parent) ? '' : ' (not a requirement)'}` : '';
      L.push(`| ${r.id} | ${cell(r.subject)} | ${cell(r.status)} | ${p} |`);
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

// Load. A missing index is built now (nothing to answer from); a stale one is answered from as it is
// while a detached `--build` refreshes it, so Phase 0 never waits on ~21 Redmine calls.
async function ensure(stateKey, { refresh = true } = {}) {
  let idx = load(stateKey);
  if (!refresh || !REQ_PROJECTS[stateKey]) return idx;
  if (idx.missing) {
    try { await build(stateKey); idx = load(stateKey); idx.rebuilt = true; }
    catch (e) { idx.rebuildError = e.message; }
  } else if (idx.ageDays > STALE_DAYS) {
    try {
      require('child_process').spawn(process.execPath, [__filename, '--build', '--state', stateKey], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
      idx.refreshing = true;
    } catch (e) { idx.rebuildError = e.message; }
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
    const subject = (text.match(/^Subject:\s*(.+)$/m) || [])[1]
      || path.basename(folder).replace(/^\d+\.\s*/, '').replace(/^[A-Z]{2,4}\s*#?\d{5,7}\s*-\s*/, '');
    // redmine-sync's header: a date line, "Ticket issue description:", then Env/Ticket/Subject/Author lines
    // (older syncs have no Author line). None of it is the ticket's own words.
    const lines = text.split(/\r?\n/);
    let i = 0;
    while (i < lines.length && i < 12 && (/^\s*$/.test(lines[i]) || /^\d{4}-\d{2}-\d{2}\s*$/.test(lines[i])
      || /^Ticket issue description:/i.test(lines[i]) || /^(Env|Ticket|Subject|Author|Tracker|Status|Priority):/i.test(lines[i]))) i++;
    const body = lines.slice(i).join('\n').trim();
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

// The BA template names the screen on its own line ("Penyediaan Risalat MMKN - PDT", "Tugasan : ...", "Tugasan Semasa: ...")
// or as a menu path ("Menu Pelupusan > Kemaskini Ulasan Jabatan Teknikal / JPPH"); only the first lines are read.
function screenHint(description) {
  const lines = String(description || '').replace(/&gt;/g, '>').split(/\r?\n/).map(l => l.replace(/^[*\s]+|[*\s]+$/g, '')).filter(Boolean).slice(0, 14);
  const tugasan = [], menu = [], involved = [];
  // "Tugasan involved / terlibat" heads a numbered list of the screens the issue is on (271049).
  const head = lines.findIndex(l => /^tugasan\s+(yang\s+)?(involved|terlibat)\b/i.test(l));
  if (head >= 0) for (const l of lines.slice(head + 1)) { const m = l.match(/^\d+[.)]\s*(.+)$/); if (!m) break; involved.push(m[1]); }
  if (involved.length) return involved.join(' ');
  for (const l of lines) {
    const t = l.replace(/^tugasan(\s+semasa)?\s*:\s*/i, '');
    if (t.length <= 90 && /^(penyediaan|semakan|pengesahan|kemasukan|kemaskini|cetakan|penerimaan|arahan|pendaftaran|pengeluaran)\b/i.test(t)) tugasan.push(t);
    const m = l.match(/\bmenu\s+(.{3,120})/i);
    if (m) menu.push(m[1]);
  }
  // Three or more tugasan lines are a list of flow steps (265109), not the screen the ticket is on.
  return [...(tugasan.length <= 2 ? tugasan : []), ...menu].join(' ');
}

// An alter / patch / cancel ask moves data or a flow; no requirement specified it.
function requestKind(subject) {
  const s = String(subject || '');
  if (/\balter\b/i.test(s)) return 'alter';
  if (/\bpatch\b/i.test(s)) return 'patch';
  if (/\bbatal(kan)?\s+id\b|tamat\s*\/\s*batal/i.test(s)) return 'cancel';
  return null;
}

function fmtHit(h, n, stateKey) {
  const r = h.row;
  return `  ${n}. #${r.id} ${r.status} · ${r.module || '(no module)'} · "${r.subject}" · by ${r.author} [${roleTag(r.author, stateKey)}] · ${h.match || 'match'} ${h.score} · ${REDMINE_BASE}/issues/${r.id}`;
}

function idxLine(idx) {
  const age = idx.missing ? 'missing' : `built ${String(idx.built).slice(0, 10)}${idx.rebuilt ? ' (rebuilt now)' : idx.refreshing ? ' (older than a week, refreshing in the background)' : ''}`;
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
  const self = byId.has(Number(ticket));
  let issue = self ? { ...byId.get(Number(ticket)), description: byId.get(Number(ticket)).snippet, source: 'index' } : localTicket(ticket);
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
  const query = { subject: issue.subject, hint: screenHint(issue.description), body: String(issue.description || '').slice(0, 600) };
  const hits = search(idx.rows, query, { module, top, exclude: [issue.id, ...chain.map(r => r.id)] });
  const kind = requestKind(issue.subject);
  Object.assign(log, { mode: 'ticket', ticket: Number(ticket), source: issue.source, outcome: kind ? 'request' : self ? 'self' : hits.length || chain.length ? 'hits' : 'none', top: chain[0] ? chain[0].id : hits[0] ? hits[0].row.id : null, rebuilt: !!idx.rebuilt });
  if (json) { console.log(JSON.stringify({ ticket: issue.id, subject: issue.subject, module, kind, self, parents: chain, hits }, null, 1)); return 0; }
  console.log(`REQUIREMENT-MATCH #${issue.id} (${module || 'module not read'}) "${issue.subject}" [read from ${issue.source}] — ${idxLine(idx)}`);
  if (kind) {
    console.log(`  ⓘ this is a ${kind} request (moves data or a flow, not a feature change): write REQUIREMENT-MATCH: not needed — ${kind} request.`);
    return 0;
  }
  if (self) console.log(`  ⓘ this ticket is itself Requirement #${issue.id}: it is the original spec. Compare it with its parent and the rows below only for overlap.`);
  chain.forEach(r => console.log(`  parent: #${r.id} ${r.status} · "${r.subject}" · by ${r.author} [${roleTag(r.author, stateKey)}] · ${REDMINE_BASE}/issues/${r.id}`));
  hits.forEach((h, n) => console.log(fmtHit(h, n + 1, stateKey)));
  if (!hits.length && !chain.length) console.log('  no match — say "no original requirement found" in the hand-back, then try --find with the screen or tab name');
  else if (!chain.length && !self && hits[0].match === 'none') console.log('  ⚠ top match is weak on the subject — likely no requirement for this exact ask; say "none found" unless a row above clearly fits, or try --find with the screen or tab name');
  console.log('  Next: open the closest match (node quest/redmine-sync.js <id> or the link) and compare its ask with this ticket\'s; write the verdict as REQUIREMENT-MATCH: aligned | extends | contradicts | none found | not needed.');
  return 0;
}

module.exports = { requestKind, screenHint, tokenize, codesOf, rowFromIssue, prepare, search, renderMd, load, localTicket, REQ_PROJECTS, REQ_TRACKERS, DATA_FILE, MD_FILE };

if (require.main === module) {
  const log = { mode: process.argv.slice(2).find(a => /^--(build|status|find|ticket)$/.test(a)) || 'usage' };
  const t0 = Date.now();
  const done = (code, err) => { log.mode = String(log.mode).replace(/^--/, ''); logRow({ ...log, exit: code, err: err || undefined, dur_ms: Date.now() - t0 }); process.exit(code); };
  main(process.argv.slice(2), log).then(code => done(code), e => { console.error('requirement-index: ' + e.message); done(2, e.message); });
}
