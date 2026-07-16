#!/usr/bin/env node
// release-mlk-plp-scope-gate.check.hook.js — born via core/forge.js (2026-07-16)
// TRIGGER: an Edit/Write targets a file inside the etanah-pelupusan repo while a release is in-flight (state file phase branched..bumped)
// ACTION: block the edit - during a release the ONLY established edit is the pom.xml version bump via release-prep.js bump-version
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// The counter-rail for the release pipeline's DON'Ts (SKILL.md §DON'Ts, みや 2026-07-16:
// "TO NOT DO ANYTHING EXCEPT WHAT WE'VE ESTABLISHED"). Prose in a skill cannot stop a tool
// call; this can. A release is an ASSEMBLY job — zero authored code, zero stray fixes.
//
// IN-FLIGHT = any state/release-*.json with phase in branched|merging|merged|verified|bumped.
// (planned = not branched yet · pushed = the pipeline's git work is done → gate stands down.)
// pom.xml is NOT whitelisted on purpose: the established path is `release-prep.js bump-version`
// (whose own git/fs calls never pass through this hook), never a hand-edit.
// Bypass: [skip-release-scope: <reason>] inside the tool_input (transcript-visible = auditable).
// Fail-OPEN on any read/parse error.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const STATE_DIR = process.env.RELEASE_MLK_PLP_STATE_DIR
  || path.join(ROOT, 'domain', 'release-mlk-plp', 'state');
const IN_FLIGHT = ['branched', 'merging', 'merged', 'verified', 'bumped'];
const PELUPUSAN_PATH = /etanah-pelupusan[\\/]/i;
const BYPASS = /\[skip-release-scope:\s*[^\]]+\]/i;

function inFlightRelease() {
  let files;
  try { files = fs.readdirSync(STATE_DIR); } catch (_) { return null; }
  for (const f of files) {
    if (!/^release-.*\.json$/.test(f)) continue;
    try {
      const st = JSON.parse(fs.readFileSync(path.join(STATE_DIR, f), 'utf8'));
      if (IN_FLIGHT.includes(st.phase)) return st;
    } catch (_) { /* skip unreadable */ }
  }
  return null;
}

runHook({ name: 'release-mlk-plp-scope-gate', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  const tool = data.tool_name || '';
  if (tool !== 'Edit' && tool !== 'Write') return { fired: false };
  const filePath = (data.tool_input && data.tool_input.file_path) || '';
  if (!PELUPUSAN_PATH.test(filePath)) return { fired: false };

  const st = inFlightRelease();
  if (!st) return { fired: false }; // no release in flight → normal quest work, not our business

  if (BYPASS.test(JSON.stringify(data.tool_input || {}))) {
    return { fired: true, blocked: false, bypassed: true, bypassToken: 'skip-release-scope' };
  }
  return {
    fired: true, blocked: true,
    blockReason: [
      `⛔ release-mlk-plp-scope-gate: release ${st.release} is IN FLIGHT (phase=${st.phase}) — this edit is NOT an established release step.`,
      `   File: ${filePath}`,
      "   DO NOTHING EXCEPT WHAT IS ESTABLISHED (SKILL.md §DON'Ts): a release assembles branches; it never authors or fixes code.",
      '   The ONLY established edit is the version bump — and it runs via:',
      `      node domain/release-mlk-plp/release-prep.js bump-version --release ${st.release}`,
      '   Missing fix? → mark it out-of-module at V1 and move on; it belongs to its ticket owner via Quest.',
      "   Genuinely established but unlisted? → get みや's nod, then [skip-release-scope: <reason>].",
      '',
    ].join('\n'),
  };
});
