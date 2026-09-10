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
} else {
  console.log('  SKIP  WaRead tool not on this machine — tool checks skipped');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
