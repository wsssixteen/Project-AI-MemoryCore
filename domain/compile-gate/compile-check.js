#!/usr/bin/env node
// compile-gate — record + verify a local `mvn compile` before an etanah commit.
//
// WHY: 2026-08-18 QA-275456 — a fix used mh.getBandar() (MaklumatHakmilik has no such
// method). It never compiled, but a green DB read (4/87 from the Kemas kini composite)
// made me report "tested PASSED". The int-env BUILD was the FIRST compile — it failed on
// the server, AFTER commit, and mlit went down. This gate makes a LOCAL compile the check
// that must pass before the Phase-1 commit, so the same class can never reach the server.
//
// v2 (2026-10-02, AWAM stag-env PDBB fix): the compile I needed was in a worktree
// (E:\Dev\etanah-work\stag-awam-pdbb) that this tool could not target, so I ran mvn by hand and hit
// two failures the tool already knew how to avoid: offline mode with a common jar never downloaded,
// then the missing JDK 8 toolchain. Now: any repo PATH (worktree included) is a valid target, an
// offline dependency miss retries online once, every failure is labelled, every run is logged.
//
// Usage:
//   node domain/compile-gate/compile-check.js run    <module|repo-path>   # mvn compile; records the green marker
//   node domain/compile-gate/compile-check.js verify <module|repo-path>   # exit 0 iff green + no .java edited since
//
// Failure kinds (exit 1, printed as "compile-gate: KIND=<kind>"):
//   compile     real compiler errors — listed file:line, fix the code
//   dependency  offline jar missing AND the online retry also failed (nexus / VPN)
//   toolchain   toolchains.xml points at a JDK that does not exist
//   other       anything else — full maven output is above the summary
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const HERE = __dirname;
// Canonical MemoryCore root: a worktree session shares the MAIN state dir — compile markers are
// global, not per-worktree. Without this, `run` (my cwd) and the hook's `verify` (CLAUDE_PROJECT_DIR
// = worktree) read different .claude/state dirs, so a green compile never registers for the gate.
const PROJ = (process.env.CLAUDE_PROJECT_DIR || process.cwd())
  .replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/i, '');
const STATE = process.env.COMPILE_GATE_STATE_DIR || path.join(PROJ, '.claude', 'state');
const LOG = process.env.COMPILE_GATE_LOG || path.join(HERE, 'log.jsonl');
const TC = path.join(HERE, 'toolchains.xml');
const MVN = process.env.COMPILE_GATE_MVN || 'mvn';
const ROOT = path.resolve(HERE, '..', '..');
const { repoIdentity, nativePath } = require(path.join(ROOT, 'lib', 'git-target.js'));

// Short module names still work for manual use (the long-standing repos on E:\Projects\Melaka).
const MODULES = {
  'etanah-pelupusan': 'E:/Projects/Melaka/etanah-pelupusan',
  'etanah-awam': 'E:/Projects/Melaka/etanah-awam',
  'etanah-common': 'E:/Projects/Melaka/etanah-common',
};

const KIND_RX = {
  dependency: /Could not resolve dependencies|has not been downloaded from it before|in offline mode/i,
  toolchain: /Misconfigured toolchains|Non-existing JDK home|No toolchain found|Cannot find matching toolchain/i,
  compile: /COMPILATION ERROR|Compilation failure|\.java:\[\d+,\d+\]/,
};
function classify(out) {
  const s = String(out || '');
  if (KIND_RX.compile.test(s)) return 'compile';
  if (KIND_RX.toolchain.test(s)) return 'toolchain';
  if (KIND_RX.dependency.test(s)) return 'dependency';
  return 'other';
}
// "[ERROR] D:\…\src\main\java\my\gov\X.java:[791,21] error: method … already defined" → "my\gov\X.java:791 method … already defined"
function compileErrors(out) {
  const seen = new Set(), list = [];
  const rx = /\[ERROR\]\s+(?:\S*?[\\/]src[\\/]main[\\/]java[\\/])?(\S+\.java):\[(\d+),\d+\]\s*(?:error:\s*)?(.*)/g;
  let m;
  while ((m = rx.exec(String(out || ''))) !== null) {
    const line = `${m[1]}:${m[2]} ${m[3].trim()}`;
    if (!seen.has(line)) { seen.add(line); list.push(line); }
  }
  return list;
}

