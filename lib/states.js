#!/usr/bin/env node
/**
 * lib/states.js — THE state-registry resolver (born 2026-09-04, per miya: "audit our whole Quest workflow &
 * anything related to etanah workflow so that we can cater for ALL states & even future ones. Make it easy
 * and deterministic for you to add or remove").
 *
 * Registry  = system/states.json (tracked, worktree-safe)  +  system/states.local.json (gitignored overlay:
 * hosts / URLs / machine-local roots; deep-merged). One record per state. No hook, skill or script may carry
 * a state literal (melaka / PTMLK / mlk/master / 1. Tasks\Melaka / E:\Projects\Melaka / helpdesk_melaka) —
 * it resolves through this file. `node lib/states.js check` lists every literal still left.
 *
 * NEVER a silent default. resolve() returns { state: null } when nothing identifies the state; callers that
 * need one call require() and let it throw, or surface "state UNKNOWN — ask miya". The 2026-09-04 failure
 * this kills: ticket-gate.js fell back to melaka whenever projects/ was absent (= every worktree).
 *
 * API (all sync):
 *   all()                          → { key: record } (overlay merged; every record carries .key)
 *   get(x)                         → record | null   — x = key | alias | code | permohonan prefix | "PTPK/02/…"
 *   resolve({ state, activeBlock, filePath, cwd, text })
 *                                  → { state, record, src } | { state: null, src: 'unknown', tried: [...] }
 *                                    cascade (fixed order): explicit → ETANAH_STATE env → activeBlock.state=
 *                                    → path segment (Task folder | repo dir) → permohonan prefix in text → null
 *   require(opts)                  → record or throws Error('state UNKNOWN …')
 *   taskFolder(key)                → absolute path | null (state has no Task folder)
 *   tasksRoot()                    → absolute "…/1. Tasks"
 *   knowledgeDir(key, [root])      → absolute etanah-knowledge/<dir> (main-repo aware from a worktree)
 *   knowledgeRoot([root])          → absolute etanah-knowledge root
 *   repoPath(key, module)          → absolute repo path | null
 *   trunk(key, module)             → trunk branch | null
 *   trunkForRepo(repoPath)         → { state, module, trunk } | null   (matches <repos_root>/<repo_dir>/<repo>)
 *   stateForPath(p)                → key | null  (Task folder segment or repo dir)
 *   stateForPrefix('PTPK')         → key | null
 *   permohonanRegex()              → /\bPT(?:MLK|PK|…)\/\d{2}\/[A-Z]\/[A-Z0-9]+\/\d{4}\/\d+/
 *   knowledgeReadRegex([file])     → RegExp matching etanah-knowledge/<any registered dir>/<file|any .md>
 *   isExcluded(key)                → true when work_scope === 'excluded' (TRG guardrail)
 *   mcp(key, env)                  → MCP server name | null
 * CLI:
 *   node lib/states.js list | show <key> | resolve <text-or-path> | validate [key] | check [--json] [--all]
 *   node lib/states.js add <key> --code X --prefix PTX --label L [--task F] [--knowledge D] [--repo R] [--scope active|scaffold]
 *   node lib/states.js remove <key> [--force]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const HERE_ROOT = path.resolve(__dirname, '..');
const ROOT = process.env.STATES_ROOT || process.env.CLAUDE_PROJECT_DIR || HERE_ROOT;
// Registry file: env override → the project root's copy → this library's own repo (eval sandboxes set
// CLAUDE_PROJECT_DIR to a temp tree that carries hooks but no system/ — the registry must still load).
function firstExisting(cands) { return cands.find(p => { try { return fs.existsSync(p); } catch (_) { return false; } }) || cands[0]; }
const REG = process.env.STATES_FILE || firstExisting([path.join(ROOT, 'system', 'states.json'), path.join(HERE_ROOT, 'system', 'states.json')]);
const LOCAL = process.env.STATES_LOCAL_FILE || firstExisting([path.join(ROOT, 'system', 'states.local.json'), path.join(HERE_ROOT, 'system', 'states.local.json')]);

function mainRoot(root) {
  const m = String(root || ROOT).replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/, '');
  return m;
}
function deepMerge(a, b) {
  if (Array.isArray(a) || Array.isArray(b) || typeof a !== 'object' || typeof b !== 'object' || !a || !b) return b === undefined ? a : b;
  const out = { ...a };
  for (const k of Object.keys(b)) out[k] = deepMerge(a[k], b[k]);
  return out;
}
let _cache = null;
function loadRaw() {
  if (_cache) return _cache;
  const base = JSON.parse(fs.readFileSync(REG, 'utf8'));
  let local = null;
  try { local = JSON.parse(fs.readFileSync(LOCAL, 'utf8')); } catch (_) { local = null; }
  _cache = local ? deepMerge(base, local) : base;
  return _cache;
}
function reload() { _cache = null; return loadRaw(); }
function reference() { return loadRaw().reference_state; }
function all() {
  const r = loadRaw();
  const out = {};
  for (const [k, v] of Object.entries(r.states || {})) out[k] = { key: k, ...v };
  return out;
}
function get(x) {
  if (!x) return null;
  const v = String(x).trim();
  const vl = v.toLowerCase();
  const states = all();
  if (states[vl]) return states[vl];
  for (const s of Object.values(states)) {
    if ((s.aliases || []).some(a => a.toLowerCase() === vl)) return s;
    if (s.code && s.code.toLowerCase() === vl) return s;
    if (s.permohonan_prefix && v.toUpperCase().startsWith(s.permohonan_prefix)) return s;
  }
  return null;
}
function stateForPrefix(p) { const s = get(p); return s ? s.key : null; }
function permohonanRegex() {
  const alts = Object.values(all()).map(s => s.permohonan_prefix).filter(Boolean).map(p => p.replace(/^PT/, '')).sort((a, b) => b.length - a.length);
  return new RegExp('\\bPT(?:' + alts.join('|') + ')\\/\\d{2}\\/[A-Z]\\/[A-Z0-9]+\\/\\d{4}\\/\\d+', 'g');
}
function tasksRoot() {
  const r = loadRaw();
  if (r.tasks_root_override) return r.tasks_root_override;
  return path.join(os.homedir(), ...String(r.tasks_root).split('/'));
}
function taskFolder(key) {
  const s = get(key);
  if (!s || !s.task_folder) return null;
  return path.join(tasksRoot(), s.task_folder);
}
function knowledgeRoot(root) {
  if (process.env.KNOWLEDGE_ROOT) return process.env.KNOWLEDGE_ROOT;
  const r = loadRaw();
  return path.join(mainRoot(root || ROOT), ...String(r.knowledge_root).split('/'));
}
function knowledgeDir(key, root) {
  const s = get(key);
  if (!s || !s.knowledge_dir) return null;
  return path.join(knowledgeRoot(root), s.knowledge_dir);
}
function knowledgeReadRegex(file) {
  const dirs = Object.values(all()).map(s => s.knowledge_dir).filter(Boolean);
  // file: a literal name (escaped) · a RegExp (its source used verbatim) · omitted (any .md)
  const f = file instanceof RegExp ? file.source : (file ? String(file).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '[A-Za-z0-9._-]+\\.md');
  return new RegExp('etanah-knowledge[\\\\/](?:' + dirs.join('|') + ')[\\\\/]' + f, 'i');
}
function reposRoot() { return String(loadRaw().repos_root).replace(/\//g, path.sep); }
function repoPath(key, module) {
  const s = get(key);
  if (!s || !s.repo_dir || !s.modules || !s.modules[module]) return null;
  return path.join(reposRoot(), s.repo_dir, s.modules[module].repo);
}
function trunk(key, module) {
  const s = get(key);
  if (!s || !s.modules) return null;
  if (s.modules[module]) return s.modules[module].trunk || null;
  for (const m of Object.values(s.modules)) if (m.repo === module) return m.trunk || null;
  return null;
}
function norm(p) { return String(p || '').replace(/\\/g, '/').toLowerCase(); }
function trunkForRepo(repoPath_) {
  const p = norm(repoPath_);
  const rr = norm(loadRaw().repos_root).replace(/\/$/, '');
  for (const s of Object.values(all())) {
    if (!s.repo_dir || !s.modules) continue;
    for (const [module, m] of Object.entries(s.modules)) {
      const want = `${rr}/${s.repo_dir}/${m.repo}`.toLowerCase();
      if (p === want || p.startsWith(want + '/')) return { state: s.key, module, trunk: m.trunk || null, repo: m.repo };
    }
  }
  return null;
}
function stateForPath(p) {
  const n = norm(p);
  if (!n) return null;
  for (const s of Object.values(all())) {
    if (s.task_folder && n.includes('/1. tasks/' + s.task_folder.toLowerCase() + '/')) return s.key;
    if (s.task_folder && n.endsWith('/1. tasks/' + s.task_folder.toLowerCase())) return s.key;
  }
  const rr = norm(loadRaw().repos_root).replace(/\/$/, '');
  for (const s of Object.values(all())) {
    if (s.repo_dir && (n.startsWith(rr + '/' + s.repo_dir.toLowerCase() + '/') || n === rr + '/' + s.repo_dir.toLowerCase())) return s.key;
  }
  return null;
}
function isExcluded(key) { const s = get(key); return !!(s && s.work_scope === 'excluded'); }
function mcp(key, env) { const s = get(key); return s && s.db && s.db.mcp ? (s.db.mcp[env || s.db.primary_env] || null) : null; }

function resolve(opts) {
  const o = opts || {};
  const tried = [];
  const hit = (s, src) => (s ? { state: s.key, record: s, src } : null);
  let r;
  if (o.state) { r = hit(get(o.state), 'explicit'); if (r) return r; tried.push('explicit:' + o.state); }
  if (process.env.ETANAH_STATE) { r = hit(get(process.env.ETANAH_STATE), 'env ETANAH_STATE'); if (r) return r; tried.push('env'); }
  const ab = o.activeBlock;
  if (ab) {
    const v = typeof ab === 'string' ? ((/^\s*state=(.+)$/m.exec(ab) || [])[1] || '').trim() : (ab.state || '');
    if (v) { r = hit(get(v), 'active.txt state='); if (r) return r; tried.push('active.txt state=' + v); }
    const tf = typeof ab === 'string' ? ((/^\s*task_folder=(.+)$/m.exec(ab) || [])[1] || '').trim() : (ab.task_folder || '');
    if (tf) { const k = stateForPath(tf); r = hit(k && get(k), 'active.txt task_folder'); if (r) return r; tried.push('task_folder'); }
  }
  for (const p of [o.filePath, o.cwd]) {
    if (!p) continue;
    const k = stateForPath(p);
    r = hit(k && get(k), 'path ' + p); if (r) return r; tried.push('path:' + p);
  }
  if (o.text) {
    const m = String(o.text).match(/\bPT([A-Z]{2,4})\//);
    if (m) { r = hit(get('PT' + m[1]), 'permohonan-ID prefix PT' + m[1]); if (r) return r; tried.push('prefix:PT' + m[1]); }
  }
  return { state: null, record: null, src: 'unknown', tried };
}
function requireState(opts) {
  const r = resolve(opts);
  if (!r.state) throw new Error('state UNKNOWN — nothing in {explicit, ETANAH_STATE, active.txt state=/task_folder, path, permohonan prefix} identified it (tried: ' + r.tried.join(' · ') + '). Ask miya; never default to a state.');
  return r.record;
}

// ---------- validate: does disk agree with the record? ----------
function validate(key, opts) {
  const o = opts || {};
  const s = get(key);
  if (!s) return { key, ok: false, rows: [['record', '✗', 'no such state']] };
  const rows = [];
  const kd = knowledgeDir(s.key, o.root);
  rows.push(['knowledge_dir', kd && fs.existsSync(kd) ? '✓' : '✗', kd || '(none)']);
  const tf = taskFolder(s.key);
  rows.push(['task_folder', s.task_folder ? (tf && fs.existsSync(tf) ? '✓' : '✗') : '—', tf || '(no Task folder)']);
  for (const [m, rec] of Object.entries(s.modules || {})) {
    const rp = repoPath(s.key, m);
    let br = '—';
    if (rp && fs.existsSync(path.join(rp, '.git'))) {
      try {
        const { execSync } = require('child_process');
        const out = execSync(`git -C "${rp}" branch --list "${rec.trunk}"`, { encoding: 'utf8', windowsHide: true });
        br = out.trim() ? '✓' : '✗ trunk not local';
      } catch (_) { br = '? git failed'; }
    }
    rows.push(['repo ' + m, rp && fs.existsSync(rp) ? '✓' : '✗', (rp || '(none)') + ' @ ' + rec.trunk + ' ' + br]);
  }
  rows.push(['work_scope', s.work_scope ? '✓' : '✗', s.work_scope + (s.work_scope_note ? ' — ' + s.work_scope_note : '')]);
  if (s._unverified) rows.push(['_unverified', '⚠', s._unverified]);
  return { key: s.key, ok: rows.every(r => r[1] !== '✗'), rows };
}

// ---------- check: state literals still hard-coded in harness code ----------
const LITERALS = [
  ['knowledge-dir',   /etanah-knowledge[\\/'"\s,]*(?:\+\s*)?['"]?melaka\b/i],
  ['knowledge-dir',   /['"]etanah-knowledge['"]\s*,\s*['"]melaka['"]/i],
  ['task-folder',     /1\.\s?Tasks[\\/]+Melaka\b|['"]1\. Tasks['"]\s*,\s*['"]Melaka['"]/i],
  ['repo-root',       /E:[\\/]+Projects[\\/]+Melaka\b/i],
  ['trunk',           /['"`]mlk\/master['"`]|origin\/mlk\/master/],
  ['permohonan',      /PTMLK\\\/|\/PTMLK\b|PTMLK\//],
  ['redmine-project', /helpdesk_melaka/],
  ['bpmn-key',        /MLK_PLP_[A-Z]/],
  ['jboss',           /jboss-7\.4-plp-melaka/i],
  ['schema',          /et_main_(?:mlit|stg1|stg2|uat)\b/],
];
const SCAN_GLOBS = [
  ['.claude/hooks', /\.js$/],
  ['domain', /\.js$/],
  ['quest', /\.js$/],
  ['lib', /\.js$/],
  ['core', /\.js$/],
  ['.claude/skills', /SKILL\.md$/],
];
function walk(dir, rx, out) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return out; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'state') continue; walk(p, rx, out); }
    else if (rx.test(e.name)) out.push(p);
  }
  return out;
}
function classifyFile(rel, body) {
  if (/lib[\\/]states(\.eval)?\.js$/.test(rel)) return 'self';
  if (/\.eval\.js$/.test(rel) || /[\\/]eval[^\\/]*\.js$/.test(rel)) return 'eval';
  if (/state-scoped:\s*(?:yes|melaka)[^\n]*(?:by design|state-only|melaka-only|melaka only)/i.test(body)) return 'declared';
  if (/state-scoped:\s*no\b/i.test(body)) return 'declared';
  if (/lib[\\/]states(?:\.js)?\b|['"]states(?:\.js)?['"]\s*\)|require\(['"]\.\/states(?:\.js)?['"]\)/.test(body)) return 'routed';
  return 'unrouted';
}
function check(opts) {
  const o = opts || {};
  const root = o.root || ROOT;
  const rows = [];
  for (const [d, rx] of SCAN_GLOBS) {
    for (const f of walk(path.join(root, d), rx, [])) {
      let body; try { body = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
      const rel = path.relative(root, f).replace(/\\/g, '/');
      const cls = classifyFile(rel, body);
      if (cls === 'self') continue;
      const lines = body.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        for (const [kind, lrx] of LITERALS) {
          if (lrx.test(lines[i])) { rows.push({ file: rel, line: i + 1, kind, cls, text: lines[i].trim().slice(0, 110) }); break; }
        }
      }
    }
  }
  const byFile = {};
  for (const r of rows) { (byFile[r.file] = byFile[r.file] || { file: r.file, cls: r.cls, kinds: new Set(), n: 0 }).n++; byFile[r.file].kinds.add(r.kind); }
  const files = Object.values(byFile).map(f => ({ ...f, kinds: [...f.kinds] }));
  const summary = { unrouted: files.filter(f => f.cls === 'unrouted').length, routed: files.filter(f => f.cls === 'routed').length, declared: files.filter(f => f.cls === 'declared').length, eval: files.filter(f => f.cls === 'eval').length, sites: rows.length };
  return { rows, files, summary };
}

// ---------- add / remove ----------
function writeRegistry(r) {
  r.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(REG, JSON.stringify(r, null, 2) + '\n');
  _cache = null;
}
function add(key, fields) {
  const r = JSON.parse(fs.readFileSync(REG, 'utf8'));
  key = String(key).toLowerCase();
  if (r.states[key]) throw new Error('state exists: ' + key + ' — edit system/states.json directly');
  for (const req of ['code', 'permohonan_prefix', 'label']) if (!fields[req]) throw new Error('missing --' + req.replace('permohonan_prefix', 'prefix'));
  const ref = r.states[r.reference_state] || {};
  r.states[key] = {
    label: fields.label, code: fields.code, aliases: [fields.label, fields.code, fields.code.toLowerCase()],
    permohonan_prefix: fields.permohonan_prefix, _unverified: 'created by `states.js add` — every fact below is a placeholder until verified',
    work_scope: fields.work_scope || 'scaffold',
    task_folder: fields.task_folder || null, knowledge_dir: fields.knowledge_dir || key, repo_dir: fields.repo_dir || null,
    modules: fields.repo_dir ? JSON.parse(JSON.stringify(ref.modules || {})) : {},
    branch_prefix: null, ticket_branch: null, bpmn: { prefix: fields.code, root_module: 'PLP' },
    db: { engine: null, mcp: {}, schemas: {}, primary_env: null }, redmine: { project: null, project_names: [] },
    flowable_alter_file: 'FLOWABLE-ALTER.md', local_server: null,
  };
  writeRegistry(r);
  return r.states[key];
}
function remove(key, force) {
  const r = JSON.parse(fs.readFileSync(REG, 'utf8'));
  key = String(key).toLowerCase();
  if (!r.states[key]) throw new Error('no such state: ' + key);
  if (key === r.reference_state) throw new Error('refusing to remove the reference state ' + key);
  if (r.states[key].work_scope === 'active' && !force) throw new Error(key + ' is work_scope=active — pass --force (folders on disk are never touched)');
  const gone = r.states[key];
  delete r.states[key];
  writeRegistry(r);
  return gone;
}

module.exports = { all, get, reference, resolve, require: requireState, requireState, taskFolder, tasksRoot, knowledgeDir, knowledgeRoot, repoPath, trunk, trunkForRepo, stateForPath, stateForPrefix, permohonanRegex, knowledgeReadRegex, isExcluded, mcp, validate, check, add, remove, reload, mainRoot, REG, LOCAL };

// ---------- CLI ----------
if (require.main === module) {
  const [cmd, arg] = process.argv.slice(2);
  const flag = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; };
  const has = (n) => process.argv.includes('--' + n);
  try {
    if (cmd === 'list') {
      for (const s of Object.values(all())) console.log(`${s.key.padEnd(11)} ${s.code.padEnd(4)} ${String(s.permohonan_prefix).padEnd(6)} scope=${s.work_scope.padEnd(9)} task=${s.task_folder || '—'}  knowledge=${s.knowledge_dir}  repo=${s.repo_dir || '—'}  db=${(s.db && s.db.engine) || '—'}`);
    } else if (cmd === 'show') {
      const s = get(arg); if (!s) { console.error('no such state: ' + arg); process.exit(2); }
      console.log(JSON.stringify({ ...s, task_folder_abs: taskFolder(s.key), knowledge_dir_abs: knowledgeDir(s.key) }, null, 2));
    } else if (cmd === 'resolve') {
      const t = process.argv.slice(3).join(' ');
      const r = resolve({ text: t, filePath: t });
      console.log(JSON.stringify({ state: r.state, src: r.src, tried: r.tried }, null, 1));
      process.exit(r.state ? 0 : 1);
    } else if (cmd === 'validate') {
      const keys = arg ? [arg] : Object.keys(all());
      let bad = 0;
      for (const k of keys) { const v = validate(k); console.log(`── ${v.key} ${v.ok ? '✓' : '✗'}`); for (const row of v.rows) console.log(`   ${row[1]} ${row[0].padEnd(16)} ${row[2]}`); if (!v.ok) bad++; }
      process.exit(bad ? 1 : 0);
    } else if (cmd === 'check') {
      const c = check({ root: flag('root') });
      if (has('json')) { console.log(JSON.stringify(c, null, 1)); process.exit(0); }
      console.log(`state-literal check — ${c.summary.sites} site(s) in ${c.files.length} file(s): ${c.summary.unrouted} UNROUTED · ${c.summary.routed} routed · ${c.summary.declared} declared state-only · ${c.summary.eval} eval fixtures`);
      const show = c.files.filter(f => has('all') || f.cls === 'unrouted').sort((a, b) => b.n - a.n);
      for (const f of show) console.log(`  ${f.cls.padEnd(9)} ${String(f.n).padStart(3)}  ${f.file}  [${f.kinds.join(',')}]`);
      process.exit(0);
    } else if (cmd === 'add') {
      const rec = add(arg, { code: flag('code'), permohonan_prefix: flag('prefix'), label: flag('label'), task_folder: flag('task'), knowledge_dir: flag('knowledge'), repo_dir: flag('repo'), work_scope: flag('scope') });
      console.log('added ' + arg + ' → now: node lib/states.js validate ' + arg + '   and   node domain/knowledge-schema-audit/knowledge-schema-audit.js scaffold --state ' + (rec.knowledge_dir));
    } else if (cmd === 'remove') {
      const gone = remove(arg, has('force'));
      console.log('removed ' + arg + ' from the registry (folders untouched): knowledge=' + gone.knowledge_dir + ' task=' + (gone.task_folder || '—'));
    } else {
      console.log('usage: node lib/states.js list | show <key> | resolve <text|path> | validate [key] | check [--json] [--all] | add <key> --code X --prefix PTX --label L [--task F] [--knowledge D] [--repo R] [--scope s] | remove <key> [--force]');
      process.exit(2);
    }
  } catch (e) { console.error('states: ' + e.message); process.exit(2); }
}
