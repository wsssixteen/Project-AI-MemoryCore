#!/usr/bin/env node
// save-rules — born via forge
// symptom: 2026-10-06 miya: have you also finished building the domain expansion to check for Features, Workflows, Tools, etc (all parts of system) to save by checking each part of those things' save rules. Because this is how you will know what is important to be saved for each domain of things we do in a session right? I believe am beginning to see how to structure to make it more deterministic or mechanical so that it won't simply be up to you.
// goal: at session end every system part touched this session is checked against its own kind's declared save rule
// goal_signal: Domain Expansion prints a SAVE-RULES table with one PASS or FAIL row per part touched
// retention: rotate monthly
// footprint: on-demand: one node process plus the evals it runs, under 60 MB, exits when done
//
// Usage: node lib/save-rules.js [--json] [--since <ref>] [--paths a,b] [--quests QA-1,QA-2]
// Rules are declared in system/save-rules.json; this file holds only the check implementations.
// A project folder (kind "projects": projects/coding-projects/active/<Name>/ with project.json) counts as touched when one of
// its files changed today OR its own repo (project.json "repo") has a commit today or uncommitted changes (refined 2026-10-08).
// Exit: 0 no FAIL · 1 any FAIL · 2 bad rules file. Log: lib/save-rules.log.jsonl.
// Test-only: --main-root <dir>, env SAVE_RULES_EVAL_TIMEOUT_MS.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const flag = n => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined; };
const has = n => argv.includes('--' + n);
const csv = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean);
const RULES_FILE = path.join(ROOT, 'system', 'save-rules.json');
const LOG = path.join(ROOT, 'lib', 'save-rules.log.jsonl');
const GATE_LOG = path.join(ROOT, 'domain', 'de-close-gate', 'log.jsonl');
const EVAL_TIMEOUT = Number(process.env.SAVE_RULES_EVAL_TIMEOUT_MS) || 120000;

function mainRootOf(root) {
  try { return require(path.join(__dirname, 'states.js')).mainRoot(root); } catch (_) { return String(root).replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/, ''); }
}
const MAIN_ROOT = path.resolve(flag('main-root') || process.env.SAVE_RULES_MAIN_ROOT || mainRootOf(ROOT));

const norm = p => String(p).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
const abs = (root, rel) => path.join(root, ...norm(rel).split('/'));
const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } };
const exists = p => { try { fs.statSync(p); return true; } catch (_) { return false; } };
const localDate = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const TODAY = localDate(new Date());

// ---------- rules file ----------
function validateConfig(cfg, builtinIds) {
  const errs = [];
  if (!cfg || typeof cfg !== 'object' || !Array.isArray(cfg.kinds) || !cfg.kinds.length) return ['"kinds" must be a non-empty array'];
  const seen = new Set();
  for (const k of cfg.kinds) {
    if (!k || typeof k.kind !== 'string' || !k.kind) { errs.push('a kind has no name'); continue; }
    if (!Array.isArray(k.match) || !k.match.length) errs.push(k.kind + ': "match" must be a non-empty array');
    if (!Array.isArray(k.rules)) errs.push(k.kind + ': "rules" must be an array');
    for (const r of k.rules || []) {
      for (const f of ['id', 'text', 'check', 'source']) if (!r || typeof r[f] !== 'string' || !r[f]) errs.push(k.kind + ': a rule is missing "' + f + '"');
      if (r && r.check && !builtinIds.includes(r.check)) errs.push(k.kind + '/' + r.id + ': unknown check "' + r.check + '"');
      if (r && r.id) { if (seen.has(r.id)) errs.push('duplicate rule id ' + r.id); seen.add(r.id); }
    }
  }
  return errs;
}

