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
  return 'STEP-3: test\n' + Object.entries(f).filter(([, v]) => v !== null).map(([k, v]) => k + ': ' + v).join('\n') + '\n';
}
function run(filePath, entries, sessionText, opts) {
  const o = opts || {};
  const sf = path.join(TMP, 's-' + Math.random().toString(36).slice(2) + '.md');
  fs.writeFileSync(sf, sessionText || '');
  const input = { tool_name: 'Write', tool_input: { file_path: filePath, content: 'x' }, transcript_path: transcript(entries) };
  if (!o.noSession) input.session_id = SID; else input.transcript_path = '';
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

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\nstep3-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
