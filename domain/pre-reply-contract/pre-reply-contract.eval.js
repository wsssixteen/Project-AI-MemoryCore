#!/usr/bin/env node
// pre-reply-contract.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-07-28 + 2026-08-16 double-emit complaint (todo Q1 rows 42+44): Stop gates rejected finished replies, forcing full re-emits miya read twice
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'pre-reply-contract.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: normal work prompt → full contract injected (incl. the delta-only rule)
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt: 'can you check why the risalat shows one pemohon only' }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F2 normal prompt → full contract + DELTA ONLY rule', r.status === 0 && /v2-blend/.test(r.stdout) && /DELTA ONLY/.test(r.stdout) && /DO THIS/.test(r.stdout) && /NEVER drop/.test(r.stdout), 'exit=' + r.status + ' out=' + (r.stdout || '').slice(0, 120));

// F3: constrained-format ask → suppression variant, NOT the full contract
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt: 'give me the next steps, only a table please' }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F3 constrained ask → suppression variant', r.status === 0 && /CONSTRAINED-FORMAT/.test(r.stdout) && !/v2-blend/.test(r.stdout), 'out=' + (r.stdout || '').slice(0, 120));

// F4: みや's 2026-07-28 verbatim shape ("reply with ONLY a table") → suppression
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt: 'reply with ONLY a table of the next steps' }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F4 2026-07-28 replay ("reply with ONLY a table") → suppression', r.status === 0 && /CONSTRAINED-FORMAT/.test(r.stdout), 'out=' + (r.stdout || '').slice(0, 120));

// F5: tiny ack → silent (no contract bloat on "ok")
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt: 'ok' }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F5 tiny ack → silent', r.status === 0 && !/pre-reply-contract/.test(r.stdout || ''), 'out=' + JSON.stringify((r.stdout || '').slice(0, 80)));

// F6: broken stdin → fail-open exit 0, never a crash
r = spawnSync(process.execPath, [HOOK], { input: 'not json {{{', encoding: 'utf8', timeout: 30000, env: process.env });
check('F6 broken stdin → fail-open exit 0', r.status === 0, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\npre-reply-contract.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
