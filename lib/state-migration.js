#!/usr/bin/env node
// state-migration — born via forge
// symptom: 2026-10-14 Penang set up without discovery check #8 (Flowables source); Ruri said the Penang BPMN cannot be read while the modeler was reachable; no reference state recorded (miya: Penang refers to Melaka, Melaka refers to Terengganu)
// goal: every state's knowledge comes from a declared reference state through mechanical gates, and every copied file has a ledger row (source, hash, tier, status) so nothing unverified is reported as set up
// goal_signal: audit --state <s> shows zero UNKNOWN gates and every migrated file as verified, unverified or source-changed
// retention: keep (<state>/MIGRATION-LEDGER.json) · rotate monthly (system/telemetry/state-migration.jsonl)
// footprint: on-demand: 1 node process per call, ~40 MB, exits after printing
//
// USAGE
//   node lib/state-migration.js chain   --state <s>
//   node lib/state-migration.js gates   --state <s> [--json]           exit 1 when a gate is FAIL or UNKNOWN
//   node lib/state-migration.js migrate --state <s> [--from <ref>] [--dry-run]
//   node lib/state-migration.js audit   (--state <s> | --all) [--json]  exit 1 on a FAIL/UNKNOWN gate or a source-changed file
//   node lib/state-migration.js verify  --state <s> --file <FILE> --evidence "<what proved it>"
//   node lib/state-migration.js check   --state <s> --file <FILE> --verdict HOLDS_WITH_CORRECTIONS|MOSTLY_MELAKA_ONLY|NEEDS_DB --evidence "<what was compared>"
// The method (tiers, discovery checks) is etanah-knowledge/STATE-MIGRATION-PLAYBOOK.md; this file makes it mechanical.
// Eval overrides: STATES_FILE · KNOWLEDGE_ROOT · STATE_MIGRATION_LOG · STATE_MIGRATION_NO_GIT=1 · STATE_MIGRATION_DATE
// state-scoped: yes, keyed by the registry record and its refers_to; no state literal in this file.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const S = require('./states.js');
const LOG = process.env.STATE_MIGRATION_LOG || path.join(ROOT, 'system', 'telemetry', 'state-migration.jsonl');
const LEDGER = 'MIGRATION-LEDGER.json';
const TODAY = process.env.STATE_MIGRATION_DATE || new Date().toISOString().slice(0, 10);

// Tier per file (STATE-MIGRATION-PLAYBOOK.md "Tier every source file"). needs = gates that must hold for a
// tier-A body copy; a failed need demotes the file to B (headings only). Never copied: index.md (the target
// owns it), flowables-bpmn/ (a state's processes are its own), urusan/ (precedents), *.jsonl indexes.
const TIERS = {
  'FLOWABLE-KNOWLEDGE.md': { tier: 'A', needs: [] },
  'DOMAIN-GLOSSARY.md': { tier: 'A', needs: [] },
  'ADHOC-TRIAGE.md': { tier: 'A', needs: [] },
  'DEV-TESTING-HACKS.md': { tier: 'A', needs: ['code'] },
  'JSF-WIRING.md': { tier: 'A', needs: ['code'] },
  'FRONTEND-PATTERNS.md': { tier: 'A', needs: ['code'] },
  'WORD-TEMPLATE-RENDERING.md': { tier: 'A', needs: ['code'] },
  'JASPER-REPORTS.md': { tier: 'A', needs: ['code'] },
  'URUSAN-FLOW.md': { tier: 'A', needs: ['code'] },
  'FLOWABLE-WORKFLOWS.md': { tier: 'A', needs: ['code'] },
  'EMEL-NOTIFIKASI.md': { tier: 'A', needs: ['code'] },
  'MODULE-ARCHITECTURE.md': { tier: 'A', needs: ['code'] },
  'GIT-REPO-HYGIENE.md': { tier: 'A', needs: ['remote'] },
  'DATABASE.md': { tier: 'A', needs: ['db', 'code'] },
  'STATE-FACTS.md': { tier: 'B' },
  'ENV-ARCHITECTURE.md': { tier: 'B' },
  'BRANCH-AND-DEPLOY.md': { tier: 'B' },
  'PERANAN-MAP.md': { tier: 'B' },
  'TEST-PERMOHONAN-INDEX.md': { tier: 'B' },
  'FLOWABLE-ALTER.md': { tier: 'B' },
  'ADHOC-REGISTER.md': { tier: 'C' },
  'BUG-BESTIARY.md': { tier: 'C' },
  'LATENT-BUGS.md': { tier: 'C' },
  'DEFERRED-CRITICAL-ISSUES.md': { tier: 'C' },
};
const NEVER = new Set(['index.md', LEDGER]);

