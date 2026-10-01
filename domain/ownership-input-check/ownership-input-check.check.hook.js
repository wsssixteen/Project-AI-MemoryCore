#!/usr/bin/env node
// ownership-input-check.check.hook.js — born via core/forge.js (2026-10-01)
// TRIGGER: reply declares another team owns an etanah error (OWNED-ELSEWHERE / not our issue / common issue / GIS issue / bukan isu kami)
// ACTION: block unless the reply carries an 'Input check:' line naming each value our code passed into the other module's call and where it came from
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
// STATE-SCOPE: state-agnostic — the verdict phrase is the same in every state.
'use strict';
const path = require('path');
const fs = require('fs');

// Ownership verdicts that hand an error to another team.
const VERDICT_RX = /\bOWNED-ELSEWHERE\b|\bnot our (?:issue|bug|side|problem)\b|\bnot ours\b|\bbukan (?:isu|masalah) (?:kami|kita|plp|pelupusan)\b|\b(?:common|GIS)(?:[- ]side)? (?:issue|bug|owner|problem)\b|\bissue (?:is )?(?:from|on) (?:the )?common side\b/i;
// The proof line: "Input check:" followed by real content (not a placeholder).
const PROOF_RX = /^[ \t>*_|-]*\**Input check\**\s*:\**\s*[^\s<][^\n]{8,}/im;
// first reason char may not be '<' so the help text '[skip-ownership-input: <reason>]' never disarms the gate
const BYPASS_RX = /\[skip-ownership-input:\s*[^\]\s<][^\]]*\]/i;
const LOG = process.env.OIC_LOG || path.join(__dirname, 'log.jsonl');
function log(row) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch (_) {} }

function isUserPrompt(o) {
  if (o.type !== 'user' || o.isMeta) return false;
  const c = (o.message || {}).content;
  if (typeof c === 'string') return true;
  return Array.isArray(c) && !c.some(b => b && b.type === 'tool_result');
}

// Pure: transcript lines → assistant text of the current turn.
function currentTurnText(lines) {
  let text = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(lines[i]); } catch (_) { continue; }
    if (isUserPrompt(o)) break;
    if (o.type !== 'assistant') continue;
    const c = (o.message || {}).content;
    if (typeof c === 'string') { text = c + '\n' + text; continue; }
    if (!Array.isArray(c)) continue;
    let t = '';
    for (const b of c) if (b && b.type === 'text' && b.text) t += b.text + '\n';
    text = t + text;
  }
  return text;
}

function decide(text) {
  const s = String(text || '');
  if (!s.trim() || !VERDICT_RX.test(s)) return { fire: false };
  if (BYPASS_RX.test(s)) return { fire: true, block: false, bypass: true };
  if (PROOF_RX.test(s)) return { fire: true, block: false };
  return { fire: true, block: true, verdict: (s.match(VERDICT_RX) || [''])[0] };
}

if (require.main === module) {
  const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'ownership-input-check', event: 'Stop' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    if (data.stop_hook_active) return { fired: false }; // re-entry: never loop
    let raw; try { raw = fs.readFileSync(data.transcript_path || '', 'utf8'); } catch (_) { return { fired: false }; }
    const d = decide(currentTurnText(raw.split(/\r?\n/).filter(Boolean)));
    if (!d.fire) return { fired: false };
    log({ outcome: d.bypass ? 'bypassed' : d.block ? 'blocked' : 'pass', verdict: d.verdict || '' });
    if (d.bypass) return { fired: true, blocked: false, bypassed: true, bypassToken: 'skip-ownership-input' };
    if (!d.block) return { fired: true, blocked: false };
    return {
      fired: true, blocked: true,
      blockReason: `⛔ ownership-input-check: the reply hands an error to another team ("${d.verdict}") without an Input check line.\n` +
        '   Before handing it over: list every value OUR code passed into the other module\'s call (kod, id, schema, table, flag),\n' +
        '   say where each came from (file:line or DB row) and whether it was right. A name in their error can be built from our input.\n' +
        '   Run the cross-module-check skill (7 steps: call-site, inputs, name walk-back, sibling diff, version, env config, verdict).\n' +
        '   Add one line:  Input check: <value> = <what we sent> from <where> → correct / wrong\n' +
        '   ⚡ DELTA ONLY — do not re-emit the reply. Genuinely nothing of ours flows in? [skip-ownership-input: <why>]',
    };
  });
}

module.exports = { currentTurnText, decide, VERDICT_RX, PROOF_RX };
