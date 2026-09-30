#!/usr/bin/env node
// pymtime-handover.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-09-28 miya: colleagues run PymTime check via Claude Code and paste the handover back to us; YOU need to be aware of this even in a different session
// Every fixture is a real stdin → stdout round trip through the registered hook file.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'pymtime-handover.check.hook.js');
const ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
const run = (stdin, env = {}) => { const r = spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT, ...env } }); return { status: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
const ask = (prompt, env) => run(JSON.stringify({ prompt, hook_event_name: 'UserPromptSubmit', session_id: 'eval' }), env);
const fired = (o) => /pymtime-handover: a PymTime HANDOVER/.test(o.out);

// The block exactly as E:\Dev\scripts\PymTime\lib\handover.js writes it (real v17 output shape).
const BLOCK = [
  '===== PYMTIME HANDOVER v1 =====',
  'Send this whole block, from the first ===== line to the last, to Ridhwan. It holds no password.',
  'Person  : Aaron (aaron)',
  'Result  : NOT READY. Your saved Protime password can be read back: FAILED.',
  'When    : 2026-09-28 09:29 | check took 61 s',
  'Checks  : 20 ok | 1 FAIL | 0 warn | 0 not tested',
  '  FAIL Your saved Protime password can be read back',
  'Week    : clocked-in 3 | ps_fail 26 (timeout 26) | no-password 1 | login-failed 0 | throttled 0',
  '===== END PYMTIME HANDOVER =====',
].join('\n');

// F1: clean input → must NOT block (exit 0)
let r = run('{}');
check('F1 clean input exits 0 (no false block)', r.status === 0 && !fired(r), 'exit=' + r.status);
// F2: the replay case — the whole block pasted raw
r = ask(BLOCK);
check('F2 replay: full block fires, names person + result, points at the pymtime skill', r.status === 0 && fired(r) && /Person: Aaron \(aaron\)/.test(r.out) && /Result: NOT READY/.test(r.out) && /INVOKE the `pymtime` skill/.test(r.out) && !/looks CUT/.test(r.out), r.out.slice(0, 300));

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12 (>= 20, verdict each) ═══
//  S1  WhatsApp forward: "[28/09, 14:02] Aaron:" prefix + trailing chat ................ fixture-added
//  S2  every line indented by one space (some chat apps) ............................... fixture-added
//  S3  quoted reply: every line starts with "> " (email / Teams quote) ................. fixture-added
//  S4  WhatsApp bold: *===== PYMTIME HANDOVER v1 =====* ................................ fixture-added
//  S5  CRLF line ends (pasted from the .txt file) ....................................... fixture-added
//  S6  END line lost (message cut by the chat app) → fires + CUT flag ................... fixture-added
//  S7  first line lost (copied from the middle) → fires on END + CUT flag ............... fixture-added
//  S8  talking ABOUT handovers, no block ("make the handover shorter") → silent ......... fixture-added
//  S9  quoting one marker word without the ===== run ("PYMTIME HANDOVER v1") → silent ... fixture-added
//  S10 bypass token with a reason → silent ............................................. fixture-added
//  S11 empty bypass reason "[skip-pymtime-handover: ]" → still fires .................... fixture-added
//  S12 the hook's OWN injected text pasted back (self-disarm class) → silent, no loop ... fixture-added
//  S13 malformed stdin (not JSON) → exit 0, silent ...................................... fixture-added
//  S14 JSON without a prompt field → exit 0, silent ..................................... fixture-added
//  S15 huge prompt (2 MB log dump + block) → fires, under 5 s ........................... fixture-added
//  S16 two handovers in one message → fires once, first person named .................... fixture-added
//  S17 lowercase / v2 marker (a future handover version) → still fires .................. fixture-added
//  S18 Person line carries a hostile 5 KB string → context stays short .................. fixture-added
//  S19 CLAUDE_PROJECT_DIR unset (run from main repo / worktree) → resolves lib, fires .. fixture-added
//  S20 run from a copy outside the repo (eval sandbox) with CLAUDE_PROJECT_DIR set ...... fixture-added
//  S21 unrelated quest prompt (QA-281650 ...) → silent .................................. fixture-added
//  S22 the colleague pasted their PASSWORD next to the block → hook never echoes it ..... fixture-added
//  S23 hook-runtime.js missing / renamed → hook crashes; wrapper is not used here, so
//      the harness logs a hook error and the turn continues ............................ accepted-risk: same dependency every native hook has; system-audit ghost/dep check at boot catches it
//  S24 two sessions paste at once → the hook is stateless (no file writes of its own) ... handled
//  S25 miya asks to "just read it, don't diagnose" → the skill's step honours his ask ... handled (skill §Handover: ask wins)
const WA = '[28/09, 14:02] Aaron: ok bro here\n' + BLOCK + '\n[28/09, 14:03] Aaron: thanks';
check('S1 WhatsApp forward with timestamps fires', fired(ask(WA)));
check('S2 one-space indent fires and still reads the person', /Person: Aaron/.test(ask(BLOCK.replace(/^/gm, ' ')).out));
check('S3 "> " quoted reply fires and reads the person', /Person: Aaron/.test(ask(BLOCK.replace(/^/gm, '> ')).out));
check('S4 WhatsApp bold markers fire', fired(ask(BLOCK.replace(/^(=+.*=+)$/gm, '*$1*'))));
r = ask(BLOCK.replace(/\n/g, '\r\n'));
check('S5 CRLF paste fires, not flagged as cut', fired(r) && !/looks CUT/.test(r.out) && /Person: Aaron \(aaron\)/.test(r.out) && !/\r/.test((r.out.match(/Person: .*/) || [''])[0]));
r = ask(BLOCK.split('\n').slice(0, 6).join('\n'));
check('S6 END line lost fires with the CUT flag', fired(r) && /looks CUT/.test(r.out));
r = ask(BLOCK.split('\n').slice(3).join('\n'));
check('S7 first line lost fires on END with the CUT flag', fired(r) && /looks CUT/.test(r.out));
check('S8 talking about handovers is silent', !fired(ask('make the pymtime handover shorter please, and ask colleagues to send it')));
check('S9 marker words without the ===== run are silent', !fired(ask('the first line says PYMTIME HANDOVER v1 right?')));
check('S10 bypass token with a reason is silent', !fired(ask(BLOCK + '\n[skip-pymtime-handover: testing the format only]')));
check('S11 empty bypass reason does not disarm', fired(ask(BLOCK + '\n[skip-pymtime-handover: ]')));
const own = ask(BLOCK).out;
check('S12 the hook\'s own injected text pasted back is silent (no self-trigger)', !fired(ask(own)));
r = run('this is not json');
check('S13 malformed stdin exits 0 and stays silent', r.status === 0 && !fired(r));
r = run(JSON.stringify({ hook_event_name: 'UserPromptSubmit' }));
check('S14 no prompt field exits 0 and stays silent', r.status === 0 && !fired(r));
const t0 = Date.now(); r = ask('x'.repeat(2 * 1024 * 1024) + '\n' + BLOCK);
check('S15 2 MB prompt + block fires in under 5 s', fired(r) && Date.now() - t0 < 5000, (Date.now() - t0) + 'ms');
r = ask(BLOCK + '\n\n' + BLOCK.replace('Aaron (aaron)', 'Ummi (ummi)'));
check('S16 two handovers: fires once, names the first person', (r.out.match(/pymtime-handover: a PymTime HANDOVER/g) || []).length === 1 && /Person: Aaron/.test(r.out));
check('S17 lowercase + future v2 marker still fires', fired(ask(BLOCK.toLowerCase().replace('v1', 'v2'))));
r = ask(BLOCK.replace('Aaron (aaron)', 'A'.repeat(5000)));
check('S18 hostile 5 KB Person line keeps the context short', fired(r) && r.out.length < 1200, r.out.length + ' chars');
{ const env = { ...process.env }; delete env.CLAUDE_PROJECT_DIR; const x = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt: BLOCK }), encoding: 'utf8', env, timeout: 30000 }); check('S19 no CLAUDE_PROJECT_DIR: resolves lib from its own folder and fires', x.status === 0 && /pymtime-handover: a PymTime HANDOVER/.test(x.stdout + x.stderr)); }
{ const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pth-')); const copy = path.join(dir, 'hook.js'); fs.copyFileSync(HOOK, copy); const x = spawnSync(process.execPath, [copy], { input: JSON.stringify({ prompt: BLOCK }), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT }, timeout: 30000 }); check('S20 sandbox copy outside the repo fires via CLAUDE_PROJECT_DIR', x.status === 0 && /pymtime-handover: a PymTime HANDOVER/.test(x.stdout + x.stderr)); fs.rmSync(dir, { recursive: true, force: true }); }
check('S21 unrelated quest prompt is silent', !fired(ask('QA-281650 MLPS patch tempat, continue')));
r = ask('my password is Hunter2Secret!\n' + BLOCK);
check('S22 a password pasted beside the block is never echoed', fired(r) && !/Hunter2Secret/.test(r.out));
// S23 accepted-risk, S24/S25 handled — see the table above.

// Registration: the hook is in settings.json exactly once, under UserPromptSubmit.
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
const regs = (settings.hooks.UserPromptSubmit || []).flatMap(g => g.hooks || []).filter(h => /pymtime-handover\.check\.hook\.js/.test(h.command || ''));
check('R1 registered once under UserPromptSubmit in .claude/settings.json', regs.length === 1, regs.length + ' registrations');
// The procedure it points at exists: the pymtime skill has a §Handover section.
const skill = fs.readFileSync(path.join(ROOT, '.claude', 'skills', 'pymtime', 'SKILL.md'), 'utf8');
check('R2 the pymtime skill carries the §Handover procedure the context points at', /^## .*Handover/m.test(skill) && /PYMTIME HANDOVER/.test(skill));
check('R3 NUKE-MARKER.md present', fs.existsSync(path.join(__dirname, 'NUKE-MARKER.md')));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\npymtime-handover.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
