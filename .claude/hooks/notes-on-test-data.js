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

    // Every registered state's prefix (PTMLK · PTPK · …) — system/states.json via lib/states.js (2026-09-04).
    const PERMOHONAN_RE = require(path.join(__dirname, '..', '..', 'lib', 'states.js')).permohonanRegex();
    const ids = [...text.matchAll(PERMOHONAN_RE)].map(m => m[0]);

    // v1.2 (2026-07-20): No Resit Carian Rasmi is test data too. AWAM urusan that start at
    // CarianRasmiHakmilikForm (PSBS/PLTP/MCL/PPTPB/PRBB, CRHM*) REQUIRE one, and BA never
    // supplies it — it must be derived from the DB and recorded like a permohonan ID.
    // Format: YYMMDD + office-code + running (e.g. 260707BSAT00337).
    // Rule + query + working receipt: etanah-knowledge/<state>/TEST-PERMOHONAN-INDEX.md
    //   § No Resit Carian Rasmi (7 validations).
    ids.push(...[...text.matchAll(/\b\d{6}[A-Z]{2,6}\d{4,6}\b/g)].map(m => m[0]));
    const unique = [...new Set(ids)];
    if (unique.length === 0) process.exit(0);

    const active = getActiveQATaskFolder();
    if (!active) process.exit(0);

    // v2 (2026-09-30): test data lives in the quest MD's "## Test data" section (notes.js v2).
    // Legacy txt files (`1. NNN NNN.txt` / `1. Notes.txt`) still count if one survives.
    const root = projectRoot.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/i, '');
    let notesContent = '';
    for (const sub of ['active', 'archive']) {
      try { notesContent += fs.readFileSync(path.join(root, 'projects', 'coding-projects', sub, active.qa, `${active.qa}.md`), 'utf8'); } catch (_) {}
    }
    try {
      for (const f of fs.readdirSync(active.taskFolder)) if (/^1\. .*\.txt$/i.test(f)) notesContent += fs.readFileSync(path.join(active.taskFolder, f), 'utf8');
    } catch (_) {}

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

    process.stderr.write(`\n⚠️  notes-on-test-data: emitted ${missing.length} permohonan ID(s) not in ${active.qa}.md "## Test data": ${missing.join(', ')}\n   Call: node quest/notes.js --qa ${active.qa} --env <ENV> --urusan <URUSAN> --tugasan <TUGASAN> --id <ID> --user <LOGIN>\n`);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
