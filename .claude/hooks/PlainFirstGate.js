/**
 * PlainFirstGate.js — UserPromptSubmit hook
 *
 * Detects when みや asks an explanation question ("what is", "where did",
 * "explain plainly", "why X", "what are these" etc.) → injects reminder
 * to lead with 1-2 plain-language sentences BEFORE any table / code /
 * file:line citation / technical jargon.
 *
 * Created 2026-05-24 evening — converts the prose rule in
 * `auto-memory/feedback_investigation_style.md` (Strengthening 2026-05-13:
 * "explanation never starts with a table") into a deterministic gate.
 *
 * Slip case: 2026-05-24 evening — みや asked "what are these, where did
 * they come from?" and I led with a Bash investigation table + diffs
 * instead of plain English. The rule existed; it didn't fire.
 *
 * Trifecta:
 *   Goal:       Force plain-first answer structure on explanation prompts
 *   Guardrails: Skip non-explanation prompts; skip very short asks
 *   Grounded:   feedback_investigation_style.md + 2026-05-13 みや strengthening
 */
let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').toLowerCase();
    if (prompt.length < 15) process.exit(0);

    const explanationPatterns = [
      /what (are|is) (this|that|these|those|it)/,
      /what does (this|that|it) (mean|do)/,
      /where (did|do|does) (this|that|these|those|it|they) come from/,
      /where (did|do|does) (this|that|these|those|it|they) (originate|get)/,
      /explain plainly/,
      /explain (in )?plain/,
      /plainly[,.!? ]/,
      /^(why|how come) /,
      /^why is /,
      /^why does /,
      /^why are /,
      /(can you )?(please )?(tell|explain|describe|clarify) (me|to me|us)/,
      /i don['']?t understand/,
      /what do you mean/,
      /what['']?s the difference/,
    ];

    const matched = explanationPatterns.some(re => re.test(prompt));
    if (!matched) process.exit(0);

    const context = [
      '',
      '📖 PlainFirstGate v1.1: explanation prompt detected',
      '',
      'BEFORE any table / code block / file:line citation / technical jargon —',
      'lead with 1-2 sentences in plain everyday language answering the WHAT and WHY.',
      '',
      'Then (and only then) follow with the technical/evidence layer below.',
      '',
      '🚨 BANNED pre-lede patterns (added 2026-06-02 per みや Bundle H — workflow eval surfaced these):',
      '  - "This is a general/X question, not tied to Y" preamble before the lede',
      '  - Meta-disclaimer about the question shape before answering it',
      '  - "I notice you\'re asking about..." reflection before the actual answer',
      '  → The lede must BE the answer, not preamble ABOUT the answer.',
      '',
      'Per feedback_investigation_style.md (strengthened 2026-05-13):',
      '  "Tables NEVER replace prose. Every explanation opens with 1-2 plain-language',
      '   sentences describing the WHAT and the WHY in everyday words (no jargon,',
      '   no symbols, no file:line cites in the lede). THEN tables/lists/code follow."',
      '',
      'Self-check before emitting: is the first thing みや reads a plain prose sentence',
      'that DIRECTLY answers the question? Or is it: a table / code / file:line / OR a',
      'meta-disclaimer about the question? Any of the latter → restructure.',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
