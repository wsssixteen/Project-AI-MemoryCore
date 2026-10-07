export const meta = {
  name: 'quest-phase0',
  description: 'Quest Phase 0 investigation engine for an Etanah ticket, grounded in quest/quest-protocol.md. Discovery -> etanah-knowledge tiered load -> Recon (codebase-only blast-radius; other states out of scope for pelupusan, multi-state-aware for awam) -> adversarial Verify (bugs) -> Synthesize. Writes 1. <NNN NNN>.txt (canonical format) + the QA-NNN.md investigation sections. Scales by ticket_type. Hands a verified diagnosis + fix-shape to the live /quest skill for Apply/test/commit (which stay human-gated).',
  phases: [
    { title: 'Discovery', detail: 'read brief + protocol Phase-0, classify, pick codebase-root/base-branch', model: 'sonnet' },
    { title: 'KnowledgeLoad', detail: 'etanah-knowledge tiered load + working analog', model: 'sonnet' },
    { title: 'Recon', detail: 'code-path, analog, codebase-only blast-radius, test-data (+repro/root-cause for bugs)', model: 'sonnet' },
    { title: 'Verify', detail: 'adversarially refute each hypothesis (bugs/full only)', model: 'opus' },
    { title: 'Synthesize', detail: 'verified fix-shape + verification oracle + Notes.txt + QA-NNN.md', model: 'opus' },
  ],
}

// Model tiers — CLAUDE.md "Delegation Economy" (2026-10-07, per miya): the session (Opus 5.5) orchestrates and
// gives the verdict; every agent here names its model, and that model is sonnet (Sonnet 5.5) unless a reason for
// opus is written beside the call. domain/agent-spend-gate blocks this script if any agent() loses its model.
// MAX_AGENTS = 16 (1 discovery + 1 knowledge + up to 6 recon + 1 notes + up to 6 verify + 1 synthesis)
// Measured 2026-10-07 (same task on both models, system/claude-md-changelog.md v1.81): equal on extraction; on a
// multi-file "find every site" task sonnet found 7 of 9 at medium effort and 8 of 9 at high, opus 9 of 9.
const READ = { model: 'sonnet', effort: 'medium' }   // read, classify, extract, write a fixed format
const TRACE = { model: 'sonnet', effort: 'high' }    // follow code across files; its finding is checked again by Verify

// Defensive: some invocation paths (scriptPath + args, name + args) deliver `args`
// JSON-stringified rather than as a live object. Parse it back so t.* binds.
let t = args || {}
if (typeof t === 'string') { try { t = JSON.parse(t) } catch (e) { t = {} } }
const PROTO = t.protocolPath || 'quest/quest-protocol.md'
const isPelupusan = !(t.codebaseRoot || '').includes('awam')
// State comes from the registry (node lib/states.js resolve) — never assumed. Melaka stays the default wording only when the caller passes nothing.
const STATE = t.state || 'the resolved state'
const BASE_BRANCH = t.baseBranch || 'the trunk of that module in `node lib/states.js show <state>` (Melaka: mlk/master for pelupusan and awam)'
const FULL = t.depth === 'full' || t.depth === 'deep' || t.ticketType === 'bug'

// ---- structured-output schemas ----
const DISCOVERY_SCHEMA = { type: 'object', required: ['symptom', 'ticketType', 'entryContext', 'codebaseRoot', 'baseBranch', 'urusans', 'layerGuess', 'scopeAnchor'], properties: {
  symptom: { type: 'string' }, ticketType: { type: 'string', description: 'bug | enhancement | template | cr' }, entryContext: { type: 'string', description: 'New | Rework | Addition' },
  codebaseRoot: { type: 'string' }, baseBranch: { type: 'string' }, urusans: { type: 'array', items: { type: 'string' } }, tugasans: { type: 'array', items: { type: 'string' } },
  layerGuess: { type: 'string', description: 'template | java | jsf | config | db | flowable' }, scopeAnchor: { type: 'string' }, baProvidedPermohonanId: { type: 'string' }, expected: { type: 'string' }, observed: { type: 'string' } } }

