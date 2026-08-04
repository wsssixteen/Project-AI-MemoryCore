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
 * Created 2026-05-23 — Phase 2 of system-layer build.
 * Source slips: QA-261986 (silent §6 reassignment claim, 2026-05-22) +
 * earlier session "done" claims without diff-backing.
 *
 * v1.1 2026-05-28 — Stage 5A advisory extension (plan Phase 5):
 * additionally scans the turn for `→ Skill: <name>` token (workflow runner
 * contract) and emits advisory reminder if the named skill wasn't invoked
 * via Skill tool this turn. Stage 5A = additionalContext only (advisory);
 * Stage 5B flip to decision:"block" is a separate later commit after
 * 1-2 sessions of advisory-mode observation. Bypass token:
 * `[skip-invoke <name>: <reason>]` (visible in transcript for audit).
 *
 * Also Stage 5A scans for HYPOTHESIS rows in Recon emits without paired
 * VERIFIED row (100%-VERIFY binding per Phase 3). Same advisory mode.
 *
 * Also Stage 5A scans for architecture-doc-sync violations: if turn
 * touched a system-component file (.claude hooks .js, .claude skills SKILL.md,
 * quest/quest-protocol.md, quest/active.txt, .claude/settings.json) AND
 * system/system-architecture.md was NOT edited this turn AND bypass token
 * `[skip-architecture-doc-update: ...]` absent → advisory reminder.
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

