---
name: feedback_redmine_rootcause_format
description: "Redmine \"Root cause\" text = CAUSE ONLY, max 2 plain-Malay sentences, no fix line, no jargon/file:line — exemplar from #277532"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1d6e1dc6-9034-4694-8f36-b8edc348cf38
  modified: 2026-09-07T09:52:32.916Z
---

The "Root cause" みや sends to Redmine is **cause only**, what happens and why, **max 2 sentences**, plain Malay, sendable to BA. **NO fix sentence** ("Dah dibetulkan…"), no file:line, no class names, no jargon.

**NEVER use dashes or semicolons** in this text (or any BA-sendable text). Straightforward sentences are fine and need not be grammatically formal. Use commas and periods only. (みや 2026-09-01, generalises to all BA-facing writing, see [[feedback_ticket_writing_style]] + [[feedback_ticket_writing_style]].)

**Exemplar he kept (#277532, short, no dashes/semicolons)**:
> "Di Pengiraan Bayaran Lesen, Tujuan Permohonan ikut kod Maksud Menduduki yang tersimpan. Lain-Lain pun ada kod sendiri jadi sistem papar gabungan lama, bukan teks yang diisi pengguna."

Shape: sentence 1 = the mechanism as it behaves at the screen. Sentence 2 = why the wrong value shows (the edge case). Drop the fix, that lives elsewhere.

**Solution row (2026-09-07, #278585, per みや)**: the hand-back table carries a second row **Solution** next to Root cause, same rules (fix only, max 2 plain sentences, no dashes/semicolons/jargon), because the two Redmine fields are filled together. Exemplar: "Had saiz muat naik Lampiran di Panel Jabatan Teknikal dan Ulasan YB dibuang, kini ikut had sistem. Fail lebih 1 MB boleh dimuat naik dan dipaparkan." Enforced by the same `rootcause-format` hook (F13–F18).

**Redmine close / BA pass STRUCTURE (2026-09-07, #278580, per みや)** every Redmine close or BA hand back uses these rows, in order.
1. **Root cause** row. Short plain sentences. If the cause has multiple steps, write it as BULLET POINTS, one short fact per bullet, not one long sentence.
2. **Solution** row. Same. Bullets when multiple steps.
3. **A final answer sentence** row. Include this ONLY IF the BA asked a question through the ticket, OR something long needs explaining. If the BA asked nothing and nothing is long, omit this row entirely.
Style stays plain. No colons, no dashes, no semicolons. Short simple technical sentences ([[feedback_commands_never_fenced]]). Exemplar bullets kept (#278580 tugasan flow): "This permohonan was altered 2 times. / Each alter regenerates the flow and can set the wrong keputusan. / Current keputusan is Tangguh so it went to Penyediaan Maklumbalas Tangguh. / The actual decision is Tolak Ringkas. / To fix, we alter it back to the Tolak Ringkas path."

**Why**: 2026-09-01 (#277532) — I appended a "Dah dibetulkan" fix sentence; みや: *"I am only using this"* + gave the 2-sentence cause-only version. Now baked into the quest hand-back "Root cause (plain, Redmine-ready)" row (`.claude/skills/quest/SKILL.md` Stop-Point Action Summary). Pairs with [[feedback_reply_separation_of_concerns]] and [[feedback_ticket_writing_style]].

**🚨 ZERO code identifiers (2026-09-17, #279615, per みや who was furious)**: BANNED in Root cause AND Solution rows — class names (MlkMaklumatPermohonanPembatalanForm), method/getter names (getIsGantiHari), widget/variable names (tanahDialogWV, dialogWidget), code snippets (rendered="#{...}"), and English developer words (bean, getter, widget, render, property). Write what the OFFICER sees and what got fixed, plain Malay a clerk understands. If a non-developer cannot read it, it fails. Bad (what I sent): "Bean tiada getter getIsGantiHari, butang rujuk widget tanahDialogWV". Good: "Skrin papar ralat semasa dibuka kerana ada satu maklumat yang sistem perlukan tetapi tiada. Butang tidak bersambung ke tetingkap kemaskini yang betul jadi tetingkap tak keluar." Separation of concerns: cause rows = PROBLEM only, solution rows = FIX only.

**miya's edits on #281712 (2026-09-28) — learn from the diff:**
| Field | My draft | miya's final | Lesson |
|---|---|---|---|
| Root cause | "Semakan syer di Portal Awam hanya menjumlahkan …" | "**Masalah logik perkiraan.** Semakan syer di Portal Awam hanya menjumlahkan nombor atas dan membandingkannya dengan nombor bawah yang terbesar. Syer yang berlainan penyebut seperti 1/28, 1/4 dan 1/8 ditolak walaupun jumlah sebenar ialah 1." | Open with a 2-3 word CATEGORY sentence naming the kind of fault (logik perkiraan / data / konfigurasi), then the mechanism |
| Solution | "Semakan syer di **tetingkap pemohon** dan butang Seterusnya …" | "Semakan syer **sewaktu update pemohon** dan butang Seterusnya kini menjumlahkan pecahan sebenar. Syer berlainan penyebut yang berjumlah 1 boleh diteruskan dan jumlah melebihi 1 masih ditolak." | Name the USER ACTION ("sewaktu update pemohon"), not the UI element ("tetingkap") |

**🚨 NO BLAME, EVER (2026-09-30, #282555, per みや, escalated)**: never write "Kesilapan pengguna" or anything that points at a person or role (user, CADO, officer, BA). The text is read by the office it describes. State what was selected or what happened, neutral and passive. Bad: "Kesilapan pengguna. CADO tidak pilih Pindaan Ya ...". Good: "Pindaan Ya tidak dipilih di tugasan Perakuan JTLTPM. Permohonan terus ke Penyediaan Minit Bebas tanpa Jabatan Teknikal." The category opener (e.g. "Masalah logik perkiraan.") is for system faults only, never for a user action.

