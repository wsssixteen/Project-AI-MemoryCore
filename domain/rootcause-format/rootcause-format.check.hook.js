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

// Pull one Redmine-ready CONTENT string (Root cause / Solution) out of the emit, or null if none present.
// Shapes accepted: 2-col row `| Root cause | text |` (2026-09-07 shape) · 1-col header + next cell ·
// inline `Root cause: text` · blockquote under a "Root cause" line.
function extractLabelled(text, labelRe) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!labelRe.test(lines[i])) continue;
    const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());
    if (lines[i].trim().startsWith('|') && cells.length >= 2 && labelRe.test(cells[0]) && cells[1]) return cells[1];
    const inline = lines[i].split(new RegExp(labelRe.source + '[^:|]*:', 'i'))[1];
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
function extractRootCause(text) { return extractLabelled(text, /root cause/i); }
function extractSolution(text) { return extractLabelled(text, /\bsolution\b/i); }

function isPlaceholder(s) { return /<CAUSE ONLY|<FIX ONLY|not yet diagnosed|not yet fixed|⬜/i.test(s); }

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
  const sol = extractSolution(text);
  const violations = findViolations(rc).map(x => 'Root cause: ' + x);
  if (sol && !isPlaceholder(sol)) violations.push(...findViolations(sol).map(x => 'Solution: ' + x));
  return violations.length ? { verdict: 'blocked', violations, rc, sol } : { verdict: 'passed', rc, sol };
}
module.exports = { evaluate, extractRootCause, extractSolution, findViolations };

runHook({ name: 'rootcause-format', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  if (data.stop_hook_active) return { fired: false };
  const res = evaluate(lastAssistantText(data.transcript_path || ''));
  if (res.verdict !== 'blocked') return { fired: false };
  return {
    fired: true, blocked: true,
    blockReason: [
      '⛔ rootcause-format: the Root cause / Solution line is BA-sendable text and breaks the required format.',
      '   Fix the named line, then re-send:',
      ...res.violations.map(x => '   - ' + x),
      '   Rules: NO dashes, NO semicolons, short plain sentences (ASD-STE100). A hyphen inside a word (Lain-Lain) is fine.',
      '   Genuinely intentional? add [skip-rootcause-format: <reason>].',
      '   DELTA ONLY: output just the corrected Root cause line, do NOT re-emit the whole reply.',
    ].join('\n'),
  };
});
