#!/usr/bin/env node
// pre-code-check.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: Edit etanah .java without CODE-CHECK line → hook blocks; with all ✓ → allow
// v1.7 (2026-09-22): 32 fixtures (F1-F32) — F15/F16 balanced-paren evidence scanner, F17-F19
// latest/turn same-file CODE-CHECK reuse, F20-F26 config-source trigger-gated row, F27-F30
// lightEdit import-only/rename-only classification, F31-F32 single-pass combined-report shape.
// v1.7.1 (2026-09-23, reviewer fixes A-E): F28 rewritten (rename-only Edit is NO LONGER light —
// asserts BLOCK, not allow) — the rename-only path was removed from lightEdit() (finding A,
// SERIOUS: `return a` -> `return b` classified as a "rename" and silently skipped its CODE-CHECK).
// F33 (B): blank-parens `✗()` treated as no evidence -> still trips bare-✗. F34 (C): CODE-CHECK ->
// Grep tool_result -> FIRST Edit of a file this turn (fresh/empty log, no prior passed row for ANY
// file) -> allow. F35 (D): an unrelated active quest's active.txt block mentions "maintenance" but
// the current turn names no ticket -> no config-source demand. EV map (E) extended with
// `configSource` so the row has one canonical evidence string like every other check.
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

function runHookWith(input, extraEnv) {
  const env = extraEnv ? Object.assign({}, process.env, extraEnv) : process.env;
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(input), encoding: 'utf8', timeout: 30000, env });
  const blocked = r.status === 2 || /"decision"\s*:\s*"block"/.test(r.stdout || '');
  const combined = (r.stdout || '') + (r.stderr || '');
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', blocked, combined };
}

// v1.7 C6: a transcript with a tool_result-only user entry SPLITTING two assistant text segments —
// mirrors a real multi-Edit turn (Edit's tool_result is its own role=user line with no text block).
function makeSplitTranscript(firstAssistantText, secondAssistantText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pre-code-check-eval-'));
  const tp = path.join(dir, 'transcript.jsonl');
  const lines = [
    JSON.stringify({ type: 'user', message: { role: 'user', content: 'do edit' } }),
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: firstAssistantText }] } }),
    JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', content: 'ok' }] } }),
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: secondAssistantText }] } }),
  ];
  fs.writeFileSync(tp, lines.join('\n') + '\n');
  return tp;
}

// v1.7 C6: PRE_CODE_CHECK_LOG-pointed temp log, pre-seeded with rows (used for the same-file-once-
// per-turn fixtures F17-F19 and the config-source-declined log-row fixture F26).
function makeTempLog(rows) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pre-code-check-log-'));
  const lp = path.join(dir, 'log.jsonl');
  fs.writeFileSync(lp, (rows || []).map(r => JSON.stringify(r)).join('\n') + (rows && rows.length ? '\n' : ''));
  return lp;
}
function readLogRows(lp) {
  let raw; try { raw = fs.readFileSync(lp, 'utf8'); } catch (_) { return []; }
  return raw.split(/\r?\n/).filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
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
  // v1.7.1 (2026-09-23, reviewer finding E): config-source is TRIGGER-gated, not a static
  // REQUIRED_CHECKS entry, so it isn't covered by the "TAIL must carry every REQUIRED_CHECKS row or
  // F3 goes red" trip wire above. Adding it here gives the row ONE canonical evidence string, same
  // as every other check, instead of a fixture-local inline literal (F24 below now reuses it).
  configSource: 'config-source ✓(hsl_fi_pejabat.unit_pengiraan_id = JNS_PER_FI_METER on prod)',
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

// ---- v1.7 fixtures (C1-C5) ----

// F15 (C1): FULL line with nested-paren fallback-precedence evidence `((a) ... (b) ... (c) ...)` → allow
const EV_FALLBACK_NESTED = 'fallback-precedence \u2713((a) vo.setLuasDipohon(ahkm.getLuas()):5162 primary read first (b) guard on vo.getLuasDipohon()==null absence only (c) deliberate-clear resurfaces pra value on next load)';
const TAIL_NESTED = TAIL.replace(EV.fallbackPrecedence, EV_FALLBACK_NESTED);
const FULL_CHECK_LINE_NESTED = `CODE-CHECK: ${EV.analog}${TAIL_NESTED}`;
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(FULL_CHECK_LINE_NESTED + '\napplying fix') });
check('F15 nested-paren fallback-precedence evidence \u2192 allow (balanced-paren scanner)', !r.blocked, 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 200));

