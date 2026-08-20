#!/usr/bin/env node
// deploy-merge-surface.eval.js — replay eval (born WITH the component).
// Replay: 2026-08-20 #276181/276182 — silent cherry-picks onto int-env, choice never shown to miya.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'deploy-merge-surface.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function transcriptWith(text) {
  const p = path.join(os.tmpdir(), 'dms-eval-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(p, JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } }) + '\n');
  return p;
}
function run(cmd, turnText) {
  const t = turnText != null ? transcriptWith(turnText) : '';
  const stdin = JSON.stringify({ tool_name: 'Bash', tool_input: { command: cmd }, transcript_path: t });
  return spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: process.env });
}

// F1: non-cherry-pick command → silent (exit 0)
let r = run('git push origin HEAD:refs/heads/mlk/int-env', '');
check('F1 non-cherry-pick → silent', r.status === 0, 'exit=' + r.status);

// F2: REPLAY — cherry-pick with NO decision token → BLOCK (exit 2)
r = run('git cherry-pick 5439566e90', 'cherry-picking the bezaLuas commit onto int-env');
check('F2 cherry-pick without decision → BLOCK', r.status === 2 && /deploy-merge-surface/i.test(r.stdout || ''), 'exit=' + r.status + ' out=' + (r.stdout || '').slice(0, 40));

// F3: cherry-pick WITH the decision token → silent pass
r = run('git cherry-pick 5439566e90', 'surfaced 25..7 to miya [deploy-merge-decision: cherrypick - merge drags 18 release/1.3.5 commits]');
check('F3 decision token present → pass', r.status === 0, 'exit=' + r.status);

// F4: cherry-pick --continue (mid-conflict) → silent (not a new decision)
r = run('GIT_EDITOR=true git cherry-pick --continue', 'resolving the conflict');
check('F4 --continue → silent', r.status === 0, 'exit=' + r.status);

// F5: cherry-pick --abort → silent
r = run('git cherry-pick --abort', 'aborting');
check('F5 --abort → silent', r.status === 0, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ndeploy-merge-surface.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
