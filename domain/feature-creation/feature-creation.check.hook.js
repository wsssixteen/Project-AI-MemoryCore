#!/usr/bin/env node
// feature-creation.check.hook.js — born via core/forge.js (2026-08-19)
// TRIGGER: miya types create/update/refine feature in the prompt
// ACTION: inject the feature-creation pipeline checklist (system-rules → system-design →
//         best-practices freshness → inventory → forge birth → implement → eval green →
//         NUKE-MARKER → version-stamp)
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const PREDICATE = /\b(create|update|refine)\s+(?:(?:a|an|the|this|that|new|our)\s+)?(?:[a-z0-9-]+\s+)?feature\b/i;

const PIPELINE = `\u{1F6E0} feature-creation keyword detected — run the FULL birth pipeline, in order:

   "create/update/refine feature"
              |
              v
   [1] Skill: system-rules        (5 universal filters - inventory first!)
              |
              v
   [2] Skill: system-design       (Feature trinity - pick primitive + trigger moment,
              |                    Rules 6-10: eval, NUKE-MARKER, requirements table)
              v
   [3] best-practices freshness   (library-items/agent-architecture/claude-code-best-practices.md
              |                    - evolution-check first if >60d stale)
              v
   [4] INVENTORY / collision      (grep domain/ + skills/ + registry - refine-first,
              |                    never duplicate a 90% sibling)
              v
   [5] node core/forge.js new     (check|skill|script - echo, scaffold, register,
              |                    registry row, log path. NEVER hand-make files)
              v
   [6] IMPLEMENT + eval fixtures  (real replay fixture, not the stub)
              |
              v
   [7] EVAL GREEN + smoke-fire    (Rule 6: no green = not shipped)
              |
              v
   [8] README + NUKE-MARKER.md    (Rule 9: rollback recipe in the same commit)
              |
              v
   [9] REQUIREMENTS table         (Rule 10: every source swept; open decisions -> miya
                                   via AskUserQuestion) + version-stamp/changelog

   For update/refine of an EXISTING feature: node core/forge.js refine <name> --nod "..."
   (pre-refine eval pins must be green BEFORE the edit; re-run after).
`;

runHook({ name: 'feature-creation', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const prompt = String(data.prompt || '');
  if (!PREDICATE.test(prompt)) return { fired: false };
  return { fired: true, blocked: false, contextOut: PIPELINE };
});
