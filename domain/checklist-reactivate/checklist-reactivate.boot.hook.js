/**
 * checklist-reactivate.boot.hook.js — SessionStart hook (Power: checklist-reactivate)
 *
 * Re-surfaces persisted task Next-Steps Checklists at every session boot.
 *
 * The gap it closes (みや 2026-06-28): per-turn checklists (TurnChecklistGate)
 * are throwaway — nothing carried a multi-session task's "what's next" list
 * across sessions, so work drifted into item-by-item improvisation. The
 * /checklist skill persists a `## Next-Steps Checklist` table into each task's
 * qa_doc; this hook READS that section for every OPEN quest at boot and surfaces
 * the still-open rows, so a resumed session immediately sees the next actions.
 *
 * Complements open-quest-surfacer.js (one-liner per quest); this adds the
 * checklist depth. REPORT-ONLY — never blocks boot, fail-open.
 *
 * Contract: SessionStart. Reads quest/active.txt → for each block with
 *   status ∈ {active,hold,blocked,delegated} AND a qa_doc= → opens the doc,
 *   extracts the `## Next-Steps Checklist` markdown table, prints rows whose
 *   Status cell is NOT done (no ✅ / "done"). Silent when nothing to surface.
 *
 * Instrumentation (system-rules Rule 5): every fire appends one line to
 *   domain/checklist-reactivate/log.jsonl — {ts, quests, items} — so the
 *   decay audit can read fire-rate vs effectiveness without a debug session.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\0. AI\\Project-AI-MemoryCore';
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');
const LOG = path.join(REPO_ROOT, 'domain', 'checklist-reactivate', 'log.jsonl');
const OPEN_STATUSES = new Set(['active', 'hold', 'blocked', 'delegated']);
const DONE_MARK = /✅|\bdone\b/i;

function safeRead(p) { try { return fs.readFileSync(p, 'utf-8'); } catch { return null; } }
function logFire(quests, items) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), quests, items }) + '\n'); } catch {}
}

function parseBlocks(text) {
  const blocks = []; let cur = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (line === '') { if (cur.length) { blocks.push(cur); cur = []; } }
    else cur.push(line);
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

// Pull the still-open rows of a `## Next-Steps Checklist` markdown table.
function extractOpenChecklist(docText) {
  const rows = [];
  let inSection = false;
  for (const line of docText.split(/\r?\n/)) {
    if (/^##\s/.test(line)) { inSection = /next[- ]?steps?\s+checklist/i.test(line); continue; }
    if (!inSection || !line.trim().startsWith('|')) continue;
    const parts = line.split('|').slice(1, -1).map(c => c.trim());
    if (parts.length < 2) continue;
    if (/^#+$/.test(parts[0]) || /^-+$/.test(parts[0]) || parts[0].toLowerCase() === '#') continue; // header / divider
    const status = parts[parts.length - 1];
    if (DONE_MARK.test(status)) continue; // skip closed rows
    rows.push({
      num: parts[0],
      item: (parts[1] || '').slice(0, 72),
      owner: parts.length >= 4 ? parts[2] : '',
      status: status.slice(0, 40),
    });
  }
  return rows;
}

function main() {
  const text = safeRead(ACTIVE_TXT);
  if (!text) return; // open-quest-surfacer already warns on missing active.txt
  const surfaced = [];
  for (const block of parseBlocks(text)) {
    if (!block.some(l => /^\s*qa=/.test(l))) continue;
    const qa = fieldOf(block, 'qa');
    const status = fieldOf(block, 'status');
    const qaDoc = fieldOf(block, 'qa_doc');
    if (!qa || !status || !OPEN_STATUSES.has(status) || !qaDoc) continue;
    const docText = safeRead(path.join(REPO_ROOT, qaDoc.replace(/\//g, path.sep)));
    if (!docText) continue;
    const open = extractOpenChecklist(docText);
    if (open.length) surfaced.push({ qa, open });
  }
  const totalItems = surfaced.reduce((n, s) => n + s.open.length, 0);
  logFire(surfaced.length, totalItems);
  if (!surfaced.length) return; // stay quiet — nothing persisted yet
  console.log(`📋 ACTIVE CHECKLISTS — persisted Next-Steps for ${surfaced.length} open quest(s):`);
  for (const s of surfaced) {
    console.log(`   ${s.qa} — ${s.open.length} open item(s):`);
    for (const r of s.open) {
      console.log(`      ${r.num}. ${r.item}${r.owner ? ' [' + r.owner + ']' : ''} — ${r.status}`);
    }
  }
  console.log('   → Resume from these; update the qa_doc ## Next-Steps Checklist as items close.');
}

try { main(); } catch (e) { console.log(`⚠️  checklist-reactivate: ${e.message}`); }
