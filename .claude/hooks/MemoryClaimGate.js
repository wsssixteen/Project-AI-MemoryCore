/**
 * MemoryClaimGate.js — UserPromptSubmit hook
 *
 * Detects when みや invokes a memory-claim phrase ("I thought we had",
 * "didn't we already", "isn't this already" etc.) → RED ALERT to verify
 * the claim extensively before responding. If claim true → take action.
 * If false → correct respectfully.
 *
 * Created 2026-05-24 evening — per みや's explicit ask:
 *   "Every time I say 'I thought we had...' should be a red alert.
 *    You should check if my memory is correct extensively & if true
 *    take actions against it."
 *
 * Trifecta:
 *   Goal:       Catch memory-claim drift before responding from assumption
 *   Guardrails: Phrase whitelist — only fire on memory-claim signals
 *   Grounded:   Forces Grep/Read verification of actual file state
 */
let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').toLowerCase();

    const memoryClaimPatterns = [
      /i thought we had/,
      /i thought we['']?ve/,
      /i thought we already/,
      /i thought we['']?d/,
      /didn['']?t we already/,
      /isn['']?t this already/,
      /haven['']?t we already/,
      /weren['']?t we already/,
      /aren['']?t we already/,
      /didn['']?t i (already )?(ask|say|tell|mention)/,
      /didn['']?t you (already )?(say|tell|do|implement|build)/,
      /already (covered|addressed|handled|solved|fixed|done|built|in place)/,
      /thought (this|that|it) (was|is) (already )?(in place|covered|done|handled)/,
    ];

    const matched = memoryClaimPatterns.some(re => re.test(prompt));
    if (!matched) process.exit(0);

    const context = [
      '',
      '🚨 MemoryClaimGate: RED ALERT — memory-claim phrase detected',
      '',
      'みや believes the system already covers something. Before responding:',
      '',
      '  1. IDENTIFY the specific claim — what exactly does みや think exists?',
      '  2. VERIFY extensively — Grep / Read / TaskList / git log the actual state',
      '  3. REPORT FINDING plainly:',
      '       - If TRUE  → acknowledge + take action (build the missing wire / fix the gap)',
      '       - If FALSE → correct respectfully + show evidence (file path, line, commit)',
      '       - If PARTIAL → name what exists vs what doesn\'t + propose closing the gap',
      '',
      '  4. NEVER respond from assumption. NEVER agree without grounding.',
      '',
      'Per みや 2026-05-24 evening: "Every time I say \'I thought we had\' should be a red alert."',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
