---
name: review-etanah
description: Layered code review of an etanah fix before commit — sequences static bug-scan (/scan) + Claude's built-in /code-review (etanah-rule-aware via REVIEW.md) + /security-review (JSF/SQLi surface). Use at Phase-1 close before committing an etanah change, or on request. Triggers — "/review-etanah", "review this fix", "review the etanah change", "code review before commit", "review before I commit", "full review of this fix", at quest Apply-done / before Phase-1 commit.
---

# /review-etanah — layered review of an etanah fix

Inventory-first: this does NOT reimplement code review. It SEQUENCES three things we already have, each catching what the others can't, with etanah's rules loaded.

```
 1. /scan <changed classes>     ← deterministic defects (PMD+SpotBugs): leaks, NPE, dead store, locale
 2. /code-review                ← AI review of the diff, etanah-rule-aware (reads REVIEW.md)
 3. /security-review            ← SQLi / XSS / authz / PII pass (JSF+Hibernate gov system)
```

## Procedure

1. **Ensure the rulebook is active.** Confirm `E:\Projects\Melaka\etanah-pelupusan\REVIEW.md` exists and matches the canonical `domain/review-etanah/REVIEW.md`. If missing/stale, copy the canonical one there (it's what makes `/code-review` enforce etanah's non-negotiables instead of generic advice).

2. **Static first (`/scan`).** Run `node domain/scan/scan.js <package-or-file the fix touches>` on the changed classes. Fix or consciously accept every defect-shaped finding BEFORE the AI pass — so the AI review isn't wasted re-finding mechanical bugs.

3. **AI review (`/code-review`).** From the etanah repo, run `/code-review` on the fix diff (`/code-review <file>` or `/code-review <base>...<branch>`). It reads `REVIEW.md`, so 🔴 is reserved for etanah's real risks (schema-prefix, sibling-wiring, VO-instance, blast radius) and style is downgraded to Nit.

4. **Security pass (`/security-review`).** Run it when the change touches a query, a rendered field, a file upload/download, or a tugasan/peranan transition — i.e. most PLP changes.

5. **Synthesize.** One table: `finding · source (scan/review/security) · severity · file:line · action`. Confirmed real defects in the touched area → record via `/scan --record` so the known-bug surfacer carries them forward.

## When

At **Phase-1 close, before the commit** (after `local_test_confirmed=true`), or any "review this fix" request. It's a pre-commit quality gate, not an always-on hook — it costs an AI review pass, so run it on the fix, not every keystroke.

## Why these three (not one)

`/scan` = mechanical/dataflow defects (cheap, deterministic). `/code-review` = semantic/logic/convention review the LLM does well. `/security-review` = the attack-surface lens a gov land-records system needs. Running them in this order means each later (more expensive) pass isn't spent on what the earlier one already caught.
