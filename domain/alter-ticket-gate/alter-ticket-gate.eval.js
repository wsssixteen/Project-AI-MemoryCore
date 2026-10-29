#!/usr/bin/env node
// alter-ticket-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: #275847 2026-09-04 Perak — Ammar "can help alter to SPI Semakan Permohonan"; quest hard-coded melaka
// knowledge. #277926 2026-09-03 Melaka — Initiate&Alter picked the wrong SKM twin by name.
// Fixtures run in a SANDBOX (temp active.txt + Task folder + transcript + knowledge dir) via env overrides.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'alter-ticket-gate.check.hook.js');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');

const sb = fs.mkdtempSync(path.join(os.tmpdir(), 'alter-gate-'));
const know = path.join(sb, 'etanah-knowledge');
fs.mkdirSync(path.join(know, 'perak'), { recursive: true });
fs.mkdirSync(path.join(know, 'melaka'), { recursive: true });
fs.writeFileSync(path.join(know, 'ALTER-TICKET-PLAYBOOK.md'), '# playbook');
fs.writeFileSync(path.join(know, 'perak', 'FLOWABLE-ALTER.md'), '# perak');
fs.writeFileSync(path.join(know, 'melaka', 'FLOWABLE-KNOWLEDGE.md'), '# melaka');
const perakFolder = path.join(sb, '1. Tasks', 'Perak', '2. II #275847 - HSPS (PROD)');
const melakaFolder = path.join(sb, '1. Tasks', 'Melaka', '177. II #277926 - MCL (PROD)');
const plainFolder = path.join(sb, '1. Tasks', 'Melaka', '99. QA #262004 - template');
for (const f of [perakFolder, melakaFolder, plainFolder]) fs.mkdirSync(path.join(f, '0. Brief'), { recursive: true });
fs.writeFileSync(path.join(perakFolder, '0. Brief', 'History.txt'), '--- 2026-09-03 by Ammar Zakwan ---\n  notes:\n    Hi Ridhwan can help alter to SPI Semakan Permohonan\n');
fs.writeFileSync(path.join(perakFolder, '0. Brief', 'Description.txt'), 'ID Permohonan : PTPK/07/E/PSBP/2022/2(DS)\n');
fs.writeFileSync(path.join(melakaFolder, '0. Brief', 'Description.txt'), 'ID permohonan tidak papar pada dashboard user. PTMLK/03/L/MCL/2026/4\n');
fs.writeFileSync(path.join(plainFolder, '0. Brief', 'Description.txt'), 'Template surat: alternative wording; the docx was altered by BA. Please fix the alignment.\n');
const active = [
  `qa=QA-275847\ntask_folder=${perakFolder}\nstatus=blocked\nissue_one_liner=HSPS - Patch Maklumat bagi Tempat dan Taraf Hakmilik\nstate=Perak\n`,
  `qa=QA-277926\ntask_folder=${melakaFolder}\nstatus=active\nissue_one_liner=MCL - ID permohonan tidak papar\n`,
  `qa=QA-262004\ntask_folder=${plainFolder}\nstatus=active\nissue_one_liner=Template alignment\n`,
].join('\n');
const activePath = path.join(sb, 'active.txt');
fs.writeFileSync(activePath, active);
// 2026-10-29 (goal 2): Internal Issue (PROD) alter tickets — archived block, disk-only folder, non-alter II, truncated subject, ES on STG
const mArch = path.join(sb, '1. Tasks', 'Melaka', 'Archive');
const iiAlter = path.join(mArch, '329. II #286988 - Pelupusan - PLPS - Request Untuk Alter Tugasan ke Penyediaan Laporan T (PROD)');
const iiDiskOnly = path.join(sb, '1. Tasks', 'Melaka', '310. II #285680 - Pelupusan - PRBB - Request untuk Alter ke Tugasan Penyediaan Rencana J (PROD)');
const iiPlain = path.join(mArch, '168. II #277147 - Pelupusan - Surat Jabatan Teknikal Tidak Papar 7 Bilangan (PROD)');
const iiCut = path.join(mArch, '400. II #290001 - Pelupusan - PT - Request Untuk Alter (PROD)');
const esStg = path.join(sb, '1. Tasks', 'Melaka', '323. ES #286650 - Pendafataran - PLTP - Semakan Permohonan - Seterusnya Papar Ralat');
const iiStgFolder = path.join(sb, '1. Tasks', 'Melaka', '157. II #276436 - MLKSTG - PPTPB - SKM - tolong alter ke SKM');
for (const f of [iiAlter, iiDiskOnly, iiPlain, iiCut, esStg, iiStgFolder]) fs.mkdirSync(path.join(f, '1. Brief'), { recursive: true });
const archivePath = path.join(sb, 'active-archive.txt');
fs.writeFileSync(archivePath, [`qa=QA-286988\ntask_folder=${iiAlter}\nstatus=archived\n`, `qa=QA-277147\ntask_folder=${iiPlain}\nstatus=archived\n`, `qa=QA-290001\ntask_folder=${iiCut}\nstatus=archived\n`].join('\n'));
fs.appendFileSync(activePath, `\nqa=QA-286650\ntask_folder=${esStg}\nstatus=delegated\n\nqa=QA-276436\ntask_folder=${iiStgFolder}\nstatus=active\n`);

