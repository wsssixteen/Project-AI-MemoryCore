#!/usr/bin/env node
// session-scope.eval.js — (A) the per-prompt decision, (B) every guarded hook run in a throwaway sandbox with fixture
// quest/registers: a DawahMap prompt prints none of its etanah text, an etanah prompt prints all of it, and with the
// check switched off or removed the same DawahMap prompt prints everything (proves the fixture would fire).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const results = []; const check = (n, c, d) => results.push({ n, pass: !!c, d });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scope-eval-'));
const HB = path.join(tmp, 'repo');
const w = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const cp = (rel) => w(path.join(HB, rel), fs.readFileSync(path.join(REPO, rel), 'utf8'));

// ≥20 adversarial / out-of-spec scenarios (system-design Rule 12); the fixture ids are the checks below
const SCENARIOS = [
  ['DawahMap prompt that names a wayfinder ticket ("continue ticket 09")', 'fixture-added (D1, H*)'],
  ['"ticket" / "tickets" alone with the alias (his wayfinder word)', 'fixture-added (D2, D25)'],
  ['Etanah ticket number, no alias', 'fixture-added (D3)'],
  ['Alias + a quest id QA-285159', 'fixture-added (D4)'],
  ['Alias + an urusan code typed in lower case ("prbb")', 'fixture-added (D5)'],
  ['Alias + a permohonan id PTMLK/01/L/…', 'fixture-added (D6)'],
  ['Alias + "redmine" / "etanah" (his way to get the text back)', 'fixture-added (D7, D34)'],
  ['Alias + a 7-digit aplikasi id', 'fixture-added (D8)'],
  ['Alias inside a longer word ("dawahmapper")', 'fixture-added (D9)'],
  ['Alias in another case, several-word alias ("REASON TO ISLAM")', 'fixture-added (D10)'],
  ['DawahMap meant but not named ("continue the notebook")', 'accepted-risk: prints as today; costs tokens, never loses etanah text (D11)'],
  ['No prompt (SessionStart run, hand run)', 'fixture-added (D12)'],
  ['Malformed stdin', 'fixture-added (H-bad)'],
  ['lib/session-scope.js renamed or deleted (the kill switch)', 'fixture-added (H-kill)'],
  ['SESSION_SCOPE=off in the environment', 'fixture-added (H-off)'],
  ['DawahMap project.json missing', 'fixture-added (D16)'],
  ['Prompt hooks run in parallel: a marker written now is unseen now', 'handled: no marker, decided per prompt from the prompt alone'],
  ['Another project named (PymTime)', 'fixture-added (D18, not in QUIET)'],
  ['Pasted etanah hook text inside a DawahMap prompt', 'fixture-added (D19, the QA- id prints)'],
  ['Alias + a 9-digit number: bug-db would fire, the scope says quiet', 'fixture-added (H-bugdb9)'],
  ['Alias + an 8-digit date or a byte count', 'accepted-risk: prints (D21); safe direction'],
  ['Quiet first message in work hours: the surfacer must not use up the session decision', 'fixture-added (H-oqs2)'],
  ['"quest" / "board" / "deploy" in DawahMap talk', 'fixture-added (D24, quiet)'],
  ['Slash command /quest with the alias', 'fixture-added (D26)'],
  ['A hook copied into another eval sandbox without lib/', 'handled: try/catch at every call site, fails open (H-kill)'],
  ['A guard line removed by a later edit', 'fixture-added (S1, static check of the 9 files)'],
  ['A new etanah hook written later without the guard', 'accepted-risk: its text rides again until it gets the line; no boot audit rule yet'],
  ['A caller that never closes stdin', 'accepted-risk: every caller in the repo closes it (harness, hook-runtime, dispatch-hooks)'],
  ['Telemetry write fails', 'handled: try/catch, the decision stands'],
  ['Urusan code not on the list with the alias and no other signal', 'accepted-risk: that prompt is quiet; naming the ticket or "etanah" brings it back'],
];

