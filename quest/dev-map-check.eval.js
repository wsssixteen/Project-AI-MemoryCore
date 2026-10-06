#!/usr/bin/env node
// dev-map-check.eval.js — fixtures for quest/dev-map-check.js (run: node quest/dev-map-check.eval.js)
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkDoc } = require('./dev-map-check.js');

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`PASS  ${name}`); } else { fail++; console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
}
const failed = (r) => r.results.filter(x => !x.ok).map(x => x.id).join(',');

const GOOD = [
  '# QA-1 — sample',
  '## Context Loading (Discovery)',
  '**Requirement list**',
  '| # | Requirement | Source |',
  '|---|---|---|',
  '| R1 | new tugasan | note 1 |',
  '| R2 | no letter | note 2 |',
  '| R10 | portal field removed | description |',
  '## Debugging (Recon)',
  '| # | Fact | Evidence | Status |',
  '|---|---|---|---|',
  '| F1 | steps are rows | `ind_langkah` | MODEL |',
  '| F2 | role from flow | `P src/main/java/x/FlowableConfig.java:952` | VERIFIED |',
  '## Approaches',
  '| # | Approach | Reuses | Size | Risk |',
  '|---|---|---|---|---|',
  '| A1 | Build where the mock-up draws it | nothing | large | high |',
  '| A2 | Reuse the existing payment page, add the missing panel | helper, save | small | low |',
  'Chosen: A2',
  '## Code-Review (Rubric) — Development build map',
  '### Work package 1 — Reference data',
  '| # | Table | Rows | Req | Status |',
  '|---|---|---|---|---|',
  '| 1.1 | `ind_tgsn` | one row | R1 | ⬜ |',
  '### Work package 2 — Portal',
  '| # | Change | Where | Req | Status |',
  '|---|---|---|---|---|',
  '| 2.1 | delete panels | `A src/main/webapp/resources/components/x.xhtml:103` | R10 | ⬜ |',
  'R2: not needed because nothing is built for it.',
  '## Decisions',
  '| # | Decision | Why |',
  '|---|---|---|',
  '| D1 | order of tasks | drawing differs |',
  '## Check queries',
  'SELECT * FROM ind_tgsn;',
  '## Skeptic audit',
  'Auditor: independent agent, did not write the map',
  'Findings merged: 3 added to work package 1',
  '## Coverage',
  '| Work package | Touch-points | Verified | Model |',
  '|---|---|---|---|',
  '| 1 | 1 | 0 | 1 |',
  ''
].join('\n');

const drop = (re) => GOOD.split('\n').filter(l => !re.test(l)).join('\n');

check('S1 complete doc passes every check', checkDoc(GOOD).ok, failed(checkDoc(GOOD)));
check('S2 no requirement list fails D1', failed(checkDoc(drop(/^\| R\d+ \|/))).includes('D1'));
check('S3 requirement in no touch-point and no not-needed line fails D3',
  failed(checkDoc(drop(/^R2: not needed/))).split(',').includes('D3'), failed(checkDoc(drop(/^R2: not needed/))));
