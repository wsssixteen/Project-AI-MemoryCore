#!/usr/bin/env node
// knowledge-schema-audit.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case (2026-09-04): perak had PERAK-FACTS.md instead of STATE-FACTS.md, wp had TEST-DATA-AND-ACCESS.md
// instead of TEST-PERMOHONAN-INDEX.md, kedah had only flowables-bpmn/ (no index.md) with a CON\ folder that
// broke OneDrive, selangor/terengganu had only DATABASE.md — boot must list all of these; scaffold must repair.
// NEVER touches the real knowledge tree: builds a fixture tree under a temp dir and points KNOWLEDGE_ROOT at it.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const CLI = path.join(__dirname, 'knowledge-schema-audit.js');
const HOOK = path.join(__dirname, 'knowledge-schema-audit.check.hook.js');
const WHOOK = HOOK; // same file — the write-time branch is selected by hook_event_name / tool_input on stdin
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// ---- fixture tree ----
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ksa-'));
const K = path.join(TMP, 'etanah-knowledge');
fs.mkdirSync(K, { recursive: true });
const realSchema = path.join(__dirname, '..', '..', 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'KNOWLEDGE-SCHEMA.json');
const mainSchema = path.join((process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..')).replace(/[\\/]\.claude[\\/]worktrees[\\/].*$/, ''), 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'KNOWLEDGE-SCHEMA.json');
const schemaSrc = fs.existsSync(mainSchema) ? mainSchema : realSchema;
const schema = JSON.parse(fs.readFileSync(schemaSrc, 'utf8'));
// the fixture schema: same shape, only 4 states so the assertions are exact
schema.states = { melaka: schema.states.melaka, perak: schema.states.perak, kedah: schema.states.kedah, selangor: schema.states.selangor };
fs.writeFileSync(path.join(K, 'KNOWLEDGE-SCHEMA.json'), JSON.stringify(schema, null, 1));
function mk(p, c) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); }
// melaka: complete + one extra listed in index + one extra NOT listed
for (const f of Object.keys(schema.required_files)) mk(path.join(K, 'melaka', f), `# ${f}\n\n## Section A\n\n## Section B\n`);
for (const d of Object.keys(schema.required_dirs)) fs.mkdirSync(path.join(K, 'melaka', d), { recursive: true });
mk(path.join(K, 'melaka', 'SPOC-COUNTER.md'), '# optional');
mk(path.join(K, 'melaka', 'LISTED-EXTRA.md'), '# extra');
mk(path.join(K, 'melaka', 'ORPHAN-EXTRA.md'), '# extra');
fs.appendFileSync(path.join(K, 'melaka', 'index.md'), '\n| [LISTED-EXTRA.md](LISTED-EXTRA.md) | x | ✅ |\n');
mk(path.join(K, 'melaka', 'flowables-bpmn', 'MLK_PLP_PT.bpmn20.xml'), '<definitions/>');
// perak: legacy name + missing most files
mk(path.join(K, 'perak', 'PERAK-FACTS.md'), '# facts');
mk(path.join(K, 'perak', 'index.md'), '# idx');
// kedah: only flowables with a CON folder and a TKL model at the root
mk(path.join(K, 'kedah', 'flowables-bpmn', 'CON', 'KDH_CON_X.bpmn20.xml'), '<definitions/>');
mk(path.join(K, 'kedah', 'flowables-bpmn', 'KDH_TKL_ST.bpmn20.xml'), '<definitions/>');
mk(path.join(K, 'kedah', 'flowables-bpmn', 'KDH_PLP_PT.bpmn20.xml'), '<definitions/>');
// selangor: only DATABASE.md
mk(path.join(K, 'selangor', 'DATABASE.md'), '# db');

const ENV = { ...process.env, KNOWLEDGE_ROOT: K, CLAUDE_PROJECT_DIR: process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..') };
function cli(args) { const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: ENV, timeout: 30000 }); return { out: (r.stdout || '') + (r.stderr || ''), code: r.status }; }
function hook(file, stdin, env) { const r = spawnSync(process.execPath, [file], { input: stdin, encoding: 'utf8', env: env || ENV, timeout: 30000 }); return { out: (r.stdout || '') + (r.stderr || ''), code: r.status }; }

