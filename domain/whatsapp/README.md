goal: miya hears what a WhatsApp group says in Ruri's own third-person words, from a read-only path that never touches send or read receipts
retention: keep
symptom: 2026-09-10 reading WhatsApp through computer-use on the desktop app leaked sender names and near-verbatim text into the reply and marked one group as read
goal_signal: a reply about a WhatsApp group is a third-person paraphrase with no sender name, and `node domain/whatsapp/eval.js` is green
footprint: always: one node process from logon (the WaRead watcher daemon, task `WaRead Watcher`), RAM not measured on 2026-11-10; the skill itself is on-demand with no process
state-scoped: no, state-agnostic (each watched room carries its own state in `watcher.config.json`)

# whatsapp — read-only group reader (skill + eval)

- Skill: `.claude/skills/whatsapp/SKILL.md` (born via core/forge.js 2026-09-10)
- Eval: `node domain/whatsapp/eval.js`
- Tool: `E:\Dev\scripts\WaRead` (own git repo; selftest `node E:\Dev\scripts\WaRead\_selftest.js`)
- Link data: `%USERPROFILE%\.wa-read\auth` — never in either repo

Why it exists: on 2026-09-10 reading WhatsApp through computer-use on the desktop app leaked sender names and near-verbatim text into the reply, marked one group as read, and then the app stopped taking input before the second group could be read. The linked-device reader removes the desktop app from the path entirely and walls the socket to read calls only.

## Watcher (built 2026-09-14, goal "working tomorrow")

- Rules the judge reads: `RULES.md` · map + decisions: `MAP.md` · portable install + proof steps: `SETUP.md`.
- Daemon + reader live in the WaRead repo: `E:\Dev\scripts\WaRead\wa-watch.js` (always-on at logon via Task Scheduler `WaRead Watcher`), `lib/watcher/*`, config `watcher.config.json`.
- Observability: `%USERPROFILE%\.wa-read\events.jsonl` (open / backlog-done / judge / judge-fallback / verdict / child-start / child-done / child-failed / child-retry / pending-carried / heartbeat every 5 minutes with pid / daemon-stop with reason / check-login / close / error), day registry `%USERPROFILE%\.wa-read\watcher\registry-<date>.json` (with `pending` = starts waiting), `node wa-watch.js status` (health lines + last 7 days). A stopped watcher, a dead login or a waiting start is alarmed at session start by `domain/wa-watch-health/`.
- Evals: `node E:\Dev\scripts\WaRead\_selftest.js` (51) + `node E:\Dev\scripts\WaRead\watcher-selftest.js` (78), plus the dry runs in SETUP.md §4.
- Fast lane (2026-11-10 per miya: "for the whatsapp message should be much quicker"): a failed judge call falls back to the rules (`fallbackVerdict`), so a ticket number or a permohonan id with issue words still starts its session at once; a child that fails to start is logged `child-failed` and waits in `pending`, retried every 5 minutes (a login failure waits for a newer good `check-login`).
- Office reports (2026-11-10 per miya: "start after 2"): a message that starts with an office code (`PDTMT`, `PDTJ`, `PDTAG`, `PTG…`) is held 2 minutes (`lib/watcher/officewait.js`, `officeWaitMs`), then judged once together with the lines that followed, so the BA's own words are in the first read. Log rows: `office-wait`, `office-flush`. Rules: `RULES.md` section 1b.
- Retention: events.jsonl rotate · registries keep · handovers/children logs rotate after 30 days · adhoc-week.txt regenerate.
