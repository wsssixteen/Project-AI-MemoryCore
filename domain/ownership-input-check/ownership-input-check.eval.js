#!/usr/bin/env node
// ownership-input-check.eval.js — replay eval + adversarial fixtures (system-design Rule 12).
// Replay case: ADHOC-PRBB-2026-6 2026-09-30: closed OWNED-ELSEWHERE on relation et_ptg.log_service; the et_ptg came
// from the empty kodPejabat our MlkUtilitiPembatalanPermohonanForm.initBPMFlow passed (#282442 note 8)
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'ownership-input-check.check.hook.js');
const { decide, currentTurnText } = require(HOOK);
const ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'oic-'));
const LOG = path.join(TMP, 'log.jsonl');
function transcript(userText, assistantTexts) {
  const rows = [
    { type: 'user', message: { role: 'user', content: userText } },
    ...assistantTexts.map(t => ({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: t }] } })),
  ];
  const f = path.join(TMP, 't' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(f, rows.map(r => JSON.stringify(r)).join('\n'));
  return f;
}
function run(stdinObj) {
  return spawnSync(process.execPath, [HOOK], { input: typeof stdinObj === 'string' ? stdinObj : JSON.stringify(stdinObj),
    encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT, OIC_LOG: LOG } });
}
const blocked = r => r.status === 2 || /"decision"\s*:\s*"block"/.test(r.stdout || '');

// The founding miss — the 2026-09-30 close-out reply, verbatim shape.
const REPLAY = 'Root cause: table log_service missing in PROD GIS DB schema et_ptg. OWNED-ELSEWHERE common/GIS. ' +
  'Told common (Farhan) it is not our issue: error line only.';

// F1-F2 end-to-end through the real hook process
let r = run(transcript('why does Jana fail', [REPLAY]) && { transcript_path: transcript('why does Jana fail', [REPLAY]) });
check('F1 REPLAY 2026-09-30 OWNED-ELSEWHERE close blocks (end-to-end)', blocked(r), 'exit=' + r.status + ' out=' + (r.stdout || '').slice(0, 120));
check('F2 block reason renders the Input check instruction', /Input check:/.test((r.stderr || '') + (r.stdout || '')), (r.stderr || r.stdout || '').slice(0, 160));
r = run({ transcript_path: transcript('why', [REPLAY + '\nInput check: kodPejabat = "" from MlkUtilitiPembatalanPermohonanForm.java:346 → wrong'])});
check('F3 same reply WITH Input check line passes (end-to-end)', !blocked(r) && r.status === 0, 'exit=' + r.status);
r = run('{}');
check('F4 empty stdin JSON exits 0', r.status === 0, 'exit=' + r.status);
r = run('not json');
check('F5 malformed stdin exits 0', r.status === 0, 'exit=' + r.status);
r = run({ transcript_path: path.join(TMP, 'missing.jsonl') });
check('F6 missing transcript exits 0', r.status === 0, 'exit=' + r.status);
r = run({ transcript_path: transcript('x', [REPLAY]), stop_hook_active: true });
check('F7 stop_hook_active re-entry never blocks', r.status === 0 && !blocked(r), 'exit=' + r.status);

