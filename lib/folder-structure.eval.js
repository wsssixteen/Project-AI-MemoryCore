#!/usr/bin/env node
// lib/folder-structure.eval.js — fixtures for the root-layout checker (2026-09-04).
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os');
const REPO = path.resolve(__dirname, '..');
const F = require(path.join(REPO, 'lib', 'folder-structure.js'));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (d ? ' — ' + d : '')); } };

const sb = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-eval-'));
fs.mkdirSync(path.join(sb, 'system'));
fs.writeFileSync(path.join(sb, 'system', 'FOLDER-STRUCTURE.md'), '# x\n\n```json\n{ "allow": ["system", "main", "README.md"], "pending_nod": ["growth"] }\n```\n');
for (const d of ['main', 'growth', 'stray-folder']) fs.mkdirSync(path.join(sb, d));
fs.writeFileSync(path.join(sb, 'README.md'), 'x'); fs.writeFileSync(path.join(sb, 'stray.txt'), 'x');
const r = F.check({ root: sb });
check('F1 orphans = entries in neither list', r.orphans.sort().join() === 'stray-folder,stray.txt', JSON.stringify(r));
check('F2 pending-nod entries reported separately, not as orphans', r.pending.join() === 'growth');
check('F3 allow-listed-but-missing reported', r.missing.length === 0);
fs.writeFileSync(path.join(sb, 'system', 'FOLDER-STRUCTURE.md'), '# no fence\n');
let threw = false; try { F.check({ root: sb }); } catch (e) { threw = /fence/.test(e.message); }
check('F4 missing fence throws loudly (never silently passes)', threw);
// F5 real repo: rule loads and every allow entry is a string
const rule = F.loadRule(REPO);
check('F5 real FOLDER-STRUCTURE.md fence parses (' + rule.allow.length + ' allow, ' + rule.pending_nod.length + ' pending)', rule.allow.every(e => typeof e === 'string'));
const real = F.check({ root: REPO });
check('F6 real repo: 0 orphans (everything is allow-listed or pending nod)', real.orphans.length === 0, 'orphans=' + real.orphans.join(','));
console.log(`\n${pass}/${pass + fail} passed`);
try { fs.rmSync(sb, { recursive: true, force: true }); } catch (_) {}
process.exit(fail ? 1 : 0);
