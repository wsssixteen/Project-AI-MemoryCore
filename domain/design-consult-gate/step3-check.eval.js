#!/usr/bin/env node
// step3-check.eval.js — fixtures for the change-route step 3 rider (2026-11-03). S5 replays the RustDesk alert build.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'design-consult-gate.gate.hook.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'step3-eval-'));
const SID = 'sess-step3-eval';
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const MODELS_FILE = path.join(TMP, 'evolution-protocol.md');
fs.writeFileSync(MODELS_FILE, 'highest-model-id: claude-fable-5-1\n');
const PNG = path.join(TMP, 'shown.png');
fs.writeFileSync(PNG, 'png');
const CONSULT = [
  { role: 'assistant', text: 'Launching skill: system-rules' },
  { role: 'assistant', text: 'Launching skill: system-design' },
  { role: 'assistant', text: 'Launching skill: system-change' },
];
const FABLE_CALL = { raw: { type: 'assistant', message: { role: 'assistant', model: 'claude-opus-5-5', content: [{ type: 'tool_use', name: 'Agent', input: { model: 'fable', prompt: 'assess' } }] } } };

function transcript(entries) {
  const p = path.join(TMP, 't-' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(p, entries.map(e => JSON.stringify(e.raw || { type: e.role, message: { role: e.role, content: [{ type: 'text', text: e.text }] } })).join('\n') + '\n');
  return p;
}
function block(o) {
  const f = Object.assign({
    session: SID, 'his words': '"Go, build it" (order)', 'fix or report': 'fix',
    'who pays': 'on-demand: when he runs it', 'goal without the part': 'he is never sent to the office for a dead connection',
    model: 'claude-fable-5-1', shown: PNG,
  }, o || {});
  const card = (o && 'card' in o) ? o.card : CARD;
  delete f.card;
  return 'STEP-3: test\n' + Object.entries(f).filter(([, v]) => v !== null).map(([k, v]) => k + ': ' + v).join('\n') + '\n' + (card ? '\n' + card + '\n' : '');
}
const CARD = [
  'CHANGE-CARD (before): test',
  '- What: A test part checks one thing for him.',
  '- Why: On 2026-11-05 he asked for it.',
  '- How: It reads one file and prints a verdict.',
  '  ![flow](flow.png)',
  '- When: It runs on ask.',
  '- Where: It lives in `domain/test/`.',
  '  ![where](map.png)',
  'Where picture = the change map (lib/change-map.js).',
].join('\n');
function run(filePath, entries, sessionText, opts) {
  const o = opts || {};
  const sf = path.join(TMP, 's-' + Math.random().toString(36).slice(2) + '.md');
  fs.writeFileSync(sf, sessionText || '');
  const input = { tool_name: 'Write', tool_input: { file_path: filePath, content: 'x' }, transcript_path: transcript(entries) };
  if (!o.noSession) input.session_id = SID; else input.transcript_path = '';
  if (o.agent) input.agent_id = 'agent-1';
  if (o.badTranscript) input.transcript_path = path.join(TMP, 'missing.jsonl');
  const env = Object.assign({}, process.env, { STEP3_SESSION_FILE: sf, MODELS_STATE_FILE: MODELS_FILE });
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(input), encoding: 'utf8', timeout: 30000, env });
  let deny = false, reason = '';
  try { const j = JSON.parse(r.stdout || ''); deny = j.hookSpecificOutput.permissionDecision === 'deny'; reason = j.hookSpecificOutput.permissionDecisionReason || ''; } catch (_) {}
  return { deny, reason };
}

const HIGH = path.join(TMP, 'system', 'INDEX.md');
const NEWPART = path.join(TMP, 'domain', 'brand-new-check', 'README.md');
const HIS = { role: 'user', text: 'Go, build it' };
let r;

r = run(HIGH, [HIS, ...CONSULT], '');
check('S1 highest order, no block -> deny', r.deny && /no STEP-3 block/.test(r.reason), r.reason.slice(0, 120));

r = run(HIGH, [HIS, ...CONSULT, FABLE_CALL], block());
check('S2 highest order, block + Fable ran -> allow', !r.deny, r.reason.slice(0, 160));

r = run(HIGH, [HIS, ...CONSULT], block());
check('S3 highest order, Fable never ran -> deny', r.deny && /did not run this session/.test(r.reason), r.reason.slice(0, 160));

r = run(HIGH, [HIS, ...CONSULT, FABLE_CALL], block({ session: 'another-session' }));
check('S4 block of another session -> deny', r.deny, r.reason.slice(0, 120));

