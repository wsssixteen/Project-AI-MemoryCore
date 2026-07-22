---
name: reference-jasper-field-sources
description: "How a Jasper $F{} field gets its value in etanah — SQL-in-jrxml vs Java datasource — and how that decides whether a report fix is ours or the Reports team's"
metadata: 
  node_type: memory
  type: reference
  originSessionId: da27327e-bed1-431a-8d9c-c6c7f632107f
  modified: 2026-07-22T08:46:00.266Z
---

Where a Jasper `$F{...}` value comes from decides **who owns the fix**. Three fill paths exist in
`etanah-common\src\main\java\my\gov\etanah\common\service\impl\BaseReportService.java`:

| Method | Line | `$F{}` sourced from | Can Java format the value? |
|---|---|---|---|
| `printReport(..., JRDataSource, ...)` | :130 · :225 · :243 | bean getters / the supplied `JRDataSource` | ✅ yes — format in the VO/getter |
| `printReportUsingDataSource(...)` | :260 · :278 · :296 | same — Java-supplied datasource | ✅ yes |
| **`printReportUsingSQL(...)`** | **:459** | **the jrxml's own `<queryString>` SQL, run over a `Connection` the method opens** | ❌ **no** — Java passes only `$P{}` params |
| `printCommonReportUsingSQL(...)` | :567 | same as above | ❌ no |

**The decision rule**: find which method fills the report.
- Java-datasource path → `$F{}` maps to a bean property; **we** can fix it (format in the getter/VO).
- `…UsingSQL` path → `$F{}` maps to a **SQL column alias inside the jrxml**; the only fix is editing
  the `.jrxml` itself → **Reports team owns it**.

`JRBeanCollectionDataSource` is the usual datasource wrapper (9 files in `etanah-awam`,
e.g. `AwamCommonReportService.java:822`, `CommonReportForm.java:1844`).

## Worked case — ESOKONGAN #271721 (PRBB thousands separator, 2026-07-22)

- Symptom: Borang Permohonan PRBB printed `180000.00`; BA wanted `180,000`.
- Chain: `awamPerakuanTab.xhtml:129` "Jana Semula" → `AwamPerakuanTabForm.onGoTabPerakuan():63`
  → `AwamCommonReportService.getPelupusanReport():4624` → `PelupusanReportService.getPlpLaporanPermohonanPRBB():370`
  → **`printReportUsingSQL(...)`:378**.
- Decisive evidence: `PlpLaporanPermohonanPRBB_Sub01.jrxml:366` — `, P_PL.KUANTITI_DIPOHON AS "KUANTITI_DIPOHON"`.
  The field is a SQL column alias from the jrxml's own query, so **no Java layer can intervene**.
- みや's colleague first thought there was a Java-side way to handle it. Line 366 is what settled it:
  ticket went to the **Reports team**.
- The candidate fix (for reference) was one expression at `…_Sub01.jrxml:800`:
  `new java.text.DecimalFormat("#,###.##").format($F{KUANTITI_DIPOHON})` — pattern `#,###.##` (not
  `#,##0.00`) because BA's screenshot annotation examples carry no decimals.

**How to check fast**: grep the report-service method that names the report constant → read which
`print*` overload it calls → that single line tells you ours vs Reports team, before any deep tracing.

Related: [[reference_etanah_bpmn_source]] · [[feedback_verify_before_claim]]
