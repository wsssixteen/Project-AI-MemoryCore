/**
 * pre-action-check-gate.js — PreToolUse hook (Edit | Write)
 *
 * Catches the "pre-action-check-skip" slip category (9 occurrences in
 * 14-day baseline — Notes.txt missed 4×, PDF annotation skipped, server
 * log not loaded, env-check skipped, etc.).
 *
 * v1 scope: detect when Edit/Write touches a quest-related path
 * (1. Tasks/Melaka/, projects/coding-projects/active/QA-*, quest/active.txt)
 * and remind Ruri to verify Notes.txt is current before proceeding.
 * Doesn't BLOCK (would trip on legitimate cases); injects visible-gate
 * reminder.
 *
 * Created 2026-05-23 — Phase 2 of meta-layer build.
 * Iteration: tighten matching as evidence accumulates.
 */
let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || toolInput.path || '';

    // Quest-related path patterns
    const questPatterns = [
      /1\.\s?Tasks[\\/]Melaka/i,
      /projects[\\/]coding-projects[\\/]active[\\/]QA-/i,
      /quest[\\/]active\.txt/i,
      /etanah-pelupusan[\\/]src/i,
      /etanah-awam[\\/]src/i,
    ];

    const isQuestPath = questPatterns.some(re => re.test(filePath));
    if (!isQuestPath) process.exit(0);

    // Inject reminder
    const context = [
      '',
      '⚙️  pre-action-check-gate: edit on quest-related path detected',
      `   Path: ${filePath}`,
      '',
      'Pre-action checks (run these IF not already done this turn):',
      '  1. Notes.txt current for active quest? (read <Task folder>/1. Notes.txt)',
      '  2. env-check verified env target? (mlkuat / mlkfat / mkit per ticket)',
      '  3. PDF annotations extracted if BA PDF in 0. Brief/?',
      '  4. Server log path known if debugging? (E:/Dev/jboss-7.4-plp-melaka/standalone/log/server.log)',
      '',
      'If any "NO" — fire the relevant check BEFORE proceeding with this edit.',
      '',
    ].join('\n');

    // Use hookSpecificOutput.additionalContext for PreToolUse advisory
    const response = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: context,
      },
    };
    process.stdout.write(JSON.stringify(response));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
