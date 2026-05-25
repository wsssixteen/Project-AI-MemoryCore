# eTanah Melaka — CLAUDE.md draft

> **Deployment**: this draft stays in MemoryCore (per Layer 1 — improvements live ours-side). Do NOT deploy to `E:\Projects\Melaka\CLAUDE.md` — that would clutter the work folder and bypass the layer separation. When eTanah-specific routing is needed, reference this file from MemoryCore CLAUDE.md (or fold into `projects/coding-projects/active/Etanah-Codebase-Read.md` per todo.md Q1).
>
> **Architectural note**: codegraph tool-routing rules already live in `~\.claude\CLAUDE.md` (auto-written by `codegraph install`). This file holds ONLY what Claude can't derive from the codebase or from the codegraph index.
>
> **Target size**: ≤120 lines. Every line MUST answer YES to *"would removing this cause Claude to make mistakes?"* — prune ruthlessly during use.

---

## Project shape

Malaysian government land registry. 3 sibling repos at `E:\Projects\Melaka\`:

| Repo | Role | Edit access |
|---|---|---|
| `etanah-pelupusan` | Pelupusan (disposal) WAR — JSF screens, managed beans, BPMN, populators | ✅ **PRIMARY edit target** — most tickets land here |
| `etanah-awam` | Public portal — JSF screens, AwamRuleEngine, public-facing flows | ✅ **Secondary edit target** — AWAM tickets land here |
| `etanah-common` | Shared library — entity classes, Hibernate, common services, JSF composites | ❌ **NO edit access** — owned by another team; treat as black-box dependency. Source is readable for cross-reference but DO NOT modify. |

Stack: Java 17 · JSF/PrimeFaces · Spring · Hibernate · Flowable BPM · JBoss EAP 7.4 · Maven · PostgreSQL.

## When to summon which subagent (agent-first pattern)

**Iron Law**: For structural code exploration, summon the right subagent — don't grep manually.

| User intent | Summon |
|---|---|
| Investigate / trace / explore any Java code (controller, service, bean, package, feature) | `etanah-code-explorer` |
| Hibernate `@Entity` / `@Column` / `@Table` / `@JoinColumn` analysis · ORM mismatch hunt · before refactoring entity | `hibernate-to-db-tracer` |
| Database schema introspection (table shape, FKs, indexes, CHECK constraints) | `hibernate-to-db-tracer` (routes via etanah-db MCP) |
| Literal text search (log strings, comments, SQL fragments) | Native `Grep` — MCP tools are AST-only |

Both subagents live in MemoryCore at `projects/coding-projects/active/etanah-ai-tooling/drafts/`. Deployment target TBD per Layer 1 placement decision.

## Build + deploy

```powershell
# Build (uses workspace-specific Maven settings)
mvn -s .m2_etanah/settings.xml clean install -DskipTests

# Hot-deploy to JBoss EAP 7.4 (per-repo)
mvn -s .m2_etanah/settings.xml wildfly:deploy
```

Custom `.m2_etanah/settings.xml` is REQUIRED — points to internal Nexus at `172.16.93.167`. Default `~/.m2/settings.xml` will NOT resolve eTanah dependencies.

## Database — safety boundary

Banned: any `INSERT` / `UPDATE` / `DELETE` / `DROP` / `ALTER` against eTanah Postgres MCPs. Mutations must fail at Postgres permission layer (or at pgEdge MCP server's read-only enforcement layer if migrated).

Multi-database environments — confirm target BEFORE running diagnostics:

| Env | Postgres DB | Use case |
|---|---|---|
| UAT | `mlkuat` / `et_main_uat` | Local testing default |
| FAT | `mlkfat` / `etprdmlk` / `et_main` | Simulation only |
| AWAM-UAT | `mkit` / `et_main_mlit` | AWAM-portal tickets test here regardless of where BA reported |

## Domain vocabulary (Malay)

- **urusan** = process variant (e.g. PRZ / PT / PSBS / PRBB) — discriminator code
- **tugasan** = task definition within a process (workflow step)
- **langkah** = sub-step within a tugasan (screen-level)
- **permohonan** = application instance (regex `PT[A-Z]{3}/\d{2}/[A-Z]/[A-Z]+/\d{4}/\d+`)
- **pengguna semasa** = current user assigned to the active tugasan
- **MMKN** / **JKKT** / **JKKL** / **JKBB** = approval committee codes

Flowable routing artifacts: BPMN XML in `etanah-common/src/main/resources/processes/` (read-only). Tugasan-to-form mapping via `ind_skrin` / `ind_langkah` columns + `umm_a_tgsn` runtime table.

## Renderer-side overrides — debug-time trap

When a UI bug appears (wrong column placement, missing element, mis-aligned image), **check populator/renderer for forced overrides BEFORE blaming cache / config / DB**:

```java
// Trap pattern — populator silently forces alignment regardless of upstream config
if (vo.getImageAlignment() == null) {
    vo.setImageAlignment(JcEnumeration.CENTER);
}
```

These `if (X == null) { X = <forced value>; }` patterns silently override anything upstream. Grep the populator class for the symptom column/field FIRST. Recurring class — QA #259318, QA-260302, QA-262370 all this shape.

## JSF composite + bean naming trap

Composites + beans share names but live in different scopes:
- `kkBb.xhtml` (composite at `etanah-common/src/main/webapp/resources/...` — common is read-only)
- `KkBbBean.java` (managed bean at `etanah-pelupusan/src/main/java/...` — editable)

Both surface as "kkBb" in casual reference. When tracing a flow, ALWAYS disambiguate via the subagent — `etanah-code-explorer` returns kind+location+signature in one call.

## Active tickets context

> Update this section as tickets rotate. Each entry: one line stating what's KIV, blocked, or in flight. Removing this section costs Claude immediate-context awareness on ticket transitions.

- (placeholder — populate from `quest/active.txt` + open ticket list when transitioning into eTanah work)

---

*Version: 3 (slim + access-corrected) | 2026-05-25 — Fixed v2's WRONG primary/secondary anchoring (was anchored on handover's "etanah-common as primary"; corrected per みや: pelupusan = PRIMARY, awam = SECONDARY, common = NO ACCESS / read-only black-box). Removed mention of deploy to `E:\Projects\Melaka\` per Layer 1 rule (improvements stay ours-side). Codegraph tool-routing intentionally NOT duplicated — that intelligence lives in `~\.claude\CLAUDE.md` (codegraph install writes it).*
