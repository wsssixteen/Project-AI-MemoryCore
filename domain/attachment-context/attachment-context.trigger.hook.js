/**
 * attachment-context.trigger.hook.js — UserPromptSubmit hook
 * Power: domain/attachment-context/
 *
 * PURPOSE (みや 2026-06-24): when a ticket is engaged, list EVERY file in its
 *   `0. Brief/` folder and require reading + a 1-line content emit for each BEFORE
 *   engaging. Root cause it closes: I skipped the MPT prototype `.docx`, missed the
 *   per-urusan langkah it specified, and then wrote "TBD" — a false claim.
 *
 * TRIGGER: prompt mentions a ticket number AND that ticket's active.txt block has a
 *   task_folder whose `0. Brief/` dir is non-empty.
 * INJECTS: a per-file ⬜ checklist + the BAN on filename-based prioritization.
 * FAIL-OPEN: any error → exit 0 (never trap the session).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');
const projectRoot = path.resolve(__dirname, '..', '..');
const activePath = path.join(projectRoot, 'quest', 'active.txt');

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

function taskFolderFor(qaNum) {
  try {
    const t = fs.readFileSync(activePath, 'utf8');
    // split into per-quest blocks (each starts with "qa="); JS has no \Z, so don't regex-to-EOF.
    const block = t.split(/\n(?=qa=)/).find(b => b.split(/\r?\n/)[0].trim() === 'qa=QA-' + qaNum);
    if (!block) return null;
    const line = block.split(/\r?\n/).find(l => l.startsWith('task_folder='));
    return line ? line.slice('task_folder='.length).trim() : null;
  } catch (_) { return null; }
}

let input = '';
process.stdin.resume(); process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const { prompt = '' } = JSON.parse(input);
    // A file he gives from Downloads or Desktop during a quest moves to its home (2026-11-02 per miya, 287773).
    const given = [...new Set([...prompt.matchAll(/[A-Za-z]:\\Users\\[^\\"\n]+\\(?:Downloads|Desktop)\\[^"\n]+?\.[A-Za-z0-9]{1,8}(?=["\s]|$)/g)].map(x => x[0]))];
    const placeNote = !given.length ? [] : [
      '📦 FILE GIVEN: if this belongs to a quest, move it to its home in this same turn, once its role is clear:',
      ...given.map(f => '   node quest/place-file.js "' + f + '" --qa <num> [--as fix|brief|original]'),
      'fix = what he changed · brief = what the BA or user sent · original = a reference or latest copy of a flow model. Read it first if you still need it; give the new full path in the reply.',
    ];
    const finish = lines => {
      const all = placeNote.concat(lines);
      if (all.length) { if (placeNote.length) log({ action: 'file-given', n: given.length }); process.stdout.write(JSON.stringify({ additionalContext: all.join('\n') })); }
      process.exit(0);
    };
    const m = prompt.match(/\b(?:QA|FAT-OR|UAT-CR|FAT|UAT|REQUIREMENT|REQ|CR|Redmine|ticket|issue)\s*#?\s*(\d{4,})\b/i);
    if (!m) finish([]);
    const qa = m[1];
    const tf = taskFolderFor(qa);
    if (!tf) finish([]);
    const brief = require('../../lib/task-folder').briefDir(tf); // 1. Brief, legacy 0. Brief
    let files = [];
    try { files = fs.readdirSync(brief).filter(f => !f.startsWith('.')); } catch (_) { finish([]); }
    if (!files.length) finish([]);
    log({ action: 'fired', qa, n: files.length });
    const lines = [
      '📎 ATTACHMENT-CONTEXT GATE — ticket #' + qa + ' has ' + files.length + ' file(s) in 0. Brief/.',
      'Before engaging / proposing anything, OPEN + emit a 1-line content summary for EACH:',
      ...files.map(f => '   ⬜ ' + f),
      'Filename-based prioritization is BANNED — a .docx/.pdf may carry per-urusan/per-screen detail',
      '(2026-06-24: a skipped prototype .docx → a "TBD" lie). Read ALL, then proceed.',
    ];
    finish(lines);
  } catch (e) { process.exit(0); }
});
