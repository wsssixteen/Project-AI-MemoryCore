symptom: 2026-10-10 DawahMap miya: "By being FAIR I did not mean to be APOLOGETIC ... Create and build and save a process for you to be OBJECTIVE and FAIR" after versions 0.1 and 0.2 let objections through unchecked, cut the exchange after the objection and left the scholars of Islam out
goal: on a disputed question both sides are weighed with the same weights: each in its own specialists exact words, the exchange followed to its last published answer, every premise checked alike, and a reasoned verdict that says who answered whom
goal_signal: the reply or page that settles a disputed question carries a MIZAN line with the check result
goal_signal_regex: MIZAN: 
retention: keep
footprint: on-demand: nothing at boot, per prompt or per session; one question costs about 25 to 30 agents and one check about a minute
state-scoped: no, state-agnostic (it is about how a disputed question is weighed, not about an etanah state)

# Mizan — the scale: both sides weighed with the same weights, and the record proven

**Why (miya 2026-10-10, DawahMap)**: he asked for a map from reason to Islam, "the islamic worldview while at the same time make it fair". I built a neutral academic survey. He: "By being FAIR I didn't mean to be APOLOGETIC", then "use your own reasoning, to scrutinize the argument against … Check the rebuttals back and forth between the non-Muslims & muslim scholars … Muslims have been answering non-muslims for centuries … Create & build & save a process for you to be OBJECTIVE & FAIR. FIND AS MANY WAYS AS POSSIBLE. THIS IS A YOU MODEL PROBLEM." Then: "build a skill that is 100% empirically verified and can be proven BETTER than /deep-research … loops to fact-check/scrutinize/justify/counter/answer against itself many times until it reached a proper and fair … (current) conclusion." Then: "audit, assess, refine, improve, stress test … being honest on mentioning 'The party might have answered this through nnnnn but I cannot find the original writing, only the article by ..... which has the reputation of .....' when hitting a road block. Make sure even THAT is not a lie, proven."

## What was wrong, with the evidence

| The lean | Evidence in DawahMap 0.1 and 0.2 |
|---|---|
| Objections let through, claims squeezed | three objections accepted and later found false: a "641 eruption" (USGS dates the cones to about 13,000 years ago) · "no report of the fire seen from Busra" (Ibn Kathir reports it) · "the eclipse statement is a single report" (several Companions narrate it) |
| One side's specialists against the other side's raw texts | Western academics by name; the scholars of Islam as verse and hadith numbers; no Arabic library searched |
| The objection got the last word | the exchange stopped at the objection and was called "still open" |
| One method called evidence, the other belief | "what a historian can show / what Muslims believe" |
| Unequal burden | "cannot be excluded" was enough to mark a step contested |
| A lopsided panel | three critics pressing the claim, one defending it, none attacking the objections |

## Pieces

| Piece | Role |
|---|---|
| `.claude/skills/mizan/SKILL.md` | The invokable skill `/mizan`: the standard, the one rule, the loop, who does what, how to run it, what it cannot prove |
| `.claude/workflows/mizan.js` | The loop: advocates, two neutral readers, context readers, translator, fact-checker, completeness reader, second searchers, two blind judges, fairness reader; a `redo` entry runs a stage again as a new part, and its `repair` stage calls an advocate back to give again what the check refused |
| `lib/mizan.js` | `checks` · `check` · `render` · `outcome` · `lesson` · `lessons`. The check reads every source again, builds the case again, reads the agents' records again, runs 33 checks and works out the outcome from the marks |
| `verify.js` | Reads the sources: word-for-word search, context around the quote, flags, redirects, catalogue attribution, hadith gradings, Quran by reference; for a roadblock, the script's own library search |
| `find.js` | For agents: search the libraries by a phrase; read a page as the checker reads it |
| `case.js` | `new` · `build` · `join`. Builds the case from the agents' parts; a part cannot certify itself; a quote or a turn's date is corrected by its own side (`replaces`, `replaces_turn`); a wrong pair is planted to test the translator |
| `prove.js` | From the harness's records: each part is byte for byte what the agent given that task wrote; each listed search is one that agent really ran, counted only when it came back with an answer; each judge opened nothing that shows another's marks before his own were final; each translator wrote his own translation before opening the given English |
| `merge.js` | Repair of an older case file that has no parts |
| `ab.js` | Counts for comparing a Mizan case with a plain research pass on the same question |
| `checks.json` | MEMORY: the hosts that may not stand for a side, the pages that are a work itself, the unequal wordings, the thresholds, the search services and their control searches |
| `lessons.jsonl` | MEMORY: each thing I accepted that turned out false. Append-only |
| `mizan.eval.js` (+ `eval.js` entry) · `verify.eval.js` | 422 tests without the network (each check refuses its fault; the outcome table mirrors when the sides are swapped; the assembler, the planted pair, the proof of writers, searches and blindness); 79 tests against live pages and a local page server |
| `log.jsonl` | One row per check run: file, its hash, questions, failed, warnings, what was counted, failures per check |

