/**
 * prepare-commit-trigger.js — UserPromptSubmit hook
 *
 * Detects Phase 1 close-out trigger phrases ("prepare for me to commit",
 * "wrap phase 1", "ready to commit this", etc.) → injects the mandatory
 * 7-step prepare-commit sequence as a deterministic checklist.
 *
 * Created 2026-05-24 — addresses CRITICAL workflow gap from audit:
 * Phase 1 close-out was manual every time, 7-step sequence prone to skips.
 * 2026-05-11 QA-260139 slip: pull step omitted. 2026-05-12 みや: "why didn't
 * you automatically branch out when I say prepare for me to commit?"
 *
 * v1.1 2026-05-26 — Added Step 7.5 mandating `.claude/commit-conventions.md`
 * read BEFORE drafting the commit message. Slip-driven: QA-262869 close-out
 * drafted a verbose long-body commit ignoring the canonical etanah subject-only
 * format `QA #<num> - <URUSAN> - <TUGASAN> - <description>`. The convention
 * file existed but was never read at draft time.
 */
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
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';
    const hit = TRIGGERS.some(re => re.test(prompt));
    if (!hit) process.exit(0);

    const context = [
      '',
      '⚙️  prepare-commit-trigger: Phase 1 close-out signal detected',
      '',
      'Mandatory 7-step Prepare-Commit sequence (per quest-protocol.md):',
      '  1. PRE-CHECK: verify local_test_confirmed=true in quest/active.txt for current QA',
      '  2. Clean .bak files: rm any *.bak_* in work repo (per 2026-05-23 rule)',
      '  3. git stash (preserve working tree)',
      '  4. git pull --ff-only origin <source-branch>  (MANDATORY — not optional)',
      '  5. git checkout -b mlk/<type>/<number>  (or [v2/v3] if rework)',
      '  6. git stash pop  (resolve conflicts if any)',
      '  7. git add <specific files only>  (NEVER -A, NEVER .)',
      '  7.5 READ .claude/commit-conventions.md FIRST (the format lives there — per-repo subject style + trailer rules). 2026-05-26 slip: drafted generic long-body commit ignoring the canonical subject-only "QA #<num> - <URUSAN> - <TUGASAN> - <description>" etanah format. Reading the file is mandatory before drafting.',
      '  8. PROPOSE commit message per convention → wait for みや confirm',
      '  9. AFTER confirm: git commit + git push (auto-runs per 2026-05-19)',
      '  10. Return to source-branch + git pull --ff-only + update active.txt',
      '  11. Emit Phase 1 summary line: `Phase 1 closed at <TS> · commit <SHA> · duration <accept→close>`',
      '  12. Invoke /verify Checklist C — cross-check the full sequence fired',
      '',
      'BANNED shortcuts:',
      '  - Skip pull step (caused 2026-05-11 QA-260139 slip)',
      '  - git add -A or git add . (over-staging risk)',
      '  - Silent commit without proposing message first',
      '  - Skip Phase 1 summary emission (mandatory per 2026-05-20)',
      '  - Skip /verify Checklist C',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
