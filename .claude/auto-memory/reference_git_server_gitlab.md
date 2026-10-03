---
name: reference-git-server-gitlab
description: "🚨 Live etanah git = GitLab git@10.16.63.27:etanah/<repo>.git; old ssh://git@172.16.93.167 refuses auth. 'Permission denied (publickey…)' = stale remote, not a network fault"
metadata:
  type: reference
---

🚨 The live etanah git server is GitLab: `git@10.16.63.27:etanah/<repo>.git` (one repo per module, every state is a branch prefix: `mlk/`, `trg/`, `prk/`). SSH key `~/.ssh/id_ed25519_gitlab` via `~/.ssh/config`.

The old server `ssh://git@172.16.93.167/<repo>` still answers on port 22 but refuses every key: `Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password)`. That message means a stale remote, never "the network is down".

| Checkout (verified 2026-10-03) | Remote |
|---|---|
| `E:\Projects\Melaka\*` | GitLab |
| `E:\Dev\etanah-work\etanah-pelupusan`, `etanah-awam` | GitLab |
| `E:\Projects\Terengganu\*` (4 repos) | old server |
| `E:\Projects\Perak\etanah-pelupusan` | old server |
| `E:\Dev\etanah-work\etanah-common` | old server (and 7,000 dirty paths) |

**How to apply**: before saying a branch is behind or missing, check `git remote get-url origin`. To compare without moving any ref in his repo: `git ls-remote` from a GitLab-pointed clone. Re-pointing HIS checkout is his decision. Nexus for `-TRG` / `-MLK` common jars: `http://172.16.90.169/nexus`.

Related: [[feedback_etanah_git_separate_clone]] · [[project-terengganu-active]]
