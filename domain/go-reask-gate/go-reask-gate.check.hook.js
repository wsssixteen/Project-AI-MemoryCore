#!/usr/bin/env node
// go-reask-gate.check.hook.js — born via core/forge.js (2026-10-30)
// TRIGGER: Stop: his own recent messages (lib/his-words decide, 8 back, no later hold) already ordered a send/submit/post/alter/proceed, and my reply or wrap_up asks him to approve or confirm that same send
// ACTION: BLOCK the stop: say his order and its quote, tell me to do the step now; bypass [genuine-fork: <reason>]
// Replay (287186, 2026-10-30): "approve A1E3-7EAD, submit it" → alter run → "Post the 287186 Redmine note to Amani now?" → "Reply go and it posts".
// A NEW approval code he has not typed is not his order yet (prod-alter-gate needs his own code), so asking for it passes.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const { decide } = require(path.join(ROOT, 'lib', 'his-words.js'));
const LOG = path.join(__dirname, 'log.jsonl');

// His order: a go-word or an imperative that names a send.
const GO = /\b(?:approve[ds]?|submit(?:s|ted)?(?: it| now)?|post(?: it| now)|send(?: it| now)?|proceed|go(?: ahead)?|do it|run it|push it|yes|ok(?:ay)?|setuju|teruskan|hantar(?:kan)?|settle (?:it|that|them))\b/i;
const ACTION = /\b(?:submit|post|send|alter|proceed|approve|push|hantar)\w*/i;
const COMPLAINT = /\bwhy\b[^.?!\n]{0,60}\bnot\s+(?:submit|send|post|hantar)\w*|\b(?:ask(?:ing)?(?: me)? again|going to ask|keep(?:s)? (?:on )?asking|is that (?:not )?clear(?: enough)?|already (?:said|told|approved|gave))\b/i;
// My re-ask: a question or a "reply X to go" that hands the same send back to him.
const REASK = [
  /\b(?:approve|confirm|submit|post|send|proceed|go ahead|alter)\b[^?\n]{0,90}\?/i,
  /\breply\s+\**\s*[`"']?(?:go|yes|ok|approve|submit|post|send)\b/i,
  /\b(?:shall|should|can|may) I (?:post|submit|send|proceed|run|alter|go ahead|push)\b/i,
  /\b(?:waiting|wait) (?:for|on) your (?:go|ok|approval|nod|word)\b/i,
  /\bneeds? your (?:go|ok|approval|nod)\b/i,
];
const CODE = /\b[A-F0-9]{4}-[A-F0-9]{4}\b/g;

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) { /* never block on a log */ } }

// My words since his last message: assistant text blocks + the wrap_up "ask" field.
function mineSince(tp, sinceTs) {
  let raw = ''; try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return ''; }
  const L = raw.split(/\r?\n/).filter(Boolean);
  const out = [];
  for (let i = L.length - 1; i >= 0 && out.length < 40; i--) {
    let o; try { o = JSON.parse(L[i]); } catch (_) { continue; }
    if (sinceTs && o.timestamp && o.timestamp <= sinceTs) break;
    if (o.type !== 'assistant') continue;
    const c = (o.message || {}).content;
    if (typeof c === 'string') { out.push(c); continue; }
    if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (b && b.type === 'text' && b.text) out.push(b.text);
      if (b && b.type === 'tool_use' && /wrap_up$/.test(String(b.name || '')) && b.input && b.input.ask) out.push(String(b.input.ask));
    }
    if (!sinceTs && out.length) break; // no timestamps: the final reply only
  }
  return out.reverse().join('\n');
}

runHook({ name: 'go-reask-gate', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  if (data.stop_hook_active || !data.transcript_path) return { fired: false };
  const tp = String(data.transcript_path);
  const his = decide(tp, { limit: 8, approve: GO, action: ACTION, complaint: COMPLAINT });
  if (his.verdict !== 'approve') return { fired: false };
  const mine = mineSince(tp, his.ts || null);
  if (!mine || /\[genuine-fork\s*:/i.test(mine)) return { fired: false };
  const hit = REASK.map(re => mine.match(re)).find(Boolean);
  if (!hit) return { fired: false };
  // A new approval code he has never typed is a new ask the PROD gate requires.
  const myCodes = mine.match(CODE) || [];
  if (myCodes.length && myCodes.some(c => !his.text.toUpperCase().includes(c))) { log({ outcome: 'passed-new-code', codes: myCodes }); return { fired: false }; }
  log({ outcome: 'blocked-reask', his: his.text.slice(0, 120), mine: hit[0].slice(0, 120) });
  return { fired: true, blocked: true, blockReason: [
    '⛔ go-reask-gate: you are asking him to approve a step he already ordered.',
    `   his order (${his.back} message(s) back): "${his.text.replace(/\s+/g, ' ').slice(0, 120)}"`,
    `   your ask: "${hit[0].replace(/\s+/g, ' ').slice(0, 120)}"`,
    '   Do the step now and report it done. A tool or gate refused it? Say which and what you tried, then try the next path; never hand the same go back to him.',
    '   ⚡ DELTA ONLY: no re-emitted reply. Only a genuinely new decision (a new code, a new recipient)? add [genuine-fork: <reason>].',
  ].join('\n') };
});
