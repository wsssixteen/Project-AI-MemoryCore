#!/usr/bin/env node
// observatory — born via forge
// symptom: 2026-09-27 miya: prove monitoring and observability visually for every feature; no single visual screen existed and worktree telemetry was invisible to every report
// goal: one screen shows every component with its purpose, registration, eval, liveness and gaps, plus the stray files no component owns; every finding carries fact, context and judgement with evidence, retrievable in one command (--brief) so Ruri can diagnose the system and brief miya without missing anything
// goal_signal: observatory.eval.js green: counts equal the disk per kind, every non-healthy component appears in a finding, every finding has fact, evidence, context, judgement and action
// retention: regenerate
//
// The data layer of the Lapis Lazuli Observatory (domain/observatory/). Builds ONE read-only
// snapshot: every component + registration / eval / liveness / gaps, the ledgers (slips, evals,
// quests, turns, memory) and the stray files no component owns. It consumes the existing
// generators (feature-census collect() for gap verdicts, audit-briefing gather() for the
// four-block audit) instead of re-deriving their rules.
//
//   node lib/observatory.js                  one-line summary
//   node lib/observatory.js --json           full snapshot to stdout
//   node lib/observatory.js --days 7         liveness window (default 30, max 90)
//   node lib/observatory.js --audit --git    add the slow blocks (the server computes these in the background)
//   node lib/observatory.js --brief [--full]  the findings brief: fact, evidence, context, judgement, action per finding
//   node lib/observatory.js --finding <id>    one finding in full
//   node lib/observatory.js --judge <id> --judgement "..." --justification "..." [--context "..."] [--action "..."]
//                                            record Ruri's judgement on a finding (or component:<id>) in domain/observatory/judgements.jsonl
//
// Roots: CODE_ROOT = this checkout (inventory) · DATA_ROOT = the main repo (live ledgers) ·
// git-registered worktrees (their own untracked telemetry). Unregistered folders under
// .claude/worktrees are NOT read; they are reported as stale worktrees.
// Writes only domain/observatory/log.jsonl (one row per snapshot; OBSERVATORY_NO_LOG=1 skips) and, on --judge,
// domain/observatory/judgements.jsonl. The telemetry cache lives in %TEMP% (see section 2).
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, execFile } = require('child_process');

const CODE_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = CODE_ROOT.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/i, '');
const LOG = path.join(CODE_ROOT, 'domain', 'observatory', 'log.jsonl');
const DAY = 86400000;
const EVENTS = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop'];

// ── helpers ──
const exists = p => { try { fs.statSync(p); return true; } catch (_) { return false; } };
const stat = p => { try { return fs.statSync(p); } catch (_) { return null; } };
const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; } };
const listDir = p => { try { return fs.readdirSync(p, { withFileTypes: true }); } catch (_) { return []; } };
const rel = (root, p) => path.relative(root, p).replace(/\\/g, '/');
const iso = t => new Date(t).toISOString();
const dayOf = t => iso(t).slice(0, 10);
const norm = h => String(h).replace(/\.(check|gate|discipline|trigger)?\.?hook$/, '');
const samePath = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
function readJSON(p) { try { return JSON.parse(read(p)); } catch (_) { return null; } }

// jsonl cache keyed by path + mtime + size, so the server re-parses only files that changed
const jsonlCache = new Map();
function readJsonl(p) {
  const s = stat(p); if (!s) return [];
  const c = jsonlCache.get(p);
  if (c && c.m === s.mtimeMs && c.z === s.size) return c.rows;
  const rows = [];
  for (const line of read(p).split('\n')) { if (!line.trim()) continue; try { rows.push(JSON.parse(line)); } catch (_) {} }
  jsonlCache.set(p, { m: s.mtimeMs, z: s.size, rows });
  return rows;
}
function git(root, args, timeout) {
  try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', timeout: timeout || 8000, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (_) { return null; }
}

