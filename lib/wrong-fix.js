#!/usr/bin/env node
// wrong-fix — born via forge (2026-09-07) — plan §9a/9b (miya 2026-09-06)
// symptom: wrong fixes found inside a quest were never saved, so Phase 2 could not learn from them
// goal: every refuted fix is a row in the qa_doc "## Wrong fixes" table and every row gets an upgrade
//       verdict (knowledge / phrase / feature / none) before the quest archives
// goal_signal: the qa_doc has a Wrong fixes row for the refuted fix; quest/archive-quest.js refuses
//              while any row lacks a verdict
// retention: keep (rows live in the qa_doc; a mirror row goes to domain/quest-bounty/log.jsonl)
//
//   node lib/wrong-fix.js add <QA> --was "<the fix that was wrong>" --why "<how it was refuted>" --learned "<rule or fact>"
//   node lib/wrong-fix.js verdict <QA> --row N --verdict "knowledge:<file> | phrase:<skill/protocol line> | feature:<forge name> | none:<why>"
//   node lib/wrong-fix.js pending <QA>          → rows without a verdict (exit 1 if any)
//   node lib/wrong-fix.js upgrade-table <QA>    → the 🔧 WORKFLOW UPGRADE table (wrong-fix rows + slips carrying qa=<QA>)
//   node lib/wrong-fix.js today <QA>            → exit 0 if a row was added today (used by the turn-ledger advisory)
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const HEADER = '## Wrong fixes';
const TABLE_HEAD = '| # | Date | Fix that was wrong | Why it was refuted | Learned | Verdict |\n|---|---|---|---|---|---|';
const VERDICT_RE = /^(knowledge|phrase|feature|none):\s*\S/i;

function arg(n, d) { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] !== undefined && !String(process.argv[i + 1]).startsWith('--') ? process.argv[i + 1] : d; }
function die(m) { console.error('wrong-fix: ' + m); process.exit(2); }
function cell(s) { return String(s || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim(); }
function docPath(qa) {
  for (const d of ['active', 'archive']) { const p = path.join(ROOT, 'projects', 'coding-projects', d, qa, qa + '.md'); if (fs.existsSync(p)) return p; }
  return null;
}
function readRows(text) {
  const i = text.indexOf(HEADER);
  if (i < 0) return { start: -1, rows: [] };
  const after = text.slice(i);
  const end = after.slice(HEADER.length).search(/^## /m);
  const section = end >= 0 ? after.slice(0, HEADER.length + end) : after;
  const rows = [];
  for (const line of section.split('\n')) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*$/);
    if (m) rows.push({ n: parseInt(m[1], 10), date: m[2].trim(), was: m[3].trim(), why: m[4].trim(), learned: m[5].trim(), verdict: m[6].trim(), line });
  }
  return { start: i, rows, section };
}
function mirror(qa, row) { try { fs.appendFileSync(path.join(ROOT, 'domain', 'quest-bounty', 'log.jsonl'), JSON.stringify({ ts: new Date().toISOString(), qa, kind: 'wrong-fix', ...row }) + '\n'); } catch (_) {} }

