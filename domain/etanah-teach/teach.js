#!/usr/bin/env node
// teach.js — etanah-teach Tool: the source map per layer, and the self-audit of a saved lesson.
// symptom: 2026-11-13 miya: "explain as in someone that doesn't understand anything about etanah system ... in layers starting with the overview"
// goal: miya understands any etanah urusan, tugasan, feature or ticket issue from zero, layer by layer, every fact sourced
// boundary: covers the etanah-knowledge folder of one state and one lesson file · never edits a knowledge file, code or DB · stops at TEACH: PASS|FAIL lines
// footprint: on-demand: 1 node call, under 0.2 s
// Usage:
//   node domain/etanah-teach/teach.js sources <URUSAN> [--state melaka]
//   node domain/etanah-teach/teach.js audit <lesson.md> [--to L4]
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const MAIN = ROOT.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/, '');
const LOG = process.env.TEACH_LOG || path.join(__dirname, 'log.jsonl'); // the eval points this at a sandbox file

function arg(name, dflt) { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt; }
function logRow(row) { try { fs.appendFileSync(LOG, JSON.stringify(Object.assign({ ts: new Date().toISOString() }, row)) + '\n'); } catch (_) {} }

// knowledge lives gitignored in the main checkout; a session folder holds only the few tracked files,
// so the main checkout wins, and a folder with the glossary wins over a partial one
function knowledgeDir(state) {
  const dirs = [...new Set([MAIN, ROOT])].map(b => path.join(b, 'projects', 'coding-projects', 'active', 'etanah-knowledge', state)).filter(d => fs.existsSync(d));
  return dirs.find(d => fs.existsSync(path.join(d, 'DOMAIN-GLOSSARY.md'))) || dirs[0] || null;
}

const LAYERS = [
  { id: 'L0', what: 'eTanah + module', files: ['MODULE-ARCHITECTURE.md', 'DOMAIN-GLOSSARY.md'] },
  { id: 'L1', what: 'the urusan', files: ['DOMAIN-GLOSSARY.md', 'urusan/<KOD>-TICKETS.md'], cmd: 'node quest/requirement-index.js --find "<KOD>"' },
  { id: 'L2', what: 'the journey (tugasan in order)', files: ['flowables-bpmn/MLK_PLP_<KOD>.bpmn20.xml', 'PERANAN-MAP.md', 'URUSAN-FLOW.md', 'FLOWABLE-WORKFLOWS.md'] },
  { id: 'L3', what: 'the tugasan screen', files: ['FLOW-TRACES.md'], note: 'plus the ticket qa_doc and screenshots' },
  { id: 'L4', what: 'the rule or feature', files: ['SPOC-COUNTER.md', 'BUG-BESTIARY.md'], cmd: 'node quest/requirement-index.js --read <req>' },
  { id: 'L5', what: 'code + data', files: ['DATABASE.md'], note: 'plus codemap and a read-only SELECT' },
];

// ---- lesson parsing (shared by sources and audit) ----
function parseLesson(text) {
  const sections = [];
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    const h = /^##\s+(L\d)\s*[·:-]\s*(.*)$/.exec(line);
    if (h) { cur = { id: h[1], title: h[2].trim(), lines: [] }; sections.push(cur); continue; }
    if (/^##\s/.test(line)) { cur = null; continue; }
    if (cur) cur.lines.push(line);
  }
  return sections;
}