const RUSTDESK_HIS = { role: 'user', text: "Why can't you make this simple check every time you boot up? RustDesk is down, I had to go to office" };
r = run(NEWPART, [RUSTDESK_HIS, FABLE_CALL], block({ 'his words': '"RustDesk is down, make this simple check every time you boot up" (order)', 'fix or report': 'report', 'who pays': 'per-session: every session start, about 20 sessions' }));
check('S5 RustDesk replay: report-only for a named failure -> deny', r.deny && /only reports/.test(r.reason), r.reason.slice(0, 160));

const ALERT_HIS = { role: 'user', text: 'RustDesk is down. Yes, add an alert at boot please' };
r = run(NEWPART, [ALERT_HIS, FABLE_CALL], block({ 'his words': '"RustDesk is down" (order)', 'fix or report': 'report', 'who pays': 'per-session: every session start', 'alert nod': '"Yes, add an alert at boot please"' }));
check('S6 report with his alert nod quoted -> allow', !r.deny, r.reason.slice(0, 160));

r = run(NEWPART, [ALERT_HIS, FABLE_CALL], block({ 'his words': '"RustDesk is down" (order)', 'fix or report': 'report', 'who pays': 'per-session: every session start', 'alert nod': '"add alerts everywhere"' }));
check('S7 alert nod not in his words -> deny', r.deny, r.reason.slice(0, 120));

r = run(NEWPART, [HIS], block({ model: 'claude-opus-5-5' }));
check('S8 on-demand new part on the session model -> allow', !r.deny, r.reason.slice(0, 160));

r = run(NEWPART, [HIS], block({ model: 'claude-opus-5-5', 'who pays': 'per-prompt: every prompt' }));
check('S9 per-prompt part not on the highest model -> deny', r.deny && /model: must be/.test(r.reason), r.reason.slice(0, 160));

r = run(NEWPART, [HIS], block({ 'goal without the part': 'x'.repeat(200) }));
check('S10 essay line over 160 characters -> deny', r.deny && /longer than/.test(r.reason), r.reason.slice(0, 120));

r = run(NEWPART, [HIS], block({ shown: path.join(TMP, 'missing.png') }));
check('S11 picture not on disk -> deny', r.deny && /shown:/.test(r.reason), r.reason.slice(0, 120));

r = run(NEWPART, [HIS], block({ shown: null }));
check('S12 no picture line -> deny', r.deny && /missing line: shown/.test(r.reason), r.reason.slice(0, 120));

r = run(NEWPART, [HIS], block({ 'his words': 'build it' }));
check('S13 his words not quoted with order|question -> deny', r.deny && /his words:/.test(r.reason), r.reason.slice(0, 120));

r = run(NEWPART, [{ role: 'user', text: 'just do it [skip-step3: one-line typo]' }], '');
check('S14 his own skip-step3 -> allow', !r.deny, r.reason.slice(0, 120));

r = run(NEWPART, [HIS, { role: 'assistant', text: 'skipping [skip-step3: I decided]' }], '');
check('S15 skip-step3 written by me -> deny', r.deny, r.reason.slice(0, 120));

r = run(path.join(TMP, 'domain', 'design-consult-gate', 'step3-check.eval.js'), [HIS], '');
check('S16 eval file in a highest-order folder -> exempt', !r.deny, r.reason.slice(0, 120));

r = run(path.resolve(__dirname, '..', '..', 'lib', 'watch.js'), [HIS], '');
check('S17 edit of an existing ordinary file -> no rider', !r.deny, r.reason.slice(0, 120));

r = run(HIGH, [HIS, ...CONSULT], '', { noSession: true });
check('S18 input with no session (old fixtures) -> rider skipped', !/step-3 rider/.test(r.reason), r.reason.slice(0, 120));

r = run(HIGH, [HIS, ...CONSULT, FABLE_CALL], block({ 'fix or report': 'maybe' }));
check('S19 fix or report not fix|report -> deny', r.deny && /fix or report:/.test(r.reason), r.reason.slice(0, 120));

r = run(HIGH, [HIS, ...CONSULT, FABLE_CALL], block({ session: 'old' }) + '\n' + block());
check('S20 two blocks, this session second -> allow', !r.deny, r.reason.slice(0, 160));

r = run(NEWPART, [HIS], block({ card: null }));
check('S21 block with no change card -> deny', r.deny && /no CHANGE-CARD \(before\)/.test(r.reason), r.reason.slice(0, 160));

