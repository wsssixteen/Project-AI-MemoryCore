#!/usr/bin/env node
// atlas-ship-gate.check.hook.js — born via core/forge.js (2026-08-22, implemented 2026-08-23)
// TRIGGER: Stop, predicate: session transcript tail shows edits under etanah_atlas/(src|config|lib)
// ACTION: BLOCK stop (exit 2) unless etanah_atlas/build/ship_check.json is FRESH for the current
//         etanah_atlas_melaka.html sha256, with smoke=pass and a real headless file:// render
//         recorded; bypass [skip-atlas-ship-gate: reason]
// REPLAY CASE: 2026-08-22 Atlas v3.2 — synthetic-only verification shipped a page with an invisible
//              modal overlay blocking every real click; miya could not open/use it.
// Produce the ship-check with:  python etanah_atlas/lib/ship_check.py
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'atlas-ship-gate', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }

  const tp = data.transcript_path;
  if (!tp || !fs.existsSync(tp)) return { fired: false };
  let tail = '';
  try {
    const size = fs.statSync(tp).size;
    const want = Math.min(size, 400 * 1024);
    const fd = fs.openSync(tp, 'r');
    const buf = Buffer.alloc(want);
    fs.readSync(fd, buf, 0, want, size - want);
    fs.closeSync(fd);
    tail = buf.toString('utf8');
  } catch (_) { return { fired: false }; }

  // Bypass: real reason required — the placeholder "<reason>" form printed by this
  // gate's own message must NOT satisfy the check (self-disarm class, Rule 12).
  if (/\[skip-atlas-ship-gate:\s*[^<\]]{3,}\]/.test(tail)) {
    return { fired: true, blocked: false, bypassed: true, bypassToken: 'skip-atlas-ship-gate' };
  }

  const touched = /etanah_atlas[\\\/]+(src|config|lib)[\\\/]/.test(tail) &&
                  /(Edit|Write|old_string|new_string|file_path)/.test(tail);
  if (!touched) return { fired: false };

  const html = path.join(ROOT, 'etanah_atlas', 'etanah_atlas_melaka.html');
  if (!fs.existsSync(html)) return { fired: true, blocked: false, contextOut: 'atlas-ship-gate: html missing — fail-open\n' };
  const sha = crypto.createHash('sha256').update(fs.readFileSync(html)).digest('hex');

  const checkPath = path.join(ROOT, 'etanah_atlas', 'build', 'ship_check.json');
  let check = null;
  if (fs.existsSync(checkPath)) {
    try { check = JSON.parse(fs.readFileSync(checkPath, 'utf8')); } catch (_) {}
  }
  const fresh = check && check.html_sha256 === sha && check.smoke === 'pass' &&
                check.render_png && check.render_size > 30000;
  if (fresh) return { fired: true, blocked: false };

  const why = !check ? 'no ship_check.json'
    : check.html_sha256 !== sha ? 'ship_check is STALE (HTML rebuilt after the last check)'
    : check.smoke !== 'pass' ? 'smoke test did not pass'
    : 'render screenshot missing/too small';
  return {
    fired: true,
    blocked: true,
    blockReason: [
      '⛔ atlas-ship-gate: this session edited etanah_atlas source, but the shipped HTML has no FRESH ship-check (' + why + ').',
      '   A working deploy = smoke test PASS + real headless file:// render of the CURRENT build. Run:',
      '       python etanah_atlas/lib/ship_check.py',
      '   rebuild if needed and re-run until build/ship_check.json shows smoke=pass for the current HTML.',
      '   Only a genuine blocker excuses stopping: [skip-atlas-ship-gate: <reason>]',
    ].join('\n'),
  };
});
