/**
 * commit-gate.js — PreToolUse hook (fires before every Bash tool call)
 *
 * On a `git commit` in a WORK repo (not the MemoryCore repo) for a quest,
 * enforces Phase-1-closure discipline:
 *   1.  local_test_confirmed=true
 *   2.  No unchecked [ ] items in the QA project file
 *   3a. Staging is a SEPARATE step — block combined `git add && git commit`,
 *       `git commit -a/-am`, `--amend`, `--all` (forces stop-at-staging).
 *   3b. みや reviewed + approved — block unless the one-shot approval flag
 *       `.claude/state/commit-approved-<QA>.flag` exists; consume it on allow.
 *
 * Target-quest resolution (2026-06-05, QA-262762): active.txt holds MANY quest
 * blocks and more than one can be `status=active` across parallel sessions, so
 * the gate targets the QA NAMED IN THE COMMIT COMMAND (`-m "QA #262762 …"` or a
 * `mlk/qa/262762` branch token) and falls back to the commit-ready active block.
 * The old reader flattened all blocks into one dict → read the LAST quest.
 *
 * 2026-06-05 (per みや): added Checks 3a/3b (always stop at staging + share the
 * message for review). Fails OPEN on any error (a broken hook never blocks).
 *
 * v4 2026-09-02 (per みや /goal, QA-277697): Check 0 hardened — separators up to 3, en/em dash
 * banned, NON-CHANGE words banned (keep/leave/untouched…), 100-char cap, and the subject's verbs
 * must match `git diff --cached --name-status` (rename↔R, remove↔D, add↔A; an R with no "rename"
 * blocks). Draft-time twin: domain/commit-subject-gate/. Smoke-tested 6 cases 2026-09-02.
 */

const fs = require('fs');
const path = require('path');

// Canonical MemoryCore root: a worktree session shares the MAIN quest/active.txt + approval flags
// (they are global project state, not per-worktree). Without stripping the worktree suffix, this
// gate read the STALE worktree active.txt — it resolved the wrong quest and could not see a block
// that active-cli wrote to main, and looked for the approval flag in the wrong .claude/state dir.
const projectRoot = path.join(__dirname, '..', '..')
  .replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/i, '');
const activePath = path.join(projectRoot, 'quest', 'active.txt');
const TERMINAL = ['closed', 'archived', 'archived-shipped-by-other'];

function parseBlocks() {
  if (!fs.existsSync(activePath)) return [];
  const text = fs.readFileSync(activePath, 'utf8');
  return text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(b => {
    const o = {};
    b.split('\n').forEach(l => {
      const i = l.indexOf('=');
      if (i > -1) o[l.substring(0, i).trim()] = l.substring(i + 1).trim();
    });
    return o;
  }).filter(o => o.qa);
}

