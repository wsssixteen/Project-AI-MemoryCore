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
// PYMTIME_DIR points at nothing = boot mode answers Quiet, so groups A to F behave the same at any hour of any day
const env = { ...process.env, OQS_TEST_ROOT: tmp, OQS_SHOWN_FILE: shown, PYMTIME_DIR: path.join(tmp, 'no-pymtime'), OQS_NOW: '' };
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

// ── B4. major keywords (2026-10-08 per みや: "board" is not enough; "Tickets" and "Redmine" should also be it) ──
const MAJOR = ['tickets', 'Tickets', 'TICKETS', 'tickets?', 'redmine', 'Redmine', 'REDMINE', 'redmine please', 'ok tickets', 'tickets now', 'show redmine', 'any tickets today', 'what about redmine', 'check the tickets for me', 'open redmine', 'Redmine, quickly'];
for (const p of MAJOR) check('B4 major keyword in a short message → ask (loads every time): "' + p + '"', classify(p, ACTIVE) === 'ask', String(classify(p, ACTIVE)));
const LONGMSG = 'I was reading the code for the report generator and noticed the tickets table has a column we never fill, can you check why';
check('B5 the same word inside a long message is a work signal (once per 4 hours), not a reload on every prompt', classify(LONGMSG, ACTIVE) === 'soft' && LONGMSG.split(/\s+/).length > 8, String(classify(LONGMSG, ACTIVE)));
check('B6 a short message with the singular "ticket" stays a work signal (a ticket discussion says it constantly)', classify('close this ticket', ACTIVE) === 'soft' && classify('fix the ticket', ACTIVE) === 'soft');
const NOTMAJOR = ['ticketing system design', 'redmines', 'multitickets', 'the predmine tool'];
for (const p of NOTMAJOR) check('B7 a longer word that only contains the keyword is not it: "' + p + '"', classify(p, ACTIVE) !== 'ask', String(classify(p, ACTIVE)));

// ── C. other-project prompts load nothing (his requirement: not for other projects) ──
const NONE = ['does this work?', 'why does the workflow fail', 'fix the networking code', 'explain this regex', 'thanks', 'ok', 'yes', 'continue', 'proceed', 'the dashboard is slow', 'keyboard shortcut for copy', 'draw the diagram', 'commit and push it', 'what is the weather', 'it works now', 'homework for arabic', 'rename the variable', '123456 is the port range start', 'onboard the new skill', 'please just build this and test', 'proceed and then brief me the results', 'brief me on what the function does', 'give a status update on the build', 'the briefing format looks wrong'];
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
let dm1 = run(prompt('tickets', 'sA'));
check('D2b the bare word "tickets" right after still loads it again, live', BLOCK(dm1.stdout) && calls() === before + 2 && /you asked for it/.test(dm1.stdout));
let dm2 = run(prompt('redmine', 'sA'));
check('D2c so does the bare word "redmine"', BLOCK(dm2.stdout) && calls() === before + 3);
before = before + 2;
let d3 = run(prompt('my tickets', 'sA'));
check('D3 an explicit ask in that session loads it again, live', BLOCK(d3.stdout) && calls() === before + 2);
let d4 = run(prompt('continue the quest', 'sB'));
check('D4 another session gets its own first load', BLOCK(d4.stdout) && calls() === before + 3);
const j = JSON.parse(fs.readFileSync(shown, 'utf8')); j.sA = Date.now() - 5 * 3600 * 1000; fs.writeFileSync(shown, JSON.stringify(j));
let d5 = run(prompt('274323', 'sA'));
check('D5 more than 4 hours later a ticket mention loads it again (covers a context compaction)', BLOCK(d5.stdout) && calls() === before + 4);
fs.writeFileSync(shown, '{ broken');
let d6 = run(prompt('274323', 'sC'));
check('D6 a corrupt marker file never hides the list', BLOCK(d6.stdout));

