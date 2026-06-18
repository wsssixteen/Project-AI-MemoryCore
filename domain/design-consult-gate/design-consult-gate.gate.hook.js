/**
 * design-consult-gate.gate.hook.js — PreToolUse hook (matcher: Edit|Write)
 *
 * Power: domain/design-consult-gate/
 *
 * PURPOSE: creating/editing a SKILL or HOOK MUST be preceded by consulting BOTH
 * system-design AND system-rules this session. Per みや 2026-06-18: the consult
 * "is the utmost criteria" before any skill/hook is touched.
 *
 * MECHANISM (deterministic, not a gameable self-set flag): reads the session
 * transcript (transcript_path) and checks that the Skill tool was invoked for
 * BOTH `system-design` and `system-rules`. If either is missing → HARD-BLOCK
 * the edit (permissionDecision: deny). The model must actually invoke the two
 * skills (which leaves "Launching skill: <name>" in the transcript), then retry.
 *
 * GUARDED PATHS: .claude/skills/<x>/SKILL.md · .claude/hooks/<x>.js ·
 *                domain/<x>/<y>.hook.js  (Power hooks)
 *
 * BYPASS: include `[skip-design-consult: <reason>]` in the conversation for a
 * genuinely trivial/non-design edit (typo, comment, doc-vocab line).
 *
 * FAIL-OPEN: any parse/read error → exit 0 (never trap a legitimate edit).
 *
 * FALSE-POSITIVE COST: a trivial edit to a skill/hook is blocked until you either
 * consult both systems or add the bypass token. Acceptable — skill/hook changes
 * are exactly where the consult must not be skipped (the gap this Power closes).
 *
 * Created 2026-06-18 per みや, routed through /system-design + /system-rules.
 * Replaces the advisory/wrong-target meta-edit-gate consult-reminder + the
 * WARN-only self-gate-impulse for the skill/hook-creation case (both inventoried;
 * self-gate-impulse is being retired to avoid double-fire on these paths).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');

const GUARDED = [
  /[\\/]\.claude[\\/]skills[\\/][^\\/]+[\\/]SKILL\.md$/i,
  /[\\/]\.claude[\\/]hooks[\\/][^\\/]+\.js$/i,
  /[\\/]domain[\\/][^\\/]+[\\/][^\\/]+\.hook\.js$/i,
];

function logFire(file, action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), file, action, detail }) + '\n'); } catch (_) {}
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const ti = data.tool_input || {};
    const filePath = ti.file_path || ti.path || '';
    if (!GUARDED.some(re => re.test(filePath))) process.exit(0);

    let convo = '';
    try { convo = fs.readFileSync(data.transcript_path || '', 'utf8'); } catch (_) { convo = ''; }

    if (/\[skip-design-consult:/i.test(convo)) { logFire(filePath, 'bypassed'); process.exit(0); }

    const hasSD = convo.includes('Launching skill: system-design') || /"skill"\s*:\s*"system-design"/.test(convo);
    const hasSR = convo.includes('Launching skill: system-rules')  || /"skill"\s*:\s*"system-rules"/.test(convo);
    if (hasSD && hasSR) { logFire(filePath, 'allowed'); process.exit(0); }

    const missing = [!hasSD && 'system-design', !hasSR && 'system-rules'].filter(Boolean).join(' + ');
    logFire(filePath, 'blocked', missing);
    const reason = [
      '⛔ design-consult-gate: creating/editing a skill or hook requires consulting BOTH',
      '   system-design AND system-rules first (this session).',
      `   Missing: ${missing}.`,
      '   → Invoke the missing skill(s) via the Skill tool, then retry the edit.',
      '   → Genuinely trivial/non-design edit? Add [skip-design-consult: <reason>] to your message.',
    ].join('\n');
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
    }));
    process.exit(0);
  } catch (e) { process.exit(0); }
});
