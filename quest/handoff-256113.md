# Handoff — QA #256113

**Quest**: QA #256113 — FAT - PLPS - Penyediaan Surat Keputusan Lulus Tidak papar Tempoh diluluskan
**Phase**: 1 (Execute) — fix applied, awaiting local test
**Last updated**: 2026-04-13 ~23:00 MPST
**Test data**: `PTMLK/01/L/PLPS/2026/14` (FAT-SIM), urusan PLPS, tugasan PYSK

---

## 1. Current state

### Fix applied (3 files, narrowed scope)

Gated on `MlkPelupusanTugasanConstant.TGS_SURAT_KEPUTUSAN_LULUS_LIST` — affects only Surat Keputusan Lulus tugasan group. All other urusan/tugasan untouched.

**File 1 — `etanah-pelupusan/src/main/java/my/gov/etanah/pelupusan/config/json/template/TemplatePropertyJson.java`**
- Added to `BaseTemplateProperty` inner class (line ~302):
  ```java
  private transient boolean reloadFromClasspath;
  ```
- Added getter/setter after `setProcessedFilePath` (~line 488):
  ```java
  public boolean isReloadFromClasspath() { return reloadFromClasspath; }
  public void setReloadFromClasspath(boolean reloadFromClasspath) { this.reloadFromClasspath = reloadFromClasspath; }
  ```

**File 2 — `etanah-pelupusan/src/main/java/my/gov/etanah/pelupusan/util/word/PelupusanTemplateUtil.java:273`**
- Branch condition in `updateProcessedFilePathFromTemplate` changed from:
  ```java
  if (StringUtils.isBlank(template.getDocumentId())) {
  ```
  to:
  ```java
  if (StringUtils.isBlank(template.getDocumentId()) || template.isReloadFromClasspath()) {
  ```

**File 3 — `etanah-pelupusan/src/main/java/my/gov/etanah/pelupusan/vo/PelupusanPenyediaanDokumenVO.java:~160`**
- In `populateDocx`, after `template.setDocumentId(getDocumentId())`:
  ```java
  if (getCurrentTugasan() != null && getCurrentTugasan().getTugasan() != null
          && MlkPelupusanTugasanConstant.TGS_SURAT_KEPUTUSAN_LULUS_LIST
                  .contains(getCurrentTugasan().getTugasan().getKod())) {
      template.setReloadFromClasspath(true);
  }
  ```

### What Miya is about to test

1. Rebuild `etanah-pelupusan`, redeploy to local JBoss
2. Run: first Jana → (optional Kemaskini) → Selesai on PTMLK/01/L/PLPS/2026/14
3. **Expected**: syarat section shows on both generations with Tempoh diluluskan + Tarikh mula/tamat populated correctly
4. **Smoke check**: try a different urusan letter (e.g. Surat Jabatan Teknikal) — confirm nothing regressed
5. On pass → set `local_test_confirmed=true` in `quest/active.txt`, move to Phase 2 (report)

---

## 2. Root cause theory (with evidence)

### Theory

The letter template `TemplateSuratKeputusanLulusPLPS.docx` uses an **inline row-level SDT** (`syaratKepentingan2`) whose direct child is `<w:tr>`. The Word content-control populator mutates this on first Jana from `<w:tr>` to a synthetic `<w:tbl>` (header row + body rows flattened in). On Selesai, the engine reloads the saved flattened file instead of the pristine classpath template, so the second-pass populator sees a different element shape than it expects and ends up clearing the SDT content without re-populating it. Result: syarat section vanishes on Selesai regen.

### Evidence chain

| Claim | File:Line | What it proves |
|---|---|---|
| `syaratKepentingan2` is bound to ONE method only | `PelupusanWordCCMethodConstant.java:1006` (`wordContentControlMethod.put(TAG_SYARAT_KEPENTINGAN2, util::populateTblSyaratKepentingan3)`) | Single entry point — no dispatch ambiguity |
| All 6 templates using `syaratKepentingan2` share structure | Scanned MLK template folder; all have direct-child `<w:tr>` inside outer SDT | Not a per-template shape quirk |
| Outer SDT content gets CLEARED and replaced on populate | `PelupusanWordEditorUtil.java:628-631` — `sdtElement.getSdtContent().getContent().clear(); add(updatedTable)` | First pass mutates `<w:tr>` → synthetic `<w:tbl>`. Outer SDT is preserved; only its inner element type changes |
| Synthetic Tbl construction from Tr | `PelupusanWordEditorUtil.java findTableByContentControlTag` — `if (sdtContentObj instanceof Tr) { Tbl newTbl = ...createTbl(); newTbl.getContent().add(tr); }` | First pass works only because it starts from Tr |
| Selesai regen loads saved file, not classpath | `PelupusanTemplateUtil.updateProcessedFilePathFromTemplate:267-295` — the `else` branch on `!isBlank(documentId)` reads the saved docx | Smoking gun: Selesai's input already has the mutated Tbl shape |
| `populateDocx` forces the documentId-set branch | `PelupusanPenyediaanDokumenVO.java:160` — `template.setDocumentId(getDocumentId())` | No way to get Selesai into the classpath branch without the flag |
| First Jana always works | `PelupusanHelper.onJana():343-469` — deletes existing `AppDokumenKeluaran` + soft-deletes Document | New Document has blank documentId → classpath branch → pristine Tr shape → populate works |