function transcript(lines) { const p = path.join(sb, 'transcript-' + Math.random().toString(36).slice(2) + '.jsonl'); fs.writeFileSync(p, lines.join('\n') + '\n'); return p; }
const asst = t => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: t }] } });
const readTool = f => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read', input: { file_path: f } }] } });
const user = t => JSON.stringify({ type: 'user', message: { content: t } });

function run(payload, extraEnv) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: typeof payload === 'string' ? payload : JSON.stringify(payload), encoding: 'utf8', timeout: 30000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT, ALTER_GATE_ACTIVE_PATH: activePath, ALTER_GATE_ARCHIVE_PATH: archivePath, ALTER_GATE_TASKS_ROOT: path.join(sb, '1. Tasks'), ALTER_GATE_KNOWLEDGE_ROOT: know, ...(extraEnv || {}) },
  });
  return { out: (r.stdout || '') + (r.stderr || ''), status: r.status };
}
const fired = o => /ALTER-TICKET GATE/.test(o.out);
const reminder = o => /ALTER layer already loaded/.test(o.out);
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1 clean
let r = run('{}'); check('F1 clean stdin → exit 0, silent', r.status === 0 && !fired(r), 'exit=' + r.status);
// F2 REPLAY #275847 — ticket mention + alter in the BRIEF (History) → fires, state perak, names the perak file
r = run({ prompt: 'Ruri, please retrieve ticket 275847 and start quest until finish', transcript_path: transcript([user('x')]) });
check('F2 replay #275847 fires (signal in ticket brief)', fired(r) && /state=perak/.test(r.out) && /perak\/FLOWABLE-ALTER\.md/.test(r.out) && /active\.txt state=/.test(r.out) && /in ticket brief/.test(r.out), r.out.slice(0, 200));
// F3 Melaka #277926 — the ticket text never says alter; OUR prior turn concluded "Initiate & Alter" → fires (solution-type trigger)
r = run({ prompt: 'ok continue 277926', transcript_path: transcript([asst('Rubric: recovery = Initiate & Alter on the Alter page, target SKM.')]) });
check('F3 solution-type trigger from a prior assistant turn (melaka via Task folder)', fired(r) && /state=melaka/.test(r.out) && /prior turn/.test(r.out), r.out.slice(0, 200));
// F4 ticket with NO alter signal anywhere → silent
r = run({ prompt: 'let us start with 262004', transcript_path: transcript([asst('Reading the template now.')]) });
check('F4 no alter signal → silent ("alternative"/"altered by BA" must not match)', !fired(r) && !reminder(r), r.out.slice(0, 120));
// F5 bypass token in prompt
r = run({ prompt: 'retrieve 275847 [skip-alter-gate: already ran the layer, just closing]', transcript_path: transcript([]) });
check('F5 bypass token honoured', !fired(r) && /bypassed/.test(r.out), r.out.slice(0, 120));
// F6 self-disarm: the gate's OWN advisory (which names the playbook + says "alter") in the transcript must NOT count as a read
// AND must not itself be the trigger source.
const ownText = '🔀 ALTER-TICKET GATE — QA #275847 · state=perak … 1. projects/coding-projects/active/etanah-knowledge/ALTER-TICKET-PLAYBOOK.md … Initiate & Alter …';
r = run({ prompt: 'continue 262004', transcript_path: transcript([JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: ownText }] } })]) });
check('F6 own advisory text is neither a trigger nor a "playbook read"', !fired(r) && !reminder(r), r.out.slice(0, 120));
// F7 already read → one-line reminder, not the full block
r = run({ prompt: 'now do the alter for 275847', transcript_path: transcript([readTool('C:/x/etanah-knowledge/ALTER-TICKET-PLAYBOOK.md'), asst('Read the playbook.')]) });
check('F7 playbook read this session → reminder only', reminder(r) && !fired(r), r.out.slice(0, 120));
// F8 malformed stdin → exit 0 silent
r = run('{not json'); check('F8 malformed JSON stdin → exit 0, silent', r.status === 0 && !fired(r), 'exit=' + r.status);
// F9 missing active.txt + no transcript → ad-hoc relay with permohonan id + alter still fires by ID prefix
r = run({ prompt: 'BA WhatsApp: tolong alter PTPK/07/E/PT/2023/154 ke tugasan Semakan Permohonan' }, { ALTER_GATE_ACTIVE_PATH: path.join(sb, 'nope.txt') });
check('F9 ad-hoc relay, no ticket, no active.txt → fires, state by PTPK prefix', fired(r) && /state=perak/.test(r.out) && /ad-hoc/.test(r.out) && /permohonan-ID prefix/.test(r.out), r.out.slice(0, 200));
// F9b (2026-10-03) the 7-segment Terengganu id counts as context: ad-hoc relay fires, state by PTTRG prefix
r = run({ prompt: 'tolong alter tugasan PTTRG/02/01/L/PT/2026/343' }, { ALTER_GATE_ACTIVE_PATH: path.join(sb, 'nope.txt') });
check('F9b ad-hoc relay with a 7-segment PTTRG id → fires, state=terengganu', fired(r) && /state=terengganu/.test(r.out) && /permohonan-ID prefix/.test(r.out), r.out.slice(0, 200));
// F9c the 6-segment Melaka id still fires, state by PTMLK prefix (unchanged)
r = run({ prompt: 'tolong alter tugasan PTMLK/02/L/PT/2026/343' }, { ALTER_GATE_ACTIVE_PATH: path.join(sb, 'nope.txt') });
check('F9c ad-hoc relay with a 6-segment PTMLK id → fires, state=melaka', fired(r) && /state=melaka/.test(r.out), r.out.slice(0, 200));
// F10 Task-folder state beats a foreign prefix in the text (a Perak ticket quoting a Melaka id)
r = run({ prompt: 'ticket 275847 — compare with PTMLK/03/L/MCL/2026/4 and alter ke SPI', transcript_path: transcript([]) });
check('F10 Task folder (Perak) outranks PTMLK prefix in the prompt', fired(r) && /state=perak/.test(r.out), r.out.slice(0, 160));
// F11 unknown state → asks, never defaults to melaka
r = run({ prompt: 'please alter PTXX/01/L/PT/2026/1 to Semakan Permohonan' }, { ALTER_GATE_ACTIVE_PATH: path.join(sb, 'nope.txt') });
check('F11 unknown prefix → state=unknown + ask line, no melaka default', fired(r) && /state=unknown/.test(r.out) && /never default to Melaka/.test(r.out), r.out.slice(0, 160));
// F12 missing state file → the advisory says so (selangor not written)
r = run({ prompt: 'tolong alter ID PTSGR/01/L/PT/2026/3 ke tugasan KM' }, { ALTER_GATE_ACTIVE_PATH: path.join(sb, 'nope.txt') });
check('F12 state file absent → ⚠️ FILE MISSING surfaced', fired(r) && /state=selangor/.test(r.out) && /FILE MISSING/.test(r.out), r.out.slice(0, 160));
// F13 huge transcript (2 MB of noise + one late alter line) → still fires within timeout
const big = Array.from({ length: 4000 }, (_, i) => asst('noise line ' + i + ' ' + 'x'.repeat(400)));
big.push(asst('Fix shape: Alter Flow Flowable to node sid-DC02FA30.'));
r = run({ prompt: 'continue 277926', transcript_path: transcript(big) });
check('F13 2MB transcript → fires (tail scan), no timeout', fired(r) && r.status === 0, 'exit=' + r.status);
// F14 effect check (Rule 6c): the block carries the 7 rows + both file paths + bypass hint
r = run({ prompt: 'retrieve 275847', transcript_path: transcript([]) });
check('F14 effect — A0..A6 rows + playbook + state file + bypass rendered', ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'].every(a => new RegExp('\\b' + a + ' ⬜').test(r.out)) && /ALTER-TICKET-PLAYBOOK\.md/.test(r.out) && /skip-alter-gate/.test(r.out), r.out.slice(0, 120));
// F21 (2026-09-30, #282555) A5 carries the assignee rule: agihan default, never pin via nextUser
check('F21 A5 says assignee = agihan default, never nextUser', /ASSIGNEE = agihan default/.test(r.out) && /NEVER add nextUser/.test(r.out), r.out.slice(0, 120));
// F22 (2026-09-30, #282555) A6 points to miya's voice memory + fill-if-exists field rule, no Perak 5-line block
check('F22 A6 = miya voice memory + fill-if-exists', /feedback_ticket_writing_style/.test(r.out) && /fill every field that exists/.test(r.out) && !/done-alter 5-line block/.test(r.out), r.out.slice(0, 120));
// F23 (2026-10-21, /goal) Perak keeps the runbook-for-miya A5; Melaka A5 = run it yourself with alter.js + approval code
check('F23a Perak A5 = runbook for miya, no alter.js run line', /A5 ⬜ RUNBOOK for みや/.test(r.out) && !/RUN IT YOURSELF/.test(r.out), r.out.slice(0, 160));
r = run({ prompt: 'tolong alter tugasan PTMLK/02/L/PT/2026/343' }, { ALTER_GATE_ACTIVE_PATH: path.join(sb, 'nope.txt') });
check('F23b Melaka A5 = alter.js dry-run → approval code → --approve, AFTER check, keeper login', /A5 ⬜ RUN IT YOURSELF/.test(r.out) && /--dry-run/.test(r.out) && /--approve <code>/.test(r.out) && /keeper\.js --login --env prod/.test(r.out) && /ASSIGNEE = agihan default/.test(r.out), r.out.slice(0, 300));
// F24 (2026-10-28, alter-sim) Melaka A1 names the no-page engine read; Perak A1 does not
check('F24a Melaka A1 = alter.js live (engine read, no page)', /A1 ⬜ [^\n]*alter\.js live --env <stg\|mlit> --id <ID>/.test(r.out) && /NOT CONSISTENT/.test(r.out), r.out.slice(0, 300));
r = run({ prompt: 'retrieve 275847', transcript_path: transcript([]) });
check('F24b Perak A1 carries no alter.js live line', /A1 ⬜/.test(r.out) && !/alter\.js live/.test(r.out), r.out.slice(0, 160));
r = run({ prompt: 'tolong alter tugasan PTMLK/02/L/PT/2026/343', transcript_path: transcript([readTool('C:/x/etanah-knowledge/ALTER-TICKET-PLAYBOOK.md')]) }, { ALTER_GATE_ACTIVE_PATH: path.join(sb, 'nope.txt') });
check('F23c Melaka reminder (env unknown) names alter.js approval for PROD and the runner for STG/MLIT', reminder(r) && /env=unknown\) = PROD: alter\.js --dry-run/.test(r.out) && /headless runner/.test(r.out), r.out.slice(0, 260));
// ---- 2026-10-29 goal 2: tracker Internal Issue (PROD) + alter ask ----
const noRunnerWithProd = o => !/run\.ps1|headless runner/.test(o.out);
r = run({ prompt: '286988', transcript_path: transcript([user('x')]) });
check('G1 bare number, block only in active-archive.txt, II (PROD) alter folder → fires, tracker + env=prod', fired(r) && /tracker=Internal Issue \(PROD\)/.test(r.out) && /env=prod \(from Task folder name\)/.test(r.out) && /in ticket brief/.test(r.out), r.out.slice(0, 260));
check('G2 env=prod A5 = alter.js approval code only; the runner is never offered for PROD', /A5 ⬜ RUN IT YOURSELF \(env=prod\)/.test(r.out) && /--approve <code>/.test(r.out) && noRunnerWithProd(r), r.out.slice(0, 400));
r = run({ prompt: 'let us start with 285680', transcript_path: transcript([user('x')]) });
check('G3 no block anywhere, Task folder on disk only → fires (first prompt before redmine-sync)', fired(r) && /tracker=Internal Issue \(PROD\)/.test(r.out), r.out.slice(0, 200));
r = run({ prompt: 'start 277147', transcript_path: transcript([user('x')]) });
check('G4 II (PROD) with no alter word in subject/brief → silent (data patches and code bugs share the tracker)', !fired(r) && !reminder(r), r.out.slice(0, 160));
r = run({ prompt: 'retrieve 290001', transcript_path: transcript([user('x')]) });
check('G5 subject cut right after "Request Untuk Alter" → fires', fired(r) && /env=prod/.test(r.out), r.out.slice(0, 200));
r = run({ prompt: '286650 alter PTMLK/02/L/PLTP/2026/13 on stg', transcript_path: transcript([user('x')]) });
check('G6 ES ticket, "on stg" in prompt → env=stg; A5 = runner (Alter Flow) + alter.js/Edge (Init&Alter); no PROD approval row', fired(r) && /env=stg \(from prompt\)/.test(r.out) && /run\.ps1 alter-flow --env <stg\|mlit>/.test(r.out) && /Edge mode/.test(r.out) && !/--approve <code>/.test(r.out) && !/tracker=/.test(r.out), r.out.slice(0, 400));
r = run({ prompt: 'continue 276436', transcript_path: transcript([user('x')]) });
check('G7 MLKSTG in the Task folder name → env=stg', fired(r) && /env=stg \(from Task folder name\)/.test(r.out), r.out.slice(0, 200));
r = run({ prompt: '286988 but do it on stg first', transcript_path: transcript([user('x')]) });
check('G8 "stg" in the prompt on a PROD-folder ticket → env=prod+stg, BOTH rows (the approval-code row is never hidden)', fired(r) && /env=prod\+stg \(from prompt \+ Task folder name\)/.test(r.out) && /--approve <code>/.test(r.out) && /run\.ps1 alter-flow/.test(r.out), r.out.slice(0, 300));
r = run({ prompt: '286988 stg has no process for it, so do it on prod now', transcript_path: transcript([user('x')]) });
check('G13 prompt names prod AND stg → env=prod+stg, both rows (Fable audit 2 case)', fired(r) && /env=prod\+stg/.test(r.out) && /--approve <code>/.test(r.out), r.out.slice(0, 300));
r = run({ prompt: 'II #286988 alter semula ke PLT di staging', transcript_path: transcript([user('x')]) });
check('G14 PROD tracker + "staging" in the prompt → prod row still printed', fired(r) && /tracker=Internal Issue \(PROD\)/.test(r.out) && /--approve <code>/.test(r.out), r.out.slice(0, 300));
r = run({ prompt: 'Gary: alter 07MH412/2026 back to KM' }, { ALTER_GATE_ACTIVE_PATH: path.join(sb, 'nope.txt') });
check('G15 serahan-id relay with no "please" → fires ("alter <serahan>" is an ask)', fired(r), r.out.slice(0, 160));
r = run({ prompt: '286988', transcript_path: transcript([user('x')]) });
check('G16 header names where the block came from (active-archive.txt, not active.txt)', fired(r) && /from active-archive\.txt|from the Task folder on disk|from permohonan|from Task folder/.test(r.out) && !/from active\.txt task_folder/.test(r.out), r.out.slice(0, 200));
r = run({ prompt: '286988', transcript_path: transcript([readTool('C:/x/etanah-knowledge/ALTER-TICKET-PLAYBOOK.md')]) });
check('G9 reminder on a PROD II ticket = alter.js approval, no runner', reminder(r) && /env=prod\) = PROD: alter\.js --dry-run/.test(r.out) && noRunnerWithProd(r), r.out.slice(0, 260));
r = run({ prompt: '286650 alter PTMLK/02/L/PLTP/2026/13 on stg', transcript_path: transcript([readTool('C:/x/etanah-knowledge/ALTER-TICKET-PLAYBOOK.md')]) });
check('G10 reminder on STG = runner for Alter Flow', reminder(r) && /env=stg\) = STG\/MLIT Alter Flow: headless runner/.test(r.out) && !/APPROVAL CODE/.test(r.out), r.out.slice(0, 260));
r = run({ prompt: 'retrieve 275847', transcript_path: transcript([]) });
check('G11 Perak A5 carries neither the runner nor alter.js', /A5 ⬜ RUNBOOK for みや/.test(r.out) && !/run\.ps1|alter\.js --env/.test(r.out), r.out.slice(0, 200));
const lg = fs.readFileSync(path.join(__dirname, 'log.jsonl'), 'utf8').trim().split('\n').slice(-12).join('\n');
check('G12 log rows carry env + tracker', /"env":"prod"/.test(lg) && /"tracker":"Internal Issue \(PROD\)"/.test(lg), lg.slice(-200));
// ---- real replay against the live disk (skipped when the real Tasks root is absent) ----
const realTasks = (() => { try { return require(path.join(ROOT, 'lib', 'states.js')).tasksRoot(); } catch (_) { return ''; } })();
if (realTasks && fs.existsSync(realTasks)) {
  const realEnv = { ALTER_GATE_ACTIVE_PATH: '', ALTER_GATE_ARCHIVE_PATH: '', ALTER_GATE_TASKS_ROOT: '', ALTER_GATE_KNOWLEDGE_ROOT: '' };
  const runReal = n => { const e = { ...process.env, CLAUDE_PROJECT_DIR: ROOT }; for (const k of Object.keys(realEnv)) delete e[k];
    const x = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt: String(n) }), encoding: 'utf8', timeout: 30000, env: e }); return (x.stdout || '') + (x.stderr || ''); };
  const alters = [280099, 281568, 282555, 282723, 284775, 285680, 286988];
  const hits = alters.filter(n => /ALTER-TICKET GATE/.test(runReal(n)) && /env=prod/.test(runReal(n)));
  check(`R1 real II (PROD) alter tickets on disk → ${hits.length}/${alters.length} fire with env=prod`, hits.length === alters.length, 'missed ' + alters.filter(n => !hits.includes(n)).join(','));
  const plains = [277147, 277346, 281319];
  const fp = plains.filter(n => /ALTER-TICKET GATE/.test(runReal(n)));
  check(`R2 real II (PROD) non-alter tickets → ${fp.length}/${plains.length} fire`, fp.length === 0, 'fired ' + fp.join(','));
}
// F15 non-ticket, non-permohonan chat mentioning alter (e.g. git "alter table") → silent
r = run({ prompt: 'can you alter the table layout in the README?', transcript_path: transcript([]) });
check('F15 "alter" with no ticket/permohonan context → silent', !fired(r) && !reminder(r), r.out.slice(0, 120));
// F16 prior-turn bypass honoured (user said skip earlier in this session)
r = run({ prompt: 'ok 275847 next', transcript_path: transcript([asst('[skip-alter-gate: not an alter, data patch only]')]) });
check('F16 bypass in a prior assistant turn → silent', !fired(r) && !reminder(r), r.out.slice(0, 120));
// F18 Perak page vocabulary in a prior turn ("Flowable Utility Page"), ticket never says alter → fires
r = run({ prompt: 'continue 275847', transcript_path: transcript([asst('Recovery: Initiate Flowable on the Pelupusan Flowable Utility Page, then move the token.')]) });
check('F18 Perak page vocabulary (Utility Page / Initiate Flowable) triggers', fired(r) && /state=perak/.test(r.out), r.out.slice(0, 160));
// F19 relay naming only a DFT serahan id + alter, no ticket, no permohonan id → fires, state unknown (asks)
r = run({ prompt: 'Gary: please alter 07MH412/2026 back to KM' }, { ALTER_GATE_ACTIVE_PATH: path.join(sb, 'nope.txt') });
check('F19 serahan-id-only relay → fires, state=unknown + ask', fired(r) && /state=unknown/.test(r.out), r.out.slice(0, 160));
// F20 playbook Read sits 2 MB BEFORE the tail → still counts as read (reminder mode)
const early = [readTool('C:/x/etanah-knowledge/ALTER-TICKET-PLAYBOOK.md')].concat(Array.from({ length: 4000 }, (_, i) => asst('noise ' + i + ' ' + 'y'.repeat(400))), [asst('Next: Alter Flow Flowable to the SKM node.')]);
r = run({ prompt: 'go 277926', transcript_path: transcript(early) });
check('F20 playbook read beyond the 250 KB tail → reminder, not full block', reminder(r) && !fired(r), r.out.slice(0, 160));
// F17 log row written with state + mode
const logP = path.join(__dirname, 'log.jsonl');
const lastLog = fs.existsSync(logP) ? fs.readFileSync(logP, 'utf8').trim().split('\n').pop() : '';
check('F17 log.jsonl row carries ts/qa/state/signal/mode', /"ts"/.test(lastLog) && /"state"/.test(lastLog) && /"mode"/.test(lastLog), lastLog.slice(0, 120));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nalter-ticket-gate.eval: ' + (results.length - failed) + '/' + results.length + (failed ? ' RED' : ' green'));
try { fs.rmSync(sb, { recursive: true, force: true }); } catch (_) { /* temp */ }
process.exit(failed ? 1 : 0);
