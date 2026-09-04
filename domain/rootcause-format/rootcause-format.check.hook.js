#!/usr/bin/env node
// rootcause-format.check.hook.js — born via core/forge.js (2026-09-01)
// TRIGGER: quest hand-back emit carries a Root cause row with real content
// ACTION: block when the Root cause text contains dashes or semicolons; enforce short plain ASD-STE100 sentences
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const fs = require('fs');

const EXEMPT = /\[skip-rootcause-format:|═══|るり結界|Domain Expansion/;

function lastAssistantText(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return null; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj; try { obj = JSON.parse(lines[i]); } catch (_) { continue; }
    const msg = obj.message || obj;
    if ((msg.role || obj.type) !== 'assistant') continue;
    const c = msg.content; let text = '';
    if (typeof c === 'string') text = c;
    else if (Array.isArray(c)) text = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
    if (text.trim()) return text;
  }
  return null;
}

// Pull the root-cause CONTENT string out of the emit, or null if none present.
function extractRootCause(text) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!/root cause/i.test(lines[i])) continue;
    const inline = lines[i].split(/root cause[^:|]*:/i)[1];
    if (inline && inline.replace(/\|/g, '').trim()) return inline.replace(/\|/g, '').trim();
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const ln = lines[j].trim();
      if (!ln) continue;
      if (/^\|?\s*:?-{2,}/.test(ln)) continue;              // table separator |---|
      if (ln.startsWith('|')) { const cell = ln.replace(/^\||\|$/g, '').trim(); if (cell) return cell; }
      if (ln.startsWith('>')) return ln.replace(/^>\s*/, '').trim();
      break;
    }
  }
  return null;
}

function isPlaceholder(s) { return /<CAUSE ONLY|not yet diagnosed|⬜/i.test(s); }

function findViolations(s) {
  const v = [];
  if (/[—–]/.test(s)) v.push('em/en dash - remove it, use a full stop or comma');
  if (/\s-\s/.test(s)) v.push('spaced hyphen ( - ) used as a dash - remove it');
  if (/;/.test(s)) v.push('semicolon (;) - split into two sentences');
  return v;
}

function evaluate(text) {
  if (!text) return { verdict: 'silent' };
  if (EXEMPT.test(text)) return { verdict: 'silent' };
  const rc = extractRootCause(text);
  if (!rc || isPlaceholder(rc)) return { verdict: 'silent' };
  const violations = findViolations(rc);
  return violations.length ? { verdict: 'blocked', violations, rc } : { verdict: 'passed', rc };
}
module.exports = { evaluate, extractRootCause, findViolations };

runHook({ name: 'rootcause-format', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  if (data.stop_hook_active) return { fired: false };
  const res = evaluate(lastAssistantText(data.transcript_path || ''));
  if (res.verdict !== 'blocked') return { fired: false };
  return {
    fired: true, blocked: true,
    blockReason: [
      '⛔ rootcause-format: the Root cause line is BA-sendable text and breaks the required format.',
      '   Fix the Root cause line, then re-send:',
      ...res.violations.map(x => '   - ' + x),
      '   Rules: NO dashes, NO semicolons, short plain sentences (ASD-STE100). A hyphen inside a word (Lain-Lain) is fine.',
      '   Genuinely intentional? add [skip-rootcause-format: <reason>].',
      '   DELTA ONLY: output just the corrected Root cause line, do NOT re-emit the whole reply.',
    ].join('\n'),
  };
});
