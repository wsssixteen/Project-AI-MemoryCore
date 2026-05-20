/**
 * reply-log.js — Stop hook
 *
 * Fires every time Ruri finishes a response. Logs ONE JSONL row to
 * Feature/Time-Based-Aware-System/reply-log.jsonl with:
 *   { ts, qa_active, phase, status, gap_since_prev_minutes }
 *
 * Purpose: captures the work-session rhythm — when みや comes back, how long
 * between replies, how long the session is. Lightweight precursor to Memory
 * Track 2a-capture (full transcript capture).
 *
 * Created 2026-05-20 (QA-262039 retrospective — trigger-reliability discussion).
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const featurePath = path.join(projectRoot, 'Feature', 'Time-Based-Aware-System');
const activePath  = path.join(projectRoot, 'quest', 'active.txt');
const logPath     = path.join(featurePath, 'reply-log.jsonl');
const statePath   = path.join(featurePath, 'reply-log-state.json');

// Read the FIRST qa= block in active.txt (top = most recently touched).
function readActive() {
  const out = { qa: null, phase: null, status: null };
  try {
    if (!fs.existsSync(activePath)) return out;
    const text = fs.readFileSync(activePath, 'utf8');
    const blockMatch = text.match(/^qa=QA-\d+[\s\S]*?(?=^qa=QA-|\Z)/m);
    if (!blockMatch) return out;
    const block = blockMatch[0];
    const get = (k) => {
      const r = block.match(new RegExp('^' + k + '=(.+)$', 'm'));
      return r ? r[1].trim() : null;
    };
    out.qa = get('qa');
    out.phase = get('phase');
    out.status = get('status');
  } catch (e) {}
  return out;
}

function readState() {
  try {
    if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (e) {}
  return { last_ts: null };
}

function saveState(state) {
  try { fs.writeFileSync(statePath, JSON.stringify(state)); } catch (e) {}
}

// Drain stdin (we don't depend on payload shape — robust to any Stop payload).
let inputData = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => inputData += d);
process.stdin.on('end', () => {
  try {
    const now = new Date();
    const ts = now.toISOString();
    const state = readState();
    let gap = null;
    if (state.last_ts) {
      const diffMs = now.getTime() - new Date(state.last_ts).getTime();
      gap = Math.round(diffMs / 60000);
    }
    const active = readActive();
    const row = {
      ts,
      qa_active: active.qa,
      phase: active.phase,
      status: active.status,
      gap_since_prev_minutes: gap,
    };
    fs.mkdirSync(featurePath, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(row) + '\n');
    saveState({ last_ts: ts });
  } catch (e) {
    // never block — Stop hook must always exit 0
  }
  process.exit(0);
});
