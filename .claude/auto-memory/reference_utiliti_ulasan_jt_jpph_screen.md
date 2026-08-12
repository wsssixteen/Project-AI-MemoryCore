---
name: reference_utiliti_ulasan_jt_jpph_screen
description: "The Pelupusan \"utiliti\" screens (sidebar menu) live in etanah-common protected/jpph/ — \"Kemaskini Ulasan Jabatan Teknikal / JPPH\" = UtilitiKemaskiniUlasanJPPHForm, NOT the pelupusan tugasan forms"
metadata: 
  node_type: memory
  type: reference
  originSessionId: bb314863-3a57-4f05-a939-94f49cf121c3
  modified: 2026-08-12T02:50:27.098Z
---

When the BA says **"Utiliti"** they mean the **PELUPUSAN sidebar menu** items (e.g. "KEMASKINI ULASAN JABATAN TEKNIKAL/JPPH", "PROSES PEMBATALAN PERMOHONAN", "PENGELUARAN LESEN DAN PERMIT"), NOT a tugasan panel.

**"Kemaskini Ulasan Jabatan Teknikal / JPPH" utiliti** (confirmed QA-274318):
- View: `etanah-common\src\main\webapp\protected\jpph\UtilitiKemaskiniUlasanJPPHForm.xhtml` (deploys via the etanah-common overlay war; only in `target/` under etanah-pelupusan, `src/` lives in etanah-common)
- Bean: `etanah-common\src\main\java\my\gov\etanah\common\web\form\UtilitiKemaskiniUlasanJPPHForm.java` (`@ManagedBean utilitiKemaskiniUlasanJPPHForm`)
- Radio "Ulasan": Jabatan Teknikal (`ulasanJPPH=false`) vs JPPH (`ulasanJPPH=true`)
- Two lists: JPPH panel → `appJabatanTeknikalVOs`; Jabatan Teknikal panel → `appJabatanTeknikalNonJPPHVOs`
- Populate: `onChangeJenisUlasan()`. Save: `onSave()` → `saveUlasan()` (JPPH rows) + `saveAppJabatanTeknikalVOs()` (JT rows). All ulasan rows persist to one table `umm_a_jabatan_teknikal`; the discriminator is JSON `KEY_FLAG_FROM` in `mklmt_tmbhn` (`utilitiUlasanJPPH` vs teknikal tags).

**NOT this screen**: pelupusan `MlkUlasanJPPHForm` / `MlkJabatanTeknikalTerlibatForm` are **tugasan** forms (workflow steps), a different code path with its own JPPH save. Don't fix a utiliti-reported bug in the pelupusan tugasan forms. **Rule**: a BA "utiliti" report → look in etanah-common `protected/<area>/Utiliti*Form` FIRST. Pairs with [[feedback_stay_in_module]] + the BPMN module-scope check.
