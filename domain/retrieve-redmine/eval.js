#!/usr/bin/env node
/**
 * eval.js — /retrieve-redmine skill fixture eval
 *
 * The skill orchestrates batch intake: live queue -> sync -> familiar fleet ->
 * controller verify -> ranking. The failure modes it exists to kill are all
 * ordering/omission bugs (folder-not-retrieval, fleet-before-plan, verdict
 * trusted without controller verify, Apply inside the sweep). This eval pins
 * those load-bearing rules into the SKILL.md text.
 *
 * Fixture: the 2026-08-03 live 11-ticket run (the shape this skill codifies).
 *
 * Run: node domain/retrieve-redmine/eval.js
 */

const fs = require('fs');
const path = require('path');

const SKILL = path.resolve(__dirname, '..', '..', '.claude', 'skills', 'retrieve-redmine', 'SKILL.md');

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}

console.log('eval: /retrieve-redmine skill\n');

if (!fs.existsSync(SKILL)) {
  console.log(`  FAIL  SKILL.md exists at ${SKILL}`);
  process.exit(1);
}
const src = fs.readFileSync(SKILL, 'utf8');

// --- 1. live-queue-first, never stale local state -------------------------
check('step 1 queries the LIVE Redmine API', /issues\.json\?assigned_to_id=me&status_id=open/.test(src));
check('active.txt is explicitly NOT the queue source', /never active\.txt/i.test(src));

// --- 2. sync-first rule (2026-07-16 #270297 wrong-ticket lesson) ----------
check('sync runs redmine-sync.js', /node quest\/redmine-sync\.js/.test(src));
check('folder-on-disk-is-not-retrieval lesson pinned', /folder on disk is not retrieval/i.test(src));

// --- 3. delegation plan BEFORE fan-out ------------------------------------
check('delegation plan is mandatory before fan-out', /DELEGATION PLAN \(mandatory emit before fan-out\)/i.test(src));

// --- 4. familiar safety template ------------------------------------------
check('familiars banned from code edits', /NO code edits/i.test(src));
check('familiars banned from sub-agents/workflows', /NO sub-agents\/workflows/i.test(src));
check('prior knowledge passed as leads, not conclusions', /LEAD TO VERIFY/.test(src));
check('deliverable path targets the MAIN repo (worktree gitignore trap)', /MAIN repo path/i.test(src));
check('forced return line schema present', /root-cause-1-liner \| top candidate/.test(src));

// --- 5. controller verify + resume-not-rerun ------------------------------
check('controller verify treats outputs as DATA not truth', /DATA, not truth/i.test(src));
check('missing deliverable re-runs ONE familiar only', /re-run that ONE familiar, never the fleet/i.test(src));

// --- 6. W2 blind audit ----------------------------------------------------
check('wave 2 audit is blind to our qa_docs', /banned from reading our qa_docs/i.test(src));

// --- 7. hand-back shape ---------------------------------------------------
check('ranking is ownership-first', /ownership first/i.test(src));
check('testable-together pairing emitted', /Testable together/i.test(src));
check('Apply is banned inside the skill', /Apply NEVER happens in this skill/i.test(src));
check('reworks are not re-quested', /Reworks are NOT re-quested/i.test(src));

// --- 8. 2026-08-03 refinements (miya) --------------------------------------
check('familiars pinned to Opus low effort', /Opus 5 with low effort/i.test(src));
check('Fable banned for familiars (controller-only)', /NEVER Fable/i.test(src));
check('adhoc/pre-ticket sweep step exists', /ADHOC-REGISTER\.md.*PENDING-TICKET-\*/s.test(src));
check('pre-existing qa_doc check + append-not-overwrite', /APPEND-not-overwrite/i.test(src));
check('90% confidence goal with name-the-blocking-item rule', /≥90% confidence per ticket/.test(src) && /NAME the single blocking item/i.test(src));
check('convergence-is-not-confirmation pinned', /Convergence is not confirmation/i.test(src));

console.log(`\n${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
