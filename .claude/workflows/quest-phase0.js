export const meta = {
  name: 'quest-phase0',
  description: 'Quest Phase 0 investigation engine for an Etanah ticket, grounded in quest/quest-protocol.md. Discovery -> etanah-knowledge tiered load -> Recon (codebase-only blast-radius; TRG banned for pelupusan, multi-state-aware for awam) -> adversarial Verify (bugs) -> Synthesize. Writes 1. Notes.txt (canonical format) + the QA-NNN.md investigation sections. Scales by ticket_type. Hands a verified diagnosis + fix-shape to the live /quest skill for Apply/test/commit (which stay human-gated).',
  phases: [
    { title: 'Discovery', detail: 'read brief + protocol Phase-0, classify, pick codebase-root/base-branch' },
    { title: 'KnowledgeLoad', detail: 'etanah-knowledge tiered load + working analog' },
    { title: 'Recon', detail: 'code-path, analog, codebase-only blast-radius, test-data (+repro/root-cause for bugs)' },
    { title: 'Verify', detail: 'adversarially refute each hypothesis (bugs/full only)' },
    { title: 'Synthesize', detail: 'verified fix-shape + verification oracle + Notes.txt + QA-NNN.md' },
  ],
}

// Defensive: some invocation paths (scriptPath + args, name + args) deliver `args`
// JSON-stringified rather than as a live object. Parse it back so t.* binds.
let t = args || {}
if (typeof t === 'string') { try { t = JSON.parse(t) } catch (e) { t = {} } }
const PROTO = t.protocolPath || 'quest/quest-protocol.md'
const isPelupusan = !(t.codebaseRoot || '').includes('awam')
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

const base = `Quest Phase 0 for Etanah ticket ${t.qa}. READ-ONLY on all etanah code — the ONLY writes allowed are "1. Notes.txt" and the QA-NNN.md doc, and only by the agents explicitly told to write them. Codebase root: ${t.codebaseRoot}. Task folder: ${t.taskFolder}. Quest protocol (READ the cited sections — never work from memory): ${PROTO}. etanah-knowledge dir: ${t.knowledgeDir}. DB MCP: ${t.dbMcp} (load via ToolSearch).`

// ---- Discovery ----
phase('Discovery')
log(`Discovery for ${t.qa}`)
const discovery = await agent(`${base}

Read ${PROTO} Phase-0 section (~lines 460-555) for the exact Discovery procedure, then:
- Read the task folder's "0. Brief/History.txt" (FULL), "Description.txt", "1. Notes.txt", and any PNG/PDF in 0. Brief.
- Classify ticket_type (bug | enhancement | template | cr) and entry context (New | Rework | Addition).
- Pick codebase_root (etanah-pelupusan for APPS/PELUPUSAN; etanah-awam for AWAM) and base-branch (mlk/master for pelupusan; mlk/release/fat for awam).
- Extract urusan(s), tugasan(s), the layer guess, the BA-provided permohonan ID (if any), Expected vs Observed, and the scope anchor (BA's LITERAL scope: what is IN + explicit DO-NOT).`,
  { label: 'discovery', phase: 'Discovery', schema: DISCOVERY_SCHEMA })

// ---- KnowledgeLoad (etanah-knowledge tiered load, protocol :85-93) ----
phase('KnowledgeLoad')
const knowledge = await agent(`${base}

Per ${PROTO} etanah-knowledge tiered-load (~lines 85-93):
- ALWAYS load + summarize from ${t.knowledgeDir}: index.md, DOMAIN-GLOSSARY.md, MODULE-ARCHITECTURE.md, BUG-BESTIARY.md, DEFERRED-CRITICAL-ISSUES.md.
- CONDITIONAL by layer "${discovery.layerGuess}" + the symptom: load the matching layer file(s) — DATABASE (DB) / FLOWABLE-WORKFLOWS (workflow) / JSF-WIRING (UI) / FLOW-TRACES (deep-debug) / FRONTEND-PATTERNS (UI enhancement) / URUSAN-FLOW (cross-urusan) / PERANAN-MAP (role).
- Find the closest WORKING ANALOG ticket(s) for "${discovery.symptom}" — search projects/coding-projects QA docs + BUG-BESTIARY. Cite ticket + what it did + file:line/commit.
Return what you loaded, the routing reason, and the analogs.`,
  { label: 'knowledge-load', phase: 'KnowledgeLoad', schema: KNOWLEDGE_SCHEMA })

const ctx = `Discovery: ${JSON.stringify(discovery)}\nKnowledge+analogs: ${JSON.stringify(knowledge)}`

