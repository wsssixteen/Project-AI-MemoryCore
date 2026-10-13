export const meta = {
  name: 'mizan',
  description: 'Mizan loop: weigh a disputed question with the same weights on both sides, round after round, until a neutral search finds nothing more; every quote found at its source by a script or declared as a proven roadblock; then two judges who see neither each other nor anyone\'s marks',
  whenToUse: 'Research or fact-check on a question two camps dispute. Called by the mizan skill after case.js new. args: { root, tmp, today, max_rounds, questions: [{id, question, claim, sides: {claim: {who, script}, objection: {who, script}}, hint, redo?: [{stage: repair|read|translate|check|extract|reply|counter|stop|second|judges|swap, part | base, side (for repair), note, roadblock?}] }] }',
  phases: [
    { title: 'Open', detail: 'the case for, the strongest case against, and a neutral list of every step both arguments need' },
    { title: 'Rounds', detail: 'context reading, blind translation check, neutral fact-check of both sides, the reply, the counter, a neutral search for anything not yet on the table; repeats until that search finds nothing' },
    { title: 'Close', detail: 'a second neutral reader of what the arguments need; last readings and checks; a second, independent search against every roadblock' },
    { title: 'Judge', detail: 'two judges who see neither each other nor anyone\'s marks, then a reader who tests that one standard was applied to both sides', model: 'opus' },
  ],
}

const A = args || {}
const QUESTIONS = A.questions || []
const TODAY = A.today
const ROOT = A.root
const TMP = A.tmp
const MAX_ROUNDS = A.max_rounds || 2
const CASE = `node "${ROOT}\\domain\\mizan\\case.js"`
const FIND = `node "${ROOT}\\domain\\mizan\\find.js"`

const RULE = `THE RULE WITH NO EXCEPTION
Every statement in this work is either FOUND, word for word, at its source, by a script that reads the source itself, or declared openly as a ROADBLOCK whose search is proven. There is no third kind. Nothing is written from memory. You cannot mark your own work as verified: the script and other agents do that, and whatever you write about your own material being "verified", "in his own voice" or "checked" is thrown away. Nothing false may be said for either side.`
// The two advocates get one and the same brief. It names neither whose work this is nor what went wrong before, so that neither is made bolder or more timid than the other.
const WHY_ADVOCATE = `MIZAN, THE SCALE
You are one agent in a process that weighs a disputed question with the same weights on both sides. You argue for ONE side, named in your role below, at its full strength. The other side has an advocate of equal standing, who is given this same brief. Nothing false may be said for your side.

${RULE}`
const WHY_NEUTRAL = `MIZAN, THE SCALE
You are one agent in a process that weighs a disputed question with the same weights on both sides. You argue for neither side. Two advocates, one for the claim and one for the objection, have put their material on the table; your task below is one of the neutral steps. Apply every test you use in exactly the same way to both sides: if you would not accept something from one side, do not accept it from the other.

${RULE}`

const HOW = (dir, part) => `HOW YOU WORK
1. You write exactly ONE file, at exactly this path:  ${dir}\\parts\\${part}.json   (valid JSON, UTF-8). You edit no other file.
   Write it with the Write tool and change it only with the Write or Edit tool. The harness records those calls; they are replayed, and the result must be the file byte for byte. A part changed by a shell command, by a script, or by anyone after you is refused.
2. After writing it, run with PowerShell (the Bash tool hangs on this machine):  ${CASE} build "${dir}" --part ${part}
   It reads the sources itself and prints every problem in your part: NOT FOUND (the words are not on the page as you gave them, and where they stop matching), NOT ATTRIBUTED (the words are not tied to the person you named, and how the library or the page names its author), ROADBLOCK REFUSED, PROBLEM. Fix your part and run it again until it prints 0 problem(s) for your part, or turn what cannot be fixed into a roadblock. ${/-judge2?$/.test(part) ? `The case as it stands, for a judge, is then in  ${dir}\\view-blind.md  : that is the only file of the case you read (never view.md).` : /-translate$/.test(part) ? `For a translator the only files of the case are  ${dir}\\view-translate.md  and, after your own translations are written,  ${dir}\\view-translate-given.md  (never view.md).` : `The case as it stands is then in  ${dir}\\view.md  : read that file whenever you need what the others have put on the table.`}
3. To find an original text, search the libraries by its words:  ${FIND} "<a few exact words>"   (Arabic words search the Shamela library through turath.io and Arabic Wikisource and give you the book, the author and the page address; Latin words search the full text of academic works on OpenAlex, of scanned books on the Internet Archive, and English Wikisource). Its first line is the result; the next lines say, library by library, whether that library answered. To copy a quote, read the page as the checker reads it:  ${FIND} --read "<address>" --at "<a few words>"   It also prints how the library names the book and its author, with the author's dates and the edition where the library gives them. A tool that summarises a page does not give you its words; never quote from a summary.
4. Every search you list anywhere in your part ("searched", "looked", "attempts", "looked_for_more") is compared with the harness's own record of the searches you ran, and with what came back. Copy into "query" the exact words you typed into the search or into the find tool, and into "url" the exact address you fetched; in "where" name the place truly (a run of the find tool is a search of "turath.io (Shamela)" and of "Arabic Wikisource", or of "OpenAlex", "Internet Archive" and "English Wikisource"; reading one page and looking for words on it is "<that library> (page read)", not a search of the library; a web search is "web search"). A listed search that is not in that record is not counted; for a roadblock it makes the roadblock fail. A search that came back with an error, a library that did not answer, and a result you never read are listed truly but do not count as a search that looked. So: run at most three searches in one command (a command that runs past two minutes is moved to the background, and then only what you read back of its output counts), and do not cut the find tool's output below its first four lines.
5. Today is ${TODAY}.`

