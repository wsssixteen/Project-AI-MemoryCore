# etanah review instructions

> Canonical copy (MemoryCore-tracked). The ACTIVE copy lives at the etanah repo root
> `E:\Projects\Melaka\etanah-pelupusan\REVIEW.md` — Claude Code's built-in `/code-review`
> and `/security-review` read it automatically when reviewing an etanah diff. Re-copy
> this file there after edits (the `review-etanah` skill does it).

## What 🔴 Important means here (reserve 🔴 for these)

- Incorrect logic / wrong branch taken.
- Unscoped or SQL-injection-prone Hibernate/native query; **table name missing its schema prefix** (`et_main_uat.` UAT / `et_main.` FAT).
- A JSF input (`selectOneMenu`, `inputText`, dialog) wired differently from its working sibling — **missing `listener=` / `process="@this"` / `update=`** → value silently saves null (QA-258004 class).
- A VO write-instance that is NOT the instance the save method reads (write `mb.xVO` but save reads `mb.yVO`).
- A cloned field/column missing the `rendered`/`required` urusan-gate its sibling carries (un-gated mandatory junk field in other flows — QA-260508).
- PII (IC, name, login) written to a log.
- A change to a **shared** method / CC-tag / `mklmt_tmbhn` JSON key / DB column without accounting for every other caller (blast radius).

Style / naming / formatting = **Nit at most**, usually don't report.

## Always check (etanah non-negotiables)

- **Working-analog first**: new code copies the nearest WORKING sibling urusan/tugasan/bean/template — this is a mature system, the pattern exists. Flag invented code where a sibling branch idiom exists (`URS_X.equals(kodUrusan)` appears 16× in `PelupusanWordCCMethodConstant.java`).
- **Smallest change**: touches only what the fix needs; matches THIS system's programmers' convention, not generic framework idioms.
- **Name by purpose**, reuse the established/analog name; no screen/context suffixes (`onChangeKategoriTujuanMigrasi` ❌ — "Migrasi" is the screen, not the behaviour).
- **Module scope**: the fix is in the module that actually renders the BA's page (`MLK_TKL_*` = etanah-teknikal, NOT deployed locally — a pelupusan "fix" can't fire there).
- **TRG excluded**: no TRG code path touched (TRG is out of Melaka scope).
- **No code comments** unless the WHY is non-obvious + shown first (no `// QA-XXXX`, no "mirrors X" — that belongs in the commit message).

## Do NOT report

- Anything PMD / SpotBugs already enforce — that's `/scan`'s job (run it first; don't duplicate).
- Generated, vendored, or `target/` files.
- Pure style/formatting on otherwise-correct code.

## Security pass (/security-review) priorities for a JSF/Hibernate gov system

SQL injection via string-built queries · XSS in rendered output · authorization gaps on tugasan/peranan transitions · PII in logs/responses · unsafe file upload/download (`UMM_A_DOK_*`).
