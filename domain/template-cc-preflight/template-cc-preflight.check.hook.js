#!/usr/bin/env node
// template-cc-preflight.check.hook.js — born via core/forge.js (2026-08-19)
// TRIGGER: a Test Scenario / YOUR MOVE hand-back is emitted for a template docx ticket
//          without a CC-PREFLIGHT line
// ACTION: ADVISORY v1 — demand the CC-data preflight (all template CC tags checked against
//         the test permohonan's data; patchable gaps named) before the scenario is handed.
//         Promote to BLOCK only with observed-slip evidence (system-design layering doctrine).
// Bypass: [skip-cc-preflight: <reason>] in the reply.
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

const ADVICE = `\u{1F9E9} template-cc-preflight (ADVISORY): this hand-back looks like a TEMPLATE-ticket test scenario
   but carries no CC-PREFLIGHT line. Before miya (or the BA) tests a generated document:
   1. Run: node domain/template-cc-preflight/preflight.js --template <template .docx path>
   2. For each tag the script lists, check the TEST PERMOHONAN's actual rows (DB) for the data it renders.
   3. Emit one line: CC-PREFLIGHT: <n> tags · <m> unmapped · data-gaps: <tag=missing-source, ...> (or none)
      + a patch proposal for every patchable gap ("maklumat tak lengkap" = the BA symptom this kills).
   Genuinely not a template hand-back? add [skip-cc-preflight: <reason>].
`;

runHook({ name: 'template-cc-preflight', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const text = lastAssistantText(data.transcript_path || '');
  if (!text || text.length < 200) return { fired: false };
  const bypass = /\[skip-cc-preflight:\s*[^\]]+\]/i.test(text);
  if (bypass) return { fired: true, bypassed: true, bypassToken: 'skip-cc-preflight' };
  const isHandback = /▶ YOUR MOVE|Test Scenario/i.test(text);
  const isTemplate = /template|\.docx/i.test(text);
  const hasPreflight = /CC-PREFLIGHT:/.test(text);
  if (!isHandback || !isTemplate || hasPreflight) return { fired: false };
  return { fired: true, blocked: false, contextOut: ADVICE };
});
