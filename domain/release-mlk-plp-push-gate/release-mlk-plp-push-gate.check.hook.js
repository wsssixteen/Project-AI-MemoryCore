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

// ── v7 (2026-10-05) — rebuilt after two independent reviews proved 37 ways through this gate (24 of them
// older than v5: a push on its own line was never looked at; only the first push was judged; anything
// between a separator and `git` hid the push; `git -c k=v` was read as `git -C <dir>`; a bare `git push`
// on a checked-out shared branch was not seen; only mlk/* counted as shared). The rule is now:
//   EVERY push in the command is judged on its own · the repo is named by its remote, and only when that
//   is CERTAIN (lib/git-target.js v3) · in another team's repo everything that is not a ticket branch
//   (<state>/<tracker>/<number>) is shared · when the repo cannot be told, a push that could reach a
//   shared branch is REFUSED and the reason is printed. What a text gate can never see (a push inside a
//   script file) is recorded in the header of lib/git-target.js and in the handover as an open risk.
const TICKET_RX = /^[a-z]{2,5}\/[a-z][a-z-]*\/\d{4,7}(?:$|[-_/])/;
const ticketShaped = b => TICKET_RX.test(b) && !/^[a-z]{2,5}\/release\//.test(b);
const stateShaped = b => /^[a-z]{2,5}\//.test(b) && !ticketShaped(b);
// 2026-10-06 per miya: etanah-awam is OURS to push, like etanah-pelupusan. "Another team" = every other etanah repo (common, spoc-hasil ...).
const isForeign = n => /^etanah-/i.test(n || '') && !/^etanah-(?:pelupusan|awam)$/i.test(n || '');
// a real push written inside a string that is handed to another shell: the gate cannot follow it
const WRAP_RX = /(?:^|[;&|\r\n({=]\s*|&\s*)(?:"[^"\r\n]*[\\/]|'[^'\r\n]*[\\/])?(?:bash|sh|zsh|wsl|pwsh|powershell|cmd|iex|Invoke-Expression|Start-Process|start|saps|Invoke-Command|icm|ssh)(?:\.exe)?["']?(?=\s)/i;
const PIPE_TO_SHELL_RX = /^\s*['"]?@?\s*\|\s*(?:&\s*)?(?:bash|sh|pwsh|powershell|cmd|iex|Invoke-Expression)\b/i;

function gitOut(dir, args) {
  try { return execSync(`git -C "${dir}" ${args}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true, timeout: 15000 }).trim(); } catch (_) { return ''; }
}

// What a `git push <args>` sends where. → { remote, dests:[{dst, src}], all, unknown }
function pushPlan(args, dir) {
  const toks = []; const rx = /"([^"]*)"|'([^']*)'|(\S+)/g; let m;
  while ((m = rx.exec(String(args || ''))) !== null) toks.push(m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3]));
  const plan = { remote: null, dests: [], all: false, unknown: false };
  let del = false, implicit = false; const specs = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (/^(?:\d*|\*)>{1,2}/.test(t) || /^[<|]/.test(t)) { if (/^(?:\d*|\*)>{1,2}$/.test(t)) i++; continue; }      // redirections are not refspecs
    if (/^--(?:all|mirror|branches)$/.test(t)) { plan.all = true; continue; }
    if (t === '--delete' || t === '-d') { del = true; continue; }
    if (/^(?:-o|--push-option|--repo|--receive-pack|--exec)$/.test(t)) { i++; continue; }
    if (/^-/.test(t)) continue;
    if (plan.remote === null) { plan.remote = t; continue; }
    specs.push(t);
  }
  for (let i = 0; i < specs.length; i++) {
    let r = specs[i].replace(/^\+/, '');
    if (r === 'tag') { i++; continue; }
    if (/^refs\/tags\//.test(r)) continue;
    if (/[$`%*]/.test(r)) { plan.unknown = true; continue; }
    if (r.includes(':')) { const k = r.indexOf(':'); const src = r.slice(0, k), dst = r.slice(k + 1).replace(/^refs\/heads\//, ''); if (/^refs\/tags\//.test(r.slice(k + 1))) continue; plan.dests.push({ dst, src: src || null }); continue; }
    r = r.replace(/^refs\/heads\//, '');
    if (del) { plan.dests.push({ dst: r, src: null }); continue; }
    if (r === 'HEAD' || r === '@') { implicit = true; continue; }
    plan.dests.push({ dst: r, src: r });
  }
  if ((!specs.length && !plan.all) || implicit) {
    // no branch named: git pushes the checked-out branch. Read it (read-only); without a readable repo it is unknown.
    const cur = dir ? gitOut(dir, 'rev-parse --abbrev-ref HEAD') : '';
    if (!cur || cur === 'HEAD') plan.unknown = true;
    else if (implicit) plan.dests.push({ dst: cur, src: 'HEAD' });
    else {
      const up = gitOut(dir, 'rev-parse --abbrev-ref --symbolic-full-name @{push}') || gitOut(dir, 'rev-parse --abbrev-ref --symbolic-full-name @{u}');
      plan.dests.push({ dst: up && up.includes('/') ? up.slice(up.indexOf('/') + 1) : cur, src: 'HEAD' });
    }
  }
  return plan;
}

runHook({ name: 'release-mlk-plp-push-gate', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  // v2 (2026-08-19): PowerShell added — the 1.3.5 incident's manual pushes ran through the PowerShell tool.
  // v7: the Terminal-panel tool too (same `command` field; its own `cwd`).
  const tool = data.tool_name || '';
  const TERMINAL = 'mcp__terminal__run_in_terminal';
  if (tool !== 'Bash' && tool !== 'PowerShell' && tool !== TERMINAL) return { fired: false };
  const ti = data.tool_input || {};
  const cmd = String(ti.command || '');
  if (!/push/i.test(cmd) || !/git/i.test(cmd)) return { fired: false };
  const gt = require(path.join(ROOT, 'lib', 'git-target.js'));
  const shell = gt.shellOf(tool);
  let cwd = data.cwd || '';
  if (tool === TERMINAL && ti.cwd) cwd = /^~(?=$|[\\/])/.test(ti.cwd) ? require('os').homedir() + String(ti.cwd).slice(1) : path.resolve(cwd || '.', String(ti.cwd));
  const spans = gt.quotedSpans(cmd);
  const pre = { spans, assigns: gt.assignments(cmd, spans) };
  const all = gt.findGitCalls(cmd, 'push', { spans });
  const real = all.filter(c => !c.quoted);
  // v3 (2026-09-23) kept: text inside a quoted node/forge/slips argument that merely mentions a push never
  // trips the gate. v7: unless that string is handed to another shell, which makes it a real push.
  const wrapped = all.filter(c => c.quoted && (WRAP_RX.test(cmd.slice(0, c.span.start)) || PIPE_TO_SHELL_RX.test(cmd.slice(c.span.end))));
  if (!real.length && !wrapped.length) return { fired: false };
  // v4 (2026-09-30, #256334 AWAM): approval comes ONLY from miya's own last message — a token I type
  // myself is not approval.
  const approved = PUSH_APPROVAL.test(lastUserText(data.transcript_path || ''));

  function judge(call) {
    const tr = gt.targetOfCall(cmd, call, cwd, shell, pre);
    const repoName = tr.id ? tr.id.name : '';
    const cwdName = tr.cwdId ? tr.cwdId.name : '';
    const foreign = isForeign(repoName);
    const repo = tr.id ? tr.dir : '';
    const plan = pushPlan(call.args, tr.id ? tr.dir : null);
    const names = plan.dests.map(d => d.dst);
    const sharedInForeign = plan.all || plan.unknown || !names.length || names.some(n => !ticketShaped(n));
    const etanahSignal = /etanah/i.test(cmd) || /^etanah-/i.test(cwdName);

    // v6/v7 — the repo cannot be told with certainty. Refuse when the push could reach a shared branch:
    // a state-shaped branch that is not a ticket branch, or no readable target at all in an etanah context,
    // or the tool's own folder is another team's repo (a cd that fails leaves the push there).
    if (tr.unresolved) {
      const risky = names.some(stateShaped) || ((plan.all || plan.unknown || !names.length) && etanahSignal) || (isForeign(cwdName) && sharedInForeign);
      if (risky) {
        return {
          fired: true, blocked: true, unresolved: true,
          blockReason: `⛔ release-mlk-plp-push-gate v7: cannot tell which repo this push runs in.\n` +
            `   Reason: ${tr.why}${tr.raw ? ` (path written as "${tr.raw}")` : ''}.\n` +
            `   Re-issue it as ONE plain push, in its own command, with a literal folder that exists:\n` +
            `     git -C "E:\\Dev\\etanah-work\\<folder>" push origin <local>:<remote branch>\n` +
            `   Read with certainty: a literal Windows path (a Git Bash path /e/… in the Bash tool only), a cd chain of literal folders, a variable given one quoted literal earlier in the same command.`,
        };
      }
      return { fired: false };
    }
    // v4/v5 — another team's repo (named by its origin remote, never by its folder): a shared-branch push
    // needs BOTH a foreign-merge-check report for the exact commit being pushed AND miya's explicit approval.
    // v7 — "shared" in another team's repo = everything that is not a ticket branch; the commit checked is the
    // one the refspec really pushes, not the folder's HEAD.
    if (foreign && sharedInForeign) {
      const firstShared = plan.dests.find(d => !ticketShaped(d.dst));
      const src = firstShared ? (firstShared.src || '') : '';
      const sha = plan.all || plan.unknown || !firstShared ? '' : (src ? gitOut(repo, `rev-parse --verify --quiet "${src.replace(/"/g, '')}^{commit}"`) : '');
      const report = !!sha && fs.existsSync(path.join(FOREIGN_DIR, `foreign-check-${sha}.json`));
      if (!report || !approved) {
        const what = plan.all ? 'every branch (--all / --mirror)' : plan.unknown ? 'a target the gate cannot read' : firstShared && !firstShared.src ? `a DELETE of ${firstShared.dst}` : (firstShared ? firstShared.dst : 'the checked-out branch');
        return {
          fired: true, blocked: true,
          blockReason: `⛔ release-mlk-plp-push-gate v7: push to ANOTHER team's shared branch (${repoName} at ${repo}) → ${what}.\n` +
            `   ${report ? '✅' : '❌'} full check for the commit being pushed ${sha.slice(0, 10) || '?'}: node domain/release-mlk-plp/foreign-merge-check.js --repo "${repo}" --ticket <num>\n` +
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
    // via release-prep.js merge-to-master --ba-approved (V8). v7: also when mlk/master is the checked-out
    // branch of a bare `git push`. MemoryCore pushes (main/claude/*) are untouched.
    if (/\bmlk\/master\b/.test(call.args) || names.some(n => n === 'mlk/master')) {
      return {
        fired: true, blocked: true,
        blockReason: '⛔ release-mlk-plp-push-gate v2: manual push of mlk/master is BANNED — master moves only via release-prep.js merge-to-master --release <ver> --ba-approved (V8: BA baseline pass first). Bypass: RELEASE_GATE_BYPASS in the command.',
      };
    }
    // v7: the release ref is read from THIS push's own arguments and targets (v5 read the whole command, so a
    // commit message naming a release branch blocked an unrelated push).
    const relName = (REF_RE.exec(call.args) || [])[0] || names.find(n => /^mlk\/release\//.test(n)) || '';
    const m = REF_RE.exec(relName);
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
  }

  let best = { fired: false };
  for (const call of real.concat(wrapped)) {
    const v = judge(call);
    if (v.blocked) return v;
    if (v.fired) best = v;
  }
  return best;
});
