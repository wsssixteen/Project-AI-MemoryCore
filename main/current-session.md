# Current Session

## 2026-08-06 17:51 → 19:4x — 273461 CLOSED, AND THE RESUME RULE CAUGHT A SHIPPED FIX I DID NOT KNOW EXISTED

**One ticket end-to-end: quest → fix → commit → deploy → patch handed to the release team. The rule
みや asked for at the start of the session paid for itself on its first run, and a census of PROD
stopped a patch that would have erased 746 migrated licences.**

### ▶▶ NEXT SESSION — START HERE

| Priority | Ticket | State | First step on resume |
|---|---|---|---|
| — | **273461** | **Phase 1 closed** · `93bf7168b4` · int-env `67e49daecd` | Phase 2 archive only. At release: confirm the release team ran `patch-273461.sql`, then re-verify PROD |
| **1** | **273455** | Phase 0 — **fix already in みや's working tree, uncommitted** | `PelupusanService.java` carries a PT sempadan fallback (praHakmilik → VO when App sempadan empty). Not mine; audit it, then quest it properly |
| **2** | **273460** | Phase 0 | needs the TRG blast-radius check |
| **3** | 273465 · 273707 · 273921 · 273956 · 274136 · 274182 · 274318 | not drafted | board ranks by working-days elapsed |

### What shipped — 273461

```
MlkPengiraanBayaranLesenForm.performCustomSave():646-650
    if (!PelupusanUrusanConstant.URS_PLPS.equals(urusanCode)) { …allocate + promote… }

code → mlk/esokongan/273461 @ 93bf7168b4 → mlk/int-env @ 67e49daecd
data → patch-273461.sql attached to Redmine (release team runs it) — git CANNOT see this channel
```

### The three findings that mattered

| # | Finding | How it surfaced |
|---|---|---|
| 1 | A fix for this ticket was **already committed and pushed** (`8bd34da47c`, 08-04) — the qa_doc said *"Phase 0 only. No code changed."* | the new resume rule's existing-fix probe, on its first run |
| 2 | The shipped guard carried an **unreachable** `\|\| PYB4AE` arm — PROD shows skrin 338 mounts on 21 PLPS tugasan, never on PYB4AE | one `ind_langkah` query |
| 3 | "PLPS holds a No Lesen and never reached 4Ae" = **749 rows, 746 of them migrated legacy** (`MIGRATOR_*`, formats `M 003` / `192055`). Real scope: 3 | census before scripting, not after |

Also: `PYB4AE` has **never occurred in PROD** — 0 of 38 PLPS tugasan ever recorded. The fix is right per
BA, but PLPS carries no No Lesen until the workflow first runs that far. Recorded as a deferral.

### Behaviour

**Two emit-shape corrections in one turn on the same card.** The deploy card opened with two local git
steps a server-side deploy never reads (*"your commands seems useless"*), then the evidence block was a
table + commit log + code fence when he wanted `mlk/xxx/xxx → branch`. Same family as the 07-20 hand-off
card. Both fixed in `deploy/SKILL.md`; slip `emit-shape-not-copyable`.

**My own manifest tool false-flagged our uploads.** `ticket-load-verify.js` only searched `0. Brief/`, so
the patch script and test video in `2. Fix/` failed its integrity check as ghost attachments. Fixed to
search the whole task folder. Slip `ticket-source-skipped`.

**Two copies of the same qa_doc.** I edited the durable main-repo one; the deferrals gate reads the
worktree's, which was a stale 08:25 snapshot. Same `${CLAUDE_PROJECT_DIR}`-is-the-worktree trap as the
skill edit earlier in the session — hit twice in one evening.

**He asked for conditions, not literals.** The patch was a hardcoded 3-number list; he asked *"can we not
hardcode it? We know the conditions already right?"* Rewriting it by predicate also killed a bad
condition of mine — `created_by='SYSTEM'` is incidental, the same code path stamps the officer's login.

## 2026-08-06 — A PROD PATCH SHIPPED, AND EVERY CLAIM I MADE ABOUT IT WAS WRONG ONCE FIRST

**#273837 is patched and verified on PROD. Getting there took four separate corrections, three of
them みや's, and the adversarial familiars refuted 3 of my 4 load-bearing claims from yesterday.
The patch itself is one DELETE and one INSERT.**

### ▶▶ NEXT SESSION — START HERE

