---
name: prod-server-logs
description: PROD server logs can be fetched by us over SFTP for WP, Perak, Selangor, Terengganu and Melaka; hosts, users and passwords live in one git-ignored file
metadata:
  type: reference
---

We have our own SFTP access to the PROD application server logs of five states (WP, PRK, SEL, TRG, MLK). Given by miya 2026-10-12.

Details (host, folder, user, password, port 22) are in the git-ignored file `projects/coding-projects/active/etanah-knowledge/PROD-SERVER-LOGS.md` in the MAIN checkout. Read that file; never ask miya for them again. The same file holds the Petaling flowable drop login and the WinSCP "sessions disappeared" fix.

**How to apply:** when a PROD server log is needed, fetch it ourselves from that server instead of sending the infra one-liner in [[infra-requests]]. The infra line stays for environments not in the file. Check the DB error store first, as before.

**Never** write the passwords, or the host and user together, into this file, MEMORY.md or any other tracked file: the MemoryCore repo on GitHub is public.
