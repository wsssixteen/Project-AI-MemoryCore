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

## Session Recap (2026-11-04, 288095 PRBB Rencana huruf kecil, .00, 6.3)
- Asked: run /quest on 288095; apply all 3 fixes; test on server; stage the Redmine handover; patch the missing mlit data and screenshot the fix; todo for a test-data step; ProTime check of today's 4 tickets.
- Done: f9c4c1a321 on mlk/esokongan/288095 (PelupusanUtil upperCaseReferenceWords + formatRinggitInText, 2 Word CC populators, helper 2-decimal formatter, 6.3 "kelulusan" in 2 e-Doket templates); int-env 8f20499ba4 (conflict kept PRBB or PLBP + uppercase, his "resolve 288095"); stag-env 24c1bf853a (merged on a misread of "staging", not deployed); mlit plp_a_pelupusan 2089 Permohonan Dahulu patched with real numbers; 2 fix screenshots in 2. Fix; Redmine 288095 Resolved to Nurhafizah 22:56 (entry 14); ProTime 39360 (287346) resolved.
- Found: mlit Permohonan Dahulu held only the template placeholder, so 2.1.2 could not show the fix; eTanah 1.0 IDs (0401DIS..., C99/25) all hold digits, so the same fix covers them (PROD: 135 tokens uppercased, 389 no-digit words untouched).
- Open: BA test on internal; Q1 Timbangan pertama line, Q2 6.3/6.4 same heading, Q3 meeting name lowercase, Q4 2.2.1 address; stag-env merge waits his word (keep or revert); todo test-data step waits a blind Fable 5.1 audit (his yes on 1 agent); his stash fc6d255101 left to him.
- Mistakes: read "stage the redmine" as the stag-env branch; test-prep tool switched his local env to mlit (put back to stg1); handover tool cannot see his waiver 3 messages back (blocker slip); audit of the test-data gap ran on Opus, not blind Fable.
- Assessment: A1 his-words.js 600 KB tail sees only 2 of his messages in a hook-heavy session. A2 no step checks the fixed field holds real data before a hand-back (5 slips in 8 days). A3 doc-sim proved all 3 fixes offline before deploy. A4 a sentence-case formatter lowercases IDs. A5 ⏭ no sweep.
**Last Activity**: 2026-11-04 23:10 — worktree `sweep-orchestration-audit-39e710` (branch claude/todays-ticket-review-82c546), today's board, 287892, 286650 Zarul patch, 248290 coverage adhoc, Domain Expansion.

## Session Recap (2026-11-04, today's board + 248290 coverage per urusan)
- Asked: today's tickets; 275608 missing from the ranked board; BA reply on 287892; Zarul's nextUrusan=PSPM PROD patch for 286650; Fizah's OPLPS/2026/2 infra paths; peer appraisal request; Mira's question whether 248290 covers all 7 urusan; "save adhoc".
- Done: redmine-board counts "e-Tanah Melaka" as a Melaka project (07455cc9); 287892 BA reply posted; 286650 patch script + Redmine handover note drafted; ADHOC-PLP-2026-6 saved and archived (Task folder 374, register A98, audit 31/31 PASS).
- Found: 248290 covers PLPS, MLPS, PRBB, PRU, PPJK, PPTPB; PLBP's AWAM Status Permohonan dialog (paparanBorang4BeL2eDialog, StatusPermohonanForm.xhtml:993) is commented out; the print-once lock is only for 4Ae/L1e.
- Open: miya sends the corrected reply to Mira; 286650 handover note waits "post it"; ADHOC-PLP-2026-6 owes a quest-bounty harvest.
- Mistakes: said "PLBP not on PROD" from an assumption; he corrected it, re-answered from the code. Stop corrections: unqualified proving SELECTs, terse gate, next-steps row wording.
- Assessment: A1 adhoc-brief-first blocks the main-thread audit re-run after the agent reports (skill step 4 asks for it). A2 ⏭ no quest phase moved. A3 coverage question answered from code per urusan, not from a test. A4 an AWAM dialog commented out silently drops one urusan from a shared Requirement. A5 ⏭ no sweep.
**Last Activity**: 2026-11-04 22:40 — worktree `ticket-275608-reply-7d6b89` (branch claude/redmine-data-patches-583794), PROD data patches 288169 + 288261 Resolved to Fizah, Domain Expansion.

## Session Recap (2026-11-04, PROD data patches 288169 and 288261)
- Asked: run 2 Redmine data patches; then "replace" not "upload" for an overwrite; then hand both back to the BA.
- Done: 288169.sql (6 umm_a_jabatan_teknikal rows agensi 8 → 6) and 288261.sql (3 UPDATEs) + renamed pelan PDF; infra ran them; PROD re-checked; both tickets Resolved to Fizah 22:33 with his note "have patched the data in PROD. Can proceed to verify."; patch-mlk-doc infra box says "replace" (8ebb3381); redmine-phase1-prefill Step 4 carries the PROD note (main 66cfedae).
- Found: BA named agensi 6002 but the bad rows sit on agensi 8 (named MPAG 21/07 to 13/08); a PROD patch is checked by the user through the TSO, never by the BA.
- Open: QA-288169.md and QA-288261.md are not in the main folder (worktree guard); drafts in this session's scratchpad. Quests stay Phase 1 until Redmine shows Closed.
- Mistakes: wrote the internal-deploy note ("Please help to verify") on a PROD patch; Stop corrections for a part path, a missing proving SELECT, and the change map; memory-write-gate refused the speech example 3 times (rule went into the skill instead).
- Assessment: A1 memory-write-gate cannot see a RULE-PLACEMENT line written in the same message as the edit. A2 the prefill skill had no PROD-patch note shape. A3 ⏭ no debugging. A4 an agensi renamed for a window leaves rows pointing at the wrong agency. A5 ⏭ no sweep.
**Last Activity**: 2026-11-04 17:55 — worktree `penang-common-null-error-219adf`, Penang Utiliti Penyediaan Surat Jana error (ADHOC-UPS-2026-2), Domain Expansion.