// ---------- (A) the decision ----------
const PM = path.join(tmp, 'pm');
w(path.join(PM, 'projects', 'coding-projects', 'active', 'DawahMap', 'project.json'), JSON.stringify({ name: 'DawahMap', aliases: ['dawahmap', 'dawah map', 'reason to islam', 'walk by reason'] }));
w(path.join(PM, 'projects', 'coding-projects', 'active', 'PymTime', 'project.json'), JSON.stringify({ name: 'PymTime', aliases: ['pymtime'] }));
const PM2 = path.join(tmp, 'pm2'); fs.mkdirSync(path.join(PM2, 'projects', 'coding-projects', 'active'), { recursive: true });
const CLI = path.join(__dirname, 'session-scope.js');
const decideIn = (main, prompt, extra) => { const r = spawnSync(process.execPath, [CLI, '--decide', prompt], { encoding: 'utf8', windowsHide: true, env: { ...process.env, PROJECT_LOAD_MAIN_ROOT: main, SESSION_SCOPE: '', ...(extra || {}) } }); return (r.stdout || '').trim(); };
const D = [
  ['D1', 'load DawahMap and continue ticket 09', 'quiet'],
  ['D2', 'DawahMap: what tickets are open? ticket 04 next', 'quiet'],
  ['D3', 'ticket 282303 status, fix the PRBB bug', 'print'],
  ['D4', 'continue the Reason to Islam map; also check QA-285159', 'print'],
  ['D5', 'DawahMap first, then the prbb bug', 'print'],
  ['D6', 'DawahMap and PTMLK/01/L/PRBB/2026/12', 'print'],
  ['D7', 'DawahMap, then read redmine', 'print'],
  ['D8', 'DawahMap; aplikasi 3408184 later', 'print'],
  ['D9', 'dawahmapper is a word', 'print'],
  ['D10', 'REASON TO ISLAM: open the walk', 'quiet'],
  ['D11', 'continue the notebook', 'print'],
  ['D12', '', 'print'],
  ['D18', 'pymtime clock-in, continue', 'print'],
  ['D19', 'DawahMap — pasted: 🎯 OBJECTIVE LOCK — QA-285159', 'print'],
  ['D21', 'DawahMap built on 20261018, file 110888 bytes', 'print'],
  ['D24', 'Reason to Islam: next quest step, deploy the board page', 'quiet'],
  ['D25', 'DawahMap tickets', 'quiet'],
  ['D26', '/quest resume after DawahMap', 'print'],
  ['D34', 'DawahMap, and the etanah side too', 'print'],
];
for (const [id, prompt, want] of D) { const got = decideIn(PM, prompt); check(`${id} "${prompt}" → ${want}`, got.startsWith(want), got); }
{ const got = decideIn(PM2, 'load DawahMap and continue ticket 09'); check('D16 DawahMap project.json missing → print', got.startsWith('print'), got); }
{ const got = decideIn(PM, 'load DawahMap and continue ticket 09', { SESSION_SCOPE: 'off' }); check('D17 SESSION_SCOPE=off → print', got.startsWith('print'), got); }

