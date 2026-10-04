#!/usr/bin/env node
/**
 * redmine-status-check.eval.js — fixture-driven eval for the boot divergence check.
 *
 * 2026-09-25 boot listed 9 of miya's own tickets as "NOT miya's work": Redmine shows his
 * name as "Ahmad Ridhwan Anuar (Dev PLP)" and classify() exact-matched the bare name.
 * The same run printed "Redmine unreachable for 9 quest(s)": the 9 numberless ADHOC blocks
 * were fetched as /issues/undefined.json -> 404 -> counted as unreachable.
 *
 * Cases (issue JSON fixtures only — never calls Redmine):
 *   (a) own ticket, name carries "(Dev PLP)", id 1311, Rework, local hold → ok
 *   (b) own ticket, bare name, id 1311                                  → ok
 *   (c) colleague holds it open, local hold                             → tracking (2026-10-04: keep, never close)
 *   (c2-c10) delegated lifecycle: Rework → tracking · Closed → learn · Resolved → tracking ·
 *            Rejected → diverged · closed locally too early → closed-early · own fix closed by BA → diverged
 *   (d) own ticket Resolved on Redmine, local active                    → diverged
 *   (e) unassigned on Redmine, local hold                               → ok
 *   (f) closed locally, still open + own on Redmine                     → redmine-open
 *   (g) no Redmine response (fetch failed)                              → unknown
 *   (h) numOf: ADHOC-PT-2026-3 → none · QA-274266 → 274266
 *   (i) checkAll on numberless ADHOCs only → prints nothing (no fetch, no "unreachable")
 *
 * Run: node quest/redmine-status-check.eval.js      Exit: 0 = all green, 1 = any red
 */
'use strict';
const path = require('path');
const { classify, toResult, numOf, checkAll } = require(path.join(__dirname, 'redmine-status-check.js'));

const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail }); }

function issue(status, assignee) {
    return { status: { name: status }, assigned_to: assignee, done_ratio: 100 };
}
const MIYA_ROLE = { id: 1311, name: 'Ahmad Ridhwan Anuar (Dev PLP)' };
const MIYA_BARE = { id: 1311, name: 'Ahmad Ridhwan Anuar' };
const OTHER     = { id: 1218, name: 'Ammar (Dev PLP)' };

(async () => {
    const v = (local, i) => classify(local, toResult('274266', i));

    check('(a) own ticket with "(Dev PLP)" suffix → ok', v('hold', issue('Rework', MIYA_ROLE)) === 'ok', v('hold', issue('Rework', MIYA_ROLE)));
    check('(b) own ticket with bare name → ok', v('hold', issue('Rework', MIYA_BARE)) === 'ok', v('hold', issue('Rework', MIYA_BARE)));
    check('(c) colleague holds it In Progress, local hold → tracking (never "close")', v('hold', issue('In Progress', OTHER)) === 'tracking', v('hold', issue('In Progress', OTHER)));
    check('(c2) delegated, colleague in Rework → tracking', v('delegated', issue('Rework (Requirement Update)', OTHER)) === 'tracking', v('delegated', issue('Rework (Requirement Update)', OTHER)));
    check('(c3) delegated, Closed on Redmine → learn', v('delegated', issue('Closed', OTHER)) === 'learn', v('delegated', issue('Closed', OTHER)));
    check('(c4) delegated, Resolved (may bounce back) → tracking', v('delegated', issue('Resolved', OTHER)) === 'tracking', v('delegated', issue('Resolved', OTHER)));
    check('(c5) delegated, Rejected → diverged', v('delegated', issue('Rejected', OTHER)) === 'diverged', v('delegated', issue('Rejected', OTHER)));
    check('(c6) closed locally, colleague still open → closed-early', v('closed', issue('In Progress', OTHER)) === 'closed-early', v('closed', issue('In Progress', OTHER)));
    check('(c7) archived locally, colleague in Rework → closed-early', v('archived', issue('Rework', OTHER)) === 'closed-early', v('archived', issue('Rework', OTHER)));
    check('(c8) own fix, local active, BA Closed it → diverged (not learn)', v('active', issue('Closed', OTHER)) === 'diverged', v('active', issue('Closed', OTHER)));
    check('(c9) closed locally, Closed on Redmine → ok', v('closed', issue('Closed', OTHER)) === 'ok', v('closed', issue('Closed', OTHER)));
    check('(c10) delegated, own again and open (handed back) → ok', v('delegated', issue('Rework', MIYA_ROLE)) === 'ok', v('delegated', issue('Rework', MIYA_ROLE)));
    check('(d) own ticket Resolved on Redmine → diverged', v('active', issue('Resolved', MIYA_ROLE)) === 'diverged', v('active', issue('Resolved', MIYA_ROLE)));
    check('(e) unassigned on Redmine → ok', v('hold', issue('New', undefined)) === 'ok', v('hold', issue('New', undefined)));
    check('(f) closed locally, open + own on Redmine → redmine-open', v('closed', issue('Rework', MIYA_ROLE)) === 'redmine-open', v('closed', issue('Rework', MIYA_ROLE)));
    check('(g) no Redmine response → unknown', classify('hold', null) === 'unknown', classify('hold', null));
    check('(h) numOf: ADHOC numberless, QA numbered', !numOf('ADHOC-PT-2026-3') && numOf('QA-274266') === '274266', `${numOf('ADHOC-PT-2026-3')} · ${numOf('QA-274266')}`);

    // (i) capture checkAll's console output for numberless ADHOCs only
    const lines = [];
    const orig = console.log;
    console.log = (...a) => lines.push(a.join(' '));
    try { await checkAll([{ qa: 'ADHOC-PT-2026-3', status: 'hold' }, { qa: 'ADHOC-PRBB-2026-4', status: 'active' }]); }
    finally { console.log = orig; }
    check('(i) numberless ADHOCs → no output, no "unreachable"', lines.length === 0, lines.join(' | '));

    let failed = 0;
    for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.name + (x.pass ? '' : ' → ' + x.detail)); }
    console.log('\nredmine-status-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
    process.exit(failed ? 1 : 0);
})();
