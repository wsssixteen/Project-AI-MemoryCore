/**
 * routine-wrap.js — deterministic SAVE + guard for the daily ticket-retrieval routine.
 *
 * WHY (みや 2026-09-22): the retrieval routine runs UNATTENDED and must leave durable,
 * cross-worktree state so a fresh session (new worktree) can pick a ticket cold.
 *   - quest/active.txt is GITIGNORED (.gitignore:84) — local-only, "rots by design",
 *     never in a worktree. It is NOT the cross-worktree persistence path.
 *   - Durable truth = Redmine (live, re-derived at boot by open-quest-surfacer) + the
 *     TRACKED per-ticket qa_docs under projects/coding-projects/active/<id>/*.md
 *     + the tracked main/current-session.md recap.
 * So this script VERIFIES every NEW ticket has a committed qa_doc, runs the cold-resume
 * check, verifies the session recap was refreshed, then commits + pushes the tracked
 * artifacts. The new worktree then rebuilds the board from Redmine and reads the qa_docs.
 *
 * Full Domain Expansion is deliberately NOT run here — an unattended routine has no
 * session arc / relationship / diary / improvement-sweep to write; running DE would
 * fabricate that content. This is the surgical subset only.
 *
 * Usage:
 *   node quest/routine-wrap.js --new 273919,274046 [--changed 271918] [--dry-run]
 *
 * Exit: 1 if any --new ticket has no qa_doc (the routine must write it first); else 0.
 * Report-only checks (resume-readiness, recap freshness) never fail the run.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const ACTIVE_DIR = path.join(REPO_ROOT, 'projects', 'coding-projects', 'active');
const CURRENT_SESSION = path.join(REPO_ROOT, 'main', 'current-session.md');

function parseIds(v) {
  return (v || '').split(',').map(s => s.trim().replace(/^QA-?/i, '')).filter(Boolean);
}

/**
 * Pure guard — for each id, is there a TRACKED qa_doc?
 * A qa_doc = a .md file inside projects/coding-projects/active/ whose directory name
 * contains the id (e.g. QA-273919/ or 273919/). Returns { found, missing }.
 * Injectable activeDir keeps this unit-testable (eval passes a fixture dir).
 */
function checkNewTickets(ids, activeDir = ACTIVE_DIR) {
  const found = [], missing = [];
  let entries = [];
  try { entries = fs.readdirSync(activeDir, { withFileTypes: true }); } catch { /* dir absent */ }
  for (const id of ids) {
    const dir = entries.find(e => e.isDirectory() && e.name.includes(id));
    let ok = false;
    if (dir) {
      try {
        ok = fs.readdirSync(path.join(activeDir, dir.name)).some(f => f.toLowerCase().endsWith('.md'));
      } catch { ok = false; }
    }
    (ok ? found : missing).push(id);
  }
  return { found, missing };
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function recapFreshToday() {
  try { return fs.readFileSync(CURRENT_SESSION, 'utf-8').includes(todayIso()); } catch { return false; }
}

function runResumeReadiness() {
  try {
    return execFileSync('node', [path.join(REPO_ROOT, 'domain', 'checklist-reactivate', 'resume-readiness.js')],
      { cwd: REPO_ROOT, encoding: 'utf-8' });
  } catch (e) { return `⚠️  resume-readiness not run: ${e.message}`; }
}

function gitSaveTracked(nNew, nChanged, dryRun) {
  const msg = `routine: ${todayIso()} retrieval save — ${nNew} new, ${nChanged} changed\n\nCo-Authored-By: Ruri <ruri@memorycore.local>`;
  const paths = ['projects/coding-projects/active', 'main/current-session.md'];
  if (dryRun) return `[dry-run] would: git add ${paths.join(' ')} && commit && push origin HEAD`;
  try {
    execFileSync('git', ['add', ...paths], { cwd: REPO_ROOT });
    // Nothing staged → nothing to do (routine ran but wrote no tracked change).
    const staged = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: REPO_ROOT, encoding: 'utf-8' }).trim();
    if (!staged) return 'nothing to commit (no tracked changes)';
    execFileSync('git', ['commit', '-m', msg], { cwd: REPO_ROOT });
    execFileSync('git', ['push', 'origin', 'HEAD'], { cwd: REPO_ROOT });
    return `committed + pushed:\n${staged}`;
  } catch (e) { return `⚠️  git save failed: ${e.message}`; }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const newIds = parseIds(args[args.indexOf('--new') + 1]);
  const changedIds = parseIds(args[args.indexOf('--changed') + 1]);

  console.log(`── routine-wrap ${todayIso()} — ${newIds.length} new, ${changedIds.length} changed ──`);

  // GUARD — every new ticket must already have a committed qa_doc.
  const { found, missing } = checkNewTickets(newIds);
  if (found.length) console.log(`✓ qa_doc present: ${found.join(', ') || '—'}`);
  if (missing.length) {
    console.log(`🔴 NO qa_doc for: ${missing.join(', ')}`);
    console.log(`   → write projects/coding-projects/active/<id>/<id>.md (Phase 0 findings) before saving.`);
    process.exitCode = 1;
    return;
  }

  // REPORT-ONLY — cold-resume self-containment of open quests.
  console.log('\n' + runResumeReadiness().trim());

  // REPORT-ONLY — recap must reflect this run so the next boot Briefing surfaces it.
  console.log(recapFreshToday()
    ? '\n✓ current-session.md recap refreshed today'
    : `\n⚠️  current-session.md has no ${todayIso()} recap — update it so the next boot surfaces this run`);

  // SAVE — tracked artifacts only (active.txt is gitignored by design, skipped automatically).
  console.log('\n' + gitSaveTracked(newIds.length, changedIds.length, dryRun));
}

module.exports = { checkNewTickets, parseIds };

if (require.main === module) main();
