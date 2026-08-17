/**
 * steal-risk.eval.js — behavioural eval for the QUICK-WIN / steal-risk detector.
 *
 * The lead fixture is THE miss: ticket 275587 as it sat on the board the day it
 * was stolen (mine, open, "Recon+Rubric done; qa_doc ready; fix in own session").
 * The detector MUST flag it. Everything else guards against false positives.
 *
 * Run: node domain/steal-risk-flag/steal-risk.eval.js
 * No network — pure fixtures, so it is green on any machine.
 */
'use strict';
const { isStealRisk, whyQuick, flagStealRisk, renderStealBanner } = require('./steal-risk');

const results = [];
const check = (name, fn) => {
    try { results.push({ name, pass: !!fn() }); }
    catch (e) { results.push({ name, pass: false, err: e.message.split('\n')[0] }); }
};

// ── THE MISS — 275587 as it was on the board the day it was stolen ──────────────
const T275587 = {
    id: 275587, tracker: 'eSOKONGAN', status: 'active', assignee: 'Ahmad Ridhwan Anuar',
    days: 1, due: '2026-08-27', subject: 'Pelupusan > MLPS > Tukar No PT. ke "-"  2) Rotate Pelan',
    state: 'Phase 0 - Recon+Rubric done via sweep W1+W2 (2026-08-17); qa_doc ready; fix in own session',
};

check('275587 (the miss) IS flagged steal-risk', () => isStealRisk(T275587) === true);
check('275587 reason is "diagnosed — only Apply left"', () => whyQuick(T275587) === 'diagnosed — only Apply left');

// ── Data Patching (PROD) tracker — quick by construction, even before diagnosis ─
const dataPatch = { id: 1, tracker: 'Data Patching (PROD)', status: 'active',
    assignee: 'Ahmad Ridhwan Anuar', days: 2, due: null, state: 'Not drafted', subject: 'x' };
check('Data Patching tracker IS flagged even when Not drafted', () => isStealRisk(dataPatch) === true);
check('Data Patching reason is "data-patch tracker"', () => whyQuick(dataPatch) === 'data-patch tracker');

// ── NEGATIVES — must NOT flag ───────────────────────────────────────────────────
const notDrafted = { id: 2, tracker: 'eSOKONGAN', status: 'active', days: 5, state: 'Not drafted', subject: 'x' };
check('undiagnosed "Not drafted" (non-patch) is NOT flagged', () => isStealRisk(notDrafted) === false);

const midApply = { id: 3, tracker: 'eSOKONGAN', status: 'active', days: 1,
    state: 'Apply - code applied UNCOMMITTED on mlk/master; needs commit', subject: 'x' };
check('a ticket already mid-Apply is NOT flagged (not idle)', () => isStealRisk(midApply) === false);

const committed = { id: 4, tracker: 'eSOKONGAN', status: 'active', days: 1,
    state: 'Recon+Rubric done; committed to mlk/esokongan/999', subject: 'x' };
check('diagnosed-but-committed is NOT flagged (already booked)', () => isStealRisk(committed) === false);

const investigating = { id: 5, tracker: 'eSOKONGAN', status: 'active', days: 3,
    state: 'Phase 0 - W4 audit ongoing; root not pinned', subject: 'x' };
check('still-investigating is NOT flagged', () => isStealRisk(investigating) === false);

// ── Banner rendering ────────────────────────────────────────────────────────────
check('banner is empty when nothing qualifies', () => renderStealBanner([notDrafted, investigating]) === '');

const banner = renderStealBanner([T275587, dataPatch, notDrafted, midApply]);
check('banner names 275587', () => banner.includes('| 275587 |'));
check('banner names the data-patch ticket', () => banner.includes('| 1 |'));
// Match row-START only (`| <id> |` at line start) — a naive substring would hit
// the Days cell of another row (id 1 with days 2 renders "| 1 | 2 |").
check('banner excludes the non-qualifying rows', () => !/^\| 2 \|/m.test(banner) && !/^\| 3 \|/m.test(banner));
check('banner leads with QUICK-WIN header', () => banner.startsWith('🥇 QUICK-WIN'));
check('banner cites the 275587 lesson', () => /lost 275587/.test(banner));

// ── Determinism — same input, same bytes ────────────────────────────────────────
check('two renders are byte-identical', () =>
    renderStealBanner([T275587, dataPatch]) === renderStealBanner([T275587, dataPatch]));
check('ranking is oldest-idle first', () => {
    const ranked = flagStealRisk([{ id: 9, days: 1, state: 'qa_doc ready', tracker: 'eSOKONGAN' },
                                   { id: 8, days: 6, state: 'qa_doc ready', tracker: 'eSOKONGAN' }]);
    return ranked[0].id === 8 && ranked[1].id === 9;
});

const failed = results.filter(r => !r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} — ${r.name}${r.err ? ` (${r.err})` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
