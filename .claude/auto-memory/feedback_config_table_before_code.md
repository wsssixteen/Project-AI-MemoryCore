---
name: config-table-before-code
description: 🚨 Before branching on ANY config/enum/reference value, enumerate ALL its values from the reference table + trace how the codebase already consumes each; never collapse a multi-value field to a binary from one observed value
metadata:
  type: feedback
---

🚨 Before writing a branch/guard/flag keyed on a config, enum, or reference-table value: (1) SELECT ALL its values from the reference table (the SAK group / rjk_* / lookup) — never design from the ONE value observed on the test row; (2) grep how the codebase ALREADY maps each value to behaviour (the working analog); (3) emit a value × outcome matrix in the Rubric BEFORE any code. Name a flag after the FIELD, never after one of its values.

**FIRST ACTION**: when a ticket, BA text, or screenshot names a maintenance/setup/config page or a kadar/fi/pengiraan field, query the config table on EVERY environment in play (prod · stg2 · mlit) BEFORE any branch is written — a code read never substitutes for the config-table query, because the same code path can resolve to a different config row per env. Write the result in the CODE-CHECK form `config-source ✓(<table.column> = <value> on <env>)`, one line per env.

**Yes/no scope question**: a yes/no scope question ("is it X?", "should I Y?") is answered with the word FIRST, then at most one sentence.

**Why**: QA-280540 (2026-09-22). The `hsl_fi_pejabat.unit_pengiraan_id` field ("Kadar Pengiraan Per") has **28 values** (Lot, Lot Tambahan, Meter Padu, Meter Persegi, Metrik Tan, Hakmilik, Hektar, Ekar, Petak, Plot, Permohonan, Urusan, …). I saw ONE value (`JNS_PER_FI_LOT`) on the test row and proposed a binary `isPerLot` flag with an `else → × luas` branch — wrong for ~20 of 28 units. みや caught it from the dropdown. The correct convention already existed at `etanah-awam\src\main\java\my\gov\etanah\awam\hasil\strategy\PelupusanBayaranOnlineStrategy.java:169-210` (switch on `fiPejabat.getUnitPengiraan().getKod()` → `HasilConstant.SAK_FI_PER_HAKMILIK`/`_PER_URUSAN`/`_PER_PLOT`/`_PER_LOT`/`_PER_PERMOHONAN`, each with its own count) + Jasper `BgnLaporanBorang9B/9C.jrxml` CASE logic.

**How to apply**: operational form of "100% chain trace" + "working-analog first" + the Rubric CODE-LOGIC scenario-matrix (row h). A branch on a reference value is not designed until the reference table's full value set is listed AND the existing consumer of that field is read. Reuse the existing constants (`HasilConstant.SAK_FI_PER_*`), never invent one for a value that already has a home. Links: [[verify-before-claim]] · [[simplify-and-reference]].

**Same-root note**: the earlier same-quest fix (hardcode `KATEGORI_TANAH_PEMBANGUNAN → flat`) was ALSO wrong for the same root — it branched on Kategori while the real driver is the config unit, because I never enumerated the controlling field or traced its existing consumer. One gap produced two wrong fixes.
