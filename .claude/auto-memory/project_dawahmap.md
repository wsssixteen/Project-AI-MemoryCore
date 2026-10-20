---
name: project_dawahmap
description: "DawahMap (みや's yes/no map from rational questions to Islam; the page is called Reason to Islam) — READ PROJECT.md in the MAIN checkout's projects/coding-projects/active/DawahMap/ FIRST; it argues FOR Islam from the scholars' verbatim words, never as a neutral survey"
metadata:
  node_type: memory
  type: project
  originSessionId: be5b16b4-6a21-45ba-abb5-f619d46b57d4
  modified: 2026-10-15T15:32:59.778Z
---

**DawahMap** = みや's personal project (started 2026-10-10): a yes/no decision map, street-dawah style, that walks a person from basic rational questions to Islam in six stages. The published page is **Reason to Islam**: https://claude.ai/artifact/22CRAptuNqGqRUonHDfe28 ([[artifact-registry]]).

**The project folder is the source of truth**: `<MemoryCore>\projects\coding-projects\active\DawahMap\` in the MAIN checkout (home PC: `C:\Users\vice4\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\`; work laptop: `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\`). Read `PROJECT.md` there FIRST. It points to `VERSIONS.md` · `ARCHITECTURE.md` · `PROOFS.md` (the content rules and checks) · `ROADMAP.md`. No own code repo yet: the code is the `app\` folder inside it. State lives in `PROJECT.md` section 1, never here ([[feedback_side_project_folder]]).

**Always-needed (his correction of 2026-10-10, after he read version 0.2 and was very angry):**
- **The map argues FOR Islam.** His words: "By being FAIR I didn't mean to be APOLOGETIC" · "I want you to be fully biased but take only from trusted sources from scholars you can verify" · "you only gather what the Quran say" (the scholars' answers were missing). No "contested" labels, no concessions for balance, no split between "what a historian can show" and "what Muslims believe".
- **Sources**: Quran, authentic hadith, then the scholars of Islam in their own words. Western academics and orientalists are never the frame; a non-Muslim source appears only as a witness that supports the point. Wikipedia is not a source. See [[feedback_islamic_content_sources]].
- **Three passes, his order**: gather from the scholars · fact-check again · "fact-check it against their verbatim words, make sure you can find them". The third pass is a script (`app\verify-quotes.js`) that fetches the cited page and searches for the quote; what it cannot find does not go in. Quran text is fetched from quran.com by reference, never typed.
- **He does the neutral reading himself**: "it is much more reliable if I am the one that fact-checks you or make it neutral and fair". Do not add balance on his behalf.
- **Content is one file**: `app\tree.json`. After any change: verify quotes, build, smoke, publish to the SAME artifact link.
- **He decided: content first, design later.**
- **No scholar has reviewed it.** Say so whenever the page is presented as ready for the public.

**Why:** he watched a scholar's street discussions and wants a methodical path of sound questions, rational first, then other religions, then the Quran and the Prophet ﷺ. Version 0.1 and 0.2 were built by me as a neutral academic survey (my prompts told the agents to use the Western academic literature, build up every objection and rate steps "contested"); he rejected that outright.
**How to apply:** any DawahMap work → read `PROJECT.md`, then `PROOFS.md` section 1 before writing or briefing an agent. An agent brief for this project quotes his words above.

**Read first, every start and after every auto-compact (his ruling 2026-10-15):** `DawahMap\SPEC.md`, the signed spec, "almost like your own CLAUDE.MD file". Until it exists and is signed: `DawahMap\wayfinder\map.md` (the agreement map, worked with the wayfinder skill, one ticket per session) and the corrections ledger `app\review\feedback.json` (rule 1o). PROJECT.md section 5 step -1 says the same.
