**Last Activity**: 2026-11-05 23:20 — worktree `penang-common-null-error-219adf`. 288059 submitted (15:11) · 287948 and 261986 submitted by miya · 287811: fix = fix 2 + 3 + 4 together (three writers of the Notis 5A name), tested PASS on MLIT 20:58, Redmine journal 7 to Mira 21:05; branch `mlk/internal/287811` rewritten to one commit d7ff0bec43, `mlk/int-env` reset to yihkitc's 39b917f870 + one merge f2ebd118f7, his clone reset to match (he said clean, others must not see the five failed commits). Pending on his word: "post it" (commit-reference journal on 287811, journal 7 names a hash that no longer exists). **system-change queue below: nine routes at step 3 with build code, order P2 P1 P3 P4 P5 P6 P7 P8 P9; his nod "go P2 P1" starts the build.** Earlier system-change step 3 (quest "check before asking" step) still paused (todo row).

**Last Activity (288261 session)**: 2026-11-06 00:07 — worktree `redmine-288261-quest-d586ef`. 288261 rework patched, handed over, archived; rework audit (Fable 5.1) → B3 Patch scope built via /system-change (ticket-load-verify.js v1.6 + quest Pre-emit gate row, commit 8e1090ee, landed: GitHub main 921ff221, main folder 0bf3d0ad); eval 28/28 green. Open: redmine-write-gate blocks a direct `node quest/ticket-load-verify.eval.js` (fixture key `status_id:`); the READ_ONLY_SCRIPT exemption for `.eval.js` was denied by the auto-mode classifier, needs miya's nod as its own /system-change.

**Last Activity (earlier)**: 2026-11-05 00:05 — worktree `pptpb-hakmilik-assignment-639100` (branch claude/redmine-esokongan-quest-65a9db), ESOKONGAN 288095 PRBB Rencana JKBB fixed, deployed internal, Resolved to Fizah, ProTime 287346 resolved, Domain Expansion.

## System-change queue 2026-11-05 (287811 audit) — nine routes paused at step 3, each with its build code

Scope for every route: active block `ticket_type=bug` or a Rework cycle (a `closed*=` stamp), edited path under `etanah-(pelupusan|awam)` with `.java|.xhtml|.json`. Never a `ticket_type=patch` block, an ALTER adhoc or a template ticket. Verified 2026-11-05 23:10 by running the parts (falsifier check clear on the stale block · quest-phase-gate passes on any active block · predicate-box waives at 80% · deploy-guard liveDecide unexported). Order: P2 P1 P3 P4 P5 P6 P7 P8 P9.

