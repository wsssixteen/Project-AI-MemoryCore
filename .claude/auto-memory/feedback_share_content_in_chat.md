---
name: feedback_share_content_in_chat
description: Share file content directly in chat, not just the file path — paths alone are not useful without opening the file
type: feedback
originSessionId: 9afbfbca-c3a9-42e3-abbb-0d40be992410
---
When delivering ANYTHING actionable — a SQL patch, a test scenario / what-to-do, a query, a report, a document — share the FULL content directly in the chat response. A file path/link is at most a SUPPLEMENT, NEVER the primary delivery. みや must never have to open a file to understand what I'm telling him.

**Why:** みや said "please just share here next time" (origin) and AGAIN, harder, 2026-06-22 (QA-266503): I kept pointing to `issue2-test-scenario.md` + `repro-issue2-patch.sql` as links instead of pasting the patch SQL + test steps inline — *"share everything here... I don't need to have to open files and guess what you're trying to tell. Fix this behaviour."* This is a REPEAT slip — the rule existed and I still link-dropped. A link forces him to context-switch + guess; inline content is immediately readable.

**How to apply:**
- Default = paste the COMPLETE content in chat (the SQL, the steps, the queries, the table). Writing it to a file is fine, but the chat must stand alone without opening anything.
- A "what to do" / test scenario = every step + every query INLINE, not "see the runbook".
- Banned: a reply whose actionable payload lives only behind a `[file.md](path)` link.
- Exception: very long files (500+ lines) where a summary is more useful — summarize inline + note the path.
