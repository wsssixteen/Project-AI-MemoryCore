/**
 * show-gate.discipline.hook.js — Stop hook
 *
 * Power: domain/show-gate/
 *
 * PURPOSE (per みや 2026-06-18, "utmost, highest, perfect, absolute criteria"):
 * when a reply DISCUSSES a change / comparison / diff / finding / root-cause, it
 * MUST *show* it — a drawn box-diagram OR the actual code/SQL/diff in a fenced
 * block — not describe it in prose. This Stop hook hard-blocks the turn end when
 * the discussion is present but nothing is shown.
 *
 * BLOCK MECHANISM: Stop hook returns {"decision":"block","reason":...} → the model
 * does not stop; it must add the shown artifact (or the bypass) and continue.
 *
 * TRIGGER (must fire ONLY on genuine show-worthy work content):
 *   FIRES when last assistant text matches a strong change/compare/finding signal
 *   AND contains NO box-drawing chars AND NO fenced code block.
 * EXEMPT (never block):
 *   - bypass token  [skip-show-gate: <reason>]
 *   - Domain-Expansion / hand-back / closing turns (═══ banner · るり結界 · "Domain Expansion")
 *   - short replies (< 500 chars) — acknowledgements, quick answers
 * FAIL-OPEN: any parse/read error → allow stop (never trap the session).
 *
 * FALSE-POSITIVE COST: a work reply that genuinely discusses a change without a
 * diagram is blocked until a box/code-block is added or the bypass token used.
 * みや chose hard-block (over warn-only) knowingly — show-don't-tell is the bar.
 *
 * Created 2026-06-18 per みや, routed through /system-design + /system-rules.
 * Stop-side back-gate; the front-side discipline lives in CLAUDE.md §2 (diagram-
 * mandatory) — this makes it deterministic instead of prose-dependent.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');

const BOX_CHARS = /[┌┐└┘├┤┬┴┼─│╔╗╚╝╠╣╦╩╬]/;        // a drawn diagram
const CODE_FENCE = /```/;                              // actual code/SQL/diff shown
const EXEMPT = /\[skip-show-gate:|═══|るり結界|Domain Expansion/;

// Strong "I'm discussing a change/comparison/finding" signals
const SHOW_SIGNALS = [
  /\bbefore\b[\s\S]{0,40}\bafter\b/i,
  /\bvs\.?\b/i,
  /difference between/i,
  /the (root cause|fix|bug) (is|was)\b/i,
  /\boption [ab]\b/i,
  /\bchanged?\b[\s\S]{0,30}\bfrom\b[\s\S]{0,30}\bto\b/i,
  /\bUPDATE\b[\s\S]{0,80}\bSET\b/i,
  /\bSELECT\b[\s\S]{0,80}\bFROM\b/i,
  /\bdiff\b/i,
  /compared? to\b/i,
];

function lastAssistantText(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return null; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj;
    try { obj = JSON.parse(lines[i]); } catch (_) { continue; }
    const msg = obj.message || obj;
    if ((msg.role || obj.type) !== 'assistant') continue;
    const c = msg.content;
    let text = '';
    if (typeof c === 'string') text = c;
    else if (Array.isArray(c)) text = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
    if (text.trim()) return text;
  }
  return null;
}

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail }) + '\n'); } catch (_) {}
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    // Avoid infinite loop: if Stop hook already fired once this stop, don't re-block.
    if (data.stop_hook_active) process.exit(0);

    const text = lastAssistantText(data.transcript_path || '');
    if (!text || text.length < 500) process.exit(0);
    if (EXEMPT.test(text)) { process.exit(0); }
    if (BOX_CHARS.test(text) || CODE_FENCE.test(text)) { logFire('passed'); process.exit(0); }

    const matched = SHOW_SIGNALS.find(re => re.test(text));
    if (!matched) process.exit(0);

    logFire('blocked', String(matched));
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: [
        '⛔ show-gate: this reply discusses a change/comparison/finding but SHOWS nothing.',
        '   Add the actual content — a drawn box-diagram (┌─┐ │ └─┘) OR the real code/SQL/diff in a ``` block —',
        '   so what is being discussed is visible, not described. Then end the turn.',
        '   Genuinely nothing to show? Add [skip-show-gate: <reason>] and continue.',
        '   ⚡ DELTA ONLY: みや already read the reply above — output ONLY the missing content block; do NOT re-emit the reply.',
      ].join('\n'),
    }));
    process.exit(0);
  } catch (e) { process.exit(0); }
});
