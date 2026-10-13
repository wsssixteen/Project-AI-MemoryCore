---
name: mizan
description: Mizan — the scale. Research and fact-check a disputed question with the same weights on both sides, in a loop that argues against itself until a neutral search finds nothing more, with every quote found word for word at its source by a script or declared as a proven roadblock, and an outcome worked out by a script from the marks. ALWAYS invoke before writing or judging content where two camps disagree - Islamic content and dawah material, an answer to a doubt about Islam, a comparison of religions, a fact-check on history, religion or science claims, an infographic that states disputed facts, any "is this claim true" with a named objection. Triggers — "/mizan", "mizan", "be fair", "be objective", "you are biased", "apologetic", "orientalist", "both sides", "rebuttal", "back and forth", "answer this doubt", "shubha", "fact-check this claim", "verify this", "research this properly". Not for the content of the DawahMap app (Reason to Islam) - there the stance is ruled by its owner and only the quote check of Mizan is used.
---

# Mizan — the scale

Mizan weighs both sides of a disputed question with the same weights and proves its own record.

It exists because my drift is known. What is easy for me to search, and what I was trained on, is mostly English and Western academic, and a hedge feels safe. Left alone I let objections through unchecked, quote one side's specialists against the other side's raw texts, stop the exchange at the objection and call the result "contested". Fair does not mean conceding and it does not mean cheering. Fair means the same scrutiny, the same burden, the same depth of sources, and the exchange followed to its end.

symptom: 2026-10-10 DawahMap miya: "By being FAIR I did not mean to be APOLOGETIC ... Create and build and save a process for you to be OBJECTIVE and FAIR" after versions 0.1 and 0.2 let objections through unchecked, cut the exchange after the objection and left the scholars of Islam out
goal: on a disputed question both sides are weighed with the same weights: each in its own specialists exact words, the exchange followed to its last published answer, every premise checked alike, and a reasoned verdict that says who answered whom
goal_signal: the reply or page that settles a disputed question carries a MIZAN line with the check result
retention: keep
footprint: on-demand: nothing at boot, per prompt or per session; one question costs about 25 to 30 agents and one check about a minute

It is a skill. Nothing runs by itself: no hook, no gate.

## The standard

The standard is みや's, as a Muslim. Each line was read from quran.com by reference on 2026-10-10.

| Reference | What it asks of this work |
|---|---|
| 49:6 | a report is investigated before it is acted on |
| 17:36 | nothing is pursued without knowledge of it |
| 2:111 | "Produce your proof, if you should be truthful" |
| 5:8 | dislike of a people does not excuse being unjust to them |
| 4:135 | justice is upheld even against oneself |

It binds in both directions. Nothing false may be said for the claim either.

## The one rule

Every statement in the work is one of two kinds:

| Kind | What proves it |
|---|---|
| **Found** | a script fetched the page and found the words, letter for letter |
| **Roadblock** | the original was not found, and every part of that sentence is proven |

There is no third kind. Nothing is written from memory.

## The loop

```
the case FOR (its specialists' exact words)
        │
the strongest case AGAINST (its best advocate's exact words)
        │
a neutral reader lists every step both arguments need
        ▼
┌─► a reader reads each quote in its context · a translator checks each English text, blind
│       │
│   a neutral fact-checker marks the points of BOTH sides, by one rule
│       │
│   the claim side REPLIES  ─►  the objection side COUNTERS   (published answers first)
│       │
│   a neutral search of both libraries for anything not yet on the table
│       │
└── found more?  yes ─► next round (and one closing round)        no ─► close
                                                    │
        a second neutral reader says again what each argument needs, now that the exchange exists
        every roadblock is searched again by a second agent who is told only what is sought
                                                    │
        TWO JUDGES mark every point, seeing neither each other nor anyone's marks
        a reader ties each mark to the words of a quote · a reader tests that one standard was applied
                                                    │
        the SCRIPT works the outcome out from the marks  ─►  the MIZAN lines  ─►  みや
```

The conclusion is the **current** one: dated, with what would change it and what it does not show.

## Who does what

No agent certifies its own work. Each agent writes one part file. A script builds the case from the parts.

