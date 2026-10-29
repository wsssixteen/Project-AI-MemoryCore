#!/usr/bin/env node
// housekeeping — born via forge (2026-09-06) — system-rules Rule 6 (data lifecycle)
// symptom: miya 2026-09-06 "a garbage collector or something … some data are kept, some data are cleaned up"
// goal: every log's retention: line is applied at two fixed moments (DE 12.5 + system audit) and the run
//       prints what it rotated, regenerated, archived or kept
// goal_signal: a run prints one line per file with its retention verb and the action taken, and
//              system/telemetry/hook-fires.jsonl is under 8 MB afterwards
// retention: keep (this script's own log: domain-less — it prints; DE narrative records the run)
//
//   node lib/housekeeping.js [--dry-run] [--max-mb 8] [--regenerate-age-days 30]
// Verbs (system-rules Rule 6), read from `retention:` in domain/<f>/README.md or a file's header comment:
//   keep              → never touched
//   rotate <period>   → when the file exceeds --max-mb, rename to <name>-YYYY-MM.jsonl (readers union the last 2)
//   consume <into>    → listed as "not yet folded" unless <into> is newer than the file (the fold is a human/DE step)
//   regenerate        → deleted when older than --regenerate-age-days (it is rebuilt by its generator)
// Fixed moments ONLY: DE step 12.5 and the system audit call this. Never at boot, never ad-hoc.
//
// Conflict-copy fold (added 2026-10-29 after the system/ junk audit: 293 OneDrive copies, 6.47 GB, holding
// 84,695 rows the base ledgers lacked). Two PCs append to the same ledgers; OneDrive keeps the other PC's
// version as <name>-<PC>[-N].<ext>. Before the retention pass, every such copy under system/:
//   .jsonl  → each line absent from the base (+ its monthly shards) is appended to the base, then the copy is deleted
//   base is regenerate-class or a per-turn snapshot (SNAPSHOTS) → the copy is deleted
//   anything else (a hand-edited .md) → reported "resolve by hand", never touched
// Eval: node lib/housekeeping.eval.js
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; }
const DRY = process.argv.includes('--dry-run');
const MAX = parseFloat(arg('max-mb', '8')) * 1024 * 1024;
const REGEN_DAYS = parseInt(arg('regenerate-age-days', '30'), 10);

// Built-in retention for files that predate Rule 6 (until their headers carry the line).
const BUILTIN = [
  { file: 'system/telemetry/hook-fires.jsonl', verb: 'rotate', arg: 'monthly' },
  { file: 'system/telemetry/turns.jsonl', verb: 'rotate', arg: 'monthly' },
  { file: 'system/slips.jsonl', verb: 'keep' },
  { file: 'system/registry.jsonl', verb: 'keep' },
  { file: 'system/claude-md-watchlist.jsonl', verb: 'keep' },
  { file: 'system/telemetry/eval-battery.jsonl', verb: 'rotate', arg: 'monthly' },
  { file: 'system/telemetry/boot-bundle-preview.md', verb: 'regenerate' },
  { file: 'system/profile-card.md', verb: 'regenerate' },
  { file: 'system/liveness-dashboard.md', verb: 'regenerate' },
  { file: 'system/feature-census.md', verb: 'regenerate' },
  { file: 'system/monitoring-dashboard.md', verb: 'regenerate' },
  { file: 'system/slip-dashboard.md', verb: 'regenerate' },
  { file: 'system/recent-tool-calls.jsonl', verb: 'rotate', arg: 'monthly' },
  { file: 'domain/turn-ledger/goal-lens-pending.jsonl', verb: 'regenerate' },
];

