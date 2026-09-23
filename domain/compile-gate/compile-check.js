#!/usr/bin/env node
// compile-gate — record + verify a local `mvn compile` before an etanah commit.
//
// WHY: 2026-08-18 QA-275456 — a fix used mh.getBandar() (MaklumatHakmilik has no such
// method). It never compiled, but a green DB read (4/87 from the Kemas kini composite)
// made me report "tested PASSED". The int-env BUILD was the FIRST compile — it failed on
// the server, AFTER commit, and mlit went down. This gate makes a LOCAL compile the check
// that must pass before the Phase-1 commit, so the same class can never reach the server.
//
// v1.1 (2026-09-22, C7): repo resolution is no longer the hardcoded MODULES[mod] default
// alone. Resolution order: `--repo <path>` argv flag → cwd's `git rev-parse --show-toplevel`
// when its basename === <mod> → MODULES[mod] default (unchanged). `run` compiles in the
// resolved repo and stamps the marker with `repo: <normalized abs path>`; `verify` resolves
// the same way and FAILS when the marker's repo differs from the resolved repo (a green
// marker from a DIFFERENT clone is not evidence for THIS clone). Both print the resolved
// repo on their first line.
// WHY (C7): #280540 causes 4+8 — MODULES hardcoded E:/Projects/Melaka but every commit was
// made in E:/Dev/etanah-work; the 6 'pass' rows 19:55-21:03 stamped a tree that never
// contained v4 or the clean fix, and the 11:54 'edited after green' block came from the
// ref clone's pull, not from any edit in the work clone.
//
// v1.1.1 (2026-09-23): `verify` treated a marker with NO `repo` field (pre-v1.1, written
// before the repo-stamp existed) as leniently matching ANY clone — markerRepo fell through
// to null and `if (markerRepo && ...)` never fired, so a stale/foreign pre-v1.1 marker
// passed verify for every clone. Fixed: no repo field now FAILS the same as a mismatched
// repo (strict, no transitional leniency) — reviewer finding.
//
// Usage:
//   node domain/compile-gate/compile-check.js run <module> [--repo <path>]     # runs mvn -o compile; records BUILD SUCCESS
//   node domain/compile-gate/compile-check.js verify <module> [--repo <path>]  # exit 0 iff green + no .java edited since + same clone
//
// `run` is meant to be launched in the BACKGROUND (it takes ~1-2 min); `verify` is what the
// commit hook calls (instant — just reads the marker + newest .java mtime).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Canonical MemoryCore root: a worktree session shares the MAIN state dir — compile markers are
// global, not per-worktree. Without this, `run` (my cwd) and the hook's `verify` (CLAUDE_PROJECT_DIR
// = worktree) read different .claude/state dirs, so a green compile never registers for the gate.
const PROJ = (process.env.CLAUDE_PROJECT_DIR || process.cwd())
  .replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/i, '');
const STATE = path.join(PROJ, '.claude', 'state');

// module name -> local repo path (the repos are on E:\Projects\Melaka, not in MemoryCore).
// This is now only the LAST-RESORT default — see resolveRepo() below (C7).
const MODULES = {
  'etanah-pelupusan': 'E:/Projects/Melaka/etanah-pelupusan',
  'etanah-awam': 'E:/Projects/Melaka/etanah-awam',
  'etanah-common': 'E:/Projects/Melaka/etanah-common',
};

function markerPath(mod) { return path.join(STATE, `compile-ok-${mod}.json`); }

function normRepo(p) {
  let s = String(p || '');
  if (process.platform === 'win32') s = s.replace(/^\/([a-zA-Z])(?=\/)/, (_, d) => d.toUpperCase() + ':');
  return path.resolve(s).replace(/[\\/]+$/, '');
}

