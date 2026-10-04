#!/usr/bin/env node
// hook-syntax-check.eval.js — install pins (I1-I3, core/forge.js install 2026-10-05) + behaviour
// fixtures for v2 (S1-S10: cache, coverage of wrapped targets + bundle children, ship-check, fail-open).
// Replay case: 2026-06-20 silent-claim-drift-gate.js threw on every run for ~3 weeks, unnoticed.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const HOOK = path.join(__dirname, 'hook-syntax-check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// ── install pins ──
const c = spawnSync(process.execPath, ['--check', HOOK], { encoding: 'utf8' });
check('I1 hook file parses (node --check)', c.status === 0, (c.stderr || '').slice(0, 160));
let reg = ''; try { reg = fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'); } catch (_) {}
check('I2 registered at its Feature home', reg.replace(/\\\\+/g, '/').includes('domain/hook-syntax-check/hook-syntax-check.hook.js'), 'not found in settings.json');
check('I3 old loose copy is gone', !fs.existsSync(path.join(ROOT, '.claude', 'hooks', 'hook-syntax-check.js')), 'old file still present');

// ── behaviour, in a sandbox repo ──
const SB = fs.mkdtempSync(path.join(os.tmpdir(), 'hsc-eval-'));
const wr = (rel, s) => { fs.mkdirSync(path.dirname(path.join(SB, rel)), { recursive: true }); fs.writeFileSync(path.join(SB, rel), s); };
const git = (...a) => spawnSync('git', ['-C', SB, ...a], { encoding: 'utf8' });
const OK = "process.exit(0);\n", BAD = "const x = ;\n";
wr('lib/hook-runtime.js', OK); wr('lib/dispatch-hooks.js', OK);
wr('.claude/hooks/ok.js', OK); wr('.claude/hooks/wrapped-bad.js', BAD);
wr('domain/b/bundled-ok.hook.js', OK); wr('domain/b/bundled-bad.hook.js', BAD);
wr('.claude/hooks/untracked-ok.js', OK);
wr('domain/bundles/stop.json', JSON.stringify({ children: ['domain/b/bundled-ok.hook.js', 'domain/b/bundled-bad.hook.js'] }));
const cmd = (s) => ({ type: 'command', command: s });
const settings = () => ({ hooks: {
  SessionStart: [{ hooks: [
    cmd('node "${CLAUDE_PROJECT_DIR}\\\\.claude\\\\hooks\\\\ok.js"'),
    cmd('node "${CLAUDE_PROJECT_DIR}\\lib\\hook-runtime.js" --wrap "${CLAUDE_PROJECT_DIR}\\.claude\\hooks\\wrapped-bad.js" SessionStart'),
    cmd('node "${CLAUDE_PROJECT_DIR}\\\\.claude\\\\hooks\\\\missing.js"'),
    cmd('node "${CLAUDE_PROJECT_DIR}\\\\.claude\\\\hooks\\\\untracked-ok.js"'),
  ] }],
  Stop: [{ hooks: [cmd('node "${CLAUDE_PROJECT_DIR}\\lib\\dispatch-hooks.js" --manifest "domain/bundles/stop.json" --event Stop')] }],
} });
wr('.claude/settings.json', JSON.stringify(settings(), null, 2));
git('init', '-q'); git('add', 'lib', 'domain', '.claude/settings.json', '.claude/hooks/ok.js', '.claude/hooks/wrapped-bad.js');
const env = { ...process.env, CLAUDE_PROJECT_DIR: SB, HOOK_SYNTAX_CACHE: path.join(SB, 'cache.json'), HOOK_SYNTAX_LOG: path.join(SB, 'log.jsonl') };
const run = () => spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 120000, env });
const lastLog = () => { const l = fs.readFileSync(path.join(SB, 'log.jsonl'), 'utf8').trim().split('\n'); return JSON.parse(l[l.length - 1]); };
const ctx = (r) => { try { return JSON.parse(r.stdout).hookSpecificOutput.additionalContext; } catch (_) { return r.stdout || ''; } };