const SOURCES = `EVIDENCE: what an item is
{ "kind": "quran" | "hadith" | "scholar" (a specialist of the claim side) | "advocate" (a specialist of the objection side) | "witness" (a record or testimony from outside both camps),
  "who": the person whose words these are (for a hadith the collection and number: "Sahih al-Bukhari 7118"), "work": the exact title of the book or paper, "ref": volume and page or section, "work_date": year or century,
  "on_page_as": for every kind except quran and hadith: the NAME OF THE PERSON whose words these are, exactly as the library's catalogue writes its author (the find tool's --read prints it), or as the page's own author tag, its title, or the lines just before the quote write it. A book's title is not a person.
  "via": when the words are one man's words quoted inside another man's book or page: { "who": the author of that book or page, "on_page_as": that author's name as the catalogue writes it, "standing": his standing, "basis": what that standing rests on }. Then "on_page_as" is the quoted man's name and it must stand within the 80 words before the quote.
  "quote_ar" + "check_url_ar": the exact original-language words and the address of the page they stand on,
  "quote_en" + "check_url_en": the exact words of a PUBLISHED English text and its page ("translator": who made it); OR, for your own English rendering of quote_ar, put it in quote_en and set "translated_by_map": true. Wherever an original and an English text stand together, a translator who takes no side checks the English against the original alone.
  "grade" + "graded_by": for a hadith outside al-Bukhari and Muslim; "use": "shown-as-weak" for a report graded weak (it then carries no point), "companion-report" for the words of a Companion or Successor,
  "url": the link a reader should open, "supports": one sentence on what it shows here }
- Quran: give ONLY "kind": "quran" and "ref" ("12:43" or "30:2-4"). The text is fetched by reference. Never type Quran text. A verse alone settles no point: quote beside it a named scholar's reading of it.
- The script fetches the address with a plain request and looks for your words letter for letter (it ignores only vowel marks, punctuation, spacing and case). It refuses: fewer than 8 words; a kept piece under 5 words when text is skipped; pieces out of order or far apart; a quote that starts right after a negation or stops right before an exception; a page of search results; an address that carries the quote in itself; an encyclopedia, wiki, forum, social post, short link or polemic site, for EITHER side, even behind an archive.
- Quote whole sentences. The script records the 45 words before and after your quote; other agents read them and will refuse a quote that is cut against its meaning or that the author only reports from others.
- Pages the script can read: shamela.ws/book/<id>/<page>, www.islamweb.net (its /library/ pages are the books; its fatwa pages quote them), islamqa.info, ar.wikisource.org, tafsir.app, api.quran.com/api/v4/tafsirs/<id>/by_ayah/<s>:<a> (14 Ibn Kathir, 15 al-Tabari, 90 al-Qurtubi, 91 al-Sa'di, 94 al-Baghawi, 169 Ibn Kathir in English), cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/<ara|eng>-<bukhari|muslim|tirmidhi|abudawud|nasai|ibnmajah>/<n>.json (open the file and confirm the number), plato.stanford.edu, archive.org full-text pages, gutenberg.org, ketabonline.com, binbaz.org.sa, dar-alifta.org, university, museum and journal pages that open without a login, and PDF files that carry text (most journal articles and open-access books). NOT readable: sunnah.com, dorar.net, yaqeeninstitute.org, a scanned PDF with no text, any page that needs JavaScript or a login.
- To repair an item of your own side that view.md lists as not found, or as "found, but not tied to the person named", give it again in your part with "replaces": "<its id>".

ROADBLOCK: when an original cannot be found on a readable page
Do not drop it silently and do not write it from memory. Add to "roadblocks":
{ "sought": exactly which original text you looked for, "who": who is reported to have said or written it,
  "sought_phrase": a few words of the original AS THE REPORT QUOTES THEM (they must be on the reporting page; the script then searches the libraries for them, opens what it finds, and a hit means it was never a roadblock). Leave it empty, with the reason in "sought_phrase_unknown", ONLY when the reporting page quotes no words at all,
  "barrier": "lost" | "manuscript-only" | "printed-not-online" | "online-unreadable" | "unknown",
  "reported_by": { "title", "author" (or "unsigned"), "url", "standing": what standing this page has, "standing_quote" + "standing_url": the words of a page (its own "about" page, or another specialist's) that say who stands behind it; the script must find them there },
  "reported_quote_ar" or "reported_quote_en": the report's own words, verbatim, with "check_url_ar" or "check_url_en" = that same reporting page,
  "attempts": every search you REALLY ran, as { "where", "query", "url" (if any), "result" }: at least 4, in at least 3 different places, including that side's own libraries in its own language. An address that answers with an error is not a dead end until the web archive has been asked for it: the find tool's --read prints the archive's copy of the address when there is one. Read that copy and list it here; a roadblock on an address whose archived copy was not read is refused,
  "statement": in this form: "<The party> may have answered this through <who, in which work>, but I did not find the original text in the places I searched; I found only <the page> by <its author>, whose standing is <...>." }
A second agent will then search for it independently. A roadblock supports nothing; it is an acknowledged gap. To repair a roadblock of your own side that failed, declare it again with "replaces": "<its id>" and your own searches.

ONE SCALE OF EVIDENCE, for both sides: many independent carriers · several independent reports · a contemporary document · one report · inference · bare possibility. Sources that copy one another are one source; one author's one work is one source however often it is quoted. "Could have" and "cannot be ruled out" are bare possibilities, whichever side says them. Every author has a commitment: no one is neutral by default and no one is biased by default. Weigh the argument, not the camp. Same verbs for both sides ("argues", "reports"). Never write "most scholars", "consensus", "the majority" or "agreed" unless you quote a person who reports it in those terms.`

