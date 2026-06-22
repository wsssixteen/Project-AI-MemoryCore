/**
 * convention-check-gate.js — PreToolUse hook (Edit | Write | Bash)
 *
 * Catches the "best-practices-not-consulted" slip in its universal form:
 * before adding/changing ANY artifact (Java code, .docx template, config, SQL
 * data patch), Ruri must check what convention OTHER similar artifacts use — and
 * CITE the analog she checked. Rule: feedback_simplify_and_reference.md.
 *
 * v1.0 2026-05-25 — built after the QA-262869 no_kp slip.
 * v1.1 2026-05-26 — registered (PreToolUse Bash + Edit|Write); tightened postgres regex.
 * v1.2 2026-06-19 — BLOCKING for Java edits (per みや: "ensure 100% you check this
 *   code convention"). The v1.1 advisory reminder fired but didn't STOP the edit, so
 *   the convention-check kept getting skipped. Now a .java Edit/Write is DENIED unless
 *   the session transcript already cites an analog (a "← sibling <file:line>" diff line,
 *   or sibling/analog/convention/mirror language next to a <file>.<ext>:<line>).
 *   .docx / config / SQL stay ADVISORY (reminder only) — start-simple per
 *   /system-rules Rule 4; promote them on evidence. Mirrors quest-phase-gate.js
 *   deny-pattern: transcript-scan · fail-open · bypass token.
 * v1.3 2026-06-20 (QA-261986/QA-261517, per みや) — (a) added `jsf` kind so .xhtml
 *   edits fire the gate (ADVISORY); QA-261517's wrong-approach was an .xhtml edit the
 *   gate didn't even detect. (b) universal IN-FILE-FIRST line: grep the TARGET FILE for
 *   its own existing idiom before adding parallel code (gate checked siblings, not the
 *   target file's own convention).
 *
 *   CAN (shape/presence ~100%): verify an analog WAS cited before a Java edit → kills SKIPPING.
 *   CANNOT (correctness — stays judgment): verify the cited analog is the RIGHT one.
 *   Fail-OPEN: transcript unreadable / parse error → advisory only, never block on our bug.
 *   Bypass: [skip-convention-check: <reason>] anywhere in the session.
 *   Log: .claude/hooks/convention-check-gate.log.jsonl (per /system-rules Rule 5).
 */
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'convention-check-gate.log.jsonl');

// Markers proving a convention-check happened this session (any one suffices)
const ANALOG_CITED = /←\s*sibling|\bsibling\b[^\n]{0,90}\b[\w/.\\-]+\.\w+:\d+|\banalog\b[^\n]{0,90}:\d+|\bconvention\b[^\n]{0,90}:\d+|\bmirror(?:s|ed|ing)?\b[^\n]{0,90}:\d+/i;
const BYPASS = /\[skip-convention-check:/i;

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail }) + '\n'); } catch (_) {}
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
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

    // Detect artifact kind (unchanged from v1.1)
    if (toolName === 'Edit' || toolName === 'Write') {
      if (/\.java$/i.test(filePath)) { kind = 'java'; extra = filePath; }
      else if (/\.docx$/i.test(filePath)) { kind = 'docx'; extra = filePath; }
      else if (/\.xhtml$/i.test(filePath)) { kind = 'jsf'; extra = filePath; }
      else if (/\.(json|xml|properties)$/i.test(filePath) && /(template|resources|config)/i.test(filePath)) { kind = 'config'; extra = filePath; }
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
      jsf: [
        '  - 🚨 Grepped the TARGET FILE ITSELF for how it already does this (e.g. resolveFirstComponentWithId, an existing listener/process/update idiom used elsewhere in the SAME file) — reuse it, do NOT invent a new mechanism (QA-261517 slip)?',
        '  - Read a sibling component/input in the SAME file/panel that works correctly + copied its full wiring (mbb / helper / VO / listener / process / update)?',
        '  - Cited the sibling component file:line in the chat prose BEFORE this edit?',
      ],
      config: [
        '  - Read at least ONE existing entry to see the value-shape convention?',
        '  - Cited the example you mirrored?',
      ],
      sql: [
        '  - Queried other rows in this table to see the VALUE-FORMAT convention for the column(s) you are setting/inserting?',
        '  - Cited a sample of existing values in the chat prose BEFORE the UPDATE/INSERT?',
        '  - Audit columns (created_by / last_modified_by) — matches sibling rows on the same aplikasi? NEVER ticket/session-specific identifiers.',
        '  - For UPDATE: prefer omitting audit columns from SET. For INSERT: mirror a sibling row.',
        '  - Soft-delete check, FK checks (per data-operation safety rule)?',
      ],
    };

    const headline = {
      java: `Edit on Java file — convention-check required first.`,
      docx: `Edit on .docx template — convention-check required first.`,
      jsf: `Edit on .xhtml/JSF file — convention-check required first.`,
      config: `Edit on config/resource file — convention-check required first.`,
      sql: `SQL UPDATE/INSERT on ${extra} — convention-check required first.`,
    };

    const context = [
      '',
      `⚙️  convention-check-gate: ${headline[kind]}`,
      '',
      'Per feedback_simplify_and_reference.md "find working analog first" — universal rule across code/template/data:',
      '  - 🚨 IN-FILE FIRST (QA-261986/QA-261517): grep the TARGET FILE ITSELF for an existing method/branch/idiom/attribute that already does this — reuse it; do NOT add parallel/new code when the file already has the pattern.',
      ...checks[kind],
      '',
      'If you have NOT done the convention-check this turn: STOP, run the check (Grep/Read/SELECT), CITE the analog in chat prose, THEN proceed with this edit.',
      'If you HAVE done it: proceed.',
      '',
      'Banned: emitting an edit/UPDATE/INSERT whose value-shape was chosen without a working-analog citation.',
      '',
    ].join('\n');

    const emitAdvisory = () => {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: context },
      }));
      process.exit(0);
    };

    // ── v1.2 BLOCKING for Java edits ────────────────────────────────────────
    if (kind === 'java') {
      let transcript = '';
      try {
        transcript = fs.readFileSync(data.transcript_path, 'utf8');
      } catch (e) {
        logFire('fail-open', filePath); // can't read transcript → advisory only
        return emitAdvisory();
      }
      if (BYPASS.test(transcript) || ANALOG_CITED.test(transcript)) {
        logFire('allowed', filePath); // analog citation present → proceed (+ reminder)
        return emitAdvisory();
      }
      logFire('blocked', filePath);
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: [
            `🚫 convention-check-gate: Java edit blocked — no analog citation found this session.`,
            `   File: ${filePath}`,
            `   Per "find working analog first": BEFORE editing, read >=1 sibling method/class and`,
            `   CITE it in chat as  <file>.java:<line>  (or the "<- sibling <file:line>" diff line).`,
            `   This gate checks the citation EXISTS (anti-skip); it does NOT verify it's the right`,
            `   analog — that stays your judgment.`,
            `   Legitimate non-analog edit? add [skip-convention-check: <reason>] to your message.`,
          ].join('\n'),
        },
      }));
      process.exit(0);
    }

    // docx / config / sql → advisory (unchanged from v1.1)
    logFire('advisory', kind);
    emitAdvisory();
  } catch (e) {
    process.exit(0);
  }
});
