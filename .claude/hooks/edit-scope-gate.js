/**
 * edit-scope-gate.js — PreToolUse hook on Edit
 *
 * Enforces PRESERVATION DISCIPLINE: blocks Edit when old_string contains
 * suspicious "delete-unrelated-code" signals — multi-line block with
 * comments, large old_string anchors that span >50 lines, or old_string
 * containing patterns like "// dead", "/* TODO" without clear refactor
 * justification.
 *
 * Advisory v1 — emits warning, doesn't hard-block (avoid over-firing).
 *
 * Created 2026-05-24 — addresses CRITICAL audit gap:
 * No PreToolUse hook validates Edit scope. 2026-05-12 QA-247710 slip:
 * Ruri deleted 100+ lines including warning comments because Edit allows
 * large old_string anchors. みや reset that work.
 */
let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};
    const oldString = toolInput.old_string || '';
    const newString = toolInput.new_string || '';
    const filePath = toolInput.file_path || '';

    // Only fire on code files (skip docs/state files)
    const codeFile = /\.(java|js|jsx|ts|tsx|py|xhtml|xml|json|sql)$/i.test(filePath);
    if (!codeFile) process.exit(0);

    // Detect large deletion: old_string >50 lines AND new_string smaller
    const oldLines = oldString.split('\n').length;
    const newLines = newString.split('\n').length;
    const linesDeleted = oldLines - newLines;

    const warnings = [];

    if (linesDeleted > 50) {
      warnings.push(`Large deletion: ${linesDeleted} net lines removed (${oldLines} → ${newLines})`);
    }

    // Detect deletion of comments / warning blocks
    const commentDel = (oldString.match(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|#[^\n]*/g) || []).length;
    const commentNew = (newString.match(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|#[^\n]*/g) || []).length;
    if (commentDel > commentNew + 3) {
      warnings.push(`Comment block removal: ${commentDel - commentNew} comments deleted — verify intentional`);
    }

    // Detect TODO/WARNING/FIXME removal
    if (/\b(TODO|FIXME|WARNING|HACK|XXX)\b/.test(oldString) && !/\b(TODO|FIXME|WARNING|HACK|XXX)\b/.test(newString)) {
      warnings.push('WARNING/TODO/FIXME tag removed — verify the reminder is no longer needed');
    }

    if (warnings.length === 0) process.exit(0);

    const reminder = [
      '',
      '⚙️  edit-scope-gate: PRESERVATION DISCIPLINE check',
      `   File: ${filePath}`,
      '',
      'Potential scope concerns:',
      ...warnings.map(w => `  ⚠️  ${w}`),
      '',
      'PRESERVATION DISCIPLINE (per personality.md + quest-protocol.md Apply):',
      '  - Only modify scope-specific lines; never delete unrelated comments/context/dead-code without explicit nod',
      '  - Post-refactor dead-branch audit applies if creating new variant method',
      '',
      'If this edit is INTENTIONAL (scope correctly limited): proceed.',
      'If you are unsure: STOP, narrow the old_string to minimum surgical change.',
      '',
    ].join('\n');

    // Advisory only — don't block
    const response = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: reminder,
      },
    };
    process.stdout.write(JSON.stringify(response));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
