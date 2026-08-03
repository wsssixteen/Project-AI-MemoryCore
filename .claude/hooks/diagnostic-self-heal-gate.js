/**
 * diagnostic-self-heal-gate.js — Stop hook
 *
 * Deterministic enforcement of the "diagnostic-skill self-heal" sub-rule
 * added to stalling-detector skill on 2026-05-25. Sub-rule alone failed
 * because it relied on model attention.
 *
 * Detects in Ruri's final response text:
 *   (a) Recent emit contains a /verify-shape table (`═══ VERIFY` banner or
 *       a row marked 🔴) AND
 *   (b) Closing lines contain "Need your go" / "Should I fix" / "Want me to" /
 *       "Awaiting your nod" / "Pending your approval" type stalling phrases
 *
 * When BOTH match, injects a visible-gate reminder forcing self-heal
 * instead of asking permission. Advisory; does NOT block (would over-fire
 * on legitimate destructive-action gating).
 *
 * Created 2026-05-25 — Phase 9 of system-layer build.
 * Source slip: 2026-05-25 Z13 — /verify reported stale observations doc
 * counts; instead of self-healing the non-destructive doc reconciliation,
 * Ruri emitted "Need your go to fix Z13". みや: "What is issue Z13? Can
 * you not self-heal this?" Sub-rule added to stalling-detector skill
 * same turn but skill is description-triggered → relies on attention
 * Ruri may not pay. This hook fires deterministically.
 *
 * Pairs with: stalling-detector SKILL.md (the procedure doc this hook
 * references), silent-claim-drift-gate.js (sibling Stop-hook advisory),
 * skill-invocation-discipline-gate.js (input-side counterpart).
 */

// Verify-shape signals: any indicates a diagnostic-skill emit occurred recently
const VERIFY_SHAPE_PATTERNS = [
  /═══ VERIFY/i,
  /\bN RED — stop, fix\b/i,
  /\| 🔴 \|/,
  /\| .{1,8} 🔴/,
  /\bverify reports?\b/i,
  /\b(\d+) RED\b/,
];

// Stalling shapes: asking permission instead of acting
const STALLING_PATTERNS = [
  /\bneed your go to fix\b/i,
  /\bneed your nod to fix\b/i,
  /\bshould I (fix|update|self-heal|patch|edit) (this|that|it|the)\b/i,
  /\bwant me to (fix|update|self-heal|patch|edit)\b/i,
  /\bawaiting your (nod|approval|go|confirm)\b/i,
  /\bpending your (nod|approval|go|confirm)\b/i,
  /\bsay the word and I'?ll fix\b/i,
  /\bif you want me to fix\b/i,
  /\bjust nod and I'?ll\b/i,
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    // Stop hook payload includes `response` or `assistant_message` depending on harness version;
    // try several shapes defensively
    const reply = (
      data.response ||
      data.assistant_message ||
      data.message ||
      data.text ||
      ''
    );
    if (!reply) process.exit(0);

    const verifyHit = VERIFY_SHAPE_PATTERNS.some(re => re.test(reply));
    if (!verifyHit) process.exit(0);
    const stallHit = STALLING_PATTERNS.some(re => re.test(reply));
    if (!stallHit) process.exit(0);

    const context = [
      '',
      '🚨  diagnostic-self-heal-gate fired: a /verify-shape emit AND a stalling phrase in the same response.',
      '',
      'Stalling-detector sub-rule (2026-05-25): when /verify reports 🔴 AND the fix is non-destructive AND no explicit gating reason → fix immediately. Do not ask permission.',
      '',
      'The diagnostic skill\'s "report only" rule constrains the SKILL\'s output — NOT Ruri\'s obligation as the calling agent to act on the findings. Conflating them is the trap.',
      '',
      'If the fix is GENUINELY gated (destructive op / multi-way candidates / outside Ruri\'s authority) — that\'s the allowed-bypass; emit the gate reason explicitly. Otherwise: self-heal in the NEXT turn before any further work.',
      '',
    ].join('\n');
    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
