# Current Session

**Last Activity**: 2026-09-21 18:20 — Domain Expansion close (patch/eSOKONGAN sweep + Redmine reconcile).

## Working Memory
- **Focus tickets for tomorrow (みや's plan list)**: 280614 (send to infra), 280099 (run Alter on page), 280540 (build code fix).
- **Melaka DB**: reconnected mid-session (was CONNECT_TIMEOUT at boot); postgres-mlkprod live (`etprdmlk`).
- **Canonical-formats rule**: never invent handoff/reply shapes — use infra-handoff + SCRIPT-CHECK + close-phase verbatim (`feedback_use_canonical_formats_never_invent`).

## Session Recap (2026-09-21)
- **Board + reconcile**: みや 0 open; reconciled active.txt vs Redmine → **31 quests closed** (Redmine-done); 3 missing synced (265109/274323/246923).
- **280265** PT Patch Status JT — JPPH row 7547 `generateSurat` TIDAK→YA, PROD-applied + live-verified, closed in Redmine. `.sql` in `218…/2. Fix/`.
- **280614** MLPS Tempat ×2 — 4 rows live-verified, `280614.sql` built+stamped+sent; awaiting infra send + prevention-half decision.
- **280099** PT Alter Ke Kemasukan — live proc CT_BSC_PLP, Alter Flow → SKM (`MLK_PLP_PT.bpmn20.xml:7`); awaiting page execution.
- **280540** PPTPB formula — `PelupusanMaklumatBayaranHelper.java:276` unconditional multiply; fix = `PLP_BANGUNAN_*` flat-rate guard (not built).
- **280166** PLPS Hantar error — `caraPenghantaran` unset → gateway NPE; fix = set real delivery value (NOT flat literal); Ammar/cross-module owns.
- **New-ticket Recon (qa_docs written)**: 265109 (config-data gap), 246923 (config dedup ~9 lines), 274323 (force RM0.00), 279411 (add guard to MlkSenaraiSemakPTGForm), 275043 (Aaron's v2 verify).

## Deferred to follow-up
| Ticket | Next action | Owner |
|---|---|---|
| 280614 | send hand-off to infra + decide prevention UPDATEs | みや |
| 280099 | run Alter Flow on the page, tell Ruri result | みや |
| 280540 | build `PLP_BANGUNAN_*` guard, branch+test | Ruri/みや |
| 279411 | patch MlkSenaraiSemakPTGForm.java:839 (Ammar's fix gap) | Ammar |
