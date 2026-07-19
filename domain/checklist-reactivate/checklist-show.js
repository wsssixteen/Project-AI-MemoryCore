/**
 * checklist-show.js — quest-resume CLI (Power: checklist-reactivate)
 *
 * Surfaces a quest's persisted `## Next-Steps Checklist` open rows ON DEMAND —
 * invoked by the /quest skill at resume (NOT at SessionStart). This is the
 * "reactivate" half; the /checklist skill is the "persist" half.
 *
 * Trigger placement (みや 2026-06-28): moved OFF SessionStart to avoid boot
 * bloat — open-quest-surfacer.js already gives boot awareness (the one-liner);
 * the checklist DETAIL is only needed when you actually re-engage a ticket.
 * So it fires at /quest resume, the precise moment of need.
 *
 * Usage:
 *   node checklist-show.js <QA>   — that quest only (e.g. 239386)
 *   node checklist-show.js        — all open quests with a checklist
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = require('path').resolve(__dirname, '..', '..'); // machine-independent (GHOST-HOOKS-2 fix 2026-07-19)
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');
const LOG = path.join(REPO_ROOT, 'domain', 'checklist-reactivate', 'log.jsonl');
const OPEN_STATUSES = new Set(['active', 'hold', 'blocked', 'delegated']);
const DONE_MARK = /✅|\bdone\b/i;
const FILTER_QA = (process.argv[2] || '').trim().replace(/^QA-?/i, ''); // optional, prefix-tolerant

function safeRead(p) { try { return fs.readFileSync(p, 'utf-8'); } catch { return null; } }
function logFire(quests, items) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), via: 'quest-resume', filter: FILTER_QA || 'all', quests, items }) + '\n'); } catch {}
}

function parseBlocks(text) {
  const blocks = []; let cur = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (line === '') { if (cur.length) { blocks.push(cur); cur = []; } } else cur.push(line);
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}
function fieldOf(block, key) {
  for (const line of block) {
    const s = line.replace(/^\s+/, '');
    if (s.startsWith(key + '=')) return s.slice(key.length + 1).trim();
  }
  return null;
}

function extractOpenChecklist(docText) {
  const rows = []; let inSection = false;
  for (const line of docText.split(/\r?\n/)) {
    if (/^##\s/.test(line)) { inSection = /next[- ]?steps?\s+checklist/i.test(line); continue; }
    if (!inSection || !line.trim().startsWith('|')) continue;
    const parts = line.split('|').slice(1, -1).map(c => c.trim());
    if (parts.length < 2) continue;
    if (/^#+$/.test(parts[0]) || /^-+$/.test(parts[0]) || parts[0].toLowerCase() === '#') continue;
    const status = parts[parts.length - 1];
    if (DONE_MARK.test(status)) continue;
    rows.push({ num: parts[0], item: (parts[1] || '').slice(0, 72), owner: parts.length >= 4 ? parts[2] : '', status: status.slice(0, 40) });
  }
  return rows;
}

function main() {
  const text = safeRead(ACTIVE_TXT);
  if (!text) { console.log('⚠️  checklist-show: cannot read quest/active.txt'); return; }
  const surfaced = [];
  for (const block of parseBlocks(text)) {
    if (!block.some(l => /^\s*qa=/.test(l))) continue;
    const qa = fieldOf(block, 'qa');
    const status = fieldOf(block, 'status');
    const qaDoc = fieldOf(block, 'qa_doc');
    if (!qa || !status || !OPEN_STATUSES.has(status) || !qaDoc) continue;
    if (FILTER_QA && !qa.replace(/^QA-?/i, '').includes(FILTER_QA)) continue;
    const docText = safeRead(path.join(REPO_ROOT, qaDoc.replace(/\//g, path.sep)));
    if (!docText) continue;
    const open = extractOpenChecklist(docText);
    if (open.length) surfaced.push({ qa, open });
  }
  const totalItems = surfaced.reduce((n, s) => n + s.open.length, 0);
  logFire(surfaced.length, totalItems);
  if (!surfaced.length) { console.log(`📋 No persisted Next-Steps Checklist for ${FILTER_QA || 'any open quest'}.`); return; }
  console.log(`📋 NEXT-STEPS CHECKLIST — ${surfaced.length} quest(s):`);
  for (const s of surfaced) {
    console.log(`   ${s.qa} — ${s.open.length} open item(s):`);
    for (const r of s.open) console.log(`      ${r.num}. ${r.item}${r.owner ? ' [' + r.owner + ']' : ''} — ${r.status}`);
  }
}

try { main(); } catch (e) { console.log(`⚠️  checklist-show: ${e.message}`); }
