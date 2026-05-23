/**
 * silent-claim-drift-gate.js — Stop hook
 *
 * Catches the "silent-claim-drift" slip category (5 occurrences in 14-day
 * baseline — declared "done" / "complete" / "shipped" without diff-backing,
 * silent task reassignment, scope drift).
 *
 * Inspects Claude's reply text for "done" / "complete" / "shipped" claims;
 * if such claims appear without scope-anchor reference + diff-backing,
 * emits a visible-gate reminder (advisory, does NOT block — would trip on
 * legitimate uses; Ruri sees the reminder and self-corrects).
 *
 * Created 2026-05-23 — Phase 2 of meta-layer build.
 * Source slips: QA-261986 (silent §6 reassignment claim, 2026-05-22) +
 * earlier session "done" claims without diff-backing.
 */
const CLAIM_PATTERNS = [
  /\b(it'?s|is|are|now) (done|complete|completed|shipped|finished|fixed)\b/i,
  /\b(✓|✅) (done|complete|shipped|fixed)\b/i,
  /\bI'?ve (completed|finished|shipped|fixed|done)\b/i,
  /\bPhase \d+\s*✅\s*complete\b/i,
];

const BACKING_PATTERNS = [
  /\bdiff\b/i,
  /\bcommit [a-f0-9]{6,}/i,
  /\bfile (created|written|updated|edited)\b/i,
  /\bcommitted\b/i,
  /\bgit (show|log|diff)\b/i,
  /\bfile_path/i,
  /scope[-_ ]?anchor/i,
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    // Stop hook receives transcript or last assistant message
    const text = JSON.stringify(data);  // scan everything in payload

    const hasClaim = CLAIM_PATTERNS.some(re => re.test(text));
    if (!hasClaim) process.exit(0);

    const hasBacking = BACKING_PATTERNS.some(re => re.test(text));
    if (hasBacking) process.exit(0);  // claim has backing → fine

    // Claim without backing — emit reminder via feedback channel
    const reminder = [
      '',
      '⚙️  silent-claim-drift-gate: "done/complete" claim detected without diff-backing in this turn',
      '',
      'Honesty rule: any "done" / "complete" / "shipped" claim MUST be diff-backed',
      '  - cite file path(s) created/edited',
      '  - cite commit SHA if committed',
      '  - reference scope-anchor (what was the agreed scope; how does the diff stay within it)',
      '',
      'If the claim was about a substantive deliverable (not just "task #N completed"),',
      'add the backing now. If it was about task tracking, this gate may have over-fired —',
      'log to skill-failure-log so the matcher can be tuned.',
      '',
    ].join('\n');

    // Use feedback (additionalContext) — advisory, does not block
    const response = {
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext: reminder,
      },
    };
    process.stdout.write(JSON.stringify(response));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
