#!/usr/bin/env node
// release-mlk-plp-push-gate.check.hook.js — born via core/forge.js (2026-07-16)
// TRIGGER: a Bash git push references a mlk/release/* ref
// ACTION: block unless ref matches mlk/release/x.y[.z] AND release-prep state phase is verified or pushed
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// Defense-in-depth: domain/release-mlk-plp/release-prep.js `push` enforces the same rules
// internally (its child-process git calls never pass through Bash-tool hooks) — this gate
// catches MANUAL `git push` attempts around the pipeline. Fail-CLOSED on missing state:
// a release-ref push with no pipeline state is exactly the unsafe case.
// Bypass: include RELEASE_GATE_BYPASS in the command (visible in transcript = auditable).
// State dir override for evals: RELEASE_MLK_PLP_STATE_DIR.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const STATE_DIR = process.env.RELEASE_MLK_PLP_STATE_DIR
  || path.join(ROOT, 'domain', 'release-mlk-plp', 'state');
const REF_RE = /mlk\/release\/([^\s'"]+)/;
const { execSync } = require('child_process');
const FOREIGN_DIR = process.env.FOREIGN_CHECK_STATE_DIR || path.join(ROOT, 'domain', 'release-mlk-plp', 'state');
// Explicit push approval in miya's own words; negated / question forms ("who asked you to push") never match.
const PUSH_APPROVAL = /(?<!\b(?:don'?t|do not|jangan|not|never|why|who|asks? you to)\s)\b(push it|push now|go ahead and push|yes,? push|ok,? push|boleh push|pushkan|\[push-ok\])\b/i;
function lastUserText(tp) {
  let tail = '';
  try {
    const size = fs.statSync(tp).size, want = 400000;
    const fd = fs.openSync(tp, 'r'); const buf = Buffer.alloc(Math.min(size, want));
    fs.readSync(fd, buf, 0, buf.length, Math.max(0, size - buf.length)); fs.closeSync(fd);
    tail = buf.toString('utf8');
  } catch (_) { return ''; }
  const ls = tail.split('\n').filter(l => /"type"\s*:\s*"user"/.test(l));
  for (let i = ls.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(ls[i]); } catch (_) { continue; }
    const c = o && o.message && o.message.content;
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) { const t = c.filter(x => x && x.type === 'text').map(x => x.text); if (t.length) return t.join('\n'); }
  }
  return '';
}
const GOOD_VER = /^\d+\.\d+(\.\d+)?$/;

runHook({ name: 'release-mlk-plp-push-gate', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  // v2 (2026-08-19): PowerShell added — the 1.3.5 incident's manual pushes ran through the
  // PowerShell tool and sailed past the Bash-only check. Same command field on both tools.
  const tool = data.tool_name || '';
  if (tool !== 'Bash' && tool !== 'PowerShell') return { fired: false };
  const cmd = (data.tool_input && data.tool_input.command) || '';
  // v2 fix (2026-08-19): /git\s+push/ NEVER matched `git -C <path> push ...` — the form every
  // manual push actually uses. The gate was blind since birth. Now: git … push on one line.
  // v3 (2026-09-23): anchor on a REAL git invocation — `git` at command start or after ; & | —
  // so free text inside a quoted node/forge/slips argument that merely mentions "push" and a
  // branch name never trips the gate (two false blocks on 2026-09-23, #280176 DE).
  const GIT_PUSH = /(?:^|[;&|]\s*)git\s+(?:-C\s+(?:"[^"]+"|'[^']+'|\S+)\s+)?push\b([^\r\n|;&]*)/;
  const gp = GIT_PUSH.exec(cmd);
  if (!gp) return { fired: false };
  // v4 (2026-09-30, #256334 AWAM): approval comes ONLY from miya's own last message — a token I type
  // myself is not approval (I bypassed this gate twice with RELEASE_GATE_BYPASS and pushed to another
  // team's release branch without telling him).
  const approved = PUSH_APPROVAL.test(lastUserText(data.transcript_path || ''));
  // v4: another team's repo (anything but etanah-pelupusan) pushing a shared branch needs BOTH a
  // foreign-merge-check report for the exact HEAD being pushed AND miya's explicit push approval.
  // v5 (2026-10-02): the repo is named by its origin remote via lib/git-target.js, never by its folder
  // name — `cd X; git push` kept the ";" in the path, a worktree named stag-awam-pdbb was "foreign" only
  // because its parent was E:\Dev\etanah-work, and E:\Dev\etanah-work\etanah-pelupusan read as foreign.
  const { targetRepo } = require(path.join(ROOT, 'lib', 'git-target.js'));
  const tr = targetRepo(cmd, data.cwd || '', 'push');
  const repo = tr.dir || '';
  const repoName = tr.id ? tr.id.name : '';
    // 2026-10-06 per miya: etanah-awam is OURS to push, like etanah-pelupusan. "Another team" = every other etanah repo (common, spoc-hasil ...).
  const foreign = /^etanah-/i.test(repoName) && !/^etanah-(?:pelupusan|awam)$/i.test(repoName);
  const shared = /\bmlk\/(release\/|stag-env\b|int-env\b|master\b|mlit\b)/.test(gp[1]);
  // v6 (2026-10-09, per みや): the command NAMES a folder (cd / git -C) that this guard cannot name a repo for (a shell
  // variable, a folder that is not there, not a git folder) and pushes a shared branch. That used to PASS, because an
  // empty name is not "another team's". It is refused now: the repo might be another team's. The remedy is one retry
  // with the folder written out; no token and no approval opens it. Untouched: ticket branches, non-mlk branches, and
  // a push that names no folder (it runs in the tool's own folder, as before).
  const namedFolder = require(path.join(ROOT, 'lib', 'git-target.js')).cmdDir(cmd, 'push');
  if (namedFolder && !repoName && shared) {
    return {
      fired: true, blocked: true,
      blockReason: `⛔ release-mlk-plp-push-gate v6: this guard could not name the repo for this push (folder read as: ${repo || 'none'}).\n` +
        `   The branch is a shared one, so the push is not let through unchecked.\n` +
        `   Write the folder plainly and run it again:  git -C "E:\\path\\to\\repo" push origin <branch>   (no variable, no relative path)`,
    };
  }
  if (foreign && shared) {
    let sha = ''; try { sha = execSync(`git -C "${repo}" rev-parse HEAD`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch (_) {}
    const report = sha && fs.existsSync(path.join(FOREIGN_DIR, `foreign-check-${sha}.json`));
    if (!report || !approved) {
      return {
        fired: true, blocked: true,
        blockReason: `⛔ release-mlk-plp-push-gate v5: push to ANOTHER team's shared branch (${repoName} at ${repo}).\n` +
          `   ${report ? '✅' : '❌'} full check for HEAD ${sha.slice(0, 10) || '?'}: node domain/release-mlk-plp/foreign-merge-check.js --repo "${repo}" --ticket <num>\n` +
          `   ${approved ? '✅' : '❌'} miya's own message approves the push ("push it" / "go ahead and push" / "boleh push")\n` +
          `   Brief him first: the diff, and WHY every differing line exists. No bypass token opens this.`,
      };
    }
    return { fired: true, blocked: false, foreign: true };
  }
  if (/RELEASE_GATE_BYPASS/.test(cmd)) {
    if (!approved) {
      return { fired: true, blocked: true, blockReason: '⛔ release-mlk-plp-push-gate v4: RELEASE_GATE_BYPASS only counts when miya\'s own last message approves the push ("push it" / "go ahead and push" / "boleh push").' };
    }
    return { fired: true, blocked: false, bypassed: true, bypassToken: 'RELEASE_GATE_BYPASS' };
  }
  // v2 (2026-08-19): manual mlk/master push on etanah-pelupusan is BANNED — master moves ONLY
  // via release-prep.js merge-to-master --ba-approved (V8). Its child-process git never passes
  // through tool hooks, so ANY mlk/master push seen here is a manual breach (the 1.3.5 class:
  // hand-merged to master without BA pass). MemoryCore pushes (main/claude/*) are untouched.
  if (/\bmlk\/master\b/.test(gp[1])) {
    return {
      fired: true, blocked: true,
      blockReason: '⛔ release-mlk-plp-push-gate v2: manual push of mlk/master is BANNED — master moves only via release-prep.js merge-to-master --release <ver> --ba-approved (V8: BA baseline pass first). Bypass: RELEASE_GATE_BYPASS in the command.',
    };
  }
  const m = REF_RE.exec(cmd);
  if (!m) return { fired: false };
  const ver = m[1];
  if (!GOOD_VER.test(ver)) {
    return {
      fired: true, blocked: true,
      blockReason: `⛔ release-mlk-plp-push-gate: ref "mlk/release/${ver}" does not match mlk/release/<x.y[.z]> — release pushes go through domain/release-mlk-plp/release-prep.js. Bypass: RELEASE_GATE_BYPASS in the command.`,
    };
  }
  let st = null;
  try { st = JSON.parse(fs.readFileSync(path.join(STATE_DIR, `release-${ver}.json`), 'utf8')); } catch (_) { st = null; }
  if (!st) {
    return {
      fired: true, blocked: true,
      blockReason: `⛔ release-mlk-plp-push-gate: no pipeline state for release ${ver} — run release-prep.js init→branch→merge→verify→push instead of a raw push.`,
    };
  }
  if (st.phase !== 'verified' && st.phase !== 'pushed') {
    return {
      fired: true, blocked: true,
      blockReason: `⛔ release-mlk-plp-push-gate: release ${ver} is at phase "${st.phase}" — merge-verification has not passed; push refused.`,
    };
  }
  return { fired: true, blocked: false };
});