### Why text SDTs survive but table SDT breaks

- `startInsertValueContentControl` at `PelupusanTemplateUtil.java:475-490` dispatches by `cc.getType()`
- `TEXT → handleText → insertValueForContentControl` — replaces inner runs only, wrapper stays intact. Idempotent across N passes.
- `TABLE → handleTable → insertContentControlTableInDocument` — destructively mutates SDT content structure (Tr child becomes Tbl child). NOT idempotent.
- Other tags in the letter (namaPegawai, peranan, tarikh, etc.) are all TEXT type → survive. Only row-level TABLE SDTs break on regen.

---

## 3. Ruled out

| Hypothesis | How we ruled it out |
|---|---|
| **ChatGPT's nested-SDT-invalid theory** (outer `syaratKepentingan2` wrapping inner `rowNum`/`perihalSyaratKelulusan` is malformed per OOXML spec) | XML inspected manually; nesting is valid per ECMA-376 §17.5.2. Not a spec violation. |
| **Case A: outer SDT stripped on first gen** | Proven false by reading `insertContentControlTableInDocument:628-631` — outer SDT is `.clear()`-ed and re-filled, not removed. |
| **v3 external-resource fix** (adding external config to `populateTblSyaratKepentingan3` matching `populateTblSyaratKepentingan2`) | Fixed Selesai but broke first Jana — external file (`SyaratKepentingan.docx`) has 689/7765 col widths and standalone table shape; letter has 846/7796 and inline-row shape. They can't coexist. Reverted. |
| **Kemaskini button triggers server regen** | Kemaskini is client-side only: `penyediaanDokumen.xhtml:236-242` calls `launchWordEditor(...)` → `internal.js:1162` → native protocol `etanahv2://word-editor/`. Save-back uploads a new version but does not re-run content-control populator. |
| **Some other code path mutates the docx between Jana and Selesai** | Grepped `Docx4J.save` across `etanah-pelupusan`. Only 3 callers: engine itself (expected), `MlkKertasTemplateForm:283` (different form), `MlkSuratTemplateForm:2373` (PEMBETULAN status only, runs AFTER Selesai regen not before). None interfere. |

---

## 4. Parked / alternative hypotheses

If the primary fix fails local test, these are the next places to look:

1. **Row-template cloning in the inline branch**: `insertContentControlTableInDocument` inline branch (not external-resource) may still have a subtle bug even when fed the pristine Tr shape. The fix assumes the classpath-reload + existing inline branch = correct output. If test shows classpath reload happens but syarat section still empty → investigate the inline row-clone loop path in `PelupusanWordEditorUtil`.

2. **`populateTblSyaratKepentingan3` VO construction**: builds PelupusanWCCTableVO with `tableTag` + `rows` but sets type=TABLE and no external config. The handleTable dispatch path for inline (no external resource) may take a different branch than what the letter expects. Worth breakpoint at `PelupusanTemplateUtil.java:484 handleTable` if #1 doesn't pan out.

3. **`fetchSdtElementsForPart` at `PelupusanTemplateUtil.java:494`** — handleTable path bypasses `sdtElementsPart` (note line 484: `handleTable(cc, allElementsMap, wordprocessingMLPackage)` — no sdtElementsPart or part param). It goes straight to `allElementsMap` lookup. If classpath reload works but element-map lookup can't find the tag, we'd see empty syarat even on a clean Tr. Worth verifying `allElementsMap` contains `syaratKepentingan2` after classpath reload.

