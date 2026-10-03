#!/usr/bin/env node
// domain/urusan-tickets/urusan-tickets.eval.js — fixtures for the urusan precedent generator (born 2026-10-03).
// Replay it kills: the generator carried one project, one output folder and one id shape, so a second state had
// no precedent docs. Sandboxed: a local stub answers the issue pulls (URUSAN_TICKETS_REDMINE_BASE), docs land in
// a temp tree (CLAUDE_PROJECT_DIR), the run log in a temp file (URUSAN_TICKETS_LOG). Never the real Redmine,
// never the real knowledge tree, never git.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(__dirname, 'urusan-tickets.js');
const SB = fs.mkdtempSync(path.join(os.tmpdir(), 'urusan-tickets-eval-'));
const reg = JSON.parse(fs.readFileSync(path.join(REPO, 'system', 'states.json'), 'utf8'));
const K = path.join(SB, ...String(reg.knowledge_root).split('/'));
const REF = reg.reference_state;
const OTHER = 'terengganu';
const refDir = path.join(K, reg.states[REF].knowledge_dir, 'urusan');
const otherDir = path.join(K, reg.states[OTHER].knowledge_dir, 'urusan');
const LOG = path.join(SB, 'log.jsonl');

const iss = (id, subject, cfs) => ({ id, subject, description: '', tracker: { name: 'Bug' }, status: { name: 'New' }, created_on: '2026-01-0' + (id % 9 + 1) + 'T00:00:00Z', updated_on: '2026-02-0' + (id % 9 + 1) + 'T00:00:00Z', custom_fields: cfs || [] });
const FIX = {
  [reg.states[REF].redmine.project]: [
    iss(101, 'PTMLK/01/L/PLPS/2026/5 tidak boleh hantar'),
    iss(102, 'isu skrin', [{ id: 33, value: 'PRZ' }]),
    iss(103, 'MCL dropdown tidak simpan'),
    iss(104, 'tiada petunjuk'),
    iss(105, 'rujuk PTTRG/07/01/L/PT/2024/116 sahaja'),
  ],
  [reg.states[OTHER].redmine.project]: [
    iss(201, 'ALTER TUGASAN BAGI ID PTTRG/07/01/L/PT/2024/116'),
    iss(202, 'PTTRG/02/L/OPLPS/2026/47 lesen tidak keluar'),
    iss(203, 'MLPS - Alter ke tugasan Penyediaan Borang'),
    iss(204, 'banding dengan PTMLK/01/L/PRZ/2026/1 sahaja'),
    iss(205, 'PTMLK/01/L/PRZ/2026/1 kemudian PTTRG/07/01/L/PLPS/2026/135'),
    iss(206, 'LPS lesen lama'),
    iss(207, 'PTTRG/07/01/L/MCL/2026/1 kod asing'),
  ],
};

let hits = [];
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  hits.push({ project: u.searchParams.get('project_id'), query: u.search });
  const first = /[?&]cf_17=/.test(u.search);
  const issues = first ? (FIX[u.searchParams.get('project_id')] || []) : [];
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ total_count: issues.length, issues }));
});

