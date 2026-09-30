#!/usr/bin/env node
/*
 * quest/notes.js — writes a test-data entry into the quest MD's "## Test data" section.
 *
 * v2 (2026-09-30, miya: "folders cleaner & leaner"): the per-ticket `1. NNN NNN.txt` in the
 * Task folder is RETIRED. Test data lives in projects/coding-projects/active/<QA>/<QA>.md
 * under "## Test data" (the one doc /quest resume already reads). Existing txt files were
 * migrated into their quest MD the same day. Do NOT hand-write entries.
 *
 * Format per entry, exactly 3 lines (unchanged):
 *   N) <env> - <urusan> - <tugasan> - <langkah>   (skipped fields omitted)
 *   <permohonan ID>
 *   <pengguna semasa / login>
 *
 * Usage:
 *   node quest/notes.js --qa <QA-NNNN | NNNN | ADHOC-...> --env <ENV> --id <permohonan> --user <login> \
 *        [--urusan X] [--tugasan X] [--langkah X] [--reset] [--folder "<Task folder>"]
 *   --folder is optional: only used to derive the ticket number when --qa is absent.
 *   --simple / --blank: 2-line entries `N) <urusan>` + `<id>` (multi-urusan sweeps).
 *   --reset clears the section and writes entry 1; default appends the next numbered entry.
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
const simple = hasFlag('simple');
const blank = hasFlag('blank');

if ((!folder && !qaOverride) || (!simple && (!env || !id || !user)) || (simple && !urusan) || (simple && !id && !blank)) {
  console.error('ERROR: --qa (or --folder) required; default mode needs --env --id --user; --simple needs --urusan and (--id or --blank).');
  process.exit(1);
}

function deriveTicketNumber(folderPath) {
  const m = path.basename(folderPath || '').match(/(?:QA|ES|II|DP|RQ|CR|FAT-OR|UAT-CR|FAT-CR|FAT|UAT|REQUIREMENT|REQ)\s*#?(\d+)/i);
  return m ? m[1] : null;
}
const adhocId = qaOverride && /^ADHOC-/i.test(qaOverride) ? qaOverride.toUpperCase() : null;
const digits = qaOverride && !adhocId ? (qaOverride.match(/\d+/) || [])[0] : deriveTicketNumber(folder);
const qaId = adhocId || (digits ? `QA-${digits}` : null);
if (!qaId) { console.error('ERROR: cannot derive ticket number; pass --qa <number>.'); process.exit(1); }

// Main checkout even from a worktree — quest MDs are untracked and live only there.
const ROOT = path.resolve(__dirname, '..').replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/i, '');
const proj = path.join(ROOT, 'projects', 'coding-projects');
let mdPath = path.join(proj, 'active', qaId, `${qaId}.md`);
const archived = path.join(proj, 'archive', qaId, `${qaId}.md`);
if (!fs.existsSync(mdPath) && fs.existsSync(archived)) mdPath = archived;
if (!fs.existsSync(mdPath)) {
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, `# ${qaId}\n`, 'utf8');
}

const HEAD = '## Test data';
let doc = fs.readFileSync(mdPath, 'utf8');
let start = doc.search(/^## Test data\s*$/m);
if (start < 0) { doc = doc.replace(/\s*$/, '') + `\n\n${HEAD}\n`; start = doc.search(/^## Test data\s*$/m); }
const bodyStart = doc.indexOf('\n', start) + 1;
const nextHead = doc.slice(bodyStart).search(/^## /m);
const bodyEnd = nextHead < 0 ? doc.length : bodyStart + nextHead;
let body = hasFlag('reset') ? '' : doc.slice(bodyStart, bodyEnd).trim();

const n = (body.match(/^\d+\)/gm) || []).length + 1;
const header = simple ? `${n}) ${urusan}` : `${n}) ` + [env, urusan, tugasan, langkah].filter((s) => s && s.trim()).join(' - ');
const entry = simple ? header + '\n' + (blank ? '' : id) : header + '\n' + id + '\n' + user;
body = (body ? body + '\n\n' : '') + entry;

doc = doc.slice(0, bodyStart) + '\n' + body + '\n\n' + doc.slice(bodyEnd).replace(/^\s+/, '');
fs.writeFileSync(mdPath, doc.replace(/\s*$/, '\n'), 'utf8');
console.log(`Wrote entry ${n} to:\n${mdPath}  (## Test data)\n---\n${entry}`);