let r = run(); let out = ctx(r);
check('S1 a WRAPPED hook with a syntax error is named (v1 checked the wrapper instead)', /wrapped-bad\.js — .*(SyntaxError|Unexpected)/.test(out), out.slice(0, 300));
check('S2 a BUNDLE child with a syntax error is named (v1 never read manifests)', /bundled-bad\.hook\.js — /.test(out), out.slice(0, 300));
check('S3 a registered file that does not exist is a path ghost', /missing\.js — MISSING FILE/.test(out), out.slice(0, 300));
check('S4 a registered file that is not git-tracked fails the ship-check', /untracked-ok\.js — SHIP-CHECK/.test(out), out.slice(0, 400));
check('S5 clean files are not named, exit 0', r.status === 0 && !/ ok\.js —|bundled-ok/.test(out), out.slice(0, 300));
let lg = lastLog();
check('S6 cold run: every existing file checked, none cached, one log row with dur_ms', lg.checked === 7 && lg.cached === 0 && lg.broken === 4 && typeof lg.dur_ms === 'number', JSON.stringify(lg));

r = run(); out = ctx(r); lg = lastLog();
check('S7 warm run: the 5 passing files come from the cache, only the 2 broken ones are re-checked', lg.cached === 5 && lg.checked === 2, JSON.stringify(lg));
check('S7b a broken file is never cached: still reported on the warm run', /wrapped-bad\.js/.test(out) && /bundled-bad\.hook\.js/.test(out), out.slice(0, 300));

wr('.claude/hooks/ok.js', BAD + '// changed\n');                                   // a passing file is edited and now broken
r = run(); out = ctx(r); lg = lastLog();
check('S8 an edited file is re-checked (cache keyed on mtime + size) and its new error is named', / ok\.js — /.test(out) && lg.checked === 3, JSON.stringify(lg) + out.slice(0, 200));

wr('.claude/hooks/ok.js', OK); wr('.claude/hooks/wrapped-bad.js', OK); wr('domain/b/bundled-bad.hook.js', OK);
const s2 = settings(); s2.hooks.SessionStart[0].hooks.splice(2, 1);                // drop the missing.js registration
wr('.claude/settings.json', JSON.stringify(s2, null, 2)); git('add', '.claude/hooks/untracked-ok.js');
r = run();
check('S9 everything clean → silent (no stdout), exit 0', r.status === 0 && r.stdout === '', 'exit=' + r.status + ' out=' + r.stdout.slice(0, 200));
r = run(); lg = lastLog();
check('S9b and the next run checks nothing at all', lg.checked === 0 && lg.cached === 7 && lg.broken === 0, JSON.stringify(lg));

// S11 a cold run that is killed part-way must not start from zero next time: progress is saved every 20 files
{
  const many = { hooks: { Stop: [{ hooks: [] }] } };
  for (let i = 0; i < 45; i++) { wr(`.claude/hooks/m${i}.js`, OK); many.hooks.Stop[0].hooks.push(cmd('node "${CLAUDE_PROJECT_DIR}\\\\.claude\\\\hooks\\\\m' + i + '.js"')); }
  wr('.claude/settings.json', JSON.stringify(many, null, 2)); git('add', '.claude');
  fs.rmSync(path.join(SB, 'cache.json'), { force: true });
  const killed = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 2500, env: { ...env, HOOK_SYNTAX_SAVE_EVERY: '3' } });   // killed before 45 checks finish
  let saved = 0; try { saved = Object.keys(JSON.parse(fs.readFileSync(path.join(SB, 'cache.json'), 'utf8'))).length; } catch (_) {}
  check('S11 a run killed part-way leaves saved progress (or already finished)', saved >= 2 || killed.status === 0, 'saved=' + saved + ' status=' + killed.status + ' signal=' + killed.signal);
  r = run(); lg = lastLog();
  check('S11b the next run finishes the rest and everything is cached after it', lg.broken === 0 && lg.checked + lg.cached === 45, JSON.stringify(lg));
}

wr('.claude/settings.json', '{ not json');
r = run();
check('S10 unreadable settings.json → fail-open: exit 0, no output, no crash', r.status === 0 && r.stdout === '', 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 160));
try { fs.rmSync(SB, { recursive: true, force: true }); } catch (_) {}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nhook-syntax-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
