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
// Handover rider (2026-11-13, 289337): a turn that also STAGES a note or fix file for the other team needs the /handover line.
const STAGE_RX = /issue_notes|[\\/]2\. Fix[\\/]|[\\/]\d+\. Rework[\\/]/i;
// each of proof / fix / audit must carry a real value, never the '<placeholder>' of the help text
const HANDOVER_RX = /^[ \t>*_|-]*\**Handover\**\s*:\**\s*proof\s+[^\s<][^\n]*\bfix\s+[^\s<][^\n]*\baudit\s+[^\s<][^\n]*$/im;
const FIX_NONE_RX = /\bfix\s+none\s*:\s*(\S+)/i;
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

// Pure: transcript lines → true when the current turn staged a note or fix file (tool input names the Redmine notes box,
// a file upload, or a path under 2. Fix\ or N. Rework\).
function currentTurnStaged(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(lines[i]); } catch (_) { continue; }
    if (isUserPrompt(o)) break;
    const c = o.type === 'assistant' && (o.message || {}).content;
    if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (!b || b.type !== 'tool_use') continue;
      if (/file_upload$/.test(b.name || '')) return true;
      let inp = ''; try { inp = JSON.stringify(b.input || {}); } catch (_) {}
      if (STAGE_RX.test(inp.replace(/\\\\/g, '\\'))) return true;
    }
  }
  return false;
}

function decide(text, staged) {
  const s = String(text || '');
  if (!s.trim() || !VERDICT_RX.test(s)) return { fire: false };
  if (BYPASS_RX.test(s)) return { fire: true, block: false, bypass: true };
  const verdict = (s.match(VERDICT_RX) || [''])[0];
  if (!PROOF_RX.test(s)) return { fire: true, block: true, verdict };
  if (!staged) return { fire: true, block: false };
  const h = s.match(HANDOVER_RX);
  if (!h) return { fire: true, block: true, verdict, handover: 'missing' };
  const none = h[0].match(FIX_NONE_RX);
  if (none && !/^(data|config|env)\b/i.test(none[1])) return { fire: true, block: true, verdict, handover: 'bad-none' };
  return { fire: true, block: false, handover: 'ok' };
}

if (require.main === module) {
  const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'ownership-input-check', event: 'Stop' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    if (data.stop_hook_active) return { fired: false }; // re-entry: never loop
    let raw; try { raw = fs.readFileSync(data.transcript_path || '', 'utf8'); } catch (_) { return { fired: false }; }
    const tl = raw.split(/\r?\n/).filter(Boolean);
    const d = decide(currentTurnText(tl), currentTurnStaged(tl));
    if (!d.fire) return { fired: false };
    log({ outcome: d.bypass ? 'bypassed' : d.block ? 'blocked' : 'pass', verdict: d.verdict || '', handover: d.handover || '' });
    if (d.bypass) return { fired: true, blocked: false, bypassed: true, bypassToken: 'skip-ownership-input' };
    if (!d.block) return { fired: true, blocked: false };
    if (d.handover) return {
      fired: true, blocked: true,
      blockReason: '⛔ ownership-input-check (handover): this turn staged a note or fix file for another team ("' + d.verdict + '") ' +
        (d.handover === 'bad-none' ? 'with "fix none:" outside data / config / env.\n' : 'without the Handover line.\n') +
        '   Run the /handover skill: proof split, fix file in the cycle folder, highest-model audit, focused note.\n' +
        '   Add one line:  Handover: proof <n% or proven> · fix <file in 2. Fix | none: data|config|env> · audit <model> <verdict>\n' +
        '   ⚡ DELTA ONLY — do not re-emit the reply. Bypass: [skip-ownership-input: <why>]',
    };
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

module.exports = { currentTurnText, currentTurnStaged, decide, VERDICT_RX, PROOF_RX, HANDOVER_RX };
