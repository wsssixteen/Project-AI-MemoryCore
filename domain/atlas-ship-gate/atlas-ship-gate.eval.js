/**
 * eval.js — fixture eval for atlas-ship-gate.check.hook.js
 * Runs the real hook with synthetic stdin + transcript fixtures and asserts
 * exit code AND rendered stderr (fire check + effect check, system-design Rule 6 v1.2).
 * Usage: node domain/atlas-ship-gate/eval.js   (exit 0 = all pass)
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const HOOK = path.join(__dirname, 'atlas-ship-gate.check.hook.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'asg_eval_'));

// Sandbox project root with a fake atlas (+ the real hook-runtime the hook requires)
const root = path.join(tmp, 'proj');
fs.mkdirSync(path.join(root, 'etanah_atlas', 'build'), { recursive: true });
fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
fs.copyFileSync(path.join(__dirname, '..', '..', 'lib', 'hook-runtime.js'), path.join(root, 'lib', 'hook-runtime.js'));
const htmlPath = path.join(root, 'etanah_atlas', 'etanah_atlas_melaka.html');
fs.writeFileSync(htmlPath, '<!DOCTYPE html><html><body>atlas</body></html>');
const sha = crypto.createHash('sha256').update(fs.readFileSync(htmlPath)).digest('hex');

function transcript(text) {
  const p = path.join(tmp, 'tr_' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(p, text);
  return p;
}
function run(tr) {
  const r = spawnSync('node', [HOOK], {
    input: JSON.stringify({ transcript_path: tr }),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  });
  return { code: r.status, err: r.stderr || '' };
}

const TOUCH = 'Edit file_path C:/x/etanah_atlas/src/app.js old_string new_string';
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

// 1. atlas untouched -> exit 0
let r = run(transcript('normal quest work, nothing about the atlas app'));
check('untouched session passes', r.code === 0, 'code=' + r.code);

// 2. touched + no ship_check -> BLOCK with rendered message
r = run(transcript(TOUCH));
check('touched w/o ship_check blocks', r.code === 2, 'code=' + r.code);
check('block message renders', r.err.includes('atlas-ship-gate') && r.err.includes('ship_check'), r.err.slice(0, 80));

// 3. fresh passing ship_check -> exit 0
fs.writeFileSync(path.join(root, 'etanah_atlas', 'build', 'ship_check.json'),
  JSON.stringify({ html_sha256: sha, smoke: 'pass', render_png: 'x.png', render_size: 99999 }));
r = run(transcript(TOUCH));
check('fresh ship_check passes', r.code === 0, 'code=' + r.code);

// 4. stale sha -> BLOCK naming staleness
fs.writeFileSync(path.join(root, 'etanah_atlas', 'build', 'ship_check.json'),
  JSON.stringify({ html_sha256: 'deadbeef', smoke: 'pass', render_png: 'x.png', render_size: 99999 }));
r = run(transcript(TOUCH));
check('stale ship_check blocks', r.code === 2 && r.err.includes('STALE'), 'code=' + r.code);

// 5. smoke fail -> BLOCK
fs.writeFileSync(path.join(root, 'etanah_atlas', 'build', 'ship_check.json'),
  JSON.stringify({ html_sha256: sha, smoke: 'fail', render_png: 'x.png', render_size: 99999 }));
r = run(transcript(TOUCH));
check('smoke-fail blocks', r.code === 2, 'code=' + r.code);

// 6. real bypass token -> exit 0
r = run(transcript(TOUCH + ' [skip-atlas-ship-gate: miya said park it for tonight]'));
check('real bypass passes', r.code === 0, 'code=' + r.code);

// 7. placeholder bypass form (self-disarm class) -> still BLOCKS
r = run(transcript(TOUCH + ' the gate says use [skip-atlas-ship-gate: <reason>] to bypass'));
check('placeholder bypass still blocks', r.code === 2, 'code=' + r.code);

// 8. bad stdin -> fail-open
r = (() => { const x = spawnSync('node', [HOOK], { input: 'not json', encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root } }); return { code: x.status }; })();
check('bad stdin fails open', r.code === 0, 'code=' + r.code);

// 9. missing transcript -> fail-open
r = run(path.join(tmp, 'nope.jsonl'));
check('missing transcript fails open', r.code === 0, 'code=' + r.code);

// 10. html missing (fresh clone) -> fail-open
fs.rmSync(htmlPath);
r = run(transcript(TOUCH));
check('missing html fails open', r.code === 0, 'code=' + r.code);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
