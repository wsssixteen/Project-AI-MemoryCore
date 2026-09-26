#!/usr/bin/env node
// observatory — born via forge
// symptom: 2026-09-27 miya: prove monitoring and observability visually for every feature; no single visual screen existed and worktree telemetry was invisible to every report
// goal: one screen shows every component with its registration, eval, liveness and gaps, plus the stray files no component owns
// goal_signal: snapshot component count equals the disk inventory and every component kind has rows
// retention: regenerate
//
// The data layer of the Observatory app (domain/observatory/). Builds ONE read-only snapshot:
// every component + registration / eval / liveness / gaps, the ledgers (slips, evals, quests,
// turns, memory) and the stray files no component owns. It consumes the existing generators
// (feature-census collect() for gap verdicts, audit-briefing gather() for the four-block audit)
// instead of re-deriving their rules.
//
//   node lib/observatory.js                  one-line summary
//   node lib/observatory.js --json           full snapshot to stdout
//   node lib/observatory.js --days 7         liveness window (default 30, max 90)
//   node lib/observatory.js --no-audit       skip the audit-briefing block (faster)
//
// Roots: CODE_ROOT = this checkout (inventory) · DATA_ROOT = the main repo (live ledgers) ·
// every .claude/worktrees/* root (its own untracked telemetry — no other report reads it).
// Writes only domain/observatory/log.jsonl (one row per snapshot; OBSERVATORY_NO_LOG=1 skips).
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

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
const dayOf = t => new Date(t).toISOString().slice(0, 10);
const norm = h => String(h).replace(/\.(check|gate|discipline|trigger)?\.?hook$/, '');
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

