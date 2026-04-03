/**
 * commit-gate.js — PreToolUse hook
 * Fires before every Bash tool call.
 * If the command is a git commit, checks:
 *   1. Is a quest active? (qa !== 'none')
 *   2. local_test_confirmed=true?
 *   3. No unchecked [ ] items in QA project file?
 * Blocks commit if any check fails.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const activePath = path.join(projectRoot, 'quest', 'active.txt');

function readActiveState() {
  const state = { qa: 'none', phase: '', status: 'idle', local_test_confirmed: 'false' };
  if (!fs.existsSync(activePath)) return state;
  const lines = fs.readFileSync(activePath, 'utf8').split('\n').filter(l => l.trim());
  lines.forEach(l => {
    const idx = l.indexOf('=');
    if (idx > -1) {
      state[l.substring(0, idx).trim()] = l.substring(idx + 1).trim();
    }
  });
  return state;
}

function findQAProjectFile(qaNumber) {
  const activeDir = path.join(projectRoot, 'projects', 'coding-projects', 'active');
  const qaDir = path.join(activeDir, `QA-${qaNumber}`);
  if (!fs.existsSync(qaDir)) return null;
  const files = fs.readdirSync(qaDir).filter(f => f.endsWith('.md'));
  if (files.length === 0) return null;
  return path.join(qaDir, files[0]);
}

function hasUncheckedItems(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return /\[\s\]/.test(content);
}

let inputData = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => inputData += d);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);

    // Only care about Bash tool
    if (input.tool_name !== 'Bash') process.exit(0);

    const cmd = (input.tool_input && input.tool_input.command) || '';

    // Only fire on git commit
    if (!/git\s+commit/.test(cmd)) process.exit(0);

    // Skip gate if committing inside the MemoryCore repo itself (system commits)
    const cwd = process.cwd().replace(/\\/g, '/');
    const memoryRoot = projectRoot.replace(/\\/g, '/');
    if (cwd.startsWith(memoryRoot)) process.exit(0);

    const state = readActiveState();

    // No active quest — let through
    if (state.qa === 'none' || state.status === 'idle') process.exit(0);

    // Check 1: local test confirmed
    if (state.local_test_confirmed !== 'true') {
      const block = {
        decision: 'block',
        reason: `⚔️ COMMIT BLOCKED — QA #${state.qa}\n\nLocal test not confirmed.\n\nBefore committing:\n1. Test the fix locally in the application\n2. Tell me "local test confirmed" — I will update quest/active.txt\n3. Then commit`
      };
      console.log(JSON.stringify(block));
      process.exit(0);
    }

    // Check 2: unchecked checklist items
    const projectFile = findQAProjectFile(state.qa);
    if (hasUncheckedItems(projectFile)) {
      const block = {
        decision: 'block',
        reason: `⚔️ COMMIT BLOCKED — QA #${state.qa}\n\nChecklist has unchecked items [ ] in the project file.\n\nVerify all items are complete [x] before committing.\nProject file: ${projectFile}`
      };
      console.log(JSON.stringify(block));
      process.exit(0);
    }

    // All clear — let through
    process.exit(0);

  } catch (e) {
    process.exit(0); // never block on error
  }
});
