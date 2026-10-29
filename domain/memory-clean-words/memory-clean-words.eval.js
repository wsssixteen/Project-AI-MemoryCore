#!/usr/bin/env node
// memory-clean-words.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: Write daily-diary/current/2026-10-28.md with a quote of miya swearing -> blocked; same entry written as (angry) plus the plain words -> allowed
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'memory-clean-words.check.hook.js');
const ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
// Swear words are built from pieces so this file itself stays clean of them.
const F = 'fu' + 'ck', S = 'sh' + 'it';
function run(obj, raw) {
  return spawnSync(process.execPath, [HOOK], { input: raw !== undefined ? raw : JSON.stringify(obj), encoding: 'utf8', timeout: 30000, env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: ROOT }) });
}
const W = (p, content) => ({ tool_name: 'Write', tool_input: { file_path: p, content } });
const E = (p, s) => ({ tool_name: 'Edit', tool_input: { file_path: p, old_string: 'x', new_string: s } });
const DIARY = path.join(ROOT, 'daily-diary', 'current', '2026-10-28.md');

let r = run({}, '{}');
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);
r = run(W(DIARY, 'He said "what the ' + F + ' is this reply?"'));
check('F2 replay: diary Write with his swearing → BLOCK', r.status === 2 && /memory-clean-words/.test(r.stderr), 'exit=' + r.status);
r = run(W(DIARY, 'He said "what is this reply?" (frustrated)'));
check('F3 replay: same entry as (frustrated) → allow', r.status === 0, 'exit=' + r.status);
r = run(E(path.join(ROOT, 'main', 'main-memory.md'), 'you did ' + S + ' all day'));
check('F4 main-memory Edit with swearing → BLOCK', r.status === 2, 'exit=' + r.status);
r = run(E(path.join(ROOT, '.claude', 'auto-memory', 'feedback_x.md'), 'BE ' + F.toUpperCase() + 'ING CONCISE'));
check('F5 auto-memory note, upper case → BLOCK', r.status === 2, 'exit=' + r.status);
r = run({ tool_name: 'MultiEdit', tool_input: { file_path: DIARY, edits: [{ old_string: 'a', new_string: 'fine' }, { old_string: 'b', new_string: 'a ' + F + 'ing mess' }] } });
check('F6 MultiEdit, swear in the second edit → BLOCK', r.status === 2, 'exit=' + r.status);
r = run(W(path.join(ROOT, 'domain', 'x', 'README.md'), 'what the ' + F));
check('F7 non-memory path (domain/) → allow', r.status === 0, 'exit=' + r.status);
r = run(W(path.join(ROOT, 'domain', 'notes.md'), 'what the ' + F));
check('F8 domain/<file> is not main/ ("domain" ends in "main") → allow', r.status === 0, 'exit=' + r.status);
r = run(W(DIARY, 'The evidence was damning; a Scunthorpe-free day.'));
check('F9 "damning" is not a swear word → allow', r.status === 0, 'exit=' + r.status);
r = run({ tool_name: 'Read', tool_input: { file_path: DIARY } });
check('F10 other tools pass through', r.status === 0, 'exit=' + r.status);
r = run(null, 'not json');
check('F11 malformed stdin fails open', r.status === 0, 'exit=' + r.status);
r = run(W(path.join(ROOT, '.claude', 'worktrees', 'wt1', 'daily-diary', 'current', 'd.md'), 'what the ' + F));
check('F12 worktree copy of a memory path → BLOCK', r.status === 2, 'exit=' + r.status);

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12, verdicts:
//  1. own help text in transcript — handled: the hook reads only tool_input, never the transcript.
//  2. malformed stdin — fixture F11.
//  3. worktree vs main path — fixture F12 (pattern matches the path tail).
//  4. eval-sandbox copy — accepted-risk: requires ROOT/lib; CLAUDE_PROJECT_DIR is set in the eval.
//  5. bundle vs direct — handled: direct registration via forge.
//  6. concurrent sessions — handled: stateless.
//  7. lib/clean-words.js deleted — accepted-risk: require throws, hook-runtime fails open.
//  8. bypass token — handled: there is none on purpose.
//  9. huge content — handled: one regex per line.
// 10. writes through PowerShell/Bash (Add-Content) — NOT covered here; caught at Domain Expansion by lib/save-rules.js `no-swearing`.
// 11. "damning"/"Scunthorpe" false positives — fixture F9.
// 12. "domain/" path misread as "main/" — fixture F8.

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nmemory-clean-words.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
