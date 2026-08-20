#!/usr/bin/env node
// de-knowledge-gate.check.hook.js — born via core/forge.js (2026-08-20)
// TRIGGER: DE-close banner + knowledge-worthy session signals
// ACTION: BLOCK DE close until a knowledge-candidate list (Discovery|Home=bake/defer/drop) or sentinel is emitted
//
// PURPOSE (per みや 2026-08-20): expansion-protocol Step 7 (etanah-knowledge sweep) is a
// model-judgment step that can be silently skipped -> a session's discoveries are lost ->
// the next session re-derives them = wasted usage. This gate makes the sweep deterministic:
// at DE close, if the session produced knowledge-worthy signals but NO candidate list was
// emitted, BLOCK. Non-auto-write — it forces the sweep to be visible + approved, never writes.
//
// FIRING: Stop hook, ONLY when the last assistant text carries a DE-close banner
//   ("Domain Expansion — closed" / "Barrier settles") — same trigger the sibling DE gates use.
//   Fail-OPEN on any parse error (never blocks a non-DE turn).
//
// SIGNALS (any one present this session -> sweep owed):
//   S1 >=3 distinct <file>.<ext>:<line> citations in assistant text
//   S2 a research/handover deliverable written (.md/.html Write, or an Artifact)
//   S3 a database MCP query ran (mcp__postgres*/oracle*/mlk*)
//   S4 trace / "how does X work" intent in any user message
//
// PASS (silent): not-DE-close · bypass · no signal · candidate list present · sentinel present
// BLOCK: DE-close + >=1 signal + NO candidate list/sentinel
// BYPASS: [skip-knowledge-gate: <reason>] in the last assistant text
// STATE-SCOPE: state-agnostic — bake target etanah-knowledge/<state>/ named at bake time, not here
// TEST HOOK: input JSON `_testEvents` (array of {kind:'text',role,text}|{kind:'tool',name,path}) overrides transcript parse
// Log: domain/de-knowledge-gate/log.jsonl
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.resolve(__dirname, 'log.jsonl');

const DE_CLOSE = /Domain Expansion\s*[—–-]+\s*closed|Barrier settles/i;
const BYPASS = /\[skip-knowledge-gate:/i;
const FILE_LINE = /\b([A-Za-z0-9_.-]+\.(?:java|xhtml|xml|jsp|js|ts|sql|properties))\s*:\s*(\d{1,5})\b/gi;
const DELIVERABLE_PATH = /(handover|flow[-_]?trace|flow[-_]?diagram|trace|research|analysis|architecture|walkthrough|guide|diagram|-flow)\b[^\n]*\.(md|html)\b/i;
const DB_TOOL = /^mcp__(postgres|oracle|mlk|mlit|mlkstg|mlkprod)/i;
const TRACE_INTENT = /\bhow\s+(does|do|is|are|the|we)\b[^\n]{0,60}\b(work|works|flow|flows|pass|passed|travel|stored|created|reach|reaches)\b|\btrace\b[^\n]{0,40}\b(flow|how|the code|logic|path)\b|\bwalk me through\b[^\n]{0,40}\b(flow|code|logic|how)\b|\bextensive research\b/i;
const KNOWLEDGE_LIST = /(##?\s*(?:etanah-)?knowledge[^\n]*\b(candidate|sweep|bank|distill)|\bknowledge\s+(candidate|sweep)\b)/i;
const KNOWLEDGE_MAPPING = /\b(bake|defer|drop)\b/i;
const NONE_SENTINEL = /_no\s+(new\s+)?knowledge\s+(this session|to bank|surfaced)_/i;

function parseTranscript(transcriptPath) {
  const events = [];
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return events; }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let obj; try { obj = JSON.parse(line); } catch (_) { continue; }
    const msg = obj.message || obj;
    const role = msg.role || obj.type;
    const c = msg.content;
    if (typeof c === 'string') events.push({ kind: 'text', role, text: c });
    else if (Array.isArray(c)) {
      for (const b of c) {
        if (!b) continue;
        if (b.type === 'text' && b.text) events.push({ kind: 'text', role, text: b.text });
        else if (b.type === 'tool_use') {
          const inp = b.input || {};
          events.push({ kind: 'tool', name: b.name || '', path: String(inp.file_path || inp.path || inp.filePath || '') });
        }
      }
    }
  }
  return events;
}

