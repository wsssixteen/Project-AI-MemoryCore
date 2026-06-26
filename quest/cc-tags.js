/**
 * cc-tags.js — dump EVERY Word Content Control (SDT) tag in a .docx template.
 *
 * Usage:  node quest/cc-tags.js "<path-to.docx>" ["<path2.docx>" ...]
 *
 * Why this exists (built 2026-06-20, QA-261986 cycle-3): listing template CC tags
 * from memory / partial reads let a wrong inventory reach みや on the cycle-2
 * hand-back. This script reads the raw OOXML of EVERY part (document body + every
 * header/footer) so the tag list is mechanical, not eyeballed. The output banner
 * "═══ CC-TAG INVENTORY ═══" is the marker quest-phase-gate.js checks for before
 * allowing a .docx edit during an active quest — i.e. you cannot edit a template
 * until its full tag inventory has been dumped this session.
 *
 * Zero-dependency: minimal ZIP central-directory reader + zlib (built-in). No
 * python / no npm install needed, so it runs the same on every machine.
 */
const fs = require('fs');
const zlib = require('zlib');

function readZip(buf) {
  // locate End-Of-Central-Directory (sig 0x06054b50), scanning backwards
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip (no EOCD)');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16); // central-directory offset
  const out = {};
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const lhNameLen = buf.readUInt16LE(lho + 26);
    const lhExtraLen = buf.readUInt16LE(lho + 28);
    const dataStart = lho + 30 + lhNameLen + lhExtraLen;
    const comp = buf.subarray(dataStart, dataStart + compSize);
    try {
      out[name] = method === 0 ? comp : zlib.inflateRawSync(comp);
    } catch (e) { /* skip unreadable part */ }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function partOrder(name) {
  const base = name.split('/').pop();
  if (base === 'document.xml') return '0';
  if (base.startsWith('header')) return '1' + base;
  if (base.startsWith('footer')) return '2' + base;
  return '3' + base;
}

function dump(file) {
  const buf = fs.readFileSync(file);
  const parts = readZip(buf);
  const names = Object.keys(parts)
    .filter(n => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n))
    .sort((a, b) => partOrder(a).localeCompare(partOrder(b)));
  const rows = []; // {part, tag}
  for (const n of names) {
    const xml = parts[n].toString('utf8');
    // <w:tag w:val="..."/> appears ONLY inside <w:sdtPr> — safe to regex per part
    const re = /<w:tag\b[^>]*\bw:val="([^"]*)"/g;
    let m;
    while ((m = re.exec(xml)) !== null) rows.push({ part: n.split('/').pop(), tag: m[1] });
  }
  const tags = rows.map(r => r.tag);
  const uniq = [...new Set(tags)].sort();
  console.log('FILE: ' + file.split(/[\\/]/).pop());
  console.log('  SDT placements: ' + rows.length + '  |  unique tags: ' + uniq.length);
  // per-part placement list (proof of every part scanned)
  const byPart = {};
  for (const r of rows) (byPart[r.part] = byPart[r.part] || []).push(r.tag);
  for (const part of Object.keys(byPart)) {
    console.log('  [' + part + '] ' + byPart[part].join(' · '));
  }
  console.log('  UNIQUE: ' + uniq.join(' · '));
  console.log('');
}

const files = process.argv.slice(2);
console.log('═══ CC-TAG INVENTORY ═══');
if (!files.length) {
  console.log('usage: node quest/cc-tags.js "<docx>" ["<docx2>" ...]');
  process.exit(0);
}
for (const f of files) {
  try { dump(f); }
  catch (e) { console.log('FILE: ' + f + '  → ERROR: ' + e.message + '\n'); }
}
