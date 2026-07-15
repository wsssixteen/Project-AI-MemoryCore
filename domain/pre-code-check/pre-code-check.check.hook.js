#!/usr/bin/env node
// pre-code-check.check.hook.js — born via core/forge.js (2026-07-14), implemented same day
// TRIGGER: Edit/Write on etanah .java/.xhtml/.docx path — require CODE-CHECK compact emit line
// ACTION: block Edit if CODE-CHECK emit line missing OR any check ✗ without justification
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.join(__dirname, 'log.jsonl');

const ETANAH_PATH = /[\\\/]etanah-(pelupusan|common|awam|teknikal)[\\\/].+\.(java|xhtml|docx)$/i;

const REQUIRED_CHECKS = [
  'analog', 'in-file', 'sibling', 'existing-reuse', 'name-by-purpose',
  'minimal-diff', 'logic-matrix', 'blast-radius', 'predicate', 'falsifier',
  'read+write-path', 'BA-expected', 'full-address', 'sibling-diff',
];
const CONFIDENCE_RX = /\bconfidence\s+\d+\s*%/i;

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

function readLastAssistantTurn(tp) {
  let raw;
  try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return ''; }
  const L = raw.split(/\r?\n/).filter(Boolean);
  let text = '';
  for (let i = L.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(L[i]); } catch (_) { continue; }
    const m = o.message || o;
    const role = m.role || o.type;
    if (role === 'user') break;
    if (role !== 'assistant') continue;
    const c = m.content;
    if (typeof c === 'string') { text = c + '\n' + text; continue; }
    if (Array.isArray(c)) {
      let localText = '';
      for (const b of c) {
        if (!b) continue;
        if (b.type === 'text' && b.text) localText += b.text + '\n';
      }
      text = localText + text;
    }
  }
  return text;
}

runHook({ name: 'pre-code-check', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }

  const toolInput = data.tool_input || {};
  const filePath = String(toolInput.file_path || '');
  if (!ETANAH_PATH.test(filePath)) return { fired: false };

  const bypassMatch = (readLastAssistantTurn(data.transcript_path || '') || '').match(/\[skip-pre-code-check:\s*([^\]]+)\]/);
  if (bypassMatch) { log({ action: 'bypass', reason: bypassMatch[1], file: filePath }); return { fired: false }; }

  const text = readLastAssistantTurn(data.transcript_path || '');
  if (!text) { log({ action: 'no-transcript', file: filePath }); return { fired: false }; }

  const codeCheckMatch = text.match(/CODE-CHECK:\s*([^\n]+)/i);
  if (!codeCheckMatch) {
    log({ action: 'blocked-missing-emit', file: filePath });
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ pre-code-check: etanah code Edit blocked — no CODE-CHECK emit line in this turn.',
        '   File: ' + filePath,
        '   Emit ONE compact line before the Edit, all 15 checks with ✓ or ✗(reason):',
        '',
        '     CODE-CHECK: analog ✓ · in-file ✓ · sibling ✓ · existing-reuse ✓ · name-by-purpose ✓',
        '              · minimal-diff ✓ · logic-matrix ✓ · blast-radius ✓ · predicate ✓ · falsifier ✓',
        '              · read+write-path ✓ · BA-expected ✓ · full-address ✓ · sibling-diff ✓ · confidence 85%',
        '',
        '   Any ✗ needs a parenthetical reason: analog ✗(novel defensive helper).',
        '   Genuinely trivial edit (rename-only / typo) → [skip-pre-code-check: <reason>].',
      ].join('\n'),
    };
  }

  const line = codeCheckMatch[1];
  const missing = [];
  const bareCross = [];
  for (const name of REQUIRED_CHECKS) {
    const escaped = name.replace(/[.+*?^$()[\]{}|\\]/g, '\\$&');
    const rx = new RegExp(escaped + '\\s*([✓✗])(\\s*\\([^)]+\\))?', 'i');
    const m = line.match(rx);
    if (!m) { missing.push(name); continue; }
    if (m[1] === '✗' && !m[2]) bareCross.push(name);
  }
  if (!CONFIDENCE_RX.test(line)) missing.push('confidence <N>%');

  if (missing.length > 0 || bareCross.length > 0) {
    log({ action: 'blocked-malformed', file: filePath, missing, bareCross });
    const reasons = [];
    if (missing.length > 0) reasons.push('   Missing check names: ' + missing.join(', '));
    if (bareCross.length > 0) reasons.push('   ✗ without justification: ' + bareCross.join(', ') + ' — add "(reason)" after each ✗');
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ pre-code-check: CODE-CHECK line present but malformed.',
        '   File: ' + filePath,
        ...reasons,
        '   Full expected list: ' + REQUIRED_CHECKS.join(' · '),
      ].join('\n'),
    };
  }

  log({ action: 'passed', file: filePath, line: line.slice(0, 200) });
  return { fired: false };
});