// ── helpers ─────────────────────────────────────────────────────────────────
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const readText = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } };
const prefixOf = (code) => code ? code[0].toUpperCase() + code.slice(1).toLowerCase() : null;
function arg(name) { const i = process.argv.indexOf('--' + name); return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null; }
const flag = (name) => process.argv.includes('--' + name);
function logRow(row) { try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch (_) {} }

function countJava(dir, prefix, cap) {
  let n = 0; const stack = [dir];
  while (stack.length && n < cap) {
    const d = stack.pop(); let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (_) { continue; }
    for (const e of ents) {
      if (e.isDirectory()) { if (e.name !== 'target' && e.name !== '.git' && e.name !== '.codegraph') stack.push(path.join(d, e.name)); }
      else if (e.name.startsWith(prefix) && e.name.endsWith('.java')) n++;
    }
  }
  return n;
}
function originHost(repo) {
  if (process.env.STATE_MIGRATION_NO_GIT === '1') return null;
  try {
    const u = execFileSync('git', ['-C', repo, 'remote', 'get-url', 'origin'], { encoding: 'utf8', timeout: 8000, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const m = u.match(/@([^:/]+)[:/]/) || u.match(/\/\/([^/:]+)/);
    return m ? m[1] : u;
  } catch (_) { return null; }
}
// A target file is still a skeleton when everything left after banners, headings and placeholders is empty.
function isSkeleton(text) {
  if (text == null) return true;
  const body = text.split(/\r?\n/).filter(l => {
    const t = l.trim();
    return t && !t.startsWith('#') && !/UNVERIFIED-FOR-/.test(t) && t !== '_(to fill)_' && !/^>\s*$/.test(t);
  });
  return body.length === 0;
}

// ── chain + gates ───────────────────────────────────────────────────────────
function chain(key) {
  const seen = []; let k = key;
  while (k && !seen.includes(k)) { seen.push(k); const r = S.get(k); k = r ? (r.refers_to || null) : null; }
  return { path: seen, loop: !!(k && seen.includes(k)) ? k : null };
}

function gates(key) {
  const t = S.get(key);
  if (!t) throw new Error('state not registered: ' + key + ' (node lib/states.js add …)');
  const rows = [];
  const push = (id, name, verdict, evidence) => rows.push({ id, name, verdict, evidence });
  const ref = t.refers_to ? S.get(t.refers_to) : null;

  // G1 reference declared (a declared root — refers_to_root: true — is the start of the chain, not a gap)
  if (!t.refers_to && t.refers_to_root) push('G1', 'reference state', 'PASS', `root of the chain: ${t.refers_to_note || 'declared root'}`);
  else if (!t.refers_to) push('G1', 'reference state', 'UNKNOWN', `${t.label} has no refers_to in system/states.json: ask miya which state its project was built from`);
  else if (!ref) push('G1', 'reference state', 'FAIL', `refers_to "${t.refers_to}" is not a registered state`);
  else if (ref.key === t.key) push('G1', 'reference state', 'FAIL', 'refers_to points at itself');
  else { const c = chain(t.key); push('G1', 'reference state', 'PASS', `${c.path.map(k => S.get(k).label).join(' → ')}${c.loop ? ' → ' + S.get(c.loop).label + ' (loop)' : ''}${t.refers_to_note ? ' · ' + t.refers_to_note : ''}`); }

  // G2 same DB engine
  const te = t.db && t.db.engine, re = ref && ref.db && ref.db.engine;
  const isRoot = !t.refers_to && t.refers_to_root;
  if (isRoot) push('G2', 'same DB engine', 'PASS', `root state (${te || 'engine ?'}): nothing to compare`);
  else if (!ref) push('G2', 'same DB engine', 'UNKNOWN', 'no reference state');
  else if (!te || !re) push('G2', 'same DB engine', 'UNKNOWN', `engine ${t.label}=${te || '?'} · ${ref.label}=${re || '?'}`);
  else if (te === re) push('G2', 'same DB engine', 'PASS', `both ${te}: ${ref.label} SQL recipes may carry over, still UNVERIFIED`);
  else push('G2', 'same DB engine', 'WARN', `${t.label}=${te} · ${ref.label}=${re}: DATABASE.md is headings only, no SQL is copied`);

  // G3 same code family (the reference state's class family + config dir live in the target's repo)
  const repo = S.repoPath(t.key, 'pelupusan');
  if (isRoot) push('G3', 'same codebase', 'PASS', 'root state: nothing to compare');
  else if (!ref) push('G3', 'same codebase', 'UNKNOWN', 'no reference state');
  else if (!repo || !fs.existsSync(repo)) push('G3', 'same codebase', 'UNKNOWN', `no pelupusan checkout for ${t.label} (${repo || 'repo_dir not set'})`);
  else {
    const refCfg = fs.existsSync(path.join(repo, 'src', 'main', 'resources', 'config', ref.code));
    const ownCfg = fs.existsSync(path.join(repo, 'src', 'main', 'resources', 'config', t.code));
    const refN = countJava(path.join(repo, 'src'), prefixOf(ref.code), 100000);
    const ownN = countJava(path.join(repo, 'src'), prefixOf(t.code), 100000);
    const ev = `${repo}: config/${ref.code} ${refCfg ? 'present' : 'absent'}, ${refN} ${prefixOf(ref.code)}*.java · own config/${t.code} ${ownCfg ? 'present' : 'absent'}, ${ownN} ${prefixOf(t.code)}*.java`;
    push('G3', 'same codebase', refCfg && refN > 0 ? 'PASS' : 'WARN', refCfg && refN > 0 ? 'shared codebase: ' + ev : 'separate codebase: code-shaped files are headings only · ' + ev);
  }

  // G4 same git server
  const refRepo = ref ? S.repoPath(ref.key, 'pelupusan') : null;
  const th = repo && fs.existsSync(repo) ? originHost(repo) : null, rh = refRepo && fs.existsSync(refRepo) ? originHost(refRepo) : null;
  if (isRoot) push('G4', 'same git server', 'PASS', 'root state: nothing to compare');
  else if (!ref) push('G4', 'same git server', 'UNKNOWN', 'no reference state');
  else if (!th || !rh) push('G4', 'same git server', 'UNKNOWN', `origin host ${t.label}=${th || '?'} · ${ref.label}=${rh || '?'}`);
  else push('G4', 'same git server', th === rh ? 'PASS' : 'WARN', `${t.label}=${th} · ${ref.label}=${rh}`);

  // G5 Flowable source (playbook discovery check #8 — the one skipped for Penang)
  const kdir = S.knowledgeDir(t.key);
  const man = kdir && readText(path.join(kdir, 'flowables-bpmn', '_manifest.json'));
  let manN = 0; try { manN = man ? JSON.parse(man).length : 0; } catch (_) {}
  const fsrc = t.flowable_source || {};
  if (manN > 0) push('G5', 'Flowable source', 'PASS', `flowables-bpmn/_manifest.json: ${manN} models${fsrc.modeler ? ' · modeler ' + fsrc.modeler : ''}`);
  else if (fsrc.modeler) push('G5', 'Flowable source', 'WARN', `modeler ${fsrc.modeler} declared, not exported yet: ${fsrc.how || 'export per melaka/FLOWABLE-KNOWLEDGE.md §12 (miya logs in)'}`);
  else push('G5', 'Flowable source', 'FAIL', 'no Flowable source known: find the modeler (/flowable-ui/modeler/ on the state hosts) or the engine DB, then set flowable_source in system/states.json');

  // G6 DB connection
  const mcp = Object.entries((t.db && t.db.mcp) || {});
  push('G6', 'DB connection', mcp.length ? 'PASS' : 'FAIL', mcp.length ? mcp.map(([e, m]) => `${e}=${m}`).join(' · ') : `no DB connection in the registry${t.db && t.db.note ? ': ' + t.db.note : ''}`);

  // G7 knowledge folder canonical
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'domain', 'knowledge-schema-audit', 'knowledge-schema-audit.js'), 'audit', '--state', t.knowledge_dir], { encoding: 'utf8', timeout: 30000, windowsHide: true, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    push('G7', 'knowledge folder canonical', 'PASS', `${t.knowledge_dir}/ passes knowledge-schema-audit`);
  } catch (e) { push('G7', 'knowledge folder canonical', 'FAIL', String((e.stdout || '') + (e.stderr || '')).trim().split('\n').slice(-3).join(' | ') || e.message); }

  // G8 Task folder
  const tf = S.taskFolder(t.key);
  push('G8', 'Task folder', tf && fs.existsSync(tf) ? 'PASS' : 'FAIL', tf || 'task_folder not set');

  // G9 ticket import routes the state's Redmine projects to its Task folder
  const names = ((t.redmine && t.redmine.project_names) || []).slice(0, 4);
  if (!names.length) push('G9', 'ticket import routing', 'UNKNOWN', 'no redmine.project_names in the registry');
  else {
    let bad = [];
    try {
      const { taskBaseFor } = require(path.join(ROOT, 'quest', 'redmine-sync.js'));
      bad = names.filter(n => path.basename(taskBaseFor({ project: { name: n } })) !== t.task_folder);
    } catch (e) { bad = ['redmine-sync not loadable: ' + e.message]; }
    push('G9', 'ticket import routing', bad.length ? 'FAIL' : 'PASS', bad.length ? 'routes elsewhere: ' + bad.join(' · ') : `${names.join(' · ')} → 1. Tasks\\${t.task_folder}`);
  }

  // G10 code index per module
  const mods = Object.keys(t.modules || {});
  if (!t.repo_dir || !mods.length) push('G10', 'code index', 'UNKNOWN', 'no repo_dir / modules');
  else {
    const missing = mods.filter(m => { const p = S.repoPath(t.key, m); return !p || !fs.existsSync(path.join(p, '.codegraph')); });
    push('G10', 'code index', missing.length ? 'WARN' : 'PASS', missing.length ? `no .codegraph in: ${missing.join(', ')} (codegraph init -i <repo>)` : `${mods.length} of ${mods.length} repos indexed`);
  }
  return { state: t.key, label: t.label, refers_to: t.refers_to || null, rows };
}

