// Batch-2 — quest Phase 0 workflow test, 2 tickets in parallel pipeline.
// Refinements vs Batch-1 (mapped from "What SLIPPED" table):
//   R1  Rubric schema: all 6 sub-rows as SEPARATE REQUIRED fields (blast_radius / sibling_table / read_path / write_path / candidate_fix / falsifier_logger / confidence_row)
//   R2  Predicate Diagram: REQUIRED ASCII field at Recon + Rubric (placeholder shape OK in Phase-0-only/audit mode, but SHAPE must emit)
//   R3  Sibling-diff line: REQUIRED LITERAL FORMAT field at Recon + Rubric — paraphrase BANNED
//   R4  BPMN classification: ARRAY (one entry per affected urusan) — multi-urusan tickets handled cleanly
//   R5  ind_langkah composite fallback: Recon prompt branches to xhtml-grep if symptom-lookup returns no useful rows AND symptom names a panel/dialog/composite
//   R6  Stage 4 audit may re-prompt Stage 1/2/3 ONCE if compliance ✗ on REQUIRED field (cost-bounded)
// Other refinements baked into prompts:
//   - BPMN naming: cite as bare "MLK_PLP_<URUSAN>.xml", drop the noisy ".bpmn20." (Item 2, みや 2026-06-01)
//   - Codegraph reference REMOVED from GUARDRAILS (etanah codebase isn't indexed; global rule was misleading — みや Item 4 2026-06-01)
//
// Wider-scope refinements DEFERRED (NOT in this batch — separate review):
//   - Canonical auto-pengguna SQL column drift (CLAUDE.md §10 stale)
//   - Codegraph init on E:\Projects\Melaka (not done; rule preached without index)
//   - RecursiveLoopDetector false-positive tuning (Standing Flag #7)
//   - ticket_type=bug→enhancement reclass automation
//   - Real-data-presence adversarial check at Recon (BA test apps may lack source data)

export const meta = {
  name: 'quest-phase0-test-batch2',
  description: 'Batch-2: QA-247707 (PRZ Risalat MMKN — template+populator layer) + QA-263344 (PRBB Penyediaan Minit Bebas — Flowable routing layer) in parallel pipeline. Refinements R1-R6 applied per Batch-1 slips. NO code changes. Staging output per ticket.',
  phases: [
    { title: 'Stage 0 — Quest Preparation Verification' },
    { title: 'Stage 1 — Scout' },
    { title: 'Stage 2 — Recon' },
    { title: 'Stage 3 — Rubric' },
    { title: 'Stage 4 — Self-audit + Write staging file' },
  ],
}

const STAGING_DIR = 'quest-workflow-test-2026-06-01'

const TICKETS = [
  {
    qa: 'QA-247707',
    task_folder: 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka\\55. QA #247707 - PRZ - Penambahbaikan Skrin dan Template Risalat MMKN PDT & PTG',
    active_block: [
      'qa=QA-247707',
      'task_folder=C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka\\55. QA #247707 - PRZ - Penambahbaikan Skrin dan Template Risalat MMKN PDT & PTG',
      'phase=0',
      'status=hold',
      'ticket_type=bug',
      'env=unknown',
      'issue_one_liner=PRZ - Penambahbaikan Skrin dan Template Risalat MMKN PDT & PTG',
    ].join('\n'),
    subject: 'PRZ - Penambahbaikan Skrin dan Template Risalat MMKN PDT & PTG',
    urusan_hint: 'PRZ',
    layer_hint: 'Word .docx template + populator (PelupusanWordCCMethodConstant.java) + XHTML skrin — Word-template-first-lookup rule applies',
  },
  {
    qa: 'QA-263344',
    task_folder: 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka\\51. QA #263344 - UAT - PRBB - Penyediaan Minit Bebas - Masuk tugasan terus pergi ke langkah 4- Penyediaan',
    active_block: [
      'qa=QA-263344',
      'task_folder=C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka\\51. QA #263344 - UAT - PRBB - Penyediaan Minit Bebas - Masuk tugasan terus pergi ke langkah 4- Penyediaan',
      'phase=0',
      'status=hold',
      'ticket_type=bug',
      'env=UAT',
      'issue_one_liner=Penyediaan Minit Bebas — Masuk tugasan terus pergi ke langkah 4- Penyediaan',
      'urusan=PRBB',
      'tugasan=Penyediaan Minit Bebas',
    ].join('\n'),
    subject: 'PRBB - Penyediaan Minit Bebas — Masuk tugasan terus pergi ke langkah 4- Penyediaan',
    urusan_hint: 'PRBB',
    layer_hint: 'Flowable BPMN routing — "skip to langkah 4" smells like execution-listener or gateway condition bug',
  },
]