### P2 — rework re-opens the block (ticket-gate + active-cli); the edit gate binds to the edited repo's branch
WHERE `.claude/hooks/ticket-gate.js` before line 213 (`const pastPhase0 = …`). Insert:
```js
// 2026-11-05 (#287811): a closed block whose live Redmine status is Rework re-opens itself.
// 287811 stayed status=closed, local_test_confirmed=true from 3 Nov through a whole rework day.
if (state.status === 'closed') {
  let live = '';
  try { live = require('child_process').execSync(`node domain/redmine-write-gate/status-rule.js ${qaNum}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (_) {}
  if (/\bRework\b/i.test(live)) {
    try { require('child_process').execSync(`node quest/active-cli.js update QA-${qaNum} status=active local_test_confirmed=false phase="rework (re-opened by ticket-gate)"`, { cwd: ROOT, stdio: 'ignore' }); } catch (_) {}
    state.status = 'active'; state.phase = 'rework';
    extra.push('🔁 REWORK: block re-opened (status=active, local_test_confirmed=false); the Rework folder is created by active-cli; Writers table is owed before any fix (predicate-box).');
  }
}
```
WHERE `domain/quest-phase-gate/quest-phase-gate.gate.hook.js:89`, replace `if (!/\bstatus=active\b/.test(activeTxt)) process.exit(0);` with:
```js
// 2026-11-05 (#287811): bind the edit to the ticket of the edited repo's branch, not to "any active block".
let ticket = null;
try {
  const repo = filePath.replace(/([\\/]etanah-(?:pelupusan|awam|common|teknikal))[\\/].*$/i, '$1');
  const br = require('child_process').execSync('git branch --show-current', { cwd: repo, encoding: 'utf8' }).trim();
  ticket = (br.match(/\/(\d{5,})(?:v\d+)?$/) || [])[1] || null;
} catch (_) {}
if (ticket) {
  const block = activeTxt.split(/^(?=qa=)/m).find(b => new RegExp('^qa=(?:QA-)?' + ticket + '\\b').test(b)) || '';
  if (!/^status=active\b/m.test(block)) deny(`ticket ${ticket} (branch) is not status=active in quest/active.txt: re-open it (node quest/active-cli.js update QA-${ticket} status=active local_test_confirmed=false) before editing`);
} else if (!/\bstatus=active\b/.test(activeTxt)) process.exit(0);
```
Fixtures: `domain/quest-phase-gate/eval.js` +2 (branch ticket closed → deny; branch ticket active → existing path); `domain/ticket-gate/eval.js` +1 (closed block + Rework status → extra row present).

### P1 — writer matrix owed on a rework or a same-day wrong fix, regardless of confidence
WHERE `domain/predicate-box/predicate-box.discipline.hook.js:236`. Replace `if (conf !== null && conf >= CONFIDENCE_FLOOR) return { v: 'passed', how: 'confidence ' + conf + '%' };` with:
```js
// 2026-11-05 (#287811): a confidence of 80+ waives PROBES, never the WRITER LIST on a rework.
// All four 287811 fixes stated 80 to 90 and each closed one writer of three.
const rework = reworkOwed(t);   // true when wrong-fix.js today <QA> exits 0 or the block holds a closed*= stamp
if (conf !== null && conf >= CONFIDENCE_FLOOR && !rework) return { v: 'passed', how: 'confidence ' + conf + '%' };
```
and add, next to `lastConfidence`:
```js
function reworkOwed(t) {
  try {
    const qa = t.qa; if (!qa) return false;
    const r = require('child_process').spawnSync('node', ['lib/wrong-fix.js', 'today', qa], { cwd: ROOT });
    if (r.status === 0) return true;
    const blk = fs.readFileSync(path.join(ROOT, 'quest', 'active.txt'), 'utf8').split(/^(?=qa=)/m).find(b => b.startsWith('qa=' + qa)) || '';
    return /^closed(_cycle\d+)?=/m.test(blk);
  } catch (_) { return false; }
}
```
Matrix header accepted as `| # | Writer (full address) | Runtime proof | Closer |` as well as the existing `Probe placed?` shape (extend the header regex at line 190). Fixtures: `domain/predicate-box/eval.js` +3 (rework + 85% + no matrix → blocked; rework + matrix → passed; cycle 1 + 85% → passed).

### P3 — deploy-guard v2 wired, order tokens read from his messages
WHERE `domain/deploy-guard/deploy-guard.check.hook.js:124-135`. In runHook, after `const d = decide(cmd, turn);` add:
```js
const his = (() => { try { return require(path.join(ROOT, 'lib', 'his-words.js')).hisMessages(data.transcript_path, 8).join('\n'); } catch (_) { return ''; } })();
const live = d.block ? d : liveDecide(cmd, data.cwd || process.cwd(), his);
const v = d.block ? d : live;
```
and use `v` in place of `d` below. In `decide`, the revert token check reads `turnText` = his messages (pass `his` as a second call: `decide(cmd, turn + '\n' + his)` is wrong for skip-deploy-guard; keep `decide(cmd, turn)` for the skip token and test `[miya-ordered-revert:` against `his` only). Export `liveDecide`. Fixtures in `deploy-guard.eval.js`: revert no token → block; revert with his token → pass; re-merge same day (stub git) → block; re-merge with his token → pass; push with 3 commits today → block; push with 1 → pass.