// ── ledger ──────────────────────────────────────────────────────────────────
function ledgerPath(key) { return path.join(S.knowledgeDir(key), LEDGER); }
function loadLedger(key) { const t = readText(ledgerPath(key)); try { return t ? JSON.parse(t) : null; } catch (_) { return null; } }
function saveLedger(key, led) { fs.writeFileSync(ledgerPath(key), JSON.stringify(led, null, 2) + '\n'); }

function migratedBanner(t, ref, file, info) {
  return `> ⚠️ UNVERIFIED-FOR-${t.label.toUpperCase()} — migrated ${TODAY} from ${ref.knowledge_dir}/${file} by lib/state-migration.js (tier A${info.needs && info.needs.length ? ', gates ' + info.needs.join('+') + ' held' : ''}). Every line below is ${ref.label}'s; nothing is a fact for ${t.label} until checked against a ${t.label} source. When checked: node lib/state-migration.js verify --state ${t.key} --file ${file} --evidence "<source>"`;
}
function headingsOnly(t, ref, file, srcText, why) {
  const heads = srcText.split(/\r?\n/).filter(l => /^#{1,3}\s/.test(l));
  return [`# ${file.replace(/\.md$/, '')} — ${t.label.toUpperCase()}`, '', `> ⚠️ UNVERIFIED-FOR-${t.label.toUpperCase()} — skeleton created ${TODAY} by lib/state-migration.js (headings copied from ${ref.knowledge_dir}/${file}${why ? '; ' + why : ''}). Nothing below is a fact for ${t.label} until verified against a ${t.label} source.`, '']
    .concat(heads.slice(1).flatMap(h => [h, '', '_(to fill)_', ''])).join('\n');
}
// Tier C keeps the reference's FORMAT (headings + each table's header and separator rows), never its rows.
function emptyRegister(t, ref, file, srcText) {
  const out = [`# ${file.replace(/\.md$/, '')} — ${t.label.toUpperCase()}`, '', `> Register for ${t.label} only. Rows come from ${t.label} tickets; rows are never copied from another state (format from ${ref.knowledge_dir}/${file}, lib/state-migration.js tier C, ${TODAY}).`, ''];
  const lines = srcText.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^#{1,3}\s/.test(l)) out.push(l, '');
    else if (/^\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1]) && !/^\|.*\|\s*$/.test(lines[i - 1] || '')) out.push(l, lines[i + 1], '');
  }
  return out.join('\n');
}

