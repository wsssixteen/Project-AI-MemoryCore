#!/usr/bin/env node
/*
 * cross-module-intake scan — QA-274318 defender.
 * Reads a ticket's Description + History at intake and flags CROSS-MODULE
 * (etanah-common / other-team) + PRIORITY signals BEFORE any investigation.
 * Usage:
 *   node scan.js --folder "<Task folder>"     (reads 0. Brief/Description.txt + History.txt)
 *   node scan.js --text "<raw text>"
 * Exit code: 2 if any cross-module signal, 0 otherwise. Prints the alert block.
 */
const fs = require('fs');
const path = require('path');

// Each signal: a label + a regex. Match => quote the line it hit.
const CROSS_MODULE = [
  ['BA asks our-vs-Common',   /\b(our issue or common|issue (is )?from common|common issue|is this .*common)\b/i],
  ['BA says pass to team',    /\b(pass (this )?tic|pass to \w+|boleh pass|can pass this)\b/i],
  ['not our domain',          /\b(not our (domain|module|scope)|bukan .*(kita|kami))\b/i],
  ['utiliti screen (often common)', /\butiliti\b/i],
  ['module keyword: common',  /\bcommon\b/i],
];
const PRIORITY = [
  ['PROD',   /\bPROD(UCTION)?\b/],
  ['urgent', /\b(urgent|segera|ASAP|secepat)\b/i],
  ['priority', /\bpriorit(y|i)\b/i],
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function loadText() {
  const text = arg('--text');
  if (text) return text;
  const folder = arg('--folder');
  if (!folder) { console.error('need --folder or --text'); process.exit(1); }
  const brief = path.join(folder, '0. Brief');
  let out = '';
  for (const f of ['Description.txt', 'History.txt']) {
    const p = path.join(brief, f);
    if (fs.existsSync(p)) out += `\n===== ${f} =====\n` + fs.readFileSync(p, 'utf8');
  }
  if (!out) { console.error('no Description.txt/History.txt under 0. Brief/'); process.exit(1); }
  return out;
}

function hits(text, table) {
  const lines = text.split(/\r?\n/);
  const found = [];
  for (const [label, re] of table) {
    for (const ln of lines) {
      if (re.test(ln)) { found.push({ label, line: ln.trim().slice(0, 140) }); break; }
    }
  }
  return found;
}

const text = loadText();
const cm = hits(text, CROSS_MODULE);
const pr = hits(text, PRIORITY);

console.log('═══ INTAKE SCAN ═══');
if (cm.length) {
  console.log('🚨 CROSS-MODULE? — confirm the screen\'s repo (locate the .xhtml) BEFORE deep-tracing any module:');
  for (const h of cm) console.log(`   • [${h.label}] "${h.line}"`);
} else {
  console.log('module: no cross-module signal (clean)');
}
if (pr.length) {
  console.log('⏫ PRIORITY:');
  for (const h of pr) console.log(`   • [${h.label}] "${h.line}"`);
} else {
  console.log('priority: normal (clean)');
}
process.exit(cm.length ? 2 : 0);