const KNOWLEDGE_SCHEMA = { type: 'object', required: ['alwaysLoaded', 'conditionalLoaded', 'analogs'], properties: {
  alwaysLoaded: { type: 'array', items: { type: 'string' } }, conditionalLoaded: { type: 'array', items: { type: 'string' } }, routingReason: { type: 'string' },
  analogs: { type: 'array', items: { type: 'object', required: ['ticket', 'whatItDid'], properties: { ticket: { type: 'string' }, whatItDid: { type: 'string' }, fileLine: { type: 'string' } } } } } }

const FINDING_SCHEMA = { type: 'object', required: ['dimension', 'finding', 'confidence'], properties: {
  dimension: { type: 'string' }, finding: { type: 'string' }, fileLineEvidence: { type: 'array', items: { type: 'string' } }, confidence: { type: 'string', enum: ['low', 'medium', 'high'] }, confirmOrKill: { type: 'string' } } }

const VERDICT_SCHEMA = { type: 'object', required: ['survives', 'reasoning'], properties: {
  survives: { type: 'boolean' }, reasoning: { type: 'string' }, decisiveArtifact: { type: 'string' } } }

const NOTES_SCHEMA = { type: 'object', required: ['written', 'notesPath', 'content'], properties: {
  written: { type: 'boolean' }, notesPath: { type: 'string' }, content: { type: 'string' },
  testData: { type: 'array', items: { type: 'object', required: ['urusan', 'permohonanId', 'pengguna'], properties: { urusan: { type: 'string' }, permohonanId: { type: 'string' }, pengguna: { type: 'string' }, tugasan: { type: 'string' } } } } } }

const SYNTH_SCHEMA = { type: 'object', required: ['fixShape', 'confidence', 'reproAchieved', 'seniorBlocker', 'qaDocWritten'], properties: {
  rootCauseOrAsk: { type: 'string' }, fixShape: { type: 'string' }, blastRadius: { type: 'string' }, verificationOracle: { type: 'string' },
  reproAchieved: { type: 'string', description: 'Y | N | n/a (enhancement)' }, confidence: { type: 'string' },
  seniorBlocker: { type: 'string', description: 'only if solving genuinely stalled; else "none" — we solve, we do not manufacture questions' }, qaDocWritten: { type: 'boolean' } } }

const base = `Quest Phase 0 for Etanah ticket ${t.qa}. READ-ONLY on all etanah code — the ONLY writes allowed are "1. <NNN NNN>.txt" and the QA-NNN.md doc, and only by the agents explicitly told to write them. Codebase root: ${t.codebaseRoot}. Task folder: ${t.taskFolder}. Quest protocol (READ the cited sections — never work from memory): ${PROTO}. etanah-knowledge dir: ${t.knowledgeDir}. DB MCP: ${t.dbMcp} (load via ToolSearch).`

// ---- Discovery ----
phase('Discovery')
log(`Discovery for ${t.qa}`)
const discovery = await agent(`${base}

Read ${PROTO} section "Phase 0 — Accept the Quest" (about line 465, up to the next "### Read-Redmine sub-protocol" heading) for the exact Discovery procedure, then:
- Read the task folder's "0. Brief/History.txt" (FULL), "Description.txt", "1. <NNN NNN>.txt", and any PNG/PDF in 0. Brief.
- Classify ticket_type (bug | enhancement | template | cr) and entry context (New | Rework | Addition).
- Pick codebase_root (etanah-pelupusan for APPS/PELUPUSAN; etanah-awam for AWAM) and base-branch (${BASE_BRANCH}). State: ${STATE}.
- Extract urusan(s), tugasan(s), the layer guess, the BA-provided permohonan ID (if any), Expected vs Observed, and the scope anchor (BA's LITERAL scope: what is IN + explicit DO-NOT).`,
  { ...READ, label: 'discovery', phase: 'Discovery', schema: DISCOVERY_SCHEMA })

