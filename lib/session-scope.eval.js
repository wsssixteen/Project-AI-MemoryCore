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
  ['DawahMap meant but not named ("continue the notebook")', 'handled since 2026-10-19 by step 5 (T1, H-T*); with no transcript and no session it prints as before (D11)'],
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
  // step 5 (2026-10-19): a prompt that names nothing takes the topic of his last typed prompt that had one
  ['Names nothing; his last topic prompt named DawahMap ("So what\'s left?")', 'fixture-added (T1, H-T*)'],
  ['DawahMap earlier, an etanah prompt later, then a bare prompt', 'fixture-added (T2, H-TE*)'],
  ['Etanah earlier, DawahMap later, then a bare prompt', 'fixture-added (T3)'],
  ['Last topic was another project (PymTime)', 'fixture-added (T4)'],
  ['Transcript path missing on disk', 'fixture-added (T5)'],
  ['Transcript is plain text, not JSON lines', 'fixture-added (T6)'],
  ['A popup answer names DawahMap after an etanah prompt (my question, not his topic)', 'fixture-added (T7, popups skipped)'],
  ['A compaction summary names DawahMap after an etanah prompt', 'fixture-added (T8)'],
  ['A skill expansion (isMeta) names DawahMap after an etanah prompt', 'fixture-added (T9)'],
  ['A task notification names DawahMap after an etanah prompt', 'fixture-added (T10)'],
  ['A system-reminder with etanah hook text inside his DawahMap prompt', 'fixture-added (T11, reminders stripped)'],
  ['The prompt being decided is already the last transcript line', 'fixture-added (T12, skipped)'],
  ['A short "tickets" / "board" message in a DawahMap session (his ticket-list words)', 'fixture-added (T13, T14)'],
  ['His last typed prompt was the slash command /quest', 'fixture-added (T15)'],
  ['Topic further back than the scan window, session not bound', 'fixture-added (T16)'],
  ['Topic further back than the scan window, session bound to DawahMap alone', 'fixture-added (T17)'],
  ['Session bound to DawahMap and Masterline, no topic in the window', 'fixture-added (T18)'],
  ['A multi-byte character cut by a 512 KB read boundary inside the DawahMap prompt', 'fixture-added (T19)'],
  ['A typed line over 1 MB (a huge paste)', 'fixture-added (T20, skipped; the earlier topic decides)'],
  ['A delegated session whose brief (sdk) names DawahMap', 'fixture-added (T21)'],
  ['A message relayed from another session names DawahMap after an etanah prompt', 'fixture-added (T22)'],
  ['An assistant line names DawahMap after his etanah prompt', 'fixture-added (T23)'],
  ['An etanah session that once named DawahMap; then "continue" with no topic word', 'accepted-risk: the last topic decides, so an etanah prompt after the DawahMap one prints; the bound-only fallback needs 8 MB with no topic word'],
  ['The 9 hooks each scan the transcript in parallel', 'accepted-risk: about 90 ms each on a 145 MB transcript, read only on a prompt that names nothing'],
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

