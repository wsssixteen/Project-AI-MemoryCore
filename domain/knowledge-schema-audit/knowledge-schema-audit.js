#!/usr/bin/env node
/**
 * knowledge-schema-audit.js — the CLI half of domain/knowledge-schema-audit (born 2026-09-04 via core/forge.js,
 * miya /goal: "keep the folder structure + MD naming identical across etanah-knowledge states so the Quest
 * workflow works between states; make it a memory that is always on and audited").
 *
 * The SCHEMA is projects/coding-projects/active/etanah-knowledge/KNOWLEDGE-SCHEMA.json (single source of truth).
 *
 *   node domain/knowledge-schema-audit/knowledge-schema-audit.js audit [--state <s>] [--json] [--root <main-repo>]
 *   node domain/knowledge-schema-audit/knowledge-schema-audit.js scaffold --state <s> [--dry] [--root <main-repo>]
 *
 * audit    — per state: missing required files/dirs · legacy names (with the canonical target) · un-indexed extras
 *            (a topic file index.md does not name) · flowables-bpmn layout (non-PLP file at root, reserved folder
 *            names). Exit 1 when any drift exists (hook mode uses the library API and never blocks).
 * scaffold — creates every MISSING required file/dir for a state as a skeleton: headings copied from the
 *            reference state (melaka) under the ⚠️ UNVERIFIED-FOR-<STATE> banner (STATE-MIGRATION-PLAYBOOK rule:
 *            copy STRUCTURE freely, never CONTENT). Never overwrites. index.md is generated from the schema.
 *
 * Path resolution is main-repo-aware (the knowledge tree is gitignored and absent from worktrees).
 * Override the knowledge root with env KNOWLEDGE_ROOT (evals) or --root.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
function mainRoot(root) { const m = path.join('.claude', 'worktrees'); const i = root.indexOf(m); return i > 0 ? root.slice(0, i) : root; }
function argOf(name) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined; }
function knowledgeRoot(rootOverride) {
  if (process.env.KNOWLEDGE_ROOT) return process.env.KNOWLEDGE_ROOT;
  const base = rootOverride ? path.resolve(rootOverride) : mainRoot(ROOT);
  return path.join(base, 'projects', 'coding-projects', 'active', 'etanah-knowledge');
}
function loadSchema(kroot) {
  return JSON.parse(fs.readFileSync(path.join(kroot, 'KNOWLEDGE-SCHEMA.json'), 'utf8'));
}
function logLine(row) {
  try { fs.appendFileSync(path.join(__dirname, 'log.jsonl'), JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch (_) {}
}
function moduleOf(key, stateCode) {
  const parts = key.split('_');
  const known = new Set(['MLK', 'KDH', 'PRK', 'TRG', 'SGR', 'WP', stateCode].filter(Boolean));
  return (parts.length > 1 && known.has(parts[0])) ? parts[1] : parts[0];
}

// ---------- audit ----------
function auditState(kroot, schema, state) {
  const dir = path.join(kroot, state);
  const res = { state, dir, exists: fs.existsSync(dir), missing_files: [], missing_dirs: [], legacy: [], unindexed_extras: [], flowables: [], drift: 0 };
  if (!res.exists) { res.drift = 1; return res; }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = new Set(entries.filter(e => e.isFile()).map(e => e.name));
  const dirs = new Set(entries.filter(e => e.isDirectory()).map(e => e.name));
  const required = Object.keys(schema.required_files);
  const optional = new Set(schema.optional_files || []);
  const legacyMap = schema.legacy_names || {};
  for (const f of required) if (!files.has(f)) res.missing_files.push(f);
  for (const d of Object.keys(schema.required_dirs || {})) if (!dirs.has(d)) res.missing_dirs.push(d);
  for (const f of files) if (legacyMap[f]) res.legacy.push({ file: f, canonical: legacyMap[f] });
  // extras: files that are neither required nor optional nor legacy → must be named in index.md
  let indexText = '';
  try { indexText = fs.readFileSync(path.join(dir, 'index.md'), 'utf8'); } catch (_) {}
  const patterns = (schema.allowed_patterns || []).map(p => new RegExp(p));
  for (const f of files) {
    if (schema.required_files[f] || optional.has(f) || legacyMap[f]) continue;
    if (!patterns.some(p => p.test(f))) continue;           // not a knowledge doc shape (e.g. .py, .txt)
    if (!indexText.includes(f)) res.unindexed_extras.push(f);
  }
  // flowables layout
  const fl = path.join(dir, 'flowables-bpmn');
  if (fs.existsSync(fl)) {
    const layout = schema.flowables_layout || {};
    const code = (schema.states[state] || {}).code;
    const reserved = layout.reserved_folder_names || {};
    for (const e of fs.readdirSync(fl, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (reserved[e.name.toUpperCase()]) res.flowables.push({ kind: 'reserved-folder', name: e.name, fix: reserved[e.name.toUpperCase()] });
      } else if (/\.bpmn20.*\.xml$/i.test(e.name)) {
        const key = e.name.split('.bpmn20')[0];
        const mod = moduleOf(key, code);
        if (layout.module_subfolders && mod !== layout.root_module) res.flowables.push({ kind: 'non-root-module-at-root', name: e.name, fix: (reserved[mod] || mod) + '/' });
      }
    }
  }
  res.drift = res.missing_files.length + res.missing_dirs.length + res.legacy.length + res.unindexed_extras.length + res.flowables.length;
  return res;
}
function auditAll(kroot, schema, only) {
  const states = only ? [only] : Object.keys(schema.states);
  return states.map(s => auditState(kroot, schema, s));
}
function renderLine(r, schema) {
  const total = Object.keys((schema || loadedSchema || { required_files: {} }).required_files).length;
  if (!r.exists) return `${r.state.padEnd(11)} 🚨 folder missing → scaffold --state ${r.state}`;
  if (!r.drift) return `${r.state.padEnd(11)} ✅ canonical`;
  const bits = [];
  if (r.missing_files.length) bits.push(`missing ${r.missing_files.length}/${total} required: ${r.missing_files.join(', ')}`);
  if (r.missing_dirs.length) bits.push(`missing dirs: ${r.missing_dirs.join(', ')}`);
  if (r.legacy.length) bits.push('legacy names: ' + r.legacy.map(l => `${l.file}→${l.canonical}`).join(', '));
  if (r.unindexed_extras.length) bits.push('extras not in index.md: ' + r.unindexed_extras.join(', '));
  if (r.flowables.length) bits.push('flowables: ' + r.flowables.map(f => `${f.name} [${f.kind} → ${f.fix}]`).join(', '));
  return `${r.state.padEnd(11)} ⚠️ ${r.drift} drift — ` + bits.join(' · ');
}
let loadedSchema = null;

// ---------- scaffold ----------
function headingsOf(file) {
  try { return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(l => /^##? /.test(l)).slice(0, 40); } catch (_) { return []; }
}
function scaffoldState(kroot, schema, state, dry) {
  const dir = path.join(kroot, state);
  const ref = path.join(kroot, schema.reference_state);
  const STATE = state.toUpperCase();
  const date = new Date().toISOString().slice(0, 10);
  const banner = (file) => (schema.unverified_banner || '').replace(/\{STATE\}/g, STATE).replace(/\{DATE\}/g, date).replace(/\{FILE\}/g, file);
  const created = [];
  const mk = (p, content) => { if (fs.existsSync(p)) return; if (!dry) fs.writeFileSync(p, content); created.push(path.relative(kroot, p)); };
  if (!fs.existsSync(dir) && !dry) fs.mkdirSync(dir, { recursive: true });
  for (const d of Object.keys(schema.required_dirs || {})) { const p = path.join(dir, d); if (!fs.existsSync(p)) { if (!dry) fs.mkdirSync(p, { recursive: true }); created.push(path.relative(kroot, p) + '/'); } }
  for (const [f, scope] of Object.entries(schema.required_files)) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) continue;
    if (f === 'index.md') {
      const rows = Object.entries(schema.required_files).map(([g, s]) => `| [${g}](${g}) | ${s} | ${fs.existsSync(path.join(dir, g)) || g === 'index.md' ? '⬜ skeleton' : '⬜ skeleton'} |`).join('\n');
      const dirsRows = Object.entries(schema.required_dirs || {}).map(([g, s]) => `| \`${g}/\` | ${s} | ⬜ |`).join('\n');
      mk(p, `# etanah-knowledge / ${state} — Navigation Index\n\n> Entry point for all ${STATE} etanah knowledge. Load at Quest Phase 0 for any ${STATE} ticket. Layout = \`../KNOWLEDGE-SCHEMA.json\` (identical across states so the quest workflow resolves the same file names everywhere). Audit: \`node domain/knowledge-schema-audit/knowledge-schema-audit.js audit --state ${state}\`.\n>\n> Files carrying \`⚠️ UNVERIFIED-FOR-${STATE}\` are SCAFFOLD, not truth — verify against a ${state} source, then lift the banner (see ../STATE-MIGRATION-PLAYBOOK.md).\n\n## Knowledge files\n\n| File | Scope | Status |\n|---|---|---|\n${rows}\n${dirsRows}\n\n## Extras (state-specific topic files — every extra MUST be listed here or the audit flags it)\n\n| File | Scope | Status |\n|---|---|---|\n`);
      continue;
    }
    if (f === 'STATE-FACTS.md') {
      mk(p, `# STATE-FACTS — ${STATE}\n\n${banner(f)}\n\n> ALL verified ${STATE} facts live here (one place; index.md mirrors headline rows). Grow it as work touches each area.\n\n## 1. Database — engine · MCP servers · schemas\n\n## 2. Git — remotes · state prefix · baseline branch · env branches\n\n## 3. Hosts — PROD / staging / internal URLs · Flowable admin + modeler\n\n## 4. Redmine — projects · trackers · Task-folder routing\n\n## 5. ID shapes — permohonan prefix · user-email domain · version suffix\n\n## 6. Module scope — which WARs this state's tickets touch\n\n## 7. Verified precedents (ticket → fact)\n`);
      continue;
    }
    const heads = headingsOf(path.join(ref, f));
    mk(p, `# ${f.replace(/\.md$/, '')} — ${STATE}\n\n${banner(f)}\n\n` + (heads.length ? heads.map(h => h + '\n\n_(to fill)_\n').join('\n') : '## (headings to be established as ' + state + ' work touches this area)\n'));
  }
  logLine({ cmd: 'scaffold', state, dry: !!dry, created });
  return created;
}

// ---------- state resolution (used by ticket-gate to route the knowledge dir) ----------
// Resolves an active.txt `state=` value (e.g. "Perak", "Putrajaya") or a permohonan prefix ("PTPK") to the
// folder name under etanah-knowledge/. Returns null when unknown — callers fall back to the reference state.
function stateDirFor(nameOrPrefix, schema) {
  if (!nameOrPrefix) return null;
  const v = String(nameOrPrefix).trim();
  for (const [dir, s] of Object.entries(schema.states || {})) {
    if (dir.toLowerCase() === v.toLowerCase()) return dir;
    if ((s.aliases || []).some(a => a.toLowerCase() === v.toLowerCase())) return dir;
    if (s.permohonan_prefix && v.toUpperCase().startsWith(s.permohonan_prefix)) return dir;
  }
  return null;
}

module.exports = { knowledgeRoot, loadSchema, auditState, auditAll, renderLine, scaffoldState, moduleOf, stateDirFor };

if (require.main === module) {
  const cmd = process.argv[2];
  const kroot = knowledgeRoot(argOf('root'));
  let schema;
  try { schema = loadSchema(kroot); } catch (e) { console.error('knowledge-schema-audit: cannot read KNOWLEDGE-SCHEMA.json under ' + kroot + ' — ' + e.message); process.exit(2); }
  loadedSchema = schema;
  if (cmd === 'audit') {
    const results = auditAll(kroot, schema, argOf('state'));
    if (process.argv.includes('--json')) console.log(JSON.stringify(results, null, 1));
    else { console.log('knowledge-schema-audit — ' + kroot); for (const r of results) console.log('  ' + renderLine(r)); }
    const drift = results.reduce((n, r) => n + r.drift, 0);
    logLine({ cmd: 'audit', states: results.length, drift });
    process.exit(drift ? 1 : 0);
  } else if (cmd === 'scaffold') {
    const state = argOf('state');
    if (!state || !schema.states[state]) { console.error('scaffold: --state must be one of ' + Object.keys(schema.states).join(', ')); process.exit(2); }
    const created = scaffoldState(kroot, schema, state, process.argv.includes('--dry'));
    console.log((process.argv.includes('--dry') ? 'would create' : 'created') + ' ' + created.length + ' item(s) for ' + state + (created.length ? ':\n  ' + created.join('\n  ') : ''));
  } else {
    console.log('usage: knowledge-schema-audit.js audit [--state s] [--json] [--root r] | scaffold --state s [--dry] [--root r]');
    process.exit(2);
  }
}