// Resolution order (C7): --repo argv flag -> cwd's git toplevel when its basename === mod ->
// MODULES[mod] default. Returns the normalized absolute path.
function resolveRepo(mod, argv) {
  const flagIdx = argv.indexOf('--repo');
  if (flagIdx >= 0 && argv[flagIdx + 1]) return normRepo(argv[flagIdx + 1]);
  try {
    const top = execSync('git rev-parse --show-toplevel', { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (top && path.basename(top).toLowerCase() === mod.toLowerCase()) return normRepo(top);
  } catch (_) { /* not a git repo / no git — fall through to default */ }
  return normRepo(MODULES[mod]);
}

// newest mtime of any .java under src/main/java — a later edit invalidates the green marker
function newestJavaMtime(dir) {
  let newest = 0;
  const stack = [path.join(dir, 'src', 'main', 'java')];
  while (stack.length) {
    const d = stack.pop();
    let ents;
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.name.endsWith('.java')) {
        const m = fs.statSync(p).mtimeMs;
        if (m > newest) newest = m;
      }
    }
  }
  return newest;
}

const [, , cmd, mod] = process.argv;
if (!mod || !MODULES[mod]) {
  console.error(`compile-gate: unknown/missing module '${mod}'. Known: ${Object.keys(MODULES).join(', ')}`);
  process.exit(2);
}

const repo = resolveRepo(mod, process.argv.slice(2));

if (cmd === 'run') {
  console.log(`compile-gate: repo = ${repo}`);
  try {
    // -t maps the etanah build's JDK 1.8 + 11 toolchains to an available JDK (Ruri's shell has no
    // JDK 8 at E:\Java\java8, only a JRE 8 + JDK 17). Passed per-invocation so miya's global ~/.m2
    // is never touched. Compiles source-8/11 on JDK 17 — enough to catch `cannot find symbol`.
    const TC = path.join(__dirname, 'toolchains.xml');
    console.log(`compile-gate: running 'mvn -o -q -t <toolchains> compile' in ${repo} ...`);
    execSync(`mvn -o -q -t "${TC}" compile`, { cwd: repo, stdio: 'inherit' });
    fs.mkdirSync(STATE, { recursive: true });
    fs.writeFileSync(markerPath(mod), JSON.stringify({ ok: true, ts: Date.now(), mod, repo }, null, 2));
    console.log(`compile-gate: ✅ BUILD SUCCESS recorded for ${mod} (${repo})`);
  } catch (e) {
    console.error(`compile-gate: 🚨 BUILD FAILED for ${mod} — fix the compile error, do NOT commit.`);
    process.exit(1);
  }
} else if (cmd === 'verify') {
  console.log(`compile-gate: repo = ${repo}`);
  let m;
  try { m = JSON.parse(fs.readFileSync(markerPath(mod), 'utf8')); }
  catch {
    console.error(`compile-gate: NO green compile recorded for ${mod} this session.\n  Run (backgroundable): node domain/compile-gate/compile-check.js run ${mod} --repo "${repo}"`);
    process.exit(1);
  }
  const markerRepo = m.repo ? normRepo(m.repo) : null;
  if (!markerRepo || markerRepo.toLowerCase() !== repo.toLowerCase()) {
    console.error(`compile-gate: green marker is for a different clone (${m.repo || '<no repo field — pre-v1.1 marker>'} ≠ ${repo})\n  Recompile in THIS clone: node domain/compile-gate/compile-check.js run ${mod} --repo "${repo}"`);
    process.exit(1);
  }
  const newest = newestJavaMtime(repo);
  if (newest > m.ts) {
    console.error(`compile-gate: a .java under ${mod} was edited AFTER the last green compile (${new Date(m.ts).toISOString()}).\n  Recompile before commit: node domain/compile-gate/compile-check.js run ${mod} --repo "${repo}"`);
    process.exit(1);
  }
  console.log(`compile-gate: ✅ ${mod} compile green + current (recorded ${new Date(m.ts).toISOString()})`);
} else {
  console.error('usage: compile-check.js run|verify <etanah-pelupusan|etanah-awam|etanah-common> [--repo <path>]');
  process.exit(2);
}
