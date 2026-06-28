/**
 * quest-doc-freshness.discipline.hook.js — Stop hook (Power: quest-doc-freshness)
 *
 * Keeps the active quest's qa_doc fresh ON THE FLY. After each reply during an
 * active quest, if the reply CHANGED quest state (a finding / decision / fix /
 * verification / test-data / phase) but the qa_doc was NOT written this turn,
 * it flags "persist now" — so context never evaporates between the work and the
 * save (the curse-of-knowledge / save-gap class, みや 2026-06-28).
 *
 * It is the DETERMINISTIC trigger; the proper WRITE is a model action — spawn a
 * general-purpose familiar to persist (per the QA-NNNN.md persistence rule),
 * non-blocking. A hook cannot author the nuanced content, only detect the need.
 *
 * REPORT-ONLY (advisory) — never blocks. Trigger = state-changing reply, NOT
 * every reply (discussion turns don't churn the doc). /system-design Rule 8.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');
const LOG = path.join(__dirname, 'log.jsonl');
const OPEN_STATUSES = new Set(['active', 'hold', 'blocked', 'delegated']);
const FRESH_MS = 120 * 1000; // qa_doc edited within 2 min => written this turn => no flag

// state-change signals in MY reply (advisory — false-positive cost is one ignorable nudge)
const SIGNAL_RE = /\broot cause\b|\bfinding\b|\bdecided\b|fix (applied|shape|is|=)|\bverified\b|\bcommitted\b|\bedited\b|test app|permohonan|\bphase \d|chalk-back|✅\s*done|confirmed (the|that|it)/i;

function safeRead(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function logFire(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch {} }

function parseBlocks(text) {
  const blocks = []; let cur = [];
  for (const raw of text.split(/\r?\n/)) { const l = raw.trimEnd(); if (l === '') { if (cur.length) { blocks.push(cur); cur = []; } } else cur.push(l); }
  if (cur.length) blocks.push(cur);
  return blocks;
}
function fieldOf(block, key) {
  for (const line of block) { const s = line.replace(/^\s+/, ''); if (s.startsWith(key + '=')) return s.slice(key.length + 1).trim(); }
  return null;
}
function activeQuest() {
  const text = safeRead(ACTIVE_TXT);
  if (!text) return null;
  for (const b of parseBlocks(text)) {
    if (!b.some(l => /^\s*qa=/.test(l))) continue;
    const qa = fieldOf(b, 'qa'), status = fieldOf(b, 'status'), qaDoc = fieldOf(b, 'qa_doc');
    if (qa && status === 'active' && qaDoc) return { qa, qaDoc };  // only the ACTIVE one (work in progress)
  }
  return null;
}
function lastAssistantText(transcriptPath) {
  const raw = safeRead(transcriptPath);
  if (!raw) return '';
  const lines = raw.trim().split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj; try { obj = JSON.parse(lines[i]); } catch { continue; }
    const msg = obj.message || obj;
    const role = msg.role || obj.role || obj.type;
    if (role !== 'assistant') continue;
    const c = msg.content;
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) { const t = c.filter(x => x && x.type === 'text').map(x => x.text).join(' '); if (t) return t; }
  }
  return '';
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const q = activeQuest();
    if (!q) { process.exit(0); }
    let transcriptPath = null;
    try { transcriptPath = (JSON.parse(input || '{}').transcript_path) || null; } catch {}
    const reply = transcriptPath ? lastAssistantText(transcriptPath) : '';
    const signalled = reply ? SIGNAL_RE.test(reply) : true; // no transcript => can't tell => fall back to mtime alone
    const docAbs = path.join(REPO_ROOT, q.qaDoc.replace(/\//g, path.sep));
    let ageMs = Infinity;
    try { ageMs = Date.now() - fs.statSync(docAbs).mtimeMs; } catch {}
    const stale = ageMs > FRESH_MS;
    if (signalled && stale) {
      console.log(`📝 PERSIST qa_doc — this reply looks state-changing but ${q.qaDoc} was not updated this turn (last edit ${Math.round(ageMs / 60000)}m ago).`);
      console.log(`   → Spawn a general-purpose familiar to persist the change into ${q.qa}'s qa_doc (non-blocking) before context evaporates.`);
      logFire({ qa: q.qa, flagged: true, ageMin: Math.round(ageMs / 60000), hadTranscript: !!reply });
    } else {
      logFire({ qa: q.qa, flagged: false, signalled, stale });
    }
  } catch (e) { /* never block */ }
  process.exit(0);
});