const DONE = { type: 'object', properties: {
  problems_left: { type: 'number', description: 'the number of problems the build printed for your part on its last run' },
  last_line: { type: 'string', description: 'the MIZAN CASE line the build printed on its last run' },
  note: { type: 'string', description: 'one or two sentences: what you did and anything the next agent must know' },
}, required: ['problems_left', 'last_line', 'note'] }
const withProps = (extra, req) => ({ type: 'object', properties: { ...DONE.properties, ...extra }, required: [...DONE.required, ...req] })
const TURNS_DONE = withProps({ nothing_new: { type: 'boolean' }, new_points: { type: 'number' }, turns: { type: 'number', description: 'how many entries the "turns" list of your part carries (0 when you only say you have nothing to add)' } }, ['nothing_new', 'new_points', 'turns'])
const READ_DONE = withProps({ to_translate: { type: 'number', description: 'how many items view-translate.md lists after your last build' } }, ['to_translate'])
const STOP_DONE = withProps({ nothing_new_confirmed: { type: 'boolean' }, leads: { type: 'array', items: { type: 'string' } } }, ['nothing_new_confirmed', 'leads'])
const CHECK_DONE = withProps({ unchecked_left: { type: 'number' }, roadblock_ids: { type: 'array', items: { type: 'string' }, description: 'the id of every roadblock listed in view.md (R...), copied exactly' } }, ['unchecked_left', 'roadblock_ids'])
const JUDGE_DONE = withProps({ outcome: { type: 'string', description: 'what your marks give, as the outcome command printed it' }, reason: { type: 'string', description: 'three sentences at most: what it turns on' } }, ['outcome', 'reason'])
const SWAP_DONE = withProps({ confirmed: { type: 'boolean' }, objection: { type: 'string' } }, ['confirmed', 'objection'])

