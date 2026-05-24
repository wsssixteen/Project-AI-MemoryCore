/**
 * TurnChecklistGate.js — UserPromptSubmit hook
 *
 * Multi-topic prompt detection (≥2 numbered items OR multiple questions)
 * → injects reminder to emit "✅ This-turn checklist" at top of response.
 *
 * Created 2026-05-24, Task #18 — per みや's ADHD accommodation +
 * repeated ask for visible task tracking per turn.
 *
 * Trifecta:
 *   Goal:       Force visible per-turn task tracking on multi-topic prompts
 *   Guardrails: Skip trivial (<60 chars); filter false positives
 *   Grounded:   personality.md ADHD + No-answer-is-incomplete rule
 */
let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';
    if (prompt.length < 60) process.exit(0);

    const numberedItems = (prompt.match(/^\s*\d+\.\s/gm) || []).length;
    const questionMarks = (prompt.match(/\?/g) || []).length;
    const multiTopic = numberedItems >= 2 || questionMarks >= 2;
    if (!multiTopic) process.exit(0);

    const context = [
      '',
      '⚙️  TurnChecklistGate: multi-topic prompt detected',
      `   Numbered items: ${numberedItems} · Questions: ${questionMarks}`,
      '',
      'AT TOP of response: emit "## ✅ This-turn checklist" with each item as `- [ ] N. <item>`.',
      'AT END: mark [x] as addressed. Unaddressed → "Parked" section with reason.',
      'No-answer-is-incomplete: every numbered item MUST get a section anchor.',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
