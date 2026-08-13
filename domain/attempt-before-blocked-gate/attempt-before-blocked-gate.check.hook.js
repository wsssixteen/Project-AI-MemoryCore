/**
 * attempt-before-blocked-gate.check.hook.js — Stop hook (BLOCKING, exit 2)
 *
 * Bans the "claim-blocked-from-a-proxy-check" slip: declaring something
 * blocked / can't / unavailable / not-configured / unreachable WITHOUT first
 * running the actual operation and reading its real failure output.
 *
 * Built 2026-08-13 after #275009/#275152: Ruri declared both tickets "blocked —
 * no redmine.local.json" from a bare `ls` of the config path, and INSISTED on it
 * when miya pushed back — while redmine-sync.js worked on the FIRST real attempt
 * (the boot board already proved Redmine reachable). Ledger: assume-not-verify,
 * 30d=25 ESCALATION -> the tracker itself demanded "redesign the defender, do
 * not just reword" — so this BLOCKS (exit 2), it is not advisory.
 *
 * Rule: a proxy (an `ls` of a config file, the loaded-tool roster, a missing
 * env var) is NEVER evidence of a block. The only valid evidence is the actual
 * operation's own failure output, quoted.
 *
 * To proceed: either (a) delete the blocked/can't claim (you ran it, it worked),
 * or (b) add the bypass token carrying the REAL failure output:
 *     [verified-blocked: <command you ran> -> <its actual error output>]
 * The bypass is self-enforcing: it cannot be satisfied without having run the op.
 */
const CLAIM_PATTERNS = [
  /\b(can'?t|cannot|could ?n'?t|unable to|couldn'?t|no way to)\s+(retriev|sync|run|quer|fetch|pull|access|reach|read|load|connect|get)/i,
  /\bno\s+(?:\w+\s+)?(config(?:uration)?|credential|api[- ]?key|access|connection)\b/i,
  /\b(?:not\s+(?:available|reachable|configured|accessible|set ?up)|unavailable|unreachable|un-?configured)\b/i,
  /\bblocked\s+(?:on|by|-)\s+(?:config|retriev|missing|the\s+config|no\s)/i,
  /\bmissing\s+config(?:uration)?\b/i,
  /\bconfig(?:uration)?\s+(?:file\s+)?(?:is\s+)?(?:absent|missing|not\s+(?:present|there|found))\b/i,
];

// Require a retrieval/tool noun so domain uses of "blocked" (e.g. "tugasan
// blocked by status Gantung") don't trip the gate.
const CAP_CONTEXT = /\b(redmine|redmine-sync|sync|db|database|postgres|mcp|query|api|tool|credential|worktree|retriev|fetch|pull|\.local\.json)\b/i;

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const text = JSON.stringify(data);
    if (/\[verified-blocked\s*:/i.test(text)) process.exit(0);
    if (/\[skip-attempt-before-blocked\s*:/i.test(text)) process.exit(0);

    const claimHit = CLAIM_PATTERNS.some((re) => re.test(text));
    if (!claimHit) process.exit(0);
    if (!CAP_CONTEXT.test(text)) process.exit(0);

    const msg = [
      "⛔ attempt-before-blocked-gate: you claimed something is BLOCKED / can't / unavailable / not-configured",
      '   — but a proxy check (an `ls`, the loaded-tool roster, a missing env var) is NOT evidence of a block.',
      '',
      '   RUN THE ACTUAL OPERATION this turn and read its real output. Then either:',
      "     - it succeeded -> DELETE the blocked/can't claim, or",
      '     - it truly failed -> quote the real failure with the bypass token:',
      '         [verified-blocked: <command you ran> -> <its actual error output>]',
      '',
      '   Absence of a proxy (a file, a loaded tool, a roster entry) != absence of capability.',
      '   Built 2026-08-13 after the #275009/#275152 false-"blocked" (assume-not-verify 30d=25).',
      '   Genuinely not a capability claim? [skip-attempt-before-blocked: <reason>]',
    ].join('\n');
    process.stderr.write(msg + '\n');
    process.exit(2);
  } catch (e) {
    process.exit(0);
  }
});
