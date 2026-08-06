# Improvement Sweep — 2026-08-06 session 4 (QA-273455, Phase 0 → int-env)

> DE Step 7.5. Third assessment file for 2026-08-06 (`-2026-08-06.md` and `-2026-08-06b.md` are
> earlier sessions' — not overwritten). Every claim carries the instance that proves it.

---

## A1 — Agentic system

**⏭ No fan-out this session.** Every step ran in the main loop: 6 attachment reads, 8 DB queries,
4 Maven compiles, the git sequence. Zero subagents spawned.

Worth recording as a datapoint rather than a gap: this was a single-ticket, deep-trace session, and
the Delegation Economy's own rule (scout inline first, delegate only an enumerable work-list) says
solo was correct here. The one place a familiar would have helped — reading the 6 attachments in
parallel — is the same place a **mechanical gate** helps more, because the failure was not slowness,
it was not looking. See A5.

---

## A2 — Quest workflow

**Two real defects, both now closed with gate rows.**

| # | Instance | Fix landed |
|---|---|---|
| 1 | The mandatory per-file attachment emit (Quest Preparation Verification, added 2026-06-03) was skipped by the 08-04 sweep AND the 08-06 sweep. 4 of 6 files never reached the qa_doc; the unread one was the **reported case's own screenshot** | Slip `ba-evidence-not-checked` + proposal A5 (below). Rule exists, enforcement does not |
| 2 | Handed over a test scenario naming an `et_main_mlit` app while the repo sat on `mlk/int-env` — both halves of "run this against this base" unmeasured | **BUILT**: 2 new rows in the `quest` skill Pre-emit gate (`SKILL.md:152-153`) — test base MUST be `mlk/master` at behind-count 0 with only the fix modified; env MUST be DERIVED from the Spring JNDI binding resolved against `standalone.xml`, never named from memory or the ticket's `Env:` line |

**A third, unfixed**: the qa_doc contained two *contradicting* recommendations (§0a said write-side,
§4 said read-side "R alone is the smallest thing that closes the BA's ticket"). Nothing flagged the
contradiction; I followed the newer section and built the wrong half. See proposal A2 below.

---

## A3 — Debugging efficiency + accuracy

**Cost to みや this session: one broken build + two wrong diagnostic instructions.**

| Claim I made | What killed it | Cheapest check that would have |
|---|---|---|
| "BUILD SUCCESS, deploy ready" | his int-env build: *variable praHakmilikList is already defined* | compile the **merge commit**, not the base — 90 s |
| "broken partial clone, `rm -rf` it" | `target/` stamped 19:16, one line below the 19:15 I read | read every timestamp in the listing — 5 s |
| "disk full on the build host" | `df -h` → 62 G free | the same `df -h` I asked for, run before theorising |
| "`sudo systemctl start jboss`" | `app` is not in sudoers — shown minutes earlier for `journalctl` | re-read the scrollback I already had |

**Pattern across all four**: each was an inference presented as an instruction, and each was refuted
by data already on screen or one command away. Not a knowledge gap — a looking gap.

**What worked**: the entry-point trace before hand-back. `mlkMaklumatTanahV3.xhtml:244` binds the
singular VO while the PT branch fills only the list — had I skipped that check, the test scenario
would have told him to open a panel that could never show the fix, and the fix would have looked
broken. That check cost ~4 tool calls and saved a full build-deploy-test cycle.

---

## A4 — Etanah issue-solving

**The knowledge base was ahead of the quest doc, again.** `DATABASE.md §16.3b` already documented the
partial-loss shape ("`luas` survives because it is a separate column … keluasan present, sempadan
blank") — the exact asymmetry I "discovered" from the screenshots. The qa_doc's evidence table had
flattened it. Second occurrence of `knowledge-file-existed-but-not-consulted` in one day (session 3
hit it on `DATABASE.md:970`).

**Banked this session**: `FLOW-TRACES.md` § PT Maklumat Tanah render chain (the list-vs-dialog trap,
the reference-assignment at `:4235`, the 18-call-site blast radius incl. 2 TRG forms) ·
`DEV-TESTING-HACKS.md` § server-side deploy family.

**Direct value to the next ticket**: 274136 is also a PT Maklumat-screen ticket. The render-chain
trace applies to it directly.

---

## A5 — Sweep / file sweep

**The decisive artifact was an unopened image, for the third time in three days.**

- 2026-08-05, #273919: BA's handwriting in `- PPJK - Isu.png` settled a question three expensive
  passes had argued.
- 2026-08-05, #273460: a 93 MB PROD video nobody had watched overturned a correction made from DB rows.
- 2026-08-06, #273455: `Skrin tugasan PTMLK-02-L-PT-2026-14.jpeg` — the reported case's own screenshot
  — showed only sempadan blank while the staging repro showed everything blank. Two prior passes had
  recorded them as the same evidence.

The rule against this exists in three places (`multi-dim-evidence` skill since 2026-05-14, the quest
skill's Quest Preparation Verification row since 2026-06-03, CLAUDE.md §8). All three are prose. The
count of times prose stopped it: **0**.

---

## Proposals filed to the weekly-audit lane

| Axis | Idea | Eval case |
|---|---|---|
| A5 | **brief-manifest gate** — enumerate `0. Brief/` at quest start, BLOCK the Recon/Rubric emit until every filename has appeared in a per-file content line this session | Replay #273455: an emit citing only `awam1.png` + `skm_bayar-kaunter.png` must FAIL naming the 4 unread files; an emit covering all 6 must PASS |
| A2 | **qa_doc contradiction check** — when two sections of one qa_doc recommend different fix candidates, surface it at quest resume instead of letting the newest section win silently | Replay #273455 as of this morning: §0a (write-side) vs §4 ("R alone is the smallest thing that closes the BA's ticket") must be flagged before Apply |
| A3 | **merge-target compile gate** — before pushing a merge to an env branch, require evidence that the MERGE COMMIT compiled, not the base | Replay this session: the `mlk/master`-only `BUILD SUCCESS` must FAIL the gate; the second attempt (checked out `intmerge-273455`, compiled, then pushed) must PASS |

Logged via `core/slips.js --type proposal`; they surface in `slip-dashboard.md` under
**💡 Open proposals** for BUILD / DROP / DEFER at the weekly audit.
