# Agentic ticket workflow assessment — 2026-10-07 (session: #244600 Phase 2, worktree "ticket-244600-review-89e02d")

| Axis | Claim | Instance |
|---|---|---|
| A1 agentic system | The close tools worked as built the day before | `save-quest` printed WAIT; the archive tool refused until the harvest section and every wrong-fix verdict existed |
| A1 agentic system | Two Stop gates read an investigation reply as something else | "not ours" (meaning not caused by our fix) was read as a hand-off to another team; a permohonan named as a reference was read as a test hand-back |
| A2 quest workflow | A colleague's change taken over as "the same text" skipped the Rubric question | Peraku rise `3aa68917eb` applied on 2026-10-06 with no check of what decides the rise; miya found it a day later |
| A3 debugging | The document store gave a full timeline with no server log | 18 `Notis 5A.pdf` rows in `et_dms_mlit.dokumen`, 09:27:46 to 09:34:26, matched to three task windows |
| A3 debugging | File size was enough to pick the no-change case | Ringkasan Risalat versi 1, 3, 4 all 34115 bytes |
| A4 etanah issue-solving | Reports and Word documents share a screen and a versi column but not a writer | `PelupusanReportService.saveLaporan` vs `PelupusanDocumentService`; 13 report documents affected |
| A5 sweep | Not used this session | A5 ⏭ single-ticket session |

## Proposals logged (each with an eval case, in `system/slips.jsonl`)

| Axis | Idea |
|---|---|
| A1 | ownership gate: "not ours" next to "our fix / our branch" is not a hand-off |
| A2 | taken-over commit check: a colleague's change applied onto our branch gets a "what decides it" row before the commit |
| A3 | document timeline helper: list store files of one document by time against task windows |
| A4 | report versi: no new versi when the report text did not change (LATENT-BUGS L24) |
