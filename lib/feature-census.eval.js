// Eval for lib/feature-census.js: the gaps run exits clean and counts the log names a Feature uses.
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const check = (name, ok) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); };

const out = execFileSync(process.execPath, [path.join(__dirname, 'feature-census.js'), '--gaps'], { cwd: ROOT, encoding: 'utf8' });
const lines = out.split(/\r?\n/);

check('summary line printed', /gap component\(s\) \/ \d+ total/.test(out));
check('env-switch (prep-log.jsonl) counts as observable', !lines.some(l => l.startsWith('domain/env-switch · ') && /no log/.test(l)));
check('falsifier-ran-check (log.jsonl) counts as observable', !lines.some(l => l.startsWith('domain/falsifier-ran-check · ') && /no log/.test(l)));

console.log(`\nfeature-census eval: ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
