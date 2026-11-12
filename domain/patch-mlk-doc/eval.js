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
  ['replace document for MLK <ENV>', 'replace box is env-generic (ADHOC-PRBB-2026-24)'],
  ['**The staging test depends on how the document is made**', 'staging test by file origin (ADHOC-PRBB-2026-24)'],
  ['`Upload test: no infra, no DB patch, no script`', 'test scenario first line names the upload test'],
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
for (const bad of ['the same PROD `lokasi_fail`', 'Infra replace test']) {
  if (body.includes(bad)) { console.error(`FAIL: wrong MLK STAG rule returned ("${bad}")`); fail++; }
}
// frontmatter trigger sanity
if (!/description:.*patch/i.test(body)) { console.error('FAIL: description lost the patch trigger'); fail++; }

// quest 6c is the entry to this skill (ADHOC-MCL-2026-7, 2026-11-05): an adhoc patch ask enters 6c,
// related tickets are read, and the stored-document check routes a data patch to this skill.
const QUEST = path.join(__dirname, '..', '..', '.claude', 'skills', 'quest', 'SKILL.md');
const QUEST_MUST = [
  ['An adhoc whose ask is a patch takes this path too', 'A: adhoc patch ask enters 6c'],
  ['## Fastest Path` and `## Post-mortem`', 'C: related ticket route read'],
  ['quest/active-archive.txt` by urusan and by the document', 'C: archive grep by urusan + document'],
  ['FROM umm_a_dok_keluaran WHERE aplikasi_id', 'B: stored-document SELECT'],
  ['`document replace + data patch` and `patch-mlk-doc` loads', 'B: stored document routes here'],
  ['Stored documents: <n>', 'B: visible Stored documents line'],
];
const quest = fs.existsSync(QUEST) ? fs.readFileSync(QUEST, 'utf8') : '';
if (!quest) { console.error('FAIL: quest SKILL.md not found at ' + QUEST); fail++; }
const sixC = quest.slice(quest.indexOf('6c. '), quest.indexOf('6d. '));
for (const [needle, label] of QUEST_MUST) {
  if (!sixC.includes(needle)) { console.error(`FAIL: quest 6c missing ${label} ("${needle}")`); fail++; }
}

if (fail) { console.error(`\n${fail} assertion(s) failed — skill has degraded.`); process.exit(1); }
console.log(`PASS: patch-mlk-doc skill intact (${MUST_CONTAIN.length} anchors present) + quest 6c entry (${QUEST_MUST.length} anchors).`);