// F16: same nested-paren line — the OLD `[^)]+` semantics would have truncated to `(a` and blocked
// naming fallback-precedence; assert it is ABSENT from the (empty) combined output.
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(FULL_CHECK_LINE_NESTED + '\napplying fix') });
check('F16 nested-paren line does not block on fallback-precedence', !r.blocked && !/fallback-precedence/i.test(r.combined), 'combined=' + r.combined.slice(0, 200));

// F17-F19 (C2): same-file once-per-turn re-use of the last passed CODE-CHECK, via `turn` (skipping a
// tool_result-only user entry) when `latest` (since the last user entry of ANY kind) has none.
const F17_FILE = 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java';
const F17_LOG = makeTempLog([{ ts: new Date().toISOString(), action: 'passed', file: F17_FILE, line: FULL_CHECK_LINE.slice(0, 200) }]);

// F17: transcript = human msg -> assistant CODE-CHECK -> tool_result -> assistant "now the next hunk";
// log seeded with passed/foo.java; Edit foo.java (SAME file) -> allow.
r = runHookWith(
  { tool_input: { file_path: F17_FILE }, transcript_path: makeSplitTranscript(FULL_CHECK_LINE + '\napplying first hunk', 'now the next hunk') },
  { PRE_CODE_CHECK_LOG: F17_LOG },
);
check('F17 same-file reuse of turn-scoped CODE-CHECK \u2192 allow', !r.blocked, 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 200));

// F18: same transcript shape, Edit targets a DIFFERENT file (bar.java) -> BLOCK naming "different file"
r = runHookWith(
  { tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/bar.java' }, transcript_path: makeSplitTranscript(FULL_CHECK_LINE + '\napplying first hunk', 'now the next hunk') },
  { PRE_CODE_CHECK_LOG: F17_LOG },
);
check('F18 different-file since last pass \u2192 BLOCK mentioning "different file"', r.blocked && /different file/i.test(r.combined), 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 300));

// F19: bypass token present ONLY in the earlier (pre-tool_result) segment -> BLOCK (Rule 12: bypass in
// an older segment must not carry forward into `latest`).
r = runHookWith(
  { tool_input: { file_path: F17_FILE }, transcript_path: makeSplitTranscript('[skip-pre-code-check: rename-only]\napplying first hunk', 'now the next hunk, still no code-check') },
  { PRE_CODE_CHECK_LOG: F17_LOG },
);
check('F19 bypass only in earlier segment \u2192 BLOCK (does not carry forward)', r.blocked, 'blocked=' + r.blocked);

// F20-F26 (C3): config-source, trigger-gated on config/maintenance-page vocabulary in the turn text.
const CONFIG_TRIGGER_TEXT = 'Opening FiSetupManagerForm maintenance page to check the config before the fix.\n';
function withConfigSource(tail, token) {
  return tail.replace(' \u00b7 confidence 85%', ' \u00b7 config-source ' + token + ' \u00b7 confidence 85%');
}

// F20: trigger text present, FULL line WITHOUT config-source row -> BLOCK naming config-source
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(CONFIG_TRIGGER_TEXT + FULL_CHECK_LINE + '\napplying fix') });
check('F20 config-page trigger, no config-source row \u2192 BLOCK naming config-source', r.blocked && /config-source/i.test(r.combined), 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 250));

// F21: bare `config-source \u2713` (no parens) -> BLOCK
let LINE = `CODE-CHECK: ${EV.analog}${withConfigSource(TAIL, '\u2713')}`;
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(CONFIG_TRIGGER_TEXT + LINE + '\napplying fix') });
check('F21 bare config-source \u2713 \u2192 BLOCK', r.blocked && /config-source/i.test(r.combined), 'blocked=' + r.blocked);

// F22: `config-source \u2713(JNS_PER_FI_LOT on stg2)` — no <table.column> = — BLOCK
LINE = `CODE-CHECK: ${EV.analog}${withConfigSource(TAIL, '\u2713(JNS_PER_FI_LOT on stg2)')}`;
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(CONFIG_TRIGGER_TEXT + LINE + '\napplying fix') });
check('F22 config-source missing table.column \u2192 BLOCK', r.blocked && /config-source/i.test(r.combined), 'blocked=' + r.blocked);

