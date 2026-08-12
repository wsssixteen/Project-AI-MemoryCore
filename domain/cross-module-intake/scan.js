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
// People word "is this common / pass it over" many ways (EN + Malay). Keep expanding as new phrasings appear.
const CROSS_MODULE = [
  ['our-issue-or-Common',    /\b(our issue or common|is this (our|a|an?) common|issue (is )?from common|common issue|from (the )?common team|isu common|masalah common)\b/i],
  ['pass/forward to team',   /\b(pass (this )?ti?c|pass (to|kepada|ke)|boleh pass|can pass this|forward (to|kepada|ke)|hantar (ke|kepada)|refer (to|kepada)|rujuk (kepada|ke)|assign (to|kepada) (common|another))\b/i],
  ['not our domain/scope',   /\b(not our (domain|module|scope|issue|problem|side)|bukan (isu|masalah|scope|skop)? ?(kita|kami)|luar (skop|scope)|out of (our )?scope|di luar)\b/i],
  ['whose/which module',     /\b(which module|whose (issue|module|ticket)|modul (mana|siapa)|siapa punya|is this (yours|ours|from us)|check (dulu )?(sama ada|whether|if this is)|semak (dulu )?(sama ada|jika|kalau))\b/i],
  ['cross-module / shared',  /\b(cross[- ]?module|merentas modul|shared (module|screen|code|component)|dikongsi|common (module|code|screen|component))\b/i],
  ['team handoff name',      /\b(common team|reports? team|teknikal team|avalon team|team (lain|common|reports?))\b/i],
  ['utiliti (often common)', /\butiliti\b/i],
  ['bare "common" mention',  /\bcommon\b/i],
];
const PRIORITY = [
  ['PROD/live',   /\b(PROD(UCTION)?|live env|di prod|dalam prod|on prod)\b/i],
  ['urgent',      /\b(urgent|segera|ASAP|secepat|kritikal|critical|emergency|kecemasan|penting)\b/i],
  ['priority',    /\b(priorit(y|i)|keutamaan|high[- ]?priority|P[12]\b|severity|sev ?[12])\b/i],
  ['deadline',    /\b(deadline|due (today|tomorrow|by)|hari ini|by end of|EOD)\b/i],
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
