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

// ── system map (system/INDEX.md) vs the disk — added 2026-10-05 ──
const sm = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-map-eval-'));
const mk = (...p) => fs.mkdirSync(path.join(sm, ...p), { recursive: true });
const wr = (rel, s) => { fs.mkdirSync(path.dirname(path.join(sm, rel)), { recursive: true }); fs.writeFileSync(path.join(sm, rel), s); };
const mapDoc = j => wr('system/INDEX.md', '# map\n\n```json\n' + JSON.stringify(j) + '\n```\n');
wr('system/FOLDER-STRUCTURE.md', '# x\n\n```json\n{ "allow": ["system","main","domain","quest",".claude","README.md"], "pending_nod": ["growth"] }\n```\n');
mk('main'); mk('domain'); mk('quest'); mk('growth'); mk('.claude', 'skills'); mk('.claude', 'hooks'); mk('stray-folder');
wr('quest/active.txt', 'x'); wr('README.md', 'x'); wr('.claude/CLAUDE.md', 'x'); wr('.claude/CLAUDE-otherpc.md', 'x');
mapDoc({ kinds: { rules: ['system', '.claude/CLAUDE.md', 'README.md'], features: ['domain', '.claude/skills'], workflows: ['quest'], memory: ['main', 'quest/active.txt'] }, ignored: [] });
let mr = F.mapCheck({ root: sm });
check('F7 unmapped = a root entry no kind claims + an unlisted child of a partly-mapped folder', mr.unmapped.sort().join() === '.claude/hooks,stray-folder', JSON.stringify(mr.unmapped));
check('F8 pending-nod root entry is not reported as unmapped', !mr.unmapped.includes('growth'));
check('F9 nested path under another kind is not a duplicate (quest → workflows, quest/active.txt → memory)', mr.duplicates.length === 0, JSON.stringify(mr.duplicates));
check('F10 OneDrive conflict copy of a mapped file is not reported', !mr.unmapped.includes('.claude/CLAUDE-otherpc.md'));
mapDoc({ kinds: { rules: ['system', '.claude/CLAUDE.md', 'README.md', 'gone.md'], features: ['domain', '.claude/skills', '.claude/hooks'], workflows: ['quest', 'domain'], memory: ['main'] }, ignored: ['stray-folder'] });
mr = F.mapCheck({ root: sm });
check('F11 a named path that does not exist is MISSING', mr.missing.join() === 'gone.md', JSON.stringify(mr.missing));
check('F12 the same path under two kinds is a DUPLICATE', mr.duplicates.length === 1 && /domain/.test(mr.duplicates[0]), JSON.stringify(mr.duplicates));
check('F13 ignored entries are not unmapped, and ok=false while any problem stands', mr.unmapped.length === 0 && mr.ok === false, JSON.stringify(mr));
wr('system/INDEX.md', '# map with a non-map fence\n\n```json\n{ "allow": [] }\n```\n');
let mthrew = false; try { F.mapCheck({ root: sm }); } catch (e) { mthrew = /kinds/.test(e.message); }
check('F14 no fence with "kinds" throws loudly (never silently passes)', mthrew);
// F15 real repo: THIS checkout's map, checked against the canonical main checkout (projects/ and
// quest/active.txt are gitignored, so a worktree does not carry them).
const MAIN = REPO.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/i, '');
let realMap = null, realErr = '';
try { realMap = F.mapCheck({ root: MAIN, mapRoot: REPO }); } catch (e) { realErr = e.message; }
check('F15 real repo: the map names only paths that exist, no path twice, every entry claimed', realMap && realMap.ok, realErr || JSON.stringify({ missing: realMap.missing, duplicates: realMap.duplicates, unmapped: realMap.unmapped }));
console.log(`\n${pass}/${pass + fail} passed`);
try { fs.rmSync(sb, { recursive: true, force: true }); fs.rmSync(sm, { recursive: true, force: true }); } catch (_) {}
process.exit(fail ? 1 : 0);