r = run(NEWPART, [HIS], block({ card: CARD.replace('- When: It runs on ask.\n', '') }));
check('S22 change card missing a line -> deny', r.deny && /CHANGE-CARD \(before\) fails: When: missing/.test(r.reason), r.reason.slice(0, 160));

r = run(NEWPART, [HIS], block({ card: CARD.replace('checks one thing for him.', 'checks things. It is good.') }));
check('S23 change card line of two sentences -> deny', r.deny && /What: not one sentence/.test(r.reason), r.reason.slice(0, 160));

r = run(NEWPART, [HIS], block({ session: 'old', card: null }) + '\n' + block());
check('S24 an older block without a card does not matter; this session card passes -> allow', !r.deny, r.reason.slice(0, 160));

r = run(NEWPART, [HIS], block() + '\n' + block({ session: 'other', card: null }));
check('S25 card under this session block, next block another session -> allow', !r.deny, r.reason.slice(0, 160));

// R-series: the build-turn rider (2026-11-10): three lines in the reply of any turn that edits a hook, skill, Feature file, rule file or memory file
function mk(p) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, 'x'); return p; }
const EXHOOK = mk(path.join(TMP, '.claude', 'hooks', 'old-hook.js'));
const EXSKILL = mk(path.join(TMP, '.claude', 'skills', 'old-skill', 'SKILL.md'));
const EXRULE = mk(path.join(TMP, '.claude', 'CLAUDE.md'));
const EXMEM = mk(path.join(TMP, '.claude', 'auto-memory', 'feedback_old.md'));
const EXFEAT = mk(path.join(TMP, 'domain', 'old-feature', 'README.md'));
const EXEVAL = mk(path.join(TMP, 'domain', 'old-feature', 'old-feature.eval.js'));
const EXOTHER = mk(path.join(TMP, 'main', 'current-session.md'));
const NEWMEM = path.join(TMP, '.claude', 'auto-memory', 'feedback_brand_new.md');
const A = t => ({ role: 'assistant', text: t });
const GOOD = 'his words: "Go, build it"\ncause step: .claude/hooks/old-hook.js:decide · change: 3 lines · new parts: 0';
let rr;