### P4 — new Tool `lib/origin-rewrite.js` (row in `system/tools.json`)
```js
#!/usr/bin/env node
// origin-rewrite.js — the ONLY allowed way to move an origin branch backwards (2026-11-05, #287811).
// Usage: node lib/origin-rewrite.js --repo <work clone or worktree> --branch <mlk/...> --lease <old origin sha> [--his-clone E:\Projects\Melaka\etanah-pelupusan]
// Does: push --force-with-lease=<branch>:<lease>; then in his clone: fetch, and reset <branch> to origin/<branch> only when the tree is clean
// and <branch> is checked out or exists; prints "refresh SourceTree". Refuses: a dirty his-clone, a lease that no longer matches, a branch not under mlk/.
'use strict';
const { execSync } = require('child_process');
const a = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const repo = a('repo'), branch = a('branch'), lease = a('lease'), his = a('his-clone') || null;
if (!repo || !branch || !lease || !/^mlk\//.test(branch)) { console.error('usage: --repo <dir> --branch mlk/... --lease <sha> [--his-clone <dir>]'); process.exit(2); }
const git = (args, cwd) => execSync('git ' + args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
git(`push --force-with-lease=${branch}:${lease} origin ${branch}`, repo);
console.log(`origin/${branch} now ${git(`rev-parse origin/${branch}`, repo)}`);
if (his) {
  if (git('status --porcelain', his)) { console.error(`his clone ${his} is dirty: not reset. Ask him to commit or stash, then: git fetch; git reset --hard origin/${branch}`); process.exit(3); }
  git('fetch origin', his);
  const cur = git('branch --show-current', his);
  if (cur === branch) git(`reset --hard origin/${branch}`, his); else git(`branch -f ${branch} origin/${branch}`, his);
  console.log(`his clone ${branch} = ${git(`rev-parse ${branch}`, his)} (0 ahead). Refresh SourceTree.`);
}
```
deploy-guard: the force-push case (line 39-41) stays a block; `decide` passes when the command invokes `lib/origin-rewrite.js`. Eval: `lib/origin-rewrite.eval.js` on a temp bare repo + two clones (push moves the ref; dirty clone exits 3; clean clone resets).

### P5 — ticket-close-block refuses a multi-commit cycle
WHERE `domain/ticket-close-block/ticket-close-block.js` inside the `if (ba && ba !== true && commit && !foreign)` block (line 113), before the ledger check:
```js
// 2026-11-05 (#287811): one non-merge commit per cycle on the ticket branch.
try {
  const base = git(repo, ['merge-base', 'origin/mlk/master', branch]);
  const n = parseInt(git(repo, ['rev-list', '--no-merges', '--count', `${base}..${branch}`]), 10);
  const blk = (() => { try { return require('child_process').execSync(`node quest/active-cli.js read QA-${ticket}`, { cwd: ROOT, encoding: 'utf8' }); } catch (_) { return ''; } })();
  const cycles = 1 + (blk.match(/^closed(_cycle\d+)?=/mg) || []).length;
  if (n > cycles) { console.error(`BA pass note refused for QA-${ticket}: ${n} non-merge commits on ${branch} since master, ${cycles} cycle(s). Squash to one commit per cycle (git reset --soft <master merge>; commit) and push through lib/origin-rewrite.js.`); logRow({ ts: new Date().toISOString(), ticket, outcome: 'refused-multi-commit', n, cycles }); process.exit(3); }
} catch (_) {}
```
Eval: new `domain/ticket-close-block/eval.js` on a temp repo (2 commits in 1 cycle → exit 3; 1 commit → prints).

### P6 — test-scenario-login-gate v5 message + evals, v6 ISSUE rows
WHERE `domain/test-scenario-login-gate/test-scenario-login-gate.check.hook.js:148,:157`: message → "Full ID not in inline code (backticks) inside the table cell". v6, after v5:
```js
// v6 (2026-11-05, #288059): every ISSUE| row of the ticket's qa_doc and every tugasan the BA named gets a row.
const tk = (text.match(/\b(\d{5,7})\b/) || [])[1];
if (tk && !/\[skip-issue-rows:\s*[^\]]+\]/i.test(text)) {
  let doc = ''; try { doc = fs.readFileSync(path.join(ROOT, 'projects', 'coding-projects', 'active', 'QA-' + tk, 'QA-' + tk + '.md'), 'utf8'); } catch (_) {}
  const issues = (doc.match(/^ISSUE\|\d+\|/mg) || []).length;
  const rows = (text.match(/^\|\s*\d+\s*\|/mg) || []).length;
  if (issues && rows < issues) return { fired: true, blocked: true, blockReason: `⛔ test-scenario-login-gate v6: ${issues} ISSUE rows in QA-${tk}.md, ${rows} test rows. One row per ISSUE row and per tugasan the BA named. Bypass: [skip-issue-rows: <reason>]` };
}
```
Fixtures: `test-scenario-login-gate.eval.js` F8 short form blocks · F9 inline full id passes · F10 separate block blocks · F11 fewer rows than ISSUE rows blocks. `domain/deploy/eval.js` checks 53-55 assert SKILL.md:347-353 text.

