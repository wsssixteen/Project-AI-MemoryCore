---
name: env-check
description: Verify and switch local environment state — etanahv3 config + standalone.xml + repo branch — automatically aligns to ticket scope with notify
allowed-tools: Read, Bash, Edit, Grep
---

# env-check — Local Environment State Verification + Switching

## What this does

When invoked, env-check:

1. **Detects target env** from active.txt or current quest scope — **AUTHORITY ORDER (refined 2026-05-14 by みや — second-pass after QA-260302 FAT-default slip)**:
   - **✅ FAT RESTORED 2026-05-28 by みや** — the 2026-05-18 "Mock Cutover 1" UAT-only temporary override is REMOVED. Environment selection is **ticket-driven again** (Priorities below): switch the local target to the env where the BA tested, inferred from the Description `Env:` line + the permohonan ID's environment. FAT is a full local implement+test target again (no longer "simulation-viewing-only").
   - **Priority 0 — `hold` override (added 2026-05-28 by みや)**: if みや said **"hold"** (or "don't switch env" / "stay on current") when starting THIS ticket, env-check does **NOT** switch — it verifies-and-reports only, using the CURRENT env state. **This beats Priorities 1-2.** **Why**: みや may be running multiple sessions in parallel; an unrequested switch of `standalone.xml etanahDS` / `cas.url` / branch would disturb another ticket's in-flight testing. When `hold` is in effect, emit the banner line `env switch SUPPRESSED (hold) — current state kept` so the skip is visible, never silent.
   - **Priority 1**: Ticket Description.txt `Env:` line — `MLK FAT` / `MLKFAT` → FAT; `MLK UAT` / `MLKUAT` → UAT. This is authoritative when present.
   - **Priority 2**: Task folder name `<NN>. <type> #<num> - <ENV> - <urusan_kod> - <tugasan_kod> - <issue>` — the `<ENV>` slot if present.
   - **Priority 3 (when neither above specifies)**: **Use the CURRENT env state — do NOT force-switch.** Read `standalone.xml` etanahDS active jndi + `environment.properties` cas.url to detect what's currently configured; the answer = whatever's currently set. Saves the switch cost. Only switch if BA explicitly specified an env (Priority 1) that doesn't match current.
   - AWAM ticket → UAT (FAT-AWAM does not exist for local; always simulate on UAT regardless of where BA reported)
   - Module switch (awam ↔ pelupusan) is heavy: requires WAR rebuild + JBoss redeploy (one WAR per JBoss instance)
   - Scout's `test_app_uat=` / `test_app_fat=` recommendation is a HINT only — does NOT override the authority order.
   - **Why** (2026-05-14): First slip — Scout said UAT, I trusted it without checking Description.txt. First fix wrongly added "FAT default" — みや: *"I disliked hardcoded FAT or UAT. Make it more flexible... only if no environments are mentioned, then detect current env settings and use that. It saves time to keep on switching environments."* Correct rule: BA-specified > current-state. Never force a switch that's not BA-driven.

