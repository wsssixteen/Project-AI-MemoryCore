/**
 * stop-point-todo-table.discipline.hook.js — PostToolUse hook on Edit | Write | NotebookEdit
 *
 * Soft reminder: after any code-file Edit/Write, inject a context line nudging Ruri to emit
 * a "what to do next" table (Ruri's part | みや's part) before stopping the turn.
 *
 * Pairs with the existing `stop-point-summary` skill — the skill carries the FULL procedure;
 * this hook just fires the auto-reminder so the skill gets invoked reliably after every
 * substantive code change.
 *
 * Why: みや asked for "ALWAYS share the list of to do in a table after every code
 * implementations" + the preferred shape is the simple part-by-part table from the
 * stop-point-summary skill. Without auto-fire, the emit gets forgotten.
 *
 * Advisory only — does not block. Bypass: include `[skip-stop-point-todo: <reason>]` in reply.
 *
 * Created 2026-06-30 per みや — Option A (recommended over hard-block + skill-only refinement).
 */
'use strict';

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name || '';
    if (!/^(Edit|Write|NotebookEdit)$/.test(toolName)) { process.exit(0); }

    const filePath = (data.tool_input || {}).file_path || '';
    // Only fire for code files; skip docs/state/log/json-config writes (those don't need a test cycle)
    const codeFile = /\.(java|js|jsx|ts|tsx|py|rb|go|rs|c|cpp|h|hpp|xhtml|xml|sql|html|css|scss|less|sh|bat|ps1)$/i.test(filePath);
    if (!codeFile) { process.exit(0); }

    const reminder = [
      '',
      '🔔 stop-point-todo-table: code Edit/Write detected on ' + filePath,
      '',
      'Before stopping THIS turn, emit a "what to do next" table:',
      '',
      '  | # | Step                | Ruri\'s part            | みや\'s part            |',
      '  |---|---------------------|------------------------|------------------------|',
      '  | 1 | (current change)    | what I did             | —                      |',
      '  | 2 | rebuild/test        | —                      | みや\'s next action     |',
      '  | 3 | report findings     | —                      | tell Ruri              |',
      '  | 4 | next fix or close   | apply/close            | —                      |',
      '',
      'Skill carries full procedure: `stop-point-summary` (.claude/skills/stop-point-summary/SKILL.md).',
      'Bypass this turn: include `[skip-stop-point-todo: <reason>]` anywhere in the reply.',
      '',
    ].join('\n');

    const response = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: reminder,
      },
    };
    process.stdout.write(JSON.stringify(response));
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
