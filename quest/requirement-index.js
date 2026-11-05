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
 * requirement is read with --read: description, journals and the text of every spec attachment
 * (.docx/.pdf/.xlsx). A verdict is written only from that text, with the deciding rule quoted
 * (2026-11-03 miya, 287811: "Always read, this was supposed to be part of our steps" — 223236 was
 * matched by subject only and its spec, which forbids the 258004 delete, was never opened).
 *
 * 2026-11-05 (per miya, ADHOC-PPTPB-2026-9, Fable 5.1 items 1-5): --load (five tiers: T2 called-flow kods >
 * T5 value words > T3 integration > T4 cross-module > T1 urusan tree) · a `kods` field per row from the FULL
 * description (capital codes + the "Tugasan Terlibat" names), a kod hit weighs like a subject hit · a 1-2 rare
 * code query that hits is never labelled `none` · query-side synonyms (PTG≈PD, PDT≈PT, endosan≈endorsan ...)
 * in --find and --load T5 · --read --section (attachment text cut to the matching lines ±30) and lane lines
 * for a "Proses To-Be" BPMN PDF page. Why: requirement 248531 held the PPTPB endosan office rule and was
 * never ranked (it says "PD / PT", the snippet held no SPIL kod for most rows, `--find SPIL` said `none`).
 *
 * CLI:
 *   node quest/requirement-index.js --read <req> --for <ticket> [--section "<words>"]   read the requirement in full (prints REQUIREMENT-READ #<req>);
 *                                                                    --section cuts .docx/.pdf text to the lines that hold a word (or its synonym), ±30 lines;
 *                                                                    the rarest words lead; a common one (PTG in a BRS) is ignored and named
 *   node quest/requirement-index.js --ticket <num> [--state <key>]   Phase 0: requirements that match a ticket
 *   node quest/requirement-index.js --find "<words>" [--module <m>]  search by words (screen, urusan, field), synonyms expanded
 *   node quest/requirement-index.js --load --urusan <code> [--tugasan <kod[,kod]>] [--called <bpmn model key>] [--words "<value words>"]
 *                                      [--cap N=3] [--cheap] [--tree] [--for <ticket>]
 *                                                                    the requirements a ticket's urusan / tugasan / called flow load (REQUIREMENT-LOAD block)
 *   node quest/requirement-index.js --build [--state <key>]          rebuild now
 *   node quest/requirement-index.js --status [--state <key>]         row count + age
 *   add --json for machine output · --top <n> (default 8) · --no-refresh (never rebuild)
 *   env REQ_INDEX_DIR=<dir> reads and writes the index files there instead of the state's knowledge dir (eval sandboxes).
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

// The codes a requirement names anywhere in its FULL description (a tugasan kod like SPIL sits past the
// 400-char snippet), plus the tugasan names listed under "Tugasan Terlibat". Kept per row as `kods`.
const KOD_RX = /\b[A-Z][A-Z0-9]{1,7}\b/g;
const KODS_MAX = 80;
function kodsOf(description) {
  const raw = String(description || '').replace(/\r/g, '');
  const out = new Set(raw.replace(/<[^>]+>/g, ' ').match(KOD_RX) || []);
  const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/^[\s*#•-]+|[\s*]+$/g, '').replace(/^\d+[.)]\s*/, '').trim();
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/tugasan\s+terlibat\s*:?(.*)$/i);
    if (!m) continue;
    const rest = clean(m[1].replace(/^\s*[*:]+/, ''));
    if (rest) { rest.split(/[,;]/).map(clean).filter(Boolean).forEach(n => out.add(n)); continue; }
    // A list under the heading: one name per line, ends at a blank line, a "label:" line or a sentence.
    for (const l of lines.slice(i + 1, i + 16)) {
      const n = clean(l);
      if (!n || n.length > 80 || /:/.test(n)) break;
      out.add(n);
    }
  }
  return [...out].slice(0, KODS_MAX);
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
    kods: kodsOf(i.description),
  };
}