2. **Reads current state** of 3 env-affecting locations + 1 deployment locus:
   - `C:\etanahv3\config\environment.properties` — `cas.url`, `proxy.url`
   - `E:\Dev\jboss-7.4-plp-melaka\standalone\configuration\standalone.xml` — `etanahDS` `<connection-url>` (the ONE that changes; Audit/DMS/DS3 stay on mkit always — env-agnostic)
   - Branch on relevant repo:
     - `etanah-pelupusan` main = `mlk/master` (SAME branch for both UAT and FAT; only env config differs)
     - `etanah-awam` main = `mlk/release/fat` (confirmed on remote + accessible 2026-05-19; `mlk/release/uat` was used as a fallback 2026-05-13→18 ONLY because `mlk/release/fat` access had not yet been granted — that access is now resolved, so `mlk/release/fat` is the AWAM baseline for env prep, branch-out, and closure)
   - Currently deployed WAR in `E:\Dev\jboss-7.4-plp-melaka\standalone\deployments\` — flags whether a module switch is needed

3. **Runs `git pull --ff-only origin <main-branch>` on the involved repo(s)** (added 2026-05-14 by みや after QA-260965 slip): non-skippable. If pull fails due to dirty working tree → surface error + propose `git stash` (only when there's mid-fix work to preserve) or discard. If pull fails non-fast-forward → surface conflict, do NOT auto-merge. **Why baked into env-check, not separate**: 2026-05-07 QA-260154 + 2026-05-14 QA-260965 both slipped on this two-rule split (branch-check ran, pull skipped). One skill, one flow.

4. **Compares + emits notification banner** (always visible, never silent)

5. **If mismatch** → **applies the config edits directly** (cas.url toggle + JNDI rename are reversible local-machine changes), then emits the banner showing what changed — **no `apply` confirmation gate**. **Why** (みや 2026-05-17): env-check should just run; みや expected auto-apply and explicitly authorized automation for env-check's config edits. Ruri still names the post-change steps (JBoss restart, mvn clean if code changed) so みや knows what to do next.

6. **Post-change steps differ by case** — pick the right list:

   **Case A — Env-only switch (same module, swap config only)**: e.g. pelupusan-FAT ↔ pelupusan-UAT, both running `etanah-pelupusan.war`
   - (a) Stop JBoss completely (verify no java.exe in Task Manager)
   - (b) Delete `standalone\tmp\*` and `standalone\data\*` (cache busters)
   - (c) Start JBoss (no rebuild needed — WAR doesn't bake DB URL or cas.url)
   - (d) Tail `server.log` to verify: cas.url binding + datasource URL

   **Case B — Module switch (awam ↔ pelupusan, swap WAR)**: heavier; only ONE WAR can be deployed at a time per JBoss instance
   - (a) Stop JBoss completely
   - (b) Remove the currently-deployed WAR from `standalone\deployments\`
   - (c) `mvn clean install` on the target repo (`etanah-pelupusan` or `etanah-awam`)
   - (d) Copy the freshly-built `target\*.war` to `standalone\deployments\`
   - (e) Delete `standalone\tmp\*` and `standalone\data\*` (cache busters)
   - (f) Start JBoss
   - (g) Tail `server.log` to verify: WAR deployed cleanly + cas.url binding + datasource URL

## Trigger phrases

| Phrase | Action |
|---|---|
| Discovery entry (auto-fired before Recon) | Verify-only, notify |
| Apply entry (auto-fired before any code edit) | Verify-only, notify |
| `/env-check` or `check env` | Manual verify + notify |
| `switch env to FAT` / `switch to FAT pelupusan` | Detect target → propose edits → on `apply` → execute + post-steps |
| `switch env to UAT` / `switch to UAT awam` | Same as above for UAT/awam |
| `switch to <repo>` (same env) | Branch-only switch, verify env files match |

## Mapping (per ticket scope) — confirmed 2026-05-11 (2nd-pass after みや's JNDI-rename clarification)

All 3 candidate datasources are PERMANENTLY PRESENT in standalone.xml. **Switching envs is a JNDI-rename, not a URL swap**: whichever should be active gets jndi-name + pool-name = `etanahDS` (no suffix); the other two get `etanahDS2` and `etanahDS3` suffixes (assignment between 2/3 is arbitrary).

| Ticket scope | Which DS becomes `etanahDS` (active) | cas.url | Repo + branch | WAR deployed | Default? |
|---|---|---|---|---|---|
| **pelupusan + FAT** | `etprdmlk@172.30.17.104:5444 / et_main` | `https://etanah-app.melaka.gov.my/etanah-cas` (FAT) | etanah-pelupusan @ `mlk/master` | etanah-pelupusan.war | ✅ **DEFAULT** — most tickets come from FAT |
| pelupusan + UAT | `mlkuat@172.30.59.185:5444 / et_main_uat` | `http://172.30.59.150/etanah-cas` (UAT) | etanah-pelupusan @ `mlk/master` | etanah-pelupusan.war | Only when FAT lacks test data, OR BA states UAT in ticket |
| **awam + UAT** | `mkit@172.16.100.197:5444 / et_main_mlit` | `http://172.30.59.150/etanah-cas` (UAT) | etanah-awam @ `mlk/release/fat` | etanah-awam.war | All AWAM tickets (FAT/UAT both tested here) |
| awam + FAT | **N/A** — FAT-AWAM not exposed for local testing | | | | |

**Switch mechanic** (verified against current standalone.xml lines 193-235 on 2026-05-11):
```xml
<!-- Currently active (AWAM-UAT): jndi-name = etanahDS, no suffix -->
<datasource jndi-name="java:jboss/datasources/etanahDS"  pool-name="etanahDS"  ...>
    <connection-url>jdbc:postgresql://172.16.100.197:5444/mkit?currentSchema=et_main_mlit</connection-url>
<!-- Inactive: gets etanahDS2 -->
<datasource jndi-name="java:jboss/datasources/etanahDS2" pool-name="etanahDS2" ...>
    <connection-url>jdbc:postgresql://172.30.17.104:5444/etprdmlk?currentSchema=et_main</connection-url>
<!-- Inactive: gets etanahDS3 -->
<datasource jndi-name="java:jboss/datasources/etanahDS3" pool-name="etanahDS3" ...>
    <connection-url>jdbc:postgresql://172.30.59.185:5444/mlkuat?currentSchema=et_main_uat</connection-url>
```

