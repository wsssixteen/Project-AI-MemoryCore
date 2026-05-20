/**
 * notes-on-test-data.js — Stop hook
 *
 * Scans Ruri's reply for permohonan IDs (PTMLK/.../ pattern). For each
 * detected ID, check if it's already in the active QA's Notes.txt. If
 * not, emit reminder to call quest/notes.js.
 *
 * v1: warn-only. v1.1: block stop until notes.js called.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const activePath = path.join(projectRoot, 'quest', 'active.txt');
const logPath = path.join(projectRoot, 'Feature', 'Forge-Self-Improvement-System', 'notes-update-log.jsonl');

function getActiveQATaskFolder() {
  try {
    const text = fs.readFileSync(activePath, 'utf8');
    const blockMatch = text.match(/^qa=QA-\d+[\s\S]*?(?=^qa=QA-|\Z)/m);
    if (!blockMatch) return null;
    const block = blockMatch[0];
    const tf = (block.match(/^task_folder=(.+)$/m) || [])[1];
    const qa = (block.match(/^qa=(QA-\d+)/) || [])[1];
    return tf && qa ? { qa, taskFolder: tf.trim() } : null;
  } catch (e) { return null; }
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const text = JSON.stringify(data);

    const ids = [...text.matchAll(/PTMLK\/[0-9]+\/[A-Z]\/[A-Z]+\/[0-9]+\/[0-9]+/g)].map(m => m[0]);
    const unique = [...new Set(ids)];
    if (unique.length === 0) process.exit(0);

    const active = getActiveQATaskFolder();
    if (!active) process.exit(0);

    const notesPath = path.join(active.taskFolder, '1. Notes.txt');
    let notesContent = '';
    try { notesContent = fs.readFileSync(notesPath, 'utf8'); } catch (_) {}

    const missing = unique.filter(id => !notesContent.includes(id));
    if (missing.length === 0) process.exit(0);

    const entry = {
      ts: new Date().toISOString(),
      qa: active.qa,
      ids_in_reply: unique,
      missing_from_notes: missing,
      action: 'warn-only-v1',
    };
    try { fs.appendFileSync(logPath, JSON.stringify(entry) + '\n'); } catch (_) {}

    process.stderr.write(`\n⚠️  notes-on-test-data: emitted ${missing.length} permohonan ID(s) not in ${active.qa}'s Notes.txt: ${missing.join(', ')}\n   Call: node quest/notes.js --folder "<task-folder>" --env <ENV> --urusan <URUSAN> --tugasan <TUGASAN> --id <ID> --user <LOGIN>\n`);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