| Priority | Ticket | State | First step on resume |
|---|---|---|---|
| **1** | **273956** | Nothing started — the other patch ticket | BA asks for a **workflow rollback**, not a data patch: alter `PTMLK/03/L/PRBB/2026/10` back to *Penyediaan Surat JT dan Ulasan YB*, reset the doc, then patch 5 JT + 1 YB. BA gave the agency **kods** (6002, JPDSNM, MBAG, 6021, 1888) — better than 273837 where I resolved by address. The unit change METRIK TAN → METER PADU is the **officer's own UI work afterwards**, not ours |
| **2** | **273921** | Rubric, Apply-ready | Same application as the 273837 patch — retest on the repaired data. Word: `syaratKelulusan` control onto its own paragraph, then delete + regenerate |
| **3** | **273461** | Phase 0, 90% | Guard `etanah-pelupusan\...\web\form\utiliti\mlk\MlkPengiraanBayaranLesenForm.java:647` **and** `:648` with a `URS_PLPS` check. ⚠️ paths from the concurrent session's notes, unverified by me |
| **4** | **274136** | Phase 0, active | Two defects, **order matters** — `remove()` first would destroy data |
| — | **273919** | Shipped | Deploy card owed: `ssh app@172.16.100.162` → `cd deployment-scripts/mlit` → `./deploy-awam.sh` → branch `mlk/int-env` |
| — | **ADHOC A9** | Handed to infra | Gantung patch on `PTMLK/02/L/PT/2026/3`; then shahniza opens the tugasan and clicks Hantar |

### #273837 — what shipped

```
umm_a_jabatan_teknikal, aplikasi_id 3396320   (PTMLK/02/L/PPTPB/2026/1)

  before  5439 Jasin(29899) · 5441 Alor Gajah(—) · 5442 TNB(—) · 5443 Pertanian(29896)
          5440 MISSING FROM THE SEQUENCE  ← the officer's accidental delete

  after   5439 · 5442 · 5443 · 6717 Pegawai Penyelaras · 6718 JPBD · 6719 JKR
          6 rows, matching Idris's list
```

Applied 2026-08-06 17:20:08 PROD. `created_by = norlina@melaka.gov.my`, no session fingerprint.

### The four corrections, in order

| # | What I said | What was true |
|---|---|---|
| 1 | "Cetakan Dokumen" = the printed document, so the document is correct and the data is stale | **みや**: it is a **tugasan** (`CT_BSC_PLP`, `tgsn_id 5134766`), Selesai 2026-07-01 12:28. Two *screens* disagreed, not document-vs-data |
| 2 | "Regenerate the letters" as step 3 | Harmful — PSJT is `Selesai`/`flag_aktif=N` so it is unreachable, and regenerating before the patch would destroy the only correct copy |
| 3 | "The SQL is verified, send it" | `ERROR 21000` — `rjk_agensi` holds **two** rows named `MAJLIS PERBANDARAN ALOR GAJAH` (agensi 6 org 1104, agensi 8 org 1106). I had checked uniqueness on the INSERT's three names and **not** on the DELETE's scalar subquery |
| 4 | "Nothing functional gates on Gantung — display only" | `DashboardService.java:1829-1851` **early-returns**, so the langkah never opens. My grep had `\| head -20` and the 20 visible lines were all constant declarations |

Every one of those was caught by みや noticing, not by a gate.

### Yesterday's claims, audited by 4 opus familiars

| Claim | Verdict |
|---|---|
| Mukim = Rim not Kesang | ✅ CONFIRMED — but my evidence was a frequency coincidence; the real proof is `HakmilikFormatUtil.java:342-352` + the `ind_hkmlk` FK |
| Permohonan ID not stored, recovered by timestamp-matching | ❌ **premise destroyed** — `umm_aplikasi.id_pengenalan` holds it verbatim, and `DATABASE.md:970` **already said so** |
| Init-alter page cannot touch `status_proses` | ❌ REFUTED — it can, via `bypassPermohonan()` → BPMN service task → `processDalamProsesAplikasi()` |
| The two PNGs are orphans, explaining the 51 MB | ❌ REFUTED — my regex assumed `Id=` before `Target=`; the file has them reversed |

### Behaviour

**The `id_pengenalan` miss is the worst of the day.** `DATABASE.md` documented it at two places before I started; I never opened the file, spent ~8 queries getting the opposite answer, told みや three of four applications "have no permohonan ID" (all four do), then wrote the **contradicting** claim into that same file during yesterday's DE. Corrected, and the section now opens with why it was wrong.

**Slips**: `knowledge-file-existed-but-not-consulted` · `name-vs-contract` · `filtered-evidence-read`.

## 2026-08-05 11:51 → 22:15 — THE BOARD GOT BUILT, 273919 SHIPPED, AND THE 51 MB FILE GOT MEASURED