To switch from AWAM-UAT to FAT-PLP: rename the etprdmlk block's jndi/pool to `etanahDS` (drop suffix), and rename mkit's to `etanahDS2` (add suffix). The mlkuat block can stay at `etanahDS3` or swap with mkit — assignment of 2 vs 3 is arbitrary.

**Datasources that DO NOT change** (env-agnostic, always-on mkit per 2026-05-11):
- `etanahAuditDS` → `mkit / et_sistem_mlit` (line 173 area)
- `etanahDMSDS` → `mkit / et_dms_mlit` (line 257 area)

When switching `etanahDS`, leave Audit + DMS alone. The skill NEVER proposes edits to them.

**SQL/MCP DB query path** (separate from app DB target):
- Pelupusan-side data → `mcp__postgres-mlkuat__query` (UAT) or `mcp__postgres-mlkfat__query` (FAT)
- AWAM-side data → `mcp__postgres-mlkuat__query` (rizab/master data overlaps mkit enough for read-only queries; no direct mkit MCP wired)

### 🔴 LIVE-SCHEMA VERIFICATION — mandatory FIRST step before trusting ANY FAT/UAT query (HARD RULE, added 2026-05-30 after the et_main_15052026 snapshot waste)

The FAT/UAT MCPs must connect as the app's datasource user (FAT = `et_main`, UAT = `et_main_uat`) — **NOT `et_reporting`**. `et_reporting` only has SELECT on the **`et_main_15052026` reporting snapshot**, which has DIVERGED from live `et_main` (permohonan IDs differ). A query against the snapshot returns real-looking rows that **do not exist in みや's running app** → wasted time.

**At the FIRST FAT/UAT query of a session, run a live-access probe:**
```
SELECT current_user;                          -- must be the app user (et_main / et_main_uat), NOT et_reporting
SELECT 1 FROM et_main.umm_aplikasi LIMIT 1;   -- (et_main_uat for UAT) — must succeed
```
If `current_user = et_reporting`, OR the probe errors `permission denied for schema et_main`, OR only a dated snapshot schema (`et_main_<date>`) is visible → **FLAG IMMEDIATELY + STOP.** Do NOT proceed on snapshot data, do NOT hand みや any permohonan ID, until live access is confirmed. Connection user lives in `~/.claude.json` (mlkfat/mlkuat MCP); changing it needs a Claude Code restart.

**Why** (2026-05-30): pulled `PTMLK/01/L/PRU/2026/15` from the et_reporting snapshot; it didn't exist in みや's live FAT → wasted his time. Never trust a FAT/UAT query without confirming live-schema access first.

## CAS URL switch mechanic (rule, 2026-05-11)

The two MLK `cas.url` lines coexist in `environment.properties`; switching is done by toggling the `#` comment marker, NOT by editing the URL text. Both UAT (AWAM and PLP) use the same UAT CAS URL.

**To switch to UAT** (any side):
```
# cas.url=https\://etanah-app.melaka.gov.my/etanah-cas        ← comment OUT (FAT line)
cas.url=http\://172.30.59.150/etanah-cas                  ← UNCOMMENT (UAT line)
```

**To switch to FAT** (any side):
```
cas.url=https\://etanah-app.melaka.gov.my/etanah-cas          ← UNCOMMENT (FAT line)
# cas.url=http\://172.30.59.150/etanah-cas                ← comment OUT (UAT line)
```

Edit must preserve the `\:` escape on `://` (Java properties format). Trailing-comment lines for TRGIT (`172.16.100.41`) and TRG-STAGING are OUT of scope for MLK work — leave commented.

## Known local paths (added 2026-05-20 by みや — auto-loaded at every env-check invoke)

These are stable on みや's machine; loaded with the skill so Ruri never asks at Quest Phase 0 / mid-investigation. When any of these changes (e.g. JBoss upgrade), update this block — it is the single canonical home.

