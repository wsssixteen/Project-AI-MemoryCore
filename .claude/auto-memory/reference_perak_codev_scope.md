---
name: reference_perak_codev_scope
description: "co-dev scope; Oracle servers; branch prk/<tracker>/<num> off origin/master; deploy only via master; hotfix box; alter page"
metadata: 
  node_type: memory
  type: reference
  originSessionId: b1b3201c-7ff8-45c3-b969-f80bc749ba4c
  modified: 2026-09-04T08:35:29.097Z
---

🚨 We handle **Melaka AND Perak** (co-developer). Perak tickets are in-scope — run the full quest on them, do not hand back as out-of-scope.

**Perak env facts:**
- Ticket env label: **ESOKONGAN**; permohonan IDs are `PTPK/...`; users `@perak.gov.my` / `@perak.etanah.com.my`.
- PROD app URL host: `appspk.perak.gov.my` (etanah-pelupusan). common version `1.51.39-PRK`, domain/db `1.1.133/1.1.138`.
- Code checkout: `E:\Projects\Perak\` (etanah-awam · etanah-common · etanah-pelupusan · etanah-spoc-hasil). **Trunk = `master`** (NOT `mlk/master` — Melaka guards/branch-guard must be bypassed or Perak-aware).
- DB = **Oracle** (Melaka is Postgres). MCP: `oracle-prk-dev` (ET_MAIN_PERAK_DEV, 93.150/etanahprk), `oracle-prk-denda` (etstagnp, 19.100), `oracle-prk-prod`.
- Melaka-tuned tooling does NOT auto-apply to Perak. Since 2026-09-04 the registry `system/states.json` (via `lib/states.js`) carries Perak's trunk (`master`), Task folder (`1. Tasks\Perak`), knowledge dir, Oracle MCPs and `prk/internal/<num>` branch shape — `branch-guard`, `ticket-gate`, `knowledge-first-gate` now read it; tools still listed by `node lib/states.js check` as UNROUTED (release-mlk-plp, deploy, env-check, …) are Melaka-only by design.

Related: (merged above) · [[feedback_module_edit_boundary]]

---

## Merged 2026-10-04: perak-oracle (was reference_perak_oracle.md)

> Perak Etanah Oracle MCP servers — oracle-prk-dev (172.16.93.150/etanahprk, schema ET_MAIN_PERAK_DEV) + oracle-prk-denda (192.168.19.100/etstagnp, ET_MAIN_PERAK_DENDA)

Perak Etanah runs on **Oracle** (like [[feedback_state_aware_knowledge_load]], unlike Melaka's Postgres/pgEdge). Two MCP servers added 2026-08-26 per みや (`~/.claude.json`, backup `.bak-perak-2026-08-26`):

| Server | Host | Service | Schema/user | Tables (verified live 2026-08-26) |
|---|---|---|---|---|
| `oracle-prk-dev` | 172.16.93.150:1521 | `etanahprk` | `et_main_perak_dev` | 793 |
| `oracle-prk-denda` | 192.168.19.100:1521 | `etstagnp` | `et_main_perak_denda` | 799 |

- Password = the shared Melaka one (same as mlit/stg1/stg2/Selangor `et_main_dev`); PROD `et_read` differs.
- Same python-oracledb thin server as oracle-slt (`C:\Users\Ridhwan\AppData\Local\oracle-mcp\server.py`).
- Also seen in みや's DBeaver: `etprdpk` 192.168.15.104:1521 user `et_read` = **Perak PROD** — NOT added (no ask).
- First Perak ticket: #275092 [eSOKONGAN PERAK] — resolved by みや 2026-08-26 (alter `PTPK/07/E/PT/2023/154` → Semakan Permohonan HKGHS at PROD); retrieved into `1. Tasks\Perak\` for the audit; latent remoting root cause unfixed (bounce-back plausible).
- Knowledge folder ESTABLISHED 2026-08-26: `projects/coding-projects/active/etanah-knowledge/perak/` — read `index.md` + `STATE-FACTS.md` first; migration ledger in `MIGRATION-PLAN.md` (strategy: skeleton-first, verify-per-item; generic method in `../STATE-MIGRATION-PLAYBOOK.md`).
- Codebase: SAME remotes as Melaka (`172.16.93.167`), branch prefix `prk/*`, NO `prk/master` (baseline unconfirmed — plan Q1); `E:\Projects\Perak` is an empty placeholder. Task folders route by state via `quest/redmine-sync.js` v9+ (`node quest/redmine-sync.js <num>` = by-ID retrieval).

---

## Merged 2026-10-04: perak-flowable-alter-page (was reference_perak_flowable_alter_page.md)

> 🚨 Perak flowable ALTER page (pelupusan only): https://<host>/etanah-pelupusan/protected/flowable/InitiateBPMFlowableForm.xhtml — PROD host appspk.perak.gov.my · STAGING appspkstg.perak.gov.my (swap only the host); login nurhafizah@ptsb.puncaktegap.com.my (password in etanah-knowledge/perak/FLOWABLE-ALTER.md, untracked)

**Perak flowable alter page (per みや 2026-09-04, #275847)** — "Pelupusan Flowable Utility Page", pelupusan module ONLY:

| Env | URL |
|---|---|
| PROD | `https://appspk.perak.gov.my/etanah-pelupusan/protected/flowable/InitiateBPMFlowableForm.xhtml` |
| STAGING | `https://appspkstg.perak.gov.my/etanah-pelupusan/protected/flowable/InitiateBPMFlowableForm.xhtml` |

- Only the HOST changes between environments; path is identical.
- Login: `nurhafizah@ptsb.puncaktegap.com.my` — password lives in the untracked-confidential
  `projects/coding-projects/active/etanah-knowledge/perak/FLOWABLE-ALTER.md` (never in a git-pushed file).
- Path differs from Melaka (`/protected/internal/InitiateBPMFlowableForm.xhtml`, "Pelupusan Flowable Alter Page"):
  Perak's bean lives in `web/form/flowable/`, page title "Pelupusan Flowable Utility Page", actions =
  Initiate Flowable · On-Submit (Move Process) · Alter Flow Flowable · Migrate BPM to Flowable (password-gated
  bulk init+alter) · Migrate Flowable Version. NO single-ID "Initiate & Alter in one click" (Melaka has it).
- Full mechanics + the deterministic alter-ticket runbook/reply format: `etanah-knowledge/perak/FLOWABLE-ALTER.md`
  (see (merged above), [[perak-codev-scope]], [[flowable-node-edge-trace]]).

---

## Merged 2026-10-04: reference_perak_deploy_flow (was reference_perak_deploy_flow.md)

> Perak deploy flow — a fix reaches staging AND prod ONLY via master; prk/stag-env is NOT the deployed artifact; verify by host footer before claiming deployed

🚨 Perak deploy/close flow. Perak trunk = `master` (see [[reference_perak_codev_scope]]). Repo: `E:\Projects\Perak\etanah-pelupusan`.

🚨 **CORRECTION (VERIFIED live 2026-09-08, #277115 rework — this replaces the old "deploy = push prk/stag-env" step).** The staging host `appspkstg.perak.gov.my` footer reads `Branch Name: master`, `Module Version: 1.74.0`. **Both staging and PROD serve builds cut from `master` (release/1.73.x → 1.74.x). `prk/stag-env` is a parallel branch ~1297 commits ahead of master but is NOT what any running server builds — merging a fix only to `prk/stag-env` deploys it to NOTHING.** Proven on #277115: cycle-2 fix `872e33a17d` merged to prk/stag-env (`590771f37f`), reported "dah merge ke staging", but `git merge-base --is-ancestor 872e33a17d origin/master` = NO → prod stayed blank. Same failure family as #278218 one day earlier (wrong ref → infra builds master → WAR lacks fix). See etanah-knowledge/perak/BRANCH-AND-DEPLOY.md §3.

**Order (only after local test passes with the fix):**

| # | Step | Command |
|---|---|---|
| 1 | Confirm base | `git -C <repo> checkout master && git pull --ff-only` (behind must be 0) |
| 2 | Ticket branch off master | `git checkout -b prk/esokongan/<num>` (or `prk/internal/<num>` / `prk/hotfix/<num>` per tracker — STATE-FACTS §2) |
| 3 | Stage + commit the fix | `git add <files>` → STOP, show `git diff --cached` + drafted message for みや to approve → `git commit` |
| 4 | Push the ticket branch | `git push origin prk/<tracker>/<num>` |
| 5 | **Merge to master (this is what deploys)** | `git checkout master && git pull --ff-only && git merge --no-ff prk/<tracker>/<num> && git push origin master` — a release action, needs みや's explicit go |
| 6 | Infra builds/deploys master to staging then PROD | みや / infra; then **read the target host footer** (Branch Name + Module Version + Tarikh Kemaskini) to CONFIRM the fix landed — never claim "deployed" from a branch merge |
| 7 | Return to trunk | `git checkout master && git pull --ff-only` |

**Hard rules learned:**
- A fix reaches a running env ONLY when it is in `master`. `prk/stag-env` proves nothing.
- Before any "deployed / merged to staging" handback, read the host footer AND `git merge-base --is-ancestor <fix> origin/master`. See [[feedback_deploy_truth_gate]].
- The 2026-08-28 note that "staging merge to prk/stag-env was still correct" for 277439/277115 was WRONG — corrected here.

Related: [[reference_perak_codev_scope]] · [[feedback_deploy_truth_gate]] · (merged above) · [[feedback_commit_deploy_runbook]] · [[feedback-commit-deploy-runbook]]

---

## Merged 2026-10-04: reference_perak_hotfix_and_error_store (was reference_perak_hotfix_and_error_store.md)

> 🚨 Perak HOTFIX box = http://192.168.18.110:8080/<module> (shares PROD DB, footer Branch Name = build truth); ralat 'ID Rujukan' = ET_SISTEM.PT_APPLICATION_EX_ENTITY (host + Build Time in STACK_TRACE); infra request must name exact ref prk/esokongan/<num> — #278218 hotfix was built from master

**Perak deploy-verification facts (verified 2026-09-08, #278218):**

| Fact | Detail |
|---|---|
| Hotfix box | `http://192.168.18.110:8080/etanah-pelupusan` — reachable from the office network (HTTP 200); shares the PROD DB; `ET_SISTEM.PT_APPLICATION_INSTANCE` 2242 (PROD pelupusan = 2081, `192.168.18.83`) |
| Footer = build truth | `Tarikh Kemaskini` (build time MYT) · `Common Version` · `Module Version` · `Branch Name` (git-commit-id-plugin). A ticket branch off master keeps master's pom, so only `Branch Name` proves the branch |
| Error store | `ET_SISTEM.PT_APPLICATION_EX_ENTITY` — `APPLICATION_EX_ENTITY_ID` = the ID Rujukan on the ralat dialog; `STACK_TRACE` starts with `URL / Application, host:<ip> / Exception message / Build Time`; `CREATED_BY` = login. Query with `DBMS_LOB.INSTR(STACK_TRACE,'<identifier>')>0` |
| Infra request | name the exact origin ref `prk/esokongan/<num>` (check `git ls-remote --heads origin`). `esokongan/278218` did not exist → infra built `master` → fix absent → user re-tested twice, same ralat |
| Staging MCP | `oracle-prk-stag` = `etstagnp` default `ET_MAIN_STAG`; `ET_FLOWABLE_STAG.ACT_HI_VARINST` / `ACT_HI_ACTINST` prove what a deployed fix emitted |

**Why:** 2026-09-08 the "PRK 218 & 109" session found the stale build, then retracted the finding when miya said the hotfix box was not reachable and to trust infra. It was reachable, the footer said `master`, and the error store had two rows from that host with the master Build Time. **How to apply:** on any "fix didn't work" report, read the footer of the exact host the user tested on and pull the error-store rows for that host BEFORE touching code. A finding backed by a live read is not withdrawn on a premise; re-check the premise. Related: (merged above) · [[reference_perak_codev_scope]] · [[feedback_verify_before_claim]] · [[Verify before claiming during code tracing]]

---

## Merged 2026-10-04: perak-branch-from-master (was feedback_perak_branch_from_master.md)

> 🚨 Perak quest = pull origin/master then branch prk/<tracker>/<num> off origin/master; never assume base or use prk/master

🚨 Perak (PTPK / eSOKONGAN PERAK) quest branching, per みや 2026-09-07: ALWAYS `git checkout master && git pull --ff-only origin/master` FIRST, then branch `prk/<tracker>/<num>` off `origin/master`. There is NO `prk/master`. behind-count uses `origin/master`.

**Why:** I branched off `prk/stag-env` after finding master 1297 commits behind — みや overrode: the rule is master-based regardless. master is a release line (`release/1.73.x`), 0 ahead / 1297 behind stag-env (fully contained in it); the shared file (`SuratTemplateForm.java`) is ~identical on both (4456 vs 4457 lines) so master is a sound base. BA still tests on `prk/stag-env` (host `appspkstg.perak.gov.my`), so after committing to the ticket branch: merge to master (release) AND deploy to stag-env for BA.

**How to apply:** the FIRST quest action for any PTPK ticket is a fetch+pull of the state's repo (`E:\Projects\Perak\etanah-pelupusan`), then branch off origin/master. NEVER claim "no fix exists" for Perak without a fresh fetch (that was the 2026-09-07 false-claim slip — I ran git log on a 1297-behind un-fetched local). Canonical in `system/states.json` perak.trunk_ref=`origin/master` + branch_note, and `perak/BRANCH-AND-DEPLOY.md` §1. Related: [[state-aware-knowledge-load]] · [[feedback_etanah_git_separate_clone]].