// ---- CLI audit ----
let r = cli(['audit', '--json']);
let j = []; try { j = JSON.parse(r.out); } catch (_) {}
const by = Object.fromEntries(j.map(x => [x.state, x]));
check('F1 audit exits 1 when drift exists', r.code === 1, 'exit=' + r.code);
check('F2 melaka: only the un-indexed extra is drift', by.melaka && by.melaka.drift === 1 && by.melaka.unindexed_extras.join() === 'ORPHAN-EXTRA.md', JSON.stringify(by.melaka && { d: by.melaka.drift, u: by.melaka.unindexed_extras }));
check('F3 melaka: listed extra + optional file are NOT drift', by.melaka && !by.melaka.unindexed_extras.includes('LISTED-EXTRA.md') && !by.melaka.unindexed_extras.includes('SPOC-COUNTER.md'), '');
check('F4 perak: legacy PERAK-FACTS.md → STATE-FACTS.md', by.perak && by.perak.legacy.some(l => l.file === 'PERAK-FACTS.md' && l.canonical === 'STATE-FACTS.md'), JSON.stringify(by.perak && by.perak.legacy));
check('F5 perak: missing required files listed (STATE-FACTS.md, DATABASE.md ...)', by.perak && by.perak.missing_files.includes('STATE-FACTS.md') && by.perak.missing_files.includes('DATABASE.md'), '');
check('F6 kedah: missing index.md + reserved CON folder + TKL at root flagged', by.kedah && by.kedah.missing_files.includes('index.md') && by.kedah.flowables.some(f => f.kind === 'reserved-folder' && f.fix === 'CONSENT') && by.kedah.flowables.some(f => f.kind === 'non-root-module-at-root' && f.name === 'KDH_TKL_ST.bpmn20.xml'), JSON.stringify(by.kedah && by.kedah.flowables));
check('F7 kedah: PLP model at root is NOT flagged', by.kedah && !by.kedah.flowables.some(f => f.name === 'KDH_PLP_PT.bpmn20.xml'), '');
check('F8 selangor: missing dirs flowables-bpmn + urusan', by.selangor && by.selangor.missing_dirs.includes('flowables-bpmn') && by.selangor.missing_dirs.includes('urusan'), '');
r = cli(['audit', '--state', 'melaka']);
check('F9 --state filters to one state (table mode)', /melaka/.test(r.out) && !/perak/.test(r.out), r.out.slice(0, 120));

// ---- hook (boot) ----
r = hook(HOOK, '{}');
check('F10 boot hook exits 0 with drift present (advisory, never blocks)', r.code === 0, 'exit=' + r.code);
check('F11 boot hook lists perak legacy + kedah reserved folder', /PERAK-FACTS\.md→STATE-FACTS\.md/.test(r.out) && /CON \[reserved-folder → CONSENT\]/.test(r.out), r.out.slice(0, 300));
r = hook(HOOK, 'not json at all');
check('F12 boot hook survives malformed stdin', r.code === 0, 'exit=' + r.code);
r = hook(HOOK, '{}', { ...ENV, KNOWLEDGE_ROOT: path.join(TMP, 'nowhere') });
check('F13 boot hook silent when no knowledge tree (worktree without projects/)', r.code === 0 && !/knowledge-schema-audit/.test(r.out), r.out.slice(0, 120));

