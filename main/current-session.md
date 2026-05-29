# 🌟 Current Session Memory - RAM

> **AGENT_STATE discipline (Task #14)** — strict template: High-Level Objective · Current Progress · Active Context · Blockers · Immediate Next Steps. Read at boot; updated at session end (DE Step 2).

**Current session**: 2026-05-29 (Fri, ~10:49 MPST) — **QA-262495 investigation** (PPJK Semakan Risalat MMKN-PDT, Kemaskini "loading too long"). Worktree `claude/blissful-williams-767a8d`. Long multi-resume debug; root cause NOT confirmed but TOP LEAD reframed at the very end. Ticket being passed back.

## High-Level Objective (AGENT_STATE)
Find why PPJK SRMMKNPDT Kemaskini hangs. Could not simulate cleanly today; みや passing the ticket back. Deliver solid evidence first.

## Current Progress (AGENT_STATE)
- **Root cause UNCONFIRMED. TOP LEAD (after みや's 2 end-corrections) = SERVER RUNTIME STATE, not the document.** みや: after a **JBoss restart, Kemaskini opens fairly quickly.** → it was stuck/exhausted thread pool / leaked Word-automation process / memory pressure that the restart cleared — NOT the doc, template, or code path. Fits: task-5 ~2000s CPU on a PARKED worker + `awaitTermination(Long.MAX_VALUE)` no-timeout (PelupusanTemplateUtil:125) + "stuck not erroring" + intermittent/only-after-uptime.
- **Ruled out across the session (all by comparison/test):** document content (opens fine in Word), rahsia gate (bypass on, still hung; git: gate added 2026-03-18 #246061, ~2mo before ticket), etanahv2/v3 (v3 client fired+fetched), server-stream, stale-doc, generic structure, **data/images (template has NO images — a:blip=0)**, numbering bloat, and the `CompressDocxImages` commit (600a0f1e97 — real recent etanah-common change BUT no-op on image-less docs → demoted).
- Two agents traced the full server path: Kemaskini → editor callback → onRefreshDokumen → refreshDokumenList → regenerate docs + Jasper reports concurrently (awaitTermination MAX_VALUE).

## Active Context (AGENT_STATE)
- Quest QA-262495 status=active (NOT closed — being handed back to etanah-common/Aaron).
- **Local dirty state (etanah repos) — revert before any keep-build:** (1) rahsia bypass active on `…\deployments\etanah-pelupusan.war\…\penyediaanDokumen.xhtml` (restore from `.bak_2026-05-28_pre_rahsia_bypass`); (2) profiling markers `QA262495-PROFILE` in etanah-pelupusan `BasePelupusanDokumenForm.refreshDokumenList()` (uncommitted; revert). みや restarted JBoss (may have wiped the exploded-deployment bypass — re-check next session).
- etanah-common reconnected to git (`ssh://git@172.16.93.167/etanah-common`).
- Full evidence trail in `projects/coding-projects/active/QA-262495/QA-262495.md` (★★ TOP LEAD block at top).

## Blockers (AGENT_STATE)
- Couldn't get a clean controlled reproduction (rahsia gate, editor-not-opening, no simulation time). Needs: reproduce on a long-uptime server + watch thread-pool/WINWORD/heap.

## Immediate Next Steps (AGENT_STATE)
1. **Next session: start from the SERVER-RUNTIME-STATE lead** — reproduce on a server that's been up a while; monitor thread-pool saturation + leaked WINWORD.EXE + heap; candidate fix = timeout on `awaitTermination` + stuck-worker/Word cleanup. NOT a per-document/template fix.
2. Clean the 2 local dirty-state items before any keep-build.
3. Handback note (Redmine-ready) is in QA-262495.md — but note the compress-commit angle is demoted; lead with the restart-clears-it / runtime-state evidence.

## 🎯 Session Recap (for AI restart)
1. QA-262495 Kemaskini hang: NOT the document (opens fine in Word; restart makes it quick). Top lead = server runtime state (stuck thread pool / leaked Word proc / memory), cleared by JBoss restart.
2. I burned many rounds anchoring on the document through ~6 falsified hypotheses; みや repeatedly pushed me to step back. The restart clue (his, at the end) reframed it to runtime-state. Lesson logged.
3. Ticket being passed back. Evidence saved in QA-262495.md.

**Memory Type**: RAM | **Last Activity**: 2026-05-29 ~10:49 MPST — QA-262495 paused (handback); top lead = server runtime state.
