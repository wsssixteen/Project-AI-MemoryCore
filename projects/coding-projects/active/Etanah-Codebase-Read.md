# Etanah-Codebase-Read
*Coding Project - Created 2026-03-23*

## Description
Build a multi-layer codebase reading strategy for Etanah's Pelupusan (PLU) module. MCP tools for structure, sub-agents for focused reads, Gemini for JSF gap, externalized markdown memory across sessions. Ticket-driven learning as primary approach.

## Project Details
- **Type**: Coding Project
- **Status**: Active
- **Created**: 2026-03-23 10:30AM
- **Last Accessed**: 2026-03-24
- **Position**: #1

## North Star
**Phase 1 — Personal Excellence** (from 3-phase career vision)
- Master the codebase, tools, and workflows. Become independently effective.

## Technical Stack
- **Languages**: Java 8-17
- **Frameworks**: JSF PrimeFaces, JBoss 6.4-7.4, Flowable
- **Database**: PostgreSQL / Oracle (state-dependent, Melaka DB engine [VERIFY])
- **Work IDE**: Eclipse (company standard)
- **AI Tooling**: Claude Code (terminal-based — no VS Code dependency), Gemini CLI (scanning)
- **Other Tools**: DBeaver, Git

## Strategy
**Approach D-Lite (phased multi-layer) + E (ticket-driven learning)**
- Upgraded from Strategy B after full research assessment (2026-03-24)
- Build by stages, add tools only when current layer hits a wall

### Layer Architecture
| Layer | Tool | Purpose |
|---|---|---|
| 0 | Eclipse JDT (at work) | Java navigation built into work IDE — no extra setup needed |
| 1 | codebase-memory-mcp | Structural knowledge graph via MCP. On-demand querying. |
| 2 | Sub-agents | Focused reads in isolated context. Prevents rot. Threshold: >500 lines. |
| 3 | Gemini CLI | JSF/XHTML/EL/Flowable BPMN — the gap no automated tool covers |
| 4 | Externalized memory | Markdown knowledge files that persist across sessions |

### Learning Approach
- **Primary**: Ticket-driven (Strategy E) — learn by working real tickets
- **Secondary**: Periodic exploration sessions (1x/week on untouched modules)
- **Model**: Senior developer onboarding pattern (orient → first blood → trace a thread → build the map)

## Reading Order
1. **Melaka** (first — assigned state, active work)
2. **etanah-common** (shared across states)
3. **Terengganu** (reference — stable, production-grade)

## Reading Sequence (per state)
1. High-level overview — what does this module do, main packages
2. Entry points — JSF pages and managed beans for main user flows
3. Full flow trace — UI → bean → service → DB for one form submission
4. Pattern extraction — repeated structures, validation, service calls

## Output Targets
All files live in `projects/coding-projects/active/codebase-knowledge/melaka/`:
- `MODULE-ARCHITECTURE.md` — primary target for scan results
- `DATABASE.md` — schema and entity relationships
- `JSF-WIRING.md` — EL expressions, managed bean mappings (the gap layer)
- `FLOWABLE-WORKFLOWS.md` — workflow definitions (after VPN access)
- `DOMAIN-GLOSSARY.md` — domain terms discovered during reading
- `FLOW-TRACES.md` — end-to-end UI→DB traces from ticket work
- `session-notes/` — per-session working notes (promoted to main files)
- Debugging + feature dev playbook (built from patterns)

