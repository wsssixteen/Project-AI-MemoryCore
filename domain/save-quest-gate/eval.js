#!/usr/bin/env node
// Eval for the save-quest-gate front gate. Runs a sandbox copy of the hook with a stubbed resolver (no Redmine).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REAL_ROOT = path.resolve(__dirname, '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sqg-eval-'));
fs.mkdirSync(path.join(tmp, 'lib'), { recursive: true });
fs.mkdirSync(path.join(tmp, 'domain', 'save-quest-gate'), { recursive: true });
fs.mkdirSync(path.join(tmp, 'domain', 'bundles'), { recursive: true });
for (const f of ['hook-runtime.js', 'dispatch-hooks.js', 'turn-context.js']) {
  try { fs.copyFileSync(path.join(REAL_ROOT, 'lib', f), path.join(tmp, 'lib', f)); } catch (_) {}
}
const HOOK_REL = 'domain/save-quest-gate/save-quest-gate.check.hook.js';
fs.copyFileSync(path.join(__dirname, 'save-quest-gate.check.hook.js'), path.join(tmp, HOOK_REL));
const HOOK = path.join(tmp, HOOK_REL);
const STUB = path.join(tmp, 'stub-resolver.js');
const MARK = path.join(tmp, 'resolver-calls.txt');
const LOG = path.join(tmp, 'gate-log.jsonl');
fs.writeFileSync(STUB, [
  "const fs = require('fs'); const id = process.argv[2];",
  "fs.appendFileSync(process.env.STUB_MARK, id + '\\n');",
  "if (id === 'QA-999999') { setTimeout(() => {}, 20000); return; }",
  "if (id === 'QA-888888') process.exit(1);",
  "if (id === 'QA-777777') { console.log('no verdict here'); return; }",
  "if (/^ADHOC-/.test(id)) { console.log('SAVE-QUEST: ' + id + ' · Redmine = no ticket number · local = active → ADHOC'); console.log('   No Redmine ticket number. Save it with the adhoc-save skill.'); return; }",
  "console.log('SAVE-QUEST: ' + id + ' · Redmine = Closed (Ahmad · 100%) · local = closed → PHASE-2');",
  "console.log('   Redmine is closed. Run Phase 2 archive.');",
].join('\n'));

const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
function env(extra) {
  const e = { ...process.env, CLAUDE_PROJECT_DIR: tmp, SAVE_QUEST_GATE_RESOLVER: STUB, SAVE_QUEST_GATE_LOG: LOG, STUB_MARK: MARK, SAVE_QUEST_GATE_TIMEOUT_MS: '8000', ...extra };
  return e;
}
function run(stdin, extra, hook) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [hook || HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: env(extra) });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || ''), ms: Date.now() - t0 };
}
const P = prompt => JSON.stringify({ prompt });
const calls = () => { try { return fs.readFileSync(MARK, 'utf8').split('\n').filter(Boolean); } catch (_) { return []; } };
const resetCalls = () => { try { fs.unlinkSync(MARK); } catch (_) {} };
const fires = o => o.includes('SAVE-QUEST GATE: close/save quest asked. Do these in this turn, in order.');
const FENCE = String.fromCharCode(96).repeat(3);
const TICK = String.fromCharCode(96);

// Fires
const fireCases = [
  ['close quest', []],
  ['save this quest', []],
  ['wrap the quest', []],
  ['archive that quest', []],
  ['close-phase', []],
  ['close phase', []],
  ['close QA-244600', ['QA-244600']],
  ['archive #244600', ['QA-244600']],
  ['save QA 244600', ['QA-244600']],
  ['close and save the quest', []],
  ['can you close quest 244600?', ['QA-244600']],
  ['please close quest 244600', ['QA-244600']],
  ['please close and save quest 244600', ['QA-244600']],
  ['Close Quest', []],
  ['please close and save quest (Can you update to make sure I can simply say close quest and you make sure to save?)', []],
  ['why did close quest not save? close quest 244600', ['QA-244600']],
  ['don\'t forget to close quest 244600', ['QA-244600']],
  ['save everything, then close quest 244600', ['QA-244600']],
  ['close quest 244600\n```\nsome log\n```', ['QA-244600']],
];
for (const [p, ids] of fireCases) {
  resetCalls();
  const r = run(P(p));
  const idsOk = ids.every(i => r.out.includes('Quest ids: ') && r.out.includes(i)) && (ids.length || r.out.includes('no quest named: resolve it from the conversation, then run node lib/save-quest.js <QA>'));
  check('fires: ' + p.replace(/\n/g, ' ').slice(0, 70), r.status === 0 && fires(r.out) && idsOk, r.out.slice(0, 200));
}