// ── G. boot mode (2026-10-08 per みや: "build boot mode"): in work hours the first message of a session loads the list
//    with no keyword. Work = a working day (PymTime workdays) + no public holiday + no approved full-day leave +
//    08:30 to 18:30. Anything unknown = Quiet. Fixture PymTime folder + a fixed clock (OQS_NOW): no real data read. ──
const isoFn = "const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');";
function fakePym(name, o = {}) {
  const d = path.join(tmp, name); fs.mkdirSync(path.join(d, 'lib'), { recursive: true });
  fs.writeFileSync(path.join(d, 'lib', 'config.js'), o.throws ? "throw new Error('boom');" : `module.exports = { DEFAULTS: { workdays: [1, 2, 3, 4, 5] }, loadConfig: () => (${o.noConfig ? 'null' : JSON.stringify({ workdays: o.workdays || [1, 2, 3, 4, 5] })}) };`);
  fs.writeFileSync(path.join(d, 'lib', 'holiday.js'), `${isoFn} const H = ${JSON.stringify(o.holidays || [])}; module.exports = { isHolidayCached: d => H.includes(iso(d)) ? 'Fixture holiday' : null };`);
  fs.writeFileSync(path.join(d, 'lib', 'leave.js'), `${isoFn} const R = ${o.noLeaveCache ? 'null' : JSON.stringify(o.leaves || [])}; module.exports = { readCache: () => R ? { at: 1, rows: R } : null, onLeave: d => (R || []).find(r => r.date === iso(d)) || null };`);
  return d;
}
const TUE = '2026-10-13', SAT = '2026-10-10', SUN = '2026-10-11', FRI = '2026-10-09';
const PLAIN = fakePym('pym-plain');
let gN = 0;
const at = (p, when, pym, sid) => { const before = calls(); const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(prompt(p, sid || ('g' + (++gN)))), encoding: 'utf8', timeout: 60000, env: { ...env, PYMTIME_DIR: pym === undefined ? PLAIN : pym, OQS_NOW: when } }); return { out: r.stdout, status: r.status, loaded: BLOCK(r.stdout), board: calls() - before }; };
let g = at('does this work?', TUE + 'T09:12:00', PLAIN, 'gw');
check('G1 work hours, first message with no keyword: the list loads, once, and the line says why', g.loaded && g.board === 1 && /work mode: Tuesday, no holiday, no leave, 09:12/.test(g.out.split('\n')[0]), g.out.slice(0, 200));
g = at('thanks', TUE + 'T09:20:00', PLAIN, 'gw');
check('G2 NEGATIVE the second message of that session loads nothing', g.out === '' && g.board === 0, g.out.slice(0, 120));
g = at('does this work?', SAT + 'T10:00:00');
check('G3 NEGATIVE Saturday: silent, no Redmine call', g.out === '' && g.board === 0, g.out.slice(0, 120));
check('G4a NEGATIVE 08:29 is before work hours', at('hello', TUE + 'T08:29:00').out === '');
check('G4b 08:30 is inside', at('hello', TUE + 'T08:30:00').loaded);
check('G4c 18:29 is inside', at('hello', TUE + 'T18:29:00').loaded);
check('G4d NEGATIVE 18:30 is after work hours', at('hello', TUE + 'T18:30:00').out === '');
check('G5 NEGATIVE public holiday: silent', at('hello', TUE + 'T10:00:00', fakePym('pym-hol', { holidays: [TUE] })).out === '');
check('G6a NEGATIVE approved full-day leave: silent', at('hello', TUE + 'T10:00:00', fakePym('pym-leave', { leaves: [{ date: TUE, status: 'APPROVED', session: 'Full', name: 'Annual Leave' }] })).out === '');
check('G6b leave still PENDING is a working day', at('hello', TUE + 'T10:00:00', fakePym('pym-pend', { leaves: [{ date: TUE, status: 'PENDING', session: 'Full', name: 'Annual Leave' }] })).loaded);
check('G6c approved HALF-day leave is a working day', at('hello', TUE + 'T10:00:00', fakePym('pym-half', { leaves: [{ date: TUE, status: 'APPROVED', session: 'AM', name: 'Annual Leave' }] })).loaded);
check('G6d leave on another day does not count', at('hello', TUE + 'T10:00:00', fakePym('pym-other', { leaves: [{ date: FRI, status: 'APPROVED', session: 'Full', name: 'Annual Leave' }] })).loaded);
check('G7a NEGATIVE PymTime folder missing = unknown = Quiet', at('hello', TUE + 'T10:00:00', path.join(tmp, 'no-pymtime')).out === '');
check('G7b NEGATIVE no PymTime config = Quiet', at('hello', TUE + 'T10:00:00', fakePym('pym-nocfg', { noConfig: true })).out === '');
check('G7c NEGATIVE leave data unreadable = Quiet', at('hello', TUE + 'T10:00:00', fakePym('pym-nolv', { noLeaveCache: true })).out === '');
g = at('hello', TUE + 'T10:00:00', fakePym('pym-throw', { throws: true }));
check('G7d NEGATIVE a PymTime file that throws = Quiet, exit 0', g.out === '' && g.status === 0, g.out.slice(0, 120));
const SUNTHU = fakePym('pym-sunthu', { workdays: [7, 1, 2, 3, 4] });
check('G8a his own working days are used: Sunday works on a Sunday-to-Thursday week', at('hello', SUN + 'T10:00:00', SUNTHU).loaded);
check('G8b NEGATIVE and Friday does not', at('hello', FRI + 'T10:00:00', SUNTHU).out === '');
g = at('quiet mode', TUE + 'T09:12:00', PLAIN, 'gq');
check('G9a "quiet mode" as the first message: no list, one line says so', !g.loaded && g.board === 0 && /^Quiet mode for this session/.test(g.out), g.out.slice(0, 160));
check('G9b NEGATIVE the next plain message of that session stays silent', at('hello', TUE + 'T09:15:00', PLAIN, 'gq').out === '');
check('G9c a keyword still loads the list in a quiet session', at('tickets', TUE + 'T09:16:00', PLAIN, 'gq').loaded);
g = at('not working today', TUE + 'T09:12:00', PLAIN, 'gq2');
check('G9d NEGATIVE "not working today" is not read as the work signal "working today"', !g.loaded && g.board === 0 && /^Quiet mode for this session/.test(g.out), g.out.slice(0, 160));
check('G9e an ask wins over a quiet word', at('quiet mode, but show my tickets', TUE + 'T09:12:00').loaded);
check('G10a "start work" on a Saturday loads the list', at('start work', SAT + 'T10:00:00').loaded);
check('G10b "work mode" on a Saturday loads the list', at('work mode', SAT + 'T10:00:00').loaded);
g = at('[SYSTEM NOTIFICATION - NOT USER INPUT] the build finished', TUE + 'T09:12:00', PLAIN, 'gm');
check('G11a NEGATIVE a machine notification is not his first message', g.out === '' && g.board === 0);
check('G11b his first real message after it still loads the list', at('hello', TUE + 'T09:13:00', PLAIN, 'gm').loaded);
check('G11c NEGATIVE an empty message is not his first message', at('', TUE + 'T09:12:00', PLAIN, 'ge').out === '' && at('hello', TUE + 'T09:13:00', PLAIN, 'ge').loaded);
at('tickets', TUE + 'T09:12:00', PLAIN, 'gk');
check('G12 NEGATIVE a session that got the list by keyword does not get it again from boot mode', at('hello', TUE + 'T09:14:00', PLAIN, 'gk').out === '');
fs.writeFileSync(path.join(tmp, 'system', 'orchestration-mode.flag'), String(Date.now() + 60000));
check('G13 NEGATIVE while a sweep is running boot mode loads nothing', at('hello', TUE + 'T09:12:00').out === '');
fs.rmSync(path.join(tmp, 'system', 'orchestration-mode.flag'), { force: true });
const modeOf = (when, pym) => spawnSync(process.execPath, [HOOK, '--mode'], { encoding: 'utf8', timeout: 60000, env: { ...env, PYMTIME_DIR: pym || PLAIN, OQS_NOW: when } }).stdout.trim();
check('G14a --mode prints the work decision and its reason', modeOf(TUE + 'T09:12:00') === 'Work mode: Tuesday, no holiday, no leave, 09:12', modeOf(TUE + 'T09:12:00'));
check('G14b --mode prints the quiet decision and its reason', /^Quiet mode: Saturday 10:00, not a working day$/.test(modeOf(SAT + 'T10:00:00')), modeOf(SAT + 'T10:00:00'));
check('G14c --mode names the holiday', /^Quiet mode: Tuesday 10:00, public holiday \(Fixture holiday\)$/.test(modeOf(TUE + 'T10:00:00', path.join(tmp, 'pym-hol'))), modeOf(TUE + 'T10:00:00', path.join(tmp, 'pym-hol')));
// the real PymTime (when this laptop has it): the three functions boot mode calls still exist
const REAL_PYM = 'E:\\Dev\\scripts\\PymTime';
if (fs.existsSync(path.join(REAL_PYM, 'lib', 'holiday.js'))) {
  let okc = false, why = '';
  try { const c = require(path.join(REAL_PYM, 'lib', 'config.js')), h = require(path.join(REAL_PYM, 'lib', 'holiday.js')), l = require(path.join(REAL_PYM, 'lib', 'leave.js')); okc = typeof c.loadConfig === 'function' && typeof h.isHolidayCached === 'function' && typeof l.onLeave === 'function' && typeof l.readCache === 'function'; } catch (e) { why = e.message; }
  check('G15 the real PymTime still has loadConfig, isHolidayCached, onLeave, readCache', okc, why);
} else check('G15 the real PymTime is not on this machine (boot mode answers Quiet here)', true);

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