function add(qa) {
  const p = docPath(qa); if (!p) die('no qa_doc for ' + qa + ' under projects/coding-projects/{active,archive}/' + qa + '/');
  const was = arg('was'), why = arg('why'), learned = arg('learned');
  if (!was || !why || !learned) die('add needs --was --why --learned (all three, real sentences)');
  let text = fs.readFileSync(p, 'utf8');
  let { start, rows } = readRows(text);
  const n = rows.length ? Math.max(...rows.map(r => r.n)) + 1 : 1;
  const date = new Date().toISOString().slice(0, 10);
  const line = `| ${n} | ${date} | ${cell(was)} | ${cell(why)} | ${cell(learned)} | |`;
  if (start < 0) text = text.replace(/\s*$/, '') + '\n\n' + HEADER + '\n\n' + TABLE_HEAD + '\n' + line + '\n';
  else {
    const { section } = readRows(text);
    const newSection = section.replace(/\s*$/, '') + '\n' + line + '\n';
    text = text.slice(0, start) + newSection + text.slice(start + section.length);
  }
  fs.writeFileSync(p, text);
  mirror(qa, { n, was, why, learned });
  console.log(`wrong-fix: ${qa} row ${n} added → ${path.relative(ROOT, p)} (verdict pending — ruled at Phase 2 upgrade search)`);
}
function verdict(qa) {
  const p = docPath(qa); if (!p) die('no qa_doc for ' + qa);
  const n = parseInt(arg('row', ''), 10); const v = arg('verdict', '');
  if (!Number.isFinite(n)) die('--row N required');
  if (!VERDICT_RE.test(v)) die('--verdict must be knowledge:<file> | phrase:<where> | feature:<name> | none:<why>');
  let text = fs.readFileSync(p, 'utf8');
  const { rows } = readRows(text);
  const r = rows.find(x => x.n === n); if (!r) die('row ' + n + ' not found');
  const newLine = r.line.replace(/\|\s*[^|]*\|\s*$/, '| ' + cell(v) + ' |');
  text = text.replace(r.line, newLine);
  fs.writeFileSync(p, text);
  mirror(qa, { n, verdict: v });
  console.log(`wrong-fix: ${qa} row ${n} verdict = ${v}`);
}
function pending(qa, quiet) {
  const p = docPath(qa); if (!p) { if (!quiet) console.log('wrong-fix: no qa_doc for ' + qa); return []; }
  const { rows } = readRows(fs.readFileSync(p, 'utf8'));
  const open = rows.filter(r => !r.verdict);
  if (!quiet) { for (const r of open) console.log(`- row ${r.n} (${r.date}): ${r.was} — learned: ${r.learned}`); console.log(open.length ? open.length + ' wrong-fix row(s) without a verdict' : 'wrong-fix: no pending rows'); }
  return open;
}
function slipsFor(qa) {
  const out = [];
  try { for (const l of fs.readFileSync(path.join(ROOT, 'system', 'slips.jsonl'), 'utf8').split('\n')) { if (!l.trim()) continue; try { const r = JSON.parse(l); if (r.qa === qa && r.type !== 'proposal') out.push(r); } catch (_) {} } } catch (_) {}
  return out;
}
function upgradeTable(qa) {
  const p = docPath(qa);
  const rows = p ? readRows(fs.readFileSync(p, 'utf8')).rows : [];
  const slips = slipsFor(qa);
  const L = ['🔧 WORKFLOW UPGRADE — ' + qa + ' (Phase 2 mandatory: every row needs a verdict; non-none verdicts are DONE in this close)', '', '| Source | # | What went wrong | Learned | Verdict |', '|---|---|---|---|---|'];
  for (const r of rows) L.push(`| wrong-fix | ${r.n} | ${r.was} — ${r.why} | ${r.learned} | ${r.verdict || '⬜ pending'} |`);
  slips.forEach((s, i) => L.push(`| slip | s${i + 1} | ${cell(s.category)}: ${cell(s.evidence).slice(0, 120)} | ${cell(s.action || '')} | ⬜ rule at close |`));
  if (rows.length + slips.length === 0) L.push('| — | — | no wrong-fix rows and no slips for this quest | — | none: nothing to upgrade |');
  console.log(L.join('\n'));
  const open = rows.filter(r => !r.verdict).length;
  console.log('');
  console.log(open ? `⛔ ${open} wrong-fix row(s) unruled — node lib/wrong-fix.js verdict ${qa} --row N --verdict "..."` : '✓ all wrong-fix rows ruled');
}
function today(qa) {
  const p = docPath(qa); if (!p) process.exit(1);
  const d = new Date().toISOString().slice(0, 10);
  process.exit(readRows(fs.readFileSync(p, 'utf8')).rows.some(r => r.date === d) ? 0 : 1);
}

if (require.main === module) {
  const cmd = process.argv[2], qa = process.argv[3];
  if (!qa || !/^(QA-\d+|ADHOC-[A-Z]+-\d{4}-\d+|ALTER-[A-Z]+-\d{4}-\d+)$/.test(qa)) die('usage: wrong-fix <add|verdict|pending|upgrade-table|today> <QA-NNNNNN|ADHOC-...> ...');
  if (cmd === 'add') add(qa);
  else if (cmd === 'verdict') verdict(qa);
  else if (cmd === 'pending') process.exit(pending(qa).length ? 1 : 0);
  else if (cmd === 'upgrade-table') upgradeTable(qa);
  else if (cmd === 'today') today(qa);
  else die('unknown command ' + cmd);
}
module.exports = { readRows, docPath, pending, HEADER };
