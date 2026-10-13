# Assessment — 2026-10-13 (session be5b16b4, 2026-10-10 to 2026-10-13, home computer, DawahMap + Mizan + Haiku trial)

Step 7.5 of Domain Expansion. Every claim carries the instance that shows it. No ticket was worked in this session.

## A1 — Agentic system

| Failure class | The instance |
|---|---|
| A fleet was launched without reading the usage meter | 2026-10-11, run `wf_41a7cf84-773`: 92 agents, 13.59 M tokens, and its last agent failed on the weekly limit. Since then the meter is read and shown before every fan-out; the three later runs came in at 1.67 M, 2.58 M and 0.35 M. |
| Estimates of a run's cost were low twice | Haiku audit round: 0.2 M estimated, 0.35 M used. Style B run: 2.4 M planned, 2.58 M used. Cause both times: about 88 K of each agent's tokens is this repo's own start-up context, which the estimate left out. |
| A build was shipped before its shape was shown | Twice, slip `build-missed-requirement`: a forced single line for a branching flowchart (2026-10-12), then an indented list for a tree and a dark palette nobody asked for (2026-10-13). He had to send two reference pictures. |
| A reader's output was applied without my own read | The 60 replacement lines of the style B review went in by script; the 46 proof verdicts are reported from the agents' files. Both are named as unread by me in the project's roadmap. |
| A new guard misread an unrelated command | 2026-10-13: `adhoc-brief-first` blocked a log merge because the file name `adhoc-save-audit.jsonl` contains `adhoc-save-audit.js`. |
| Save rules count OneDrive conflict copies as touched parts | 2026-10-13: `node lib/save-rules.js` listed four Features (`overview-steps`, `quest-doc-freshness`, `quest-objective-anchor`, `codemap-recon-consult`) only because a `log-PJNBRidhwan-N.jsonl` copy sat untracked in their folders; 12 of 14 FAIL rows came from that. |

## A2 — Quest workflow

⏭ No quest was worked in this session.

## A3 — Debugging efficiency and accuracy

| Failure class | The instance |
|---|---|
| A loud symptom hid its cause for the whole session | On this computer `.git\index` is missing and OneDrive is not running. Every boot printed "136 registered hooks are GHOSTS" and `git status` showed 1277 deletions. Neither line names the cause. It was found only at the commit, by counting the index (0 files) against HEAD (1277). A bare commit would have deleted every tracked file. |
| A fetch error named the wrong thing | `git fetch` said "did not send all necessary objects". The real cause: two branch ref files are OneDrive cloud-only placeholders that cannot be read while OneDrive is stopped. Found by reading the ref file itself ("The cloud file provider is not running"). |

## A4 — Etanah issue-solving

⏭ No etanah work in this session.

## A5 — Sweep / file sweep

| Failure class | The instance |
|---|---|
| After a compaction the summary is the only copy of his words unless they are copied out | 2026-10-13: the session compacted before he could. His popup answers and the messages he sent mid-turn sit in three different record kinds of the transcript (a tool result, a queue record, a plain prompt). A one-off script copied 14 entries into the project's roadmap. Nothing does this by default. |

## Proposals logged (each with its eval case)

Logged with `node core/slips.js add --type proposal`; they show under Open proposals in `system/slip-dashboard.md`.

1. A1 · show the shape before a visual build.
2. A3 · a boot line that names a missing git index, in place of the ghost-hook list.
3. A1 · `adhoc-brief-first`: the audit pattern must not match the `.jsonl` log.
4. A1 · save rules: a OneDrive conflict copy is not a touched part; fold its rows at housekeeping.
5. A5 · his own words copied from the transcript at every save after a compaction.
