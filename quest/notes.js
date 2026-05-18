#!/usr/bin/env node
/*
 * quest/notes.js — generates "1. Notes.txt" entries in the locked format.
 * Exists because hand-writing the file drifted repeatedly. Do NOT hand-write Notes.txt.
 *
 * Format per entry, exactly 3 lines:
 *   N) <env> - <urusan> - <tugasan> - <langkah>   (skipped fields omitted; " - " joins present ones)
 *   <permohonan ID>
 *   <pengguna semasa / login>
 * Entries numbered 1), 2), ... ; blank line between entries. Nothing else in the file.
 *
 * Usage:
 *   node quest/notes.js --folder "<Task folder path>" --env <UAT|FAT> --id <permohonan> --user <login> \
 *        [--urusan <X|All Urusan>] [--tugasan <X>] [--langkah <X>] [--reset]
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

if (!folder || !env || !id || !user) {
  console.error('ERROR: --folder, --env, --id and --user are required.');
  process.exit(1);
}

const notesPath = path.join(folder, '1. Notes.txt');
let existing = '';
if (!hasFlag('reset') && fs.existsSync(notesPath)) {
  existing = fs.readFileSync(notesPath, 'utf8').trim();
}

const n = (existing ? (existing.match(/^\d+\)/gm) || []).length : 0) + 1;
const header = n + ') ' + [env, urusan, tugasan, langkah].filter((s) => s && s.trim()).join(' - ');
const entry = header + '\n' + id + '\n' + user;
const out = (existing ? existing + '\n\n' + entry : entry) + '\n';

fs.writeFileSync(notesPath, out, 'utf8');
console.log('Wrote entry ' + n + ' to:\n' + notesPath + '\n---\n' + entry);
