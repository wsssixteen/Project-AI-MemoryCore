#!/usr/bin/env node
// system-change-title.check.hook.js — born via core/forge.js (2026-10-27); enforces .claude/reply-shape-spec.md §3i
// symptom: 2026-10-27 (286462): system-change replies listed a script, a gate, a skill line and a people row together;
//          miya could not tell which kind of part each one was, or where it sits under System
// goal: every reply after a system change shows miya, as the last confirmation, where each changed part sits
//       (System › kind › parent › name) and whether it is new or changed
// SIGNAL (either one):
//   a) THIS TURN an Edit/Write/NotebookEdit tool call touched a system path  ← mandatory, whatever the reply says
//   b) outside code blocks and the Next steps section, a reply line names a system path AND a change verb
// BLOCK: no heading in the reply opens with "System › <Rule|Workflow|Feature|Tool|Memory|Kernel|Project>"
// PASS: no system change · at least one breadcrumb heading
// BYPASS: [skip-system-change-title: <reason>] · FAIL-OPEN on any error
// v2 (2026-10-27, miya): signal (a) added (mandatory after any system edit); heading = breadcrumb, not "[Kind · new]"
// v3 (2026-10-28, miya): ONE heading per KIND (`## System › Memory (changed)`) with ONE table, one row per part;
//    the same kind headed twice in one reply BLOCKS ("duplicates of System › Memory tables")
// Runs inside the stop-reply-shape bundle (lib/dispatch-hooks.js), not a standalone registration (system-rules Rule 7)
// Log: domain/system-change-title/log.jsonl
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');
const BYPASS = /\[skip-system-change-title:\s*[^\]\s][^\]]*\]/i;
const KINDS = 'Rules?|Workflows?|Features?|Tools?|Memory|Kernel|Projects?';
const HEADING = new RegExp('^\\s*#{1,6}\\s*System\\s*(?:›|>|»|->)\\s*(?:' + KINDS + ')\\b', 'im');
const HEADING_ALL = new RegExp('^\\s*#{1,6}\\s*System\\s*(?:›|>|»|->)\\s*(' + KINDS + ')\\b', 'img');

// v3: the kind headed more than once in one reply, or null.
function repeatedKind(body) {
  const seen = {};
  for (const m of String(body || '').matchAll(HEADING_ALL)) {
    const k = m[1].toLowerCase().replace(/s$/, '');
    seen[k] = (seen[k] || 0) + 1;
    if (seen[k] > 1) return m[1];
  }
  return null;
}
const SYS = '(?:domain[\\\\/][\\w-]+|lib[\\\\/][\\w-]+\\.js|core[\\\\/][\\w-]+\\.js|\\.claude[\\\\/](?:skills|hooks)[\\\\/]|\\.claude[\\\\/](?:CLAUDE|reply-shape-spec|personality)\\.md|\\.claude[\\\\/]settings\\.json|system[\\\\/][\\w.-]+|auto-memory[\\\\/]|etanah-knowledge[\\\\/]|quest[\\\\/][\\w-]+\\.js)';
const SYS_PATH_TEXT = new RegExp('(?:^|[\\s`\'"(\\[])' + SYS, 'i');
const SYS_PATH_FILE = new RegExp(SYS, 'i');
const VERB = /\b(built|created|added|new|updated|changed|refined|moved|born|installed|removed|deleted|tightened|banned)\b/i;
const NEXT_STEPS = /^\s*(#{1,6}\s*|\*\*)\s*Next steps\b/i;
const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit', 'MultiEdit']);

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

// Reads the transcript once: the last assistant text, and the system files edited since the last real user message.
function readTurn(tp) {
  let raw; try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return { text: null, edited: [] }; }
  const rows = [];
  for (const l of raw.split(/\r?\n/)) { if (!l) continue; try { rows.push(JSON.parse(l)); } catch (_) {} }
  let text = null; const edited = [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const o = rows[i]; const m = o.message || o; const role = m.role || o.type; const c = m.content;
    if (role === 'user') {
      const isToolResult = Array.isArray(c) && c.some(b => b && b.type === 'tool_result');
      if (!isToolResult) break; // a real user message ends the turn
      continue;
    }
    if (role !== 'assistant') continue;
    if (typeof c === 'string') { if (text === null && c.trim()) text = c; continue; }
    if (!Array.isArray(c)) continue;
    if (text === null) { const t = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n'); if (t.trim()) text = t; }
    for (const b of c) {
      if (b && b.type === 'tool_use' && EDIT_TOOLS.has(b.name)) {
        const fp = String((b.input && (b.input.file_path || b.input.notebook_path)) || '');
        if (SYS_PATH_FILE.test(fp)) edited.push(fp);
      }
    }
  }
  return { text, edited };
}

function evaluate(text, edited) {
  edited = (edited || []).filter(p => SYS_PATH_FILE.test(String(p)));
  if (text && BYPASS.test(text)) return { verdict: 'pass', reason: 'bypass' };
  const body = String(text || '').replace(/```[\s\S]*?```/g, '');
  let hit = edited.length ? 'edited this turn: ' + path.basename(edited[0]) + (edited.length > 1 ? ' +' + (edited.length - 1) + ' more' : '') : null;
  if (!hit) {
    for (const l of body.split(/\r?\n/)) {
      if (NEXT_STEPS.test(l)) break;
      if (SYS_PATH_TEXT.test(l) && VERB.test(l)) { hit = l.trim(); break; }
    }
  }
  if (!hit) return { verdict: 'pass', reason: 'no-system-change' };
  const twice = repeatedKind(body);
  if (twice) return { verdict: 'block', reason: 'kind headed twice: ' + twice, line: 'System › ' + twice + ' appears more than once' };
  if (HEADING.test(body)) return { verdict: 'pass', reason: 'breadcrumb-heading-present' };
  return { verdict: 'block', reason: edited.length ? 'system files edited, no breadcrumb heading' : 'system change reported, no breadcrumb heading', line: hit.slice(0, 160) };
}

function main() {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch (_) {}
  if (input.stop_hook_active) return;
  const turn = input.transcript_path ? readTurn(input.transcript_path) : { text: null, edited: [] };
  const r = evaluate(turn.text, turn.edited);
  log({ verdict: r.verdict, reason: r.reason, edited: turn.edited.length });
  if (r.verdict === 'block') {
    process.stdout.write(JSON.stringify({ decision: 'block', reason: '⛔ system-change-title: you changed the system this turn, but the reply does not show where each change sits, one table per kind.\n   Seen: "' + r.line + '"\n   ONE heading per KIND: `## System › <Rule|Workflow|Feature|Tool|Memory|Kernel|Project> (new|changed)`, then ONE table, one row per part: Name · Parent · New or changed · one line (reply-shape-spec §3i). Never the same kind headed twice.\n   ⚡ DELTA ONLY: re-send just those headed sections, not the whole reply.\n   Not a system change? [skip-system-change-title: <reason>]' }));
  }
}

if (require.main === module) { try { main(); } catch (_) { /* fail-open */ } }
module.exports = { evaluate, readTurn, repeatedKind };