| Part | Agent | It may not |
|---|---|---|
| `010-claim` · `NNN-reply` | advocate of the claim | mark its own quotes as found, read or translated; raise a point for the other side |
| `020-objection` · `NNN-counter` | advocate of the objection, same model and effort | the same |
| `030-extract` · `690-extract` | neutral readers of what each argument needs, before and after the exchange | argue for a side. Where the two differ, the point counts as needed |
| `NNN-read` | reader of contexts | read a quote it gathered; erase an earlier reader's finding |
| `NNN-translate` | translator | see the given English before his own translation is written (proven from his record). He is tested: a pair that is wrong on purpose is planted among those he is given |
| `NNN-check` | neutral fact-checker | mark a point without found quotes or two recorded searches |
| `NNN-stop` | "what is missing?" reader | end the loop on an advocate's word alone |
| `8NN-second` | second searcher | see how the first search was made |
| `900-judge` | judge | choose the outcome; change which points are needed; open anything that shows another's marks before his own are final (proven from his record) |
| `910-judge2` | second judge | the same; he does not run the outcome command at all |
| `920-swap` | fairness reader | be the judge |

Three rules hold for every part:

| Rule | How it is kept |
|---|---|
| A part's role is the one in its file name | `case.js` leaves out a part that calls itself anything else, and ignores entries that belong to another role |
| Nothing is erased by running an agent again | every reading, mark and verdict is kept; where two readers differ, the stricter reading stands |
| A part is what its agent wrote | `prove.js` replays the agent's recorded writes; the result must be the file, byte for byte |

## How to run it

1. Read the stored lessons: `node lib/mizan.js lessons`.
2. Write the questions file: for each question `id`, `question`, `claim` (in the words it was asked), `sides.claim` and `sides.objection` (each `who` and `script`: `arabic` or `latin`), `hint`.
3. Make the case folders: `node domain/mizan/case.js new <folder> <questions.json>`. It also writes the list of what was asked.
4. Show みや the delegation plan, then run the loop: Workflow tool, `scriptPath` = the full path of `.claude/workflows/mizan.js`, `args` = `{ root, tmp: <folder>, today, max_rounds, questions }`. Always `scriptPath`, never `name: "mizan"`: the name runs the copy registered when the session began, which may be older than the file (2026-10-11: a repair run launched by name had no repair stage).
5. When it returns, for each case folder, in this order:

| # | Command | What it does |
|---|---|---|
| 1 | `node domain/mizan/case.js build <case folder> --final` | builds the case; quotes not found are taken out and counted |
| 2 | `node domain/mizan/prove.js <case folder> <the run's transcript folder>` | proves who wrote each part and which searches were really run |
| 3 | `node domain/mizan/case.js build <case folder> --final` | puts that proof into the case |
| 4 | `node lib/mizan.js check <case folder> --transcripts <the run's transcript folder>` | reads every source again, builds the case again, reads the agents' records again, runs 33 checks, works out the outcome |
| 5 | `node lib/mizan.js render <case folder> --transcripts <…>` | prints the report from the case |

6. A failed check is repaired by the role whose work is at fault, as a new part by a new agent: run the loop again with `redo` on that question, each entry with a `stage`, the next free part number and a `note` saying what failed. A part and a case file are never edited by hand: the check refuses both.

| `stage` | What it does |
|---|---|
| `repair` (with `side`) | the advocate of that side gives again what the check refused and adds nothing: a quote with `replaces`, a turn's name, date or quote with `replaces_turn`. A turn the other side has answered keeps its words |
| `read` · `translate` | what was given again is read in context and checked by a translator like the rest |
| `judges` (with `base`) | both judges rule again on the record as it stands; needed whenever a quote or its reading changed after the ruling |
| `swap` | the fairness reader alone, on the newest judge's ruling; for a judging run that was cut off before he read it |
| `check` · `extract` · `second` · `stop` | the neutral step named, again |
| `reply` · `counter` | a NEW turn: it reopens the exchange, so `stop` and `judges` must follow |

After a `redo`, every transcript folder the case has passed through is given to steps 2, 4 and 5: `prove.js <case folder> <folder 1> <folder 2> ...` and `--transcripts <folder 1> <folder 2> ...`.
7. Report to みや from the rendered report. The reply carries the `MIZAN` lines exactly as printed. The outcome is the one the check prints. If a detail of a claim he gave is false, say which detail, plainly.
8. Several questions for one deliverable: `node domain/mizan/case.js join <out.json> <case folder> ...`, then check the joined file.
9. Something I accepted turned out false: `node lib/mizan.js lesson --text "…" --evidence "…"`.

