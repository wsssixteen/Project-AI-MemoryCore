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
  classChain: 'class-chain ✓(MlkKertasTemplateForm:102 -> BasePelupusanDokumenForm:114 -> BaseBpmForm:197)',
  perananMap: 'peranan-map ✓(PERANAN-MAP.md:99 PPTnKanan 1530 · :101 PPTT 30290 ≠ PPTNT 18503)',
  flowable: 'flowable-contract ✓(prepareBpmValuesFor_tgsn_KKPT():2376 sends agihanKKPT only; FlowableTaskListener:150 reads nextUser)',
  priorFix: 'prior-fix ✓(git log --grep Agihan Kepada -> f33f8632d8 onRefreshComponent)',
  // v1.4 2026-08-07 (#273455). Adding a REQUIRED_CHECK without extending this map turns the
  // whole eval RED, and a red eval makes core/forge.js refuse every future refine — which is
  // exactly how the five 2026-08-04 checks froze this component until today.
  fallbackPrecedence: 'fallback-precedence ✓(a: vo.setLuasDipohon(ahkm.getLuas()):5162 assigns primary first; b: guard vo.getLuasDipohon()==null never overwrites a real value; c: deliberate-clear re-shows the pra value next load — cannot distinguish never-filled from emptied)',
};
// v1.5 2026-08-16 (grand-audit): sibling + sibling-diff are now EVIDENCE_CHECKS — fixtures carry citations.
const EV_SIBLING = 'sibling ✓(MlkBorangHakmilikForm.xhtml:141 fully-wired dropdown read this session)';
const EV_SIBLING_DIFF = 'sibling-diff ✓(vs MlkBorangHakmilikForm: attrs ✓ listener-sig ✓ VO-instance ✓ lifecycle ✓)';
const TAIL = ` · in-file ✓ · ${EV_SIBLING} · ${EV.existingReuse} · name-by-purpose ✓ · minimal-diff ✓ · logic-matrix ✓ · ${EV.blastRadius} · predicate ✓ · ${EV.falsifier} · ${EV.readWrite} · BA-expected ✓(observed History.txt:38-43) · full-address ✓ · ${EV_SIBLING_DIFF} · ${EV.necessity} · ${EV.allWriters} · ${EV.kodResolution} · ${EV.priorFix} · ${EV.classChain} · ${EV.perananMap} · ${EV.flowable} · ${EV.fallbackPrecedence} · confidence 85%`;

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

// F11 (v1.5): bare `sibling ✓` (no citation) → block naming sibling
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(FULL_CHECK_LINE.replace(EV_SIBLING, 'sibling ✓') + '\napplying fix') });
check('F11 bare sibling ✓ → BLOCK (259112 guard)', r.blocked && /sibling/i.test(r.combined), 'blocked=' + r.blocked);

// F12 (v1.5): docx-template — reduced row set (no flow rows) → allow
const DOCX_LINE = `CODE-CHECK: ${EV.analog} · in-file ✓ · ${EV_SIBLING} · ${EV.existingReuse} · name-by-purpose ✓ · minimal-diff ✓ · ${EV.falsifier} · BA-expected ✓(observed rendered PDF Task folder) · full-address ✓ · ${EV_SIBLING_DIFF} · ${EV.necessity} · ${EV.kodResolution} · ${EV.priorFix} · confidence 85%`;
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/resources/template/MLK_PLP_L1E.docx' }, transcript_path: makeTranscript(DOCX_LINE + '\napplying fix') });
check('F12 docx-template reduced row set (no flow rows) → allow', !r.blocked, 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 200));

// F13 (v1.5): config-json path now FIRES — no CODE-CHECK line → block
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/resources/tindakan.config.json' }, transcript_path: makeTranscript('editing config') });
check('F13 config-json without CODE-CHECK → BLOCK (c38bc07a90 gap closed)', r.blocked, 'blocked=' + r.blocked);

// F14 (v1.5): plain .java still requires the FULL 22-row set — docx-reduced line on .java → block
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(DOCX_LINE + '\napplying fix') });
check('F14 reduced line on plain .java → BLOCK (spec preserved)', r.blocked, 'blocked=' + r.blocked);

// ── v1.7 (2026-09-22, QA-280540) enum-branch census — RED FIRST ─────────────────────────────
const JAVA = 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java';
const BR = (k) => `} else if ("${k}".equals(unitPengiraan)) {\n  jumlah = kadar.multiply(bilangan);\n`;
const CHAIN_2 = `if ("Meter Persegi".equals(unitPengiraan)) {\n  jumlah = kadar.multiply(luas);\n` + BR('Lot') + '}';
const CHAIN_6 = `if ("Meter Persegi".equals(unitPengiraan)) {\n  jumlah = kadar.multiply(luas);\n` + ['Lot', 'Plot', 'Hakmilik', 'Permohonan', 'Urusan'].map(BR).join('') + '}';
const NEC_CENSUS = 'necessity ✓(census PPTPBL.unit_pengiraan 4/4 envs: Meter Persegi 3/4 · Lot 1/4 — Plot/Hakmilik/Permohonan/Urusan 0/4 DROPPED)';
const NEC_280540 = 'necessity ✓(no analog-copied extras)'; // the verbatim shipping cell
const withNec = (nec) => FULL_CHECK_LINE.replace(EV.necessity, nec) + '\napplying fix';

