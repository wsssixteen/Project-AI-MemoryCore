/**
 * full-address-trace-gate.discipline.hook.js — Stop hook (BLOCKING)
 *
 * Feature: domain/full-address-trace-gate/
 *
 * PURPOSE: every code reference in a trace / class chain must be GREPPABLE by
 * みや on his own:
 *   - files → <repo>\<full\path>\<File>.<ext>:<line>  (name which repo)
 *   - methods → <ClassName>.<method>():<line>  — NEVER a bare method
 *
 * PROMOTED 2026-07-06 (background task): ADVISORY → BLOCKING per みや.
 *   Fires 6+ times/day on the same slip (QA-268883 session). The advisory nag-
 *   then-correct loop wastes みや's time — the offending emit reaches him
 *   before the correction lands. Blocking rejects the emit BEFORE それ leaves
 *   Ruri, forcing the rewrite to happen inline.
 *
 * BLOCK MECHANISM: Stop hook returns {"decision":"block","reason":...} → the
 * model does not stop; it must add the full-address form (or the bypass) and
 * continue. Rule-6-v1.2 compliant (spec preserved · fire check + effect check
 * in eval.js).
 *
 * TRIGGER: reply looks like a trace / class-chain
 *   - ≥2 code refs with `:<line>` suffix
 *   - AND arrows (↓ | →) OR the words "class chain" | "trace"
 * OFFENDERS (both regex families):
 *   (A) bare filename with :line but NO path (no `/` or `\` before it)
 *   (B) method():line NOT preceded by a `Class.` → bare method
 *
 * EXEMPT (never block):
 *   - bypass token  [skip-full-address: <reason>]     (preserved from advisory era)
 *   - Domain-Expansion / closing / banner turns       (═══, るり結界, "Domain Expansion")
 *   - `stop_hook_active` (already fired this stop — avoid infinite loop)
 *   - short replies (< 400 chars) — acknowledgements, quick answers
 * FAIL-OPEN: any parse/read error → allow stop (never trap the session).
 *
 * FALSE-POSITIVE COST: a trace-shaped reply with bare refs is blocked until
 * Ruri rewrites to full-address or uses the bypass. Cost = one extra rewrite
 * turn on the (rare) case where the reference genuinely can't be full-addressed
 * (e.g. quoting a retracted prior emit verbatim). みや chose blocking knowingly
 * after the QA-268883 6-times-in-one-session pattern.
 *
 * DESIGN CONSULT: routed through /system-design + /system-rules 2026-07-06.
 *   Verdict: BLOCKING Stop hook only (no pre-emit skill — the block already
 *   rejects the emit before send; a pre-emit skill = ceremony).
 *
 * Original advisory-era hook lived at .claude/hooks/full-address-trace-gate.js
 * (2026-07-01, QA-267976). Relocated to Feature folder + promoted here.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');

const EXEMPT = /\[skip-full-address:|═══|るり結界|Domain Expansion/;

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

function findOffenders(text) {
  const offenders = [];
  // (A) bare filename with :line but NO path separator preceding it.
  const fileRe = /(^|[^\w/\\.-])([A-Za-z0-9_-]+\.(?:xhtml|java|js|ts|jsx|tsx|css|scss)):(\d+)/g;
  let m;
  while ((m = fileRe.exec(text)) !== null) {
    offenders.push(`bare file (needs path + repo): ${m[2]}:${m[3]}`);
  }
  // (B) method():line NOT preceded by a `Class.` → bare method.
  const methRe = /(^|[^.\w])([a-z][A-Za-z0-9_]*)\((?:[^)]*)\):(\d+)/g;
  while ((m = methRe.exec(text)) !== null) {
    offenders.push(`bare method (needs Class.): ${m[2]}():${m[3]}`);
  }
  return offenders;
}

function looksLikeTrace(text) {
  const refCount = (text.match(/:\d+\b/g) || []).length;
  if (refCount < 2) return false;
  return /[↓→]/.test(text) || /class chain|\btrace\b/i.test(text);
}

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail }) + '\n'); } catch (_) {}
}

// Public for eval.js — pure function, no I/O.
function evaluate(text) {
  if (!text || text.length < 400) return { verdict: 'silent', reason: 'short' };
  if (EXEMPT.test(text)) return { verdict: 'silent', reason: 'exempt' };
  if (!looksLikeTrace(text)) return { verdict: 'silent', reason: 'not-trace' };
  const offenders = findOffenders(text);
  if (offenders.length === 0) return { verdict: 'passed', reason: 'clean' };
  return { verdict: 'blocked', offenders: [...new Set(offenders)].slice(0, 8) };
}
module.exports = { evaluate, findOffenders, looksLikeTrace };

// Only run the Stop-hook logic when executed as the main script.
// When require()d from eval.js, only the module.exports above is used.
if (require.main === module) {
  let input = '';
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => (input += d));
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      // Avoid infinite loop: if Stop hook already fired once this stop, don't re-block.
      if (data.stop_hook_active) process.exit(0);

      const text = lastAssistantText(data.transcript_path || '');
      const result = evaluate(text);
      if (result.verdict === 'silent') { process.exit(0); }
      if (result.verdict === 'passed') { logFire('passed'); process.exit(0); }

      logFire('blocked', result.offenders);
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: [
          '⛔ full-address-trace-gate: your trace has un-greppable code reference(s).',
          '   みや must be able to grep straight to each node himself. Fix each to a FULL address:',
          '     • file → <repo>\\<full\\path>\\<File>.<ext>:<line>  (name which repo — pelupusan / common / awam)',
          '     • method → <ClassName>.<method>():<line>  — NEVER a bare method',
          ...result.offenders.map(o => `   - ${o}`),
          '   Genuinely un-addressable (quoting a retracted emit, etc.)? Add [skip-full-address: <reason>] and continue.',
        ].join('\n'),
      }));
      process.exit(0);
    } catch (e) { process.exit(0); }
  });
}
