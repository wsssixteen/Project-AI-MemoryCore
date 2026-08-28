#!/usr/bin/env node
/**
 * sql-schema-verify.js — turn any hand-off .sql into a catalog-check query, then stamp the result.
 *
 * WHY (2026-08-07, ESOKONGAN #274510): a 15-query evidence script went to infra with
 * `proc_inst_id_` on four Flowable job tables that actually use `process_instance_id_`.
 * It failed on their first statement. A reachable environment (stg1) carried the identical
 * schema the whole time and was never consulted. Cost: a full round-trip with a third party.
 *
 * The failure class is "shipped SQL whose identifiers were never checked against a live
 * catalog". This makes the check mechanical instead of remembered.
 *
 *   emit   — parse a .sql, print the pg_attribute query that proves every table+column exists
 *   stamp  — record a clean result against the file's CURRENT content hash
 *   check  — exit 0 if a clean stamp matches the current hash, else exit 1
 *
 * Parsing is reliable because hand-off scripts are single-table-per-statement (the NO JOIN
 * convention, CLAUDE.md section 8). One table per statement means every identifier in that
 * statement belongs to that table — no ambiguity to resolve.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Stamp store — ONE store per REPOSITORY, shared by the main checkout and every git worktree.
 *
 * WHY (root cause 2026-08-28): the store used to be path.resolve(__dirname,'stamps.jsonl') — a
 * file that lives INSIDE each checkout. Every worktree carries its own working copy, so a stamp
 * appended in one root was invisible to a Stop hook running in another. 277147.sql and
 * patch-ADHOC-PT-2026-5.sql were stamped (twice) yet the gate kept re-firing, because the
 * checkout whose Stop hook fired had a stamps.jsonl without those lines. miya runs many parallel
 * worktree sessions, so stamp-in-root-A / block-in-root-B was the norm, not the exception.
 *
 * The git COMMON dir resolves to the same absolute path from every worktree (git rev-parse
 * --git-common-dir), and lives under .git so it is never tracked. Putting the store there makes
 * it shared and kills the per-checkout git-status churn. Off a git repo we fall back to the old
 * in-tree file. SQL_SCHEMA_VERIFY_STORE overrides the location (used by the eval for isolation).
 *
 * LEGACY_STAMPS (the old in-tree file) stays a READ source so files stamped before this change
 * are still honoured; new stamps only ever write the shared store.
 */
const LEGACY_STAMPS = path.resolve(__dirname, 'stamps.jsonl');

function gitCommonDir(startDir) {
  let dir = startDir;
  for (let i = 0; i < 64; i++) {
    const dotgit = path.join(dir, '.git');
    try {
      const st = fs.statSync(dotgit);
      if (st.isDirectory()) return dotgit;
      if (st.isFile()) {
        const m = fs.readFileSync(dotgit, 'utf8').match(/gitdir:\s*(.+)/);
        if (m) {
          let gd = m[1].trim();
          if (!path.isAbsolute(gd)) gd = path.resolve(dir, gd);
          const cdf = path.join(gd, 'commondir'); // present in a worktree's gitdir
          if (fs.existsSync(cdf)) {
            const cd = fs.readFileSync(cdf, 'utf8').trim();
            return path.isAbsolute(cd) ? cd : path.resolve(gd, cd);
          }
          return gd;
        }
      }
    } catch (_) { /* no .git here — keep walking up */ }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function storePath() {
  if (process.env.SQL_SCHEMA_VERIFY_STORE) return process.env.SQL_SCHEMA_VERIFY_STORE;
  const common = gitCommonDir(__dirname);
  return common ? path.join(common, 'sql-schema-verify-stamps.jsonl') : LEGACY_STAMPS;
}

const STAMPS = storePath();

// Windows paths are case-insensitive; a strict === on path.resolve output could miss a real stamp.
function samePath(a, b) {
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
}

// Read stamps from the shared store AND the legacy in-tree file (transition courtesy).
function readStamps() {
  const out = [];
  for (const p of new Set([STAMPS, LEGACY_STAMPS])) {
    let lines = [];
    try { lines = fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean); } catch (_) {}
    for (const l of lines) { try { out.push(JSON.parse(l)); } catch (_) {} }
  }
  return out;
}

const KEYWORDS = new Set([
  'select','from','where','and','or','in','not','null','is','order','by','group','having',
  'asc','desc','limit','offset','as','on','join','left','right','inner','outer','full','union',
  'all','distinct','count','sum','min','max','avg','case','when','then','else','end','exists',
  'insert','into','values','update','set','delete','with','escape','like','ilike','between',
  'current_database','current_user','current_schema','string_agg','coalesce','cast','true','false'
]);

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
}

