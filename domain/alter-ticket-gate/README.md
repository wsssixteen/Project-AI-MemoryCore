goal_status: draft (derived from registry on 2026-09-06; promote with node lib/goal-backfill.js promote alter-ticket-gate)
symptom: #275847 2026-09-04 Perak: Ammar 'can help alter to SPI Semakan Permohonan' — quest hard-coded melaka knowledge, no alter-page/verify/reply layer existed; #277926 2026-09-03 Melaka: Initiate&Alter picked the wrong SKM twin by name
goal: advisory: inject the state-routed ALTER layer (ALTER-TICKET-PLAYBOOK + <state>/FLOWABLE-ALTER file) + the A0-A6 deterministic rows + the fixed reply format; state resolved from Task folder / permohonan-ID prefix
goal_signal: the UserPromptSubmit fire produced: advisory: inject the state-routed ALTER layer (ALTER-TICKET-PLAYBOOK + <state>/F
retention: rotate monthly
# alter-ticket-gate (hook-only Feature, v1.0 — born 2026-09-04 via core/forge.js)

**What fires when**: `UserPromptSubmit` — the prompt names a ticket / permohonan ID (or a prior assistant turn does) AND an **alter signal** is found in the prompt, the ticket brief (`0. Brief/Description.txt` + `History.txt` + active.txt one-liner), or the prior assistant turns of this session's transcript.

**Contract (ADVISORY, never blocks)**: inject the state-routed ALTER layer — `etanah-knowledge/ALTER-TICKET-PLAYBOOK.md` + the state's mechanics file — plus the 7 deterministic rows A0–A6 and the fixed reply format. Once the playbook has been `Read` this session it degrades to a one-line reminder (no bloat).

**Nod**: みや 2026-09-04 (#275847) — *"build a format for deterministic replying to alter type tickets … slight differences between states … include it into our Quest workflow when detecting the solution as flowable type … like we loaded other things by layers."*

| Piece | File | Role |
|---|---|---|
| Hook | `alter-ticket-gate.check.hook.js` | UserPromptSubmit advisory; state resolution; layer + rows injection |
| Eval | `alter-ticket-gate.eval.js` | 20 fixtures in a temp sandbox (env overrides `ALTER_GATE_ACTIVE_PATH` / `ALTER_GATE_KNOWLEDGE_ROOT`) |
| Log | `log.jsonl` | `{ts, qa, state, state_src, signal, signal_src, mode: full\|reminder, outcome}` per fire |
| Knowledge (procedure) | `projects/coding-projects/active/etanah-knowledge/ALTER-TICKET-PLAYBOOK.md` | A0–A6 · action decision · verify signature · reply formats |
| Knowledge (per state) | `melaka/FLOWABLE-KNOWLEDGE.md` §6/§6b/§11.5 · `perak/FLOWABLE-ALTER.md` · others ⬜ | page mechanics, creds pointer, verify dialect, BPMN sources |
| Nuke marker | `NUKE-MARKER.md` | rollback recipe (retire 2026-10-04) |

**Layer choice (Rule 7)**: hook-only. The procedure is knowledge (a playbook the hook points at), not a skill — a skill would duplicate the quest skill's phase machinery; the gate's job is only *load the right layer at the right moment, per state*. Promote to a Stop-side block only if a hand-back ships an alter without the A-rows (observed slip → evidence).

**Trigger moment (Rule 8)**: UserPromptSubmit guarded by a tight predicate (ticket/permohonan context **and** an alter signal). Not SessionStart (no ticket yet), not every-turn bloat (predicate + reminder mode). The "Rubric decided it is an alter" case (#277926 never said alter) is caught from the transcript tail on the NEXT user turn — execution needs みや's turn anyway, so the advisory arrives before any click.

**state-scoped**: **yes, keyed by state** — `STATE_MAP` (melaka · perak · selangor · terengganu · kedah · wp) resolves `active.txt state=` → Task-folder segment → permohonan-ID prefix → `unknown` (asks, never defaults to Melaka). Missing state files are surfaced as `⚠️ FILE MISSING` so the next state's build is one grep away.

**Observability**: every fire appends one `log.jsonl` row (see table). `mode=reminder` rows measure how often the layer was already loaded (bloat avoided); `state=unknown` rows are the backlog of states without a file.

## Signals (documented predicates)

| Regex | Catches | Deliberately does NOT catch |
|---|---|---|
| `ALTER_STRONG` | `Initiate & Alter`, `InitiateBPMFlowableForm`, `BpmAlterFlowForm`, `moveActivityIdTo`, `Alter Flow Flowable`, `flowable alter`, `alter page` | — |
| `ALTER_ASK` | `tolong/please/mohon/can help … alter`, `alter ID/permohonan/tugasan/ke/to/balik/semula/flow/token/SPI/SKM`, `pindahkan tugasan`, `move the token`, `alter id` | `alternative`, `alteration`, `altered the template`, `alter table` (no ID/tugasan object after it) |
| context | ticket regex (`QA/II/ES/ticket/issue #NNNNN`) or bare number matching an `active.txt` block, or a `PT<STATE>/..` permohonan ID in prompt / prior turns | plain chat with no ticket/permohonan |

False-positive cost: one advisory block (~20 lines) on a non-alter ticket that quotes an alter sentence; bypass `[skip-alter-gate: <reason>]`.

## Verify

```
node domain/alter-ticket-gate/alter-ticket-gate.eval.js
```

Result at ship (2026-09-04): **20/20 green** (F2 = #275847 replay, F3 = #277926 solution-type replay, F18 Perak page vocabulary, F19 serahan-id relay, F20 playbook read beyond the tail). Live smoke on this session's real 6.4 MB transcript: reminder mode in 150 ms. Appraise (ASCR) refinements folded in before ship: Perak page vocabulary added to `ALTER_STRONG`; DFT serahan ids count as context; playbook-read check streams the WHOLE transcript (a Read 2 MB before the tail was invisible).

## Adversarial scenarios (system-design Rule 12 — 24 enumerated)

| # | Scenario | Verdict |
|---|---|---|
| 1 | Gate's own advisory (names the playbook, says "Initiate & Alter") sits in the transcript | handled — only `"file_path":…PLAYBOOK` counts as a read; own-output lines excluded from signal scan (F6) |
| 2 | Malformed / empty JSON stdin | handled — exit 0 silent (F1, F8) |
| 3 | Worktree session: no `quest/active.txt`, no `projects/` | handled — falls back to the main checkout path (`MAIN_ROOT`); eval overrides prove the path logic |
| 4 | Eval sandbox copy (lib not adjacent) | handled — `ROOT` from `CLAUDE_PROJECT_DIR`, hook-runtime resolved from ROOT |
| 5 | Bundle dispatch vs direct registration | accepted-risk — registered directly by forge like its siblings; contextOut via runHook |
| 6 | Two sessions on the same ticket | handled — reminder mode is per-transcript (playbook read in THIS transcript), no shared state |
| 7 | Playbook / state file deleted or renamed | handled — `⚠️ FILE MISSING` line (F12); playbook path is emitted regardless so the gap is visible |
| 8 | Bypass token in an OLD turn | handled — honoured only if in the prompt or an assistant line of the tail (F16); the user re-asking re-arms it |
| 9 | 2 MB transcript | handled — tail read (250 KB), no full parse (F13) |
| 10 | User instruction reversal: "this is a data patch, not an alter" | handled — `[skip-alter-gate:]`; rows are advisory, never block the patch |
| 11 | Ticket quotes a Melaka ID inside a Perak folder | handled — Task folder outranks ID prefix (F10) |
| 12 | State cannot be resolved | handled — `state=unknown` + ask line, never Melaka default (F11) |
| 13 | "alter" as English verb in unrelated chat ("alter the README table") | handled — needs ticket/permohonan context (F15) |
| 14 | "alternative", "altered by BA", "alteration" in a template ticket | handled — `\balter\b` + object requirement (F4) |
| 15 | DFT vocabulary: "SPI" exists only in a sub-flow, not the main model | handled by knowledge — Perak file §5 + A3 forces the edge-trace on the RIGHT model |
| 16 | Alter requested on an ended process (Tamat) | handled by knowledge — A1 + action table → Initiate→Alter or NOT EXECUTABLE |
| 17 | Alter requested on a counter-born serahan "so it regenerates" | handled by knowledge — A2 birth check |
| 18 | Twin nodes with identical kod | handled by knowledge — A3 edges + Perak page's Next Possible Flows |
| 19 | Credentials: hook or playbook tempted to embed the password | handled — creds only in the untracked Perak file; memory holds a pointer |
| 20 | Perak PROD engine unreadable → node picked from staging BPMN is wrong | accepted-risk with mitigation — Perak file §4 flags staging≠PROD; A3 requires confirming on the page's TaskMap |
| 21 | Hook fires on every turn of a long alter quest (bloat) | handled — reminder mode after the playbook read (F7) |
| 22 | Transcript path absent (SDK/headless) | handled — prompt + brief still evaluated; tail empty |
| 23 | Ticket number appears but active.txt block missing (never synced) | handled — no brief, prompt/prior-turn signals still work; state from ID prefix |
| 24 | Another hook echoes the bypass token in its help text | accepted-risk — token requires a `:` reason and only prompt/assistant lines count; help text of other hooks is system/user-role |

## History

- 2026-09-04 v1.0 — born (#275847 Perak + #277926 Melaka). Companion knowledge: `ALTER-TICKET-PLAYBOOK.md` (new), `perak/FLOWABLE-ALTER.md` (new), Melaka §6 pointer line.


## STATE-SCOPE (2026-09-04, multi-state audit)

state-scoped: **yes — keyed by state via lib/states.js** (system/states.json). No state literal remains in the hook; a new state is one registry row. Migration verified by this Feature's own eval (green) + 
ode lib/states.js check (this file no longer listed as UNROUTED). Spec-preservation (Rule 6 v1.2): every prior fixture kept and passing; the only behavioural change is that a non-Melaka state now resolves to ITS OWN folder/trunk instead of Melaka's.