// ---- KnowledgeLoad (protocol paragraph "etanah-knowledge tiered load at Phase 0", about line 103) ----
phase('KnowledgeLoad')
const knowledge = await agent(`${base}

Per ${PROTO}, the paragraph that starts "etanah-knowledge tiered load at Phase 0" and the tier table under it (about line 103; find it by that phrase, the line number drifts):
- ALWAYS load + summarize from ${t.knowledgeDir}: index.md (it maps every file of THIS state's folder — follow it), STATE-FACTS.md, DOMAIN-GLOSSARY.md, MODULE-ARCHITECTURE.md, BUG-BESTIARY.md, LATENT-BUGS.md, DEFERRED-CRITICAL-ISSUES.md. A file that does not exist in this state's folder is skipped and NAMED as absent — never substituted with another state's copy.
- CONDITIONAL by layer "${discovery.layerGuess}" + the symptom: load the matching layer file(s) — DATABASE (DB) / FLOWABLE-WORKFLOWS or FLOWABLE-KNOWLEDGE (workflow) / JSF-WIRING (UI) / FLOW-TRACES (deep-debug) / FRONTEND-PATTERNS (UI enhancement) / URUSAN-FLOW (cross-urusan) / PERANAN-MAP (role) / TEST-PERMOHONAN-INDEX (test data) / ENV-ARCHITECTURE (which DB + MCP).
- Find the closest WORKING ANALOG ticket(s) for "${discovery.symptom}" — search projects/coding-projects QA docs + BUG-BESTIARY + this state's ${t.knowledgeDir}/urusan/<KOD>-TICKETS.md precedent file when it exists. Cite ticket + what it did + file:line/commit.
Return what you loaded, the routing reason, and the analogs.`,
  { ...READ, label: 'knowledge-load', phase: 'KnowledgeLoad', schema: KNOWLEDGE_SCHEMA })

const ctx = `Discovery: ${JSON.stringify(discovery)}\nKnowledge+analogs: ${JSON.stringify(knowledge)}`

// ---- Recon (parallel dimensions, scaled by ticket_type) ----
phase('Recon')
const dims = [
  { key: 'code-path', ...TRACE, prompt: `Trace where the fix goes for "${discovery.symptom}". For layer "${discovery.layerGuess}" cite the exact file:line(s) (Java populator / .docx template SDT / JSF composite / config / SQL). Use the working analog as the template.` },
  { key: 'working-analog', ...READ, prompt: `Confirm the closest working analog and READ its actual fix (file:line / commit). State exactly what to mirror, and any difference vs this ticket.` },
  // opus-reason: blast-radius must list EVERY touch-site and no later stage re-checks the list; sonnet missed 1 to 2 of 9 sites in the 2026-10-07 measurement
  { key: 'blast-radius', model: 'opus', prompt: `Blast-radius — CODEBASE-ONLY. ${isPelupusan ? 'codebase_root is etanah-pelupusan (state: ' + STATE + '): IGNORE EVERY OTHER STATE ENTIRELY. Do NOT check, mention, or flag another state / cross-state. Scope PURELY to this state\'s pelupusan codebase: which Java / templates / configs / urusan WITHIN pelupusan this change touches (prefer codegraph_impact if etanah is indexed).' : 'codebase_root is etanah-awam: include MULTI-STATE awareness — other states share this portal, so flag general cross-state ripple.'} List every touch-site with file:line.` },
  { key: 'test-data', ...READ, prompt: `Run the task-state query (the one in ${t.knowledgeDir}/DATABASE.md when that file carries one; else the reference form in ${PROTO}, section "Auto-pengguna at END of Recon") on ${t.dbMcp} to find ONE active permohonan per urusan (${(discovery.urusans || []).join(', ') || 'see Discovery'}) at the relevant tugasan, with its pengguna_semasa login. If the BA gave a permohonan ID (${discovery.baProvidedPermohonanId || 'none'}), also resolve ITS current pengguna_semasa. Return per-urusan {urusan, permohonanId, pengguna, tugasan}. Mark login TBD if the DB cannot resolve it. CANDIDATE, not authority — pengguna_semasa drifts as the app advances.` },
]
if (FULL) {
  dims.push({ key: 'reproduce', ...READ, prompt: `Produce a deterministic REPRODUCTION recipe (exact tugasan + clicks + expected vs actual). State clearly: is a clean repro achievable from the brief — Y/N? If not, name the single artifact still needed.` })
  dims.push({ key: 'root-cause', ...TRACE, prompt: `Propose the most likely root cause(s) with mechanism + file:line; mark each as hypothesis. Apply the momentum circuit-breaker: include at least one cause from a DIFFERENT category (data / code / config / env / template / concurrency).` })
}
const recon = (await parallel(dims.map(d => () =>
  agent(`${base}\n\nContext: ${ctx}\n\n${d.prompt}`, { label: `recon:${d.key}`, phase: 'Recon', schema: FINDING_SCHEMA, model: d.model, effort: d.effort })))).filter(Boolean)

