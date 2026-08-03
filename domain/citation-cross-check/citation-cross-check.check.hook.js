#!/usr/bin/env node
// citation-cross-check.check.hook.js — born via core/forge.js (2026-07-12)
// TRIGGER: Stop hook — the reply is trace-shaped (last assistant text matches
//          /Scout emit|Recon emit|class chain/i) AND cites >=2 file:line locations
//          (e.g. `MlkKertasTemplateForm.java:211`), but at least one cited BASENAME
//          was never touched by a Read/Grep/Glob tool_use since the last user message.
// ACTION: SILENT advisory — never writes to stdout, never blocks. Fired events are
//          recorded as a telemetry row (system/telemetry/hook-fires.jsonl) carrying the
//          unbacked citations + a spawn_tool suggestion (re-verify via Read/Grep).
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook, appendTelemetry } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const TRACE_SIGNAL = /Scout emit|Recon emit|class chain/i;
const CITE_RE = /[\w/\\.-]+\.(?:java|xhtml|js|xml|jsonl?):\d+/g;
const TOOL_NAMES = new Set(['Read', 'Grep', 'Glob']);

function readLines(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return []; }
  return raw.split(/\r?\n/).filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch (_) { return null; }
  }).filter(Boolean);
}

function roleOf(obj) {
  const msg = obj.message || obj;
  return msg.role || obj.type;
}

function textOf(obj) {
  const msg = obj.message || obj;
  const c = msg.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.filter((b) => b && b.type === 'text').map((b) => b.text).join('\n');
  return '';
}

function toolUsesOf(obj) {
  const msg = obj.message || obj;
  const c = msg.content;
  if (!Array.isArray(c)) return [];
  return c.filter((b) => b && b.type === 'tool_use');
}

function basenameOf(cite) {
  const noLine = cite.replace(/:\d+$/, '');
  const parts = noLine.split(/[\/\\]/);
  return parts[parts.length - 1];
}

// Returns up to 5 unbacked-citation basenames, or null when the reply isn't
// trace-shaped / doesn't cite enough / everything cited was actually touched.
function findUnbackedCitations(transcriptPath) {
  const lines = readLines(transcriptPath);
  if (!lines.length) return null;

  let lastUserIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (roleOf(lines[i]) === 'user') { lastUserIdx = i; break; }
  }

  // Last non-empty assistant text block (scan backward).
  let text = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    if (roleOf(lines[i]) !== 'assistant') continue;
    const t = textOf(lines[i]);
    if (t.trim()) { text = t; break; }
  }
  if (!text || !TRACE_SIGNAL.test(text)) return null;

  const cites = text.match(CITE_RE) || [];
  const uniqueCites = [...new Set(cites)];
  if (uniqueCites.length < 2) return null;

  // Collect Read/Grep/Glob tool_use inputs since the last user message.
  const haystackParts = [];
  for (let i = lastUserIdx + 1; i < lines.length; i++) {
    if (roleOf(lines[i]) !== 'assistant') continue;
    for (const tu of toolUsesOf(lines[i])) {
      if (!TOOL_NAMES.has(tu.name)) continue;
      const inp = tu.input || {};
      if (inp.file_path) haystackParts.push(String(inp.file_path));
      if (inp.path) haystackParts.push(String(inp.path));
      if (inp.pattern) haystackParts.push(String(inp.pattern));
    }
  }
  const haystack = haystackParts.join(' | ').replace(/\\/g, '/');

  const unbacked = uniqueCites.filter((c) => !haystack.includes(basenameOf(c)));
  if (!unbacked.length) return null;
  return unbacked.slice(0, 5);
}

runHook({ name: 'citation-cross-check', event: 'Stop' }, (input) => {
  let data = {};
  try { data = JSON.parse(input || '{}'); } catch (_) {}
  if (data.stop_hook_active) return { fired: false };
  const transcriptPath = data.transcript_path;
  if (!transcriptPath) return { fired: false };

  let unbacked;
  try { unbacked = findUnbackedCitations(transcriptPath); } catch (_) { return { fired: false }; }
  if (!unbacked) return { fired: false };

  // Silent advisory — never blocks, never writes to stdout. Logged via telemetry only.
  appendTelemetry({
    ts: new Date().toISOString(),
    hook: 'citation-cross-check',
    event: 'Stop',
    mode: 'native-extra',
    spawn_tool: 'verify-unbacked-citation',
    unbacked_citations: unbacked,
  });
  return { fired: true, blocked: false }; // no contextOut => silent stdout
});
