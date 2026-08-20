// patch-intake.js — INTAKE-time "this is a data-patch ticket" detector.
//
// WHY (2026-08-19, miya, #275501): steal-risk-flag (2026-08-17) only flags a patch
// AFTER it is diagnosed — it reads the board State phrases ("Recon+Rubric done",
// "data patch … ready"). It is BLIND at intake: when the BA's own words in the
// Description/History say "minta patch maklumat" / "please help to patch … in STG
// first" / "maklumat tak lengkap", nothing classified the ticket as a patch, hoisted
// it to do-first, or forced the patch SCRIPT as the deliverable. #275501 sat as a
// generic bug on status=hold with no script prepared. This module adds the missing
// INTAKE leg: it reads the BA text and fires the moment a patch is requested — before
// any diagnosis exists to trigger steal-risk-flag.
//
// Pure functions, no network/fs — the eval feeds Description/History text directly and
// ticket-gate.js wires one call reading the active quest's 0. Brief/.

'use strict';

// BA patch-request signals, English + Malay. Each entry carries a human label so the
// banner can name WHY it fired. Ordered most-specific first (first match wins).
const SIGNALS = [
    { re: /\bminta\s+patch\b/i,                                   label: 'BA: "minta patch"' },
    { re: /\b(help\s+to\s+|tolong\s+|please\s+)?patch\s+(the\s+)?maklumat\b/i, label: 'BA: "patch maklumat"' },
    { re: /\bpatch\s+(the\s+)?data\b/i,                           label: 'BA: "patch data"' },
    { re: /\bdata\s+patch(ing)?\b/i,                              label: 'Data Patching request' },
    { re: /\bpatch\b[^.\n]{0,40}\b(in\s+)?(stg|staging|prod|production)\b/i, label: 'BA: "patch … in STG/PROD"' },
    { re: /\bpatch\b[^.\n]{0,25}\bfirst\b/i,                      label: 'BA: "patch … first"' },
    { re: /\bpatch\b[^.\n]{0,30}\bmissing\b/i,                    label: 'BA: "patch … missing"' },
    { re: /\bmissing\b[^.\n]{0,30}\bpatch\b/i,                    label: 'BA: "missing … patch"' },
    { re: /\bmaklumat\s+(yang\s+)?(tak|tidak)\s+lengkap\b/i,      label: 'BA: "maklumat tak lengkap"' },
];

// Guard against the word "patch" meaning a CODE patch / git patch / dispatch, which is
// NOT a data-patch request. Only used to veto a lone generic "patch" verb; the explicit
// signals above (patch maklumat / patch data / minta patch) are never vetoed.
const CODE_PATCH_CONTEXT = /\b(git|code|hotfix|binary|security)\s+patch\b|\bpatch\s+(the\s+)?(code|class|method|jar|war|build)\b|\bdispatch\b/i;

// Detect whether the BA text is asking for a DATA patch. Returns
// { isPatch, signal } — signal is the matched human label (or null).
function detectPatchRequest(text) {
    const t = String(text || '');
    for (const s of SIGNALS) {
        if (s.re.test(t)) {
            // A specific data-patch phrase always wins. Only veto if the sole hit is a
            // bare patch-verb that a CODE-patch context clearly claims — not our case here.
            return { isPatch: true, signal: s.label };
        }
    }
    return { isPatch: false, signal: null };
}

// Render the loud Phase-0 banner. Empty string when it is not a patch ticket
// (no false urgency). ticketId is optional (for the header line).
function renderPatchIntakeFlag(text, ticketId) {
    const { isPatch, signal } = detectPatchRequest(text);
    if (!isPatch) return '';
    const id = ticketId ? ` — ${ticketId}` : '';
    return [
        `🩹 PATCH TICKET${id} — the BA is asking for a DATA PATCH (${signal}).`,
        '   DO THIS FIRST. It is the cheapest, most steal-able KPI on the board.',
        '   Deliverable = the PATCH SCRIPT itself (before-SELECT · UPDATE · after-SELECT),',
        '   prepared straight away and tested on STG before PROD — not just a diagnosis.',
    ].join('\n');
}

module.exports = { detectPatchRequest, renderPatchIntakeFlag, SIGNALS, CODE_PATCH_CONTEXT };