// Content of the injected text
resetCalls();
let r = run(P('please close and save quest 244600'));
check('F-replay: exit 0', r.status === 0, 'exit=' + r.status);
check('F-replay: stub verdict line for QA-244600 injected', r.out.includes('SAVE-QUEST: QA-244600 · Redmine = Closed (Ahmad · 100%) · local = closed → PHASE-2'), r.out);
check('F-replay: resolver advice line injected', r.out.includes('   Redmine is closed. Run Phase 2 archive.'), r.out);
check('F-replay: checklist has all 7 items', /SAVE-QUEST CHECKLIST: 1 quest doc updated[^\n]*· 7 Root cause \+ Solution rows shown/.test(r.out) && ['2 active.txt block updated', '3 wrong-fix rows added', '4 Task folder checked', '5 SAVE-QUEST line pasted', '6 the verdict\'s stage run'].every(s => r.out.includes(s)), r.out);
check('F-replay: procedure line names close-phase', r.out.includes('Procedure: invoke the close-phase skill (Skill tool). This gate does not replace it.'), r.out);
check('F-replay: resolver called once with QA-244600', calls().join() === 'QA-244600', calls().join());

resetCalls();
r = run(P('close quest 244600 and 244601'));
check('two ids: two resolver lines', (r.out.match(/^SAVE-QUEST: QA-24460[01] /gm) || []).length === 2 && calls().length === 2, r.out);

resetCalls();
r = run(P('archive ADHOC-PT-2026-3'));
check('adhoc id: resolver stub prints ADHOC', r.status === 0 && /SAVE-QUEST: ADHOC-PT-2026-3 .*→ ADHOC/.test(r.out) && calls().join() === 'ADHOC-PT-2026-3', r.out);

resetCalls();
r = run(P('close quest 100001 100002 100003 100004 100005 100006 100007'));
check('more than 5 ids: 5 resolved, rest listed', calls().length === 5 && r.out.includes('Not resolved here (more than 5 ids): QA-100006, QA-100007'), r.out + calls().join());

resetCalls();
r = run(P('close quest 244600 and close QA-244600 and #244600'));
check('same id three ways: one resolver call', calls().join() === 'QA-244600', calls().join());

// Resolver failures
resetCalls();
r = run(P('close quest 999999'), { SAVE_QUEST_GATE_TIMEOUT_MS: '800' });
check('resolver timeout: UNKNOWN line, exit 0', r.status === 0 && r.out.includes('SAVE-QUEST: QA-999999 · resolver did not answer → UNKNOWN') && r.ms < 8000, 'exit=' + r.status + ' ms=' + r.ms + ' ' + r.out.slice(0, 160));
r = run(P('close quest 888888'));
check('resolver exit 1: UNKNOWN line, exit 0', r.status === 0 && r.out.includes('SAVE-QUEST: QA-888888 · resolver did not answer → UNKNOWN'), r.out.slice(0, 200));
r = run(P('close quest 777777'));
check('resolver prints no SAVE-QUEST line: UNKNOWN', r.status === 0 && r.out.includes('SAVE-QUEST: QA-777777 · resolver did not answer → UNKNOWN'), r.out.slice(0, 200));
r = run(P('close quest 244600'), { SAVE_QUEST_GATE_RESOLVER: path.join(tmp, 'does-not-exist.js') });
check('resolver file missing: UNKNOWN line, exit 0', r.status === 0 && r.out.includes('SAVE-QUEST: QA-244600 · resolver did not answer → UNKNOWN'), r.out.slice(0, 200));
resetCalls();
r = run(P('close quest 999999 and 244600'), { SAVE_QUEST_GATE_TIMEOUT_MS: '1500' });
check('shared budget: slow first id does not hold the run past the budget plus node start', r.status === 0 && r.ms < 9000 && r.out.includes('QA-999999 · resolver did not answer'), 'ms=' + r.ms);

// Silent
const silent = [
  'how does close quest work?',
  'why did close quest not run?',
  'what does close quest do?',
  'have you changed close quest?',
  'does close quest check redmine?',
  'look at this:\n' + FENCE + '\nclose quest 244600\n' + FENCE,
  FENCE + '\nclose quest 244600',
  '<pasted_content>please close quest 244600</pasted_content>',
  '<pasted_content id="1">close quest 244600',
  'the word ' + TICK + 'close quest' + TICK + ' is in the script',
  'close the door',
  'save everything',
  'save it',
  'save this finding',
  'do not close quest 244600',
  "don't close quest yet",
  'never save quest without a nod',
  'closest request',
  'quest close',
  'the quest is done',
  'wrap it up',
];
for (const p of silent) {
  resetCalls();
  const r2 = run(P(p));
  check('silent: ' + p.replace(/\n/g, ' ').slice(0, 70), r2.status === 0 && r2.out.trim() === '' && calls().length === 0, 'exit=' + r2.status + ' ' + r2.out.slice(0, 120));
}

