/**
 * branch-at-apply-gate.js — PreToolUse hook (fires before every Bash tool call)
 *
 * Enforces the CLAUDE.md "branch-at-Apply ban": branch creation/switch is a
 * Phase-1 Commit-prep step ONLY — never during Discovery/Recon/Rubric/Apply.
 * The recurring slip (branch-at-Apply-ban-violation, 2 strikes) was a SILENT
 * unilateral `git checkout mlk/qa/<n>` during Apply, when the right move was to
 * surface the base-branch decision to みや first.
 *
 * Fires when ALL hold:
 *   - the Bash command is a branch SWITCH or CREATE on a WORK repo
 *     (git switch / git checkout -b / git checkout <branch-ref> / git branch <name>)
 *     — NOT file-restore (`git checkout -- file`), NOT listing (`git branch`),
 *       NOT delete (`git branch -d`)
 *   - the repo target (from `git -C <path>` or cwd) is NOT the MemoryCore repo
 *     (worktree/branch ops on MemoryCore itself are exempt)
 *   - an active quest in quest/active.txt is in a PRE-Commit phase
 *   - no one-shot approval flag .claude/state/base-branch-approved-<QA>.flag exists
 *
 * Bypass (みや-approved base branch): when みや approves a base, write
 *   .claude/state/base-branch-approved-<QA>.flag — the gate opens for ONE branch
 *   op and consumes the flag (mirrors commit-gate's commit-approved-<QA>.flag).
 *
 * Fails OPEN on any error (a broken hook never blocks). Logs every decision to
 * .claude/state/branch-at-apply-gate.log.jsonl (system-rules Rule 5).
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const activePath = path.join(projectRoot, 'quest', 'active.txt');
const stateDir = path.join(projectRoot, '.claude', 'state');
const logPath = path.join(stateDir, 'branch-at-apply-gate.log.jsonl');

// Phases at/after which branch ops ARE legitimate (Commit-prep onward).
const CLOSING_PHASES = ['Commit', 'Push', 'Closed', 'Close', 'Wrap', 'Closed-Phase1'];
const TERMINAL_STATUS = ['closed', 'archived'];

function logDecision(obj) {
  try {
    if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(obj) + '\n');
  } catch (e) { /* logging never blocks */ }
}

function parseBlocks() {
  if (!fs.existsSync(activePath)) return [];
  return fs.readFileSync(activePath, 'utf8').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(b => {
    const o = {};
    b.split('\n').forEach(l => { const i = l.indexOf('='); if (i > -1) o[l.substring(0, i).trim()] = l.substring(i + 1).trim(); });
    return o;
  }).filter(o => o.qa);
}

// The repo this git command acts on: `git -C <path>` target, else cwd.
function repoTarget(cmd) {
  const m = cmd.match(/\bgit\s+-C\s+("([^"]+)"|'([^']+)'|(\S+))/);
  const p = m ? (m[2] || m[3] || m[4] || '') : process.cwd();
  return p.replace(/\\/g, '/');
}

// Is the command a branch SWITCH or CREATE (not file-restore / list / delete)?
function isBranchSwitchOrCreate(cmd) {
  if (/\bgit\b[^\n]*\bswitch\b/.test(cmd) && !/\bswitch\s+--?h/.test(cmd)) return true;          // git switch / switch -c
  if (/\bgit\s+(-C\s+\S+\s+)?checkout\s+(-b|-B|--orphan)\b/.test(cmd)) return true;               // create branch
  // git branch <name> (create) — exclude list/delete/move/info flags
  if (/\bgit\s+(-C\s+\S+\s+)?branch\s+(?!-d\b|-D\b|--delete\b|-a\b|-r\b|-v\b|-vv\b|--list\b|--contains\b|--show-current\b|--merged\b|--no-merged\b|--all\b|-m\b|-M\b)[^\s-]/.test(cmd)) return true;
  // git checkout <ref> (switch) — token after checkout that is a branch-like ref
  const m = cmd.match(/\bgit\s+(?:-C\s+(?:"[^"]+"|'[^']+'|\S+)\s+)?checkout\s+(\S+)/);
  if (m) {
    const arg = m[1].replace(/^["']|["']$/g, '');
    if (arg === '--' || arg.startsWith('-')) return false;                                        // file-restore or flag
    if (/^(mlk\/|origin\/|HEAD$|main$|master$)/.test(arg)) return true;                           // clearly a branch ref
    if (!arg.includes('/') && !/\.\w+$/.test(arg)) return true;                                   // bare branch name (no path, no ext)
  }
  return false;
}

function block(reason) { console.log(JSON.stringify({ decision: 'block', reason })); process.exit(0); }

let inputData = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => inputData += d);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);
    if (input.tool_name !== 'Bash') process.exit(0);
    const cmd = (input.tool_input && input.tool_input.command) || '';
    if (!/\bgit\b/.test(cmd)) process.exit(0);
    if (!isBranchSwitchOrCreate(cmd)) process.exit(0);

    // Exempt the MemoryCore repo itself (worktree/branch management is fine).
    const memoryRoot = projectRoot.replace(/\\/g, '/');
    if (repoTarget(cmd).startsWith(memoryRoot)) process.exit(0);

    // Find an active quest in a pre-Commit phase.
    const blocks = parseBlocks();
    const active = blocks.find(o => o.status === 'active' && !TERMINAL_STATUS.includes(o.status));
    if (!active) process.exit(0);
    const phase = (active.current_phase || '').trim();
    const isClosing = CLOSING_PHASES.includes(phase);
    if (isClosing) process.exit(0);

    // One-shot bypass: みや-approved base branch.
    const flagPath = path.join(stateDir, `base-branch-approved-${active.qa}.flag`);
    if (fs.existsSync(flagPath)) {
      try { fs.unlinkSync(flagPath); } catch (e) {}
      logDecision({ ts: new Date().toISOString(), qa: active.qa, phase, cmd: cmd.slice(0, 200), decision: 'allow-by-flag' });
      process.exit(0);
    }

    logDecision({ ts: new Date().toISOString(), qa: active.qa, phase, cmd: cmd.slice(0, 200), decision: 'block' });
    block(
      `🔒 BRANCH-AT-APPLY GATE — ${active.qa} (current_phase=${phase || 'pre-Commit'})\n\n` +
      `Branch switch/create on a work repo while the quest is BEFORE Commit-prep is banned ` +
      `(CLAUDE.md branch-at-Apply ban). The recurring slip was a silent unilateral checkout during Apply.\n\n` +
      `If the rework genuinely needs a different base branch:\n` +
      `  1. STOP and surface the base-branch decision to みや (state the options + why).\n` +
      `  2. When みや picks a base, record it + write the one-shot approval flag:\n` +
      `       .claude/state/base-branch-approved-${active.qa}.flag\n` +
      `  3. Re-run the checkout — the gate opens for exactly one branch op.\n\n` +
      `Branch CREATION for the fix belongs in Phase-1 Commit-prep, not here.`
    );
  } catch (e) {
    process.exit(0); // never block on error
  }
});
