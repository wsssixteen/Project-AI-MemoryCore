/**
 * prepare-commit-trigger.js — UserPromptSubmit hook
 *
 * Two jobs:
 *  (A) On Phase-1 close-out trigger phrases ("prepare for me to commit",
 *      "wrap phase 1", ...) → inject the mandatory prepare-commit sequence.
 *  (B) On a commit-approval phrase ("commit approved", "go ahead commit", ...)
 *      → write the one-shot flag `.claude/state/commit-approved-<QA>.flag` for
 *      the COMMIT-READY quest (status=active AND local_test_confirmed=true),
 *      which commit-gate.js Check 3b requires. みや's approval WORDS are the
 *      deterministic unblock.
 *
 * Created 2026-05-24 — Phase 1 close-out was manual every time, prone to skips.
 * v1.1 2026-05-26 — Step 7.5 mandating `.claude/commit-conventions.md` read.
 * v1.2 2026-05-26 — Step 10.5 inlining the canonical active.txt status enum.
 * v1.3 2026-05-31 — Step 2.6 strip debug probe loggers before staging.
 * v1.4 2026-06-05 (QA-262762, per みや) — (a) Steps 7-9 reworded: Phase 1
 *   closure ALWAYS stops at staging — show `git diff --cached` + drafted
 *   message, commit ONLY after みや's approval; staging is a separate call.
 *   (b) Added job (B), the commit-approval flag writer (pairs with the new
 *   commit-gate.js Checks 3a/3b). The commit-ready quest is identified by
 *   status=active AND local_test_confirmed=true (unique at commit stage even
 *   when multiple quests are active across parallel sessions).
 * v1.5 2026-06-20 (QA-261986, per みや) — Step 2.6 extended to strip cycle-added
 *   explanatory comments (not just debug probes). Comments help みや review during
 *   the session; default = none pushed. Exception: みや says "keep the comment".
 */
const fs = require('fs');
const path = require('path');

const activePath = path.join(__dirname, '..', '..', 'quest', 'active.txt');

function parseBlocks() {
  if (!fs.existsSync(activePath)) return [];
  const text = fs.readFileSync(activePath, 'utf8');
  return text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(b => {
    const o = {};
    b.split('\n').forEach(l => {
      const i = l.indexOf('=');
      if (i > -1) o[l.substring(0, i).trim()] = l.substring(i + 1).trim();
    });
    return o;
  }).filter(o => o.qa);
}

// The quest at the commit gate: active AND already locally test-confirmed.
function readCommitReadyQuest() {
  return parseBlocks().find(o => o.status === 'active' && o.local_test_confirmed === 'true') || null;
}

