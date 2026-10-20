#!/usr/bin/env node
// eval.js - story-video: the lint on the example and on bad inputs, plus the skill <-> renderer sync checks.
// usage: node domain/story-video/eval.js        prints PASS/FAIL per check, exit 1 on any FAIL
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { lint } = require('./lint.js');

const ROOT = path.resolve(__dirname, '..', '..');
const EX = path.join(__dirname, 'examples', 'plps-2026-2.json');
const K = JSON.parse(fs.readFileSync(path.join(__dirname, 'kinds.json'), 'utf8'));
const example = () => JSON.parse(fs.readFileSync(EX, 'utf8'));
let pass = 0, fail = 0;
const ok = (name, cond, detail) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : '\n      ' + detail}`); };

// 1. the example is clean, through the CLI exactly as render.py calls it
const cli = spawnSync(process.execPath, [path.join(__dirname, 'lint.js'), EX], { encoding: 'utf8' });
ok('E1 example passes lint (CLI exit 0)', cli.status === 0, cli.stdout);
ok('E2 example uses all 6 scene kinds', Object.keys(K.kinds).every(k => example().scenes.some(s => s.kind === k)));
ok('E3 example: 7 scenes or fewer, first is the title, has a saw / fix / after scene',
  (e => e.scenes.length <= 7 && e.scenes[0].kind === 'title' && ['saw', 'fix', 'after'].every(r => e.scenes.some(s => s.role === r)))(example()));

// 2. bad inputs: each mutation of the example must fail with the named finding
const cases = [
  ['B1 8 scenes', e => { e.scenes.push(JSON.parse(JSON.stringify(e.scenes[2]))); }, 'max 7'],
  ['B2 task code PSJT in a card', e => { e.scenes[2].card.lines[0] = 'PSJT task'; }, 'task code'],
  ['B3 "proposed" in the fix', e => { e.scenes[5].caption = 'This is the proposed fix.'; }, 'proposed'],
  ['B4 caption 56 chars', e => { e.scenes[1].caption = 'x'.repeat(56); }, 'caption is 56 chars'],
  ['B5 caption scene of 8 s', e => { e.scenes[2].seconds = 8; }, 'at least 9'],
  ['B6 steps scene of 9 s (caption visible < 7 s)', e => { e.scenes[4].seconds = 9; }, 'fully visible only'],
  ['B7 checklist with 5 lines', e => { e.scenes[5].items.push('One', 'Two'); }, 'checklist needs 2 to 4'],
  ['B8 banned word "engine"', e => { e.scenes[1].detail = 'The engine stopped'; }, 'banned word "engine"'],
  ['B9 banned word "process" in a headline', e => { e.scenes[2].headline = '1 Jul: process ran'; }, 'banned word "process"'],
  ['B10 technical name not declared (orderId)', e => { e.scenes[2].card.title = 'orderId'; }, 'technical name'],
  ['B11 four allowed_terms', e => { e.allowed_terms.push('a', 'b'); }, 'max 3'],
  ['B12 allowed term not in a fix scene', e => { e.allowed_terms.push('Notis'); e.scenes[5].items = ['Remove penghantaranId', 'Set urusan back to PLPS']; }, 'no fix scene'],
  ['B13 detail 61 chars', e => { e.scenes[1].detail = 'y'.repeat(61); }, 'detail is 61 chars'],
  ['B14 event headline without a date', e => { e.scenes[2].headline = 'Notis sent'; }, 'starts with its date'],
  ['B15 unknown kind', e => { e.scenes[2].kind = 'video'; }, 'unknown kind'],
  ['B16 first scene is not a title', e => { e.scenes.shift(); }, 'first scene must be a title'],
  ['B17 title scene with a caption', e => { e.scenes[0].caption = 'Hello'; }, 'no caption slot'],
  ['B18 missing caption', e => { delete e.scenes[3].caption; }, 'caption is missing'],
  ['B19 empty scenes', e => { e.scenes = []; }, 'no scenes'],
  ['B20 upper-case "ETANAH" and "Engine"', e => { e.scenes[1].detail = 'ETANAH Engine'; }, 'banned word'],
  ['B21 "should" in an after-fix scene', e => { e.scenes[6].caption = 'The file should move on.'; }, 'THE fix'],
  ['B22 known name used in no scene', e => { e.known_names.push('Unused Screen'); }, 'used in no scene'],
  ['B23 four steps', e => { e.scenes[4].steps.push('Fourth'); }, 'steps needs 2 or 3'],
  ['B24 screen with three values', e => { e.scenes[1].screen.values.push({ label: 'A', value: 'B' }); }, 'screen needs 1 or 2'],
  ['B25 last scene 9 s (fade-out eats the caption)', e => { e.scenes[6].seconds = 9; }, 'fully visible only'],
  ['B26 task code in the headline of the fix', e => { e.scenes[5].headline = 'The PSJT fix'; }, 'task code'],
  ['B27 a scene that is not an object', e => { e.scenes[3] = 'oops'; }, 'not an object'],
  ['B28 role typo', e => { e.scenes[5].role = 'fixed'; }, 'unknown role'],
];
for (const [name, mut, want] of cases) {
  const e = example();
  try { mut(e); } catch (x) { ok(name, false, 'mutation threw ' + x.message); continue; }
  const r = lint(e);
  ok(`${name} -> fails with "${want}"`, r.length > 0 && r.some(f => f.includes(want)), 'findings: ' + JSON.stringify(r));
}
// declared terms are accepted on purpose (the root-cause thing being changed), and only when a fix scene holds them
{
  const doc = { allowed_terms: ['flow'], known_names: [], scenes: [
    { kind: 'title', headline: 'Case 2026', seconds: 6 },
    { kind: 'checklist', role: 'fix', headline: 'The fix', seconds: 11, items: ['Remove flow', 'Set it back'], caption: 'The change removes the cause.' }] };
  ok('A1 a declared allowed term ("flow") in a fix scene is accepted', lint(doc).length === 0, JSON.stringify(lint(doc)));
  doc.scenes[1].role = 'after';
  ok('A2 the same term with no fix scene is refused', lint(doc).some(x => x.includes('no scene has role "fix"')), JSON.stringify(lint(doc)));
}{
  const bad = path.join(os.tmpdir(), 'sv-notjson.json');
  fs.writeFileSync(bad, '{ not json');
  const r = spawnSync(process.execPath, [path.join(__dirname, 'lint.js'), bad], { encoding: 'utf8' });
  ok('B29 broken JSON -> exit 1 with a reason', r.status === 1 && /cannot read JSON/.test(r.stdout), r.stdout);
  const m = spawnSync(process.execPath, [path.join(__dirname, 'lint.js'), path.join(os.tmpdir(), 'sv-does-not-exist.json')], { encoding: 'utf8' });
  ok('B30 missing file -> exit 1, no crash trace', m.status === 1 && !/at Object|at Module/.test(m.stderr), m.stdout + m.stderr);
}

// 3. SKILL.md <-> render.py <-> kinds.json: the same scene kinds, the same numbers
const kindsLine = (file, label) => {
  const m = fs.readFileSync(file, 'utf8').match(/^\s*(?:[-*]\s*)?Scene kinds:\s*(.+)$/mi);
  return m ? (m[1].match(/`([a-z]+)`/g) || []).map(x => x.replace(/`/g, '')).sort() : null;
};
const kindsJson = Object.keys(K.kinds).sort();
const skillFile = path.join(ROOT, '.claude', 'skills', 'story-video', 'SKILL.md');
const skillKinds = kindsLine(skillFile);
ok('S1 SKILL.md names every scene kind of kinds.json (and no other)', JSON.stringify(skillKinds) === JSON.stringify(kindsJson), `skill ${JSON.stringify(skillKinds)} vs ${JSON.stringify(kindsJson)}`);
const readmeKinds = kindsLine(path.join(__dirname, 'README.md'));
ok('S2 README.md names every scene kind of kinds.json (and no other)', JSON.stringify(readmeKinds) === JSON.stringify(kindsJson), `readme ${JSON.stringify(readmeKinds)}`);
const render = fs.readFileSync(path.join(__dirname, 'render.py'), 'utf8');
const dm = render.match(/DRAW\s*=\s*\{([^}]+)\}/);
const drawKinds = dm ? (dm[1].match(/'([a-z]+)'\s*:/g) || []).map(x => x.replace(/[':\s]/g, '')).sort() : null;
ok('S3 render.py DRAW table has exactly the kinds of kinds.json', JSON.stringify(drawKinds) === JSON.stringify(kindsJson), JSON.stringify(drawKinds));
ok('S4 render.py defines a scene_<kind> function for every kind', kindsJson.every(k => new RegExp('^def scene_' + k + '\\(', 'm').test(render)));
ok('S5 render.py reads kinds.json (one source of the numbers)', /kinds\.json/.test(render) && /anim_end/.test(render) && /caption_full/.test(render));
const skill = fs.readFileSync(skillFile, 'utf8');
ok('S6 SKILL.md states the limits that kinds.json holds', [`${K.limits.max_scenes} scenes`, `${K.limits.caption_max_chars}`, `${K.limits.caption_visible_min_seconds} s`, `${K.limits.max_labelled_per_scene}`].every(x => skill.includes(x)));
ok('S7 SKILL.md carries the default story shape roles (saw / event / fix / after)', ['what the user saw', 'after the fix', 'fix'].every(x => skill.toLowerCase().includes(x)));
for (const f of ['README.md', 'NUKE-MARKER.md', 'render.py', 'music.py', 'draw.py', 'lint.js', 'kinds.json', 'examples/plps-2026-2.json'])
  ok(`S8 file present: ${f}`, fs.existsSync(path.join(__dirname, f)));
const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
ok('S9 README has the machine keys goal: / retention: / footprint: / goal_signal: / symptom:', ['goal', 'goal_signal', 'retention', 'footprint', 'symptom'].every(k => new RegExp('^' + k + ':\\s*\\S', 'm').test(readme)));

// 4. renderer smoke (needs python + Pillow + numpy): dry run of the example, and render refuses a bad file
const py = spawnSync('python', ['-c', 'import PIL, numpy'], { encoding: 'utf8' });
if (py.status !== 0) ok('R0 python with Pillow + numpy is available (renderer smoke skipped)', false, py.stderr);
else {
  const d = spawnSync('python', [path.join(__dirname, 'render.py'), EX, '--dry'], { encoding: 'utf8', timeout: 120000 });
  ok('R1 render.py --dry draws every scene of the example, no text-shrink warning', d.status === 0 && !/WARN/.test(d.stdout), d.stdout + d.stderr);
  const e = example(); e.scenes[5].caption = 'The proposed fix.';
  const bp = path.join(os.tmpdir(), 'sv-bad-render.json'); fs.writeFileSync(bp, JSON.stringify(e));
  const b = spawnSync('python', [path.join(__dirname, 'render.py'), bp, '--dry'], { encoding: 'utf8', timeout: 60000 });
  ok('R2 render.py refuses a file the lint rejects (exit non-zero, "lint failed")', b.status !== 0 && /lint failed/.test(b.stdout + b.stderr), b.stdout + b.stderr);
  const wav = path.join(os.tmpdir(), 'sv-music-test.wav');
  const m = spawnSync('python', [path.join(__dirname, 'music.py'), '--seconds', '6', wav], { encoding: 'utf8', timeout: 120000 });
  ok('R3 music.py writes a wav for 6 s', m.status === 0 && fs.existsSync(wav) && fs.statSync(wav).size > 6 * 44100 * 4 - 1000, m.stdout + m.stderr);
}

console.log(`\nstory-video eval: ${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