// Pure decide() scenarios
const D = t => decide(t);
check('F8 "not our issue" alone blocks', D('This is not our issue, pass to common.').block === true);
check('F9 Malay "bukan isu kami" blocks', D('Ini bukan isu kami, isu GIS.').block === true);
check('F10 "GIS issue" blocks', D('Seems like a GIS issue on their side.').block === true);
check('F11 "issue from common side" blocks', D('the issue is from the common side').block === true);
check('F12 no ownership verdict → no fire', D('Root cause: helper skips PRBB. Fix in pelupusan.').fire === false);
check('F13 placeholder "Input check: <value>" does NOT satisfy', D('OWNED-ELSEWHERE\nInput check: <value> = <what we sent>').block === true);
check('F14 bare "Input check:" with nothing after does NOT satisfy', D('not ours\nInput check:').block === true);
check('F15 help-text bypass "[skip-ownership-input: <why>]" does NOT disarm', D('OWNED-ELSEWHERE [skip-ownership-input: <why>]').block === true);
check('F16 real bypass reason passes', D('OWNED-ELSEWHERE [skip-ownership-input: DMS outage, we send no values]').bypass === true);
check('F17 table-cell Input check (| Input check: ...) passes', D('| C1 | common mask | OWNED-ELSEWHERE |\n| Input check: kodPejabat = 01 from umm_a_permohonan_tnh → correct |').block === false);
check('F18 bold "**Input check:** ..." passes', D('not our issue\n**Input check:** kodPejabat = "" from initBPMFlow:346 → wrong').block === false);
check('F19 word "common" without verdict ("common code") → no fire', D('The common code builds the schema from kodPejabat.').fire === false);

// currentTurnText: only the CURRENT turn is judged
const lines = [
  { type: 'user', message: { content: 'old ask' } },
  { type: 'assistant', message: { content: [{ type: 'text', text: 'OWNED-ELSEWHERE in an old turn' }] } },
  { type: 'user', message: { content: 'new ask' } },
  { type: 'assistant', message: { content: [{ type: 'text', text: 'Fix is in pelupusan.' }] } },
].map(o => JSON.stringify(o));
check('F20 verdict in an OLD turn does not fire on the new turn', D(currentTurnText(lines)).fire === false);
const lines2 = [
  { type: 'user', message: { content: 'ask' } },
  { type: 'assistant', message: { content: [{ type: 'text', text: 'not our issue' }, { type: 'tool_use', name: 'Read', input: {} }] } },
  { type: 'user', message: { content: [{ type: 'tool_result', content: 'x' }] } },
  { type: 'assistant', message: { content: [{ type: 'text', text: 'done' }] } },
].map(o => JSON.stringify(o));
check('F21 verdict before a tool_result in the SAME turn still counts', D(currentTurnText(lines2)).block === true);
check('F22 log row written on fire', fs.existsSync(LOG) && /blocked/.test(fs.readFileSync(LOG, 'utf8')), 'log missing');

// ═══ ADVERSARIAL SCENARIOS (Rule 12) — verdicts
// 1 own block text echoed by another hook in transcript → hook output is not assistant text → handled (F20/F21 scope)
// 2 help bypass token → fixture F15 · 3 placeholder proof → F13/F14 · 4 malformed stdin → F5 · 5 missing transcript → F6
// 6 re-entry loop → F7 · 7 old-turn verdict → F20 · 8 multi-message turn → F21 · 9 Malay verdict → F9
// 10 word "common" in neutral prose → F19 · 11 table-cell proof → F17 · 12 bold proof → F18
// 13 quoting a colleague's "not our issue" from Redmine → accepted-risk: an Input check line is still the right reply shape
// 14 discussing this gate itself (its phrases in prose) → accepted-risk: bypass with a real reason, logged
// 15 bundle dispatch vs direct run → handled: runHook emits the standard block shape dispatch-hooks aggregates
// 16 worktree vs main path → handled: ROOT from CLAUDE_PROJECT_DIR, lib/hook-runtime required from ROOT
// 17 huge transcript → handled: single pass, walk stops at the last user prompt
// 18 concurrent sessions appending log → accepted-risk: appendFileSync line writes, rotate monthly
// 19 hook-runtime missing → accepted-risk: require throws → node exits 1, harness treats non-2 as non-blocking
// 20 user instruction reversal — miya says "this one is common, close it" → still needs the Input check line; one line, cheap
// 21 genuine other-team issue with no input of ours (e.g. DMS down) → F16 bypass with reason
// 22 "OWNED-ELSEWHERE" inside a code block of a register row → fires; Input check line still required → accepted (intended)

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nownership-input-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
