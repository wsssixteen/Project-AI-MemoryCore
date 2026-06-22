# Research & Proposal — improvement directions (2026-06-22)

> **RESEARCH ONLY. Nothing here is built.** For みや's review. Produced overnight per his
> "brainstorm 10 ways, pick the best, /deep-research them, propose — separate section, no build."
> Built this session (separate, NOT in this proposal): `/scan` Power, the code-review feature
> (REVIEW.md + review-etanah), the "add a feature" awareness. Those are live; these are candidates.

---

## A. codebase-memory-mcp feasibility (みや asked: can it replace grep? add if net-positive, with the margin)

| Question | Verdict |
|---|---|
| Feasible to add? | Yes — it's an MCP server (SQLite call-graph index), installable like our postgres MCPs. |
| Can it replace grep? | **No — orthogonal tools.** grep = literal text/regex over file *bytes* (string literals, config values, comments, CC-tags, anything). A code-index = *symbol/structure* search (definitions, callers, types). "where does `'PLP_PRTANIAN'` appear" is grep; "who calls `getUrusanKod()`" is the index. Each misses what the other finds. |
| Net-positive margin over our CURRENT state? | **≈ 0%.** We already run **codegraph** — the same category (SQLite symbol/call index), already *indexed* on etanah-pelupusan + etanah-common, already exposed as `codegraph_search/context/trace/callers/callees/impact`, and already wired into the quest hooks (`codemap-recon-consult`). codebase-memory-mcp's whole value (token-efficient symbol/call navigation) is the value codegraph already delivers. |
| Recommendation | **Do NOT add.** Inventory-first: it duplicates codegraph (adds a 2nd index to keep in sync, 2nd MCP to maintain, overlapping token cost) for ~0 marginal capability, and it does not replace grep. If codegraph ever proves insufficient on a *specific* axis codebase-memory covers and codegraph doesn't, revisit with that specific gap named. |

**The real navigation gap (if any) is not "another index" — it's surfacing what codegraph already knows at the right moment** (see #4/#5 below — wiring, not procurement).

---

## B. 10 improvement directions (brainstorm) — research-only

Effort S=hours · M=a day · L=multi-day. Overlap = strict "don't duplicate what we own."

| # | Direction | Enabler | Effort | Leverage | New capability? |
|---|---|---|---|---|---|
| 1 | **DB-schema-aware entity validation** — catch JPA `@Table`/`@Column` that don't match the live DB before trusting an entity / writing SQL | SchemaCrawler (read-only, JSON/MD dump) + a one-shot Hibernate `hbm2ddl=validate` test | M | **High** | **Yes** — codegraph indexes Java, not the entity↔DB mapping |
| 2 | **JSF/EL static validation** — `#{bean.prop}` / listener refs that point at missing getters/methods | `static-jsfexpression-validator` (offline, no server) | M | **High** | **Yes** — nothing parses XHTML EL vs beans |
| 3 | **Convention-as-rules linting** — encode OUR non-negotiables (missing `listener`/`process`, unregistered populator, unqualified table) as machine rules | Semgrep custom YAML (Java + generic/XML) | M | **High** | **Partial** — PMD/SpotBugs find generic bugs, not OUR conventions |
| 4 | Blast-radius / diff-impact gate | `codegraph_impact` + SootUp (already own) — wiring | S | Med | No (wiring) |
| 5 | Regression-from-pulled-commits detector | `git log -p` + codegraph caller-overlap (own) | S | Med | No (wiring) |
| 6 | **Past-ticket semantic retrieval** — "solved this shape before?" over QA-*.md/post-mortems | reuse postgres MCP pgvector `generate_embedding`/`similarity_search` (already live) | M | Med-High | **Partial** — have the engine, not the index of our corpus |
| 7 | docx/CC-tag binding verification (template tag ↔ populator orphans + casing) | docx4j/python tag-dump + grep cross-ref | M | Med | **Yes** — doc_catalog catalogs, doesn't verify binding |
| 8 | Architecture/cross-module sync tests (AWAM↔PLP parity) | ArchUnit | M | Med | Yes (narrow) |
| 9 | Build/deploy verification (changed class actually in the deployed WAR — the 404 class) | Maven `verify` + WAR class-timestamp assert | S | Med | Yes (partly covered by BPMN module-scope rule) |
| 10 | Test-data / reproduction generator (urusan+tugasan → canonical permohonan SQL) | postgres MCP + templated SQL (own) | S | Med | No (automation of owned knowledge) |