**Most of the day went into making the open-ticket list something that loads the same way every
boot instead of something I compose by hand. Then one ticket shipped end-to-end, and the biggest
open question — why a Word document hangs — turned out to be answerable with a byte count.**
## 2026-08-06 11:48 → 19:40 — 273455 SHIPPED, AND THE PICTURE THAT SETTLED IT HAD BEEN UNOPENED FOR THREE DAYS

**QA-273455 went Phase 0 → int-env in one session. The two things that moved it were both things I
had not looked at: four of six BA attachments no prior pass had opened, and みや's question "it should
self recover right?" — which disqualified the fix I had already built and compiled.**

### ▶▶ NEXT SESSION — START HERE

| Ticket | State | First step on resume |
|---|---|---|
| **273919** | **Phase 1 CLOSED** · commit `434f4ae4af` · int-env `ed595a9018` | Phase 2 archive hygiene only. Put it on the Redmine planned-release list |
| **274046** | infra request pending | Open `LAIN-36832946` when infra delivers it — expect orphaned images. Or size-check stg1 `/2026/14` to test the theory without waiting |
| **273921** | Rubric, Apply-ready | Word: `syaratKelulusan` control onto its own paragraph, then **delete + regenerate** the doc |
| **273455 · 273460** | Phase 0 | 273455 blocked on pinning Defect 1's write site; 273460 needs the TRG blast-radius check |
| **273465 · 273461 · 273621 · 274136 · 273837 · 273956** | not drafted / ledger contradicted | 273461+273621 were closed locally as "not our work" but Redmine has them on みや. Redmine wins |

### The board — `quest/redmine-board.js` + `/list-redmine`

Boot no longer tells me to go query Redmine; `open-quest-surfacer.js` **executes** the board and
prints it. Every cell comes from the live API or `quest/active.txt`; I paste, I do not compose.
Three runs byte-identical, eval 13/13.

| Decision | Why |
|---|---|
| 4 unioned passes, one of them **unscoped** | `#273919` is `Module=Awam` — a pure `cf_17=Pelupusan` filter dropped みや's own Apply-ready ticket. The unscoped `assigned_to_id=me` pass also catches another state's project |
| Exclude by version→**project**, never version name | `fixed_version.name` returns only `1.5.1`; two live versions are both named `1.0.13`. #273214 is `Module=Pelupusan` on `MLK_04_SPOC_Hasil` — only the owning project reveals it |
| `Days` = **working days** | Verified against Redmine's own SLA: #274046 reported 05 Aug → due 14 Aug = exactly 7 working days. On calendar days that span is 9, which matches nothing |
| `State` read from `board_state=` | The one column I hand-filled was the one that rendered differently every boot |
| Every exclusion prints its rows by number | A filter that goes wrong must be visible next boot, not silently shrink his board |

### 274046 — the measurement, not the theory

The BA gave both arms of a natural experiment and I nearly read the second video as decoration.

```
WORKS   staging  /2026/14   surat opens, 5 pages    stg1 SuratYB.docx 4–5 Aug: 757 KB – 3.7 MB
FAILS   PROD     /2026/8    spinner never clears    LAIN-36832946           51,047,043 bytes
```

Environment is not the discriminator — stg1 and PROD have near-identical all-time distributions
(256 docs each, avg 6.5 / 8.0 MB). The document is. And みや's downloaded staging Kertas
(`LAIN-36730129`) showed the mechanism in miniature: **two byte-identical 276 KB "Visit Melaka"
PNGs, referenced by no part of the package** — 89% of a 620 KB file, invisible in Word.

### 273919 — shipped

One line, `AwamSemakanKewujudanRizabForm.xhtml:41`, ternary on `urusan.kod` copied from
`AwamSemakanKewujudanHakmilikForm.xhtml:448`. BPRZ takes the else-branch byte-identical, which
matters because BA certified BPRZ clean. Both screenshots passed.

### Behaviour

**He had to ask for a username again.** I emitted a full Test Scenario — env, file, two steps — with
no login. The login rule is officer-shaped (`umm_a_tgsn` → `pcp_pengguna`); AWAM has no tugasan so
it never fired and nothing replaced it. Built `test-scenario-login-gate` (Stop, blocks, 6/6) which
keys on the login itself, and the block message names both derivation queries.

**Four re-asks on reply length**, ending in profanity. He wanted `"Hi infra, need to download…"` plus
paths; I gave verdict tables and caveats. `/i-have-adhd` installed and turned on late in the day.

**My own commit-gate cost him real time.** He said "proceed", then demanded the merge in caps — the
gate accepts neither phrase, so the commit sat blocked while he waited. I did not widen the phrase
list (a gate that accepts "proceed" is how an unapproved commit slips through) but the friction is
real and unresolved.

