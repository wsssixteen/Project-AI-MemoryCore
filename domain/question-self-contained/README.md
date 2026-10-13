# question-self-contained

symptom: he was asked in a popup to choose between lines he could not see (the table was in chat above) and about a dialog in a browser tab he was not looking at; he could not answer either and said this recurs
goal: no question reaches him that cannot be answered from the question itself
goal_signal: a block on a popup question that points at the chat, an earlier file or another window; zero such questions reaching him
retention: rotate monthly
footprint: per-tool: 1 node process per AskUserQuestion call only (matcher AskUserQuestion), about 40 MB, exits in under 100 ms

**What fires when**: PreToolUse — a question is about to be put to him in the popup and its words point at something he cannot see while the popup is open (the chat above, a table or file sent earlier, another window or tab)

**Contract**: block the call and name the pointing words; the question must carry the thing itself, in its text or in an option preview

## The rule

A question put to him carries everything needed to answer it. While the popup is open he sees the popup, not the chat, not a file sent earlier, not another window.

| It blocks | Example | What to do instead |
|---|---|---|
| Words that point at the chat or at something sent earlier | "the table is in chat above" · "see the sheet" · "listed earlier" | Put the thing into the question: the candidates in each option's `preview`, or quoted in its description |
| Words that send him to another window or tab | "in the open Edge tab" · "the dialog on your screen" | Do not ask. Say it in the reply in plain words, and carry on with what does not need him |
| A choice between wordings, lines, versions or designs that are not shown | "Which lines should the page print?" with options "All simpler" / "Keep" and no preview | Show each candidate in its option's `preview`, or quote it |

It never reads an option's `preview`: that is the content he is shown.

## His words (2026-10-13, typed into the popup itself)

> I cannot see what simpler you're talking about. YOU ALWAYS DO THIS WHY DO YOU DO THIS, WHY DO YOU NOT BAN YOURSELF FROM REPEATING THIS WHEN ASKING QUESTIONS

> I CANNOT SEE IT I DON'T KNOW WHAT YOU'RE TALKING ABOUT ADD THIS INTO SLIP LOG AND FIX THIS BEHAVIOUR IN THE BACKGROUND AS WELL

The two questions he could not answer are fixtures F2 and F3 of the eval, word for word.

## Pieces

| Piece | File | Role |
|---|---|---|
| Check | `question-self-contained.check.hook.js` | PreToolUse, matcher `AskUserQuestion`; `judge(toolInput)` returns the faults; exit 2 with the faults and how to fix |
| Eval | `question-self-contained.eval.js` | 12 cases: the two real questions blocked, a choice with nothing shown blocked, the mended forms pass, 5 out-of-spec inputs |
| Log | `log.jsonl` | one line per block: `ts`, `outcome`, `found` (the faults named); every fire is also in the hook telemetry |

Sibling: `domain/batch-ask` tells me WHEN to use the popup. This check says what a popup question must carry. Related rule in memory: act-dont-ask (do the safe step; hand back only what is his).

**Layer choice (Rule 7)**: hook-only. The fault is in the words of one tool call, so it is read and stopped before the popup opens; a prose rule did not hold.

**Trigger moment (Rule 8)**: PreToolUse on `AskUserQuestion` only: the one moment a question exists and has not reached him. No cost on any other tool.

**Observability**: every block appends to `domain/question-self-contained/log.jsonl` with the time, the outcome and the faults named, so an audit can count blocks and read which words caused them.

**state-scoped**: no, state-agnostic.
