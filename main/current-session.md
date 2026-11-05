**Last Activity**: 2026-11-05 23:20 — worktree `penang-common-null-error-219adf`. 288059 submitted (15:11) · 287948 and 261986 submitted by miya · 287811: fix = fix 2 + 3 + 4 together (three writers of the Notis 5A name), tested PASS on MLIT 20:58, Redmine journal 7 to Mira 21:05; branch `mlk/internal/287811` rewritten to one commit d7ff0bec43, `mlk/int-env` reset to yihkitc's 39b917f870 + one merge f2ebd118f7, his clone reset to match (he said clean, others must not see the five failed commits). Pending on his word: "post it" (commit-reference journal on 287811, journal 7 names a hash that no longer exists). **system-change queue below: nine routes at step 3 with build code, order P2 P1 P3 P4 P5 P6 P7 P8 P9; his nod "go P2 P1" starts the build.** Earlier system-change step 3 (quest "check before asking" step) still paused (todo row).

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

## Session Recap (2026-11-04/05, orchestrate wrap-up of today's sessions)
- Asked: orchestrate the other sessions for wrap-up; patch tickets settled; 287346 + 288095 only need deploy, so give the test scenarios only; then "Add the 2 tickets to protime if it got removed"; DE.
- Done: reached the 4 work-laptop sessions by SendMessage (287346 MCL Kertas, eSOKONGAN 288095, PLTP JKR duplicate MPAG, UPP tandatangan); confirmed int-env tip 8f20499ba4 holds both fixes, so one internal deploy covers both; sent two test scenario tables (287346 on MLIT PTMLK/02/L/MCL/2026/4 login norzaida; 288095 on stg1 data); ProTime check-and-add sent to the 288095 session.
- Found: this PC has no E: drive (no etanah repo, no PymTime, no DB gateway), so ProTime and DB work must run on the work laptop; SendMessage to a Remote Control session gives no delivery or read receipt; the 288095 session's own recap says ProTime 39360 (287346) was already resolved there.
- Open: 288095 session's ProTime read-back line (no reply at DE); 288095 MLIT test login not sent; a deploy run after 2026-11-04 21:32 not verified; 288261 quest doc blocked by its session's worktree guard (needs a main-folder session, his call).
- Mistakes: the first scenario replies carried status sections and patch tables he did not ask for; he had to ask "where's the test scenario only without the bloat?".
- Assessment: A1 an orchestrator on a machine without the work tools can only relay, and a relay with no receipt cannot prove delivery. A2 ⏭ no quest phase moved here. A3 ⏭ no debugging. A4 one int-env merge tip covers two tickets' deploy; checking the tip's time against the deploy run is the proof. A5 ⏭ no sweep.

**Last Activity**: 2026-11-05 08:55 — worktree `common-version-1-10-20-mlk-c5ee8f` (branch claude/issue-287346-investigation-010aea), ESOKONGAN 287346 MCL Syarat Nyata + Kertas Pertimbangan, TEMPLATE-SCENARIO step built, Phase 1 closed, Domain Expansion.

## Session Recap (2026-11-04/05, 287346 MCL + TEMPLATE-SCENARIO quest step)
- Asked: solve, commit and deploy 287346; Redmine handover to Anis following Requirement #223230 100%; one green-highlighted paper, no comments or numbers; then /goal: Fable 5.1 plans a complete template test-scenario step (requirement check, CC tags filled, every ticket request), pull 288095's work from main first, green paper with screenshots, red boxes never nested or overlapping.
- Done: fix 93db632627 on mlk/esokongan/287346, int-env 013616117b; Redmine 287346 Resolved to Anis (journal 11, Root cause + Solution); domain/template-scenario (checklist, chain 3/3, CC values, word diff vs requirement, green paper, Stop gate; eval 33/33; commit 230e548b); fix-photo mark.py refuses nested/overlapping boxes (--merge draws the union); requirement-index.js --read prints docx comments; template-cc-preflight retired; Phase 1 close 8965fa93 (status closed, KPI row, branches table).
- Found: Hakmilik Sementara and Kekal values were swapped in the template; the MCL screen called a Pemberimilikan-only method on Syarat Nyata; the main folder had diverged from GitHub main (synced with row-level union, 0 rows lost).
- Open: Anis verifies 287346 and closes it on Redmine, then Phase 2 archive (save-quest says WAIT); atlas-ship-gate reads its own message text (slip row, not built); stg1 patch for PTMLK/01/L/MCL/2026/24 (both signatures) only if he wants it.
- Mistakes: two hand-backs of 287346 had requirement gaps my own audit listed (the reason the step was built); `git add -A` in the main folder was refused (untracked = confidential), used `git add -u` + named paths; a /goal loop on an external BA step ran ~20 turns.
- Assessment: A1 a /goal whose last condition is an external human step loops the evaluator with no exit but /goal clear. A2 TEMPLATE-SCENARIO now gates every template hand-back on requirement diff + CC values. A3 doc-sim + green paper proved the template offline with no server. A4 a template versi older than its Requirement passes every code test; only a word diff against the requirement docx catches it. A5 ⏭ no sweep.

