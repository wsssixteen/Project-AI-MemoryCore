#!/usr/bin/env node
/**
 * eval for patch-mlk-doc skill.
 * The skill's value is that it carries the PROVEN locator query + data model + runbook
 * so a patch ticket is a one-shot lookup, never a from-scratch schema explore.
 * This eval asserts the SKILL.md still holds every load-bearing anchor. If an edit drops
 * one (e.g. someone "simplifies" the query), the skill silently degrades back into an explore.
 */
const fs = require('fs');
const path = require('path');

const SKILL = path.join(__dirname, '..', '..', '.claude', 'skills', 'patch-mlk-doc', 'SKILL.md');

const MUST_CONTAIN = [
  // the two tables + link spine
  ['et_dms.dokumen_revision', 'revision table'],
  ['et_dms.dokumen', 'dokumen table'],
  ['umm_a_dok_keluaran', 'keluaran registry (entry point)'],
  ['skg_dok', 'skg_dok bridge'],
  ['sd.medan_pk_id = adk.a_dok_keluaran_id', 'skg_dok→keluaran join key'],
  ['d.id_dokumen = sd.id_dok', 'dokumen→skg_dok join key'],
  ['dr.dokumen_id = d.dokumen_id', 'revision→dokumen join key'],
  ["ua.id_pengenalan = '<PERMOHONAN>'", 'parametrized permohonan filter'],
  // the two deliverables
  ['lokasi_fail', 'step-1 file path deliverable'],
  ['SET LOKASI_FAIL_PDF=NULL', 'step-2 pdf-null UPDATE'],
  // ordering safety
  ['null AFTER the replace', 'order guard (null after replace)'],
  ["flag_aktif='Y'", 'latest-active selection rule'],
  // the exception the skill knowingly carries
  ['EXCEPTION', 'documents JOIN + schema-qualified exception for infra audience'],
  // proven reference so a future edit can be checked against real values
  ['41110560', 'verified reference revision id'],
  ['LAIN-36816725', 'verified reference document id'],
];

let fail = 0;
if (!fs.existsSync(SKILL)) {
  console.error('FAIL: SKILL.md not found at ' + SKILL);
  process.exit(1);
}
const body = fs.readFileSync(SKILL, 'utf8');
for (const [needle, label] of MUST_CONTAIN) {
  if (!body.includes(needle)) { console.error(`FAIL: missing ${label} ("${needle}")`); fail++; }
}
// frontmatter trigger sanity
if (!/description:.*patch/i.test(body)) { console.error('FAIL: description lost the patch trigger'); fail++; }

if (fail) { console.error(`\n${fail} assertion(s) failed — skill has degraded.`); process.exit(1); }
console.log(`PASS: patch-mlk-doc skill intact (${MUST_CONTAIN.length} anchors present).`);
