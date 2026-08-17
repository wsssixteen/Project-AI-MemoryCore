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

// 1. The board renders miya's table.
check('renders the Mine table', () => /^### Mine — \d+ open/m.test(base));

// 2. Default is HIS LIST ONLY (miya 2026-08-05: "present to me ONLY my list").
check('default omits the Tracking table', () => !/### Tracking/.test(base));

// 3. ...but the tracking view still exists on request.
check('--tracking adds the Tracking table', () => /^### Tracking — \d+ open/m.test(tracking));

// 4. Header is exactly the agreed 5 columns.
check('Mine header is # | Days | Due date | Subject | State',
    () => base.includes('| # | Days | Due date | Subject | State |'));

// 5. Banned columns stay banned (2026-08-04 + 2026-08-05).
check('no Deadline column', () => !/\|\s*Deadline\s*\|/.test(base));
check('no "Redmine due" wording', () => !/Redmine due/.test(base));
check('no Start column', () => !/\|\s*Start\s*\|/.test(base));
check('no "+3d" or "Days left"', () => !/\+3d|Days left/.test(base));

// Scope Mine-table assertions to the Mine block. The board may prepend a
// QUICK-WIN / steal-risk banner (domain/steal-risk-flag) whose rows share the
// generic `| id | ... |` shape; parsing the whole output would mis-read those.
const mineTable = (base.split('### Mine')[1] || '').split(/^_|^###/m)[0];

// 6. Dates carry no year — "12 Aug", not "2026-08-12".
check('due dates are day + short month, no year', () => {
    const cells = [...mineTable.matchAll(/^\| \d+ \| [\d—]+ \| ([^|]+) \|/gm)].map(m => m[1].trim());
    return cells.length > 0 && cells.every(c => c === '—' || /^\d{1,2} [A-Z][a-z]{2}$/.test(c));
});

// 7. Every row carries a State from the fixed vocabulary — never blank, never prose.
check('every State cell is short and non-empty', () => {
    const states = [...mineTable.matchAll(/^\| \d+ \|.*\| ([^|]+) \|$/gm)].map(m => m[1].trim());
    return states.length > 0 && states.every(s => s.length > 0 && s.length <= 24);
});

// 8. Adopted tickets appear under Mine even though Redmine shows another name.
check('adopted tickets land in Mine', () => {
    const mineBlock = base.split('### Tracking')[0];
    return mineBlock.includes('| 273837 |') && mineBlock.includes('| 273956 |');
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
