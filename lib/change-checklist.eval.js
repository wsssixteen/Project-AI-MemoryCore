#!/usr/bin/env node
// lib/change-checklist.eval.js — fixtures for the pre-touch checklist (2026-09-22, system-check run 3).
// Born from a silent false negative: the old bash-grep referencer step printed "(none in live surfaces)"
// for every target on a laptop where node cannot find bash. These fixtures pin the pure-node walk.
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os');
const { spawnSync } = require('child_process');
const REPO = path.resolve(__dirname, '..');
const CC = require(path.join(REPO, 'lib', 'change-checklist.js'));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (d ? ' — ' + d : '')); } };

// F1 sandbox: a needle present in two files under different roots, absent in a third
const sb = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-eval-'));
fs.mkdirSync(path.join(sb, 'a', 'deep'), { recursive: true }); fs.mkdirSync(path.join(sb, 'b')); fs.mkdirSync(path.join(sb, 'node_modules'));
fs.writeFileSync(path.join(sb, 'a', 'deep', 'one.md'), 'cites feedback_zeta_rule here');
fs.writeFileSync(path.join(sb, 'b', 'two.js'), '// feedback_zeta_rule');
fs.writeFileSync(path.join(sb, 'b', 'three.js'), '// nothing');
fs.writeFileSync(path.join(sb, 'node_modules', 'four.js'), 'feedback_zeta_rule'); // must be skipped
fs.writeFileSync(path.join(sb, 'b', 'five.png'), 'feedback_zeta_rule');           // non-text ext, skipped
const hits = CC.grepFiles([path.join(sb, 'a'), path.join(sb, 'b'), path.join(sb, 'node_modules')], 'feedback_zeta_rule');
check('F1 pure-node walk finds both text hits, recursive', hits.length === 2 && hits.some(h => /one\.md$/.test(h)) && hits.some(h => /two\.js$/.test(h)), JSON.stringify(hits));
check('F2 node_modules + non-text extensions skipped', !hits.some(h => /four|five/.test(h)));
check('F3 absent needle → empty array, no throw', CC.grepFiles([path.join(sb, 'b')], 'no-such-needle-xyz').length === 0);

// F4 real repo, the founding case: feedback_pengguna_semasa is cited by the quest skill
const real = CC.grepFiles(['.claude/skills'], 'feedback_pengguna_semasa');
check('F4 real repo: feedback_pengguna_semasa found in .claude/skills (was "(none)" under bash)', real.some(h => /quest[\\/]SKILL\.md$/.test(h)), JSON.stringify(real));

// F5 CLI end-to-end (spawns node, no shell) prints a referencer, not "(none in live surfaces)"
const cli = spawnSync(process.execPath, [path.join(REPO, 'lib', 'change-checklist.js'), '.claude/auto-memory/feedback_pengguna_semasa.md'], { encoding: 'utf8', windowsHide: true, cwd: REPO });
check('F5 CLI exit 0', cli.status === 0, 'status=' + cli.status + ' ' + (cli.stderr || '').slice(0, 200));
check('F6 CLI lists a live referencer for the memory file', /\[1\] LIVE REFERENCERS[\s\S]*?- \.claude[\\/]skills/.test(cli.stdout) && !/\(none in live surfaces\)/.test(cli.stdout), cli.stdout.slice(0, 400));
check('F7 CLI still prints rollback line', /\[4\] ROLLBACK LINE/.test(cli.stdout));

// F8 nonexistent target: warns, does not crash
const cli2 = spawnSync(process.execPath, [path.join(REPO, 'lib', 'change-checklist.js'), 'domain/no-such-feature/x.js'], { encoding: 'utf8', windowsHide: true, cwd: REPO });
check('F8 missing target → warning + exit 0', cli2.status === 0 && /does not exist on disk/.test(cli2.stdout));

console.log(`\n${pass}/${pass + fail} passed`);
try { fs.rmSync(sb, { recursive: true, force: true }); } catch (_) {}
process.exit(fail ? 1 : 0);
