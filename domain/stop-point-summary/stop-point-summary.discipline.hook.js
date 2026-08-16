/**
 * stop-point-summary.discipline.hook.js — Stop hook
 * Feature: domain/stop-point-summary/
 *
 * PURPOSE (みや 2026-07-06): a substantive assistant turn that ends WITHOUT a
 *   Stop-Point Summary (per .claude/skills/stop-point-summary/SKILL.md) = a
 *   "left hanging" failure. Block the stop so Ruri must emit the summary.
 *
 * Replaces the retired advisory `stop-point-todo-table` PostToolUse hook, which
 *   (a) only fired on code Edit/Write (missed non-Edit substantive turns),
 *   (b) accepted a free-text `[skip-stop-point-todo: <reason>]` bypass that
 *       Ruri abused ("mid-implementation" / "3 more steps pending" / etc.) —
 *       resulting in many replies with NO end-of-turn summary at all despite
 *       みや's months-old rule.
 *
 * SIGNAL — substance detection (any of these ⇒ substantive turn requiring summary):
 *   • tool_use count in the current assistant turn ≥ 1                (any tool call = substance)
 *   • assistant text length ≥ 300 chars AND (has code block ``` OR markdown table OR ≥ 8 lines)
 *
 * SIGNAL — summary present (any of these ⇒ summary was emitted):
 *   • "## ▶ <Stage Title>" header (canonical shape from the skill)
 *   • "**Next:**" or "**Notes:**" bold-labeled lines
 *   • Any stage title from the skill's title taxonomy
 *   • "Micro-Summary:" for the lightweight variant
 *
 * BYPASS — whitelist enum ONLY (no free-text):
 *   [skip-stop-point-summary: pure-ack|question-only|error-only|de-mode|closing-voice]
 *   Any other reason string = block with legacy-bypass-rejected message.
 *
 * EXEMPT (structural, no bypass token needed):
 *   • Domain Expansion banner ("═══ [ Domain Expansion ] ═══")
 *   • Bankai banner
 *   • るり結界 closing
 *
 * FAIL-OPEN: any error → allow stop.
 * RECURSION GUARD: exit-0 when stop_hook_active is set (harness re-entry).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');

const BYPASS_WHITELIST = /\[skip-stop-point-summary:\s*(pure-ack|question-only|error-only|de-mode|closing-voice)\s*\]/;
const BYPASS_ANY = /\[skip-stop-point-(?:summary|todo):\s*([^\]]+)\]/;

const EXEMPT_STRUCT = /═══ \[ Domain Expansion \] ═══|るり結界|🌌 蒼穹宝典|Bankai 🌌/;

const SUMMARY_MARKERS = [
  /##\s*▶\s+\S/,
  /\*\*Next:\*\*/,
  /\*\*Notes:\*\*/,
  /Test Scenario\b/,
  /(?:Recon|Apply|Rubric|Discovery|Simulate|Close-out) Summary\b/,
  /Where We Are\b/,
  /Blocked\s*—\s*Awaiting/,
  /Stop-Point Summary\b/,
  /^Micro-Summary:/m,
  /^## ✅ This-turn checklist/m,
];

function hasSummary(text) {
  return SUMMARY_MARKERS.some(rx => rx.test(text));
}

function isSubstantive(text, toolUseCount) {
  if (toolUseCount >= 1) return true;
  const t = text.trim();
  if (t.length < 300) return false;
  const lines = t.split(/\r?\n/).length;
  if (lines >= 8) return true;
  if (/```[\s\S]*?```/.test(text)) return true;
  if (/^\s*\|.*\|\s*$/m.test(text)) return true;
  return false;
}

function log(o) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {}
}

function readLastAssistantTurn(tp) {
  let raw;
  try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return { text: '', toolUseCount: 0 }; }
  const L = raw.split(/\r?\n/).filter(Boolean);
  let text = '';
  let toolUseCount = 0;
  for (let i = L.length - 1; i >= 0; i--) {
    let o;
    try { o = JSON.parse(L[i]); } catch (_) { continue; }
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
        else if (b.type === 'tool_use') toolUseCount++;
      }
      text = localText + text;
    }
  }
  return { text, toolUseCount };
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    if (data.stop_hook_active) { log({ action: 'recursion-skip' }); process.exit(0); }

    const { text, toolUseCount } = readLastAssistantTurn(data.transcript_path || '');
    if (!text) { log({ action: 'no-text' }); process.exit(0); }

    if (EXEMPT_STRUCT.test(text)) { log({ action: 'exempt-struct' }); process.exit(0); }

    const wl = text.match(BYPASS_WHITELIST);
    if (wl) { log({ action: 'bypass-whitelist', reason: wl[1] }); process.exit(0); }

    const bany = text.match(BYPASS_ANY);
    if (bany) {
      log({ action: 'legacy-bypass-rejected', reason: bany[1] });
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: [
          '⛔ stop-point-summary: bypass token found but reason is NOT in the whitelist enum.',
          '   Whitelist: [skip-stop-point-summary: pure-ack|question-only|error-only|de-mode|closing-voice]',
          '   Free-text reasons like "mid-implementation" / "3 more steps pending" / "will summarize later"',
          '   are the exact abuse pattern this Feature exists to kill. If the reply has substance,',
          '   emit the Stop-Point Summary NOW at this stop (defer is NOT valid — summary is per-stop).',
          '   See .claude/skills/stop-point-summary/SKILL.md.',
        ].join('\n'),
      }));
      process.exit(0);
    }

    if (!isSubstantive(text, toolUseCount)) {
      log({ action: 'trivial-skip', len: text.length, tools: toolUseCount });
      process.exit(0);
    }

    if (hasSummary(text)) {
      log({ action: 'passed', len: text.length, tools: toolUseCount });
      process.exit(0);
    }

    log({ action: 'blocked', len: text.length, tools: toolUseCount });
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: [
        '⛔ stop-point-summary: substantive turn ended WITHOUT a Stop-Point Summary.',
        '   Signal: text=' + text.length + ' chars · tool_uses=' + toolUseCount + '.',
        '   Emit ONE of these before stopping:',
        '',
        '     ▶ FULL form — for real stopping points (task done, phase boundary, hand-back):',
        '        ## ▶ <Stage Title>          e.g. "Test Scenario", "Where We Are", "Blocked — Awaiting X"',
        '        <one-line plain status>',
        '        | key | value |             ← load-bearing facts, one concern per cell',
        '        **Notes:** caveats / gotchas',
        '        **Next:** ✓ done <what> / ⬜ pending <specific action> — <who does it>',
        '',
        '     ▶ MICRO form — for mid-work stops that are not full phase boundaries:',
        '        Micro-Summary: <one line what changed> · <one line how to act> · <one line what next>',
        '',
        '   See .claude/skills/stop-point-summary/SKILL.md.',
        '   Genuinely no substance? Use ONLY one of these (whitelist enum):',
        '     [skip-stop-point-summary: pure-ack|question-only|error-only|de-mode|closing-voice]',
        '   Free-text reasons are REJECTED — they are the abuse pattern this Feature kills.',
        '   ⚡ DELTA ONLY: みや already read the reply above — output just the Micro-Summary line (or token); do NOT re-emit the reply.',
      ].join('\n'),
    }));
    process.exit(0);
  } catch (e) {
    log({ action: 'error', err: String(e) });
    process.exit(0);
  }
});
