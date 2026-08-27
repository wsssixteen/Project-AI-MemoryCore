#!/usr/bin/env node
// atlas-full-check.check.hook.js — born via core/forge.js (2026-08-27)
// TRIGGER: session transcript tail shows edits under etanah_atlas/(src|config|lib) or to a built etanah_atlas_*.html
// ACTION: BLOCK stop unless etanah_atlas/build/full_check_report.json is a fresh all-pass FULL run covering every state in atlas_states.json (0 JS errors); bypass [skip-atlas-full-check: reason]
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
// Bypass: [skip-atlas-full-check: <reason>]  (real reason; placeholder rejected).
// Sibling of atlas-ship-gate (build integrity: smoke+render). This one = interaction
// integrity: every clickable/draggable/dropdown on EVERY state, 0 JS errors, screenshots.
// Produce the report with:  python etanah_atlas/lib/full_check.py
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'atlas-full-check', event: 'Stop' }, (input) => {
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

  // Bypass — real reason required; the gate's own "<reason>" placeholder must NOT
  // satisfy it (self-disarm class, /system-design Rule 12).
  if (/\[skip-atlas-full-check:\s*[^<\]]{3,}\]/.test(tail)) {
    return { fired: true, blocked: false, bypassed: true, bypassToken: 'skip-atlas-full-check' };
  }

  const touched = (/etanah_atlas[\\\/]+(src|config|lib)[\\\/]/.test(tail) &&
                   /(Edit|Write|old_string|new_string|file_path)/.test(tail)) ||
                  /etanah_atlas_[a-z]+\.html/.test(tail);
  if (!touched) return { fired: false };

  const atlasDir = path.join(ROOT, 'etanah_atlas');
  if (!fs.existsSync(atlasDir)) return { fired: false };

  // states the app claims to cover
  let wantStates = [];
  try {
    wantStates = JSON.parse(fs.readFileSync(path.join(atlasDir, 'config', 'atlas_states.json'), 'utf8')).map(s => s.profile);
  } catch (_) {}
  // newest built HTML mtime (freshness reference)
  let newestHtml = 0;
  try {
    for (const f of fs.readdirSync(atlasDir)) {
      if (/^etanah_atlas_[a-z]+\.html$/.test(f)) {
        const m = fs.statSync(path.join(atlasDir, f)).mtimeMs;
        if (m > newestHtml) newestHtml = m;
      }
    }
  } catch (_) {}
  if (!newestHtml) return { fired: true, blocked: false, contextOut: 'atlas-full-check: no built HTML — fail-open\n' };

  const reportPath = path.join(atlasDir, 'build', 'full_check_report.json');
  let report = null, reportMtime = 0;
  if (fs.existsSync(reportPath)) {
    try { report = JSON.parse(fs.readFileSync(reportPath, 'utf8')); reportMtime = fs.statSync(reportPath).mtimeMs; } catch (_) {}
  }
  const s = report && report._summary;
  const covered = s ? (s.states || []) : [];
  const missing = wantStates.filter(x => !covered.includes(x));
  const fresh = reportMtime >= newestHtml - 1000; // 1s slack for same-second writes

  const ok = s && s.all_pass === true && s.full_run === true && missing.length === 0 && fresh;
  if (ok) return { fired: true, blocked: false };

  const why = !report ? 'no full_check_report.json — run the checker'
    : !s ? 'report has no _summary — regenerate (stale format)'
    : !s.full_run ? 'report is a SINGLE-STATE run — run ALL states'
    : s.all_pass !== true ? `checks failed: ${s.checks_passed}/${s.checks_total} · ${s.errors_total} JS errors`
    : missing.length ? `states NOT checked: ${missing.join(', ')}`
    : 'report is STALE (an HTML was rebuilt after the last check)';

  return {
    fired: true, blocked: true,
    blockReason:
      '⛔ atlas-full-check: the Atlas changed but the deterministic full-website check is not green.\n' +
      `   Reason: ${why}\n` +
      '   Every state, every tab, every button/dropdown/drag must pass with 0 JS errors.\n' +
      '   Run:  python etanah_atlas/lib/full_check.py\n' +
      '   Then look at checks/*.png before claiming it works.\n' +
      '   Genuinely N/A? add [skip-atlas-full-check: <reason>].\n',
  };
});