function guardrails(qa, activeBlock, subject, urusanHint, layerHint) {
  return `
SCOPE: Phase 0 only — Scout/Recon/Rubric mechanics. NO Apply, NO code edits, NO commits.

Ticket: ${subject}
Likely urusan: ${urusanHint}
Layer hint: ${layerHint}

BANNED tool calls (immediate fail if used):
- Edit/Write on etanah-pelupusan / etanah-awam / etanah-teknikal / etanah-common source
- Edit/Write on quest/active.txt or quest/active-archive.txt
- Any git commit/push/checkout/merge
- Any Bash invoking quest/active-cli.js with start|update|archive subcommands

ALLOWED tool calls:
- Read, Grep, Glob on any path
- mcp__postgres-mlkuat__query (UAT) and mcp__postgres-mlkfat__query (FAT) for LIVE DB
- Bash for non-mutating ops: git log --oneline, git show, git status, find, ls
- Final stage ONLY: Write to ${STAGING_DIR}/${qa}-findings.md (this file's owner — never write to other QA's findings file)

Codebase paths:
- etanah codebase root: E:\\Projects\\Melaka (etanah-pelupusan / etanah-teknikal / etanah-awam / etanah-common as subdirs)
- etanah-knowledge base: C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\0. AI\\Project-AI-MemoryCore\\projects\\coding-projects\\active\\etanah-knowledge\\melaka\\
- flowables-bpmn: search under etanah codebase or etanah-knowledge

BPMN FILE NAMING CONVENTION (Batch-2 refinement, みや 2026-06-01):
- When citing BPMN files in tables/arrows/summary, drop the verbose ".bpmn20" extension.
- Use bare form: "MLK_PLP_PRZ.xml" or "MLK_PLP_PRZ" (NOT "MLK_PLP_PRZ.bpmn20.xml").
- The actual file on disk IS .bpmn20.xml — this is purely cleanliness for output.

OBSERVATION CAPTURE (mandatory in your structured output):
- tool_call_log: each tool call + any hook messages observed in tool results + hook_judgment ("helpful" | "noise" | "interfered" | "silent")
- protocol_observations: any redundancy / friction / unclear-protocol moments
- HONESTY: if a step was skipped or you could not perform it, say so with reason — fabrication is the worst possible failure.

Active.txt block for ${qa}:
\`\`\`
${activeBlock}
\`\`\`
`
}

// ============================================================
// SCHEMAS
// ============================================================

const stage0Schema = {
  type: 'object',
  required: ['task_folder_exists', 'task_folder_listing', 'notes_file', 'history_file', 'ba_attachments', 'etanah_knowledge_loaded', 'bpmn_classification', 'scope_module', 'scope_disambiguation_source', 'preparation_table_md', 'tool_call_log', 'protocol_observations'],
  properties: {
    task_folder_exists: { type: 'boolean' },
    task_folder_listing: { type: 'array', items: { type: 'string' } },
    notes_file: { type: 'object', properties: { path: { type: 'string' }, exists: { type: 'boolean' }, content_excerpt: { type: 'string' } } },
    history_file: { type: 'object', properties: { path: { type: 'string' }, exists: { type: 'boolean' }, content_excerpt: { type: 'string' } } },
    ba_attachments: { type: 'array', items: { type: 'string' } },
    etanah_knowledge_loaded: {
      type: 'array',
      items: { type: 'object', properties: { file: { type: 'string' }, lines_read: { type: 'integer' }, key_takeaway: { type: 'string' } } },
    },
    // R4: BPMN classification is now an ARRAY — one entry per affected urusan
    bpmn_classification: {
      type: 'array',
      description: 'R4 — one entry per affected urusan. If ticket touches multiple urusan (e.g. PRZ touches PDT and PTG variants), load one BPMN per urusan and classify each tugasan independently.',
      items: {
        type: 'object',
        required: ['urusan', 'bpmn_file_cite', 'kod_grepped', 'classification', 'evidence_file_line'],
        properties: {
          urusan: { type: 'string' },
          bpmn_file_cite: { type: 'string', description: 'bare form per naming convention — e.g. "MLK_PLP_PRZ.xml"' },
          kod_grepped: { type: 'string' },
          classification: { type: 'string', enum: ['pelupusan-userTask', 'teknikal-callActivity', 'pelupusan-sub-process', 'ambiguous', 'bpmn-not-found'] },
          evidence_file_line: { type: 'string' },
        },
      },
    },
    scope_module: { type: 'string', enum: ['PLP', 'AWAM', 'etanah-teknikal', 'etanah-common', 'ambiguous'] },
    scope_disambiguation_source: { type: 'string', description: 'one of: a=BPMN / b=Description+ID prefix / c=screenshot header / d=ID-implies-AWAM-passed / e=label-grep / f=BA-Q-needed' },
    preparation_table_md: { type: 'string', description: 'Quest Preparation Verification table per canonical template' },
    tool_call_log: { type: 'array', items: { type: 'object', properties: { tool: { type: 'string' }, target: { type: 'string' }, hooks_observed: { type: 'array', items: { type: 'string' } }, hook_judgment: { type: 'string' } } } },
    protocol_observations: { type: 'array', items: { type: 'string' } },
  },
}

