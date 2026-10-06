#!/usr/bin/env node
// dev-map-check.js — deterministic check that a DEVELOPMENT quest's doc carries every block of
// the Development path (quest SKILL.md "Development path", steps D1-D7) before hand-back.
// Born 2026-10-05 (miya, #268173): a bug-shaped quest answered a development ticket with a
// 6-row list that covered about a third of the work. The guarantee is not "remember the layers";
// it is: this reads the quest MD and FAILS, naming each block that is missing.
//
// goal: no development quest is handed back with a requirement nobody mapped, no skeptic audit,
//       or a percentage with no coverage count behind it.
// retention: rotate monthly (one row per ticket run in quest/dev-map-check.log.jsonl; a --doc run with no ticket number writes nothing)
// footprint: on-demand: 1 node process, a few ms, no children
//
// Checks (each prints PASS/FAIL):
//   D1  Requirement list           ≥1 row `| R<n> |`
//   D2  Facts carry a status       every `| F<n> |` row says VERIFIED or MODEL
//   D3b Approaches                 `## Approaches` with >=2 `| A<n> |` rows, one that reuses something existing, and a `Chosen: A<n>` line
//   D4  Build map                  heading "Development build map" + ≥1 "Work package" heading + ≥1 touch-point row `| n.n |`
//   D3  Every requirement mapped   each R<n> appears in the build map, or in a "not needed because" line
//   D4b Touch-points have a place  every `| n.n |` row carries a path, a table name in backticks, or "n/a"
//   D5  Decisions                  `## Decisions` with ≥1 `| D<n> |` row, or the line "No open decisions"
//   D6  Skeptic audit              `## Skeptic audit` with an `Auditor:` line and a `Findings merged:` line
//   D7  Coverage                   `## Coverage` with a table that has digits
//   D2b MODEL rows have a check    if any row says MODEL / "model only", a "Check queries" heading exists
//
// API:  checkDoc(text) -> { applies, results:[{id,ok,detail}], ok }
// CLI:  node quest/dev-map-check.js <num> [--doc <path>] [--force]     (exit 0 ok or n/a · 1 gap · 2 usage)

const fs = require('fs');
const path = require('path');

// MemoryCore root = the MAIN-repo root (quest MDs live there, not in the worktree copy).
function memcoreRoot() {
  if (/[\\/]\.claude[\\/]worktrees[\\/]/.test(__dirname)) {
    return __dirname.split(/[\\/]\.claude[\\/]worktrees[\\/]/)[0];
  }
  return path.resolve(__dirname, '..');
}

function findQuestMd(num, root) {
  for (const sub of ['active', 'archive']) {
    const dir = path.join(root, 'projects', 'coding-projects', sub);
    let entries = [];
    try { entries = fs.readdirSync(dir); } catch { continue; }
    const hit = entries.find(e => e.includes(num));
    if (hit) {
      const md = path.join(dir, hit, `${hit}.md`);
      if (fs.existsSync(md)) return md;
    }
  }
  return null;
}

function isDevelopmentBlock(num, root) {
  let txt = '';
  try { txt = fs.readFileSync(path.join(root, 'quest', 'active.txt'), 'utf8'); } catch { return false; }
  const blocks = txt.split(/\r?\n\s*\r?\n/);
  const b = blocks.find(x => new RegExp(`^qa=\\S*${num}\\s*$`, 'm').test(x));
  return !!b && /^path=development\s*$/m.test(b);
}

// text between a heading that matches `re` and the next heading of the same or higher level
function section(text, re) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(l => /^#{1,6}\s/.test(l) && re.test(l));
  if (start < 0) return null;
  const level = lines[start].match(/^#+/)[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/);
    if (m && m[1].length <= level) { end = i; break; }
  }
  return lines.slice(start + 1, end).join('\n');
}

