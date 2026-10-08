#!/usr/bin/env node
// check.js — falsifier ledger check (2026-10-04, refine of falsifier-ran-check)
// symptom: #244600 — a Rubric falsifier was written on 2026-10-01, never run, the fix shipped 2026-10-02
//          with local_test_confirmed=false, and BA failed it on 2026-10-03. Running it took 5 minutes.
// goal: no etanah fix is committed or passed to BA while a written falsifier is unrun
// goal_signal: `node domain/falsifier-ran-check/check.js <QA>` exits 0 before the commit
// retention: rotate monthly (log.jsonl) · keep (overrides.jsonl)
//
//   node domain/falsifier-ran-check/check.js <QA> [--staged <repo>] [--show]
//     exit 0 = pass · 1 = fail (reasons on stderr) · 2 = usage
//
// The ledger lives in the quest doc:
//   ## Falsifier ledger
//   Fix files: A.java, B.xhtml
//   | # | design | falsifier | cheapest test | status |
//   status = OPEN | RAN: <evidence> | BROKE: <evidence> → row N | ACCEPTED-RISK: "<miya's words>" miya YYYY-MM-DD
//            | SUPERSEDED: row N
// Callers: compile-gate (etanah commit) · close-phase Phase 1 · ticket-close-block --ba.
// The local-test override is read from miya's LAST message only: his plain words ("test on server", "skip local testing")
// or [risk-ok: <num> <reason>]; it never clears a row.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = mainRoot(process.env.FALSIFIER_ROOT || process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..'));
const ACTIVE = process.env.FALSIFIER_ACTIVE || path.join(ROOT, 'quest', 'active.txt');
const LOG = process.env.FALSIFIER_LOG || path.join(__dirname, 'log.jsonl');
const OVERRIDES = process.env.FALSIFIER_OVERRIDES || path.join(__dirname, 'overrides.jsonl');
const OVERRIDE_HOURS = 72;

const LEDGER_HEAD = /^(#{1,4})\s*Falsifier ledger\b.*$/im;
const RUBRIC_HEAD = /^#{1,4}[^\n]*\bRubric\b|═══\s*RUBRIC\b/im;
const OVERRIDE_RX = /\[risk-ok:\s*#?(?:QA-)?(\d{4,})\b\s*([^\]]{3,})\]/gi;
const POPUP_ANSWER = /^\s*Your questions have been answered:/;
// miya's plain words waive the local test too (2026-10-08 per miya, #283751): "test on server", "skip local testing".
const PLAIN_WAIVE_RX = new RegExp([
  String.raw`\b(?:test(?:ing|ed)?|check|verify|try)\b[^.?!\n]{0,40}?\b(?:on|in|at)\s+(?:the\s+)?(?:server|internal|staging|stag|mlit|int[- ]env|stag[- ]env|stg\d?)\b`,
  String.raw`\b(?:skip|skipping|without|no need (?:for|to do|to)|don'?t need|do not need)\b[^.?!\n]{0,20}?\blocal(?:ly)?\s*test(?:ing|s)?\b`,
  String.raw`\bno\s+local\s+test(?:ing|s)?\b`,
].join('|'), 'gi');
const PLAIN_NEGATE_RX = /\b(?:don'?t|do not|never|not|cannot|can'?t|won'?t|jangan|tak|before|after|until|unless|if|whether)\b[^.?!\n]{0,30}$/i;
const TICKET_NUM_RX = /(?<![\d/])\d{5,6}(?![\d/])/g;

// A worktree session shares the MAIN quest/active.txt and projects/ folder.
function mainRoot(p) { return String(p).replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/i, ''); }
function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }
function num(qa) { return (String(qa).match(/(\d{4,})/) || [])[1] || ''; }

function readBlock(qa) {
  let text; try { text = fs.readFileSync(ACTIVE, 'utf8'); } catch (_) { return null; }
  for (const b of text.split(/\r?\n\s*\r?\n/)) {
    const o = {};
    for (const l of b.split(/\r?\n/)) { const i = l.indexOf('='); if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
    if (o.qa === qa) return o;
  }
  return null;
}

function docFor(qa, block) {
  const cands = [];
  if (block && block.qa_doc) cands.push(path.isAbsolute(block.qa_doc) ? block.qa_doc : path.join(ROOT, block.qa_doc));
  for (const d of ['active', 'archive']) {
    cands.push(path.join(ROOT, 'projects', 'coding-projects', d, qa, qa + '.md'));
    cands.push(path.join(ROOT, 'projects', 'coding-projects', d, qa + '.md'));
  }
  return cands.find(p => fs.existsSync(p)) || null;
}

function cells(line) {
  const parts = line.trim().replace(/^\|/, '').replace(/\|\s*$/, '').split(/(?<!\\)\|/);
  return parts.map(s => s.replace(/\\\|/g, '|').trim());
}

// Every "Falsifier ledger" section in the doc counts: a new cycle's section never hides an older OPEN row.
function parseLedger(text) {
  const lines = String(text || '').split(/\r?\n/);
  const rows = []; const fixFiles = []; let sections = 0; let level = 0; let inside = false; let fence = false;
  for (const raw of lines) {
    if (/^\s*```/.test(raw)) { fence = !fence; continue; }
    if (fence) continue;
    const h = raw.match(/^(#{1,6})\s+\S/);
    if (h) {
      const m = raw.match(LEDGER_HEAD);
      if (m) { inside = true; level = m[1].length; sections++; continue; }
      if (inside && h[1].length <= level) inside = false;
      continue;
    }
    if (!inside) continue;
    const f = raw.match(/^\s*\**Fix files\**\s*:\s*(.+)$/i);
    if (f) { for (const x of f[1].split(/[,;·]/)) { const b = path.basename(x.replace(/[`*]/g, '').trim().replace(/\\/g, '/')); if (b) fixFiles.push(b.toLowerCase()); } continue; }
    if (!/^\s*\|/.test(raw)) continue;
    const c = cells(raw);
    if (c.length < 5 || !/^\d+$/.test(c[0])) continue;
    rows.push({ n: parseInt(c[0], 10), design: c[1], falsifier: c[2], test: c[3], status: c.slice(4).join(' | ') });
  }
  return { sections, rows, fixFiles };
}

