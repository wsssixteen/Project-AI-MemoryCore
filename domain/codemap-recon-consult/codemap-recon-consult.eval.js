#!/usr/bin/env node
// codemap-recon-consult.eval.js — replay eval for the Stop back-gate
// (domain/codemap-recon-consult/codemap-recon-consult.discipline.hook.js).
// Replay cases per external-audit/sprint-analysis/blockcap-fixtures.json entry
// "domain/codemap-recon-consult/codemap-recon-consult.discipline.hook.js".
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'codemap-recon-consult.discipline.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const tmpDir = os.tmpdir();
const tmpFiles = [];
function writeTmp(name, content) {
  const p = path.join(tmpDir, name);
  fs.writeFileSync(p, content, 'utf8');
  tmpFiles.push(p);
  return p;
}
function jl(obj) { return JSON.stringify(obj); }

// ---- fixture pieces ----------------------------------------------------
const USER_LINE = jl({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'please investigate QA-268888' }] } });

// >=400 char root-cause claim with a CODE_SIGNAL (.java + NullPointer + :line)
const ROOT_CAUSE_TEXT =
  'The root cause is a NullPointerException thrown in MlkSemakanForm.java():214 because the getter returns null ' +
  'before validation runs. I traced the populator chain from the form bean through the base class and confirmed ' +
  'the field is never initialised on the very first entry into that method, which is why the value is missing ' +
  'whenever the applicant reopens the draft after saving it the first time around today.';

const GIT_LOG_TOOL_LINE = jl({ type: 'assistant', message: { role: 'assistant', content: [
  { type: 'tool_use', name: 'Bash', input: { command: 'git log --oneline -20 -- MlkSemakanForm.java' } },
] } });
const CODEGRAPH_TOOL_LINE = jl({ type: 'assistant', message: { role: 'assistant', content: [
  { type: 'tool_use', name: 'mcp__codegraph__search', input: { symbol: 'MlkSemakanForm' } },
] } });
function assistantTextLine(text) {
  return jl({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });
}

// active.txt fixture (quest active)
const activeTxtPath = writeTmp('fixture-codemap-active.txt', 'qa=QA-268888\nstatus=active\n');

// F1 — clean: short text, no claim at all → must NOT block
const cleanShortTranscript = writeTmp('fixture-codemap-clean-short.jsonl', [
  USER_LINE,
  assistantTextLine('Looked at the ticket, nothing conclusive yet, will keep checking.'),
].join('\n'));

// F2 — trigger: root-cause + code signal, quest active, NO git-history probe this turn → must BLOCK
const triggerTranscript = writeTmp('fixture-codemap-trigger.jsonl', [
  USER_LINE,
  assistantTextLine(ROOT_CAUSE_TEXT),
].join('\n'));

// F3 — bypass token: same root-cause text but with [skip-codegraph: ...] → must PASS (EXEMPT)
const bypassTranscript = writeTmp('fixture-codemap-bypass.jsonl', [
  USER_LINE,
  assistantTextLine(ROOT_CAUSE_TEXT + ' [skip-codegraph: pure DB diagnosis]'),
].join('\n'));

// F4 — full clean: git-history probe run AND codegraph call run this turn → must PASS
const fullCleanTranscript = writeTmp('fixture-codemap-full-clean.jsonl', [
  USER_LINE,
  GIT_LOG_TOOL_LINE,
  CODEGRAPH_TOOL_LINE,
  assistantTextLine(ROOT_CAUSE_TEXT),
].join('\n'));

// F5 — git-history run but NO codegraph call (git-history branch passes, then codegraph branch blocks)
const gitOnlyTranscript = writeTmp('fixture-codemap-git-only.jsonl', [
  USER_LINE,
  GIT_LOG_TOOL_LINE,
  assistantTextLine(ROOT_CAUSE_TEXT),
].join('\n'));

function run(transcriptPath, activeTxt) {
  const env = { ...process.env, CLAUDE_PROJECT_DIR: path.resolve(__dirname, '..', '..') };
  if (activeTxt) env.CODEGRAPH_GATE_ACTIVE_TXT = activeTxt;
  else env.CODEGRAPH_GATE_ACTIVE_TXT = path.join(tmpDir, 'fixture-codemap-no-active.txt');
  const stdin = jl({ transcript_path: transcriptPath, stop_hook_active: false });
  return spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env });
}

function isBlock(r) {
  if (r.status === 2) return true;
  try {
    const out = JSON.parse((r.stdout || '').trim());
    return out && out.decision === 'block';
  } catch (_) { return false; }
}

// ensure the "no active quest" fixture file simply doesn't have status=active
writeTmp('fixture-codemap-no-active.txt', 'qa=QA-000000\nstatus=hold\n');

// F1
let r = run(cleanShortTranscript, activeTxtPath);
check('F1 clean input (short text) does NOT block', !isBlock(r), 'stdout=' + (r.stdout || '').slice(0, 160));

// F2
r = run(triggerTranscript, activeTxtPath);
check('F2 trigger input (root-cause, quest active, no git-log) BLOCKS', isBlock(r), 'stdout=' + (r.stdout || '').slice(0, 200));
if (isBlock(r)) {
  const out = JSON.parse(r.stdout.trim());
  check('F2 block reason names git-history probe', /git-history/i.test(out.reason || ''), (out.reason || '').slice(0, 100));
}

// F3 — bypass token
r = run(bypassTranscript, activeTxtPath);
check('F3 bypass token [skip-codegraph:] passes', !isBlock(r), 'stdout=' + (r.stdout || '').slice(0, 160));

// F4 — full clean (git-history + codegraph both run)
r = run(fullCleanTranscript, activeTxtPath);
check('F4 full clean (git-log + codegraph run) passes', !isBlock(r), 'stdout=' + (r.stdout || '').slice(0, 200));

// F5 — git-history run but codegraph missing → still blocks (codegraph branch)
r = run(gitOnlyTranscript, activeTxtPath);
check('F5 git-log present but no codegraph call BLOCKS (codegraph branch)', isBlock(r), 'stdout=' + (r.stdout || '').slice(0, 200));
if (isBlock(r)) {
  const out = JSON.parse(r.stdout.trim());
  check('F5 block reason names codegraph (not git-history)', /codegraph-back-gate:/.test(out.reason || '') && !/git-history\)/.test(out.reason || ''), (out.reason || '').slice(0, 100));
}

// ---- summary ------------------------------------------------------------
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ncodemap-recon-consult.eval: ' + (results.length - failed) + '/' + results.length + ' green');

for (const f of tmpFiles) { try { fs.unlinkSync(f); } catch (_) {} }

process.exit(failed ? 1 : 0);