## Open Questions
- [ ] Best interval/chunking strategy for Gemini scanning
- [ ] How to structure GEMINI.md to control scan intervals
- [x] Melaka DB engine — PostgreSQL (confirmed, Oracle only for very old projects)
- [ ] PRK state code — what does it stand for? (ask colleagues 2026-03-25)
- [ ] Flowable portal access (VPN dependent)
- [ ] Custom EL extractor script — build it ourselves? (~200 lines Python, maps .xhtml #{...} → Java beans)

## Development Goals
1. Understand Melaka PLU codebase end-to-end (including JSF wiring layer)
2. Build debugging + feature dev playbook from patterns found
3. Prevent context rot across sessions via layered tooling + externalized memory
4. Feed findings into MODULE-ARCHITECTURE.md and other sub-MDs

## Phased Execution Plan
| Phase | Task | Effort | Status |
|---|---|---|---|
| 0 | Eclipse JDT already at work — no action needed | 0 min | Done (built-in) |
| 1 | Install codebase-memory-mcp, index Melaka repo | 15 min | Done (2026-03-24) |
| 2 | Set up externalized memory structure (codebase-knowledge/) | 30 min | Done (2026-03-24) |
| 3 | First Gemini scan of JSF/XHTML layer (the gap) | 1-2 hours | Not started |
| 4 | Build custom EL extractor script (JSF gap bridge) | 1-2 hours | Planned (after Phase 3) |
| 5 | Start ticket-driven learning with sub-agent flow tracing | Ongoing | Not started |
| 6 | Evaluate if RAG (Continue.dev) adds value | Week 3-4 | Optional |

## Progress Log
### 2026-03-23
- Project created
- Strategy B confirmed (hybrid: Gemini scans, Claude reasons)
- Reading order updated: Melaka first (was Terengganu)
- North star aligned: Phase 1 — Personal Excellence

### 2026-03-24
- Full strategic assessment completed (4 parallel research agents: RAG, sub-agents, MCP/tools, alternative strategies)
- Strategy upgraded: B → D-Lite + E (phased multi-layer + ticket-driven learning)
- Key finding: JSF/XHTML gap — no automated tool handles EL expressions, managed bean wiring, XML navigation
- CLAUDE.md updated to v1.1 with 7 non-negotiable project rules (auto-loads every session)
- Glossary of key terms shared with Miya (MCP, sub-agents, EL expressions, context rot, etc.)
- Analyzed codebase-to-course tool — verdict: skip for Phase 1, maybe Phase 2 for team onboarding
- Deep research completed (web search): confirmed JSF gap is permanent in 2026, no tool coming
- IDE clarification: Eclipse at work, Claude Code terminal at home — VS Code not required
- New findings: FIC pattern (Research→Plan→Implement, 40-60% context), custom EL extractor script idea
- Research validated: Codified Context Infrastructure paper (283 sessions), HumanLayer FIC, Thoughtworks Radar
- Updated CLAUDE.md and project file to reflect Eclipse instead of VS Code
- **Phase 1 complete**: codebase-memory-mcp v0.5.6 installed + etanah-pelupusan indexed
  - Binary: `C:/Users/vice4/AppData/Local/codebase-memory-mcp/codebase-memory-mcp.exe`
  - Knowledge graph: 23,890 nodes, 57,863 edges (298 files, 295 classes, 10,160 methods)
  - MCP registered with Claude Code (user scope)
  - Cypher queries working: `MATCH (n:Class) WHERE n.name CONTAINS 'X' RETURN n`
  - Project ID: `C-Users-vice4-OneDrive - Pymsoft Sdn Bhd-Projects-Melaka-etanah-pelupusan`
- **Phase 2 complete**: externalized memory structure created (codebase-knowledge/melaka/)
  - 6 knowledge files: MODULE-ARCHITECTURE, DATABASE, JSF-WIRING, FLOWABLE-WORKFLOWS, DOMAIN-GLOSSARY, FLOW-TRACES
  - Domain glossary pre-populated with 16 Malay terms from class names
  - DB confirmed PostgreSQL for Melaka (Oracle only for very old projects)
- Phase order resequenced: structure (Phase 2) before scanning (Phase 3) — logical dependency fix
- Session-notes subfolder dropped — redundant with current-session.md + knowledge files
- Prayer reminder system built (Feature/Time-based-Aware-System/prayer-tracker.md)
- Open: PRK state code meaning (ask colleagues 2026-03-25), Gemini CLI not yet installed
  - Binary: `C:/Users/vice4/AppData/Local/codebase-memory-mcp/codebase-memory-mcp.exe`
  - Knowledge graph: 23,890 nodes, 57,863 edges (298 files, 295 classes, 10,160 methods)
  - MCP registered with Claude Code (user scope)
  - Cypher queries working: `MATCH (n:Class) WHERE n.name CONTAINS 'X' RETURN n`
  - Project ID: `C-Users-vice4-OneDrive - Pymsoft Sdn Bhd-Projects-Melaka-etanah-pelupusan`

## Current Tasks
- [x] Phase 0: Eclipse JDT at work — built-in, no action needed
- [x] Phase 1: Install codebase-memory-mcp, index Melaka repo (23,890 nodes, 57,863 edges)
- [x] Phase 2: Set up externalized memory structure (codebase-knowledge/)
- [ ] Phase 3: First Gemini scan of JSF/XHTML layer
- [ ] Phase 4: Build custom EL extractor script (after Phase 3)

## Known Issues
- VPN access not yet available — blocks Flowable and some DB work

## Resources & References
- Etanah codebase on OneDrive (work laptop accessible)

## Session Notes
*Space for working notes during active sessions*

## Research Findings (2026-03-24)

### Validated by Research
- codebase-memory-mcp: 120x token reduction vs file-by-file, handles 28M LOC
- Externalized memory: validated by Codified Context Infrastructure paper (283 sessions, 108K LOC)
- Ticket-driven learning: Thoughtworks Radar "Adopt" for GenAI + legacy codebases
- Sub-agents: every major tool shipped multi-agent Feb 2026 — now table stakes
- JSF gap: PLDI 2020 paper (JackEE) proved traditional static analysis fundamentally broken for enterprise Java

### Session Discipline (from FIC pattern)
- Keep context at 40-60% utilization max
- Three phases per session: Research → Plan → Implement
- Each phase compresses output for the next
- Sub-agent threshold: >500 lines of code per question

### JSF Gap — Confirmed Permanent
No tool in 2026 covers: EL expressions, faces-config.xml nav, PrimeFaces bindings, implicit JSF 2.0 nav, composite components, Flowable BPMN→Java delegate mapping. Workarounds: Gemini (Layer 3) + custom EL extractor script.

### Tools Evaluated & Dismissed
- codebase-to-course: skip Phase 1, maybe Phase 2 for team onboarding
- Google Code Wiki: waitlist, no private repo support
- Serena MCP: pre-release, Java startup issues
- OpenDeepWiki: needs cloud LLM, heavy setup

### Emerging to Watch
- Magic.dev LTM-2-Mini: 100M token context (experimental)
- GraphRAG: RAG + knowledge graph hybrid (Thoughtworks Radar)
- Codified Context Infrastructure: three-tier memory architecture

## Memory Patterns
- Structured diff format: FILE / SECTION / ACTION / content
- Gemini prompt sequence: overview → entry points → flow trace → patterns
- FIC session structure: Research → Plan → Implement (40-60% context max)

---
*Coding Project — Etanah-Codebase-Read v1.0*
