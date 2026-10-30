#!/usr/bin/env node
// component-birth-gate.check.hook.js — born via core/forge.js (2026-07-12)
// TRIGGER: Write/Edit creating a NEW hook/check/skill file (domain/*.hook.js, .claude/hooks/*.js, skills/*/SKILL.md) outside the forge
// ACTION: hard-block with 'born through forge only' message
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'component-birth-gate', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const fp = ((data.tool_input && data.tool_input.file_path) || '').replace(/\\/g, '/');
  if (!fp) return { fired: false };
  // NARROW trigger (semantic-atomicity rule 3): exactly the component-file shapes from the replay case.
  const isComponent = /\/domain\/[^/]+\/[^/]+\.hook\.js$/.test(fp)
    || /\/\.claude\/hooks\/[^/]+\.js$/.test(fp)
    || /\/\.claude\/skills\/[^/]+\/SKILL\.md$/.test(fp);
  // Rule 13 (2026-09-06): a NEW domain/<feature>/README.md must carry goal: + retention: keys.
  const isFeatureReadme = /\/domain\/[^/]+\/README\.md$/.test(fp);
  if (isFeatureReadme && !require('fs').existsSync(fp) && process.env.FORGE_BIRTH !== '1') {
    const content = String((data.tool_input && data.tool_input.content) || '');
    // system-rules Rule 7 (2026-09-29): footprint: <trigger class>: <processes, RAM>
    const KEY = { goal: /^\s*\**goal\**\s*:\s*\S/mi, retention: /^\s*\**retention\**\s*:\s*\S/mi, footprint: /^\s*\**footprint\**\s*:\s*(per-prompt|per-tool|per-turn|per-session|always|scheduled|on-demand|none)\b/mi,
      // system-design Rule 16 (2026-10-23): how each run checks its own output against the goal
      self_audit: /^\s*\**self_audit\**\s*:\s*\S/mi,
      // system-design Rule 17 (2026-10-28): the Feature's own picture, checked by lib/diagram-census.js
      diagram: /^\s*\**diagram\**\s*:\s*\S/mi,
      // system-rules Rule 9 (2026-10-30): boundary: covers <…> · never <…> · stops <…> — where the part stops, read beside the goal at every audit
      boundary: /^\s*\**boundary\**\s*:\s*covers\s+[^·;\n]*\S\s*[·;]\s*never\s+[^·;\n]*\S\s*[·;]\s*stops\s+\S/mi };
    const missing = ['goal', 'retention', 'footprint', 'self_audit', 'diagram', 'boundary'].filter(k => !KEY[k].test(content));
    if (missing.length) return { fired: true, blocked: true, blockReason: '⛔ component-birth-gate: new Feature README lacks ' + missing.map(k => k + ':').join(' + ') + ' (system-design Rules 13 + 16 + 17 / system-rules Rules 6-7 + 9; self_audit: = how each run checks its own output against the goal; footprint: starts with per-prompt|per-tool|per-turn|per-session|always|scheduled|on-demand|none; diagram: = diagram.png in the Feature folder, checked by node lib/diagram-census.js --check domain/<name>; boundary: = "covers <what it reads and acts on> · never <what it must not do or touch> · stops <when it hands to miya, or none: report only>"). Add the machine-readable lines at the top, or let core/forge.js write them.' };
    return { fired: false };
  }
  if (!isComponent) return { fired: false };
  const fsx = require('fs');
  if (fsx.existsSync(fp)) return { fired: false }; // refining an EXISTING component is allowed (forge refine pins it)
  if (process.env.FORGE_BIRTH === '1') return { fired: false }; // the forge's own births pass
  return {
    fired: true, blocked: true,
    blockReason: '⛔ component-birth-gate: new components are born through core/forge.js ONLY (external-audit addendum §2, binding).\n' +
      '   → node core/forge.js new <check|skill|script> ' + fp.split('/').pop().replace(/\..*$/, '') + ' --event <E> --trigger "..." --action "..." --replay "..." --nod "..."\n' +
      '   → or refine an existing component: node core/forge.js refine <name>\n' +
      '   [replay class this kills: 15 ghost hooks 2026-05-25 · branch-at-apply wrong-path 2026-06-20]',
  };
});