const TRIGGERS = [
  /\bprepare (for me )?to commit\b/i,
  /\bready to commit (this|now|the fix)?\b/i,
  /\bwrap (up )?phase 1\b/i,
  /\bclose (this|the) ticket\b/i,
  /\bclose this quest\b/i,
  /\b(I'?m )?done with (this|the) (ticket|quest|fix)\b/i,
  /\blet'?s commit\b/i,
  /\bclose out (phase 1|the fix)\b/i,
  /\bphase 1 close[- ]?out\b/i,
  /\b(prepare to |ready to )?close phase (1|one)\b/i,
  /\bprepare to close\b/i,
];

// Commit-approval phrases — みや's review verdict that unblocks exactly one commit.
const APPROVAL = [
  /\bcommit (approved|it|this|now)\b/i,
  /\b(commit )?(message|msg) approved\b/i,
  /\bapprove (the )?(commit|message)\b/i,
  /\bgo ahead( and)? commit\b/i,
  /\b(looks good|lgtm)\b[^\n]*\b(commit|push|ship)\b/i,
  /\byes,?\s+commit\b/i,
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';

    // (B) Commit-approval phrase → write the one-shot approval flag
    if (APPROVAL.some(re => re.test(prompt))) {
      const act = readCommitReadyQuest();
      if (act) {
        const stateDir = path.join(__dirname, '..', '..', '.claude', 'state');
        try {
          fs.mkdirSync(stateDir, { recursive: true });
          fs.writeFileSync(path.join(stateDir, `commit-approved-${act.qa}.flag`), `qa=${act.qa}\napproved=miya\n`);
          process.stdout.write(`\n⚙️  commit-approval recorded for ${act.qa} (one-shot) — commit-gate will allow exactly one commit, then require fresh approval.\n`);
        } catch (e) { /* fail open */ }
      }
    }

    // (A) Phase-1 close-out trigger → inject the prepare-commit sequence
    const hit = TRIGGERS.some(re => re.test(prompt));
    if (!hit) process.exit(0);

    const context = [
      '',
      '⚙️  prepare-commit-trigger: Phase 1 close-out signal detected',
      '',
      'Mandatory Prepare-Commit sequence (per quest-protocol.md):',
      '  1. PRE-CHECK: verify local_test_confirmed=true in quest/active.txt for current QA',
      '  2. Clean .bak files: rm any *.bak_* in work repo (per 2026-05-23 rule)',
      '  2.6 STRIP debug instrumentation + cycle-added comments (per 2026-05-31 + 2026-06-20 rules): grep the touched/staged source files for (a) the probe tag `QA<num>-PROBE:`, (b) any LOGGER added THIS cycle, (c) commented-out debug code, (d) any EXPLANATORY COMMENT added THIS cycle -> REMOVE before staging. Pre-existing loggers/comments stay; only strip what was added this cycle. EXCEPTION: keep a comment ONLY if みや explicitly said to keep it this session (e.g. "keep the comment this time"). Default = NO comments pushed.',
      '  3. git stash (preserve working tree)',
      '  4. git pull --ff-only origin <source-branch>  (MANDATORY — not optional)',
      '  5. git checkout -b mlk/<type>/<number>  (or [v2/v3] if rework)',
      '  6. git stash pop  (resolve conflicts if any)',
      '  7. git add <specific files only>  (NEVER -A, NEVER .) — staging is its OWN step; NEVER chain `git add && git commit`, and NEVER use `git commit -a/-am/--amend/--all` (commit-gate Check 3a blocks these).',
      '  7.5 READ .claude/commit-conventions.md FIRST (per-repo subject style + trailer rules). Canonical etanah subject-only format: "QA #<num> - <URUSAN> - <TUGASAN> - <description>".',
      '  8. ALWAYS STOP AT STAGING (HARD — commit-gate Check 3b): emit the staged file list + the FULL `git diff --cached` + the drafted commit message, then WAIT. The commit stays BLOCKED until みや reviews and says an approval phrase ("commit approved" / "go ahead commit") — which writes the one-shot approval flag. NO bypass, even if みや earlier said "close the ticket".',
      '  9. AFTER みや approves: git commit (its OWN call, message via -m or -F) + git push.',
      '  10. Return to source-branch + git pull --ff-only + update active.txt',
      '  10.5 active.txt status= MUST use canonical enum (per quest-protocol.md v3.5):',
      '         active | hold | delegated | blocked | closed | archived | archived-shipped-by-other',
      '         At Phase 1 close: ALWAYS `closed` (Phase 2 still ahead).',
      '         BANNED legacy strings: awaiting-phase-2, local-test-confirmed, closed-pending-FAT, pending post-mortem.',
      '  11. Emit Phase 1 summary line: `Phase 1 closed at <TS> · commit <SHA> · duration <accept->close>`',
      '  12. Invoke /verify Checklist C — cross-check the full sequence fired',
      '',
      'BANNED shortcuts:',
      '  - Skip pull step (caused 2026-05-11 QA-260139 slip)',
      '  - git add -A or git add . (over-staging risk)',
      '  - Combined `git add && git commit` or `git commit -a/-am` (skips the staging stop — commit-gate Check 3a blocks it)',
      '  - Commit without showing the staged diff + drafted message and getting みや approval (commit-gate Check 3b blocks it)',
      '  - Skip Phase 1 summary emission (mandatory per 2026-05-20)',
      '  - Skip /verify Checklist C',
      '  - Write non-canonical status= value in active.txt (caused 2026-05-26 QA-262869 slip)',
      '  - Commit leftover debug probe loggers / commented-out debug code / cycle-added explanatory comments (unless みや said keep) to a BA-bound ticket (per 2026-05-31 + 2026-06-20 rules — Step 2.6 strips them first)',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
