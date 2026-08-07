#!/usr/bin/env node
// scope-claim-census.check.hook.js — born via core/forge.js (2026-08-07)
// TRIGGER: reply contains a scope claim bound to a system noun (no other urusan / the only caller /
//          only PT is / nothing else is affected) AND carries no census citation
// ACTION: BLOCK the stop; demand the count inline — denominator (0 of 102), the query, grepped+N,
//         or an explicit 0 rows; bypass [skip-scope-census: <reason>]
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// WHY (みや 2026-08-07, #273455 cycle-2 — "FIX THIS BEHAVIOUR OF NOT UNDERSTANDING AND SLIPPING
// THE TICKET EVEN THOUGH YOU'VE READ IT"). Three assertions in one thread, each made BEFORE any
// census, each reaching him before a correction did:
//   1. "the fix is PT only"                          → true, for a reason I invented
//   2. "other urusan don't collect sempadan at all"  → WRONG: 4 urusan do, 102 rows.
//                                                       I had counted the wrong table.
//   3. "the Awam panel only appears on the PT path"  → never read the code
// The prose lesson has existed since 2026-07-21 ("count the instances before stating a
// convention") and never fired. This is its mechanical form.
//
// A scope claim is a HYPOTHESIS ABOUT THE DATA until it is counted.
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const fs = require('fs');

const EXEMPT = /\[skip-scope-census:|═══|るり結界|Domain Expansion/;

const SYSTEM_NOUN =
  'urusan|module|table|column|callers?|call-?sites?|screens?|fields?|rows?|tugasan|branch|files?|writers?|populators?';

const SCOPE_CLAIM = [
  new RegExp(`\\bno other\\s+(?:${SYSTEM_NOUN})`, 'i'),
  new RegExp(`\\bthe only\\s+(?:${SYSTEM_NOUN})`, 'i'),
  new RegExp(`\\bnone of the\\s+(?:${SYSTEM_NOUN})`, 'i'),
  new RegExp(`\\bevery other\\s+(?:${SYSTEM_NOUN})`, 'i'),
  new RegExp(`\\b(?:${SYSTEM_NOUN})\\s+(?:is|are)\\s+not affected\\b`, 'i'),
  /\bnothing else\s+(?:is|are|was|were)\s+affected\b/i,
  /\b(?:[Ii]t|[Tt]he fix|[Tt]his)\s+is\s+only\s+[A-Z]{2,7}\b/,
  /\b[Oo]nly\s+[A-Z]{2,7}\s+(?:is|are|has|have|collects?|uses?|loses?)\b/,
];

const EVIDENCE = [
  /\b\d+\s*(?:of|\/)\s*\d+\b/,                 // 0 of 102 · 38/49
  /\bcount\(\*\)/i,
  /\bSELECT\b[\s\S]{0,400}\bFROM\b/i,
  /\bcensus\b/i,
  /\bgrepp?ed\b[^\n]{0,80}\d+/i,
  /\benumerated\b[^\n]{0,80}\d+/i,
  /\b0\s+(?:rows|matches|hits|results)\b/i,
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

// Quoted material is みや's or the BA's assertion, never mine.
function stripQuotes(text) {
  return text
    .split(/\r?\n/)
    .filter(l => !/^\s*>/.test(l))
    .join('\n')
    .replace(/\*"[^"]*"\*/g, '')
    .replace(/“[^”]*”/g, '');
}

function findClaims(text) {
  const body = stripQuotes(text);
  const hits = [];
  for (const re of SCOPE_CLAIM) {
    const m = body.match(re);
    if (m) hits.push(m[0].trim());
  }
  return [...new Set(hits)];
}

const hasEvidence = (text) => EVIDENCE.some(re => re.test(text));

// Pure — consumed by the eval.
function evaluate(text) {
  if (!text || text.length < 400) return { verdict: 'silent', reason: 'short' };
  if (EXEMPT.test(text)) return { verdict: 'silent', reason: 'exempt' };
  const claims = findClaims(text);
  if (claims.length === 0) return { verdict: 'silent', reason: 'no-scope-claim' };
  if (hasEvidence(text)) return { verdict: 'passed', reason: 'census-cited' };
  return { verdict: 'blocked', claims: claims.slice(0, 5) };
}

module.exports = { evaluate, findClaims, hasEvidence };

if (require.main === module) {
  runHook({ name: 'scope-claim-census', event: 'Stop' }, (input) => {
    let data = {};
    try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    if (data.stop_hook_active) return { fired: false };

    const text = lastAssistantText(data.transcript_path || '');
    const result = evaluate(text);
    if (result.verdict !== 'blocked') return { fired: false };

    return {
      fired: true,
      blocked: true,
      contextOut: [
        '⛔ scope-claim-census: you claimed something about a POPULATION without citing the count.',
        '   A scope claim is a hypothesis about the data until it is counted. Claimed:',
        ...result.claims.map(c => `   - "${c}"`),
        '',
        '   Run the census, then cite it inline — any ONE of these clears the gate:',
        '     - count with a denominator     "lost 0 of 102" / "38/49"',
        '     - the query itself             SELECT ... count(*) ... GROUP BY',
        '     - grepped/enumerated + number  "grepped X -> 13 call-sites"',
        '     - explicit negative            "0 rows" / "0 matches"',
        '',
        '   2026-08-07 #273455: "other urusan do not collect sempadan at all" was asserted twice',
        '   before any census. Four urusan do — 102 rows. The count took one query.',
        '   Genuinely uncountable? [skip-scope-census: <reason>] and say what you could not count.',
        '',
      ].join('\n'),
    };
  });
}