// Input shapes and speed
for (const [n, s] of [['empty stdin', ''], ['malformed JSON', '{not json'], ['no prompt field', '{}'], ['null JSON', 'null'], ['empty prompt', P('')], ['prompt is a number', JSON.stringify({ prompt: 5 })]]) {
  r = run(s);
  check('input: ' + n + ' exits 0 and is silent', r.status === 0 && r.out.trim() === '', 'exit=' + r.status + ' ' + r.out.slice(0, 100));
}
resetCalls();
r = run(P('deploy 244600 to internal'));
check('no match: no resolver child spawned and fast', calls().length === 0 && r.ms < 3000, 'ms=' + r.ms);
r = run(P('x'.repeat(1100000) + ' close quest'));
check('huge prompt over the cap: silent, exit 0, no child', r.status === 0 && r.out.trim() === '' && calls().length === 0, 'exit=' + r.status);
r = run(P('<pasted_content>' + 'close quest '.repeat(50000) + '</pasted_content> thanks'));
check('large pasted block: silent, fast', r.status === 0 && r.out.trim() === '' && r.ms < 5000, 'ms=' + r.ms);

// Self-disarm: the gate's own injected text fed back as a prompt does not re-fire
r = run(P('SAVE-QUEST GATE: close/save quest asked. Do these in this turn, in order.\nQuest ids: QA-244600\nclose quest'));
check('own injected text as prompt: silent', r.status === 0 && r.out.trim() === '', r.out.slice(0, 120));

// Log
let rows = []; try { rows = fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch (_) {}
const row = rows.find(x => x.ids && x.ids.join() === 'QA-244600' && x.verdicts && x.verdicts[0] === 'PHASE-2');
check('log: a fire row carries ts, event, decision, ids, verdicts, dur_ms', !!row && row.ts && row.event === 'front' && row.decision === 'inject' && typeof row.dur_ms === 'number', JSON.stringify(rows[0]));
check('log: silent runs wrote nothing extra (rows only for fires)', rows.every(x => x.event === 'front' && x.decision === 'inject'), 'rows=' + rows.length);

// Sandbox copy without CLAUDE_PROJECT_DIR (root resolves from the file location)
{
  const e = env(); delete e.CLAUDE_PROJECT_DIR;
  const t0 = Date.now();
  const s = spawnSync(process.execPath, [HOOK], { input: P('close quest 244600'), encoding: 'utf8', timeout: 30000, env: e });
  check('root from file location when CLAUDE_PROJECT_DIR is unset', s.status === 0 && fires(s.stdout || ''), 'exit=' + s.status + ' ' + String(s.stderr).slice(0, 160) + ' ' + (Date.now() - t0) + 'ms');
}

// Through the bundle dispatcher, the way settings.json runs it
{
  fs.writeFileSync(path.join(tmp, 'domain', 'bundles', 'test-upsm.json'), JSON.stringify({ name: 'test-upsm', children: [HOOK_REL] }));
  const s = spawnSync(process.execPath, [path.join(tmp, 'lib', 'dispatch-hooks.js'), '--manifest', 'domain/bundles/test-upsm.json', '--event', 'UserPromptSubmit'], { input: JSON.stringify({ prompt: 'please close and save quest 244600' }), encoding: 'utf8', timeout: 30000, env: env() });
  let ctx = ''; try { ctx = JSON.parse(s.stdout).hookSpecificOutput.additionalContext; } catch (_) {}
  check('bundle: dispatcher emits the gate text as additionalContext', s.status === 0 && fires(ctx) && ctx.includes('SAVE-QUEST: QA-244600 · Redmine = Closed'), 'exit=' + s.status + ' ' + String(s.stdout).slice(0, 160));
  const q = spawnSync(process.execPath, [path.join(tmp, 'lib', 'dispatch-hooks.js'), '--manifest', 'domain/bundles/test-upsm.json', '--event', 'UserPromptSubmit'], { input: JSON.stringify({ prompt: 'deploy 244600' }), encoding: 'utf8', timeout: 30000, env: env() });
  check('bundle: non-matching prompt emits nothing', q.status === 0 && q.stdout.trim() === '', 'exit=' + q.status + ' ' + String(q.stdout).slice(0, 120));
}

// Registration: the hook is wired in a bundle manifest, once, and not also standalone in settings.json
{
  const bundleText = fs.readFileSync(path.join(REAL_ROOT, 'domain', 'bundles', 'upsm-mode.json'), 'utf8');
  const settingsText = fs.readFileSync(path.join(REAL_ROOT, '.claude', 'settings.json'), 'utf8');
  check('registered: upsm-mode bundle names the front hook', bundleText.includes(HOOK_REL), 'not in upsm-mode.json');
  check('registered: no standalone settings.json entry', !/save-quest-gate/.test(settingsText), 'standalone entry still in settings.json');
}

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nsave-quest-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
