# remote-access-check

symptom: 2026-11-01 miya after the RustDesk outage: 'Why can't you make this simple check every time you boot up? I had to go to office yesterday to resolve this'
goal: miya learns RustDesk is unreachable from the first session on the work laptop, before he depends on it from home
goal_signal: a session started while the RustDesk server is down carries a REMOTE ACCESS DOWN flag naming the failed port, and the briefing shows it
retention: rotate yearly
footprint: per-session: 1 node process, up to 3 s at session start on the work laptop only, under 0.2 s elsewhere
boundary: covers the RustDesk config, TCP connects to its server and one internet control, the RustDesk and AnyDesk service state · never changes a setting, restarts a service, or sends anything outside these connects · stops at printing the flag; the fix is his or the server owner's
self_audit: every run tests the live ports and services, nothing cached, then reads its own log row back and prints a warning if the row is missing
diagram: domain/remote-access-check/diagram.png
state-scoped: no, state-agnostic (one work laptop)

**What fires when**: SessionStart, on the work laptop PJNBRidhwan only. Other machines stay silent and make no connection.

**Contract**: read the RustDesk server from `%APPDATA%\RustDesk\config\RustDesk2.toml`, connect to its ports 21116 and 21117, connect to 1.1.1.1:443 as the internet control, and read the RustDesk and AnyDesk service state. Healthy prints one OK line. Anything wrong prints `REMOTE ACCESS DOWN` with the failed part. Run it on demand with `node domain/remote-access-check/remote-access-check.js`.

**Layer choice (Rule 7)**: hook plus script. A port test is mechanical, and a hook fires on every start where a rule in prose did not.

**Trigger moment (Rule 8)**: SessionStart, because miya asked for it "every time you boot up". A session start while he is in the office is the last moment he can act before leaving.

**Known limit**: it only runs when a session starts. An outage that begins after the last session of the day is not seen until the next start.

**Observability**: `domain/remote-access-check/log.jsonl` holds one row per run on the work laptop: ts, outcome, server, closed ports, internet, both service states, dur_ms.

| Part | File |
|---|---|
| Check | `domain/remote-access-check/remote-access-check.js` |
| Hook | `domain/remote-access-check/remote-access-check.check.hook.js` (registered in `.claude/settings.json` SessionStart) |
| Eval | `domain/remote-access-check/remote-access-check.eval.js` (17 fixtures) |
