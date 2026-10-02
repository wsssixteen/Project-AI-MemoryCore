#!/usr/bin/env node
// design-consult-gate.eval.js — fixture eval (added 2026-08-21 with the self-disarm fix).
// Replay: 2026-08-20/21 — the gate's own help text ("Add [skip-design-consult: <reason>]")
// in an earlier block message auto-bypassed every later fire for the whole session.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'design-consult-gate.gate.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function transcript(entries) {
  const p = path.join(os.tmpdir(), 'dcg-eval-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(p, entries.map(e => JSON.stringify({ type: e.role, message: { role: e.role, content: [{ type: 'text', text: e.text }] } })).join('\n') + '\n');
  return p;
}
function run(filePath, entries) {
  const stdin = JSON.stringify({ tool_name: 'Write', tool_input: { file_path: filePath, content: 'x' }, transcript_path: transcript(entries) });
  const r = spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: process.env });
  let deny = false, out = r.stdout || '';
  try { const o = JSON.parse(out); deny = o.hookSpecificOutput && o.hookSpecificOutput.permissionDecision === 'deny'; } catch (_) {}
  return { deny, out, status: r.status };
}

const GUARDED_PATH = 'C:\\repo\\domain\\some-gate\\some-gate.check.hook.js';
// A guarded path whose file EXISTS on disk — bypasses the new-file eval rider so
// T2/T4 test the consult branch alone.
const EXISTING_GUARDED = path.join(__dirname, 'design-consult-gate.gate.hook.js');
const HELP_TEXT = 'blocked: Add [skip-design-consult: <reason>] to your message.';

// T1 REPLAY: token only inside an OLD hook-feedback (user-role) message -> still BLOCKS
let r = run(GUARDED_PATH, [
  { role: 'user', text: HELP_TEXT },
  { role: 'assistant', text: 'working on it' },
  { role: 'user', text: 'continue' },
]);
check('T1 help-text echo does NOT disarm -> BLOCK', r.deny === true, JSON.stringify(r).slice(0, 80));

// T2: token deliberately written in CURRENT-turn assistant text -> bypass (no deny)
r = run(EXISTING_GUARDED, [
  { role: 'user', text: 'do the trivial edit' },
  { role: 'assistant', text: 'trivial rename only [skip-design-consult: comment-only edit]' },
]);
check('T2 current-turn assistant token -> bypass', r.deny === false, JSON.stringify(r).slice(0, 80));

// T3: no consult, no token -> BLOCK
r = run(GUARDED_PATH, [{ role: 'user', text: 'build it' }]);
check('T3 no consult -> BLOCK', r.deny === true, r.out.slice(0, 60));

// T4: both skills invoked earlier in session -> allowed
r = run(EXISTING_GUARDED, [
  { role: 'user', text: 'design it properly' },
  { role: 'assistant', text: 'Launching skill: system-rules' },
  { role: 'assistant', text: 'Launching skill: system-design' },
  { role: 'user', text: 'now build' },
]);
check('T4 both consults present -> allowed', r.deny === false, r.out.slice(0, 60));

// T5: unguarded path -> silent allow
r = run('C:\\repo\\some\\random.txt', [{ role: 'user', text: 'x' }]);
check('T5 unguarded path -> silent', r.deny === false && r.status === 0, 'exit=' + r.status);

// T6: token in an OLD assistant turn (before the last user message) -> still BLOCKS
r = run(GUARDED_PATH, [
  { role: 'assistant', text: 'earlier turn [skip-design-consult: old reason]' },
  { role: 'user', text: 'new ask, new turn' },
]);
check('T6 stale assistant token -> BLOCK', r.deny === true, r.out.slice(0, 60));

