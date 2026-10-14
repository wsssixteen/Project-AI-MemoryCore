#!/usr/bin/env node
// state-migration.eval.js — runs the real CLI against a sandbox registry, knowledge root, repos and Task folders.
// Never touches system/states.json, etanah-knowledge, E:\Projects or 1. Tasks.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, 'state-migration.js');
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'state-mig-'));
const k = path.join(tmp, 'k'), repos = path.join(tmp, 'repos'), tasks = path.join(tmp, 'tasks');
const w = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const mods = (r) => ({ pelupusan: { repo: 'etanah-pelupusan', trunk: 'x/dev' } });

const reg = { version: 1, reference_state: 'alpha', tasks_root: 'unused', tasks_root_override: tasks, repos_root: repos.replace(/\\/g, '/'), knowledge_root: 'unused', states: {
  alpha: { label: 'Alpha', code: 'ALP', aliases: ['Alpha'], permohonan_prefix: 'PTALP', work_scope: 'active', task_folder: 'Alpha', knowledge_dir: 'alpha', repo_dir: 'Alpha', modules: mods(), db: { engine: 'postgres', mcp: { it: 'pg-alpha' } }, redmine: { project_names: [] } },
  beta: { label: 'Beta', code: 'BET', aliases: ['Beta'], permohonan_prefix: 'PTBET', refers_to: 'alpha', refers_to_note: 'test', work_scope: 'active', task_folder: 'Beta', knowledge_dir: 'beta', repo_dir: 'Beta', modules: mods(), db: { engine: 'postgres', mcp: {} }, flowable_source: { modeler: 'http://beta/flowable-ui/modeler/' }, redmine: { project_names: [] } },
  root: { label: 'Root', code: 'ROT', aliases: ['Root'], permohonan_prefix: 'PTROT', refers_to: null, refers_to_root: true, refers_to_note: 'first state family in the shared repo', work_scope: 'active', task_folder: 'Root', knowledge_dir: 'root', modules: {}, db: { engine: 'postgres', mcp: { it: 'pg-root' } }, redmine: {} },
  gamma: { label: 'Gamma', code: 'GAM', aliases: ['Gamma'], permohonan_prefix: 'PTGAM', work_scope: 'active', task_folder: 'Gamma', knowledge_dir: 'gamma', repo_dir: null, modules: {}, db: { engine: 'postgres', mcp: {} }, redmine: { project_names: [] } },
  delta: { label: 'Delta', code: 'DLT', aliases: ['Delta'], permohonan_prefix: 'PTDLT', refers_to: 'alpha', work_scope: 'active', task_folder: 'Delta', knowledge_dir: 'delta', repo_dir: null, modules: {}, db: { engine: 'oracle', mcp: {} }, redmine: { project_names: [] } },
  eps: { label: 'Eps', code: 'EPS', aliases: ['Eps'], permohonan_prefix: 'PTEPS', refers_to: 'eps', work_scope: 'active', task_folder: 'Eps', knowledge_dir: 'eps', modules: {}, db: {}, redmine: {} },
  zeta: { label: 'Zeta', code: 'ZET', aliases: ['Zeta'], permohonan_prefix: 'PTZET', refers_to: 'nope', work_scope: 'active', task_folder: 'Zeta', knowledge_dir: 'zeta', modules: {}, db: {}, redmine: {} },
  loopa: { label: 'LoopA', code: 'LPA', aliases: ['LoopA'], permohonan_prefix: 'PTLPA', refers_to: 'loopb', work_scope: 'active', knowledge_dir: 'loopa', modules: {}, db: {}, redmine: {} },
  loopb: { label: 'LoopB', code: 'LPB', aliases: ['LoopB'], permohonan_prefix: 'PTLPB', refers_to: 'loopa', work_scope: 'active', knowledge_dir: 'loopb', modules: {}, db: {}, redmine: {} },
  pen: { label: 'Pen', code: 'PEN', aliases: ['Pen'], permohonan_prefix: 'PTPEN', refers_to: 'alpha', work_scope: 'active', task_folder: 'Penang', knowledge_dir: 'pen', modules: {}, db: { engine: 'postgres', mcp: {} }, redmine: { project_names: ['PNG_03_Pelupusan'] } },
  mis: { label: 'Mis', code: 'MIS', aliases: ['Mis'], permohonan_prefix: 'PTMIS', refers_to: 'alpha', work_scope: 'active', task_folder: 'Mis', knowledge_dir: 'mis', modules: {}, db: { engine: 'postgres', mcp: {} }, redmine: { project_names: ['XYZ_03_Pelupusan'] } },
} };
w(path.join(tmp, 'states.json'), JSON.stringify(reg));
w(path.join(k, 'KNOWLEDGE-SCHEMA.json'), JSON.stringify({ states: Object.fromEntries(Object.entries(reg.states).map(([kk, v]) => [kk, { code: v.code }])), required_files: { 'index.md': '', 'STATE-FACTS.md': '' }, required_dirs: {}, optional_files: ['FLOWABLE-KNOWLEDGE.md', 'DATABASE.md', 'MODULE-ARCHITECTURE.md', 'ADHOC-REGISTER.md', 'BUG-BESTIARY.md', 'DOMAIN-GLOSSARY.md', 'MIGRATION-LEDGER.json'], allowed_patterns: ['^[A-Z0-9][A-Z0-9-]*\\.md$'], legacy_names: {}, flowables_layout: {} }));
// reference state Alpha
w(path.join(k, 'alpha', 'index.md'), '# alpha\n');
w(path.join(k, 'alpha', 'STATE-FACTS.md'), '# STATE-FACTS — ALPHA\n## 1. DB\nalpha db fact\n');
w(path.join(k, 'alpha', 'FLOWABLE-KNOWLEDGE.md'), '\uFEFF# FLOWABLE\n## Engine\nalpha engine mechanics\n');
w(path.join(k, 'alpha', 'DATABASE.md'), '# DATABASE\n## Query\nselect 1 from alpha_only;\n');
w(path.join(k, 'alpha', 'MODULE-ARCHITECTURE.md'), '# MODULE\n## Layout\nalpha layout\n');
w(path.join(k, 'alpha', 'DOMAIN-GLOSSARY.md'), '# GLOSSARY\n## Words\nurusan = matter\n');
w(path.join(k, 'alpha', 'ADHOC-REGISTER.md'), '# ADHOC-REGISTER\n## Rows\n| ID | Ask |\n|---|---|\n| A1 | alpha private ask |\n');
w(path.join(k, 'alpha', 'BUG-BESTIARY.md'), '# BESTIARY\n## Shapes\nalpha bug\n');
w(path.join(k, 'alpha', 'ALPHA-ONLY.md'), '# only alpha\n');
w(path.join(k, 'alpha', 'flowables-bpmn', '_manifest.json'), '[{"key":"A1"},{"key":"A2"}]');
w(path.join(k, 'alpha', 'flowables-bpmn', 'ALP_PLP_X.bpmn20.xml'), '<x/>');
// target Beta: own STATE-FACTS, skeleton FLOWABLE-KNOWLEDGE, index with Extras then Guards
w(path.join(k, 'beta', 'index.md'), '# beta\n\n## Knowledge files\n\n| File | Scope | Status |\n|---|---|---|\n| [STATE-FACTS.md](STATE-FACTS.md) | facts | ok |\n\n## Extras\n\n| File | Scope | Status |\n|---|---|---|\n\n## Guards\n\n| # | Trap | Guard | Explained in |\n|---|---|---|---|\n| 1 | t | g | e |\n');
w(path.join(k, 'beta', 'STATE-FACTS.md'), '# STATE-FACTS — BETA\n## 1. DB\nreal beta fact\n');
w(path.join(k, 'beta', 'FLOWABLE-KNOWLEDGE.md'), '# FLOWABLE-KNOWLEDGE — BETA\n\n> ⚠️ UNVERIFIED-FOR-BETA — skeleton created 2026-01-01 by knowledge-schema-audit\n\n## Engine\n\n_(to fill)_\n');
for (const s of ['delta', 'gamma', 'pen', 'mis']) { w(path.join(k, s, 'index.md'), '# ' + s + '\n'); w(path.join(k, s, 'STATE-FACTS.md'), '# f\n'); }
// repos: Beta's checkout carries Alpha's family (shared codebase)
const br = path.join(repos, 'Beta', 'etanah-pelupusan');
fs.mkdirSync(path.join(br, 'src', 'main', 'resources', 'config', 'ALP'), { recursive: true });
fs.mkdirSync(path.join(br, 'src', 'main', 'resources', 'config', 'BET'), { recursive: true });
w(path.join(br, 'src', 'main', 'java', 'a', 'AlpForm.java'), 'class AlpForm{}');
w(path.join(br, 'src', 'main', 'java', 'b', 'BetForm.java'), 'class BetForm{}');
fs.mkdirSync(path.join(br, '.codegraph'), { recursive: true });
fs.mkdirSync(path.join(tasks, 'Beta'), { recursive: true });
fs.mkdirSync(path.join(tasks, 'Penang'), { recursive: true });

