/**
 * notes-on-test-data.js — Stop hook
 *
 * Scans Ruri's reply for permohonan IDs (PTMLK/.../ pattern). For every
 * detected ID, checks whether it already appears in the notes file of ANY
 * OPEN quest (status ∈ active/hold/blocked). An ID counts as "covered" if it
 * appears in at least one open quest's notes file. If ≥1 emitted ID is missing
 * from EVERY open quest's notes file → BLOCK the stop so the model appends the
 * canonical 3-line entry before finishing.
 *
 * v1 (warn-only): appended a log + wrote stderr, then exit(0) — the warning
 *   never actually stopped the turn, so it failed in production (QA-260508:
 *   Ruri emitted new permohonan IDs across multiple turns, notes never updated,
 *   みや had to point it out). The old getActiveQATaskFolder() also only read
 *   the FIRST qa= block (typically a CLOSED quest), so coverage was checked
 *   against the wrong notes file.
 *
 * v1.1 (2026-06-11 per みや): ENFORCING.
 *   - Parse ALL qa= blocks; filter to status ∈ {active, hold, blocked}.
 *   - An ID is "covered" if present in ANY open quest's notes file.
 *   - If ≥1 emitted ID is uncovered → exit(2) with instructive stderr (Claude
 *     Code feeds Stop-hook stderr back to the model + blocks the stop on exit 2).
 *   - Anti-loop guard: if data.stop_hook_active is true, exit(0) (never block
 *     twice in a row) — mirrors quest-knowledge-save-gate.js:75 house style.
 *   - Fail-open on any exception (exit 0). Notes filename: new `1. <QA-NNNN>.txt`
 *     first, legacy `1. Notes.txt` fallback. jsonl action: 'blocked-v1.1' | 'pass'.
 *   - Test override: NOTES_HOOK_ROOT env var repoints projectRoot so self-tests
 *     never touch the real quest/active.txt.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = process.env.NOTES_HOOK_ROOT || path.join(__dirname, '..', '..');
const activePath = path.join(projectRoot, 'quest', 'active.txt');
const logPath = path.join(projectRoot, 'Feature', 'Forge-Self-Improvement-System', 'notes-update-log.jsonl');

const OPEN_STATUSES = new Set(['active', 'hold', 'blocked']);

// All OPEN quests (status ∈ active/hold/blocked) with a task_folder.
// Mirrors the block-split idiom in quest-knowledge-save-gate.js:54.
function getOpenQuests() {
  try {
    const text = fs.readFileSync(activePath, 'utf8');
    const blocks = text.split(/(?=^qa=QA-\d+)/m).filter(b => /^qa=QA-\d+/.test(b));
    const quests = [];
    for (const block of blocks) {
      const status = (block.match(/^status=(\S+)/m) || [])[1];
      if (!status || !OPEN_STATUSES.has(status.toLowerCase())) continue;
      const qa = (block.match(/^qa=(QA-\d+)/) || [])[1];
      const tf = (block.match(/^task_folder=(.+)$/m) || [])[1];
      if (qa && tf) quests.push({ qa, taskFolder: tf.trim(), status: status.toLowerCase() });
    }
    return quests;
  } catch (e) {
    return [];
  }
}

// Resolve a quest's notes file: new name `1. <QA-NNNN>.txt` first, legacy
// `1. Notes.txt` fallback. Returns { path, content } (content '' if unreadable).
function resolveNotes(quest) {
  const qaMatch = (quest.qa || '').match(/(QA|FAT-OR|UAT-CR|FAT-CR|FAT|UAT|CR)-?(\d+)/i);
  const qaTag = qaMatch ? `${qaMatch[1].toUpperCase()}-${qaMatch[2]}` : null;
  let notesPath = qaTag
    ? path.join(quest.taskFolder, `1. ${qaTag}.txt`)
    : path.join(quest.taskFolder, '1. Notes.txt');
  const legacyPath = path.join(quest.taskFolder, '1. Notes.txt');
  if (qaTag && !fs.existsSync(notesPath) && fs.existsSync(legacyPath)) {
    notesPath = legacyPath;
  }
  let content = '';
  try { content = fs.readFileSync(notesPath, 'utf8'); } catch (_) {}
  return { path: notesPath, content };
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    // Anti-loop guard: Claude Code sets stop_hook_active when the stop was
    // already blocked once — never block twice in a row.
    if (data.stop_hook_active) process.exit(0);

    const text = JSON.stringify(data);
    const ids = [...text.matchAll(/PTMLK\/[0-9]+\/[A-Z]\/[A-Z]+\/[0-9]+\/[0-9]+/g)].map(m => m[0]);
    const unique = [...new Set(ids)];
    if (unique.length === 0) process.exit(0);

    const openQuests = getOpenQuests();
    if (openQuests.length === 0) process.exit(0);

    // Build the union of every open quest's notes content + remember each path.
    const checked = openQuests.map(q => {
      const n = resolveNotes(q);
      return { qa: q.qa, status: q.status, notesPath: n.path, content: n.content };
    });

    // An ID is covered if it appears in ANY open quest's notes file.
    const missing = unique.filter(id => !checked.some(c => c.content.includes(id)));

    if (missing.length === 0) {
      try {
        fs.appendFileSync(logPath, JSON.stringify({
          ts: new Date().toISOString(),
          ids_in_reply: unique,
          missing_from_notes: [],
          open_quests: checked.map(c => c.qa),
          action: 'pass',
        }) + '\n');
      } catch (_) {}
      process.exit(0);
    }

    try {
      fs.appendFileSync(logPath, JSON.stringify({
        ts: new Date().toISOString(),
        ids_in_reply: unique,
        missing_from_notes: missing,
        open_quests: checked.map(c => c.qa),
        notes_checked: checked.map(c => c.notesPath),
        action: 'blocked-v1.1',
      }) + '\n');
    } catch (_) {}

    const questLines = checked
      .map(c => `     - ${c.qa} (${c.status}) → ${c.notesPath}`)
      .join('\n');

    process.stderr.write(
`\n🚨 notes-on-test-data v1.1 — BLOCKED: you emitted permohonan ID(s) not recorded in any OPEN quest's notes file.

   Missing (in NO open quest's notes file):
     ${missing.join('\n     ')}

   Open quests + notes files checked:
${questLines}

   Before stopping, append a canonical 3-line entry for each missing ID to the
   RIGHT quest's notes file (new name "1. <QA-NNNN>.txt", legacy "1. Notes.txt"):
       N) <URUSAN> — <TUGASAN>
       <PERMOHONAN_ID>
       <login>
   Use: node quest/notes.js --folder "<task-folder>" --env <ENV> --urusan <URUSAN> --tugasan <TUGASAN> --id <ID> --user <LOGIN>
   (login TBD if DB-blocked — never defer the whole entry.)\n`);
    process.exit(2);
  } catch (e) {
    process.exit(0);
  }
});
