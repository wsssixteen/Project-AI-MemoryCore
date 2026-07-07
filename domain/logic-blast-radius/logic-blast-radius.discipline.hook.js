/**
 * logic-blast-radius.discipline.hook.js — PreToolUse hook (Edit | Write)
 *
 * v2 2026-07-07 — quest-gate REMOVED per みや ("checks must always fire on etanah
 * fix work even outside quests"); relocated from .claude/hooks/logic-blast-radius-gate.js.
 * v1 (2026-07-02, QA-268273) required a status=active block in quest/active.txt,
 * which made the gate silently dark on ad-hoc "apply this fix" work outside quests.
 * v2 deletes the active.txt read entirely — the ONLY predicates are the path checks.
 *
 * HARD-BLOCK: forbids editing an etanah STATEFUL-FLOW .java file (Form lifecycle,
 * action handler, shared Service or Helper or Manager) until this session has emitted
 * a LOGIC BLAST RADIUS scenario-matrix (the mandatory Rubric step, quest-protocol.md
 * "Logic Blast Radius" section).
 *
 * WHAT THIS CAN AND CANNOT DO (read before trusting a PASS):
 *   CAN  (presence — near 100%): verify a Logic-Blast-Radius scenario matrix EXISTS
 *        this session before a stateful-flow etanah .java edit. Kills SKIPPING the check.
 *   CANNOT (correctness — stays human judgment): verify the matrix enumerated EVERY
 *        action or state path, or that each Safe? verdict is backed by real Evidence.
 *        A shape-valid but shallow matrix PASSES. NEVER read a PASS as "logic proven safe".
 *
 * Fail-OPEN: any error (no transcript, parse fail) → ALLOW.
 *   A gate must never block an edit because of its own bug.
 *
 * Bypass: include [skip-logic-blast: <reason>] anywhere in the session transcript —
 *   for a non-stateful change wrongly matched, or audit and compliance edits.
 *
 * Fires ONLY when the Edit or Write target is an etanah STATEFUL-FLOW .java path:
 *   path contains etanah-pelupusan or etanah-awam or etanah-common or etanah-teknikal
 *   followed by a path separator, AND the filename ends with Form or Bean or Handler
 *   or Helper or Service or Controller or Manager plus the .java extension.
 *   Example match: E:\Projects\Melaka\etanah-pelupusan\src\main\java\my\gov\MlkFooForm.java
 *   Otherwise → ALLOW (exit 0, silent). Templates, config, xhtml, docx never trigger it.
 *
 * Marker contract: the Logic Blast Radius emit carries the canonical banner
 *   with three box-drawing bars (or the ASCII === form) followed by the words
 *   LOGIC BLAST RADIUS. Banner-only by design — a loose phrase match false-passes
 *   on /verify output and meta-discussion.
 *
 * Log: appends fire records (blocked / allowed / bypassed) to log.jsonl beside this
 *   file; override the path with the LOGIC_BLAST_LOG env var (used by eval.js).
 */
const fs = require('fs');
const path = require('path');

function logFire(action, detail) {
  try {
    const logPath = process.env.LOGIC_BLAST_LOG || path.resolve(__dirname, 'log.jsonl');
    fs.appendFileSync(
      logPath,
      JSON.stringify(Object.assign({ ts: new Date().toISOString(), action }, detail)) + '\n'
    );
  } catch (e) {
    // logging must never break the gate
  }
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || toolInput.path || '';

    // Predicate — etanah STATEFUL-FLOW .java path (the ONLY gate condition in v2)
    const isEtanahJava =
      /etanah-(pelupusan|awam|common|teknikal)[\\/]/i.test(filePath) &&
      /\.java$/i.test(filePath);
    const isStatefulFlow =
      /(Form|Bean|Handler|Helper|Service|Controller|Manager)\.java$/i.test(filePath);
    if (!isEtanahJava || !isStatefulFlow) process.exit(0);

    // Read this session's transcript (fail-open if unavailable — never block on our bug)
    let transcript = '';
    try {
      transcript = fs.readFileSync(data.transcript_path, 'utf8');
    } catch (e) {
      process.exit(0);
    }

    // Bypass token
    if (/\[skip-logic-blast:/i.test(transcript)) {
      logFire('bypassed', { file: filePath });
      process.exit(0);
    }

    // Logic-Blast-Radius marker: the BANNER only (box-char ═══ or ASCII === form).
    // Banner-only by design — NOT a loose phrase match: "logic blast radius" +
    // "Evidence" or "Safe?" appear in normal /verify output + meta-discussion, which
    // would false-PASS the gate. Requiring the banner means the matrix was deliberate.
    const hasLogicMatrix =
      /(?:═══|===)\s*LOGIC[\s-]*BLAST[\s-]*RADIUS/i.test(transcript);
    if (hasLogicMatrix) {
      logFire('allowed', { file: filePath });
      process.exit(0); // logic matrix emitted → allow
    }

    const reason = [
      '🚫 logic-blast-radius-gate: no LOGIC BLAST RADIUS scenario matrix emitted this session.',
      `   Edit blocked: ${filePath}`,
      '   You are about to edit a stateful-flow etanah class without the mandatory logic',
      '   check. Enumerate EVERY action/state path the change participates in',
      '   (page init/entry · each action handler · re-entry/reload) and verify it is SAFE per path:',
      '',
      '     ═══ LOGIC BLAST RADIUS ═══',
      '     | Scenario (action × state) | Change fires? | Outcome | Safe? | Evidence (file:line/test) |',
      '',
      '   Each Outcome/Safe? verdict MUST cite OBSERVED file:line or a live test in Evidence —',
      '   an ASSUMED verdict = STOP, go read/observe first. (quest-protocol.md "Logic Blast Radius".)',
      '   This gate checks the matrix EXISTS (anti-skip); it does NOT verify it is complete/correct.',
      '   Genuinely non-stateful change wrongly matched, or audit edit? add',
      '   [skip-logic-blast: <reason>] to your message.',
    ].join('\n');

    logFire('blocked', { file: filePath });
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: reason,
        },
      })
    );
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