function lastAssistantText(events) {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.kind === 'text' && e.role === 'assistant' && e.text && e.text.trim()) return e.text;
  }
  return '';
}

function computeSignals(events) {
  const files = new Set();
  let s2 = false, s3 = false, s4 = false;
  for (const e of events) {
    if (e.kind === 'text') {
      if (e.role === 'assistant') { let m; FILE_LINE.lastIndex = 0; while ((m = FILE_LINE.exec(e.text)) !== null) files.add(m[1].toLowerCase() + ':' + m[2]); }
      if (e.role === 'user' && TRACE_INTENT.test(e.text)) s4 = true;
    } else if (e.kind === 'tool') {
      if (DB_TOOL.test(e.name)) s3 = true;
      if (/write|artifact/i.test(e.name) && DELIVERABLE_PATH.test(e.path)) s2 = true;
      if (/artifact/i.test(e.name) && !e.path) s2 = true;
    }
  }
  const s1 = files.size >= 3;
  return { s1, s2, s3, s4, fileCount: files.size, any: s1 || s2 || s3 || s4 };
}

function hasCandidateList(events) {
  for (const e of events) {
    if (e.kind !== 'text' || e.role !== 'assistant') continue;
    if (NONE_SENTINEL.test(e.text)) return true;
    if (KNOWLEDGE_LIST.test(e.text) && KNOWLEDGE_MAPPING.test(e.text)) return true;
  }
  return false;
}

function evaluate(events) {
  const last = lastAssistantText(events);
  if (!last || !DE_CLOSE.test(last)) return { verdict: 'silent', reason: 'not-de-close' };
  if (BYPASS.test(last)) return { verdict: 'silent', reason: 'bypass' };
  const sig = computeSignals(events);
  if (!sig.any) return { verdict: 'silent', reason: 'no-knowledge-signal', sig };
  if (hasCandidateList(events)) return { verdict: 'pass', reason: 'candidate-list-present', sig };
  return { verdict: 'block', reason: 'signals-without-sweep', sig };
}

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail: String(detail).slice(0, 300) }) + '\n'); } catch (_) {}
}

function buildBlockReason(sig) {
  const which = [
    sig.s1 && `>=3 file:line citations (${sig.fileCount})`,
    sig.s2 && 'a research/handover deliverable written',
    sig.s3 && 'a database query ran',
    sig.s4 && 'trace / how-does-X-work intent',
  ].filter(Boolean);
  return { which, text: [
    '⛔ de-knowledge-gate: Domain Expansion is closing, but this session produced',
    '   knowledge-worthy discoveries and NO knowledge-candidate list was emitted',
    '   (expansion-protocol Step 7 — the etanah-knowledge sweep).',
    '',
    '   Signals detected this session:',
    ...which.map(w => `   • ${w}`),
    '',
    '   Fix — emit a knowledge sweep BEFORE closing DE:',
    '     ## Knowledge candidates',
    '     | Discovery | Home (bake / defer / drop) |',
    '     each row -> bake to etanah-knowledge/<state>/<file> · defer to todo · drop-with-reason.',
    '   Genuinely nothing to bank? Add the sentinel line: `_no new knowledge this session_`',
    '',
    '   Bypass: [skip-knowledge-gate: <reason>].',
  ].join('\n') };
}

if (require.main === module) {
  runHook({ name: 'de-knowledge-gate', event: 'Stop' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    if (data.stop_hook_active) return { fired: false };
    const events = Array.isArray(data._testEvents) ? data._testEvents : parseTranscript(data.transcript_path || '');
    if (!events.length) return { fired: false };

    const r = evaluate(events);
    if (r.verdict === 'block') {
      const { which, text } = buildBlockReason(r.sig);
      logFire('blocked', which.join(', '));
      return { fired: true, blocked: true, blockReason: text };
    }
    if (r.verdict === 'pass') { logFire('passed', `list present (files=${r.sig.fileCount})`); return { fired: true, blocked: false }; }
    return { fired: false };
  });
}

module.exports = { evaluate, computeSignals, hasCandidateList };
