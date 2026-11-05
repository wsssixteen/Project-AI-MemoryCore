#!/usr/bin/env node
// template-scenario.check.hook.js — born via core/forge.js (2026-11-04)
// TRIGGER: a hand-back (Test Scenario, YOUR MOVE, Redmine, deploy card) in a session that ran doc-sim or edited a Word template
// ACTION: BLOCK until a "TEMPLATE-SCENARIO: PASS" line from domain/template-scenario/template-scenario.js sits in a TOOL RESULT
//         this session (a line typed in my own reply never counts, so the gate cannot disarm itself).
// Bypass: [skip-template-scenario: <real reason>] in the reply; a "<reason>" placeholder never counts.
// boundary: covers the Stop reply text and this session's tool calls and results · never edits a file, never runs doc-sim · stops at one block naming the missing run
// his-words: not an approval reader — it reads tool_result blocks for the script's PASS line, never miya's text
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const MAX_BYTES = 30 * 1024 * 1024;
const HANDBACK_RE = /▶ YOUR MOVE|Test Scenario|DEPLOY\s*[—-]|\bRedmine\b|\bpost it \d{6}\b/i;
const TEMPLATE_WORK_RE = /doc-sim\.js|template[\\/]+MLK[\\/]+Template[^"'\s]*\.docx|Template[A-Za-z_]+\.docx/;
const PASS_RE = /TEMPLATE-SCENARIO: PASS\b/;
const BYPASS_RE = /\[skip-template-scenario:\s*([^\]<>]{8,})\]/i;

function readTail(p) {
  let fd;
  try {
    const st = fs.statSync(p);
    fd = fs.openSync(p, 'r');
    const len = Math.min(st.size, MAX_BYTES);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, st.size - len);
    return buf.toString('utf8');
  } catch (_) { return null; } finally { if (fd !== undefined) try { fs.closeSync(fd); } catch (_) {} }
}

function textOf(c) {
  if (typeof c === 'string') return c;
  if (!Array.isArray(c)) return '';
  return c.map(b => (b && typeof b.text === 'string' ? b.text : (b && typeof b.content === 'string' ? b.content : (b && Array.isArray(b.content) ? textOf(b.content) : '')))).join('\n');
}

function toolResultsHold(c, re) {
  return Array.isArray(c) && c.some(b => b && b.type === 'tool_result' && re.test(textOf(b.content)));
}

function decide(raw) {
  let current = '';
  let templateWork = false;
  let passed = false;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let obj; try { obj = JSON.parse(line); } catch (_) { continue; }
    const msg = obj.message || {};
    const c = msg.content;
    if (obj.type === 'assistant' && Array.isArray(c)) {
      for (const b of c) {
        if (b && b.type === 'tool_use' && TEMPLATE_WORK_RE.test(JSON.stringify(b.input || {}))) templateWork = true;
      }
      const t = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
      if (t.trim()) current = t;
    } else if (toolResultsHold(c, PASS_RE)) {
      passed = true;
    }
  }
  if (current.length < 200) return { fired: false, why: 'short' };
  if (BYPASS_RE.test(current)) return { fired: true, bypassed: true, bypassToken: 'skip-template-scenario' };
  if (!templateWork || !HANDBACK_RE.test(current)) return { fired: false, why: 'not a template hand-back' };
  if (passed) return { fired: false, why: 'passed' };
  return { fired: true, blocked: true, blockReason: REASON };
}

const REASON = [
  '⛔ template-scenario: this is a template-ticket hand-back with no "TEMPLATE-SCENARIO: PASS" from the script this session.',
  '   Run, then fix every FAIL it names:',
  '   node domain/template-scenario/template-scenario.js --qa <num> --req "<requirement .docx>" --template "<edited template>" --base "<template before the fix>" \\',
  '        --config "<template.config.json>" --permohonan "<id>" --steps "<a_tgsn>:CREATE,<a_tgsn>:SEMAK,<a_tgsn>:PERAKU" --dokumen <kod> --out "<Task 2. Fix folder>"',
  '   It checks: the "## Template checklist" in QA-<num>.md (every requirement comment, Issue/Expected line and BA ask done or na: reason) ·',
  '   every config action rendered · every CC tag the fix touched holds a real value (no empty, "-", <placeholder>, blank signature) ·',
  '   a word diff against the requirement with 0 defects · a green-highlighted PDF with 0 annotations.',
  '   Genuinely not a template hand-back? add [skip-template-scenario: <real reason>].',
].join('\n');

module.exports = { decide };
if (require.main === module) {
  runHook({ name: 'template-scenario', event: 'Stop' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
    if (!data.transcript_path) return { fired: false };
    const raw = readTail(data.transcript_path);
    if (!raw) return { fired: false };
    const d = decide(raw);
    delete d.why;
    return d;
  });
}
