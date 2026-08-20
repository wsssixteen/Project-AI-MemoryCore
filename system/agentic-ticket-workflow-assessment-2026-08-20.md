# Agentic workflow assessment — 2026-08-20 (Baseline 1.3.5 incident session)

> DE Step 7.5 ASSESSMENT. Each claim carries its instance. Proposals logged via core/slips.js (3× A2 this session).

| Axis | Finding (with instance) |
|---|---|
| A1 agentic system | No fan-out used — single-loop release ops. Correct call: every failure was judgment-at-the-controller, not coverage. |
| A2 quest workflow (release) | **Failure class: word-over-source.** Twice set common from a WORD (BAQA chat "1.2.1"; recon "1.1.24") when the previous release branch was checkable truth (1.1.17). Fixed mechanically: `runCompatGate` + `assertMasterReflectsPrevRelease` + `unmerged-release-boot.js` (found stranded 1.0.0/1.0.7 on first run) + push-gate v2 (PowerShell + master-ban + `git -C` birth-defect regex). Evals 26/26 + 12/12. |
| A2 (2) | **Failure class: substituted-own-plan.** miya stated his recovery sequence twice (1.3.4 first, then 1.3.5 on top); I counter-proposed 1.3.6/merge-after across 3 turns. Slip `instruction/substituted-own-plan`. No mechanical fix exists; ledger escalation owns it. |
| A3 debugging | Agihan-Kepada trace: 2 WRONG answers shipped before the right one (config-table theory; "0 active PPD" from `flag_aktif = true` vs 'Y'). Evidence class that caught both: control queries (per-office count; variant without the failing filter). Lesson instance: a 0-count query needs a positive control before it is evidence. |
| A4 etanah knowledge | NEW reusable facts this session (bake candidates below): DB-Version = `rjk_parameter_sistem` kod `V_DOMAIN`; footer stack Module→Common→Domain vs DB; common-version↔etanah-domain map (1.1.17/1.1.24→1.0.4, 1.2.1→1.0.5); Agihan-Kepada = peranan-per-tugasan (`MlkPelupusanPegawaiAgihService.java:268`) × capaian chain (`pcp_capaian_pengguna→pcp_capaian_modul→pcp_capaian_jns_ursn→pcp_capaian_ursn`). |
| A5 sweep | N/A — no multi-ticket sweep this session. |

## Proposals (all logged with eval cases via core/slips.js)
1. Pin `runCompatGate` + `assertMasterReflectsPrevRelease` inside release-prep eval.js (two-repo fixture). [logged]
2. (built same session, closing rows) `status --verify` + master push-gate. [logged as built]