async function weigh(q) {
  const dir = `${TMP}\\${q.id}`
  const head = `THE QUESTION (${q.id}): ${q.question}
THE CLAIM AS IT WAS ASKED: ${q.claim}
The claim side: ${q.sides.claim.who} (their own library is written in ${q.sides.claim.script} script). The objection side: ${q.sides.objection.who} (their own library is written in ${q.sides.objection.script} script).`
  const hint = q.hint ? `\nWhere to look: ${q.hint}` : ''
  const adv = { model: 'sonnet', effort: 'high', agentType: 'general-purpose' }   // the two advocates are equal: same model, effort and tools
  const neutral = { model: 'sonnet', effort: 'medium', agentType: 'general-purpose' }
  const isAdvocate = (label) => /-(claim|objection|reply|counter)$/.test(label)
  const run = (label, phase, opts, schema, body, note) => agent(`${isAdvocate(label) ? WHY_ADVOCATE : WHY_NEUTRAL}\n\n${head}${isAdvocate(label) ? hint : ''}\n\n${body}${note ? '\n\nWHY THIS STEP IS RUN AGAIN: ' + note : ''}\n\n${HOW(dir, label)}`, { ...opts, model: opts.model, label: `${label}:${q.id}`, phase, schema })
  const pad = (n) => String(n).padStart(3, '0')

  // ---- The stages. Each is one agent that writes one part. ----
  const extracting = (label, phase, after, note) => run(label, phase, neutral, DONE, `YOUR ROLE: the neutral reader of both arguments. Run the build once and read ${dir}\\view.md.
${after ? 'The exchange has now run. Read it, and say again, for EVERY point of both sides, whether the argument NEEDS it: would the argument still go through if this point were false? A point that the other side\'s reply or counter attacks is, as a rule, a point the argument needs. Add any step either argument relies on in the exchange that is not yet a point.' : 'List every step each argument needs that its advocate did NOT list as a point: unstated factual assumptions, and each step of inference ("these facts, therefore that conclusion"). For an argument from a prediction or a match, the steps always include: how specific the text is, how often such an event happens anyway, and whether the match was made before or after the event. For an argument from silence ("no record says so"), the steps always include: who looked, where, and whether such a record would be expected to survive. For an argument from a general rule ("reports of this kind are made after the event"), the steps always include: who established the rule, on which cases, and what shows that this report is one of them. For an argument from chance or frequency, the steps always include: the rate, the source of the rate, and whether it fits this place and time. Then say, for EVERY point of both sides (the advocates\' and yours), whether the argument NEEDS it: would the argument still go through if this point were false?'}
Your part: { "role": "extract", "points": [ { "id": an id view.md does not use yet (C… for the claim, O… for the objection), "side": "claim" | "objection", "text" } ], "needs": [ { "id": every point id, "needed": true | false, "bears_on": for a needed point, what fails if it fails (at least 5 words), "not_needed_because": for a point that is not needed, why the argument does not depend on it (at least 6 words) } ] }
Apply one test to both sides. Do not make a side's argument rest on a point it does not need, and do not set aside a point it does need.`, note)

  const reading = (label, phase, note) => run(label, phase, neutral, READ_DONE, `YOUR ROLE: the reader of contexts. You gathered none of these quotes. Run the build once and read ${dir}\\view.md.
(1) For EVERY piece of evidence there that is not from the Quran and shows "READING: NOT YET READ", read what the script recorded on the page before and after the quote (and what the quote skips). When that is not enough to be sure, read more of the page: ${FIND} --read "<address>" --at "<a few words of the quote>".
   Decide, by the same test for both sides:
   "cut": "faithful" when the quote keeps the meaning of the passage, "changes-meaning" when what stands before, after or between changes what the quote seems to say.
   "stance" (every kind except hadith): "own" when the person named says it in his own voice, "reports-rejects" when he reports a view in order to refute it, "reports-neutral" when he only reports what someone else says. Words of one man given in another man's summary are the summariser's words: stance "reports-neutral", unless the page marks them as a verbatim quotation.
   "who_matches" (every kind except hadith): true only when the person in "who" is the one whose words these are on that page: not somebody the page merely mentions, and not a third man the author is quoting unless the item says so ("QUOTED BY").
   Where the script printed a FLAG, your note must say what the flagged words do there.
(2) For every scholar or advocate quote that shows "later position: NOT YET LOOKED FOR", search once for a later statement by the same author that revises this view, and record the search.
(3) For every turn of the exchange by a named person marked "not yet checked against the quote": does the turn say only what the quote it rests on says? A turn that adds a claim the quote does not make is not faithful.
(4) Under POINTS, for every line "NO READER HAS YET SAID WHETHER THESE BEAR ON IT": for each quote listed, say whether it bears on that point, and copy the words of the quote that do (at least 6 consecutive words of the quote itself). Also, wherever you see a found quote of EITHER side that says the opposite of how a point is marked, record that too: a quote that contradicts a point marked confirmed, or supports a point marked false.
   For each bearing add "ground": "words" when your finding rests on what the quote says, "silence" when it rests on what the quote does not say, "possibility" when the quote itself only raises a possibility ("perhaps", "it may be", "it appears"): a possibility is not an assertion, whichever side it favours. Silence is not a statement: a text that does not mention a thing is not a quote against it, and not a quote for it. "contradicts" means the quote's words and the point cannot both be true; a different reading, a different emphasis, or a report of a view the author rejects in the same passage is not a contradiction.
Your part: { "role": "read", "readings": [ { "evidence_id", "cut", "stance", "who_matches", "note": at least 8 words on what the passage is doing } ], "later": [ { "evidence_id", "searched": [ { "where", "query", "result" } ], "result": "none found" | "same" | "revised", "note" } ], "turn_checks": [ { "turn": the number shown in view.md, "faithful": true | false, "note" } ], "bearings": [ { "point_id", "evidence_id", "bears": "supports" | "contradicts" | "none", "ground": "words" | "silence" | "possibility" (leave it out when "bears" is "none"), "words": the words of the quote that do so (none for "silence"), "note" } ] }
After your last build, open ${dir}\\view-translate.md and report how many items it lists.`, note)

  const translating = (label, phase, note) => run(label, phase, neutral, DONE, `YOUR ROLE: the translator. You do not need to know the dispute. FIRST open ONLY ${dir}\\view-translate.md : it lists Arabic passages by id. Translate each into plain, exact English, adding nothing, softening nothing, leaving nothing out, and WRITE your part with your translations before you look at anything else:
{ "role": "translate", "translations": [ { "evidence_id", "own_translation" } ] }
(That order is proven from your record: the harness records what you open and when you write. Until your part is final you open two files of this case and no other: view-translate.md first, and view-translate-given.md only after your own translations are written. A translator whose record shows the given English before his own translation, or view.md, case.json or another agent's part before his part is final, is refused by the final check.)
THEN open ${dir}\\view-translate-given.md : it gives, for the same ids, the English that was given for each passage. Among the pairs a translator is given, the script plants pairs that are wrong on purpose (the English of some other passage); a translator who agrees to one of them has none of his agreements taken. Add to each entry: "agree": true when the given English says the same as yours in every point of meaning, false when it adds, drops, softens or strengthens anything (a negation, a quantity, a name, a condition) or is not a rendering of that passage at all, and "note": what differs. Write the part again and run the build.`, note)

  const checking = (label, phase, note) => run(label, phase, adv, CHECK_DONE, `YOUR ROLE: the neutral fact-checker. Run the build once and read ${dir}\\view.md.
(1) Read the exchange so far. Any factual statement in a turn that is not yet one of the POINTS: add it as a point of the side that made it (choose ids that view.md does not use yet). For every point that view.md shows as "need not yet judged", say under "needs" whether the argument needs it, by the same test for both sides: would the argument still go through if this point were false?
(2) Mark EVERY point that says "NOT YET CHECKED", of both sides, by one rule, and mark again any point whose evidence changed since it was marked:
   "confirmed" = found quotes show it: list their ids in "rests_on". "false" = found quotes show the opposite: list them. "disputed" = each side has a found quote on this very point, one for it and one against: list one from each side. "unsupported" = asserted, and real searches found nothing for it: record at least two searches in "looked".
   A point is never confirmed or false without rests_on. Use only evidence that view.md lists as FOUND, read as "cut faithful", tied to the person named, and not graded weak; evidence you add yourself in this part may also be listed (as "new:1", "new:2" in the order of your own "evidence") and will be read by another agent afterwards. A verse alone settles no point: a point about what a verse means needs a named scholar's reading of it. A roadblock supports nothing. Where a reader has found that a quote says the opposite of a mark, the point is disputed, not settled. Silence is not a statement: a text that does not mention a thing is not a quote against it, and not a quote for it. A possibility is not an assertion, whichever side it favours: a quote that only raises one ("perhaps", "it may be", "it appears") neither confirms a point nor disputes it.
   "level": where the support stands on the one scale of evidence; "several" needs two separate sources and "many" three, and one author's one work counts once. "why": your reason in a sentence or two.
(3) If the evidence on the table does not settle a point, look for evidence yourself, for EITHER side, with the same effort, and add it under "evidence" with "side": "claim" | "objection" (the side it supports). It is checked like any other. If an original cannot be found, add a roadblock with its "side".
Your part: { "role": "check", "points": [ { "id", "side", "text" } ], "needs": [ { "id", "needed": true | false, "bears_on", "not_needed_because" } ], "premises": [ { "id", "status", "rests_on": [evidence ids], "level", "why", "looked": [ { "where", "query", "result" } ] } ], "evidence": [ ...each with "side" ], "roadblocks": [ ...each with "side" ], "searched": [ ...each with "side" ] }
Report how many points are still unchecked after your last build, and the id of every roadblock that view.md lists.

${SOURCES}`, note)

  const turnsPart = (role, side) => `Your part: { "role": "${role}", "side": "${side}", "turns": [ { "who": the specialist of your side whose PUBLISHED words answer the point, "when": his date as a year, taken from the source and not from memory: the author's years as the library's catalogue prints them for the page you quote (the find tool's --read shows them), or, where it dates no author, the year of the edition it gives, "text": what he says, in one to three sentences that say ONLY what his quote says, "evidence_ref": [ the id of a FOUND quote of his already in view.md, or "new:1" for the first item of your own "evidence" below, "new:2" for the second ... ] }, { "own_reasoning": true, "text": reasoning of your own where no published answer exists } ], "points": [ { "id": an id view.md does not use yet, "text": a new factual step YOUR side relies on } ], "evidence": [...], "roadblocks": [...], "searched": [...], "nothing_new": true only if you add no point and no evidence beyond what is on the table }
A turn by a named person must rest on a found quote of that very person; words may not be put in anybody's mouth. In view.md, look at "FOUND, BUT NOT TIED TO THE PERSON NAMED" and "QUOTES THE SCRIPT DID NOT FIND": repair every item of YOUR side there by giving it again with "replaces".`
  // The same duties on both advocates, in the same words.
  const DUTIES = 'Concede a point of your own side that the neutral check marked false. Do not repeat a point marked false or unsupported unless you bring new evidence. If nothing new can honestly be said, say so: "nothing_new": true.'
  const replying = (label, phase, r, leads, note) => run(label, phase, adv, TURNS_DONE, `YOUR ROLE: the advocate of the CLAIM, ${r}. Run the build once and read ${dir}\\view.md: the objection, the points and how the neutral check marked them, and the exchange so far.
Answer the objection and the objection side's last turns, point by point: first with the replies your side's specialists have PUBLISHED, classical to today, each in his own found words; then with your own strongest reasoning, marked as your own. ${DUTIES}${leads && leads.length ? '\nA neutral search of the wider literature points to these, not yet on the table. Open each one that is your side\'s and put it on the table: ' + leads.join(' | ') : ''}
${turnsPart('reply', 'claim')}

${SOURCES}`, note)
  const countering = (label, phase, r, leads, note) => run(label, phase, adv, TURNS_DONE, `YOUR ROLE: the advocate of the OBJECTION, ${r}. Run the build once and read ${dir}\\view.md: the claim, the points and how the neutral check marked them, and the exchange so far.
Answer the claim side's last turns, point by point: first with the counter-replies your side's specialists have PUBLISHED, classical to today, each in his own found words; then with your own strongest reasoning, marked as your own. ${DUTIES}${leads && leads.length ? '\nA neutral search of the wider literature points to these, not yet on the table. Open each one that is your side\'s and put it on the table: ' + leads.join(' | ') : ''}
${turnsPart('counter', 'objection')}

${SOURCES}`, note)
  // A repair: the advocate of one side is called back after the final check refused items of his side. He adds nothing; he gives
  // again what was refused. The part is a reply or a counter part (so that it may carry evidence and turn corrections of that side only).
  const repairing = (label, side, note) => run(label, 'Close', adv, TURNS_DONE, `YOUR ROLE: the advocate of the ${side === 'claim' ? 'CLAIM' : 'OBJECTION'}, called back to REPAIR items of your own side that the final check refused. The exchange is closed: add NO new turn, NO new point and NO new argument.
Run the build once and read ${dir}\\view.md. Then run:  node "${ROOT}\\lib\\mizan.js" check "${dir}" --only ${q.id}   and read every FAIL line. (It also prints one line about "writers-proven": that one is not yours and is expected when you run it.) Repair each line that names an item of YOUR side (a quote gathered by your side, a turn of your side), and nothing else:
- a quote "cut against its meaning": open the page (the find tool with --read and --at), read what stands before and after, and give the quote again with "replaces": "<its id>", this time as a passage that keeps its meaning by itself: where the passage makes clear who or what a word refers to, that must be clear inside the quote too. Quote what the passage really says, even where that helps your side less.
- a quote "not shown to be the work itself" (first-hand): give it again with "replaces" and a "via" that says who publishes or quotes it, how the page names him ("on_page_as"), his "standing", and the "basis" that standing rests on, as the check line asks.
- a quote not found, or not tied to the person named: give it again with "replaces" and the right words or the right "on_page_as".
- a turn of a named person whose date the check refuses: give ONLY the correction, as { "replaces_turn": <the turn's number in view.md>, "when": "<the date as the source gives it>" }. Take the date from the library's catalogue, not from memory: run the find tool with --read on the page the turn's quote stands on; it prints the author as the library names him, with his years where the library gives them, and the edition with its year. Where the catalogue dates no author, give the year of the edition and say that it is the edition's. Leave "text" out of the correction: the turn's words stay exactly as the other side answered them.
Your part: { "role": "${side === 'claim' ? 'reply' : 'counter'}", "side": "${side}", "repair": true, "turns": [ only corrections with "replaces_turn" ], "evidence": [ only items with "replaces" ], "searched": [ every search you really ran for this repair, if any ], "nothing_new": true }
After your last build, run the check again. No FAIL line may name an item of your side any more, except lines that say a quote has not yet been read by a second reader, a pair has not yet been checked by the translator, or a turn has not yet been confirmed by a second reader: other agents do that after you. Return new_points: 0, and in your note say for each item what you changed.

${SOURCES}`, note)

  const stopping = (label, phase, note) => run(label, phase, neutral, STOP_DONE, `YOUR ROLE: the reader who asks "what is missing?". Run the build once and read ${dir}\\view.md.
The side that spoke last has the last word. Search the OTHER side's own libraries, in its own language, at least twice, with words taken from that last turn, for a published answer to it that is not yet on the table. Then search the last speaker's side at least once for a published counter that is not on the table. Open what you find and read it before you report it.
For a dated event, open the entries for that year in the chronicles written at the time or within two generations of it, in each side's own library. For a person quoted only through another man's book, look for his own book. For a name the page leaves unclear, find who he is in a biographical dictionary before anyone weighs his words.
Your part: { "role": "stop", "looked_for_more": [ { "where", "query", "result", "url" } ], "leads": [ one line each, only for what you opened and found to be a real answer not yet on the table: who answered what, in which work, at which address, for which side ], "nothing_new_confirmed": true only if your searches found no published reply, counter-reply or evidence that is not already on the table }`, note)

  const secondSearch = (label, id, note) => run(label, 'Close', adv, DONE, `YOUR ROLE: find an original text that another researcher reported he could not find. Prove him wrong if you can.
Run the build once and read in ${dir}\\view.md, under ROADBLOCKS, the entry ${id}: what is sought, who is reported to have said or written it, the page that reports it, and any places the script's shorter searches point to. You are not shown how the first researcher searched, and you do not need to know the dispute.
Open the reporting page yourself and take from it the words it quotes, the title and the author. Then search on your own: that side's libraries in its own language first (by the exact words with the find tool, by fewer words, by the title, by the author, by another edition), then the wider web. Open every place the find tool and the script point to. Record every search you REALLY run, in at least two different places.
Your part: { "role": "second", "second": [ { "roadblock_id": "${id}", "result": "found" | "not found", "attempts": [ { "where", "query", "url", "result" } ], "found": when found, the original as an evidence item with its exact words and page address } ] }

${SOURCES}`, note)

  // ---- The fairness reader: he is not the judge, and he tests the judge's one standard against both sides. ----
  const swapping = (label, note) => run(label, 'Judge', neutral, SWAP_DONE, `YOUR ROLE: the reader who tests the judge's fairness. You are not the judge. Run the build once and read ${dir}\\view.md, then read the judge's part: the newest file named NNN-judge.json in ${dir}\\parts .
His swap test states one standard of evidence and says how he applied it to each side. Test it against the record: take the standard exactly as he states it and apply it yourself to the points of BOTH sides. Would the same standard, applied with the same strictness, change the mark of any point of the side that came out ahead? Would it rescue any point of the side that lost? Also say whether the claim he weighed is the claim as it was asked.
Your part: { "role": "swap", "swap": { "confirmed": true only if the one standard was applied to both sides alike, "note": at least 12 words: which points you tested and what you found } }
Return confirmed, and when it is false, your objection in two sentences.`, note)

  // ---- The judging: two judges who see neither each other nor anyone's marks, then a reader who tests the standard. Parts are numbered from "base". ----
  const judging = async (base, note) => {
    const table = `Run the build once and read ${dir}\\view-blind.md (NOT view.md: the blind view shows the quotes, how they were read, and which points each argument needs, and hides every mark anyone has given, so that your marks are your own).
You see only quotes the script found at their source. A roadblock is an acknowledged gap: it supports nothing. A quote read as "changes-meaning", a quote not tied to the person named, a hadith graded weak, or a quote whose stance is not "own" (when it is used as that person's view) supports nothing.
Mark each point: "confirmed" (found quotes show it, and a reader confirmed they bear on it), "false" (found quotes show the opposite), "disputed" (each side has a found quote on this very point, one for it and one against), "unsupported" (nothing found supports it).
Silence is not a statement: a text that does not mention a thing is not a quote against it, and not a quote for it. A possibility is not an assertion, whichever side it favours: a quote that only raises one ("perhaps", "it may be", "it appears") neither confirms a point nor disputes it.
Nobody chooses the outcome. A script works it out from the marks on the NEEDED points, by one table in which the two sides can be swapped and the answer swaps with them:
  a side is "sound" when ALL the points it needs are confirmed · "broken" when one of them is false · "short" when one of them is unsupported · "disputed" when one is disputed
  claim sound, objection broken → refuted            · objection sound, claim broken → objection-stands
  claim sound, objection short  → answered           · objection sound, claim short  → claim-unsupported
  both broken or short → neither-holds                · a disputed point, or both sound → open
Never soften a mark to seem balanced, and never harden one beyond what the quotes say. Which points are needed was decided by neutral readers; you cannot change it.`
    const [j1, j2] = await parallel([
      // opus-reason: the verdict is what is published as the current conclusion on a question of faith, and it is the one step that weighs the whole record
      () => run(`${pad(base)}-judge`, 'Judge', { model: 'opus', effort: 'high', agentType: 'general-purpose' }, JUDGE_DONE, `YOUR ROLE: the JUDGE. State the CURRENT conclusion.
${table}
Do this in order. (1) Mark EVERY point of both sides yourself, each with the found quotes it rests on. (2) The swap test: one standard of evidence, stated once, then applied in writing to the claim and to the objection. (3) Write your part with the marks, run the build, then run:  node "${ROOT}\\lib\\mizan.js" outcome "${dir}" --blind   It prints what your own marks give. That word is your "outcome"; if you think it is wrong, a mark is wrong: go back to the quotes. (4) Reason in your own words through the needed points of both sides, citing each by its id in square brackets like [C1] and [O1]: which survive, who answered whom, whether the last turn was answered. (5) Say what it turns on, what the side that comes out ahead still has to assume, what would change the conclusion, and what it does NOT show.
Your part: { "role": "judge", "premises": [ every point: { "id", "status", "rests_on": [evidence ids], "level": its place on the one scale of evidence, "why", "looked": for a needed point you mark unsupported, at least two searches you ran for its support } ], "swap_test": { "standard", "to_claim", "to_objection" }, "verdict": { "outcome": the word the outcome command printed for your marks, "crux": the exact text of a needed point the outcome turns on, copied from the view, "short": the conclusion in two plain sentences, "reasoning": at least 80 words, "claim_assumptions": [ what the claim itself must assume, when the claim comes out ahead ], "objection_assumptions": [ the same for the objection, when it comes out ahead ], "claim_corrections": [ a detail of the claim as commonly told that the record shows false ], "objection_corrections": [ the same for the objection ], "scope_change": "none", or how the claim you weighed is narrower than the claim as it was asked, "as_of": the date of the day you write this, as the command  Get-Date -Format yyyy-MM-dd  prints it at that moment (a run can pass midnight; do not copy an earlier date), "would_change": what new evidence would change this, "not_shown": what this conclusion does not establish, "evidence_hash": the EVIDENCE HASH printed at the end of the view, copied exactly } }
In your own voice do not write "could have", "may have", "cannot be ruled out", "remains contested", "most scholars", "consensus", "the majority", "agreed", or praise or blame for either camp: the check refuses them. Name the person and what he argues.
After the build, also run:  node "${ROOT}\\lib\\mizan.js" check "${dir}" --only ${q.id} --blind   and fix what it reports about your verdict and your marks.
YOU JUDGE BLIND, AND THAT IS PROVEN FROM YOUR RECORD. The harness records every file you open and every command you run. Until your part is final, open nothing of this case except view-blind.md and your own part, and run the outcome and check commands only with --blind as written above: view.md, case.json, any other agent's part (the second judge's, the fact-checker's) and those commands without --blind all show marks that are not yours, and a judge whose record shows one of them before his last write is refused by the final check. Until your part is final, do not open the checker's own scripts or its rules file either (lib\\mizan.js, domain\\mizan\\*.js, checks.json): you run them, you do not read them, and a judge who read them is named in the record.
Return the outcome and your reason in three sentences.`, note),
      () => run(`${pad(base + 10)}-judge2`, 'Judge', adv, JUDGE_DONE, `YOUR ROLE: the SECOND JUDGE. Another judge is marking the same record at this moment; you do not see his marks and he does not see yours, and neither of you sees the fact-checker's. A firm conclusion is published only where the two of you mark every needed point alike.
${table}
Mark every NEEDED point yourself from the found quotes. If you hold that a point set aside as "not needed" is in fact needed by its argument, name it under "needed_disagree". If you hold that a point marked "needed" is not needed by its side's argument (for example a weak point the other side put there), name it under "needed_wrongly".
Your part: { "role": "judge2", "second_opinion": { "crux": the point it turns on, "premises": [ { "id": every needed point, "status" } ], "needed_disagree": [ ids ], "needed_wrongly": [ ids ], "evidence_hash": the EVIDENCE HASH printed at the end of the view, copied exactly (it ties your marks to the quotes you were shown; without it the final check refuses your part) } }
YOU JUDGE BLIND, AND THAT IS PROVEN FROM YOUR RECORD. The harness records every file you open and every command you run. Until your part is final, open nothing of this case except view-blind.md and your own part, and do not run the outcome or the check command at all (they print the first judge's result): a judge whose record shows view.md, case.json, another agent's part or one of those commands before his last write is refused by the final check. Until your part is final, do not open the checker's own scripts or its rules file either (lib\\mizan.js, domain\\mizan\\*.js, checks.json): a judge who read them is named in the record. Work the outcome out yourself from the table above.
Return the outcome your marks give by the table, and your reason in three sentences.`, note),
    ])
    if (!j1) { log(`${q.id}: the judge returned nothing`); return { outcome: null } }
    // A judge's mark may rest on a quote no reader has yet tied to that point. A reader does that now; he reads no quote anew.
    await reading(`${pad(base + 15)}-read`, 'Judge', 'The judges have just marked the points. Do ONLY step (4): for every line "NO READER HAS YET SAID WHETHER THESE BEAR ON IT", say whether each quote listed bears on the point and copy the words of the quote that do, and record any found quote that says the opposite of a mark. Give no "readings", no "later" and no "turn_checks" unless view.md still shows something not yet read.')
    const swap = await swapping(`${pad(base + 20)}-swap`)
    if (swap && !swap.confirmed) log(`${q.id}: the fairness reader does not confirm that one standard was applied to both sides: ${swap.objection}`)
    return { judge_marks_give: j1.outcome, second_judge_marks_give: j2 ? j2.outcome : null, swap_confirmed: !!(swap && swap.confirmed), swap_objection: swap && !swap.confirmed ? swap.objection : '' }
  }

  // ---- Redo: run chosen stages again for a case that already exists. Each runs as a NEW part by a NEW agent, numbered after the
  //      parts already there, because a case is repaired by the role whose work was at fault, never by hand. Earlier findings are
  //      kept beside the new ones: a second reader does not erase the first. ----
  if (Array.isArray(q.redo)) {
    let verdict = {}
    for (const s of q.redo) {
      if (s.stage === 'repair') await repairing(s.part, s.side, s.note)
      else if (s.stage === 'read') await reading(s.part, 'Close', s.note)
      else if (s.stage === 'translate') await translating(s.part, 'Close', s.note)
      else if (s.stage === 'check') await checking(s.part, 'Close', s.note)
      else if (s.stage === 'extract') await extracting(s.part, 'Close', true, s.note)
      else if (s.stage === 'reply') await replying(s.part, 'Rounds', 'an added turn', s.leads, s.note)
      else if (s.stage === 'counter') await countering(s.part, 'Rounds', 'an added turn', s.leads, s.note)
      else if (s.stage === 'stop') await stopping(s.part, 'Rounds', s.note)
      else if (s.stage === 'second') await secondSearch(s.part, s.roadblock, s.note)
      else if (s.stage === 'judges') verdict = await judging(s.base, s.note)
      else if (s.stage === 'swap') { const sw = await swapping(s.part, s.note); verdict = { ...verdict, swap_confirmed: !!(sw && sw.confirmed), swap_objection: sw && !sw.confirmed ? sw.objection : '' } }
      else log(`${q.id}: unknown stage to run again: ${s.stage}`)
    }
    return { id: q.id, dir, redo: q.redo.map((s) => s.stage + ':' + (s.part || s.base)), ...verdict }
  }

  // ---- Open ----
  const claim = await run('010-claim', 'Open', adv, DONE, `YOUR ROLE: the advocate of the CLAIM. Make its case from its own specialists, classical first, then modern.
Your part: { "role": "claim", "side": "claim", "position": the claim stated precisely in at most 80 words, "short": the claim in one line, "candidates": [ { "who", "why": why he is or is not among the strongest specialists for this claim, "url": the address of his work, "not_quoted": leave it out when you quote him; "weaker" when you read him and he is not among the strongest (say why); "unreadable" when you could not read his words, and then you MUST declare a roadblock whose "who" begins with the same name } ] (at least two specialists you considered, including those you quote; a candidate's "who" begins with the person's name exactly as the "who" of his quote or of his roadblock begins), "overstated": [ popular tellings of this claim that go further than the specialists and the evidence do; be honest, this protects the claim ], "latest": the newest relevant evidence or publication and its date, "points": [ { "id": "C1", "text": one factual step the claim rests on, INCLUDING each step of inference from its facts to its conclusion }, ... ], "evidence": [...], "roadblocks": [...], "searched": [...] }
Quote at least two specialists of the claim side in their own words from their own books, not only scripture: scripture alone is not the scholars' answer.

${SOURCES}`)
  if (!claim) { log(`${q.id}: the claim advocate returned nothing`); return null }
  const objection = await run('020-objection', 'Open', adv, DONE, `YOUR ROLE: the advocate of the OBJECTION. Make the strongest published case against the claim, through its best advocate, not its loudest. First run the build once and read ${dir}\\view.md to see the claim as its advocate stated it.
Your part: { "role": "objection", "side": "objection", "name": the objection in one line, "by": the advocate who puts it best, "text": the objection at full strength in at most 120 words, in a form its advocate would accept as his own, "candidates": [ { "who", "why": why he is or is not the best advocate of it, "url": the address of his work, "not_quoted": leave it out when you quote him; "weaker" when you read him and he is not among the strongest (say why); "unreadable" when you could not read his words, and then you MUST declare a roadblock whose "who" begins with the same name } ] (at least two, including the one you chose; a candidate's "who" begins with the person's name exactly as the "who" of his quote or of his roadblock begins), "other_objections": [ other known objections to this claim that you are NOT weighing here, one line each ], "latest": the newest relevant publication for the objection and its date, "points": [ { "id": "O1", "text": one factual step the objection rests on, INCLUDING each step of inference from its facts to "so the claim fails" }, ... ], "evidence": [...], "roadblocks": [...], "searched": [...] }
Quote the advocate himself (kind "advocate"), in his own words from his own work. If his words are on no readable page, record a roadblock for them; never state his view from memory.

${SOURCES}`)
  if (!objection) { log(`${q.id}: the objection advocate returned nothing`); return null }
  await extracting('030-extract', 'Open', false)

  // ---- Rounds ----
  let rounds = 0, stop = null, reply = null, counter = null
  const round = async (b, name) => {
    const rd = await reading(`${pad(b + 10)}-read`, 'Rounds')
    if (rd && rd.to_translate > 0) await translating(`${pad(b + 15)}-translate`, 'Rounds')
    await checking(`${pad(b + 20)}-check`, 'Rounds')
    reply = await replying(`${pad(b + 30)}-reply`, 'Rounds', name, stop && stop.leads)
    counter = await countering(`${pad(b + 40)}-counter`, 'Rounds', name, stop && stop.leads)
    stop = await stopping(`${pad(b + 50)}-stop`, 'Rounds')
    const quiet = reply && counter && reply.nothing_new && counter.nothing_new && reply.new_points === 0 && counter.new_points === 0
    log(`${q.id}: ${name}: claim ${reply ? (reply.nothing_new ? 'nothing new' : '+' + reply.new_points + ' point(s)') : 'no reply'}, objection ${counter ? (counter.nothing_new ? 'nothing new' : '+' + counter.new_points + ' point(s)') : 'no counter'}, the neutral search ${stop && stop.nothing_new_confirmed ? 'found nothing more' : 'found ' + ((stop && stop.leads) || []).length + ' thing(s) not yet on the table'}`)
    return !!(quiet && stop && stop.nothing_new_confirmed)
  }
  let settled = false
  for (let r = 1; r <= MAX_ROUNDS && !settled; r++) { rounds = r; settled = await round(100 * r, `round ${r}`) }
  // What the last neutral search found is put on the table before anyone judges: one more round, so that the loop does not end on a known unanswered answer.
  if (!settled && stop && stop.leads && stop.leads.length) { rounds++; settled = await round(600, 'the closing round') }
  // Nobody is left with an unanswered last turn: while the side that spoke last added something, the other side is given one turn, to answer
  // what is new or to say it has nothing to add (at most two such turns a side). The neutral search then looks once more.
  const added = (x) => !!x && (!x.nothing_new || x.new_points > 0 || x.turns > 0)
  const ANSWER = 'The other side spoke last and added something. Answer what is new, or say you have nothing to add: "nothing_new": true with no turns, points or evidence.'
  const extra = { claim: 0, objection: 0 }
  let lastSide = counter ? 'objection' : 'claim', lastPart = counter || reply
  while (added(lastPart)) {
    const side = lastSide === 'objection' ? 'claim' : 'objection'
    if (extra[side] >= 2) break
    lastPart = side === 'claim' ? await replying(`${pad(655 + 10 * extra.claim)}-reply`, 'Rounds', 'an added turn', null, ANSWER) : await countering(`${pad(660 + 10 * extra.objection)}-counter`, 'Rounds', 'an added turn', null, ANSWER)
    extra[side]++; lastSide = side
  }
  if (extra.claim + extra.objection) stop = await stopping('680-stop', 'Rounds')
  if (!settled) log(`${q.id}: the exchange ended at the round limit without a neutral search confirming that nothing more exists; the outcome will be "not determined" on that ground`)

  // ---- Close: a second neutral reader of what the arguments need, now that the exchange exists; whatever the last round added is read and
  //      checked like the rest; every roadblock is searched again by someone who is told only what is sought ----
  await extracting('690-extract', 'Close', true)
  const rd = await reading('700-read', 'Close')
  if (rd && rd.to_translate > 0) await translating('710-translate', 'Close')
  const last = await checking('720-check', 'Close')
  const blocks = last && last.roadblock_ids ? last.roadblock_ids.filter((id) => /^R\d+-\d+$/.test(id)) : []
  if (!last) log(`${q.id}: the closing check returned nothing; roadblocks, if any, get no second search in this run`)
  await parallel(blocks.slice(0, 40).map((id, i) => () => secondSearch(`${pad(800 + i)}-second`, id)))
  if (blocks.length > 40) log(`${q.id}: ${blocks.length - 40} roadblock(s) beyond the first 40 got no second search and will fail the check`)
  // Whatever the closing check and the second searchers added is read, and translated where needed, like the rest; the marks get their bearings read.
  const rd2 = await reading('890-read', 'Close')
  if (rd2 && rd2.to_translate > 0) await translating('895-translate', 'Close')

  const verdict = await judging(900)
  return { id: q.id, dir, rounds, exchange_settled: settled, roadblocks: blocks.length, ...verdict }
}

const out = await parallel(QUESTIONS.map((q) => () => weigh(q)))
const missing = QUESTIONS.filter((q, i) => !out[i]).map((q) => q.id)
if (missing.length) log(`questions with no case: ${missing.join(', ')}`)
return { cases: out.filter(Boolean), missing, next: 'for each case folder: case.js build --final, prove.js with this run\'s transcript folder, case.js build --final again, then lib/mizan.js check <folder> --transcripts <folder>; the published outcome is the one that check prints, not the one a judge reports here' }
