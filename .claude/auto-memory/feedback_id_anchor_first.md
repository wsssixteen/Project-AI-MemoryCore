---
name: feedback-id-anchor-first
description: "Any aplikasi_id/permohonan/doc id used in a DB chain must be anchored to its permohonan FIRST, and contradicting filenames/urusan in results are a HARD STOP"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 7c540add-e64f-489b-ac23-e1fa110ce5a2
  modified: 2026-08-03T10:43:06.035Z
---

🚨 Before running ANY DB chain keyed on an aplikasi_id / p_aplikasi_id / doc id — even one みや pasted — resolve and ECHO the anchor first: `SELECT aplikasi_id, id_pengenalan FROM umm_aplikasi WHERE …` and show `<id> = <PTMLK/...>` in the reply. If the echoed permohonan ≠ the ticket's, STOP and surface before any further query.

**Why:** 2026-08-03 QA-272943 — ran the whole pelan chain on 3411621 (an MCL app, QA-272499's) for a PPJK ticket because みや's pasted query carried that id; my own result rows said "borang permohonan MCL yunus.pdf" and I still didn't stop. Two wasted rounds + wrong pelan paths handed over. Same family as [[feedback_pengguna_semasa]] (ID never travels alone) and assume-not-verify (17/14d 🚨).

**How to apply:** (1) anchor query first, echo id↔permohonan pair; (2) treat any urusan/filename in result rows that contradicts the ticket's urusan as a circuit-breaker — name it, don't continue; (3) paths handed to みや for upload/infra must come from rows on the TARGET environment, never assumed portable across envs.
