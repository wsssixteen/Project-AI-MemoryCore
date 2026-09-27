# Agent memory systems, state of the art (researched 2026-09-28)

Every serious framework in 2026 converges on the same four memory types CoALA named in 2023 (working, episodic, semantic, procedural), then adds framework-specific extras (profile, reflection, tool, environment). The frameworks differ mainly in WHEN they write memory (hot-path vs background/"sleep-time") and HOW they resolve conflicting facts (Mem0's ADD/UPDATE/DELETE/NOOP vs Zep/Graphiti's bi-temporal invalidation). Benchmarks (LongMemEval, LoCoMo, MemoryAgentBench) show all systems still lose accuracy as history grows, and every source names the same three failure modes: memory bloat, stale facts, and retrieval pollution. Anthropic's own memory tool is just files-plus-client-code, which is the most portable primitive covered here. For a markdown-on-git system, most patterns below reduce to JSONL ledgers, plain-text consolidation passes, and a SQLite FTS/embedding index built from the files — no vendor lock-in required.

## 1. IBM's taxonomy of AI agent memory

IBM's think page defines agent memory as what lets an agent "retain context, recognize patterns over time and adapt based on past interactions," since LLMs by themselves cannot remember anything between calls ([IBM, "What Is AI Agent Memory?"](https://www.ibm.com/think/topics/ai-agent-memory)).

IBM's taxonomy, explicitly built on CoALA, has one top-level split (short-term vs long-term) and three long-term subtypes:

| Type | IBM's one-line definition |
|---|---|
| Short-term memory (STM) | "Enables an AI agent to remember recent inputs for immediate decision-making." |
| Long-term memory (LTM) | "Allows AI agents to store and recall information across different sessions, making them more personalized and intelligent over time." |
| Episodic memory (an LTM subtype) | "Allows AI agents to recall specific past experiences, similar to how humans remember individual events." |
| Semantic memory (an LTM subtype) | "Responsible for storing structured factual knowledge that an AI agent can retrieve and use for reasoning." |
| Procedural memory (an LTM subtype) | "Refers to the ability to store and recall skills, rules and learned behaviors that enable an agent to perform tasks automatically." |

