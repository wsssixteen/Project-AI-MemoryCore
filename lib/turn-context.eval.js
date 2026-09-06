#!/usr/bin/env node
// lib/turn-context.eval.js — pins for the turn stamp (M1/M2) + attribution (9h). Run: node lib/turn-context.eval.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const TC = require(path.join(__dirname, 'turn-context.js'));
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const ACTIVE = [
  'qa=ADHOC-PT-2026-3', 'status=hold', 'phase=0', '',
  'qa=QA-277532', 'status=active', 'phase=Apply', '',
  'qa=QA-277370', 'status=active', 'phase=Rubric', '',
].join('\n');

// A1 ticket named in the prompt → that block
let a = TC.attribute('continue QA-277370 please', ACTIVE);
check('A1 named ticket wins over top block', a.qa === 'QA-277370' && a.phase === 'Rubric' && a.qa_source === 'named', JSON.stringify(a));
// A2 bare number with a matching block
a = TC.attribute('patch for #277532 ready', ACTIVE);
check('A2 bare #number resolves to its block', a.qa === 'QA-277532' && a.qa_source === 'named', JSON.stringify(a));
// A3 no ticket in prompt → first ACTIVE block, never the held top block
a = TC.attribute('brief me on the findings', ACTIVE);
check('A3 no ticket → first status=active block (skips hold)', a.qa === 'QA-277532' && a.qa_source === 'top-active', JSON.stringify(a));
// A4 named ticket without a block → synthetic
a = TC.attribute('ADHOC-MCL-2026-9 new adhoc', ACTIVE);
check('A4 named ticket with no block → qa kept, source named-no-block', a.qa === 'ADHOC-MCL-2026-9' && a.qa_source === 'named-no-block', JSON.stringify(a));
// A5 empty active.txt → nulls
a = TC.attribute('hello', '');
check('A5 empty active.txt → nulls', a.qa === null && a.qa_source === null, JSON.stringify(a));
// A6 most-mentioned wins
a = TC.attribute('QA-277370 vs QA-277532 ... QA-277532 again', ACTIVE);
check('A6 most-mentioned ticket wins', a.qa === 'QA-277532', JSON.stringify(a));
// A7 a 6-digit number with no block is NOT a ticket (e.g. a permohonan id fragment)
a = TC.attribute('apl 343283 luas 4.7004', ACTIVE);
check('A7 bare number without a block is ignored → top-active', a.qa === 'QA-277532' && a.qa_source === 'top-active', JSON.stringify(a));

// S1 parallel stamp: 6 concurrent openTurn calls with the same prompt → one turn_id
const sid = 'evalctx-' + process.pid;
const input = JSON.stringify({ session_id: sid, prompt: 'parallel probe', transcript_path: path.join(os.tmpdir(), 'no-such-transcript.jsonl') });
const script = `const tc=require(${JSON.stringify(path.join(__dirname, 'turn-context.js'))});const s=tc.openTurn(${JSON.stringify(input)},'UserPromptSubmit');process.stdout.write(s?s.turn_id:'null');`;
const ids = new Set();
const procs = [];
for (let i = 0; i < 6; i++) procs.push(require('child_process').spawn(process.execPath, ['-e', script], { env: process.env }));
const outs = [];
let done = 0;
function finish() {
  for (const o of outs) ids.add(o);
  check('S1 six parallel openTurn calls → one turn_id', ids.size === 1 && !ids.has('null'), JSON.stringify([...ids]));
  // S2 second prompt → n+1
  const s2 = TC.openTurn(JSON.stringify({ session_id: sid, prompt: 'second probe' }), 'UserPromptSubmit');
  check('S2 next prompt increments n', s2 && /-2$/.test(s2.turn_id), s2 && s2.turn_id);
  // S3 non-UPS event never stamps
  check('S3 Stop event does not open a turn', TC.openTurn(JSON.stringify({ session_id: 'zz' + sid, prompt: 'x' }), 'Stop') === null, '');
  // S4 contextFor with unknown session → nulls, no throw
  const c = TC.contextFor(JSON.stringify({ session_id: 'unknown-' + sid }));
  check('S4 contextFor unknown session → null turn_id', c.turn_id === null, JSON.stringify(c));
  try { fs.unlinkSync(TC.stampPath(sid)); } catch (_) {}
  let failed = 0;
  for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
  console.log('\nturn-context.eval: ' + (results.length - failed) + '/' + results.length + ' green');
  process.exit(failed ? 1 : 0);
}
for (const p of procs) { let o = ''; p.stdout.on('data', d => { o += d; }); p.on('close', () => { outs.push(o.trim()); if (++done === procs.length) finish(); }); }