4. **`TGS_SURAT_KEPUTUSAN_LULUS_LIST` doesn't contain the tugasan we think it does** — low probability but zero cost to verify. Set a breakpoint at the new flag-set line, confirm the `if` branch executes for PTMLK/01/L/PLPS/2026/14.

---

## 5. Triage ladder — if fix fails

Run in order. Stop at the first check that fails.

### Check 1 — Is the fix even hit?
- Breakpoint: `PelupusanPenyediaanDokumenVO.populateDocx` on the new `if` block
- Pass: the branch is entered and `setReloadFromClasspath(true)` is called
- **If NO**: tugasan code mismatch. Inspect `getCurrentTugasan().getTugasan().getKod()` and compare against `MlkPelupusanTugasanConstant.TGS_SURAT_KEPUTUSAN_LULUS_LIST` contents. Fix the gate.

### Check 2 — Does the branch take effect in the engine?
- Breakpoint: `PelupusanTemplateUtil.updateProcessedFilePathFromTemplate:273`
- Pass: `isReloadFromClasspath()` returns true AND the classpath (if) branch executes, not the else branch
- **If flag is false here but true in Check 1**: transient-field copy issue in `BaseTemplateProperty.copy()` or clone flow — check if template is being re-cloned between set and read. Make field non-transient or propagate in copy.
- **If flag true but else branch runs**: logic error in the condition. Re-read the edit.

### Check 3 — Does the classpath file load correctly?
- Inspect `tempFilePath` after classpath branch
- Open the temp file externally — confirm it has the pristine `<w:tr>`-child structure for `syaratKepentingan2` SDT
- **If temp file has Tbl-child shape already**: classpath file is wrong — verify `retrieveTemplateFolder` points to `src/main/resources/template/MLK/` and the template at that path is pristine.

### Check 4 — Does populate run against the reloaded file?
- Breakpoint: `insertContentControlTableInDocument` on the `syaratKepentingan2` tag iteration
- Inspect: is the SDT found in `allElementsMap`? What shape is its content?
- **If not found**: `fetchAllSdtElementMap` isn't picking it up after reload. Check why — header/body location enum?
- **If found with Tr child**: populate should work. Trace through the `findTableByContentControlTag` → Tr-wrap-in-Tbl path.

### Check 5 — Did syarat populate but something downstream strip it?
- Save intermediate file after `insertContentControlTableInDocument` completes
- Open externally — syarat section present?
- **If present here but absent in final saved doc**: something after content-control populate is corrupting it. Check `Docx4J.save` flags, header/footer merge, or the `onProsesSelesai` post-save handler.

---

## 6. What a different root cause would look like

Warning signs that the theory is wrong and we should pivot:

- **First Jana also loses syarat section** after rebuild → theory is wrong, bug is in the populator itself, not the regen-source selection. Pivot to investigating `populateTblSyaratKepentingan3` or `handleTable` directly.
- **Fix works for PLPS but syarat still missing on another tugasan in `TGS_SURAT_KEPUTUSAN_LULUS_LIST`** → the gate is correct but another mechanism differs. Inspect that tugasan's template file for non-standard SDT shape.
- **Kemaskini edits to free prose between SDTs are being wiped now** → the classpath reload is too aggressive; the fix is clobbering user edits we should have preserved. Revisit whether Selesai is actually meant to preserve inline edits (re-read `onClickSelesai` contract with stakeholder).
- **Some OTHER section (not syarat) starts going missing on regen after this fix** → unintended side effect of flag. Check if another TABLE-type tag in the letter relied on flattened state.

If any of these appear, do NOT keep patching. Stop, write an updated handoff, and escalate to a fresh investigation session.

---

## 7. Known related bugs (followup after this quest)

Miya flagged: "other templates also facing this issue where sometimes a header is missing & at other times it doesn't show." Very likely the same pattern. Diagnostic signature:
1. Missing region is inside an SDT wrapping a table row or table (not plain text)
2. Works on first Jana, fails on Selesai/subsequent regen
3. Rest of document populates fine

If confirmed, fix = add the affected tugasan's kod to `TGS_SURAT_KEPUTUSAN_LULUS_LIST` or generalize the gate condition to a dedicated `ROW_LEVEL_SDT_TEMPLATE_TUGASAN` set. Add to forge-log as pattern entry during post-mortem.

---

## 8. SDT primer (for post-mortem teaching section — draft)

**SDT = Structured Document Tag** (also called "content control"). It's Word's mechanism for marking a region of a document as a named placeholder that code can find and replace.

### Three levels of SDT

