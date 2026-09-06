goal_status: draft (derived from nuke-marker on 2026-09-06; promote with node lib/goal-backfill.js promote patch-ticket-intake-flag)
symptom: #275501 — patch script not prepared straight away at intake; patch nature not highlighted as do-first (miya correction)
goal: resolve: #275501 — patch script not prepared straight away at intake; patch nature not highlighted as do-first (miya correction)
goal_signal: unknown — needs a read of the code
retention: rotate monthly
# patch-ticket-intake-flag

**Born** 2026-08-19 (miya, #275501 — patch script not prepared straight away, patch nature not highlighted). **Fires** at ticket engagement (UserPromptSubmit, inside `.claude/hooks/ticket-gate.js`). **Primitive** hook-only (no skill — the behaviour is a deterministic banner). **Lifecycle** created.

## What it does

Reads the engaged ticket's `0. Brief/Description.txt` + `History.txt` and, when the BA is
explicitly asking for a **data patch**, prepends a loud `🩹 PATCH TICKET — do FIRST` banner
above the quest-gate checklist. The banner names the matched signal and states the
deliverable is the **patch script itself** (before-SELECT · UPDATE · after-SELECT), prepared
straight away and tested on STG before PROD.

Silent when the ticket is not a patch request (no false urgency).

## Why it exists — the gap it closes

`steal-risk-flag` (2026-08-17) only flags a patch **after** it is diagnosed — it reads board
State phrases (`Recon+Rubric done`, `data patch … ready`). It is **blind at intake**: when the
BA's own words say *"minta patch maklumat"* / *"please help to patch … in STG first"* /
*"maklumat tak lengkap"*, nothing classified the ticket as a patch, hoisted it to do-first, or
forced the patch script as the deliverable.

#275501 was swept into a generic Recon+Rubric and left `status=hold` with **no script prepared**.
This module adds the missing **intake** leg — it fires the moment the BA requests a patch,
before any diagnosis exists for steal-risk-flag to trigger on.

| | |
|---|---|
| Module | `patch-intake.js` — pure functions `detectPatchRequest(text)` / `renderPatchIntakeFlag(text, id)`, no network/fs |
| Wired into | `.claude/hooks/ticket-gate.js` — reads `state.task_folder`'s Brief, prepends the banner |
| Eval | `eval.js` — 7 fixtures incl. the verbatim #275501 miss + a code-patch false-positive guard; 7/7 green |
| Log | `log.jsonl` — one row per fire (`ts · qa · outcome · signal`) per system-rules Rule 5 |
| Pairs with | `domain/steal-risk-flag/` (post-diagnosis leg) — this is the INTAKE leg |

## Signals (English + Malay)

`minta patch` · `patch maklumat` · `patch data` · `data patching` · `patch … in STG/PROD` ·
`patch … first` · `patch … missing` · `maklumat tak/tidak lengkap`. Vetoed: `code/git/hotfix
patch`, `dispatch` (code-patch, not data).

## Keeping it in sync

If the BA patch-request vocabulary drifts, edit `SIGNALS` in `patch-intake.js` (one place) and
re-run `node eval.js`. Phrase additions need ≥2 observed misses or miya's ask (system-design
trigger-reliability discipline).
