#!/usr/bin/env node
// db-claim-proof.check.hook.js — born via core/forge.js (2026-09-24)
// TRIGGER: reply ends a turn that ran a DB query tool (postgres/oracle query_database) and states findings
// ACTION: block unless the reply carries the proving SELECT (SELECT ... FROM) or a bypass with a real reason
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
// STATE-SCOPE: state-agnostic — matches every postgres-* / oracle-* MCP query tool.
'use strict';
const path = require('path');
const fs = require('fs');

const DB_TOOL_RX = /^mcp__(?:postgres|oracle)[\w-]*__(?:query_database|count_rows)$/;
// FROM must be followed by a real identifier, so a quoted "SELECT ... FROM ..." (this gate's own text) is not proof.
const PROOF_RX = /\bSELECT\b[\s\S]{0,600}?\bFROM\s+[A-Za-z_][\w.]*/i;
// first reason char may not be '<' so the help text '[skip-db-proof: <reason>]' never disarms the gate
const BYPASS_RX = /\[skip-db-proof:\s*[^\]\s<][^\]]*\]/i;
const LOG = process.env.DBCP_LOG || path.join(__dirname, 'log.jsonl');
function log(row) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch (_) {} }

// A genuine user prompt ends the turn walk; tool_result carriers and meta companions do not.
function isUserPrompt(o) {
  if (o.type !== 'user' || o.isMeta) return false;
  const c = (o.message || {}).content;
  if (typeof c === 'string') return true;
  return Array.isArray(c) && !c.some(b => b && b.type === 'tool_result');
}

// Pure: transcript lines → { dbTools, text } for the current turn.
function currentTurn(lines) {
  const dbTools = []; let text = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(lines[i]); } catch (_) { continue; }
    if (isUserPrompt(o)) break;
    if (o.type !== 'assistant') continue;
    const c = (o.message || {}).content;
    if (!Array.isArray(c)) { if (typeof c === 'string') text = c + '\n' + text; continue; }
    let t = '';
    for (const b of c) {
      if (b && b.type === 'text' && b.text) t += b.text + '\n';
      if (b && b.type === 'tool_use' && DB_TOOL_RX.test(b.name || '')) dbTools.push(b.name);
    }
    text = t + text;
  }
  return { dbTools, text };
}

function decide({ dbTools, text }) {
  if (!dbTools.length) return { fire: false };
  if (!String(text).trim()) return { fire: false };
  if (BYPASS_RX.test(text)) return { fire: true, block: false, bypass: true };
  if (PROOF_RX.test(text)) return { fire: true, block: false };
  return { fire: true, block: true };
}

if (require.main === module) {
  const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'db-claim-proof', event: 'Stop' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    if (data.stop_hook_active) return { fired: false }; // re-entry: never loop
    let raw; try { raw = fs.readFileSync(data.transcript_path || '', 'utf8'); } catch (_) { return { fired: false }; }
    const turn = currentTurn(raw.split(/\r?\n/).filter(Boolean));
    const d = decide(turn);
    if (!d.fire) return { fired: false };
    log({ tools: turn.dbTools.length, outcome: d.bypass ? 'bypassed' : d.block ? 'blocked' : 'pass' });
    if (d.bypass) return { fired: true, blocked: false, bypassed: true, bypassToken: 'skip-db-proof' };
    if (!d.block) return { fired: true, blocked: false };
    return {
      fired: true, blocked: true,
      blockReason: `⛔ db-claim-proof: this turn ran ${turn.dbTools.length} DB query(s) and the reply shows no SELECT.\n` +
        '   Every DB fact miya reads ships with the SELECT that proves it (unqualified, no JOIN, runnable by him).\n' +
        '   ⚡ DELTA ONLY: output just the proving SELECT(s) under the claim they prove; do not re-emit the reply.\n' +
        '   No DB fact in the reply? add [skip-db-proof: <why>] to it.',
    };
  });
}

module.exports = { currentTurn, decide, isUserPrompt };
