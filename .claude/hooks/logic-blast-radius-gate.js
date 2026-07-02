/**
 * logic-blast-radius-gate.js — PreToolUse hook (Edit | Write)
 *
 * HARD-BLOCK: forbids editing an etanah STATEFUL-FLOW .java file (Form lifecycle /
 * action handler / shared Service|Helper|Manager) DURING AN ACTIVE QUEST until this
 * session has emitted a LOGIC BLAST RADIUS scenario-matrix (the mandatory Rubric step,
 * quest-protocol.md "🚨 Logic Blast Radius").
 *
 * Built 2026-07-02 (per みや, QA-268273) — the structural defender for the LOGIC check.
 * Until now the Logic Blast Radius was prose-only (model-run) and did NOT fire reliably
 * (e.g. QA-268273 itself applied a stateful-flow fix without the formal matrix). This hook
 * makes it deterministic — the sibling of quest-phase-gate.js for the *logic* dimension.
 *
 * ── WHAT THIS CAN AND CANNOT DO (read before trusting a PASS) ────────────────
 *   CAN  (presence — ~100%): verify a Logic-Blast-Radius scenario matrix EXISTS this
 *        session before a stateful-flow etanah .java edit.  → kills SKIPPING the logic check.
 *   CANNOT (correctness — stays human judgment): verify the matrix enumerated EVERY
 *        action/state path, or that each Safe? verdict is backed by real Evidence.
 *        A shape-valid but shallow matrix PASSES. Correctness = Ruri's honest per-path
 *        tracing + みや's glance. NEVER read a PASS here as "logic proven safe".
 *
 * Fail-OPEN: any error (no transcript, parse fail, no active.txt) → ALLOW.
 *   A gate must never block an edit because of its own bug.
 *
 * Bypass: include [skip-logic-blast: <reason>] anywhere in the session (visible in the
 *   transcript) — for a non-stateful change wrongly matched, or audit/compliance edits.
 *
 * Fires ONLY when ALL hold:
 *   (a) Edit/Write target is an etanah-* STATEFUL-FLOW .java path
 *       (filename ends Form|Bean|Handler|Helper|Service|Controller|Manager .java), AND
 *   (b) quest/active.txt has a status=active block.
 *   Otherwise → ALLOW (exit 0, silent). Templates/config/xhtml/.docx never trigger it.
 *
 * Marker contract: the Logic Blast Radius emit carries the canonical banner
 *   ═══ LOGIC BLAST RADIUS ═══
 * OR the phrase "Logic Blast Radius" together with the matrix columns (Safe? + Evidence).
 */
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || toolInput.path || '';

    // (a) Predicate 1 — etanah STATEFUL-FLOW .java path
    const isEtanahJava =
      /etanah-(pelupusan|awam|common|teknikal)[\\/]/i.test(filePath) &&
      /\.java$/i.test(filePath);
    const isStatefulFlow =
      /(Form|Bean|Handler|Helper|Service|Controller|Manager)\.java$/i.test(filePath);
    if (!isEtanahJava || !isStatefulFlow) process.exit(0);

    // (b) Predicate 2 — an active quest exists
    const root = path.resolve(__dirname, '..', '..');
    let activeTxt = '';
    try {
      activeTxt = fs.readFileSync(path.join(root, 'quest', 'active.txt'), 'utf8');
    } catch (e) {
      process.exit(0); // no active.txt → not in quest context → allow
    }
    if (!/\bstatus=active\b/.test(activeTxt)) process.exit(0);

    // Read this session's transcript (fail-open if unavailable — never block on our bug)
    let transcript = '';
    try {
      transcript = fs.readFileSync(data.transcript_path, 'utf8');
    } catch (e) {
      process.exit(0);
    }

    // Bypass token
    if (/\[skip-logic-blast:/i.test(transcript)) process.exit(0);

    // Logic-Blast-Radius marker: the BANNER only (box-char ═══ or ASCII === form).
    // Banner-only by design — NOT a loose phrase match: "logic blast radius" +
    // "Evidence"/"Safe?" appear in normal /verify output + meta-discussion, which would
    // false-PASS the gate. Requiring the banner means the matrix was deliberately emitted.
    const hasLogicMatrix =
      /(?:═══|===)\s*LOGIC[\s-]*BLAST[\s-]*RADIUS/i.test(transcript);
    if (hasLogicMatrix) process.exit(0); // logic matrix emitted → allow

    const reason = [
      '🚫 logic-blast-radius-gate: no LOGIC BLAST RADIUS scenario matrix emitted this session.',
      `   Edit blocked: ${filePath}`,
      '   You are about to edit a stateful-flow etanah class during an active quest without the',
      '   mandatory logic check. Enumerate EVERY action/state path the change participates in',
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
