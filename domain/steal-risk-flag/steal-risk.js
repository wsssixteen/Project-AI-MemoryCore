// steal-risk.js — QUICK-WIN / steal-risk detector for the boot board.
//
// WHY (2026-08-17, miya): ticket 275587 was patch-only, fully diagnosed in the
// sweep (state "Recon+Rubric done; qa_doc ready; fix in own session"), then left
// as status=hold. While it sat idle a colleague applied it and booked the KPI —
// Redmine now shows it Resolved under another name at 0% done. The board ranks by
// AGE only (3-DAY RULE); a diagnosed patch that just needs applying is the
// cheapest KPI on the board and NOTHING flagged it as losable. This module adds
// the missing PROACTIVE leg (before the steal) to redmine-status-check.js's
// REACTIVE leg (after the steal).
//
// Pure functions, no network, no fs — so the eval feeds fixtures directly and the
// board wires one call. Operates on the rows that quest/redmine-board.js `shape()`
// already produces: { id, tracker, status, assignee, state, days, due, subject }.

'use strict';

// A ticket is a QUICK-WIN steal-risk when BOTH hold:
//
//  (1) The fix is SMALL / KNOWN — either the tracker is Data Patching (PROD)
//      (inherently a fast patch) OR its board State says the diagnosis is finished
//      and only applying remains.
//  (2) It is IDLE — the State does NOT already say the fix is being applied /
//      committed / pushed / merged. A ticket already mid-Apply is not losable in
//      the same way; the risk window is the gap between "diagnosed" and "applied".
//
// The regexes read the SAME State vocabulary the board renders from active.txt,
// so a state-phrase change is the single place to keep in sync.

// Diagnosis finished, only Apply remains — the exact 275587 shape.
const DIAGNOSED_READY = /recon\s*\+\s*rubric done|qa[_ ]?doc ready|fix in own session|recon-done|rubric-done|data patch|null-guard direction ready|patch[- ].*(ready|await)/i;

// The fix is already moving — not an idle grab target. "Apply" as a phase word,
// or any committed/pushed/merged marker.
const ALREADY_MOVING = /\bapply\b|committed|pushed|merged/i;

// Tracker names that are patch-only by construction.
const PATCH_TRACKER = /data patching/i;

function whyQuick(row) {
    const state = row.state || '';
    const tracker = row.tracker || '';
    if (PATCH_TRACKER.test(tracker)) return 'data-patch tracker';
    if (DIAGNOSED_READY.test(state)) return 'diagnosed — only Apply left';
    return null;
}

// Is THIS row (assumed already known to be miya's & open) a steal-risk?
function isStealRisk(row) {
    if (ALREADY_MOVING.test(row.state || '')) return false; // already mid-Apply
    return whyQuick(row) !== null;
}

// Rank steal-risk rows: oldest-idle first (same age axis as the main board), then
// nearer due date, then id — deterministic so the banner loads identically each boot.
function rankSteal(rows) {
    return rows.slice().sort((a, b) => {
        if ((b.days ?? -1) !== (a.days ?? -1)) return (b.days ?? -1) - (a.days ?? -1);
        if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
        if (a.due && !b.due) return -1;
        if (!a.due && b.due) return 1;
        return a.id - b.id;
    });
}

// Given miya's own open rows, return the ranked steal-risk subset.
function flagStealRisk(mineRows) {
    return rankSteal((mineRows || []).filter(isStealRisk));
}

// Render the banner that prints ABOVE the age-ranked Mine table. Empty string when
// nothing qualifies — a quiet board stays quiet (no false urgency).
function renderStealBanner(mineRows) {
    const steal = flagStealRisk(mineRows);
    if (!steal.length) return '';
    const out = [
        `🥇 QUICK-WIN — do FIRST · steal-risk (${steal.length}): diagnosed patch, not yet applied.`,
        '   Every day idle = a colleague can apply it and book the KPI (lost 275587 this way).',
        '',
        '| # | Days | Why quick | Subject |',
        '|---|---|---|---|',
    ];
    for (const r of steal) {
        out.push(`| ${r.id} | ${r.days ?? '—'} | ${whyQuick(r)} | ${(r.subject || '').trim()} |`);
    }
    return out.join('\n');
}

module.exports = { isStealRisk, whyQuick, flagStealRisk, renderStealBanner, rankSteal };
