#!/usr/bin/env node
// compile-gate — record + verify a local `mvn compile` before an etanah commit.
//
// WHY: 2026-08-18 QA-275456 — a fix used mh.getBandar() (MaklumatHakmilik has no such
// method). It never compiled, but a green DB read (4/87 from the Kemas kini composite)
// made me report "tested PASSED". The int-env BUILD was the FIRST compile — it failed on
// the server, AFTER commit, and mlit went down. This gate makes a LOCAL compile the check
// that must pass before the Phase-1 commit, so the same class can never reach the server.
//
// Usage:
//   node domain/compile-gate/compile-check.js run <module>     # runs mvn -o compile; records BUILD SUCCESS
//   node domain/compile-gate/compile-check.js verify <module>  # exit 0 iff green + no .java edited since
//
// `run` is meant to be launched in the BACKGROUND (it takes ~1-2 min); `verify` is what the
// commit hook calls (instant — just reads the marker + newest .java mtime).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJ = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const STATE = path.join(PROJ, '.claude', 'state');

// module name -> local repo path (the repos are on E:\Projects\Melaka, not in MemoryCore)
const MODULES = {
  'etanah-pelupusan': 'E:/Projects/Melaka/etanah-pelupusan',
  'etanah-awam': 'E:/Projects/Melaka/etanah-awam',
  'etanah-common': 'E:/Projects/Melaka/etanah-common',
};

function markerPath(mod) { return path.join(STATE, `compile-ok-${mod}.json`); }

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

if (cmd === 'run') {
  try {
    console.log(`compile-gate: running 'mvn -o -q compile' in ${MODULES[mod]} ...`);
    execSync('mvn -o -q compile', { cwd: MODULES[mod], stdio: 'inherit' });
    fs.mkdirSync(STATE, { recursive: true });
    fs.writeFileSync(markerPath(mod), JSON.stringify({ ok: true, ts: Date.now(), mod }, null, 2));
    console.log(`compile-gate: ✅ BUILD SUCCESS recorded for ${mod}`);
  } catch (e) {
    console.error(`compile-gate: 🚨 BUILD FAILED for ${mod} — fix the compile error, do NOT commit.`);
    process.exit(1);
  }
} else if (cmd === 'verify') {
  let m;
  try { m = JSON.parse(fs.readFileSync(markerPath(mod), 'utf8')); }
  catch {
    console.error(`compile-gate: NO green compile recorded for ${mod} this session.\n  Run (backgroundable): node domain/compile-gate/compile-check.js run ${mod}`);
    process.exit(1);
  }
  const newest = newestJavaMtime(MODULES[mod]);
  if (newest > m.ts) {
    console.error(`compile-gate: a .java under ${mod} was edited AFTER the last green compile (${new Date(m.ts).toISOString()}).\n  Recompile before commit: node domain/compile-gate/compile-check.js run ${mod}`);
    process.exit(1);
  }
  console.log(`compile-gate: ✅ ${mod} compile green + current (recorded ${new Date(m.ts).toISOString()})`);
} else {
  console.error('usage: compile-check.js run|verify <etanah-pelupusan|etanah-awam|etanah-common>');
  process.exit(2);
}
