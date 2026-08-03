#!/usr/bin/env node
/**
 * eval.js — pre-code-check fixtures (5), v1.2 (2026-08-03, QA-272943 pelan-shrink root cause)
 *
 * Runs the hook via spawnSync against temp transcripts (house pattern: convention-check-gate/eval.js).
 * Exit 0 only if 5/5 PASS. Block = exit 2 + reason text; pass-through = exit 0.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.resolve(__dirname, 'pre-code-check.check.hook.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pcc-eval-'));

const JAVA_FILE = 'E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\java\\my\\gov\\etanah\\pelupusan\\util\\PelupusanUtil.java';

function transcript(name, text) {
  const p = path.join(TMP, name);
  fs.writeFileSync(p, JSON.stringify({ role: 'assistant', content: [{ type: 'text', text }] }) + '\n', 'utf8');
  return p;
}

function run(tp) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ tool_input: { file_path: JAVA_FILE }, transcript_path: tp }),
    encoding: 'utf8', timeout: 15000,
  });
  return { status: r.status, all: (r.stdout || '') + (r.stderr || '') };
}

const GOOD_PREFIX = 'CODE-CHECK: analog ✓(convertPdfToImages():1496-1513 in-file) · in-file ✓ · sibling ✓ · existing-reuse ✓(reuses writeJpeg():1550) · name-by-purpose ✓ · minimal-diff ✓ · logic-matrix ✓ · blast-radius ✓(grep callers PelupusanUtil.java:886/:888) · predicate ✓ · falsifier ✓(regenerated doc size band check) · read+write-path ✓(no persist, bytes embed only) · full-address ✓ · sibling-diff ✓ · all-writers ✓(grep setAlamatBerdaftar -> 4 sites each init-safe)';

const results = [];
function fixture(name, text, expectBlock, mustMention) {
  const r = run(transcript(name + '.jsonl', text));
  const blocked = r.status === 2;
  let pass = blocked === expectBlock;
  if (pass && mustMention) pass = mustMention.every(s => r.all.includes(s));
  results.push({ name, pass, status: r.status });
}

fixture('1-missing-emit', 'no code-check line here at all', true, ['no CODE-CHECK emit line']);
// The exact QA-272943 shipping line: no necessity + prediction-✓ on BA-expected
fixture('2-272943-shipping-line', GOOD_PREFIX + ' · BA-expected ✓(appearance unchanged) · confidence 92%', true, ['necessity', 'prediction wearing a tick']);
// Honest line: necessity present + BA-expected unverified-✗
fixture('3-honest-line', GOOD_PREFIX + ' · BA-expected ✗(unverified — visual outcome needs miya build) · necessity ✓(150-DPI + JPEG map to the size defect; canvas stripped) · confidence 92%', false);
// v1.1 regression: all-bare judgment checks still block
fixture('4-v11-all-bare', 'CODE-CHECK: analog ✓ · in-file ✓ · sibling ✓ · existing-reuse ✓ · name-by-purpose ✓ · minimal-diff ✓ · logic-matrix ✓ · blast-radius ✓ · predicate ✓ · falsifier ✓ · read+write-path ✓ · BA-expected ✓ · full-address ✓ · sibling-diff ✓ · necessity ✓ · all-writers ✓ · confidence 85%', true, ['judgment-bearing']);
// v1.3: the first pemohon-2 guard line — one-site guard with NO all-writers enumeration must block
fixture('6-272867-one-site-guard', GOOD_PREFIX.replace(" · all-writers ✓(grep setAlamatBerdaftar -> 4 sites each init-safe)", "") + ' · BA-expected ✗(unverified — needs build) · necessity ✓(one null guard maps to the crash defect) · confidence 85%', true, ['all-writers']);
// Bypass token still works
fixture('5-bypass', '[skip-pre-code-check: rename-only]', false);

let allPass = true;
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name} (exit=${r.status})`);
  if (!r.pass) allPass = false;
}
process.exit(allPass ? 0 : 1);