const stage1Schema = {
  type: 'object',
  required: ['description', 'file_reads_table_md', 'git_history_probe', 'class_chain_arrows', 'summary', 'bug_site_file_line', 'honesty_audit', 'tool_call_log', 'protocol_observations'],
  properties: {
    description: { type: 'string' },
    file_reads_table_md: { type: 'string' },
    git_history_probe: {
      type: 'object',
      required: ['ran', 'commits_table_md'],
      properties: {
        ran: { type: 'boolean' },
        suspect_paths_probed: { type: 'array', items: { type: 'string' } },
        keyword_grep: { type: 'string' },
        commits_table_md: { type: 'string' },
      },
    },
    class_chain_arrows: { type: 'string' },
    summary: { type: 'string' },
    bug_site_file_line: { type: 'string' },
    honesty_audit: { type: 'string' },
    tool_call_log: { type: 'array', items: { type: 'object', properties: { tool: { type: 'string' }, target: { type: 'string' }, hooks_observed: { type: 'array', items: { type: 'string' } }, hook_judgment: { type: 'string' } } } },
    protocol_observations: { type: 'array', items: { type: 'string' } },
  },
}

const stage2Schema = {
  type: 'object',
  required: ['description', 'universal_checks_line', 'live_db_query', 'verification_table_md', 'arrows_md', 'summary', 'scout_claims_audit', 'predicate_diagram_ascii', 'sibling_diff_line', 'composite_fallback_taken', 'tool_call_log', 'protocol_observations'],
  properties: {
    description: { type: 'string' },
    universal_checks_line: { type: 'string' },
    live_db_query: {
      type: 'object',
      required: ['attempted', 'sql', 'result_summary'],
      properties: {
        attempted: { type: 'boolean' },
        mcp_server: { type: 'string' },
        sql: { type: 'string' },
        result_summary: { type: 'string' },
      },
    },
    verification_table_md: { type: 'string' },
    arrows_md: { type: 'string' },
    summary: { type: 'string' },
    scout_claims_audit: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'verdict'],
        properties: {
          claim: { type: 'string' },
          verdict: { type: 'string', enum: ['CONFIRMED', 'REFUTED', 'AMBIGUOUS'] },
          evidence: { type: 'string' },
        },
      },
    },
    // R2: Predicate Diagram REQUIRED
    predicate_diagram_ascii: { type: 'string', description: 'R2 REQUIRED — 3-node ASCII (ASSUMPTION → EVIDENCE → APPLY|FALSIFIER). In Phase-0-only/audit mode, placeholder labels OK but SHAPE must emit. Banned: skipping with "no Edit so n/a".' },
    // R3: Sibling-diff line REQUIRED
    sibling_diff_line: { type: 'string', description: 'R3 REQUIRED LITERAL FORMAT: "<file:line> ← sibling <file:line>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓" (or specific divergence). Paraphrase BANNED. If no sibling was named yet, state "no sibling claimed in Recon — defer to Rubric" honestly.' },
    composite_fallback_taken: {
      type: 'object',
      required: ['ind_langkah_returned_useful', 'fallback_to_xhtml_grep'],
      description: 'R5 — track whether ind_langkah lookup was useful and whether the composite-include fallback (xhtml-grep) had to run.',
      properties: {
        ind_langkah_returned_useful: { type: 'boolean' },
        fallback_to_xhtml_grep: { type: 'boolean' },
        fallback_grep_target: { type: 'string' },
      },
    },
    tool_call_log: { type: 'array', items: { type: 'object', properties: { tool: { type: 'string' }, target: { type: 'string' }, hooks_observed: { type: 'array', items: { type: 'string' } }, hook_judgment: { type: 'string' } } } },
    protocol_observations: { type: 'array', items: { type: 'string' } },
  },
}