function statusKind(row, rows) {
  const s = row.status.replace(/^[*`\s]+/, '');
  let m;
  if (/^OPEN\b/i.test(s) || s === '') return { kind: 'open' };
  if ((m = s.match(/^RAN\s*:\s*(.*)$/i))) return m[1].replace(/[*`\s]/g, '').length >= 12 ? { kind: 'ran' } : { kind: 'bad', why: 'RAN with no evidence (say what was run and what it showed)' };
  if ((m = s.match(/^BROKE\s*:\s*(.*)$/i))) {
    const p = m[1].match(/(?:→|->)\s*row\s*(\d+)\s*$/i);
    if (!p) return { kind: 'broke', why: 'the falsifier fired, so this design is refuted — write the replacement row and end this cell with "→ row N"' };
    const t = rows.find(r => r.n === parseInt(p[1], 10));
    if (!t || t.n === row.n) return { kind: 'broke', why: `replacement row ${p[1]} does not exist` };
    return { kind: 'replaced', to: t.n };
  }
  if ((m = s.match(/^ACCEPTED-RISK\s*:\s*(.*)$/i))) {
    const ok = /["“][^"”]{3,}["”]/.test(m[1]) && /\b(miya|みや)\b|みや/i.test(m[1]) && /\b\d{4}-\d{2}-\d{2}\b/.test(m[1]);
    return ok ? { kind: 'accepted' } : { kind: 'bad', why: 'ACCEPTED-RISK needs miya\'s quoted words, his name and the date: ACCEPTED-RISK: "<words>" miya YYYY-MM-DD' };
  }
  if ((m = s.match(/^SUPERSEDED\s*:\s*row\s*(\d+)/i))) {
    const t = rows.find(r => r.n === parseInt(m[1], 10));
    if (!t || t.n === row.n || /^SUPERSEDED/i.test(t.status)) return { kind: 'bad', why: `SUPERSEDED must name a live row (row ${m[1]} is missing, itself, or superseded)` };
    return { kind: 'replaced', to: t.n };
  }
  return { kind: 'bad', why: 'status must start with OPEN / RAN: / BROKE: / ACCEPTED-RISK: / SUPERSEDED: row N' };
}

// Pure evaluation of one doc. opts: { needLedger, staged: [paths]|null, merge: bool }
function evaluate(text, opts) {
  const o = opts || {};
  const fails = [];
  const L = parseLedger(text);
  const outside = String(text || '').split(LEDGER_HEAD)[0];
  const need = !!o.needLedger || RUBRIC_HEAD.test(text || '') || /falsifier/i.test(outside);
  if (!L.sections) {
    if (need) fails.push({ kind: 'no-ledger', msg: 'the quest doc has a Rubric / falsifier but no "## Falsifier ledger" section' });
    return { fails, rows: [], fixFiles: [], need };
  }
  if (!L.rows.length) fails.push({ kind: 'empty-ledger', msg: 'the Falsifier ledger has no rows (a fix always has at least one falsifier)' });
  for (const r of L.rows) {
    const k = statusKind(r, L.rows);
    r.kind = k.kind;
    if (k.kind === 'open') fails.push({ kind: 'open', msg: `row ${r.n} OPEN — ${r.falsifier} · cheapest test: ${r.test || '(none written)'}` });
    else if (k.kind === 'broke') fails.push({ kind: 'broke', msg: `row ${r.n} BROKE — ${k.why}` });
    else if (k.kind === 'bad') fails.push({ kind: 'bad-status', msg: `row ${r.n} — ${k.why}` });
  }
  if (o.staged && o.staged.length && !o.merge) {
    if (!L.fixFiles.length) fails.push({ kind: 'no-fix-files', msg: 'the ledger has no "Fix files:" line, so the staged files cannot be compared with the design' });
    else {
      const extra = o.staged.map(f => path.basename(String(f).replace(/\\/g, '/'))).filter(b => b && !L.fixFiles.includes(b.toLowerCase()));
      if (extra.length) fails.push({ kind: 'drift', msg: `staged file(s) not on the ledger "Fix files:" line: ${extra.join(', ')} — the design moved after the Rubric; rewrite the falsifier rows for the design as it is now, then update "Fix files:"` });
    }
  }
  return { fails, rows: L.rows, fixFiles: L.fixFiles, need };
}

function recordedOverride(qa) {
  let raw; try { raw = fs.readFileSync(OVERRIDES, 'utf8'); } catch (_) { return null; }
  const cutoff = Date.now() - OVERRIDE_HOURS * 3600 * 1000;
  let hit = null;
  for (const l of raw.split(/\r?\n/)) { if (!l.trim()) continue; try { const r = JSON.parse(l); if (r.qa === qa && Date.parse(r.ts) >= cutoff) hit = r; } catch (_) {} }
  return hit;
}

// miya's LAST message (or his popup answer). Assistant text and tool output never count.
function lastUserText(transcriptPath) {
  let raw; try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return ''; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(lines[i]); } catch (_) { continue; }
    const m = o.message || o;
    if ((m.role || o.type) !== 'user') continue;
    const c = m.content;
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) {
      const texts = c.filter(x => x && x.type === 'text').map(x => x.text);
      if (texts.length) return texts.join('\n');
      for (const x of c) {
        if (!x || x.type !== 'tool_result') continue;
        const t = typeof x.content === 'string' ? x.content : Array.isArray(x.content) ? x.content.filter(y => y && y.type === 'text').map(y => y.text).join('\n') : '';
        if (POPUP_ANSWER.test(t)) return [...t.matchAll(/"="([^"]*)"/g)].map(a => a[1]).join('\n');
      }
    }
  }
  return '';
}

