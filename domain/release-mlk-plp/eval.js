#!/usr/bin/env node
// eval.js — end-to-end eval for release-prep.js on a SCRATCH repo (never the real etanah repo).
// Fixture: bare origin named etanah-pelupusan.git (passes the PLP-identity guard) + 3 ticket
// branches — 1001 clean add · 1002 edits a.txt · 1003 edits a.txt differently = planted conflict.
// Asserts every guard: bad release name · missing branch · push-before-verify · stop-on-conflict
// · merge-continue resume · verify table · push lands on origin.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, 'release-prep.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rmp-eval-'));
const bare = path.join(tmp, 'origin', 'etanah-pelupusan.git');
const work = path.join(tmp, 'etanah-pelupusan');
const stateDir = path.join(tmp, 'state');
const env = { ...process.env, RELEASE_MLK_PLP_STATE_DIR: stateDir };

function sh(cwd, cmd, args) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed in ${cwd}:\n${r.stderr || r.stdout}`);
  return r.stdout.trim();
}
function git(args, cwd) { return sh(cwd || work, 'git', args); }
function prep(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args, '--repo', work], { encoding: 'utf8', env, timeout: 60000 });
}
function prepNoRepo(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', env, timeout: 60000 });
}

try {
  // ---- fixture ----
  fs.mkdirSync(path.dirname(bare), { recursive: true });
  sh(tmp, 'git', ['init', '--bare', bare]);
  sh(tmp, 'git', ['clone', bare, work]);
  git(['config', 'user.email', 'eval@local']); git(['config', 'user.name', 'eval']);
  git(['checkout', '-b', 'mlk/master']);
  fs.writeFileSync(path.join(work, 'a.txt'), 'line1\n');
  fs.writeFileSync(path.join(work, 'pom.xml'),
    '<project>\n\t<parent><artifactId>etanah-base-pom</artifactId><version>3.0.0</version></parent>\n'
    + '\t<artifactId>etanah-pelupusan</artifactId>\n\t<version>0.0.1</version>\n'
    + '\t<properties>\n\t\t<etanah.common.version>1.0.71-MLK</etanah.common.version>\n\t</properties>\n</project>\n');
  git(['add', '.']); git(['commit', '-m', 'base']); git(['push', 'origin', 'mlk/master']);
  git(['checkout', '-b', 'mlk/internal-issue/1001']);
  fs.writeFileSync(path.join(work, 'b.txt'), 'ticket-1001\n');
  git(['add', '.']); git(['commit', '-m', '#1001']); git(['push', 'origin', 'mlk/internal-issue/1001']);
  git(['checkout', 'mlk/master']); git(['checkout', '-b', 'mlk/qa/1002']);
  fs.writeFileSync(path.join(work, 'a.txt'), 'line1-qa\n');
  git(['add', '.']); git(['commit', '-m', '#1002']); git(['push', 'origin', 'mlk/qa/1002']);
  git(['checkout', 'mlk/master']); git(['checkout', '-b', 'mlk/esokongan/1003']);
  fs.writeFileSync(path.join(work, 'a.txt'), 'line1-eso\n');
  git(['add', '.']); git(['commit', '-m', '#1003']); git(['push', 'origin', 'mlk/esokongan/1003']);
  git(['checkout', 'mlk/master']);

  const TICKETS = '1001=mlk/internal-issue/1001,1002=mlk/qa/1002,1003=mlk/esokongan/1003';

  // T1: bad release name refused
  let r = prep(['init', '--release', 'fat', '--tickets', TICKETS]);
  check('T1 bad release name refused', r.status !== 0 && /--release must be like/.test(r.stderr), 'exit=' + r.status);

  // T2: missing ticket branch → all-or-nothing preflight fail (exit 2)
  r = prep(['init', '--release', '9.9.9', '--tickets', TICKETS + ',9999=mlk/qa/9999']);
  check('T2 missing branch fails preflight', r.status === 2 && /do NOT exist on origin/.test(r.stderr), 'exit=' + r.status);

  // T3: good init → planned + plan table
  r = prep(['init', '--release', '9.9.9', '--tickets', TICKETS]);
  check('T3 init passes preflight', r.status === 0 && /PREFLIGHT PASSED/.test(r.stdout), 'exit=' + r.status + ' ' + r.stderr.slice(0, 120));

  // T4: push at phase=planned → refused
  r = prepNoRepo(['push', '--release', '9.9.9']);
  check('T4 push before verify refused', r.status === 2 && /PUSH REFUSED/.test(r.stderr), 'exit=' + r.status);

  // T5: branch off fresh mlk/master
  r = prepNoRepo(['branch', '--release', '9.9.9']);
  check('T5 release branch created', r.status === 0 && git(['branch', '--show-current']) === 'mlk/release/9.9.9', 'exit=' + r.status + ' ' + r.stderr.slice(0, 120));

  // T6: merge stops dead on the planted conflict (#1003), after 1001+1002 merged
  r = prepNoRepo(['merge', '--release', '9.9.9']);
  check('T6 conflict stops merge (exit 2)', r.status === 2 && /CONFLICT on #1003/.test(r.stderr) && /a\.txt/.test(r.stderr), 'exit=' + r.status);

  // T7: resolve + merge-continue resumes and finishes
  fs.writeFileSync(path.join(work, 'a.txt'), 'line1-resolved\n');
  git(['add', 'a.txt']);
  r = prepNoRepo(['merge-continue', '--release', '9.9.9']);
  check('T7 merge-continue finishes (phase=merged)', r.status === 0 && /all ticket branches merged/.test(r.stdout), 'exit=' + r.status + ' ' + r.stderr.slice(0, 120));

  // T8: verify — all tickets contained, table emitted
  r = prepNoRepo(['verify', '--release', '9.9.9']);
  check('T8 verify green table', r.status === 0 && /\| #1003 \| mlk\/esokongan\/1003 \| 0 \| ✓ \|/.test(r.stdout), 'exit=' + r.status + ' ' + r.stdout.slice(-200));

  // ---- common bump (REPLAY of the #270952 / 1.0.9 mechanism) ----
  // Verified 2026-07-16: the common bump lives ONLY on the release branch, never on mlk/master.
  // A release branched fresh off master therefore starts WITHOUT the common fix.
  const pomOf = () => fs.readFileSync(path.join(work, 'pom.xml'), 'utf8');
  check('T8x0 fresh release branch inherits master OLD common (the gap this step fills)',
    /<etanah\.common\.version>1\.0\.71-MLK<\/etanah\.common\.version>/.test(pomOf()), 'pom lacks the old common marker');

  r = prepNoRepo(['bump-common', '--release', '9.9.9', '--common', '1.0.129']);
  check('T8x1 malformed --common refused', r.status === 2 && /must look like/.test(r.stderr), 'exit=' + r.status);

  r = prepNoRepo(['bump-common', '--release', '9.9.9', '--common', '1.0.129-MLK']);
  check('T8x2 common bumped + committed with aaron message shape',
    r.status === 0 && /<etanah\.common\.version>1\.0\.129-MLK<\/etanah\.common\.version>/.test(pomOf())
    && git(['log', '-1', '--format=%s']) === 'common version increase to: 1.0.129-MLK',
    'exit=' + r.status + ' head=' + git(['log', '-1', '--format=%s']));

  check('T8x3 common bump did NOT touch the pelupusan version', /<version>0\.0\.1<\/version>/.test(pomOf()), 'scope containment');

  r = prepNoRepo(['push', '--release', '9.9.9']);
  check('T8x4 push refused after common bump until re-verify', r.status === 2 && /PUSH REFUSED/.test(r.stderr), 'exit=' + r.status);
  prepNoRepo(['verify', '--release', '9.9.9']);

  r = prepNoRepo(['bump-common', '--release', '9.9.9', '--common', '1.0.129-MLK']);
  check('T8x5 bump-common idempotent', r.status === 0 && /already at/.test(r.stdout), 'exit=' + r.status);

  // T8b: push refused before bump when phase=verified? NO — verified is still an allowed push phase (bump-version is optional).
  //      This test proves the bump step CAN run + produces the "pelupusan version: <ver>" commit.
  r = prepNoRepo(['bump-version', '--release', '9.9.9']);
  const pomAfter = fs.readFileSync(path.join(work, 'pom.xml'), 'utf8');
  const bumpMsg = git(['log', '-1', '--format=%s']);
  check('T8b bump-version rewrites pom + commits', r.status === 0 && /<version>9\.9\.9<\/version>/.test(pomAfter) && bumpMsg === 'pelupusan version: 9.9.9', 'exit=' + r.status + ' msg=' + bumpMsg);

  // T8c: second bump = noop (idempotent)
  r = prepNoRepo(['bump-version', '--release', '9.9.9']);
  const bumpMsg2 = git(['log', '-1', '--format=%s']);
  check('T8c bump-version idempotent (no extra commit)', r.status === 0 && bumpMsg2 === 'pelupusan version: 9.9.9', 'exit=' + r.status);

  // ---- counter-rail (DON'Ts) ----
  // T8d: ONLY pom.xml may change — a dirty tree at bump time is refused, nothing committed
  git(['checkout', '-b', 'tmp/counter-rail']); git(['checkout', 'mlk/release/9.9.9']);
  fs.writeFileSync(path.join(work, 'pom.xml'),
    fs.readFileSync(path.join(work, 'pom.xml'), 'utf8').replace('<version>9.9.9</version>', '<version>9.9.8</version>'));
  git(['add', 'pom.xml']); git(['commit', '-m', 'test: rewind pom to 9.9.8']);
  fs.writeFileSync(path.join(work, 'stray.txt'), 'a fix I was never supposed to make\n');
  const stateFile = path.join(stateDir, 'release-9.9.9.json');
  let stJson = JSON.parse(fs.readFileSync(stateFile, 'utf8')); stJson.phase = 'verified';
  fs.writeFileSync(stateFile, JSON.stringify(stJson));
  r = prepNoRepo(['bump-version', '--release', '9.9.9']);
  const headStill = git(['log', '-1', '--format=%s']);
  check('T8d dirty tree (stray file) refuses bump', r.status === 2 && /working tree must be clean/.test(r.stderr) && headStill === 'test: rewind pom to 9.9.8', 'exit=' + r.status + ' head=' + headStill);
  fs.rmSync(path.join(work, 'stray.txt'));

  // T8e: an uncommitted parent-version tweak in pom.xml (DON'T #3) is refused — nothing committed
  fs.writeFileSync(path.join(work, 'pom.xml'),
    fs.readFileSync(path.join(work, 'pom.xml'), 'utf8').replace('<version>3.0.0</version>', '<version>3.0.1</version>'));
  r = prepNoRepo(['bump-version', '--release', '9.9.9']);
  check('T8e pre-dirtied pom (parent version) refuses bump, nothing committed',
    r.status === 2 && git(['log', '-1', '--format=%s']) === 'test: rewind pom to 9.9.8',
    'exit=' + r.status + ' stderr=' + r.stderr.slice(0, 100));
  git(['checkout', '--', 'pom.xml']); // operator reverts their stray edit

  // T8f: clean tree + only the version line → bump proceeds (the established DO still works)
  r = prepNoRepo(['bump-version', '--release', '9.9.9']);
  check('T8f clean single-line bump still passes', r.status === 0 && git(['log', '-1', '--format=%s']) === 'pelupusan version: 9.9.9', 'exit=' + r.status + ' ' + r.stderr.slice(0, 100));

  // T9: push lands the branch on origin
  r = prepNoRepo(['push', '--release', '9.9.9']);
  const onOrigin = git(['ls-remote', '--heads', 'origin', 'mlk/release/9.9.9']) !== '';
  check('T9 push lands on origin', r.status === 0 && onOrigin, 'exit=' + r.status + ' onOrigin=' + onOrigin);

  // T10: PLP-only guard — repo whose origin is NOT etanah-pelupusan is refused
  const alien = path.join(tmp, 'alien');
  sh(tmp, 'git', ['init', '--bare', path.join(tmp, 'origin', 'etanah-awam.git')]);
  sh(tmp, 'git', ['clone', path.join(tmp, 'origin', 'etanah-awam.git'), alien]);
  r = spawnSync(process.execPath, [SCRIPT, 'init', '--release', '1.1.1', '--tickets', '1=x', '--repo', alien], { encoding: 'utf8', env, timeout: 60000 });
  check('T10 non-PLP repo refused', r.status !== 0 && /PLP-ONLY GUARD/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 120));
} catch (e) {
  check('FIXTURE setup/run crashed', false, e.message.slice(0, 300));
}

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nrelease-mlk-plp eval (release-prep.js): ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
