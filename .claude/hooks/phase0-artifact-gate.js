/**
 * phase0-artifact-gate.js — PreToolUse hook (matcher: Edit)
 *
 * When the active QA in quest/active.txt is at phase=0 AND Ruri attempts
 * Edit on an etanah codebase file (not a doc/note/template-edit-on-quest),
 * verify that projects/coding-projects/active/QA-<n>/early-diagnostic.md
 * exists. Block if missing (Phase 0 artifact gate per quest-protocol.md 2026-05-18).
 *
 * v1: warn-only. v1.1: block.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const activePath = path.join(projectRoot, 'quest', 'active.txt');
const logPath = path.join(projectRoot, 'Feature', 'Forge-Self-Improvement-System', 'phase0-gate-log.jsonl');

function getActiveQA() {
  try {
    const text = fs.readFileSync(activePath, 'utf8');
    // First (top) qa= block — the most recently touched
    const blockMatch = text.match(/^qa=QA-\d+[\s\S]*?(?=^qa=QA-|\Z)/m);
    if (!blockMatch) return null;
    const block = blockMatch[0];
    const qa = (block.match(/^qa=(QA-\d+)/) || [])[1];
    const phase = (block.match(/^phase=(\S+)/m) || [])[1];
    const status = (block.match(/^status=(\S+)/m) || [])[1];
    return { qa, phase, status, block };
  } catch (e) { return null; }
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const tool = data.tool_name || data.tool || '';
    if (tool !== 'Edit' && tool !== 'Write') process.exit(0);

    const fp = (data.tool_input && (data.tool_input.file_path || data.tool_input.path)) || '';
    // Only care about etanah codebase edits
    if (!/Projects[\\/]Melaka[\\/]etanah-(pelupusan|awam|common)/.test(fp)) process.exit(0);

    const active = getActiveQA();
    if (!active || active.phase !== '0' || active.status === 'idle' || active.status === 'closed') process.exit(0);

    const qaNum = active.qa.replace('QA-', '');
    const earlyDiag = path.join(projectRoot, 'projects', 'coding-projects', 'active', active.qa, 'early-diagnostic.md');
    const qaDoc = path.join(projectRoot, 'projects', 'coding-projects', 'active', active.qa, `${active.qa}.md`);

    if (fs.existsSync(earlyDiag) || fs.existsSync(qaDoc)) process.exit(0);

    const entry = {
      ts: new Date().toISOString(),
      qa: active.qa,
      file: fp,
      action: 'warn-only-v1',
    };
    try { fs.appendFileSync(logPath, JSON.stringify(entry) + '\n'); } catch (_) {}

    process.stderr.write(`\n⚠️  phase0-gate: ${active.qa} is at phase=0 but ${earlyDiag} doesn't exist. Per Phase 0 artifact gate, no codebase edits until early-diagnostic.md exists.\n`);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
