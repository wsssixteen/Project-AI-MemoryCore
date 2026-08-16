#!/usr/bin/env node
// eval-self-audit.js — battery-enumerated wrapper for audit.js (the CODE-CHECK checker).
// Green case: live hook passes 5/5. Mutation cases: a broken hook copy MUST turn the audit red —
// proves the checker checks, not just prints (Rule 6 fire+effect).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const AUDIT = path.join(__dirname, 'audit.js');
const HOOK = path.join(__dirname, 'pre-code-check.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
function run(env) { return spawnSync(process.execPath, [AUDIT], { encoding: 'utf8', timeout: 30000, env: { ...process.env, ...env } }); }

// A1: live hook → audit green
let r = run({});
check('A1 live hook passes 5/5', r.status === 0 && /coherent \(5\/5/.test(r.stdout), 'exit=' + r.status);

const src = fs.readFileSync(HOOK, 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-check-audit-eval-'));

// A2: mutation — strip sibling from EVIDENCE_CHECKS → inv-2 theatre must go red
const m2 = path.join(dir, 'mut-theatre.js');
fs.writeFileSync(m2, src.replace("'analog', 'sibling', 'sibling-diff',", "'analog',"));
r = run({ CODE_CHECK_HOOK: m2 });
check('A2 sibling de-evidenced → inv-2 RED', r.status === 1 && /inv-2/.test(r.stdout) && /🔴/.test(r.stdout), 'exit=' + r.status);

// A3: mutation — add an unprovenance row to REQUIRED_CHECKS → inv-1 purpose must go red
const m3 = path.join(dir, 'mut-orphan.js');
fs.writeFileSync(m3, src.replace(/'fallback-precedence',(\r?\n\];)/, "'fallback-precedence', 'mystery-row',$1"));
r = run({ CODE_CHECK_HOOK: m3 });
check('A3 orphan row added → inv-1 RED', r.status === 1 && /inv-1/.test(r.stdout) && /mystery-row/.test(r.stdout), 'exit=' + r.status);

// A4: mutation — drop a type policy → inv-3 type-fit must go red
const m4 = path.join(dir, 'mut-type.js');
fs.writeFileSync(m4, src.replace(/\s*'constant-populator': \[[^\]]*\],/, ''));
r = run({ CODE_CHECK_HOOK: m4 });
check('A4 type policy removed → inv-3 RED', r.status === 1 && /inv-3/.test(r.stdout), 'exit=' + r.status);

// A5: mutation — delete the sql carve-out note → inv-4 trigger must go red
const m5 = path.join(dir, 'mut-sql.js');
fs.writeFileSync(m5, src.replace(/\.sql is DELIBERATELY absent/, 'sql handled elsewhere'));
r = run({ CODE_CHECK_HOOK: m5 });
check('A5 sql carve-out note deleted → inv-4 RED', r.status === 1 && /inv-4/.test(r.stdout), 'exit=' + r.status);

try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\neval-self-audit: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
