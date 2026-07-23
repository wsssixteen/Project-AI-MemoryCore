---
name: reference_esokongan_branch_shape
description: "eSOKONGAN release tickets don't always live on mlk/esokongan/<num> — verify each branch with git ls-remote, never trust the tracker→branch-shape guess"
metadata: 
  node_type: memory
  type: reference
  originSessionId: e922cc0d-184e-4aef-a55d-41e2e95d15ee
  modified: 2026-07-23T08:44:51.341Z
---

During a Pelupusan baseline release, the `release-mlk-plp` recon maps each ticket to a branch by
tracker (eSOKONGAN → `mlk/esokongan/<num>`). This is a HINT, not truth.

**Proof (release 1.0.11, 2026-07-23)**: eSOKONGAN **#271639** was pushed by Aaron as
**`mlk/internal/271639`**, not `mlk/esokongan/271639`. The recon script's shape-guess found only an
unlabelled merge commit; `git ls-remote origin '*271639*'` found the real branch `eb7aa14c4c`.

**Rule**: always resolve the real branch with `git ls-remote origin '*<num>*'` before setting the
merge list. The skill already says "verify each against ls-remote, never assume" — this is the
concrete case that proves why. See [[reference_baseline_release_servers]].
