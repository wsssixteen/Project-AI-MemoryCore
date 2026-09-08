#!/usr/bin/env node
// Generate the canonical PROD infra-handoff block from a patch .sql file.
// The handoff is DML-ONLY (SELECTs stripped) + the trailing `-- N rows` annotation.
// Prevents the hand-composed drift that mangled #278580 (2026-09-07).
//
// Usage: node quest/infra-handoff.js <ticket> "<one-line urusan + outcome>" <path-to.sql>
// One-liner rule: urusan + OUTCOME only — NO permohonan id, values, table or column names.

const fs = require('fs');

const [, , ticket, oneLiner, sqlPath] = process.argv;
if (!ticket || !oneLiner || !sqlPath) {
  console.error('Usage: node quest/infra-handoff.js <ticket> "<one-line urusan + outcome>" <path-to.sql>');
  process.exit(1);
}

const raw = fs.readFileSync(sqlPath, 'utf8');

// Walk line by line; a statement closes on the line carrying ';'.
// Keep only INSERT/UPDATE/DELETE statements + the `-- ...` that trails their ';'.
const lines = raw.split(/\r?\n/);
let buf = [];
const out = [];
for (const line of lines) {
  const semi = line.indexOf(';');
  if (semi === -1) { buf.push(line); continue; }

  buf.push(line.slice(0, semi + 1));
  const stmt = buf.join('\n').trim();
  const firstWord = (stmt.replace(/^\s*(--[^\n]*\n)*/,'').match(/^\s*([A-Za-z]+)/) || [,''])[1].toUpperCase();
  const trailing = line.slice(semi + 1).trim(); // e.g. "-- 2 rows deleted"

  if (['INSERT', 'UPDATE', 'DELETE'].includes(firstWord)) {
    out.push(stmt);
    if (trailing.startsWith('--')) out.push(trailing);
  }
  buf = [];
}

if (out.length === 0) {
  console.error('No DML (INSERT/UPDATE/DELETE) statements found in ' + sqlPath);
  process.exit(2);
}

const t = ticket.replace(/^#/, '');
console.log('Hi infra, please assist. Thank you.');
console.log('');
console.log(`#${t}: ${oneLiner}`);
console.log('');
console.log(out.join('\n'));