const LOGF = path.join(tmp, 'log.jsonl');
const env = Object.assign({}, process.env, { STATES_FILE: path.join(tmp, 'states.json'), STATES_LOCAL_FILE: path.join(tmp, 'none.json'), KNOWLEDGE_ROOT: k, STATE_MIGRATION_LOG: LOGF, STATE_MIGRATION_NO_GIT: '1', STATE_MIGRATION_DATE: '2026-10-14' });
delete env.ETANAH_STATE;
const run = (...a) => { const x = spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8', env, timeout: 60000 }); return { code: x.status, out: (x.stdout || '') + (x.stderr || '') }; };
const rd = (...p) => { try { return fs.readFileSync(path.join(k, ...p), 'utf8'); } catch (_) { return null; } };
const gateJson = (s) => { const r = run('gates', '--state', s, '--json'); try { return Object.fromEntries(JSON.parse(r.out).rows.map(x => [x.id, x])); } catch (_) { return {}; } };

// ── chain ──
let r = run('chain', '--state', 'beta');
check('S1 chain Beta → Alpha, ends with no refers_to', /Beta → Alpha/.test(r.out) && /end: no refers_to/.test(r.out), r.out);
r = run('chain', '--state', 'loopa');
check('S2 chain loop LoopA → LoopB → LoopA is named, no hang', r.code === 0 && /\(loop\)/.test(r.out), r.out);
// ── gates ──
let g = gateJson('beta');
check('S3 Beta: G1 PASS (declared, registered)', g.G1 && g.G1.verdict === 'PASS' && /Beta → Alpha/.test(g.G1.evidence), JSON.stringify(g.G1));
check('S4 Beta: G2 PASS (both postgres)', g.G2 && g.G2.verdict === 'PASS', JSON.stringify(g.G2));
check('S5 Beta: G3 PASS shared codebase (config/ALP + Alp*.java in the Beta repo)', g.G3 && g.G3.verdict === 'PASS' && /config\/ALP present, 1 Alp\*\.java/.test(g.G3.evidence), JSON.stringify(g.G3));
check('S6 Beta: G4 UNKNOWN when git is skipped, never a guessed PASS', g.G4 && g.G4.verdict === 'UNKNOWN', JSON.stringify(g.G4));
check('S7 Beta: G5 WARN modeler declared, not exported (the Penang case)', g.G5 && g.G5.verdict === 'WARN' && /beta\/flowable-ui\/modeler/.test(g.G5.evidence), JSON.stringify(g.G5));
check('S8 Beta: G6 FAIL no DB connection', g.G6 && g.G6.verdict === 'FAIL', JSON.stringify(g.G6));
check('S9 Beta: G8 PASS Task folder · G10 PASS code index', g.G8 && g.G8.verdict === 'PASS' && g.G10 && g.G10.verdict === 'PASS', JSON.stringify([g.G8, g.G10]));
r = run('gates', '--state', 'beta');
check('S10 gates exit 1 while any gate is FAIL or UNKNOWN', r.code === 1, 'exit ' + r.code);
g = gateJson('gamma');
check('S11 Gamma: no refers_to → G1 UNKNOWN (ask miya), never a default', g.G1 && g.G1.verdict === 'UNKNOWN' && /ask miya/.test(g.G1.evidence), JSON.stringify(g.G1));
g = gateJson('root');
check('S11b declared root (refers_to_root) → G1-G4 PASS "nothing to compare", never UNKNOWN', ['G1', 'G2', 'G3', 'G4'].every(id => g[id] && g[id].verdict === 'PASS') && /root of the chain: first state family/.test(g.G1.evidence), JSON.stringify([g.G1, g.G3]));
r = run('migrate', '--state', 'root');
check('S11c migrate a root → REFUSED (nothing to migrate from), exit 2', r.code === 2 && /root state: there is no reference/.test(r.out), r.out.slice(-200));
check('S12 Eps refers to itself → G1 FAIL', (gateJson('eps').G1 || {}).verdict === 'FAIL', '');
check('S13 Zeta refers to an unregistered state → G1 FAIL', /not a registered state/.test((gateJson('zeta').G1 || {}).evidence || ''), '');
g = gateJson('delta');
check('S14 Delta (oracle) vs Alpha (postgres) → G2 WARN, DB files headings only', g.G2 && g.G2.verdict === 'WARN' && /headings only/.test(g.G2.evidence), JSON.stringify(g.G2));
check('S15 Alpha: manifest present → G5 PASS with the model count', (gateJson('alpha').G5 || {}).verdict === 'PASS' && /2 models/.test(gateJson('alpha').G5.evidence), '');
check('S16 ticket routing: PNG_03_Pelupusan → Penang PASS; an unmatched project → FAIL', (gateJson('pen').G9 || {}).verdict === 'PASS' && (gateJson('mis').G9 || {}).verdict === 'FAIL', JSON.stringify([gateJson('pen').G9, gateJson('mis').G9]));
// ── migrate refusals ──
r = run('migrate', '--state', 'gamma');
check('S17 migrate with no reference → REFUSED exit 2, nothing written', r.code === 2 && /REFUSED/.test(r.out) && rd('gamma', 'MIGRATION-LEDGER.json') == null, r.out.slice(-200));
r = run('migrate', '--state', 'beta', '--from', 'delta');
check('S18 --from a state that is not the declared reference → REFUSED', r.code === 2 && /not Beta's declared reference/.test(r.out), r.out.slice(-200));
r = run('migrate', '--state', 'beta', '--dry-run');
check('S19 dry run writes nothing (skeleton intact, no ledger)', r.code === 0 && /DRY RUN/.test(r.out) && /skeleton created 2026-01-01/.test(rd('beta', 'FLOWABLE-KNOWLEDGE.md')) && rd('beta', 'MIGRATION-LEDGER.json') == null, r.out.slice(-300));
// ── migrate ──
r = run('migrate', '--state', 'beta');
const fk = rd('beta', 'FLOWABLE-KNOWLEDGE.md') || '';
check('S20 tier A over a skeleton: banner UNVERIFIED-FOR-BETA first, Alpha body after, BOM dropped', /^> ⚠️ UNVERIFIED-FOR-BETA — migrated 2026-10-14 from alpha\/FLOWABLE-KNOWLEDGE\.md/.test(fk) && /alpha engine mechanics/.test(fk) && !fk.includes('\uFEFF'), fk.slice(0, 200));
check('S21 own content is never overwritten (STATE-FACTS kept)', /real beta fact/.test(rd('beta', 'STATE-FACTS.md') || '') && !/alpha db fact/.test(rd('beta', 'STATE-FACTS.md') || ''), rd('beta', 'STATE-FACTS.md'));
const ar = rd('beta', 'ADHOC-REGISTER.md') || '';
check('S22 tier C register: Alpha table header kept, Alpha rows never copied', /\| ID \| Ask \|/.test(ar) && !/alpha private ask/.test(ar), ar);
check('S23 a reference-only topic is not copied', rd('beta', 'ALPHA-ONLY.md') == null, '');
check('S24 flowables-bpmn is never copied (a state\'s processes are its own)', !fs.existsSync(path.join(k, 'beta', 'flowables-bpmn')), '');
let led = JSON.parse(rd('beta', 'MIGRATION-LEDGER.json') || '{}');
check('S25 ledger: one row per file with tier, source hash, status', led.refers_to === 'alpha' && led.files['FLOWABLE-KNOWLEDGE.md'] && led.files['FLOWABLE-KNOWLEDGE.md'].status === 'unverified' && /^[0-9a-f]{64}$/.test(led.files['FLOWABLE-KNOWLEDGE.md'].source_sha256 || '') && led.files['STATE-FACTS.md'].status === 'kept-target', JSON.stringify(led.files).slice(0, 300));
const idx = rd('beta', 'index.md') || '';
check('S26 new rows land in the Extras table, above Guards, Guards table untouched', idx.indexOf('[MODULE-ARCHITECTURE.md]') > idx.indexOf('## Extras') && idx.indexOf('[MODULE-ARCHITECTURE.md]') < idx.indexOf('## Guards') && /\| 1 \| t \| g \| e \|/.test(idx) && idx.includes('MIGRATION-LEDGER.json'), idx);
r = run('migrate', '--state', 'delta');
const dd = rd('delta', 'DATABASE.md') || '';
check('S27 failed gate demotes tier A to B: Delta DATABASE.md = headings only, no SQL', /demoted from A: gate db\+code did not hold/.test(dd) && !/select 1/.test(dd) && /## Query/.test(dd), dd);
// ── audit + drift ──
r = run('audit', '--state', 'beta');
check('S28 audit lists each migrated file with its status', /file unverified\s+A\s+FLOWABLE-KNOWLEDGE\.md/.test(r.out) && /kept-target/.test(r.out), r.out.slice(-600));
fs.appendFileSync(path.join(k, 'alpha', 'DOMAIN-GLOSSARY.md'), 'new alpha word\n');
fs.appendFileSync(path.join(k, 'beta', 'MODULE-ARCHITECTURE.md'), '\nbeta note added by hand\n');
r = run('audit', '--state', 'beta');
check('S29 reference changed after migration → source-changed, exit 1', /source-changed\s+A\s+DOMAIN-GLOSSARY\.md/.test(r.out) && r.code === 1, r.out.slice(-600));
check('S30 target edited but not verified → edited-not-verified', /edited-not-verified\s+A\s+MODULE-ARCHITECTURE\.md/.test(r.out), r.out.slice(-600));
// ── verify ──
r = run('verify', '--state', 'beta', '--file', 'FLOWABLE-KNOWLEDGE.md', '--evidence', 'ok');
check('S31 verify with empty-shaped evidence is refused', r.code === 2 && /evidence must name the source/.test(r.out), r.out);
r = run('verify', '--state', 'beta', '--file', 'NOT-THERE.md', '--evidence', 'Beta engine DB act_re_procdef read 2026-10-14');
check('S32 verify a file with no ledger row is refused', r.code === 2 && /no ledger row/.test(r.out), r.out);
r = run('verify', '--state', 'beta', '--file', 'FLOWABLE-KNOWLEDGE.md', '--evidence', 'Beta engine DB act_re_procdef read 2026-10-14');
led = JSON.parse(rd('beta', 'MIGRATION-LEDGER.json') || '{}');
check('S33 verify records evidence and lifts only the migration banner', r.code === 0 && led.files['FLOWABLE-KNOWLEDGE.md'].status === 'verified' && !/UNVERIFIED-FOR-BETA — migrated/.test(rd('beta', 'FLOWABLE-KNOWLEDGE.md')) && /alpha engine mechanics/.test(rd('beta', 'FLOWABLE-KNOWLEDGE.md')), JSON.stringify(led.files['FLOWABLE-KNOWLEDGE.md']));
r = run('migrate', '--state', 'beta');
led = JSON.parse(rd('beta', 'MIGRATION-LEDGER.json') || '{}');
check('S34 a second migrate keeps a verified file verified and untouched', led.files['FLOWABLE-KNOWLEDGE.md'].status === 'verified' && !/UNVERIFIED-FOR-BETA — migrated/.test(rd('beta', 'FLOWABLE-KNOWLEDGE.md')), JSON.stringify(led.files['FLOWABLE-KNOWLEDGE.md']));
check('S34b a second migrate keeps the provenance of an edited migrated file (no kept-target overwrite)', led.files['MODULE-ARCHITECTURE.md'].status === 'unverified' && /^[0-9a-f]{64}$/.test(led.files['MODULE-ARCHITECTURE.md'].source_sha256 || '') && led.files['ADHOC-REGISTER.md'].status === 'skeleton', JSON.stringify([led.files['MODULE-ARCHITECTURE.md'], led.files['ADHOC-REGISTER.md']]));
check('S35 a second migrate adds no duplicate index rows', ((rd('beta', 'index.md') || '').match(/\[MODULE-ARCHITECTURE\.md\]/g) || []).length === 1, '');
// ── misc ──
r = run('gates', '--state', 'nosuch');
check('S36 unregistered --state → exit 2 with a message', r.code === 2 && /not registered: nosuch/.test(r.out), r.out);
r = run('bogus', '--state', 'beta');
check('S37 unknown command → exit 2 usage', r.code === 2 && /usage/.test(r.out), r.out);
const logRows = (fs.existsSync(LOGF) ? fs.readFileSync(LOGF, 'utf8').trim().split('\n') : []).map(l => JSON.parse(l));
check('S38 every call writes a telemetry row (ts · cmd · outcome · exit · dur_ms)', logRows.length >= 20 && logRows.every(x => x.ts && 'exit' in x && typeof x.dur_ms === 'number'), logRows.length + ' rows');
const { isSkeleton } = require(CLI);
check('S39 isSkeleton: banner + headings + placeholders → true; one real line → false', isSkeleton('# A\n> ⚠️ UNVERIFIED-FOR-X — s\n## B\n_(to fill)_\n') === true && isSkeleton('# A\nreal fact\n') === false, '');

if (process.env.SM_KEEP) console.log('kept ' + tmp); else try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + String(x.d).slice(0, 400))); }
console.log('\nstate-migration.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
