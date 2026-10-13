---
name: artifact-registry
description: List of every published claude.ai artifact with its link; update an existing one by link instead of creating a second copy
metadata:
  node_type: memory
  type: reference
  originSessionId: fed5aaa2-35e9-43a4-8258-a1916ec3c80e
  modified: 2026-10-13T09:20:30.184Z
---

Every artifact published under miya's claude.ai account, newest first. Snapshot of the live list on 2026-10-04 (`Artifact` tool, action `list`, scope `all`: 16 rows).

| Artifact | Link | Updated | About |
|---|---|---|---|
| Mizan, the Scale | https://claude.ai/artifact/Uv8673ZUo3Rx8JQzDEwCTp | 2026-10-11 | Personal. Explains the Mizan research method by itself: the one rule, the four parts (skill + loop script + tool scripts + checks), the loop, the first real trial, the Fable 5.1 assessment and what is open. Source of truth: `.claude\skills\mizan\SKILL.md` + `domain\mizan\README.md`. The page is filled by script from the record: template `mizan-the-scale.html` + `fill-artifact.js` + `extras.json`; a copy of the published page is in `projects\coding-projects\active\DawahMap\research_notes\Mizan assessment by Fable 5.1 (2026-10-11)\`. Version 2 (2026-10-11 08:35): both batches of corrections installed, the state of each of the 13 holes, and the pending ruling on Mizan's place in DawahMap |
| Reason to Islam | https://claude.ai/artifact/22CRAptuNqGqRUonHDfe28 | 2026-10-13 | Personal. The DawahMap project's page, map version 0.7, **version 34 of the link (2026-10-13)**: "A walk by reason", drawn since version 28 as ONE decision tree (a map pane, shape in `app\tree-layout.js`) beside a reader pane; 12 steps asked as 26 single yes/no questions (the newest is step 10d, the errors of its age), and 7 hard-question branches (reason first, neutral wording, a record of conclusions, historical-records theme, parchment only, every reply answers the person; a No leads down its own side path on all 24 question steps: 164 side questions and 81 rest cards, texts in `app\side-paths.js`; wording in style B, the cross-examiner). It declares the `sample` capability since version 29 (a box for the reader's own words, only sorted to a written card): republish the same file path and leave `capabilities` out to keep it. The whole map also exists as a PDF made at every update (`node app\map.js` → `app\dist\walk-by-reason-map.pdf`, sent to him as a file, not published). State and what is next: the project's `ROADMAP.md` section 5.00. Source of truth: `app\route.json` + `app\nodes\` in the DawahMap project folder (`app\tree.json` is the rejected 0.2 content, not built); every reply text lives in `app\replies.js`; the page is rebuilt with `node app\build.js` and published from `app\dist\reason-to-islam.html`. Version 16 (2026-10-12): the seven hard-question replies rewritten after a second reader, then trimmed so none repeats the line printed under it; versions 12 to 14: all replies rewritten to answer the person (full history in the project's `VERSIONS.md`). Version 8 (2026-10-12): after the second read; the page's own title is now "A walk by reason" (the artifact may show under that name; the project and this row keep "Reason to Islam"). Version 7: the single questions. Version 6 is the 12-question page |
| PymTime Design Directions | https://claude.ai/artifact/HradTg5DgGC2wAsBCDWfYg | 2026-10-08 | PymTime v18 design, roadmap phase 1: the v17 page and three mockups (A Two Cards, Quiet · B One Answer · C Side Rail, One View) flipped through six states, the ranked critique, the colour tokens. Source of truth: `DESIGN.md` in the PymTime project folder; the page is rebuilt with `make-compare.js` in `E:\Dev\scripts\PymTime\dev\design\` |
| Quest Paths | https://claude.ai/artifact/F6XUQEjvyABeLJaoSY3Ls4 | 2026-10-05 | Infographic, 5 levels: the trip · which path (patch / minor / development, three tests, decided twice) · what each phase produces per path · what is loaded when · development in depth with the #268173 layer sweep. Source of truth: quest SKILL.md step 6d + "Development path" |
| Quest Workflow Architecture | https://claude.ai/artifact/Xovop2WNEp1hcQS37SkhLJ | 2026-10-04 | Drawing of the quest workflow: ticket path, stores, checks by moment |
| Ruri Boot Sequence | https://claude.ai/artifact/WnyAt8Jdg9LEkZjdytmWzB | 2026-10-02 | Boot order |
| Miya's Voice Map | https://claude.ai/artifact/8hHcoyPVrJaD7Umm8oj5RB | 2026-10-02 | His writing voice |
| Semakan Fakta Zakat Pelajar IPT | https://claude.ai/artifact/XVxENMRjmJqCc2RLqRPbB1 | 2026-09-29 | Personal |
| Database Gateway | https://claude.ai/artifact/FUU4P46Y5vBDefeipM3Ms6 | 2026-09-28 | See [[db-gateway]] |
| PDBB Unit Hasil Handover | https://claude.ai/artifact/MJkHKwSsfwf4s6jMUDinbk | 2026-09-25 | etanah |
| The Mind of Nazgul — Book Cover | https://claude.ai/artifact/5o8YzXHfDtPEGR3tjuAUNr | 2026-09-24 | Personal |
| Intel Malaysia Benefits at a Glance | https://claude.ai/artifact/Jxc1qmFrzFQYNkyqLeghp4 | 2026-09-21 | Personal |
| Alatas Critique Cards | https://claude.ai/artifact/8bBujkgMDNzqXe96zGQy1M | 2026-09-20 | Personal |
| Karusel Semak Fakta: Perhambaan & Melayu Mundur | https://claude.ai/artifact/BupjjpicsLGmmJQgeCYqVo | 2026-09-20 | Personal |
| Fact Check: Pre-1874 Malay Slavery, Feudal Oppression & 'Malay Backwardness' | https://claude.ai/artifact/Hso8chWfj4EqmeGQR5x1YM | 2026-09-19 | Personal |
| Ergonomic Awareness | https://claude.ai/artifact/RRWztYYAqBtYQ8cHn1EcW9 | 2026-08-28 | See [[feedback_verify_generated_art_externally]] |
| etanah learn | https://claude.ai/artifact/XTdy7A9vADR5gvPD5iKVzX | 2026-08-26 | etanah |
| Release Gate Proof | https://claude.ai/artifact/6bQGUck9dkNq72SriaoQFt | 2026-08-24 | Release tooling |
| eTanah Emel & Notifikasi | https://claude.ai/artifact/3muLMjUEXsn5AEYaGF5UqD | 2026-08-24 | etanah |
| eTanah Upload Flow | https://claude.ai/artifact/8kMkno2gWVu76PTGmWCE4e | 2026-08-20 | etanah |

The "About" notes for rows I did not open this session come from the title only, not from reading the page.

**How to apply:**
- Asked for a drawing or page on a topic in this table: read it by its link and UPDATE it in place (same link). Create a new one only when miya asks for a different one.
- After every publish: add or update the row here in the same turn.
- This file can lag. The live truth is the `Artifact` tool, action `list`, scope `all`. Run it when a row is missing or a date looks old.
- An artifact is a snapshot. For the quest workflow, the files stay the truth; refresh the drawing when the workflow changes.