function insertIntoExtras(text, rows) {
  const lines = text.split(/\r?\n/);
  const h = lines.findIndex(l => /^##\s+Extras/i.test(l));
  if (h < 0) return text.replace(/\s*$/, '') + '\n\n## Extras\n\n| File | Scope | Status |\n|---|---|---|\n' + rows.join('\n') + '\n';
  let i = h + 1;
  while (i < lines.length && !/^\|/.test(lines[i]) && !/^##\s/.test(lines[i])) i++;
  if (i >= lines.length || /^##\s/.test(lines[i])) { lines.splice(h + 1, 0, '', '| File | Scope | Status |', '|---|---|---|', ...rows); return lines.join('\n'); }
  while (i < lines.length && /^\|/.test(lines[i])) i++;
  lines.splice(i, 0, ...rows);
  return lines.join('\n');
}

function migrate(key, opts) {
  const t = S.get(key);
  const g = gates(key);
  const G = Object.fromEntries(g.rows.map(r => [r.id, r]));
  if (G.G1.verdict !== 'PASS') return { refused: 'G1 ' + G.G1.verdict + ': ' + G.G1.evidence, gates: g };
  if (!t.refers_to) return { refused: `${t.label} is a root state: there is no reference to migrate from`, gates: g };
  if (opts.from && opts.from !== t.refers_to) return { refused: `--from ${opts.from} is not ${t.label}'s declared reference (${t.refers_to}); change refers_to in system/states.json first`, gates: g };
  const ref = S.get(t.refers_to);
  const held = { db: G.G2.verdict === 'PASS', code: G.G3.verdict === 'PASS', remote: G.G4.verdict === 'PASS' };
  const sdir = S.knowledgeDir(ref.key), tdir = S.knowledgeDir(t.key);
  if (!sdir || !fs.existsSync(sdir)) return { refused: `reference folder missing: ${sdir}`, gates: g };
  if (!opts.dryRun) fs.mkdirSync(tdir, { recursive: true });
  const led = loadLedger(key) || { state: t.key, refers_to: ref.key, created: TODAY, runs: [], files: {} };
  const srcFiles = fs.readdirSync(sdir).filter(f => f.endsWith('.md'));
  const names = [...new Set(srcFiles.concat(Object.keys(TIERS)))].sort();
  const plan = [];
  for (const f of names) {
    if (NEVER.has(f)) continue;
    const src = readText(path.join(sdir, f));
    const tgtPath = path.join(tdir, f), tgt = readText(tgtPath);
    const info = TIERS[f];
    let row;
    const prev = led.files[f];
    if (prev && ['unverified', 'skeleton', 'verified'].includes(prev.status) && tgt != null) {
      // already migrated: the ledger row is the provenance, a re-run never replaces it
      plan.push(Object.assign({}, prev, { file: f, treatment: 'already migrated ' + (prev.written || '') + ', left as is' }));
      continue;
    }
    if (src == null) row = { file: f, tier: info ? info.tier : '-', treatment: 'absent-in-reference', status: 'not-copied' };
    else if (!info && tgt != null) row = { file: f, tier: '-', treatment: `${t.label} has its own ${f}; not in the tier table, left as is`, status: 'kept-target' };
    else if (!info) row = { file: f, tier: '-', treatment: `${ref.label}-only topic, not in the tier table`, status: 'not-copied' };
    else if (tgt != null && !isSkeleton(tgt)) row = { file: f, tier: info.tier, treatment: `kept ${t.label}'s own content; ${ref.label}'s copy stays at ${ref.knowledge_dir}/${f}`, status: 'kept-target' };
    else {
      let tier = info.tier, why = '';
      const failed = (info.needs || []).filter(n => !held[n]);
      if (tier === 'A' && failed.length) { tier = 'B'; why = 'demoted from A: gate ' + failed.join('+') + ' did not hold'; }
      const body = tier === 'A' ? migratedBanner(t, ref, f, info) + '\n\n' + src.replace(/^﻿/, '')
        : tier === 'B' ? headingsOnly(t, ref, f, src, why) : emptyRegister(t, ref, f, src);
      if (!opts.dryRun) fs.writeFileSync(tgtPath, body);
      row = { file: f, tier, treatment: tier === 'A' ? 'body copied under the banner' : tier === 'B' ? 'headings only' + (why ? ' (' + why + ')' : '') : 'empty register', status: tier === 'A' ? 'unverified' : 'skeleton', source_sha256: sha(src), written_sha256: sha(body), written: TODAY };
    }
    plan.push(row);
    if (!opts.dryRun) led.files[f] = row;
  }
  if (!opts.dryRun) {
    led.runs.push({ date: TODAY, cmd: 'migrate', from: ref.key, gates: g.rows.map(r => `${r.id} ${r.verdict}`) });
    saveLedger(key, led);
    // index.md is the target's own file: rows go into its "## Extras" table (end of file when it has none).
    const idx = path.join(tdir, 'index.md'); const it = readText(idx);
    if (it != null) {
      const add = [];
      for (const p of plan) if ((p.status === 'unverified' || p.status === 'skeleton') && !it.includes(p.file)) add.push(`| [${p.file}](${p.file}) | ${p.tier === 'A' ? 'Migrated from ' + ref.label + ' (' + ref.knowledge_dir + '/' + p.file + '): UNVERIFIED for ' + t.label : p.treatment + ' from ' + ref.label} | ${p.tier === 'A' ? '⚠️ unverified' : '⬜ skeleton'} |`);
      if (!it.includes(LEDGER)) add.push(`| [${LEDGER}](${LEDGER}) | Migration ledger: every file copied from ${ref.label} with its tier, source hash and status (lib/state-migration.js audit --state ${t.key}) | generated ${TODAY} |`);
      if (add.length) fs.writeFileSync(idx, insertIntoExtras(it, add));
    }
  }
  return { gates: g, plan, dryRun: !!opts.dryRun };
}

function audit(key) {
  const g = gates(key);
  const led = loadLedger(key);
  const files = [];
  if (led) {
    const t = S.get(key), ref = S.get(led.refers_to);
    for (const [f, r] of Object.entries(led.files)) {
      let status = r.status;
      if (r.source_sha256 && ref) { const s = readText(path.join(S.knowledgeDir(ref.key), f)); if (s != null && sha(s) !== r.source_sha256 && status !== 'verified') status = 'source-changed'; }
      if ((status === 'unverified' || status === 'checked') && r.written_sha256) { const cur = readText(path.join(S.knowledgeDir(t.key), f)); if (cur != null && sha(cur) !== r.written_sha256) status = status === 'checked' ? 'edited-after-check' : 'edited-not-verified'; }
      if (status === 'checked' && r.check_verdict) status = 'checked:' + r.check_verdict;
      files.push({ file: f, tier: r.tier, status, evidence: r.evidence || '' });
    }
  }
  return { gates: g, ledger: !!led, files };
}

function verify(key, file, evidence) {
  if (!evidence || evidence.trim().length < 15 || /^(ok|done|checked|verified|yes)\.?$/i.test(evidence.trim())) throw new Error('--evidence must name the source that proved it (a DB read, a git read, a file:line, a ticket), at least 15 characters');
  const led = loadLedger(key);
  if (!led || !led.files[file]) throw new Error(`${file} has no ledger row for ${key}; migrate first`);
  const p = path.join(S.knowledgeDir(key), file), txt = readText(p);
  if (txt != null) { const lines = txt.split(/\r?\n/); if (/UNVERIFIED-FOR-.*lib\/state-migration\.js/.test(lines[0] || '')) fs.writeFileSync(p, lines.slice(lines[1] === '' ? 2 : 1).join('\n')); }
  Object.assign(led.files[file], { status: 'verified', verified: TODAY, evidence: evidence.trim() });
  led.runs.push({ date: TODAY, cmd: 'verify', file });
  saveLedger(key, led);
  return led.files[file];
}

// check = every section was compared with the state's own source, but the file does NOT hold as is
// (some sections differ, are reference-only or need the DB). The banner stays; the ledger records the verdict.
const CHECK_VERDICTS = ['HOLDS_WITH_CORRECTIONS', 'MOSTLY_MELAKA_ONLY', 'NEEDS_DB'];
function check(key, file, verdict, evidence) {
  if (!CHECK_VERDICTS.includes(verdict)) throw new Error('--verdict must be one of ' + CHECK_VERDICTS.join(' | ') + ' (a file that holds as is: use verify)');
  if (!evidence || evidence.trim().length < 15) throw new Error('--evidence must say what was compared with what, at least 15 characters');
  const led = loadLedger(key);
  if (!led || !led.files[file]) throw new Error(`${file} has no ledger row for ${key}; migrate first`);
  const txt = readText(path.join(S.knowledgeDir(key), file));
  Object.assign(led.files[file], { status: 'checked', check_verdict: verdict, checked: TODAY, evidence: evidence.trim(), written_sha256: txt != null ? sha(txt) : led.files[file].written_sha256 });
  led.runs.push({ date: TODAY, cmd: 'check', file, verdict });
  saveLedger(key, led);
  return led.files[file];
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function printGates(g) {
  console.log(`state-migration gates — ${g.label}${g.refers_to ? ' (refers to ' + S.get(g.refers_to).label + ')' : ''}`);
  for (const r of g.rows) console.log(`  ${r.verdict.padEnd(7)} ${r.id.padEnd(3)} ${r.name.padEnd(26)} ${r.evidence}`);
}
const bad = (g) => g.rows.filter(r => r.verdict === 'FAIL' || r.verdict === 'UNKNOWN').length;

if (require.main === module) {
  const t0 = Date.now(); const cmd = process.argv[2]; const state = arg('state'); let code = 0, outcome = '';
  try {
    const key = state ? (S.get(state) || {}).key : null;
    if (cmd !== 'audit' && !key) throw new Error('usage: see header; --state <registered state> required' + (state ? ' (not registered: ' + state + ')' : ''));
    if (cmd === 'chain') { const c = chain(key); console.log(c.path.map(k => S.get(k).label).join(' → ') + (c.loop ? ' → ' + S.get(c.loop).label + ' (loop)' : '') + (S.get(c.path[c.path.length - 1]).refers_to ? '' : '  (end: no refers_to)')); }
    else if (cmd === 'gates') { const g = gates(key); if (flag('json')) console.log(JSON.stringify(g, null, 2)); else printGates(g); code = bad(g) ? 1 : 0; outcome = `${bad(g)} bad`; }
    else if (cmd === 'migrate') {
      const r = migrate(key, { from: arg('from'), dryRun: flag('dry-run') });
      printGates(r.gates);
      if (r.refused) { console.log('REFUSED — ' + r.refused); code = 2; outcome = 'refused'; }
      else { console.log(`${r.dryRun ? 'DRY RUN — nothing written' : 'written + ledger ' + LEDGER}`); for (const p of r.plan) console.log(`  ${p.status.padEnd(12)} ${p.tier.padEnd(2)} ${p.file.padEnd(30)} ${p.treatment}`); outcome = `${r.plan.length} files`; }
    }
    else if (cmd === 'audit') {
      const keys = flag('all') ? Object.keys(S.all()).filter(k => S.get(k).work_scope === 'active') : [key];
      if (!keys[0]) throw new Error('audit needs --state <s> or --all');
      const out = keys.map(audit);
      if (flag('json')) console.log(JSON.stringify(out, null, 2));
      else for (const a of out) {
        printGates(a.gates);
        if (!a.ledger) console.log('  (no migration ledger: this state was set up before lib/state-migration.js; migrate --dry-run shows what it would do)');
        for (const f of a.files) console.log(`  file ${f.status.padEnd(19)} ${String(f.tier).padEnd(2)} ${f.file}${f.evidence ? '  · ' + f.evidence : ''}`);
      }
      code = out.some(a => bad(a.gates) || a.files.some(f => f.status === 'source-changed')) ? 1 : 0; outcome = code ? 'problems' : 'clean';
    }
    else if (cmd === 'verify') { const r = verify(key, arg('file'), arg('evidence')); console.log(`verified ${arg('file')} for ${key}: ${r.evidence}`); outcome = 'verified'; }
    else if (cmd === 'check') { const r = check(key, arg('file'), arg('verdict'), arg('evidence')); console.log(`checked ${arg('file')} for ${key}: ${r.check_verdict} · ${r.evidence}`); outcome = 'checked'; }
    else throw new Error('usage: chain | gates | migrate | audit | verify | check (see the header of lib/state-migration.js)');
  } catch (e) { console.error('state-migration: ' + e.message); code = 2; outcome = 'error: ' + e.message.slice(0, 120); }
  logRow({ cmd, state, outcome, exit: code, dur_ms: Date.now() - t0 });
  process.exit(code);
}

module.exports = { TIERS, gates, chain, migrate, audit, verify, check, isSkeleton };
