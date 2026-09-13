goal: miya hears what a WhatsApp group says in Ruri's own third-person words, from a read-only path that never touches send or read receipts
retention: keep

# whatsapp — read-only group reader (skill + eval)

- Skill: `.claude/skills/whatsapp/SKILL.md` (born via core/forge.js 2026-09-10)
- Eval: `node domain/whatsapp/eval.js`
- Tool: `E:\Dev\scripts\WaRead` (own git repo; selftest `node E:\Dev\scripts\WaRead\_selftest.js`)
- Link data: `%USERPROFILE%\.wa-read\auth` — never in either repo

Why it exists: on 2026-09-10 reading WhatsApp through computer-use on the desktop app leaked sender names and near-verbatim text into the reply, marked one group as read, and then the app stopped taking input before the second group could be read. The linked-device reader removes the desktop app from the path entirely and walls the socket to read calls only.

## Watcher (built 2026-09-14, goal "working tomorrow")

- Rules the judge reads: `RULES.md` · map + decisions: `MAP.md` · portable install + proof steps: `SETUP.md`.
- Daemon + reader live in the WaRead repo: `E:\Dev\scripts\WaRead\wa-watch.js` (always-on at logon via Task Scheduler `WaRead Watcher`), `lib/watcher/*`, config `watcher.config.json`.
- Observability: `%USERPROFILE%\.wa-read\events.jsonl` (open / backlog-done / judge / verdict / child-start / close / error), day registry `%USERPROFILE%\.wa-read\watcher\registry-<date>.json`, `node wa-watch.js status`.
- Evals: `node E:\Dev\scripts\WaRead\_selftest.js` (51) + `node E:\Dev\scripts\WaRead\watcher-selftest.js` (35), plus the dry runs in SETUP.md §4.
- Retention: events.jsonl rotate · registries keep · handovers/children logs rotate after 30 days · adhoc-week.txt regenerate.