## C. The chosen 4 (highest leverage × feasibility × least overlap)

Dropped #4/#5/#10 — they're *wiring of tools we own*, not new capability. The four that each close a real gap + map to a named recurring pain:

### 1. DB-schema-aware entity validation — **TOP PICK / pilot first**
Attacks our single most-cited slip: asserting/fabricating table-column facts. **SchemaCrawler** (single Java jar, Windows, no Docker, points at the same PostgreSQL we reach via MCP) turns "which table has column X" into one `--grep-columns` command and can emit JSON/MD the assistant reads directly (could even regenerate the hand-maintained `DATABASE.md`). A one-shot Hibernate `hbm2ddl=validate` test gives a hard pass/fail on entity↔schema correctness before commit. Slots into Recon's `db-probed` check. Metric: replaces N speculative MCP queries/ticket with 1 deterministic lookup; eliminates the "relation does not exist"/fabrication slip class. Sources: schemacrawler.com · vladmihalcea.com/validate-ddl-schema-spring-hibernate · github.com/hibernate/query-validator.

### 2. JSF/EL static validation
`static-jsfexpression-validator` (`-jsf20`) resolves every `#{bean.property}`/method-ref against the real bean classes, offline, from a JUnit test — exactly the QA-258004 (null-saving dropdown) family. **Honest caveat**: older project; Facelets *includes*/composite components not fully resolved; checks name-existence not signatures. So a first-pass net, paired with a Semgrep rule for the *structural* "missing listener" case. Sources: github.com/holyjak/static-jsfexpression-validator.

### 3. Convention-as-rules linting (Semgrep custom rules)
PMD/SpotBugs (now in `/scan`) find *generic* bugs; they can't encode "a `selectOneMenu` must have `listener`+`process`" or "a new CC-tag constant needs a matching populator." Semgrep custom YAML can — local Windows CLI, Java + generic/XML. Each rule = an executable version of a CLAUDE.md prose non-negotiable. **Note**: Semgrep on Windows is single-core (no Docker); acceptable for per-package runs. Sources: semgrep.dev/docs/writing-rules/rule-syntax · semgrep.dev/docs/languages/java.

### 4. Past-ticket semantic retrieval (over our own QA corpus)
We accumulate QA-*.md/post-mortems but retrieve by grep/filename. Index one row per ticket (root-cause + fix-shape + urusan/tugasan + files) with the **postgres pgvector we already run** (`generate_embedding`/`similarity_search`) — **avoid sqlite-vec** (documented Windows extension-load + EBUSY issues). At Scout step 0, similarity-search the new symptom → surface top-3 priors before tracing. Turns our knowledge-*capture* discipline into knowledge-*retrieval*. Sources: github.com/asg017/sqlite-vec (and its Windows caveats).

## D. Pilot recommendation
**SchemaCrawler + one `hbm2ddl=validate` test first** — highest-frequency, highest-embarrassment slip (DB fabrication), cheapest to stand up (one jar, no Docker, same PG as MCP), zero overlap with codegraph/SootUp/PMD, slots into the existing `db-probed` Recon check. Prove it, then layer #2 (JSF EL) and #3 (Semgrep conventions); #4 (retrieval) when capacity allows.

## E. Situational code-review extras (researched, NOT installed — optional adds to the built feature)
- **thermo-nuclear-code-quality-review** — real Cursor/Claude skill, harsh *maintainability* reviewer, `disable-model-invocation:true` (manual only). Copy its `SKILL.md` to `~/.claude/skills/` for a periodic "maintainability sweep." Not a Java-semantic reviewer.
- **awesome-skills/code-review-skill** — the only option shipping a Java 17/Spring Boot 3 rulebook; `git clone … "$env:USERPROFILE\.claude\skills\code-review-skill"`. A framework-depth complement to our built-in `/code-review`.
- "atomic-code-review" — **does not exist** as a named skill (honest negative; the term is a *property* inside thermo-nuclear).
