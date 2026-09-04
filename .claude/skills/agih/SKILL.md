---
name: agih
description: Diagnose why an etanah tugasan is unassigned or assigned to the wrong officer, and decide whether the fix is a capaian grant, the Pengagihan Semula screen, or a DB patch. Triggers — "/agih", "/agih PTMLK/01/L/PSBS/2026/1 SKM iskandarz@melaka.gov.my", "patch user for this id", "can help to patch user", "assign this tugasan to X", "tugasan tak masuk dalam senarai dia", "task not showing in his dashboard", "agihan tugasan salah", "why is this task unassigned", "pengguna semasa kosong", any BA/colleague request to move a task to a named officer.
---

# agih — tugasan assignment diagnosis (Melaka)

`/agih <permohonan-id> <tugasan-kod> <user>` `[env]`

`/agih PTMLK/01/L/PSBS/2026/1 SKM iskandarz@melaka.gov.my mlit`

**Output = a verdict, not a script.** The script comes only when みや asks for it.
No conversation, no options, no essay.

---

## 0 · The rule this skill exists for

**A "patch user" request is an eligibility question, not a patch request.**

Assignment is role-based: the app resolves a POOL of eligible officers, then picks one.
If the pool is empty the task sits unassigned — and patching `umm_a_tgsn` does not help,
because the task list also filters by capaian.

> Patch the row and the officer owns a task he cannot see.

**Why** (2026-07-28, `PTMLK/01/L/PSBS/2026/1` SKM): BA asked to "patch user = iskandarz@melaka.gov.my".
The agihan log showed the app had ALREADY been handed `AgihanKepada=iskandarz@melaka.gov.my`
and refused it — `capaianPenggunaList:[]`, because his PLP capaian covers MCL/RPPLP/UPS_PLP
and **not PSBS**. The fix was one capaian grant, not SQL. Same shape as the 2026-07-27
amira PRU dropdown case, where the config screen closed it in under a minute.

---

## 1 · Environments

| みや says | Schema | Host | Reach |
|---|---|---|---|
| `mlit` (usual target for patch requests) | `et_main_mlit` | `172.16.100.197:5444/mkit` | MCP `postgres-mlit-pg`, else direct |
| `stg1` | `et_main_stg1` | `172.30.12.202:5444/mlkstg` | MCP `postgres-mlkstg1-pg` |
| `stg2` | `et_main_stg2` | `172.30.12.202:5444/mlkstg` | MCP `postgres-mlkstg-pg` |
| `trn` (training) | *pending* | *pending* | connection pending — みや to add |
| `prod` | `et_main` | — | READ-ONLY, gated by `domain/prod-db-confirm` |

**Never assume the env.** Ask if not stated; a BA "patch user" request usually means `mlit`.

**MCP down is not a blocker.** If the server did not connect, reach the DB directly —
`Test-NetConnection <host> -Port 5444` first, then a read-only `pg` client in the scratchpad.
Wrap every statement in `BEGIN READ ONLY` / `ROLLBACK`. Never write from the fallback client.

**Queries I run carry the schema prefix** (`et_main_mlit.umm_a_tgsn`).
**Scripts handed to みや carry NO prefix** — he runs connected to the target schema.

---

## 2 · Resolve the row

```
┌─ umm_aplikasi ─────────┐   ┌─ umm_a_tgsn ──────────┐   ┌─ umm_tgsn_semasa ────┐
│ id_pengenalan          │   │ aplikasi_id           │   │ a_tgsn_id            │
│  'PTMLK/01/L/PSBS/…'   │──▶│ tgsn_id  flag_aktif=Y │──▶│ nama_pengguna        │
│  → aplikasi_id         │   │ pengguna_semasa_id    │   │ log  ← THE EVIDENCE  │
└────────────────────────┘   └───────────────────────┘   └──────────────────────┘
```

- The permohonan id lives in **`umm_aplikasi.id_pengenalan`** — NOT `no_fail`, NOT `no_permohonan`.
- **`umm_tgsn_semasa` is the Dashboard entity.** There is no table named `%dashboard%`.
- Expect several `umm_a_tgsn` rows per tugasan kod; only `flag_aktif='Y'` is the live row.

---

## 3 · Read the agihan log FIRST

`umm_tgsn_semasa.log` stores the auto-agihan trace for that exact task. It names the cause
outright. Read it before forming any theory.

| Log line | Means |
|---|---|
| `capaianPenggunaList:[]` · `penggunaSet:[]` | **Pool empty — capaian gap.** The usual cause |
| `Pengguna list is empty, defaulting to pool.` | Task left unassigned deliberately |
| `Final result:null with mode:ROUND_ROBIN_SEMUA` | No officer selected |
| `Params: AgihanKepada=<user>` | Someone already tried to assign this user |
| `Setting nextUser to null because  is not active` | The requested user was rejected upstream |
| `KonfigurasiPengagihanTugasan not found` | No per-tugasan config; falls back to round-robin |
| `history_init_alter` in `maklumatTambahan` | Flow has been altered — count the attempts |