// ---------- globs ----------
function globRe(pat) {
  let s = norm(pat).replace(/[.+^${}()|\\]/g, '\\$&');
  s = s.replace(/\*\*\//g, '\u0001').replace(/\*\*/g, '\u0002').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]').replace(/\u0001/g, '(?:.*/)?').replace(/\u0002/g, '.*');
  return new RegExp('^' + s + '(?:/.*)?$');
}
const matchAny = (pats, p) => (pats || []).some(g => globRe(g).test(norm(p)));
function depthOf(pat) { const segs = norm(pat).split('/'); return segs.includes('**') ? null : segs.length; }
function specificity(pat) { const segs = norm(pat).split('/'); return segs.filter(s => s !== '**').length * 1000 + norm(pat).replace(/[*?]/g, '').length; }

function makeClassifier(cfg) {
  const ignores = (cfg.ignore || []).map(globRe);
  const entries = [];
  for (const k of cfg.kinds) for (const m of k.match) entries.push({ kind: k.kind, pat: m, re: globRe(m), depth: depthOf(m), spec: specificity(m) });
  return function classify(p) {
    p = norm(p);
    if (ignores.some(r => r.test(p))) return { ignored: true };
    let best = null;
    for (const e of entries) if (e.re.test(p) && (!best || e.spec > best.spec)) best = e;
    if (!best) return { unmapped: true };
    const segs = p.split('/');
    let part = best.depth ? segs.slice(0, best.depth).join('/') : p;
    part = part.replace(/\.eval\.js$/, '.js');
    return { kind: best.kind, part };
  };
}

// ---------- git ----------
function gitRaw(args) {
  return spawnSync('git', ['-c', 'core.quotepath=false'].concat(args), { cwd: ROOT, encoding: 'utf8', windowsHide: true, maxBuffer: 256 * 1024 * 1024, timeout: 60000 });
}
function git(args) { const r = gitRaw(args); return r.status === 0 ? r.stdout : null; }
let gitOkMemo;
const gitOk = () => (gitOkMemo === undefined ? (gitOkMemo = git(['rev-parse', '--git-dir']) !== null) : gitOkMemo);
function resolveBase() {
  const since = flag('since');
  if (since) return { base: since, how: '--since' };
  for (const t of ['origin/main', 'main']) {
    const mb = git(['merge-base', 'HEAD', t]);
    if (mb && mb.trim()) return { base: mb.trim(), how: 'merge-base ' + t };
  }
  return { base: git(['rev-parse', '--verify', 'HEAD']) ? 'HEAD' : null, how: 'HEAD (no origin/main)' };
}
function gitTouched(base) {
  const out = new Set();
  if (base) { const d = git(['diff', '--name-only', base, 'HEAD']); if (d) for (const l of d.split('\n')) if (l.trim()) out.add(norm(l.trim())); }
  const s = git(['status', '--porcelain', '-z', '-uall']);
  if (s) {
    const ents = s.split('\0');
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i]; if (e.length < 4) continue;
      out.add(norm(e.slice(3)));
      if (e[0] === 'R' || e[0] === 'C') i++;
    }
  }
  return out;
}
function questDirsTouchedToday() {
  const out = new Set();
  const seenRoots = new Set();
  for (const root of [ROOT, MAIN_ROOT]) {
    if (seenRoots.has(root)) continue; seenRoots.add(root);
    const act = path.join(root, 'projects', 'coding-projects', 'active');
    let dirs; try { dirs = fs.readdirSync(act, { withFileTypes: true }); } catch (_) { continue; }
    for (const d of dirs) {
      if (!d.isDirectory() || !/^(QA-\d|ADHOC-|\d{5,7})/.test(d.name)) continue;
      const walk = (dir, rel, depth) => {
        let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
        for (const e of ents) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) { if (depth < 2) walk(p, rel + '/' + e.name, depth + 1); continue; }
          try { if (localDate(fs.statSync(p).mtime) === TODAY) out.add('projects/coding-projects/active/' + d.name + rel + '/' + e.name); } catch (_) {}
        }
      };
      walk(path.join(act, d.name), '', 0);
    }
  }
  return out;
}
// ---------- project folders (kind "projects": a literal path in the rules file whose folder holds project.json) ----------
// A project's code lives in its OWN repo (project.json "repo"), so git in this repo never sees a change to it.
function projectRoot(part) { for (const root of [MAIN_ROOT, ROOT]) if (exists(abs(root, part + '/project.json'))) return root; return exists(abs(MAIN_ROOT, part)) ? MAIN_ROOT : ROOT; }
function readManifest(part) {
  const t = read(abs(projectRoot(part), part + '/project.json'));
  if (t === null) return { missing: true };
  try { const j = JSON.parse(t.replace(/^\uFEFF/, '')); return j && typeof j === 'object' ? { j } : { bad: 'not an object' }; } catch (e) { return { bad: String(e.message).slice(0, 80) }; }
}
function repoGit(repo, args) {
  const r = spawnSync('git', ['-c', 'core.quotepath=false', '-C', repo].concat(args), { encoding: 'utf8', windowsHide: true, timeout: 30000 });
  return r.status === 0 ? String(r.stdout || '') : null;
}
function repoState(repo) {
  if (!repo || !exists(repo)) return null;
  const head = repoGit(repo, ['rev-parse', '--short=7', 'HEAD']);
  if (head === null) return null;
  const date = (repoGit(repo, ['log', '-1', '--format=%cs']) || '').trim();
  const dirty = (repoGit(repo, ['status', '--porcelain']) || '').split('\n').filter(l => l.trim() && !l.startsWith('??')).length;
  return { head: head.trim(), date, dirty };
}
function projectDirsTouchedToday(cfg) {
  const out = new Set();
  const kind = (cfg.kinds || []).find(k => k.kind === 'projects');
  for (const pat of (kind && kind.match) || []) {
    const part = norm(pat);
    if (/[*?]/.test(part)) continue;
    const m = readManifest(part);
    if (!m.j) continue;                                   // not a project folder (for example etanah_atlas)
    const dir = abs(projectRoot(part), part);
    let today = false;
    const walk = (d, rel, depth) => {
      let ents; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (_) { return; }
      for (const e of ents) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (depth < 2) walk(p, rel + '/' + e.name, depth + 1); continue; }
        try { if (localDate(fs.statSync(p).mtime) === TODAY) { out.add(part + rel + '/' + e.name); today = true; } } catch (_) {}
      }
    };
    walk(dir, '', 0);
    const st = repoState(m.j.repo);
    if (!today && st && (st.date === TODAY || st.dirty > 0)) out.add(part + '/project.json');   // the code moved; the documents did not
  }
  return out;
}
function questPart(q) {
  const key = /^\d+$/.test(q) ? 'QA-' + q : q;
  const act = 'projects/coding-projects/active/';
  for (const cand of [key, key.replace(/^QA-/, '')]) if (exists(abs(ROOT, act + cand)) || exists(abs(MAIN_ROOT, act + cand))) return act + cand;
  return act + key;
}