rr = run(EXHOOK, [HIS, ...CONSULT, A(GOOD)]);
check('R1 existing hook, all three lines -> allow', !rr.deny, rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, A('I will fix the hook now.')]);
check('R2 existing hook, no lines -> deny naming all three', rr.deny && /his words/.test(rr.reason) && /cause step/.test(rr.reason) && /new parts/.test(rr.reason), rr.reason.slice(0, 200));
rr = run(EXHOOK, [HIS, ...CONSULT, A('cause step: hook.js:decide · change: 3 lines · new parts: 0')]);
check('R3 his words missing -> deny', rr.deny && /missing line: his words/.test(rr.reason), rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, A('his words: "Go, build it"\nnew parts: 0')]);
check('R4 cause step missing -> deny', rr.deny && /missing line: cause step/.test(rr.reason), rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, A('his words: "Go, build it"\ncause step: hook.js:decide · change: 3 lines')]);
check('R5 new parts missing -> deny', rr.deny && /missing line: new parts/.test(rr.reason), rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, A('his words: "Please tidy everything else too"\ncause step: hook.js:decide · change: 3 lines · new parts: 0')]);
check('R6 quote he never typed -> deny', rr.deny && /not in his messages/.test(rr.reason), rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, A('his words: "go,   BUILD it"\ncause step: hook.js:decide · change: 3 lines · new parts: 0')]);
check('R7 quote with other case and spacing -> allow', !rr.deny, rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, A('his words: "Go it"\ncause step: hook.js:decide · change: 3 lines · new parts: 0')]);
check('R8 quote under 8 characters counts as missing -> deny', rr.deny && /missing line: his words/.test(rr.reason), rr.reason.slice(0, 160));
rr = run(NEWMEM, [HIS, A(GOOD)]);
check('R9 creating a memory file while saying new parts: 0 -> deny', rr.deny && /does not exist yet/.test(rr.reason), rr.reason.slice(0, 160));
rr = run(NEWMEM, [HIS, A('his words: "Go, build it"\ncause step: MEMORY.md:index · change: 2 lines · new parts: 1 · replaces: feedback_old')]);
check('R10 new memory file with new parts: 1 and the part it retires -> allow', !rr.deny, rr.reason.slice(0, 160));
rr = run(NEWMEM, [HIS, A('his words: "Go, build it"\ncause step: MEMORY.md:index · change: 2 lines · new parts: 1')]);
check('R11 new parts: 1 with no replaces -> deny', rr.deny && /needs replaces/.test(rr.reason), rr.reason.slice(0, 160));
rr = run(NEWMEM, [HIS, A('his words: "Go, build it"\ncause step: MEMORY.md:index · change: 2 lines · new parts: 1 · replaces: none: miya said nothing leaves here')]);
check('R12 new parts: 1 with replaces: none: <reason> -> allow', !rr.deny, rr.reason.slice(0, 160));
rr = run(NEWMEM, [HIS, A('his words: "Go, build it"\ncause step: MEMORY.md:index · change: 2 lines · new parts: 1 · replaces: TODO')]);
check('R13 replaces: TODO -> deny', rr.deny && /needs replaces/.test(rr.reason), rr.reason.slice(0, 160));
rr = run(EXSKILL, [HIS, ...CONSULT, A(GOOD)]);
check('R14 existing skill, all three lines -> allow', !rr.deny, rr.reason.slice(0, 160));
rr = run(EXSKILL, [HIS, ...CONSULT]);
check('R15 existing skill, no lines -> deny', rr.deny, rr.reason.slice(0, 160));
rr = run(EXRULE, [HIS, A('Editing the rule.')]);
check('R16 rule file (CLAUDE.md), no lines -> deny', rr.deny, rr.reason.slice(0, 160));
rr = run(EXMEM, [HIS, A('Editing the memory.')]);
check('R17 memory file, no lines -> deny', rr.deny, rr.reason.slice(0, 160));
rr = run(EXFEAT, [HIS, A('Editing the README.')]);
check('R18 Feature file (README), no lines -> deny', rr.deny, rr.reason.slice(0, 160));
rr = run(EXEVAL, [HIS, A('Adding a fixture.')]);
check('R19 a Feature eval file is exempt -> allow', !rr.deny, rr.reason.slice(0, 160));
rr = run(EXOTHER, [HIS, A('Saving the session.')]);
check('R20 a path outside the five classes -> allow', !rr.deny, rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, A('no lines')], '', { agent: true });
check('R21 inside a subagent (agent_id) -> allow, its caller carries the lines', !rr.deny, rr.reason.slice(0, 160));
rr = run(EXMEM, [HIS, A('no lines')], '', { noSession: true });
check('R22 no session_id (older synthetic input) -> allow', !rr.deny, rr.reason.slice(0, 160));
rr = run(EXHOOK, [{ role: 'user', text: 'Fix the typo in the hook. [skip-step3: one-word typo]' }, ...CONSULT, A('no lines')]);
check('R23 [skip-step3: reason] in HIS message -> allow', !rr.deny, rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, A(GOOD), { role: 'user', text: 'Now do the next thing' }, A('Editing again.')]);
check('R24 lines from an EARLIER turn do not carry over -> deny', rr.deny && /missing line: his words/.test(rr.reason), rr.reason.slice(0, 160));
rr = run(EXMEM, [HIS, A('no lines')], '', { badTranscript: true });
check('R25 transcript unreadable -> allow (fail open)', !rr.deny, rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, A('his words: "Go, build it"\ncause step: <file:function>\nnew parts: 0')]);
check('R26 cause step left as the <placeholder> -> deny', rr.deny && /missing line: cause step/.test(rr.reason), rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, A('his words: "Go, build it" · cause step: hook.js:decide · change: 3 lines · new parts: 0')]);
check('R27 all three on one line -> allow', !rr.deny, rr.reason.slice(0, 160));
rr = run(HIGH, [HIS, ...CONSULT, FABLE_CALL, A(GOOD)], '');
check('R28 a highest-order path still needs the full STEP-3 block whatever the rider lines say -> deny', rr.deny && /no STEP-3 block/.test(rr.reason), rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, { role: 'user', text: 'Earlier ask: make the gate quieter' }, HIS, A('his words: "make the gate quieter"\ncause step: hook.js:decide · change: 3 lines · new parts: 0')]);
check('R29 quote from an earlier message of his (within his last 20) -> allow (accepted: any of his recent words)', !rr.deny, rr.reason.slice(0, 160));
rr = run(EXHOOK, [HIS, ...CONSULT, A(GOOD), A('Now editing.')]);
check('R30 lines in the first text block of the turn, a second block after it -> allow', !rr.deny, rr.reason.slice(0, 160));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\nstep3-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
