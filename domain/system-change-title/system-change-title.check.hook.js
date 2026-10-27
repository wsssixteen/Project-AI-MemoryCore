#!/usr/bin/env node
// system-change-title.check.hook.js — born via core/forge.js (2026-10-27); enforces .claude/reply-shape-spec.md §3i
// symptom: 2026-10-27 (286462): system-change replies listed a script, a gate, a skill line and a people row together;
//          miya could not tell which kind of part each one was
// goal: every reply about a system change tells miya at a glance which kind of part changed and whether it is new or changed
// SIGNAL: outside code blocks and outside the Next steps section, one line names a system path AND a change verb
// BLOCK: no heading in the reply opens with a bracketed kind [Rule|Workflow|Feature|Tool|Memory|Kernel|Project ...]
// PASS: no system-change line · at least one bracketed-kind heading
// BYPASS: [skip-system-change-title: <reason>] · FAIL-OPEN on any error
// Runs inside the stop-reply-shape bundle (lib/dispatch-hooks.js), not a standalone registration (system-rules Rule 7)
// Log: domain/system-change-title/log.jsonl
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');
const BYPASS = /\[skip-system-change-title:\s*[^\]\s][^\]]*\]/i;
const KINDS = 'Rule|Workflow|Feature|Tool|Memory|Kernel|Project';
const HEADING = new RegExp('^\\s*#{1,6}\\s*\\[(' + KINDS + ')s?\\b', 'im');
const SYS_PATH = /(?:^|[\s`'"(\[])(?:domain[\\/][\w-]+|lib[\\/][\w-]+\.js|core[\\/][\w-]+\.js|\.claude[\\/](?:skills|hooks)[\\/]|\.claude[\\/]CLAUDE\.md|\.claude[\\/]settings\.json|reply-shape-spec\.md|personality\.md|system[\\/][\w.-]+|auto-memory[\\/]|etanah-knowledge[\\/]|quest[\\/][\w-]+\.js|settings\.json)/i;
const VERB = /\b(built|created|added|new|updated|changed|refined|moved|born|installed|removed|deleted|tightened|banned)\b/i;
const NEXT_STEPS = /^\s*(#{1,6}\s*|\*\*)\s*Next steps\b/i;

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

function lastText(tp) {
  let raw; try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return null; }
  const L = raw.split(/\r?\n/).filter(Boolean);
  for (let i = L.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(L[i]); } catch (_) { continue; }
    const m = o.message || o;
    if ((m.role || o.type) !== 'assistant') continue;
    const c = m.content; let t = '';
    if (typeof c === 'string') t = c;
    else if (Array.isArray(c)) t = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
    if (t.trim()) return t;
  }
  return null;
}

function evaluate(text) {
  if (!text) return { verdict: 'pass', reason: 'no-text' };
  if (BYPASS.test(text)) return { verdict: 'pass', reason: 'bypass' };
  const body = text.replace(/```[\s\S]*?```/g, '');
  let hit = null;
  for (const l of body.split(/\r?\n/)) {
    if (NEXT_STEPS.test(l)) break;
    if (SYS_PATH.test(l) && VERB.test(l)) { hit = l.trim(); break; }
  }
  if (!hit) return { verdict: 'pass', reason: 'no-system-change' };
  if (HEADING.test(body)) return { verdict: 'pass', reason: 'kind-heading-present' };
  return { verdict: 'block', reason: 'system change reported with no [kind] heading', line: hit.slice(0, 160) };
}

function main() {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch (_) {}
  if (input.stop_hook_active) return;
  const r = evaluate(input.transcript_path ? lastText(input.transcript_path) : null);
  log({ verdict: r.verdict, reason: r.reason });
  if (r.verdict === 'block') {
    process.stdout.write(JSON.stringify({ decision: 'block', reason: '⛔ system-change-title: this reply reports a system change but no heading names its kind.\n   Seen: "' + r.line + '"\n   Give each changed part its own heading: `## [<Rule|Workflow|Feature|Tool|Memory|Kernel|Project> · new|changed] <name>` + one plain line on what it does now (reply-shape-spec §3i).\n   ⚡ DELTA ONLY: re-send just those headed sections, not the whole reply.\n   Not a system change? [skip-system-change-title: <reason>]' }));
  }
}

if (require.main === module) { try { main(); } catch (_) { /* fail-open */ } }
module.exports = { evaluate };
