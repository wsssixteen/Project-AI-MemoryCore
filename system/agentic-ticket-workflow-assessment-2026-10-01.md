# Agentic ticket workflow assessment — 2026-10-01 (worktree pelupusan-template-verify-fe1bef)

| Axis | Instance this session | Assessment | Proposal logged |
|---|---|---|---|
| A1 agentic system | 21 Sep template audit ended with a BA reply and no adhoc save; only transcript search recovered it | Saving is still model-remembered on the session where it matters most | Stop hook: DB queries + BA-reply block with no adhoc/QA id → block |
| A2 quest workflow | `notes.js --reset` wiped 2 of 3 test rows without warning | Destructive flag with silent effect | Refuse --reset when >1 entry unless --force |
| A3 debugging | Code (`MlkPelupusanPenyediaanSuratStrategy.java:44/62`) settled "ulangan" against memory in one read | Knowledge-first then code worked; no gap | A3 ⏭ nothing new |
| A4 etanah issue-solving | Live task state query gave BA logins at the right tugasan | Rule followed; no gap | A4 ⏭ nothing new |
| A5 sweep | adhoc-save writes from worktree cwd went to worktree paths | Skill steps assume main cwd | Main-checkout resolver for the skill steps |
