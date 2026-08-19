# Improvement Sweep — 2026-08-19 (ADHOC-PT-2026-4 session)

Focused single-adhoc diagnostic session (PT SKM Seterusnya NPE). Five axes, concrete instance per claim.

## A1 — Agentic system
- **Instance**: the adhoc-scaffold delegate (feedback_adhoc_scaffold_delegate) FAILED silently — the `Agent` spawn returned `PreToolUse:Agent hook error: agent-spend-gate ... No stderr output`, so I scaffolded inline instead. The delegate pattern was voided by an illegible hook error.
- **Proposal logged** (A1): agent-spend-gate must emit its allow/deny + reason on stderr so a block is legible, not a no-stderr void.

## A2 — Quest workflow
- ⏭ Worked as intended. ticket-gate did NOT auto-fire on the PTMLK id (adhoc, no Redmine #) — but adhoc-paste-detector + the /goal scaffold covered it. Known gap already tracked (feedback_adhoc_scaffold_delegate root note).

## A3 — Debugging efficiency + accuracy
- ⏭ Strong. Video (URL bar + stack trace) → exact code line 2194 → DB proof `[{}]` in ~6 calls. The URL-bar-first + stack-trace-first discipline (feedback_watch_video_url_first) paid off; no wrong-form guessing.

## A4 — etanah issue-solving
- **Instance**: same-root NPE lives in TWO files (awam `PelupusanMaklumatPemohonHelperForm:2855` + pelupusan `PelupusanMaklumatPemohonHelper:2194`) reading the same `tempatTinggal` JSON; QA-275152's AWAM fix does NOT cover the pelupusan twin.
- **Proposal logged** (A4): Phase-0 'twin-reader scan' — on any maklumatTambahan/JSON-field NPE, grep the KEY_ constant across awam+pelupusan+common and list every `getAsString()` site before calling a fix complete.

## A5 — Sweep / file sweep
- ⏭ N/A — no multi-ticket sweep this session.

## Verdict
Diagnosis quality high; the one real system gap is the illegible agent-spend-gate block (A1) that silently defeated a designed delegation. Both proposals in slip-dashboard 💡 Open proposals for weekly audit.
