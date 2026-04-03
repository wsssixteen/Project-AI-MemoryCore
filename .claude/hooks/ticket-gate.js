/**
 * ticket-gate.js — UserPromptSubmit hook
 * Fires when みや submits a message. Detects QA # pattern.
 * If Phase 0 not confirmed for that QA → inject mandatory reminder.
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

let inputData = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => inputData += d);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);
    const prompt = input.prompt || '';

    // Only fire on QA # mentions
    const qaMatch = prompt.match(/QA\s*#?\s*(\d+)/i);
    if (!qaMatch) process.exit(0);

    const mentionedQA = qaMatch[1];
    const state = readActiveState();

    // Already active on this QA and past Phase 0 — let through
    if (state.qa === mentionedQA && state.phase && state.phase !== '0' && state.status !== 'idle') {
      process.exit(0);
    }

    // Phase 0 not confirmed — inject mandatory reminder
    const context = `
⚔️ QUEST GATE — QA #${mentionedQA} detected. Phase 0 not confirmed.

MANDATORY before any code work:
1. Ask みや: "What is the path to the Task folder for QA #${mentionedQA}?"
2. Read EVERY file in that folder (Glob + Read all)
3. Build scope checklist from the ticket materials
4. Present checklist and WAIT for confirmation
5. Only after confirmation: touch any codebase files

Do NOT open codebase files. Do NOT form hypotheses. Do NOT analyze code yet.
Use /quest start ${mentionedQA} <task-folder-path> to begin Phase 0.
`.trim();

    console.log(JSON.stringify({ additionalContext: context }));
    process.exit(0);

  } catch (e) {
    process.exit(0); // never block on error
  }
});
