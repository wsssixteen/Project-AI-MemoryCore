#!/usr/bin/env node
// lib/states.eval.js — fixtures for the state registry resolver (born 2026-09-04).
// Replay it kills: ticket-gate.js:89 silently defaulted to melaka in every worktree (projects/ absent), and
// knowledge-first-gate / branch-guard / adhoc-register / alter-ticket-gate each carried their own melaka literal.
// Sandboxed: a temp copy of system/states.json + a fake home with 1. Tasks/{Melaka,Perak,Putrajaya}.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const SB = fs.mkdtempSync(path.join(os.tmpdir(), 'states-eval-'));
const sys = path.join(SB, 'system'); fs.mkdirSync(sys, { recursive: true });
fs.copyFileSync(path.join(REPO, 'system', 'states.json'), path.join(sys, 'states.json'));
fs.writeFileSync(path.join(sys, 'states.local.json'), JSON.stringify({ tasks_root_override: path.join(SB, 'home', '1. Tasks'), states: { perak: { hosts: { prod: 'https://prod.example' } } } }));
for (const d of ['Melaka', 'Perak', 'Putrajaya']) fs.mkdirSync(path.join(SB, 'home', '1. Tasks', d, '0. Brief'), { recursive: true });
process.env.STATES_ROOT = SB;
process.env.STATES_FILE = path.join(sys, 'states.json');
process.env.STATES_LOCAL_FILE = path.join(sys, 'states.local.json');
delete process.env.ETANAH_STATE;
const S = require(path.join(REPO, 'lib', 'states.js'));

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name + (detail ? '  — ' + detail : '')); } }
const cli = (...a) => spawnSync(process.execPath, [path.join(REPO, 'lib', 'states.js'), ...a], { encoding: 'utf8', env: process.env, windowsHide: true });

