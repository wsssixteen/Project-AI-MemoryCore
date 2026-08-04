# NUKE-MARKER — knowledge-first-gate

| Field | Value |
|---|---|
| Created | 2026-08-05 |
| Session | #273201 rework-2. `PERANAN-MAP.md` §4-5 already documented `MlkPelupusanPegawaiAgihService` and the peranan hierarchy; skipped on the original pass, rework-1 and rework-2. miya stated the agihan-goes-downward rule himself: "THEY CAN ONLY GIVE PEOPLE OF LOWER RANKING". Nod: "WE COLLECTED ALL THE FUCKING INFO ABOUT ETANAH AND YOU'RE STILL THE SAME". |
| Files | `domain/knowledge-first-gate/knowledge-first-gate.check.hook.js` · `.eval.js` · `NUKE-MARKER.md` · `log.jsonl` · `.claude/settings.json` PreToolUse entry · `system/registry.jsonl` line |
| Rollback | `rm -rf domain/knowledge-first-gate/` · remove the PreToolUse entry matching `knowledge-first-gate` from `.claude/settings.json` · remove the `knowledge-first-gate` line from `system/registry.jsonl` |
| Retire | 2026-09-04 — delete this file if the gate has fired >=1x in the window AND no rollback |

**If it misfires**: the bypass is `[skip-knowledge-first: <reason>]` in the reply. Fastest kill is
unregistering from `settings.json`; the folder can stay.

**Known scope**: fires ONLY on `etanah-{pelupusan,common,awam,teknikal}` `.java` / `.xhtml` / `.jrxml`.
Deliberately NOT on `.json` / `.sql` / `.properties`, and not on MemoryCore tooling.
