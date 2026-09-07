#!/usr/bin/env node
// rootcause-format.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: #277532: root cause pasted to Redmine had an em-dash + semicolon; miya rewrote it 3x
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'rootcause-format.check.hook.js');
const fs = require('fs');
const os = require('os');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const TMP = os.tmpdir();
let seq = 0;
// Write a transcript whose last assistant turn is `body`, run the hook, return exit status.
function runOn(body) {
  const f = path.join(TMP, `rcf-eval-${process.pid}-${seq++}.jsonl`);
  const row = JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: body }] } });
  fs.writeFileSync(f, row + '\n');
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ transcript_path: f }), encoding: 'utf8', timeout: 30000, env: process.env });
  try { fs.unlinkSync(f); } catch (_) {}
  return r.status;
}
const HB = (rc) => `Hand-back.\n\n| Root cause (plain, Redmine-ready) |\n|---|\n| ${rc} |\n\n| Test data | Value |\n|---|---|`;

// BLOCK (exit 2)
check('F1 em-dash blocks', runOn(HB('Tujuan ikut kod tersimpan — sistem papar nilai lama.')) === 2, 'em-dash');
check('F2 replay: em-dash + semicolon blocks', runOn(HB('ikut kod tersimpan; nilai lama — salah.')) === 2, 'replay #277532');
check('F3 spaced hyphen blocks', runOn(HB('Tujuan ikut kod tersimpan - nilai lama.')) === 2, 'spaced hyphen');
check('F4 semicolon blocks', runOn(HB('Tujuan ikut kod tersimpan; nilai lama.')) === 2, 'semicolon');
check('F5 blockquote em-dash blocks', runOn('Root cause\n\n> Tujuan ikut kod — nilai lama.') === 2, 'blockquote');
// PASS/SILENT (exit 0)
check('F6 clean short passes', runOn(HB('Di Pengiraan Bayaran Lesen, Tujuan ikut kod Maksud Menduduki tersimpan. Lain-Lain pun ada kod sendiri jadi sistem papar gabungan lama, bukan teks yang diisi pengguna.')) === 0, 'clean');
check('F7 hyphen-in-word only passes', runOn(HB('Lain-Lain pun ada kod sendiri jadi sistem papar gabungan lama.')) === 0, 'Lain-Lain ok');
check('F8 no root-cause row is silent', runOn('Normal reply. Mentions a - dash and ; but no root cause row here.') === 0, 'no row');
check('F9 placeholder sentinel is silent', runOn(HB('⬜ not yet diagnosed')) === 0, 'sentinel');
check('F10 bypass token is silent', runOn('[skip-rootcause-format: quoting BA]\n' + HB('ikut kod — lama.')) === 0, 'bypass');
// 2-col shape with Solution row (2026-09-07, #278585)
const HB2 = (rc, sol) => `Hand-back.\n\n| Redmine-ready | Text (plain, sendable to BA) |\n|---|---|\n| Root cause | ${rc} |\n| Solution | ${sol} |\n\n| Test data | Value |\n|---|---|`;
const RC_OK = 'Butang muat naik Lampiran ada had saiz 1 MB yang ditetapkan tetap dalam skrin. Fail lebih 1 MB ditolak sebelum muat naik bermula.';
const SOL_OK = 'Had saiz muat naik Lampiran dibuang, kini ikut had sistem. Fail lebih 1 MB boleh dimuat naik dan dipaparkan.';
check('F13 2-col clean root cause + solution passes', runOn(HB2(RC_OK, SOL_OK)) === 0, '2-col clean');
check('F14 2-col solution em-dash blocks', runOn(HB2(RC_OK, 'Had saiz dibuang — ikut had sistem.')) === 2, 'solution em-dash');
check('F15 2-col solution semicolon blocks', runOn(HB2(RC_OK, 'Had saiz dibuang; ikut had sistem.')) === 2, 'solution semicolon');
check('F16 2-col root cause dash blocks even with clean solution', runOn(HB2('Had saiz 1 MB — tetap.', SOL_OK)) === 2, '2-col rc dash');
check('F17 2-col solution placeholder is silent', runOn(HB2(RC_OK, '⬜ not yet fixed')) === 0, 'solution sentinel');
check('F18 word "solution" in prose without a root cause row is silent', runOn('The solution — a dash here; and a semicolon — is discussed in prose only.') === 0, 'prose solution');
check('F11 empty stdin no false block', spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env }).status === 0, 'empty');
check('F12 malformed stdin no false block', spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8', timeout: 30000, env: process.env }).status === 0, 'malformed');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nrootcause-format.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
