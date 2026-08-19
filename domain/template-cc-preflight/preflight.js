#!/usr/bin/env node
// preflight.js — template CC-tag preflight (domain/template-cc-preflight, 2026-08-19).
// Lists every content-control tag in a .docx template, maps each to its populator method
// in PelupusanWordCCMethodConstant.java, and flags UNMAPPED tags (they can never fill).
// The DATA half (does the test permohonan actually hold each tag's source data?) is the
// operator's DB step — this script produces the checklist for it.
//
// USAGE:
//   node domain/template-cc-preflight/preflight.js --template "<path to .docx>" \
//        [--constant "<path to PelupusanWordCCMethodConstant.java>"]
//
// Output: tag table (tag · occurrences · populator|UNMAPPED) + summary line to paste as
//   CC-PREFLIGHT: <n> tags · <m> unmapped · data-gaps: <...>
// Log: domain/template-cc-preflight/log.jsonl (one row per run).
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function arg(name) {
  const i = process.argv.indexOf('--' + name);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : '';
}

const templatePath = arg('template');
const constantPath = arg('constant') ||
  'E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\java\\my\\gov\\etanah\\pelupusan\\constant\\PelupusanWordCCMethodConstant.java';
if (!templatePath) { console.error('ERROR: --template <path to .docx> required'); process.exit(2); }
if (!fs.existsSync(templatePath)) { console.error('ERROR: template not found: ' + templatePath); process.exit(2); }

// --- minimal zip reader: extract one entry from a .docx (no dependencies) ---
function readZipEntry(file, entryName) {
  const buf = fs.readFileSync(file);
  // find End Of Central Directory (signature 0x06054b50), scan backwards
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 65535; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error('EOCD not found — not a zip?');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error('central dir corrupt @' + off);
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    if (name === entryName) {
      const lhNameLen = buf.readUInt16LE(lho + 26);
      const lhExtraLen = buf.readUInt16LE(lho + 28);
      const dataStart = lho + 30 + lhNameLen + lhExtraLen;
      const raw = buf.subarray(dataStart, dataStart + compSize);
      return method === 0 ? raw.toString('utf8') : zlib.inflateRawSync(raw).toString('utf8');
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(entryName + ' not found in ' + file);
}

// --- 1. tags from the template (document.xml; headers/footers optional later) ---
const docXml = readZipEntry(templatePath, 'word/document.xml');
const tagOccurrences = [...docXml.matchAll(/<w:tag w:val="([^"]+)"/g)].map(m => m[1]);
const counts = {};
for (const t of tagOccurrences) counts[t] = (counts[t] || 0) + 1;
const distinct = Object.keys(counts);

// --- 2. tag -> populator map from the constant file ---
let constToTag = {}, tagToMethod = {};
if (fs.existsSync(constantPath)) {
  const java = fs.readFileSync(constantPath, 'utf8');
  for (const m of java.matchAll(/static final String (TAG_\w+)\s*=\s*"([^"]+)"/g)) constToTag[m[1]] = m[2];
  for (const m of java.matchAll(/wordContentControlMethod\.put\((TAG_\w+),\s*(?:\w+::)?(\w+)\)/g)) {
    const tag = constToTag[m[1]];
    if (tag) tagToMethod[tag] = m[2];
  }
  for (const m of java.matchAll(/wordContentControlMethod\.put\("([^"]+)",\s*(?:\w+::)?(\w+)\)/g)) {
    tagToMethod[m[1]] = m[2];
  }
} else {
  console.error('WARN: constant file not found (' + constantPath + ') — populator column will be n/a');
}

// --- 3. report ---
const unmapped = [];
console.log('CC PREFLIGHT — ' + path.basename(templatePath));
console.log('tag · occurrences · populator');
for (const t of distinct) {
  const method = tagToMethod[t];
  if (!method) unmapped.push(t);
  console.log('  ' + t + ' · ' + counts[t] + ' · ' + (method || '🚨 UNMAPPED (no populator — will never fill)'));
}
console.log('');
console.log('distinct tags: ' + distinct.length + ' · occurrences: ' + tagOccurrences.length + ' · unmapped: ' + unmapped.length + (unmapped.length ? ' (' + unmapped.join(', ') + ')' : ''));
console.log('');
console.log('NEXT (operator): for each mapped tag, verify the TEST PERMOHONAN holds the data its');
console.log('populator reads (DB check), then emit:');
console.log('CC-PREFLIGHT: ' + distinct.length + ' tags · ' + unmapped.length + ' unmapped · data-gaps: <tag=missing-source,... | none>');

// --- 4. log (system-rules Rule 5) ---
try {
  fs.appendFileSync(path.join(__dirname, 'log.jsonl'), JSON.stringify({
    ts: new Date().toISOString(), template: path.basename(templatePath),
    distinct: distinct.length, occurrences: tagOccurrences.length,
    unmapped, outcome: 'ok',
  }) + '\n');
} catch (_) {}