// ---- synonyms (query side only; the index text is never rewritten) ----
// One group = words BA and code use for the same thing (248531 says "PD / PT", the code says PTG / PDT).
const SYNONYMS = [
  ['ptg', 'pd', 'pejabat daftar', 'kp_ptg'],
  ['pdt', 'pt', 'pejabat tanah', 'daerah', 'ptd'],
  ['endosan', 'endorsan', 'endos'],
  ['nota mohon', 'spi'],
  ['nota lulus', 'spil'],
  ['keputusan pendaftar', 'kp'],
  ['hakmilik campur', 'bercampur', 'berlainan pejabat'],
];
const norm = s => ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
// The groups a text touches: { member it holds, alts = the other members }. Pure.
function expandSynonyms(text) {
  const t = norm(text);
  const groups = [];
  for (const g of SYNONYMS) {
    const member = g.find(m => t.includes(norm(m)));
    if (member) groups.push({ member, alts: g.filter(m => m !== member) });
  }
  return { groups, words: groups.flatMap(g => g.alts) };
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
    // The kods of the full description (built since 2026-11-05; an older index has none).
    const kods = new Set(tokenize((r.kods || []).join(' ')));
    // A "Semua Urusan" requirement specifies every urusan, so it earns any urusan's bonus.
    const allUrusan = /semua\s+urusan/i.test(r.subject);
    subjTotal += subj.size;
    for (const w of new Set([...subj, ...body, ...kods])) df.set(w, (df.get(w) || 0) + 1);
    return { r, subj, body, codes, kods, allUrusan };
  });
  const n = rows.length || 1;
  const idf = w => Math.log(1 + n / (df.get(w) || 0.5));
  return { docs, idf, df: w => df.get(w) || 0, n, avgSubj: subjTotal / n || 1 };
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
// opts: module · top · exclude · prep · synonyms (expand the subject with SYNONYMS, as hint words) · noUrusan (no urusan or guessed-module bonus).
function search(rows, query, opts) {
  const o = opts || {};
  const prep = o.prep || prepare(rows);
  const q = typeof query === 'string' ? { subject: query, body: '' } : (query || {});
  const qSubj = [...new Set(tokenize(q.subject))];
  const syn = o.synonyms ? expandSynonyms(q.subject).groups.map(g => ({ from: tokenize(g.member).filter(w => qSubj.includes(w)), alts: [...new Set(tokenize(g.alts.join(' ')))].filter(w => !qSubj.includes(w)) })) : [];
  const qHint = [...new Set([...tokenize(q.hint), ...syn.flatMap(g => g.alts)])].filter(w => !qSubj.includes(w));
  const qBody = [...new Set(tokenize(q.body))].filter(w => !qSubj.includes(w) && !qHint.includes(w));
  const urusan = o.noUrusan ? null : urusanOf(q.subject);
  const qAll = !o.noUrusan && /semua\s+urusan/i.test(String(q.subject || ''));
  const wanted = String(o.module || moduleOf(prep, urusan)).toLowerCase();
  // A guessed module counts less than a read one: the spec can sit in another module (265109: a PLPS fee lives in Sokongan).
  const modBonus = o.module ? 1.3 : 1.1;
  const exclude = new Set((o.exclude || []).map(Number));
  if (!qSubj.length && !qBody.length && !qHint.length) return [];
  const qTotal = qSubj.reduce((s, w) => s + prep.idf(w), 0) || 1;
  // 1-2 rare capital codes ("SPIL"): a hit on one is a pointer, never `none` (248531 was `none 7.6`).
  const qCodes = new Set((String(q.subject || '').match(KOD_RX) || []).map(s => s.toLowerCase()));
  const rareCut = Math.max(5, prep.n * 0.02);
  const codeQuery = qSubj.length > 0 && qSubj.length <= 2 && qSubj.every(w => qCodes.has(w) && prep.df(w) <= rareCut);
  const out = [];
  for (const d of prep.docs) {
    if (exclude.has(d.r.id)) continue;
    // A long subject collects words by chance: weigh a subject hit down by its length (BM25-style).
    const lenNorm = 0.5 + 0.5 * (d.subj.size / prep.avgSubj);
    // A rare kod the full description names weighs like a subject word (SPIL in 248531); a common one
    // (PTG, PT, the urusan code in hundreds of descriptions) only like a body word: measured 2026-11-05,
    // kods at full weight for every code dropped the B2 blind key from 135 to 127 of 155.
    const strong = w => d.subj.has(w) || (d.kods.has(w) && prep.df(w) <= rareCut);
    const bodyHit = w => d.body.has(w) || d.kods.has(w);
    let score = 0, covered = 0;
    const hits = [];
    for (const w of qSubj) {
      if (strong(w)) { score += 3 * prep.idf(w) / lenNorm; covered += prep.idf(w); hits.push(w); }
      else if (bodyHit(w)) { score += prep.idf(w); covered += 0.3 * prep.idf(w); hits.push(w); }
    }
    // The tugasan / menu line of the description names the screen: nearly as strong as the subject, not counted in cover.
    for (const w of qHint) {
      if (strong(w)) { score += 2 * prep.idf(w) / lenNorm; hits.push(w); }
      else if (bodyHit(w)) { score += 0.5 * prep.idf(w); hits.push(w); }
    }
    for (const w of qBody) {
      if (strong(w)) { score += 0.6 * prep.idf(w) / lenNorm; hits.push(w); }
      else if (bodyHit(w)) { score += 0.2 * prep.idf(w); hits.push(w); }
    }
    // A synonym in the subject or kods covers the query word it stands for ("PD" covers "PTG").
    for (const g of syn) if (g.from.length && !g.from.some(w => hits.includes(w)) && g.alts.some(strong)) covered += 0.7 * Math.max(...g.from.map(prep.idf));
    if (!score) continue;
    if ((urusan && (d.codes.has(urusan) || d.allUrusan)) || (qAll && d.allUrusan)) score *= 1.5;
    if (wanted && d.r.module.toLowerCase() === wanted) score *= modBonus;
    // A cancelled requirement is history, not the spec.
    if (/cancel|not applicable/i.test(d.r.status)) score *= 0.5;
    const cover = covered / qTotal;
    // Cut points from the 2026-10-27 blind test (30 tickets): every right top-1 scored >= 29; cover alone did not separate right from none.
    // Strong also needs score >= 30: a short generic subject ("klik hantar papar ralat") covers itself cheaply.
    let match = score < 20 || cover < 0.15 ? 'none' : cover >= 0.4 && score >= 30 ? 'strong' : 'possible';
    if (match === 'none' && codeQuery && qSubj.some(strong)) match = 'possible';
    out.push({ row: d.r, score: Math.round(score * 10) / 10, cover: Math.round(cover * 100) / 100, match, hits });
  }
  out.sort((a, b) => b.score - a.score || b.row.id - a.row.id);
  return out.slice(0, o.top || 8);
}

