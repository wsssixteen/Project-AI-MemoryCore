# explain-diagram — fixtures (input → expected shape)

| # | Input | Expected |
|---|---|---|
| F1 replay 2026-10-21 | "use the diagram skill you recently installed to explain the solution, draw it simply" (PROD alter route: Ruri, miya, two checks, PROD) | picture route: swimlane, 8 boxes, ONE accent box = "You approve"; self_check.py OK; PNG rendered and looked at; reply = 1 sentence + the sent PNG + at most 3 bullets. Done this way: `prod-alter-swimlane.html` (self-check OK) |
| F2 | "how does the keeper keep the login alive?" (3 steps, one actor) | chat story diagram of up to 4 boxes in a code block, no picture, no table |
| F3 | "compare the 4 PLTP permohonan: holder, tugasan, date" | a table, no drawing (no order between rows) |
| F4 | "which is better, option A or option B?" | one drawing with A and B side by side, the difference marked, then a one-line recommendation |
| F5 | a flow of 14 steps | an overview of at most 9 boxes + one detail drawing of the part he asked about; never one drawing of 14 |
| F6 | `diagram-design` not installed on this machine | install it first (command in project_installed_skills.md), say so in one line, then draw |
