---
name: project-terengganu-active
description: "🚨 Terengganu is an ACTIVE state since 2026-10-03 (was hard-excluded); where its knowledge, DB, git and first-ticket order live"
metadata:
  type: project
---

🚨 Terengganu (TRG) became an ACTIVE state on 2026-10-03, per みや ("we will be doing Terengganu support tomorrow"). Before that the registry and four prose rules said "refuse Terengganu".

**Start here for any Terengganu ticket**: `projects/coding-projects/active/etanah-knowledge/terengganu/index.md` then `STATE-FACTS.md`. Registry record: `node lib/states.js show terengganu`.

| Thing | Value (verified 2026-10-03, re-check before relying) |
|---|---|
| Live queue | Redmine project `esokongan-terengganu` ("eSOKONGAN TERENGGANU"), Module field 17 = Pelupusan. `trg_03_pelupusan` is legacy |
| Day-one ticket mix | mostly PROD support: alter tugasan, data patch, link resit. Code bugs are the minority |
| DB default | MCP `postgres-trgstg2-pg`, schema `et_main_stg2` (fresh, BA's "TRG STAG") |
| Flowable | ONE engine schema `et_flowable17_stg` for stg1 + stg2, readable ONLY through `postgres-trgstg1-pg` |
| Schema trap | `et_main_stg1/2` are the same names Melaka uses. The MCP server name is the only discriminator |
| Test data | pick a permohonan whose workflow was created on or after 2026-09-15 (older ones have no engine instance) |
| Ticket's own truth | the support "session block" in the description names Instance Id, DB Username and Git Branch. Read it first |
| Git | GitLab `git@10.16.63.27:etanah/<repo>.git`, trunk `trg/master`, branch `trg/<tracker>/<num>`, fetch only in `E:\Dev\etanah-work` |
| His checkouts | `E:\Projects\Terengganu\*` read-only for me; on 2026-10-03 they pointed at the old server and were behind (pelupusan 19 commits, awam 41) |
| First ticket | `node quest/redmine-sync.js <num> --create` FIRST, so the active block carries `state=Terengganu` |

**Why**: the first Terengganu session would otherwise have been refused by the registry or fed Melaka knowledge.

**How to apply**: resolve the state before anything (`node lib/states.js resolve`), load the Terengganu folder, never reuse a Melaka path, schema, branch or MCP by habit. A Melaka quest still never touches TRG code, and the reverse.

Related: [[feedback_state_aware_knowledge_load]] · [[project-jboss-launched-by-eclipse]] · [[feedback_etanah_git_separate_clone]]
