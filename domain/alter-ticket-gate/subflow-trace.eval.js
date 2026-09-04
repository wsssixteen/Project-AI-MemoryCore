#!/usr/bin/env node
// subflow-trace.eval.js — replays the EXACT miss of 2026-09-04 (#275847): the SBTM callActivity in PRK_PLP_PSBP was
// read by its label; the truth was the child's script `urusan = nextUrusan`. The tool must surface that line.
'use strict';
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const TOOL = path.join(__dirname, 'subflow-trace.js');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const MAIN = ROOT.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/, '');
const perak = [path.join(ROOT, 'projects/coding-projects/active/etanah-knowledge/perak/flowables-bpmn'), path.join(MAIN, 'projects/coding-projects/active/etanah-knowledge/perak/flowables-bpmn')].find(p => fs.existsSync(path.join(p, 'PRK_PLP_PSBP.bpmn20.xml')));
const results = []; const check = (n, c, d) => results.push({ n, pass: !!c, d });
const run = (args) => { const r = spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', timeout: 30000 }); return { out: (r.stdout || '') + (r.stderr || ''), status: r.status }; };

if (perak) {
  const r = run([perak, path.join(perak, 'PRK_PLP_PSBP.bpmn20.xml'), 'sid-4EB98655-CA62-4D7A-B0EF-EE750CC16320']);
  check('F1 replay #275847: SBTM call → nextUrusan consumer = INTEGRASI script line 62', /nextUrusan → .*PRK_DFT_INTEGRASI\.bpmn20\.xml:62 \[script\]/.test(r.out), r.out.slice(0, 300));
  check('F2 the derived variable (urusan) reaches generateNoSerahanService', /via nextUrusan→urusan.*generateNoSerahanService|urusan → .*generateNoSerahanService/.test(r.out), r.out.slice(0, 300));
  check('F3 flagSemakanPemohonan gate surfaced in NOTA_HKMLK', /flagSemakanPemohonan → .*PRK_DFT_NOTA_HKMLK\.bpmn20\.xml:\d+ \[gateway-condition\]/.test(r.out), '');
  check('F4 nested callActivity INTEGRASI descended', /callActivity sid-1CA73330.*calledElement=PRK_DFT_INTEGRASI/.test(r.out), '');
  const bad = run([perak, path.join(perak, 'PRK_PLP_PSBP.bpmn20.xml'), 'sid-DOES-NOT-EXIST']);
  check('F5 unknown callActivity → exit 1 with message', bad.status === 1 && /not found/.test(bad.out), 'exit=' + bad.status);
} else {
  check('F1-F5 SKIPPED — perak/flowables-bpmn not on this machine (untracked knowledge)', true, 'skip');
}
// F6 synthetic: a child model missing on disk is flagged, not silently ignored
const sb = fs.mkdtempSync(path.join(os.tmpdir(), 'sft-'));
fs.writeFileSync(path.join(sb, 'P.bpmn20.xml'), '<definitions><process><callActivity id="c1" name="X (KEY_MISSING)" calledElement="KEY_MISSING"><extensionElements><flowable:in source="nextUrusan" target="nextUrusan"/></extensionElements></callActivity></process></definitions>');
const r6 = run([sb, path.join(sb, 'P.bpmn20.xml'), 'c1']);
check('F6 called model absent → "MODEL NOT ON DISK" surfaced', /MODEL NOT ON DISK/.test(r6.out), r6.out.slice(0, 200));
fs.rmSync(sb, { recursive: true, force: true });

let failed = 0; for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nsubflow-trace.eval: ' + (results.length - failed) + '/' + results.length + (failed ? ' RED' : ' green'));
process.exit(failed ? 1 : 0);