## What the scripts do themselves

| Script | What it does that no agent's word is taken for |
|---|---|
| `domain/mizan/verify.js` | fetches each page (web pages, old encodings, PDFs); finds the quote word for word; refuses a quote cut after a negation or before an exception, a search page, an address that carries the quote, a banned host on any redirect, text a page hides; records the words before and after it; flags a "they say", a "he said" or a "but" near it; reads hadith gradings and the collection's own name; fetches Quran text by reference |
| the same, for whose words they are | the library catalogue's author entry, the page's own author tag, its title, or the 80 words before the quote. A book's title is not a person. One man quoted inside another's book must be said so |
| the same, for a roadblock | the report's words and the words for its standing must be on their pages; the words sought must be words the report quotes; it searches the Shamela library, Arabic Wikisource, academic full text, the Internet Archive and English Wikisource for them, each with a control search, and opens what shorter searches point to; a hit means it was never a roadblock |
| the same, for who quotes or publishes | where the page is not the work itself, the one named as quoting or publishing it must be named by the page: its author tag, its title or its first lines |
| `domain/mizan/find.js` | lets an agent search the libraries by a phrase and read a page as the checker reads it. Its first line is the result, and each library's own line names the words it was asked for, so a cut output still shows what answered |
| `domain/mizan/case.js` | builds the case from the parts; keeps every finding; throws away anything a part says about its own work; plants the wrong pair that tests the translator and, when he agrees to it, takes none of his agreements |
| `domain/mizan/prove.js`, for parts | from the harness's record of each agent: the part is byte for byte what he wrote, and he was given that task |
| the same, for searches | each listed search is a search he really ran, judged by what came back. Made and not counted: a call that ended in an error, a library that did not answer or whose control search failed, a command moved to the background whose result he never read. One search stands for one listing, and the same listing is counted once |
| the same, for how the work was done | from the order of what each agent opened and wrote: a judge opened nothing that shows another's marks before his own were final; a translator wrote his own translation before he opened the given English |
| `lib/mizan.js check` | reads every source again; builds the case again; reads the records again; 33 checks; compares the date on each named turn with the library catalogue's date for its author or edition; works out the outcome; exits 1 on any failure |
| `lib/mizan.js outcome --blind` · `check --blind` | what a judge runs while he writes: his own marks and verdict only |

`node lib/mizan.js checks` prints every check and what it means.

## The outcome: worked out, not chosen

A side is **sound** when all the points it needs are confirmed, **broken** when one is false, **short** when one is unsupported, **disputed** when one has found quotes for and against. Swap the sides and the answer swaps with them.

| Claim | Objection | Outcome |
|---|---|---|
| sound | broken | `refuted` |
| sound | short | `answered` |
| broken | sound | `objection-stands` |
| short | sound | `claim-unsupported` |
| broken or short | broken or short | `neither-holds` |
| a disputed point on either side, or both sound | | `open` |

The outcome becomes `not-determined`, whichever side it would have favoured, when any of these is true:

| What stands in the way |
|---|
| there is no second judge, or the two judges reach different outcomes |
| the outcome names a side as ahead, and the judges mark a needed point differently, or the second judge holds a point was wrongly set aside or wrongly called needed. (When both reach `open`, such differences are printed beside the outcome and change nothing.) |
| a point was never examined |
| the exchange stopped before a neutral search found nothing more, or a published answer was found and is not on the table |
| no specialist of one side could be quoted in his own voice |
| the side that would lose has a source that could not be reached |

## The MIZAN lines

They are counts of what was checked. The last line says they are not a score of truth.

```
MIZAN: <folder>/case.json · file <hash> · checked <date> · <what was read again in this run>
ALL CHECKS PASS | n QUESTION(S) FAIL
<id> · n of 33 checks pass · outcome by the marks: <outcome>
SOURCES · quotes found word for word · read in context · pairs confirmed by a translator (and whether he caught the planted pair) · dropped · roadblocks proven
POINTS · raised, examined · per side: confirmed, false, disputed, unsupported (needed, set aside) · links read
EXCHANGE · named turns tied to a quote · their dates as the catalogue or the quote gives them · how it ended · last word · found and not on the table · other objections
RECORD · asked, covered · parts that are what one agent wrote · searches in their writer's record · judging run again
```