// Record an override when miya's last message carries the token for this ticket. Returns the row or null.
function captureOverride(qa, transcriptPath) {
  if (!transcriptPath) return null;
  const last = lastUserText(transcriptPath);
  for (const m of last.matchAll(OVERRIDE_RX)) {
    if (m[1] !== num(qa)) continue;
    const row = { ts: new Date().toISOString(), qa, reason: m[2].trim().slice(0, 200) };
    try { fs.appendFileSync(OVERRIDES, JSON.stringify(row) + '\n'); } catch (_) {}
    return row;
  }
  const plain = plainWaiver(qa, last);
  if (plain) {
    const row = { ts: new Date().toISOString(), qa, reason: 'plain words: "' + plain.slice(0, 160) + '"', via: 'plain' };
    try { fs.appendFileSync(OVERRIDES, JSON.stringify(row) + '\n'); } catch (_) {}
    return row;
  }
  return null;
}

// His own sentence that says the test happens on a server, or that the local test is skipped.
// Not a waiver: a question, a negated or conditional sentence, or a message that names only OTHER tickets.
function plainWaiver(qa, text) {
  const t = String(text || '');
  const nums = t.match(TICKET_NUM_RX) || [];
  if (nums.length && !nums.includes(num(qa))) return null;
  for (const m of t.matchAll(PLAIN_WAIVE_RX)) {
    const start = Math.max(t.lastIndexOf('.', m.index), t.lastIndexOf('?', m.index), t.lastIndexOf('!', m.index), t.lastIndexOf('\n', m.index)) + 1;
    const rest = t.slice(m.index + m[0].length);
    const endRel = rest.search(/[.?!\n]/);
    const end = endRel < 0 ? t.length : m.index + m[0].length + endRel + 1;
    const sentence = t.slice(start, end).trim();
    if (/\?\s*$/.test(sentence)) continue;
    if (/[[\]/]/.test(t.slice(Math.max(0, m.index - 1), m.index + m[0].length + 1))) continue;   // a quoted option list, not his decision
    if (PLAIN_NEGATE_RX.test(t.slice(start, m.index))) continue;
    if (!/\blocal(?:ly)?\s*test/i.test(m[0]) && /\b(?:before|after|until|unless|local(?:ly)?)\b/i.test(m[0])) continue;   // "test locally before we test on server"
    return sentence;
  }
  return null;
}

