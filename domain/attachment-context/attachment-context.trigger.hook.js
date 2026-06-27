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
    const m = prompt.match(/\b(?:QA|FAT-OR|UAT-CR|FAT|UAT|REQUIREMENT|REQ|CR|Redmine|ticket|issue)\s*#?\s*(\d{4,})\b/i);
    if (!m) process.exit(0);
    const qa = m[1];
    const tf = taskFolderFor(qa);
    if (!tf) process.exit(0);
    const brief = path.join(tf, '0. Brief');
    let files = [];
    try { files = fs.readdirSync(brief).filter(f => !f.startsWith('.')); } catch (_) { process.exit(0); }
    if (!files.length) process.exit(0);
    log({ action: 'fired', qa, n: files.length });
    const lines = [
      '📎 ATTACHMENT-CONTEXT GATE — ticket #' + qa + ' has ' + files.length + ' file(s) in 0. Brief/.',
      'Before engaging / proposing anything, OPEN + emit a 1-line content summary for EACH:',
      ...files.map(f => '   ⬜ ' + f),
      'Filename-based prioritization is BANNED — a .docx/.pdf may carry per-urusan/per-screen detail',
      '(2026-06-24: a skipped prototype .docx → a "TBD" lie). Read ALL, then proceed.',
    ];
    process.stdout.write(JSON.stringify({ additionalContext: lines.join('\n') }));
    process.exit(0);
  } catch (e) { process.exit(0); }
});
