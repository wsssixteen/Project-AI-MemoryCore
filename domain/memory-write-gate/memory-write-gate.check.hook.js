#!/usr/bin/env node
// memory-write-gate.check.hook.js — born via core/forge.js (2026-10-05)
// TRIGGER: PreToolUse on Edit, Write or MultiEdit whose target is a .md file directly inside a .claude/auto-memory folder (worktree or main repo)
// ACTION: BLOCK a feedback memory write unless the current turn already carries a valid RULE-PLACEMENT line for THAT file (file=, workflow, step, enforcing home, why memory is still needed)
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const LOG = path.join(ROOT, 'domain', 'memory-write-gate', 'log.jsonl');
const MEMORY_RE = /[\\/]\.claude[\\/]auto-memory[\\/][^\\/]+\.md$/i;
const TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const EXEMPT_TYPES = new Set(['user', 'project', 'reference']);
const NOT_A_TURN_START = /^\s*(<system-reminder>|<task-notification|Stop hook feedback)/i;
const BAD_WORD = /^[\s`'".,;:\-?!*_]*(todo|tbd|n\/?a|na|\?+|-+|\.+)[\s`'".,;:\-?!*_]*$/i;
const PLACEHOLDER = /<[^<>\n]{1,80}>/;
const BYPASS_RE = /\[skip-memory-write:\s*([^\]]+?)\s*\]/gi;
const LINE_RE = /^[ \t>*`-]*RULE-PLACEMENT:[ \t]*(.+)$/gim;
const KEYS_RE = /(?:^|[·|])\s*(file|workflow|step|enforced-by|memory-because)\s*=|(?:^|[·|\s])(already-enforced)\s*:/gi;
const INDEX_LINE = /^(#{1,6}\s.*|[-*]\s+\[[^\]]+\]\([^)]+\.md\)(\s*[—–-].{0,240})?)$/;

function log(row) {
  try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch (_) {}
}

function normPath(p, base) {
  let s = String(p || '').trim().replace(/\//g, '\\');
  if (!s) return '';
  if (!/^(?:[a-z]:\\|\\\\)/i.test(s)) s = path.win32.resolve(base || ROOT, s);
  return path.win32.normalize(s);
}

function frontmatterType(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(String(text || ''));
  if (!m) return null;
  const t = /^[ \t]*type[ \t]*:[ \t]*["']?([A-Za-z]+)/m.exec(m[1]);
  return t ? t[1].toLowerCase() : null;
}

function readTurn(transcriptPath) {
  let raw; try { raw = fs.readFileSync(transcriptPath || '', 'utf8'); } catch (_) { return null; }
  const ev = []; let parsed = 0;
  for (const line of raw.split('\n')) {
    const s = line.trim(); if (!s) continue;
    let o; try { o = JSON.parse(s); } catch (_) { continue; }
    if (!o || typeof o !== 'object') continue;
    parsed++;
    const m = o.message && typeof o.message === 'object' ? o.message : o;
    const role = m.role || o.type;
    let c = m.content;
    if (typeof c === 'string') c = [{ type: 'text', text: c }];
    if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (!b || typeof b !== 'object') continue;
      if (b.type === 'text' && typeof b.text === 'string') {
        if (role === 'user') ev.push({ k: 'u', text: b.text, real: !o.isMeta && !NOT_A_TURN_START.test(b.text) });
        else if (role === 'assistant') ev.push({ k: 'a', text: b.text });
      } else if (b.type === 'tool_use' && role === 'assistant') ev.push({ k: 't', name: b.name, input: b.input || {}, id: b.id });
      else if (b.type === 'tool_result') ev.push({ k: 'r', id: b.tool_use_id, err: b.is_error === true });
    }
  }
  if (!parsed) return null;
  let last = -1, n = 0;
  ev.forEach((e, i) => { if (e.k === 'u' && e.real) { last = i; n++; } });
  const turn = ev.slice(last + 1);
  const errIds = new Set(turn.filter(e => e.k === 'r' && e.err).map(e => e.id));
  const edited = new Set();
  for (const e of turn) {
    if (e.k === 't' && TOOLS.has(e.name) && !errIds.has(e.id)) {
      const p = e.input.file_path || e.input.notebook_path;
      if (p) edited.add(normPath(p).toLowerCase());
    }
  }
  const hash = n ? crypto.createHash('sha1').update(ev[last].text).digest('hex').slice(0, 8) : '0';
  return { key: path.basename(transcriptPath) + '#' + n + ':' + hash, texts: turn.filter(e => e.k === 'a').map(e => e.text), edited };
}

function validBypass(text) {
  for (const m of text.matchAll(BYPASS_RE)) {
    const r = m[1].trim();
    if (r.length >= 8 && !BAD_WORD.test(r) && !PLACEHOLDER.test(r)) return true;
  }
  return false;
}

function parseFields(rest) {
  const marks = [...rest.matchAll(KEYS_RE)].map(m => ({ key: (m[1] || m[2]).toLowerCase(), start: m.index, end: m.index + m[0].length }));
  const f = {};
  marks.forEach((mk, i) => {
    const stop = i + 1 < marks.length ? marks[i + 1].start : rest.length;
    if (f[mk.key] === undefined) f[mk.key] = rest.slice(mk.end, stop).replace(/[\s·|`]+$/g, '').replace(/^[\s`]+/, '');
  });
  return f;
}

function badValue(v, allowNone) {
  if (v === undefined || !String(v).trim()) return 'is empty';
  if (BAD_WORD.test(v)) return 'is a placeholder word';
  if (PLACEHOLDER.test(v)) return 'still holds an unfilled <placeholder>';
  if (!allowNone && /^none$/i.test(v.trim())) return 'cannot be "none"';
  return '';
}

function rootsFor(memoryFile) {
  const rs = [ROOT];
  const main = ROOT.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/i, '');
  if (main !== ROOT) rs.push(main);
  const m = /^(.*?)[\\/]\.claude[\\/]auto-memory[\\/][^\\/]+\.md$/i.exec(memoryFile);
  if (m) rs.push(m[1]);
  const seen = new Set();
  return rs.filter(r => { const k = normPath(r).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}

function pathVariants(v) {
  const out = [];
  const add = s => { s = String(s).trim().replace(/^[`'"]+|[`'".,;]+$/g, ''); if (s && !out.includes(s)) out.push(s); };
  const first = v.split(/\s+/)[0];
  add(v);
  add(v.replace(/\s*\([^)]*\)\s*$/, ''));
  add(v.replace(/\s+§.*$/, '').replace(/#.*$/, ''));
  add(v.replace(/:\d+(?:-\d+)?(?=\s|$)/, ''));
  add(first);
  add(first.replace(/#.*$/, '').replace(/:\d+(?:-\d+)?$/, ''));
  return out;
}

function checkEnforcedBy(v, f, ctx) {
  let m;
  if ((m = /^new\s*:\s*([\s\S]*)$/i.exec(v))) {
    return badValue(m[1]) ? ['enforced-by=new: needs the name of the gate, hook or skill to build'] : [];
  }
  if ((m = /^none\s*:\s*([\s\S]*)$/i.exec(v))) {
    return (badValue(m[1]) || m[1].trim().length < 8) ? ['enforced-by=none: needs the reason a gate cannot check this (8+ characters)'] : [];
  }
  if (/^(new|none)$/i.test(v)) return ['enforced-by=' + v + ' needs a colon and an answer'];
  if (!/[\\/]/.test(v) && !/\.(js|json|md|mjs|cjs|ts)\b/i.test(v)) {
    const hint = fs.existsSync(path.join(ROOT, 'domain', v)) ? ' (domain/' + v + '/ exists: name the file inside it)' : '';
    return ['enforced-by must be an existing file path, "new: <name>" or "none: <why>"' + hint];
  }
  let found = null;
  for (const variant of pathVariants(v)) {
    const abs = path.isAbsolute(variant) || /^[a-z]:[\\/]/i.test(variant) ? [normPath(variant)] : ctx.roots.map(r => normPath(path.join(r, variant)));
    if (abs.some(a => { try { return fs.existsSync(a); } catch (_) { return false; } })) { found = abs; break; }
  }
  if (!found) return ['enforced-by path not found on disk: ' + v];
  if (found.some(a => MEMORY_RE.test(a))) return ['a memory file is not an enforcer: ' + v];
  const lower = found.map(a => a.toLowerCase());
  const edited = [...ctx.edited].some(e => lower.some(c => e === c || e.startsWith(c + '\\')));
  const claimed = f['already-enforced'];
  if (!edited && (badValue(claimed) || claimed.trim().length < 8)) {
    return ['you named the enforcing file but did not change it; put the rule there first, then write the memory'];
  }
  return [];
}

function checkLine(rest, ctx, base) {
  const f = parseFields(rest);
  const problems = [];
  const fb = badValue(f.file, false);
  if (fb) problems.push('file= ' + fb);
  else if (f.file.trim().replace(/\.md$/i, '').toLowerCase() !== base.replace(/\.md$/i, '').toLowerCase()) problems.push('file=' + f.file.trim() + ' does not match this write (' + base + '); one line per memory file');
  for (const k of ['workflow', 'step']) { const b = badValue(f[k], true); if (b) problems.push(k + '= ' + b); }
  const mb = badValue(f['memory-because'], false);
  if (mb) problems.push('memory-because= ' + mb);
  else if (f['memory-because'].trim().length < 8) problems.push('memory-because= is too short to be a reason');
  const eb = badValue(f['enforced-by'], true);
  if (eb) problems.push('enforced-by= ' + eb);
  else problems.push(...checkEnforcedBy(f['enforced-by'].trim(), f, ctx));
  return problems;
}

function addedLines(oldText, newText) {
  const had = new Set(String(oldText || '').split(/\r?\n/).map(l => l.trim()));
  return String(newText || '').split(/\r?\n/).map(l => l.trim()).filter(l => l && !had.has(l));
}

function siblingPassedThisTurn(key, file) {
  let raw; try { raw = fs.readFileSync(LOG, 'utf8'); } catch (_) { return false; }
  return raw.split('\n').some(l => {
    if (!l) return false;
    try { const r = JSON.parse(l); return r.decision === 'pass' && r.turn === key && r.file !== file && !/memory\.md$/i.test(r.file || ''); } catch (_) { return false; }
  });
}

function blockText(base, problems) {
  return [
    '⛔ memory-write-gate: ' + base + ' is a feedback memory, and a memory entry stops nothing.',
    ...(problems.length ? ['   Problem: ' + problems.join(' | ')] : []),
    '   Before writing it, answer: (a) which workflow are we in, (b) which step of it should carry this rule,',
    '   (c) which gate, hook or skill enforces it (none yet: run the system-design skill and build it first).',
    '   Then put one line for THIS file in your reply text (one line per memory file), change the file it names, and retry this write:',
    '   RULE-PLACEMENT: file=<name.md> · workflow=<name or none> · step=<where in that workflow> · enforced-by=<existing file path, or new: <name>, or none: <why a gate cannot check this>> · memory-because=<why a memory is still needed>',
    '   A named path must exist and be edited this turn, or add: already-enforced: <one sentence>.',
    '   Read: .claude/skills/system-design/SKILL.md · system/INDEX.md',
    '   Bypass only with a real reason: [skip-memory-write: <reason>]',
  ].join('\n');
}

function decide(raw) {
  const text = String(raw || '').trim();
  if (!text) { log({ decision: 'fail-open', reason: 'stdin-empty' }); return { fired: false }; }
  let data;
  try { data = JSON.parse(text); } catch (_) { log({ decision: 'fail-open', reason: 'stdin-not-json' }); return { fired: false }; }
  const ti = (data && data.tool_input) || {};
  if (data.tool_name && !TOOLS.has(data.tool_name)) return { fired: false };
  const rawPath = ti.file_path || ti.notebook_path || ti.path || '';
  if (!rawPath) return { fired: false };
  const file = normPath(rawPath, data.cwd);
  if (!MEMORY_RE.test(file)) return { fired: false };

  const shown = file.replace(/\\/g, '/');
  const base = path.win32.basename(file);
  const isIndex = /^memory\.md$/i.test(base);
  let existing = ''; try { existing = fs.readFileSync(file, 'utf8'); } catch (_) {}
  const edits = Array.isArray(ti.edits) ? ti.edits : null;
  const newText = ti.content !== undefined ? String(ti.content) : edits ? edits.map(e => e.new_string || '').join('\n') : String(ti.new_string || '');
  const oldText = ti.content !== undefined ? existing : edits ? edits.map(e => e.old_string || '').join('\n') : String(ti.old_string || '');

  if (isIndex) {
    if (addedLines(oldText, newText).every(l => INDEX_LINE.test(l))) { log({ decision: 'pass', file: shown, reason: 'index-lines-only' }); return { fired: true, blocked: false }; }
  } else {
    let type = ti.content !== undefined ? frontmatterType(newText) : (frontmatterType(existing) || null);
    if (ti.content === undefined) {
      const snippet = /^[ \t]*type[ \t]*:[ \t]*["']?(user|project|reference|feedback)\b/im.exec(newText);
      if (snippet) type = snippet[1].toLowerCase();
    }
    const feedbackName = /^feedback_/i.test(base);
    if (!feedbackName && EXEMPT_TYPES.has(type)) { log({ decision: 'pass', file: shown, reason: 'type-exempt:' + type }); return { fired: true, blocked: false }; }
    if (type !== 'feedback' && !feedbackName) { log({ decision: 'pass', file: shown, reason: 'not-a-feedback-memory' }); return { fired: true, blocked: false }; }
  }

  const turn = readTurn(data.transcript_path);
  if (!turn) { log({ decision: 'fail-open', file: shown, reason: 'transcript-unreadable' }); return { fired: true, blocked: false }; }
  if (turn.texts.some(validBypass)) {
    log({ decision: 'bypass', file: shown, turn: turn.key });
    return { fired: true, blocked: false, bypassed: true, bypassToken: 'skip-memory-write' };
  }

  if (isIndex) {
    if (siblingPassedThisTurn(turn.key, shown)) { log({ decision: 'pass', file: shown, turn: turn.key, reason: 'sibling-passed-this-turn' }); return { fired: true, blocked: false }; }
    const problems = ['this index edit carries rule text and no feedback memory passed this turn; write the memory (with its RULE-PLACEMENT line) first, or add index lines only'];
    log({ decision: 'block', file: shown, turn: turn.key, reason: problems[0] });
    return { fired: true, blocked: true, blockReason: blockText(base, problems) };
  }

  const ctx = { roots: rootsFor(file), edited: turn.edited };
  let last = ['no RULE-PLACEMENT line in your reply text since the last user message'];
  let lastForFile = null;
  for (const t of turn.texts) {
    for (const m of t.matchAll(LINE_RE)) {
      const problems = checkLine(m[1], ctx, base);
      if (!problems.length) { log({ decision: 'pass', file: shown, turn: turn.key, reason: 'placement-line-valid' }); return { fired: true, blocked: false }; }
      last = problems;
      if (!problems.some(p => /^file=/.test(p))) lastForFile = problems;
    }
  }
  if (lastForFile) last = lastForFile;
  log({ decision: 'block', file: shown, turn: turn.key, reason: last.join(' | ').slice(0, 200) });
  return { fired: true, blocked: true, blockReason: blockText(base, last) };
}

runHook({ name: 'memory-write-gate', event: 'PreToolUse' }, decide);
