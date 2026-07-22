#!/usr/bin/env node
// awam-no-resit-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: #271721 2026-07-22 — PRBB AWAM ticket ran Phase 0 → Apply → a full Test Scenario
// emit with no No Resit. CLAUDE.md held the rule as PROSE only; the ticket-gate row was parked.
// Asserts BOTH directions: fires+blocks on the replay, and does NOT misfire on 6 near-misses.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const HOOK = path.join(__dirname, 'awam-no-resit-gate.check.hook.js');

function run(payload) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload), encoding: 'utf8', timeout: 30000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT },
  });
  return ((r.stdout || '') + (r.stderr || ''));
}
const blocked = out => /awam-no-resit-gate/.test(out) && /⛔/.test(out);

// pad past the 200-char floor without adding trigger words
const pad = s => s + '\n' + '.'.repeat(220);

const REPLAY = pad(`## Test Scenario — #271721 PRBB
Step 1 build and deploy the AWAM WAR. Step 2 open the Portal Awam → Pelupusan →
Permohonan Permit Bahan Batuan (PRBB) → tab 3 Borang Permohonan → Jana Semula.
Test data: p_aplikasi_id 13089, login aizatmaziz@gmail.com, kuantiti 180000.00.
Expect item 2 to read 180,000 METER PADU.`);

const FIXED = pad(`## Test Scenario — #271721 PRBB
Portal Awam → PRBB → Borang Permohonan → Jana Semula.
Test data: p_aplikasi_id 13089, login aizatmaziz@gmail.com.
No Resit Carian Rasmi: 260707BSAT00337
Expect item 2 to read 180,000 METER PADU.`);

const PELUPUSAN = pad(`## Test Scenario — #270900 BPRZ
Rebuild in Eclipse, Clean + Republish, open the Peraku tugasan in the staff portal
and confirm the document status. Sibling urusan PRBB is unaffected by this change.`);

const OTHER_AWAM = pad(`## Test Scenario — PLPS on AWAM
Open the Portal Awam → Permohonan Lesen Pendudukan Sementara (PLPS) → Borang Permohonan.
Test data: p_aplikasi_id 12345, login someone@gmail.com. Ready to test after deploy.`);

const BYPASSED = pad(`## Test Scenario — PRBB AWAM
Portal Awam → Borang Permohonan → Jana Semula → p_aplikasi_id 13089.
[skip-no-resit: existing draft opened directly, no carian-rasmi step in this flow]`);

const MID_WORK = pad(`I read the PRBB jrxml in etanah-awam and found the raw BigDecimal at line 800.
Portal Awam renders this via Jana Semula. Still investigating the LUAS blocks.`);

const CASES = [
  { n: 'F2 REPLAY #271721 — PRBB AWAM hand-back, no receipt', p: { last_assistant_message: REPLAY },     block: true },
  { n: 'F3 same emit WITH receipt 260707BSAT00337',           p: { last_assistant_message: FIXED },      block: false },
  { n: 'F4 pelupusan BPRZ ticket merely naming PRBB',         p: { last_assistant_message: PELUPUSAN },  block: false },
  { n: 'F5 AWAM PLPS (not a no-resit urusan)',                p: { last_assistant_message: OTHER_AWAM }, block: false },
  { n: 'F6 explicit [skip-no-resit:] bypass',                 p: { last_assistant_message: BYPASSED },   block: false },
  { n: 'F7 mid-work narration, not a hand-back',              p: { last_assistant_message: MID_WORK },   block: false },
  { n: 'F8 re-entrancy guard (stop_hook_active)',             p: { stop_hook_active: true, last_assistant_message: REPLAY }, block: false },
];

const results = [];
// F1: clean input → must NOT block
results.push({ n: 'F1 clean input (no false block)', pass: !blocked(run({})) });
for (const c of CASES) {
  const out = run(c.p);
  results.push({ n: c.n, pass: blocked(out) === c.block, d: `expected ${c.block ? 'BLOCK' : 'allow'}` });
}
// F9 effect check (Rule 6c): the rendered block must carry actionable instructions
const eff = run({ last_assistant_message: REPLAY });
results.push({ n: 'F9 effect — block text carries derive + notes.js steps', pass: /notes\.js/.test(eff) && /TEST-PERMOHONAN-INDEX/.test(eff) });

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + (x.d || ''))); }
console.log('\nawam-no-resit-gate.eval: ' + (results.length - failed) + '/' + results.length + (failed ? ' RED' : ' green'));
process.exit(failed ? 1 : 0);
