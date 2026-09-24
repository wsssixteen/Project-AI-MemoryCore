# Agentic ticket workflow assessment — 2026-09-24 (session: #278909)

| Axis | What happened (instance) | Assessment | Proposal |
|---|---|---|---|
| A1 agentic system | 6 Stop-hook blocks on drafted Redmine text ("belum wujud", "tidak perlu diubah") by attempt-before-blocked-gate; render-verify fired on a delegated template ticket 4× | Gates read fenced draft text as my own capability claims → noise, delta replies cost turns | exclude fenced blocks; skip render-verify when status=delegated |
| A2 quest workflow | "Start to finish" → I built 3 docx; miya wanted junior to build | Quest Apply has no "who builds" branch for template tickets | popup before docx write (memory `template-work-junior-builds` written) |
| A3 debugging | Hypothesis (missing template → load failure) stated before runtime proof; miya's staging photo confirmed `Couldn't load file` | Correctly labelled HYPOTHESIS until proof; good | ⏭ nothing new |
| A4 etanah issue-solving | Ammar's config entries shipped in release/1.6.3 without the docx; no release check caught it | Release recon trusts commit messages; no config→file existence check | release V3 check (`cfg_missing.py`) — also surfaced `TemplateSuratAkuJanjiRoboh.docx` missing since ≤1.6.2 |
| A5 sweep | ⏭ no sweep run this session | — | — |