// The PC names OneDrive stamps on a conflict copy (home · office · this machine).
const PC_NAMES = Array.from(new Set(['miyazaki', 'PJNBRidhwan', os.hostname()].filter(Boolean)));
// Per-turn snapshots: a copy is always older than the base, so it is deleted.
const SNAPSHOTS = ['system/telemetry/turn-ledger-state.json'];
const COPY_RE = new RegExp('^(.+?)-(' + PC_NAMES.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(-\\d+)?(\\.[^.]+)$');

function walk(dir, out) {
  let names = []; try { names = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return out; }
  for (const d of names) { const p = path.join(dir, d.name); if (d.isDirectory()) walk(p, out); else out.push(p); }
  return out;
}
function readLines(file) { try { return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(l => l.trim()); } catch (_) { return []; } }

// Returns one row per conflict copy: { copy, base, action }. root defaults to ROOT; dry = plan only.
function foldConflictCopies(root, dry) {
  root = root || ROOT;
  const sysDir = path.join(root, 'system');
  const verbs = new Map(plan().map(it => [it.rel, it.verb]));
  const rows = [];
  const byBase = new Map();
  for (const f of walk(sysDir, [])) {
    const m = COPY_RE.exec(path.basename(f));
    if (!m) continue;
    const base = path.join(path.dirname(f), m[1] + m[4]);
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(f);
  }
  for (const [base, copies] of byBase) {
    const rel = path.relative(root, base).replace(/\\/g, '/');
    const ext = path.extname(base);
    if (ext === '.jsonl') {
      const have = new Set(readLines(base));
      const stem = path.basename(base, ext);
      const shard = new RegExp('^' + stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-\\d{4}-\\d{2}(-\\d+)?\\.jsonl$');
      for (const n of fs.readdirSync(path.dirname(base))) if (shard.test(n)) for (const l of readLines(path.join(path.dirname(base), n))) have.add(l);
      for (const c of copies) {
        const add = readLines(c).filter(l => !have.has(l));
        for (const l of add) have.add(l);
        const action = 'fold ' + add.length + ' row(s) into ' + rel + ', delete';
        if (!dry) {
          if (add.length) { const tail = fs.existsSync(base) && fs.statSync(base).size ? fs.readFileSync(base).slice(-1).toString() : '\n'; fs.appendFileSync(base, (tail === '\n' ? '' : '\n') + add.join('\n') + '\n'); }
          fs.unlinkSync(c);
        }
        rows.push({ copy: path.relative(root, c).replace(/\\/g, '/'), base: rel, action });
      }
    } else if (verbs.get(rel) === 'regenerate' || SNAPSHOTS.includes(rel)) {
      for (const c of copies) { if (!dry) fs.unlinkSync(c); rows.push({ copy: path.relative(root, c).replace(/\\/g, '/'), base: rel, action: 'delete (stale copy of a regenerated file)' }); }
    } else {
      for (const c of copies) rows.push({ copy: path.relative(root, c).replace(/\\/g, '/'), base: rel, action: 'resolve by hand (hand-edited file, not touched)' });
    }
  }
  return rows;
}

function parseRetention(text) {
  const m = String(text).match(/^\s*(?:\/\/|#|\*|>)?\s*\**retention\**\s*:\s*(keep|rotate\s+\S+|consume\s+\S+|regenerate)/mi);
  if (!m) return null;
  const parts = m[1].trim().split(/\s+/);
  return { verb: parts[0].toLowerCase(), arg: parts[1] || null };
}
function head(file, n) { try { return fs.readFileSync(file, 'utf8').slice(0, n || 4000); } catch (_) { return ''; } }

function plan() {
  const items = [];
  const seen = new Set();
  const add = (rel, ret, source) => { if (seen.has(rel)) return; seen.add(rel); items.push({ rel, ...ret, source }); };
  for (const b of BUILTIN) add(b.file, { verb: b.verb, arg: b.arg || null }, 'builtin');
  // domain/<f>/README.md retention applies to that feature's jsonl files
  let feats = []; try { feats = fs.readdirSync(path.join(ROOT, 'domain')); } catch (_) {}
  for (const f of feats) {
    const dir = path.join(ROOT, 'domain', f);
    const ret = parseRetention(head(path.join(dir, 'README.md')));
    if (!ret) continue;
    let files = []; try { files = fs.readdirSync(dir).filter(x => /\.jsonl$/.test(x)); } catch (_) {}
    for (const x of files) add(path.join('domain', f, x).replace(/\\/g, '/'), ret, 'README');
  }
  // lib/*.js + system/*.md|jsonl carrying their own retention header
  for (const dir of ['system', 'system/telemetry', 'lib']) {
    let files = []; try { files = fs.readdirSync(path.join(ROOT, dir)); } catch (_) {}
    for (const x of files) {
      const rel = (dir + '/' + x).replace(/\\/g, '/');
      if (!/\.(jsonl|md|json)$/.test(x)) continue;
      const ret = parseRetention(head(path.join(ROOT, rel), 1500));
      if (ret) add(rel, ret, 'header');
    }
  }
  return items;
}

function apply(items) {
  const out = [];
  const now = Date.now();
  for (const it of items) {
    const abs = path.join(ROOT, it.rel);
    let st = null; try { st = fs.statSync(abs); } catch (_) {}
    if (!st) { out.push({ ...it, action: 'absent' }); continue; }
    let action = 'kept';
    if (it.verb === 'rotate' && st.size > MAX) {
      const stamp = new Date(st.mtimeMs).toISOString().slice(0, 7);
      const target = abs.replace(/\.jsonl$/, '-' + stamp + '.jsonl');
      action = 'rotate → ' + path.basename(target);
      if (!DRY) { try { fs.renameSync(abs, fs.existsSync(target) ? target.replace(/\.jsonl$/, '-' + now + '.jsonl') : target); fs.writeFileSync(abs, ''); } catch (e) { action = 'rotate FAILED: ' + e.message; } }
    } else if (it.verb === 'regenerate' && now - st.mtimeMs > REGEN_DAYS * 86400000) {
      action = 'delete (stale regenerate, ' + Math.round((now - st.mtimeMs) / 86400000) + ' d)';
      if (!DRY) { try { fs.unlinkSync(abs); } catch (e) { action = 'delete FAILED: ' + e.message; } }
    } else if (it.verb === 'consume') {
      const into = it.arg ? path.join(ROOT, it.arg) : null;
      let folded = false; try { folded = into && fs.statSync(into).mtimeMs >= st.mtimeMs; } catch (_) {}
      action = folded ? 'consumed ✓' : 'NOT YET FOLDED into ' + (it.arg || '?') + ' (DE step)';
    }
    out.push({ ...it, size_kb: Math.round(st.size / 1024), action });
  }
  return out;
}

if (require.main === module) {
  const folds = foldConflictCopies(ROOT, DRY);
  console.log('conflict copies' + (DRY ? ' (dry-run)' : '') + ' — ' + folds.length + ' under system/');
  for (const r of folds) console.log('  ' + r.copy + '  → ' + r.action);
  const res = apply(plan());
  console.log('housekeeping' + (DRY ? ' (dry-run)' : '') + ' — ' + res.length + ' files, max ' + Math.round(MAX / 1048576) + ' MB per rotate file, regenerate stale after ' + REGEN_DAYS + ' d');
  for (const r of res) console.log('  ' + r.verb.padEnd(10) + ' ' + String(r.size_kb == null ? '' : r.size_kb + ' KB').padStart(9) + '  ' + r.rel + '  → ' + r.action);
  const touched = res.filter(r => /^(rotate|delete)/.test(r.action)).length;
  console.log('  ' + touched + ' file(s) ' + (DRY ? 'would be' : 'were') + ' rotated/deleted; keep-class never touched.');
}
module.exports = { plan, apply, parseRetention, foldConflictCopies, BUILTIN };