| Level | XML element | Wraps | Use case |
|---|---|---|---|
| Block | `<w:sdt>` containing `<w:sdtContent>` with block-level children | Paragraphs, tables | Whole sections |
| Row | `<w:sdt>` wrapping a `<w:tr>` | Single table row | Dynamic row count in a table |
| Run | `<w:sdt>` inside a `<w:p>` wrapping `<w:r>` | Single text run | Inline text replacement |

Our bug lives in a **row-level SDT**. The outer `syaratKepentingan2` SDT directly wraps `<w:tr>`, meaning the SDT's `sdtContent` has exactly one child of type `Tr`.

### Key concept: tag vs value

Every SDT has a `<w:tag w:val="name"/>` attribute. This is the name the populator searches for. Multiple SDTs can share a tag (all instances get populated). Inside the sdtContent is the *current value* — plain text runs, a table, whatever Word stored.

### docx4j model mapping

- `SdtBlock` ↔ block-level `<w:sdt>`
- `SdtRun` ↔ run-level `<w:sdt>`
- Both extend `SdtElement` — generic "any SDT"
- `.getSdtContent().getContent()` returns `List<Object>` of whatever's inside (P, Tbl, Tr, R, etc.)

### Why our bug exists

The populator for TABLE-type tags **clears the sdtContent and replaces it with a synthetic `<w:tbl>`** (built by wrapping the original Tr in a fresh Tbl + appending populated rows). First pass: `Tr child → Tbl child`. Works.

Second pass (on saved file): the sdtContent now has a `Tbl` child, not a `Tr`. The populator's Tr-unwrap path doesn't trigger. The clear-and-replace still runs but with nothing useful to build from. Result: empty SDT.

The fix forces the second pass to read from the pristine classpath template instead of the saved file, so it always sees `Tr` child and the first-pass code path runs every time.

### Why text SDTs don't have this problem

`insertValueForContentControl` for TEXT finds the run elements inside the SDT and replaces their text content in place. The SDT wrapper and child structure stay intact — wrapper is `<w:sdt><w:sdtContent><w:p><w:r>old</w:r></w:p></w:sdtContent></w:sdt>` before and after; only "old" changes. Fully idempotent across N passes.

---

---

## 9. Fix Walkthrough (retroactive — reference example for protocol v2.3)

### The problem

When you click Selesai on a Surat Keputusan Lulus letter, the "Syarat-syarat" section disappears from the regenerated PDF even though it showed correctly on first Jana. The section is built from a row-level Word content control (SDT) whose internal shape gets destructively mutated on the first populate pass — first Jana works because it starts from a pristine template, but Selesai reloads the already-mutated file and can't re-populate against the new shape, so the section ends up empty.

### Class chain

```
User clicks Selesai
  ↓
penyediaanDokumen.xhtml:287  (selesai-button)
  ↓
PelupusanPenyediaanDokumenVO.onClickSelesai():234
  ↓
PelupusanPenyediaanDokumenVO.repopulateDocument():91
  ↓
PelupusanPenyediaanDokumenVO.populateDocx():150   ⚠️ forces documentId → regen path
  ↓
PelupusanTemplateUtil.processTemplatePropertyListConcurrently()
  ↓
PelupusanTemplateUtil.updateProcessedFilePathFromTemplate():267   ⚠️ THE BUG — reads flattened saved file instead of classpath
  ↓
PelupusanWordEditorUtil.insertContentControlTableInDocument():514-632   (populator sees wrong shape, clears SDT without refilling)
```

### Why these changes as a set

The bug is a **mismatch between Selesai's input source and the populator's assumptions**. The populator expects a pristine template where `syaratKepentingan2` SDT wraps a `<w:tr>`; on first pass it mutates that to a `<w:tbl>`. Selesai feeds it the mutated file, so the populator can't recognize what to work with. The fix forces Selesai to read from the pristine classpath template on every regen for affected tugasan, which makes the populator's first-pass code path run every time — effectively making the populate operation idempotent at the file level instead of the element level.

All three changes are needed together: one defines the signal (flag field), one reads it (engine branch), one sets it (VO gate). Without any single one, the fix is inert — flag with no setter does nothing, setter with no reader does nothing, reader with no writer never triggers.

### Per-change walkthrough

---

**File: `TemplatePropertyJson.java` — `BaseTemplateProperty` inner class, ~line 302**

```diff
  private String processedFilePath;
  private AppDokumenKeluaran adk;
+ private transient boolean reloadFromClasspath;
```

