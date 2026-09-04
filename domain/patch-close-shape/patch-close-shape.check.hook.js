#!/usr/bin/env node
// patch-close-shape.check.hook.js — born via core/forge.js (2026-09-02)
// TRIGGER: reply contains a fenced infra handoff block whose first line is 'Hi infra, please assist. Thank you.'
// ACTION: advise when greeting/#ticket not adjacent OR the handoff is not the closing block
//
// PURPOSE (per みや 2026-09-02, #277291 PLTP PROD data-patch close-out): a finished
// PROD data-patch reply must END with the infra handoff, in format. This session drifted
// 3× (handoff verbose / at the TOP not the end / blank line between greeting and #ticket),
// each caught only by みや. patch-script-gate checks the SQL pieces; nothing checked the
// reply ENVELOPE. This is that gate. Advisory v1 (/system-rules R4 — flip to block later).
//
// Layer HOOK-ONLY (R7) · Trigger MOMENT Stop, handoff lives only in assistant output (R8) ·
// STATE-SCOPE state-agnostic — handoff shape identical for every state (R11).
// Eval: node domain/patch-close-shape/patch-close-shape.eval.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const BYPASS = /\[skip-patch-close-shape:/;
const GREETING = /^Hi infra,\s*please assist\.\s*Thank you\.$/i;
const TICKET_LINE = /^#\d+:\s*\S/;

function fencedBlocks(text) {
  const re = /```[\w]*\r?\n([\s\S]*?)```/g;
  const blocks = [];
  let m;
  while ((m = re.exec(text)) !== null) blocks.push({ inner: m[1], endIndex: re.lastIndex });
  return blocks;
}

function firstContentLine(inner) {
  for (const l of inner.split(/\r?\n/)) { if (l.trim()) return l.trim(); }
  return '';
}

function lastAssistantText(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return null; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj; try { obj = JSON.parse(lines[i]); } catch (_) { continue; }
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

// Pure core — exported for the eval fixtures.
function evaluate(text) {
  if (!text || BYPASS.test(text)) return { fire: false, advisories: [] };
  const handoffBlocks = fencedBlocks(text).filter(b => GREETING.test(firstContentLine(b.inner)));
  if (handoffBlocks.length === 0) return { fire: false, advisories: [] };

  const block = handoffBlocks[handoffBlocks.length - 1];   // the LAST handoff block
  const advisories = [];

  // CHECK A — greeting -> #ticket adjacency (no blank line between)
  const lines = block.inner.split(/\r?\n/);
  let gi = -1;
  for (let i = 0; i < lines.length; i++) { if (GREETING.test(lines[i].trim())) { gi = i; break; } }
  const nextLine = gi >= 0 && gi + 1 < lines.length ? lines[gi + 1].trim() : '';
  if (!TICKET_LINE.test(nextLine)) {
    advisories.push([
      'patch-close-shape CHECK A — greeting/#ticket adjacency.',
      '   The "#<ticket>:" line must come IMMEDIATELY after "Hi infra, please assist. Thank you."',
      '   — no blank line between them. Format (feedback_prod_patch_infra_handoff.md):',
      '     Hi infra, please assist. Thank you.',
      '     #<ticket>: <urusan + outcome, one short line>',
      '     <blank line>',
      '     <SQL patch> ... -- N row(s) updated',
    ].join('\n'));
  }

  // CHECK B — handoff is the closing block (nothing substantive after it)
  const after = text.slice(block.endIndex).replace(/[\s>*_`#-]/g, '').trim();
  if (after.length > 0) {
    advisories.push([
      'patch-close-shape CHECK B — infra handoff must be the CLOSING block.',
      '   Substantive content follows the handoff. For a PROD data-patch close-out the handoff',
      '   is the LAST thing in the reply, so みや can copy the tail and send it. Move it to the',
      '   very end (after the "DO THIS" actions).',
    ].join('\n'));
  }

  return { fire: advisories.length > 0, advisories };
}

if (require.main === module) {
  runHook({ name: 'patch-close-shape', event: 'Stop' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    if (data.stop_hook_active) return { fired: false };
    const text = lastAssistantText(data.transcript_path || '');
    if (!text || text.length < 200) return { fired: false };
    const { fire, advisories } = evaluate(text);
    if (!fire) return { fired: false };
    advisories.push('   Bypass: [skip-patch-close-shape: <reason>].');
    return { fired: true, blocked: false, contextOut: advisories.join('\n\n') + '\n' };
  });
}

module.exports = { evaluate, fencedBlocks, firstContentLine, GREETING, TICKET_LINE };
