---
name: feedback_module_edit_boundary
description: "edit only awam + pelupusan; no common overrides; flag cross-module at intake; SPOC = read the remote ref, local is stale"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 57f2051a-5630-4266-ac01-a39e448c0c48
  modified: 2026-08-21T01:45:43.808Z
---

🚨 GENERAL RULE (みや 2026-08-21): we do **NOT** edit other modules' code. We edit ONLY **etanah-awam** and **etanah-pelupusan**.

- **etanah-common** — do NOT edit freely; "the least we can do is pass it if it's common" = hand off / propose to the common-owning team (a minimal common change only if explicitly agreed).
- **etanah-spoc-hasil (SPOC)** — NEVER edit. If a bug's root write is in spoc, **cater it from our side** (pelupusan/awam) — find a hook in a screen/tugasan WE own that can override or correct the behaviour, rather than fixing spoc's code.

**Why**: module ownership boundary — other teams own spoc/common; our commits there aren't wanted and won't be merged. **How to cater**: a bug can be ROOT in spoc/common but the fix is placed where OUR module reads/renders/validates the data (e.g. re-derive a flag at our tugasan's load time, like the AWAM `resetFlagWajibForPelupusan` pattern), correcting the shared data before it bites.

**Worked example** — QA-276549 (PRBB counter doc-mandatory): root write is `etanah-spoc-hasil PopulateDataUtil.populateAppDokumenKemasukanBySemakanDokumen:965` (spoc — off-limits). Cater from pelupusan: the SKM tugasan is `MlkSemakanPermohonanForm` (pelupusan), so re-derive/override the doc `adalahWajib` for SCR + PLP_RESITCUKAI there, keyed on `tarafTanah` (from `umm_aplikasi.mklmt_tmbhn`).

Related: (merged above) · [[feedback_cross_module_handoff_artifact]] · (merged above)

**🚨 Also banned: CARRYING another module's fix (2026-09-30, ADHOC-PRBB-2026-6).** Not editing their code is not enough. Never offer to relay, chase, or run their work either — no "send us the script and we will pass it to infra", no column lists, no fix steps. Common and GIS (GIS DB + GisRequestService integration) are NOT our side. Our only output for their bug = one message saying it is not our issue + the error line. See [[feedback_other_team_message_not_our_issue]].

---

## Merged 2026-10-04: stay-in-module (was feedback_stay_in_module.md)

> Default scope = `etanah-pelupusan/src/` ONLY. Cross-module suggestions (patch etanah-common, override files at overlay-paths like /WEB-INF/layouts/, global CSS/JS injection that affects shared infra) are BANNED unless みや explicitly opens that scope. Also: a survey question is NOT a directive to enumerate every option including the out-of-scope ones.

When working on an etanah ticket (default = MPT / pelupusan work), the editable scope is **`E:\Projects\Melaka\etanah-pelupusan\src\`** ONLY. ANY suggestion that requires:

- Patching `etanah-common` (different repo, different release cycle)
- Creating override files in pelupusan src that mirror `etanah-common` overlay paths (e.g. `src/main/webapp/WEB-INF/layouts/bpmTemplate.xhtml` to shadow the overlay version)
- Global CSS/JS that affects shared infrastructure used by sibling modules
- Anything that ships only on みや's local laptop, not to other devs/users

...is **BANNED** unless みや explicitly says "patch etanah-common" / "override the overlay" / "open scope".

**Why** (みや 2026-06-30): *"You want the thousands of users to just use my laptop?"* — local-only forks are not a fix; they're a hack that diverges from etanah-common and breaks for every other developer or production user. The fix must ship through the supported channel: changes inside the module we own (etanah-pelupusan).

## A SURVEY ≠ a directive

When みや asks **"could we do X?"** / **"is there a centralized way?"** / **"what about Y?"** — that's a **survey**, not approval to enumerate every theoretical option including out-of-scope ones. **Answer surveys by listing ONLY in-scope options.** If a tempting solution requires going out of module, **MENTION it exists as a closed door** in one line, don't propose it as Option A.

**Banned**: presenting an option list where the recommended item requires cross-module work (e.g. "Recommended: bpmTemplate.xhtml override" when bpmTemplate lives in etanah-common).

## Self-rule — pre-answer scope check

Before proposing ANY fix in chat, grep my draft for these red flags:

| Red flag in my draft | Action |
|---|---|
| "patch etanah-common" / "edit the etanah-common version" | DELETE that proposal |
| "override file at /WEB-INF/layouts/" / "Maven WAR overlay override" | DELETE — only acceptable if みや explicitly opened the scope earlier in the thread |
| "global CSS sweep" / "body class on bpmTemplate" | DELETE — affects shared infra |
| "this requires opening the X repo" | DELETE — out of scope by definition |

Survivors of the scope check = the actual answer. If the scope check leaves nothing, say so honestly: *"All in-scope options have been tried; remaining leaks are out-of-module and need separate scope decision."*

## Today's failure (the trigger for this memory)

QA-239386 MPT centralized-disable discussion (2026-06-30):
- Proposed Option A1 = bpmTemplate.xhtml override (overlay-mirror in pelupusan)
- Proposed Option A2 = patch etanah-common
- Both out-of-module. みや rejected ALL.
- Earlier in same session: created `CommonSenaraiSemakanForm.xhtml` override at `src/main/webapp/protected/common/` — also a overlay-mirror; みや didn't reject at the time but the pattern is the same.

**Cross-ref**: [[feedback_simplify_and_reference]] (working-analog first within the system), [[feedback_no_extra_comments]] (in-scope discipline at code level).

---

## Merged 2026-10-04: feedback_cross_module_alert_at_intake (was feedback_cross_module_alert_at_intake.md)

> 🚨 At ticket RETRIEVAL and Phase 0, scan Description+History for CROSS-MODULE (etanah-common / other-team) + PRIORITY signals and flag them LOUDLY as the FIRST line of the quest MD; never conclude module ownership before confirming the screen's actual repo

🚨 **The moment a ticket is retrieved / read / a quest MD is started, SCAN the Description + History for two things and surface them LOUDER than anything else — before any investigation.**

**1. CROSS-MODULE signal → 🚨 flag + investigate ownership FIRST.** If ANY of these appear, the ticket may not be ours to fix — the fastest win is handing it to the owning team, so surface it at intake, not after days of pelupusan tracing:
- BA phrases: *"our issue or Common"*, *"issue from Common"*, *"pass this tic / pass to <team>"*, *"not our domain"*, *"boleh pass"*, *"Common issue"*, any "which module / whose" question.
- Shape signals: a **utiliti** screen (sidebar maintenance tools are frequently **etanah-common** `protected/<area>/Utiliti*Form`), a shared screen name (Kemaskini Ulasan, JPPH, common dialogs), module-ambiguous urusan.
- **Rule**: when a cross-module signal fires, the FIRST thing to confirm is **which repo owns the screen** — locate the `.xhtml` (Glob across etanah-pelupusan / etanah-common / etanah-awam; a `target/…/overlays/etanah-common-*.war/` hit = common) BEFORE deep-tracing any one module. **Banned**: writing "ownable-<module>" in the quest MD before the screen's repo is confirmed by file location.

**2. PRIORITY signal → flag at the top.** "PROD" / "urgent" / "segera" / "ASAP" / near due-date / "priority" → mark it in the ticket list + quest MD so the important one isn't buried.

**3. BA-CLARIFICATION-NEEDED → surface ASAP so みや can ask BA immediately** (added 2026-08-18 per みや). At intake/Phase 0, if the fix depends on any answer only BA can give (ambiguous expected output, scope = one app vs all affected, which record is the real one, intent behind a requirement), DRAFT the question and hand it to みや up-front — do NOT sit on it until Apply. **Why** (みや 2026-08-18): a BA round-trip has multi-day latency, so an unasked question discovered late stalls the whole ticket; the same urgency as the cross-module alert (#1). みや: *"if we need to ask clarifications from BA, we need to do it as quickly as possible. The same if it involves other modules… Put these 2 factors as priority and always checked."* → **Both #1 (cross-module) and #3 (BA-clarification) are ALWAYS-CHECKED at intake, every ticket, and surfaced together as the first decision for みや.**

**Emit shape**: the quest MD's FIRST line (and the ticket-list row) carries `🚨 CROSS-MODULE? <signal quoted>` and/or `⏫ PRIORITY <reason>` — or an explicit `module: <confirmed-repo> · priority: normal` when the scan is clean. Silence is banned; an explicit "clean" is the only valid empty.

**Why** (QA-274318, cost days): the BA note said verbatim *"Please help to check first if this is our issue or Common issue, if this is issue from Common, can pass this tic to them."* I ignored the signal, wrote "ownable-pelupusan" in the quest MD, and traced three pelupusan forms before discovering the real screen (`UtilitiKemaskiniUlasanJPPHForm`) is **etanah-common**. We handed to COMMON far too late. Distinct from the Scout-time BPMN module-scope check (pelupusan vs teknikal) and from [[feedback_cross_module_handoff_artifact]] (the handoff deliverable) — this is the INTAKE-time detection that must fire before either. Deterministic upgrade (a `ticket-gate.js` keyword scan) proposed for the weekly audit.

---

## Merged 2026-10-04: feedback_spoc_branch_freshness (was feedback_spoc_branch_freshness.md)

> 🚨 Local E:\\Projects\\Melaka\\etanah-spoc-hasil checkout is a Perak-merged `master` (stale for Melaka); deployed Melaka SPOC = origin/mlk/stag-env (STG) / mlk/int-env / mlk/release/x — read via git show/grep on the remote ref, and verify branch freshness before ANY \"0 hits in SPOC\" negative

The local `etanah-spoc-hasil` working tree is NOT Melaka code. On 2026-09-02 it sat on `master` at a 2026-08-13 Perak release merge (pom 0.1) with zero Ganti Hari UI, while STG ran Melaka SPOC from `origin/mlk/stag-env` (pom 3.0.0) which has the full PRBB Ganti Hari counter page (`MelakaStrategy.java` radio 1 Baru / 2 Ganti Hari / 3 Langkau Tahun, `protected/mlk/perserahan/component/maklumatPerserahan/MaklumatPermohonanJenisDanTujuanPermitPRBB.xhtml`).

**Why:** I asserted "SPOC has zero Ganti Hari code" and "SPOC saves nothing" from the stale local tree and built a whole SPOC handoff on it. A grep negative is only as good as the branch it ran on.

**How to apply:**
- Before any SPOC claim: `git -C E:\Projects\Melaka\etanah-spoc-hasil fetch origin '+refs/heads/mlk/*:refs/remotes/origin/mlk/*'` (read-only, no checkout — spoc is never-edit), then `git grep -n <pat> origin/mlk/stag-env -- src` and `git show origin/mlk/stag-env:<path>`.
- Pick the ref by env: STG = `origin/mlk/stag-env`; internal = `origin/mlk/int-env`; a release = `origin/mlk/release/<x>`. State the ref in every cite.
- Emit the branch + last-commit date of whatever tree a negative was grepped on. A "0 hits" without that line is not evidence.
- Same discipline for etanah-awam / etanah-pelupusan: `git branch --show-current` + `git log -1` before trusting a negative.

Related: [[feedback_module_edit_boundary]] · [[Verify before claiming during code tracing]] · [[feedback_verify_before_claim]]