// F23: `config-source \u2713(LOT = hsl_fi_pejabat)` — no `on <env>` — BLOCK
LINE = `CODE-CHECK: ${EV.analog}${withConfigSource(TAIL, '\u2713(LOT = hsl_fi_pejabat)')}`;
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(CONFIG_TRIGGER_TEXT + LINE + '\napplying fix') });
check('F23 config-source missing on-env \u2192 BLOCK', r.blocked && /config-source/i.test(r.combined), 'blocked=' + r.blocked);

// F24: proper cite -> allow (uses EV.configSource \u2014 finding E: one canonical evidence string)
LINE = `CODE-CHECK: ${EV.analog}${withConfigSource(TAIL, EV.configSource.replace(/^config-source\s+/, ''))}`;
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(CONFIG_TRIGGER_TEXT + LINE + '\napplying fix') });
check('F24 config-source proper <table.column>=<value> on <env> \u2192 allow', !r.blocked, 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 250));

// F25: no trigger text, FULL line WITHOUT the row -> allow (F3 spec preserved — row is trigger-gated)
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(FULL_CHECK_LINE + '\napplying fix') });
check('F25 no config trigger, no config-source row \u2192 allow (F3 spec preserved)', !r.blocked, 'blocked=' + r.blocked);

// F26: `\u2717(N/A \u2014 label-only xhtml change)` -> allow + log row config-source-declined
const F26_LOG = makeTempLog([]);
LINE = `CODE-CHECK: ${EV.analog}${withConfigSource(TAIL, '\u2717(N/A \u2014 label-only xhtml change)')}`;
r = runHookWith(
  { tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(CONFIG_TRIGGER_TEXT + LINE + '\napplying fix') },
  { PRE_CODE_CHECK_LOG: F26_LOG },
);
const f26Rows = readLogRows(F26_LOG);
check('F26 config-source \u2717(N/A \u2014 reason) \u2192 allow + logs config-source-declined', !r.blocked && f26Rows.some(x => x.action === 'config-source-declined'), 'blocked=' + r.blocked + ' rows=' + JSON.stringify(f26Rows.map(x => x.action)));