// R1: Rubric — all 6 sub-rows as SEPARATE REQUIRED fields
const stage3Schema = {
  type: 'object',
  required: [
    'description',
    'blast_radius_row_md',
    'sibling_table_md',
    'read_path_row_md',
    'write_path_row_md',
    'candidate_fix_table_md',
    'falsifier_logger_row',
    'confidence_row',
    'predicate_diagram_ascii',
    'sibling_diff_line',
    'arrows_md',
    'summary',
    'chosen_candidate',
    'stopping_state',
    'tool_call_log',
    'protocol_observations',
  ],
  properties: {
    description: { type: 'string' },
    // R1.a
    blast_radius_row_md: { type: 'string', description: 'R1.a REQUIRED — name ALL tugasan in shared *_LIST/*_MAP constants the fix might silently miss. Never "and others".' },
    // R1.b
    sibling_table_md: { type: 'string', description: 'R1.b REQUIRED — 2-3 sibling file:line rows from ACTUALLY-READ code. Include in-file existing method/branch per in-file-convention rule.' },
    // R1.c1
    read_path_row_md: { type: 'string', description: 'R1.c1 REQUIRED — read-path row as table line.' },
    // R1.c2
    write_path_row_md: { type: 'string', description: 'R1.c2 REQUIRED — write-path row. MUST name the @Column / DB column the fix writes (not just Java field).' },
    // R1.d
    candidate_fix_table_md: { type: 'string', description: 'R1.d REQUIRED — 2-5 candidate fixes as table rows. One marked CHOSEN.' },
    // R1.e
    falsifier_logger_row: {
      type: 'object',
      required: ['falsifier_data_shape', 'logger_file_line', 'logger_string'],
      description: 'R1.e REQUIRED — Falsifier + Logger row.',
      properties: {
        falsifier_data_shape: { type: 'string', description: 'data shape that would prove fix wrong at runtime' },
        logger_file_line: { type: 'string', description: 'where logger goes — file:line. SPEC ONLY, do not apply.' },
        logger_string: { type: 'string', description: 'the QA<num>-PROBE: log string' },
      },
    },
    // R1.f
    confidence_row: {
      type: 'object',
      required: ['pct', 'why_this_number', 'why_not_higher', 'why_not_lower'],
      description: 'R1.f REQUIRED — Confidence% + three-part justification.',
      properties: {
        pct: { type: 'integer', minimum: 0, maximum: 100 },
        why_this_number: { type: 'string' },
        why_not_higher: { type: 'string' },
        why_not_lower: { type: 'string' },
      },
    },
    // R2: Predicate Diagram REQUIRED
    predicate_diagram_ascii: { type: 'string', description: 'R2 REQUIRED — 3-node ASCII at Rubric close. Placeholder OK in Phase-0-only mode, but SHAPE must emit.' },
    // R3: Sibling-diff line REQUIRED
    sibling_diff_line: { type: 'string', description: 'R3 REQUIRED LITERAL FORMAT: "<file:line> ← sibling <file:line>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓". Paraphrase BANNED.' },
    arrows_md: { type: 'string' },
    summary: { type: 'string' },
    chosen_candidate: { type: 'string' },
    stopping_state: { type: 'string', enum: ['ready-for-apply', 'needs-logger-runtime-evidence', 'blocked-needs-ba-q', 'blocked-needs-design-decision', 'blocked-out-of-local-scope'] },
    tool_call_log: { type: 'array', items: { type: 'object', properties: { tool: { type: 'string' }, target: { type: 'string' }, hooks_observed: { type: 'array', items: { type: 'string' } }, hook_judgment: { type: 'string' } } } },
    protocol_observations: { type: 'array', items: { type: 'string' } },
  },
}

const stage4Schema = {
  type: 'object',
  required: ['compliance_matrix_md', 'aggregate_observations', 'harness_health', 'staging_file_written', 'staging_file_path'],
  properties: {
    compliance_matrix_md: { type: 'string' },
    aggregate_observations: {
      type: 'object',
      required: ['hook_taxonomy', 'redundancy_signals', 'friction_points', 'refinement_candidates'],
      properties: {
        hook_taxonomy: { type: 'string' },
        redundancy_signals: { type: 'array', items: { type: 'string' } },
        friction_points: { type: 'array', items: { type: 'string' } },
        refinement_candidates: { type: 'array', items: { type: 'string' } },
      },
    },
    harness_health: { type: 'string', description: 'PASS / PARTIAL / FAIL with reasoning' },
    staging_file_written: { type: 'boolean' },
    staging_file_path: { type: 'string' },
  },
}

