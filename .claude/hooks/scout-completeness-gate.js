/**
 * scout-completeness-gate.js — UserPromptSubmit hook
 *
 * Fires when (a) みや mentions Scout/familiar spawn for an active quest,
 * OR (b) the conversation shape suggests Recon emit is imminent
 * (trigger phrases: "let me recon", "running recon", "recon emit",
 * "verify each claim", "100% verify").
 *
 * Injects the 100%-VERIFY clause text (per `quest-protocol.md:545`) +
 * Universal Check 9 (sibling-structure read) reminder. Pairs with
 * `silent-claim-drift-gate.js` Stop-side check (Stage 5B blocks turn-end
 * if HYPOTHESIS rows have no paired VERIFIED follow-up).
 *
 * Created 2026-05-28 — plan `cached-floating-hummingbird.md` Phase 3.B.2.
 * Origin: yesterday's QA-262869 helper-mutation-bug — PSBS_Lulus
 * precedent existed in project doc since Phase 0 but was never read end-to-end
 * before Apply. UC9 sibling-structure read + 100%-VERIFY binding would have
 * caught it.
 */
let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').toString();

    const triggerPatterns = [
      /\b(scout|familiar)\s+(spawn|launch|invoke|run|spawning|launching)\b/i,
      /\b(running|emit(ting)?|do(ing)?)\s+recon\b/i,
      /\brecon\s+(block|emit|table)\b/i,
      /\bverify\s+(each|every)\s+claim\b/i,
      /\b100%\s*[-—:]?\s*verify\b/i,
      /\buniversal\s+check\b/i,
      /\bsibling[-\s]?structure\b/i,
    ];

    const hit = triggerPatterns.some(re => re.test(prompt));
    if (!hit) process.exit(0);

    const context = [
      '',
      '⚙️  scout-completeness-gate: Scout / Recon trigger detected',
      '',
      '100%-VERIFY clause (per quest-protocol.md:545, みや 2026-05-08):',
      '  For every file:line claim → READ the cited line range and QUOTE the actual code,',
      '  OR mark VERIFIED + brief-summary. For dispatch tables (switch / if-else / urusan-to-bean',
      '  mappings) trace ALL branches by reading the dispatch code — never paraphrase from filenames,',
      '  never guess from convention. みや: "I used the word 100% many many times. 100% Ruri."',
      '',
      'Universal Check 9 — Sibling-structure read (NEW 2026-05-28):',
      '  At Recon, enumerate 2-3 closest sibling implementations of the artifact being modified',
      '  (populator method / template SDT / data row format / config entry). Cite file:line for each.',
      '  Catches the helper-mutation-bug class of slip (QA-262869 root cause was unread PSBS_Lulus',
      '  precedent — would have surfaced at UC9 if check were enforced).',
      '',
      'Required Skill tool invocations at Recon emit:',
      '  → Skill: predicate-box  (per HYPOTHESIS claim — TRUE IF / PROVED BY / FAILED WHEN)',
      '  → Skill: claim-verification  (at hand-back, diff-back every "verified" claim)',
      '',
      'Recon emit MUST include Proactive surface section (3 items beyond what was asked,',
      '  or "no proactive items + reason") per Phase 3.B.0.',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