// F27-F30 (C4): lightEdit — Edit-only trivial-change classification skips the gate deterministically.
// F27: import-only Edit, no CODE-CHECK in transcript -> allow, logs light-pass import-only
const F27_LOG = makeTempLog([]);
r = runHookWith(
  { tool_name: 'Edit', tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java', old_string: 'import a.B;', new_string: 'import a.B;\nimport a.C;' }, transcript_path: makeTranscript('no check line needed') },
  { PRE_CODE_CHECK_LOG: F27_LOG },
);
const f27Rows = readLogRows(F27_LOG);
check('F27 import-only Edit \u2192 allow + logs light-pass import-only', !r.blocked && f27Rows.some(x => x.action === 'light-pass' && x.kind === 'import-only'), 'blocked=' + r.blocked + ' rows=' + JSON.stringify(f27Rows));

// F28 (v1.7.1 finding A, SERIOUS): a same-shape single-token diff (e.g. `return a` -> `return b`) is
// INDISTINGUISHABLE from a real logic change by a token-diff heuristic — it is NOT auto-light anymore.
// Must BLOCK (no CODE-CHECK line in transcript) — the old rename-only light path silently passed this.
r = runHookWith({ tool_name: 'Edit', tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java', old_string: 'return a;', new_string: 'return b;' }, transcript_path: makeTranscript('no check line needed') });
check('F28 rename-shaped Edit (return a -> return b) \u2192 BLOCK (rename-only light path removed)', r.blocked, 'blocked=' + r.blocked);

// F29: logic-bearing Edit (not import-only, not rename-only) -> still gated -> BLOCK
r = runHookWith({ tool_name: 'Edit', tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java', old_string: 'if (a) return 1;', new_string: 'if (a && b) return 2;' }, transcript_path: makeTranscript('no check line needed') });
check('F29 logic-bearing Edit \u2192 BLOCK (not light)', r.blocked, 'blocked=' + r.blocked);

// F30: Write tool with import-only-shaped content -> still gated (Write never qualifies for lightEdit)
r = runHookWith({ tool_name: 'Write', tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java', content: 'import a.B;\nimport a.C;' }, transcript_path: makeTranscript('no check line needed') });
check('F30 Write with import-only content \u2192 still gated \u2192 BLOCK', r.blocked, 'blocked=' + r.blocked);

// F31-F32 (C5): single-pass complete report.
// F31: missing 1 check name + confidence + a bare sibling -> ONE blockReason with 'Missing check
// names', 'Bare glyph', 'confidence' and '3 defect(s)' (defects = missing[analog, confidence] (2) +
// bareEvidence[sibling] (1) = 3).
const F31_TAIL = TAIL.replace(EV_SIBLING, 'sibling \u2713').replace(' \u00b7 confidence 85%', '');
const F31_LINE = `CODE-CHECK:${F31_TAIL}`;
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(F31_LINE + '\napplying fix') });
check(
  'F31 combined defects \u2192 ONE blockReason naming all of them + defect count',
  r.blocked && /Missing check names/i.test(r.combined) && /Bare glyph/i.test(r.combined) && /confidence/i.test(r.combined) && /3 defect/i.test(r.combined),
  'combined=' + r.combined.slice(0, 400),
);

// F32: missing-emit output (no CODE-CHECK line at all) carries the FULL evidence-shape guidance,
// including the kod-resolution row detail, and the same-file "SAME file" reuse note — everything the
// writer needs on the FIRST rejection, not only the next one.
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript('applying fix, no check line at all') });
check('F32 missing-emit block contains kod-resolution guidance + "SAME file"', r.blocked && /kod-resolution/i.test(r.combined) && /SAME file/i.test(r.combined), 'combined=' + r.combined.slice(0, 300));

// ---- v1.7.1 fixtures (reviewer findings A-D) ----

// F33 (B): blank-parens `\u2717()` must be treated as NO evidence (null) -- before the fix,
// evidenceAfter() returned '' (truthy, not null) for `()`, so a bare `\u2717()` silently passed the
// "\u2717 without justification" rule.
const CROSS_BARE_PARENS = `CODE-CHECK: analog \u2717()${TAIL}`;
r = runHookWith({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(CROSS_BARE_PARENS + '\napplying fix') });
check('F33 bare \u2717() (blank parens) \u2192 BLOCK (treated as no evidence)', r.blocked && /without justification/i.test(r.combined), 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 250));

// F34 (C): CODE-CHECK emitted, a Grep tool_result intervenes, then the FIRST Edit of file X this
// turn -- must ALLOW even though NO 'passed' log row exists yet for X anywhere (fresh/empty log).
// The same-file condition (F17 reuse / F18 deny) only governs REUSE once a passed row for THIS turn
// already exists for a DIFFERENT file; it must not deny a file's first use of the turn's CODE-CHECK.
const F34_FILE = 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/qux.java';
const F34_LOG = makeTempLog([]); // no prior passed rows anywhere
r = runHookWith(
  { tool_input: { file_path: F34_FILE }, transcript_path: makeSplitTranscript(FULL_CHECK_LINE + '\nrunning a grep to confirm the shape', 'grep confirmed, applying the first Edit of qux.java') },
  { PRE_CODE_CHECK_LOG: F34_LOG },
);
check('F34 CODE-CHECK \u2192 Grep tool_result \u2192 first Edit of file X \u2192 allow', !r.blocked, 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 250));

// F35 (D): an unrelated active quest's active.txt block mentions "maintenance page" but the CURRENT
// TURN text (assistant + last human msg) names no ticket at all -- config-source must NOT be
// demanded. Prior code scanned EVERY status=active block regardless of relevance, so an unrelated
// open quest mentioning "maintenance" would force config-source onto every etanah edit for as long
// as that quest stayed open.
const F35_ACTIVE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'pre-code-check-active-'));
const F35_ACTIVE_TXT = path.join(F35_ACTIVE_DIR, 'active.txt');
fs.writeFileSync(F35_ACTIVE_TXT, 'status = active\nqa = 999999\nnotes: unrelated ticket, has a maintenance page for a different feature entirely.\n');
r = runHookWith(
  { tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/foo.java' }, transcript_path: makeTranscript(FULL_CHECK_LINE + '\napplying an unrelated null-check fix') },
  { PRE_CODE_CHECK_ACTIVE_TXT: F35_ACTIVE_TXT },
);
check('F35 unrelated active quest mentions maintenance, turn names no ticket \u2192 no config-source demand', !r.blocked, 'blocked=' + r.blocked + ' ' + r.combined.slice(0, 250));

// F9: empty stdin → no crash, no block
r = spawnSync(process.execPath, [HOOK], { input: '', encoding: 'utf8', timeout: 30000, env: process.env });
check('F9 empty stdin exits 0', r.status === 0, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\npre-code-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
