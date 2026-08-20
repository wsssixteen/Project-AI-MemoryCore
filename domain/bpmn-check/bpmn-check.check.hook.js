#!/usr/bin/env node
// bpmn-check.check.hook.js — born via core/forge.js (2026-08-19) · v1.0 ADVISORY
// TRIGGER: a .bpmn*.xml file is written/edited by Ruri (PostToolUse Edit|Write)
// ACTION: run domain/bpmn-check/bpmn-check.js on the file and inject ERROR/WARN
//         findings as additionalContext (advisory v1 — the CLI's exit-1 + the
//         bpmn-check SKILL carry the enforcement weight).
// COVERAGE BOUNDARY (honest): most BPMN edits happen in miya's Flowable MODELER
//   (no file write fires here) — that path is covered by the bpmn-check skill
//   (invoke BEFORE speccing modeler click-paths) + running the CLI on exported XML.
// Replay case: QA-274914 2026-08-19 — 4 BPMN mistakes in one quest (missing
//   flowable:out = original bug · bare-EL PropertyNotFoundException on mlit ·
//   wrong discriminator var · gateway-on-shared-path design).
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
// Fail-OPEN: any error in this hook must never block a write.
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'bpmn-check', event: 'PostToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const toolName = data.tool_name || '';
  const filePath = (data.tool_input || {}).file_path || '';
  if (!/^(Edit|Write)$/.test(toolName) || !/\.bpmn[^\\\/]*\.xml$/i.test(filePath)) return { fired: false };

  let out = '';
  try {
    out = execFileSync('node', [path.join(__dirname, 'bpmn-check.js'), filePath], { encoding: 'utf8', timeout: 20000 });
  } catch (e) { out = ((e.stdout || '') + (e.stderr || '')) || ('bpmn-check failed to run: ' + e.message); }

  // Terse: verdict + ERROR/WARN lines only (cap 15)
  const lines = out.split('\n').filter(l => /^🚨|^⚠|VERDICT/.test(l)).slice(0, 15);
  if (!lines.length) return { fired: false };
  return {
    fired: true,
    blocked: false,
    contextOut: '⚙️  bpmn-check v1.0 on ' + path.basename(filePath) + ':\n' + lines.join('\n')
      + '\n(full run: node domain/bpmn-check/bpmn-check.js "<file>" [--baseline <old>] · judgment half: bpmn-check skill J1-J10)\n'
  };
});
