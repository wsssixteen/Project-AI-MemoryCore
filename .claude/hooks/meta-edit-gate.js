/**
 * meta-edit-gate.js — PreToolUse hook on Edit|Write
 *
 * Recursive safety for the meta-layer itself. Intercepts edits to paths
 * under meta/* (and the personality.md Honesty Invariants section, and
 * meta-layer-related skills/hooks) and surfaces a verification step:
 * was meta-design-router invoked first?
 *
 * Advisory on meta-layer paths (won't over-fire on legitimate plan-mode edits).
 *
 * Created 2026-05-23 — Phase 6 of meta-layer build.
 * Origin: Stage 5 recursive-safety requirement — meta-layer must apply
 * its own rules to itself. "Who watches the watcher?"
 *
 * v1.1 2026-05-28 — Added architecture-doc-sync predicate (Phase 0 of plan
 * cached-floating-hummingbird.md). Fires when editing hooks / skills / quest
 * protocol / state files / settings.json.
 *
 * v1.2 2026-07-06 — architecture-doc-sync predicate PROMOTED from advisory to
 * HARD-BLOCK. A system-touching edit is denied unless `meta/system-architecture.md`
 * was Read or Edit'd earlier in the same session (evidenced in transcript) OR
 * the bypass token is present. Root slip: 5 framework files shipped without any
 * architecture-doc entry, silent drift for weeks. Bypass PRESERVED:
 *   [skip-architecture-doc-update: <reason>]
 */
'use strict';
const fs = require('fs');

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

    // v1.1 architecture-doc-sync predicate: fires when editing system-touching files
    // (hooks/skills/quest-protocol/state-files/settings.json)
    const systemTouchingPatterns = [
      /[\\/]\.claude[\\/]hooks[\\/].+\.js$/i,            // any hook
      /[\\/]\.claude[\\/]skills[\\/][^\\/]+[\\/]SKILL\.md$/i,  // any skill SKILL.md
      /[\\/]domain[\\/][^\\/]+[\\/].+\.hook\.js$/i,      // any Feature hook
      /[\\/]quest[\\/]quest-protocol\.md$/i,             // quest protocol
      /[\\/]quest[\\/]active\.txt$/i,                    // quest state
      /[\\/]\.claude[\\/]settings\.json$/i,              // hook registration
    ];
    const isSystemTouching = systemTouchingPatterns.some(re => re.test(filePath));
    const isArchDocItself = /[\\/]meta[\\/]system-architecture\.md$/i.test(filePath);

    if (!isMetaPath && !isSystemTouching) process.exit(0);

    // v1.2: HARD-BLOCK arch-doc-sync when a system-touching edit lacks proof that
    // meta/system-architecture.md was consulted this session.
    if (isSystemTouching && !isArchDocItself) {
      let convo = '';
      try { convo = fs.readFileSync(data.transcript_path || '', 'utf8'); } catch (_) { convo = ''; }

      const bypass = /\[skip-architecture-doc-update:/i.test(convo);
      // Detect a Read or Edit tool call earlier this session that touched system-architecture.md.
      // Transcript stores tool_use blocks as JSON — match on file_path fragment.
      const archTouched = /system-architecture\.md/i.test(convo);

      if (!bypass && !archTouched) {
        const reason = [
          '⛔ meta-edit-gate (arch-doc-sync v1.2): system-component edit denied.',
          `   Path: ${filePath}`,
          '   `meta/system-architecture.md` has NOT been Read or Edited this session,',
          '   so this edit would drift the living catalog silently.',
          '',
          '   → Read `meta/system-architecture.md` first (skim the affected §3.x catalog',
          '     row) OR include the paired update in this same turn.',
          '   → Bypass for genuine edge cases (trivial rename, comment-only fix, hot-fix):',
          '     `[skip-architecture-doc-update: <reason>]`',
        ].join('\n');
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
        }));
        process.exit(0);
      }
    }

    // v1.3 2026-08-04 — meta-layer branch PROMOTED from advisory to HARD-BLOCK.
    // Root slip (`built-without-system-design`, miya-caught): this gate asked "Was
    // meta-design-router invoked?" on two settings.json edits in one session and I proceeded
    // both times. An advisory question against a model that rationalises is decoration. The
    // wrong shape shipped (a boot-time down-the-line checker + a new domain/ folder) for
    // something that belonged as ~40 lines inside an existing file. Now the edit is DENIED
    // unless the turn shows a design consult or carries the explicit bypass.
    {
      let convo2 = '';
      try { convo2 = fs.readFileSync(data.transcript_path || '', 'utf8'); } catch (_) { convo2 = ''; }
      const consulted = /(meta-design-router|system-design|auto-skill-on-mistake|system-rules)/i.test(convo2);
      const bypass2 = /\[skip-design-consult:/i.test(convo2);
      if (!consulted && !bypass2) {
        const reason = [
          '⛔ meta-edit-gate: meta-layer edit BLOCKED — no design consult in this turn.',
          `   Path: ${filePath}`,
          '',
          '   A meta-layer change (hook / skill / settings / meta-*) must be SHAPED before it is',
          '   written. Invoke `system-design` (or `meta-design-router`) and do Step 0 INVENTORY:',
          '     • does an existing file/hook/skill already own this concern? (refine > create)',
          '     • is this the right TRIGGER POINT — boot, moment-of-change, or both?',
          '     • what is the EXPECTED RESULT, in bullets, before any code?',
          '',
          '   2026-08-04: skipping this shipped a boot-time checker + a new domain/ folder for',
          '   something that was ~40 lines inside quest/active-cli.js. miya: "WANTING TO BLOAT',
          '   THE SYSTEM AND MAKING MY LIFE MISERABLE."',
          '',
          '   Genuinely not a design change (typo / doc-only / revert)? Add:',
          '     `[skip-design-consult: <reason>]`',
        ].join('\n');
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
        }));
        process.exit(0);
      }
    }

    // Advisory reminder for meta-layer edits (unchanged)
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
      '  4. Is this edit logged in slip-log if it\'s a refinement from a slip?',
      '  5. If refining FROM an audit-log row: was meta/system-architecture.md consulted',
      '     AND the EXPECTED RESULT stated in bullets in-turn? (log rows are thin — miya 2026-07-19)',
      '',
      'If ANY answer is "no" — pause and route through meta-design-router first.',
      'If all "yes" — proceed; the edit will also fire other gates (claim-verification at done-time).',
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
