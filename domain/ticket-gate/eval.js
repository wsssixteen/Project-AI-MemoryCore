#!/usr/bin/env node
// domain/ticket-gate/eval.js — pin for .claude/hooks/ticket-gate.js (added 2026-07-13 with the
// bare-number refine: the CLAUDE.md trigger table promised bare-number injection; now the hook delivers).
// Uses TICKET_GATE_ACTIVE_TXT override so fixtures never touch the real quest/active.txt.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const HOOK = path.join(ROOT, '.claude', 'hooks', 'ticket-gate.js');
const REAL_ACTIVE = path.join(ROOT, 'quest', 'active.txt');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ticket-gate-eval-'));
const FIXTURE = path.join(TMP, 'active.txt');
fs.writeFileSync(FIXTURE, 'active:\n\nqa=QA-90001\nstatus=hold\nphase=0\n\nqa=90002\nstatus=hold\nphase=0\n');

const realHashBefore = crypto.createHash('sha1').update(fs.readFileSync(REAL_ACTIVE)).digest('hex');

function run(prompt) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000,
    env: { ...process.env, TICKET_GATE_ACTIVE_TXT: FIXTURE, CLAUDE_PROJECT_DIR: ROOT },
  });
}
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1 prefixed mention fires
let r = run('QA 90001 please');
check('F1 prefixed mention fires QUEST GATE', /QUEST GATE/.test(r.stdout), (r.stdout || '').slice(0, 80));

// F2 BARE number cross-matching an active.txt block fires (the 2026-07-13 refine)
r = run('lets start with 90002');
check('F2 bare number fires (cross-matched to qa=90002)', /QUEST GATE/.test(r.stdout), (r.stdout || '').slice(0, 80));
check('F2 exit 0', r.status === 0, 'exit=' + r.status);

// F3 bare number NOT in active.txt stays silent
r = run('the number 90009 means nothing');
check('F3 unknown bare number silent', r.status === 0 && !(r.stdout || '').trim(), (r.stdout || '').slice(0, 60));

// F4 no signal stays silent
r = run('good morning, how are we doing');
check('F4 no signal silent', r.status === 0 && !(r.stdout || '').trim(), '');

// F5 real active.txt untouched by the whole eval
const realHashAfter = crypto.createHash('sha1').update(fs.readFileSync(REAL_ACTIVE)).digest('hex');
check('F5 real quest/active.txt byte-identical', realHashBefore === realHashAfter, '');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log(`\nticket-gate.eval: ${results.length - failed}/${results.length} green`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
