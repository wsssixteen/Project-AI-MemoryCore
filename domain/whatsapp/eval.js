#!/usr/bin/env node
/**
 * eval.js — /whatsapp skill fixture eval
 *
 * /whatsapp reads みや's WhatsApp groups through E:\Dev\scripts\WaRead (a linked-device,
 * read-only reader) and paraphrases in third person without sender names. Its value is
 * the two walls: the tool cannot send or mark read, and the reply never leaks names or
 * verbatim text.
 *
 * This eval pins: the trigger phrases, the hard rules (read only · third person · no
 * names · never the desktop app), the exact CLI it maps to, the link procedure, and —
 * when the WaRead tool is on this machine — that its own selftest is green and that the
 * read-only wall exposes no send path.
 *
 * Run: node domain/whatsapp/eval.js
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SKILL = path.resolve(__dirname, '..', '..', '.claude', 'skills', 'whatsapp', 'SKILL.md');
const WAREAD = 'E:\\Dev\\scripts\\WaRead';

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); } }

console.log('eval: /whatsapp skill\n');
if (!fs.existsSync(SKILL)) { console.log(`  FAIL  SKILL.md exists at ${SKILL}`); process.exit(1); }
const src = fs.readFileSync(SKILL, 'utf8');
const fm = src.slice(0, src.indexOf('---', 4) + 3);

// 1. triggering
check('name is whatsapp', /^name:\s*whatsapp\s*$/m.test(fm));
for (const p of ['read whatsapp', 'what did the group say', 'unread in', 'check the Tech Team group', 'paraphrase the group']) check(`trigger phrase "${p}"`, fm.toLowerCase().includes(p.toLowerCase()));
check('description bans the desktop app / WhatsApp Web as a path', /Never open the WhatsApp desktop app or WhatsApp Web/i.test(fm));

// 2. hard rules
check('READ ONLY rule with no workaround via computer-use/Chrome', /READ ONLY\.[\s\S]{0,200}Never work around it with the desktop app, WhatsApp Web, computer-use, or Chrome/i.test(src));
check('third person, own words, never verbatim', /Third person, my own words/i.test(src) && /Never quote verbatim/i.test(src));
check('no sender names unless asked', /No sender names\*?\*? unless he asks/i.test(src));
check('soften but never invent intent', /Never invent intent/i.test(src));
check('empty group → say so, never fall back to the desktop app', /Never fall back to the desktop app/i.test(src));

// 3. CLI mapping
check('maps to wa-read.js groups', /wa-read\.js groups/.test(src));
check('maps to wa-read.js read "<group>" --limit', /wa-read\.js read "[^"]+" --limit \d+/.test(src));
check('maps to wa-read.js read --since YYYY-MM-DD', /wa-read\.js read "[^"]+" --since \d{4}-\d{2}-\d{2}/.test(src));
check('maps to wa-read.js status', /wa-read\.js status/.test(src));
check('link procedure = pairing code typed on the phone', /link --phone/.test(src) && /Link with phone number instead/i.test(src));

// 4. the tool it depends on (only when present on this machine)
if (fs.existsSync(path.join(WAREAD, 'wa-read.js'))) {
  const st = spawnSync(process.execPath, ['_selftest.js'], { cwd: WAREAD, encoding: 'utf8', timeout: 60000 });
  check('WaRead selftest is green', st.status === 0, (st.stdout || '').split('\n').filter(l => /FAIL|failed/.test(l)).join(' | '));
  const ro = require(path.join(WAREAD, 'lib', 'readonly.js'));
  check('WaRead ALLOW list has no sendMessage / readMessages / chatModify / logout', ['sendMessage', 'readMessages', 'chatModify', 'logout', 'sendPresenceUpdate'].every(k => !ro.ALLOW.includes(k) && ro.DENY.includes(k)));
  const cli = fs.readFileSync(path.join(WAREAD, 'wa-read.js'), 'utf8');
  check('WaRead CLI sets markOnlineOnConnect:false', /markOnlineOnConnect:\s*false/.test(cli));
  // the watcher (2026-11-10): its own selftest, the rules-only fallback, the heartbeat, stop reasons, child outcome
  const ws = spawnSync(process.execPath, ['watcher-selftest.js'], { cwd: WAREAD, encoding: 'utf8', timeout: 120000 });
  check('WaRead watcher selftest is green', ws.status === 0, (ws.stdout || '').split('\n').filter(l => /FAIL|failed/.test(l)).join(' | '));
  const judgeSrc = fs.readFileSync(path.join(WAREAD, 'lib', 'watcher', 'judge.js'), 'utf8');
  check('watcher: a failed judge call falls back to the rules, never a blind hold', /function fallbackVerdict/.test(judgeSrc) && !/issueKey: 'judge-error-'/.test(judgeSrc));
  const watchSrc = fs.readFileSync(path.join(WAREAD, 'wa-watch.js'), 'utf8');
  check('watcher: a heartbeat row with pid every 5 minutes', /event: 'heartbeat', pid: process\.pid/.test(watchSrc) && /setInterval\(beat, 5 \* 60 \* 1000\)/.test(watchSrc));
  check('watcher: every stop row carries a reason', !/event: 'daemon-stop' \}/.test(watchSrc) && /reason: 'logged-out'/.test(watchSrc));
  const spawnSrc = fs.readFileSync(path.join(WAREAD, 'lib', 'watcher', 'spawn.js'), 'utf8');
  check('watcher: a headless child that ends is logged done or failed', /function childOutcome/.test(spawnSrc) && /'child-done' : 'child-failed'/.test(spawnSrc));
  // office reports (2026-11-10): the rule file the judge reads and the script side agree
  const rules = fs.readFileSync(path.join(__dirname, 'RULES.md'), 'utf8');
  check('RULES 1b: office prefix table, forwarded = office wording, BA lines outrank it', /## 1b\. Office reports/.test(rules) && ['PDTMT', 'PDTJ', 'PDTAG', 'PTG'].every(k => rules.includes('`' + k)) && /OUTRANKS the first message/.test(rules) && /FORWARDED: yes\|no/.test(rules));
  check('RULES 1b: environment words IT and STG, and the non-question rule', /`IT`, `MLIT`, `internal` = Internal/.test(rules) && /`STG`, `stg1`, `staging` = Staging/.test(rules) && /not a question to the developers/.test(rules));
  const filt = require(path.join(WAREAD, 'lib', 'watcher', 'filter.js'));
  check('watcher: office codes match the rule file (PDTMT 01, PDTJ 02, PDTAG 03, PTG 00)', filt.officeOf('PDTMT x').kod === '01' && filt.officeOf('PDTJ x').kod === '02' && filt.officeOf('PDTAG x').kod === '03' && filt.officeOf('PTG x').kod === '00' && /\| `PDTAG` \| PDT Alor Gajah \| Alor Gajah \| `03` \|/.test(rules));
  const textSrc = fs.readFileSync(path.join(WAREAD, 'lib', 'text.js'), 'utf8');
  check('reader keeps the forwarded flag and still sends nothing', /forwarded: !!\(ctx && \(ctx\.isForwarded/.test(textSrc));
  // the 2-minute office wait (2026-11-10): rule file and code agree
  const ow = require(path.join(WAREAD, 'lib', 'watcher', 'officewait.js')).createOfficeWait({ waitMs: 120000, isOffice: (t) => !!filt.officeOf(t) });
  check('watcher: an office report is held and a line 30 s later rides with it', ow.offer({ id: 'o', chat: 'c', ts: 1000, text: 'PDTAG ralat' }, true) === 'hold' && ow.offer({ id: 'b', chat: 'c', ts: 31000, text: 'saya dah semak' }, false) === 'ride' && ow.due(121000)[0] === 'c');
  check('RULES: the 2-minute wait is written down and the run loop uses it', /The 2-minute wait/.test(rules) && /LINES THAT FOLLOWED WITHIN THE WAIT/.test(rules) && /officeWait\.due\(Date\.now\(\)\)/.test(watchSrc) && /cfg\.officeWaitMs === undefined \? 120000/.test(watchSrc));
} else {
  console.log('  SKIP  WaRead tool not on this machine — tool checks skipped');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