// F1 registry loads + overlay merged (local hosts present, base fields intact)
const perak = S.get('perak');
check('F1 overlay deep-merges (perak.hosts.prod from local, code from base)', perak && perak.hosts && perak.hosts.prod === 'https://prod.example' && perak.code === 'PRK');
// F2 get() by key / alias / code / prefix / full permohonan id
check('F2 get by alias "Putrajaya" → wp', S.get('Putrajaya') && S.get('Putrajaya').key === 'wp');
check('F2b get by code "SGR" → selangor', S.get('SGR') && S.get('SGR').key === 'selangor');
check('F2c get by full id "PTPK/07/E/PSBP/2022/2" → perak', S.get('PTPK/07/E/PSBP/2022/2') && S.get('PTPK/07/E/PSBP/2022/2').key === 'perak');
check('F2d unknown alias → null (no default)', S.get('Johor') === null);
// F3 resolve cascade — explicit beats everything
let r = S.resolve({ state: 'perak', activeBlock: 'state=Melaka\n', text: 'PTMLK/01/L/PT/2026/1' });
check('F3 explicit outranks active.txt + prefix', r.state === 'perak' && r.src === 'explicit');
// F4 active.txt state= beats prefix in text (the #275847 F10 shape: a Perak ticket quoting a Melaka id)
r = S.resolve({ activeBlock: 'qa=QA-275847\nstate=Perak\ntask_folder=x\n', text: 'compare with PTMLK/03/L/MCL/2026/4' });
check('F4 active.txt state= outranks a foreign prefix in the text', r.state === 'perak' && /active\.txt state=/.test(r.src));
// F5 task_folder path segment resolves — Putrajaya folder → wp (disk name ≠ state key)
r = S.resolve({ activeBlock: { task_folder: path.join(SB, 'home', '1. Tasks', 'Putrajaya', '3. ES #274509 - x') } });
check('F5 Task folder "Putrajaya" → wp (folder name ≠ key)', r.state === 'wp', JSON.stringify(r));
// F6 repo path → state + trunk
const t = S.trunkForRepo('E:\\Projects\\Perak\\etanah-pelupusan\\src\\main\\java\\X.java');
check('F6 trunkForRepo Perak pelupusan → master', t && t.state === 'perak' && t.trunk === 'master' && t.module === 'pelupusan', JSON.stringify(t));
const t2 = S.trunkForRepo('E:/Projects/Melaka/etanah-spoc-hasil/x');
check('F6b trunkForRepo Melaka spoc-hasil → master (per-module trunk)', t2 && t2.trunk === 'master');
const t3 = S.trunkForRepo('E:/Projects/Melaka/etanah-awam/pom.xml');
check('F6c trunkForRepo Melaka awam → mlk/master', t3 && t3.trunk === 'mlk/master');
check('F6d trunkForRepo outside any repos_root → null', S.trunkForRepo('C:/Users/x/etanah-pelupusan/a.java') === null);
// F7 prefix in free text
r = S.resolve({ text: 'boleh alter PTPK/07/E/PSBP/2022/2 ke SPI' });
check('F7 permohonan prefix in text → perak', r.state === 'perak' && /prefix/.test(r.src));
// F8 nothing → null with tried[], never melaka
r = S.resolve({ text: 'tolong check tiket 275847' });
check('F8 unknown → state null, src unknown (no silent melaka)', r.state === null && r.src === 'unknown' && Array.isArray(r.tried));
let threw = false; try { S.requireState({ text: 'nothing here' }); } catch (e) { threw = /UNKNOWN/.test(e.message); }
check('F9 requireState throws loudly with UNKNOWN', threw);
// F10 env ETANAH_STATE is honoured (below explicit)
process.env.ETANAH_STATE = 'selangor';
r = S.resolve({ text: 'PTMLK/01/L/PT/2026/1' });
check('F10 env ETANAH_STATE outranks prefix', r.state === 'selangor');
delete process.env.ETANAH_STATE;
// F11 paths: taskFolder uses overlay tasks_root_override; kedah has none
check('F11 taskFolder(melaka) under overridden tasks root', S.taskFolder('melaka') === path.join(SB, 'home', '1. Tasks', 'Melaka'));
check('F11b taskFolder(kedah) → null (no Task folder)', S.taskFolder('kedah') === null);
// F12 knowledgeDir is main-repo aware from a worktree path
const kd = S.knowledgeDir('perak', 'C:/x/Project-AI-MemoryCore/.claude/worktrees/abc');
check('F12 knowledgeDir strips the worktree segment', /Project-AI-MemoryCore[\\/]projects[\\/]coding-projects[\\/]active[\\/]etanah-knowledge[\\/]perak$/.test(kd) && !/worktrees/.test(kd), kd);
// F13 regexes
const kr = S.knowledgeReadRegex();
check('F13 knowledgeReadRegex matches perak + melaka + wp reads', kr.test('read projects/coding-projects/active/etanah-knowledge/perak/STATE-FACTS.md') && kr.test('etanah-knowledge\\melaka\\DATABASE.md') && kr.test('etanah-knowledge/wp/index.md'));
check('F13b knowledgeReadRegex rejects a non-state folder', !kr.test('etanah-knowledge/session-notes/x.md'));
const fk = S.knowledgeReadRegex('FLOWABLE-KNOWLEDGE.md');
check('F13c file-specific regex: FLOWABLE-KNOWLEDGE.md only', fk.test('etanah-knowledge/melaka/FLOWABLE-KNOWLEDGE.md') && !fk.test('etanah-knowledge/melaka/DATABASE.md'));
const pr = S.permohonanRegex();
check('F13d permohonanRegex matches every registered prefix, not PTJHR', 'PTMLK/01/L/PT/2026/1 PTPK/07/E/PSBP/2022/2'.match(pr).length === 2 && !'PTJHR/01/L/PT/2026/1'.match(pr));
// F14 excluded state (TRG guardrail)
check('F14 isExcluded(terengganu) true, melaka false', S.isExcluded('terengganu') && !S.isExcluded('melaka'));
// F15 mcp lookup
check('F15 mcp(perak) → oracle-prk-prod (primary), mcp(melaka,"stg1") → postgres-mlkstg1-pg', S.mcp('perak') === 'oracle-prk-prod' && S.mcp('melaka', 'stg1') === 'postgres-mlkstg1-pg');
// F16 CLI: list / show / resolve exit codes
let c = cli('list'); check('F16 CLI list prints 6 states', c.status === 0 && c.stdout.split('\n').filter(Boolean).length === 6, c.stdout.slice(0, 120) + c.stderr);
c = cli('resolve', 'PTPK/07/E/PSBP/2022/2'); check('F16b CLI resolve → perak exit 0', c.status === 0 && /"state": "perak"/.test(c.stdout));
c = cli('resolve', 'no id here'); check('F16c CLI resolve unknown → exit 1', c.status === 1);
// F17 add / remove round-trip on the sandbox registry
c = cli('add', 'johor', '--code', 'JHR', '--prefix', 'PTJHR', '--label', 'Johor');
check('F17 add johor', c.status === 0 && /added johor/.test(c.stdout), c.stderr);
S.reload();
check('F17b johor resolvable by prefix after add; scope=scaffold', S.get('PTJHR') && S.get('PTJHR').work_scope === 'scaffold');
c = cli('remove', 'melaka'); check('F17c remove reference state refused', c.status === 2 && /reference state/.test(c.stderr));
c = cli('remove', 'perak'); check('F17d remove active state without --force refused', c.status === 2 && /--force/.test(c.stderr));
c = cli('remove', 'johor'); check('F17e remove johor ok', c.status === 0);
S.reload(); check('F17f johor gone', S.get('johor') === null);
// F18 check(): a fixture tree with one unrouted, one routed, one declared, one eval file
const fx = fs.mkdtempSync(path.join(os.tmpdir(), 'states-check-'));
fs.mkdirSync(path.join(fx, 'domain', 'a'), { recursive: true }); fs.mkdirSync(path.join(fx, 'lib'), { recursive: true });
fs.writeFileSync(path.join(fx, 'domain', 'a', 'x.check.hook.js'), "const REL = path.join('etanah-knowledge', 'melaka', 'X.md');\nconst T='1. Tasks\\\\Melaka';\n");
fs.writeFileSync(path.join(fx, 'domain', 'a', 'y.check.hook.js'), "const states = require(path.join(ROOT,'lib','states.js'));\n// docs: 1. Tasks\\Melaka\n");
fs.writeFileSync(path.join(fx, 'domain', 'a', 'z.js'), "// state-scoped: yes, melaka-only by design (release train)\nconst B='mlk/master';\n");
fs.writeFileSync(path.join(fx, 'domain', 'a', 'x.eval.js'), "const P='E:\\\\Projects\\\\Melaka\\\\etanah-pelupusan';\n");
const ck = S.check({ root: fx });
check('F18 check classifies unrouted/routed/declared/eval', ck.summary.unrouted === 1 && ck.summary.routed === 1 && ck.summary.declared === 1 && ck.summary.eval === 1, JSON.stringify(ck.summary));
check('F18b unrouted row names file:line + kind', ck.rows.some(r => /x\.check\.hook\.js$/.test(r.file) && r.line === 1 && r.kind === 'knowledge-dir'));
// F19 real repo check runs and returns a number (baseline visibility)
const real = S.check({ root: REPO });
check('F19 real-repo check runs (sites=' + real.summary.sites + ', unrouted files=' + real.summary.unrouted + ')', typeof real.summary.sites === 'number');
// F20 validate(): record with no repo/task → rows "—", never ✗ for absent-by-design
const v = S.validate('kedah');
check('F20 validate(kedah): task_folder "—" (absent by design), knowledge_dir checked', v.rows.some(r => r[0] === 'task_folder' && r[1] === '—'));
// F21 malformed local overlay is ignored, base still loads
fs.writeFileSync(path.join(sys, 'states.local.json'), '{ not json');
S.reload();
check('F21 malformed states.local.json ignored (base loads)', S.get('melaka') && S.get('melaka').code === 'MLK');
// F22 a path that only CONTAINS the word Melaka (not a Task/repo segment) does not resolve
check('F22 "C:/docs/Melaka-notes.txt" → null (no false path match)', S.stateForPath('C:/docs/Melaka-notes.txt') === null);

console.log(`\n${pass}/${pass + fail} passed`);
try { fs.rmSync(SB, { recursive: true, force: true }); fs.rmSync(fx, { recursive: true, force: true }); } catch (_) {}
process.exit(fail ? 1 : 0);