// ---- Notes.txt write (canonical format, protocol :373-403) ----
const testDataFinding = recon.find(f => f && f.dimension === 'test-data')
const notes = await agent(`${base}

Write "1. <NNN NNN>.txt" in the Task folder using the CANONICAL format from ${PROTO}:373-403. Quote that format EXACTLY — 3 lines per entry, NO bloat, NO env labels (except the two-entry sim line), NO Langkah, NO parentheticals/annotations:
- SINGLE urusan at target tugasan:  line1 "N) <URUSAN> — <TUGASAN>"  /  line2 <PERMOHONAN_ID>  /  line3 <login>
- MULTI urusan (${(discovery.urusans || []).join(', ') || 'per Discovery'}): one numbered entry PER urusan, same 3-line shape, blank line between entries.
- If the BA-provided ID is PAST the target tugasan AND a sim app exists, use the TWO-entry form (Entry 0 = BA app + state note; Entry 1 = "N) <PLP|AWAM> — <ENV> — <TUGASAN>" + sim app).
Use the test-data the Recon test-data dimension found: ${JSON.stringify(testDataFinding || {})}. Mark a login "TBD" if unresolved — NEVER defer the whole file (protocol :728). Confirm the path + the exact content written.`,
  { ...READ, label: 'notes-write', phase: 'Recon', agentType: 'general-purpose', schema: NOTES_SCHEMA })

// ---- Verify (adversarial — bugs / full only) ----
let verdicts = []
if (FULL) {
  phase('Verify')
  const toVerify = recon.filter(f => f && (f.dimension === 'root-cause' || f.confidence !== 'high'))
  // opus-reason: the adversarial check of the root cause decides which fix is built; a wrong "survives" costs a wrong fix
  verdicts = (await parallel(toVerify.map(f => () =>
    agent(`${base}\n\nAdversarially VERIFY — try hard to REFUTE this using the actual code + the brief. Default survives=false unless the code/evidence clearly supports it. Name the single decisive artifact that would settle it.\n\nFINDING:\n${JSON.stringify(f)}`,
      { label: 'verify', phase: 'Verify', schema: VERDICT_SCHEMA, model: 'opus' }).then(v => ({ finding: f, verdict: v }))))).filter(Boolean)
}

// ---- Synthesize (+ write QA-NNN.md investigation sections) ----
phase('Synthesize')
// opus-reason: it weighs every finding against the verdicts and writes the fix-shape and confidence the orchestrator presents
const synthesis = await agent(`${base}

Synthesize Phase 0 for the live /quest skill, and WRITE the QA-NNN.md investigation sections to ${t.qaDocPath} (mirror the template at .claude/skills/quest/QA-NNN-template.md or an existing QA-NNN.md). Sections: Issue (BA) / Scope incl. blast-radius / Fix-shape hypothesis / Test-data / and — ONLY if genuinely stuck — a single Residual blocker.
Inputs:
- Discovery: ${JSON.stringify(discovery)}
- Knowledge + analogs: ${JSON.stringify(knowledge)}
- Recon: ${JSON.stringify(recon)}
- Adversarial verdicts: ${JSON.stringify(verdicts)}
- Notes.txt: ${JSON.stringify(notes)}
Produce: the fix-shape (file:line + what changes), the blast-radius (codebase-only${isPelupusan ? ', other states excluded' : ', multi-state-aware'}), the verification oracle (how we will KNOW it is fixed), repro-achieved Y/N (bugs), a confidence level (honest), and a seniorBlocker ONLY if solving genuinely stalled (else "none" — the goal is to SOLVE, not manufacture questions to ask).`,
  { label: 'synthesis', phase: 'Synthesize', agentType: 'general-purpose', schema: SYNTH_SCHEMA, model: 'opus' })

return { qa: t.qa, depth: FULL ? 'full' : 'quick', discovery, knowledge, recon, verdicts, notes, synthesis }
