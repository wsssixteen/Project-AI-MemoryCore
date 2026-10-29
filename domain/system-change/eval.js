#!/usr/bin/env node
// domain/system-change/eval.js — the change route is owned by Rules, run by the skill, and every lane points to it.
// Static checks against the repo (run from any checkout; CLAUDE_PROJECT_DIR or this file's root).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR && fs.existsSync(path.join(process.env.CLAUDE_PROJECT_DIR, 'system'))
  ? process.env.CLAUDE_PROJECT_DIR : path.resolve(__dirname, '..', '..');
const read = p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch (_) { return ''; } };
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d: d || '' });

const POINTER = /§The change route/;
const index = read('system/INDEX.md');
const route = (index.split('\n## The change route —')[1] || '').split('\n## ')[0];
const skill = read('.claude/skills/system-change/SKILL.md');

// R1 the route lives in Rules (INDEX) with 8 steps; step 7 pushes and lands
const steps = (route.match(/^\| [1-8] [A-Z]/gm) || []).length;
check('R1 INDEX holds the route with 8 steps', steps === 8, 'steps=' + steps);
const s7 = (route.match(/^\| 7 Land.*$/m) || [''])[0];
check('R2 step 7 pushes HEAD:main and runs land-on-main', /push origin HEAD:main/.test(s7) && /land-on-main\.js/.test(s7), s7.slice(0, 80));
check('R3 step 7 has the refusal branch and both SHAs', /REFUSED/.test(s7) && /main-folder HEAD/.test(s7));
check('R4 seven lanes listed', (route.match(/^\| ("|an audit|a correction)/gm) || []).length === 7);
check('R5 one definition: all seven kinds', /any change to a part of the seven kinds/.test(route));
check('R6 rulings 13 and 14 recorded', /^\| 13 \|/m.test(index) && /^\| 14 \|.*Capabilities/m.test(index));

// S skill runs, never copies
check('S1 skill frontmatter name system-change', /^---\s*\nname: system-change/m.test(skill));
check('S2 skill points to the route', POINTER.test(skill));
check('S3 skill carries no copy of the steps', !/\| 7 Land/.test(skill) && !/land-on-main\.js/.test(skill));

// L every lane and caller points to the route
const LANES = [
  '.claude/CLAUDE.md',
  'domain/claude-md-watch/README.md',
  'domain/memory-write-gate/README.md',
  '.claude/skills/auto-skill-on-mistake/SKILL.md',
  '.claude/skills/system-audit/SKILL.md',
  '.claude/skills/system-check/SKILL.md',
  'core/forge.js',
  'Feature/Domain-Expansion/expansion-protocol.md',
  '.claude/skills/quest-bounty/SKILL.md',
];
for (const f of LANES) check('L ' + f + ' points to the route', POINTER.test(read(f)) || /system-change/.test(read(f)));

// G entry gate advises, never blocks, on a missing /system-change
const gate = read('domain/design-consult-gate/design-consult-gate.gate.hook.js');
const seg = (gate.split("Launching skill: system-change")[1] || '').slice(0, 900);
check('G1 entry gate checks for /system-change', /Launching skill: system-change/.test(gate));
check('G2 that check is advisory (additionalContext, no deny)', /additionalContext/.test(seg) && !/permissionDecision: 'deny'/.test(seg));

// D diagram beside the skill (Rule 17)
check('D1 skill diagram exists', fs.existsSync(path.join(ROOT, '.claude/skills/system-change/diagram.png')));

let failed = 0;
for (const r of results) { if (!r.pass) failed++; console.log((r.pass ? 'PASS  ' : 'FAIL  ') + r.n + (r.pass ? '' : '  ' + r.d)); }
console.log('\nsystem-change.eval: ' + (results.length - failed) + '/' + results.length + ' green');
try { fs.appendFileSync(path.join(__dirname, 'log.jsonl'), JSON.stringify({ ts: new Date().toISOString(), event: 'eval', pass: results.length - failed, total: results.length }) + '\n'); } catch (_) {}
process.exit(failed ? 1 : 0);
