---
name: feedback_ticket_writing_style
description: "How miya writes ticket/handoff explanations - short plain sentences, no technicals, warm close. Use MANDATORY when preparing ticket text OR explaining anything inside a ticket to BA/another team."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8396324f-083e-49c7-a0cc-838d559ec328
  modified: 2026-10-01T09:45:39.040Z
---

**When preparing ticket text, or explaining inside a ticket, write like miya writes - not like an AI.**

**Why:** BA and other teams do not know technicals. AI-style wording (DB-proven, file:line, "the constant does not exist yet", sudden CAPS) confuses them and wastes miya's time editing it.

**🚨 Never restate what the ticket already holds (2026-10-02, #244600 common hand-off: "too long, unnecessary info that is already inside the ticket").** A Redmine note to another team carries only what is NEW: which issue numbers are theirs, the cause in one line, the proposed fix, what we already fixed, the decision we need. No BA issue list, no evidence rows, no file paths, no DB ids, no step-by-step of an alternative. Target 5-7 lines.

**How to apply - the shape (from miya's own example, #276436):**
- Short simple sentences. One idea per line.
- STATEMENTS, never implications (2026-09-30, #281423): say the fact and its result outright; no "X can carry Y. This happens even when..." that makes the reader infer the point. Back it with the real count ("every PRBB pemohon row has 625, owner or not").
- Not bossy: no "Do not use X" commands to another team. State the fact, let it guide them.
- Redmine = Textile, not markdown: tables as |_. Head | rows |, code/columns in @...@ (underscores italicise otherwise). Hand the draft in a code block so it pastes raw.
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

2b. BA pass on a ticket SOMEONE ELSE resolved, #274266 (2026-10-01, Farah resolved it). Reconfirmed #282587 (2026-10-02): no commit details for a commit that is not ours; branch line only if the Redmine history does not already name it (AWAM keeps it); greet "Mira" not "Amirah". `ticket-close-block.js` now prints this shape by itself when the commit author is not us. No "Issues found and resolved" list, no explanation, no "data patch sahaja". Envs + verify, one line naming the attached PROD script by its real file name, thanks. He said: "Since it is a ticket someone else resolved, please refrain from over commenting."
```
Salam Mira, have patched data on internal & staging. Please help to verify.

Attached is the script for PROD (274266.sql).

Thank you very much.
```

3. Dev-to-dev finding note, #256334 (2026-09-28). Greeting = the person the ticket is assigned to RIGHT NOW (re-sync Redmine and read the live assignee before writing; I greeted Li Wen, he changed it to Anis). Opener answers the side question in 2 lines. Numbered title + `<pre>` detail. A pending decision is written "Perlu confirmation: A, atau B." (not "Perlu setuju").
```
Salam Anis,

Pelupusan panggil sub-flow sekali je setiap Hantar di Perakuan.
Service start banyak kali sebab flow ABB start semula service yang sama.

1. Service ulang tanpa henti
<pre>
   HasilSpocIntegrationService.java line 99 (case ABB) panggil onKemaskiniPerserahanABB.
   Line 230 submitBpmWithParam(ABB) setiap kali.
   Flow ABB guna MLK_HSL_ISPEKS, jadi service dipanggil semula.
   Cadangan: submit BPM bila aplikasi ABB baru dicipta sahaja. Refer HasilSpocIntegrationService.java.
</pre>

2. Tugasan Semakan dalam sub-flow PDBB tiada pengguna
<pre>
   Sub-flow guna aliran kerja PDBB.
   ISPEKS_SMKN tiada bawah urusan PDBB.
   Perlu confirmation: sub-flow tamat dan PDBB tunggu ABB, atau sub-flow tukar ke aliran kerja ABB.
</pre>

Thank you.
```

4. Dev-to-dev WhatsApp reply to another team, #280540 (2026-09-29). Common said "dev kau tarik data lain". Casual Manglish, no greeting, no apology. Opens "Actually", states what our code really reads in fallback order, then one line on why the evidence looked different. He cut my "Maaf atas kekeliruan" and the formal Malay.
```
Actually code kita memang amik dari hsl_fi_kadar.kadar_pengiraan_id, tapi kalau null, fallback ke hsl_fi_kadar.unit_luas_id, lepas tu baru ke hsl_fi_pejabat.unit_pengiraan_id.

Script tu just untuk tunjuk currently amik dari mana, sebab hari tu kadar_pengiraan_id null untuk semua baris. Tu yang script tak tunjuk column hsl_fi_kadar.
```

5. BA pass after a multi-issue fix, #282061 (2026-09-29). He pasted this template and asked for the fixed list inside it; I had sent my own Malay shape instead (slip `reask/redundant`). English, "Salam" + short name, envs named, one numbered line per issue in plain words, git block, then the thanks line. **Printed by the tool, never retyped**: `node domain/ticket-close-block/ticket-close-block.js --repo <clone> --ticket <num> --module pelupusan --ba <Name> --envs "internal & staging"` (only the numbered lines are written by hand). Rule home: quest SKILL § Hand-over to BA + deploy SKILL 6b.
```
Salam Fizah, have deployed fixes to internal & staging. Please help to verify.

Issues found and resolved:
1. <plain one-line fix>
2. <plain one-line fix>

<git block>

Thank you very much.
```

6. Dev-to-dev WhatsApp answer to a "why" question, Li Wen (Hasil) on Flowable Source vs Source expression (2026-09-30). He kept my draft and changed one word: the closing summary opener "Ringkasnya" became "Basically". Rule: in rojak, the connectors and fillers are casual English (Basically · Actually · just · so · currently), never formal Malay (Ringkasnya · Oleh itu · Maaf atas kekeliruan). Technical terms stay English too: "fixed value" not "nilai tetap", "value" not "nilai" (he asked "nilai tetap is basically value?" = a Malay translation of a dev term made him stop and decode it). Shape he approved: one fact per short paragraph, blank line between, concrete example with the real value, last line = the one-line rule.
```
Source tu untuk nama variable dalam parent flow. Flowable akan cari variable nama tu dan copy value dia.

Kalau letak etanah-spoc-hasil kat Source, Flowable akan cari variable nama "etanah-spoc-hasil" dalam PDBB. Takde variable tu, so jadi null.

Source expression pulak dia evaluate expression. ${'etanah-spoc-hasil'} tu string tetap, so value dia memang terus "etanah-spoc-hasil".

Basically, nak pass variable guna Source. Nak pass fixed value guna Source expression.
```

7. Junior handover, hints not answers, #264355 (2026-09-29). To Farah (Siti Farhanih Abdul Razak). His final version below. Opener = which side + symptom + the working comparison, one line each. Numbered title + `<pre>` of WHERE to look (repo, branch, screen, file to start from, analog ticket), never the fix line. He CUT: "Fix dijangka kecil. Kalau rasa perlu ubah banyak, tanya saya dulu." and the "Skop" block ("Siap: push branch, bagitahu saya untuk review" is noise, she already does it; parking BA items as "tunggu BA" is wrong, the handover covers the WHOLE ticket). 🚨 Junior hint = symptom + WHERE to start + test data ONLY. NEVER state the cause or mechanism ("ID tak lalu Bayaran Pelbagai", "notifikasi ada tapi satu tugasan sahaja" = the answer, spoon-feeding; he raged at it). Pre-send check per `<pre>` line: does it say WHY it breaks? → cut it. 🚨 Junior tests on INTERNAL: test data comes from internal only, never staging (even if BA reproduced on staging). 🚨 Every item in the guide must be backed by a PROVEN fix from a quest sweep, never a proposed or untraced one (he asked "did you run full quest sweep").
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

3. Test data (internal)
<pre>
   ...
</pre>

4. Surat Tolak tak papar di AWAM
<pre>
   Screen: AWAM > Status Permohonan, icon Surat Keputusan.
   Guna jalan yang sama macam point 1. Banding apa beza Lulus dengan Tolak.
</pre>

5. Tiada notifikasi ke AWAM
<pre>
   Repo: etanah-pelupusan.
   Cari sama ada Pelupusan pernah hantar notifikasi keputusan kepada pemohon.
</pre>
Thank you.
```

8. Root cause + Solution rows, #282442 (2026-10-01). He rejected my draft as "doesn't match my word style". The rejected draft (formal Malay, dev terms translated, two facts jammed with "jadi"): "Di Proses Pembatalan Permohonan, sistem tidak dapat kod pejabat tanah bagi urusan PRBB. Kod kosong dihantar ke GIS, jadi GIS cari di pejabat PTG yang tiada jadual log dan papar ralat." Rules taken from entries 4 and 6 and applied: rojak not formal Malay (tak / dah / amik / so, never "dihantar" / "tidak dapat"), tech words stay English (table, value, default, kosong ok), one fact per line, screen name first. Refined draft sent for his check (replace with his final wording once he edits it):
```
Root cause:
Untuk PRBB, skrin Pembatalan tak dapat kod pejabat dari maklumat tanah.
Sistem hantar kod pejabat kosong ke GIS.
GIS default ke PTG.
Table log tak wujud di PTG, so keluar ralat.

Solution:
Kalau kod pejabat kosong, sistem amik kod pejabat dari maklumat tanah permohonan.
Klik Jana untuk PRBB dah tak keluar ralat.
Pembatalan boleh teruskan.
```
🚨 Root cause / Solution rows follow THIS collection's voice, not [[feedback_redmine_rootcause_format]]'s older formal-Malay exemplars. Pre-send check: any formal Malay verb (dihantar, tidak dapat, dipaparkan) or a translated dev term (jadual, nilai) → rewrite in his rojak.

9. Dev-to-dev fix instructions for another team, AWAM release 1.11.1 / #256334 (2026-09-30), forwarded via the BA. He rewrote my draft into his words: "Rujuk" → "Refer", "Ambil" → "Amik", dropped the "Sebab:" label (the cause is just the first sentence), dropped my closing "deploy semula + test" line (the other team knows its own next step). Rule: dev loanwords stay English (Refer, commit, merge, branch), casual Malay spelling (amik, tak, je), no section labels inside a point, stop after the last fix item.
```
Isu 2 - Borang Permohonan PDBB tak keluar
Report team commit dekat "mlk/cr/256334", tapi yang merge ke release "mlk/CR/256334". Jadi report files tak masuk.
Amik dari mlk/int-env:
1) src/main/resources/reports/state/MLK/PlpLaporanBorangPDBB.jrxml
...
4) PelupusanReportService.java - method getPlpLaporanBorangPDBB() ikut int-env (hantar P_IMG_PATH, bukan P_ADALAH_INDIVIDU). Kalau tak tukar, jata tak dapat load.
```

10. Dev-to-dev "which table and column" answer to another team, #277706 (2026-10-02). To Atierah (SPOC). Numbered field title + `<pre>` with `Table :` / `Column :` / `Value :` label lines. He kept my extra item 5 (marked as extra, see [[flag-unasked-additions]]) and CUT my two closing lines: "Semua table link ke umm_p_aplikasi guna p_aplikasi_id." and "Contoh di staging, ID Transaksi <id>." Rule: a developer knows how the tables link and has the BA's test data already; stop after the last field item, then "Thank you." He also changed the greeting from "Salam Atierah" (the dev who asked) to "Salam Mira" (Amirah, the BA who passed the question to us) and assigned the ticket back to Mira: answer the person who routed it to us, not the original asker.
```
Salam Mira,

Untuk no. 1, Tambah Kuantiti simpan dalam table yang sama macam Ganti Hari.
Yang baru cuma value Jenis Permohonan 8 dan Kuantiti Tambahan Yang Dipohon.

1. Jenis Permohonan
<pre>
   Table  : umm_p_permit_lesen
   Column : mklmt_tmbhn, key integerJenisPermohonan
   Value  : 8 = Tambah Kuantiti (Ganti Hari = 6)
</pre>
...
5. Kuantiti Tambahan Yang Dipohon
<pre>
   Table  : umm_p_permit_lesen
   Column : mklmt_tmbhn, key kuantitiTambahanDipohon dan unitKuantitiTambahanDipohon
</pre>

Thank you.
```

**Before writing ANY Redmine note: run `node quest/redmine-sync.js <num>` and greet the live assignee.**
Related: [[feedback_cross_module_handoff_artifact]] · [[feedback_ba_facing_reply_plain]].
