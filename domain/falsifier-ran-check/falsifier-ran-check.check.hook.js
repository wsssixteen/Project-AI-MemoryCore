#!/usr/bin/env node
// falsifier-ran-check.check.hook.js — born via core/forge.js (2026-07-12)
// TRIGGER: reply claims a falsifier/probe was planted AND claims post-test confirmation without the probe marker appearing
// ACTION: advisory: falsifier planted but never shown firing
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

// NARROW trigger (per spec): fires only when ALL of these hold on the last assistant text —
//   1. a QA-PROBE marker is mentioned                    (/QA\d*-?PROBE/)
//   2. the reply claims the probe was planted/added       (/planted|added|bundled/i)
//   3. the reply ALSO claims confirmation/verification    (/confirmed|verified|fix works/i)
//   4. but NEVER cites the probe actually firing/appearing (/PROBE.*(fired|appeared|found|shows)|server\.log.*PROBE/i)
const PROBE_MENTION = /QA\d*-?PROBE/;
const PLANTED = /planted|added|bundled/i;
const CONFIRMED = /confirmed|verified|fix works/i;
const PROBE_FIRED_EVIDENCE = /PROBE.*(fired|appeared|found|shows)|server\.log.*PROBE/i;

function lastAssistantText(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return null; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj;
    try { obj = JSON.parse(lines[i]); } catch (_) { continue; }
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

runHook({ name: 'falsifier-ran-check', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  if (data.stop_hook_active) return { fired: false }; // avoid re-fire loop on the same stop
  const text = lastAssistantText(data.transcript_path || '');
  if (!text) return { fired: false };

  const fired = PROBE_MENTION.test(text) && PLANTED.test(text) && CONFIRMED.test(text) && !PROBE_FIRED_EVIDENCE.test(text);
  if (!fired) return { fired: false };

  return {
    fired: true, blocked: false,
    contextOut: '⚠️ falsifier-ran-check: reply mentions a QA-PROBE planted/bundled and claims confirmation/verification, ' +
      'but cites no evidence the probe actually fired (no "PROBE ... fired/appeared/found/shows" or server.log reference). ' +
      'Cite the probe output, or downgrade the claim to HYPOTHESIS until it is checked. (advisory — never blocks)\n',
  };
});
