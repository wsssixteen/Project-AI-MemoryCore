/**
 * meta-edit-gate.js — PreToolUse hook on Edit|Write
 *
 * Recursive safety for the meta-layer itself. Intercepts edits to paths
 * under meta/* (and the personality.md Honesty Invariants section, and
 * meta-layer-related skills/hooks) and surfaces a verification step:
 * was meta-design-router invoked first?
 *
 * Doesn't HARD block (would over-fire on legitimate plan-mode edits etc.).
 * Emits visible-gate reminder so みや can spot bypass attempts.
 *
 * Created 2026-05-23 — Phase 6 of meta-layer build.
 * Origin: Stage 5 recursive-safety requirement — meta-layer must apply
 * its own rules to itself. "Who watches the watcher?"
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

    // Meta-layer paths
    const metaPathPatterns = [
      /[\\/]meta[\\/]/i,                            // anything under meta/
      /personality\.md/i,                            // personality.md
      /meta-design-router/i,                         // meta-design-router skill (future)
      /(claim-verification|task-assignment-honesty|stalling-detector|scope-anchor-echo|over-generalization-check|test-data-echo)/i,  // Honesty primitives
      /(rubric|predicate-box|grep-rubric|multi-dim-evidence|sycophancy-circuit-breaker|confidence-table)[\\/]SKILL\.md/i,  // Discipline primitives
      /(boot-required-read-gate|pre-action-check-gate|inventory-first-gate|prose-default-gate|silent-claim-drift-gate|best-practices-consult-gate|meta-edit-gate|user-side-guardrail)\.js/i,  // Enforcement + user-side hooks
    ];

    const isMetaPath = metaPathPatterns.some(re => re.test(filePath));
    if (!isMetaPath) process.exit(0);

    const context = [
      '',
      '⚙️  meta-edit-gate: edit on meta-layer path detected',
      `   Path: ${filePath}`,
      '',
      'Meta-layer self-enforcement: edits to meta-layer files require',
      'meta-design-router to have been invoked first (recursive correctness).',
      '',
      'Self-check before proceeding:',
      '  1. Was meta-design-router invoked in this conversation?',
      '  2. Did Step 0 (inventory) confirm the change is correct shape?',
      '  3. Did Step 3.5 (best-practices) check the library-items reference?',
      '  4. Is this edit logged in skill-failure-log if it\'s a refinement from a slip?',
      '',
      'If ANY answer is "no" — pause and route through meta-design-router first.',
      'If all "yes" — proceed; the edit will also fire other gates (claim-verification at done-time).',
      '',
    ].join('\n');

    // Advisory feedback via PreToolUse additionalContext
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
