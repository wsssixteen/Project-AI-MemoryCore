/**
 * ask-back-gate.js — Stop hook
 *
 * Catches the recurring "stop-instead-of-action" / ask-back slip: ending a
 * reply by offering choices or asking permission for something Ruri could
 * just DO or SEARCH (DB query, grep, code read, local repro) instead of
 * finishing the work.
 *
 * Built 2026-05-29 after stop-instead-of-action RECURRED: it was logged
 * 2026-05-28 with rules added to personality.md ("No asking-back for
 * searchable facts") + quest Debug Ritual 5, yet recurred on QA-262243 —
 * Ruri stopped at one unread code path + offered "which would you like"
 * when みや had already said FINISH / check the rest. Per auto-skill Step 5
 * escalation: a recurrence means redesign the defender with a deterministic
 * gate, not another wording refinement. This is that gate.
 *
 * Advisory (additionalContext, non-blocking) — choice-offering is sometimes
 * legitimate (a genuine fork only みや can decide). The hook surfaces the
 * pattern at Stop-time so Ruri self-checks rather than reflexively asking.
 *
 * v1.1 (2026-06-02 per みや Bundle F): strengthened reminder text + added
 * detection of "decision-required" keywords in the response. When the
 * response contains NO decision-required signal (no destructive op cited,
 * no external info needed, no manual UI step), the ask-back is presumptively
 * BANNED — reminder text escalates accordingly. Full block-mode flip (exit 2)
 * deferred until false-positive rate is observed.
 *
 * Bypass: include [genuine-fork: <reason>] in the message.
 */
const ASKBACK_PATTERNS = [
  /\b(want me to|shall i|should i|would you like(?: me to)?|do you want me to)\b/i,
  /\bwhich (?:one )?(?:would|do) you (?:like|want|prefer|choose)\b/i,
  /\b(?:let me know|tell me) (?:if|whether|which|what)\b/i,
  /\bi can [^.?!]{0,50} if you (?:want|like|prefer|'?d like)\b/i,
  /\bor stop here(?: for now)?\b/i,
  /\byour call\b/i,
  /\bwould you like[^?]*\?/i,
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const text = JSON.stringify(data);
    if (/\[genuine-fork\s*:/i.test(text)) process.exit(0);
    const hit = ASKBACK_PATTERNS.some((re) => re.test(text));
    if (!hit) process.exit(0);
    // v1.1: check for decision-required signals — if present, ask-back may be legitimate
    const DECISION_KEYWORDS = [
      /\b(?:destructive|delete|drop|truncate|rm |force[- ]push|reset --hard)\b/i,
      /\b(?:approve|confirm|nod|sign[- ]off|authorize)\b/i,
      /\b(?:manual|in word|via UI|in browser|click submit)\b/i,
      /\b(?:external info|need from you|only you can)\b/i,
    ];
    const hasDecisionSignal = DECISION_KEYWORDS.some((re) => re.test(text));
    const escalation = hasDecisionSignal
      ? '(advisory only — decision-required signal detected in your reply)'
      : '🚨 NO decision-required signal detected — this ask-back is presumptively BANNED. Search/finish before stopping.';
    const reminder = [
      '',
      '⚙️  ask-back-gate v1.1: your reply offers a choice / asks permission — self-check BEFORE stopping.',
      escalation,
      '',
      'No-asking-back rule (personality.md "No asking-back for searchable facts" + quest Debug Ritual 5):',
      '  - Is the open item answerable by a tool you hold (DB query / grep / code read / repro)? → DO IT NOW, do not ask.',
      '  - Did みや say "finish" / "check the rest" / "exhaust"? → finishing is MANDATORY, not optional.',
      '  - Hand back ONLY a genuine decision: destructive op, external info, manual UI step you cannot perform.',
      '',
      'If this IS a genuine fork only みや can decide, add [genuine-fork: <reason>] to your message.',
      '',
    ].join('\n');
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: { hookEventName: 'Stop', additionalContext: reminder },
      })
    );
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
