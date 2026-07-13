# AGENT-ARCHITECTURE.md — operator's guide

> **For みや.** How the system is built, and how to drive it.
> **Supersedes** `MIYA-NOTEBOOK.md` (2026-05-23, describes the 2-hook era) and overlaps `usage-guidance` skill — Ruri: tombstone both against this file at next consolidation. One home per concern.
> **Written** 2026-07-12 by the external auditor (Claude Fable 5). Sections marked ⏳ describe the post-kernel state and activate as the roadmap lands.
> **Maintenance rule:** when the registry (K4) ships, the inventory tables here get generated, not hand-edited.

---

## 1. What this system is (30 seconds)

Ruri is a Claude agent with persistent memory, working Etanah tickets through a fixed loop: **Scout → Recon → Rubric → Apply**. Around that loop sit three layers: **prose** (identity, knowledge — the model's judgment), **skills** (procedures loaded just-in-time), and **hooks/gates** (code that fires deterministically). The current improvement plan (see `external-audit/`) is moving skeleton-work from prose into a small code kernel: boot assembly, validated state, one gate runtime, a generated registry, telemetry, and the forge (all new components born tested + registered).

## 2. Daily rhythm

**Session start.** Ruri boots and emits a Session Briefing: date, open quests, mode, top priority, standing flags. If the briefing is missing or thin, say: `run the session briefing`.

**During work.** You mostly say ticket numbers and "go". The machinery arms itself on your words (see §3). Hand back test results + `server.log` after testing; you'll get a confidence % and commit/rerun advice.

**Session end.** Say `save all` (or `wrap up` / `goodnight`). That fires Domain Expansion: state saved, diary written, commits pushed. If it ends without naming what was committed/pushed, ask: `emit the per-file disposition`.

## 3. Trigger reference — say this, that fires

| You want | Say | What fires |
|---|---|---|
| Start a ticket | `let's start with 262233` (any ticket form works) | ticket-gate → Phase-0 checklist, git-state check, quest machinery |
| Resume a ticket | `resume 262233` / `back to 262233` | resume-preflight → context re-load, Notes/History checks |
| Pause / park a ticket | `hold QA-262233` | quest hold + resume-readiness snapshot |
| Close / archive | `close QA-262233` | close-phase → Phase 1/2 sequence, archive hygiene |
| Big file investigation | `/familiar <task>` | subagent with fresh context |
| Stress-test a plan | `/appraise <subject>` or `grill me` | Socratic interrogation loop |
| Verify a checkpoint | `/verify` | green/red checklist against evidence |
| Check/switch environment | `/env-check` | UAT/FAT config + branch alignment |
| Static bug scan | `/scan` | PMD + SpotBugs on etanah Java |
| Full code review | `/review-etanah` | scan → code-review → security-review |
| Explain architecture | `kowalski <topic>` | two-diagram explainer |
| Extract lessons from a closed fix | `learn from QA-262233` | 5-section lesson extract |
| Park an idea | `remember later: <thing>` | todo entry |
| See the backlog | `what are our to-do lists` | todo readout |
| Sync Redmine | `redmine sync` | `redmine-sync.js` (real HTTP) |
| Git sanity | `/git-health` | 3-tier check + safe fixes |
| System audit | `/system-check` | 5-familiar deep audit |
| Before building anything meta | `/system-design` then `/system-rules` | design discipline gates |

**Rule of thumb:** slash-command or plain ticket number = deterministic trigger. Long descriptive requests = the model guessing. Prefer the former.

## 4. Reporting a mistake (the self-improvement loop)

- Say it bluntly: `you missed X` / `why didn't you check Y` / `that's wrong, the real cause is Z`.
- Those phrases fire the mistake pipeline (slip-log entry + guard response).
- **During the current guard freeze:** the correct response is telemetry, an eval fixture, a consolidation, or a deletion — NOT a new rule/hook. If Ruri proposes a new guard, point at the freeze.
- ⏳ Post-forge: the response becomes `forge a check for X` — born registered + tested, or nothing.

## 5. The evidence habit (your half of the loop)

The system's #1 failure is claiming work that didn't happen. Your counter-moves, verbatim:

- `show me the diff` — for any "fixed/changed" claim.
- `show the commit hash` — for any "committed/pushed" claim.
- `show the telemetry line / fire log` — for any "the hook handles that" claim.
- `run the eval and paste the output` — for any "it works" claim.
- `is that VERIFIED or HYPOTHESIS? label it` — for any diagnosis.
- For plan status: `emit the status table from addendum §4.2 with artifact evidence per row`.

A claim without an artifact is a hypothesis. You holding this line is what trained the plan; the kernel exists so you eventually won't have to.

## 6. Anti-patterns (things that misfire)

- Vague self-improvement asks (`be better about X`) → produces prose rules that decay. Name the concrete check instead.
- `can you maybe...` / open-ended options → invites ask-back stalls. Say `go` / `do X`.
- Hand-editing `quest/active.txt` or state files → can silently corrupt blocks. Ask Ruri to use the CLI.
- Accepting `we already do that` → demand the §5 artifacts.
- Building guards mid-ticket → historically produces orphans. Meta-work gets its own session.
- Pasting big new rule text into CLAUDE.md directly → route through `/system-design` (and ⏳ the forge).

## 7. The improvement plan — how to drive it

- Master files: `external-audit/2026-07-11-agent-handoff.md` (work order) → audit report → core blueprint → build-pipeline addendum.
- Kick or re-kick it: `read external-audit/2026-07-11-agent-handoff.md and execute from your current position`.
- Check position: the §4.2 status-table phrase from §5 above.
- Phase gates: no Phase 2 building until Phase 0/1 rows all have artifacts; forge before any other component.
- Monthly: re-run an external fresh-context audit (this session's method). Quarterly: one on a different model family.

## 8. ⏳ After the kernel lands (Phase 2–3)

- `node core/forge.js new check <name>` — the ONLY way components get created.
- `REGISTRY.md` — generated inventory; answers "what exists, who owns it, does it fire."
- Telemetry report — on demand (`print the telemetry summary`) and auto at session close; the weekly roll-up is only for trends and tripwires.
- Spot-fixing the agent: `forge a check for <the thing it missed>` — built, registered, eval'd, and smoke-fired in the same minute; the testing you used to skip is automatic and unskippable.
- Weekly `dream` / consolidation pass — merges dupes, prunes, retires; expect a one-page diff report.
- Boot budget ≤25K tokens — if boot feels bloated, ask: `print the boot bundle manifest and token count`.

## 9. Where truth lives (small map)

| Question | File |
|---|---|
| What's open right now | `quest/active.txt` (⏳ `quests.jsonl`) |
| What happened, day by day | `daily-diary/current/` |
| What went wrong, categorized | `meta/slip-log.md` (⏳ `slips.jsonl` + dashboard) |
| What the system promises | `.claude/CLAUDE.md` (shrinking to a manifest) |
| What actually exists | ⏳ `REGISTRY.md` (generated) — until then, trust `settings.json` + disk over any hand-written index |
| The improvement plan | `external-audit/` |
| This guide | `AGENT-ARCHITECTURE.md` — root, one copy, supersedes MIYA-NOTEBOOK |
