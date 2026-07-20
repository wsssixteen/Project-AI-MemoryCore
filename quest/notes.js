#!/usr/bin/env node
/*
 * quest/notes.js — generates `1. NNN NNN.txt` entries in the locked format.
 * (Renamed 2026-05-31 from `1. Notes.txt` per みや; adjusted same day from `1. QA-NNNN.txt`
 *  → drop tracker prefix, put a space before the last 3 digits so the last-3 are visible
 *  at a glance across many open tabs/greps.)
 * Exists because hand-writing the file drifted repeatedly. Do NOT hand-write it.
 *
 * Filename: derived from the Task folder slug `<num>. QA #NNNN - ...` → `1. NNN NNN.txt`.
 * If --qa is passed (with or without tracker prefix), it overrides the auto-derivation.
 *
 * Format per entry, exactly 3 lines:
 *   N) <env> - <urusan> - <tugasan> - <langkah>   (skipped fields omitted; " - " joins present ones)
 *   <permohonan ID>
 *   <pengguna semasa / login>
 * Entries numbered 1), 2), ... ; blank line between entries. Nothing else in the file.
 *
 * Usage:
 *   node quest/notes.js --folder "<Task folder path>" --env <UAT|FAT> --id <permohonan> --user <login> \
 *        [--qa QA-NNNN] [--urusan <X|All Urusan>] [--tugasan <X>] [--langkah <X>] [--reset]
 *   --reset clears the file and writes entry 1; default appends the next numbered entry.
 */
'use strict';
const fs = require('fs');
const path = require('path');

function arg(name) {
  const i = process.argv.indexOf('--' + name);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : '';
}
const hasFlag = (name) => process.argv.includes('--' + name);

const folder = arg('folder');
const env = arg('env');
const urusan = arg('urusan');
const tugasan = arg('tugasan');
const langkah = arg('langkah');
const id = arg('id');
const user = arg('user');
const qaOverride = arg('qa');

// --simple (per みや 2026-07-20): 2-line entries `N) <urusan>` + `<id>` only.
// For multi-urusan test sweeps where env is uniform and login is not yet known —
// the env/login lines are noise when 20 urusan sit in one list.
// --blank: header with an EMPTY id line (urusan has no permohonan in this env).
const simple = hasFlag('simple');
const blank = hasFlag('blank');

if (!folder || (!simple && (!env || !id || !user)) || (simple && !urusan) || (simple && !id && !blank)) {
  console.error('ERROR: --folder required; default mode needs --env --id --user; --simple needs --urusan and (--id or --blank).');
  process.exit(1);
}

// Derive the ticket number from folder slug `<num>. QA #NNNN - ...` (or --qa override).
function deriveTicketNumber(folderPath) {
  const base = path.basename(folderPath);
  const m = base.match(/(?:QA|FAT-OR|UAT-CR|FAT-CR|FAT|UAT|REQUIREMENT|REQ|CR)\s*#?(\d+)/i);
  return m ? m[1] : null;
}
// --qa accepts "QA-262762", "QA #262762", or bare "262762" — strip to digits.
const overrideDigits = qaOverride ? (qaOverride.match(/\d+/) || [])[0] : null;
const ticketNum = overrideDigits || deriveTicketNumber(folder);
if (!ticketNum) {
  console.error('ERROR: cannot derive ticket number from folder name; pass --qa <number>.');
  process.exit(1);
}
// Spaced form: insert a space before the last 3 digits (e.g. 262762 → "262 762").
const spaced = ticketNum.replace(/(\d+)(\d{3})$/, '$1 $2');

// Filename: per-ticket self-identifying. Back-compat: prefer any pre-existing legacy file
// in the folder so we don't fork a second file mid-quest.
let notesPath = path.join(folder, `1. ${spaced}.txt`);
const legacyNotes = path.join(folder, '1. Notes.txt');
const legacyQaTag = path.join(folder, `1. QA-${ticketNum}.txt`);
if (!fs.existsSync(notesPath)) {
  if (fs.existsSync(legacyQaTag)) notesPath = legacyQaTag;
  else if (fs.existsSync(legacyNotes)) notesPath = legacyNotes;
}
let existing = '';
if (!hasFlag('reset') && fs.existsSync(notesPath)) {
  existing = fs.readFileSync(notesPath, 'utf8').trim();
}

const n = (existing ? (existing.match(/^\d+\)/gm) || []).length : 0) + 1;
const header = simple
  ? n + ') ' + urusan
  : n + ') ' + [env, urusan, tugasan, langkah].filter((s) => s && s.trim()).join(' - ');
const entry = simple
  ? header + '\n' + (blank ? '' : id)
  : header + '\n' + id + '\n' + user;
const out = (existing ? existing + '\n\n' + entry : entry) + '\n';

fs.writeFileSync(notesPath, out, 'utf8');
console.log('Wrote entry ' + n + ' to:\n' + notesPath + '\n---\n' + entry);