```diff
  public void setProcessedFilePath(String processedFilePath) {
      this.processedFilePath = processedFilePath;
  }
+
+ public boolean isReloadFromClasspath() {
+     return reloadFromClasspath;
+ }
+
+ public void setReloadFromClasspath(boolean reloadFromClasspath) {
+     this.reloadFromClasspath = reloadFromClasspath;
+ }
```

**Why this change**: We need a per-request signal that rides along with the `TemplateProperty` object from the VO (where we know the tugasan context) down into the engine (where the file-source decision is made). The template object is already passed end-to-end, so adding a field is the cleanest way — no extra parameters, no thread-local, no side channel. `transient` keeps the flag out of any Java/JSON serialization (the `Json` suffix on the enclosing class is a strong hint this object gets serialized), because this is a runtime decision, not persisted state.

**What would break without it**: No way to communicate "force classpath reload" from caller to engine. The engine would still branch only on `documentId` blankness, and Selesai would always hit the flattened-file branch.

---

**File: `PelupusanTemplateUtil.java:273` — `updateProcessedFilePathFromTemplate`**

```diff
  String tempFilePath = StringUtils.EMPTY;
- if (StringUtils.isBlank(template.getDocumentId())) {
+ if (StringUtils.isBlank(template.getDocumentId()) || template.isReloadFromClasspath()) {
      InputStream resourceAsStream = PelupusanTemplateUtil.class.getClassLoader().getResourceAsStream(
```

**Why this change**: This is the fork where first-gen and regen diverge. Before the fix, only a blank `documentId` (i.e. fresh Document, never saved) took the classpath branch. After the fix, regens can also take it — by setting the flag. The `||` short-circuits: any existing caller with blank documentId still hits the same branch as before, no behavior change. Only new callers with flag=true get diverted into classpath mode on regen.

**What would break without it**: The flag would exist but have no effect. `reloadFromClasspath=true` would be a no-op. Selesai would continue reading the flattened file.

---

**File: `PelupusanPenyediaanDokumenVO.java:~160` — inside `populateDocx`**

```diff
  if (template != null) {
      template.setDocumentId(getDocumentId());
+     if (getCurrentTugasan() != null && getCurrentTugasan().getTugasan() != null
+             && MlkPelupusanTugasanConstant.TGS_SURAT_KEPUTUSAN_LULUS_LIST
+                     .contains(getCurrentTugasan().getTugasan().getKod())) {
+         template.setReloadFromClasspath(true);
+     }
      AppDokumenKeluaran adk = SpringUtil.lookupBean(...)
```

**Why this change**: This is the *gate*. Without this block, the flag stays false for every caller, so nothing ever enters the new branch. With this block, only the tugasan inside `TGS_SURAT_KEPUTUSAN_LULUS_LIST` flip the flag — every other urusan/tugasan stays on the old code path. Null guards because `getCurrentTugasan()` can be null during early VO construction (matches defensive pattern already present in `onClickSelesai` above at line 234).

**What would break without it**: Flag would never flip anywhere. The earlier two changes would exist but never activate. Fix would be inert.

### Blast radius

- **Affected**: only tugasan codes inside `TGS_SURAT_KEPUTUSAN_LULUS_LIST` (PLPS and PPTPB variants for Surat Keputusan Lulus). When any of these tugasan run Selesai on a docx template, the engine now reads from classpath instead of the flattened saved file.
- **Untouched**:
  - First Jana on ANY urusan (blank documentId → already took classpath branch; condition unchanged for them).
  - Selesai on any urusan NOT in the list — their gate condition is false, flag stays false, engine takes original flattened-file branch.
  - Kemaskini flow — client-side only, doesn't touch the engine at all.
  - Jana Semula button — different entry point, doesn't call this specific `populateDocx`.
  - The `onProsesSelesai` PEMBETULAN side-path — runs after Selesai regen, independent of file source.
- **Why the scope is right**: Narrowing to a known-affected tugasan list is zero-risk on templates we haven't verified. If another letter is later confirmed to have the same row-level SDT issue, fix = add its kod to the set (one-line change). Broader gate can be considered if we build confidence across more templates.

### Document / template changes

**None.** No `.docx` template files edited in this fix. The letter templates in `src/main/resources/template/MLK/` are unchanged. The fix operates entirely at the engine-wiring level — we're changing *which* docx file the engine reads on Selesai, not editing any docx contents. Colleague handoff on the template side is not needed.

---

*End of handoff. Next session boot: read `quest/active.txt` → if handoff file exists, read this file before any code action.*