function checkDoc(text) {
  const results = [];
  const add = (id, ok, detail) => results.push({ id, ok: !!ok, detail });
  const rows = text.split(/\r?\n/).filter(l => /^\|/.test(l));

  const reqIds = [...new Set(rows.map(l => (l.match(/^\|\s*(R\d+)\s*\|/) || [])[1]).filter(Boolean))];
  add('D1', reqIds.length > 0, reqIds.length ? `${reqIds.length} requirement(s)` : 'no `| R<n> |` row: write the Requirement list');

  const factRows = rows.filter(l => /^\|\s*F\d+\s*\|/.test(l));
  const factNoStatus = factRows.filter(l => !/\b(VERIFIED|MODEL)\b/i.test(l)).map(l => l.match(/^\|\s*(F\d+)/)[1]);
  add('D2', factRows.length > 0 && factNoStatus.length === 0,
    !factRows.length ? 'no `| F<n> |` row: write the working-example facts'
      : factNoStatus.length ? `no VERIFIED/MODEL on: ${factNoStatus.join(', ')}` : `${factRows.length} fact(s), all with a status`);

  // D3b (2026-10-06, #268173): the approach is compared BEFORE the map. A map built on the first idea seen is the miss.
  const appr = section(text, /^#{1,6}\s+Approaches/i);
  const apprRows = appr ? appr.split(/\r?\n/).filter(l => /^\|\s*A\d+\s*\|/.test(l)) : [];
  const chosen = !!appr && /^\s*\**Chosen\**\s*:\s*A\d+/im.test(appr);
  const reuse = apprRows.some(l => /reuse|re-use|existing|guna semula/i.test(l));
  add('D3b', apprRows.length >= 2 && chosen && reuse,
    !appr ? 'no `## Approaches` section: compare 2-3 approaches before mapping'
      : apprRows.length < 2 ? 'fewer than 2 `| A<n> |` rows: one approach is not a comparison'
      : !reuse ? 'no approach row that reuses an existing screen or service (or says none exists and what was searched)'
      : !chosen ? 'no `Chosen: A<n>` line' : ` approaches, one chosen`);

  const map = section(text, /Development build map/i);
  const mapRows = map ? map.split(/\r?\n/).filter(l => /^\|\s*\d+\.\d+\s*\|/.test(l)) : [];
  const wpCount = map ? (map.match(/^#{2,6}\s.*Work package/gim) || []).length : 0;
  add('D4', !!map && wpCount > 0 && mapRows.length > 0,
    !map ? 'no "Development build map" heading' : !wpCount ? 'no "Work package" heading inside the build map'
      : !mapRows.length ? 'no touch-point row `| n.n |`' : `${wpCount} work package(s), ${mapRows.length} touch-point(s)`);

  const notNeeded = text.split(/\r?\n/).filter(l => /not needed because/i.test(l)).join('\n');
  const decisions = section(text, /^#{1,6}\s+Decisions/i) || '';
  const hay = (map || '') + '\n' + notNeeded;
  const unmapped = reqIds.filter(r => !new RegExp(`\\b${r}\\b`).test(hay));
  add('D3', reqIds.length > 0 && unmapped.length === 0,
    unmapped.length ? `requirement(s) in no touch-point and no "not needed because" line: ${unmapped.join(', ')}` : 'every requirement is mapped');

  const noPlace = mapRows.filter(l => !(/[\w-]+[\\/][\w.\\/ -]+/.test(l) || /`[^`]+`/.test(l) || /\bn\/a\b/i.test(l)))
    .map(l => l.match(/^\|\s*(\d+\.\d+)/)[1]);
  add('D4b', mapRows.length > 0 && noPlace.length === 0,
    noPlace.length ? `touch-point(s) with no path, table name or n/a: ${noPlace.join(', ')}` : 'every touch-point names a place');

  const decRows = decisions.split(/\r?\n/).filter(l => /^\|\s*D\d+\s*\|/.test(l));
  add('D5', decRows.length > 0 || /No open decisions/i.test(decisions),
    decRows.length ? `${decRows.length} decision(s)` : /No open decisions/i.test(decisions) ? 'none open (stated)' : 'no `## Decisions` table and no "No open decisions" line');

  const audit = section(text, /^#{1,6}\s+Skeptic audit/i);
  const hasAud = !!audit && /^\s*\**Auditor\**\s*:/im.test(audit) && /^\s*\**Findings merged\**\s*:/im.test(audit);
  add('D6', hasAud, !audit ? 'no `## Skeptic audit` section' : hasAud ? 'audit recorded' : 'audit section lacks an `Auditor:` line or a `Findings merged:` line');

  const cov = section(text, /^#{1,6}\s+Coverage/i);
  const covOk = !!cov && cov.split(/\r?\n/).some(l => /^\|/.test(l) && /\|\s*\d+/.test(l));
  add('D7', covOk, covOk ? 'coverage count present' : 'no `## Coverage` table with numbers');

  const hasModel = rows.some(l => /\bMODEL\b/.test(l) || /model only/i.test(l));
  const hasQueries = /^#{1,6}\s.*Check quer/im.test(text);
  add('D2b', !hasModel || hasQueries, !hasModel ? 'no MODEL rows' : hasQueries ? 'MODEL rows have check queries' : 'MODEL rows but no "Check queries" heading');

  return { results, ok: results.every(r => r.ok) };
}

function main() {
  const argv = process.argv.slice(2);
  const num = (argv.find(a => /^\d{4,}$/.test(a.replace(/^QA-/i, ''))) || '').replace(/^QA-/i, '');
  const docIdx = argv.indexOf('--doc');
  const force = argv.includes('--force');
  if (!num && docIdx < 0) { console.error('usage: node quest/dev-map-check.js <num> [--doc <path>] [--force]'); process.exit(2); }
  const root = memcoreRoot();
  const md = docIdx >= 0 ? argv[docIdx + 1] : findQuestMd(num, root);
  if (!md || !fs.existsSync(md)) { console.error(`dev-map-check: quest doc not found for ${num || argv[docIdx + 1]}`); process.exit(2); }
  const text = fs.readFileSync(md, 'utf8');
  const applies = force || docIdx >= 0 || isDevelopmentBlock(num, root) || /Development build map/i.test(text);
  if (!applies) { console.log(`dev-map-check: n/a — ${num} is not on the development path`); process.exit(0); }
  const { results, ok } = checkDoc(text);
  console.log(`dev-map-check — ${path.basename(md)}`);
  for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.id.padEnd(4)} ${r.detail}`);
  console.log(ok ? 'OK — every development block is present' : 'GAP — fill each FAIL before hand-back');
  if (num) {
    const log = process.env.DEV_MAP_LOG || path.join(root, 'quest', 'dev-map-check.log.jsonl');
    try { fs.appendFileSync(log, JSON.stringify({ ts: new Date().toISOString(), qa: 'QA-' + num, ok, failed: results.filter(r => !r.ok).map(r => r.id) }) + '\n'); } catch (_) { /* the check result stands without the row */ }
  }
  process.exit(ok ? 0 : 1);
}

if (require.main === module) main();
module.exports = { checkDoc, section };