function stripNoise(sql) {
  return sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/'(?:[^']|'')*'/g, " '' ");
}

function parse(file) {
  const statements = stripNoise(fs.readFileSync(file, 'utf8'))
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  const refs = new Map(); // "schema.table" -> Set(columns)

  for (const st of statements) {
    const tables = [...st.matchAll(/\b(?:from|join|update|into)\s+([a-z_][\w]*)\.([a-z_][\w]*)/gi)]
      .map(m => `${m[1].toLowerCase()}.${m[2].toLowerCase()}`);
    if (!tables.length) continue;

    const own = new Set();
    tables.forEach(t => t.split('.').forEach(p => own.add(p)));

    const cols = new Set();
    for (const m of st.matchAll(/\b([a-z_][a-z0-9_]*)\b/gi)) {
      const id = m[1].toLowerCase();
      if (KEYWORDS.has(id) || own.has(id)) continue;
      cols.add(id);
    }
    for (const t of tables) {
      if (!refs.has(t)) refs.set(t, new Set());
      cols.forEach(c => refs.get(t).add(c));
    }
  }
  return refs;
}

function emit(file) {
  const refs = parse(file);
  if (!refs.size) {
    console.error('No schema-qualified tables found. Hand-off scripts must qualify every table.');
    process.exit(1);
  }
  const rows = [];
  for (const [tbl, cols] of refs) {
    const [schema, name] = tbl.split('.');
    for (const c of cols) rows.push(`('${schema}','${name}','${c}')`);
  }
  console.log(`-- ${path.basename(file)}  hash=${hashFile(file)}  refs=${rows.length}`);
  console.log('-- Run on the TARGET environment (or any environment with the identical schema).');
  console.log('-- Zero rows = every table and column exists. Any row = the script is broken.');
  console.log('');
  console.log('WITH refs(sch, tbl, col) AS (VALUES');
  console.log('  ' + rows.join(',\n  '));
  console.log(')');
  console.log('SELECT r.sch, r.tbl, r.col');
  console.log('FROM   refs r');
  console.log('LEFT   JOIN pg_class c ON c.relname = r.tbl');
  console.log('       AND c.relnamespace = (SELECT oid FROM pg_namespace n WHERE n.nspname = r.sch)');
  console.log('LEFT   JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = r.col');
  console.log('       AND a.attnum > 0 AND NOT a.attisdropped');
  console.log('WHERE  a.attname IS NULL;');
}

function stamp(file, env) {
  if (!env) { console.error('stamp requires an environment name, e.g. mlkstg1-pg'); process.exit(1); }
  const rec = { ts: new Date().toISOString(), file: path.resolve(file), hash: hashFile(file), env, result: 'clean' };
  try { fs.mkdirSync(path.dirname(STAMPS), { recursive: true }); } catch (_) {}
  fs.appendFileSync(STAMPS, JSON.stringify(rec) + '\n');
  console.log(`stamped ${path.basename(file)} hash=${rec.hash} env=${env}`);
}

function check(file) {
  const hash = hashFile(file);
  const abs = path.resolve(file);
  const hit = readStamps()
    .some(r => r && r.result === 'clean' && r.hash === hash && samePath(r.file, abs));
  if (hit) { console.log(`VERIFIED ${path.basename(file)} hash=${hash}`); process.exit(0); }
  console.error(`UNVERIFIED ${path.basename(file)} hash=${hash} — run emit, execute it, then stamp.`);
  process.exit(1);
}

const [cmd, file, env] = process.argv.slice(2);
if (!cmd || !file) {
  console.error('usage: sql-schema-verify.js <emit|stamp|check> <file.sql> [env]');
  process.exit(1);
}
if (cmd === 'emit') emit(file);
else if (cmd === 'stamp') stamp(file, env);
else if (cmd === 'check') check(file);
else { console.error(`unknown command: ${cmd}`); process.exit(1); }