### P7 — next-steps-shape: a design question names its stop gate
WHERE `domain/next-steps-shape/next-steps-shape.check.hook.js` inside the row loop (line 93), add:
```js
const action = c[act >= 0 ? act : 1] || '', meaning = c[header.findIndex(h => /what it means|what this is|why/i.test(h))] || '';
if (/\b(pick|choose|which (fix|option)|option [A-D]\b|A or B)\b/i.test(action) && !/STOP gate:/i.test(meaning)) return { verdict: 'block', reason: 'design-question-no-gate', rows: [c[0] + ' "' + action + '"'] };
```
Fixture +2 in `next-steps-shape.eval.js`.

### P8 — design-consult-gate: no system edit in a quest turn unless he asked
WHERE `domain/design-consult-gate/design-consult-gate.gate.hook.js:219` inside `if (isGuarded) {` first line:
```js
// 2026-11-05 (#287811): in a quest turn, a system-path edit needs his ask in his own words.
try {
  const HW = require(path.join(ROOT, 'lib', 'his-words.js')); const last = HW.lastHis(data.transcript_path) || '';
  const active = fs.readFileSync(path.join(ROOT, 'quest', 'active.txt'), 'utf8');
  const tk = (last.match(/\b(\d{5,7})\b/g) || []).find(n => new RegExp('^qa=(?:QA-)?' + n + '\\b[\\s\\S]*?^status=active', 'm').test(active));
  if (tk && !/\b(update|refine|ban|rule|skill|hook|gate|system|memory|todo)\b/i.test(last) && !bypassConsult) { logFire(filePath, 'blocked-quest-turn', tk); deny('quest-turn-system-edit: his last message is about ticket ' + tk + ' and does not ask for a system change; log the refinement in main/todo.md instead'); }
} catch (_) {}
```
Fixture +2 in `design-consult-gate.eval.js`.