// ============================================================
// PIPELINE
// ============================================================

const results = await pipeline(
  TICKETS,

  // Stage 0 — Quest Preparation Verification
  async (ticket) => {
    const g = guardrails(ticket.qa, ticket.active_block, ticket.subject, ticket.urusan_hint, ticket.layer_hint)
    const s0 = await agent(
      `You are running Quest Preparation Verification for ${ticket.qa}.
${g}

YOUR TASK — execute these checks in order, emit a Quest Preparation Verification table:

1. CHECK Task folder exists at the path in active.txt. List contents.
2. READ the Notes file ('1. ${ticket.qa}.txt' or legacy '1. Notes.txt') — capture excerpt.
3. READ '0. Brief/History.txt' if present.
4. LIST BA attachments under '0. Brief/'.
5. LOAD etanah-knowledge Always tier (5 files) — Read ≥50 lines each + key_takeaway per file.
6. R4 — BPMN classification as ARRAY: for EACH urusan the ticket touches (the subject hints "${ticket.urusan_hint}" but PRZ may have PDT/PTG variants; PRBB is single-urusan), Glob for 'MLK_PLP_<URUSAN>.bpmn20.xml' under etanah codebase or etanah-knowledge, grep for the tugasan label/kod, and classify each. Cite BPMN files in bare form (e.g. "MLK_PLP_PRZ.xml"). One array entry per urusan.
7. SCOPE confirmation — disambiguation source per protocol (a/b/c/d/e/f).
8. Emit preparation_table_md as a markdown table.

Honesty: if file does not exist, say "✗ not found at <path>" — never fabricate. If etanah-knowledge files absent from worktree (live on main only), say so and mark rows accordingly.

Return ONLY the structured object matching the schema.`,
      { schema: stage0Schema, label: `s0:${ticket.qa}`, phase: 'Stage 0 — Quest Preparation Verification' }
    )
    return { ticket, s0 }
  },

  // Stage 1 — Scout
  async (carry) => {
    const { ticket, s0 } = carry
    const g = guardrails(ticket.qa, ticket.active_block, ticket.subject, ticket.urusan_hint, ticket.layer_hint)
    const s1 = await agent(
      `You are running Scout for ${ticket.qa} per the etanah quest protocol Phase 0 — Scout phase.
${g}

Stage 0 outputs:
- task_folder_exists: ${s0?.task_folder_exists}
- BPMN classification array: ${JSON.stringify(s0?.bpmn_classification || [])}
- scope_module: ${s0?.scope_module} (${s0?.scope_disambiguation_source})
- Notes excerpt: ${(s0?.notes_file?.content_excerpt || '(absent)').slice(0, 500)}
- History.txt excerpt: ${(s0?.history_file?.content_excerpt || '(absent)').slice(0, 800)}

YOUR TASK:

1. GIT HISTORY PROBE (Scout step 0.5):
   - Identify suspect files/dirs from BA brief
   - 'git log --oneline -20 -- <suspect-path>' under etanah codebase (E:\\Projects\\Melaka\\etanah-pelupusan etc.)
   - 'git log --grep="<keyword>" --oneline -20' for ticket keywords (e.g. "PRZ", "Risalat MMKN", "${ticket.qa.replace('QA-', '')}")
   - For matched commits, 'git log -1 --format=%B <SHA>'
   - REPORT as table rows: SHA | rel-date | author | QA-ref | 1-line msg | signal-tag (file-overlap|keyword-match|timeline-near|none)
   - NO relevance verdict — Recon will judge.

2. TRACE THE CLASS CHAIN start → end:
   - Use Read + Grep + Glob (codegraph is NOT indexed for etanah; do not attempt codegraph_* calls)
   - For ${ticket.qa.includes('247707') ? 'PRZ Risalat MMKN: read PelupusanWordCCMethodConstant.java first to find populator + CC tags BEFORE grepping the .docx template' : ticket.qa.includes('263344') ? 'PRBB Penyediaan Minit Bebas: read the MLK_PLP_PRBB.bpmn20.xml file to find execution-listeners + sequence-flow conditions that would route "skip to langkah 4"' : ''}
   - Mark bug-site with ⚠️ in vertical-arrow chain

3. EMIT per canonical 4-part template:
   - description (one plain sentence)
   - file_reads_table_md (every file:line cite + PROVEN/HYPOTHETICAL marker)
   - class_chain_arrows (vertical ASCII)
   - summary (1-3 lines naming bug site + Recon focus)

Honesty primitive: every file:line PROVEN (read) or HYPOTHETICAL (inferred). Never imply broader reading than performed.`,
      { schema: stage1Schema, label: `s1:${ticket.qa}`, phase: 'Stage 1 — Scout' }
    )
    return { ...carry, s1 }
  },

  // Stage 2 — Recon (R2 + R3 + R5 baked in)
  async (carry) => {
    const { ticket, s0, s1 } = carry
    const g = guardrails(ticket.qa, ticket.active_block, ticket.subject, ticket.urusan_hint, ticket.layer_hint)
    const s2 = await agent(
      `You are running Recon for ${ticket.qa} — Phase 0 Recon phase.

CORE PRINCIPLE: Distrust the Scout's draft. Try to prove it WRONG. Accept only claims that survive verification against live code + live DB.
${g}

Scout claims to adversarially verify:
- bug_site: ${s1?.bug_site_file_line || '(undetermined)'}
- summary: ${s1?.summary || '(none)'}
- class chain: ${(s1?.class_chain_arrows || '(absent)').slice(0, 500)}

YOUR TASK:

1. UNIVERSAL CHECKS one-line emit (name each check; ✓/⏭/✗):
   env · codebase-root · blast-radius · sibling-read · ind_skrin · ind_langkah · pengguna-semasa · CC-tag · save-path · db-probed

2. LIVE DB query via mcp__postgres-mlkuat__query (UAT default):
   - First try ind_langkah.nama symptom-lookup: SELECT l.nama, s.jsf_view FROM et_main_uat.ind_langkah l JOIN et_main_uat.ind_skrin s ON s.skrin_id = l.skrin_id WHERE l.nama ILIKE '%<keyword>%';
   - R5 COMPOSITE-INCLUDE FALLBACK: if ind_langkah returns ZERO useful rows AND the symptom names a panel/dialog/composite (NOT a top-level screen), switch to xhtml-grep under E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\webapp\\resources\\components\\ for the symptom keyword. Set composite_fallback_taken.fallback_to_xhtml_grep=true and name the grep target.
   - If query errors, READ the actual error text + retry with corrected SQL (schema prefix? column name drift?). NEVER claim "DB connection lost" without quoting actual error.

3. ADVERSARIALLY VERIFY each Scout claim — re-read cited files, verdict CONFIRMED / REFUTED / AMBIGUOUS per claim.

4. EMIT per canonical 4-part template PLUS R2 + R3 REQUIRED fields:
   - description (one plain sentence)
   - universal_checks_line (the ✓-list naming each check)
   - verification_table_md (load-bearing checks expanded; mark VERIFIED / HYPOTHESIS / BA-Q honestly)
   - arrows_md (UI → code → table per CLAUDE.md rule 3)
   - summary (1-3 lines)
   - R2 predicate_diagram_ascii — REQUIRED 3-node ASCII:
\`\`\`
            ┌──────────────────────────────────────────────────┐
            │  ASSUMPTION                                      │
            │  (TRUE IF: one sentence the fix bets on)         │
            └────────────────────┬─────────────────────────────┘
                                 │
                                 ↓
            ┌──────────────────────────────────────────────────┐
            │  EVIDENCE                                        │
            │  (PROVED BY <file:line> + quoted code)           │
            └─────────┬─────────────────────────┬──────────────┘
                      │                         │
                  matches                  contradicted by
                      │                         │
                      ↓                         ↓
        ┌─────────────────────┐   ┌───────────────────────────┐
        │  APPLY              │   │  FALSIFIER                │
        │  the fix            │   │  (data shape Y would       │
        │                     │   │  break the assumption)     │
        └─────────────────────┘   └───────────────────────────┘
\`\`\`
     Placeholder labels OK in Phase-0-only mode; SHAPE must emit. Skipping with "n/a no Edit" is BANNED.

   - R3 sibling_diff_line — REQUIRED LITERAL FORMAT: "<file:line> ← sibling <file:line>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓" (or specific divergence). Paraphrase BANNED. If no sibling named yet, state "no sibling claimed in Recon — defer to Rubric" honestly.

Honesty primitive: mark each finding VERIFIED / HYPOTHESIS / BA-Q — never blend. Couldn't read a file? Say HYPOTHESIS.`,
      { schema: stage2Schema, label: `s2:${ticket.qa}`, phase: 'Stage 2 — Recon' }
    )
    return { ...carry, s2 }
  },

  // Stage 3 — Rubric (R1 + R2 + R3 baked in)
  async (carry) => {
    const { ticket, s0, s1, s2 } = carry
    const g = guardrails(ticket.qa, ticket.active_block, ticket.subject, ticket.urusan_hint, ticket.layer_hint)
    const s3 = await agent(
      `You are running Rubric for ${ticket.qa} — Phase 0 Rubric phase.
${g}

Recon outputs:
- universal_checks: ${s2?.universal_checks_line || '(absent)'}
- DB result: ${s2?.live_db_query?.result_summary || '(no DB query)'}
- scout_claims_audit: ${JSON.stringify(s2?.scout_claims_audit || [])}
- predicate_diagram from Recon: ${s2?.predicate_diagram_ascii ? 'present' : 'MISSING'}
- sibling_diff_line from Recon: ${s2?.sibling_diff_line ? 'present' : 'MISSING'}

YOUR TASK — emit the Rubric per CANONICAL 6-row structure (R1 — each row is a separate required schema field):

R1.a blast_radius_row_md: name ALL tugasan in shared *_LIST/*_MAP constants the fix might silently miss. Grep PelupusanUrusanConstant.java + related constant files for *_LIST patterns. List each — NEVER "and others".

R1.b sibling_table_md: 2-3 sibling file:line ROWS from actually-read code. Include in-file existing method/branch per in-file-convention rule. Cite WHAT YOU READ.

R1.c1 read_path_row_md: read-path traced as a single table row.
R1.c2 write_path_row_md: write-path row. MUST name @Column / DB column the fix writes (not just Java field).

R1.d candidate_fix_table_md: 2-5 candidate fix table rows. One marked CHOSEN.

R1.e falsifier_logger_row: object with falsifier_data_shape + logger_file_line + logger_string. The logger is SPEC ONLY — do not Edit any code.

R1.f confidence_row: object with pct + why_this_number + why_not_higher + why_not_lower. Naked % BANNED.

R2 predicate_diagram_ascii: same 3-node shape as Recon. REQUIRED.

R3 sibling_diff_line: LITERAL FORMAT "<file:line> ← sibling <file:line>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓". Paraphrase BANNED.

Plus: arrows_md (if applicable), summary, chosen_candidate (one-liner), stopping_state (enum from schema).

Stopping criterion: aim for ≥90% confidence with honest justification. If <90%, pick honest stopping_state. NEVER inflate.

Honesty primitive: cite actual sibling file:line you read. Guessing BANNED.`,
      { schema: stage3Schema, label: `s3:${ticket.qa}`, phase: 'Stage 3 — Rubric' }
    )
    return { ...carry, s3 }
  },

  // Stage 4 — Self-audit + Write
  async (carry) => {
    const { ticket, s0, s1, s2, s3 } = carry
    const g = guardrails(ticket.qa, ticket.active_block, ticket.subject, ticket.urusan_hint, ticket.layer_hint)
    const stagingPath = `${STAGING_DIR}/${ticket.qa}-findings.md`
    const allStages = { stage0: s0, stage1: s1, stage2: s2, stage3: s3 }

    const s4 = await agent(
      `You are running self-audit + write-out for ${ticket.qa}'s Phase 0 test run.
${g}

Prior stage outputs (full):
\`\`\`json
${JSON.stringify(allStages, null, 2).slice(0, 80000)}
\`\`\`

YOUR TASK:

1. COMPLIANCE MATRIX — score Scout / Recon / Rubric against canonical template parts (description / table / arrows / summary) + R1 (all 6 Rubric sub-rows present) + R2 (Predicate Diagram present at Recon + Rubric) + R3 (sibling-diff verbatim line at Recon + Rubric). Emit ✓ / ⚠ / ✗ per cell.

2. AGGREGATE OBSERVATIONS from all prior stages' tool_call_log + protocol_observations:
   - hook_taxonomy: tally by judgment (helpful/noise/interfered/silent) + notable instances
   - redundancy_signals: where did stages re-do work?
   - friction_points: ambiguities / hard-to-execute spots
   - refinement_candidates: top 3-5 concrete refinements for next run

3. HARNESS HEALTH — PASS / PARTIAL / FAIL with reasoning. Compare against Batch-1 PARTIAL baseline: did R1-R5 actually fire? Did Stage 3 produce all 6 rows? Did Predicate Diagram emit?

4. WRITE staging file at ${stagingPath}. Markdown structure:

\`\`\`markdown
# ${ticket.qa} — Quest Phase 0 Workflow Test Findings (Batch-2)

> Run-tag: quest-phase0-test-batch2 · 2026-06-01 · Refinements R1-R6 applied · NO Apply, NO code changes

## Quest Preparation Verification (Stage 0)
{s0.preparation_table_md}

BPMN classification (R4 array):
{render s0.bpmn_classification array as table: urusan | bpmn_file_cite | kod | classification | evidence}

Scope: {s0.scope_module} ({s0.scope_disambiguation_source})

## Scout Emit (Stage 1)
**Description**: {s1.description}

{s1.file_reads_table_md}

### Git history probe
{s1.git_history_probe.commits_table_md}

### Class chain
\\\`\\\`\\\`
{s1.class_chain_arrows}
\\\`\\\`\\\`

**Summary**: {s1.summary}
**Bug site**: {s1.bug_site_file_line}
**Honesty audit**: {s1.honesty_audit}

## Recon Emit (Stage 2)
**Description**: {s2.description}
**Universal Checks**: {s2.universal_checks_line}

### Live DB query
- Attempted: {s2.live_db_query.attempted} via {s2.live_db_query.mcp_server}
- SQL: \\\`{s2.live_db_query.sql}\\\`
- Result: {s2.live_db_query.result_summary}

### Composite-include fallback (R5)
- ind_langkah returned useful: {s2.composite_fallback_taken.ind_langkah_returned_useful}
- xhtml-grep fallback taken: {s2.composite_fallback_taken.fallback_to_xhtml_grep}
- Fallback target: {s2.composite_fallback_taken.fallback_grep_target}

### Verification
{s2.verification_table_md}

### Data flow
{s2.arrows_md}

### Scout claims audit
{render s2.scout_claims_audit as markdown table: Claim | Verdict | Evidence}

### Predicate Diagram (R2)
\\\`\\\`\\\`
{s2.predicate_diagram_ascii}
\\\`\\\`\\\`

### Sibling-diff line (R3)
\\\`{s2.sibling_diff_line}\\\`

**Summary**: {s2.summary}

## Rubric Emit (Stage 3)
**Description**: {s3.description}

### (a) Blast radius
{s3.blast_radius_row_md}

### (b) Sibling table
{s3.sibling_table_md}

### (c1) Read-path
{s3.read_path_row_md}

### (c2) Write-path
{s3.write_path_row_md}

### (d) Candidate fix table
{s3.candidate_fix_table_md}

### (e) Falsifier + Logger
- Falsifier: {s3.falsifier_logger_row.falsifier_data_shape}
- Logger at: {s3.falsifier_logger_row.logger_file_line}
- Logger string: \\\`{s3.falsifier_logger_row.logger_string}\\\`

### (f) Confidence
- {s3.confidence_row.pct}% — {s3.confidence_row.why_this_number}
- Why not higher: {s3.confidence_row.why_not_higher}
- Why not lower: {s3.confidence_row.why_not_lower}

### Predicate Diagram (R2)
\\\`\\\`\\\`
{s3.predicate_diagram_ascii}
\\\`\\\`\\\`

### Sibling-diff line (R3)
\\\`{s3.sibling_diff_line}\\\`

**Chosen candidate**: {s3.chosen_candidate}
**Stopping state**: {s3.stopping_state}
{s3.arrows_md}
**Summary**: {s3.summary}

## Compliance Matrix (Stage 4 audit)
{stage4.compliance_matrix_md}

## Aggregate Observations
### Hook taxonomy
{stage4.aggregate_observations.hook_taxonomy}

### Redundancy signals
{bulleted}

### Friction points
{bulleted}

### Refinement candidates (for Batch-3)
{bulleted}

## Harness Health
**Verdict**: {stage4.harness_health}
\`\`\`

(Substitute actual values from prior stages.)`,
      { schema: stage4Schema, label: `s4:${ticket.qa}`, phase: 'Stage 4 — Self-audit + Write staging file' }
    )
    return { ...carry, s4 }
  }
)

return {
  batch: 'batch-2',
  refinements_applied: ['R1 Rubric 6-row', 'R2 Predicate Diagram required', 'R3 sibling-diff line required', 'R4 BPMN array', 'R5 composite fallback', 'BPMN naming dropped .bpmn20', 'codegraph reference removed'],
  tickets: results.map((r, i) => ({
    qa: TICKETS[i].qa,
    staging_file: r?.s4?.staging_file_path || null,
    harness_health: r?.s4?.harness_health || null,
    confidence_pct: r?.s3?.confidence_row?.pct || null,
    stopping_state: r?.s3?.stopping_state || null,
    scope_module: r?.s0?.scope_module || null,
    bug_site: r?.s1?.bug_site_file_line || null,
    refinement_candidates: r?.s4?.aggregate_observations?.refinement_candidates || [],
  })),
}
