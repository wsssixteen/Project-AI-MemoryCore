/**
 * attachment-ledger-gate.eval.js — behavioural fixtures for the Stop gate.
 * Run: node domain/attachment-ledger-gate/attachment-ledger-gate.eval.js
 * Builds an isolated temp workspace (active.txt + task folder 0. Brief/ with
 * dummy files + transcript .jsonl fixtures), runs the hook as a child process,
 * asserts block/pass per fixture. Zero touch to real files.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HOOK = path.join(__dirname, 'attachment-ledger-gate.check.hook.js');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'algate-'));
const taskFolder = path.join(work, '144. ESOKONGAN #9999');
const brief = path.join(taskFolder, '0. Brief');
fs.mkdirSync(brief, { recursive: true });
const FILES = ['Isu 1 - Semakan.png', 'Paparan Jawatan.jpeg', 'TEMPLATE 3 SIGN.doc'];
FILES.forEach(f => fs.writeFileSync(path.join(brief, f), 'x'));
fs.writeFileSync(path.join(brief, 'Description.txt'), 'desc');

const activeTxt = path.join(work, 'active.txt');
fs.writeFileSync(activeTxt, 'qa=QA-9999\nstatus=active\ntask_folder=' + taskFolder + '\nurusan=PT\n');

function transcript(msgs) {
  const p = path.join(work, 'tx-' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(p, msgs.map(m => JSON.stringify({ type: m.role, message: { role: m.role, content: m.text } })).join('\n'));
  return p;
}
function run(txPath, stopActive) {
  const payload = JSON.stringify({ transcript_path: txPath, stop_hook_active: !!stopActive });
  let out = '';
  try { out = execFileSync('node', [HOOK], { input: payload, env: { ...process.env, ATTACH_LEDGER_ACTIVE_TXT: activeTxt }, encoding: 'utf8' }); }
  catch (e) { out = (e.stdout || '').toString(); }
  try { return JSON.parse(out.trim() || '{}').decision === 'block'; } catch (e) { return false; }
}
const A = t => ({ role: 'assistant', text: t });
const U = t => ({ role: 'user', text: t });

const cases = [
  { name: 'F1 diagnosis + only 1/3 visuals ledgered -> BLOCK',
    tx: transcript([U('start quest 9999'), A('Recon for QA-9999: root cause in Isu 1 - Semakan.png shows the panel.')]), expect: true },
  { name: 'F2 diagnosis + all 3 visuals ledgered -> PASS',
    tx: transcript([A('Rubric QA-9999. Ledger: Isu 1 - Semakan.png ok; Paparan Jawatan.jpeg ok; TEMPLATE 3 SIGN.doc ok.')]), expect: false },
  { name: 'F3 no diagnosis markers -> PASS (skip)',
    tx: transcript([A('Thanks, will look at QA-9999 later.')]), expect: false },
  { name: 'F4 bypass token present -> PASS',
    tx: transcript([A('Recon QA-9999 only saw Isu 1 - Semakan.png [skip-attachment-ledger: video corrupt]')]), expect: false },
  { name: 'F5 stop_hook_active -> PASS (anti-loop)',
    tx: transcript([A('Recon QA-9999, Isu 1 - Semakan.png only')]), stopActive: true, expect: false },
  { name: 'F6 diagnosis but quest not referenced -> PASS (out of scope)',
    tx: transcript([A('Recon for QA-1111, unrelated blast-radius work.')]), expect: false },
  { name: 'F7 all 3 visuals ledgered, Description.txt not mentioned -> PASS (.txt excluded)',
    tx: transcript([A('Rubric QA-9999: Isu 1 - Semakan.png, Paparan Jawatan.jpeg, TEMPLATE 3 SIGN.doc all read.')]), expect: false },
];

let pass = 0;
for (const c of cases) {
  const got = run(c.tx, c.stopActive);
  const ok = got === c.expect;
  console.log((ok ? 'PASS' : 'FAIL') + ' — ' + c.name + '  (blocked=' + got + ', expected=' + c.expect + ')');
  if (ok) pass++;
}
try { fs.rmSync(work, { recursive: true, force: true }); } catch (e) {}
console.log('\n' + pass + '/' + cases.length + ' passed');
process.exit(pass === cases.length ? 0 : 1);