// F15 (a): 2-key chain + census naming both keys → allow
r = runHookWith({ tool_input: { file_path: JAVA, old_string: 'jumlah = kadar;', new_string: CHAIN_2 }, transcript_path: makeTranscript(withNec(NEC_CENSUS)) });
check('F15 enum chain WITH per-key census → allow', !r.blocked, 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 300));

// F16 (b): the verbatim QA-280540 shape — 6 keys, "no analog-copied extras", zero counts → BLOCK naming census + keys
r = runHookWith({ tool_input: { file_path: JAVA, old_string: 'jumlah = kadar;', new_string: CHAIN_6 }, transcript_path: makeTranscript(withNec(NEC_280540)) });
check('F16 280540 replay: 6-key chain, model-attested necessity → BLOCK', r.blocked && /Added keys:.*Plot/.test(r.combined) && /NO count/.test(r.combined) && /QA-280540/.test(r.combined), 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 300));

// F17 (b'): census cited, but keys counted at 0/4 are STILL in the diff with no reason → BLOCK naming the dead keys
r = runHookWith({ tool_input: { file_path: JAVA, old_string: 'jumlah = kadar;', new_string: CHAIN_6 }, transcript_path: makeTranscript(withNec(NEC_CENSUS)) });
check('F17 keys cited at 0/4 yet kept in diff → BLOCK (dead branches)', r.blocked && /0 coverage[^\n]*Plot[^\n]*Hakmilik[^\n]*Permohonan[^\n]*Urusan/.test(r.combined), 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 300));

// F18 (c): non-enum edit (single null guard) with the ordinary necessity cell → unaffected
r = runHookWith({ tool_input: { file_path: JAVA, old_string: 'vo.setLuas(luas);', new_string: 'if (luas == null) { luas = BigDecimal.ZERO; }\nvo.setLuas(luas);' }, transcript_path: makeTranscript(FULL_CHECK_LINE + '\napplying fix') });
check('F18 non-enum edit → unaffected (allow)', !r.blocked, 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 200));

// F19: the chain already EXISTS in old_string (Edit context lines) — nothing added → unaffected
r = runHookWith({ tool_input: { file_path: JAVA, old_string: CHAIN_6, new_string: CHAIN_6.replace('kadar.multiply(luas)', 'kadar.multiply(luas).setScale(2)') }, transcript_path: makeTranscript(FULL_CHECK_LINE + '\napplying fix') });
check('F19 chain pre-existing in old_string → unaffected (allow)', !r.blocked, 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 200));

// F20: explicit waiver — keys are not population values → allow (visible at review)
r = runHookWith({ tool_input: { file_path: JAVA, old_string: 'x', new_string: 'if ("Y".equals(flag)) { a(); } else if ("N".equals(flag)) { b(); }' }, transcript_path: makeTranscript(withNec('necessity ✓(guard maps to the crash; census N/A — Y/N flag per BA spec, not a population column)')) });
check('F20 waiver "census N/A — <reason>" → allow', !r.blocked, 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 200));

// F21: constant-keyed chain (URS_PT / URS_PSBS) + a JUSTIFIED zero → allow
r = runHookWith({ tool_input: { file_path: JAVA, old_string: 'x', new_string: 'if (PelupusanUrusanConstant.URS_PT.equals(kod)) { a(); } else if (PelupusanUrusanConstant.URS_PSBS.equals(kod)) { b(); }' }, transcript_path: makeTranscript(withNec('necessity ✓(census umm_aplikasi kod_urusan: PT 12/49 rows · PSBS 0/49 because BA ticket #280540 names PSBS as the second urusan going live)')) });
check('F21 constant keys + justified 0-count → allow', !r.blocked, 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 300));

// F22: Write (content, no old_string) with a switch/case chain and a count but one key unnamed → BLOCK naming it
r = runHookWith({ tool_input: { file_path: JAVA, content: 'switch (unit) {\n  case "Lot": a(); break;\n  case "Plot": b(); break;\n}' }, transcript_path: makeTranscript(withNec('necessity ✓(census unit_pengiraan 4/4 envs: Lot 1/4)')) });
check('F22 Write+switch, one key unnamed in census → BLOCK naming Plot', r.blocked && /NOT named[^\n]*Plot/.test(r.combined), 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 300));

// F9: empty stdin → no crash, no block
r = spawnSync(process.execPath, [HOOK], { input: '', encoding: 'utf8', timeout: 30000, env: process.env });
check('F9 empty stdin exits 0', r.status === 0, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\npre-code-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
