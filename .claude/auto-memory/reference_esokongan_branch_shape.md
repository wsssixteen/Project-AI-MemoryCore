---
name: reference_esokongan_branch_shape
description: "eSOKONGAN release tickets don't always live on mlk/esokongan/<num> — verify each branch with git ls-remote, never trust the tracker→branch-shape guess"
metadata: 
  node_type: memory
  type: reference
  originSessionId: e922cc0d-184e-4aef-a55d-41e2e95d15ee
  modified: 2026-07-24T09:45:44.375Z
---

During a Pelupusan baseline release, the `release-mlk-plp` recon maps each ticket to a branch by
tracker (eSOKONGAN → `mlk/esokongan/<num>`). This is a HINT, not truth.

**Proof (release 1.0.11, 2026-07-23)**: eSOKONGAN **#271639** was pushed by Aaron as
**`mlk/internal/271639`**, not `mlk/esokongan/271639`. The recon script's shape-guess found only an
unlabelled merge commit; `git ls-remote origin '*271639*'` found the real branch `eb7aa14c4c`.

**Rule**: always resolve the real branch with `git ls-remote origin '*<num>*'` before setting the
merge list. The skill already says "verify each against ls-remote, never assume" — this is the
concrete case that proves why. See [[reference_baseline_release_servers]].

**Second failure mode — the ticket may have NO branch at all (release 1.0.12, 2026-07-24)**: Internal
Issue **#272302** was the only ticket on BAQA's list, and no branch for that number exists anywhere.
Recon returned `VIA-RELATED` → related **#270916** (eSOKONGAN), whose `mlk/esokongan/270916` carried
the fix, unmerged in master and every release. みや's ruling: *"the 270916 ticket is under awam even
though the fix had both awam and pelupusan — for our side we put it under this ticket's release."*

So a released ticket number and the branch that delivers it need not correspond at all: the branch
can sit under a **different ticket**, filed under a **different module's** tracker, when one fix spans
awam + pelupusan. Confirm coverage by reading the branch's file list against the ticket's symptom
(here: `mlkMaklumatTanahPermit.xhtml` / `mlkMaklumatTanahV3.xhtml` vs *"Langkah Maklumat Tanah"*),
then get みや's nod — never infer it silently.