function auditLesson(text, to) {
  const fails = [];
  if (!/^#\s+Learn\b/m.test(text)) fails.push('title: first heading must be "# Learn — <KOD> (<name>)"');
  if (!/^state:\s*\S+/m.test(text)) fails.push('state: line missing');
  if (/\bTODO\b/.test(text)) fails.push('TODO left in the lesson');
  if (!/^##\s+Questions asked/m.test(text)) fails.push('"## Questions asked" table missing');
  const secs = parseLesson(text);
  if (!secs.length) fails.push('no layer sections (## L0 · ...)');
  secs.forEach((s, i) => {
    if (s.id !== 'L' + i) fails.push(s.id + ': out of order or a gap (expected L' + i + ')');
    const body = s.lines.filter(l => l.trim());
    const first = body[0] || '';
    if (!first) fails.push(s.id + ': empty');
    else if (/^\s*(\||```|!\[|[-*]\s|>)/.test(first) || /`[^`]*\.(java|xhtml|js|xml|sql)(:\d+)?`/.test(first) || /\w+\.(java|xhtml):\d+/.test(first)) fails.push(s.id + ': first line must be one plain sentence (no table, code, list or file:line)');
    if (!body.some(l => /^\s*\|.*\|\s*$/.test(l) || /!\[[^\]]*\]\([^)]+\)/.test(l))) fails.push(s.id + ': needs one table or picture');
    if (!body.some(l => /^source:\s*\S{3,}/.test(l))) fails.push(s.id + ': source: line missing');
    if (!body.some(l => /^checked:\s*\d{4}-\d{2}-\d{2}/.test(l))) fails.push(s.id + ': checked: YYYY-MM-DD missing');
  });
  if (to) {
    const n = +String(to).replace(/\D/g, '');
    for (let i = 0; i <= n; i++) if (!secs.some(s => s.id === 'L' + i)) fails.push('L' + i + ': missing, the lesson must reach ' + to);
  }
  return { fails: [...new Set(fails)], layers: secs.map(s => s.id) };
}

function cmdSources() {
  const kod = (process.argv[3] || '').toUpperCase();
  if (!/^[A-Z0-9]{2,8}$/.test(kod)) { console.error('usage: teach.js sources <URUSAN> [--state melaka]'); process.exit(2); }
  const state = arg('state', 'melaka');
  const kdir = knowledgeDir(state);
  if (!kdir) { console.log('TEACH-SOURCES: FAIL no etanah-knowledge/' + state + ' folder under ' + ROOT + ' or ' + MAIN); process.exit(1); }
  const lesson = path.join(kdir, 'learn', kod + '.md');
  console.log('TEACH-SOURCES ' + kod + ' · state ' + state + ' · ' + kdir);
  if (fs.existsSync(lesson)) {
    const secs = parseLesson(fs.readFileSync(lesson, 'utf8'));
    console.log('saved lesson: learn/' + kod + '.md · layers ' + secs.map(s => s.id + ' ' + (s.lines.find(l => /^checked:/.test(l)) || 'checked: ?').replace('checked: ', '')).join(' · '));
  } else console.log('saved lesson: none yet (learn/' + kod + '.md will be created)');
  for (const L of LAYERS) {
    const rows = L.files.map(f => { const rel = f.replace('<KOD>', kod); return (fs.existsSync(path.join(kdir, rel)) ? 'ok ' : 'NO ') + rel; });
    console.log(L.id + ' ' + L.what + ': ' + rows.join(' · ') + (L.cmd ? ' · run: ' + L.cmd.replace('<KOD>', kod) : '') + (L.note ? ' · ' + L.note : ''));
  }
  logRow({ cmd: 'sources', kod, state, outcome: 'ok' });
}

function cmdAudit() {
  const t0 = Date.now();
  const file = process.argv[3];
  if (!file) { console.error('usage: teach.js audit <lesson.md> [--to L4]'); process.exit(2); }
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { console.log('TEACH: FAIL cannot read ' + file); logRow({ cmd: 'audit', file, outcome: 'FAIL', goal_met: false, dur_ms: Date.now() - t0 }); process.exit(1); }
  const to = arg('to', null);
  const r = auditLesson(text, to);
  const ok = r.fails.length === 0;
  if (ok) console.log('TEACH: PASS ' + path.basename(file) + ' · layers ' + r.layers.join(' ') + (to ? ' · reaches ' + to : ''));
  else { console.log('TEACH: FAIL ' + path.basename(file)); for (const f of r.fails) console.log('  - ' + f); }
  logRow({ cmd: 'audit', file: path.basename(file), to, layers: r.layers, outcome: ok ? 'PASS' : 'FAIL', fails: r.fails.length, goal_met: ok, dur_ms: Date.now() - t0 });
  process.exit(ok ? 0 : 1);
}

if (require.main === module) {
  const c = process.argv[2];
  if (c === 'sources') cmdSources();
  else if (c === 'audit') cmdAudit();
  else { console.error('usage: teach.js <sources <URUSAN> [--state s] | audit <lesson.md> [--to Ln]>'); process.exit(2); }
}
module.exports = { auditLesson, parseLesson, knowledgeDir };