| **273455** | **Phase 1 CLOSED** · `a52975fde2` · int-env `3af1ecd2c7` | Phase 2 archive hygiene only. Redmine still **New · 0%** — update it, and put it on the planned-release list |
| **273460** | Phase 0 · UNSTABLE | Test the `tindakan.config.json:698` array fix FIRST. The L1 fix is disqualified as harmful **and** a no-op |
| **273461** | committed by a concurrent session → `mlk/esokongan/273461`, merged int-env `67e49daecd` | Verify with みや whether it is tested; the ledger and the branch disagree |
| **274136** | Phase 0 · 80/70% | 2-minute check: View Source the AWAM dialog for two inputs named `…modalDibenarkanPemilik`. **Fix order is load-bearing** — `remove()` first would destroy data |
| **273921 · 273621 · 273837 · 273956** | Phase 0 / not drafted | unchanged from 08-05 |

### 273455 — what actually decided it

| Turn | What changed |
|---|---|
| Read all 6 attachments | 4 had never reached the qa_doc. `Skrin tugasan …14.jpeg` — the **reported** case — shows Keluasan 967, Tujuan, Perincian all PRESENT, only Sempadan blank. The staging repro shows the **whole** dialog empty. §2 had recorded them as the same evidence |
| PROD timestamp probe | AWAM row 11:10:15 → officer row 13:41:52 → workflow 13:42:34. The officer row predates the workflow by **42 s** — Defect 1 verified on the reported case, not inferred from `created_by` |
| みや: *"it should self recover right?"* | Killed candidate W. W fires only at intake, which already ran for all 51 affected apps, so it needed a maintenance re-trigger. **R needs none.** He was right and I had built the wrong half |
| Audit of R | 18 call sites vs W's 2, incl. 2 TRG forms. Contained with a `URS_PT` gate (138/138 PROD rows are PT). TRG residual left open for him |
| Entry-point trace | The PT branch at `PelupusanExcelReaderHelper.java:674` fills only `maklumatTanahVOList`; the dialog binds the **singular** VO. The fix reaches the screen only via `onKemaskiniPermohonanTanah():4229`. Nearly handed over a test that would have shown nothing |

### Three things I got wrong, in order

1. **`BUILD SUCCESS` on the wrong base.** Compiled on `mlk/master`, declared the deploy ready. `mlk/int-env` already had `praHakmilikList` at `:5109` from another ticket → int-env build broke on my duplicate. A compile on the BASE is not a compile on the TARGET. Second push was verified by compiling **the merge commit itself**. `verified-on-wrong-base`
2. **`rm -rf` proposed on a good workspace.** I read the failed-clone timestamp `19:15` and ignored `target/` at `19:16` — the clone had recovered and a valid 433 MB war from the right commit was sitting there. Disk theory died to one `df -h` (62 G free)
3. **Told みや to run `sudo systemctl start jboss`** on a shared box. `app` has no sudo — same refusal shape as the `journalctl` denial minutes earlier. He pushed back: *"I think we should really avoid doing this."* Right on both counts

Real cause of the deploy failures: **two deploys collided on one JBoss.** Colleague deployed
`etanah-pembangunan` 19:19, ours 19:20, `stop_jboss.sh` hung against a mid-deploy server, systemd
SIGKILLed both. `ExecStart=SUCCESS` + `Result: signal` = stop-side kill, never a startup crash.

### Knowledge banked

- `DEV-TESTING-HACKS.md` — new section: server-side deploy failures are a **different family** from the local Eclipse-publish one (`local-deploy-gate` mis-routed three times today). Carries the 3-host topology, **`fudge1` 172.16.100.49** as the mlit app host, the no-sudo constraint, the collision signature, and the deployment-marker state machine
- `/deploy` skill — server table went 2 hosts → 3; added the diagnose-on-the-right-host, no-sudo and one-JBoss-per-env warnings
- `quest` skill Pre-emit gate — 2 new rows: test base MUST be `mlk/master` at 0 behind with only the fix modified, and env MUST be **derived** from the Spring JNDI binding, never named from memory

### Behaviour

**He questioned the fix choice and was right.** Twice more he questioned a diagnosis and was right —
the sudo call, and stopping me before the `rm -rf`. The pattern from 07-21 held: my confidence arrives
before my evidence does.

**Slips**: `ba-evidence-not-checked` · `test-scenario-wrong-base` · `verified-on-wrong-base` ·
`deploy-collision-not-diagnosed`. **1 proposal** filed (A5 brief-manifest gate).

