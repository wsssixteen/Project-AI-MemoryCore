goal_status: draft (derived from registry on 2026-09-06; promote with node lib/goal-backfill.js promote atlas-full-check)
symptom: 2026-08-27: shipped a multi-state Atlas claiming verified-everything while By-Feature was empty on Perak and states were never visually checked — miya: create a deterministic checker so you dont lie about a single alphabet
goal: BLOCK stop unless etanah_atlas/build/full_check_report.json is a fresh all-pass FULL run covering every state in atlas_states.json (0 JS errors); bypass [skip-atlas-full-check: reason]
goal_signal: the Stop fire produced: BLOCK stop unless etanah_atlas/build/full_check_report.json is a fresh all-pass 
retention: rotate monthly
# atlas-full-check

Deterministic full-website checker for the multi-state etanah Atlas. Born 2026-08-27
after a "verified everything" claim shipped with By-Feature empty on Perak and no state
ever visually driven — miya: *"create a deterministic checker so you don't lie even about
a single alphabet; check every state every page every clickable/draggable thing."*

**What fires when**: `Stop` — session transcript tail shows edits under
`etanah_atlas/(src|config|lib)` OR to a built `etanah_atlas_*.html`.

**Contract**: BLOCK stop unless `etanah_atlas/build/full_check_report.json` is
(a) a FULL run (`_summary.full_run === true`), (b) all-pass (`_summary.all_pass === true`,
0 JS errors), (c) covers EVERY state in `config/atlas_states.json`, and (d) FRESH — its
mtime ≥ the newest `etanah_atlas_*.html`. Bypass: `[skip-atlas-full-check: <reason>]`
(real reason ≥3 chars; the `<reason>` placeholder is rejected — self-disarm guard).

**The check itself**: `python etanah_atlas/lib/full_check.py` drives every state through
Playwright/Chromium — every main tab, sub-tab, dropdown OPTION, card drag (asserts the
transform moved), card→focus, suggestion, sidebar tab, catalog filter/reset/row, fork
button, theme toggle — capturing `console` + `pageerror`. Screenshots land in `checks/`,
the machine verdict in `build/full_check_report.json`. The hook validates that artifact;
it does not run the browser itself (too heavy for a Stop event — 5 browsers, ~2 min).

**Layer choice (Rule 7)**: **hook-only.** The procedure already exists as a script
(`full_check.py`); no skill is needed. The hook is the deterministic back-gate that makes
running it non-optional after an Atlas change. No front gate — nothing to prompt at intake.

**Trigger moment (Rule 8)**: Stop, guarded by a tight transcript predicate. This is the
leanest point — the check only matters when the Atlas actually changed this session, and
Stop is the last moment before a "done / it works" claim reaches miya. A UserPromptSubmit
trigger would fire on turns that never touched the Atlas; SessionStart would fire on boots
that do no Atlas work. Same shape as the sibling `atlas-ship-gate`.

**Sibling / no-overlap**: `atlas-ship-gate` checks BUILD integrity (smoke test + one
headless render of Melaka → `ship_check.json`). `atlas-full-check` checks INTERACTION
integrity (every control on ALL states → `full_check_report.json`). Same trigger, distinct
artifacts, distinct failure modes — kept separate on purpose (collision override at birth).

**Observability**: every fire is appended by the shared `runHook` runtime to the central
telemetry `system/telemetry/hook-fires.jsonl` — each row carries `ts`, `name` (`atlas-full-check`),
`event`, `fired`, `blocked`/`bypassed`, and `dur_ms`. Audit this gate's history with
`grep atlas-full-check system/telemetry/hook-fires.jsonl`; the `dur_ms` column proves it earns
its slot. (No per-feature `log.jsonl` — the runtime centralizes fires.)

**state-scoped**: `no, state-agnostic` (Rule 11). The hook reads the state list from
`config/atlas_states.json` at fire time and requires the report to cover exactly those
profiles — add a 6th state and the gate demands it automatically, no code edit. There is no
hardcoded state name anywhere in the hook.

## Adversarial scenarios enumerated at birth (Rule 12 — 22, all encoded as eval fixtures)

| # | Scenario (opposing / out-of-spec) | Verdict |
|---|---|---|
| 1 | Atlas untouched this session | handled — no fire, exit 0 (fixture 1) |
| 2 | Atlas src touched, no report exists | fixture-added — BLOCK (2) |
| 3 | Block message must actually render to stderr | fixture-added — effect check (3) |
| 4 | Fresh all-pass full report covering all states | handled — exit 0 (4) |
| 5 | A check failed (passed < total) | fixture-added — BLOCK, names count (5) |
| 6 | JS errors present but counts full | fixture-added — BLOCK via all_pass false (6) |
| 7 | Single-state run passed off as full | fixture-added — BLOCK on full_run false (7) |
| 8 | A declared state never checked | fixture-added — BLOCK, names the state (8) |
| 9 | Report older than a freshly rebuilt HTML | fixture-added — BLOCK on staleness (9) |
| 10 | Edit reached HTML only (not src) | fixture-added — still gates, both green/red (10,11) |
| 11 | Real bypass token with a reason | handled — exit 0 (12) |
| 12 | Placeholder `<reason>` bypass (self-disarm) | fixture-added — still BLOCKS (13) |
| 13 | Gate's OWN block message quoted in transcript | fixture-added — does not disarm (14) |
| 14 | Malformed / non-JSON stdin | handled — fail-open (15) |
| 15 | transcript_path missing / unreadable | handled — fail-open (16) |
| 16 | Fresh clone, no built HTML yet | handled — fail-open (17) |
| 17 | Report present but `_summary` absent (old format) | fixture-added — BLOCK (18) |
| 18 | Report file is corrupt JSON | fixture-added — BLOCK (19) |
| 19 | `atlas_states.json` missing, report green | accepted-risk — passes (no state list to enforce); config-absent ≠ failure (20) |
| 20 | Huge transcript, touch inside last 400KB | handled — still gates (21) |
| 21 | Touch pushed past the 400KB tail window | accepted-risk — fail-open; only recent edits gate, matches sibling ship-gate (22) |
| 22 | Worktree vs main `__dirname` split (this build) | accepted-risk — hook resolves ROOT via `CLAUDE_PROJECT_DIR` first; recorded here so a future path bug is grep-findable |

Bypass usage is loud in `log.jsonl` (`bypassed:true` rows). Accepted risks (19, 21, 22) are
the deliberate fail-open edges — a gate that fails *closed* on a missing config or an old
transcript would block unrelated sessions, which is worse than the narrow miss it prevents.
