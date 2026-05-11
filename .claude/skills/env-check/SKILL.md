---
name: env-check
description: Verify and switch local environment state — etanahv3 config + standalone.xml + repo branch — automatically aligns to ticket scope with notify
allowed-tools: Read, Bash, Edit, Grep
---

# env-check — Local Environment State Verification + Switching

## What this does

When invoked, env-check:

1. **Detects target env** from active.txt or current quest scope:
   - Pelupusan ticket → FAT default (post-2026-05-08)
   - AWAM ticket → UAT default (FAT-AWAM unconfirmed)
   - Module-only switch (same env, different repo) → no env file change, branch only

2. **Reads current state** of 3 env-affecting locations:
   - `C:\etanahv3\config\environment.properties` — `cas.url`, `proxy.url`
   - `E:\Dev\jboss-7.4-plp-melaka\standalone\configuration\standalone.xml` — `etanahDS` `<connection-url>`
   - Branch on relevant repo:
     - `etanah-pelupusan` main = `mlk/master`
     - `etanah-awam` main = `mlk/release/uat` (NOT `mlk/master`; corrected 2026-05-08)

3. **Compares + emits notification banner** (always visible, never silent)

4. **If mismatch** → AUTO-PROPOSES the fix (specific edits, not vague), waits for みや's `apply` confirmation, then **applies** the changes (config-edit category per refined audit-log rule = Ruri's hand after authorization)

5. **Always lists post-change steps** (mandatory ordering — never reorder):
   - (a) Stop JBoss completely (verify no java.exe in Task Manager)
   - (b) Delete `standalone\tmp\*` and `standalone\data\*` (cache busters)
   - (c) **Only if WAR change**: `mvn clean install` on relevant repo
   - (d) Start JBoss
   - (e) Tail `server.log` to verify: cas.url binding + datasource URL

## Trigger phrases

| Phrase | Action |
|---|---|
| Cp A entry (auto-fired before Recon) | Verify-only, notify |
| Cp E entry (auto-fired before any code edit) | Verify-only, notify |
| `/env-check` or `check env` | Manual verify + notify |
| `switch env to FAT` / `switch to FAT pelupusan` | Detect target → propose edits → on `apply` → execute + post-steps |
| `switch env to UAT` / `switch to UAT awam` | Same as above for UAT/awam |
| `switch to <repo>` (same env) | Branch-only switch, verify env files match |

## Mapping (per ticket scope)

| Ticket scope | etanahv3 cas.url | standalone.xml etanahDS | Repo + main branch |
|---|---|---|---|
| pelupusan + FAT | `https://appmlk.melaka.gov.my/etanah-cas` | `jdbc:postgresql://172.30.17.104:5444/etprdmlk?currentSchema=et_main` | etanah-pelupusan @ `mlk/master` |
| pelupusan + UAT | `http://172.30.59.150/etanah-cas` | `jdbc:postgresql://172.30.59.185:5444/mlkuat?currentSchema=et_main_uat` | etanah-pelupusan @ `mlk/master` |
| awam + UAT | `http://172.30.59.150/etanah-cas` | `jdbc:postgresql://172.30.59.185:5444/mlkuat?currentSchema=et_main_uat` | etanah-awam @ `mlk/release/uat` |
| awam + FAT | UNKNOWN — confirm with みや/BA before assuming exists | — | — |

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