### P9 — memory `.claude/auto-memory/feedback_etanah_git_separate_clone.md`
One line: "His clone E:\Projects\Melaka\<repo> is read only, except the fetch + reset that `lib/origin-rewrite.js` runs after an origin rewrite (P4). One non-merge commit per cycle on a ticket branch; a revert only on his order (`domain/deploy-guard` v2)." RULE-PLACEMENT: workflow deploy · step 4 · enforced-by deploy-guard v2 + origin-rewrite.js.
STEP-3: B3 Patch scope in quest/ticket-load-verify.js + quest Pre-emit gate row (288261 rework audit)
session: redmine-288261-quest-d586ef
his words: "Build it" (order) · after "Please audit how next time we can avoid this, even though it is not our part. This is part of our effort on releasing something rework free."
fix or report: fix
who pays: on-demand: a few ms inside ticket-load-verify.js at each quest start or resume; no process, no network
goal without the part: a BA list that drops a permohonan the TSO report named ships a partial patch, as on 288261 (/1 tujuan), and the ticket comes back
model: claude-opus-5-5 (highest is claude-fable-5-1, which wrote the audit verdict feature:patch-scope-B3; neither part is highest-order nor runs every prompt)
shown: scratchpad b3-how.png + b3-where.png (sent to miya)
state: built 2026-11-05: ticket-load-verify.js v1.6 B3 + quest Pre-emit gate row; replay on 288261 cut at the 4 Nov BA list = 1 ⚠. Eval 28/28 green 2026-11-05 (run via node -e require, on miya's "Yes, run them"; the gate still blocks a direct `node <eval>` because of the status_id: fixture key).

STEP-3: quest skill 6c patch path, fixes A B C (ADHOC-MCL-2026-7 audit)
session: sweep-orchestration-audit-39e710
his words: "Yes, apply all three" (order) · after "please audit why you failed, what is still missing in our patching quest path & steps"
fix or report: fix
who pays: on-demand: read when a ticket or adhoc patch ask loads the quest skill; no process
goal without the part: a patch ask with stored documents gets a data-patch-only plan, as on ADHOC-MCL-2026-7
model: claude-opus-5-5 (highest is claude-fable-5-1; quest skill is not highest-order and does not run every prompt)
shown: scratchpad patch-path-6c.png

**Last Activity**: 2026-11-05 17:58 — worktree `quest-resume-ticket-239386-642586`, RQ 239386 MPT rework: BA question to Anis posted, deep research on MPT page selection, quest saved, Domain Expansion.

## Session Recap (2026-11-05, 239386 MPT which pages to show)
- Asked: reload 239386 with /quest resume and prepare the BA confirmation again (older session not archived); stage it in the browser; simpler picture; clash table inside the note; /deep-research whether the 5 other-module pages should show and whether it depends on the user; save the quest.
- Done: Redmine 239386 note to Anis 17:27 (2 errors, clash table, yes/no question) + picture 6 at 17:45, both posted by him; deep research (code, DB census, tickets) folded into QA-239386.md; quest status delegated to Anis, cold-resume 7/7, branches table PASS.
- Found: MPT pages = every ind_langkah row of the urusan's MPT tugasan, no user, peranan, modul or flag_aktif filter (etanah-common LuceneForm.java:1820-1828); STG2 PLP MPT carries only the shared UT/BGN set; Teknikal beans have Pelupusan branches, Pembangunan forms likely NPE on plain PLP (not tested).
- Open: Anis's answer; Amirul NPE note not sent; rework audit + 12-row audit owed; MLIT test of the 5 pages on a PLP permohonan.
- Mistakes: first BA note and picture carried sentences and an A/B table he did not want; the deep-research skill created research_notes/ and reports/ at the repo root (folded into the quest doc and removed).
- Assessment: A1 a generic research skill writes its own folders, which breaks the no-invented-folders rule. A2 quest resume found the older session and its state in two calls. A3 three parallel research tracks answered a design question in about 10 minutes. A4 MPT visibility is pure reference data per urusan. A5 ⏭ no sweep.
**Last Activity**: 2026-11-05 17:58 — worktree `appraisal-ratings-review-02cd68` (branch claude/hotfix-ticket-287346-610847), hotfix skill loaded, hotfix branch for 287346 prepared then parked (no hotfix order), Domain Expansion.

## Session Recap (2026-11-05, 287346 hotfix prep, parked)
- Asked: is the hotfix skill installed; load it and prepare 287346; then "we didn't get any orders to hotfix so save for now DE".
- Done: hotfix skill loaded (route H1-H4, ticket already fixed); local branch mlk/hotfix/287346 off origin/mlk/master 3ca04772db (1.9.2) in worktree E:\Dev\etanah-work\etanah-pelupusan-hotfix-287346; merged origin/mlk/esokongan/287346 as 07a77bf833 (4 commits, 3 files, no common change); compile green; infra message drafted from the team template. NOT pushed.
- Found: at DE the hotfix branch is stale: it lacks rework 1 commit c2364d2bde (made 15:02 by the 287346 rework session), so it must not be pushed as is.
- Open: no hotfix order. If one comes (after BA verify): fetch, merge origin/mlk/esokongan/287346 again into mlk/hotfix/287346 (or drop and rebuild off fresh master), check HEAD..origin/mlk/esokongan/287346 = 0, compile, push, give him the infra message. Branch and worktree are local only.
- Mistakes: built the hotfix branch before checking a hotfix was ordered and the BA had verified; the plan picture asked that question only after the build.
- Assessment: A1 ⏭ no system part changed. A2 hotfix route H1 assumes "verified" with no check that an order and a BA pass exist, and nothing re-checks the ticket branch tip at push time. A3 ⏭ no debugging. A4 a hotfix built from a ticket branch goes stale the moment a rework commit lands. A5 ⏭ no sweep.
**Last Activity**: 2026-11-05 10:20 — worktree `session-orchestration-deploy-e6a380` (home PC vice4), orchestrated today's 4 ticket sessions for wrap-up, test scenarios for 287346 + 288095, ProTime add delegated, Domain Expansion.
