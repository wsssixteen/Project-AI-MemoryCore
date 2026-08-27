/**
 * atlas-full-check.eval.js — fixture eval for atlas-full-check.check.hook.js
 * Runs the REAL hook with synthetic stdin + transcript + report fixtures and asserts
 * exit code AND rendered stderr (fire check + effect check, system-design Rule 6 v1.2).
 * Encodes the ≥20 adversarial scenarios from the birth review (README §Adversarial).
 * Usage: node domain/atlas-full-check/atlas-full-check.eval.js   (exit 0 = all pass)
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.join(__dirname, 'atlas-full-check.check.hook.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'afc_eval_'));

const root = path.join(tmp, 'proj');
const atlas = path.join(root, 'etanah_atlas');
fs.mkdirSync(path.join(atlas, 'build'), { recursive: true });
fs.mkdirSync(path.join(atlas, 'config'), { recursive: true });
fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
fs.copyFileSync(path.join(__dirname, '..', '..', 'lib', 'hook-runtime.js'), path.join(root, 'lib', 'hook-runtime.js'));

fs.writeFileSync(path.join(atlas, 'config', 'atlas_states.json'),
  JSON.stringify([{ profile: 'melaka' }, { profile: 'perak' }]));

function writeHtml(profiles) {
  for (const p of profiles) fs.writeFileSync(path.join(atlas, `etanah_atlas_${p}.html`), '<html>' + p + '</html>');
}
function writeReport(obj, opts = {}) {
  const p = path.join(atlas, 'build', 'full_check_report.json');
  fs.writeFileSync(p, JSON.stringify(obj));
  if (opts.mtime) fs.utimesSync(p, opts.mtime / 1000, opts.mtime / 1000);
  return p;
}
function goodReport() {
  return {
    _summary: { all_pass: true, full_run: true, checks_passed: 176, checks_total: 176,
                errors_total: 0, states: ['melaka', 'perak'] },
    states: { melaka: { passed: 88, total: 88, errors: [] }, perak: { passed: 88, total: 88, errors: [] } },
  };
}
function transcript(text) {
  const p = path.join(tmp, 'tr_' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(p, text);
  return p;
}
function run(tr, stdin) {
  const r = spawnSync('node', [HOOK], {
    input: stdin !== undefined ? stdin : JSON.stringify({ transcript_path: tr }),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  });
  return { code: r.status, err: r.stderr || '' };
}
function freshen(reportPath) { const t = Date.now() + 5000; fs.utimesSync(reportPath, t / 1000, t / 1000); }

const TOUCH_SRC = 'Edit file_path C:/x/etanah_atlas/src/app.js old_string foo new_string bar';
const TOUCH_HTML = 'Write file_path C:/x/etanah_atlas_perak.html regenerated';
let pass = 0, fail = 0, rp;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

writeHtml(['melaka', 'perak']);

// 1. atlas untouched -> exit 0 (no fire)
let r = run(transcript('normal quest work, nothing about the atlas'));
check('untouched session passes', r.code === 0, 'code=' + r.code);

// 2. touched src + no report -> BLOCK, message renders
r = run(transcript(TOUCH_SRC));
check('touched w/o report blocks', r.code === 2, 'code=' + r.code);
check('block message renders', r.err.includes('atlas-full-check') && r.err.includes('full_check.py'), r.err.slice(0, 90));

// 3. fresh all-pass full report covering both states -> exit 0
rp = writeReport(goodReport()); freshen(rp);
r = run(transcript(TOUCH_SRC));
check('fresh all-pass report passes', r.code === 0, 'code=' + r.code);

// 4. a check failed -> BLOCK naming the failure
{ const g = goodReport(); g._summary.all_pass = false; g._summary.checks_passed = 170; g._summary.errors_total = 2;
  rp = writeReport(g); freshen(rp); }
r = run(transcript(TOUCH_SRC));
check('failed checks block', r.code === 2 && r.err.includes('failed'), 'code=' + r.code);

// 5. JS errors present -> BLOCK
{ const g = goodReport(); g._summary.all_pass = false; g._summary.errors_total = 3;
  rp = writeReport(g); freshen(rp); }
r = run(transcript(TOUCH_SRC));
check('JS errors block', r.code === 2, 'code=' + r.code);

// 6. single-state run (full_run false) -> BLOCK
{ const g = goodReport(); g._summary.full_run = false; rp = writeReport(g); freshen(rp); }
r = run(transcript(TOUCH_SRC));
check('single-state run blocks', r.code === 2 && r.err.includes('SINGLE-STATE'), 'code=' + r.code);

// 7. a declared state NOT covered -> BLOCK naming it
{ const g = goodReport(); g._summary.states = ['melaka']; rp = writeReport(g); freshen(rp); }
r = run(transcript(TOUCH_SRC));
check('missing state blocks', r.code === 2 && r.err.includes('perak'), 'code=' + r.code);

// 8. STALE report (older than newest HTML) -> BLOCK
rp = writeReport(goodReport(), { mtime: Date.now() - 60000 });
writeHtml(['melaka', 'perak']); // rewrite HTML now => newer than report
r = run(transcript(TOUCH_SRC));
check('stale report blocks', r.code === 2 && r.err.includes('STALE'), 'code=' + r.code + ' err=' + r.err.slice(0, 60));

// 9a. touched via HTML regeneration (not src) still gates — green
rp = writeReport(goodReport()); freshen(rp);
r = run(transcript(TOUCH_HTML));
check('html-only touch passes when green', r.code === 0, 'code=' + r.code);
// 9b. touched via HTML regeneration — red
{ const g = goodReport(); g._summary.all_pass = false; rp = writeReport(g); freshen(rp); }
r = run(transcript(TOUCH_HTML));
check('html-only touch blocks when red', r.code === 2, 'code=' + r.code);

// 10. real bypass token -> exit 0 (even with a stale report)
rp = writeReport(goodReport(), { mtime: Date.now() - 60000 });
r = run(transcript(TOUCH_SRC + ' [skip-atlas-full-check: miya parking it for tonight]'));
check('real bypass passes', r.code === 0, 'code=' + r.code);

// 11. placeholder bypass form (self-disarm class) -> still BLOCKS
r = run(transcript(TOUCH_SRC + ' use [skip-atlas-full-check: <reason>] to bypass'));
check('placeholder bypass still blocks', r.code === 2, 'code=' + r.code);

// 12. gate's OWN rendered message quoted in transcript must NOT self-disarm
rp = writeReport(goodReport(), { mtime: Date.now() - 60000 });
r = run(transcript('earlier the hook printed: "atlas-full-check: the Atlas changed ... run python etanah_atlas/lib/full_check.py" ' + TOUCH_SRC));
check('own message quoted does not disarm', r.code === 2, 'code=' + r.code);

// 13. bad stdin -> fail-open
r = run(null, 'not json at all');
check('bad stdin fails open', r.code === 0, 'code=' + r.code);

// 14. missing transcript path -> fail-open
r = run(path.join(tmp, 'does-not-exist.jsonl'));
check('missing transcript fails open', r.code === 0, 'code=' + r.code);

// 15. no built HTML at all (fresh clone) -> fail-open
{ for (const f of fs.readdirSync(atlas)) if (/^etanah_atlas_.*\.html$/.test(f)) fs.rmSync(path.join(atlas, f)); }
r = run(transcript(TOUCH_SRC));
check('no html fails open', r.code === 0, 'code=' + r.code);
writeHtml(['melaka', 'perak']);

// 16. report present but no _summary (stale format) -> BLOCK
rp = writeReport({ states: {} }); freshen(rp);
r = run(transcript(TOUCH_SRC));
check('no-summary report blocks', r.code === 2 && r.err.includes('_summary'), 'code=' + r.code);

// 17. malformed report JSON -> treated as no report -> BLOCK
fs.writeFileSync(path.join(atlas, 'build', 'full_check_report.json'), '{ broken json');
r = run(transcript(TOUCH_SRC));
check('malformed report blocks', r.code === 2, 'code=' + r.code);

// 18. atlas_states.json missing -> wantStates empty -> a green report passes (no state to miss)
fs.rmSync(path.join(atlas, 'config', 'atlas_states.json'));
{ const g = goodReport(); rp = writeReport(g); freshen(rp); }
r = run(transcript(TOUCH_SRC));
check('missing states-config with green report passes', r.code === 0, 'code=' + r.code);
fs.writeFileSync(path.join(atlas, 'config', 'atlas_states.json'), JSON.stringify([{ profile: 'melaka' }, { profile: 'perak' }]));

// 19. huge transcript with the touch inside the last 400KB -> still fires
rp = writeReport(goodReport(), { mtime: Date.now() - 60000 });
r = run(transcript('x'.repeat(500 * 1024) + '\n' + TOUCH_SRC));
check('huge transcript still gates', r.code === 2, 'code=' + r.code);

// 20. touch pushed out of the 400KB tail window -> not seen -> fail-open (accepted risk)
rp = writeReport(goodReport(), { mtime: Date.now() - 60000 });
r = run(transcript(TOUCH_SRC + '\n' + 'y'.repeat(500 * 1024)));
check('touch pushed out of tail window does not gate', r.code === 0, 'code=' + r.code);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
