---
name: feedback_adhoc_to_ticket_reread
description: 🚨 A chat-paste adhoc is NOT the ticket — the moment it has a Redmine number, redmine-sync + READ the full official 0. Brief (Description + every History journal line + every attachment) before treating it done; the BA's real ask often lives in the journal, not the paste
metadata:
  type: feedback
---

🚨 A BA chat paste is the SYMPTOM, not the ticket. The moment an adhoc gets (or is found to have) a Redmine number, **STOP and pull the official ticket**: `node quest/redmine-sync.js <n> --create`, then READ, in the official Task folder's `0. Brief/`:
1. `Description.txt` — the raised issue.
2. `History.txt` — **EVERY journal line**. The BA's actual question is frequently a later journal note, NOT the initial paste (the paste only carries the error page).
3. **EVERY attachment** — screenshots (open the image · multi-dim-evidence), videos (extract frames · watch-video-url-first), PDFs (annotations skill). One line per file.

**Why (2026-09-07, #278580, per みや)**: PT `PTMLK/02/L/PT/2026/3` came as a chat paste of the NonUnique error page. I built the adhoc from the paste, fixed the crash (3 duplicate Minit Bebas docs), and archived it. But the official ticket #278580 folder (created later) carried a History journal line from the BA (Nurhafizah): *"kenapa id pergi ke Penyediaan Surat Tangguh? Supposed selepas Pengesahan Minit Bebas ke Penyediaan Surat Tolak"* + *"Related #274510"* — the REAL question, plus a screenshot and a WhatsApp video, all unread. I even retrieved the ticket number via redmine-sync and confirmed it, but never read the Brief. The crash was only half the ticket.

**How to apply**: adhoc→ticketed is a hard checkpoint. Before declaring ANY ticketed adhoc resolved, emit a Brief-read ledger: `Description ✓ · History N journals ✓ · <each attachment> ✓`. A ticket is done only when EVERY BA-stated ask (paste AND journal) is answered — [[feedback_show_evidence_script_or_code]], objective-lock anchor #1 (BA words are ground truth). Pairs with [[feedback_watch_video_url_first]] + the annotations/multi-dim-evidence gates.

**Related**: when the permohonan has been Alter-ed, routing/populated data may be stale — see FLOWABLE-KNOWLEDGE.md §Altered-permohonan-staleness.
