---
name: env-check
description: Verify and switch local environment state — etanahv3 config + standalone.xml + repo branch — automatically aligns to ticket scope with notify
allowed-tools: Read, Bash, Edit, Grep
---

# env-check — Local Environment State Verification + Switching

## What this does

When invoked, env-check:

1. **Detects target env** from active.txt or current quest scope:
   - Pelupusan ticket → FAT default for SQL-investigation, UAT for code-edit testing
   - AWAM ticket → UAT (FAT-AWAM does not exist for local; always simulate on UAT regardless of where BA reported)
   - Module switch (awam ↔ pelupusan) is heavy: requires WAR rebuild + JBoss redeploy (one WAR per JBoss instance)

2. **Reads current state** of 3 env-affecting locations + 1 deployment locus:
   - `C:\etanahv3\config\environment.properties` — `cas.url`, `proxy.url`
   - `E:\Dev\jboss-7.4-plp-melaka\standalone\configuration\standalone.xml` — `etanahDS` `<connection-url>` (the ONE that changes; Audit/DMS/DS3 stay on mkit always — env-agnostic)
   - Branch on relevant repo:
     - `etanah-pelupusan` main = `mlk/master` (SAME branch for both UAT and FAT; only env config differs)
     - `etanah-awam` main = `mlk/release/fat`
   - Currently deployed WAR in `E:\Dev\jboss-7.4-plp-melaka\standalone\deployments\` — flags whether a module switch is needed

3. **Compares + emits notification banner** (always visible, never silent)

4. **If mismatch** → AUTO-PROPOSES the fix (specific edits, not vague), waits for みや's `apply` confirmation, then **applies** the changes (config-edit category per refined audit-log rule = Ruri's hand after authorization)

5. **Post-change steps differ by case** — pick the right list:

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
| Cp A entry (auto-fired before Recon) | Verify-only, notify |
| Cp E entry (auto-fired before any code edit) | Verify-only, notify |
| `/env-check` or `check env` | Manual verify + notify |
| `switch env to FAT` / `switch to FAT pelupusan` | Detect target → propose edits → on `apply` → execute + post-steps |
| `switch env to UAT` / `switch to UAT awam` | Same as above for UAT/awam |
| `switch to <repo>` (same env) | Branch-only switch, verify env files match |

## Mapping (per ticket scope) — confirmed 2026-05-11 (2nd-pass after みや's JNDI-rename clarification)

All 3 candidate datasources are PERMANENTLY PRESENT in standalone.xml. **Switching envs is a JNDI-rename, not a URL swap**: whichever should be active gets jndi-name + pool-name = `etanahDS` (no suffix); the other two get `etanahDS2` and `etanahDS3` suffixes (assignment between 2/3 is arbitrary).

| Ticket scope | Which DS becomes `etanahDS` (active) | cas.url | Repo + branch | WAR deployed | Default? |
|---|---|---|---|---|---|
| **pelupusan + FAT** | `etprdmlk@172.30.17.104:5444 / et_main` | `https://appmlk.melaka.gov.my/etanah-cas` (FAT) | etanah-pelupusan @ `mlk/master` | etanah-pelupusan.war | ✅ **DEFAULT** — most tickets come from FAT |
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

## CAS URL switch mechanic (rule, 2026-05-11)

The two MLK `cas.url` lines coexist in `environment.properties`; switching is done by toggling the `#` comment marker, NOT by editing the URL text. Both UAT (AWAM and PLP) use the same UAT CAS URL.

**To switch to UAT** (any side):
```
# cas.url=https\://appmlk.melaka.gov.my/etanah-cas        ← comment OUT (FAT line)
cas.url=http\://172.30.59.150/etanah-cas                  ← UNCOMMENT (UAT line)
```

**To switch to FAT** (any side):
```
cas.url=https\://appmlk.melaka.gov.my/etanah-cas          ← UNCOMMENT (FAT line)
# cas.url=http\://172.30.59.150/etanah-cas                ← comment OUT (UAT line)
```

Edit must preserve the `\:` escape on `://` (Java properties format). Trailing-comment lines for TRGIT (`172.16.100.41`) and TRG-STAGING are OUT of scope for MLK work — leave commented.

## Output cadence (added 2026-05-11 after みや feedback)

- **First env-check banner of a session** (or after a major env switch): emit the FULL mapping table + all 4 aspect rows + post-change checklist.
- **Subsequent banners within the same session** (e.g. re-verify after a switch, or status check at Cp E): emit ONLY the changed row(s) as a single-row update. Skip the full mapping table — みや already knows the layout. Format: `✓ <aspect> now <new value> (was <old>)` per changed row. If everything matches, one-line: `✅ All env aspects still match <env> — no change since last check.`

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
- 2026-05-08 QA-260139: would have caught awam-on-mlk/int-env (should be mlk/release/uat) before Recon read stale code
- 2026-04-30 QA-258022: would have confirmed UAT-pelupusan match → no false alarm

## Lifecycle

- **L1 (now)**: skill file exists, manual + auto-trigger at Cp A/E
- **L2 (after 3 quest cycles)**: refine mapping table based on edge cases discovered
- **L3 (after stable)**: integrate with `/quest start` — auto-fire env-check at every quest activation

Continuous improvement entries land in `Feature/Forge-Self-Improvement-System/forge-log.md` with reference to this skill.

---

*Created: 2026-05-08 | Author: みや (proposed) + Ruri (drafted) | First quest applied: TBD*