No hook. Awareness comes from the skill description and from the pointers below.

## Trigger moment

The step that researches, writes or judges content on a question two camps dispute. Nothing runs at boot or per prompt.

## Who points to Mizan

| Caller | Use |
|---|---|
| `projects/coding-projects/active/DawahMap/PROOFS.md` | every node of the map is a Mizan case; the build runs the check before anything is published |
| `.claude/auto-memory/feedback_islamic_content_sources.md` | the source order for Islamic content |
| `.claude/auto-memory/project_dawahmap.md` | the project pointer |

## Requirements (his words → where each is encoded)

| His words | Encoded in |
|---|---|
| "By being FAIR I didn't mean to be APOLOGETIC" | `frame-words` (both directions) · `equal-burden` (one rule from points to outcome) |
| "you only gather what the Quran say" (the scholars' answers were missing) | `both-voices` · `both-libraries` (Arabic searches required for an Arabic library) |
| "take only from trusted sources … fact-check it against their verbatim words, make sure you can find them" | `verify.js` · `verbatim` · `attributed` · `first-hand` · `no-encyclopedia` · `hadith-graded` |
| "use your own reasoning, to scrutinize the argument against? Then justify?" | the neutral fact-check of both sides · `premises-proven` · `reasoning-shown` · `swap-test` |
| "Check the rebuttals back and forth between the non-Muslims & muslim scholars" | the rounds · `exchange-followed` · `turn-sourced` · `last-word` |
| "I have no issue admitting there are great non-muslim thinkers" | `best-advocate` · `both-voices` (one rule for both sides) · outcome `objection-stands` |
| "the LATEST, CURRENT conclusion" | `current` (dated, within 3 days of the check) · `later-position` · `verdict-fresh` |
| "'might have answered this through … but I cannot find the original writing, only the article by … which has the reputation of …' … Make sure even THAT is not a lie, proven" | `roadblock-honest`: the statement form, the script's own library search with control searches, the second search by another agent, `prove.js` |
| "100% empirically verified" | the MIZAN line counts found of total and ends at `unaccounted 0`; `provenance` · `record-intact` · the live re-read in `check` |
| "FIND AS MANY WAYS AS POSSIBLE" | 33 checks, each with a test that it refuses its fault; two red-team rounds of five attackers (2026-10-10 and 11): 110 proven holes, closed or stated as limits; the first real case through the final gate (2026-10-11): 4 faults in the case and 10 in the method, listed below |

## What the first real case found (T2, the fire of the Hijaz, 2026-10-11)

253 tests passed before it. The real case then failed 4 of 33 checks, and reading its failures showed faults in the method itself.

| Found in | Fault | What was done |
|---|---|---|
| the case | a magazine article quoted with nobody named as its publisher | the objection side gave it again with `via`; the page must now name him |
| the case | one passage of Ibn Hajar, quoted by BOTH sides, cut so that it misnames whom he calls weak | each side gave it again in full |
| the case | a named turn dated "modern" | corrected by its side with `replaces_turn` |
| the case | the verdict dated the day before the last search (the run passed midnight) | the judge takes the date from the machine when he rules |
| `prove.js` | a fetch that came back with an error was called "not in the record" | it is listed as made, and not counted as a search that looked |
| `prove.js` | one search written under several quotes was refused | it stands for the same listing written again; the same listing is counted once |
| `prove.js` | a shell command's one exit code was taken for all the searches in it | the find tool's own lines decide, search by search; a library that did not answer is not counted |
| `prove.js` | a command moved to the background was counted though its result was never read | only what the agent read back counts |
| `lib/mizan.js` | "today" was the day in Greenwich | the local day |
| `lib/mizan.js` | the outcome command showed the first judge the second judge's marks | `--blind` forms; blindness is proven from each judge's record |
| nowhere proven | "the translator worked from the original alone" | proven from his record; and he is tested with a planted wrong pair |
| nowhere proven | the date written on a named turn | compared with the library catalogue's date for the author or the edition |
| missing | a road to repair a turn or an item without reopening the exchange | `replaces_turn` · the `repair` stage |
| the launch | a repair run started by the workflow's name ran an older registered copy | the skill says: always `scriptPath` |
| missing | a judging run cut off after the judges (a crash) could not be finished: the fairness reader could only run together with new judges | the `swap` stage runs him alone on the newest ruling |
| `case.js` · `lib/mizan.js` | a fairness reader's refusal vanished from the case once the judges ruled again; the report then showed only the confirmed ruling | the finding stays with the ruling he read; the report prints it and the RECORD line counts it |

On 2026-10-11 the fairness reader refused the second ruling of this case: one point of the claim (C6) was confirmed on a narrower reading than its wording, while points of the objection were held to theirs. The judges ruled a third time. Every ruling and the refusal are in the record.

## What it does not do

It proves the record of the work, not the truth of the verdict. A case can pass every check and still reason badly. That is why the reasoning is written out, why two judges must agree, and why he reads last. The other limits are listed in the skill under "What it cannot prove".

## Eval

`node domain/mizan/eval.js` → 422 of 422 · `node domain/mizan/verify.eval.js` → 79 of 79 (2026-10-11 08:32, after the second batch of corrections). The second suite reads live pages: on 2026-10-11 one run failed 1 test while OpenAlex did not answer its control search, and the next run passed; later the same day the library's catalogue answered "too many requests" (HTTP 429) for about 40 minutes and 4 tests failed until it answered again. Since the second batch a page whose catalogue does not answer is reported as "not checked in this run: run again", never as "not his".

## Assessment and corrections (2026-10-11)

| What | Result |
|---|---|
| Fable 5.1 assessment, five lenses, each finding checked by a second agent (run `wf_98fd96a3-5dc`) | Mizan is not at 100%. The first trial's outcome "open" was produced by the method: the objection was built by an agent from the Muslim scholars' own books with no published critic; a book's silence and a "perhaps" were counted as quotes against; the claim side never got the turn to answer the last counter; a source declared "not found" was findable in the web archive. Results: `projects\coding-projects\active\DawahMap\research_notes\Mizan assessment by Fable 5.1 (2026-10-11)\RESULTS.md` |
| First batch of corrections, installed 07:36 | an objection built from the claim side's own scholars caps the outcome at "not determined"; the side that did not have the last word gets extra turns; the outcome is withheld while a check fails; a mark must say whether it rests on words, on silence or on a possibility; a named specialist is quoted or declared a gap; a roadblock is not accepted while the web archive holds a copy that was not read |
| Second batch, installed 08:32: the red team's 14 holes | 12 closed, 2 closed in part. Closed: a part an agent wrote and that is missing from the case; a judge who is not blind by what came back to him, not only by what he opened; a translator who saw the view before translating; a search whose written result does not match what came back; repair turns after the stop; a fairness reader's refusal followed by another's yes; a changed question; quotes listed as dropped that were never found; the second judge's marks tied to the quotes; the planted pair; a throttled catalogue; judges told not to open the checker's rules |
| Still open after both batches | a judge who transforms what he reads inside one command; an agent that overwrites a background output file and reads it back; a found quote removed by hand and listed as dropped; invisible text in a PDF and white-on-white text; a throttled web archive is still printed as a failed roadblock and not as "not run" |
| An existing case after the second batch | needs one `case.js build --final --full`: the page reader no longer records a hidden copy-text box as the words after a quote |
| The trial case under the second batch (run by the correcting agent) | 31 of 33 checks: the fairness reader's refusal now fails `swap-test` (rightly), and the roadblock fails (the paper is readable in the web archive) |
| みや's ruling, 2026-10-11 | "yes, my stance is towards Muslim for the app's direction." The loop, the advocates, the judges and the computed outcome are not run on DawahMap's content; only the quote check is used there (`verify.js`, `find.js`). The self-audit that led to it: `projects\coding-projects\active\DawahMap\research_notes\The Muslim Lantern reading\SELF-AUDIT.md` section 8, change 9. The skill's description and its section "For Islamic content" say so |
