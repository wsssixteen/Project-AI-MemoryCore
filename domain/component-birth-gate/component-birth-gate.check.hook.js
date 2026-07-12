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