// ---- files ----
function dirFor(stateKey) {
  if (process.env.REQ_INDEX_DIR) return process.env.REQ_INDEX_DIR;
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

// ---- --load: the requirements a ticket's urusan, tugasan and called flow carry (2026-11-05, ADHOC-PPTPB-2026-9) ----
// Each urusan master sits under one parent ticket per state ("Pelupusan - Parent Ticket All Urusan").
const URUSAN_PARENT = { melaka: 215975 };
const TIER_ORDER = ['T2', 'T5', 'T3', 'T4', 'T1'];
const TIER_NAME = { T1: 'urusan tree', T2: 'called-flow kods', T3: 'integration', T4: 'cross-module', T5: 'value words' };
const TIER_CAP = 3;
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The tugasan kods of a called BPMN model: every receiveUserTask("KOD", ...) in <called>.bpmn20.xml.
function calledFlowKods(stateKey, called) {
  const S = statesLib();
  const root = S ? path.join(S.knowledgeDir(stateKey), 'flowables-bpmn') : null;
  const want = `${String(called).toLowerCase()}.bpmn20.xml`;
  const find = dir => {
    let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return null; }
    for (const e of ents) if (e.isFile() && e.name.toLowerCase() === want) return path.join(dir, e.name);
    for (const e of ents) if (e.isDirectory()) { const f = find(path.join(dir, e.name)); if (f) return f; }
    return null;
  };
  const file = root && find(root);
  if (!file) return { file: null, kods: [] };
  const xml = fs.readFileSync(file, 'utf8');
  const kods = [...new Set([...xml.matchAll(/receiveUserTask\((?:&quot;|")([A-Za-z0-9_]+)(?:&quot;|")/g)].map(m => m[1]))];
  return { file, kods };
}

// Pure: rows + { urusan, tugasan[], calledKods[], words, parentId, tree } → the tier lists and the placed block.
function loadTiers(rows, o) {
  const prep = prepare(rows);
  const byId = new Map(rows.map(r => [r.id, r]));
  const u = String(o.urusan || '').trim();
  const uLow = u.toLowerCase();
  const tug = (o.tugasan || []).map(s => String(s).trim()).filter(Boolean);
  const tiers = {};
  const notes = [];
  const lbl = h => `${h.match} ${h.score}`;
  // T1 tree: the urusan master under the state's parent ticket + its children that name the tugasan.
  const startsU = new RegExp(`^\\s*(\\[[^\\]]*\\]\\s*)?${esc(u)}\\b`, 'i');
  const master = rows.find(r => r.parent === o.parentId && startsU.test(r.subject)) || null;
  const children = master ? rows.filter(r => r.parent === master.id).sort((a, b) => a.id - b.id) : [];
  const names = r => new Set([...tokenize(r.subject), ...tokenize((r.kods || []).join(' '))]);
  const tugHit = r => tug.some(t => { const w = tokenize(t); return w.length === 1 ? names(r).has(w[0]) : w.every(x => tokenize(r.subject).includes(x)); });
  tiers.T1 = master ? [{ row: master, label: 'urusan master' }, ...children.filter(tugHit).slice(0, TIER_CAP).map(r => ({ row: r, label: 'tugasan child' }))] : [];
  if (!master) notes.push(`no urusan master for ${u} under #${o.parentId}`);
  // T2 called-flow: the tugasan kods weigh as the subject, the rest of the called flow's kods as hints.
  // T2 and T5 keep labelled hits only: a `none` row is a word collision, not a requirement to read.
  const tugKods = tug.filter(t => /^[A-Za-z][A-Za-z0-9_]{1,7}$/.test(t));
  const kods = [...new Set([...tugKods, ...(o.calledKods || [])])];
  tiers.T2 = kods.length ? search(rows, { subject: (tugKods.length ? tugKods : kods).join(' '), hint: kods.filter(k => !tugKods.includes(k)).join(' ') }, { prep, noUrusan: true, top: TIER_CAP }).filter(h => h.match !== 'none').map(h => ({ row: h.row, label: lbl(h) })) : [];
  // T3 integration: "Integrasi <urusan>" + requirements with no parent that name the urusan.
  const namesU = r => codesOf(r.subject).has(uLow) || tokenize((r.kods || []).join(' ')).includes(uLow);
  const integ = r => /integrasi/i.test(r.subject);
  const t3 = new Map(search(rows, `Integrasi ${u}`, { prep, top: 30 }).map(h => [h.row.id, { row: h.row, label: lbl(h), score: h.score }]));
  for (const r of rows) if (!r.parent && codesOf(r.subject).has(uLow) && !t3.has(r.id)) t3.set(r.id, { row: r, label: 'orphan', score: 0 });
  const rank = x => (integ(x.row) && namesU(x.row) ? 2 : 0) + (!x.row.parent && codesOf(x.row.subject).has(uLow) ? 1 : 0);
  tiers.T3 = [...t3.values()].filter(x => rank(x) > 0).sort((a, b) => rank(b) - rank(a) || b.score - a.score || b.row.id - a.row.id).slice(0, TIER_CAP);
  // T4 cross-module: "Integrasi ... <our module>" masters and their parent chain inside the index.
  const mod = moduleOf(prep, uLow);
  tiers.T4 = [];
  if (mod) {
    const rx = new RegExp(`^Integrasi .*\\b${esc(mod)}\\b`, 'i');
    const heads = rows.filter(r => rx.test(r.subject)).sort((a, b) => Number(namesU(b)) - Number(namesU(a)) || b.id - a.id);
    for (const r of heads) {
      tiers.T4.push({ row: r, label: 'cross-module' });
      for (let p = r.parent, g = 0; p && byId.has(p) && g < 3; p = byId.get(p).parent, g++) tiers.T4.push({ row: byId.get(p), label: `parent of #${r.id}` });
    }
    tiers.T4 = tiers.T4.slice(0, TIER_CAP);
  } else notes.push(`no module read for ${u}, T4 skipped`);
  // T5 value words: the words of the ask with synonyms, no urusan bonus (the rule can sit in another urusan).
  tiers.T5 = o.words ? search(rows, o.words, { prep, synonyms: true, noUrusan: true, top: TIER_CAP }).filter(h => h.match !== 'none').map(h => ({ row: h.row, label: lbl(h) })) : [];
  // Union in tier order; a row found by several tiers is listed once, with every tier named.
  const placed = [];
  const at = new Map();
  for (const t of TIER_ORDER) for (const x of tiers[t]) {
    if (at.has(x.row.id)) { at.get(x.row.id).tiers.push(t); continue; }
    const p = { tiers: [t], row: x.row, label: x.label };
    at.set(x.row.id, p); placed.push(p);
  }
  return { master, children, tiers, placed, module: mod, notes };
}

function fmtLoad(p) {
  const r = p.row;
  return `  ${p.tiers.join('+')} #${r.id} ${r.status} · ${r.module || '(no module)'} · "${r.subject}" · ${p.label}`;
}

// The reads a load names: the master by --section (its BRS is long), then the first <cap> other rows in full.
function loadNext(res, o) {
  const forT = o.for ? ` --for ${o.for}` : '';
  const sec = [...(o.tugasan || []), ...tokenize(o.words || '')].join(' ').trim();
  const cmds = [];
  if (res.master) cmds.push(`node quest/requirement-index.js --read ${res.master.id}${forT}${sec ? ` --section "${sec}"` : ''}`);
  for (const p of res.placed.filter(x => !res.master || x.row.id !== res.master.id).slice(0, o.cap)) cmds.push(`node quest/requirement-index.js --read ${p.row.id}${forT}`);
  return cmds;
}

// ---- --section: keep the lines that hold a word, ±ctx lines (2026-11-05) ----
const SECTION_CTX = 30;
function sectionFilter(text, words, ctx) {
  const c = ctx == null ? SECTION_CTX : ctx;
  // Each term is a word list that must all sit in one line; synonyms of the words count too.
  const all = [...tokenize(words).map(w => [w]), ...expandSynonyms(words).words.map(a => tokenize(a)).filter(a => a.length)];
  const lines = String(text || '').split(/\r?\n/);
  const toks = lines.map(l => new Set(tokenize(l)));
  const hitsOf = t => toks.filter(s => t.every(w => s.has(w))).length;
  // The rarest terms locate the section: the rarest term with a hit is always kept, the next ones only while
  // their hits together stay within 0.5% of the lines (min 10). 2026-11-05: on the 7,287-line PPTPB BRS,
  // PTG (141 lines), hakmilik (129) and PT (80) kept 455 match lines, i.e. the whole document.
  const budget = Math.max(10, lines.length * 0.005);
  const ranked = all.map(t => ({ t, n: hitsOf(t) })).filter(x => x.n > 0).sort((a, b) => a.n - b.n);
  const terms = [];
  let sum = 0;
  for (const x of ranked) { if (terms.length && sum + x.n > budget) continue; terms.push(x.t); sum += x.n; }
  const dropped = ranked.filter(x => !terms.includes(x.t)).map(x => x.t.join(' '));
  const keep = new Array(lines.length).fill(false);
  let matched = 0;
  lines.forEach((l, i) => {
    if (/^(LANE |LANES:|## )/.test(l)) keep[i] = true;
    const tok = toks[i];
    if (terms.some(t => t.every(w => tok.has(w)))) {
      matched++;
      for (let k = Math.max(0, i - c); k <= Math.min(lines.length - 1, i + c); k++) keep[k] = true;
    }
  });
  if (!matched) return { matched: 0, dropped, text: String(text || '') };
  const out = [];
  lines.forEach((l, i) => { if (keep[i]) out.push(l); else if (out[out.length - 1] !== '…') out.push('…'); });
  return { matched, dropped, text: out.join('\n') };
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
  if (flag('read')) return readRequirement(flag('read'), flag('for'), log, flag('section'));
  const findQ = flag('find');
  const ticket = flag('ticket');
  const loadMode = has('load');
  if (findQ == null && !ticket && !loadMode) {
    console.log('usage: node quest/requirement-index.js --read <req> --for <ticket> [--section "<words>"] | --ticket <num> | --find "<words>" [--module <m>] | --load --urusan <code> [--tugasan <kod[,kod]>] [--called <bpmn model key>] [--words "<value words>"] [--cap N] [--cheap] [--tree] | --build | --status  [--state <key>] [--json] [--top <n>] [--no-refresh]');
    return 2;
  }
  if (loadMode && !flag('urusan')) { console.log('REQUIREMENT-LOAD: --urusan <code> is required (e.g. --urusan PPTPB)'); return 2; }
  const idx = await ensure(stateKey, { refresh });
  if (idx.missing) { console.log(`REQUIREMENT-MATCH: unavailable — ${idxLine(idx)}. Run: node quest/requirement-index.js --build`); return 1; }

  if (loadMode) {
    const urusan = flag('urusan').trim();
    const tugasan = (flag('tugasan') || '').split(',').map(s => s.trim()).filter(Boolean);
    const called = flag('called');
    const cf = called ? calledFlowKods(stateKey, called) : { file: null, kods: [] };
    const cap = Number(flag('cap')) || 3;
    const words = flag('words') || '';
    const res = loadTiers(idx.rows, { urusan, tugasan, calledKods: cf.kods, words, parentId: URUSAN_PARENT[stateKey] });
    if (called && !cf.file) res.notes.push(`called flow ${called}.bpmn20.xml not found under flowables-bpmn, T2 holds the tugasan kods only`);
    const next = has('cheap') ? [] : loadNext(res, { tugasan, words, cap, for: flag('for') });
    const head = `${urusan}/${tugasan.join(',') || '-'}`;
    Object.assign(log, { mode: 'load', query: `${head} ${called || ''} ${words}`.trim(), outcome: res.placed.length ? 'hits' : 'none', top: res.placed[0] ? res.placed[0].row.id : null, rows: res.placed.length });
    if (json) {
      console.log(JSON.stringify({ urusan, tugasan, called, calledFile: cf.file, calledKods: cf.kods, words, module: res.module, remarks: res.notes, // named remarks on purpose: redmine-write-gate reads a key named after the Redmine note field as a post (2026-11-05)
        rows: res.placed.map(p => ({ tiers: p.tiers, id: p.row.id, status: p.row.status, module: p.row.module, subject: p.row.subject, label: p.label })),
        tree: has('tree') && res.master ? res.children.map(r => ({ id: r.id, status: r.status, subject: r.subject })) : undefined, next }, null, 1));
      return 0;
    }
    console.log(`REQUIREMENT-LOAD ${head}: ${res.placed.length} rows · module ${res.module || 'not read'}${called ? ` · called ${called} (${cf.kods.length} kods${cf.kods.length ? ': ' + cf.kods.join(' ') : ''})` : ''} · ${idxLine(idx)}`);
    res.placed.forEach(p => console.log(fmtLoad(p)));
    if (!res.placed.length) console.log('  none found — say "no requirement loaded" in the hand-back, then try --find with the screen or tab name');
    res.notes.forEach(n => console.log(`  ⓘ ${n}`));
    console.log(`  tiers: ${TIER_ORDER.map(t => `${t} ${TIER_NAME[t]}`).join(' > ')}`);
    if (has('tree') && res.master) {
      console.log(`  TREE #${res.master.id} "${res.master.subject}" — ${res.children.length} children:`);
      res.children.forEach(r => console.log(`    #${r.id} ${r.status} · "${r.subject}"`));
    }
    console.log(has('cheap') ? '  Next: none (--cheap); drop --cheap for the read list.' : `  Next: ${next.join(' ; ')}`);
    return 0;
  }

  if (findQ != null) {
    const hits = search(idx.rows, findQ, { module: flag('module'), top, synonyms: true });
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
  const first = chain[0] ? chain[0].id : hits[0] ? hits[0].row.id : null;
  if (first) console.log(`  Next: read it in full before any verdict: node quest/requirement-index.js --read ${first} --for ${issue.id} (a subject match is never a verdict). Then write REQUIREMENT-MATCH: ${issue.id} → #<req> "<subject>" — <aligned | extends | contradicts> — read: "<the rule that decides, quoted>", or none found / not needed.`);
  return 0;
}

// ---- --read: the requirement in full (description, journals, spec attachments) ----
function download(url, file) {
  return new Promise((resolve, reject) => {
    const go = (u, hops) => http.get(u, { headers: { 'X-Redmine-API-Key': REDMINE_KEY }, timeout: 60000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && hops < 3) { res.resume(); return go(new URL(res.headers.location, u).href, hops + 1); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      const out = fs.createWriteStream(file); res.pipe(out); out.on('finish', () => resolve(file)); out.on('error', reject);
    }).on('error', reject);
    go(url, 0);
  });
}
// docx paragraphs + tables · pdf pages · xlsx cells, through python (python-docx / PyMuPDF / openpyxl).
const EXTRACT_PY = [
  // -I ignores PYTHONIOENCODING: without this line a non-ASCII character reaches node as cp1252 (found 2026-11-05).
  'import sys', 'sys.stdout.reconfigure(encoding="utf-8", errors="replace")', 'p = sys.argv[1]; x = p.lower()',
  'if x.endswith(".docx"):',
  '    import docx; d = docx.Document(p)',
  '    for q in d.paragraphs:',
  '        if q.text.strip(): print(q.text)',
  '    for t in d.tables:',
  '        for r in t.rows: print(" | ".join(c.text.strip() for c in r.cells))',
  '    import zipfile, re',
  '    z = zipfile.ZipFile(p)',
  '    if "word/comments.xml" in z.namelist():',
  '        print("## Comments")',
  '        for m in re.finditer(r"<w:comment\\b[^>]*>(.*?)</w:comment>", z.read("word/comments.xml").decode("utf8", "ignore"), re.S):',
  '            print("COMMENT: " + "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", m.group(1))))',
  'elif x.endswith(".pdf"):',
  '    try:',
  '        import fitz',
  '    except ImportError:',
  '        fitz = None',
  '    if fitz is None:',
  '        print("LANES: skipped, PyMuPDF (fitz) is not importable")',
  '        from pypdf import PdfReader',
  '        for pg in PdfReader(p).pages: print(pg.extract_text() or "")',
  '    else:',
  '        for pg in fitz.open(p):',
  '            t = pg.get_text()',
  '            head = [l.strip() for l in t.splitlines() if l.strip()][:3]',
  // A "Proses To-Be" BPMN page: lane labels sit in the leftmost ~15% of the page; every other block
  // belongs to the lane whose band holds its y-centre (bands cut half way between label centres).
  '            if any(h.lower().startswith("proses to-be") for h in head):',
  '                W = pg.rect.width',
  '                yc = lambda b: (b[1] + b[3]) / 2',
  '                one = lambda s: " ".join(s.split())',
  '                bl = [b for b in pg.get_text("blocks") if b[6] == 0 and b[4].strip() and not b[4].strip().lower().startswith("proses to-be")]',
  '                lab = [b for b in bl if (b[0] + b[2]) / 2 <= 0.15 * W]',
  '                lab = sorted([b for b in lab if sum(1 for o in lab if o is not b and b[1] <= yc(o) <= b[3]) < 2], key=yc)',
  '                box = sorted([b for b in bl if (b[0] + b[2]) / 2 > 0.15 * W], key=lambda b: (b[0], b[1]))',
  '                if not lab: print("LANES: none found on this To-Be page (no text in the leftmost 15% of the page)")',
  '                c = [yc(b) for b in lab]',
  '                cut = [(c[i] + c[i + 1]) / 2 for i in range(len(c) - 1)]',
  '                for i, b in enumerate(lab):',
  '                    lo = cut[i - 1] if i else (c[0] - (cut[0] - c[0]) if cut else -1e9)',
  '                    hi = cut[i] if i < len(cut) else (c[-1] + (c[-1] - cut[-1]) if cut else 1e9)',
  '                    print("LANE " + one(b[4]) + ": " + " \\u00b7 ".join(one(k[4]) for k in box if lo <= yc(k) < hi))',
  '            print(t)',
  'elif x.endswith(".xlsx"):',
  '    import openpyxl; wb = openpyxl.load_workbook(p, data_only=True)',
  '    for ws in wb:',
  '        print("## " + ws.title)',
  '        for r in ws.iter_rows(values_only=True):',
  '            if any(v is not None for v in r): print(" | ".join("" if v is None else str(v) for v in r))',
].join('\n');
const SPEC_EXT = /\.(docx|pdf|xlsx)$/i;
async function readRequirement(req, forTicket, log, section) {
  const i = (await get(`/issues/${encodeURIComponent(req)}.json?include=journals,attachments`)).issue;
  const dir = path.join(require('os').tmpdir(), 'requirement-read', String(i.id));
  fs.mkdirSync(dir, { recursive: true });
  console.log(`REQUIREMENT-READ #${i.id}${forTicket ? ` for ${forTicket}` : ''} · ${i.tracker.name} · ${i.status.name} · by ${i.author.name} · ${REDMINE_BASE}/issues/${i.id}`);
  console.log(`Subject: ${i.subject}\n--- DESCRIPTION ---\n${i.description || '(empty)'}`);
  const notes = (i.journals || []).filter(j => j.notes && j.notes.trim());
  console.log(`--- JOURNALS (${notes.length}) ---`);
  notes.forEach(j => console.log(`[${j.created_on.slice(0, 10)} ${j.user.name}] ${j.notes.trim()}`));
  const atts = i.attachments || [];
  let read = 0;
  for (const a of atts) {
    if (!SPEC_EXT.test(a.filename)) { console.log(`--- ATTACHMENT ${a.filename}: not a text spec, open it by eye if it shows the screen (${REDMINE_BASE}/attachments/${a.id})`); continue; }
    const file = path.join(dir, a.filename.replace(/[\\/:*?"<>|]/g, '_'));
    try {
      await download(`${REDMINE_BASE}/attachments/download/${a.id}`, file);
      const text = require('child_process').execFileSync('python', ['-I', '-c', EXTRACT_PY, file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
      let body = text.trim(), cut = '';
      if (section && /\.(docx|pdf)$/i.test(a.filename)) {
        const f = sectionFilter(body, section);
        const drop = f.dropped.length ? ` (too common to locate a section, ignored: ${f.dropped.join(', ')})` : '';
        cut = f.matched ? ` · --section "${section}": ${f.matched} matching lines ±${SECTION_CTX}${drop}` : ` · --section "${section}": 0 matches, full text below`;
        body = f.text;
      }
      console.log(`--- ATTACHMENT ${a.filename} (${a.created_on.slice(0, 10)}, ${a.author.name})${cut} ---\n${body}`);
      read++;
    } catch (e) { console.log(`--- ATTACHMENT ${a.filename}: ⚠ NOT READ (${String(e.message).split('\n')[0]}); open ${REDMINE_BASE}/attachments/${a.id} by hand before any verdict`); }
  }
  const specs = atts.filter(a => SPEC_EXT.test(a.filename)).length;
  console.log(`--- END REQUIREMENT-READ #${i.id}: description + ${notes.length} journal notes + ${read} of ${specs} spec attachments read ---`);
  if (read < specs) console.log('  ⚠ a spec attachment was not read: no verdict until it is.');
  console.log(`  Next: quote the rule that decides in the line: REQUIREMENT-MATCH: ${forTicket || '<ticket>'} → #${i.id} "${i.subject}" — <aligned | extends | contradicts> — read: "<quoted rule>"`);
  Object.assign(log, { mode: 'read', req: i.id, ticket: forTicket ? Number(forTicket) : null, outcome: read < specs ? 'partial' : 'read', specs, read });
  return read < specs ? 1 : 0;
}

module.exports = { requestKind, screenHint, tokenize, codesOf, kodsOf, rowFromIssue, prepare, search, renderMd, load, localTicket,
  expandSynonyms, sectionFilter, loadTiers, loadNext, calledFlowKods, EXTRACT_PY, SYNONYMS, REQ_PROJECTS, REQ_TRACKERS, DATA_FILE, MD_FILE };

if (require.main === module) {
  const log = { mode: process.argv.slice(2).find(a => /^--(build|status|find|ticket|read|load)$/.test(a)) || 'usage' };
  const t0 = Date.now();
  const done = (code, err) => { log.mode = String(log.mode).replace(/^--/, ''); logRow({ ...log, exit: code, err: err || undefined, dur_ms: Date.now() - t0 }); process.exit(code); };
  main(process.argv.slice(2), log).then(code => done(code), e => { console.error('requirement-index: ' + e.message); done(2, e.message); });
}
