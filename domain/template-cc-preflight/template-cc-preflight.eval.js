#!/usr/bin/env node
// template-cc-preflight.eval.js — replay eval (born WITH the component).
// Replay case: 2026-08-19 BA "ralat sbb maklumat tak lengkap" on PROD — preflighting CC tags
// vs the app's rows would have surfaced patchable gaps before testing.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'template-cc-preflight.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function transcriptWith(text) {
  const p = path.join(os.tmpdir(), 'ccpf-eval-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(p, JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } }) + '\n');
  return p;
}
function run(stdin) {
  return spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: process.env });
}

const PAD = ' filler'.repeat(60); // clear the 200-char short-reply floor

// F1: clean input → exit 0 silent
let r = run('{}');
check('F1 clean input exits 0', r.status === 0, 'exit=' + r.status);

// F2: replay — template hand-back (YOUR MOVE + .docx) WITHOUT CC-PREFLIGHT → advisory fires
let t = transcriptWith('═══ ▶ YOUR MOVE ═══ test the TemplateKertasPertimbangan .docx render' + PAD);
r = run(JSON.stringify({ transcript_path: t }));
check('F2 template hand-back w/o preflight → advisory rendered', r.status === 0 && r.stdout.includes('CC-PREFLIGHT'), 'stdout=' + (r.stdout || '').slice(0, 60));

// F3: same hand-back WITH a CC-PREFLIGHT line → silent
t = transcriptWith('═ ▶ YOUR MOVE ═ template .docx — CC-PREFLIGHT: 34 tags · 0 unmapped · data-gaps: none' + PAD);
r = run(JSON.stringify({ transcript_path: t }));
check('F3 preflight line present → silent', r.status === 0 && !(r.stdout || '').includes('ADVISORY'), 'stdout=' + (r.stdout || '').slice(0, 60));

// F4: non-template hand-back (no template/.docx word) → silent
t = transcriptWith('▶ YOUR MOVE — run the SQL patch on stg2 and confirm the row count' + PAD);
r = run(JSON.stringify({ transcript_path: t }));
check('F4 non-template hand-back → silent', r.status === 0 && !(r.stdout || '').includes('ADVISORY'), 'stdout=' + (r.stdout || '').slice(0, 60));

// F5: bypass token honoured
t = transcriptWith('▶ YOUR MOVE template .docx talk [skip-cc-preflight: doc-gen not under test] ' + PAD);
r = run(JSON.stringify({ transcript_path: t }));
check('F5 bypass token → silent pass', r.status === 0 && !(r.stdout || '').includes('ADVISORY'), 'stdout=' + (r.stdout || '').slice(0, 60));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ntemplate-cc-preflight.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
