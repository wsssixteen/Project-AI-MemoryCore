#!/usr/bin/env node
/**
 * eval.js — /deploy skill fixture eval
 *
 * The /deploy skill is a REFERENCE CARD generator: its whole value is that the
 * argument->target resolution is correct and the two pipelines never blend.
 * A wrong row here sends miya to the wrong host or builds the wrong branch,
 * so the resolution table is what this eval pins.
 *
 * Run: node domain/deploy/eval.js
 */

const fs = require('fs');
const path = require('path');

const SKILL = path.resolve(__dirname, '..', '..', '.claude', 'skills', 'deploy', 'SKILL.md');

let pass = 0;
let fail = 0;

function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('eval: /deploy skill\n');

if (!fs.existsSync(SKILL)) {
  console.log(`  FAIL  SKILL.md exists at ${SKILL}`);
  process.exit(1);
}
const src = fs.readFileSync(SKILL, 'utf8');

// --- 1. env -> base branch resolution -------------------------------------
check('stag resolves to mlk/stag-env', /`stag`.*`staging`.*mlk\/stag-env/s.test(src));
check('internal resolves to mlk/int-env', /`internal`.*`mlit`.*mlk\/int-env/s.test(src));

// --- 2. host binding ------------------------------------------------------
check('internal deploy binds 172.16.100.162', /deployment-scripts\/mlit\/.*172\.16\.100\.162/s.test(src));
check('staging deploy binds 172.30.12.203', /deployment-scripts\/stag\/.*172\.30\.12\.203/s.test(src));

// --- 3. the DB host must never be presented as an ssh target --------------
const dbLine = src.split('\n').find((l) => l.includes('172.16.100.197')) || '';
check('mlit DB host flagged as non-ssh', /never an ssh target/i.test(dbLine), dbLine.trim());
check('no ssh command points at the DB host', !/ssh\s+app@172\.16\.100\.197/.test(src));

// --- 4. pipeline separation ----------------------------------------------
check('internal declared ONE function', /INTERNAL[\s\S]{0,400}ONE function/.test(src));
check('staging declared TWO steps/hosts', /STAGING[\s\S]{0,400}TWO steps, TWO hosts/.test(src));
check('build env menu has no int/mlit option', /no `int` or\s*\n?`mlit` choice|no \*\*`int`\/`mlit`\s*option\*\*|no `int` or `mlit` choice/s.test(src));

// --- 5. module -> script mapping -----------------------------------------
check('awam maps to deploy-awam.sh', /`awam`.*deploy-awam\.sh/s.test(src));
check('plp maps to deploy-pelupusan.sh', /`plp`.*deploy-pelupusan\.sh/s.test(src));

// --- 6. git safety rails --------------------------------------------------
check('recovery tag step present', /git tag -f pre-<env>-<ticket>/.test(src));
check('revert recipe present', /git revert -m 1/.test(src));
check('bans checking out stale local env branch', /Never\*{0,2}\s*check out the local/i.test(src));
check('already-merged guard present', /merge-base --is-ancestor/.test(src));
check('no-ff merge required', /git merge --no-ff/.test(src));

// --- 7. the rule that caused this skill to exist --------------------------
check('Redmine-ticket-first rule present', /Read the Redmine ticket first/i.test(src));
check('271721 int-env miss recorded', /271721[\s\S]{0,200}int-env/.test(src));

// --- 8. scope boundary vs release-mlk-plp --------------------------------
check('release scope excluded', /Not a release[\s\S]{0,120}release-mlk-plp/.test(src));
check('no-success-claim rule present', /Never claim build\/deploy succeeded/i.test(src));