function run(args, extraEnv) {
  hits = [];
  const env = { ...process.env, CLAUDE_PROJECT_DIR: SB, URUSAN_TICKETS_LOG: LOG, URUSAN_TICKETS_REDMINE_BASE: 'http://127.0.0.1:' + server.address().port, ...(extraEnv || {}) };
  for (const k of ['ETANAH_STATE', 'KNOWLEDGE_ROOT', 'STATES_ROOT', 'STATES_LOCAL_FILE']) delete env[k];
  if (!(extraEnv && extraEnv.STATES_FILE)) delete env.STATES_FILE;
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [SCRIPT, ...args], { env, windowsHide: true });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => resolve({ code, out, err, hits: hits.slice() }));
  });
}
const ls = (d) => { try { return fs.readdirSync(d).sort(); } catch (_) { return []; } };
const read = (d, f) => { try { return fs.readFileSync(path.join(d, f), 'utf8'); } catch (_) { return ''; } };
const snap = (d) => ls(d).map((f) => f + '\n' + read(d, f)).join('\n=====\n');

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name + (detail ? '  — ' + detail : '')); } }

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));

  // M — no --state: the reference behaviour, untouched
  let r = await run([]);
  const refProject = reg.states[REF].redmine.project;
  check('M1 no --state → exit 0, every pull on the reference project', r.code === 0 && r.hits.length === 3 && r.hits.every((h) => h.project === refProject), r.err + JSON.stringify(r.hits));
  check('M2 no --state → the three built-in passes, in order', /cf_17=Pelupusan/.test(r.hits[0].query) && /cf_77=Awam%20Pelupusan/.test(r.hits[1].query) && /assigned_to_id=me/.test(r.hits[2].query));
  check('M3 docs land in <reference knowledge dir>/urusan', JSON.stringify(ls(refDir)) === JSON.stringify(['MCL-TICKETS.md', 'PLPS-TICKETS.md', 'PRZ-TICKETS.md', '_INDEX.md', '_UNCLASSIFIED.md']), ls(refDir).join(','));
  const mPlps = read(refDir, 'PLPS-TICKETS.md');
  check('M4 doc text unchanged (project name + bare command, no --state)', mPlps.includes(`every ${refProject} ticket classified to urusan **PLPS**`) && mPlps.includes('`node domain/urusan-tickets/urusan-tickets.js` rebuilds') && !/--state/.test(snap(refDir)));
  check('M5 classification unchanged: id → PLPS, cf_33 → PRZ, keyword → MCL, rest unclassified', mPlps.includes('#101') && read(refDir, 'PRZ-TICKETS.md').includes('#102') && read(refDir, 'MCL-TICKETS.md').includes('#103') && read(refDir, '_UNCLASSIFIED.md').includes('#104'));
  check('M6 an id of another state does not classify on the default path (as before)', read(refDir, '_UNCLASSIFIED.md').includes('#105') && !ls(refDir).includes('PT-TICKETS.md'));
  check('M7 no state line on stdout, no state key in the run log', !/^state |^note:/m.test(r.out) && !/"state"/.test(read(SB, 'log.jsonl')), r.out);
  check('M8 nothing written to the other state', ls(otherDir).length === 0);
  const refSnap = snap(refDir);

  // T — --state terengganu
  r = await run(['--state', OTHER]);
  const otherProject = reg.states[OTHER].redmine.project;
  check('T1 --state → exit 0, every pull on the registry project', r.code === 0 && r.hits.length === 3 && r.hits.every((h) => h.project === otherProject), r.err + JSON.stringify(r.hits));
  check('T2 module passes come from the registry record', /cf_17=Pelupusan/.test(r.hits[0].query) && /cf_77=Awam%20Pelupusan/.test(r.hits[1].query) && /assigned_to_id=me/.test(r.hits[2].query));
  check('T3 docs land in <state knowledge dir>/urusan', ['PT-TICKETS.md', 'OPLPS-TICKETS.md', 'MLPS-TICKETS.md', 'PLPS-TICKETS.md', 'LPS-TICKETS.md', '_INDEX.md', '_UNCLASSIFIED.md'].every((f) => ls(otherDir).includes(f)), ls(otherDir).join(','));
  check('T4 7-segment id → PT', read(otherDir, 'PT-TICKETS.md').includes('#201'));
  check('T5 6-segment id → OPLPS', read(otherDir, 'OPLPS-TICKETS.md').includes('#202'));
  check('T6 keyword → MLPS; state-only kod LPS classifies from catalog.<state>.json', read(otherDir, 'MLPS-TICKETS.md').includes('#203') && read(otherDir, 'LPS-TICKETS.md').includes('#206') && read(otherDir, 'LPS-TICKETS.md').includes('Lesen Pendudukan Sementara'));
  check('T7 a quoted id of another state never classifies', read(otherDir, '_UNCLASSIFIED.md').includes('#204') && !ls(otherDir).includes('PRZ-TICKETS.md'));
  check('T8 foreign id first, own id second → own id wins', read(otherDir, 'PLPS-TICKETS.md').includes('#205'));
  check('T9 own id with a kod outside the state catalog stays visible in _UNCLASSIFIED', read(otherDir, '_UNCLASSIFIED.md').includes('#207') && !ls(otherDir).includes('MCL-TICKETS.md'));
  const tPt = read(otherDir, 'PT-TICKETS.md');
  check('T10 doc names the state project + the --state command', tPt.includes(`every ${otherProject} ticket`) && tPt.includes('urusan-tickets.js --state ' + OTHER + '` rebuilds') && read(otherDir, '_INDEX.md').includes('urusan-tickets.js --state ' + OTHER));
  check('T11 run log carries the state', /"state":"terengganu"/.test(fs.readFileSync(LOG, 'utf8').trim().split('\n').pop()));
  check('T12 reference-state docs untouched by the --state run', snap(refDir) === refSnap);

  // notes survive + dry-run writes nothing
  fs.appendFileSync(path.join(otherDir, 'PT-TICKETS.md'), 'keep this note\n');
  const before = snap(otherDir);
  r = await run(['--state', 'TRG', '--dry-run']);
  check('T13 alias "TRG" + --dry-run → exit 0, prints the state, writes nothing', r.code === 0 && /state terengganu: project /.test(r.out) && snap(otherDir) === before, r.err);
  r = await run(['--state', 'Terengganu']);
  check('T14 capitalised "Terengganu" resolves; manual notes survive regeneration', r.code === 0 && read(otherDir, 'PT-TICKETS.md').endsWith('keep this note\n'));

  // refusals — nothing pulled, nothing written
  const all = () => snap(refDir) + snap(otherDir);
  const frozen = all();
  r = await run(['--state', 'johor']);
  check('R1 unknown state → exit 2 "state UNKNOWN", zero pulls, zero writes', r.code === 2 && /state UNKNOWN/.test(r.err) && r.hits.length === 0 && all() === frozen, r.err);
  r = await run(['--state']);
  check('R2 --state with no value → exit 2 "state UNKNOWN", zero pulls', r.code === 2 && /state UNKNOWN/.test(r.err) && r.hits.length === 0);
  r = await run(['--state', '--dry-run']);
  check('R3 --state followed by another flag → exit 2, zero pulls', r.code === 2 && /state UNKNOWN/.test(r.err) && r.hits.length === 0);
  const noProject = Object.keys(reg.states).find((k) => !(reg.states[k].redmine && reg.states[k].redmine.project));
  r = await run(['--state', noProject]);
  check(`R4 registered state without redmine.project (${noProject}) → exit 2, zero pulls, no fallback project`, r.code === 2 && /has no redmine\.project/.test(r.err) && r.hits.length === 0 && all() === frozen, r.err);

  // sandbox registry variants
  const alt = JSON.parse(JSON.stringify(reg));
  alt.states[OTHER].knowledge_dir = null;
  const altFile = path.join(SB, 'states.alt.json'); fs.writeFileSync(altFile, JSON.stringify(alt));
  r = await run(['--state', OTHER], { STATES_FILE: altFile });
  check('R5 empty knowledge_dir in the registry → exit 2, zero pulls', r.code === 2 && /has no knowledge_dir/.test(r.err) && r.hits.length === 0, r.err);
  const alt2 = JSON.parse(JSON.stringify(reg));
  alt2.states[noProject].redmine.project = 'fixture-project';
  const alt2File = path.join(SB, 'states.alt2.json'); fs.writeFileSync(alt2File, JSON.stringify(alt2));
  r = await run(['--state', noProject, '--dry-run'], { STATES_FILE: alt2File });
  check('R6 state with no module_field and no catalog file → runs on its own project and SAYS which built-ins it used', r.code === 0 && r.hits.every((h) => h.project === 'fixture-project') && /carries no redmine\.module_field/.test(r.out) && /no catalog\./.test(r.out), r.out + r.err);

  // explicit --state <reference> lands in the same folder as the default
  r = await run(['--state', REF]);
  check('M9 --state <reference> → same project, same folder, same doc set', r.code === 0 && r.hits.every((h) => h.project === refProject) && JSON.stringify(ls(refDir)) === JSON.stringify(['MCL-TICKETS.md', 'PLPS-TICKETS.md', 'PRZ-TICKETS.md', '_INDEX.md', '_UNCLASSIFIED.md']), r.err);

  server.close();
  try { fs.rmSync(SB, { recursive: true, force: true }); } catch (_) {}
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
