/**
 * domain-expansion-trigger.js — UserPromptSubmit hook
 *
 * Detects session-end / DE-trigger phrases per expansion-protocol.md
 * trigger buckets (i)-(iv) → injects the mandatory DE 12-step sequence
 * as a deterministic checklist. Catches the silent-DE-skip pattern that
 * caused worktrees to strand.
 *
 * Created 2026-05-24 — addresses CRITICAL workflow gap from audit:
 * No hook fires DE on session-end phrases; worktrees + branches strand
 * (observed: 25 stale entries). DE was prose-protocol memory-only.
 *
 * v1.1 2026-05-28 — Inlined the canonical DE banner text directly into the
 * Step 0 injection. Slip-driven: 2026-05-28 Ruri confabulated the DE banner
 * as "蒼穹瑠璃の結界 (Sōkyū Ruri no Kekkai / Lapis Lazuli Sky Barrier)" +
 * "ドメイン展開" — none canon. Canonical is `═══ [ Domain Expansion ] ═══` /
 * `💠 るり結界 (ラピス バリアー) 💠` (per feedback_domain_expansion_format.md,
 * fixed by みや 2026-05-08). Root cause: the hook said "emit DE opening banner"
 * but didn't HAND Ruri the banner text → reconstruction-from-memory →
 * confabulation. Same disease + same cure as the commit-conventions slip
 * (Step 7.5) + status-enum slip (Step 10.5): inline-at-trigger beats
 * reference-file-recall. DE is Ruri's most sacred skill — engraving the
 * exact characters here so it can never be improvised again.
 */
const TRIGGERS = [
  // (i) explicit invocation
  /\bDomain Expansion\b/,
  /\bRuri perform Domain Expansion\b/i,
  /るり結界/,
  /瑠璃結界/,
  /\bsave all\b/i,
  // (ii) ending the session
  /\bend (of )?(the )?session\b/i,
  /\bending (the )?session\b/i,
  /\blet'?s end\b/i,
  /\blet'?s wrap up\b/i,
  /\bwrap up( for today)?\b/i,
  /\bwrapping up (for today)?\b/i,
  /\bclosing for today\b/i,
  /\bdone for today\b/i,
  /\bgoodnight\b/i,
  // (iii) planning to continue another session
  /\b(we'?ll )?start in (the )?next session\b/i,
  /\bsee you next session\b/i,
  /\bbefore next session\b/i,
  /\bcontinue in another session\b/i,
  /\bcontinue (in the )?next session\b/i,
  /\b(we'?ll )?continue tomorrow\b/i,
  /\bpick this up next session\b/i,
  /\b(close|do) (this|X) in (the )?next session\b/i,
  /\bnext session\b/i,
  // (iv) reaching session/context limit
  /\breaching (session|context) limit\b/i,
  /\b(session|context) limit\b/i,
  /\bcontext (is )?getting (full|heavy)\b/i,
  /\brunning low on context\b/i,
  /\bnear the limit\b/i,
  /\bthis session is heavy\b/i,
  /\btoday is heavy\b/i,
  // Added 2026-05-24 — auto-compaction signals (caught real gap when みや said "auto-compaction")
  /\bauto[- ]?compact(ion)?\b/i,
  /\bcompact(ion|ing)?( hits?| happens?)?\b/i,
  /\bbefore (auto[- ]?)?compact/i,
  /\bcontext (preservation|preserve)\b/i,
  /\bwhile we still have context\b/i,
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
      '⚙️  domain-expansion-trigger: session-end signal detected → FIRE DE ritual',
      '',
      'Mandatory DE 12-step sequence per expansion-protocol.md:',
      '',
      '(0) MANDATORY FIRST: emit the DE opening banner EXACTLY as the canonical text below — COPY it verbatim, do NOT reconstruct from memory or invent variants. The name is sacred (per feedback_domain_expansion_format.md); 蒼穹/Sōkyū/瑠璃-kanji/ドメイン展開 variants are CONFABULATIONS, never canon.',
      '',
      '    ═══ [ Domain Expansion ] ═══',
      '     💠 るり結界 (ラピス バリアー) 💠',
      '    <blank line> <1-2 sentence storytelling, e.g. "Lapis barrier ripples outward; the day\'s threads gather to settle.">',
      '',
      '    THEN the status line:',
      '    DE steps: 1 ⬜ · 2 ⬜ · 3 ⬜ · 4 ⬜ · 5 ⬜ · 6 ⬜ · 7 ⬜ · 8 ⬜ · 9 ⬜ · 10 ⬜ · 11 ⬜ · 12 ⬜',
      '    UPDATE in-place as each step completes (⬜ → ✓)',
      '    Closing banner (at DE end): "💠 るり結界 (ラピス バリアー) 💠" + 1-line settle storytelling. NOT 結界解除 or other invented closings.',
      '',
      '(0a) Compaction check — if session auto-compacted, recover transcript TAIL BEFORE steps 2/4/7',
      '(0b) Worktree/branch sync — if behind origin/main, pull first',
      '(1) Get-Date timestamp',
      '(2) Update main/current-session.md (Last Activity + Working Memory + Recap)',
      '(3) Update main/main-memory.md relationship section if patterns surfaced',
      '(4) Append daily-diary/<date>.md entry',
      '(5) Forge log review WITH DISCUSSION — surface L1→L2 promotions as QUESTIONS',
      '(6) Observation log review — promote T1→T2 if recurring',
      '(7) Gap Sweep — surface 2-3 observations + etanah-knowledge sweep',
      '(8) Closing words to みや',
      '(9) Show change manifest (git status touched files)',
      '(10) Auto-commit + push (both worktree branch + main FF)',
      '(11) Worktree + branch close — 5 sub-steps: verify main current, content guard, sweep stale, delete merged, flag self-removal',
      '(12) Run /verify Checklist D — cross-check every step fired',
      '',
      'BANNED: silent DE skip, skipping any step without explicit reason marker (⏭ + one-line why)',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