// Resolve WHICH quest this commit belongs to: prefer the QA named in the command
// (commit message / branch token), else the commit-ready active block.
function pickTargetState(cmd) {
  const blocks = parseBlocks();
  // v2 (2026-08-05): the old pattern required a literal "QA", but the etanah commit
  // convention is `Ref #<num>` and branches are `mlk/<tracker>/<num>` — so a real commit
  // NEVER matched and the gate always fell through to guessing from active.txt.
  const m = cmd.match(/\bQA[ _#/-]*(\d{4,})\b/i)
    || cmd.match(/\bRef\s*#\s*(\d{4,})\b/i)
    || cmd.match(/\bmlk\/[a-z-]+\/(\d{4,})/i)
    || cmd.match(/#(\d{6})\b/);
  let chosen = null;
  if (m) chosen = blocks.find(o => o.qa === `QA-${m[1]}`);
  if (!chosen) {
    chosen = blocks.find(o => o.status === 'active' && o.local_test_confirmed === 'true')
      || blocks.find(o => o.status === 'active')
      || blocks.find(o => o.status && !TERMINAL.includes(o.status));
  }
  const state = { qa: 'none', phase: '', status: 'idle', local_test_confirmed: 'false' };
  if (chosen) {
    state.qa = chosen.qa || 'none';
    state.phase = chosen.phase || '';
    state.status = chosen.status || 'idle';
    state.local_test_confirmed = chosen.local_test_confirmed || 'false';
  }
  return state;
}

function findQAProjectFile(qa) {
  const num = String(qa).replace(/^QA-?/i, '');
  const qaDir = path.join(projectRoot, 'projects', 'coding-projects', 'active', `QA-${num}`);
  if (!fs.existsSync(qaDir)) return null;
  const files = fs.readdirSync(qaDir).filter(f => f.endsWith('.md'));
  if (files.length === 0) return null;
  return path.join(qaDir, files[0]);
}

function hasUncheckedItems(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  return /\[\s\]/.test(fs.readFileSync(filePath, 'utf8'));
}

function blockCommit(reason) {
  console.log(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
}

let inputData = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => inputData += d);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);
    if (input.tool_name !== 'Bash') process.exit(0);

    const cmd = (input.tool_input && input.tool_input.command) || '';
    if (!/git\s+commit/.test(cmd)) process.exit(0);

    // v2 (2026-08-05, miya, #273201 v3): this gate had been DARK SINCE IT WAS WRITTEN.
    // The old code read process.cwd() — the HOOK's cwd — which is ALWAYS the MemoryCore
    // project dir because that is where hooks execute. So `cwd.startsWith(memoryRoot)` was
    // always true and the hook exited before checks 1/2/3a/3b ever evaluated. Every etanah
    // commit passed unchecked, including tonight's unapproved 91e22e486f.
    // The MemoryCore skip must key off the COMMAND'S TARGET REPO (`cd <path> && git commit`),
    // never the hook's own cwd.
    // Normalize MSYS/git-bash drive form (`/c/users/…`) to Windows form (`c:/users/…`)
    // so `cd /c/…` and `cd C:/…` compare equal. Without this, a MemoryCore self-commit
    // issued with a `/c/` path missed the exemption and was wrongly gated (2026-08-19).
    const normDrive = p => p.replace(/^\/([a-z])\//, '$1:/');
    const memoryRoot = normDrive(projectRoot.replace(/\\/g, '/').toLowerCase()
      .replace(/\/\.claude\/worktrees\/[^/]+$/, ''));   // worktree session: recognize the true MemoryCore root
    const cdMatch = cmd.match(/cd\s+["']?([^"'&|;]+)["']?\s*&&/);
    const targetRepo = normDrive((cdMatch ? cdMatch[1] : process.cwd()).replace(/\\/g, '/').trim().toLowerCase());
    if (targetRepo.startsWith(memoryRoot)) process.exit(0);   // genuine MemoryCore system commit

    // Check 0 (2026-08-20, per みや): work-repo commit message must be PLAIN ENGLISH.
    // No ";", no arrows ("->"), no "|", and no dash-separator beyond the "Ref #NNN - MODULE - "
    // prefix (at most two " - "). Join clauses with "and" or "+". Say what changed in simple words.
    const msgMatch = cmd.match(/-m\s+(["'])([\s\S]*?)\1/);
    const msg = msgMatch ? msgMatch[2] : '';
    if (msg) {
      const dashSeps = (msg.match(/ - /g) || []).length;
      // v4 (2026-09-02, QA-277697): separators up to 3 (prefix - URUSAN - TUGASAN - description) per
      // commit-conventions.md; en/em dash banned; non-change words banned; 100-char cap.
      if (/;/.test(msg) || /--?>/.test(msg) || /\|/.test(msg) || /[–—]/.test(msg) || dashSeps > 3) {
        blockCommit(`⚔️ COMMIT MESSAGE — plain English please.\n\nBanned: ";", arrows ("->"), "|", en/em dashes, and " - " beyond "Ref #<num> - <URUSAN> - <TUGASAN> - ".\nJoin clauses with "," or "and" or "&". Say what changed, in simple words.\nGot: ${msg}`);
      }
      const desc = msg.split(' - ').pop();
      const nonChange = /\b(keep|kept|keeping|leave|leaving|left|untouched|unchanged|retain|retained|retains|remain|remains|remained|still)\b/i.exec(desc);
      if (nonChange) {
        blockCommit(`⚔️ COMMIT MESSAGE — "${nonChange[1]}" describes a NON-change.\n\nA subject says what CHANGED in this commit, never what was left alone. Files that were not touched are not in the diff and do not belong in the message.\nGot: ${msg}`);
      }
      if (msg.length > 100) {
        blockCommit(`⚔️ COMMIT MESSAGE — ${msg.length} chars, max 100.\n\nShorter, not longer. Got: ${msg}`);
      }
      // v4: verbs must match the STAGED diff. "rename" needs an R entry, "remove"/"delete" a D entry,
      // "add" an A entry. And an R entry in the diff must be named as a rename (not "move").
      try {
        const { execSync } = require('child_process');
        const repoDir = cdMatch ? cdMatch[1].trim() : process.cwd();
        const status = execSync('git diff --cached --name-status', { cwd: repoDir, encoding: 'utf8', windowsHide: true });
        const letters = new Set(status.split('\n').map(l => l.trim()[0]).filter(Boolean));
        const want = [];
        if (/\brename[sd]?\b/i.test(desc) && !letters.has('R')) want.push('"rename" but no renamed (R) file is staged');
        if (/\b(remove[sd]?|delete[sd]?)\b/i.test(desc) && !letters.has('D')) want.push('"remove/delete" but no deleted (D) file is staged');
        if (/\badd(s|ed)?\b/i.test(desc) && !letters.has('A')) want.push('"add" but no added (A) file is staged');
        if (letters.has('R') && !/\brename[sd]?\b/i.test(desc)) want.push('staged renames (R) exist but the subject does not say "rename" (say rename, not move)');
        if (want.length) {
          blockCommit(`⚔️ COMMIT MESSAGE — verbs do not match the staged diff.\n\n${want.map(w => '  - ' + w).join('\n')}\nStaged status letters: ${[...letters].join(' ') || 'none'}\nGot: ${msg}`);
        }
      } catch (e) { /* fail-open: no repo or git error */ }
    }

    // v2: checks 3a/3b are UNCONDITIONAL on any work-repo commit. Per みや 2026-08-05:
    // "Whatever the fuck it is if I don't mention always stop at the fucking staging.
    //  Don't fucking simply commit." Quest resolution must NEVER be able to switch them off —
    // the old `if (state.qa === 'none' || state.status === 'idle') process.exit(0)` did exactly
    // that whenever the quest was closed/archived or the QA could not be matched.
    const state = pickTargetState(cmd);

    // Check 3a: staging must be a SEPARATE step (stop-at-staging) — ALWAYS
    const combinedStage = /git\s+add\b/.test(cmd);
    const autoStage = /git\s+commit\s+-[a-z]*a[a-z]*\b/i.test(cmd)
      || /git\s+commit\b[^"']*\s--(amend|all)\b/i.test(cmd);
    if (combinedStage || autoStage) {
      blockCommit(`⚔️ COMMIT BLOCKED — ${state.qa}\n\nSTOP AT STAGING. Stage separately ( git add <files> ), show みや the staged diff + the drafted message, THEN commit in its own call.\nBanned: \`git add … && git commit\`, \`git commit -a/-am\`, \`--amend\`, \`--all\`.`);
    }

    // Check 3b: みや approved THIS commit message (one-shot flag) — ALWAYS
    const anyFlag = (() => {
      const dir = path.join(projectRoot, '.claude', 'state');
      try { return fs.readdirSync(dir).filter(f => /^commit-approved-.*\.flag$/.test(f)); } catch (e) { return []; }
    })();
    const namedFlag = path.join(projectRoot, '.claude', 'state', `commit-approved-${state.qa}.flag`);
    const useFlag = fs.existsSync(namedFlag) ? namedFlag
      : (anyFlag.length === 1 ? path.join(projectRoot, '.claude', 'state', anyFlag[0]) : null);
    if (!useFlag) {
      blockCommit(`⚔️ COMMIT BLOCKED — ${state.qa}\n\nNo approval on record for this commit MESSAGE.\nShow みや: (1) \`git diff --cached\`   (2) the drafted commit message, verbatim.\nHe replies with an approval phrase → that writes a one-shot flag → this gate opens for exactly ONE commit.\n\nDefault when he has said nothing: STOP AT STAGING. Never "simply commit".`);
    }
    // v3 (2026-08-21): consume MOVED to the end — consuming here meant a later block
    // (local-test / checklist) ate the approval and みや had to re-approve. QA-276504.

    // Quest-specific checks below only apply when a quest was actually resolved.
    if (state.qa === 'none' || state.status === 'idle') { try { fs.unlinkSync(useFlag); } catch (e) {} process.exit(0); }

    // Check 1: local test confirmed OR a green build (per みや 2026-08-28 — a successful
    // build substitutes for a manual local test; commit-message approval (3b) is still required).
    if (state.local_test_confirmed !== 'true') {
      const mod = path.basename(targetRepo.replace(/[\\/]+$/, ''));
      let buildGreen = false;
      try {
        const m = JSON.parse(fs.readFileSync(path.join(projectRoot, '.claude', 'state', `compile-ok-${mod}.json`), 'utf8'));
        buildGreen = m && m.ok === true;
      } catch (e) {}
      if (!buildGreen) {
        blockCommit(`⚔️ COMMIT BLOCKED — ${state.qa}\n\nNeither a green build nor local test on record.\nEither: run the build ( node domain/compile-gate/compile-check.js run ${mod} )\nOR test locally and tell me "local test confirmed".`);
      }
    }

    // Check 2: unchecked checklist items
    const projectFile = findQAProjectFile(state.qa);
    if (hasUncheckedItems(projectFile)) {
      blockCommit(`⚔️ COMMIT BLOCKED — ${state.qa}\n\nChecklist has unchecked [ ] items.\nComplete all items [x] first.\nFile: ${projectFile}`);
    }

    // (3a/3b moved ABOVE the quest-resolution guard in v2 — they are unconditional now.)

    try { fs.unlinkSync(useFlag); } catch (e) {}  // v3: consume ONLY when every check passed

    process.exit(0);
  } catch (e) {
    process.exit(0); // never block on error
  }
});
