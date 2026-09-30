#!/usr/bin/env node
// pymtime-handover.check.hook.js — born via core/forge.js (2026-09-28)
// TRIGGER: miya pastes a PymTime HANDOVER block (===== PYMTIME HANDOVER v1 ===== ... ===== END PYMTIME HANDOVER =====) relayed from a colleague laptop
// ACTION: inject: invoke the pymtime skill and follow its Handover section before replying
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// NOD: miya 2026-09-28 — "YOU yourself need to be aware of this once I tell you even in a different session."
// The block is written by E:\Dev\scripts\PymTime\lib\handover.js (BEGIN/END constants there).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');

// Chat apps can add a leading space, a quote marker ("> ") or bold stars; match loosely on the words.
const BEGIN_RE = /={3,}\s*PYMTIME\s+HANDOVER\s+v\d+\s*={3,}/i;
const END_RE = /={3,}\s*END\s+PYMTIME\s+HANDOVER\s*={3,}/i;
const BYPASS_RE = /\[skip-pymtime-handover:\s*[^\]\s][^\]]*\]/i;

// → null (no handover) | { who, result, complete }
function detect(prompt) {
  prompt = String(prompt || '');
  if (!BEGIN_RE.test(prompt) && !END_RE.test(prompt)) return null;
  if (BYPASS_RE.test(prompt)) return null;
  const field = (name) => ((prompt.match(new RegExp('^[\\s>*_]*' + name + '\\s*:\\s*(.+)$', 'im')) || [])[1] || '').replace(/[*_]+$/, '').trim();
  return { who: field('Person') || 'unknown', result: field('Result') || 'no Result line', complete: BEGIN_RE.test(prompt) && END_RE.test(prompt) };
}

function contextFor(d) {
  return [
    '📨 pymtime-handover: a PymTime HANDOVER from a colleague\'s laptop was pasted.',
    '   Person: ' + d.who.slice(0, 80) + ' · Result: ' + d.result.slice(0, 160) + (d.complete ? '' : ' · ⚠️ block looks CUT (its first or END line is missing): say so and ask for the whole block'),
    '   → INVOKE the `pymtime` skill and follow its §Handover BEFORE replying: read the block, match the',
    '     signatures, verify against the E:\\Dev\\scripts\\PymTime source, give miya the cause + a sendable reply.',
  ].join('\n') + '\n';
}

if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'pymtime-handover', event: 'UserPromptSubmit' }, (input) => {
    let data = input;
    if (typeof input === 'string') { try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; } }
    const d = detect(data && data.prompt);
    if (!d) return { fired: false };
    return { fired: true, blocked: false, contextOut: contextFor(d) };
  });
}

module.exports = { detect, contextFor, BEGIN_RE, END_RE };
