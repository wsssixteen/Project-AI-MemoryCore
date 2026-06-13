/**
 * deploy-proof-gate.js — Stop hook (the B4 refine, QA-260508 S3)
 *
 * PURPOSE: when a turn hands back for testing ("please test" / "ready for
 * verification") AFTER an etanah source-file edit (.java/.xhtml/.docx) this
 * session, AND no deploy-proof artifact is present (QA<num>-PROBE in log /
 * republish / build timestamp), emit an advisory: a pass/fail will be
 * AMBIGUOUS (fix-wrong vs stale-deploy) without deploy-proof.
 *
 * Models notes-on-test-data.js v1.1: stop_hook_active guard, fail-open, jsonl log.
 * Stage 5A = advisory (additionalContext, exit 0). A block-stage flip
 * (exit 2) is a separate later commit after an advisory-mode observation period.
 *
 * Fires ONLY when ALL hold:
 *   (a) a hand-back phrase is in the turn, AND
 *   (b) an etanah source edit (.java/.xhtml/.docx) happened this session, AND
 *   (c) no deploy-proof artifact present, AND
 *   (d) no [skip-deploy-proof: <reason>] bypass.
 * Otherwise → ALLOW (exit 0, silent).
 *
 * Fail-OPEN: any error → exit 0. A gate must never block on its own bug.
 * Bypass: [skip-deploy-proof: <reason>] (visible in transcript for audit).
 *
 * WHY: QA-260508 — said "please test" after a source edit without verifying the
 * running JVM held the new bytecode; the failed test was ambiguous until a probe
 * disambiguated. The probe doubling as deploy-proof IS the pattern this enforces.
 *
 * Trigger-reliability note (per /system-design): HANDBACK + SOURCE_EDIT are crisp;
 * false-positive cost is a diagnostic re-test of OLD code ("please re-test to
 * confirm the earlier finding still reproduces") — advisory + bypass absorb it.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = process.env.DEPLOY_PROOF_ROOT || path.join(__dirname, '..', '..');
const logPath = path.join(projectRoot, 'Feature', 'Forge-Self-Improvement-System', 'deploy-proof-log.jsonl');

const HANDBACK = /\b(please (?:re)?test|ready (?:for|to) (?:test|verif)|try (?:testing|again|to test)|test (?:it|now|again|on the)|go ahead and test|kindly test|can you (?:re)?test)\b/i;
const SOURCE_EDIT = /"file_path"\s*:\s*"[^"]*etanah-(?:pelupusan|awam|common|teknikal)[^"]*\.(?:java|xhtml|docx)"/i;
const DEPLOY_PROOF = /QA\d+-PROBE|\brepublish\b|\bre-?deploy\b|Clean\b.{0,30}(?:build|publish)|build timestamp|\.class\b.{0,30}(?:mtime|timestamp)|(?:new )?bytecode is (?:now )?(?:live|deployed)|new bytecode/i;

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    // Anti-loop guard — never block twice in a row (house style).
    if (data.stop_hook_active) process.exit(0);

    const payloadText = JSON.stringify(data);

    // (a) hand-back phrase present this turn?
    if (!HANDBACK.test(payloadText)) process.exit(0);

    // (d) bypass token?
    if (/\[skip-deploy-proof\s*:/i.test(payloadText)) process.exit(0);

    // Read the full session transcript (fail-open if unavailable).
    let transcriptText = '';
    try {
      transcriptText = fs.readFileSync(data.transcript_path, 'utf8');
    } catch (e) {
      transcriptText = '';
    }

    // (b) etanah source edit this session?
    const editHappened = SOURCE_EDIT.test(payloadText) || SOURCE_EDIT.test(transcriptText);
    if (!editHappened) process.exit(0);

    // (c) deploy-proof artifact present anywhere this session?
    const hasProof = DEPLOY_PROOF.test(payloadText) || DEPLOY_PROOF.test(transcriptText);
    if (hasProof) {
      try {
        fs.appendFileSync(logPath, JSON.stringify({
          ts: new Date().toISOString(), action: 'pass-proof-present',
        }) + '\n');
      } catch (_) {}
      process.exit(0);
    }

    try {
      fs.appendFileSync(logPath, JSON.stringify({
        ts: new Date().toISOString(), action: 'advisory-no-proof',
      }) + '\n');
    } catch (_) {}

    const reminder = [
      '',
      '⚙️  deploy-proof-gate (Stage 5A advisory): test hand-back after a source edit, no deploy-proof',
      '',
      'You handed back for testing after editing etanah source (.java/.xhtml/.docx) but stated no',
      'way to tell a real pass/fail apart from a stale deploy. Add ONE deploy-proof artifact so the',
      'test result is unambiguous (quest-protocol.md Ritual 6, B4 refine):',
      '  (a) "grep QA<num>-PROBE in server.log → presence = new bytecode is live"',
      '  (b) a build/republish timestamp to confirm before testing',
      '  (c) an explicit "Eclipse → Clean → Republish first" instruction',
      '  Why: QA-260508 — a failed test was ambiguous (fix-wrong vs stale-deploy) until a probe',
      '  disambiguated; the probe doubling as deploy-proof IS the pattern.',
      'Bypass: [skip-deploy-proof: <reason>] (e.g. a diagnostic re-test of unchanged code).',
      '',
    ].join('\n');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'Stop', additionalContext: reminder },
    }));
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
