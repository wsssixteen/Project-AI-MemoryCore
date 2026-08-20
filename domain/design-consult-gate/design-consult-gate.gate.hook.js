/**
 * design-consult-gate.gate.hook.js — PreToolUse hook (matcher: Edit|Write)
 *
 * Feature: domain/design-consult-gate/
 *
 * PURPOSE: creating/editing a system-shape file MUST be preceded by consulting BOTH
 * system-design AND system-rules this session. Per みや 2026-06-18: the consult
 * "is the utmost criteria" before any skill/hook is touched.
 *
 * MECHANISM (deterministic, not a gameable self-set flag): reads the session
 * transcript (transcript_path) and checks that the Skill tool was invoked for
 * BOTH `system-design` and `system-rules`. If either is missing → HARD-BLOCK
 * the edit (permissionDecision: deny). The model must actually invoke the two
 * skills (which leaves "Launching skill: <name>" in the transcript), then retry.
 *
 * GUARDED PATHS (hard-block):
 *   - .claude skills SKILL.md files            (skill definition)
 *   - .claude hooks .js files                  (hook definition)
 *   - domain Feature .hook.js files            (Feature hook)
 *   - domain Feature .skill.md files           (Feature skill)
 *   - .claude/settings.json                    (hook registration)
 *   - CLAUDE.md (root)                         (top-level rule file)
 *   - personality.md (root)                    (identity/output-format file)
 *   - files under meta                         (constitution/system-layer)
 *   - quest/quest-protocol.md                  (workflow protocol)
 *
 * ADVISORY PATHS (advisory, not block — per chip 2026-07-06):
 *   - etanah-pelupusan, etanah-awam, etanah-common, etanah-teknikal src trees
 *     WHEN the edit ADDS a new symbol (new enum entry / new method signature /
 *     new switch case / new class). Line-level bug fixes pass through.
 *
 * EVAL-EXISTENCE RIDER (part 2, hard-block):
 *   - When CREATING a NEW hook file or a NEW skill file, require a paired
 *     domain feature eval file on disk (either eval.js or eval.workflow.js).
 *   - Bypass: [skip-eval-check: reason] for hooks with no measurable
 *     behaviour (pure logging, trivial reminders).
 *
 * BYPASSES:
 *   [skip-design-consult: <reason>]  — for genuinely trivial/non-design edit
 *   [skip-eval-check: <reason>]       — for a hook with no measurable behaviour
 *
 * FAIL-OPEN: any parse/read error → exit 0 (never trap a legitimate edit).
 *
 * FALSE-POSITIVE COST: a trivial edit to a system-shape file is blocked until
 * you either consult both systems or add the bypass token. Acceptable — these
 * paths are exactly where the consult must not be skipped.
 *
 * Created 2026-06-18 per みや, routed through /system-design + /system-rules.
 * Extended 2026-07-06 per みや background task — added CLAUDE.md / personality.md
 *   / system/** / quest-protocol / settings.json guards + eval-existence rider
 *   + etanah new-symbol advisory. Root slip: 5 framework files (enum entry, 2 util
 *   methods, dispatcher case, handler, populator flip) built with ZERO system-design
 *   invocation because guarded paths did not cover etanah code.
 *
 * system-audit: registered in settings.json PreToolUse:Edit|Write array.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');

// HARD-BLOCK paths — creating/editing these requires the consult
const GUARDED = [
  /[\\/]\.claude[\\/]skills[\\/][^\\/]+[\\/]SKILL\.md$/i,
  /[\\/]\.claude[\\/]hooks[\\/][^\\/]+\.js$/i,
  /[\\/]domain[\\/][^\\/]+[\\/][^\\/]+\.hook\.js$/i,
  /[\\/]domain[\\/][^\\/]+[\\/][^\\/]+\.skill\.md$/i,
  /[\\/]\.claude[\\/]settings\.json$/i,
  /[\\/]CLAUDE\.md$/i,
  /[\\/]personality\.md$/i,
  /[\\/]system[\\/][^\\/]+/i,
  /[\\/]quest[\\/]quest-protocol\.md$/i,
];

// ADVISORY paths — etanah code (advisory only, per chip: err on skip-friendly)
const ETANAH_PATHS = [
  /[\\/]etanah-(pelupusan|awam|common|teknikal)[\\/]src[\\/].+\.java$/i,
];

// NEW-file patterns for eval-existence rider
const NEW_HOOK_PATTERN = /[\\/](?:\.claude[\\/]hooks[\\/]([^\\/]+)\.js|domain[\\/]([^\\/]+)[\\/][^\\/]+\.hook\.js)$/i;
const NEW_SKILL_PATTERN = /[\\/](?:\.claude[\\/]skills[\\/]([^\\/]+)[\\/]SKILL\.md|domain[\\/]([^\\/]+)[\\/][^\\/]+\.skill\.md)$/i;

// New-symbol heuristics for etanah advisory
const NEW_ENUM_ENTRY = /,\s*\n\s*[A-Z][A-Z0-9_]{2,}\s*\(/;                    // new enum constant
const NEW_METHOD_SIG = /(?:public|private|protected)\s+(?:static\s+)?[\w<>\[\]]+\s+([a-z][a-zA-Z0-9_]+)\s*\(/;
const NEW_SWITCH_CASE = /case\s+[A-Z_][A-Z0-9_]+\s*:/;
const NEW_CLASS_DEF = /(?:public|abstract|final)\s+class\s+[A-Z][a-zA-Z0-9_]+/;

function logFire(file, action, detail) {
  try {
    fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), file, action, detail: String(detail || '').slice(0, 300) }) + '\n');
  } catch (_) {}
}

function checkEvalExists(filePath) {
  // Extract Feature name from a NEW hook/skill path
  let m = filePath.match(NEW_HOOK_PATTERN);
  let featureName = m ? (m[1] || m[2]) : null;
  if (!featureName) {
    m = filePath.match(NEW_SKILL_PATTERN);
    featureName = m ? (m[1] || m[2]) : null;
  }
  if (!featureName) return { applies: false };

  const projectRoot = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
  const evalPaths = [
    path.join(projectRoot, 'domain', featureName, 'eval.js'),
    path.join(projectRoot, 'domain', featureName, 'eval.workflow.js'),
  ];
  const found = evalPaths.find(p => { try { return fs.statSync(p).isFile(); } catch (_) { return false; } });
  return { applies: true, feature: featureName, evalFound: !!found, evalPaths };
}

function detectNewSymbol(oldStr, newStr) {
  if (!newStr) return null;
  const newContent = (typeof newStr === 'string') ? newStr : '';
  const oldContent = (typeof oldStr === 'string') ? oldStr : '';

  // For each pattern, match in new content that is NOT already in old content
  const newSyms = [];
  if (NEW_ENUM_ENTRY.test(newContent) && !NEW_ENUM_ENTRY.test(oldContent)) newSyms.push('new-enum-entry');
  const newMethodMatch = newContent.match(NEW_METHOD_SIG);
  if (newMethodMatch) {
    const methodName = newMethodMatch[1];
    if (!oldContent.includes(methodName + '(')) newSyms.push('new-method:' + methodName);
  }
  if (NEW_SWITCH_CASE.test(newContent) && !NEW_SWITCH_CASE.test(oldContent)) newSyms.push('new-switch-case');
  if (NEW_CLASS_DEF.test(newContent) && !NEW_CLASS_DEF.test(oldContent)) newSyms.push('new-class-def');
  return newSyms.length ? newSyms.join(', ') : null;
}

// Bypass tokens are only valid when *I deliberately write them* — an ASSISTANT text
// block in the CURRENT turn. Shared primitive (2026-08-21 self-disarm fix, 8 gates).
let bypassInCurrentTurn; try { bypassInCurrentTurn = require((process.env.CLAUDE_PROJECT_DIR || require('path').resolve(__dirname, '..', '..')) + '/lib/bypass-scope.js').bypassInCurrentTurn; } catch (_) { bypassInCurrentTurn = function () { return false; }; } // env-first + fail-CLOSED (bypass ignored if lib unreachable) — 2026-08-21 self-disarm fix

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const ti = data.tool_input || {};
    const filePath = ti.file_path || ti.path || '';
    const isGuarded = GUARDED.some(re => re.test(filePath));
    const isEtanah = ETANAH_PATHS.some(re => re.test(filePath));

    if (!isGuarded && !isEtanah) process.exit(0);

    // Read transcript for skill invocations (session-wide by design)
    let convo = '';
    try { convo = fs.readFileSync(data.transcript_path || '', 'utf8'); } catch (_) { convo = ''; }

    // Consult check: BOTH skills invoked this session?
    const hasSD = convo.includes('Launching skill: system-design') || /"skill"\s*:\s*"system-design"/.test(convo);
    const hasSR = convo.includes('Launching skill: system-rules')  || /"skill"\s*:\s*"system-rules"/.test(convo);
    const consultOk = hasSD && hasSR;
    const bypassConsult = bypassInCurrentTurn(data.transcript_path, /\[skip-design-consult:/i);

    // ====== HARD-BLOCK path branch ======
    if (isGuarded) {
      if (bypassConsult) { logFire(filePath, 'bypassed', 'skip-design-consult'); }
      else if (!consultOk) {
        const missing = [!hasSD && 'system-design', !hasSR && 'system-rules'].filter(Boolean).join(' + ');
        logFire(filePath, 'blocked-consult', missing);
        const reason = [
          '⛔ design-consult-gate: system-shape edit requires consulting BOTH',
          '   system-design AND system-rules first (this session).',
          `   Missing: ${missing}.`,
          '   → Invoke the missing skill(s) via the Skill tool, then retry the edit.',
          '   → Genuinely trivial/non-design edit? Add [skip-design-consult: <reason>] to your message.',
        ].join('\n');
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
        }));
        process.exit(0);
      }

      // Consult passed (or bypassed) → eval-existence rider for NEW hook/skill files
      const evalCheck = checkEvalExists(filePath);
      if (evalCheck.applies) {
        // Is this a Write of a NEW file (doesn't exist yet)?
        let isNewFile = false;
        try { fs.statSync(filePath); } catch (_) { isNewFile = true; }
        if (isNewFile) {
          const bypassEval = bypassInCurrentTurn(data.transcript_path, /\[skip-eval-check:/i);
          if (!evalCheck.evalFound && !bypassEval) {
            logFire(filePath, 'blocked-eval', `no eval for feature=${evalCheck.feature}`);
            const reason = [
              '⛔ design-consult-gate (eval rider): creating a new hook or skill requires',
              `   a paired eval — expected one of:`,
              `     • domain/${evalCheck.feature}/eval.js`,
              `     • domain/${evalCheck.feature}/eval.workflow.js`,
              '   → Create the eval BEFORE registering/using the hook/skill (per system-design Rule 6).',
              '   → Hook has no measurable behaviour? Add [skip-eval-check: <reason>] to your message.',
            ].join('\n');
            process.stdout.write(JSON.stringify({
              hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
            }));
            process.exit(0);
          }
          if (bypassEval) logFire(filePath, 'bypassed-eval', 'skip-eval-check');
        }
      }

      logFire(filePath, 'allowed');
      process.exit(0);
    }

    // ====== ADVISORY path branch (etanah code new-symbol) ======
    if (isEtanah && !consultOk) {
      const oldStr = ti.old_string || '';
      const newStr = ti.new_string || ti.content || '';
      const newSyms = detectNewSymbol(oldStr, newStr);
      if (newSyms) {
        logFire(filePath, 'advisory', `new-symbol: ${newSyms}; consult missing: ${!hasSD ? 'system-design' : ''}${!hasSR ? ' system-rules' : ''}`);
        const advisory = [
          '',
          '⚙️  design-consult-gate (advisory): NEW-symbol added to etanah code without',
          `   system-design + system-rules consult this session.`,
          `   Path: ${filePath}`,
          `   Detected: ${newSyms}`,
          '   → New framework additions (enum entry / util method / dispatcher case / new class)',
          '     should route through /system-design + /system-rules before commit — matches the',
          '     Working-analog first + In-file-convention first non-negotiables (CLAUDE.md §8).',
          '   → Line-level bug fix on an existing method? — this is an advisory, not a block.',
          '',
        ].join('\n');
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: advisory },
        }));
        process.exit(0);
      }
      logFire(filePath, 'advisory-skipped', 'no-new-symbol');
      process.exit(0);
    }

    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
