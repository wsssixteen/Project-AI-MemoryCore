// system-audit: skip-ghost-check — eval harness, run by hand or by lib/eval-battery.js, NOT an event hook
// open-quest-surfacer.eval.js — v2 (2026-10-06): the ticket list leaves session start and loads on a work signal.
// What must hold: (1) the printed block is byte-for-byte what session start printed before; (2) every phrase
// he said he might use loads it; (3) a prompt about something else loads nothing and calls nothing;
// (4) a ticket mention does not reload it on every prompt; (5) an explicit ask always reloads it.
// Runs on a fixture root (OQS_TEST_ROOT): no Redmine call, no real file touched.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'open-quest-surfacer.js');
const { classify } = require(HOOK);
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oqs-eval-'));
fs.mkdirSync(path.join(tmp, 'quest'), { recursive: true });
fs.mkdirSync(path.join(tmp, 'system'), { recursive: true });
const ACTIVE = ['qa=QA-274323', 'status=active', 'phase=1', 'issue_one_liner=PRBB Surat Keputusan Lulus', '', 'qa=ADHOC-PT-2026-8', 'status=hold', 'phase=0', 'note=KPT tak papar', '', 'qa=QA-111111', 'status=archived', 'phase=2', ''].join('\n');
fs.writeFileSync(path.join(tmp, 'quest', 'active.txt'), ACTIVE);
// a stand-in for quest/redmine-board.js: proves the board script is CALLED and its text is printed whole
fs.writeFileSync(path.join(tmp, 'quest', 'redmine-board.js'), "require('fs').appendFileSync(require('path').join(__dirname,'board-calls.txt'),'x');console.log('### 3. Internal fixes & other\\n| 274323 | Medium | 16 | LAST-ROW-MARKER |');");
const calls = () => { try { return fs.readFileSync(path.join(tmp, 'quest', 'board-calls.txt'), 'utf8').length; } catch { return 0; } };
const shown = path.join(tmp, 'shown.json');
const env = { ...process.env, OQS_TEST_ROOT: tmp, OQS_SHOWN_FILE: shown };
const run = (input, args) => spawnSync(process.execPath, [HOOK, ...(args || [])], { input: input === undefined ? '' : (typeof input === 'string' ? input : JSON.stringify(input)), encoding: 'utf8', timeout: 60000, env });
const prompt = (p, sid) => ({ hook_event_name: 'UserPromptSubmit', session_id: sid || 's1', prompt: p });
const BLOCK = o => /📌 OPEN QUESTS — 2 entry\/entries/.test(o) && /QA-274323 \(phase=1, status=active\)/.test(o) && /ADHOC-PT-2026-8 \(phase=0, status=hold\)/.test(o) && /BOARD SHAPE/.test(o) && /LIVE REDMINE BOARD/.test(o) && /LAST-ROW-MARKER/.test(o);

// ── A. parity: what session start printed before is what a signal prints now ──
let boot = run({ hook_event_name: 'SessionStart', source: 'startup' });
check('A1 run as before (no prompt on stdin) prints the whole block: open quests, board rule, live board to its last row', boot.status === 0 && BLOCK(boot.stdout), boot.stdout.slice(0, 200));
check('A2 the archived quest is not listed', !/QA-111111/.test(boot.stdout));
let now = run('', ['--now']);
check('A3 --now prints the same text as the session-start form', now.stdout === boot.stdout, 'len ' + now.stdout.length + ' vs ' + boot.stdout.length);
let sig = run(prompt('board', 'parity'));
const body = sig.stdout.split('\n').slice(1).join('\n');
check('A4 on a signal: one header line, then the block byte-for-byte equal to the session-start text', /^📌 Ticket list loaded now \(you asked for it; live from Redmine at \d\d:\d\d\)/.test(sig.stdout) && body === boot.stdout, 'bodyLen ' + body.length + ' bootLen ' + boot.stdout.length);

// ── B. his words (2026-10-06): "Let's do some work / please retrieve tickets / update me on my redmine tickets / etc" ──
const HIS = ["Let's do some work", 'please retrieve tickets', 'update me on my redmine tickets'];
for (const p of HIS) check('B1 his phrase loads the list: "' + p + '"', !!classify(p, ACTIVE), String(classify(p, ACTIVE)));
const ASK = ['board', 'show me the board', 'refresh the board', '/list-redmine', 'list redmine', 'my tickets', 'show my tickets', 'what are my open tickets', 'any new tickets?', 'retrieve the new tickets', 'pull redmine', 'check redmine', 'sync redmine', 'brief me', 'briefing', 'where were we', "what's our status", 'catch me up', 'update me on my work', 'senarai tiket', 'semak tiket', 'how many tickets are open', 'pending tickets', 'next ticket'];
for (const p of ASK) check('B2 ask → always loads: "' + p + '"', classify(p, ACTIVE) === 'ask', String(classify(p, ACTIVE)));
const SOFT = ["let's work", 'lets start working', 'time to work', 'back to work', 'continue our work', 'start work', 'jom kerja', 'sambung kerja', 'daily work', "today's work", 'redmine', 'this ticket is odd', 'tiket ni pelik', 'esokongan', 'the backlog is long', '274323', 'QA-274323 rework', '#282966', 'ticket 244600', 'ADHOC-PT-2026-8', 'PTMLK/02/L/PT/2026/32 tak papar', "what's on my plate", 'what should we do today', 'update me', 'continue the quest', 'check this permohonan'];
for (const p of SOFT) check('B3 work signal → loads once: "' + p + '"', !!classify(p, ACTIVE), String(classify(p, ACTIVE)));

