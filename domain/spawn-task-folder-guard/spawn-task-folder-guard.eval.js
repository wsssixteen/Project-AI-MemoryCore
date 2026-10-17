#!/usr/bin/env node
// spawn-task-folder-guard.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-10-17 DawahMap ticket 11: spawn_task with cwd = projects\coding-projects\active\DawahMap (projects/ is gitignored);
// the started session landed in DawahMap\.claude\worktrees\funny-swirles-d55a3d without DawahMap and could not run.
// Usage: node domain/spawn-task-folder-guard/spawn-task-folder-guard.eval.js [--table]
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'spawn-task-folder-guard.check.hook.js');
const ROOT = path.resolve(__dirname, '..', '..');
const DAWAH = path.join(ROOT, 'projects', 'coding-projects', 'active', 'DawahMap');
const TOOL = 'mcp__ccd_session__spawn_task';
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
function run(stdin) {
  const r = spawnSync(process.execPath, [HOOK], { input: typeof stdin === 'string' ? stdin : JSON.stringify(stdin), encoding: 'utf8', timeout: 60000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
  return { code: r.status, err: r.stderr || '', out: r.stdout || '' };
}
const call = (ti) => ({ tool_name: TOOL, tool_input: Object.assign({ title: 't', tldr: 'x', prompt: 'do it' }, ti) });
const hasDawah = fs.existsSync(DAWAH);

// F1 clean input
let r = run('{}'); check('F1 clean input exits 0 (no false block)', r.code === 0, 'exit=' + r.code);
// F2 THE REPLAY CASE: cwd = the DawahMap folder (gitignored) -> BLOCK, message names the worktree copy and the path
r = run(call({ cwd: DAWAH }));
check('F2 replay: spawn_task with cwd = DawahMap folder is BLOCKED (exit 2)', !hasDawah || r.code === 2, 'exit=' + r.code + ' ' + r.err.slice(0, 160));
check('F2b the block message names the worktree copy and the DawahMap path', !hasDawah || (/worktree copy/.test(r.err) && r.err.includes('DawahMap')), r.err.slice(0, 200));
// F3 no cwd, the prompt names the DawahMap path (with spaces in the repo path)
r = run(call({ prompt: 'Run the test in ' + DAWAH + '\\wayfinder\\foundation and report.' }));
check('F3 prompt naming a path inside DawahMap is BLOCKED', !hasDawah || r.code === 2, 'exit=' + r.code);
// F4 cwd = the repo root -> pass
r = run(call({ cwd: ROOT })); check('F4 cwd = repo root passes', r.code === 0, 'exit=' + r.code + ' ' + r.err.slice(0, 120));
// F5 cwd = a tracked folder -> pass
r = run(call({ cwd: path.join(ROOT, 'domain', 'project-load') })); check('F5 cwd = tracked folder domain\\project-load passes', r.code === 0, 'exit=' + r.code + ' ' + r.err.slice(0, 120));
// F6 bypass token with a reason -> pass
r = run(call({ cwd: DAWAH, prompt: 'x [skip-spawn-task-folder-guard: the task only reads the tracked lib folder] y' })); check('F6 bypass token with a reason passes', r.code === 0, 'exit=' + r.code);
// F7 malformed JSON -> fail open
r = run('{not json'); check('F7 malformed stdin fails open (exit 0)', r.code === 0, 'exit=' + r.code);
// F8 another tool with the same input -> not this guard's business
r = run({ tool_name: 'Bash', tool_input: { cwd: DAWAH, command: 'ls' } }); check('F8 a different tool name passes', r.code === 0, 'exit=' + r.code);
// F9 an untracked (not ignored) new folder inside the repo -> BLOCK
const tmpU = path.join(ROOT, 'domain', 'spawn-task-folder-guard', '_eval-untracked-' + process.pid);
fs.mkdirSync(tmpU, { recursive: true }); fs.writeFileSync(path.join(tmpU, 'a.txt'), 'x');
r = run(call({ cwd: tmpU })); check('F9 an untracked new folder inside the repo is BLOCKED', r.code === 2, 'exit=' + r.code + ' ' + r.err.slice(0, 120));
try { fs.rmSync(tmpU, { recursive: true, force: true }); } catch (_) {}
// F10 a folder outside any git repo -> pass (no worktree copy is made from it)
const tmpO = fs.mkdtempSync(path.join(os.tmpdir(), 'stfg-'));
r = run(call({ cwd: tmpO })); check('F10 a folder outside any git repo passes', r.code === 0, 'exit=' + r.code);
try { fs.rmSync(tmpO, { recursive: true, force: true }); } catch (_) {}
// F11 path in quotes with a trailing full stop
r = run(call({ prompt: 'Folder: "' + DAWAH + '".' })); check('F11 quoted path with a trailing full stop is BLOCKED', !hasDawah || r.code === 2, 'exit=' + r.code);
// F12 forward slashes
r = run(call({ cwd: DAWAH.replace(/\\/g, '/') })); check('F12 forward-slash path is BLOCKED', !hasDawah || r.code === 2, 'exit=' + r.code);
// F13 a path that does not exist (the job may create it) -> pass
r = run(call({ cwd: path.join(ROOT, 'domain', 'no-such-folder-' + process.pid) })); check('F13 a path not on disk passes (the job may create it)', r.code === 0, 'exit=' + r.code);
// F14 mixed: a tracked path and an ignored path named -> BLOCK, only the ignored one listed
r = run(call({ prompt: 'Read ' + path.join(ROOT, 'lib') + ' then ' + DAWAH }));
check('F14 tracked + ignored paths named: BLOCKED, the tracked one not listed', !hasDawah || (r.code === 2 && !/\\lib\s+\(/.test(r.err)), 'exit=' + r.code + ' ' + r.err.slice(0, 200));
// F15 empty tool_input -> pass
r = run({ tool_name: TOOL, tool_input: {} }); check('F15 empty tool_input passes', r.code === 0, 'exit=' + r.code);
// F16 bypass token with an empty reason -> still blocked
r = run(call({ cwd: DAWAH, prompt: '[skip-spawn-task-folder-guard: ]' })); check('F16 bypass with an empty reason is still BLOCKED', !hasDawah || r.code === 2, 'exit=' + r.code);
// F17 the guard's own block message pasted into a later task prompt names DawahMap -> blocked again (correct: the task still names it)
r = run(call({ cwd: ROOT, prompt: '⛔ spawn-task-folder-guard: ...\n   - ' + DAWAH + '  (gitignored)' })); check('F17 own block text pasted back still blocks (the path is still named)', !hasDawah || r.code === 2, 'exit=' + r.code);
// F18 registered in settings.json on PreToolUse with the spawn_task matcher
let reg = false; try { const s = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8')); reg = (s.hooks.PreToolUse || []).some(b => b.matcher === TOOL && (b.hooks || []).some(h => /spawn-task-folder-guard/.test(h.command))); } catch (_) {}
check('F18 registered in settings.json PreToolUse with matcher ' + TOOL, reg, 'not registered');
// F19 NUKE-MARKER present
check('F19 NUKE-MARKER.md present', fs.existsSync(path.join(__dirname, 'NUKE-MARKER.md')), 'missing');
// F20 a block writes a log row
let logged = false; try { logged = /"decision":"block"/.test(fs.readFileSync(path.join(__dirname, 'log.jsonl'), 'utf8')); } catch (_) {}
check('F20 a block writes a log row', !hasDawah || logged, 'no block row in log.jsonl');

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12: 20 scenarios, verdicts (fixture = encoded above)
const SCEN = [
  ['the replay: cwd = DawahMap (gitignored)', 'fixture-added F2, F2b'],
  ['only the prompt names the ignored path (no cwd)', 'fixture-added F3'],
  ['repo root as cwd', 'fixture-added F4'],
  ['tracked subfolder as cwd', 'fixture-added F5'],
  ['bypass token with a real reason', 'fixture-added F6'],
  ['malformed stdin', 'fixture-added F7 (fail open)'],
  ['matcher misfire: another tool reaches the hook', 'fixture-added F8'],
  ['untracked but not ignored new folder', 'fixture-added F9'],
  ['folder outside any git repo', 'fixture-added F10'],
  ['path wrapped in quotes or followed by punctuation', 'fixture-added F11'],
  ['forward slashes in the path', 'fixture-added F12'],
  ['a path not on disk yet', 'fixture-added F13'],
  ['tracked and ignored paths named together', 'fixture-added F14'],
  ['empty tool_input', 'fixture-added F15'],
  ['bypass token with an empty reason', 'fixture-added F16'],
  ['own block text pasted back into a prompt (self-reference)', 'fixture-added F17'],
  ['git missing or timing out', 'handled: git() returns not-ok, checkPath returns null, call passes (fail open)'],
  ['session running inside a worktree (CLAUDE_PROJECT_DIR = the worktree)', 'handled: every git call runs on the named path itself, never on ROOT'],
  ['a relative path in the prompt only ("wayfinder\\\\...")', 'accepted-risk: relative paths are not resolved; the cwd check still catches a job whose folder is ignored'],
  ['the user explicitly asks for a button on an untracked folder', 'accepted-risk: blocked until the bypass token states why; the worktree copy would still lack the folder, so blocking protects him'],
];
if (process.argv.includes('--table')) { console.log('| # | Scenario | Verdict |\n|---|---|---|'); SCEN.forEach((s, i) => console.log('| ' + (i + 1) + ' | ' + s[0] + ' | ' + s[1] + ' |')); }

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nspawn-task-folder-guard.eval: ' + (results.length - failed) + '/' + results.length + ' green · scenarios ' + SCEN.length);
process.exit(failed ? 1 : 0);
