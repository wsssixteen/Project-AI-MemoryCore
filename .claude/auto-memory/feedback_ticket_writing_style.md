---
name: feedback_ticket_writing_style
description: "How miya writes ticket/handoff explanations - short plain sentences, no technicals, warm close. Use MANDATORY when preparing ticket text OR explaining anything inside a ticket to BA/another team."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8396324f-083e-49c7-a0cc-838d559ec328
  modified: 2026-08-21T12:12:17.088Z
---

**When preparing ticket text, or explaining inside a ticket, write like miya writes - not like an AI.**

**Why:** BA and other teams do not know technicals. AI-style wording (DB-proven, file:line, "the constant does not exist yet", sudden CAPS) confuses them and wastes miya's time editing it.

**How to apply - the shape (from miya's own example, #276436):**
- Short simple sentences. One idea per line.
- Plain words. No file names, no line numbers, no code names, no jargon.
- Normal human tone. Warm. No caps for emphasis. No "AI explaining".
- Order: what we fixed + where to test it -> what is still broken + which side does not do it -> what DOES work (the comparison) -> what will show once the condition is met -> "Attached are the fixes required for X to check further." -> "Thank you."

**miya's verbatim example (this IS the target voice):**
> For Keluasan Tanah Dipohon I have fixed on our side & can be tested on internal.
> But for PPTPB, Tujuan Permohonan, Perserahan Kaunter does not save them.
> For PRBB & PRU it is saved.
> Kategori Tanah will show if we have the Tujuan Permohonan.
> Attached are the fixes required for SPOC side for them to check further.
> Thank you.

**Pre-send split check (2026-09-24, #278909, miya: "I hate it when you jam your points"):** any sentence joined by `jadi` / `so` / `bila` / `sebab` / `dan` that carries 2+ facts gets split into one line per fact before sending. Bad: "Config sudah merujuk templat ini, jadi bila Tidak Boleh Dipertimbangkan / Tolak dan pemohon ada pemilikan tanah, sistem papar ralat Couldn't load file." Good: "Config refer 3 templat yang belum wujud." / "Sistem papar ralat Couldn't load file." / "Ralat keluar bila ..." Also: miya prefers his own mixed wording ("config refer ...") and label-style short lines ("Base: X" / "Refer point 2.3.3: Y") over full Malay sentences.

**Dev-to-dev fix list on Redmine (2026-09-28, #278909, miya's final version: "I prefer this way"):** for a note to a developer (Farah), the numbered item IS the title line and its detail sits in a `<pre>` block under it (Redmine renders it boxed). Class/constant/file names are fine here (developer audience), unlike BA text. Shape:
```
Salam Farah,

Bujang dan Syarikat ok. Tinggal 3 fixes:

1. Tujuan tiada nombor 1.1
<pre>
   Templat: TemplateRisalatMMKN_PDT_Tolak_PT_AdaPemilikan.docx
   Ikut base. Refer gambar 1.
</pre>

2. 3.1 Melaka Tengah hardcode
<pre>
   Templat: 4 templat Tolak individu
   Tukar ke CC namaDaerah. Refer gambar 2.
</pre>

Thank you.
```
Rules: opener says what is OK + how many fixes are left · number leads the item, never sits under a heading line · each item = short title + `<pre>` detail (Templat/Java line, action, "Refer gambar N") · sub-steps a./b. inside the `<pre>` · attach red-boxed screenshots named `N. <what>.png` in the Task `2. Fix\` folder. Banned: a heading line with the number beneath it (miya: "why does the numbering below a statement").

**Banned in ticket text:** "DB-proven" / "verified" / file:line / class names / JSON keys / method names / CAPS-for-emphasis / long sentences / more than one idea per line. Keep the technical detail inside the attached files, never in the message.

**At ticket close / "test passed" / after a confirmed push:** emit the plain close message (above) PLUS the git commit-reference block. Generate the block with `node domain/ticket-close-block/ticket-close-block.js --repo <path> --ticket <num> --module <pelupusan|awam>`. Module rule: AWAM = branch only (another team merges PROD); pelupusan = branch + merged to mlk/int-env (we deploy PROD, BA tests int-env). Do not hand-type the block.

**📚 miya's Redmine speech collection — VERBATIM notes he sent (grows over time; match this voice, do not paraphrase it):**

1. BA pass after a fix, #281712 (2026-09-28). Greeting "Salam <BA first name>" · one line answering anything the BA asked on the side (here: apps checked) · one line "deployed to <module> internal, please help to verify" · the ticket-close-block · "Thanks".
```
Salam Fizah, I have checked for APPS, the logic is already correct and there is no checking when saving Maklumat Pemohon. 

I have deployed the fixes to AWAM internal. Please help to verify.

*mlk/esokongan/281712*
<pre>
Commit  : 21210507790080c41bf450dfca277e205e04c4fd
Author  : Ridhwan
Date    : 28/09/2026 11:17:48
Subject : Ref #281712 - PLTP - Fix syer checks to add mixed fractions so shares totalling 1 pass
Branch  : mlk/esokongan/281712
Module  : etanah-awam
</pre>

Thanks
```
My draft he replaced: "Hi Nurhafizah, fix sudah di deploy ke internal (mlit) untuk diuji." → he writes English for the pass note, "Salam" + short name, names the module ("AWAM internal"), and closes a side question the BA raised in chat.

2. BA pass after a fix, #279411 (2026-09-28). Greeting + "fix deployed to internal" + "Please help to verify" all on the FIRST line · a short "Tugasan covered now:" list for a multi-tugasan fix · "Thanks". He CUT from my draft: the error-message sentence, the "Test data (mlit)" block, and the word "Pelupusan" before internal. Less is the style: no restating the expected behaviour, no test data unless the BA asked.
```
Salam Anis, fix deployed to internal. Please help to verify.

Tugasan covered now:
Penyediaan Senarai Semak ke PTG, Semakan Permohonan PDT, Semakan Dokumen Permohonan PDT, Penyediaan dan Semakan Risalat MMKN PTG, and the other Senarai Semak tugasan.

Thanks
```

5. Junior handover, hints not answers, #264355 (2026-09-29). To Farah (Siti Farhanih Abdul Razak). Opener = which side + symptom + the working comparison, one line each. Numbered title + `<pre>` of WHERE to look (repo, branch, screen, file to start from, analog ticket), never the fix line. He CUT: "Fix dijangka kecil. Kalau rasa perlu ubah banyak, tanya saya dulu." He questioned a "Skop" block: "Siap: push branch, bagitahu saya untuk review" is noise (she already does it), and parking BA-reported items as "tunggu BA" is wrong — the handover covers the WHOLE ticket. 🚨 Junior hint = symptom + WHERE to start + test data ONLY. NEVER state the cause or the mechanism ("ID tak lalu Bayaran Pelbagai", "notifikasi ada tapi satu tugasan sahaja" = the answer, spoon-feeding; he raged at it). Pre-send check per `<pre>` line: does it say WHY it breaks? → cut it.
```
Salam Farah,

Ticket ni side AWAM.
Surat Keputusan PRU tak papar di AWAM Status Permohonan bila ID di Bayaran Pelbagai.
PRBB di tugasan yang sama papar surat.

1. Mula dari screen
<pre>
   Repo: etanah-awam. Branch mlk/qa/264355 dari mlk/master.
   Screen: AWAM > Status Permohonan, icon Surat Keputusan.
   Start dari xhtml Status Permohonan.
   Ikut syarat rendered icon tu sampai jumpa di mana surat Pelupusan ditapis.
</pre>

2. Banding PRU dengan PRBB
<pre>
   Tengok jenis dokumen surat keputusan PRU dan PRBB dalam umm_a_dok_keluaran.
   Refer template.config.json di etanah-pelupusan untuk kod dokumen setiap urusan.
   Refer eSOKONGAN #276584, logik AWAM yang sama.
</pre>

3. Test data (staging)
<pre>
   PRU: login AWAM alyaaqilah802@gmail.com, ID PTMLK/01/L/PRU/2026/2.
   Tugasan sekarang Bayaran Pelbagai (mzahiruddin@melaka.gov.my). Jangan hantar tugasan ni.
   Banding: login AWAM redha@samb.com.my, ID PTMLK/02/L/PRBB/2026/5 (Bayaran Pelbagai, amalia@melaka.gov.my).
</pre>

Thank you.
```

Related: [[feedback_cross_module_handoff_artifact]] · [[feedback_ba_facing_reply_plain]].