// Extension D (2026-06-20, みや): agreement / conclusion reflex — "you're right" etc.
// asserted WITHOUT verification evidence this turn = possible assume-not-verify.
const AGREEMENT_PATTERNS = [
  /\byou'?re (right|correct)\b/i,
  /\b(good catch|that'?s right|that'?s correct|that'?s it|that'?s the (bug|cause|issue|root cause))\b/i,
  /\b(confirmed|agreed|indeed|absolutely)\b/i,
];
const EVIDENCE_PATTERNS = [
  /"name"\s*:\s*"(Read|Grep|Glob|Bash|PowerShell)"/i,
  /mcp__postgres.*query|mcp__codegraph/i,
  /\bSELECT\b[\s\S]{0,80}\bFROM\b/i,
  /server\.?log/i,
  /\b[\w./\\-]+\.(java|xhtml|js|xml|json|md)\b[^\n]{0,12}:\d+/i,
  /\bgit (show|diff|log)\b/i,
  /\b(verified by reading|read-?back|grep (shows|found|returned|confirms)|node --check|eval PASS)\b/i,
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
    const hasBacking = BACKING_PATTERNS.some(re => re.test(text));

    // Stage 5A advisory extensions (plan Phase 5, 2026-05-28)

    // Extension A: workflow runner — scan for `→ Skill: <name>` tokens
    // and check if matching Skill tool call appeared in this turn's tool_use list
    const skillTokens = [];
    const tokenRe = /(?:→|->)\s*Skill\s*:\s*([a-z][a-z0-9_-]*)/gi;
    let m;
    while ((m = tokenRe.exec(text)) !== null) {
      skillTokens.push(m[1].toLowerCase());
    }
    // Tool-use entries in Stop hook payload typically appear as JSON-stringified objects.
    // Look for Skill tool invocations with `"name":"<skill>"` or `"skill":"<skill>"` shape.
    const invokedSkills = new Set();
    const invokeRe = /"(?:name|skill)"\s*:\s*"([a-z][a-z0-9_-]*)"/gi;
    while ((m = invokeRe.exec(text)) !== null) {
      invokedSkills.add(m[1].toLowerCase());
    }
    const missingSkills = skillTokens.filter(s => !invokedSkills.has(s));
    // Bypass token honoring
    const filteredMissing = missingSkills.filter(s => {
      const bypassRe = new RegExp('\\[skip-invoke\\s+' + s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\s*:', 'i');
      return !bypassRe.test(text);
    });

    // Extension B: 100%-VERIFY — scan for HYPOTHESIS rows without paired VERIFIED row
    // Simple heuristic: count HYPOTHESIS mentions vs VERIFIED mentions in Recon-shape sections
    const hypothesisCount = (text.match(/HYPOTHESIS/gi) || []).length;
    const verifiedCount = (text.match(/VERIFIED/gi) || []).length;
    const hasReconShape = /Recon|Universal Check/i.test(text);
    const verifyShortfall = hasReconShape && hypothesisCount > verifiedCount * 2;  // more than 2:1 ratio = suspicious

    // Extension C: architecture-doc-sync — system-component edit without arch-doc edit
    const editedSystemComponent = /tool_input.{0,200}(\.claude[\\\/]hooks[\\\/]\w+\.js|\.claude[\\\/]skills[\\\/][^"\\\/]+[\\\/]SKILL\.md|quest[\\\/]quest-protocol\.md|quest[\\\/]active\.txt|\.claude[\\\/]settings\.json)/i.test(text);
    const editedArchDoc = /tool_input.{0,200}system[\\\/]system-architecture\.md/i.test(text);
    const archDocBypass = /\[skip-architecture-doc-update\s*:/i.test(text);
    const archDocViolation = editedSystemComponent && !editedArchDoc && !archDocBypass;

    // If none of the conditions trigger, exit silently
    const claimDriftFire = hasClaim && !hasBacking;
    const agreementFire = AGREEMENT_PATTERNS.some(re => re.test(text)) && !EVIDENCE_PATTERNS.some(re => re.test(text));
    if (!claimDriftFire && filteredMissing.length === 0 && !verifyShortfall && !archDocViolation && !agreementFire) process.exit(0);

    const reminders = [''];
    if (claimDriftFire) {
      reminders.push(
        '⚙️  silent-claim-drift-gate: "done/complete" claim detected without diff-backing in this turn',
        '',
        'Honesty rule: any "done" / "complete" / "shipped" claim MUST be diff-backed',
        '  - cite file path(s) created/edited',
        '  - cite commit SHA if committed',
        '  - reference scope-anchor (what was the agreed scope; how does the diff stay within it)',
        ''
      );
    }
    if (filteredMissing.length > 0) {
      reminders.push(
        '⚙️  silent-claim-drift-gate (Stage 5A advisory): Skill-invocation drift detected',
        '',
        `Tokens "→ Skill: <name>" appeared in this turn for: ${filteredMissing.join(', ')}`,
        'But no matching Skill tool call appears in this turn\'s tool-uses.',
        '',
        'Required action: invoke the skill via Skill tool, OR include',
        `  [skip-invoke <name>: <one-line reason>]`,
        'in your message for legitimate skip cases. (Stage 5A = advisory, not blocking.',
        'Stage 5B will flip this to decision:"block" after observation period.)',
        ''
      );
    }
    if (verifyShortfall) {
      reminders.push(
        '⚙️  silent-claim-drift-gate (Stage 5A advisory): 100%-VERIFY shortfall in Recon emit',
        '',
        `Saw ${hypothesisCount} HYPOTHESIS mention(s) but only ${verifiedCount} VERIFIED — 100%-VERIFY`,
        'clause (quest-protocol.md:545) requires every HYPOTHESIS row paired with VERIFIED row',
        '(file:line cite) OR downgraded to BA-Q. Bypass: [skip-100-verify: <reason>].',
        ''
      );
    }
    if (archDocViolation) {
      reminders.push(
        '⚙️  silent-claim-drift-gate (Stage 5A advisory): architecture-doc-sync violation',
        '',
        'This turn edited a system component (hook/skill/protocol/state-file/settings.json)',
        'but did NOT edit system/system-architecture.md. Plan Phase 0 requires paired update.',
        'Bypass: [skip-architecture-doc-update: <reason>] (already in this turn? then ignore).',
        ''
      );
    }

    if (agreementFire) {
      reminders.push(
        '⚙️  silent-claim-drift-gate (Extension D — agreement/conclusion reflex): you concluded or agreed',
        '   ("you\'re right" / "that\'s the bug" / "confirmed") with NO verification evidence this turn.',
        '',
        '   Before concluding, confirm it is CORRECT / FACTUAL / JUSTIFIED — read the code, grep, run the',
        '   query, or reproduce. Reflexive agreement is the assume-not-verify pattern. If you DID verify',
        '   (or are just acknowledging みや\'s own correct point), ignore. Advisory — does not block.',
        ''
      );
    }

    const reminder = reminders.join('\n');

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