// module name or path → { mod, top } ; null when it is not an etanah repo
function resolveTarget(target) {
  // a repo path may arrive in Git Bash form (/e/Projects/...): turn it into one git can open first
  const dir = MODULES[target] || path.resolve(nativePath(target) || target);
  const id = repoIdentity(dir);
  if (!id) return null;
  if (!/^etanah-/i.test(id.name)) return null;
  return { mod: id.name, top: path.resolve(id.top) };
}
function markerPath(t) {
  const h = crypto.createHash('sha1').update(t.top.toLowerCase()).digest('hex').slice(0, 8);
  return path.join(STATE, `compile-ok-${t.mod}-${h}.json`);
}
function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

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
        const mt = fs.statSync(p).mtimeMs;
        if (mt > newest) newest = mt;
      }
    }
  }
  return newest;
}

function mvn(top, offline) {
  const args = [...(offline ? ['-o'] : []), '-q', '-t', `"${TC}"`, 'compile'];
  const r = spawnSync(MVN, args, { cwd: top, encoding: 'utf8', shell: true, maxBuffer: 1 << 26, windowsHide: true });
  const out = (r.stdout || '') + (r.stderr || '');
  return { ok: r.status === 0, out };
}

function run(t) {
  const t0 = Date.now();
  const jdk = (/<jdkHome>([^<]+)<\/jdkHome>/.exec(fs.readFileSync(TC, 'utf8')) || [])[1];
  if (jdk && !fs.existsSync(jdk)) {
    console.error(`compile-gate: KIND=toolchain — ${TC} points at ${jdk}, which does not exist. Fix that path.`);
    log({ action: 'run', mod: t.mod, top: t.top, outcome: 'fail', kind: 'toolchain', dur_ms: Date.now() - t0 });
    return 1;
  }
  console.log(`compile-gate: mvn -o compile in ${t.top} (${t.mod}) ...`);
  let mode = 'offline', r = mvn(t.top, true);
  if (!r.ok && classify(r.out) === 'dependency') {
    console.log('compile-gate: offline cache is missing a dependency — retrying ONCE online (downloads it from nexus) ...');
    mode = 'online'; r = mvn(t.top, false);
  }
  if (r.ok) {
    fs.mkdirSync(STATE, { recursive: true });
    fs.writeFileSync(markerPath(t), JSON.stringify({ ok: true, ts: Date.now(), mod: t.mod, top: t.top, mode }, null, 2));
    log({ action: 'run', mod: t.mod, top: t.top, mode, outcome: 'green', dur_ms: Date.now() - t0 });
    console.log(`compile-gate: ✅ BUILD SUCCESS recorded for ${t.mod} at ${t.top} (${mode})`);
    return 0;
  }
  const kind = classify(r.out);
  const errs = kind === 'compile' ? compileErrors(r.out) : [];
  process.stderr.write(r.out.split(/\r?\n/).filter(l => /\[ERROR\]/.test(l)).slice(0, 40).join('\n') + '\n');
  console.error(`compile-gate: 🚨 BUILD FAILED for ${t.mod} — KIND=${kind}${errs.length ? ` (${errs.length} error${errs.length > 1 ? 's' : ''})` : ''}`);
  for (const e of errs.slice(0, 20)) console.error(`   ${e}`);
  if (kind === 'dependency') console.error('   offline AND online both failed to fetch a dependency — check VPN / nexus (172.16.90.169).');
  console.error('   Do NOT commit until this is green.');
  log({ action: 'run', mod: t.mod, top: t.top, mode, outcome: 'fail', kind, errors: errs.length, dur_ms: Date.now() - t0 });
  return 1;
}

function verify(t) {
  let m;
  try { m = JSON.parse(fs.readFileSync(markerPath(t), 'utf8')); }
  catch {
    console.error(`compile-gate: NO green compile recorded for ${t.mod} at ${t.top}.\n  Run (backgroundable): node domain/compile-gate/compile-check.js run "${t.top}"`);
    return 1;
  }
  const newest = newestJavaMtime(t.top);
  if (newest > m.ts) {
    console.error(`compile-gate: a .java under ${t.top} was edited AFTER the last green compile (${new Date(m.ts).toISOString()}).\n  Recompile before commit: node domain/compile-gate/compile-check.js run "${t.top}"`);
    return 1;
  }
  console.log(`compile-gate: ✅ ${t.mod} at ${t.top} compile green + current (recorded ${new Date(m.ts).toISOString()})`);
  return 0;
}

module.exports = { classify, compileErrors, resolveTarget, markerPath };

if (require.main === module) {
  const [, , cmd, target] = process.argv;
  if (!['run', 'verify'].includes(cmd) || !target) {
    console.error('usage: compile-check.js run|verify <etanah-pelupusan|etanah-awam|etanah-common|<repo path>>');
    process.exit(2);
  }
  const t = resolveTarget(target);
  if (!t) {
    console.error(`compile-gate: '${target}' is not an etanah git repo (known short names: ${Object.keys(MODULES).join(', ')}, or pass the repo path).`);
    process.exit(2);
  }
  process.exit(cmd === 'run' ? run(t) : verify(t));
}
