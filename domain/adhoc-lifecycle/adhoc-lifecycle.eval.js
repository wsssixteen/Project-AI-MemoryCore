#!/usr/bin/env node
/**
 * adhoc-lifecycle.eval.js — covers the CLI (fixture register under temp --root) AND the hook (smoke).
 * NEVER touches the real register. Run: node domain/adhoc-lifecycle/adhoc-lifecycle.eval.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const CLI = path.join(__dirname, 'adhoc-lifecycle.js');
const HOOK = path.join(__dirname, 'adhoc-lifecycle.check.hook.js');
let pass = 0, fail = 0;
function ok(name, cond) { console.log((cond ? 'PASS  ' : 'FAIL  ') + name); cond ? pass++ : fail++; }

// ---- temp main-repo layout ----
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'adhoc-life-'));
const regDir = path.join(TMP, 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka');
const actDir = path.join(TMP, 'projects', 'coding-projects', 'active');
const arcDir = path.join(TMP, 'projects', 'coding-projects', 'archive');
fs.mkdirSync(regDir, { recursive: true });
fs.mkdirSync(arcDir, { recursive: true });
fs.writeFileSync(path.join(regDir, 'ADHOC-REGISTER.md'), `# ADHOC-REGISTER — Melaka

| # | Date | Asked by | The ask | Conclusion | Evidence lives at | Status |
|---|---|---|---|---|---|---|
| A18 | 2026-08-19 | miya | PPJK warta NO. 85 / 29-03-2007 papar 1 rekod | ind_rizab 2 rows | ADHOC-ppjk/x.md | \`OPEN\` |
| A19 | 2026-08-01 | miya | PRBB aplikasi 3408179 NPE | root-caused | ADHOC-prbb/y.md | \`ANSWERED\` |
| A20 | 2026-08-02 | miya | some latent thing | latent | z.md | \`LATENT\` |
`);
fs.mkdirSync(path.join(actDir, 'ADHOC-ppjk-warta-single-record'), { recursive: true });
fs.writeFileSync(path.join(actDir, 'ADHOC-ppjk-warta-single-record', 'doc.md'), '# doc');

function run(args) {
  try { return { out: execFileSync('node', [CLI, ...args, '--root', TMP], { encoding: 'utf8' }), code: 0 }; }
  catch (e) { return { out: (e.stdout || '') + (e.stderr || ''), code: e.status || 1 }; }
}
function reg() { return fs.readFileSync(path.join(regDir, 'ADHOC-REGISTER.md'), 'utf8'); }

// ---- CLI (match / promote / unarchive / archive / refuse / sweep / log) ----
let r = run(['match', '--keys', 'PTMLK/01/L/PRBB/2026/30 sistem papar ralat']);
ok('F1 match with no shared key → no-match', /"matches": \[\s*\]/.test(r.out));

r = run(['match', '--keys', 'ticket says aplikasi 3408179 crash']);
ok('F2 match by aplikasi id 3408179 → hits A19', /"id": "A19"/.test(r.out) && /3408179/.test(r.out));

r = run(['match', '--keys', 'No Warta NO. 85 Tarikh 29/03/2007']);
ok('F3 match by warta NO. 85 → hits A18', /"id": "A18"/.test(r.out));

r = run(['promote', '--row', 'A18', '--ticket', 'QA-1234', '--slug', 'ADHOC-ppjk-warta-single-record']);
ok('F4 promote exit 0', r.code === 0);
ok('F4 register shows TICKETED → QA-1234 on A18', /A18 \|.*TICKETED → QA-1234/.test(reg()));
ok('F4 dir moved active→archive', fs.existsSync(path.join(arcDir, 'ADHOC-ppjk-warta-single-record')) && !fs.existsSync(path.join(actDir, 'ADHOC-ppjk-warta-single-record')));

r = run(['unarchive', '--row', 'A18', '--slug', 'ADHOC-ppjk-warta-single-record', '--status', 'OPEN']);
ok('F5 unarchive restores dir', fs.existsSync(path.join(actDir, 'ADHOC-ppjk-warta-single-record')));
ok('F5 unarchive resets status to OPEN', /A18 \|.*\|\s*OPEN\s*\|/.test(reg()));

r = run(['archive', '--row', 'A18', '--reason', 'MP handling']);
ok('F6 archive sets OWNED-ELSEWHERE + reason', /A18 \|.*OWNED-ELSEWHERE \(MP handling/.test(reg()));

r = run(['promote', '--row', 'A99', '--ticket', 'QA-9']);
ok('F7 unknown row refused non-zero', r.code !== 0 && /matched 0 lines/.test(r.out));

r = run(['sweep']);
ok('F8 sweep lists A19 (ANSWERED)', /"id": "A19"/.test(r.out));
ok('F8 sweep excludes A20 (LATENT)', !/"id": "A20"/.test(r.out));

ok('F9 log.jsonl written with dur_ms', fs.existsSync(path.join(__dirname, 'log.jsonl')) &&
  /"dur_ms":/.test(fs.readFileSync(path.join(__dirname, 'log.jsonl'), 'utf8')));

// ---- hook smoke: clean SessionStart input must not crash (exit 0) ----
const h = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
ok('F10 hook SessionStart clean input exits 0', h.status === 0);

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
console.log('\nadhoc-lifecycle.eval: ' + pass + '/' + (pass + fail) + ' green');
process.exit(fail ? 1 : 0);
