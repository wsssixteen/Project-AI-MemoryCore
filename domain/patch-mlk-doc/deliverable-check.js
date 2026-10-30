#!/usr/bin/env node
/**
 * deliverable-check — lint a DMS document-patch Task folder before the hand-back.
 * Usage: node domain/patch-mlk-doc/deliverable-check.js "<Task folder>" <ticket> <lokasi_fail basename>[,<basename 2>,...]
 * PASS only when 2. Fix\ holds <ticket>.sql (file format) + the renamed .main(s), and no banned file.
 * More than 1 .main: <ticket>.zip must hold every one (miya 2026-10-30, 287292) and the script holds one UPDATE per file.
 * Exit 0 PASS · 1 FAIL. Log: domain/patch-mlk-doc/log.jsonl (ts, ticket, outcome, fails).
 */
const fs = require('fs');
const path = require('path');

function check(taskFolder, ticket, mainArg) {
  const fails = [];
  const mainNames = String(mainArg || '').split(',').map(s => s.trim()).filter(Boolean);
  const fix = path.join(taskFolder, '2. Fix');
  if (!fs.existsSync(fix)) return [`no "2. Fix" folder in ${taskFolder}`];
  const files = fs.readdirSync(fix);

  // banned shapes
  for (const f of files) {
    if (/^PATCH-REQUEST/i.test(f)) fails.push(`banned file: ${f} (handoff text lives in chat, script is ${ticket}.sql)`);
    else if (/\.sql$/i.test(f) && f !== `${ticket}.sql` && f !== `${ticket}-check.sql`) fails.push(`bad script name: ${f} (only ${ticket}.sql / ${ticket}-check.sql)`);
    else if (/\.txt$/i.test(f) && /(update|select|insert|delete)\s/i.test(fs.readFileSync(path.join(fix, f), 'utf8'))) fails.push(`script saved as .txt: ${f}`);
  }

  // the script
  const sqlPath = path.join(fix, `${ticket}.sql`);
  if (!fs.existsSync(sqlPath)) fails.push(`missing ${ticket}.sql`);
  else {
    const s = fs.readFileSync(sqlPath, 'utf8');
    for (const h of ['-- Ticket:', '-- Env:', '-- Permohonan:', '-- Fix:']) if (!s.includes(h)) fails.push(`${ticket}.sql header missing "${h}"`);
    const code = s.split(/\r?\n/).filter(l => !/^\s*--/.test(l)).join('\n');
    if (/\bjoin\b/i.test(code)) fails.push(`${ticket}.sql contains JOIN`);
    const updates = (code.match(/^\s*update\s/gim) || []).length;
    const wantUpdates = Math.max(1, mainNames.length);
    if (updates !== wantUpdates) fails.push(`${ticket}.sql must hold exactly ${wantUpdates} UPDATE (one per file; found ${updates})`);
    if (!/^\s*select\s/im.test(code)) fails.push(`${ticket}.sql missing the before SELECT`);
    if (!/;\s*\r?\n-- 1 row updated\s*$/i.test(s)) fails.push(`${ticket}.sql must end with the UPDATE then "-- 1 row updated"`);
    if (/\bfrom\s+(?!et_dms\.|et_main\.)\w+/i.test(code) || /\bupdate\s+(?!et_dms\.|et_main\.)/i.test(code)) fails.push(`${ticket}.sql has an unqualified table (PROD needs et_dms./et_main.)`);
  }

  // the attachment(s)
  if (!mainNames.length) fails.push(`lokasi_fail basename "${mainArg}" is not LAIN-<n>_<v>.main`);
  for (const mainName of mainNames) {
    if (!/^LAIN-\d+_\d+\.main$/.test(mainName)) { fails.push(`lokasi_fail basename "${mainName}" is not LAIN-<n>_<v>.main`); continue; }
    const m = path.join(fix, mainName);
    if (!fs.existsSync(m)) fails.push(`missing attachment ${mainName}`);
    else {
      const head = Buffer.alloc(2); const fd = fs.openSync(m, 'r'); fs.readSync(fd, head, 0, 2, 0); fs.closeSync(fd);
      if (head.toString('latin1') !== 'PK') fails.push(`${mainName} is not a docx (zip) file`);
    }
  }

  // more than 1 file to infra = one zip holding every file
  if (mainNames.length > 1) {
    const z = path.join(fix, `${ticket}.zip`);
    if (!fs.existsSync(z)) fails.push(`missing ${ticket}.zip (more than 1 file goes to infra: zip them all)`);
    else {
      const buf = fs.readFileSync(z);
      if (buf.slice(0, 2).toString('latin1') !== 'PK') fails.push(`${ticket}.zip is not a zip file`);
      for (const n of mainNames) if (!buf.includes(Buffer.from(n, 'latin1'))) fails.push(`${ticket}.zip does not hold ${n}`);
    }
  }
  return fails;
}

if (require.main === module) {
  const [taskFolder, ticket, mainName] = process.argv.slice(2);
  if (!taskFolder || !ticket) { console.error('usage: deliverable-check.js "<Task folder>" <ticket> <LAIN-n_v.main>[,<LAIN-n_v.main>...]'); process.exit(1); }
  const fails = check(taskFolder, ticket, mainName);
  try { fs.appendFileSync(path.join(__dirname, 'log.jsonl'), JSON.stringify({ ts: new Date().toISOString(), ticket, outcome: fails.length ? 'FAIL' : 'PASS', fails }) + '\n'); } catch (e) {}
  if (fails.length) { fails.forEach(f => console.error('FAIL: ' + f)); process.exit(1); }
  console.log(`PASS: ${ticket}.sql + ${mainName} ready, no banned files.`);
}
module.exports = { check };
