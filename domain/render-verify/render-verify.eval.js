#!/usr/bin/env node
// render-verify.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: #276181 — a font "Arial 11" fix delivered as a deploy card THREE times, each 12pt on the
// generated doc, because the RENDERED output was never inspected. This gate BLOCKS that delivery.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'render-verify.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function transcriptWith(text) {
  const p = path.join(os.tmpdir(), 'rv-eval-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(p, JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } }) + '\n');
  return p;
}
function run(stdin) {
  return spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: process.env });
}
const PAD = ' filler'.repeat(40); // clear the 120-char short-reply floor

// F1: clean input → must NOT block (exit 0)
let r = run('{}');
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: REPLAY — deploy card for a template/font fix, NO RENDER-VERIFY → BLOCK (exit 2)
let t = transcriptWith('Re-deploy: ssh app@172.16.100.162 — populatePemilikBerdaftar Arial 11 fix on mlk/int-env, BA re-test the .docx' + PAD);
r = run(JSON.stringify({ transcript_path: t }));
check('F2 template+font delivery w/o RENDER-VERIFY → BLOCK', r.status === 2 && /render-verify/i.test(r.stdout || ''), 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 50));

// F3: same delivery WITH a RENDER-VERIFY line → silent pass (exit 0)
t = transcriptWith('deploy-pelupusan.sh — RENDER-VERIFY: PTMLK/02/L/PPTPB/2026/4 · unzipped word/document.xml · pemilikBerdaftar run sz=22 (11pt) ✓ · font=Arial ✓  populate font fix' + PAD);
r = run(JSON.stringify({ transcript_path: t }));
check('F3 RENDER-VERIFY present → silent', r.status === 0, 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 50));

// F4: delivery but NON-render change (SQL patch) → silent (no over-fire)
t = transcriptWith('Re-deploy: ssh app@172.16.100.162 — run the SQL patch on stg2, BA re-test the dashboard' + PAD);
r = run(JSON.stringify({ transcript_path: t }));
check('F4 non-render delivery → silent', r.status === 0, 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 50));

// F5: render context but NO delivery signal (mid-investigation) → silent
t = transcriptWith('Tracing populatePemilikBerdaftar and the .docx template — reading FONT_SIZE_11 in the renderer, no conclusion yet' + PAD);
r = run(JSON.stringify({ transcript_path: t }));
check('F5 render context, no delivery → silent', r.status === 0, 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 50));

// F6: bypass token honoured (server-side render, honestly not-yet-verified)
t = transcriptWith('Re-deploy the .docx font fix, BA re-test [skip-render-verify: server-side render, awaiting BA regen on new build]' + PAD);
r = run(JSON.stringify({ transcript_path: t }));
check('F6 bypass token → silent pass', r.status === 0, 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 50));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nrender-verify.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