// ---------- (B) the 9 guarded hooks in a sandbox ----------
const HOOKS = [
  // [file, telemetry/hook name, the etanah text it prints]
  ['.claude/hooks/quest-objective-anchor.js', 'quest-objective-anchor', /OBJECTIVE LOCK — QA-900001/],
  ['.claude/hooks/mode-detector.js', 'mode-detector', /Mode: Quest-active/],
  ['.claude/hooks/quest-active-grounding.js', 'quest-active-grounding', /Active quest: QA-900001/],
  ['.claude/hooks/open-quest-surfacer.js', 'open-quest-surfacer', /OPEN QUESTS/],
  ['domain/codemap-recon-consult/codemap-recon-consult.trigger.hook.js', 'codemap-recon-consult', /codemap-recon-consult: investigation phase/],
  ['domain/overview-steps/overview-tracker.trigger.hook.js', 'overview-tracker', /OVERVIEW — T1/],
  ['domain/adhoc-register/adhoc-register.check.hook.js', 'adhoc-register', /adhoc-register: 1 ad-hoc row/],
  ['domain/latent-bugs-gate/latent-bugs-gate.check.hook.js', 'latent-bugs-gate', /latent-bugs-gate: 1 pre-diagnosed/],
  ['domain/bug-db/bug-db.check.hook.js', 'bug-db', /bug-db: 1 similar past bug/],
];
for (const [f] of HOOKS) cp(f);
for (const f of ['lib/session-scope.js', 'lib/hook-runtime.js', 'lib/states.js', 'system/states.json', 'domain/project-load/project.js', 'domain/bug-db/lookup.js']) cp(f);
w(path.join(HB, 'quest', 'active.txt'), 'qa=QA-900001\nstatus=active\nphase=0\ncurrent_phase=Rubric\nurusan=PRBB\nissue_one_liner=Fixture issue for the scope eval\n');
w(path.join(HB, 'domain', 'overview-steps', 'state', 'T1.json'), JSON.stringify({ ticket: 'T1', steps: [{ n: 1, label: 'a', status: 'done' }, { n: 2, label: 'b', status: 'todo' }] }));
w(path.join(HB, 'projects', 'coding-projects', 'active', 'DawahMap', 'project.json'), JSON.stringify({ name: 'DawahMap', aliases: ['dawahmap', 'reason to islam'] }));
const KD = path.join(HB, 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka');
w(path.join(KD, 'ADHOC-REGISTER.md'), '| # | Date | Asked by | The ask | Conclusion | Evidence lives at | Status |\n|---|---|---|---|---|---|---|\n| A1 | 2026-10-01 | miya | fixture ask | fixture conclusion | fixture.md | OPEN |\n');
w(path.join(KD, 'LATENT-BUGS.md'), '| # | Date | Family | Where | Urusan/Screen | Symptom if triggered | Status | Evidence |\n|---|---|---|---|---|---|---|---|\n| L1 | 2026-10-01 | fam | where | screen | symptom | SUSPECT | evidence |\n');
w(path.join(KD, 'bug-db-index.jsonl'), JSON.stringify({ tickets: ['900001', '456789'], keywords: [], title: 'Fixture bug', source: 'BUG-BESTIARY.md:1' }) + '\n');
const TEL = path.join(HB, 'system', 'telemetry', 'hook-fires.jsonl');

let sid = 0;
function runHookFile(rel, prompt, extra, rawStdin) {
  const stdin = rawStdin !== undefined ? rawStdin : JSON.stringify({ session_id: 'eval-' + (++sid), prompt, hook_event_name: 'UserPromptSubmit' });
  const r = spawnSync(process.execPath, [path.join(HB, rel)], { input: stdin, encoding: 'utf8', timeout: 30000, windowsHide: true,
    env: { ...process.env, CLAUDE_PROJECT_DIR: HB, PROJECT_LOAD_MAIN_ROOT: HB, SESSION_SCOPE: '', OQS_SHOWN_FILE: path.join(tmp, 'shown-' + sid + '.json'), OQS_NOW: '2026-10-18T10:00:00', PYMTIME_DIR: path.join(tmp, 'no-pymtime'), ...(extra || {}) } });
  return { status: r.status, out: r.stdout || '', err: r.stderr || '' };
}
const Q = 'resume the DawahMap notebook, pick up ticket 04';   // fires every hook's own trigger; names DawahMap, no etanah signal
const E = 'resume ticket 900001, the PRBB bug';               // fires every hook; etanah
const QB = 'DawahMap file id 123456789';                       // bug-db's own trigger (#?\d{6}\b) matches; the scope says quiet
const telRows = () => { try { return fs.readFileSync(TEL, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch (_) { return []; } };

for (const [rel, name, mark] of HOOKS) {
  const q = name === 'bug-db' ? QB : Q;
  const before = telRows().length;
  const rq = runHookFile(rel, q);
  const quietRows = telRows().slice(before).filter(x => x.mode === 'scope-quiet' && x.hook === name);
  if (name === 'mode-detector') check(`H-${name} DawahMap prompt → only "Mode: Discussion"`, rq.out.trim() === '🎯 Mode: Discussion', rq.out + rq.err);
  else check(`H-${name} DawahMap prompt → prints nothing (exit 0)`, rq.out.trim() === '' && rq.status === 0, rq.out.slice(0, 300) + rq.err);
  check(`H-${name} DawahMap prompt → one scope-quiet telemetry row`, quietRows.length === 1 && quietRows[0].session_id, JSON.stringify(quietRows));
  const re = runHookFile(rel, E);
  check(`H-${name} etanah prompt → prints its etanah text`, mark.test(re.out), re.out.slice(0, 300) + re.err);
  const ro = runHookFile(rel, q, { SESSION_SCOPE: 'off' });
  check(`H-off-${name} DawahMap prompt with SESSION_SCOPE=off → prints its etanah text (control)`, mark.test(ro.out), ro.out.slice(0, 300) + ro.err);
}
{ const r = runHookFile('.claude/hooks/quest-objective-anchor.js', null, null, 'not json'); check('H-bad malformed stdin → prints as before', /OBJECTIVE LOCK/.test(r.out), r.out + r.err); }
{ // the surfacer: a quiet first message must leave the session undecided, so the next etanah prompt still loads the list
  const shown = path.join(tmp, 'shown-oqs2.json');
  const env = { OQS_SHOWN_FILE: shown };
  const s = JSON.stringify({ session_id: 'eval-oqs2', prompt: Q });
  const r1 = runHookFile('.claude/hooks/open-quest-surfacer.js', null, env, s);
  const marked = (() => { try { return Object.keys(JSON.parse(fs.readFileSync(shown, 'utf8'))); } catch (_) { return []; } })();
  const r2 = runHookFile('.claude/hooks/open-quest-surfacer.js', null, env, JSON.stringify({ session_id: 'eval-oqs2', prompt: E }));
  check('H-oqs2 quiet prompt marks nothing; the next etanah prompt in the same session loads the list', r1.out.trim() === '' && marked.length === 0 && /Ticket list loaded now/.test(r2.out), JSON.stringify(marked) + ' | ' + r2.out.slice(0, 200));
}
{ // the kill switch: rename the lib → every hook fails open and prints
  fs.renameSync(path.join(HB, 'lib', 'session-scope.js'), path.join(HB, 'lib', 'session-scope.off.js'));
  const bad = [];
  for (const [rel, name, mark] of HOOKS) { const r = runHookFile(rel, name === 'bug-db' ? QB : Q); if (!mark.test(r.out)) bad.push(name + ': ' + (r.out + r.err).slice(0, 120)); }
  check('H-kill lib renamed → all 9 hooks print their etanah text on the DawahMap prompt', bad.length === 0, bad.join(' | '));
  fs.renameSync(path.join(HB, 'lib', 'session-scope.off.js'), path.join(HB, 'lib', 'session-scope.js'));
}
// static: every guarded hook in the REAL repo still carries its one-line guard
{ const miss = HOOKS.filter(([rel, name]) => !new RegExp("lib', 'session-scope\\.js'\\)\\)\\.wantsEtanah\\([^)]*'" + name + "'\\)").test(fs.readFileSync(path.join(REPO, rel), 'utf8'))).map(h => h[1]);
  check('S1 the 9 guarded hooks each carry the guard line', miss.length === 0, miss.join(', ')); }
check('S2 at least 20 adversarial scenarios enumerated', SCENARIOS.length >= 20, SCENARIOS.length);

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
if (process.argv.includes('--scenarios')) for (const [s, v] of SCENARIOS) console.log('| ' + s + ' | ' + v + ' |');
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + String(x.d).slice(0, 800))); }
console.log('\nsession-scope.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
