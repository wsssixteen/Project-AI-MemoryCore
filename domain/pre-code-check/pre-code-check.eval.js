#!/usr/bin/env node
// pre-code-check.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: Edit etanah .java without CODE-CHECK line → hook blocks; with all ✓ → allow
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'pre-code-check.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function makeTranscript(assistantText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pre-code-check-eval-'));
  const tp = path.join(dir, 'transcript.jsonl');
  const lines = [
    JSON.stringify({ type: 'user', message: { role: 'user', content: 'do edit' } }),
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: assistantText }] } }),
  ];
  fs.writeFileSync(tp, lines.join('\n') + '\n');
  return tp;
}

function runHookWith(input) {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(input), encoding: 'utf8', timeout: 30000, env: process.env });
  const blocked = r.status === 2 || /"decision"\s*:\s*"block"/.test(r.stdout || '');
  const combined = (r.stdout || '') + (r.stderr || '');
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', blocked, combined };
}

const EV = {
  analog: 'analog ✓(BasePelupusanForm.java:534 same-shape arm)',
  existingReuse: 'existing-reuse ✓(grepped flagRepopulate -> reused :530/:543)',
  blastRadius: 'blast-radius ✓(grepped onChangeTindakanKeputusan -> 30 call-sites)',
  readWrite: 'read+write-path ✓(PelupusanPegawaiAgihService:126 persists it)',
  falsifier: 'falsifier ✓(a task whose peranan_semasa misses the arm test)',
  necessity: 'necessity ✓(each kod maps to one BA-named tugasan)',
  allWriters: 'all-writers ✗(N/A — control-flow arm, no value guarded)',
  kodResolution: 'kod-resolution ✓(Perakuan Pentadbir Tanah -> PPTPRBB, ind_tgsn 5134409)',
  hierarchy: 'hierarchy ✓(MlkKertasTemplateForm:102 -> BasePelupusanDokumenForm:114 -> BaseBpmForm:197)',
  priorFix: 'prior-fix ✓(git log --grep Agihan Kepada -> f33f8632d8 onRefreshComponent)',
};
const TAIL = ` · in-file ✓ · sibling ✓ · ${EV.existingReuse} · name-by-purpose ✓ · minimal-diff ✓ · logic-matrix ✓ · ${EV.blastRadius} · predicate ✓ · ${EV.falsifier} · ${EV.readWrite} · BA-expected ✓(observed History.txt:38-43) · full-address ✓ · sibling-diff ✓ · ${EV.necessity} · ${EV.allWriters} · ${EV.kodResolution} · ${EV.priorFix} · ${EV.hierarchy} · confidence 85%`;

const FULL_CHECK_LINE = `CODE-CHECK: ${EV.analog}${TAIL}`;
const CROSS_JUSTIFIED = `CODE-CHECK: analog ✗(novel defensive helper)${TAIL}`;
const CROSS_BARE = `CODE-CHECK: analog ✗${TAIL}`;
const MISSING_CHECKS = 'CODE-CHECK: analog ✓ · in-file ✓ · sibling ✓ · confidence 85%';
const BARE_KOD_RESOLUTION = `CODE-CHECK: ${EV.analog}${TAIL.replace(EV.kodResolution, 'kod-resolution ✓')}`;

// F1: non-etanah path → allow (no fire)
let r = runHookWith({ tool_input: { file_path: 'C:/tmp/some-random-file.txt' }, transcript_path: makeTranscript('doing an edit') });
check('F1 non-etanah path exits 0, no block', r.status === 0 && !r.blocked, 'exit=' + r.status);

// F2: etanah .java WITHOUT CODE-CHECK line → block
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript('applying fix, no check line') });
check('F2 etanah .java without CODE-CHECK line → BLOCK', r.blocked && /pre-code-check/i.test(r.combined), 'blocked=' + r.blocked);

// F3: etanah .java WITH full ✓ CODE-CHECK line → allow
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(FULL_CHECK_LINE + '\napplying fix') });
check('F3 etanah .java with full ✓ CODE-CHECK → allow', !r.blocked, 'blocked=' + r.blocked + ' stdout=' + r.stdout.slice(0, 150));

// F4: etanah .java with ✗-with-justification → allow
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(CROSS_JUSTIFIED + '\napplying fix') });
check('F4 etanah .java with ✗-justified → allow', !r.blocked, 'blocked=' + r.blocked);

// F5: etanah .java with bare ✗ (no justification) → block
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(CROSS_BARE + '\napplying fix') });
check('F5 etanah .java with bare ✗ → BLOCK', r.blocked, 'blocked=' + r.blocked);

// F6: etanah .java with missing checks → block
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(MISSING_CHECKS + '\napplying fix') });
check('F6 etanah .java with missing check names → BLOCK', r.blocked, 'blocked=' + r.blocked);

// F7: etanah .xhtml WITHOUT CODE-CHECK → block
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-common/src/main/webapp/protected/common/foo.xhtml' }, transcript_path: makeTranscript('editing xhtml') });
check('F7 etanah .xhtml without CODE-CHECK → BLOCK', r.blocked, 'blocked=' + r.blocked);

// F8: [skip-pre-code-check: <reason>] bypass → allow
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript('[skip-pre-code-check: rename-only]\napplying rename') });
check('F8 bypass token → allow', !r.blocked, 'blocked=' + r.blocked);

// F10: kod-resolution present but bare ✓ (no reference-table citation) → block
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(BARE_KOD_RESOLUTION + '\napplying fix') });
check('F10 bare kod-resolution ✓ → BLOCK', r.blocked && /kod-resolution/i.test(r.combined), 'blocked=' + r.blocked);

// F9: empty stdin → no crash, no block
r = spawnSync(process.execPath, [HOOK], { input: '', encoding: 'utf8', timeout: 30000, env: process.env });
check('F9 empty stdin exits 0', r.status === 0, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\npre-code-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