function worktreeRoots() {
  const out = [];
  for (const d of listDir(path.join(DATA_ROOT, '.claude', 'worktrees'))) {
    const p = path.join(DATA_ROOT, '.claude', 'worktrees', d.name);
    if (d.isDirectory() && exists(path.join(p, 'system'))) out.push(p);
  }
  return out;
}
function rootLabel(r) { return r === DATA_ROOT ? 'main' : 'worktree:' + path.basename(r); }
// A ledger appended in several checkouts: union every copy, dedupe identical lines.
function unionJsonl(relPath, roots) {
  const seen = new Set(); const rows = [];
  for (const r of roots) {
    const p = path.join(r, relPath);
    for (const row of readJsonl(p)) { const k = JSON.stringify(row); if (seen.has(k)) continue; seen.add(k); rows.push(row); }
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
function git(root, args) {
  try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (_) { return null; }
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
        const paths = [...cmd.matchAll(/"?((?:\$\{CLAUDE_PROJECT_DIR\}|[A-Za-z]:)?[\\/]*[^"\s]+\.(?:js|json))"?/g)].map(m => relFromCommandPath(m[1]));
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

// ── 2. telemetry: hook-fires*.jsonl across every root, aggregated per file per day per hook ──
const fireCache = new Map();
function aggregateFireFile(p) {
  const s = stat(p); if (!s) return null;
  const c = fireCache.get(p);
  if (c && c.m === s.mtimeMs && c.z === s.size) return c.agg;
  const agg = { rows: 0, noTs: 0, first: 0, last: 0, cells: new Map() };
  const text = read(p);
  let i = 0;
  while (i < text.length) {
    let j = text.indexOf('\n', i); if (j < 0) j = text.length;
    const line = text.slice(i, j); i = j + 1;
    if (line.length < 5) continue;
    let r; try { r = JSON.parse(line); } catch (_) { continue; }
    agg.rows++;
    const t = Date.parse(r.ts || ''); if (!Number.isFinite(t)) { agg.noTs++; continue; }
    if (!agg.first || t < agg.first) agg.first = t; if (t > agg.last) agg.last = t;
    const hook = norm(r.hook || '?'); const key = dayOf(t) + '|' + hook + '|' + (r.event || '?');
    const cell = agg.cells.get(key) || { day: dayOf(t), hook, event: r.event || '?', runs: 0, fired: 0, blocks: 0, errs: 0, ms: 0, last: 0 };
    cell.runs++; if (r.fired) cell.fired++; if (r.blocked) cell.blocks++;
    if (r.error || (Number.isFinite(r.exit) && r.exit !== 0 && r.exit !== 2)) cell.errs++;
    if (Number.isFinite(r.dur_ms)) cell.ms += r.dur_ms;
    if (t > cell.last) cell.last = t;
    agg.cells.set(key, cell);
  }
  fireCache.set(p, { m: s.mtimeMs, z: s.size, agg });
  return agg;
}
function telemetryFiles(roots) {
  // Monthly archives (hook-fires-YYYY-MM.jsonl) are git-tracked, so every checkout holds a copy:
  // read each archive ONCE (largest copy). Live files are per-root data: read every root's copy.
  const archives = new Map(); const live = [];
  for (const r of roots) {
    const dir = path.join(r, 'system', 'telemetry');
    for (const e of listDir(dir)) {
      if (!e.isFile() || !/^hook-fires.*\.jsonl$/.test(e.name)) continue;
      const p = path.join(dir, e.name); const s = stat(p);
      if (/^hook-fires-\d{4}-\d{2}\.jsonl$/.test(e.name)) {
        const prev = archives.get(e.name); if (!prev || s.size > prev.size) archives.set(e.name, { p, root: r, size: s.size });
      } else live.push({ p, root: r, size: s.size });
    }
  }
  return [...archives.values(), ...live];
}

// ── 3. reference index: which files mention each script (live wiring, not history) ──
function referenceIndex(names) {
  const counts = new Map(names.map(n => [n, new Set()]));
  if (!names.length) return counts;
  const re = new RegExp('(?:^|[^\\w-])(' + names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\.js\\b', 'g');
  const dirs = ['.claude', 'domain', 'lib', 'core', 'quest', 'system', 'Feature', 'etanah_atlas'];
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

// ── 4. the snapshot ──
function build(opts = {}) {
  const t0 = Date.now(); const timings = {}; let tl = t0; const lap = k => { const n = Date.now(); timings[k] = n - tl; tl = n; };
  const days = Math.max(1, Math.min(90, parseInt(opts.days || 30, 10) || 30));
  const now = Date.now(); const since = now - days * DAY;
  const wts = worktreeRoots();
  const roots = [DATA_ROOT, ...wts.filter(w => w !== DATA_ROOT)];
  const dayList = []; for (let d = days - 1; d >= 0; d--) dayList.push(dayOf(now - d * DAY));

  // telemetry
  const sources = [];
  const perHook = new Map();                   // hook → window aggregate + spark
  const lastEver = new Map();                  // hook → last ts (all time)
  const daily = new Map(dayList.map(d => [d, { day: d, runs: 0, fired: 0, blocks: 0, errs: 0, ms: 0, boots: 0 }]));
  const bootsByDay = new Map();
  for (const f of telemetryFiles(roots)) {
    const agg = aggregateFireFile(f.p); if (!agg) continue;
    const isLive = !/hook-fires-\d{4}-\d{2}\.jsonl$/.test(f.p);
    sources.push({ kind: 'hook telemetry', root: rootLabel(f.root), file: rel(f.root, f.p), rows: agg.rows, bytes: f.size, first: agg.first ? new Date(agg.first).toISOString() : null, last: agg.last ? new Date(agg.last).toISOString() : null,
      note: f.root !== DATA_ROOT && isLive ? 'worktree-only telemetry: gitignored, deleted with the worktree, read by no other report' : (isLive ? 'live' : 'monthly archive (git-tracked)') });
    for (const c of agg.cells.values()) {
      if (c.last > (lastEver.get(c.hook) || 0)) lastEver.set(c.hook, c.last);
      if (c.last < since - DAY || !daily.has(c.day)) continue;
      const h = perHook.get(c.hook) || { runs: 0, fired: 0, blocks: 0, errs: 0, ms: 0, events: new Set(), spark: new Map() };
      h.runs += c.runs; h.fired += c.fired; h.blocks += c.blocks; h.errs += c.errs; h.ms += c.ms; h.events.add(c.event);
      h.spark.set(c.day, (h.spark.get(c.day) || 0) + c.runs);
      perHook.set(c.hook, h);
      const dd = daily.get(c.day); dd.runs += c.runs; dd.fired += c.fired; dd.blocks += c.blocks; dd.errs += c.errs; dd.ms += c.ms;
      if (c.event === 'SessionStart') bootsByDay.set(c.day, Math.max(bootsByDay.get(c.day) || 0, c.runs));
    }
  }
  for (const [d, b] of bootsByDay) if (daily.has(d)) daily.get(d).boots = b;
  lap('telemetry');
  const runtimeOf = keys => {
    const out = { runs: 0, fired: 0, blocks: 0, errs: 0, ms: 0, last: 0, spark: dayList.map(() => 0), events: [] };
    const ev = new Set();
    for (const k of keys) {
      const h = perHook.get(k); const le = lastEver.get(k) || 0; if (le > out.last) out.last = le;
      if (!h) continue;
      out.runs += h.runs; out.fired += h.fired; out.blocks += h.blocks; out.errs += h.errs; out.ms += h.ms;
      h.events.forEach(e => ev.add(e));
      dayList.forEach((d, i) => { out.spark[i] += h.spark.get(d) || 0; });
    }
    out.avgMs = out.runs ? Math.round(out.ms / out.runs) : 0; out.events = [...ev];
    out.last = out.last ? new Date(out.last).toISOString() : null;
    return out;
  };

  // registrations + census verdicts
  const { reg, lanes } = parseSettings();
  let census = [];
  try { census = require(path.join(CODE_ROOT, 'lib', 'feature-census.js')).collect(); } catch (e) { census = []; }
  const censusBy = new Map(census.map(r => [r.name, r]));
  const censusGaps = name => { const r = censusBy.get(name); return r && /^GAPS: /.test(r.verdict) ? r.verdict.slice(6).split(', ') : []; };
  const registry = new Map();
  for (const r of unionJsonl('system/registry.jsonl', [CODE_ROOT, DATA_ROOT])) if (r.name) registry.set(r.name, { ...(registry.get(r.name) || {}), ...r, born: (registry.get(r.name) || {}).born || r.ts });

  // eval battery (latest run across checkouts)
  const battery = unionJsonl('system/telemetry/eval-battery.jsonl', [CODE_ROOT, DATA_ROOT]).sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts)).pop() || null;
  const failSet = new Set((battery && battery.fails || []).map(f => String(f).replace(/\\/g, '/')));
  const quarantine = new Map((battery && battery.quarantined || []).map(q => [String(q.eval).replace(/\\/g, '/'), q.reason]));
  const evalStatus = evals => {
    if (!evals.length) return 'none';
    if (evals.some(e => failSet.has(e))) return 'fail';
    if (evals.every(e => quarantine.has(e))) return 'quarantined';
    return battery ? 'pass' : 'unknown';
  };

  // domain logs (gitignored runtime: union every root)
  const logActivity = relDir => {
    let rows = 0, last = 0;
    for (const r of roots) for (const f of ['log.jsonl']) {
      for (const row of readJsonl(path.join(r, relDir, f))) { const t = Date.parse(row.ts || ''); if (!Number.isFinite(t)) continue; if (t > last) last = t; if (t >= since) rows++; }
    }
    return { rows, last: last ? new Date(last).toISOString() : null };
  };

  const components = [];
  const push = c => { c.id = c.kind + ':' + c.path; components.push(c); return c; };
  const registrationOf = relPath => { const r = reg.get(relPath); if (!r) return null; return { events: [...r.events], matchers: [...r.matchers].filter(m => m !== '*'), mode: [...r.modes].join('+'), bundles: [...r.bundles] }; };

  lap('registrations+census');
  // 4a. domain/ features
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
        const rt = runtimeOf(kids);
        push({ kind: 'bundle', name: man.name || f.replace(/\.json$/, ''), path: relDir + '/' + f, description: 'Dispatch bundle: runs ' + (man.children || []).length + ' hooks in one process (' + (man.children || []).map(c => path.basename(c)).join(', ') + ')',
          children: man.children || [], registration: r, runtime: rt, gaps: [...(r ? [] : ['NOT REGISTERED']), ...missing.map(m => 'missing child ' + m)], evals: [], evalStatus: 'none', observable: true, files: [f] });
      }
      continue;
    }
    const readmeText = read(path.join(dir, 'README.md')); const rk = readmeKeys(readmeText);
    const hooks = files.filter(f => /\.hook\.js$/.test(f));
    const evals = files.filter(f => /eval.*\.js$|\.eval\.js$/.test(f)).map(f => relDir + '/' + f);
    evals.forEach(e => evalFileOwner.set(e, relDir));
    const retired = /\b(RETIRED|DEREGISTERED|TOMBSTONE)\b/.test(readmeText.slice(0, 400));
    const hookInfo = hooks.map(h => ({ file: relDir + '/' + h, key: norm(path.basename(h, '.js')), registration: registrationOf(relDir + '/' + h), observable: !!(reg.get(relDir + '/' + h) && [...reg.get(relDir + '/' + h).modes].some(m => m !== 'direct')) || /runHook|hook-runtime/.test(read(path.join(dir, h))) }));
    const keys = [...new Set([...hookInfo.map(h => h.key), d.name])];
    const rt = runtimeOf(keys); const la = logActivity(relDir);
    const support = files.filter(f => !ROLE.test(f));
    for (const f of support) if (STRAY.test(f)) looseFiles.push({ path: relDir + '/' + f, reason: 'loose file inside a feature folder (not hook/eval/README/log/config)' });
    const events = [...new Set(hookInfo.flatMap(h => h.registration ? h.registration.events : []))];
    const registered = hookInfo.filter(h => h.registration);
    const gaps = censusGaps(relDir);
    const c = push({ kind: hooks.length ? 'feature' : 'package', name: d.name, path: relDir, title: rk.title, description: rk.goal || firstComment(read(path.join(dir, hooks[0] || ''))) || rk.title,
      readme: { goal: rk.goal, retention: rk.retention, symptom: rk.symptom, goal_status: rk.goal_status }, hooks: hookInfo, events,
      registration: registered.length ? { events, mode: [...new Set(registered.map(h => h.registration.mode))].join('+'), matchers: [...new Set(registered.flatMap(h => h.registration.matchers))], bundles: [...new Set(registered.flatMap(h => h.registration.bundles))] } : null,
      evals, evalStatus: evalStatus(evals), runtime: rt, log: la, files, support, retired, observable: hookInfo.some(h => h.observable) || la.last !== null,
      gaps, lifecycle: (registry.get(d.name) || {}).lifecycle || null, born: (registry.get(d.name) || {}).born || null });
    c.unregisteredHooks = hookInfo.filter(h => !h.registration).map(h => h.file);
  }

  // 4b. legacy hooks
  for (const e of listDir(path.join(CODE_ROOT, '.claude', 'hooks'))) {
    if (!e.isFile() || !e.name.endsWith('.js') || /\.eval\.js$/.test(e.name)) continue;
    const r = '.claude/hooks/' + e.name; const body = read(path.join(CODE_ROOT, r));
    const evalName = r.replace(/\.js$/, '.eval.js'); const evals = exists(path.join(CODE_ROOT, evalName)) ? [evalName] : [];
    evals.forEach(x => evalFileOwner.set(x, r));
    const registration = registrationOf(r); const optOut = /system-audit:\s*skip-ghost-check/.test(body);
    push({ kind: 'legacy-hook', name: e.name.replace(/\.js$/, ''), path: r, description: firstComment(body), registration, optOut, events: registration ? registration.events : [],
      evals, evalStatus: evalStatus(evals), runtime: runtimeOf([norm(e.name.replace(/\.js$/, ''))]), observable: !!(registration && !/^direct$/.test(registration.mode)) || /hook-runtime|log\.jsonl|appendFileSync\(LOG/.test(body),
      gaps: censusGaps(r), lifecycle: (registry.get(e.name.replace(/\.js$/, '')) || {}).lifecycle || null });
  }

  // 4c. registered paths with no file on disk (ghosts)
  const ghosts = [...reg.keys()].filter(r => !exists(path.join(CODE_ROOT, r)));
  for (const g of ghosts) push({ kind: /\.json$/.test(g) ? 'bundle' : (g.startsWith('.claude/') ? 'legacy-hook' : 'feature'), name: path.basename(g), path: g, ghost: true, description: 'Registered in settings.json but the file does not exist', registration: registrationOf(g), evals: [], evalStatus: 'none', runtime: runtimeOf([norm(path.basename(g, '.js'))]), gaps: ['GHOST: registered, file missing'] });

  lap('features+legacy');
  // 4d. skills (project + .agents)
  const skillLog = unionJsonl('domain/skill-invocation-log/log.jsonl', roots);
  const skillUse = new Map();
  for (const r of skillLog) { const t = Date.parse(r.ts || ''); if (!r.skill) continue; const s = skillUse.get(r.skill) || { n: 0, n30: 0, last: 0 }; s.n++; if (t >= since) s.n30++; if (t > s.last) s.last = t; skillUse.set(r.skill, s); }
  for (const [base, label] of [[path.join(CODE_ROOT, '.claude', 'skills'), '.claude/skills'], [path.join(CODE_ROOT, '.agents', 'skills'), '.agents/skills']]) {
    for (const d of listDir(base)) {
      if (!d.isDirectory() && !d.isSymbolicLink()) continue;
      const dir = path.join(base, d.name); const text = read(path.join(dir, 'SKILL.md')); const fm = frontmatter(text);
      const files = listDir(dir).map(e => e.name);
      const evals = files.filter(f => /eval/i.test(f)).map(f => label + '/' + d.name + '/' + f);
      const use = skillUse.get(fm.name || d.name) || skillUse.get(d.name) || { n: 0, n30: 0, last: 0 };
      const gaps = censusGaps('.claude/skills/' + d.name);
      if (!text) gaps.push('no SKILL.md'); else if (!fm.description) gaps.push('no description');
      push({ kind: 'skill', name: fm.name || d.name, path: label + '/' + d.name, description: (fm.description || '').slice(0, 400), evals, evalStatus: evals.length ? 'present' : 'none',
        usage: { total: use.n, window: use.n30, last: use.last ? new Date(use.last).toISOString() : null }, files, gaps: [...new Set(gaps)], observable: true, source: label });
    }
  }
  const pluginSkillUse = [...skillUse.entries()].filter(([k]) => k.includes(':')).map(([k, v]) => ({ skill: k, total: v.n, window: v.n30, last: v.last ? new Date(v.last).toISOString() : null })).sort((a, b) => b.total - a.total);

  // 4e. scripts (core/ lib/ quest/ system/)
  const scriptRows = [];
  for (const dirName of ['core', 'lib', 'quest', 'system']) {
    for (const e of listDir(path.join(CODE_ROOT, dirName))) {
      if (!e.isFile() || !/\.js$/.test(e.name) || /\.eval\.js$|\.log\./.test(e.name)) continue;
      scriptRows.push({ dirName, file: e.name, r: dirName + '/' + e.name });
    }
  }
  lap('skills'); const refs = referenceIndex([...new Set(scriptRows.map(s => s.file.replace(/\.js$/, '')))]);
  for (const s of scriptRows) {
    const body = read(path.join(CODE_ROOT, s.r)); const why = headerWhy(body);
    const evalName = s.r.replace(/\.js$/, '.eval.js'); const evals = exists(path.join(CODE_ROOT, evalName)) ? [evalName] : [];
    evals.forEach(x => evalFileOwner.set(x, s.r));
    const name = s.file.replace(/\.js$/, ''); const refSet = refs.get(name) || new Set();
    const logP = [path.join(CODE_ROOT, s.dirName, name + '.log.jsonl'), path.join(DATA_ROOT, s.dirName, name + '.log.jsonl')].find(exists);
    const lastRun = logP ? (readJsonl(logP).map(r => Date.parse(r.ts || '')).filter(Number.isFinite).sort((a, b) => b - a)[0] || 0) : 0;
    push({ kind: 'script', name, path: s.r, description: why.goal || firstComment(body), readme: why, evals, evalStatus: evalStatus(evals),
      refs: refSet.size, refFiles: [...refSet].slice(0, 12), lastRun: lastRun ? new Date(lastRun).toISOString() : null, observable: /appendFileSync|log\.jsonl|jsonl'/.test(body),
      gaps: censusGaps(s.r), lifecycle: (registry.get(name) || {}).lifecycle || null, born: (registry.get(name) || {}).born || null });
  }

  lap('scripts+refs');
  // 4f. protocol systems, workflows, knowledge bases, projects
  for (const d of listDir(path.join(CODE_ROOT, 'Feature'))) {
    if (!d.isDirectory()) continue;
    const dir = path.join(CODE_ROOT, 'Feature', d.name); const w = walkFiles(dir, {});
    const md = listDir(dir).filter(e => e.isFile() && e.name.endsWith('.md')).map(e => e.name);
    const head = read(path.join(dir, md[0] || '')).slice(0, 1500);
    push({ kind: 'protocol', name: d.name, path: 'Feature/' + d.name, description: (/^#\s+(.+)$/m.exec(head) || [])[1] || '', files: md, fileCount: w.files, bytes: w.bytes, modified: w.newest ? new Date(w.newest).toISOString() : null,
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
      modified: w.newest ? new Date(w.newest).toISOString() : null, gaps: w.files ? [] : ['empty knowledge folder'], evals: [], evalStatus: 'none', observable: false });
  }
  if (exists(path.join(CODE_ROOT, 'etanah_atlas'))) {
    const w = walkFiles(path.join(CODE_ROOT, 'etanah_atlas'), {});
    push({ kind: 'project', name: 'etanah_atlas', path: 'etanah_atlas', description: 'Atlas build (per-state HTML + config), shipped from this repo; guarded by atlas-ship-gate / atlas-full-check', fileCount: w.files, bytes: w.bytes, modified: w.newest ? new Date(w.newest).toISOString() : null, gaps: [], evals: [], evalStatus: 'none', observable: true });
  }

  lap('protocols+knowledge');
  // 4g. memory stores
  const memDir = path.join(DATA_ROOT, '.claude', 'auto-memory');
  const memFiles = listDir(memDir).filter(e => e.isFile() && e.name.endsWith('.md') && e.name !== 'MEMORY.md').map(e => e.name);
  const memIndex = read(path.join(memDir, 'MEMORY.md'));
  const linked = new Set([...memIndex.matchAll(/\]\(([^)]+\.md)\)/g)].map(m => m[1]));
  const memTypes = {}; for (const f of memFiles) { const fm = frontmatter(read(path.join(memDir, f))); const t = fm.type || (read(path.join(memDir, f)).match(/^\s+type:\s*(\w+)/m) || [])[1] || 'untyped'; memTypes[t] = (memTypes[t] || 0) + 1; }
  const brokenLinks = [...linked].filter(l => !exists(path.join(memDir, l)));
  const unindexed = memFiles.filter(f => !linked.has(f));
  const diaryDir = path.join(DATA_ROOT, 'daily-diary', 'current');
  const diary = listDir(diaryDir).filter(e => e.isFile() && /^\d{4}-\d{2}-\d{2}\.md$/.test(e.name)).map(e => e.name.slice(0, 10)).sort();
  const mainFiles = listDir(path.join(DATA_ROOT, 'main')).filter(e => e.isFile()).map(e => { const p = path.join(DATA_ROOT, 'main', e.name); const s = stat(p); return { name: e.name, bytes: s.size, lines: read(p).split('\n').length, modified: new Date(s.mtimeMs).toISOString() }; });
  const memory = {
    autoMemory: { dir: rel(DATA_ROOT, memDir), total: memFiles.length, types: memTypes, indexLines: (memIndex.match(/^- \[/gm) || []).length, brokenLinks, unindexed },
    diary: { count: diary.length, latest: diary[diary.length - 1] || null, today: dayOf(now), hasToday: diary.includes(dayOf(now)), daysSince: diary.length ? Math.floor((now - Date.parse(diary[diary.length - 1])) / DAY) : null },
    main: mainFiles, sessionCap: 500,
  };
  for (const m of [['main/main-memory.md', 'Identity + relationship memory'], ['main/current-session.md', 'Session memory (capped at 500 lines)'], ['main/todo.md', 'Todo queue'], ['.claude/auto-memory', 'Auto-memory store (' + memFiles.length + ' files)'], ['daily-diary', 'Daily diary (' + diary.length + ' days)']]) {
    const p = path.join(DATA_ROOT, m[0]); const s = stat(p); if (!s) continue;
    const gaps = [];
    if (m[0] === 'main/current-session.md') { const l = read(p).split('\n').length; if (l > 500) gaps.push('over the 500-line cap (' + l + ' lines)'); }
    if (m[0] === '.claude/auto-memory') { if (brokenLinks.length) gaps.push(brokenLinks.length + ' broken index links'); if (unindexed.length) gaps.push(unindexed.length + ' memories not in MEMORY.md'); }
    if (m[0] === 'daily-diary' && !memory.diary.hasToday) gaps.push('no diary entry today');
    push({ kind: 'memory', name: path.basename(m[0]), path: m[0], description: m[1], modified: new Date(s.mtimeMs).toISOString(), gaps, evals: [], evalStatus: 'none', observable: false, info: true });
  }

  // 4h. constitution docs (system/*.md, .claude/*.md, root docs) — dated reports are listed as operation outputs instead
  const DATED = /-\d{4}-\d{2}-\d{2}/;
  const reports = [];
  const docDirs = [['system', ''], ['.claude', ''], ['', 'root']];
  for (const [dir] of docDirs) {
    for (const e of listDir(path.join(CODE_ROOT, dir))) {
      if (!e.isFile() || !/\.md$/.test(e.name)) continue;
      const r = (dir ? dir + '/' : '') + e.name; const s = stat(path.join(CODE_ROOT, r));
      if (DATED.test(e.name)) { reports.push({ path: r, bytes: s.size, modified: new Date(s.mtimeMs).toISOString() }); continue; }
      const head = read(path.join(CODE_ROOT, r)).slice(0, 1200);
      const generated = /generated|GENERATED|AUTO-GENERATED/.test(head.slice(0, 300));
      push({ kind: 'doc', name: e.name, path: r, description: ((/^#\s+(.+)$/m.exec(head) || [])[1] || '').slice(0, 200), generated, modified: new Date(s.mtimeMs).toISOString(), bytes: s.size, gaps: [], evals: [], evalStatus: 'none', observable: false, info: true });
    }
  }

  // ── 5. verdict per component ──
  for (const c of components) {
    const rt = c.runtime; const silent = rt && c.registration && c.observable && rt.runs === 0 && !(c.log && c.log.rows);
    c.gaps = [...new Set(c.gaps || [])];
    if (c.retired) c.verdict = 'retired';
    else if (c.ghost) c.verdict = 'ghost';
    else if (c.evalStatus === 'fail') c.verdict = 'failing';
    else if (['feature', 'legacy-hook'].includes(c.kind) && !c.registration && !c.optOut && (c.kind === 'legacy-hook' || (c.unregisteredHooks || []).length)) c.verdict = 'unregistered';
    else if (silent) c.verdict = 'silent';
    else if (c.gaps.length) c.verdict = 'gaps';
    else c.verdict = 'healthy';
    c.status = { healthy: 'good', retired: 'neutral', ghost: 'critical', failing: 'critical', unregistered: 'serious', silent: 'warning', gaps: 'warning' }[c.verdict];
  }

  lap('memory+docs+verdicts');
  // ── 6. strays: everything no component owns ──
  const fsJson = (() => { const m = /```json\s*([\s\S]*?)```/.exec(read(path.join(CODE_ROOT, 'system', 'FOLDER-STRUCTURE.md'))); try { return JSON.parse(m[1]); } catch (_) { return { allow: [], pending_nod: [] }; } })();
  const allow = new Set(fsJson.allow || []); const pending = new Set(fsJson.pending_nod || []);
  const rootEntries = listDir(DATA_ROOT).filter(e => e.name !== '.git').map(e => {
    const p = path.join(DATA_ROOT, e.name); const isDir = e.isDirectory() || e.isSymbolicLink();
    const w = isDir ? walkFiles(p, { skip: new Set(['.git', 'node_modules', 'worktrees']), cap: 30000 }) : (() => { const s = stat(p); return { files: 1, bytes: s ? s.size : 0, newest: s ? s.mtimeMs : 0 }; })();
    const cls = allow.has(e.name) ? 'canonical' : (pending.has(e.name) ? 'pending-nod' : 'orphan');
    return { name: e.name, dir: isDir, class: cls, files: w.files, bytes: w.bytes, modified: w.newest ? new Date(w.newest).toISOString() : null };
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
  const byKind = k => components.filter(c => c.kind === k);
  const strays = {
    rootEntries,
    pendingOrOrphan: rootEntries.filter(r => r.class !== 'canonical'),
    conflictCopies: conflict,
    looseFiles,
    unreferencedScripts: byKind('script').filter(s => s.refs === 0).map(s => ({ path: s.path, reason: 'no other file references it' })),
    unregisteredHooks: [...byKind('legacy-hook').filter(h => !h.registration && !h.optOut).map(h => h.path), ...byKind('feature').flatMap(f => f.unregisteredHooks || [])],
    evalOnlyPackages: byKind('package').filter(p => p.evals.length && p.files.every(f => /eval|README|NUKE|\.jsonl?$/i.test(f))).map(p => p.path),
    reports,
  };
  strays.total = strays.pendingOrOrphan.length + conflict.length + looseFiles.length + strays.unreferencedScripts.length + strays.unregisteredHooks.length + strays.evalOnlyPackages.length;

  lap('strays');
  // ── 7. ledgers ──
  const slipsAll = unionJsonl('system/slips.jsonl', [CODE_ROOT, DATA_ROOT]).filter(r => r.ts);
  const slipWindow = slipsAll.filter(r => Date.parse(r.ts) >= since);
  const isSlip = r => !r.type || r.type === 'slip';
  const countBy = (rows, k) => { const o = {}; for (const r of rows) { const v = r[k] || '—'; o[v] = (o[v] || 0) + 1; } return Object.entries(o).sort((a, b) => b[1] - a[1]).map(([key, n]) => ({ key, n })); };
  const slipDaily = dayList.map(d => ({ day: d, slips: 0, proposals: 0, upgrades: 0 }));
  const sdi = new Map(slipDaily.map(s => [s.day, s]));
  for (const r of slipWindow) { const s = sdi.get(dayOf(Date.parse(r.ts))); if (!s) continue; if (isSlip(r)) s.slips++; else if (r.type === 'proposal') s.proposals++; else if (r.type === 'upgrade') s.upgrades++; }
  const slips = {
    total: slipsAll.length, types: countBy(slipsAll, 'type').map(x => ({ key: x.key === '—' ? 'slip' : x.key, n: x.n })),
    window: slipWindow.filter(isSlip).length, week: slipsAll.filter(r => isSlip(r) && Date.parse(r.ts) >= now - 7 * DAY).length,
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

  const questText = read(path.join(DATA_ROOT, 'quest', 'active.txt'));
  const quests = [];
  for (const block of questText.split(/\r?\n(?=qa=)/)) {
    if (!/^qa=/.test(block)) continue; const q = {};
    for (const line of block.split(/\r?\n/)) { const m = /^([\w-]+)=(.*)$/.exec(line); if (m && !(m[1] in q)) q[m[1]] = m[2].trim(); }
    quests.push({ qa: q.qa, status: q.status || '—', phase: q.phase || '—', type: q.ticket_type || '—', urusan: q.urusan || '—', env: q.env || '—', issue: (q.issue_one_liner || '').slice(0, 220), current: (q.current_phase || '').slice(0, 200), branch: q.branch || '', start: q.quest_start || q.assigned_to_me || '' });
  }

  // monitoring layer: turns (context per turn) + goal-lens + watches
  const turnSeen = new Set(); const turns = [];
  for (const r of roots) for (const e of listDir(path.join(r, 'system', 'telemetry'))) {
    if (!/^turns.*\.jsonl$/.test(e.name)) continue;
    const p = path.join(r, 'system', 'telemetry', e.name); const rows = readJsonl(p);
    sources.push({ kind: 'turn ledger', root: rootLabel(r), file: rel(r, p), rows: rows.length, bytes: stat(p).size, first: rows[0] && rows[0].closed_ts || null, last: rows.length ? rows[rows.length - 1].closed_ts : null, note: r !== DATA_ROOT ? 'worktree-only' : 'live' });
    for (const t of rows) { const k = t.turn_id || (t.closed_ts + '|' + t.session_id); if (turnSeen.has(k)) continue; turnSeen.add(k); if (Date.parse(t.closed_ts || '') >= since) turns.push(t); }
  }
  const tDaily = dayList.map(d => ({ day: d, turns: 0, hookMs: 0, tools: 0, out: 0, reask: 0 }));
  const tdi = new Map(tDaily.map(x => [x.day, x]));
  const phaseCost = new Map();
  for (const t of turns) {
    const x = tdi.get(dayOf(Date.parse(t.closed_ts))); if (x) { x.turns++; x.hookMs += t.hook_ms || 0; x.tools += t.tool_calls || 0; x.out += (t.tokens && t.tokens.out) || 0; if (t.user_signal === 'reask') x.reask++; }
    const k = (t.qa || '—') + ' · ' + (t.phase || '—'); const s = phaseCost.get(k) || { key: k, turns: 0, tools: 0, hookMs: 0, blocks: 0, reask: 0 };
    s.turns++; s.tools += t.tool_calls || 0; s.hookMs += t.hook_ms || 0; s.blocks += (t.blocks || []).length; if (t.user_signal === 'reask') s.reask++; phaseCost.set(k, s);
  }
  const goals = [];
  for (const d of listDir(path.join(CODE_ROOT, 'domain'))) {
    if (!d.isDirectory()) continue;
    const rows = unionJsonl('domain/' + d.name + '/goal-log.jsonl', roots).filter(r => Date.parse(r.ts || '') >= since); if (!rows.length) continue;
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
  const hookRows = [...perHook.entries()].map(([hook, h]) => ({ hook, events: [...h.events], runs: h.runs, fired: h.fired, blocks: h.blocks, errs: h.errs, totalS: Math.round(h.ms / 1000), avgMs: h.runs ? Math.round(h.ms / h.runs) : 0 }));
  const registeredKeys = new Set([...reg.keys()].filter(r => r.endsWith('.js')).map(r => norm(path.basename(r, '.js'))));
  const bootDays = [...daily.values()].filter(d => d.boots > 0);
  const bootMs = hookRows.filter(h => h.events.includes('SessionStart')).reduce((a, h) => a + h.totalS * 1000, 0);
  const totalBoots = bootDays.reduce((a, d) => a + d.boots, 0);
  const runtime = {
    lanes: EVENTS.filter(e => lanes[e]).map(e => ({ event: e, groups: lanes[e].map(g => ({ matcher: g.matcher, entries: g.entries.map(en => ({ ...en, key: en.mode === 'bundle' ? null : norm(path.basename(en.rel, '.js')), exists: exists(path.join(CODE_ROOT, en.rel)) })) })) })),
    daily: [...daily.values()],
    slowest: hookRows.slice().sort((a, b) => b.totalS - a.totalS).slice(0, 15),
    blockers: hookRows.filter(h => h.blocks > 0).sort((a, b) => b.blocks - a.blocks).slice(0, 15),
    errors: hookRows.filter(h => h.errs > 0).sort((a, b) => b.errs - a.errs),
    unregisteredFiring: hookRows.filter(h => !registeredKeys.has(h.hook) && !['forge', '?', 'spawn-telemetry', 'dispatch-hooks'].includes(h.hook)).map(h => h.hook),
    boot: { boots: totalBoots, avgS: totalBoots ? Math.round(bootMs / 1000 / totalBoots) : 0 },
    skillUse: [...skillUse.entries()].map(([skill, v]) => ({ skill, total: v.n, window: v.n30, last: v.last ? new Date(v.last).toISOString() : null })).sort((a, b) => b.window - a.window || b.total - a.total),
    pluginSkillUse,
  };

  // audit block — the same four-block screen Domain Expansion runs (lib/audit-briefing.js), read against the main repo
  let audit = null;
  if (!opts.noAudit) {
    const prev = process.env.CLAUDE_PROJECT_DIR;
    try {
      process.env.CLAUDE_PROJECT_DIR = DATA_ROOT;
      const p = path.join(CODE_ROOT, 'lib', 'audit-briefing.js'); delete require.cache[require.resolve(p)];
      const g = require(p).gather();
      audit = { notWorking: g.notWorking, slow: g.slow.concat(g.heavyTurns || []), mistakes: g.mistakes, optimizations: g.opt, rulings: g.rulings, n: g.n };
    } catch (e) { audit = { error: String(e.message || e) }; }
    finally { if (prev === undefined) delete process.env.CLAUDE_PROJECT_DIR; else process.env.CLAUDE_PROJECT_DIR = prev; }
  }

  lap('runtime+audit');
  // git state of both roots
  const gitState = r => {
    const branch = git(r, ['rev-parse', '--abbrev-ref', 'HEAD']); if (branch === null) return null;
    const ab = (git(r, ['rev-list', '--left-right', '--count', 'origin/main...HEAD']) || '0\t0').split(/\s+/).map(Number);
    const dirty = (git(r, ['status', '--porcelain', '--untracked-files=no']) || '').split('\n').filter(Boolean).length;
    return { root: rootLabel(r), branch, head: git(r, ['rev-parse', '--short', 'HEAD']), behindMain: ab[0] || 0, aheadMain: ab[1] || 0, dirty };
  };

  // ── 8. KPIs ──
  const kinds = {}; for (const c of components) { const k = kinds[c.kind] || (kinds[c.kind] = { kind: c.kind, total: 0, healthy: 0, gaps: 0, silent: 0, unregistered: 0, failing: 0, ghost: 0, retired: 0 }); k.total++; k[c.verdict]++; }
  const verdictCount = v => components.filter(c => c.verdict === v).length;
  const runtimeKinds = components.filter(c => ['feature', 'legacy-hook', 'bundle'].includes(c.kind));
  const judged = components.filter(c => !c.info);
  const totals = [...daily.values()].reduce((a, d) => ({ runs: a.runs + d.runs, blocks: a.blocks + d.blocks, ms: a.ms + d.ms, errs: a.errs + d.errs }), { runs: 0, blocks: 0, ms: 0, errs: 0 });
  const kpis = {
    components: components.length, judged: judged.length,
    healthy: judged.filter(c => c.verdict === 'healthy').length,
    healthPct: judged.length ? Math.round(100 * judged.filter(c => c.verdict === 'healthy' || c.verdict === 'retired').length / judged.length) : 0,
    ghosts: verdictCount('ghost'), failing: verdictCount('failing'), unregistered: verdictCount('unregistered'), silent: verdictCount('silent'), gaps: verdictCount('gaps'),
    hooksRegistered: runtimeKinds.filter(c => c.registration).length,
    hooksLive: runtimeKinds.filter(c => c.registration && c.runtime && c.runtime.runs > 0).length,
    runs: totals.runs, blocks: totals.blocks, errors: totals.errs, hookHours: +(totals.ms / 3600000).toFixed(1),
    runsSpark: [...daily.values()].map(d => d.runs), blocksSpark: [...daily.values()].map(d => d.blocks),
    evalCoverage: Math.round(100 * components.filter(c => ['feature', 'package', 'legacy-hook', 'script'].includes(c.kind) && c.evals.length).length / Math.max(1, components.filter(c => ['feature', 'package', 'legacy-hook', 'script'].includes(c.kind)).length)),
    evalFails: failSet.size, evalAgeDays: evals.battery ? evals.battery.ageDays : null,
    slipsWeek: slips.week, slipsWindow: slips.window, proposalsUnruled: slips.proposalsUnruled,
    questsOpen: quests.filter(q => ['active', 'hold', 'blocked', 'delegated'].includes(q.status)).length,
    strays: strays.total, worktreeTelemetry: sources.filter(s => s.kind === 'hook telemetry' && s.root !== 'main' && !/archive/.test(s.note)).length,
  };

  const snapshot = {
    meta: { generated: new Date().toISOString(), buildMs: 0, windowDays: days, days: dayList, codeRoot: CODE_ROOT, dataRoot: DATA_ROOT, roots: roots.map(rootLabel), git: [gitState(DATA_ROOT), CODE_ROOT !== DATA_ROOT ? gitState(CODE_ROOT) : null].filter(Boolean), version: 1 },
    kpis, kinds: Object.values(kinds).sort((a, b) => b.total - a.total), components, runtime, monitoring, slips, evals, quests, memory, strays, sources, audit,
  };
  lap('git+kpis'); snapshot.meta.timings = timings;
  snapshot.meta.buildMs = Date.now() - t0;
  if (!process.env.OBSERVATORY_NO_LOG) {
    try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, JSON.stringify({ ts: snapshot.meta.generated, action: 'snapshot', by: opts.by || 'cli', ms: snapshot.meta.buildMs, days, components: components.length, healthPct: kpis.healthPct, strays: strays.total }) + '\n'); } catch (_) {}
  }
  return snapshot;
}

function summary(s) {
  const k = s.kpis;
  return `observatory: ${k.components} components (${s.kinds.map(x => x.kind + ' ' + x.total).join(' · ')}) · ${k.healthPct}% healthy · ${k.hooksLive}/${k.hooksRegistered} registered hooks fired in ${s.meta.windowDays} d · ${k.strays} stray items · built in ${s.meta.buildMs} ms`;
}

if (require.main === module) {
  const argv = process.argv;
  const i = argv.indexOf('--days');
  const s = build({ days: i > 0 ? argv[i + 1] : 30, noAudit: argv.includes('--no-audit'), by: 'cli' });
  if (argv.includes('--json')) process.stdout.write(JSON.stringify(s));
  else console.log(summary(s));
}
module.exports = { build, summary, CODE_ROOT, DATA_ROOT };