// ---- Recon (parallel dimensions, scaled by ticket_type) ----
phase('Recon')
const dims = [
  { key: 'code-path', prompt: `Trace where the fix goes for "${discovery.symptom}". For layer "${discovery.layerGuess}" cite the exact file:line(s) (Java populator / .docx template SDT / JSF composite / config / SQL). Use the working analog as the template.` },
  { key: 'working-analog', prompt: `Confirm the closest working analog and READ its actual fix (file:line / commit). State exactly what to mirror, and any difference vs this ticket.` },
  { key: 'blast-radius', prompt: `Blast-radius — CODEBASE-ONLY. ${isPelupusan ? 'codebase_root is etanah-pelupusan: IGNORE TRG ENTIRELY. Do NOT check, mention, or flag TRG / cross-state. Scope PURELY to the pelupusan codebase: which Java / templates / configs / urusan WITHIN pelupusan this change touches (prefer codegraph_impact if etanah is indexed).' : 'codebase_root is etanah-awam: include MULTI-STATE awareness — other states share this portal, so flag general cross-state ripple.'} List every touch-site with file:line.` },
  { key: 'test-data', prompt: `Run the canonical task-state query (${PROTO} ~lines 518-541) on ${t.dbMcp} to find ONE active permohonan per urusan (${(discovery.urusans || []).join(', ') || 'see Discovery'}) at the relevant tugasan, with its pengguna_semasa login. If the BA gave a permohonan ID (${discovery.baProvidedPermohonanId || 'none'}), also resolve ITS current pengguna_semasa. Return per-urusan {urusan, permohonanId, pengguna, tugasan}. Mark login TBD if the DB cannot resolve it. CANDIDATE, not authority — pengguna_semasa drifts as the app advances.` },
]
if (FULL) {
  dims.push({ key: 'reproduce', prompt: `Produce a deterministic REPRODUCTION recipe (exact tugasan + clicks + expected vs actual). State clearly: is a clean repro achievable from the brief — Y/N? If not, name the single artifact still needed.` })
  dims.push({ key: 'root-cause', prompt: `Propose the most likely root cause(s) with mechanism + file:line; mark each as hypothesis. Apply the momentum circuit-breaker: include at least one cause from a DIFFERENT category (data / code / config / env / template / concurrency).` })
}
const recon = (await parallel(dims.map(d => () =>
  agent(`${base}\n\nContext: ${ctx}\n\n${d.prompt}`, { label: `recon:${d.key}`, phase: 'Recon', schema: FINDING_SCHEMA })))).filter(Boolean)

// ---- Notes.txt write (canonical format, protocol :373-403) ----
const testDataFinding = recon.find(f => f && f.dimension === 'test-data')
const notes = await agent(`${base}

Write "1. Notes.txt" in the Task folder using the CANONICAL format from ${PROTO}:373-403. Quote that format EXACTLY — 3 lines per entry, NO bloat, NO env labels (except the two-entry sim line), NO Langkah, NO parentheticals/annotations:
- SINGLE urusan at target tugasan:  line1 "N) <URUSAN> — <TUGASAN>"  /  line2 <PERMOHONAN_ID>  /  line3 <login>
- MULTI urusan (${(discovery.urusans || []).join(', ') || 'per Discovery'}): one numbered entry PER urusan, same 3-line shape, blank line between entries.
- If the BA-provided ID is PAST the target tugasan AND a sim app exists, use the TWO-entry form (Entry 0 = BA app + state note; Entry 1 = "N) <PLP|AWAM> — <ENV> — <TUGASAN>" + sim app).
Use the test-data the Recon test-data dimension found: ${JSON.stringify(testDataFinding || {})}. Mark a login "TBD" if unresolved — NEVER defer the whole file (protocol :728). Confirm the path + the exact content written.`,
  { label: 'notes-write', phase: 'Recon', agentType: 'general-purpose', schema: NOTES_SCHEMA })

// ---- Verify (adversarial — bugs / full only) ----
let verdicts = []
if (FULL) {
  phase('Verify')
  const toVerify = recon.filter(f => f && (f.dimension === 'root-cause' || f.confidence !== 'high'))
  verdicts = (await parallel(toVerify.map(f => () =>
    agent(`${base}\n\nAdversarially VERIFY — try hard to REFUTE this using the actual code + the brief. Default survives=false unless the code/evidence clearly supports it. Name the single decisive artifact that would settle it.\n\nFINDING:\n${JSON.stringify(f)}`,
      { label: 'verify', phase: 'Verify', schema: VERDICT_SCHEMA }).then(v => ({ finding: f, verdict: v }))))).filter(Boolean)
}

// ---- Synthesize (+ write QA-NNN.md investigation sections) ----
phase('Synthesize')
const synthesis = await agent(`${base}

Synthesize Phase 0 for the live /quest skill, and WRITE the QA-NNN.md investigation sections to ${t.qaDocPath} (mirror the template at .claude/skills/quest/QA-NNN-template.md or an existing QA-NNN.md). Sections: Issue (BA) / Scope incl. blast-radius / Fix-shape hypothesis / Test-data / and — ONLY if genuinely stuck — a single Residual blocker.
Inputs:
- Discovery: ${JSON.stringify(discovery)}
- Knowledge + analogs: ${JSON.stringify(knowledge)}
- Recon: ${JSON.stringify(recon)}
- Adversarial verdicts: ${JSON.stringify(verdicts)}
- Notes.txt: ${JSON.stringify(notes)}
Produce: the fix-shape (file:line + what changes), the blast-radius (codebase-only${isPelupusan ? ', TRG excluded' : ', multi-state-aware'}), the verification oracle (how we will KNOW it is fixed), repro-achieved Y/N (bugs), a confidence level (honest), and a seniorBlocker ONLY if solving genuinely stalled (else "none" — the goal is to SOLVE, not manufacture questions to ask).`,
  { label: 'synthesis', phase: 'Synthesize', agentType: 'general-purpose', schema: SYNTH_SCHEMA })

return { qa: t.qa, depth: FULL ? 'full' : 'quick', discovery, knowledge, recon, verdicts, notes, synthesis }