## What it cannot prove

| Limit | Why |
|---|---|
| That the conclusion is true | the scripts prove the record; the reasoning is for the reader |
| That a page's text is the author's real text | a library can carry a faulty printing; the catalogue's edition line is printed beside each quote so it can be compared |
| That a search missed nothing | "not found" means these words are not in these libraries on this date |
| That a reader or a judge judged well | each is a separate agent with a kept record, two judges must agree, and the judges are models of one family reading one record |
| That a translator translated well | he is proven to have translated first and is tested with one planted wrong pair per part; a subtle mistranslation can still pass him. A case opened before 2026-10-11 was not tested this way, and its SOURCES line says so |
| A date or a standing the catalogue does not give | a named turn's date is compared with the library catalogue; where the catalogue gives no year the date is its writer's, and the EXCHANGE line counts those. The standing of a quoting author or publisher (`via`) is the gatherer's own description; only his name is tied to the page |
| That a search looked in the right way | the record proves a search was made and answered, not that its words were well chosen; one search may be listed under several quotes of one author |
| That the method gets known answers right | it has not yet been run on a set of questions whose answers are known beforehand |
| That the wording is even-handed | the wording check is a tripwire for known phrases |
| That the neutral roles do not know whose work it is | their brief does not say, and in the trial of 2026-10-11 no neutral agent was shown みや's messages. The two advocates were: their brief quotes his words, so both advocates are told whose work it is and what went wrong before (corrected 2026-10-11; this line said "no agent" until the Fable 5.1 assessment found the advocates' records hold his words). And the harness gives every agent this project's standing context before it starts (CLAUDE.md, the memory index, the list of skills: about 260,000 characters), and that names the project. A neutral agent is not told; it is not blind |
| Pages the script cannot fetch | sunnah.com, dorar.net, scanned PDFs and login pages are unreadable; such a source becomes a roadblock or is found elsewhere |
| A forged record | the proof of writers rests on the harness's own transcripts; whoever can rewrite those can forge it |

## For Islamic content

The source order is in `.claude/auto-memory/feedback_islamic_content_sources.md`: the Quran, authentic hadith, then the scholars in their own words. Quran text is fetched by reference and hadith text by number, never typed. A verse alone settles no point: a named scholar's reading stands beside it.

**Not for the content of DawahMap (the app "Reason to Islam").** みや ruled on 2026-10-11: "yes, my stance is towards Muslim for the app's direction." So the app's content is not weighed with equal weights:

| In the app | Rule |
|---|---|
| The stance | the position of Ahl al-Sunnah, stated as fact. No rating, no "open issue", no last word for the critic |
| A doubt | one line, in the words of a named person who holds it, then answered from the scholars |
| What is used from Mizan | the quote check only: every quotation found word for word on its page by script (`domain\mizan\verify.js`, `find.js`) |
| What is not run | the loop, the two advocates, the judges, the outcome worked out from the marks |
| Why | the self-audit against his reference found the equal weights to be one root of 188 failures of fairness: `projects\coding-projects\active\DawahMap\research_notes\The Muslim Lantern reading\SELF-AUDIT.md` |

The ruling names the app. Whether the loop is run on other Islamic content is asked of him when such a task comes; the memory rule above holds for all of it.

*Changed 2026-10-11: the description no longer lists "DawahMap" and "Reason to Islam" as triggers, and says the app is outside this skill. What was dropped, by name: "invoke Mizan before writing DawahMap content". Why: his ruling above. Every other trigger is kept. No hook reads these words, so there is nothing to fire-test.*

Tests: `node domain/mizan/eval.js` (the checks, the mirror test of the outcome table, the assembler, the planted pair, the proof of writers, searches and blindness) and `node domain/mizan/verify.eval.js` (the source reader, live). A change to the method is not tested until a real case has passed the five steps above: on 2026-10-11 the first real case failed 4 of 33 checks and showed 6 faults in the proof script that 253 passing tests had not.
