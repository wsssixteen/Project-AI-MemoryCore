#!/usr/bin/env node
// render-verify.check.hook.js — born via core/forge.js (2026-08-20)
// TRIGGER: a DELIVERY/FINISHED hand-back (deploy card · "BA re-test" · "counts as finished" · "delivered")
//          for a TEMPLATE (.docx) or DOCUMENT-RENDER change (populate* / WordStyleVO / WordEditorUtil /
//          FONT_SIZE_ / content control) that carries NO RENDER-VERIFY line.
// ACTION: BLOCK. A template/render fix does NOT count as finished until the RENDERED OUTPUT is proven
//         from an ACTUAL generated .docx (unzip word/document.xml -> check the target run sz/font/text);
//         compile-green and "the code is correct" are NOT proof.
// WHY: #276181 — font "Arial 11" declared fixed THREE times (template docDefaults, then template placeholder,
//      then VO setter) and each shipped 12pt because the rendered output was never inspected.
// SATISFY: emit one line —
//   RENDER-VERIFY: <doc/permohonan> · unzipped word/document.xml · <tag> run sz=<N> (<pt>pt) ✓ · font=<Arial> ✓
// Bypass: [skip-render-verify: <reason>]  (use for honestly not-yet-inspected server-side renders — never a bare "done").
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

function lastAssistantText(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return null; }
  const lines = raw.split('\n').filter(Boolean);
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

// A document-render change: a .docx template, OR a Word populator / VO / render util / font-size constant.
const RENDER_CONTEXT = /\.docx|populate[A-Z]\w+|WordStyleVO|WordEditorUtil|WordCCMethodConstant|rebuildRun|FONT_SIZE_|FONT_TYPE_|content control|\bsz=\d|Arial\s*(1[012]|size)/i;
// A delivery / finished claim: a deploy card, a BA-test hand-back, or an explicit done/finished/delivered.
const DELIVERY_SIGNAL = /ssh app@|deploy-\w+\.sh|mlk\/int-env|counts as finished|\bdelivered\b|BA (can )?(re-?)?test|is (now )?(fixed|finished|done)|re-?deploy/i;
const HAS_VERIFY = /RENDER-VERIFY:/;

const BLOCK = `⛔ render-verify: a TEMPLATE / DOCUMENT-RENDER fix is being delivered without proof of the RENDERED output.
   A font / layout / CC-content fix does NOT count as finished until you have inspected an ACTUAL generated .docx:
     unzip the generated document -> read word/document.xml -> confirm the target run's sz / font / text.
   Compile-green and "the code is correct" are NOT proof (that is exactly how #276181 shipped 12pt three times).
   Emit ONE line, then re-send:
     RENDER-VERIFY: <doc/permohonan> · unzipped word/document.xml · <tag> run sz=<N> (<pt>pt) ✓ · font=<Arial> ✓
   If the render is server-side and you have NOT inspected it yet, then it is NOT finished — say so plainly and
   add [skip-render-verify: <reason>] (e.g. "awaiting BA regen on the new build"). Never a bare "done".`;

runHook({ name: 'render-verify', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const text = lastAssistantText(data.transcript_path || '');
  if (!text || text.length < 120) return { fired: false };
  const bypass = /\[skip-render-verify:\s*[^\]]+\]/i.test(text);
  if (bypass) return { fired: true, bypassed: true, bypassToken: 'skip-render-verify' };
  const isRender = RENDER_CONTEXT.test(text);
  const isDelivery = DELIVERY_SIGNAL.test(text);
  const hasVerify = HAS_VERIFY.test(text);
  if (!isRender || !isDelivery || hasVerify) return { fired: false };
  return { fired: true, blocked: true, contextOut: BLOCK };
});
