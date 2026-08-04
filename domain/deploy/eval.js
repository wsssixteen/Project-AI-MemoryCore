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
check('recovery tag step present', /git tag -f ruri\/pre-<env>-<ticket>/.test(src));
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

// --- 9. copyable emit shape (v1.1, 2026-08-04) ---------------------------
// Third `emit-shape-not-copyable` strike: the card had been spec'd INSIDE a code
// fence, so miya got one copy button for the whole block instead of one line per
// command. Assert the ban is stated AND that section 5 carries no fence.
check('no-fence rule stated in section 5', /NEVER put the commands in a code fence/i.test(src));
check('one-command-per-line rule stated', /One command per line/i.test(src));
const sec5 = (src.split(/^## 5 [\s\S]*?$/m)[1] || '').split(/^## 6 /m)[0] || '';
check('section 5 contains no code fence', !/```/.test(sec5));
check('deploy commands emitted as bullets', /^- `ssh app@172\.16\.100\.162`$/m.test(src));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
