#!/usr/bin/env node
// familiar-nudge.check.hook.js — born via core/forge.js (2026-07-12)
// TRIGGER: Read on a file over 500 lines / 50KB
// ACTION: advisory suggesting /familiar per CLAUDE0.md rule ("Summon /familiar when reading files >500 lines")
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const SIZE_THRESHOLD = 50 * 1024;   // 50KB
const LINE_COUNT_THRESHOLD = 500;
const LINE_COUNT_SCAN_MIN = 20 * 1024; // only bother counting lines once file is >20KB

function isExcluded(normFp) {
  return /\/system\/telemetry\//.test(normFp) || /\/node_modules\//.test(normFp);
}

function countLines(fp) {
  try {
    const buf = fs.readFileSync(fp, 'utf8');
    let n = 1;
    for (let i = 0; i < buf.length; i++) if (buf.charCodeAt(i) === 10) n++;
    return n;
  } catch (_) {
    return 0;
  }
}

runHook({ name: 'familiar-nudge', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const fp = ((data.tool_input && data.tool_input.file_path) || '');
  if (!fp) return { fired: false };
  const normFp = fp.replace(/\\/g, '/');
  if (isExcluded(normFp)) return { fired: false };

  let st;
  try { st = fs.statSync(fp); } catch (_) { return { fired: false }; }
  if (!st.isFile()) return { fired: false };

  const overSize = st.size > SIZE_THRESHOLD;
  const overLines = st.size > LINE_COUNT_SCAN_MIN && countLines(fp) > LINE_COUNT_THRESHOLD;

  if (!overSize && !overLines) return { fired: false };

  return {
    fired: true,
    blocked: false,
    contextOut: 'familiar-nudge: this file is a large read (>50KB or >500 lines) — consider summoning /familiar instead of reading it inline (CLAUDE.md: "Summon /familiar when reading files >500 lines").\n',
  };
});