// ---------- (A2) step 5: a prompt that names nothing takes the topic of his last typed prompt ----------
w(path.join(PM, 'projects', 'coding-projects', 'active', 'Masterline', 'project.json'), JSON.stringify({ name: 'Masterline', aliases: ['masterline'] }));
const TX = path.join(tmp, 'tx'); fs.mkdirSync(TX, { recursive: true });
const L = {   // transcript lines in the shape Claude Code writes them
  typed: (text, origin) => JSON.stringify({ type: 'user', message: { role: 'user', content: text }, turnOrigin: origin || 'human', promptSource: 'sdk', timestamp: '2026-10-19T00:00:00Z' }),
  typedArr: (text) => JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text }] }, turnOrigin: 'human' }),
  popup: (q, a) => JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'answered' }] }, toolUseResult: { answers: { [q]: a } } }),
  summary: (text) => JSON.stringify({ type: 'user', isCompactSummary: true, message: { role: 'user', content: text } }),
  meta: (text) => JSON.stringify({ type: 'user', isMeta: true, message: { role: 'user', content: [{ type: 'text', text }] } }),
  asst: (text) => JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } }),
  tool: (n) => JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', content: 'x'.repeat(n) }] } }),
};
const tx = (name, lines) => { const f = path.join(TX, name + '.jsonl'); fs.writeFileSync(f, lines.join('\n') + '\n'); return f; };
const BARE = "So what's left? Have you done everything without stopping so that I can check and give my feedback?";
const decideTx = (prompt, file, session, extra) => {
  const args = [CLI, '--decide', prompt].concat(file ? ['--transcript', file] : [], session ? ['--session', session] : []);
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', windowsHide: true, env: { ...process.env, PROJECT_LOAD_MAIN_ROOT: PM, PROJECT_LOAD_LOG: '', SESSION_SCOPE: '', SESSION_SCOPE_TAIL_BYTES: '', ...(extra || {}) } });
  return (r.stdout || '').trim() + (r.stderr ? ' | ' + r.stderr.trim() : '');
};
const T = [
  ['T1', BARE, tx('t1', [L.typed('load DawahMap and continue ticket 09'), L.asst('ok'), L.tool(200)]), 'quiet'],
  ['T2', BARE, tx('t2', [L.typed('DawahMap first'), L.typed('ticket 282303, the PRBB bug')]), 'print'],
  ['T3', BARE, tx('t3', [L.typed('ticket 282303, the PRBB bug'), L.typed('back to DawahMap')]), 'quiet'],
  ['T4', BARE, tx('t4', [L.typed('DawahMap first'), L.typed('pymtime clock-in')]), 'print'],
  ['T5', BARE, path.join(TX, 'no-such-file.jsonl'), 'print'],
  ['T6', BARE, (() => { const f = path.join(TX, 't6.jsonl'); fs.writeFileSync(f, 'this is not json\nDawahMap plain text line\n'); return f; })(), 'print'],
  ['T7', BARE, tx('t7', [L.typed('ticket 282303 first'), L.popup('Which DawahMap notebook shape?', 'Layers')]), 'print'],
  ['T8', BARE, tx('t8', [L.typed('ticket 282303 first'), L.summary('This session is being continued ... DawahMap ...')]), 'print'],
  ['T9', BARE, tx('t9', [L.typed('ticket 282303 first'), L.meta('Base directory for this skill: DawahMap')]), 'print'],
  ['T10', BARE, tx('t10', [L.typed('ticket 282303 first'), L.typed('<task-notification>DawahMap run done</task-notification>')]), 'print'],
  ['T11', BARE, tx('t11', [L.typed('ticket 282303 first'), L.typedArr('<system-reminder>OBJECTIVE LOCK — QA-285159 PRBB</system-reminder>\ncontinue DawahMap')]), 'quiet'],
  ['T12', BARE, tx('t12', [L.typed('back to DawahMap'), L.typed(BARE)]), 'quiet'],
  ['T13', 'tickets?', tx('t13', [L.typed('back to DawahMap')]), 'print'],
  ['T14', 'show me the board', tx('t14', [L.typed('back to DawahMap')]), 'print'],
  ['T15', BARE, tx('t15', [L.typed('back to DawahMap'), L.typed('<command-name>/quest</command-name><command-args>resume</command-args>')]), 'print'],
  ['T19', BARE, (() => {   // a 3-byte character cut by the 512 KB boundary, inside the DawahMap line
    const head = L.typed('みやみやみやみや DawahMap みや') + '\n';
    const at = Buffer.byteLength(head.slice(0, head.indexOf('み'))) + 1;   // one byte into the first み
    let filler = ''; const fill = 512 * 1024 - Buffer.byteLength(head) + at;
    while (Buffer.byteLength(filler) < fill - 600) filler += L.asst('z'.repeat(150)) + '\n';
    filler += L.asst('z'.repeat(fill - Buffer.byteLength(filler) - Buffer.byteLength(L.asst('') + '\n'))) + '\n';
    const f = path.join(TX, 't19.jsonl'); fs.writeFileSync(f, head + filler);
    if (fs.statSync(f).size - 512 * 1024 !== at) throw new Error('T19 fixture: the boundary is not inside the character');
    return f; })(), 'quiet'],
  ['T20', BARE, tx('t20', [L.typed('back to DawahMap'), L.typed('ticket 282303 ' + 'p'.repeat(1100000))]), 'quiet'],
  ['T21', BARE, tx('t21', [L.typed('Task for DawahMap: build ticket 04', 'sdk')]), 'quiet'],
  ['T22', BARE, tx('t22', [L.typed('ticket 282303 first'), L.typed('message from another session: DawahMap done', 'peer')]), 'print'],
  ['T23', BARE, tx('t23', [L.typed('ticket 282303 first'), L.asst('DawahMap is next')]), 'print'],
];
for (const [id, prompt, file, want] of T) { const got = decideTx(prompt, file); check(`${id} → ${want}`, got.startsWith(want), got); }
{ // the scan window: the topic sits further back than SESSION_SCOPE_TAIL_BYTES
  const far = tx('t16', [L.typed('back to DawahMap')].concat(Array.from({ length: 40 }, () => L.tool(4000))));
  const LOGF = path.join(PM, 'domain', 'project-load', 'log.jsonl');
  w(LOGF, [{ ts: '2026-10-19T00:00:00Z', session: 'sb1', project: 'DawahMap', action: 'fired' }, { ts: '2026-10-19T00:00:00Z', session: 'sb2', project: 'DawahMap', action: 'fired' }, { ts: '2026-10-19T00:01:00Z', session: 'sb2', project: 'Masterline', action: 'fired' }].map(r => JSON.stringify(r)).join('\n') + '\n');
  const small = { SESSION_SCOPE_TAIL_BYTES: '20000' };
  let got = decideTx(BARE, far, null, small); check('T16 topic past the window, no session → print', got.startsWith('print'), got);
  got = decideTx(BARE, far, 'sb1', small); check('T17 topic past the window, session bound to DawahMap alone → quiet', got.startsWith('quiet') && /bound to DawahMap/.test(got), got);
  got = decideTx(BARE, far, 'sb2', small); check('T18 session bound to DawahMap + Masterline → print', got.startsWith('print'), got);
  got = decideTx(BARE, far, null); check('T16b the same file with the full window finds DawahMap → quiet', got.startsWith('quiet'), got);
}

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
{ // step 5 in the real hooks: a prompt that names nothing, in a session whose last topic was DawahMap, prints nothing;
  // after a later etanah prompt it prints; with the check off it prints (proves each hook's own trigger fired)
  const txQ = tx('h-q', [L.typed('back to DawahMap')]);
  const txE = tx('h-e', [L.typed('back to DawahMap'), L.typed('ticket 900001, the PRBB bug')]);
  const QN = 'resume the notebook, pick up ticket 04';   // Q without the project name
  const QBN = 'file id 123456789';                        // QB without the project name (9 digits: no etanah signal)
  const run5 = (rel, prompt, file, extra) => runHookFile(rel, null, extra, JSON.stringify({ session_id: 'eval-t' + (++sid), prompt, transcript_path: file, hook_event_name: 'UserPromptSubmit' }));
  for (const [rel, name, mark] of HOOKS) {
    const p = name === 'bug-db' ? QBN : QN;
    const before = telRows().length;
    const rq = run5(rel, p, txQ);
    const rows = telRows().slice(before).filter(x => x.mode === 'scope-quiet' && x.hook === name);
    if (name === 'mode-detector') check(`H-T-${name} bare prompt, DawahMap session → only "Mode: Discussion"`, rq.out.trim() === '🎯 Mode: Discussion', rq.out + rq.err);
    else check(`H-T-${name} bare prompt, DawahMap session → prints nothing (exit 0)`, rq.out.trim() === '' && rq.status === 0, rq.out.slice(0, 300) + rq.err);
    check(`H-T-${name} the quiet row says why (last topic)`, rows.length === 1 && /last topic in this session: DawahMap/.test(rows[0].reason || ''), JSON.stringify(rows));
    const re = run5(rel, p, txE);
    check(`H-TE-${name} bare prompt after an etanah prompt → prints its etanah text`, mark.test(re.out), re.out.slice(0, 300) + re.err);
    const ro = run5(rel, p, txQ, { SESSION_SCOPE: 'off' });
    check(`H-T-off-${name} bare prompt, check off → prints its etanah text (control)`, mark.test(ro.out), ro.out.slice(0, 300) + ro.err);
  }
}
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