**A `Params: AgihanKepada=<the same user BA is asking for>` line means the request already
failed once through the proper channel.** Say so; do not silently re-do it by hand.

---

## 4 · Eligibility — the four checks

Run all four. Report each with its evidence. A single failing row is the answer.

| # | Check | Table | Fails when |
|---|---|---|---|
| 1 | **User identity** | `pcp_pengguna` | duplicates exist — take `flag_aktif='Y'` WITH a `kod` |
| 2 | **Peranan** | `pcp_capaian_pengguna` → `pcp_peranan_modul` | role absent from `umm_a_tgsn.peranan_semasa` |
| 3 | **Pejabat** | `pcp_capaian_pengguna.pejabat_id` | ≠ `umm_a_tgsn.pejabat_id` |
| 4 | **Capaian urusan** | `pcp_capaian_modul` → `pcp_capaian_jns_ursn` → `pcp_capaian_ursn` | urusan absent for that modul |

**Check 1 is a real trap.** `iskandarz` matched 4 rows on every env — a duplicate set. The live
account is `iskandarz@melaka.gov.my` (`kod` set, `flag_aktif='Y'`); bare `iskandarz` is dead.
**Never resolve a user by `nama` or by a partial `nama_pengguna` match.**

**Check 4 is usually the answer.** Also inspect `pcp_capaian_modul.flag_capaian_penuh`:
if `'Y'` with zero `pcp_capaian_ursn` rows, the user is invisible to every agihan query —
`PlpCapaianPenggunaRepository:27-36` INNER JOINs those rows and never reads the flag.
Known latent defect (2026-07-27, `DATABASE.md` §15), not this ticket's bug.

`peranan_semasa` is dash-wrapped: `-PT-`, `-KPT-KPPD-PPD-`. Match on `-KOD-`, never a substring.

---

## 5 · Verdict

Emit one table. Then stop.

| Verdict | When | Fix |
|---|---|---|
| ✅ **Eligible — use the screen** | all 4 checks pass | Pengagihan Semula. みや runs it |
| 🚨 **Capaian gap** | check 4 fails | Kemaskini Pengguna → Capaian → add the urusan. **Then** re-agih |
| 🚨 **Wrong peranan / pejabat** | check 2 or 3 fails | wrong officer, or tugasan peranan misconfigured. Surface, do not patch |
| ⚠️ **Wrong user record** | check 1 ambiguous | name the correct `pengguna_id`; confirm with BA first |

**Prefer the UI in every branch.** It writes all three tables atomically, is reversible,
audited, and is みや's to run. Offer SQL only when he asks — then §6.

---

## 6 · The patch — only on request

Code owner, `AppTugasanRepository.updateAppTugasanPengguna():217` (etanah-common):

```java
@Query("UPDATE AppTugasan at SET at.asalPengguna = :user, at.semasaPengguna = :user WHERE at.id = :atId")
```

Called from `CommonPengagihanSemulaForm.onChangeAllSelectedPegawai():183`, which also writes:

| Companion | Via | Sets |
|---|---|---|
| `umm_tgsn_semasa` | `DashboardRepository.updateDashboardPenggunaByDashboardId():246` | `nama_pengguna`, `flag_gagal_agih=FALSE` |
| `umm_sejarah_pengagihan` | `SejarahPengagihanRepository.saveAll():195` | audit row `diagih_daripada` → `diagih_kepada` |

**Agih UPDATEs in place — it never inserts a new `umm_a_tgsn` row.** Verified against the JPQL
above and live audit rows: `flag_pengagihan_baru='Y'` when `diagih_daripada='-'` (first
assignment), `'N'` when transferring between officers. `a_tgsn_id` is unchanged either way.

**Set exactly**: `pengguna_asal_id` + `pengguna_semasa_id` (both, same user), and `nama_pengguna`.

**Never set**: `tdkn_oleh` (the owner does not touch it) · `version` · any audit column ·
`peranan_semasa` · `trkh_mula` · `status_tugasan`.

**Script rules** — no schema prefix · **no JOIN** · kod-subquery one table per line ·
no hardcoded PKs · `-- N rows updated` above every statement · a paired evidence SELECT.

Emit a **Stage-Match Block** with every patch — 5 rows: row stage · code owner · column-match ·
FK companions · verdict. A bare `umm_a_tgsn` UPDATE that omits the companions is
⚠️ **revert-shape** — say so.

---

## 7 · Banned

- Emitting a patch script before the four eligibility checks have run.
- Reporting "assigned" without stating that the task list also filters by capaian.
- Never resolve a user by `nama`, or by a partial `nama_pengguna` match.
- Claiming a DB patch fixes visibility. It does not.
- Answering a BA's relayed question with file:line and tables — give みや a **sendable
  plain-language message** alongside the technical verdict.
- Writing to any env from the direct-connect fallback client. Read-only, always.
