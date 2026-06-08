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
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
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
  const m = cmd.match(/\bQA[ _#/-]*(\d{4,})\b/i);
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

    // Skip gate for commits inside the MemoryCore repo itself (system commits)
    const cwd = process.cwd().replace(/\\/g, '/');
    const memoryRoot = projectRoot.replace(/\\/g, '/');
    if (cwd.startsWith(memoryRoot)) process.exit(0);

    const state = pickTargetState(cmd);
    if (state.qa === 'none' || state.status === 'idle') process.exit(0);

    // Check 1: local test confirmed
    if (state.local_test_confirmed !== 'true') {
      blockCommit(`⚔️ COMMIT BLOCKED — ${state.qa}\n\nLocal test not confirmed.\n1. Test the fix locally\n2. Tell me "local test confirmed"\n3. Then commit`);
    }

    // Check 2: unchecked checklist items
    const projectFile = findQAProjectFile(state.qa);
    if (hasUncheckedItems(projectFile)) {
      blockCommit(`⚔️ COMMIT BLOCKED — ${state.qa}\n\nChecklist has unchecked [ ] items.\nComplete all items [x] first.\nFile: ${projectFile}`);
    }

    // Check 3a: staging must be a SEPARATE step (stop-at-staging)
    const combinedStage = /git\s+add\b/.test(cmd);
    const autoStage = /git\s+commit\s+-[a-z]*a[a-z]*\b/i.test(cmd)            // -a / -am / -ma as the leading flag
      || /git\s+commit\b[^"']*\s--(amend|all)\b/i.test(cmd);                  // --amend / --all (outside a quoted message)
    if (combinedStage || autoStage) {
      blockCommit(`⚔️ COMMIT BLOCKED — ${state.qa}\n\nPhase 1 closure must STOP AT STAGING.\nStage separately ( git add <files> ), show みや the staged diff + drafted message, THEN commit in its own call.\nBanned here: \`git add … && git commit\`, \`git commit -a/-am\`, \`--amend\`, \`--all\`.`);
    }

    // Check 3b: みや reviewed + approved (one-shot flag)
    const flagPath = path.join(projectRoot, '.claude', 'state', `commit-approved-${state.qa}.flag`);
    if (!fs.existsSync(flagPath)) {
      blockCommit(`⚔️ COMMIT BLOCKED — ${state.qa}\n\nNo review-approval on record.\nShow みや: (1) \`git diff --cached\`   (2) the drafted commit message.\nThen みや says an approval phrase ("commit approved" / "go ahead commit") → that writes the one-shot flag → this gate opens for exactly one commit.`);
    }
    try { fs.unlinkSync(flagPath); } catch (e) {}  // consume — next commit needs fresh approval

    process.exit(0);
  } catch (e) {
    process.exit(0); // never block on error
  }
});
