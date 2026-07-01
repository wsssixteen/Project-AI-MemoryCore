// domain/quest-bounty/eval.workflow.js — Rule-6 eval for the quest-bounty Power.
// Adversarial: N cold agents each stress ONE guardrail of the skill, then a judge
// rules each known suspicion CONFIRMED / OVERBLOWN / RESOLVED.
// Run: Workflow({ scriptPath: this file }). First run: wf_3c67b23f-4bd (2026-07-01).
export const meta = {
  name: 'quest-bounty-eval',
  description: 'Adversarial eval of the quest-bounty Power — cold agents stress each guardrail; a judge rules the author’s suspicions confirmed/overblown/resolved',
  phases: [{ title: 'Scenarios', detail: 'one cold agent per guardrail scenario' }, { title: 'Judge', detail: 'rule suspicions vs evidence' }],
}

const SKILL = 'C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/.claude/skills/quest-bounty/SKILL.md'
const CLOSE = 'C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/.claude/skills/close-phase/SKILL.md'
const ARCH  = 'C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/quest/archive-quest.js'

const READ = `You are a COLD agent asked to EXECUTE the quest-bounty skill. First Read these files IN FULL:\n- ${SKILL}\n- ${CLOSE} (the Phase 2 section)\n- ${ARCH}\nThen answer the scenario as if you had to actually run quest-bounty. Be adversarial: try to make it fail. Judge the INSTRUCTIONS' robustness, not what you assume the author meant.`

const SCEN_SCHEMA = {
  type: 'object',
  properties: {
    key: { type: 'string' },
    verdict: { type: 'string', enum: ['PASS', 'FAIL', 'AMBIGUOUS', 'GAP'] },
    evidence: { type: 'string', description: 'quote the skill line(s) that decide it' },
    fix_or_ambiguity: { type: 'string', description: 'if not PASS, the exact gap + smallest fix' },
  },
  required: ['key', 'verdict', 'evidence', 'fix_or_ambiguity'],
  additionalProperties: false,
}

const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    suspicions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          ruling: { type: 'string', enum: ['CONFIRMED', 'OVERBLOWN', 'RESOLVED'] },
          why: { type: 'string' },
        },
        required: ['name', 'ruling', 'why'],
        additionalProperties: false,
      },
    },
    robustness: { type: 'string', enum: ['solid', 'mixed', 'weak'] },
    single_must_fix: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['suspicions', 'robustness', 'single_must_fix', 'notes'],
  additionalProperties: false,
}

const SCENARIOS = [
  { key: 'ordering', q: 'close-phase Step 2 (archive-quest.js) has ALREADY moved the quest doc active/ -> archive/ and repointed qa_doc=. You now run quest-bounty. Trace EXACTLY which path you edit + git add. Does the skill route you to the live moved path, or would you touch a non-existent active/ path?' },
  { key: 'boundary', q: 'At Phase 2 the etanah-pelupusan repo has an uncommitted fix on branch mlk/internal-issue/268322. Following Step 5 "bank", do you run ANY git command on the etanah repo (merge/push to mlk/master)? PASS only if you never touch etanah git.' },
  { key: 'one-refinement', q: 'slip-log has 5 un-actioned over-threshold clusters this quest. Following Step 4, how many refinements do you emit? PASS only if exactly <=1 with a justified pick.' },
  { key: 'bounty-flag', q: 'One slip cluster already has bounty_actioned=2026-06-30. Following Step 4, do you re-propose it? PASS only if already-actioned rows are skipped.' },
  { key: 'coverage', q: 'The quest is status=held and never reaches Phase 2. Does quest-bounty ever harvest its spoils? State honestly whether this is a real coverage gap and how severe (0-3).' },
  { key: 'firing', q: 'quest-bounty is invoked by close-phase Phase 2 as a prose "invoke quest-bounty (Skill tool)" step, with NO deterministic hook yet. Estimate the realistic probability it fires every Phase 2, and whether that is acceptable or needs the pending verify-hook.' },
]

phase('Scenarios')
const results = (await parallel(SCENARIOS.map(s => () =>
  agent(`${READ}\n\nSCENARIO [${s.key}]: ${s.q}`, { label: `eval:${s.key}`, phase: 'Scenarios', schema: SCEN_SCHEMA })
))).filter(Boolean)

phase('Judge')
const verdict = await agent(
  `You are the eval judge for the quest-bounty Power. Scenario results (JSON):\n${JSON.stringify(results, null, 2)}\n\n` +
  `The author's pre-eval SUSPICIONS were: (1) ordering-bug [author claims fixed via a new Step 0], (2) deterministic-firing weak, (3) refinement-quality unguarded, (4) coverage only-fires-at-Phase-2. ` +
  `For EACH suspicion rule CONFIRMED / OVERBLOWN / RESOLVED with a one-line why, grounded in the scenario evidence. Then give an overall robustness verdict (solid/mixed/weak) and the SINGLE highest-value must-fix.`,
  { phase: 'Judge', schema: JUDGE_SCHEMA }
)

return { scenarios: results, verdict }