| Asset | Path |
|---|---|
| JBoss home | `E:\Dev\jboss-7.4-plp-melaka\` |
| JBoss server.log | `E:\Dev\jboss-7.4-plp-melaka\standalone\log\server.log` |
| JBoss tmp (cache buster) | `E:\Dev\jboss-7.4-plp-melaka\standalone\tmp\` |
| JBoss data (cache buster) | `E:\Dev\jboss-7.4-plp-melaka\standalone\data\` |
| JBoss deployments | `E:\Dev\jboss-7.4-plp-melaka\standalone\deployments\` |
| JBoss standalone.xml | `E:\Dev\jboss-7.4-plp-melaka\standalone\configuration\standalone.xml` |
| etanahv3 config | `C:\etanahv3\config\environment.properties` |
| Maven settings.xml | `E:\Dev\apache-maven-3.9.9\conf\settings.xml` |
| Maven local repo (.m2) | `E:\Dev\.m2_etanah` |
| Code repos | `E:\Projects\Melaka\etanah-pelupusan\`, `E:\Projects\Melaka\etanah-awam\`, `E:\Projects\Melaka\etanah-common\` |
| etanah-domain extracted sources | `C:\temp\etanah-src\my\gov\etanah\domain\` |
| Setup notes | `E:\Dev\jboss-7.4-plp-melaka\SETUP-NOTES.txt` |

**How Ruri uses this**: when any task or investigation needs a path (tail server.log, clean tmp, find a WAR, grep a config, extract a sources jar), reach for this table first — never ask みや. When a path is genuinely missing here, add it the same session.

## Output cadence (added 2026-05-11 after みや feedback)

- **First env-check banner of a session** (or after a major env switch): emit the FULL mapping table + all 4 aspect rows + post-change checklist.
- **Subsequent banners within the same session** (e.g. re-verify after a switch, or status check at Apply): emit ONLY the changed row(s) as a single-row update. Skip the full mapping table — みや already knows the layout. Format: `✓ <aspect> now <new value> (was <old>)` per changed row. If everything matches, one-line: `✅ All env aspects still match <env> — no change since last check.`

## Output format (always emitted)

```
═══ ENV-CHECK ═══

Target (from ticket scope): <env + repo>

| Aspect | Expected | Current | Match? |
|---|---|---|---|
| etanahv3 cas.url | <X> | <Y> | ✓ / ⚠️ |
| standalone.xml etanahDS | <X> | <Y> | ✓ / ⚠️ |
| <repo> branch | <X> | <Y> | ✓ / ⚠️ |

Status: ✅ All match — proceed
   OR
Status: ⚠️ N mismatches — auto-proposed fix below

Proposed fix (each ≤2 sentences):
  1. <specific edit>
  2. <specific edit>

Awaiting your `apply` confirmation. After apply, post-change steps:
  (a) Stop JBoss
  (b) Delete tmp + data
  (c) [if WAR rebuild] mvn clean install on <repo>
  (d) Start JBoss
  (e) Tail server.log to verify

═══ END ═══
```

## Why this skill exists (system-design rationale)

Per `Feature/Forge-Self-Improvement-System/layer-architecture.md`, environment state is operational concern (Layer 2-3). Bundling into Phase 0 step 0a as ad-hoc rule = ceremony at every checkpoint; named skill = single named call, single file to refine.

Pressure-tested against 3 sessions:
- 2026-05-08 QA-260298: would have caught FAT-cas-url mismatch before login attempts
- 2026-05-08 QA-260139: would have caught awam-on-mlk/int-env (should be mlk/release/fat) before Recon read stale code
- 2026-04-30 QA-258022: would have confirmed UAT-pelupusan match → no false alarm

## Lifecycle

- **L1 (now)**: skill file exists, manual + auto-trigger at Discovery / Apply
- **L2 (after 3 quest cycles)**: refine mapping table based on edge cases discovered
- **L3 (after stable)**: integrate with `/quest start` — auto-fire env-check at every quest activation

Continuous improvement entries land in `Feature/Forge-Self-Improvement-System/forge-log.md` with reference to this skill.

---

*Created: 2026-05-08 | Author: みや (proposed) + Ruri (drafted) | First quest applied: TBD*
*Last updated: 2026-05-20 — added Known-local-paths block so Phase 0 stops asking for stable infrastructure paths mid-investigation.*
*Last updated: 2026-05-28 — FAT RESTORED: removed the 2026-05-18 UAT-only "Mock Cutover 1" temporary override; env selection is ticket-driven again (match BA's tested env + permohonan ID env; FAT is a full local implement+test target). Added Priority 0 `hold` override — みや saying "hold" at ticket start suppresses the env switch to protect parallel sessions. AWAM→mkit/UAT special case unchanged (みや confirmed). Paired memory: `.claude/auto-memory/feedback_uat_fat_environments.md`.*
