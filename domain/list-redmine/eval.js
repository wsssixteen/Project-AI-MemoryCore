/**
 * eval.js — behavioural eval for the list-redmine skill / quest/redmine-board.js
 *
 * The skill's whole contract is "paste the script's output verbatim", so every
 * assertion here is about the SCRIPT's rendered output. If these pass, pasting
 * it is correct by construction.
 *
 * Run: node domain/list-redmine/eval.js
 * Requires network reach to the Redmine host; a NET failure reports SKIP, not FAIL,
 * so an offline machine cannot turn a green suite red on a false signal.
 */
const { execFileSync } = require('child_process');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const BOARD = path.join(REPO, 'quest', 'redmine-board.js');

function run(args = []) {
    return execFileSync(process.execPath, [BOARD, ...args], { encoding: 'utf-8', timeout: 60000 });
}

const results = [];
function check(name, fn) {
    try { results.push({ name, pass: !!fn() }); }
    catch (e) { results.push({ name, pass: false, err: e.message.split('\n')[0] }); }
}

if (!require('fs').existsSync(BOARD)) {
    console.log(`FAIL — board script missing at ${BOARD}`);
    process.exit(1);
}

let base, tracking;
try {
    base = run();
    tracking = run(['--tracking']);
} catch (e) {
    // Only a NETWORK failure is a legitimate skip. Anything else (missing module,
    // syntax error) is a real defect and must stay red — a skip that swallows a
    // crash is the "absence of an error read as success" failure (2026-08-04).
    const msg = e.message.split('\n')[0];
    const netish = /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH/.test(e.message);
    console.log(`${netish ? 'SKIP — Redmine unreachable' : 'FAIL — board script errored'} (${msg})`);
    process.exit(netish ? 0 : 1);
}
if (/Redmine unreachable/.test(base)) {
    console.log('SKIP — Redmine unreachable');
    process.exit(0);
}

// 1. The board renders the three priority-ordered category tables (miya 2026-09-22).
check('renders the Patching (PROD) table', () => /^### 1\. Patching \(PROD\) — \d+ open/m.test(base));
check('renders the eSOKONGAN table', () => /^### 2\. eSOKONGAN tracker — \d+ open/m.test(base));
check('renders the Internal fixes & other table', () => /^### 3\. Internal fixes & other — \d+ open/m.test(base));

// 2. Default is HIS LIST ONLY (miya 2026-08-05: "present to me ONLY my list").
check('default omits the Tracking table', () => !/### Tracking/.test(base));

// 3. ...but the tracking view still exists on request.
check('--tracking adds the Tracking table', () => /^### Tracking — \d+ open/m.test(tracking));

// 4. Headers are the agreed columns per table.
check('patch/other header is # | Days | Due date | Subject | State',
    () => base.includes('| # | Days | Due date | Subject | State |'));
check('eSOKONGAN header carries the Severity column',
    () => base.includes('| # | Severity | Days | Due date | Subject | State |'));

// 5. Banned columns stay banned (2026-08-04 + 2026-08-05).
check('no Deadline column', () => !/\|\s*Deadline\s*\|/.test(base));
check('no "Redmine due" wording', () => !/Redmine due/.test(base));
check('no Start column', () => !/\|\s*Start\s*\|/.test(base));
check('no "+3d" or "Days left"', () => !/\+3d|Days left/.test(base));

// Scope Mine-table assertions to the three category tables. The board may prepend
// a QUICK-WIN / steal-risk banner (domain/steal-risk-flag) whose rows share the
// generic `| id | ... |` shape; starting the region at "### 1. Patching" excludes it.
const mineRegion = (base.split('### 1. Patching')[1] || '').split('### Tracking')[0];

// 6. Dates carry no year — a due cell is "12 Aug", never "2026-08-12".
//    Tables mix 5-col (patch/other) and 6-col (eSOKONGAN), so assert on the cell
//    shape directly: no ISO-date cell anywhere in the mine region.
check('due dates are year-free (no ISO-date cell)',
    () => mineRegion.length > 0 && !/\|\s*\d{4}-\d{2}-\d{2}\s*\|/.test(mineRegion));

// 7. Every row carries a State (the LAST cell) — never blank, never prose. Works
//    for both the 5-col and 6-col table shapes (State is always last).
check('every State cell is short and non-empty', () => {
    const states = [...mineRegion.matchAll(/^\| \d+ \|.*\| ([^|]+) \|$/gm)].map(m => m[1].trim());
    return states.length > 0 && states.every(s => s.length > 0 && s.length <= 24);
});

// 8. Adopted tickets appear in a mine table even though Redmine shows another name.
//    ADOPTED_AS_MINE ids may have since closed (a closed ticket is not fetched at all),
//    so assert only on those still OPEN in the board — vacuously true if none are open,
//    and never a false red for a ticket that simply got closed.
check('adopted tickets, when open, land in a mine table (not Tracking)', () => {
    const mineBlock = base.split('### Tracking')[0];
    const trackingBlock = base.split('### Tracking')[1] || '';
    const adopted = [273837, 273956];
    const openAdopted = adopted.filter(id => base.includes(`| ${id} |`));
    return openAdopted.every(id => mineBlock.includes(`| ${id} |`) && !trackingBlock.includes(`| ${id} |`));
});

// 9. No silent caps — a filtered-out row is always named by number.
check('excluded rows are named, not swallowed', () => {
    if (!/_Excluded/.test(base)) return true;      // nothing excluded today = vacuously fine
    return /_Excluded[^_]*#\d+/.test(base);
});

// 10. THE contract: same input, same bytes (miya 2026-08-05 "CONSISTENTLY load the same way").
check('two consecutive runs are byte-identical', () => run() === base);

const failed = results.filter(r => !r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} — ${r.name}${r.err ? ` (${r.err})` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
