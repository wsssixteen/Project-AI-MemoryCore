/**
 * over-generalization-gate.js — Stop hook
 *
 * WHY: the `over-generalization-check` skill (description-triggered) is
 *   unenforced by any deterministic hook — a broad-quantifier claim
 *   ("this is true for all urusan", "every template does X", "semua
 *   urusan") can ship in an assistant reply with zero enumeration evidence
 *   behind it. This has escalated 2x (wrong-baseline generalization applied
 *   to a ticket without checking the current ticket had the same shape).
 *   Prose-only skill triggers are known to slip (same failure class as the
 *   2026-05-25 ghost-hook audit + rcrl-emit-check.js's own rationale) —
 *   a Stop-hook backstop catches the case where the skill should have
 *   fired but didn't.
 *
 * WHAT: scans the LAST ~8000 chars of the assistant's transcript text for
 *   a broad-quantifier claim (English + Malay forms: "all X", "every X",
 *   "always the same", "semua urusan", "in every case", "none of the",
 *   etc.). If found AND no nearby enumeration evidence (a digit-count like
 *   "16 of", "247 templates", a markdown table, or a "grep -c"/"grep -l"
 *   citation) appears in the same window — emit a <=3-line advisory naming
 *   the exact matched claim + demanding enumerate-or-narrow.
 *
 * CAN: read stdin transcript JSON, regex-scan text, emit stdout/stderr
 *   advisory context. CANNOT: block the turn (ADVISORY v1 only, fail-open),
 *   verify the claim's truth, distinguish a properly-hedged claim it didn't
 *   recognize as hedged.
 *
 * Bypass: include `[skip-overgen: <reason>]` anywhere in the message.
 *
 * Pairs with: rcrl-emit-check.js (same Stop-hook backstop family, same
 *   stdin/output idiom), over-generalization-check skill (the primitive
 *   this hook backstops).
 */
const fs = require('fs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function getLastAssistantText(raw) {
  // Accept either a raw transcript string or a JSON blob with a
  // `transcript` / `message` style field — mirror rcrl-emit-check.js's
  // tolerant "just treat stdin as text" approach, but try JSON first.
  let text = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') text = parsed;
    else if (parsed && typeof parsed.transcript_path === 'string') {
      // Stop payload is {transcript_path} — read the FILE (fix 2026-07-03, controller smoke caught stdin-as-content defect)
      try { text = fs.readFileSync(parsed.transcript_path, 'utf-8'); } catch { text = ''; }
    }
    else if (parsed && typeof parsed.transcript === 'string') text = parsed.transcript;
    else if (parsed && typeof parsed.message === 'string') text = parsed.message;
    else text = raw;
  } catch {
    text = raw;
  }
  return text || '';
}

function hasBypass(text) {
  return /\[skip-overgen:\s*[^\]]+\]/i.test(text);
}

const QUANTIFIER_PATTERN = new RegExp(
  '\\b(all urusan|every urusan|semua urusan|all templates?|every template|' +
  'all tugasan|every tugasan|all cases|every case|in every case|' +
  'always the same|never happens|none of the|all of them|every time|' +
  'across the board|universally|in all instances|every instance)\\b',
  'i'
);

const ENUMERATION_EVIDENCE_PATTERN = new RegExp(
  '(\\b\\d+\\s*(of|\\/)\\s*\\d+\\b)' +          // "16 of 20", "16/20"
  '|(\\b\\d+\\s*(templates?|urusan|tugasan|cases|files|rows|matches)\\b)' + // "247 templates"
  '|(grep\\s+-[a-zA-Z]*c[a-zA-Z]*\\b)' +         // grep -c
  '|(grep\\s+-[a-zA-Z]*l[a-zA-Z]*\\b)' +         // grep -l
  '|(\\|\\s*.+\\|)' +                             // a markdown table row
  '|(\\bcount\\s*[:=]\\s*\\d+\\b)',
  'i'
);

function main() {
  const raw = readStdin();
  const text = getLastAssistantText(raw);
  if (!text) return;

  const window = text.slice(-8000);

  if (hasBypass(window)) return;

  const claimMatch = window.match(QUANTIFIER_PATTERN);
  if (!claimMatch) return;

  if (ENUMERATION_EVIDENCE_PATTERN.test(window)) return;

  console.log(`⚠️  over-generalization-gate: broad-quantifier claim detected — "${claimMatch[0]}"`);
  console.log('   No enumeration evidence found nearby (digit count / table / grep -c|-l). Per over-generalization-check skill: enumerate or narrow the claim.');
  console.log('   Bypass: `[skip-overgen: <one-line reason>]`');
}

try { main(); } catch (e) {
  process.stderr.write(`over-generalization-gate error: ${e.message}\n`);
}