IBM frames the central design tension as a retrieval-efficiency trade-off: "storing excessive data can lead to slower response times," so systems must keep "only the most relevant information while maintaining low-latency processing" ([IBM, "What Is AI Agent Memory?"](https://www.ibm.com/think/topics/ai-agent-memory)). The article is authored/staffed by Cole Stryker; no explicit last-updated date is shown on the page.

## 2. The wider taxonomies: CoALA and its 2025-2026 extensions

**CoALA (2023).** "Cognitive Architectures for Language Agents" (Sumers, Yao, Narasimhan, Griffiths; submitted 5 Sep 2023, revised through v3 in March 2024) is the taxonomy IBM and nearly every framework below cite. It "describes a language agent with modular memory components, a structured action space to interact with internal memory and external environments, and a generalized decision-making process to choose actions" ([arXiv:2309.02427](https://arxiv.org/abs/2309.02427)). Its four memory modules, directly inspired by Tulving's human-memory trichotomy:

- **Working memory** — active, readily available information for the current decision cycle: perceptual input, retrieved knowledge, and reasoning output carried from the previous cycle.
- **Episodic memory** — records of past experience: complete interaction trajectories and event sequences an agent can learn from.
- **Semantic memory** — general world knowledge, typically implemented via external databases, knowledge graphs, or retrieval systems.
- **Procedural memory** — the agent's "know-how": both the LLM's own weights and explicit code for actions/decision procedures.

(Direct PDF text extraction failed for this session — binary-encoded stream — so these four definitions are reconstructed from the arXiv abstract page and corroborating secondary summaries, not quoted verbatim from the PDF body.)

**2025-2026 extensions beyond the four-part core.** Newer surveys keep CoALA's four types but add roles that CoALA treated as sub-cases:

- **Reflection memory** — a distinct write-time mechanism, traced to Shinn et al.'s Reflexion (2023): "Reflexion agents verbally reflect on task feedback signals, then maintain their own reflective text in an episodic memory buffer to induce better decision-making in subsequent trials" ([arXiv:2303.11366](https://arxiv.org/abs/2303.11366)). 2025-2026 surveys treat "reflection" as the write-policy that turns episodic traces into semantic/procedural lessons, rather than a fifth storage type.
- **Tool memory** and **environment memory** — named in the 2026 "Memory in the Age of AI Agents" survey line as categories organized "by what they aim to transfer: persistent facts about a user or environment, and procedures learned from prior execution" ([survey summary via search, 2026](https://github.com/Shichun-Liu/Agent-Memory-Paper-List)).
- **User/profile memory** — explicit in Mem0's own reporting and in LangMem's "profile" memory shape (a single schema-based document per user, updated in place rather than appended) — see §3.
- **Mem0's State of AI Agent Memory 2026 report** organizes the field around episodic, semantic, and procedural memory as the three practical buckets vendors implement ([Mem0, "State of AI Agent Memory 2026"](https://mem0.ai/blog/state-of-ai-agent-memory-2026)).
- A broader 2025-2026 academic framing (the "Second Half" survey) recasts the whole space as a three-axis taxonomy — **forms** (token-level / parametric / latent), **functions** (factual / experiential / working), and **dynamics** (formed / evolved / retrieved) — treating memory as a "write-manage-read loop tightly coupled with perception and action" ([arXiv:2602.06052](https://arxiv.org/pdf/2602.06052)).

## 3. How the leading frameworks implement memory today

### LangGraph + LangMem

LangGraph separates **short-term memory** ("scoped to a single thread," via a checkpointer) from **long-term memory** ("persists across threads and can be recalled at any time," built on a Store) ([LangChain docs, "Long-term memory"](https://docs.langchain.com/oss/python/langchain/long-term-memory)). The Store saves data "as JSON documents organized by namespace and key" — namespaces work like folders (often a user/org id), keys like filenames; `InMemoryStore` is dev-only, production needs a DB-backed store (Postgres/Redis/Mongo).

LangMem, the memory SDK built on this store, names three types: **semantic memory** — "essential facts and other information that ground an agent's responses," as either unbounded *collections* or schema-based *profiles* updated in place; **episodic memory** — "preserves successful interactions as learning examples," capturing situation + reasoning + outcome, not just facts; **procedural memory** — "encodes how an agent should behave and respond," starting from the system prompt and evolving through feedback. Procedural memory is explicitly where **prompt optimization** lives: LangMem "uses conversation trajectories and feedback to update system prompts, incorporating learned patterns into behavioral instructions" ([LangChain-AI, LangMem conceptual guide](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/)).

Two write timings: **hot path ("conscious")** — the agent calls memory tools mid-conversation, adding latency but making memory immediately available; **background ("subconscious")** — a separate manager processes the conversation after it ends, extracting/consolidating without slowing the interaction, at the cost of delayed availability ([LangChain-AI, LangMem conceptual guide](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/); [LangChain, "LangMem SDK launch"](https://www.langchain.com/blog/langmem-sdk-launch)).

### Letta (formerly MemGPT)

Letta's **core memory** is a set of in-context memory blocks — the original MemGPT paper's two blocks were "Human" (facts about the user) and "Persona" (the agent's self-concept) — editable via API calls and pinned permanently inside the context window ([Letta, "Memory Blocks"](https://www.letta.com/blog/memory-blocks/)). Beyond core memory, agents page data out to **archival memory** and **recall memory**, "analogous to disk storage," giving "the illusion of unlimited memory while working within fixed context limits"; recall memory preserves the full interaction history for later search ([Letta, "Agent Memory"](https://www.letta.com/blog/agent-memory/)).

**Sleep-time agents** (Lin, Snell, Packer, Wooders, Stoica, Gonzalez et al., 21 Apr 2025) split the original single-agent MemGPT design in two: a primary agent that only handles conversation/tools, and a separate sleep-time agent that manages memory asynchronously during idle periods, "reorganiz[ing] information and reason[ing] through the information they have available in advance." Running off the critical path lets it use a slower, more powerful model without adding latency, producing "clean, concise, and detailed memories" instead of ad hoc accumulation ([Letta, "Sleep-time Compute"](https://www.letta.com/blog/sleep-time-compute/)).

### Mem0

Mem0's pipeline (Chhikara, Khant, Aryan, Singh, Yadav; 28 Apr 2025) runs two phases per message pair. **Extraction**: an LLM reads the running conversation summary plus recent messages and pulls out candidate facts. **Update**: each candidate fact is compared via vector similarity against existing memories, and an LLM chooses one of four operations — **ADD** (new fact, no semantic match), **UPDATE** (augments an existing memory), **DELETE** (removes a memory the new fact contradicts), **NOOP** (no change needed) ([arXiv:2504.19413](https://arxiv.org/html/2504.19413v1)).

On LOCOMO, Mem0 reports 67.13% on an LLM-as-judge metric ("26% relative improvement over OpenAI['s baseline]"); graph variant **Mem0g** reaches 68.44% overall and beats base Mem0 on temporal-reasoning questions (58.13 vs 55.51 F1). Mem0 also reports 91% lower p95 latency than full-context processing (1.44s vs 17.1s) and ~90% lower token cost (~7k tokens/conversation vs ~26k) ([arXiv:2504.19413](https://arxiv.org/html/2504.19413v1)).

**Mem0g** represents memories as a directed labeled graph — entity nodes, relationship-triplet edges — retrieved via entity-centric traversal plus triplet-embedding search; the reference implementation uses Neo4j with GPT-4o-mini for extraction ([Mem0 docs, "Graph Memory"](https://docs.mem0.ai/platform/features/graph-memory); [arXiv:2504.19413](https://arxiv.org/html/2504.19413v1)).

### Zep / Graphiti

Zep (Rasmussen, Paliychuk, Beauvais, Ryan, Chalef; 20 Jan 2025) is built on **Graphiti**, a temporal knowledge graph engine. Every fact (edge) carries four timestamps across two timelines: `t_valid`/`t_invalid` on the **event timeline** (when the fact was true in the real world) and `t'_created`/`t'_expired` on the **transaction timeline** (when Zep ingested or retired the data) — the bi-temporal model. When a new fact contradicts an old one, Graphiti does not delete the old edge — it writes a `t_invalid` timestamp onto it, so "the graph can answer what was believed and when, and never serves a stale fact as current." On the Deep Memory Retrieval (DMR) benchmark, Zep reports 94.8% accuracy with GPT-4-turbo versus MemGPT's reported 93.4%, and 98.2% with GPT-4o-mini ([arXiv:2501.13956](https://arxiv.org/html/2501.13956v1)).

### A-MEM

A-MEM (Xu, Liang, Mei, Gao, Tan, Zhang) is explicitly modeled on the **Zettelkasten** note-taking method: "dynamic and self-evolving memory system with emphasis on atomic note-taking, flexible linking mechanisms, and continuous evolution of knowledge structures." Each memory is an atomic note with a contextual description, keywords, tags, and explicit links to related notes — richer than plain embedding similarity — and writing a new note can trigger the system to revise/re-link older notes rather than leaving them static ([arXiv:2502.12110](https://arxiv.org/abs/2502.12110)).

### MemOS

MemOS proposes treating memory as an operating-system resource: "comprehensive governance mechanisms including scheduling, layering, API abstraction, permission control, and exception handling." Its unit is the **MemCube**, which "encapsulates both memory content and metadata such as provenance and versioning" across three layers — L0 raw data, L1 structured/retrievable natural language, L2 parameter-tuned (weights-level) memory ([arXiv:2507.03724](https://arxiv.org/pdf/2507.03724)). This is the most "systems" framing reviewed here — closer to an OS memory hierarchy than a chatbot feature.

### Anthropic's memory tool, context editing, and Claude Code

Anthropic's **memory tool** (`memory_20250818`, public beta) lets Claude "store and retrieve information across conversations in a directory of memory files," creating/reading/updating/deleting files under `/memories` that "persist between sessions." It is **client-side**: "Claude requests file operations, and your application executes them" against storage you control — Anthropic never sees or hosts the files ([Claude Platform Docs, "Memory tool"](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)). It supports six commands (`view`, `create`, `str_replace`, `insert`, `delete`, `rename`) and ships a default system-prompt injection telling Claude to always view the memory directory first and assume its context could reset at any time.

**Context editing** (same beta) clears old `tool_result` blocks into a placeholder once stale, keeping the `tool_use` block so Claude retains a record the call happened. Anthropic's 100-turn web-search benchmark (29 Sep 2025) reports context editing alone gives a 29% performance improvement; context editing + memory tool together give 84% token savings and a 39% performance improvement ([Claude, "Managing context on the Claude Developer Platform"](https://claude.com/blog/context-management)).

**Claude Code's own memory** mirrors this repository's setup: **CLAUDE.md files** ("instructions you write to give Claude persistent context," in four nested scopes: managed, project, user, local) and **auto memory** ("notes Claude writes itself based on your corrections and preferences"). Both load at the start of every conversation and are treated as context Claude reasons over, not hard configuration — "to block an action regardless of what Claude decides, use a PreToolUse hook instead" ([Claude Code Docs, "How Claude remembers your project"](https://code.claude.com/docs/en/memory)).

### OpenAI and Google ADK

**OpenAI**: ChatGPT's consumer Memory feature lets the product "remember relevant preferences and details from your chats and other available sources" (Settings > Personalization > Memory) ([OpenAI Help Center, "Memory FAQ"](https://help.openai.com/en/articles/8590148-memory-faq)). This is a ChatGPT-product feature, not a distinct primitive in the Assistants/Responses API — API developers still build their own memory layer ([OpenAI Developer Community, 2025-2026](https://community.openai.com/t/memory-in-assistants-and-chat-completion-apis/1041911)).

**Google ADK**: `MemoryService` is explicitly distinct from `Session` state — sessions hold raw chronological `Event` objects for one conversation; `MemoryService` extracts and persists "important information that should be recalled across different conversations and time periods" as consolidated, semantically-searchable `MemoryEntry` objects ([DeepWiki, google/adk-python "Memory Services"](https://deepwiki.com/google/adk-python/8.5-memory-services)). ADK ships four backends (in-memory keyword prototype, Firestore keyword index, Vertex AI RAG corpus, and production **Vertex AI Memory Bank** with automatic summarization) plus two tools — `load_memory` (agent-pulled) and `preload_memory` (proactively injected).

### Framework comparison at a glance

| Framework | Short-term unit | Long-term store | Write timing | Conflict handling |
|---|---|---|---|---|
| LangGraph/LangMem | Thread + checkpointer | Namespaced Store (JSON docs) | Hot-path tool calls or background manager | Left to the extraction LLM / profile overwrite |
| Letta/MemGPT | In-context core memory blocks | Archival + recall memory (disk-like) | Sleep-time agent (async) or self-edit | Sleep-time agent rewrites/cleans blocks |
| Mem0 | Conversation buffer | Vector store (+ optional graph) | Per-message-pair, synchronous pipeline | Explicit ADD/UPDATE/DELETE/NOOP decision |
| Zep/Graphiti | Session | Bi-temporal knowledge graph | Synchronous ingestion per message | Invalidate (soft-expire), never hard delete |
| A-MEM | N/A (note-based) | Linked Zettelkasten note graph | On each new note, may re-link old notes | Notes evolve/link; no explicit delete |
| MemOS | MemCube (L0) | Layered L0/L1/L2 store | Governed scheduling across layers | Versioning + provenance on the MemCube |
| Anthropic memory tool | Context window | Flat files under `/memories` (your infra) | Explicit tool calls (Claude decides) | None built in — your handler/Claude manages it |
| Claude Code | Conversation context | CLAUDE.md (declared) + auto-memory (learned) | Boot-time load; write on correction | Manual editing / consolidation passes |
| Google ADK | Session events | MemoryService (4 backends) | Explicit `add_session_to_memory` calls | Backend-specific (Memory Bank auto-consolidates) |

## 4. Design patterns that matter most

**Write policy — hot path vs background.** LangMem's naming is clearest: "conscious" hot-path writes are immediate but add latency; "subconscious" background writes cost nothing live but lag behind ([LangChain-AI, LangMem conceptual guide](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/)). Letta generalizes this into a whole second agent with its own model ([Letta, "Sleep-time Compute"](https://www.letta.com/blog/sleep-time-compute/)).

**Consolidation / reflection.** Reflexion is the origin case: raw trial outcomes become short verbal reflections in an episodic buffer, re-read on the next trial ([arXiv:2303.11366](https://arxiv.org/abs/2303.11366)). Letta's sleep-time agent and LangMem's background manager generalize this into compressing raw episodic trajectories into compact procedural cards, with 5x-1000x token reductions reported in practitioner write-ups ([Mem0, "Memory eviction and forgetting in AI agents"](https://mem0.ai/blog/memory-eviction-and-forgetting-in-ai-agents)).

**Forgetting / decay / retention.** Mem0 recommends TTL on long-tail entries, LRU-style decay on retrieval scores, and "active supersession on every write so contradictions never accumulate" ([Mem0, "Memory eviction and forgetting in AI agents"](https://mem0.ai/blog/memory-eviction-and-forgetting-in-ai-agents)). Anthropic says the same at the file level: "periodically delete memory files that haven't been accessed in a long time" ([Claude Platform Docs, "Memory tool"](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)).

**Retrieval.** Mem0 combines vector similarity with an LLM decision step; Mem0g adds entity-centric graph traversal alongside triplet search ([arXiv:2504.19413](https://arxiv.org/html/2504.19413v1)). A-MEM adds note-to-note links so retrieval isn't pure embedding-distance ([arXiv:2502.12110](https://arxiv.org/abs/2502.12110)). Google ADK exposes retrieval as agent-pulled (`load_memory`) or proactively injected (`preload_memory`) ([DeepWiki, "Memory Services"](https://deepwiki.com/google/adk-python/8.5-memory-services)). A commonly cited recency fix multiplies similarity score by exponential decay over time ([tianpan.co, "The Forgetting Problem"](https://tianpan.co/blog/2026-04-12-the-forgetting-problem-when-agent-memory-becomes-a-liability)).

**Conflict resolution / temporal validity.** Two opposite philosophies: Mem0's LLM-adjudicated DELETE (old fact removed from the active set) versus Zep/Graphiti's soft-invalidate (old edge stamped `t_invalid` but kept, so history stays queryable) ([arXiv:2504.19413](https://arxiv.org/html/2504.19413v1); [arXiv:2501.13956](https://arxiv.org/html/2501.13956v1)). MemoryAgentBench grades "conflict resolution" directly because a fact with multiple contradictory stored values is a common real failure ([arXiv:2507.05257](https://arxiv.org/abs/2507.05257)).

**Provenance.** MemOS's MemCube makes this explicit: it "encapsulates both memory content and metadata such as provenance and versioning" as a first-class field ([arXiv:2507.03724](https://arxiv.org/pdf/2507.03724)). Zep's dual timestamps are provenance by another name — recording not just what is true but when the system learned it ([arXiv:2501.13956](https://arxiv.org/html/2501.13956v1)).

**Memory scoping for multi-agent/multi-task systems.** The 2026 convergence pattern: tag each write with identity scopes and compose the relevant scopes at query time, rather than one shared bucket or fully isolated silos. Mem0 implements this with four dimensions per memory — `user_id`, `agent_id`, `run_id`, `app_id` — where "isolation is the default; sharing requires domain coordination" ([MintMCP, "The 4 Scopes of Agent Memory"](https://www.mintmcp.com/blog/scopes-agent-memory)).

**Evaluation.** Three benchmarks dominate. **LongMemEval** (Wu et al., ICLR 2025) tests five abilities — extraction, multi-session reasoning, temporal reasoning, knowledge updates, abstention — over 500 questions in histories scaling past 1M tokens; commercial assistants show "a 30% accuracy drop" on it ([arXiv:2410.10813](https://arxiv.org/abs/2410.10813)). **LoCoMo** (Maharana et al., 2024) grades QA, summarization, and dialogue generation over persona-grounded dialogues (~300 turns, up to 35 sessions) ([arXiv:2402.17753](https://arxiv.org/abs/2402.17753)). **MemoryAgentBench** (2025) grades four competencies directly — accurate retrieval, test-time learning, long-range understanding, conflict resolution — since prior benchmarks left memory itself under-tested ([arXiv:2507.05257](https://arxiv.org/abs/2507.05257)).

## 5. Failure modes reported in practice, and mitigations

| Failure mode | What sources report | Proposed mitigation | Source |
|---|---|---|---|
| Memory bloat | "Append-only ingestion accumulates redundant and low-relevance entries," crowding out useful context at retrieval time | TTL on long-tail entries; LRU-style decay on retrieval score; active supersession on write | [Mem0, "Memory eviction and forgetting in AI agents"](https://mem0.ai/blog/memory-eviction-and-forgetting-in-ai-agents) |
| Stale facts | "Unbounded agent memory stores silently degrade performance as stale facts, cross-context contamination, and error propagation accumulate" | Bi-temporal invalidation (Zep) or explicit DELETE on contradiction (Mem0) instead of pure append | [arXiv:2501.13956](https://arxiv.org/html/2501.13956v1); [arXiv:2504.19413](https://arxiv.org/html/2504.19413v1) |
| Context overload | "As prompts grow, models don't just slow down but also degrade... relevant details compete with stale assumptions, partial summaries, and outdated decisions" | Context editing (clear old tool results), compaction (server-side summarization), memory tool (move detail out of the live context) | [Claude Platform Docs, "Memory tool"](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool); [practitioner synthesis, 2026](https://tianpan.co/blog/2026-04-12-the-forgetting-problem-when-agent-memory-becomes-a-liability) |
| Retrieval misses / pollution | "Retrieval miss occurs when required evidence is absent from retrieved context"; unconstrained skill/fact growth causes "retrieval pollution and confusability" | Reflective summarization into compact "procedural cards" (5x-1000x token reduction reported); recency-weighted reranking | [practitioner synthesis on failure modes, 2026](https://mem0.ai/blog/memory-retrieval-strategies-for-ai-agents) |
| Duplicated facts | Implicit in the ADD/UPDATE/DELETE/NOOP design — Mem0's NOOP exists specifically to stop a near-duplicate fact from being re-added | Semantic-similarity check before every write; merge into UPDATE instead of a new ADD | [arXiv:2504.19413](https://arxiv.org/html/2504.19413v1) |

## 6. Sidegent

**What it is.** Sidegent (sidegent.com) is a hands-on, browser-based learning platform for building AI agents — explicitly "a learning platform for AI agents, not an agent builder." Its core teaching mechanism is the "Sidegent Coder," which writes and runs real code alongside the learner in-browser (no local install, no API keys) ([Sidegent homepage, fetched 2026-09-28](https://sidegent.com/); [Product Hunt listing](https://www.producthunt.com/products/sidegent)).

**What it teaches.** An "AI Agent Fundamentals" course (LLMs, prompts, tools, RAG, workflows) plus auto-graded, cloud-machine hands-on labs, explicitly covering **Google ADK, LangGraph, and the OpenAI Agents SDK**, with "agent memory" functionality present inside its labs ([Sidegent homepage, fetched 2026-09-28](https://sidegent.com/)). So it does cover LangGraph and touches agent memory as a lab topic, but there is no evidence it goes as deep on memory architecture (temporal graphs, consolidation policy) as the frameworks' own docs or the DeepLearning.AI course below.

**Price.** Free tier, no card required (first module + three cloud labs). Paid "Pro" tier is RM49/month, with "founding member" pricing locked for the first 20-50 subscribers depending on the promotional post ([sidegent.com, fetched 2026-09-28](https://sidegent.com/); [Farhan Helmy, X post reporting ~100 registered users and 32 paying subscribers](https://x.com/farhanhelmycode/status/2062714973470802034)).

**Credibility.** Sidegent is operated by a Malaysian registered company, FARHANHELMY CODE TECHNOLOGY (MA0328105-X), run by Farhan Helmy. It is bilingual (English/Bahasa Melayu) and targets the Malaysian market, including a B2B "AI Agent Training in Malaysia" offering ([Sidegent, "AI Agent Training in Malaysia"](https://sidegent.com/ai-agent-training)). Public evidence (Product Hunt launch, the founder's own X posts citing ~100 registered / ~32-70 paying users) indicates a small, recently launched, single-founder operation rather than an established institution — no launch date is published, and no independent reviews or third-party credibility signals turned up in this search.

**Comparison with free first-party paths.**

| Path | Cost | Depth on memory specifically | Who teaches it |
|---|---|---|---|
| Sidegent | Free tier + RM49/mo Pro | Lab-level coverage inside a broader agent-fundamentals course | Solo Malaysian founder (Farhan Helmy) |
| LangChain Academy ("Introduction to LangGraph") | Free | Foundations course, not memory-specific | LangChain, Inc. |
| DeepLearning.AI "Long-Term Agentic Memory with LangGraph" | Free (during platform beta) | Dedicated course: builds an email agent using semantic, episodic, and procedural memory via hot-path and background mechanisms | Harrison Chase (LangChain co-founder/CEO), in partnership with DeepLearning.AI |
| DeepLearning.AI "LLMs as Operating Systems: Agent Memory" | Free (platform beta) | Dedicated course on Letta/MemGPT-style persistent memory | Letta, in partnership with DeepLearning.AI |
| Anthropic's own docs (memory tool, context editing) | Free | Primary-source reference, not a structured course | Anthropic |

Sources: [DeepLearning.AI, "Long-Term Agentic Memory With LangGraph"](https://www.deeplearning.ai/courses/long-term-agentic-memory-with-langgraph); [Andrew Ng, X announcement of the course](https://x.com/AndrewYNg/status/1902395485601853941); [LangChain Academy, "Introduction to LangGraph"](https://academy.langchain.com/courses/intro-to-langgraph).

**Bottom line:** for this developer's stated goal (portable, harness-agnostic memory-system understanding), the DeepLearning.AI LangGraph-memory course and Letta's own MemGPT course are free, primary-source-adjacent, and go deeper specifically on memory architecture than Sidegent's general-purpose agent-fundamentals curriculum. Sidegent looks like a legitimate but very new, small, regionally-focused (Malaysia) commercial bootcamp-style product, not a memory-systems specialist.

## 7. Implications for a markdown-on-git agent

This section states, pattern by pattern, whether a plain-files-plus-scripts implementation is possible (portable, no vendor lock-in) or requires a database/vector store/vendor service, and sketches the lightest portable version. It does not design the full system.

| Pattern (from §4) | Needs a DB/vector store/vendor? | Lightest portable version |
|---|---|---|
| Working memory (CoALA) | No | The live conversation/context window itself — nothing to build. |
| Semantic memory (facts) | No | A `facts/` folder of small markdown files, each fact a dated bullet with a source line — this repo's `MEMORY.md` index + `feedback_*.md`/`user_*.md` files already do this. |
| Episodic memory (trajectories) | No | An append-only JSONL ledger, one line per session/event (`{date, summary, outcome, files_touched}`); `daily-diary/` already plays this role, and JSONL is grep-able and diff-able in git. |
| Procedural memory / prompt optimization | No | Versioned skill/rule files edited by hand or by a scripted pass (`.claude/skills/*.md`); "prompt optimization" becomes a diff-and-review of a rule file, not a weight update. |
| Hot-path vs background writing | No | Hot-path = the agent edits a memory file mid-session (as CLAUDE.md/auto-memory do). Background = a scheduled script (cron/Task Scheduler) that runs after a session closes and proposes consolidation edits from the day's diary/log. |
| Consolidation / reflection | No | A script that reads N days of diary/log entries and drafts a short "lessons" file for review before merging into a canonical memory file — the existing Domain Expansion / Forge review pattern. |
| Forgetting / decay / retention (TTL, LRU) | No, at this scale | A script that flags (never auto-deletes) memory files unread in N days by `mtime`; git history is the audit trail, so "delete" can mean "archive," per this repo's Archive-hygiene rule. |
| Retrieval (hybrid keyword+vector, recency scoring) | Partially — keyword works with plain files; recall improves with an index | Grep/keyword search over markdown works today. A step up: a local SQLite FTS5 index built from the markdown for ranked full-text search — still one local file. True semantic search needs an embedding store (e.g. `sqlite-vec`), the one place a "database" earns its keep, though it can still be a single local file, not a hosted service. |
| Conflict resolution / temporal validity | No | Never overwrite a fact in place — append a new dated entry and mark the old one `SUPERSEDED <date> by <ref>` rather than deleting it: Zep's invalidate-don't-delete pattern as a text convention, with git history as the immutable ledger. |
| Provenance | No | Every entry carries an inline `(source: <file/commit/session>, date)`; git blame is free provenance for anything already tracked. |
| Memory scoping (multi-agent/multi-task) | No | Directory-as-namespace: `Feature/`, `quest/`, `projects/coding-projects/active/<ticket>/` already scope memory by task the same way Mem0 scopes by `user_id`/`agent_id`/`run_id` — the "namespace" is just the folder path. |
| Evaluation (LongMemEval-style self-check) | No | A small hand-written set of "questions the memory system should answer" re-run periodically as a scripted check against the current files — a poor-man's LongMemEval, entirely file-based. |
| Anthropic memory tool | No — already file-based | Maps almost 1:1 onto "markdown files + a script": Anthropic's reference implementation is a local filesystem handler. Its conventions (`/memories`-style directory, view/create/str_replace/delete/rename) cost nothing in portability — only the tool-calling loop around it is harness-specific. |
| Bi-temporal knowledge graph (Zep/Graphiti) | Yes, in full form | A flat CSV/JSONL table of `(subject, predicate, object, valid_from, valid_until, created_at)` rows, queried with grep/awk or a small script — captures invalidate-don't-delete without a graph database. |
| Graph memory (Mem0g) / A-MEM linking | Yes, for real traversal at scale | Markdown files with explicit `[[wiki-link]]`-style cross-references (this repo already does this via file-path pointers); a script can build an adjacency list from these links on demand. |
| Sleep-time / background agent | No | A scheduled script/agent invocation that runs a consolidation pass while the main session is idle — conceptually Letta's sleep-time agent, just as a scheduled script instead of a hosted service. |

**Overall reading:** almost everything in §4 has a plain-files-plus-scripts equivalent that is fully portable across harnesses (Claude Code, another CLI, a different vendor's agent). The two exceptions where a real database starts to matter are (a) semantic/vector retrieval at scale, and (b) true multi-hop bi-temporal graph queries — and even those can start as a single local SQLite file rather than a hosted vendor service, preserving portability.

## Sources

- [IBM, "What Is AI Agent Memory?"](https://www.ibm.com/think/topics/ai-agent-memory) — IBM Think, accessed 2026-09-28, author Cole Stryker, no explicit publish date shown.
- [Sumers, Yao, Narasimhan, Griffiths, "Cognitive Architectures for Language Agents"](https://arxiv.org/abs/2309.02427) — arXiv:2309.02427, submitted 5 Sep 2023, revised through v3 March 2024.
- [Shichun-Liu, "Agent-Memory-Paper-List" (Memory in the Age of AI Agents survey)](https://github.com/Shichun-Liu/Agent-Memory-Paper-List) — GitHub, accessed 2026-09-28.
- ["A Survey of Agent Memory in the Second Half: Towards Self-Evolving and Long-Horizon Agents"](https://arxiv.org/pdf/2602.06052) — arXiv:2602.06052, 2026.
- [Mem0, "State of AI Agent Memory 2026"](https://mem0.ai/blog/state-of-ai-agent-memory-2026) — Mem0 blog, 2026.
- [LangChain, "LangMem SDK launch"](https://www.langchain.com/blog/langmem-sdk-launch) — LangChain blog.
- [LangChain-AI, LangMem conceptual guide, "Long-term Memory in LLM Applications"](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/) — accessed 2026-09-28.
- [LangChain Docs, "Long-term memory"](https://docs.langchain.com/oss/python/langchain/long-term-memory) — docs.langchain.com, accessed 2026-09-28.
- [Letta, "Agent Memory: How to Build Agents That Learn and Remember"](https://www.letta.com/blog/agent-memory/) — Letta blog.
- [Letta, "Memory Blocks: The Key to Agentic Context Management"](https://www.letta.com/blog/memory-blocks/) — Letta blog.
- [Letta, "Sleep-time Compute"](https://www.letta.com/blog/sleep-time-compute/) — Letta blog, 21 Apr 2025, Lin/Snell/Wang/Packer/Wooders/Stoica/Gonzalez.
- [Chhikara, Khant, Aryan, Singh, Yadav, "Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory"](https://arxiv.org/html/2504.19413v1) — arXiv:2504.19413, 28 Apr 2025.
- [Mem0 Docs, "Graph Memory"](https://docs.mem0.ai/platform/features/graph-memory) — accessed 2026-09-28.
- [Rasmussen, Paliychuk, Beauvais, Ryan, Chalef, "Zep: A Temporal Knowledge Graph Architecture for Agent Memory"](https://arxiv.org/html/2501.13956v1) — arXiv:2501.13956, 20 Jan 2025.
- [Xu, Liang, Mei, Gao, Tan, Zhang, "A-MEM: Agentic Memory for LLM Agents"](https://arxiv.org/abs/2502.12110) — arXiv:2502.12110.
- ["MemOS: A Memory OS for AI System"](https://arxiv.org/pdf/2507.03724) — arXiv:2507.03724, 2025.
- [Claude Platform Docs, "Memory tool"](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool) — platform.claude.com, accessed 2026-09-28.
- [Claude / Anthropic, "Managing context on the Claude Developer Platform"](https://claude.com/blog/context-management) — announced 29 Sep 2025.
- [Claude Code Docs, "How Claude remembers your project"](https://code.claude.com/docs/en/memory) — code.claude.com, accessed 2026-09-28.
- [OpenAI Help Center, "Memory FAQ"](https://help.openai.com/en/articles/8590148-memory-faq) — accessed 2026-09-28.
- [OpenAI Developer Community, "Memory in Assistants and Chat Completion APIs"](https://community.openai.com/t/memory-in-assistants-and-chat-completion-apis/1041911) — accessed 2026-09-28.
- [DeepWiki, "Memory Services" (google/adk-python)](https://deepwiki.com/google/adk-python/8.5-memory-services) — accessed 2026-09-28.
- [Shinn, Cassano, Gopinath, Narasimhan, Yao, "Reflexion: Language Agents with Verbal Reinforcement Learning"](https://arxiv.org/abs/2303.11366) — arXiv:2303.11366, NeurIPS 2023.
- [Wu, Wang, Yu, Zhang, Chang, Yu, "LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory"](https://arxiv.org/abs/2410.10813) — arXiv:2410.10813, ICLR 2025.
- [Maharana et al., "Evaluating Very Long-Term Conversational Memory of LLM Agents"](https://arxiv.org/abs/2402.17753) — arXiv:2402.17753, 27 Feb 2024 (LoCoMo).
- ["Evaluating Memory in LLM Agents via Incremental Multi-Turn Interactions"](https://arxiv.org/abs/2507.05257) — arXiv:2507.05257, Jul 2025 (MemoryAgentBench).
- [Mem0, "Memory eviction and forgetting in AI agents"](https://mem0.ai/blog/memory-eviction-and-forgetting-in-ai-agents) — Mem0 blog.
- [Mem0, "Memory Retrieval Strategies for AI Agents"](https://mem0.ai/blog/memory-retrieval-strategies-for-ai-agents) — Mem0 blog.
- ["The Forgetting Problem: When Unbounded Agent Memory Degrades Performance"](https://tianpan.co/blog/2026-04-12-the-forgetting-problem-when-agent-memory-becomes-a-liability) — tianpan.co, 12 Apr 2026.
- [MintMCP, "The 4 Scopes of Agent Memory: Private, Team, Org, and Customer"](https://www.mintmcp.com/blog/scopes-agent-memory) — 2026.
- [Sidegent homepage](https://sidegent.com/) — fetched 2026-09-28.
- [Sidegent, "AI Agent Training in Malaysia for Teams & SMEs"](https://sidegent.com/ai-agent-training) — fetched 2026-09-28.
- [Product Hunt, "Sidegent: Learn to build AI agents by actually building them"](https://www.producthunt.com/products/sidegent) — accessed 2026-09-28.
- [Farhan Helmy, X/Twitter post on Sidegent user/subscriber counts](https://x.com/farhanhelmycode/status/2062714973470802034) — accessed 2026-09-28.
- [DeepLearning.AI, "Long-Term Agentic Memory With LangGraph"](https://www.deeplearning.ai/courses/long-term-agentic-memory-with-langgraph) — accessed 2026-09-28.
- [Andrew Ng, X/Twitter announcement of the DeepLearning.AI/LangChain memory course](https://x.com/AndrewYNg/status/1902395485601853941) — accessed 2026-09-28.
- [LangChain Academy, "Introduction to LangGraph"](https://academy.langchain.com/courses/intro-to-langgraph) — accessed 2026-09-28.

### Sources searched but not directly cited above (could not fetch or unreadable)
- `arxiv.org/pdf/2309.02427` — direct PDF fetch returned binary/corrupted stream, not human-readable text; CoALA memory definitions in §2 are reconstructed from the abstract page and secondary summaries, not a verbatim PDF quote.
