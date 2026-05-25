/**
 * convention-check-gate.js — PreToolUse hook (Edit | Write | Bash)
 *
 * Catches the "best-practices-not-consulted" slip in its universal form:
 * before adding/changing ANY artifact (Java code, .docx template,
 * config, SQL data patch), Ruri must check what convention OTHER similar
 * artifacts use — and CITE the analog she checked.
 *
 * The rule lives in feedback_simplify_and_reference.md ("find working
 * analog first") but kept getting skipped because it was prose-only.
 * 2026-05-25 saw it slip 4+ times in one session (Java populator
 * convention, .docx SDT nesting, data-patch no_kp format, separator
 * choice for syarat list). This hook fires the deterministic reminder
 * at the moment Ruri is about to commit the change.
 *
 * Triggers on:
 *   - Edit/Write to .java, .docx, .json, .xml under etanah-pelupusan/src or templates/
 *   - Bash commands containing "UPDATE " or "INSERT INTO " (SQL data patch)
 *   - MCP postgres tool calls (caught via tool_name = mcp__postgres-*)
 *
 * Non-blocking — injects visible-gate reminder. Reminder content
 * adapts to the artifact type (Java / .docx / SQL).
 *
 * Created 2026-05-25 — built in-turn after the QA-262869 no_kp slip.
 * v1.1 2026-05-26 — Promoted to active hooks dir + registered in settings.json
 * (both PreToolUse Bash and PreToolUse Edit|Write). Tightened postgres MCP
 * regex to match exact query tool names (was matching read_resource etc.).
 */
let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || toolInput.path || '';
    const command = toolInput.command || '';
    const query = toolInput.query || '';

    let kind = null;
    let extra = '';

    // Detect artifact kind
    if (toolName === 'Edit' || toolName === 'Write') {
      if (/\.java$/i.test(filePath)) {
        kind = 'java';
        extra = filePath;
      } else if (/\.docx$/i.test(filePath)) {
        kind = 'docx';
        extra = filePath;
      } else if (/\.(json|xml|properties)$/i.test(filePath) && /(template|resources|config)/i.test(filePath)) {
        kind = 'config';
        extra = filePath;
      }
    } else if (toolName === 'Bash') {
      if (/\bUPDATE\s+\w+|\bINSERT\s+INTO\s+\w+/i.test(command)) {
        kind = 'sql';
        const m = command.match(/(?:UPDATE\s+|INSERT\s+INTO\s+)([\w.]+)/i);
        extra = m ? m[1] : '(table)';
      }
    } else if (/^mcp__postgres.*query/i.test(toolName)) {
      if (/\bUPDATE\s+\w+|\bINSERT\s+INTO\s+\w+/i.test(query)) {
        kind = 'sql';
        const m = query.match(/(?:UPDATE\s+|INSERT\s+INTO\s+)([\w.]+)/i);
        extra = m ? m[1] : '(table)';
      }
    }

    if (!kind) process.exit(0);

    // Build kind-specific reminder
    const checks = {
      java: [
        '  - Have you read at least ONE similar method/populator/class to see the convention?',
        '  - Cited file:line of the analog in the chat prose BEFORE this edit?',
        '  - Variable naming, error handling, return-type idiom — matches what neighbors use?',
        '  - For populator methods: TEXT vs TABLE return type matches what methodMap registers for this tag?',
      ],
      docx: [
        '  - Read at least ONE sibling template that uses the same SDT tag to see its body shape?',
        '  - Compared SDT type (TEXT body vs TABLE body) with where the tag is registered in methodMap?',
        '  - Cited the sibling template + offset/section in the chat prose BEFORE this edit?',
      ],
      config: [
        '  - Read at least ONE existing entry to see the value-shape convention?',
        '  - Cited the example you mirrored?',
      ],
      sql: [
        '  - Queried other rows in this table to see the VALUE-FORMAT convention for the column(s) you are setting/inserting?',
        '  - Cited a sample of existing values in the chat prose BEFORE the UPDATE/INSERT?',
        '  - Audit columns (created_by / last_modified_by) — matches what sibling rows on the same aplikasi use? NEVER ticket-specific or session-specific identifiers.',
        '  - For UPDATE: prefer omitting audit columns from SET (leave them alone). For INSERT: mirror a sibling row.',
        '  - Soft-delete check, FK checks (per data-operation safety rule)?',
      ],
    };

    const headline = {
      java: `Edit on Java file — convention-check required first.`,
      docx: `Edit on .docx template — convention-check required first.`,
      config: `Edit on config/resource file — convention-check required first.`,
      sql: `SQL UPDATE/INSERT on ${extra} — convention-check required first.`,
    };

    const context = [
      '',
      `⚙️  convention-check-gate: ${headline[kind]}`,
      '',
      'Per feedback_simplify_and_reference.md "find working analog first" — universal rule across code/template/data:',
      ...checks[kind],
      '',
      'If you have NOT done the convention-check this turn: STOP, run the check (Grep/Read/SELECT), CITE the analog in chat prose, THEN proceed with this edit.',
      'If you HAVE done it: proceed.',
      '',
      'Banned: emitting an edit/UPDATE/INSERT whose value-shape was chosen without a working-analog citation.',
      '',
    ].join('\n');

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
