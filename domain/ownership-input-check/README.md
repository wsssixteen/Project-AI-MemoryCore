# ownership-input-check

symptom: 2026-10-01 #282442: miya - audit why you missed it the first time (we called it common/GIS, GIS showed our kodPejabat was empty)
goal: an ownership hand-off only leaves us after the values we sent into the other module were traced, so a bad input of ours is never billed to another team
goal_signal: reply with an ownership verdict contains an Input check line
retention: rotate monthly
footprint: per-turn: one node process at Stop, reads the transcript tail, under 30 MB

**What fires when**: Stop — reply declares another team owns an etanah error (OWNED-ELSEWHERE / not our issue / common issue / GIS issue / bukan isu kami)

**Contract**: block unless the reply carries an 'Input check:' line naming each value our code passed into the other module's call and where it came from

**Layer choice (Rule 7)**: hook-only. Whether an Input check line sits next to an ownership verdict is mechanical; tracing the values is judgment and lives in the quest Recon row + ADHOC-TRIAGE Step 3 rule 6. Runs inside the `stop-claim-integrity` bundle (system-rules Rule 7), no standalone registration.

**Trigger moment (Rule 8)**: Stop, only when the current turn's assistant text carries an ownership verdict phrase. The reply is the moment the hand-off reaches miya or the other team.

**Observability**: every fire appends to `domain/ownership-input-check/log.jsonl` — one row per fire: `ts · outcome (pass|blocked|bypassed) · verdict (matched phrase)`. Eval 22/22 incl. the 2026-09-30 replay.

**state-scoped**: no, state-agnostic.