// ---------- quest blocks ----------
function parseBlocks(text) {
  const blocks = []; let cur = [];
  for (const raw of String(text || '').split(/\r?\n/)) { const l = raw.trimEnd(); if (!l.trim()) { if (cur.length) { blocks.push(cur); cur = []; } } else cur.push(l); }
  if (cur.length) blocks.push(cur);
  return blocks;
}
const fieldOf = (block, key) => { for (const line of block) { const s = line.replace(/^\s+/, ''); if (s.startsWith(key + '=')) return s.slice(key.length + 1).trim(); } return null; };
function questKey(part) {
  const name = norm(part).split('/').pop();
  if (/^ADHOC-/.test(name)) return name;
  const m = /^(?:QA-)?(\d{5,7})/.exec(name);
  return m ? 'QA-' + m[1] : name;
}
function findBlock(key) {
  const texts = [];
  for (const root of [MAIN_ROOT, ROOT]) for (const f of ['active.txt', 'active-archive.txt']) { const t = read(path.join(root, 'quest', f)); if (t) texts.push(t); }
  for (const t of texts) for (const b of parseBlocks(t)) { const q = fieldOf(b, 'qa'); if (q === key) return b; }
  return null;
}

// ---------- evals ----------
const quarantine = (() => {
  const m = new Map();
  const t = read(path.join(ROOT, 'system', 'eval-quarantine.jsonl'));
  for (const l of String(t || '').split('\n').filter(Boolean)) { try { const q = JSON.parse(l); m.set(norm(q.eval), q.reason); } catch (_) {} }
  return m;
})();
const evalMemo = new Map();
function runEval(rel) {
  rel = norm(rel);
  if (evalMemo.has(rel)) return evalMemo.get(rel);
  let res;
  if (quarantine.has(rel)) res = { r: 'SKIP', d: 'SKIP (quarantined)' };
  else {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [abs(ROOT, rel)], { cwd: ROOT, encoding: 'utf8', timeout: EVAL_TIMEOUT, windowsHide: true, maxBuffer: 64 * 1024 * 1024, env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: ROOT }) });
    const secs = ((Date.now() - t0) / 1000).toFixed(1) + ' s';
    if (r.error && (r.error.code === 'ETIMEDOUT' || r.signal)) res = { r: 'FAIL', d: rel + ' timeout (' + Math.round(EVAL_TIMEOUT / 1000) + ' s)' };
    else if (r.status === 0) { const m = /(\d+\/\d+) green/.exec(r.stdout || ''); res = { r: 'PASS', d: rel + ' ' + (m ? m[1] + ' green, ' : '') + secs }; }
    else res = { r: 'FAIL', d: rel + ' exit ' + r.status };
  }
  evalMemo.set(rel, res);
  return res;
}
function evalCandidates(part, shape) {
  const dir = path.posix.dirname(part), base = path.posix.basename(part, '.js');
  const list = [];
  const inDomain = n => { try { for (const f of fs.readdirSync(abs(ROOT, 'domain/' + n))) if (/eval.*\.js$/.test(f) && !/eval\.workflow\.js$/.test(f)) list.push('domain/' + n + '/' + f); } catch (_) {} };
  if (shape === 'domain') inDomain(path.posix.basename(part));
  else if (shape === 'hook') { const f = dir + '/' + base + '.eval.js'; if (exists(abs(ROOT, f))) list.push(f); }
  else if (shape === 'skill') { inDomain(path.posix.basename(part)); }
  else { const f = dir + '/' + base + '.eval.js'; if (exists(abs(ROOT, f))) list.push(f); inDomain(base); }
  return [...new Set(list)];
}
function partShape(part) {
  if (/^domain\//.test(part)) return 'domain';
  if (/^\.claude\/hooks\//.test(part)) return 'hook';
  if (/^\.claude\/skills\//.test(part)) return 'skill';
  return 'script';
}

// ---------- stamps and diffs ----------
const STAMP = /(\bversion\b[^\n]{0,12}\d|\bv\d+\.\d+\b|last[ -]updated|^\s*\**updated\s+\d{4}-\d{2}-\d{2})/i;
function inBase(base, rel) { return base ? git(['cat-file', '-e', base + ':' + rel]) !== null : false; }
function addedLines(base, rel) {
  const d = git(['diff', base || 'HEAD', '--', rel]);
  return d ? d.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1)) : [];
}

// ---------- builtin checks: (ctx) => { r: PASS|FAIL|SKIP|NA, d } ----------
const B = {};

B['version-stamp-changed'] = ctx => {
  const only = ctx.args && ctx.args.onlyIfStampExists;
  const bad = [], good = [];
  if (!gitOk()) return { r: 'FAIL', d: 'no git repository to diff against' };
  for (const f of ctx.ruleFiles) {
    const txt = read(abs(ROOT, f));
    if (txt === null) continue;
    if (!txt.split(/\r?\n/).some(l => STAMP.test(l))) { if (only) continue; bad.push(f + ' has no version stamp line'); continue; }
    if (!inBase(ctx.base, f)) { good.push(f + ' (new file)'); continue; }
    if (addedLines(ctx.base, f).some(l => STAMP.test(l))) good.push(f); else bad.push(f + ' stamp not changed');
  }
  if (bad.length) return { r: 'FAIL', d: bad.join('; ') };
  if (!good.length) return { r: 'NA', d: 'no stamp in file' };
  return { r: 'PASS', d: 'stamp changed: ' + good.join(', ') };
};

B['changelog-touched'] = ctx => ctx.touched.has('system/claude-md-changelog.md')
  ? { r: 'PASS', d: 'system/claude-md-changelog.md touched' }
  : { r: 'FAIL', d: 'system/claude-md-changelog.md not touched this session' };

B['folder-map-ok'] = ctx => {
  const bad = [];
  for (const sub of ['map', 'check']) {
    const r = spawnSync(process.execPath, [path.join(__dirname, 'folder-structure.js'), sub, '--root', ROOT], { cwd: ROOT, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (r.status !== 0) bad.push(sub + ' exit ' + r.status + ': ' + String(r.stdout || r.stderr || '').split('\n').find(Boolean));
  }
  return bad.length ? { r: 'FAIL', d: bad.join('; ').slice(0, 220) } : { r: 'PASS', d: 'folder-structure map and check exit 0' };
};

B['save-rules-json-valid'] = ctx => {
  const errs = validateConfig(ctx.cfg, Object.keys(B));
  return errs.length ? { r: 'FAIL', d: errs.join('; ') } : { r: 'PASS', d: ctx.cfg.kinds.length + ' kinds, ' + ctx.cfg.kinds.reduce((n, k) => n + k.rules.length, 0) + ' rules' };
};

B['eval-passes'] = ctx => {
  const shape = partShape(ctx.part);
  const cands = evalCandidates(ctx.part, shape);
  if (!cands.length) return shape === 'skill' ? { r: 'NA', d: 'no paired eval' } : { r: 'FAIL', d: 'no eval found for ' + ctx.part };
  const codeTouched = shape === 'domain'
    ? ctx.files.some(f => /\.(js|json)$/.test(f) && !/(^|\/)(log|goal-log)\.jsonl$/.test(f))
    : true;
  if (!codeTouched) return { r: 'PASS', d: 'eval exists; not re-run (no code file changed)' };
  const rows = cands.map(runEval);
  const fail = rows.find(x => x.r === 'FAIL');
  if (fail) return fail;
  if (rows.every(x => x.r === 'SKIP')) return rows[0];
  return rows.find(x => x.r === 'PASS');
};

B['feature-readme-keys'] = ctx => {
  const rd = read(abs(ROOT, ctx.part + '/README.md'));
  if (rd === null) return { r: 'FAIL', d: 'no README.md' };
  if (/\b(RETIRED|DEREGISTERED|TOMBSTONE)\b/.test(rd.slice(0, 400))) return { r: 'NA', d: 'retired' };
  const missing = ['goal', 'retention', 'footprint'].filter(k => !new RegExp('^\\s*\\**' + k + '\\**\\s*:\\s*\\S', 'mi').test(rd));
  return missing.length ? { r: 'FAIL', d: 'README missing ' + missing.map(k => k + ':').join(' ') } : { r: 'PASS', d: 'goal retention footprint present' };
};

B['feature-new-nuke-marker'] = ctx => {
  if (!exists(abs(ROOT, ctx.part))) return { r: 'NA', d: 'folder gone' };
  const ls = ctx.base ? git(['ls-tree', '-r', '--name-only', ctx.base, '--', ctx.part]) : '';
  if (ls && ls.trim()) return { r: 'NA', d: 'folder existed at base' };
  return exists(abs(ROOT, ctx.part + '/NUKE-MARKER.md')) ? { r: 'PASS', d: 'new folder has NUKE-MARKER.md' } : { r: 'FAIL', d: 'new folder has no NUKE-MARKER.md' };
};

let censusRows = null;
B['feature-census-proper'] = ctx => {
  if (!censusRows) { try { censusRows = require(path.join(__dirname, 'feature-census.js')).collect(); } catch (e) { return { r: 'FAIL', d: 'census failed: ' + e.message }; } }
  const row = censusRows.find(x => norm(x.name) === ctx.part);
  if (!row) return { r: 'NA', d: 'not in census' };
  if (/^GAPS: no log \(unobservable\)$/.test(row.verdict) && MAIN_ROOT !== ROOT && fs.existsSync(abs(MAIN_ROOT, ctx.part + '/log.jsonl'))) return { r: 'PASS', d: 'log lives in the main checkout (ignored by git)' };
  return /^(PROPER|RETIRED)/.test(row.verdict) ? { r: 'PASS', d: row.verdict } : { r: 'FAIL', d: row.verdict };
};

B['skill-frontmatter'] = ctx => {
  const t = read(abs(ROOT, ctx.part + '/SKILL.md'));
  if (t === null) return { r: 'FAIL', d: 'no SKILL.md' };
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(t);
  if (!m) return { r: 'FAIL', d: 'no front matter block' };
  const missing = ['name', 'description'].filter(k => !new RegExp('^' + k + '\\s*:\\s*\\S', 'm').test(m[1]));
  return missing.length ? { r: 'FAIL', d: 'front matter missing ' + missing.join(', ') } : { r: 'PASS', d: 'name and description present' };
};

B['memory-frontmatter'] = ctx => {
  const bad = [];
  for (const f of ctx.ruleFiles) {
    const t = read(abs(ROOT, f)); if (t === null) continue;
    const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(t);
    if (!m) { bad.push(path.posix.basename(f) + ' no front matter'); continue; }
    const missing = ['name', 'description', 'type'].filter(k => !new RegExp('^\\s*' + k + '\\s*:\\s*\\S', 'm').test(m[1]));
    if (missing.length) bad.push(path.posix.basename(f) + ' missing ' + missing.join(', '));
  }
  return bad.length ? { r: 'FAIL', d: bad.join('; ') } : { r: 'PASS', d: 'name description type present' };
};

B['memory-index-line'] = ctx => {
  const idx = read(abs(ROOT, '.claude/auto-memory/MEMORY.md')) || read(abs(MAIN_ROOT, '.claude/auto-memory/MEMORY.md'));
  if (idx === null) return { r: 'FAIL', d: 'MEMORY.md not found' };
  const bad = ctx.ruleFiles.filter(f => !idx.includes('](' + path.posix.basename(f) + ')')).map(f => path.posix.basename(f));
  return bad.length ? { r: 'FAIL', d: 'no MEMORY.md index line for ' + bad.join(', ') } : { r: 'PASS', d: 'MEMORY.md line present' };
};

B['session-line-cap'] = ctx => {
  const t = read(abs(ROOT, ctx.ruleFiles[0] || 'main/current-session.md'));
  if (t === null) return { r: 'NA', d: 'file gone' };
  const n = t.split(/\r?\n/).length;
  return n <= 500 ? { r: 'PASS', d: n + ' lines (cap 500)' } : { r: 'FAIL', d: n + ' lines (cap 500)' };
};

B['diary-template'] = ctx => {
  const bad = [];
  for (const f of ctx.ruleFiles) {
    const t = read(abs(ROOT, f)); if (t === null) continue;
    const missing = ['Sessions', 'Index', 'Closing'].filter(h => !new RegExp('^##\\s+' + h + '\\b', 'm').test(t));
    if (missing.length) bad.push(path.posix.basename(f) + ' missing ## ' + missing.join(', ## '));
  }
  return bad.length ? { r: 'FAIL', d: bad.join('; ') } : { r: 'PASS', d: 'Sessions, Index, Closing present' };
};

function questDocFiles(ctx) {
  const block = findBlock(questKey(ctx.part));
  const rel = block && fieldOf(block, 'qa_doc');
  return { block, rel, main: rel ? abs(MAIN_ROOT, rel) : null, wt: rel ? abs(ROOT, rel) : null };
}
B['quest-block-exists'] = ctx => {
  const key = questKey(ctx.part);
  const block = findBlock(key);
  if (!block) return { r: 'FAIL', d: 'no ' + key + ' block in quest/active.txt or active-archive.txt' };
  const missing = ['status', 'qa_doc'].filter(k => !fieldOf(block, k));
  return missing.length ? { r: 'FAIL', d: key + ' block missing ' + missing.join(', ') } : { r: 'PASS', d: key + ' block ok (status=' + fieldOf(block, 'status') + ')' };
};
B['quest-doc-resolves'] = ctx => {
  const q = questDocFiles(ctx);
  if (!q.block || !q.rel) return { r: 'NA', d: 'no block or qa_doc (see quest-block)' };
  return exists(q.main) || exists(q.wt) ? { r: 'PASS', d: q.rel } : { r: 'FAIL', d: 'qa_doc does not resolve: ' + q.rel };
};
B['quest-doc-dated-today'] = ctx => {
  const q = questDocFiles(ctx);
  if (!q.block || !q.rel) return { r: 'NA', d: 'no block or qa_doc (see quest-block)' };
  const re = new RegExp('^(#{1,6}\\s|\\*\\*)[^\\n]*\\b' + TODAY + '\\b', 'm');
  const texts = [q.main, q.wt].map(read).filter(t => t !== null);
  if (!texts.length) return { r: 'NA', d: 'doc unreadable (see quest-doc-resolves)' };
  return texts.some(t => re.test(t)) ? { r: 'PASS', d: 'heading dated ' + TODAY } : { r: 'FAIL', d: 'no heading dated ' + TODAY + ' in ' + q.rel };
};
B['quest-doc-copies-agree'] = ctx => {
  if (path.resolve(ROOT) === path.resolve(MAIN_ROOT)) return { r: 'NA', d: 'not a worktree' };
  const q = questDocFiles(ctx);
  if (!q.block || !q.rel) return { r: 'NA', d: 'no block or qa_doc (see quest-block)' };
  const a = read(q.main), b = read(q.wt);
  if (a === null && b === null) return { r: 'NA', d: 'doc unreadable (see quest-doc-resolves)' };
  if (a === null) return { r: 'FAIL', d: 'only the worktree copy exists, main has none: ' + q.rel };
  if (b === null) return { r: 'PASS', d: 'main copy only, never copied into this worktree' };
  return a === b ? { r: 'PASS', d: 'main and worktree copies identical' } : { r: 'FAIL', d: 'copies differ (main ' + a.length + ' B, worktree ' + b.length + ' B)' };
};
B['quest-task-folder-exists'] = ctx => {
  const block = findBlock(questKey(ctx.part));
  const tf = block && fieldOf(block, 'task_folder');
  if (!tf) return { r: 'NA', d: 'no task_folder in block' };
  return exists(tf) ? { r: 'PASS', d: 'task folder exists' } : { r: 'FAIL', d: 'task_folder not found: ' + tf };
};

B['kernel-registry-row'] = ctx => {
  const t = read(path.join(ROOT, 'system', 'registry.jsonl'));
  if (t === null) return { r: 'FAIL', d: 'system/registry.jsonl not found' };
  const name = path.posix.basename(ctx.part, '.js');
  for (const l of t.split('\n').filter(Boolean)) {
    let o; try { o = JSON.parse(l); } catch (_) { continue; }
    if (o.name === name || (Array.isArray(o.files) && o.files.some(f => norm(f) === ctx.part))) return { r: 'PASS', d: 'registry row "' + o.name + '"' };
  }
  return { r: 'FAIL', d: 'no registry row for ' + name };
};
B['kernel-header-goal'] = ctx => {
  const t = read(abs(ROOT, ctx.part)); if (t === null) return { r: 'NA', d: 'file gone' };
  const head = t.split(/\r?\n/).slice(0, 25).filter(l => /^\s*(\/\/|\/\*|\*|#(?!!))/.test(l));
  return head.length && head.join(' ').length >= 30 ? { r: 'PASS', d: 'comment header present (' + head.length + ' lines)' } : { r: 'FAIL', d: 'no comment header in the first 25 lines' };
};
B['kernel-has-user'] = ctx => {
  const name = path.posix.basename(ctx.part, '.js');
  const self = new Set([ctx.part, ctx.part.replace(/\.js$/, '.eval.js'), ctx.part.replace(/\.js$/, '.log.jsonl')]);
  const needles = [name + '.js', path.posix.dirname(ctx.part) + '/' + name, name + "'", name + '"'];
  const dirs = ['domain', '.claude/hooks', '.claude/skills', '.claude/settings.json', 'quest', 'core', 'lib', 'Feature'];
  let files = null;
  const g = gitRaw(['grep', '--untracked', '-l', '-F'].concat(...needles.map(n => ['-e', n]), ['--'], dirs.filter(d => exists(abs(ROOT, d)))));
  if (g.status === 0 || g.status === 1) files = String(g.stdout || '').split('\n').filter(Boolean).map(norm);
  else {
    files = [];
    const walk = (rel, depth) => { let ents; try { ents = fs.readdirSync(abs(ROOT, rel), { withFileTypes: true }); } catch (_) { if (/\.(js|json|md)$/.test(rel) && needles.some(n => (read(abs(ROOT, rel)) || '').includes(n))) files.push(rel); return; } for (const e of ents) if (depth < 4 && e.name !== 'node_modules') walk(rel + '/' + e.name, depth + 1); };
    for (const d of dirs) walk(d, 0);
  }
  const users = files.filter(f => !self.has(f) && !/\.log\.jsonl$|log\.jsonl$/.test(f));
  return users.length ? { r: 'PASS', d: 'used by ' + users[0] + (users.length > 1 ? ' +' + (users.length - 1) : '') } : { r: 'FAIL', d: 'no Feature or Workflow file refers to ' + name };
};
B['settings-hooks-resolve'] = ctx => {
  const t = read(abs(ROOT, '.claude/settings.json'));
  if (t === null) return { r: 'NA', d: 'file gone' };
  let j; try { j = JSON.parse(t); } catch (e) { return { r: 'FAIL', d: 'settings.json does not parse: ' + e.message.slice(0, 80) }; }
  const cmds = [];
  (function walk(n) { if (!n || typeof n !== 'object') return; if (typeof n.command === 'string') cmds.push(n.command); for (const k of Object.keys(n)) walk(n[k]); })(j.hooks || {});
  const missing = new Set();
  for (const c of cmds) { const re = /\$\{CLAUDE_PROJECT_DIR\}[\\/]+((?:[\w.-]+[\\/]+)*[\w.-]+\.(?:js|json))/g; let m; while ((m = re.exec(c)) !== null) { const rel = m[1].replace(/\\+/g, '/'); if (!exists(abs(ROOT, rel))) missing.add(rel); } }
  return missing.size ? { r: 'FAIL', d: 'hook file missing: ' + [...missing].slice(0, 4).join(', ') + (missing.size > 4 ? ' +' + (missing.size - 4) : '') } : { r: 'PASS', d: cmds.length + ' hook commands, all files exist' };
};
B['project-owner-row'] = ctx => {
  const t = read(abs(ROOT, 'system/FOLDER-STRUCTURE.md'));
  if (t === null) return { r: 'FAIL', d: 'system/FOLDER-STRUCTURE.md not found' };
  const key = path.posix.basename(ctx.part);
  return t.split(/\r?\n/).some(l => /^\s*\|/.test(l) && l.includes(key)) ? { r: 'PASS', d: 'owner row for ' + key } : { r: 'FAIL', d: 'no owner row for ' + key + ' in FOLDER-STRUCTURE.md' };
};

const PROJECT_DOCS = ['PROJECT.md', 'VERSIONS.md', 'ARCHITECTURE.md', 'PROOFS.md', 'ROADMAP.md'];
B['project-docs-present'] = ctx => {
  const m = readManifest(ctx.part);
  if (m.missing) return { r: 'FAIL', d: 'project.json missing in ' + ctx.part };
  if (m.bad) return { r: 'FAIL', d: 'project.json does not parse: ' + m.bad };
  const bad = [];
  if (typeof m.j.name !== 'string' || !m.j.name) bad.push('project.json has no "name"');
  if (!Array.isArray(m.j.aliases) || !m.j.aliases.length) bad.push('project.json has no "aliases" (the loader finds the project by them)');
  const root = projectRoot(ctx.part);
  const missing = ((ctx.args && ctx.args.docs) || PROJECT_DOCS).filter(f => !exists(abs(root, ctx.part + '/' + f)));
  if (missing.length) bad.push('missing ' + missing.join(', '));
  return bad.length ? { r: 'FAIL', d: bad.join('; ') } : { r: 'PASS', d: 'project.json + ' + PROJECT_DOCS.length + ' documents present' };
};
B['project-docs-current'] = ctx => {
  const m = readManifest(ctx.part);
  if (!m.j) return { r: 'FAIL', d: 'project.json missing or unreadable' };
  if (!m.j.repo) return { r: 'NA', d: 'no own repo' };
  const st = repoState(m.j.repo);
  if (!st) return { r: 'SKIP', d: 'SKIP (repo not on this machine: ' + m.j.repo + ')' };
  const root = projectRoot(ctx.part);
  const versions = read(abs(root, ctx.part + '/VERSIONS.md')) || '';
  const project = read(abs(root, ctx.part + '/PROJECT.md')) || '';
  const bad = [];
  if (!versions.includes(st.head)) bad.push('VERSIONS.md does not name the latest commit ' + st.head + ' (' + st.date + ')');
  const lu = /Last updated:\s*(\d{4}-\d{2}-\d{2})/.exec(project);
  if (!lu) bad.push('PROJECT.md has no "Last updated: YYYY-MM-DD" line');
  else if (st.date && lu[1] < st.date) bad.push('PROJECT.md last updated ' + lu[1] + ', the latest commit is ' + st.date);
  if (st.dirty > 0 && !/^#+\s*Work in progress\b/mi.test(project)) bad.push(st.dirty + ' uncommitted change(s) in ' + m.j.repo + ' and no "Work in progress" section in PROJECT.md');
  return bad.length ? { r: 'FAIL', d: bad.join('; ') } : { r: 'PASS', d: 'VERSIONS.md names ' + st.head + '; PROJECT.md dated ' + lu[1] + (st.dirty ? '; work in progress noted' : '') };
};
B['project-memory-pointer'] = ctx => {
  const dir = abs(MAIN_ROOT, '.claude/auto-memory');
  let files; try { files = fs.readdirSync(dir).filter(f => /\.md$/.test(f) && f !== 'MEMORY.md'); } catch (_) { return { r: 'FAIL', d: '.claude/auto-memory not found' }; }
  const needle = norm(ctx.part).toLowerCase();
  const hit = files.find(f => String(read(path.join(dir, f)) || '').replace(/\\/g, '/').toLowerCase().includes(needle));
  return hit ? { r: 'PASS', d: 'pointed at by .claude/auto-memory/' + hit } : { r: 'FAIL', d: 'no memory note names ' + ctx.part };
};

// ---------- main ----------
function main() {
  const t0 = Date.now();
  const rulesText = read(RULES_FILE);
  if (rulesText === null) { console.error('save-rules: cannot read ' + RULES_FILE); process.exit(2); }
  let cfg; try { cfg = JSON.parse(rulesText); } catch (e) { console.error('save-rules: system/save-rules.json is not valid JSON: ' + e.message); process.exit(2); }
  const errs = validateConfig(cfg, Object.keys(B));
  if (errs.length) { console.error('save-rules: system/save-rules.json is invalid:\n  ' + errs.join('\n  ')); process.exit(2); }
  const classify = makeClassifier(cfg);

  const override = has('paths') || has('since');
  const { base, how } = has('paths') ? { base: flag('since') || 'HEAD', how: '--paths' } : resolveBase();
  let touched;
  if (has('paths')) touched = new Set(csv(flag('paths')).map(norm));
  else { touched = gitTouched(base); for (const p of questDirsTouchedToday()) touched.add(p); for (const p of projectDirsTouchedToday(cfg)) touched.add(p); }
  const extraParts = csv(flag('quests')).map(questPart);

  const parts = new Map();
  const unmapped = new Set(); let ignored = 0;
  const addPart = (kind, part, file) => { const k = kind + '\u0000' + part; if (!parts.has(k)) parts.set(k, { kind, part, files: [] }); if (file) parts.get(k).files.push(file); };
  for (const p of touched) {
    const c = classify(p);
    if (c.ignored) ignored++; else if (c.unmapped) unmapped.add(p); else addPart(c.kind, c.part, p);
  }
  for (const qp of extraParts) { const c = classify(qp + '/x'); if (c.kind) addPart(c.kind, qp, null); }

  const kindDef = Object.fromEntries(cfg.kinds.map(k => [k.kind, k]));
  const rows = [];
  const order = cfg.kinds.map(k => k.kind);
  const sortedParts = [...parts.values()].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.part.localeCompare(b.part));
  for (const p of sortedParts) {
    let applicable = 0;
    for (const rule of kindDef[p.kind].rules) {
      const scope = p.files.length ? p.files : [p.part];
      let ruleFiles = rule.applies ? scope.filter(f => matchAny(rule.applies, f)) : scope.slice();
      if (rule.except) ruleFiles = ruleFiles.filter(f => !matchAny(rule.except, f));
      if (!ruleFiles.length) continue;
      applicable++;
      let res;
      try { res = B[rule.check]({ part: p.part, kind: p.kind, files: p.files, ruleFiles, args: rule.args || {}, base, touched, cfg }); }
      catch (e) { res = { r: 'FAIL', d: 'check crashed: ' + String(e.message).slice(0, 120) }; }
      if (res.r === 'NA') continue;
      rows.push({ kind: p.kind, part: p.part, rule: rule.id, result: res.r, detail: res.d });
    }
    if (!applicable) rows.push({ kind: p.kind, part: p.part, rule: '-', result: 'UNRULED', detail: 'no written save rule found' });
  }

  const count = r => rows.filter(x => x.result === r).length;
  const nPass = count('PASS'), nFail = count('FAIL'), nUnruled = count('UNRULED'), nSkip = count('SKIP');
  const header = 'SAVE-RULES: ' + sortedParts.length + ' part(s) touched · ' + nPass + ' PASS · ' + nFail + ' FAIL · ' + nUnruled + ' UNRULED · ' + nSkip + ' SKIP';
  const rank = { FAIL: 0, UNRULED: 1, SKIP: 2, PASS: 3 };
  rows.sort((a, b) => rank[a.result] - rank[b.result] || order.indexOf(a.kind) - order.indexOf(b.kind) || a.part.localeCompare(b.part));
  const durMs = Date.now() - t0;
  const unmappedList = [...unmapped].sort();

  if (has('json')) console.log(JSON.stringify({ header, base, base_how: how, parts: sortedParts.length, pass: nPass, fail: nFail, unruled: nUnruled, skip: nSkip, rows, unmapped: unmappedList, ignored, dur_ms: durMs }, null, 1));
  else {
    console.log(header);
    console.log('base: ' + (base || 'none') + ' (' + how + ') · ignored: ' + ignored);
    if (rows.length) {
      const w = (k, min) => Math.max(min, ...rows.map(r => String(r[k]).length));
      const W = { kind: w('kind', 4), part: Math.min(w('part', 4), 60), rule: w('rule', 4), result: w('result', 6) };
      const pad = (s, n) => String(s).padEnd(n);
      console.log([pad('kind', W.kind), pad('part', W.part), pad('rule', W.rule), pad('result', W.result), 'detail'].join(' | '));
      for (const r of rows) console.log([pad(r.kind, W.kind), pad(r.part, W.part), pad(r.rule, W.rule), pad(r.result, W.result), r.detail].join(' | '));
    }
    if (unmappedList.length) console.log('unmapped (' + unmappedList.length + '): ' + unmappedList.join(', '));
  }

  const ts = new Date().toISOString();
  try { fs.appendFileSync(LOG, JSON.stringify({ ts, parts: sortedParts.length, pass: nPass, fail: nFail, unruled: nUnruled, skip: nSkip, dur_ms: durMs, partial: override }) + '\n'); } catch (_) {}
  if (exists(path.dirname(GATE_LOG))) { try { fs.appendFileSync(GATE_LOG, JSON.stringify({ ts, action: 'save-rules-ran', parts: sortedParts.length, pass: nPass, fail: nFail, partial: override }) + '\n'); } catch (_) {} }
  process.exit(nFail ? 1 : 0);
}

if (require.main === module) main();
module.exports = { globRe, matchAny, makeClassifier, validateConfig, builtinIds: () => Object.keys(B) };