// ── C. other-project prompts load nothing (his requirement: not for other projects) ──
const NONE = ['does this work?', 'why does the workflow fail', 'fix the networking code', 'explain this regex', 'thanks', 'ok', 'yes', 'continue', 'proceed', 'the dashboard is slow', 'keyboard shortcut for copy', 'draw the diagram', 'commit and push it', 'what is the weather', 'it works now', 'homework for arabic', 'rename the variable', '123456 is the port range start', 'onboard the new skill', 'please just build this and test'];
for (const p of NONE) check('C1 not about tickets → nothing: "' + p + '"', classify(p, ACTIVE) === null, String(classify(p, ACTIVE)));
check('C2 machine text is never a signal (task notification)', classify('[SYSTEM NOTIFICATION - NOT USER INPUT] my tickets board', ACTIVE) === null);
check('C3 its own output pasted back is never a signal', classify('📌 OPEN QUESTS — 2 entries ... redmine', ACTIVE) === null);
check('C4 a 25,000-character paste is never a signal', classify('ticket '.repeat(4000), ACTIVE) === null);
check('C5 empty prompt → nothing', classify('', ACTIVE) === null && classify('   ', ACTIVE) === null);
let before = calls();
let q = run(prompt('does this work?', 'quiet'));
check('C6 end to end: a non-ticket prompt prints nothing and does not call the board script', q.status === 0 && q.stdout === '' && calls() === before, JSON.stringify(q.stdout.slice(0, 80)));

// ── D. once per session for work signals, always for asks ──
try { fs.rmSync(shown, { force: true }); } catch {}
before = calls();
let d1 = run(prompt('274323', 'sA'));
check('D1 first ticket mention of a session loads the list', BLOCK(d1.stdout) && calls() === before + 1 && /first work signal in this session/.test(d1.stdout));
let d2 = run(prompt('continue 274323 please', 'sA'));
check('D2 the next ticket mention in the same session is silent and makes no call', d2.stdout === '' && calls() === before + 1, JSON.stringify(d2.stdout.slice(0, 60)));
let d3 = run(prompt('my tickets', 'sA'));
check('D3 an explicit ask in that session loads it again, live', BLOCK(d3.stdout) && calls() === before + 2);
let d4 = run(prompt('redmine', 'sB'));
check('D4 another session gets its own first load', BLOCK(d4.stdout) && calls() === before + 3);
const j = JSON.parse(fs.readFileSync(shown, 'utf8')); j.sA = Date.now() - 5 * 3600 * 1000; fs.writeFileSync(shown, JSON.stringify(j));
let d5 = run(prompt('274323', 'sA'));
check('D5 more than 4 hours later a ticket mention loads it again (covers a context compaction)', BLOCK(d5.stdout) && calls() === before + 4);
fs.writeFileSync(shown, '{ broken');
let d6 = run(prompt('274323', 'sC'));
check('D6 a corrupt marker file never hides the list', BLOCK(d6.stdout));

// ── E. failure modes ──
fs.writeFileSync(path.join(tmp, 'system', 'orchestration-mode.flag'), String(Date.now() + 60000));
let e1 = run(prompt('my tickets', 'sweep'));
check('E1 while a sweep is running the list is not injected into its prompts', e1.stdout === '');
fs.rmSync(path.join(tmp, 'system', 'orchestration-mode.flag'), { force: true });
fs.writeFileSync(path.join(tmp, 'quest', 'redmine-board.js'), 'process.exit(3);');
let e2 = run(prompt('board', 'fail'));
check('E2 Redmine unreachable: the open-quest list still prints, with the same fallback line as before', /OPEN QUESTS — 2/.test(e2.stdout) && /live board unavailable/.test(e2.stdout) && e2.status === 0, e2.stdout.slice(-160));
let e3 = run('not json at all');
check('E3 unreadable stdin behaves as a plain run (prints), never crashes', e3.status === 0 && /OPEN QUESTS/.test(e3.stdout));
fs.rmSync(path.join(tmp, 'quest', 'active.txt'));
let e4 = run(prompt('board', 'noactive'));
check('E4 active.txt missing: says so, exit 0', e4.status === 0 && /cannot read quest\/active\.txt/.test(e4.stdout));

// ── F. registration: off session start, on the prompt bundle ──
const ROOT = path.resolve(__dirname, '..', '..');
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
const bootCmds = (settings.hooks.SessionStart || []).flatMap(g => g.hooks.map(h => h.command));
check('F1 not registered at SessionStart any more', !bootCmds.some(c => /open-quest-surfacer/.test(c)));
const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'domain', 'bundles', 'upsm-mode.json'), 'utf8'));
check('F2 it is a child of the existing prompt bundle (no new registration)', bundle.children.includes('.claude/hooks/open-quest-surfacer.js'));
check('F3 that bundle is registered on UserPromptSubmit', (settings.hooks.UserPromptSubmit || []).some(g => g.hooks.some(h => /upsm-mode\.json/.test(h.command))));

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nopen-quest-surfacer.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
