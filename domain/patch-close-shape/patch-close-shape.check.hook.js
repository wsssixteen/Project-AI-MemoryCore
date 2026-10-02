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

// CHECK C trigger — the reply ROUTES a PROD patch script to infra (a <ticket>.sql + PROD + a send-to-infra verb).
const PATCH_SQL = /\b\d{6}\.sql\b/;
const PROD = /\bPROD\b/;
const INFRA_ROUTE = /\b(send|hand|give|pass|forward)\b[^\n]{0,250}\binfra\b|\binfra\b[^\n]{0,20}\b(runs?|to run|executes?|will run)\b/i;

// Pure core — exported for the eval fixtures.
function evaluate(text) {
  if (!text || BYPASS.test(text)) return { fire: false, advisories: [] };
  const handoffBlocks = fencedBlocks(text).filter(b => GREETING.test(firstContentLine(b.inner)));
  if (handoffBlocks.length === 0) {
    // CHECK C — PROD patch routed to infra with NO handoff block (the silent-pass hole, #281638 2026-09-28)
    if (PATCH_SQL.test(text) && PROD.test(text) && INFRA_ROUTE.test(text)) {
      return { fire: true, block: true, advisories: [[
        'patch-close-shape CHECK C — PROD patch goes to infra but the reply has NO infra handoff block.',
        '   End the reply with the handoff (feedback_prod_patch_infra_handoff.md):',
        '     Hi infra, please assist. Thank you.',
        '     #<ticket>: <urusan + outcome, one short line>',
        '     <blank line>',
        '     <DML only> ... -- N row(s) updated',
      ].join('\n')] };
    }
    // CHECK E — greeting written as its own line OUTSIDE a ``` / ~~~ fence (2026-10-02, #282721):
    // the handoff must be ONE copyable fenced block. Runs after C so a missing handoff still blocks.
    const outside = text.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
    if (outside.split(/\r?\n/).some(l => GREETING.test(l.trim()))) {
      return { fire: true, block: false, advisories: [[
        'patch-close-shape CHECK E — infra handoff is not one fenced block.',
        '   Put greeting + #ticket line + DML inside ONE ``` block so miya copies it in one go.',
      ].join('\n')] };
    }
    return { fire: false, advisories: [] };
  }

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

  // CHECK D — #ticket one-liner stays short (2026-10-02, #282721: a 15-word formal-Malay line; miya writes ~6-10 words)
  if (TICKET_LINE.test(nextLine)) {
    const words = nextLine.replace(/^#\d+:\s*/, '').split(/\s+/).filter(Boolean).length;
    if (words > 10) {
      advisories.push([
        `patch-close-shape CHECK D — #ticket line is ${words} words; keep it to 10 or fewer.`,
        '   Urusan + outcome only, e.g. "#281656: PRBB - link resit kaunter ke permohonan".',
        '   No table/column names, no ids, no long formal-Malay chains.',
      ].join('\n'));
    }
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
    const { fire, block, advisories } = evaluate(text);
    if (!fire) return { fired: false };
    advisories.push('   Bypass: [skip-patch-close-shape: <reason>].');
    const out = advisories.join('\n\n') + '\n';
    return block ? { fired: true, blocked: true, blockReason: out, contextOut: out } : { fired: true, blocked: false, contextOut: out };
  });
}

module.exports = { evaluate, fencedBlocks, firstContentLine, GREETING, TICKET_LINE };