// main + the worktrees git still knows about (the only checkouts a live session can write to)
let wtMemo = null;
function registeredWorktrees() {
  if (wtMemo && Date.now() - wtMemo.t < 10000) return wtMemo.list;
  const out = git(DATA_ROOT, ['worktree', 'list', '--porcelain']) || '';
  const list = out.split('\n').filter(l => l.startsWith('worktree ')).map(l => path.resolve(l.slice(9).trim())).filter(p => exists(p));
  wtMemo = { t: Date.now(), list };
  return list;
}
function liveRoots() {
  const roots = [DATA_ROOT];
  for (const w of registeredWorktrees()) if (!roots.some(r => samePath(r, w))) roots.push(w);
  if (!roots.some(r => samePath(r, CODE_ROOT))) roots.push(CODE_ROOT);
  return roots;
}
function rootLabel(r) { return samePath(r, DATA_ROOT) ? 'main' : 'worktree:' + path.basename(r); }
// A ledger appended in several checkouts: union every copy, dedupe identical lines.
function unionJsonl(relPath, roots) {
  const seen = new Set(); const rows = [];
  for (const r of roots) {
    for (const row of readJsonl(path.join(r, relPath))) { const k = JSON.stringify(row); if (seen.has(k)) continue; seen.add(k); rows.push(row); }
  }
  return rows;
}
function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text); const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) { const kv = /^\s*([\w-]+):\s*(.*)$/.exec(line); if (kv && !(kv[1] in out)) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim(); }
  return out;
}
function readmeKeys(text) {
  const pick = k => { const m = new RegExp('^\\s*\\**' + k + '\\**\\s*:\\s*(.+)$', 'mi').exec(text); return m ? m[1].trim() : ''; };
  const title = (/^#\s+(.+)$/m.exec(text) || [])[1] || '';
  return { goal: pick('goal'), retention: pick('retention'), symptom: pick('symptom'), goal_status: pick('goal_status'), title: title.trim() };
}
function headerWhy(text) {
  const pick = k => { const m = new RegExp('^\\s*(?://|\\*)\\s*' + k + ':\\s*(.+)$', 'mi').exec(text.slice(0, 3000)); return m ? m[1].trim() : ''; };
  return { goal: pick('goal'), symptom: pick('symptom'), retention: pick('retention') };
}
// a hook switched off in code: a `// DISABLED` comment directly above a top-level `process.exit(0);`
// (a plain exit after printing, like boot-load-verification.js, is normal completion, not disabling)
function disabledReason(body) {
  const head = body.split(/\r?\n/).slice(0, 80);
  const i = head.findIndex(l => /^process\.exit\(0\);?\s*$/.test(l));
  if (i < 0) return null;
  let j = i; while (j > 0 && /^\s*(\/\/.*)?$/.test(head[j - 1])) j--;      // the contiguous comment block right above the exit
  const note = head.slice(j, i).find(l => /^\s*\/\/.*\bDISABLED\b/.test(l));
  return note ? note.replace(/^\s*\/\/\s*/, '') + ' (line ' + (i + 1) + ')' : null;
}
// why a hook file is deliberately unregistered: the RETIRED / SUPERSEDED line near its opt-out marker
function optOutReason(body) {
  if (!/system-audit:\s*skip-ghost-check/.test(body)) return null;
  const lines = body.split(/\r?\n/).slice(0, 40);
  const line = lines.find(l => /RETIRED|SUPERSEDED|DEREGISTER/i.test(l)) || lines.find(l => /skip-ghost-check/.test(l)) || '';
  return line.replace(/^\s*(\/\/+|\/?\*+)\s*/, '').slice(0, 220);
}
function firstComment(text) {
  const lines = text.slice(0, 2500).split(/\r?\n/).map(l => l.replace(/^\s*(\/\/+|\/?\*+\/?|#!.*)\s?/, '').trim()).filter(Boolean);
  const l = lines.find(x => x.length > 25 && !/use strict|^[\w.-]+\.js\s*$|born via|^-+$/.test(x));
  return l ? l.slice(0, 240) : '';
}
function walkFiles(dir, opts, out = { files: 0, bytes: 0, newest: 0, list: [] }, depth = 0) {
  if (depth > (opts.maxDepth || 12) || out.files > (opts.cap || 60000)) return out;
  for (const e of listDir(dir)) {
    if (opts.skip && opts.skip.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, opts, out, depth + 1);
    else if (e.isFile()) {
      const s = stat(p); if (!s) continue;
      out.files++; out.bytes += s.size; if (s.mtimeMs > out.newest) out.newest = s.mtimeMs;
      if (opts.collect) out.list.push({ p, size: s.size, mtime: s.mtimeMs });
    }
  }
  return out;
}

// ── 1. settings.json registrations: per path + per event lane (registration order) ──
function relFromCommandPath(p) {
  const s = p.replace(/\$\{CLAUDE_PROJECT_DIR\}/g, '').replace(/\\+/g, '/');
  const m = /(?:^|\/)((?:\.claude|domain|lib|core|quest|system)\/.+)$/.exec(s);
  return m ? m[1] : s.replace(/^\/+/, '');
}
function parseSettings() {
  const settings = readJSON(path.join(CODE_ROOT, '.claude', 'settings.json')) || {};
  const reg = new Map();   // rel → { events:Set, matchers:Set, modes:Set, bundles:Set }
  const lanes = {};        // event → [{ matcher, entries:[{ rel, mode, bundle?, children? }] }]
  const add = (r, event, matcher, mode, bundle) => {
    const e = reg.get(r) || { events: new Set(), matchers: new Set(), modes: new Set(), bundles: new Set() };
    e.events.add(event); e.matchers.add(matcher); e.modes.add(mode); if (bundle) e.bundles.add(bundle);
    reg.set(r, e);
  };
  for (const [event, blocks] of Object.entries(settings.hooks || {})) {
    lanes[event] = [];
    for (const block of blocks || []) {
      const matcher = block.matcher || '*';
      const group = { matcher, entries: [] };
      for (const h of block.hooks || []) {
        const cmd = String(h.command || '');
        const paths = [...cmd.matchAll(/"?((?:\$\{CLAUDE_PROJECT_DIR\}|[A-Za-z]:)?[\\/]*[^"\s]+\.(?:json|js))(?=["\s]|$)/g)].map(m => relFromCommandPath(m[1]));
        const manifest = paths.find(p => p.endsWith('.json'));
        if (/dispatch-hooks\.js/.test(cmd) && manifest) {
          const man = readJSON(path.join(CODE_ROOT, manifest)) || {};
          const children = (man.children || []).map(c => String(c).replace(/\\+/g, '/'));
          for (const c of children) add(c, event, matcher, 'bundled', man.name || path.basename(manifest, '.json'));
          add(manifest, event, matcher, 'bundle');
          group.entries.push({ rel: manifest, mode: 'bundle', bundle: man.name || path.basename(manifest, '.json'), children });
          continue;
        }
        const target = paths.filter(p => !/lib\/(hook-runtime|dispatch-hooks)\.js$/.test(p)).pop();
        if (!target) continue;
        const mode = /hook-runtime\.js/.test(cmd) && /--wrap/.test(cmd) ? 'wrapped' : 'direct';
        add(target, event, matcher, mode);
        group.entries.push({ rel: target, mode });
      }
      lanes[event].push(group);
    }
  }
  return { reg, lanes };
}

// ── 2. telemetry: hook-fires*.jsonl from main + registered worktrees, de-duplicated by row ──
// ts is ISO-8601 UTC, so the day is ts.slice(0,10) and windows compare as strings (no Date per row).
// The files OVERLAP (2026-09-27: the live file repeats 109,736 rows of the monthly archive and
// 36,440 rows of the other laptop's file), so a row counts once: each row's identity is hashed and
// a hash already seen is skipped. Files are append-only, so the aggregate is cached with the byte
// offset each file was read to; a cold build parses only lines appended since. The cache lives in
// %TEMP% (never in the OneDrive-synced repo) and rebuilds itself if a file shrinks (rotation).
const CACHE_FILE = path.join(os.tmpdir(), 'lapis-observatory', 'telemetry-v3.json');
const CACHE_V = 3;
let tel = null, telDirty = false, telSavedAt = 0;
function cyrb53(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const rowIdentity = r => [r.ts, r.hook, r.event, r.turn_id, r.session_id, r.dur_ms, r.exit, r.blocked, r.mode].join('|');
function emptyTel() { return { files: {}, seen: new Set(), cells: new Map() }; }
function loadTel() {
  if (tel) return tel;
  const d = readJSON(CACHE_FILE);
  tel = d && d.__v === CACHE_V ? { files: d.files || {}, seen: new Set(d.seen || []), cells: new Map((d.cells || []).map(c => [c.day + '|' + c.hook + '|' + c.event, c])) } : emptyTel();
  return tel;
}
function saveTel(force) {
  if (!telDirty || (!force && Date.now() - telSavedAt < 60000)) return;
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ __v: CACHE_V, files: tel.files, seen: [...tel.seen], cells: [...tel.cells.values()] }));
    telDirty = false; telSavedAt = Date.now();
  } catch (_) {}
}
function readFrom(p, offset) {
  const fd = fs.openSync(p, 'r');
  try { const size = fs.fstatSync(fd).size; const buf = Buffer.alloc(Math.max(0, size - offset)); if (buf.length) fs.readSync(fd, buf, 0, buf.length, offset); return buf; } finally { fs.closeSync(fd); }
}
function ingestTelemetry(files) {
  let t = loadTel();
  if (files.some(f => { const st = t.files[f.p.toLowerCase()]; return st && st.offset > f.size; })) { tel = t = emptyTel(); telDirty = true; }
  for (const f of files) {
    const k = f.p.toLowerCase();
    const st = t.files[k] || (t.files[k] = { offset: 0, rows: 0, unique: 0, dup: 0, noTs: 0, first: '', last: '' });
    if (st.offset >= f.size) continue;
    const buf = readFrom(f.p, st.offset); const end = buf.lastIndexOf(10) + 1;   // whole lines only (a writer may be mid-line)
    if (end <= 0) continue;
    const text = buf.subarray(0, end).toString('utf8');
    let i = 0;
    while (i < text.length) {
      let j = text.indexOf('\n', i); if (j < 0) j = text.length;
      const line = text.slice(i, j); i = j + 1;
      if (line.length < 5) continue;
      let r; try { r = JSON.parse(line); } catch (_) { continue; }
      st.rows++;
      const h = cyrb53(r.ts ? rowIdentity(r) : line.trim());
      if (t.seen.has(h)) { st.dup++; continue; }
      t.seen.add(h); st.unique++;
      const ts = typeof r.ts === 'string' && r.ts.length >= 10 ? r.ts : ''; if (!ts) { st.noTs++; continue; }
      if (!st.first || ts < st.first) st.first = ts; if (ts > st.last) st.last = ts;
      const day = ts.slice(0, 10); const hook = norm(r.hook || '?'); const ev = r.event || '?'; const key = day + '|' + hook + '|' + ev;
      let cell = t.cells.get(key);
      if (!cell) { cell = { day, hook, event: ev, runs: 0, fired: 0, blocks: 0, errs: 0, tmo: 0, ms: 0, last: '' }; t.cells.set(key, cell); }
      cell.runs++; if (r.fired) cell.fired++; if (r.blocked) cell.blocks++;
      if (r.error || (typeof r.exit === 'number' && r.exit !== 0 && r.exit !== 2)) { cell.errs++; if (/ETIMEDOUT/.test(String(r.error || ''))) cell.tmo++; }
      if (typeof r.dur_ms === 'number') cell.ms += r.dur_ms;
      if (ts > cell.last) cell.last = ts;
    }
    st.offset += end; telDirty = true;
  }
  return t;
}
function telemetryFiles(roots) {
  // Monthly archives (hook-fires-YYYY-MM.jsonl) are git-tracked, so every checkout holds a copy:
  // read each archive ONCE (largest copy). Live files are per-root data: read every root's copy.
  const archives = new Map(); const live = [];
  for (const r of roots) {
    const dir = path.join(r, 'system', 'telemetry');
    for (const e of listDir(dir)) {
      if (!e.isFile() || !/^hook-fires.*\.jsonl$/.test(e.name)) continue;
      const p = path.join(dir, e.name); const s = stat(p); if (!s) continue;
      if (/^hook-fires-\d{4}-\d{2}\.jsonl$/.test(e.name)) {
        const prev = archives.get(e.name); if (!prev || s.size > prev.size) archives.set(e.name, { p, root: r, size: s.size, archive: true });
      } else live.push({ p, root: r, size: s.size, archive: false });
    }
  }
  return [...archives.values(), ...live];
}

// ── 3. reference index: which files mention each script (live wiring, not history) ──
function referenceIndex(names) {
  const counts = new Map(names.map(n => [n, new Set()]));
  if (!names.length) return counts;
  const re = new RegExp('(?:^|[^\\w-])(' + names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\.js\\b', 'g');
  const dirs = ['.claude', 'domain', 'lib', 'core', 'quest', 'system', 'Feature'];
  const SKIP = new Set(['worktrees', 'node_modules', 'telemetry', 'auto-memory', 'state', '.git', 'archive', 'build', 'source']);
  const files = [];
  for (const d of dirs) walkFiles(path.join(CODE_ROOT, d), { skip: SKIP, collect: true, cap: 20000 }, { files: 0, bytes: 0, newest: 0, list: files });
  for (const f of ['README.md', 'AGENT-ARCHITECTURE.md', 'RURI-NOTEBOOK.md', 'MIYA-NOTEBOOK.md']) { const p = path.join(CODE_ROOT, f); const s = stat(p); if (s) files.push({ p, size: s.size }); }
  for (const f of files) {
    if (f.size > 1500000 || !/\.(js|json|md|ps1|py|txt|sh)$/.test(f.p) || /\.jsonl$/.test(f.p)) continue;
    const text = read(f.p); const self = rel(CODE_ROOT, f.p);
    let m; re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      const set = counts.get(m[1]);
      if (set && !self.endsWith('/' + m[1] + '.js') && !self.endsWith('/' + m[1] + '.eval.js')) set.add(self);
    }
  }
  return counts;
}

// ── 4. stale worktree folders: on disk under .claude/worktrees but unknown to git ──
// Verdicts come from worktree-cleanup-boot.js's own sweep log (its latest row: kept = holds work
// that is not on main; deleted/would-delete = proven duplicate). Sizes are slow (19 GB on
// 2026-09-27) so they come from staleSizes() (async, the server caches them).
function staleWorktrees() {
  const wtDir = path.join(DATA_ROOT, '.claude', 'worktrees');
  const reg = registeredWorktrees();
  const log = readJsonl(path.join(DATA_ROOT, '.claude', 'state', 'worktree-cleanup-log.jsonl')).filter(r => r.ts).sort((a, b) => (a.ts < b.ts ? -1 : 1));
  const last = log[log.length - 1] || null;
  const kept = new Map(((last && last.kept) || []).map(k => [k.name, k.why]));
  const safe = new Set((last && last.deleted) || []);
  const out = [];
  for (const d of listDir(wtDir)) {
    if (!d.isDirectory()) continue;
    const full = path.join(wtDir, d.name);
    if (reg.some(r => samePath(r, full)) || samePath(full, CODE_ROOT)) continue;
    const s = stat(full);
    const verdict = kept.has(d.name) ? 'keep' : (safe.has(d.name) ? 'safe' : 'unchecked');
    out.push({ name: d.name, modified: s ? iso(s.mtimeMs) : null, verdict,
      why: kept.get(d.name) || (verdict === 'safe' ? 'every file already on main (proven by the cleanup sweep)' : 'not in the last cleanup sweep'), bytes: null });
  }
  return { folders: out.sort((a, b) => a.verdict.localeCompare(b.verdict) || a.name.localeCompare(b.name)), sweep: last ? { ts: last.ts, dry: !!last.dry } : null };
}
// async size walk for the stale folders (minutes on OneDrive); resolves { name: bytes }
async function staleSizes(names) {
  const fsp = fs.promises; const out = {};
  async function size(dir) {
    let total = 0; let ents = [];
    try { ents = await fsp.readdir(dir, { withFileTypes: true }); } catch (_) { return 0; }
    for (const e of ents) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) total += await size(p);
      else if (e.isFile()) { try { total += (await fsp.stat(p)).size; } catch (_) {} }
    }
    return total;
  }
  for (const n of names) out[n] = await size(path.join(DATA_ROOT, '.claude', 'worktrees', n));
  return out;
}

// ── 5. git state (slow on OneDrive: async, the server caches it) ──
function gitStateAsync(root) {
  const run = args => new Promise(res => execFile('git', ['-C', root, ...args], { encoding: 'utf8', timeout: 20000 }, (e, o) => res(e ? null : String(o).trim())));
  return Promise.all([run(['rev-parse', '--abbrev-ref', 'HEAD']), run(['rev-parse', '--short', 'HEAD']), run(['rev-list', '--left-right', '--count', 'origin/main...HEAD']), run(['status', '--porcelain', '--untracked-files=no'])])
    .then(([branch, head, ab, st]) => {
      if (branch === null) return null;
      const n = (ab || '0\t0').split(/\s+/).map(Number);
      return { root: rootLabel(root), branch, head, behindMain: n[0] || 0, aheadMain: n[1] || 0, dirty: (st || '').split('\n').filter(Boolean).length };
    });
}
async function gitStates() { const roots = liveRoots(); return (await Promise.all(roots.map(gitStateAsync))).filter(Boolean); }

// ── 6. audit block: the same four-block screen Domain Expansion runs, read against the main repo ──
function audit() {
  const prev = process.env.CLAUDE_PROJECT_DIR;
  try {
    process.env.CLAUDE_PROJECT_DIR = DATA_ROOT;
    const p = path.join(CODE_ROOT, 'lib', 'audit-briefing.js'); delete require.cache[require.resolve(p)];
    const g = require(p).gather();
    return { generated: iso(Date.now()), notWorking: g.notWorking, slow: g.slow.concat(g.heavyTurns || []), mistakes: g.mistakes, optimizations: g.opt, rulings: g.rulings, n: g.n };
  } catch (e) { return { generated: iso(Date.now()), error: String(e.message || e) }; }
  finally { if (prev === undefined) delete process.env.CLAUDE_PROJECT_DIR; else process.env.CLAUDE_PROJECT_DIR = prev; }
}

// ── 7. the snapshot ──
function build(opts = {}) {
  const t0 = Date.now(); const timings = {}; let tl = t0; const lap = k => { const n = Date.now(); timings[k] = n - tl; tl = n; };
  const days = Math.max(1, Math.min(90, parseInt(opts.days || 30, 10) || 30));
  const now = Date.now(); const since = now - days * DAY;
  const roots = liveRoots();
  const dayList = []; for (let d = days - 1; d >= 0; d--) dayList.push(dayOf(now - d * DAY));
  const firstDay = dayList[0]; const sinceIso = iso(since);
  lap('roots');

  // telemetry
  const sources = [];
  const perHook = new Map();                   // hook → window aggregate + spark
  const lastEver = new Map();                  // hook → last ts (all time)
  const daily = new Map(dayList.map(d => [d, { day: d, runs: 0, fired: 0, blocks: 0, errs: 0, ms: 0, boots: 0 }]));
  const bootsByDay = new Map();
  const tfiles = telemetryFiles(roots);
  const T = ingestTelemetry(tfiles); saveTel(opts.by !== 'server');
  for (const f of tfiles) {
    const st = T.files[f.p.toLowerCase()] || {};
    const base = f.archive ? 'monthly archive (git-tracked, read once)' : (samePath(f.root, DATA_ROOT) ? 'live' : 'worktree-only: gitignored, lost when the worktree is removed');
    sources.push({ kind: 'hook telemetry', root: rootLabel(f.root), file: rel(f.root, f.p), rows: st.rows || 0, unique: st.unique || 0, duplicates: st.dup || 0, bytes: f.size, first: st.first || null, last: st.last || null,
      note: base + (st.dup ? ` · ${st.dup.toLocaleString('en-US')} rows repeat another file and are counted once` : '') });
  }
  for (const c of T.cells.values()) {
    if (c.last > (lastEver.get(c.hook) || '')) lastEver.set(c.hook, c.last);
    if (c.day < firstDay || !daily.has(c.day)) continue;
    let h = perHook.get(c.hook);
    if (!h) { h = { runs: 0, fired: 0, blocks: 0, errs: 0, tmo: 0, ms: 0, events: new Set(), spark: new Map() }; perHook.set(c.hook, h); }
    h.runs += c.runs; h.fired += c.fired; h.blocks += c.blocks; h.errs += c.errs; h.tmo += c.tmo || 0; h.ms += c.ms; h.events.add(c.event);
    h.spark.set(c.day, (h.spark.get(c.day) || 0) + c.runs);
    const dd = daily.get(c.day); dd.runs += c.runs; dd.fired += c.fired; dd.blocks += c.blocks; dd.errs += c.errs; dd.ms += c.ms;
    if (c.event === 'SessionStart') bootsByDay.set(c.day, Math.max(bootsByDay.get(c.day) || 0, c.runs));
  }
  for (const [d, b] of bootsByDay) if (daily.has(d)) daily.get(d).boots = b;
  const runtimeOf = keys => {
    const out = { runs: 0, fired: 0, blocks: 0, errs: 0, ms: 0, last: '', spark: dayList.map(() => 0), events: [] };
    const ev = new Set();
    for (const k of keys) {
      const le = lastEver.get(k) || ''; if (le > out.last) out.last = le;
      const h = perHook.get(k); if (!h) continue;
      out.runs += h.runs; out.fired += h.fired; out.blocks += h.blocks; out.errs += h.errs; out.ms += h.ms;
      h.events.forEach(e => ev.add(e));
      dayList.forEach((d, i) => { out.spark[i] += h.spark.get(d) || 0; });
    }
    out.avgMs = out.runs ? Math.round(out.ms / out.runs) : 0; out.events = [...ev]; out.last = out.last || null;
    return out;
  };
  lap('telemetry');

  // registrations + census verdicts
  const { reg, lanes } = parseSettings();
  let census = [];
  try { census = require(path.join(CODE_ROOT, 'lib', 'feature-census.js')).collect(); } catch (e) { census = []; }
  const censusBy = new Map(census.map(r => [r.name, r]));
  // census calls an unregistered hook file a "ghost"; here ghost means a registered path with no file, so the label is mapped
  const censusGaps = name => { const r = censusBy.get(name); return r && /^GAPS: /.test(r.verdict) ? r.verdict.slice(6).split(', ').map(g => (g === 'NOT REGISTERED (ghost)' ? 'not registered in settings.json' : g)) : []; };
  const registry = new Map();
  for (const r of unionJsonl('system/registry.jsonl', [CODE_ROOT, DATA_ROOT])) if (r.name) registry.set(r.name, { ...(registry.get(r.name) || {}), ...r, born: (registry.get(r.name) || {}).born || r.ts });

  // eval battery (latest run across checkouts)
  const battery = unionJsonl('system/telemetry/eval-battery.jsonl', [CODE_ROOT, DATA_ROOT]).filter(r => r.ts).sort((a, b) => (a.ts < b.ts ? -1 : 1)).pop() || null;
  const failSet = new Set((battery && battery.fails || []).map(f => String(f).replace(/\\/g, '/')));
  const quarantine = new Map((battery && battery.quarantined || []).map(q => [String(q.eval).replace(/\\/g, '/'), q.reason]));
  const evalStatus = evals => {
    if (!evals.length) return 'none';
    if (evals.some(e => failSet.has(e))) return 'fail';
    if (evals.every(e => quarantine.has(e))) return 'quarantined';
    return battery ? 'pass' : 'unknown';
  };

  // domain logs (gitignored runtime: union every live root)
  const logActivity = relDir => {
    let rows = 0, last = '';
    for (const r of roots) for (const row of readJsonl(path.join(r, relDir, 'log.jsonl'))) { const t = typeof row.ts === 'string' ? row.ts : ''; if (!t) continue; if (t > last) last = t; if (t >= sinceIso) rows++; }
    return { rows, last: last || null };
  };
  lap('registrations+census');

  const components = [];
  const push = c => { c.id = c.kind + ':' + c.path; components.push(c); return c; };
  const registrationOf = relPath => { const r = reg.get(relPath); if (!r) return null; return { events: [...r.events], matchers: [...r.matchers].filter(m => m !== '*'), mode: [...r.modes].join('+'), bundles: [...r.bundles] }; };

  // 7a. domain/ features
  const ROLE = /(\.hook\.js|eval.*\.js|\.eval\.js|^README\.md|^NUKE-MARKER\.md|\.jsonl|\.json|^SKILL\.md)$/i;
  const STRAY = /^(_|AUDIT-)|-raw\.|\.(bak|tmp|old|orig)$|(^|[-_ ])copy([-_. ]|$)|-backup/i;
  const looseFiles = [];
  const evalFileOwner = new Map();
  for (const d of listDir(path.join(CODE_ROOT, 'domain'))) {
    if (!d.isDirectory()) continue;
    const dir = path.join(CODE_ROOT, 'domain', d.name); const relDir = 'domain/' + d.name;
    const files = listDir(dir).filter(e => e.isFile()).map(e => e.name);
    if (d.name === 'bundles') {
      for (const f of files.filter(f => f.endsWith('.json'))) {
        const man = readJSON(path.join(dir, f)) || {}; const r = registrationOf(relDir + '/' + f);
        const missing = (man.children || []).filter(c => !exists(path.join(CODE_ROOT, c)));
        const kids = (man.children || []).map(c => norm(path.basename(c, '.js')));
        push({ kind: 'bundle', name: man.name || f.replace(/\.json$/, ''), path: relDir + '/' + f, description: 'Dispatch bundle: runs ' + (man.children || []).length + ' hooks in one process (' + (man.children || []).map(c => path.basename(c)).join(', ') + ')',
          purpose: 'run ' + (man.children || []).length + ' hooks in one process to cut spawn cost', children: man.children || [], registration: r, events: r ? r.events : [], runtime: runtimeOf(kids), gaps: [...(r ? [] : ['NOT REGISTERED']), ...missing.map(m => 'missing child ' + m)], evals: [], evalStatus: 'none', observable: true, files: [f] });
      }
      continue;
    }
    const readmeText = read(path.join(dir, 'README.md')); const rk = readmeKeys(readmeText);
    const hooks = files.filter(f => /\.hook\.js$/.test(f));
    const evals = files.filter(f => /eval.*\.js$|\.eval\.js$/.test(f)).map(f => relDir + '/' + f);
    evals.forEach(e => evalFileOwner.set(e, relDir));
    const hookInfo = hooks.map(h => {
      const body = read(path.join(dir, h)); const rp = relDir + '/' + h; const r0 = reg.get(rp);
      return { file: rp, key: norm(path.basename(h, '.js')), registration: registrationOf(rp), optOut: /system-audit:\s*skip-ghost-check/.test(body), optOutReason: optOutReason(body),
        observable: !!(r0 && [...r0.modes].some(m => m !== 'direct')) || /runHook|hook-runtime/.test(body) };
    });
    // retired: tombstone word near the README top, a README title saying so, or every hook opted out of registration on purpose
    const titleRetired = /^#\s.*\b(RETIRED|DEREGISTERED|TOMBSTONE)\b/m.test(readmeText);
    const allOptedOut = hookInfo.length > 0 && hookInfo.every(h => !h.registration && h.optOut);
    const retired = /\b(RETIRED|DEREGISTERED|TOMBSTONE)\b/.test(readmeText.slice(0, 400)) || titleRetired || allOptedOut;
    const retiredReason = retired ? (allOptedOut ? hookInfo.map(h => h.optOutReason).filter(Boolean)[0] || 'every hook opted out of registration' : ((/^#\s.*$/m.exec(readmeText) || [''])[0].replace(/^#\s*/, ''))) : null;
    const keys = [...new Set([...hookInfo.map(h => h.key), d.name])];
    const la = logActivity(relDir);
    const support = files.filter(f => !ROLE.test(f));
    for (const f of support) if (STRAY.test(f)) looseFiles.push({ path: relDir + '/' + f, reason: 'loose file inside a feature folder (not hook, eval, README, log or config)' });
    const events = [...new Set(hookInfo.flatMap(h => h.registration ? h.registration.events : []))];
    const registered = hookInfo.filter(h => h.registration);
    const c = push({ kind: hooks.length ? 'feature' : 'package', name: d.name, path: relDir, title: rk.title, description: rk.goal || firstComment(read(path.join(dir, hooks[0] || ''))) || rk.title,
      readme: { goal: rk.goal, retention: rk.retention, symptom: rk.symptom, goal_status: rk.goal_status }, purpose: rk.goal || '', hooks: hookInfo, events,
      registration: registered.length ? { events, mode: [...new Set(registered.map(h => h.registration.mode))].join('+'), matchers: [...new Set(registered.flatMap(h => h.registration.matchers))], bundles: [...new Set(registered.flatMap(h => h.registration.bundles))] } : null,
      evals, evalStatus: evalStatus(evals), runtime: runtimeOf(keys), log: la, files, support, retired, observable: hookInfo.some(h => h.observable) || la.last !== null,
      retiredReason, gaps: censusGaps(relDir).filter(g => !(g === 'not registered in settings.json' && hookInfo.every(h => h.registration || h.optOut))), lifecycle: (registry.get(d.name) || {}).lifecycle || null, born: (registry.get(d.name) || {}).born || null });
    c.unregisteredHooks = hookInfo.filter(h => !h.registration && !h.optOut).map(h => h.file);
  }

  // 7b. legacy hooks
  for (const e of listDir(path.join(CODE_ROOT, '.claude', 'hooks'))) {
    if (!e.isFile() || !e.name.endsWith('.js') || /\.eval\.js$/.test(e.name)) continue;
    const r = '.claude/hooks/' + e.name; const body = read(path.join(CODE_ROOT, r));
    const evalName = r.replace(/\.js$/, '.eval.js'); const evals = exists(path.join(CODE_ROOT, evalName)) ? [evalName] : [];
    evals.forEach(x => evalFileOwner.set(x, r));
    const registration = registrationOf(r); const optOut = /system-audit:\s*skip-ghost-check/.test(body);
    push({ kind: 'legacy-hook', name: e.name.replace(/\.js$/, ''), path: r, description: firstComment(body), purpose: headerWhy(body).goal || '', disabled: disabledReason(body), registration, optOut, events: registration ? registration.events : [],
      evals, evalStatus: evalStatus(evals), runtime: runtimeOf([norm(e.name.replace(/\.js$/, ''))]), observable: !!(registration && !/^direct$/.test(registration.mode)) || /hook-runtime|log\.jsonl|appendFileSync\(LOG/.test(body),
      gaps: censusGaps(r), lifecycle: (registry.get(e.name.replace(/\.js$/, '')) || {}).lifecycle || null });
  }

  // 7c. registered paths with no file on disk (ghosts)
  for (const g of [...reg.keys()].filter(r => !exists(path.join(CODE_ROOT, r)))) {
    push({ kind: /\.json$/.test(g) ? 'bundle' : (g.startsWith('.claude/') ? 'legacy-hook' : 'feature'), name: path.basename(g), path: g, ghost: true, purpose: '', description: 'Registered in settings.json but the file does not exist', registration: registrationOf(g), events: (registrationOf(g) || {}).events || [], evals: [], evalStatus: 'none', runtime: runtimeOf([norm(path.basename(g, '.js'))]), gaps: ['GHOST: registered, file missing'] });
  }
  lap('features+legacy');

  // 7d. skills (project + .agents)
  const skillLog = unionJsonl('domain/skill-invocation-log/log.jsonl', roots);
  const skillUse = new Map();
  for (const r of skillLog) { if (!r.skill) continue; const t = typeof r.ts === 'string' ? r.ts : ''; const s = skillUse.get(r.skill) || { n: 0, n30: 0, last: '' }; s.n++; if (t >= sinceIso) s.n30++; if (t > s.last) s.last = t; skillUse.set(r.skill, s); }
  for (const [base, label] of [[path.join(CODE_ROOT, '.claude', 'skills'), '.claude/skills'], [path.join(CODE_ROOT, '.agents', 'skills'), '.agents/skills']]) {
    for (const d of listDir(base)) {
      if (!d.isDirectory() && !d.isSymbolicLink()) continue;
      const dir = path.join(base, d.name); const text = read(path.join(dir, 'SKILL.md')); const fm = frontmatter(text);
      const files = listDir(dir).map(e => e.name);
      const evals = files.filter(f => /eval/i.test(f)).map(f => label + '/' + d.name + '/' + f);
      const use = skillUse.get(fm.name || d.name) || skillUse.get(d.name) || { n: 0, n30: 0, last: '' };
      const gaps = censusGaps('.claude/skills/' + d.name);
      if (!text) gaps.push('no SKILL.md'); else if (!fm.description) gaps.push('no description');
      push({ kind: 'skill', name: fm.name || d.name, path: label + '/' + d.name, description: (fm.description || '').slice(0, 400), purpose: (fm.description || '').slice(0, 400), evals, evalStatus: evals.length ? 'present' : 'none',
        usage: { total: use.n, window: use.n30, last: use.last || null }, files, gaps: [...new Set(gaps)], observable: true, source: label });
    }
  }
  const pluginSkillUse = [...skillUse.entries()].filter(([k]) => k.includes(':')).map(([k, v]) => ({ skill: k, total: v.n, window: v.n30, last: v.last || null })).sort((a, b) => b.total - a.total);
  lap('skills');

  // 7e. scripts (core/ lib/ quest/ system/)
  const scriptRows = [];
  for (const dirName of ['core', 'lib', 'quest', 'system']) {
    for (const e of listDir(path.join(CODE_ROOT, dirName))) {
      if (!e.isFile() || !/\.js$/.test(e.name) || /\.eval\.js$|\.log\./.test(e.name)) continue;
      scriptRows.push({ dirName, file: e.name, r: dirName + '/' + e.name });
    }
  }
  const refs = referenceIndex([...new Set(scriptRows.map(s => s.file.replace(/\.js$/, '')))]);
  for (const s of scriptRows) {
    const body = read(path.join(CODE_ROOT, s.r)); const why = headerWhy(body);
    const evalName = s.r.replace(/\.js$/, '.eval.js'); const evals = exists(path.join(CODE_ROOT, evalName)) ? [evalName] : [];
    evals.forEach(x => evalFileOwner.set(x, s.r));
    const name = s.file.replace(/\.js$/, ''); const refSet = refs.get(name) || new Set();
    const logP = [path.join(DATA_ROOT, s.dirName, name + '.log.jsonl'), path.join(CODE_ROOT, s.dirName, name + '.log.jsonl')].find(exists);
    const lastRun = logP ? readJsonl(logP).map(r => r.ts).filter(t => typeof t === 'string').sort().pop() || null : null;
    push({ kind: 'script', name, path: s.r, description: why.goal || firstComment(body), purpose: why.goal || '', readme: why, evals, evalStatus: evalStatus(evals),
      refs: refSet.size, refFiles: [...refSet].slice(0, 12), lastRun, observable: /appendFileSync|log\.jsonl|jsonl'/.test(body),
      gaps: censusGaps(s.r), lifecycle: (registry.get(name) || {}).lifecycle || null, born: (registry.get(name) || {}).born || null });
  }
  lap('scripts+refs');

  // 7f. protocol systems, workflows, knowledge bases, projects
  for (const d of listDir(path.join(CODE_ROOT, 'Feature'))) {
    if (!d.isDirectory()) continue;
    const dir = path.join(CODE_ROOT, 'Feature', d.name); const w = walkFiles(dir, {});
    const md = listDir(dir).filter(e => e.isFile() && e.name.endsWith('.md')).map(e => e.name);
    const head = read(path.join(dir, md[0] || '')).slice(0, 1500);
    push({ kind: 'protocol', name: d.name, path: 'Feature/' + d.name, description: (/^#\s+(.+)$/m.exec(head) || [])[1] || '', files: md, fileCount: w.files, bytes: w.bytes, modified: w.newest ? iso(w.newest) : null,
      retired: /\b(TOMBSTONE|RETIRED)\b/.test(head), gaps: [], evals: [], evalStatus: 'none', observable: false });
  }
  for (const e of listDir(path.join(CODE_ROOT, '.claude', 'workflows'))) {
    if (!e.isFile()) continue; const body = read(path.join(CODE_ROOT, '.claude', 'workflows', e.name));
    const desc = (/description:\s*['"`]([^'"`]+)/.exec(body) || [])[1] || firstComment(body);
    push({ kind: 'workflow', name: e.name.replace(/\.js$/, ''), path: '.claude/workflows/' + e.name, description: desc, gaps: [], evals: [], evalStatus: 'none', observable: false });
  }
  const kroot = path.join(DATA_ROOT, 'projects', 'coding-projects', 'active', 'etanah-knowledge');
  for (const d of listDir(kroot)) {
    if (!d.isDirectory()) continue; const w = walkFiles(path.join(kroot, d.name), {});
    push({ kind: 'knowledge', name: d.name, path: 'projects/coding-projects/active/etanah-knowledge/' + d.name, description: 'etanah-knowledge for ' + d.name + ' (untracked, main repo only)', fileCount: w.files, bytes: w.bytes,
      modified: w.newest ? iso(w.newest) : null, gaps: w.files ? [] : ['empty knowledge folder'], evals: [], evalStatus: 'none', observable: false });
  }
  if (exists(path.join(CODE_ROOT, 'etanah_atlas'))) {
    const w = walkFiles(path.join(CODE_ROOT, 'etanah_atlas'), {});
    push({ kind: 'project', name: 'etanah_atlas', path: 'etanah_atlas', description: 'Atlas build (per-state HTML + config), shipped from this repo; guarded by atlas-ship-gate and atlas-full-check', fileCount: w.files, bytes: w.bytes, modified: w.newest ? iso(w.newest) : null, gaps: [], evals: [], evalStatus: 'none', observable: true });
  }
  lap('protocols+knowledge');

  // 7g. memory stores
  const memDir = path.join(DATA_ROOT, '.claude', 'auto-memory');
  const memFiles = listDir(memDir).filter(e => e.isFile() && e.name.endsWith('.md') && e.name !== 'MEMORY.md').map(e => e.name);
  const memIndex = read(path.join(memDir, 'MEMORY.md'));
  const linked = new Set([...memIndex.matchAll(/\]\(([^)]+\.md)\)/g)].map(m => m[1]));
  const memTypes = {}; for (const f of memFiles) { const body = read(path.join(memDir, f)); const fm = frontmatter(body); const t = fm.type || (body.match(/^\s+type:\s*(\w+)/m) || [])[1] || 'untyped'; memTypes[t] = (memTypes[t] || 0) + 1; }
  const brokenLinks = [...linked].filter(l => !exists(path.join(memDir, l)));
  const unindexed = memFiles.filter(f => !linked.has(f));
  const diaryDir = path.join(DATA_ROOT, 'daily-diary', 'current');
  const diary = listDir(diaryDir).filter(e => e.isFile() && /^\d{4}-\d{2}-\d{2}\.md$/.test(e.name)).map(e => e.name.slice(0, 10)).sort();
  const mainFiles = listDir(path.join(DATA_ROOT, 'main')).filter(e => e.isFile()).map(e => { const p = path.join(DATA_ROOT, 'main', e.name); const s = stat(p); return { name: e.name, bytes: s.size, lines: read(p).split('\n').length, modified: iso(s.mtimeMs) }; });
  const localDay = t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const today = localDay(now);   // diary files are named by LOCAL date
  const memory = {
    autoMemory: { dir: rel(DATA_ROOT, memDir), total: memFiles.length, types: Object.entries(memTypes).map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n), indexLines: (memIndex.match(/^- \[/gm) || []).length, brokenLinks, unindexed },
    diary: { count: diary.length, latest: diary[diary.length - 1] || null, today, hasToday: diary.includes(today), daysSince: diary.length ? Math.floor((Date.parse(today) - Date.parse(diary[diary.length - 1])) / DAY) : null },
    main: mainFiles, sessionCap: 500,
  };
  for (const m of [['main/main-memory.md', 'Identity and relationship memory'], ['main/current-session.md', 'Session memory (capped at 500 lines)'], ['main/todo.md', 'Todo queue'], ['.claude/auto-memory', 'Auto-memory store (' + memFiles.length + ' files)'], ['daily-diary', 'Daily diary (' + diary.length + ' days)']]) {
    const p = path.join(DATA_ROOT, m[0]); const s = stat(p); if (!s) continue;
    const gaps = [];
    if (m[0] === 'main/current-session.md') { const l = read(p).split('\n').length; if (l > 500) gaps.push('over the 500-line cap (' + l + ' lines)'); }
    if (m[0] === '.claude/auto-memory') { if (brokenLinks.length) gaps.push(brokenLinks.length + ' broken index links'); if (unindexed.length) gaps.push(unindexed.length + ' memories not in MEMORY.md'); }
    if (m[0] === 'daily-diary' && !memory.diary.hasToday) gaps.push('no diary entry today');
    push({ kind: 'memory', name: path.basename(m[0]), path: m[0], description: m[1], modified: iso(s.mtimeMs), gaps, evals: [], evalStatus: 'none', observable: false, info: true });
  }

  // 7h. constitution docs (system/*.md, .claude/*.md, root docs); dated reports are operation outputs instead
  const DATED = /-\d{4}-\d{2}-\d{2}/;
  const reports = [];
  for (const dir of ['system', '.claude', '']) {
    for (const e of listDir(path.join(CODE_ROOT, dir))) {
      if (!e.isFile() || !/\.md$/.test(e.name)) continue;
      const r = (dir ? dir + '/' : '') + e.name; const s = stat(path.join(CODE_ROOT, r));
      if (DATED.test(e.name)) { reports.push({ path: r, bytes: s.size, modified: iso(s.mtimeMs) }); continue; }
      const head = read(path.join(CODE_ROOT, r)).slice(0, 1200);
      push({ kind: 'doc', name: e.name, path: r, description: ((/^#\s+(.+)$/m.exec(head) || [])[1] || '').slice(0, 200), generated: /GENERATED|generated by|AUTO-GENERATED/i.test(head.slice(0, 300)), modified: iso(s.mtimeMs), bytes: s.size, gaps: [], evals: [], evalStatus: 'none', observable: false, info: true });
    }
  }

  // ── 8. verdict per component ──
  // purpose pillar: a judged component with no declared goal cannot be judged met or unmet, so it is a gap, never healthy
  for (const c of components) if (['feature', 'package', 'legacy-hook', 'script', 'bundle'].includes(c.kind) && !c.purpose && !c.ghost && !c.retired && !c.disabled && !(c.gaps || []).includes('goal-less')) c.gaps = [...(c.gaps || []), 'no purpose declared'];
  for (const c of components) {
    const rt = c.runtime; const silent = rt && c.registration && c.observable && rt.runs === 0 && !(c.log && c.log.rows);
    c.gaps = [...new Set(c.gaps || [])];
    if (c.retired || c.disabled) c.verdict = 'retired';
    else if (c.ghost) c.verdict = 'ghost';
    else if (c.evalStatus === 'fail') c.verdict = 'failing';
    else if ((c.kind === 'legacy-hook' && !c.registration && !c.optOut) || (c.kind === 'feature' && (c.unregisteredHooks || []).length && !c.registration)) c.verdict = 'unregistered';
    else if (silent) c.verdict = 'silent';
    else if (c.gaps.length) c.verdict = 'gaps';
    else c.verdict = 'healthy';
    c.status = { healthy: 'good', retired: 'neutral', ghost: 'critical', failing: 'critical', unregistered: 'serious', silent: 'warning', gaps: 'warning' }[c.verdict];
  }
  lap('memory+docs+verdicts');

  // ── 9. strays: everything no component owns ──
  const fsJson = (() => { const m = /```json\s*([\s\S]*?)```/.exec(read(path.join(CODE_ROOT, 'system', 'FOLDER-STRUCTURE.md'))); try { return JSON.parse(m[1]); } catch (_) { return { allow: [], pending_nod: [] }; } })();
  const allow = new Set(fsJson.allow || []); const pending = new Set(fsJson.pending_nod || []);
  const rootEntries = listDir(DATA_ROOT).filter(e => e.name !== '.git').map(e => {
    const p = path.join(DATA_ROOT, e.name); const isDir = e.isDirectory() || e.isSymbolicLink();
    // projects/ is the gitignored etanah workspace (thousands of files): listed, not walked
    const w = e.name === 'projects' ? { files: null, bytes: null, newest: (stat(p) || {}).mtimeMs || 0 }
      : isDir ? walkFiles(p, { skip: new Set(['.git', 'node_modules', 'worktrees']), cap: 30000 }) : (() => { const s = stat(p); return { files: 1, bytes: s ? s.size : 0, newest: s ? s.mtimeMs : 0 }; })();
    const cls = allow.has(e.name) ? 'canonical' : (pending.has(e.name) ? 'pending-nod' : 'orphan');
    return { name: e.name, dir: isDir, class: cls, files: w.files, bytes: w.bytes, modified: w.newest ? iso(w.newest) : null };
  }).sort((a, b) => a.class.localeCompare(b.class) || b.bytes - a.bytes);
  const conflict = (() => {
    const names = new Set(); for (const m of read(path.join(DATA_ROOT, '.gitignore')).matchAll(/^\*-([A-Za-z][A-Za-z0-9]+)(?:-\[0-9\])?\.[a-z]+\s*$/gm)) names.add(m[1]);
    if (process.env.COMPUTERNAME) names.add(process.env.COMPUTERNAME);
    const alt = [...names].map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'); if (!alt) return [];
    const re = new RegExp('-(?:' + alt + ')(?:-\\d+)?(?:\\.[A-Za-z0-9]+)?$', 'i'); const hits = [];
    const SKIP = new Set(['node_modules', 'worktrees', '.git', 'projects']);
    (function walk(d, depth) { if (depth > 6 || hits.length > 200) return; for (const e of listDir(d)) { if (SKIP.has(e.name)) continue; const p = path.join(d, e.name); if (re.test(e.name)) { hits.push(rel(DATA_ROOT, p)); if (e.isDirectory()) continue; } if (e.isDirectory()) walk(p, depth + 1); } })(DATA_ROOT, 0);
    return hits;
  })();
  const stale = staleWorktrees();
  const byKind = k => components.filter(c => c.kind === k);
  const strays = {
    rootEntries,
    pendingOrOrphan: rootEntries.filter(r => r.class !== 'canonical'),
    staleWorktrees: stale.folders, staleSweep: stale.sweep,
    conflictCopies: conflict,
    looseFiles,
    unreferencedScripts: byKind('script').filter(s => s.refs === 0).map(s => ({ path: s.path, reason: 'no other file references it' })),
    unregisteredHooks: [...byKind('legacy-hook').filter(h => !h.registration && !h.optOut).map(h => h.path), ...byKind('feature').flatMap(f => f.unregisteredHooks || [])],
    evalOnlyPackages: byKind('package').filter(p => p.evals.length && p.files.every(f => /eval|README|NUKE|\.jsonl?$/i.test(f))).map(p => p.path),
    reports,
  };
  strays.total = strays.pendingOrOrphan.length + stale.folders.length + conflict.length + looseFiles.length + strays.unreferencedScripts.length + strays.unregisteredHooks.length + strays.evalOnlyPackages.length;
  lap('strays');

  // ── 10. ledgers ──
  const slipsAll = unionJsonl('system/slips.jsonl', [CODE_ROOT, DATA_ROOT]).filter(r => typeof r.ts === 'string').sort((a, b) => (a.ts < b.ts ? -1 : 1));
  const slipWindow = slipsAll.filter(r => r.ts >= sinceIso);
  const isSlip = r => !r.type || r.type === 'slip';
  const countBy = (rows, k) => { const o = {}; for (const r of rows) { const v = r[k] || '—'; o[v] = (o[v] || 0) + 1; } return Object.entries(o).sort((a, b) => b[1] - a[1]).map(([key, n]) => ({ key, n })); };
  const slipDaily = dayList.map(d => ({ day: d, slips: 0, proposals: 0, upgrades: 0 }));
  const sdi = new Map(slipDaily.map(s => [s.day, s]));
  for (const r of slipWindow) { const s = sdi.get(r.ts.slice(0, 10)); if (!s) continue; if (isSlip(r)) s.slips++; else if (r.type === 'proposal') s.proposals++; else if (r.type === 'upgrade') s.upgrades++; }
  const weekIso = iso(now - 7 * DAY);
  const slips = {
    total: slipsAll.length, types: countBy(slipsAll.map(r => ({ ...r, type: r.type || 'slip' })), 'type'),
    window: slipWindow.filter(isSlip).length, week: slipsAll.filter(r => isSlip(r) && r.ts >= weekIso).length,
    categoriesWindow: countBy(slipWindow.filter(isSlip), 'category').slice(0, 15),
    caughtBy: countBy(slipWindow.filter(isSlip), 'caught_by'),
    proposalsUnruled: slipsAll.filter(r => r.type === 'proposal' && !r.ruled).length,
    daily: slipDaily,
    recent: slipsAll.slice(-40).reverse().map(r => ({ ts: r.ts, type: r.type || 'slip', category: r.category, qa: r.qa, caught_by: r.caught_by, evidence: String(r.evidence || '').slice(0, 260) })),
  };

  const evalFiles = [];
  for (const d of ['domain', 'lib', 'core', 'quest', '.claude/hooks']) walkFiles(path.join(CODE_ROOT, d), { skip: new Set(['node_modules']), collect: true, maxDepth: 3 }, { files: 0, bytes: 0, newest: 0, list: evalFiles });
  const evalList = evalFiles.map(f => rel(CODE_ROOT, f.p)).filter(p => /(^|\/)(eval[^/]*|[^/]+\.eval)\.js$/.test(p));
  const evals = {
    battery: battery ? { ts: battery.ts, total: battery.total, ageDays: Math.floor((now - Date.parse(battery.ts)) / DAY) } : null,
    fails: [...failSet].map(f => ({ eval: f, owner: evalFileOwner.get(f) || null })),
    quarantined: [...quarantine.entries()].map(([e, reason]) => ({ eval: e, reason, owner: evalFileOwner.get(e) || null })),
    onDisk: evalList.length,
    coverage: ['feature', 'package', 'legacy-hook', 'script', 'skill'].map(k => { const cs = byKind(k); return { kind: k, total: cs.length, withEval: cs.filter(c => c.evals && c.evals.length).length }; }),
  };

  const quests = [];
  for (const block of read(path.join(DATA_ROOT, 'quest', 'active.txt')).split(/\r?\n(?=qa=)/)) {
    if (!/^qa=/.test(block)) continue; const q = {};
    for (const line of block.split(/\r?\n/)) { const m = /^([\w-]+)=(.*)$/.exec(line); if (m && !(m[1] in q)) q[m[1]] = m[2].trim(); }
    quests.push({ qa: q.qa, status: q.status || '—', phase: q.phase || '—', type: q.ticket_type || '—', urusan: q.urusan || '—', env: q.env || '—', issue: (q.issue_one_liner || '').slice(0, 220), current: (q.current_phase || '').slice(0, 200), branch: q.branch || '', start: q.quest_start || q.assigned_to_me || '' });
  }

  // monitoring layer: turns (context per turn) + goal-lens + watches
  const turnSeen = new Set(); const turns = [];
  for (const r of roots) for (const e of listDir(path.join(r, 'system', 'telemetry'))) {
    if (!/^turns.*\.jsonl$/.test(e.name)) continue;
    const p = path.join(r, 'system', 'telemetry', e.name); const rows = readJsonl(p);
    sources.push({ kind: 'turn ledger', root: rootLabel(r), file: rel(r, p), rows: rows.length, bytes: stat(p).size, first: (rows[0] && rows[0].closed_ts) || null, last: rows.length ? rows[rows.length - 1].closed_ts : null, note: samePath(r, DATA_ROOT) ? 'live' : 'worktree-only' });
    for (const t of rows) { const k = t.turn_id || (t.closed_ts + '|' + t.session_id); if (turnSeen.has(k)) continue; turnSeen.add(k); if (typeof t.closed_ts === 'string' && t.closed_ts >= sinceIso) turns.push(t); }
  }
  for (const [label, relPath] of [['slip ledger', 'system/slips.jsonl'], ['component registry', 'system/registry.jsonl'], ['eval battery', 'system/telemetry/eval-battery.jsonl'], ['skill invocations', 'domain/skill-invocation-log/log.jsonl'], ['quest state', 'quest/active.txt'], ['worktree sweep log', '.claude/state/worktree-cleanup-log.jsonl'], ['observatory log', 'domain/observatory/log.jsonl']]) {
    const p = path.join(DATA_ROOT, relPath); const s = stat(p);
    sources.push({ kind: label, root: 'main', file: relPath, rows: s ? (relPath.endsWith('.jsonl') ? readJsonl(p).length : read(p).split('\n').length) : 0, bytes: s ? s.size : 0, first: null, last: s ? iso(s.mtimeMs) : null, note: s ? 'last write = file modified time' : 'missing on main' });
  }
  const tDaily = dayList.map(d => ({ day: d, turns: 0, hookMs: 0, tools: 0, out: 0, reask: 0 }));
  const tdi = new Map(tDaily.map(x => [x.day, x]));
  const phaseCost = new Map();
  for (const t of turns) {
    const x = tdi.get(t.closed_ts.slice(0, 10)); if (x) { x.turns++; x.hookMs += t.hook_ms || 0; x.tools += t.tool_calls || 0; x.out += (t.tokens && t.tokens.out) || 0; if (t.user_signal === 'reask') x.reask++; }
    const k = (t.qa || '—') + ' · ' + (t.phase || '—'); const s = phaseCost.get(k) || { key: k, turns: 0, tools: 0, hookMs: 0, blocks: 0, reask: 0 };
    s.turns++; s.tools += t.tool_calls || 0; s.hookMs += t.hook_ms || 0; s.blocks += (t.blocks || []).length; if (t.user_signal === 'reask') s.reask++; phaseCost.set(k, s);
  }
  const goals = [];
  for (const d of listDir(path.join(CODE_ROOT, 'domain'))) {
    if (!d.isDirectory()) continue;
    const rows = unionJsonl('domain/' + d.name + '/goal-log.jsonl', roots).filter(r => typeof r.ts === 'string' && r.ts >= sinceIso); if (!rows.length) continue;
    const met = rows.filter(r => r.met === 'y').length; const gapC = {}; for (const r of rows) if (r.gap) gapC[r.gap] = (gapC[r.gap] || 0) + 1;
    const top = Object.entries(gapC).sort((a, b) => b[1] - a[1])[0];
    goals.push({ feature: d.name, rows: rows.length, met, rate: Math.round(100 * met / rows.length), topGap: top ? top[0].slice(0, 200) + ' ×' + top[1] : '' });
  }
  const wl = []; for (const e of listDir(path.join(DATA_ROOT, 'system'))) if (/^claude-md-watchlist.*\.jsonl$/.test(e.name)) wl.push(...readJsonl(path.join(DATA_ROOT, 'system', e.name)));
  const wst = {}; for (const r of wl) { if (r.kind === 'watch') wst[r.id] = { id: r.id, target: r.target, observe: r.observe, left: r.sessions_left, done: false }; else if (r.kind === 'tick' && wst[r.id]) wst[r.id].left = r.sessions_left; else if (r.kind === 'resolve' && wst[r.id]) wst[r.id].done = true; }
  const watches = Object.values(wst);
  const sum = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0);
  const monitoring = {
    turns: turns.length, sessions: new Set(turns.map(t => t.session_id)).size,
    signals: countBy(turns, 'user_signal'),
    toolCalls: sum(turns, t => t.tool_calls), hookMs: sum(turns, t => t.hook_ms),
    tokens: { in: sum(turns, t => t.tokens && t.tokens.in), out: sum(turns, t => t.tokens && t.tokens.out), cacheRead: sum(turns, t => t.tokens && t.tokens.cache_read), cacheCreate: sum(turns, t => t.tokens && t.tokens.cache_create) },
    daily: tDaily, phaseCost: [...phaseCost.values()].sort((a, b) => b.turns - a.turns).slice(0, 25),
    heaviest: turns.slice().sort((a, b) => (b.hook_ms || 0) - (a.hook_ms || 0)).slice(0, 8).map(t => ({ turn: t.turn_id, qa: t.qa, phase: t.phase, hookS: Math.round((t.hook_ms || 0) / 1000), tools: t.tool_calls, prompt: String(t.prompt_head || '').slice(0, 90) })),
    goals: goals.sort((a, b) => a.rate - b.rate), goalPending: readJsonl(path.join(DATA_ROOT, 'domain', 'turn-ledger', 'goal-lens-pending.jsonl')).length,
    watches: { total: watches.length, open: watches.filter(w => !w.done).length, overdue: watches.filter(w => !w.done && w.left <= 0) },
  };
  lap('ledgers+monitoring');

  // runtime tables
  const hookRows = [...perHook.entries()].map(([hook, h]) => ({ hook, events: [...h.events], runs: h.runs, fired: h.fired, blocks: h.blocks, errs: h.errs, timeouts: h.tmo, totalS: Math.round(h.ms / 1000), avgMs: h.runs ? Math.round(h.ms / h.runs) : 0 }));
  const registeredKeys = new Set([...reg.keys()].filter(r => r.endsWith('.js')).map(r => norm(path.basename(r, '.js'))));
  const bootMs = hookRows.filter(h => h.events.includes('SessionStart')).reduce((a, h) => a + h.totalS * 1000, 0);
  const totalBoots = [...daily.values()].reduce((a, d) => a + d.boots, 0);
  const verdictByKey = new Map(); for (const c of components) for (const h of (c.hooks || [])) verdictByKey.set(h.file, c.verdict);
  for (const c of components) if (c.kind === 'legacy-hook' || c.kind === 'bundle') verdictByKey.set(c.path, c.verdict);
  const runtime = {
    lanes: EVENTS.filter(e => lanes[e]).map(e => ({ event: e, groups: lanes[e].map(g => ({ matcher: g.matcher, entries: g.entries.map(en => {
      const key = en.mode === 'bundle' ? null : norm(path.basename(en.rel, '.js')); const h = key ? perHook.get(key) : null;
      const kids = en.mode === 'bundle' ? (en.children || []).map(ch => { const k = norm(path.basename(ch, '.js')); const hh = perHook.get(k); return { rel: ch, key: k, runs: hh ? hh.runs : 0, avgMs: hh && hh.runs ? Math.round(hh.ms / hh.runs) : 0, verdict: verdictByKey.get(ch) || null }; }) : undefined;
      return { rel: en.rel, mode: en.mode, bundle: en.bundle, key, exists: exists(path.join(CODE_ROOT, en.rel)), runs: h ? h.runs : 0, avgMs: h && h.runs ? Math.round(h.ms / h.runs) : 0, blocks: h ? h.blocks : 0, verdict: verdictByKey.get(en.rel) || null, children: kids };
    }) })) })),
    daily: [...daily.values()],
    hooks: hookRows,
    slowest: hookRows.slice().sort((a, b) => b.totalS - a.totalS).slice(0, 15),
    blockers: hookRows.filter(h => h.blocks > 0).sort((a, b) => b.blocks - a.blocks).slice(0, 15),
    errors: hookRows.filter(h => h.errs > 0).sort((a, b) => b.errs - a.errs),
    unregisteredFiring: hookRows.filter(h => !registeredKeys.has(h.hook) && !['forge', '?', 'spawn-telemetry', 'dispatch-hooks'].includes(h.hook)).map(h => ({ hook: h.hook, runs: h.runs })),
    boot: { boots: totalBoots, avgS: totalBoots ? Math.round(bootMs / 1000 / totalBoots) : 0 },
    skillUse: [...skillUse.entries()].map(([skill, v]) => ({ skill, total: v.n, window: v.n30, last: v.last || null })).sort((a, b) => b.window - a.window || b.total - a.total),
    pluginSkillUse,
  };

  // ── 11. KPIs ──
  const kinds = {}; for (const c of components) { const k = kinds[c.kind] || (kinds[c.kind] = { kind: c.kind, total: 0, healthy: 0, gaps: 0, silent: 0, unregistered: 0, failing: 0, ghost: 0, retired: 0 }); k.total++; k[c.verdict]++; }
  const verdictCount = v => components.filter(c => c.verdict === v).length;
  const runtimeKinds = components.filter(c => ['feature', 'legacy-hook', 'bundle'].includes(c.kind));
  const judged = components.filter(c => !c.info);
  const totals = [...daily.values()].reduce((a, d) => ({ runs: a.runs + d.runs, blocks: a.blocks + d.blocks, ms: a.ms + d.ms, errs: a.errs + d.errs }), { runs: 0, blocks: 0, ms: 0, errs: 0 });
  const codeKinds = ['feature', 'package', 'legacy-hook', 'script'];
  const kpis = {
    components: components.length, judged: judged.length,
    healthy: judged.filter(c => c.verdict === 'healthy').length,
    healthPct: judged.length ? Math.round(100 * judged.filter(c => c.verdict === 'healthy' || c.verdict === 'retired').length / judged.length) : 0,
    ghosts: verdictCount('ghost'), failing: verdictCount('failing'), unregistered: verdictCount('unregistered'), silent: verdictCount('silent'), gaps: verdictCount('gaps'),
    hooksRegistered: runtimeKinds.filter(c => c.registration).length,
    hooksLive: runtimeKinds.filter(c => c.registration && c.runtime && c.runtime.runs > 0).length,
    runs: totals.runs, blocks: totals.blocks, errors: totals.errs, hookHours: +(totals.ms / 3600000).toFixed(1),
    runsSpark: [...daily.values()].map(d => d.runs), blocksSpark: [...daily.values()].map(d => d.blocks),
    evalCoverage: Math.round(100 * components.filter(c => codeKinds.includes(c.kind) && c.evals.length).length / Math.max(1, components.filter(c => codeKinds.includes(c.kind)).length)),
    evalFails: failSet.size, evalAgeDays: evals.battery ? evals.battery.ageDays : null,
    slipsWeek: slips.week, slipsWindow: slips.window, proposalsUnruled: slips.proposalsUnruled,
    questsOpen: quests.filter(q => ['active', 'hold', 'blocked', 'delegated'].includes(q.status)).length,
    purposeDeclared: components.filter(c => PURPOSE_KINDS.includes(c.kind) && c.purpose).length, purposeTotal: components.filter(c => PURPOSE_KINDS.includes(c.kind)).length,
    strays: strays.total, staleWorktrees: stale.folders.length, staleSafe: stale.folders.filter(f => f.verdict === 'safe').length, staleKeep: stale.folders.filter(f => f.verdict === 'keep').length,
  };

  const snapshot = {
    meta: { generated: iso(Date.now()), buildMs: 0, windowDays: days, days: dayList, codeRoot: CODE_ROOT, dataRoot: DATA_ROOT, roots: roots.map(rootLabel), git: null, version: 2, project: 'Lapis Lazuli' },
    kpis, kinds: Object.values(kinds).sort((a, b) => b.total - a.total), components, runtime, monitoring, slips, evals, quests, memory, strays, sources, audit: null,
  };
  kpis.purposePct = kpis.purposeTotal ? Math.round(100 * kpis.purposeDeclared / kpis.purposeTotal) : 0;
  lap('runtime+kpis');
  snapshot.goals = systemGoals();
  snapshot.findings = findingsFor(snapshot);
  lap('findings');
  if (opts.audit) snapshot.audit = audit();
  snapshot.meta.timings = timings;
  snapshot.meta.buildMs = Date.now() - t0;
  if (!process.env.OBSERVATORY_NO_LOG) {
    try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, JSON.stringify({ ts: snapshot.meta.generated, action: 'snapshot', by: opts.by || 'cli', ms: snapshot.meta.buildMs, days, components: components.length, healthPct: kpis.healthPct, strays: strays.total }) + '\n'); } catch (_) {}
  }
  return snapshot;
}

// ── 12. findings: every issue class as FACT (mechanical, with evidence) → CONTEXT (what it means)
//        → JUDGEMENT (verdict + justification + action + who decides), tied to the system goals ──
// The rules below are Ruri's standing judgement, versioned in code. Case-by-case judgement from a real
// investigation goes to domain/observatory/judgements.jsonl (--judge) and is joined here; a note turns
// STALE when the finding's evidence set changes, so an old explanation never masks a new problem.
const PURPOSE_KINDS = ['feature', 'package', 'legacy-hook', 'script', 'skill', 'bundle'];
const SEVERITIES = ['critical', 'serious', 'warning', 'info'];
const JUDGEMENTS = process.env.OBSERVATORY_JUDGEMENTS || path.join(CODE_ROOT, 'domain', 'observatory', 'judgements.jsonl');
const sig = keys => String(cyrb53([...keys].map(String).sort().join('\n')));
function systemGoals() {
  const out = [];
  for (const m of read(path.join(CODE_ROOT, 'system', 'system-goals.md')).matchAll(/^\|\s*\*\*(G\d)\*\*\s*\|\s*\*\*([^*]+)\*\*/gm)) out.push({ id: m[1], title: m[2].trim() });
  return out;
}
function findingsFor(s) {
  const F = []; const W = s.meta.windowDays;
  const n = x => Number(x || 0).toLocaleString('en-US');
  const ev = (text, id, key) => ({ text, id: id || null, key: key || text });
  const byVerdict = v => s.components.filter(c => c.verdict === v);
  const keyOwner = new Map();
  for (const c of s.components) { if (c.kind === 'legacy-hook') keyOwner.set(c.name, c.id); for (const h of (c.hooks || [])) keyOwner.set(h.key, c.id); if (c.kind === 'feature' || c.kind === 'package') if (!keyOwner.has(c.name)) keyOwner.set(c.name, c.id); }
  const add = f => {
    f.signature = sig(f.keys || f.evidence.map(e => e.key));
    delete f.keys; f.components = [...new Set(f.components || f.evidence.map(e => e.id).filter(Boolean))];
    F.push(f);
  };
  const list = (arr, fmt) => arr.map(fmt);

  const ghosts = byVerdict('ghost');
  if (ghosts.length) add({ id: 'ghost-components', severity: 'critical', goals: ['G2'], tab: 'catalog', title: `${ghosts.length} registered hook path(s) point at a missing file`,
    fact: `settings.json registers ${ghosts.length} path(s) that do not exist on disk.`, evidence: list(ghosts, c => ev(`${c.path} (${((c.registration || {}).events || []).join(', ')})`, c.id, c.path)),
    context: 'A ghost registration runs nothing: the hook runtime logs target-missing and fails open, so the gate it names is silently off.',
    judgement: 'Broken wiring. Restore the file or remove the registration.', justification: 'Each path was checked with fs.existsSync against this checkout, and an eval re-derives the list from settings.json independently.',
    action: 'Restore from git history (git log --all -- <path>) or unregister through core/forge.js.', decide: 'ruri' });

  const b = s.evals.battery; const ownerId = p => { const c = s.components.find(x => x.path === p); return c ? c.id : null; };
  if (s.evals.fails.length) add({ id: 'eval-failing', severity: 'critical', goals: ['G1', 'G3'], tab: 'evals', title: `${s.evals.fails.length} eval(s) failed in the last battery run`,
    fact: `The eval battery of ${b ? b.ts.slice(0, 10) : '?'} ran ${b ? b.total : '?'} evals and ${s.evals.fails.length} failed.`,
    evidence: list(s.evals.fails, f => ev(`${f.eval}${f.owner ? '  (owner ' + f.owner + ')' : ''}`, ownerId(f.owner), f.eval)),
    context: b && b.ageDays > 7 ? `That run is ${b.ageDays} days old: some of these may be fixed since, and new failures may exist that it never saw.` : 'That run is recent.',
    judgement: 'These features have red behaviour pins, so they are unproven until the battery is green again.', justification: 'An eval is the only mechanical proof a feature still does what its fixtures pin; feature-census treats it as the audit trail.',
    action: 'Run node lib/eval-battery.js, then fix each red eval or quarantine it with a reason.', decide: 'ruri' });
  if (!b) add({ id: 'eval-battery-never', severity: 'warning', goals: ['G3'], tab: 'evals', title: 'The eval battery has never run', fact: 'system/telemetry/eval-battery.jsonl has no rows.', evidence: [ev('system/telemetry/eval-battery.jsonl')],
    context: 'No eval verdict on this dashboard is backed by a run.', judgement: 'Health of every eval-carrying feature is unknown.', justification: 'No battery row exists.', action: 'node lib/eval-battery.js', decide: 'ruri' });
  else if (b.ageDays > 7) add({ id: 'eval-battery-stale', severity: 'warning', goals: ['G3'], tab: 'evals', title: `The eval battery last ran ${b.ageDays} days ago`,
    fact: `The latest battery row is ${b.ts}.`, evidence: [ev('system/telemetry/eval-battery.jsonl (latest row ' + b.ts.slice(0, 10) + ')', null, 'battery')], keys: ['eval-battery-stale'],
    context: 'Every pass or fail shown here is as old as that run.', judgement: 'Stale proof: eval health is a claim about the past, not the present.', justification: `${b.ageDays} days is past the 7-day freshness this dashboard expects.`,
    action: 'node lib/eval-battery.js', decide: 'ruri' });
  if (s.evals.quarantined.length) add({ id: 'eval-quarantined', severity: 'info', goals: ['G3'], tab: 'evals', title: `${s.evals.quarantined.length} eval(s) are quarantined`,
    fact: `${s.evals.quarantined.length} evals are excluded from pass or fail, each with a written reason.`, evidence: list(s.evals.quarantined, q => ev(`${q.eval}: ${q.reason}`, ownerId(q.owner), q.eval)),
    context: 'Quarantine keeps the battery usable while a known problem waits.', judgement: 'Parked, not fixed. Each one needs a build or retire decision.', justification: 'The reasons come from the battery ledger itself.',
    action: 'Rule build or retire for each quarantined eval.', decide: 'miya' });

  const tel = s.sources.filter(x => x.kind === 'hook telemetry'); const dupRows = tel.reduce((a, x) => a + (x.duplicates || 0), 0); const allRows = tel.reduce((a, x) => a + (x.rows || 0), 0);
  if (dupRows) add({ id: 'telemetry-duplicates', severity: 'serious', goals: ['G2'], tab: 'sources', title: `${Math.round(100 * dupRows / allRows)}% of hook telemetry rows repeat another file`,
    fact: `${n(dupRows)} of ${n(allRows)} rows across ${tel.length} hook-fires files are copies of a row already present in another file.`,
    evidence: list(tel.filter(x => x.duplicates), x => ev(`${x.root}/${x.file}: ${n(x.duplicates)} repeated of ${n(x.rows)} rows`, null, x.root + '/' + x.file)),
    context: 'This dashboard counts each row once. lib/turn-report.js, lib/audit-briefing.js and lib/liveness-report.js read the same files and add them up.',
    judgement: 'The older monitoring numbers (gate yield, hook time, the audit screen) overstate activity. Trust this dashboard\'s counts over system/monitoring-dashboard.md until the readers are fixed.',
    justification: `Summed rows: ${n(allRows)}. Unique rows: ${n(allRows - dupRows)}. An eval recounts them independently on every run.`,
    action: 'De-duplicate the other readers, then find why the live file repeats rows from the archive and the other laptop.', decide: 'ruri' });

  const errs = s.runtime.errors || [];
  if (errs.length) { const E = errs.reduce((a, h) => a + h.errs, 0), T = errs.reduce((a, h) => a + (h.timeouts || 0), 0);
    add({ id: 'hook-errors', severity: 'serious', goals: ['G1', 'G5'], tab: 'runtime', title: `${errs.length} hooks failed ${n(E)} times in ${W} days`,
      fact: `${n(E)} hook runs ended in an error exit; ${n(T)} of them were timeouts (child-failed ETIMEDOUT).`,
      evidence: list(errs, h => ev(`${h.hook}: ${n(h.errs)} errors, ${n(h.timeouts || 0)} timeouts, ${n(h.runs)} runs`, keyOwner.get(h.hook), h.hook)),
      context: 'When the runtime kills a slow hook, the check it performs does not run for that turn, and the runtime fails open: nothing blocks, nothing is reported.',
      judgement: 'Silent coverage gaps. A gate that timed out did not protect that turn.', justification: `${n(T)} of ${n(E)} failures are timeouts, so slowness rather than crashes is the main cause.`,
      action: 'Speed up or re-time the hooks with the most timeouts first.', decide: 'ruri' }); }

  const hooks = s.runtime.hooks || [];
  const idle = hooks.filter(h => h.runs >= 20 && h.blocks === 0 && h.totalS >= 60).sort((a, b) => b.totalS - a.totalS);
  if (idle.length) add({ id: 'idle-expensive-gates', severity: 'warning', goals: ['G5'], tab: 'runtime', title: `${idle.length} hooks cost ${n(idle.reduce((a, h) => a + h.totalS, 0))} s in ${W} days and never blocked`,
    fact: `${idle.length} hooks ran at least 20 times, used at least 60 s in total, and blocked nothing.`, evidence: list(idle, h => ev(`${h.hook}: ${n(h.totalS)} s over ${n(h.runs)} runs, avg ${n(h.avgMs)} ms, 0 blocks`, keyOwner.get(h.hook), h.hook)),
    context: 'Advisory hooks inject text instead of blocking, so 0 blocks is normal for them; for a gate it means its rule never triggered in the window.',
    judgement: 'Review candidates, not deletions. Each should be checked against its goal before it is kept, redesigned or retired.', justification: 'Same REVIEW rule lib/turn-report.js uses: at least 20 runs, 0 blocks, at least 60 s.',
    action: 'Walk the list with each component\'s goal and goal-lens result; retire only with a named reason.', decide: 'miya' });

  if (s.runtime.boot && s.runtime.boot.avgS > 10) { const ss = hooks.filter(h => h.events.includes('SessionStart')).sort((a, b) => b.avgMs - a.avgMs);
    add({ id: 'boot-cost', severity: 'warning', goals: ['G5'], tab: 'runtime', title: `Each session start spends about ${s.runtime.boot.avgS} s in hooks`, keys: ['boot-cost'],
      fact: `${n(s.runtime.boot.boots)} session starts in ${W} days; SessionStart hooks average ${s.runtime.boot.avgS} s per start.`, evidence: list(ss, h => ev(`${h.hook}: avg ${n(h.avgMs)} ms`, keyOwner.get(h.hook), h.hook)),
      context: 'That wait happens before the first reply of every new or resumed session.', judgement: 'Too slow for something that runs on every start.', justification: 'lib/audit-briefing.js treats more than 10 s per boot as worth caching.',
      action: `Cache or defer the slowest SessionStart hooks, starting with ${ss.slice(0, 3).map(h => h.hook).join(', ')}.`, decide: 'ruri' }); }

  const silent = byVerdict('silent');
  if (silent.length) add({ id: 'silent-hooks', severity: 'warning', goals: ['G3'], tab: 'catalog', title: `${silent.length} registered hooks never ran in ${W} days`,
    fact: `${silent.length} registered, observable hooks have 0 telemetry rows in the window.`, evidence: list(silent, c => ev(`${c.path} (${(c.events || []).join(', ')})`, c.id, c.path)),
    context: 'Either the matcher never matched a real tool call, or the wiring is wrong.', judgement: 'Unproven: a gate that never runs protects nothing.', justification: '0 rows in de-duplicated telemetry across main and the registered worktrees.',
    action: 'Check each matcher against real tool names; fix or retire.', decide: 'ruri' });

  const unreg = byVerdict('unregistered');
  if (unreg.length) add({ id: 'unregistered-hooks', severity: 'serious', goals: ['G3'], tab: 'unmanaged', title: `${unreg.length} hook files are never run by settings.json`,
    fact: `${unreg.length} hook files exist on disk with no registration and no opt-out marker.`, evidence: list(unreg, c => ev(`${c.path}${c.unregisteredHooks && c.unregisteredHooks.length ? ': ' + c.unregisteredHooks.join(', ') : ''}`, c.id, c.path)),
    context: 'In the repo they look like live gates, but they never fire.', judgement: 'Misleading. Register them through core/forge.js or tombstone them.', justification: 'settings.json was parsed for direct, wrapped and bundled registrations; none point at these files.',
    action: 'Decide register or retire per file.', decide: 'ruri' });

  const off = s.components.filter(c => c.disabled || c.retired);
  if (off.length) add({ id: 'retired-components', severity: 'info', goals: ['G2'], tab: 'catalog', title: `${off.length} component(s) are retired or disabled but still on disk`,
    fact: `${off.filter(c => c.disabled).length} exit before doing any work (process.exit(0)); ${off.filter(c => c.retired && !c.disabled).length} are tombstoned or deliberately unregistered.`,
    evidence: list(off, c => ev(`${c.path}: ${c.disabled || c.retiredReason || 'retired'}`, c.id, c.path)),
    context: 'Each was switched off on purpose; the reason is written in the file or its README.', judgement: 'Intentional, not a fault. The protection they describe is off until someone turns it back on.', justification: 'The DISABLED, RETIRED or SUPERSEDED line quoted in the evidence records the decision.',
    action: 'None, unless a reason no longer holds; then re-enable through core/forge.js or delete with its tombstone.', decide: 'miya' });

  const noPurpose = s.components.filter(c => PURPOSE_KINDS.includes(c.kind) && !c.ghost && !c.retired && !c.disabled && !c.purpose);
  if (noPurpose.length) { const by = {}; for (const c of noPurpose) by[c.kind] = (by[c.kind] || 0) + 1;
    add({ id: 'purpose-missing', severity: 'warning', goals: ['G3'], tab: 'catalog', title: `${noPurpose.length} components do not declare their purpose`,
      fact: `${noPurpose.length} components have no goal: ${Object.entries(by).map(([k, v]) => v + ' ' + k).join(', ')}. Purpose is declared by ${s.kpis.purposePct}% of ${s.kpis.purposeTotal}.`,
      evidence: list(noPurpose, c => ev(`${c.kind}: ${c.path}`, c.id, c.path)),
      context: 'The Lapis Lazuli pillar is a goal in everything: a component is judged by whether it meets its goal (README goal:, script header goal:, skill description).',
      judgement: 'Without a stated goal these components cannot be judged met or unmet, so their health is unknown rather than good.', justification: 'Counted from the same fields core/forge.js writes at birth.',
      action: 'node lib/goal-backfill.js --draft, then promote 20 per session.', decide: 'ruri' }); }

  const gapTypes = {}; for (const c of s.components) if (c.kind !== 'memory' && !c.retired && !c.disabled) for (const g of (c.gaps || [])) if (g !== 'goal-less' && g !== 'no purpose declared') (gapTypes[g] = gapTypes[g] || []).push(c);   // memory stores and missing purpose have their own findings
  const gapComps = [...new Set(Object.values(gapTypes).flat())];
  if (gapComps.length) add({ id: 'census-gaps', severity: 'warning', goals: ['G3'], tab: 'catalog', title: `${gapComps.length} components have audit gaps`,
    fact: Object.entries(gapTypes).sort((a, b) => b[1].length - a[1].length).map(([g, cs]) => `${g}: ${cs.length}`).join(' · '),
    evidence: Object.entries(gapTypes).flatMap(([g, cs]) => cs.map(c => ev(`${g}: ${c.path}`, c.id, g + '|' + c.path))),
    context: 'lib/feature-census.js expects every Feature to carry an eval, a README with goal and retention, and a log, so it can be audited and observed.',
    judgement: 'Each gap is a place where the system cannot prove a component works, or cannot see it run.', justification: 'Same rules as system/feature-census.md; an eval checks the gaps match.',
    action: 'Fix the busiest components first: Catalog, filter Gaps, sort by Runs.', decide: 'ruri' });

  const wt = s.strays.staleWorktrees || []; const keep = wt.filter(w => w.verdict === 'keep'), safe = wt.filter(w => w.verdict === 'safe'), unchecked = wt.filter(w => w.verdict === 'unchecked');
  const gb = arr => { const m = arr.filter(w => w.bytes != null); return m.length ? ' (' + (m.reduce((a, w) => a + w.bytes, 0) / 1073741824).toFixed(1) + ' GB measured)' : ''; };
  const sweep = s.strays.staleSweep ? s.strays.staleSweep.ts.slice(0, 10) : 'never';
  if (keep.length) add({ id: 'worktrees-unsaved-work', severity: 'serious', goals: ['G2'], tab: 'unmanaged', title: `${keep.length} stale worktree folders hold work that is not on main`,
    fact: `${keep.length} folders under .claude/worktrees are unknown to git and contain files no git ref holds${gb(keep)}.`, evidence: list(keep, w => ev(`${w.name}: ${w.why}`, null, w.name)),
    context: 'No branch protects these files; they live only on this disk and in OneDrive. Many are old copies of quest/active.txt; some are never-committed Features.',
    judgement: 'At risk of silent loss. Salvage before anything deletes them.', justification: `Verdicts come from worktree-cleanup-boot.js's own sweep (${sweep}), which hashes every file against git.`,
    action: 'Run /worktree-retrieve to salvage real work, then delete the folders.', decide: 'ruri' });
  if (safe.length) add({ id: 'worktrees-duplicates', severity: 'warning', goals: ['G5'], tab: 'unmanaged', title: `${safe.length} stale worktree folders are duplicates of main`,
    fact: `${safe.length} folders hold nothing that main or a git ref does not already hold${gb(safe)}.`, evidence: list(safe, w => ev(w.name, null, w.name)),
    context: 'They cost disk space and OneDrive sync time only.', judgement: 'Safe to delete.', justification: `Proven by the cleanup sweep of ${sweep}.`,
    action: 'Delete them (needs your nod).', decide: 'miya' });
  if (unchecked.length) add({ id: 'worktrees-unchecked', severity: 'info', goals: ['G2'], tab: 'unmanaged', title: `${unchecked.length} stale worktree folders were not in the last sweep`,
    fact: `${unchecked.length} folders appeared after the sweep of ${sweep}.`, evidence: list(unchecked, w => ev(w.name, null, w.name)),
    context: 'Their content has not been compared with git.', judgement: 'Unknown until swept.', justification: 'Absent from the latest worktree-cleanup-log row.', action: 'Dry-run the sweep again.', decide: 'ruri' });

  const st = s.strays;
  if (st.conflictCopies.length) add({ id: 'conflict-copies', severity: 'warning', goals: ['G2'], tab: 'unmanaged', title: `${st.conflictCopies.length} OneDrive conflict copies are on disk`,
    fact: `${st.conflictCopies.length} files or folders carry a machine-name suffix.`, evidence: list(st.conflictCopies, p => ev(p)),
    context: 'OneDrive forks a file when two laptops write it; a stale copy once overwrote a canonical file and was committed (commit 25a0379c).', judgement: 'Hazard: each copy can clobber or be mistaken for the real file.', justification: 'Same machine-suffix rule as system-audit.js CHECK 9.',
    action: 'Diff each against its canonical sibling, merge anything newer, then delete.', decide: 'ruri' });
  if (st.pendingOrOrphan.length) add({ id: 'root-entries-unruled', severity: 'info', goals: ['G5'], tab: 'unmanaged', title: `${st.pendingOrOrphan.length} root entries are not canonical`,
    fact: `${st.pendingOrOrphan.filter(r => r.class === 'pending-nod').length} wait for your ruling in system/FOLDER-STRUCTURE.md; ${st.pendingOrOrphan.filter(r => r.class === 'orphan').length} are not listed at all.`,
    evidence: list(st.pendingOrOrphan, r => ev(`${r.name} (${r.class}, ${r.files == null ? '?' : r.files} files)`, null, r.name)),
    context: 'The root allow-list says what every top-level entry owns.', judgement: 'Clutter that makes the project harder to read.', justification: 'Compared against the JSON allow-list in system/FOLDER-STRUCTURE.md.',
    action: 'Rule the pending table in system/FOLDER-STRUCTURE.md.', decide: 'miya' });
  if (st.unreferencedScripts.length) add({ id: 'unreferenced-scripts', severity: 'info', goals: ['G3'], tab: 'unmanaged', title: `${st.unreferencedScripts.length} scripts are referenced by nothing`,
    fact: `${st.unreferencedScripts.length} scripts in core/, lib/, quest/ or system/ are named by no other code or doc.`, evidence: list(st.unreferencedScripts, x => ev(x.path, ownerId(x.path), x.path)),
    context: 'A script can still be run by hand, but nothing tells a future session it exists.', judgement: 'Retirement candidates, or missing wiring.', justification: 'Reference scan over .claude, domain, lib, core, quest, system, Feature and the root docs.',
    action: 'Wire each into the skill or doc that should call it, or tombstone it.', decide: 'ruri' });
  if (st.looseFiles.length) add({ id: 'loose-files', severity: 'info', goals: ['G5'], tab: 'unmanaged', title: `${st.looseFiles.length} loose files sit inside feature folders`,
    fact: 'Audit dumps, backups and scratch files live next to components.', evidence: list(st.looseFiles, x => ev(x.path)), context: 'They are not part of any component.', judgement: 'Clutter; move findings into the component doc and delete the rest.', justification: 'Name patterns: leading underscore, AUDIT-, -raw., .bak, .tmp, copy.', action: 'Review and delete.', decide: 'ruri' });
  if (st.evalOnlyPackages.length) add({ id: 'eval-only-packages', severity: 'warning', goals: ['G3'], tab: 'unmanaged', title: `${st.evalOnlyPackages.length} feature folders hold an eval but no component`,
    fact: 'The eval was written, the thing it tests was not.', evidence: list(st.evalOnlyPackages, p => ev(p, ownerId(p), p)), context: 'Usually a feature that was started and never built.', judgement: 'Unfinished: build or retire.', justification: 'The folder has only eval, README, marker or log files.', action: 'Build or retire each.', decide: 'miya' });

  const mem = s.memory; const memComp = id => { const c = s.components.find(x => x.kind === 'memory' && x.path === id); return c ? c.id : null; };
  if (mem.autoMemory.brokenLinks.length || mem.autoMemory.unindexed.length) add({ id: 'memory-index', severity: 'warning', goals: ['G6', 'G2'], tab: 'memory', title: 'The memory index is out of sync',
    fact: `MEMORY.md has ${mem.autoMemory.brokenLinks.length} broken link(s); ${mem.autoMemory.unindexed.length} memory file(s) are not in it.`,
    evidence: [...mem.autoMemory.brokenLinks.map(f => ev('broken link: ' + f, memComp('.claude/auto-memory'), 'b|' + f)), ...mem.autoMemory.unindexed.map(f => ev('not indexed: ' + f, memComp('.claude/auto-memory'), 'u|' + f))],
    context: 'MEMORY.md is what loads at the start of every session; a memory it does not list is effectively forgotten.', judgement: 'Lost recall: unindexed memories never reach a session.', justification: 'Every .md in auto-memory compared with the links in MEMORY.md.',
    action: 'Add an index line for each unindexed memory; fix or remove broken links.', decide: 'ruri' });
  if (!mem.diary.hasToday) add({ id: 'diary-missing', severity: 'info', goals: ['G6'], tab: 'memory', title: `No diary entry for ${mem.diary.today} yet`, keys: ['diary-' + mem.diary.today],
    fact: `The latest diary is ${mem.diary.latest}.`, evidence: [ev('daily-diary/current/' + mem.diary.today + '.md missing', memComp('daily-diary'), 'diary')],
    context: 'Domain Expansion writes the diary at session end.', judgement: 'Normal until the day\'s last session closes.', justification: 'File absent for the local date.', action: 'Written at the next Domain Expansion.', decide: 'ruri' });
  const sess = mem.main.find(f => f.name === 'current-session.md');
  if (sess && sess.lines > mem.sessionCap) add({ id: 'session-over-cap', severity: 'warning', goals: ['G5'], tab: 'memory', title: `Session memory is ${sess.lines} lines, over the ${mem.sessionCap}-line cap`,
    fact: `main/current-session.md has ${sess.lines} lines.`, evidence: [ev('main/current-session.md', memComp('main/current-session.md'))], context: 'Boot reads it; past the cap the read truncates.', judgement: 'The session briefing will be built on a partial file.', justification: 'main/session-format.md sets the cap.', action: 'node core/session-trim.js --apply', decide: 'ruri' });

  const m = s.monitoring;
  if (m.watches.overdue.length) add({ id: 'watches-overdue', severity: 'warning', goals: ['G3'], tab: 'monitoring', title: `${m.watches.overdue.length} watch(es) are overdue`,
    fact: 'Watches whose session count ran out without a resolve row.', evidence: list(m.watches.overdue, w => ev(`${w.id}: ${w.target}`, null, w.id)), context: 'A watch is a promise to check a change after N sessions.', judgement: 'Broken promises: the change was never verified.', justification: 'sessions_left at or below 0 in the watchlist ledger.', action: 'node lib/watch.js resolve <id> ok|anomaly for each.', decide: 'ruri' });
  const low = (m.goals || []).filter(g => g.rows >= 3 && g.rate < 70);
  if (low.length) add({ id: 'goal-lens-low', severity: 'warning', goals: ['G3'], tab: 'monitoring', title: `${low.length} feature(s) met their goal less than 70% of the time`,
    fact: 'Goal-lens rows judge each run against the feature\'s own goal.', evidence: list(low, g => ev(`${g.feature}: met ${g.rate}% of ${g.rows} runs${g.topGap ? '; top gap: ' + g.topGap : ''}`, keyOwner.get(g.feature), g.feature)),
    context: 'This is the purpose pillar measured: did the feature do what it exists for.', judgement: 'Underperforming against its own goal; redesign before adding rules.', justification: 'domain/*/goal-log.jsonl in the window.', action: 'Redesign the top gap for each.', decide: 'ruri' });
  const reask = (m.signals.find(x => x.key === 'reask') || { n: 0 }).n, corr = (m.signals.find(x => x.key === 'correction') || { n: 0 }).n;
  if (reask + corr) add({ id: 'user-reasks', severity: reask + corr >= 3 ? 'warning' : 'info', goals: ['G5'], tab: 'monitoring', title: `You re-asked or corrected ${reask + corr} time(s) in ${W} days`,
    fact: `${reask} re-asks and ${corr} corrections across ${n(m.turns)} logged turns.`, evidence: list(m.phaseCost.filter(p => p.reask), p => ev(`${p.key}: ${p.reask} re-ask(s) in ${p.turns} turns`, null, p.key)),
    context: 'The turn ledger classifies your next message after each reply.', judgement: 'Each re-ask is a reply that missed what you asked.', justification: 'user_signal in system/telemetry/turns*.jsonl.', action: 'Read the matching slips in the Mistakes tab for the cause.', decide: 'ruri' });
  if (s.slips.week) { const top = s.slips.categoriesWindow[0];
    add({ id: 'slips-recent', severity: 'info', goals: ['G2', 'G3'], tab: 'mistakes', title: `${s.slips.week} mistakes logged in the last 7 days`, keys: s.slips.categoriesWindow.map(x => x.key),
      fact: `Top categories in ${W} days: ${s.slips.categoriesWindow.slice(0, 5).map(x => x.key + ' ' + x.n).join(', ')}.`,
      evidence: list(s.slips.recent.filter(r => r.type === 'slip').slice(0, 15), r => ev(`${r.ts.slice(0, 10)} ${r.category}: ${r.evidence.slice(0, 140)}`, null, r.ts)),
      context: 'Slips are mistakes written to system/slips.jsonl, caught by you, by me or by a gate.', judgement: top ? `The most repeated mistake is ${top.key} (${top.n}); a repeat means its guard is missing or weak.` : 'No category repeats.',
      justification: 'Counted from the slip ledger.', action: top ? `Check whether ${top.key} has a gate; if not, build one through auto-skill-on-mistake.` : 'None.', decide: 'ruri' }); }
  if (s.kpis.proposalsUnruled) add({ id: 'proposals-unruled', severity: 'info', goals: ['G3'], tab: 'mistakes', title: `${n(s.kpis.proposalsUnruled)} improvement proposals wait for a ruling`, keys: ['proposals-unruled'],
    fact: 'Rows of type proposal in system/slips.jsonl with no ruled field.', evidence: [ev('system/slips.jsonl (type = proposal, ruled missing)', null, 'proposals')], context: 'Each Domain Expansion adds proposals.', judgement: 'The backlog grows faster than it is ruled, so most ideas are noise.', justification: 'Count of unruled proposal rows.', action: 'Rule the 10 oldest each session, or bulk-close the stale ones.', decide: 'miya' });
  if ((s.runtime.unregisteredFiring || []).length) add({ id: 'telemetry-orphan-keys', severity: 'info', goals: ['G2'], tab: 'runtime', title: `${s.runtime.unregisteredFiring.length} telemetry keys match no registered hook`,
    fact: 'Hook names in the window\'s telemetry with no settings.json registration.', evidence: list(s.runtime.unregisteredFiring, h => ev(`${h.hook}: ${n(h.runs)} runs`, null, h.hook)), context: 'Hooks renamed, bundled or retired during the window.', judgement: 'History, not a fault.', justification: 'Telemetry keys compared with registered paths.', action: 'None.', decide: 'ruri' });
  const g = (s.meta.git || []).find(x => x.root === 'main');
  if (g && g.behindMain > 0) add({ id: 'main-checkout-behind', severity: 'info', goals: ['G5'], tab: 'sources', title: `The main folder is ${g.behindMain} commit(s) behind origin/main`, keys: ['main-behind'],
    fact: `main is at ${g.head} with ${g.dirty} changed tracked file(s); origin/main has ${g.behindMain} newer commit(s).`, evidence: [ev(`main @ ${g.head}`, null, 'main')],
    context: 'Sessions in worktrees push to origin/main, but the main folder is not pulled; its hooks and rules are older than what is committed.', judgement: 'Anything opened or run from the main folder uses stale rules.', justification: 'git rev-list --left-right --count origin/main...HEAD in the main folder.',
    action: 'git pull --ff-only in the main folder when no session uses it.', decide: 'miya' });

  // join Ruri's recorded judgements (findings and components); stale when the evidence set changed
  const J = readJsonl(JUDGEMENTS);
  for (const f of F) f.notes = J.filter(j => j.id === f.id).map(j => ({ ...j, stale: !!j.signature && j.signature !== f.signature }));
  for (const c of s.components) { const cs = sig([c.verdict, ...(c.gaps || [])]); c.signature = cs; const notes = J.filter(j => j.id === 'component:' + c.id); c.notes = notes.length ? notes.map(j => ({ ...j, stale: !!j.signature && j.signature !== cs })) : undefined; }
  F.sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) || b.evidence.length - a.evidence.length);
  s.kpis.findings = Object.fromEntries(SEVERITIES.map(v => [v, F.filter(f => f.severity === v).length]));
  return F;
}

function findingText(f, full) {
  const L = [];
  L.push(`[${f.severity.toUpperCase()}] ${f.id} · ${f.title} · goals ${f.goals.join(' ')} · decide: ${f.decide}`);
  L.push(`   Fact: ${f.fact}`);
  const items = full ? f.evidence : f.evidence.slice(0, 8);
  L.push(`   Evidence (${f.evidence.length}): ${items.map(e => e.text).join(' · ')}${f.evidence.length > items.length ? ` · (+${f.evidence.length - items.length} more: node lib/observatory.js --finding ${f.id})` : ''}`);
  L.push(`   Context: ${f.context}`);
  L.push(`   Judgement: ${f.judgement} Because: ${f.justification}`);
  L.push(`   Action: ${f.action}`);
  for (const nt of f.notes || []) L.push(`   Note (${nt.by || 'ruri'} ${String(nt.ts).slice(0, 10)}${nt.stale ? ', STALE: evidence changed since' : ''}): ${[nt.context, nt.judgement, nt.justification && 'Because: ' + nt.justification, nt.action && 'Action: ' + nt.action].filter(Boolean).join(' ')}`);
  return L.join('\n');
}
function brief(s, full) {
  const k = s.kpis; const head = `Lapis Lazuli Observatory brief · ${new Date(s.meta.generated).toLocaleString()} · ${k.components} components · ${k.healthPct}% healthy · purpose declared ${k.purposePct}% · findings ${SEVERITIES.map(v => v + ' ' + k.findings[v]).join(', ')} · window ${s.meta.windowDays} d`;
  return [head, 'One finding in full: node lib/observatory.js --finding <id>', '', ...s.findings.map((f, i) => `${i + 1}. ${findingText(f, full)}`)].join('\n');
}
function judge(id, fields, s) {
  const f = s.findings.find(x => x.id === id); const c = id.startsWith('component:') ? s.components.find(x => 'component:' + x.id === id) : null;
  if (!f && !c) throw new Error(`no finding or component "${id}" (finding ids: ${s.findings.map(x => x.id).join(', ')})`);
  if (!fields.judgement || !fields.justification) throw new Error('--judgement and --justification are both required');
  const row = { ts: new Date().toISOString(), id, by: fields.by || 'ruri', context: fields.context || '', judgement: fields.judgement, justification: fields.justification, action: fields.action || '', signature: f ? f.signature : c.signature };
  fs.mkdirSync(path.dirname(JUDGEMENTS), { recursive: true }); fs.appendFileSync(JUDGEMENTS, JSON.stringify(row) + '\n');
  return row;
}

function summary(s) {
  const k = s.kpis;
  return `observatory: ${k.components} components (${s.kinds.map(x => x.kind + ' ' + x.total).join(' · ')}) · ${k.healthPct}% healthy · ${k.hooksLive}/${k.hooksRegistered} registered hooks fired in ${s.meta.windowDays} d · ${k.strays} stray items (${k.staleWorktrees} stale worktrees) · built in ${s.meta.buildMs} ms`;
}

if (require.main === module) {
  const argv = process.argv;
  const val = name => { const i = argv.indexOf('--' + name); return i > 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined; };
  const s = build({ days: val('days') || 30, audit: argv.includes('--audit'), by: 'cli' });
  const wantsGit = argv.includes('--git') || argv.includes('--brief') || argv.includes('--finding');
  const finish = () => {
    if (wantsGit) s.findings = findingsFor(s);                     // re-derive with git state attached
    if (argv.includes('--judge')) {
      try { const row = judge(val('judge') || '', { context: val('context'), judgement: val('judgement'), justification: val('justification'), action: val('action'), by: val('by') }, s); console.log('judgement recorded: ' + row.id + ' @ ' + row.ts); }
      catch (e) { console.error('observatory --judge: ' + e.message); process.exit(2); }
    } else if (argv.includes('--finding')) {
      const f = s.findings.find(x => x.id === val('finding'));
      if (!f) { console.error('no finding "' + val('finding') + '". Current ids: ' + s.findings.map(x => x.id).join(', ')); process.exit(2); }
      console.log(findingText(f, true));
    } else if (argv.includes('--brief')) console.log(brief(s, argv.includes('--full')));
    else if (argv.includes('--json')) process.stdout.write(JSON.stringify(s));
    else console.log(summary(s));
  };
  if (wantsGit) gitStates().then(g => { s.meta.git = g; finish(); }); else finish();
}
module.exports = { build, summary, audit, gitStates, staleSizes, findingsFor, brief, findingText, CODE_ROOT, DATA_ROOT };