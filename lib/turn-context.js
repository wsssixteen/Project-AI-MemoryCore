#!/usr/bin/env node
/**
 * lib/turn-context.js — M1/M2 of the turn-ledger monitoring layer (plan §M, 2026-09-06).
 *
 * goal: every telemetry row can be tied to ONE user turn (turn_id) + the quest/phase it served.
 * goal_signal: hook-fires rows carry turn_id/qa/phase; turns.jsonl has one row per user prompt.
 * retention: regenerate (current-turn-<sid>.json is ephemeral; overwritten per turn, safe to delete).
 *
 * API (used by lib/hook-runtime.js and lib/dispatch-hooks.js — zero new registrations):
 *   openTurn(input, event)  → on UserPromptSubmit: stamp current-turn-<sid>.json once per prompt
 *                             (lock-file mutex so 34 parallel hooks stamp ONE turn); other events: no-op
 *   contextFor(input)       → { turn_id, session_id, qa, phase } from the stamp (nulls when absent)
 *   readActive()            → top block of quest/active.txt → { qa, phase, status }
 *
 * Fail-open everywhere: any error → nulls; a monitor must never break the monitored.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'system', 'telemetry');
const ACTIVE = path.join(ROOT, 'quest', 'active.txt');

function sid8(sid) { return String(sid || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 8) || 'nosid'; }
function stampPath(sid) { return path.join(DIR, 'current-turn-' + sid8(sid) + '.json'); }

function parseInput(input) {
  if (input && typeof input === 'object') return input;
  try { return JSON.parse(input || '{}'); } catch (_) { return {}; }
}

// Top qa= block in quest/active.txt (any key shape: QA-NNN, ADHOC-…, ALTER-…).
function readActive() {
  const out = { qa: null, phase: null, status: null };
  try {
    const text = fs.readFileSync(ACTIVE, 'utf8');
    const m = text.match(/^qa=(\S+)[\s\S]*?(?=^qa=|(?![\s\S]))/m);
    if (!m) return out;
    const block = m[0];
    const get = k => { const r = block.match(new RegExp('^' + k + '=(.+)$', 'm')); return r ? r[1].trim() : null; };
    out.qa = get('qa'); out.phase = get('phase'); out.status = get('status');
  } catch (_) {}
  return out;
}

function readStamp(sid) {
  try { return JSON.parse(fs.readFileSync(stampPath(sid), 'utf8')); } catch (_) { return null; }
}

// Count prior user prompts in the transcript (string-content user rows = prompts; list-content = tool_result).
function countPrompts(transcriptPath) {
  try {
    const st = fs.statSync(transcriptPath);
    if (st.size > 20 * 1024 * 1024) return null; // huge: skip, fall back to counter
    let n = 0;
    for (const line of fs.readFileSync(transcriptPath, 'utf8').split('\n')) {
      if (line.indexOf('"type":"user"') < 0) continue;
      try { const r = JSON.parse(line); if (r.type === 'user' && r.message && typeof r.message.content === 'string') n++; } catch (_) {}
    }
    return n;
  } catch (_) { return null; }
}

function sleep(ms) { const end = Date.now() + ms; while (Date.now() < end) { /* spin: hooks are short-lived */ } }

function openTurn(input, event) {
  if (event !== 'UserPromptSubmit') return null;
  const data = parseInput(input);
  const sid = data.session_id || null;
  const prompt = typeof data.prompt === 'string' ? data.prompt : '';
  const hash = crypto.createHash('sha1').update(prompt).digest('hex').slice(0, 10);
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const prev = readStamp(sid);
    if (prev && prev.prompt_hash === hash && Date.now() - Date.parse(prev.opened_ts) < 8000) return prev; // same prompt, already stamped by a sibling hook
    const lock = stampPath(sid) + '.lock';
    let fd = null;
    try { fd = fs.openSync(lock, 'wx'); } catch (_) { fd = null; }
    if (fd === null) {
      // a sibling holds the lock: wait briefly for its stamp
      for (let i = 0; i < 15; i++) { sleep(20); const s = readStamp(sid); if (s && s.prompt_hash === hash) return s; }
      return readStamp(sid);
    }
    try {
      const again = readStamp(sid);
      if (again && again.prompt_hash === hash && Date.now() - Date.parse(again.opened_ts) < 8000) return again;
      let n = (again && again.session_id === sid && Number.isFinite(again.n)) ? again.n + 1 : null;
      if (n === null) { const c = countPrompts(data.transcript_path); n = c === null ? 1 : c + 1; }
      const act = readActive();
      const stamp = { v: 1, turn_id: sid8(sid) + '-' + n, session_id: sid, n, opened_ts: new Date().toISOString(), prompt_hash: hash, prompt_head: prompt.replace(/\s+/g, ' ').slice(0, 80), qa: act.qa, phase: act.phase, status: act.status, transcript_path: data.transcript_path || null };
      fs.writeFileSync(stampPath(sid), JSON.stringify(stamp));
      return stamp;
    } finally {
      try { fs.closeSync(fd); } catch (_) {}
      try { fs.unlinkSync(lock); } catch (_) {}
    }
  } catch (_) { return null; }
}

function contextFor(input) {
  const data = parseInput(input);
  const sid = data.session_id || null;
  const s = sid ? readStamp(sid) : null;
  return s ? { turn_id: s.turn_id, session_id: sid, qa: s.qa, phase: s.phase } : { turn_id: null, session_id: sid, qa: null, phase: null };
}

module.exports = { openTurn, contextFor, readActive, readStamp, stampPath, countPrompts, ROOT };
