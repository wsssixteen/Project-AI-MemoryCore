/**
 * skill-invocation-discipline-gate.js — UserPromptSubmit hook
 *
 * Deterministic harness-level enforcement of the skill-invocation-discipline
 * skill (which alone failed because it relied on model attention).
 *
 * Detects in みや's prompt:
 *   (a) Explicit skill-name references: "use /X", "use the X skill", "invoke /X",
 *       "run /X", "perform the X skill", "follow the X skill", "use as the skill
 *       intended", "did you use the skill", "did not use the skill"
 *   (b) Specific named meta-skills referenced as nouns (auto-skill-on-mistake,
 *       system-design, claim-verification, predicate-box, scope-anchor-echo,
 *       verify, quest, etc.)
 *
 * Injects a context block forcing Ruri to invoke via Skill tool — not manual
 * SKILL.md execution, not subagent dispatch, not programmatic recreation.
 *
 * Created 2026-05-25 — Phase 9 of system-layer build. Source slips:
 *   - 2026-05-25 /understand shortcut (manual SKILL.md execution + Agent
 *     dispatch instead of Skill tool)
 *   - 2026-05-25 self-violation within turn-of-creation (treated
 *     auto-skill-on-mistake + system-design as inline procedures)
 *
 * Pairs with: skill-invocation-discipline SKILL.md (the procedure doc this
 * hook references), auto-skill-trigger.js (correction-signal detection),
 * system-edit-gate.js (recursive-safety for system-layer skills).
 */
const TRIGGERS = [
  // Explicit "use the skill" patterns — generic skill reference
  /\buse the skill\b/i,
  /\buse \/[a-z][\w-]*/i,                          // "use /understand", "use /verify"
  /\buse the \/[a-z][\w-]*/i,                     // "use the /skill"
  /\binvoke the skill\b/i,
  /\binvoke \/[a-z][\w-]*/i,
  /\brun the skill\b/i,
  /\brun \/[a-z][\w-]*/i,
  /\bperform the skill\b/i,
  /\bexecute the skill\b/i,
  /\bfollow the skill\b/i,
  /\buse it properly\b/i,
  /\buse as the skill intended\b/i,
  /\bas the skill intend(?:ed|s)\b/i,
  /\buse the skill as intended\b/i,

  // Correction-shape skill references
  /\bdid you (use|invoke|run|follow) the skill\b/i,
  /\byou didn'?t (use|invoke|run|follow) the skill\b/i,
  /\bdid not use the skill\b/i,
  /\bare you using the skill\b/i,
  /\bdid you go through (proper |the |a )?(meta|skill|system-design)\b/i,
  /\bplease use the skill\b/i,

  // Specific named meta-skills that Ruri has historically inlined
  /\bauto-skill-on-mistake\b/i,
  /\bsystem-design\b/i,
  /\bclaim-verification\b/i,
  /\bpredicate-box\b/i,
  /\bscope-anchor-echo\b/i,
  /\btest-data-echo\b/i,
  /\bconfidence-table\b/i,
  /\bsycophancy-circuit-breaker\b/i,
  /\bskill-invocation-discipline\b/i,
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';
    const hits = TRIGGERS.filter(re => re.test(prompt));
    if (!hits.length) process.exit(0);

    const context = [
      '',
      '🪪  skill-invocation-discipline-gate fired: みや referenced a skill by name (' + hits.length + ' patterns matched).',
      '',
      'MANDATORY: invoke that skill via the **Skill tool** — not manual SKILL.md execution.',
      '',
      'BANNED bypass shapes (all of these are how the discipline silently failed in past sessions):',
      '  - "I\'ll follow the SKILL.md procedure manually" — the SKILL.md is source code, not a checklist',
      '  - "I\'ll dispatch the agents via Agent tool" — Skill tool orchestrates dispatch + scripts as one unit',
      '  - "I\'ll build the artifact programmatically" — your interpretation, not the skill\'s behaviour',
      '  - "The skill isn\'t in my boot-time list so I\'ll do it via Bash/Read/Write" — try Skill tool anyway',
      '  - "It\'s faster inline" — speed is not a valid reason to skip',
      '  - Treating meta-skills (auto-skill-on-mistake, system-design, claim-verification, etc.) as "procedures to follow inline" — they are first-class skills',
      '',
      'CORRECT pattern: call the Skill tool with the matching skill name. If it errors (skill not in available list, etc.), SURFACE the error to みや — do NOT shortcut to manual.',
      '',
    ].join('\n');
    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
