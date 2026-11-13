# ownership-input-check

symptom: 2026-10-01 #282442: miya - audit why you missed it the first time (we called it common/GIS, GIS showed our kodPejabat was empty)
goal: an ownership hand-off only leaves us after the values we sent into the other module were traced, so a bad input of ours is never billed to another team
goal_signal: reply with an ownership verdict contains an Input check line
retention: rotate monthly
footprint: per-turn: one node process at Stop, reads the transcript tail, under 30 MB

**What fires when**: Stop — reply declares another team owns an etanah error (OWNED-ELSEWHERE / not our issue / common issue / GIS issue / bukan isu kami)

**Contract**: block unless the reply carries an 'Input check:' line naming each value our code passed into the other module's call and where it came from. **Handover rider (2026-11-13, 289337)**: when the same turn also stages a note or fix file for that team (the Redmine notes box, a file upload, a write under `2. Fix\` or `N. Rework\`), block unless the reply carries `Handover: proof … · fix … · audit …` from the `/handover` skill; `fix none:` only as data, config or env.

boundary: covers the current turn's reply text and tool inputs at Stop · never edits a file or the Redmine form · stops at one block naming the missing line; the fix is the reply's

**Layer choice (Rule 7)**: hook-only. Whether an Input check line sits next to an ownership verdict is mechanical; tracing the values is judgment and lives in the quest Recon row + ADHOC-TRIAGE Step 3 rule 6. Runs inside the `stop-claim-integrity` bundle (system-rules Rule 7), no standalone registration.

**Trigger moment (Rule 8)**: Stop, only when the current turn's assistant text carries an ownership verdict phrase. The reply is the moment the hand-off reaches miya or the other team.

**Observability**: every fire appends to `domain/ownership-input-check/log.jsonl` — one row per fire: `ts · outcome (pass|blocked|bypassed) · verdict (matched phrase) · handover (missing|bad-none|ok|"")`. Eval 37/37 incl. the 2026-09-30 replay and the 289337 replay (H1, H15).

**state-scoped**: no, state-agnostic.
