#!/usr/bin/env node
// lib/session-scope.js — one per-prompt decision for the hooks that print etanah ticket text
// symptom: 2026-10-16 cost scout: about 630k tokens of etanah hook text (OBJECTIVE LOCK, quest mode, codemap advice,
//          ticket list, registers) rode on DawahMap prompts in 6 days; DawahMap DECISIONS.md row 55, his nod 2026-10-18:
//          "May I change those MemoryCore hooks so they stay silent when a prompt is about DawahMap and no ticket is named?"
//          → "Yes, change them (Recommended)"
// goal: a prompt about DawahMap that names no etanah ticket carries none of the etanah ticket text; any prompt that
//       names a ticket or etanah work carries all of it, exactly as before
// goal_signal: on a quiet prompt every guarded hook prints nothing and system/telemetry/hook-fires.jsonl has a
//              'scope-quiet' row per guarded hook; on any other prompt their output is unchanged
// retention: regenerate (no data of its own; one telemetry row per quiet decision in the existing hook-fires stream)
// footprint: in-process, about 2 ms per guarded hook per prompt (one readdir of the project folders), no new process
// state-scoped: no — the etanah signal covers every state's permohonan prefix (PT<state>/)
//
// wantsEtanah(input, hook) → false ONLY when the prompt names a quiet project (QUIET, by the aliases in its
// project.json, matched the way project-load matches them) AND carries no etanah signal. Everything else → true:
// no prompt (a SessionStart run, a hand run), an unreadable stdin, a missing project.json, any error.
// Decided per prompt from the prompt alone, never from a marker file: the prompt hooks run in parallel, so a marker
// written on this prompt is not seen by the others on this prompt.
// "ticket" alone is NOT an etanah signal: DawahMap's own wayfinder says "ticket 04", "the open ticket".
// Kill switch: rename this file; every guarded hook fails open and prints as before.
// CLI: node lib/session-scope.js --decide "<prompt>"   → prints quiet | print, and why
'use strict';
const fs = require('fs');
const path = require('path');

const QUIET = ['DawahMap'];   // a second project here needs his nod (row 55 names DawahMap only)
const ETANAH_SIGNAL = [
  /(?<!\d)\d{6,8}(?!\d)/,                                        // a ticket number 282303, an aplikasi id 3408184, an engine id 23393230
  /\bPT[A-Z]{2,4}\/\d/,                                          // a permohonan id PTMLK/01/…, PTTRG/02/…, PTPK/18/…
  /\b(?:QA|ADHOC|ALTER|PATCH)-[A-Z0-9]/,                         // a quest or adhoc id QA-285159, ADHOC-PRBB-2026-14
  /\b(?:redmine|e-?tanah|e-?sokongan|urusan|tugasan|permohonan|pelupusan|hakmilik|flowable|bpmn|jboss|pymsoft|melaka|terengganu|stg1|stg2|mlit|mlkstg)\b/i,
  /\b(?:prbb|psbs|pltp|plps|plpsl|mlps|oplps|pptpb|opptpb|plbp|oplbp|pdbb|upnd|ups_plp|hkmlk|sbtm|psjt|sjtlt|pssk|awam)\b/i,   // urusan / tugasan codes, any case
  /\b(?:PLP|PRU|MCL|SKM|PROD)\b/,                                // short codes that are also English letters: upper case only
  /(?:^|\s)\/(?:quest|agih|close-phase|list-redmine|retrieve-redmine|sweep|hotfix|release-mlk-plp|patch-mlk-doc|adhoc-save|adhoc-titles|script-check|bpmn-check|env-check|doc-sim|cross-module-check|review-etanah)\b/i,
];

function readStdin() { try { return process.stdin.isTTY ? '' : fs.readFileSync(0, 'utf8'); } catch (_) { return ''; } }
function promptOf(input) {
  let d = input === undefined ? readStdin() : input;
  if (typeof d === 'string') { try { d = JSON.parse(d || '{}'); } catch (_) { return ''; } }
  return d && typeof d.prompt === 'string' ? d.prompt : '';
}
function quietProjectIn(prompt) {
  const P = require(path.join(__dirname, '..', 'domain', 'project-load', 'project.js'));
  const hit = P.namedIn(prompt, P.listProjects().filter(p => QUIET.includes(p.name)));
  return hit.length ? hit[0].name : null;
}
// → { quiet: bool, why: string }
function decide(prompt) {
  if (process.env.SESSION_SCOPE === 'off') return { quiet: false, why: 'SESSION_SCOPE=off' };
  if (!prompt) return { quiet: false, why: 'no prompt' };
  const sig = ETANAH_SIGNAL.find(rx => rx.test(prompt));
  if (sig) return { quiet: false, why: 'etanah signal "' + prompt.match(sig)[0].trim() + '"' };
  const project = quietProjectIn(prompt);
  return project ? { quiet: true, why: 'names ' + project + ', no etanah signal' } : { quiet: false, why: 'names no quiet project' };
}
function wantsEtanah(input, hook) {
  let data = input;
  try {
    if (data === undefined) data = readStdin();
    const d = decide(promptOf(data));
    if (!d.quiet) return true;
    try {
      const sid = (() => { try { return (typeof data === 'string' ? JSON.parse(data) : data).session_id || null; } catch (_) { return null; } })();
      require(path.join(__dirname, 'hook-runtime.js')).appendTelemetry({ ts: new Date().toISOString(), hook: hook || '?', event: 'UserPromptSubmit', mode: 'scope-quiet', exit: 0, blocked: false, fired: false, session_id: sid, reason: d.why });
    } catch (_) { /* telemetry never decides */ }
    return false;
  } catch (_) { return true; }   // fail open: print as before
}

module.exports = { wantsEtanah, decide, QUIET, ETANAH_SIGNAL };

if (require.main === module && process.argv[2] === '--decide') {
  const d = (() => { try { return decide(process.argv.slice(3).join(' ')); } catch (e) { return { quiet: false, why: 'error: ' + e.message }; } })();
  console.log((d.quiet ? 'quiet' : 'print') + ' — ' + d.why);
}