// ---- scaffold ----
r = cli(['scaffold', '--state', 'selangor', '--dry']);
check('F14 scaffold --dry creates nothing', r.code === 0 && !fs.existsSync(path.join(K, 'selangor', 'index.md')), r.out.slice(0, 120));
r = cli(['scaffold', '--state', 'selangor']);
const sf = path.join(K, 'selangor', 'STATE-FACTS.md');
check('F15 scaffold creates every missing required file + dirs', fs.existsSync(path.join(K, 'selangor', 'index.md')) && fs.existsSync(sf) && fs.existsSync(path.join(K, 'selangor', 'urusan')) && fs.existsSync(path.join(K, 'selangor', 'flowables-bpmn')), r.out.slice(0, 200));
check('F16 scaffold skeleton carries the UNVERIFIED-FOR-SELANGOR banner + melaka headings', /UNVERIFIED-FOR-SELANGOR/.test(fs.readFileSync(path.join(K, 'selangor', 'BUG-BESTIARY.md'), 'utf8')) && /## Section A/.test(fs.readFileSync(path.join(K, 'selangor', 'BUG-BESTIARY.md'), 'utf8')), '');
check('F17 scaffold never overwrites (DATABASE.md untouched)', fs.readFileSync(path.join(K, 'selangor', 'DATABASE.md'), 'utf8') === '# db', '');
r = cli(['audit', '--state', 'selangor']);
check('F18 selangor canonical after scaffold', r.code === 0 && /✅ canonical/.test(r.out), r.out.slice(0, 160));
r = cli(['scaffold', '--state', 'nope']);
check('F19 scaffold refuses unknown state', r.code === 2, 'exit=' + r.code);

// ---- write-time hook ----
const wi = (fp) => JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: fp, content: 'x' } });
r = hook(WHOOK, wi(path.join(K, 'perak', 'PERAK-FACTS.md')));
check('F20 write hook: legacy name → advisory naming STATE-FACTS.md, exit 0', r.code === 0 && /STATE-FACTS\.md/.test(r.out), r.out.slice(0, 200));
r = hook(WHOOK, wi(path.join(K, 'perak', 'RANDOM-NOTES.md')));
check('F21 write hook: new non-canonical .md → advisory mentions index.md', r.code === 0 && /index\.md/.test(r.out), r.out.slice(0, 200));
r = hook(WHOOK, wi(path.join(K, 'melaka', 'DATABASE.md')));
check('F22 write hook: canonical file → silent', r.code === 0 && !/knowledge-schema-audit/.test(r.out), r.out.slice(0, 120));
r = hook(WHOOK, wi(path.join(K, 'melaka', 'flowables-bpmn', 'CON', 'MLK_CON_X.bpmn20.xml')));
check('F23 write hook: reserved CON folder → advisory CONSENT', /CONSENT/.test(r.out), r.out.slice(0, 200));
r = hook(WHOOK, wi(path.join(K, 'melaka', 'flowables-bpmn', 'MLK_TKL_ST.bpmn20.xml')));
check('F24 write hook: TKL model at root → advisory TKL/', /TKL\//.test(r.out), r.out.slice(0, 200));
r = hook(WHOOK, wi('C:/somewhere/else/DATABASE.md'));
check('F25 write hook: path outside etanah-knowledge → silent', r.code === 0 && !/knowledge-schema-audit/.test(r.out), '');
r = hook(WHOOK, '{"hook_event_name":"PreToolUse","tool_input":{}}');
check('F26 write hook: no file_path → silent exit 0', r.code === 0 && !/knowledge-schema-audit/.test(r.out), '');

// ═══ ADVERSARIAL SCENARIOS (Rule 12) — verdicts:
//  1 own text in transcript: n/a (no transcript read) — handled by design
//  2 malformed stdin: F12/F26 — handled
//  3 worktree vs main: knowledgeRoot() strips .claude/worktrees; F13 covers a tree-less root — handled
//  4 eval-sandbox copy: lib resolved via __dirname (adjacent) + hook-runtime via ROOT — handled
//  5 bundle vs direct: direct registration only — accepted-risk
//  6 concurrent sessions: read-only audit, scaffold never overwrites (F17) — handled
//  7 schema file deleted: both hooks go silent (try/catch) instead of crashing — handled (F13 analogue)
//  8 bypass tokens: none exist (advisory-only) — n/a
//  9 huge tree: readdir per state only, no recursion beyond flowables root — handled
// 10 inversion risk: an extra listed in index.md is NOT drift (F3) so legitimate topic files stay allowed — handled

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nknowledge-schema-audit.eval: ' + (results.length - failed) + '/' + results.length + ' green');
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