// --- 9. copyable emit shape (v1.2, 2026-08-05) ---------------------------
// CORRECTED. v1.1 asserted 'no fences at all, plain bullets' - an over-correction.
// miya's words were 'hard to just double click and copy EACH command': one ```bash
// block PER command gives each its own copy button and satisfies that; ONE big fence
// wrapping the whole card does not. The skill moved to the per-command form from
// another worktree and this eval was still asserting the old rule - it went 24/24 to
// 19/5, which is the eval doing its job.
check('ban on wrapping the WHOLE card in one block', /NEVER wrap the whole card in one code block/i.test(src));
check('one-block-per-command rule stated', /own .{0,4}```bash.{0,4} block/i.test(src));
check('prose lines stay unfenced', /never fenced/i.test(src));
// v1.3 (2026-08-06): the local catch-up steps were RETIRED by a concurrent session — the
// build/deploy scripts clone from origin ON THE SERVER, so みや's local checkout plays no part
// in a deploy and those two commands were dead steps in every card. Eval now asserts the
// retirement, not the old rule. (Same shape as the v1.2 correction above: when the skill moves,
// a stale assertion firing is the eval working, not the skill being wrong.)
check('local catch-up retired, with reason', /local\s+working copy plays no part in a deploy/i.test(src));
check('dead steps named explicitly', /dead steps/i.test(src));
// --- 10. training lane + merge order (v1.1, 2026-08-06, #273938) ---------
// Eval case: /deploy training plp 273938 must NOT emit an env-branch merge, and any
// int-env merge must refuse a release-laden training tip. Both failed live on 08-06:
// a tip-based ancestry test invented a docx conflict for a merge already done.
check('training row in env table', /`training`.*`train`/.test(src));
check('mlk/training prefix listed', /mlk\/training\//.test(src));
check('no train-env branch stated', /no \*{0,2}`?mlk\/train-env`?\*{0,2}/i.test(src));
check('merge ORDER rule stated', /training[\s\S]{0,80}int-env[\s\S]{0,200}FIRST|int-env \*{0,2}FIRST/i.test(src));
check('order rationale: release lineage poisons int-env', /whole release lineage/i.test(src));
check('Aaron precedent SHAs recorded', /ce1198818c[\s\S]{0,400}609f83bcb5/.test(src));
check('int-env receives ONLY ticket fixes', /ONLY the ticket.{0,3}s fixes/i.test(src));

// --- 11. ancestry probe correction --------------------------------------
check('guard tests fix commits not tip', /FIX COMMITS, never the branch TIP/i.test(src));
check('slip named', /ancestry-checked-one-direction/.test(src));

// --- 12. deploy-failure triage (v1.1) ------------------------------------
// Eval case: given a log ending 'Invalid WAR structure (WEB-INF missing)', the skill must
// route to the FIRST failure (clone), not the last line.
check('top-down triage rule', /read the log TOP-DOWN/i.test(src));
check('cascade symptom named', /Invalid WAR structure/.test(src));
check('index-pack transient documented', /invalid index-pack output/.test(src));
check('storage falsifiers recorded', /df -i \/home\/app/.test(src));
check('benign noise listed', /mkdir: .{0,3} File exists/.test(src));

// --- 12b. training pipeline shape (v1.2, 2026-08-06) ---------------------
// Eval case: Aaron rejected the one-host mltg route the same day it was written.
// The skill must (a) declare training as build-here-deploy-elsewhere, (b) refuse to
// name a deploy host it does not have, (c) mark mltg refuted so it is never re-guessed.
// v1.2: the host is now SOURCED from the architecture sheet, not unknown and not guessed.
check('training deploy VM recorded', /172\.30\.12\.152/.test(src));
check('training app tier recorded', /172\.30\.12\.126-128/.test(src));
check('mlit app node recorded', /Fudge1[\s\S]{0,40}172\.16\.100\.49/.test(src));
check('folder name still flagged unconfirmed', /folder .{0,4} name unconfirmed|folder name is not/i.test(src));
check('env-architecture doc linked', /ENV-ARCHITECTURE\.md/.test(src));
check('training is two hosts not one function', /TWO hosts, like staging, NOT one function/i.test(src));
check('mltg guess marked refuted', /mltg[\s\S]{0,80}refuted/i.test(src));
check('ban on guessing a deploy host', /Never guess a deploy host/i.test(src));
check('Aaron verbatim correction recorded', /No no[\s\S]{0,120}another IP/i.test(src));

// --- 12c. attribution hygiene -------------------------------------------
// Eval case: do not present Ruri's inference as a colleague's instruction.
check('order rule attributed as inference', /Ruri.{0,3}s inference/i.test(src));
check('who-said-what table present', /do not quote me as quoting Aaron/i.test(src));

// --- 13. third IP -------------------------------------------------------
check('fudge1 app server recorded', /172\.16\.100\.49[\s\S]{0,80}fudge1/.test(src));
check('ruri has no ssh key', /Permission denied \(publickey\)/.test(src));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