// Full check for one quest. ctx: 'cli' | 'commit' | 'note'. Never throws.
function check(qa, opts) {
  const o = opts || {}; const t0 = Date.now(); const ctx = o.ctx || 'cli';
  try {
    const block = readBlock(qa);
    if (!block) { log({ qa, ctx, outcome: 'skip', why: 'no-quest', dur_ms: Date.now() - t0 }); return { ok: true, skipped: 'no-quest', fails: [], rows: [] }; }
    const doc = docFor(qa, block);
    const codeFix = ctx === 'commit' || !!o.codeFix;
    let res = { fails: [], rows: [], fixFiles: [] };
    if (!doc) { if (codeFix) res.fails.push({ kind: 'no-doc', msg: `no quest doc found for ${qa} (active.txt qa_doc=${block.qa_doc || '(empty)'})` }); }
    else res = evaluate(fs.readFileSync(doc, 'utf8'), { needLedger: codeFix, staged: o.staged || null, merge: !!o.merge });
    let override = null;
    if (codeFix || ctx === 'cli') {
      if (String(block.local_test_confirmed || '').toLowerCase() !== 'true') {
        override = captureOverride(qa, o.transcriptPath) || recordedOverride(qa);
        if (!override) res.fails.push({ kind: 'local-test', msg: `local_test_confirmed=${block.local_test_confirmed || '(unset)'} in quest/active.txt — test locally and set it true, or miya says in his own message that he tests on the server / skips the local test (plain words count; [risk-ok: ${num(qa)} <reason>] still works)` });
      }
    }
    const ok = res.fails.length === 0;
    log({ qa, ctx, outcome: ok ? 'pass' : 'fail', kinds: res.fails.map(f => f.kind), override: override ? override.reason : undefined, dur_ms: Date.now() - t0 });
    return { ok, fails: res.fails, rows: res.rows, fixFiles: res.fixFiles, doc, override };
  } catch (e) {
    log({ qa, ctx, outcome: 'error', error: String(e && e.message).slice(0, 160), dur_ms: Date.now() - t0 });
    return { ok: true, skipped: 'error', fails: [], rows: [] };   // fail-open on our own bug
  }
}

function message(qa, r, head) {
  return [
    `⛔ falsifier-ledger: ${head || qa + ' is not clear'}`,
    ...r.fails.map(f => `   • [${f.kind}] ${f.msg}`),
    '',
    '   Clear a row by RUNNING its cheapest test and writing `RAN: <what was run, what it showed>`.',
    '   A fired falsifier is `BROKE: <evidence> → row N` with the replacement row written.',
    '   Only miya accepts a risk: `ACCEPTED-RISK: "<his words>" miya YYYY-MM-DD`.',
    `   Ledger: ${r.doc || '(no quest doc)'} · re-check: node domain/falsifier-ran-check/check.js ${qa}`,
    '   There is no skip token for this check.',
  ].join('\n');
}

