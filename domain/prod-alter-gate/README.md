# prod-alter-gate

symptom: 2026-10-21 miya /goal: "why can you not run an alter patch ticket when we already have access through the UI" — PROD alters needed miya's hands on the Alter page; a self-run with no approval would move a live PROD token unreviewed
goal: a PROD alter runs only on a plan miya approved in chat, bound to the exact plan code
goal_signal: log.jsonl rows outcome=allowed/blocked per PROD alter attempt; every allowed row has the code in last_user
retention: keep
footprint: per-tool: one node process per Bash/PowerShell call, under 40 MB, exits at once (no Bash/PowerShell bundle exists to join)

**What fires when**: PreToolUse on Bash|PowerShell — a command runs `alter.js` (E:\Dev\scripts\FlowableAlter) with an approval env (`prod`, plus any env marked `"approval": true` in its envs.json) and without `--dry-run` / `--login` / `--help`.

**Contract**: BLOCK unless the command carries `--approve <code>` AND miya's LAST message carries that same code with an approval word (approve · approved · lulus · go · proceed · yes · ok · setuju · boleh) and no negation in the same sentence, or his AskUserQuestion answer carries it. A question about the code, an older message, or the code only in my own text does not count.

**The whole PROD alter route** (this gate is step 4):

| # | Step | Who | Where |
|---|---|---|---|
| 1 | Alter-ticket rows A0–A4 (resolve, live process, edge-trace, action) | Ruri | `projects/coding-projects/active/etanah-knowledge/ALTER-TICKET-PLAYBOOK.md` |
| 2 | `node alter.js --env prod ... --dry-run --headless` → plan + APPROVAL CODE (plan sealed in `logs\plans\<code>.json`) | Ruri | `E:\Dev\scripts\FlowableAlter\alter.js` |
| 3 | show the plan + code in chat (or an approval popup) | Ruri → miya | chat |
| 4 | **this gate**: the real run passes only with his approval of that code | hook | here |
| 5 | alter.js re-reads the live page; any difference from the sealed plan → stops before the click; code is single-use, 60 min | alter.js | `alter.js` `loadApproved()` / `proceed()` |
| 6 | AFTER check: new live `umm_a_tgsn` row of the target kod, polled 90 s through the db-gateway (SELECT only) | alter.js | `alter.js` `verifyAfter()` |
| 7 | done-alter reply (§5.1) | Ruri | playbook |

**Layer choice (Rule 7)**: hook-only. The approval is a yes/no fact in the transcript; a skill would rely on me remembering to ask. The plan-binding half lives in alter.js itself (the tool refuses a mismatched plan even if this hook were gone).

**Trigger moment (Rule 8)**: PreToolUse on the exact command that clicks Proceed on PROD — the last moment before the irreversible step, and the only one.

**Observability**: `domain/prod-alter-gate/log.jsonl` — one row per decision: `ts · outcome (allowed|blocked) · why · code(s) · last_user (160 chars)`. alter.js writes its own run log + before/after screenshots under `E:\Dev\scripts\FlowableAlter\logs\<date>\`.

**state-scoped**: no for the gate (keyed by alter.js env names). The tool's envs.json is keyed by state (`melaka` today); a Perak/Terengganu block added there with `"approval": true` on its prod env is gated with no change here.

**Adversarial scenarios (Rule 12)**: 27 fixtures S1–S27 + E1/E2 in `prod-alter-gate.eval.js` (31/31 green 2026-10-21). Accepted risks: (a) I could hand-write a transcript line — the transcript is the harness's file and the code also has to match a plan alter.js sealed, so a forged approval still needs a real dry-run of the exact plan; (b) a run through the browser tools (clicking Proceed on the PROD page in Edge) is outside this gate — the playbook bans that route for PROD.
