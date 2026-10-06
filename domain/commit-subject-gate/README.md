goal_status: draft (derived from registry on 2026-09-06; promote with node lib/goal-backfill.js promote commit-subject-gate)
symptom: QA-277697 2026-09-02: five drafts of one subject, each longer, with ';', dashes and 'keep 3 trg pages' (a non-change) until miya wrote the message himself
goal: BLOCK when the subject breaks the deterministic shape: ';' or dash inside the description, arrows/pipes, a non-change word (keep/kept/leave/left/untouched/unchanged/retain/remain/still), length > 100 chars, or a redraft LONGER than the previous draft for the same ticket in this transcript
goal_signal: the Stop fire produced: BLOCK when the subject breaks the deterministic shape: ';' or dash inside the de
retention: rotate monthly
# commit-subject-gate

**What fires when**: Stop — the reply carries an etanah commit subject: a fenced block whose only line matches `^(QA|Ref) #NNN - `, or a `git commit -m "…"` string inside a fenced block.

**Contract**: BLOCK (exit 2) when the subject breaks any of eight deterministic rules (R7 is the commit-time verb check in `commit-gate.js`, not in this gate):

| Rule | Check |
|---|---|
| R1 | no `;` |
| R2 | no en/em dash; at most 3 spaced ` - ` separators (prefix, URUSAN, TUGASAN, description); none inside the description; intra-word hyphens (int-env, e-Doket) allowed |
| R3 | no arrows (`->`, `=>`, `→`) or pipes |
| R4 | no non-change word in the description: keep, kept, keeping, leave, leaving, left, untouched, unchanged, retain(ed), remain(s), still |
| R5 | subject ≤ 100 characters |
| R6 | a redraft for the same ticket is never longer than the previous draft in this transcript |
| R8 | mixed but mainly English: no marker phrase anywhere (SEMAKAN SAHAJA, belum diuji, review only, untested, WIP); and the description is not mainly Malay. Of its lowercase-initial words, N in all, M are Malay function words (dan, yang, tidak, buang, banding, untuk, dengan, ...); block when M >= 3 AND M*2 > N (exactly half passes). Capitalised screen and button names never count; Jana Semula, Muat Naik and Muat Turun are also ignored in lowercase |

Bypass: `[skip-commit-subject: <reason>]` in the same reply.

**Why**: QA-277697, 2026-09-02. Five drafts of one subject, each longer than the last, carrying `;`, dashes and "keep 3 trg pages" (a non-change), until miya wrote the message himself. The prose rule in `.claude/commit-conventions.md` and the commit-time Check 0 in `.claude/hooks/commit-gate.js` both existed; neither fires at DRAFT time, which is when the damage is done.

**Layer choice (Rule 7)**: hook-only. Every rule is a string check; no judgment step needs a skill. The prose rule already existed and was skipped five times in one hour.

**Trigger moment (Rule 8)**: Stop, gated on a fenced subject being present in the LAST assistant message. It does not fire on prose, on SQL blocks, or on replies without a subject. Firing at commit time (commit-gate) is too late: miya has already read and rejected the draft.

**Pair**: `.claude/hooks/commit-gate.js` Check 0 (commit-time, same R1–R5 plus verb-vs-staged-diff consistency) is the second line; this gate is the first.

**Observability**: every fire appends to `domain/commit-subject-gate/log.jsonl` via `lib/hook-runtime.js`: `ts`, `event`, `fired`, `blocked`, `bypassed`, `dur_ms`.

**state-scoped**: no, state-agnostic (subject shape is the same for every state's repo).

**Eval**: `node domain/commit-subject-gate/commit-subject-gate.eval.js` — 54 fixtures including the replay and the R8 block/pass set.

## Adversarial scenarios (system-design Rule 12)

| # | Scenario | Verdict |
|---|---|---|
| 1 | own block text quoted in prose contains "keep" and " - " | handled, only fenced subjects are parsed (F19) |
| 2 | malformed JSON stdin | handled, exit 0 (F1) |
| 3 | plain-text transcript | handled, exit 0 (F17) |
| 4 | missing transcript path | handled, exit 0 (F18) |
| 5 | worktree vs main repo path | handled, ROOT from CLAUDE_PROJECT_DIR with __dirname fallback |
| 6 | eval sandbox copy of the hook without lib adjacent | accepted-risk, same as every forge-born check |
| 7 | bundle dispatch vs direct registration | handled, runHook emits standard JSON |
| 8 | bypass token in an OLD turn | handled, only the last assistant text is checked for the token (F12 is same-turn) |
| 9 | huge transcript | accepted-risk, linear parse, same as sibling gates |
| 10 | subject inside a bash block as `git commit -m` | fixture-added (F13) |
| 11 | subject inside a SQL block or other fence | handled, non-subject fences ignored (F14) |
| 12 | lowercase `ref #` | fixture-added, case-insensitive (F20) |
| 13 | CRLF and trailing spaces in the fence | fixture-added (F21) |
| 14 | a real change word that is also a non-change word ("left panel") | accepted false positive, bypass exists (F22) |
| 15 | two subjects in one reply, one bad | fixture-added, the bad one is named (F24) |
| 16 | longer redraft for a DIFFERENT ticket | handled, comparison is per ticket (F11) |
| 17 | shorter redraft | handled, passes (F10) |
| 18 | the approved 2026-09-02 message | passes (F3) |
| 19 | canonical 3-separator subject | passes (F5) |
| 20 | intra-word hyphen | passes (F16) |
| 21 | arrows and pipes | blocked (F15) |
| 22 | a `-m` with single quotes | handled by the quote-agnostic regex |
| 23 | user-instruction reversal: miya dictates the exact wording that breaks a rule | bypass token with reason, never silent |
| 24 | subject drafted in prose, not fenced | accepted-risk, the convention says subjects are shown in a fence |
| 25 | R8: three rejected 2026-10-05 subjects (#244600) | blocked: two by marker, one mainly Malay (F25 to F27) |
| 26 | R8: five accepted subjects with Malay screen names | pass (F34 to F38) |
| 27 | R8: Jana Semula and Muat Naik, capitalised or lowercase | pass (F39, F40) |
| 28 | R8: one "dan" in the URUSAN segment | pass, only the description is scanned for words (F41) |
| 29 | R8: marker in lowercase, uppercase or inside the URUSAN segment | blocked (F29, F30, F32) |
| 30 | R8: English "fail" with a single hit | pass, needs M >= 3 (F42) |
| 31 | R8: Capitalised Kaki Lima, Papar, Simpan | pass (F43, F44) |
| 32 | R8: "wiper" vs marker WIP | pass, whole-word match (F45) |
| 33 | R8: mainly-Malay description (5 of 6, 3 of 4, 5 of 7 lowercase words) | blocked (F31, F33, F49) |
| 34 | R8: one or two lowercase Malay words | accepted-risk: mixed is allowed by owner ruling (F46, F53) |
| 35 | R8: bypass token | pass, same token as R1 to R6 (F48) |
| 36 | R8: block text carries the M of N count and the write-it-in-English instruction | effect fixture (F47) |
| 37 | R8: mixed subjects, 0 of 8 and 1 of 3 Malay words | pass (F50, F51) |
| 38 | R8: exactly half Malay (4 of 8) | pass, the rule needs more than half (F52) |
| 39 | R8: Capitalised first Malay verb ("Buang logger ujian") | pass, only lowercase-initial words count (F54) |
