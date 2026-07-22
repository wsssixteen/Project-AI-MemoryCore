/**
 * resume-readiness.js — cold-resume self-containment check (Power: checklist-reactivate)
 *
 * The third leg of the resumability trio:
 *   /checklist (persist) → checklist-show.js (reactivate) → resume-readiness.js (VERIFY)
 *
 * Why it exists (みや 2026-06-28): a familiar cold-resume test found 3 gaps in a
 * saved qa_doc (no test-app ID, abbreviated fix-paths, no build step). Root cause:
 * I wrote the doc for a context-sharing reader (me-now), not a cold reader — the
 * curse of knowledge. The existing catch-rules (full-names, test-data-echo,
 * operational-follow-through) are scoped to CHAT hand-backs, not the durable doc,
 * and /domain-expansion has NO qa_doc resume-check. This automates the familiar's
 * cold-resume test as a standing gate so it never depends on remembering to ask.
 *
 * Run at /quest hold AND folded into DE — flags any open quest whose qa_doc could
 * NOT be resumed cold. REPORT-ONLY.
 *
 * Usage:
 *   node resume-readiness.js <QA>   — check one quest (e.g. 239386)
 *   node resume-readiness.js        — check every open quest with a qa_doc
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = require('path').resolve(__dirname, '..', '..'); // machine-independent (GHOST-HOOKS-2 fix 2026-07-19)
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');
const LOG = path.join(REPO_ROOT, 'domain', 'checklist-reactivate', 'log.jsonl');
const OPEN_STATUSES = new Set(['active', 'hold', 'blocked', 'delegated']);
const FILTER_QA = (process.argv[2] || '').trim().replace(/^QA-?/i, '');

const PERMOHONAN_RE = /PT[A-Z]{3}\/\d{2}\/[A-Z]\/[A-Z0-9]+\/\d{4}\/\d+/;       // PTMLK/01/L/PSBS/2026/14
// AWAM quests have NO Permohonan ID by design — the test key is login + p_aplikasi_id
// (DEV-TESTING-HACKS.md:106). Before 2026-07-22 this check was structurally unpassable for
// every AWAM quest, producing a permanent false ✗ (QA-271721). Accept the AWAM shape too.
const AWAM_ID_RE = /\bp[_ ]?aplikasi[_ ]?id\b[^\n]{0,40}?\d{3,}/i;             // p_aplikasi_id 13089
const TESTDATA_NA_RE = /_no test data[^_\n]*_|_test data n\/a[^_\n]*_/i;       // explicit, justified n/a
const EMAIL_RE = /[\w.+-]+@[\w.-]+\.\w+|\b\w+@gov\.my\b/;
const BUILD_RE = /\b(build|deploy|redeploy|mvn|maven|\.war\b|jboss|compile)\b/i;
const FULLPATH_RE = /\.(java|xhtml|js|xml|docx|json)\b/i;                       // a real file ref, not "L8:33"

function safeRead(p) { try { return fs.readFileSync(p, 'utf-8'); } catch { return null; } }
function logFire(checked, gaps) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), via: 'resume-readiness', filter: FILTER_QA || 'all', checked, gaps }) + '\n'); } catch {}
}
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

function checkQuest(qa, block, doc) {
  // each check: [label, pass]
  const c = [];
  c.push(['active.txt: status+qa_doc+branch+env', ['status', 'qa_doc', 'branch', 'env'].every(k => fieldOf(block, k))]);
  c.push(['qa_doc: ## Resume Point section', /^##\s.*resume point/im.test(doc)]);
  c.push(['qa_doc: test permohonan ID present', PERMOHONAN_RE.test(doc) || AWAM_ID_RE.test(doc) || TESTDATA_NA_RE.test(doc)]);
  c.push(['qa_doc: login/email for test app', EMAIL_RE.test(doc)]);
  c.push(['qa_doc: Next-Steps Checklist present', /^##\s.*next[- ]?steps?\s+checklist/im.test(doc)]);
  c.push(['qa_doc: full file path (not abbrev)', FULLPATH_RE.test(doc)]);
  c.push(['qa_doc: build/deploy step named', BUILD_RE.test(doc)]);
  return c;
}

function main() {
  const text = safeRead(ACTIVE_TXT);
  if (!text) { console.log('⚠️  resume-readiness: cannot read quest/active.txt'); return; }
  let checked = 0, totalGaps = 0;
  for (const block of parseBlocks(text)) {
    if (!block.some(l => /^\s*qa=/.test(l))) continue;
    const qa = fieldOf(block, 'qa'); const status = fieldOf(block, 'status'); const qaDoc = fieldOf(block, 'qa_doc');
    if (!qa || !status || !OPEN_STATUSES.has(status) || !qaDoc) continue;
    if (FILTER_QA && !qa.replace(/^QA-?/i, '').includes(FILTER_QA)) continue;
    const doc = safeRead(path.join(REPO_ROOT, qaDoc.replace(/\//g, path.sep)));
    if (!doc) { console.log(`🔴 ${qa}: qa_doc unreadable (${qaDoc})`); checked++; totalGaps++; continue; }
    checked++;
    const checks = checkQuest(qa, block, doc);
    const gaps = checks.filter(([, ok]) => !ok);
    totalGaps += gaps.length;
    const verdict = gaps.length === 0 ? '✅ COLD-RESUME READY' : `⚠️ ${gaps.length} GAP(S)`;
    console.log(`\n${verdict} — ${qa}`);
    for (const [label, ok] of checks) console.log(`   ${ok ? '✓' : '✗'} ${label}`);
    if (gaps.length) console.log(`   → fill the ✗ rows in the qa_doc before this quest is safely resumable cold.`);
  }
  logFire(checked, totalGaps);
  if (checked === 0) console.log('resume-readiness: no matching open quest with a qa_doc.');
}

try { main(); } catch (e) { console.log(`⚠️  resume-readiness: ${e.message}`); }