// ── commit path (called by compile-gate) ──
function git(dir, args) { return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 }).trim(); }
function ticketOf(command, top) {
  let branch = ''; try { branch = git(top, ['rev-parse', '--abbrev-ref', 'HEAD']); } catch (_) {}
  const b = branch.match(/\/(\d{5,})(?:v\d+)?$/i);
  if (b) return b[1];
  const m = String(command).match(/#\s*(\d{5,})\b/);
  return m ? m[1] : null;
}
function gateCommit(i) {
  const cmd = String(i.command || ''); const top = i.top;
  const n = i.ticket || ticketOf(cmd, top);
  if (!n) { log({ ctx: 'commit', outcome: 'skip', why: 'no-ticket' }); return { ok: true, skipped: 'no-ticket' }; }
  const qa = 'QA-' + n;
  if (!readBlock(qa)) { log({ qa, ctx: 'commit', outcome: 'skip', why: 'no-quest' }); return { ok: true, skipped: 'no-quest', qa }; }
  if (/(?:^|[;&|\n(]\s*)git\s+(?:-C\s+\S+\s+)?add\b/i.test(cmd) || /\bcommit\b[^;&|\n]*\s(?:-[a-zA-Z]*a[a-zA-Z]*\b|--all\b)/.test(cmd)) {
    log({ qa, ctx: 'commit', outcome: 'fail', kinds: ['stage-separately'] });
    return { ok: false, qa, message: `⛔ falsifier-ledger: ${qa} — stage first, commit in a separate command.\n   The drift check reads the staged files, so \`git add\` and \`git commit\` cannot share one command (and no \`commit -a\`).` };
  }
  let staged = Array.isArray(i.staged) ? i.staged : null;
  if (!staged) { try { staged = git(top, ['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean); } catch (_) { staged = null; } }
  let merge = !!i.merge;
  if (i.merge === undefined) { try { merge = fs.existsSync(path.resolve(top, git(top, ['rev-parse', '--git-path', 'MERGE_HEAD']))); } catch (_) { merge = false; } }
  const r = check(qa, { ctx: 'commit', staged, merge, transcriptPath: i.transcriptPath });
  return r.ok ? { ok: true, qa, override: r.override } : { ok: false, qa, message: message(qa, r, `commit blocked for ${qa}`) };
}

function show(qa, r) {
  const out = [`Falsifier ledger — ${qa}${r.doc ? ' (' + path.relative(ROOT, r.doc) + ')' : ''}`, '', '| # | design | falsifier | cheapest test | status |', '|---|---|---|---|---|'];
  for (const x of r.rows) out.push(`| ${x.n} | ${x.design} | ${x.falsifier} | ${x.test} | ${x.status} |`);
  if (!r.rows.length) out.push('| — | — | no rows | — | — |');
  if (r.fixFiles && r.fixFiles.length) out.push('', 'Fix files: ' + r.fixFiles.join(', '));
  console.log(out.join('\n'));
}

if (require.main === module) {
  const a = process.argv.slice(2);
  const qa = a[0];
  if (!qa || !/^(QA-\d+|ADHOC-[A-Z0-9]+-\d{4}-\d+)$/.test(qa)) { console.error('usage: node domain/falsifier-ran-check/check.js <QA-NNNNNN> [--staged <repo>] [--show]'); process.exit(2); }
  let staged = null; const si = a.indexOf('--staged');
  if (si > 0 && a[si + 1]) { try { staged = git(a[si + 1], ['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean); } catch (e) { console.error('check: cannot read staged files in ' + a[si + 1]); process.exit(2); } }
  const r = check(qa, { ctx: 'cli', staged });
  if (a.includes('--show')) { show(qa, r); console.log(''); }
  if (r.skipped) { console.log(`falsifier-ledger: ${qa} skipped (${r.skipped})`); process.exit(0); }
  if (r.ok) { console.log(`falsifier-ledger: ${qa} clear — ${r.rows.length} row(s), none OPEN${r.override ? ' · local test overridden by miya: ' + r.override.reason : ''}`); process.exit(0); }
  console.error(message(qa, r));
  process.exit(1);
}

module.exports = { check, evaluate, parseLedger, statusKind, gateCommit, captureOverride, plainWaiver, lastUserText, message, ticketOf, mainRoot, readBlock, OVERRIDE_RX };
