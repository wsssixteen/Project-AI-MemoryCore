# hook-syntax-check

symptom: 2026-06-20: silent-claim-drift-gate.js was a syntax ghost for about 3 weeks. It was registered but threw on every run, and system-audit only checks registration, never syntax.
goal: no registered hook stays broken, missing or untracked past one boot without being named
goal_signal: the boot line names every registered hook that fails node --check, is missing, or is not git-tracked; silent when all are clean
retention: regenerate
footprint: per-session: 1 node + 1 git call, plus one `node --check` only for a hook file changed since it last passed. Measured 2026-10-05: 0.46 s on a warm cache, ~18 s on a cold one (138 files); it was 12–20 s at EVERY boot before.
registration: 1 settings.json entry
telemetry_name: hook-syntax-check

**Installed** 2026-10-04 via `core/forge.js install hook` — moved unchanged from `.claude/hooks/hook-syntax-check.js`. The telemetry name `hook-syntax-check` is kept, so its fire history before and after the install is one series.

**v2 (2026-10-05, boot audit)** — three changes after the install, all in the hook's header:
1. **Cache** (`cache.json`, gitignored): a file whose mtime + size are unchanged since it last PASSED is not re-checked. A broken or missing file is never cached. Progress is saved every 20 files, so a cold run killed by the 30 s hook limit still leaves less for the next boot.
2. **One `git ls-files`** for the ship-check instead of one git spawn per hook.
3. **Coverage**: v1 read only the first quoted `.js` of a command, so it checked `hook-runtime.js` instead of the hook it wraps and never read bundle manifests. v2 checks wrapped targets and bundle children: 138 files, up from about 90.

**Observability**: central telemetry `system/telemetry/hook-fires.jsonl`, rows with `"hook":"hook-syntax-check"` (fired · blocked · dur_ms) + its own `log.jsonl`, one row per run: `checked · cached · broken · dur_ms` — `checked` near 0 on most boots is the proof the cache works.

**Eval**: `hook-syntax-check.eval.js` — 17 fixtures: install pins I1-I3 + behaviour S1-S11 (wrapped target, bundle child, missing file, untracked file, cold/warm counts, edit re-check, silent when clean, kill-recovery, fail-open on unreadable settings).

**state-scoped**: no, state-agnostic.
