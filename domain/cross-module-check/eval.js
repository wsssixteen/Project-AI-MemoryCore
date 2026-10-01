#!/usr/bin/env node
// cross-module-check eval — wiring + content contract for the skill (system-design Rule 6).
// Replay: ADHOC-PRBB-2026-6 (2026-09-30) closed OWNED-ELSEWHERE on et_ptg.log_service; #282442 showed our empty kodPejabat.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; } };

const SKILL = read(path.join(ROOT, '.claude', 'skills', 'cross-module-check', 'SKILL.md'));
const desc = (SKILL.match(/^description:\s*(.+)$/m) || [, ''])[1];
check('C1 skill exists with frontmatter name', /^name:\s*cross-module-check\s*$/m.test(SKILL));
check('C2 description leads with "Use when"', /^Use when/.test(desc), desc.slice(0, 60));
check('C3 description <= 1024 chars', desc.length > 0 && desc.length <= 1024, 'len=' + desc.length);
for (const k of ['not our issue', 'OWNED-ELSEWHERE', 'pass to common', 'GIS', 'SPOC', 'bukan isu kami'])
  check('C4 description carries trigger "' + k + '"', desc.includes(k));
check('C5 Iron Law present', /NO HAND-OFF, NO "NOT OURS", NO OWNED-ELSEWHERE/.test(SKILL));
for (const s of ['Boundary call-site', 'Input contract', 'Name walk-back', 'Sibling-caller diff', 'Deployed version', 'Env data/config', 'Verdict'])
  check('C6 step present: ' + s, SKILL.includes(s));
check('C7 four verdicts OURS/THEIRS/BOTH/CATER', ['**OURS**', '**THEIRS**', '**BOTH**', '**CATER**'].every(v => SKILL.includes(v)));
check('C8 points at OTHER-MODULES.md', SKILL.includes('OTHER-MODULES.md'));
check('C9 replay case recorded in History', /ADHOC-PRBB-2026-6/.test(SKILL) && /et_ptg/.test(SKILL));

// Wiring: every route into the skill names it.
check('W1 cross-module-intake scanner alert names the skill', read(path.join(ROOT, 'domain', 'cross-module-intake', 'scan.js')).includes('cross-module-check'));
check('W2 ownership-input-check block text names the skill', read(path.join(ROOT, 'domain', 'ownership-input-check', 'ownership-input-check.check.hook.js')).includes('cross-module-check'));
check('W3 quest Recon ownership row names the skill', read(path.join(ROOT, '.claude', 'skills', 'quest', 'SKILL.md')).includes('cross-module-check'));
check('W4 Debug Ritual 7 names the skill', read(path.join(ROOT, 'quest', 'quest-protocol.md')).includes('cross-module-check'));

// Scanner end-to-end: an intake text carrying a hand-off phrase prints the skill name.
const r = spawnSync(process.execPath, [path.join(ROOT, 'domain', 'cross-module-intake', 'scan.js'), '--text',
  'Hi team, Dev pelupusan maklum issue dari common side. Is this common issue?'], { encoding: 'utf8', timeout: 20000 });
check('W5 scanner on the #282442 note prints the skill route', /cross-module-check/.test(r.stdout || ''), 'exit=' + r.status + ' ' + (r.stdout || '').slice(0, 120));
const r2 = spawnSync(process.execPath, [path.join(ROOT, 'domain', 'cross-module-intake', 'scan.js'), '--text',
  'Papar ralat bila klik simpan di skrin Maklumat Tanah.'], { encoding: 'utf8', timeout: 20000 });
check('W6 scanner on a plain ticket does NOT print the route', !/cross-module-check/.test(r2.stdout || ''), (r2.stdout || '').slice(0, 120));

// Knowledge: the boundary map exists for the state the replay happened in (main-repo working tree only — confidential).
let kdir = '';
try { kdir = require(path.join(ROOT, 'lib', 'states.js')).knowledgeDir('melaka') || ''; } catch (_) {}
const om = kdir ? read(path.join(kdir, 'OTHER-MODULES.md')) : '';
if (kdir && fs.existsSync(kdir)) {
  check('K1 melaka OTHER-MODULES.md exists', om.length > 0, kdir);
  check('K2 boundary map carries a GIS section with the kodPejabat → schema table', /GIS/.test(om) && /ptg/.test(om) && /mtg/.test(om));
  check('K3 boundary map lists etanah-common, SPOC, teknikal', ['etanah-common', 'spoc', 'teknikal'].every(m => om.toLowerCase().includes(m)));
} else {
  check('K0 knowledge dir absent in this checkout (worktree) — skipped', true);
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ncross-module-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