check('S4 "not needed because" line covers a requirement', !failed(checkDoc(GOOD)).includes('D3'));
check('S5 fact row with no VERIFIED/MODEL fails D2', failed(checkDoc(GOOD.replace('| MODEL |', '| seen |'))).split(',').includes('D2'));
check('S6 no skeptic audit section fails D6', failed(checkDoc(drop(/Skeptic audit|^Auditor:|^Findings merged:/))).includes('D6'));
check('S7 empty skeptic audit section fails D6', failed(checkDoc(drop(/^Auditor:|^Findings merged:/))).includes('D6'));
check('S8 coverage with prose only fails D7', failed(checkDoc(GOOD.replace('| 1 | 1 | 0 | 1 |', 'about a third'))).includes('D7'));
check('S9 MODEL rows with no check queries fails D2b', failed(checkDoc(drop(/^## Check queries/))).includes('D2b'));
check('S10a no decisions table and no statement fails D5', failed(checkDoc(drop(/^\| D1 \|/))).includes('D5'));
check('S10b "No open decisions" line passes D5', !failed(checkDoc(GOOD.replace('| D1 | order of tasks | drawing differs |', 'No open decisions.'))).includes('D5'));
check('S11 touch-point with no path, table or n/a fails D4b',
  failed(checkDoc(GOOD.replace('| 1.1 | `ind_tgsn` | one row | R1 | ⬜ |', '| 1.1 | the table | one row | R1 | todo |'))).includes('D4b'));
check('S12 R1 is not satisfied by R10 (word boundary)',
  failed(checkDoc(GOOD.replace('| one row | R1 |', '| one row | R10 |'))).split(',').includes('D3'));
check('S13 CRLF line endings still pass', checkDoc(GOOD.replace(/\n/g, '\r\n')).ok, failed(checkDoc(GOOD.replace(/\n/g, '\r\n'))));
check('S14 the phrase quoted in prose (no heading) fails D4',
  failed(checkDoc(GOOD.replace('## Code-Review (Rubric) — Development build map', '> see the Development build map later'))).split(',').includes('D4'));
check('S15 a build map with no "Work package" heading fails D4',
  failed(checkDoc(GOOD.replace(/### Work package/g, '### Part'))).split(',').includes('D4'));

check('S21 no Approaches section fails D3b', failed(checkDoc(drop(/^## Approaches|^\| A\d \||^Chosen:/))).split(',').includes('D3b'));
check('S22 one approach only fails D3b', failed(checkDoc(drop(/^\| A1 \|/))).split(',').includes('D3b'));
check('S23 no Chosen line fails D3b', failed(checkDoc(drop(/^Chosen:/))).split(',').includes('D3b'));
check('S24 no approach that reuses something existing fails D3b', failed(checkDoc(GOOD.replace('Reuse the existing payment page, add the missing panel', 'Build a second new page').replace('| helper, save |', '| nothing |'))).split(',').includes('D3b'));

// CLI
const cli = path.join(__dirname, 'dev-map-check.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'devmap-'));
const goodPath = path.join(tmp, 'QA-1.md'); fs.writeFileSync(goodPath, GOOD);
const badPath = path.join(tmp, 'QA-2.md'); fs.writeFileSync(badPath, drop(/Skeptic audit|^Auditor:|^Findings merged:/));
const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
let r = run(['--doc', goodPath]);
check('S16 CLI exits 0 on a complete doc', r.status === 0 && /OK —/.test(r.stdout), 'exit=' + r.status);
r = run(['--doc', badPath]);
check('S17 CLI exits 1 and names the missing block', r.status === 1 && /FAIL\s+D6/.test(r.stdout), 'exit=' + r.status);
r = run(['--doc', path.join(tmp, 'nope.md')]);
check('S18 CLI exits 2 when the doc does not exist', r.status === 2, 'exit=' + r.status);
r = run([]);
check('S19 CLI exits 2 with no arguments', r.status === 2, 'exit=' + r.status);
r = run(['999999999']);
check('S20 CLI exits 2 for a ticket with no quest doc', r.status === 2, 'exit=' + r.status);
const logPath = path.join(tmp, 'run.log.jsonl');
const runLogged = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, DEV_MAP_LOG: logPath } });
runLogged(['--doc', goodPath]);
check('S25 a --doc run with no ticket number writes no log row', !fs.existsSync(logPath));
runLogged(['990001', '--doc', badPath]);
const rows = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
check('S26 a ticket run writes one row naming the failed block', rows.length === 1 && rows[0].qa === 'QA-990001' && rows[0].ok === false && rows[0].failed.includes('D6'), JSON.stringify(rows));
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\ndev-map-check.eval: ${pass}/${pass + fail} ${fail ? 'RED' : 'green'}`);
process.exit(fail ? 1 : 0);