// ================= Stop side: proposal judge (2026-09-30, slip design-not-universal) =================
const pj = require('./proposal-judge.js');
function tr(entries) {
  return entries.map(e => {
    if (e.tool) return JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', name: e.tool, input: e.input }] } });
    if (e.result) return JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: e.result }] } });
    return JSON.stringify({ type: e.role, message: { role: e.role, content: [{ type: 'text', text: e.text }] } });
  }).join('\n') + '\n';
}
const SR = { tool: 'Skill', input: { skill: 'system-rules' } };
const SD = { tool: 'Skill', input: { skill: 'system-design' } };
const ASK = { role: 'user', text: 'Build a gate so a UI change is never handed back without tracing the submit path. Where will you build this?' };
// Founding replies of 2026-09-30, captured verbatim in shape.
const FOUND1 = "Short answer: I'd put the check in two places. The main one is inside the existing pre-code-check (the CODE-CHECK line), which fires at the Edit step. A thin new Stop gate sits behind it at hand-back. Edit time (primary): new required evidence row submit-path in domain\\pre-code-check\\pre-code-check.check.hook.js. Hand-back: new domain\\submit-path-gate\\ Stop hook registered next to fix-photo in settings.json.";
const FOUND3 = "The nearest thing to a unit test is a mechanical static check inside the hook, for this exact bug class: the hook reads the edited form's tugasan kod and greps whether that kod is in PENYEDIAAN_DOKUMEN_MODE_MAP or the initMode viewMode list, like analog TKJKKLPK. I'd add the static check on top of the SUBMIT-PATH line in the gate. Placement: both gates, pre-code-check only, or Stop gate only.";
const GOOD = FOUND1 + '\nUNIVERSAL: any change to what a screen shows, in any etanah module, urusan or state';
const S = [];
function sc(name, entries, expect) {
  const v = pj.judge(tr(entries));
  const got = v.blocked ? 'block' : (v.bypassed ? 'bypass' : (v.fired ? 'pass' : 'silent'));
  S.push(name);
  check(name + ' -> ' + expect, got === expect, got + ' ' + JSON.stringify(v.problems || []));
}
sc('P01 FOUNDING placement reply, no consult', [ASK, { role: 'assistant', text: FOUND1 }], 'block');
sc('P02 FOUNDING AskUserQuestion placement, no consult', [ASK, { tool: 'AskUserQuestion', input: { questions: [{ question: 'Where should the submit-path check live?', options: [{ label: 'Both', description: 'New submit-path row in pre-code-check blocks the edit; new Stop hook gate blocks the hand-back.' }, { label: 'Stop gate only', description: 'Only the new domain/submit-path-gate Stop hook.' }] }] } }], 'block');
sc('P03 FOUNDING tugasan-keyed static check, no consult', [ASK, { role: 'assistant', text: FOUND3 }], 'block');
sc('P04 consult ok + UNIVERSAL names a kod', [SR, SD, ASK, { role: 'assistant', text: FOUND1 + '\nUNIVERSAL: tugasan TKPDBB and its siblings' }], 'block');
sc('P05 consult ok + clean UNIVERSAL', [SR, SD, ASK, { role: 'assistant', text: GOOD }], 'pass');
sc('P06 consult ok + no UNIVERSAL line', [SR, SD, ASK, { role: 'assistant', text: FOUND1 }], 'block');
sc('P07 UNIVERSAL names a ticket number', [SR, SD, ASK, { role: 'assistant', text: FOUND1 + '\nUNIVERSAL: screens like #256334' }], 'block');
sc('P08 UNIVERSAL names an etanah class', [SR, SD, ASK, { role: 'assistant', text: FOUND1 + '\nUNIVERSAL: forms like MlkSuratTemplateForm' }], 'block');
sc('P09 UNIVERSAL names a permohonan id', [SR, SD, ASK, { role: 'assistant', text: FOUND1 + '\nUNIVERSAL: PTMLK/01/L/PDBB/2026/12 style screens' }], 'block');
sc('P10 UNIVERSAL names a constant', [SR, SD, ASK, { role: 'assistant', text: FOUND1 + '\nUNIVERSAL: every kod missing from DOKUMEN_MODE_MAP' }], 'block');
sc('P11 status reply, hook words but no proposal', [ASK, { role: 'assistant', text: 'The Stop hook fired on the last reply and the eval for the gate ran 26/26 green. The hook log shows two blocks today and the skill loaded fine. Nothing else changed in settings.json.' }], 'silent');
sc('P12 short reply', [ASK, { role: 'assistant', text: 'Still waiting on your answers.' }], 'silent');
sc('P13 etanah ticket reply, no component words', [ASK, { role: 'assistant', text: 'I would add the null guard at line 477 so the NPE stops. The permohonan PTMLK/01/L/PRBB/2026/12 sits at Penyediaan Borang 4Ce with login aqmar. Test by opening the tugasan and pressing Simpan then Hantar on local JBoss.' }], 'silent');
sc('P14 bypass with real reason', [ASK, { role: 'assistant', text: FOUND1 + '\n[skip-design-proposal: quoting the old reply for miya to compare]' }], 'bypass');
sc('P15 bypass placeholder never counts', [ASK, { role: 'assistant', text: FOUND1 + '\n[skip-design-proposal: <why>]' }], 'block');
sc('P16 bypass only in an old turn', [ASK, { role: 'assistant', text: 'x [skip-design-proposal: old reason here]' }, { role: 'user', text: 'new ask' }, { role: 'assistant', text: FOUND1 }], 'block');
sc('P17 only system-rules invoked', [SR, ASK, { role: 'assistant', text: GOOD }], 'block');
sc('P18 consult seen as Launching skill tool_result', [{ result: 'Launching skill: system-rules' }, { result: 'Launching skill: system-design' }, ASK, { role: 'assistant', text: GOOD }], 'pass');
sc('P19 own help line quoted back as UNIVERSAL', [SR, SD, ASK, { role: 'assistant', text: FOUND1 + '\nUNIVERSAL: <the class of cases this covers, e.g. any screen change in any etanah module>' }], 'block');
sc('P20 skill body user message does not reset the turn', [SR, ASK, { role: 'assistant', text: FOUND1 }, SD, { role: 'user', text: 'Base directory for this skill: C:\\x\\system-design\n# /system-design' }, { role: 'assistant', text: '\nUNIVERSAL: any change to what a screen shows, in any etanah module' }], 'pass');
sc('P21 malformed transcript lines', [], 'silent');
sc('P22 allowed caps words on UNIVERSAL', [SR, SD, ASK, { role: 'assistant', text: FOUND1 + '\nUNIVERSAL: any screen change in AWAM or PROD code, every etanah module' }], 'pass');
sc('P29 FOUNDING short-sentence placement reply', [ASK, { role: 'assistant', text: '## 2. Where the check lives\n| both | At the edit and at the hand-back | stops the bad edit |\n| pcc | Only at the edit, inside pre-code-check | the bad edit only |\n| stop | Only at the hand-back | after code is written |\n- I recommend both.\n- The slip happened at the edit, and the Stop hook only sees the reply.' }], 'block');
// Replay false alarms found by the 832-turn sweep (past-tense reports that mention checks/gates/paths).
sc('P26 past report: closed an old check on a gate', [SR, SD, ASK, { role: 'assistant', text: 'I closed the old overdue check on the previous version because the new check on this gate replaces it. The hook in domain\\x\\x.check.hook.js ran green and settings.json is unchanged. Nothing else is left for this session and the eval stayed green.' }], 'silent');
sc('P27 past report: where a finding lives', [ASK, { role: 'assistant', text: '**Where this finding now lives**: the knowledge file and the qa_doc. The Stop hook fired once and the skill loaded. I recorded the gate result in the log and the eval is green for the hook.' }], 'silent');
sc('P28 past report: routed then updated', [SR, SD, ASK, { role: 'assistant', text: 'Done. I routed through system-design and system-rules first this time, then made the update to .claude/skills/deploy/SKILL.md. The hook eval ran 12/12 and the gate is unchanged.' }], 'silent');
{ const v = pj.judge('not json\n{bad\n\n'); check('P23 garbage transcript -> silent, no throw', v.fired === false, JSON.stringify(v)); }
{ // P24 hook end-to-end: Stop event via the real hook file blocks the founding reply (exit 2 + reason on stderr)
  const p = path.join(os.tmpdir(), 'dcg-stop-' + Date.now() + '.jsonl');
  fs.writeFileSync(p, tr([ASK, { role: 'assistant', text: FOUND1 }]));
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ hook_event_name: 'Stop', transcript_path: p }), encoding: 'utf8', timeout: 30000, env: process.env });
  check('P24 real hook, Stop event, founding reply -> exit 2 + reason rendered', r.status === 2 && /UNIVERSAL:/.test(r.stderr) && /system-rules/.test(r.stderr), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 80));
  const r2 = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ hook_event_name: 'Stop' }), encoding: 'utf8', timeout: 30000, env: process.env });
  check('P25 real hook, Stop event, no transcript -> exit 0', r2.status === 0, 'exit=' + r2.status);
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\ndesign-consult-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
