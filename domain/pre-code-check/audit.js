#!/usr/bin/env node
// audit.js — the CODE-CHECK checker (miya 2026-08-16: "CREATE A CHECKING SYSTEM FOR CODE-CHECK
// ITSELF... next time I do not have to repeat myself. It should be a KNOWN thing to audit CODE-CHECK.")
//
// Verifies the 5 invariants the wf_097d9bae grand audit (13 agents, 10 angles, 183-commit census)
// established. Parses the LIVE hook source — so any future edit to the hook is re-audited
// automatically. Runs standalone (node domain/pre-code-check/audit.js) AND inside the eval
// battery via eval-self-audit.js. Exit 0 = coherent · exit 1 = defect named.
'use strict';
const fs = require('fs');
const path = require('path');
const HOOK = process.env.CODE_CHECK_HOOK || path.join(__dirname, 'pre-code-check.check.hook.js'); // env override = eval mutation-testing only
const LOG = path.join(__dirname, 'log.jsonl');
const src = fs.readFileSync(HOOK, 'utf8');

// ---- extract live config from the hook source ----
function extractArray(name) {
  const m = src.match(new RegExp('const ' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\];'));
  if (!m) return null;
  return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
}
const REQUIRED = extractArray('REQUIRED_CHECKS');
const EVIDENCE = extractArray('EVIDENCE_CHECKS');
const typeDropM = src.match(/const TYPE_DROP\s*=\s*\{([\s\S]*?)\n\};/);
const TYPE_DROP_KEYS = typeDropM ? [...typeDropM[1].matchAll(/'([a-z-]+)':\s*\[/g)].map(x => x[1]) : [];
const extM = src.match(/\\\.\(([a-z|0-9]+)\)\$\/i/);
const EXTENSIONS = extM ? extM[1].split('|') : [];

// ---- INVARIANT 1: PURPOSE — every required row traces to a slip/ticket/census type ----
// (grand-audit angle: dead-rows / purpose-constriction. A row with no provenance is ceremony.)
const PURPOSE = {
  'analog': 'working-analog-first — 22-strike slip category; #259112 wrong-shape analog',
  'in-file': 'in-file convention first — CLAUDE.md §8 hard rule (parallel-new-code ban)',
  'sibling': 'per-file sibling-diff rule — QA-258004 missing mbb/listener',
  'existing-reuse': 'inventory-first (system-rules R1) — duplicate resolver builds',
  'name-by-purpose': 'CLAUDE.md §8 naming rule — onChangeKategoriTujuanMigrasi case',
  'minimal-diff': 'CLAUDE.md §8 minimal-diff — QA-261986 declaration-split churn',
  'logic-matrix': 'logic-blast-radius skill — scenario matrix for stateful flows (audit E15 batch)',
  'blast-radius': 'QA-2726xx call-site sweeps — one-site fix of multi-site symbol',
  'predicate': 'predicate-before-fix memory — Debug Ritual 1',
  'falsifier': 'Rubric falsifier row — quest-protocol debug rituals',
  'read+write-path': 'QA-258004 VO-binding vs save-source mismatch',
  'BA-expected': 'QA-272943 prediction-wearing-a-tick (shrunken pelan)',
  'full-address': 'full-address-trace-gate family — wrong-file fixes',
  'sibling-diff': 'per-file sibling-diff emit — QA-258004 coupling points',
  'necessity': 'QA-272943 scope creep — analog-copied extras shrank the pelan',
  'all-writers': 'QA-272867 pemohon-2 still-crashing (1-of-4 writers guarded)',
  'kod-resolution': 'kod/urusan literal errors — reference-table verification',
  'prior-fix': 'QA-273201 f33f8632d8 same-bug-already-solved',
  'class-chain': 'QA-273201 assumed-extends dead-code patch',
  'peranan-map': '#273201 rework-2 PPTT vs PPTNT (30290 vs 18503)',
  'flowable-contract': 'QA-273201 render-half-only tugasan fix',
  'fallback-precedence': '#273455 deliberate-clear case never considered',
};

// ---- INVARIANT 2: THEATRE — judgment-bearing rows must demand evidence ----
// (grand-audit angle: evidence-honesty. A bare ✓ passable on a judgment row = theatre.)
// Rows below are formatting/emit-shape rows where a bare glyph is genuinely checkable-by-eye:
const GLYPH_OK = ['in-file', 'name-by-purpose', 'minimal-diff', 'logic-matrix', 'predicate', 'BA-expected', 'full-address'];
// (BA-expected has its own stronger OBSERVATION_TOKEN_RX guard in the hook — verified in inv-2 below.)

// ---- INVARIANT 3: TYPE-FIT — every census change-type has a row policy ----
// Census types (wf_097d9bae): mixed 69 · docx-template 31 · java-service 25 · java-form 24 ·
// java-constant-populator 7 · xhtml-jsf 7 · config-json 0 · sql-patch (git-invisible) · bpmn 0.
const CENSUS_TYPE_TO_POLICY = {
  'docx-template': 'docx-template', 'config-json': 'config-json',
  'java-constant-populator': 'constant-populator',
  'java-service': 'code', 'java-form': 'code', 'xhtml-jsf': 'code', 'mixed': 'code',
  // sql-patch: DELIBERATE carve-out → patch-script-gate family (inv-4 verifies the note exists)
  // bpmn: 0 occurrences in 4.5-month census; BPMN edits are not a local fix lane today
};

// ---- run ----
const red = [];
const rows = [];
function inv(name, ok, detail) { rows.push({ name, ok, detail }); if (!ok) red.push(name + ': ' + detail); }

inv('inv-0 source-parse', !!(REQUIRED && EVIDENCE && TYPE_DROP_KEYS.length && EXTENSIONS.length),
  'REQUIRED=' + (REQUIRED || []).length + ' EVIDENCE=' + (EVIDENCE || []).length + ' typePolicies=' + TYPE_DROP_KEYS.length + ' ext=' + EXTENSIONS.join(','));

const noPurpose = (REQUIRED || []).filter(r => !PURPOSE[r]);
inv('inv-1 purpose (no orphan rows)', noPurpose.length === 0, noPurpose.length ? 'rows with NO provenance: ' + noPurpose.join(', ') + ' — add the slip/ticket to PURPOSE or retire the row' : 'all ' + (REQUIRED || []).length + ' rows trace to a slip/ticket');

const theatre = (REQUIRED || []).filter(r => !EVIDENCE.includes(r) && !GLYPH_OK.includes(r));
const baGuarded = /OBSERVATION_TOKEN_RX/.test(src) && /BA-expected/.test(src);
inv('inv-2 theatre (judgment rows demand evidence)', theatre.length === 0 && baGuarded, theatre.length ? 'bare-✓-passable judgment rows: ' + theatre.join(', ') : 'evidence-gated=' + EVIDENCE.length + ' glyph-ok=' + GLYPH_OK.length + ' BA-observation-guard=' + baGuarded);

const unmappedTypes = Object.values(CENSUS_TYPE_TO_POLICY).filter(p => !TYPE_DROP_KEYS.includes(p));
inv('inv-3 type-fit (every census type has a policy)', unmappedTypes.length === 0, unmappedTypes.length ? 'census types mapped to MISSING policies: ' + [...new Set(unmappedTypes)].join(', ') : Object.keys(CENSUS_TYPE_TO_POLICY).length + ' census types → ' + TYPE_DROP_KEYS.length + ' policies');

const sqlNote = /\.sql is DELIBERATELY absent/.test(src) && /patch-script-gate/.test(src);
const expectedExt = ['java', 'xhtml', 'docx', 'json'];
inv('inv-4 trigger (extension coverage documented)', sqlNote && expectedExt.every(e => EXTENSIONS.includes(e)), 'ext=' + EXTENSIONS.join('|') + ' sql-carve-out-note=' + sqlNote);

let fires = 0, lastFire = '(none)';
try {
  const lines = fs.readFileSync(LOG, 'utf8').trim().split('\n');
  const cutoff = Date.now() - 45 * 86400000;
  for (const l of lines) { try { const o = JSON.parse(l); if (new Date(o.ts).getTime() > cutoff) { fires++; lastFire = o.ts; } } catch (_) {} }
} catch (_) {}
inv('inv-5 liveness (hook actually fires)', fires > 0, fires + ' log rows in 45d, last ' + lastFire);

// ---- report ----
console.log('CODE-CHECK SELF-AUDIT — ' + new Date().toISOString().slice(0, 10));
for (const r of rows) console.log((r.ok ? '  ✅ ' : '  🔴 ') + r.name + ' — ' + r.detail);
console.log(red.length ? '\n🔴 ' + red.length + ' invariant(s) broken — CODE-CHECK is incoherent until fixed.' : '\n✅ CODE-CHECK coherent (5/5 invariants).');
process.exit(red.length ? 1 : 0);