**Last Activity**: 2026-11-05 00:05 — worktree `pptpb-hakmilik-assignment-639100` (branch claude/redmine-esokongan-quest-65a9db), ESOKONGAN 288095 PRBB Rencana JKBB fixed, deployed internal, Resolved to Fizah, ProTime 287346 resolved, Domain Expansion.

## Session Recap (2026-11-04, 288095 PRBB Rencana huruf kecil, .00, 6.3)
- Asked: run /quest on 288095; apply all 3 fixes; test on server; stage the Redmine handover; patch the missing mlit data and screenshot the fix; todo for a test-data step; ProTime check of today's 4 tickets.
- Done: f9c4c1a321 on mlk/esokongan/288095 (PelupusanUtil upperCaseReferenceWords + formatRinggitInText, 2 Word CC populators, helper 2-decimal formatter, 6.3 "kelulusan" in 2 e-Doket templates); int-env 8f20499ba4 (conflict kept PRBB or PLBP + uppercase, his "resolve 288095"); stag-env 24c1bf853a (merged on a misread of "staging", not deployed); mlit plp_a_pelupusan 2089 Permohonan Dahulu patched with real numbers; 2 fix screenshots in 2. Fix; Redmine 288095 Resolved to Nurhafizah 22:56 (entry 14); ProTime 39360 (287346) resolved.
- Found: mlit Permohonan Dahulu held only the template placeholder, so 2.1.2 could not show the fix; eTanah 1.0 IDs (0401DIS..., C99/25) all hold digits, so the same fix covers them (PROD: 135 tokens uppercased, 389 no-digit words untouched).
- Open: BA test on internal; Q1 Timbangan pertama line, Q2 6.3/6.4 same heading, Q3 meeting name lowercase, Q4 2.2.1 address; stag-env merge waits his word (keep or revert); todo test-data step waits a blind Fable 5.1 audit (his yes on 1 agent); his stash fc6d255101 left to him.
- Mistakes: read "stage the redmine" as the stag-env branch; test-prep tool switched his local env to mlit (put back to stg1); handover tool cannot see his waiver 3 messages back (blocker slip); audit of the test-data gap ran on Opus, not blind Fable.
- Assessment: A1 his-words.js 600 KB tail sees only 2 of his messages in a hook-heavy session. A2 no step checks the fixed field holds real data before a hand-back (5 slips in 8 days). A3 doc-sim proved all 3 fixes offline before deploy. A4 a sentence-case formatter lowercases IDs. A5 ⏭ no sweep.
**Last Activity**: 2026-11-04 23:10 — worktree `sweep-orchestration-audit-39e710` (branch claude/todays-ticket-review-82c546), today's board, 287892, 286650 Zarul patch, 248290 coverage adhoc, Domain Expansion.

STEP-3: rework audit (quest Workflow step 1c + close-phase Phase 1 step 0)
session: 2026-11-05 cool-margulis-5bb326 (287346 rework 1)
his words: "please audit this round to add an ever continuing improvement or self-improvement particularly on receiving rework tickets. To straight away summon Fable 5.1 to audit I believe AFTER you've finished phase 0 ... to then log it straight away to propose the improvement into our quest workflow at the end during DE perhaps or before DE AFTER redmine handover, ticket close. The improvement after the audit of course uses Fable/highest model as well as usual." (order)
fix or report: fix
who pays: on-demand: one highest-model agent per rework cycle (about 6 min, 200k tokens on 287346); the manifest line is in-process, no new process
goal without the part: a rework ticket's failure cause is learned only when someone remembers to write a wrong-fix row at close, and the verdict is made by whatever model runs Phase 2 or DE
model: claude-fable-5-1 (A/S/C check by agent, verdict "build with changes"); built by claude-opus-5-5
shown: rework-audit-flow.png (scratchpad, sent to miya)

STEP-3: change-card skill (What / Why / How / When / Where, before and after every system change)
session: edb789a0-eefa-41ce-855b-53a0705b84a6
his words: "build a skill that will always be invoked installed into system-upgrade and or BEFORE we do system-upgrade" (order)
fix or report: fix
who pays: on-demand: no process; one checker call per card, two cards per system change (step 3, step 8)
goal without the part: he reviews a change from the STEP-3 block and the step 8 map alone, with no five-line card to compare before and after
model: claude-fable-5-1
shown: domain/change-card/diagram.png
note: "system-upgrade" read as the change route (/system-change); Fable 5.1 A/S/C verdict "build with changes" (9 items), built by claude-opus-5-5

CHANGE-CARD (before): change-card
- What: A new skill, change-card, shows every system change as five one-sentence lines with a flow picture and the change map.
- Why: On 2026-11-05 he asked for a What, Why, How, When and Where card that is easy to review before and after a change.
- How: The card is written here, checked by `domain/change-card/change-card.js`, then shown before his nod and again after landing.
  ![flow](domain/change-card/diagram.png)
- When: It runs at change route step 3 before his nod and at step 8 after the change lands on main.
- Where: It lives in `domain/change-card/` and `.claude/skills/change-card/`, wired into rows 3 and 8 of `system/INDEX.md`.
  ![where](change-map-20261105-094246.png)
Where picture = the change map (lib/change-map.js).

