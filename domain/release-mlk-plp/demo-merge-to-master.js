// demo-merge-to-master.js — NARRATED end-to-end demonstration of Phase F (merge to mlk/master).
// Builds a synthetic release in a throwaway repo, then attempts the master merge THE WRONG WAY
// four times (each refused by a guard) before the right way lands. Every line of output comes
// from the REAL release-prep.js — nothing is simulated. Run: node demo-merge-to-master.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, 'release-prep.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'f-demo-'));
const bare = path.join(tmp, 'origin', 'etanah-pelupusan.git');
const work = path.join(tmp, 'etanah-pelupusan');
const env = { ...process.env, RELEASE_MLK_PLP_STATE_DIR: path.join(tmp, 'state') };

const sh = (cwd, cmd, a) => { const r = spawnSync(cmd, a, { cwd, encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr || r.stdout); return r.stdout.trim(); };
const git = (a, cwd) => sh(cwd || work, 'git', a);
const prep = (a) => spawnSync(process.execPath, [SCRIPT, ...a], { encoding: 'utf8', env, timeout: 60000 });
const step = (n) => console.log(`\n${'─'.repeat(70)}\n${n}\n${'─'.repeat(70)}`);
const show = (r) => console.log((r.stdout + r.stderr).trim().split('\n').map(l => '   ' + l).join('\n') + `\n   [exit ${r.status}]`);

step('SETUP — synthetic etanah-pelupusan: master + ticket 4001 + release 5.5.5 assembled & pushed');
fs.mkdirSync(path.dirname(bare), { recursive: true });
sh(tmp, 'git', ['init', '--bare', bare]);
sh(tmp, 'git', ['clone', bare, work]);
git(['config', 'user.email', 'demo@local']); git(['config', 'user.name', 'demo']);
git(['checkout', '-b', 'mlk/master']);
fs.writeFileSync(path.join(work, 'a.txt'), 'base\n');
fs.writeFileSync(path.join(work, 'pom.xml'), '<project>\n\t<artifactId>etanah-pelupusan</artifactId>\n\t<version>5.5.4</version>\n\t<properties>\n\t\t<etanah.common.version>1.0.0-MLK</etanah.common.version>\n\t</properties>\n</project>\n');
git(['add', '.']); git(['commit', '-m', 'base']); git(['push', 'origin', 'mlk/master']);
git(['checkout', '-b', 'mlk/qa/4001']);
fs.writeFileSync(path.join(work, 'fix.java'), 'the fix\n');
git(['add', '.']); git(['commit', '-m', 'Ref #4001 - the fix']); git(['push', 'origin', 'mlk/qa/4001']);
git(['checkout', 'mlk/master']);
for (const a of [
  ['init', '--release', '5.5.5', '--tickets', '4001=mlk/qa/4001', '--repo', work],
  ['branch', '--release', '5.5.5'], ['merge', '--release', '5.5.5'],
  ['verify', '--release', '5.5.5'], ['bump-version', '--release', '5.5.5'], ['push', '--release', '5.5.5'],
]) { const r = prep(a); if (r.status !== 0) { console.log('setup failed:'); show(r); process.exit(1); } }
console.log('   release 5.5.5 assembled, verified, pushed. BAQA testing happens here. Then:');

step('ATTEMPT 1 — merge without BA approval (the V8 breach)');
show(prep(['merge-to-master', '--release', '5.5.5']));

step('ATTEMPT 2 — someone moved the release branch after the tested build');
git(['checkout', 'mlk/release/5.5.5']);
fs.writeFileSync(path.join(work, 'sneak.txt'), 'commit after BAQA tested\n');
git(['add', '.']); git(['commit', '-m', 'post-test drift']); git(['push', 'origin', 'mlk/release/5.5.5']);
show(prep(['merge-to-master', '--release', '5.5.5', '--ba-approved']));
git(['checkout', 'mlk/release/5.5.5']);
git(['reset', '--hard', 'HEAD~1']); git(['push', '--force', 'origin', 'mlk/release/5.5.5']); // restore the tested tip
console.log('   (demo restores the tested tip and continues)');

step('ATTEMPT 3 — a REVERT of the ticket snuck into the release lineage (gate re-run catches content)');
// fabricate: revert the ticket ON the release branch, push — content now wrong even though SHAs move "legally"
git(['checkout', 'mlk/release/5.5.5']);
const fixSha = git(['log', '--format=%H', '--grep', 'Ref #4001', '-n', '1']);
git(['revert', '--no-edit', fixSha]);
git(['commit', '--amend', '-m', 'Revert "Ref #4001 - the fix"']);
git(['push', 'origin', 'mlk/release/5.5.5']);
// accept the new tip in state (simulating a hand-edited/re-verified state) so ONLY the gate stands between us and master
const stFile = path.join(tmp, 'state', 'release-5.5.5.json');
const st = JSON.parse(fs.readFileSync(stFile, 'utf8'));
st.headSha = git(['rev-parse', 'origin/mlk/release/5.5.5']);
fs.writeFileSync(stFile, JSON.stringify(st));
show(prep(['merge-to-master', '--release', '5.5.5', '--ba-approved']));
git(['reset', '--hard', 'HEAD~1']); git(['push', '--force', 'origin', 'mlk/release/5.5.5']);
st.headSha = git(['rev-parse', 'origin/mlk/release/5.5.5']);
fs.writeFileSync(stFile, JSON.stringify(st));
console.log('   (demo restores the tested tip and continues)');

step('ATTEMPT 4 — master moved meanwhile (another team landed a commit): ff-only refuses, nothing clobbered');
git(['checkout', 'mlk/master']);
fs.writeFileSync(path.join(work, 'other.txt'), 'someone else\n');
git(['add', '.']); git(['commit', '-m', 'other team commit']); git(['push', 'origin', 'mlk/master']);
show(prep(['merge-to-master', '--release', '5.5.5', '--ba-approved']));
git(['checkout', 'mlk/master']);
git(['reset', '--hard', 'HEAD~1']); git(['push', '--force', 'origin', 'mlk/master']);
console.log('   (demo restores master and continues — in real life this refusal means: STOP, re-plan)');

step('THE RIGHT WAY — BA approved, tested tip intact, master clean');
show(prep(['merge-to-master', '--release', '5.5.5', '--ba-approved']));

step('PROOF — read origin yourself');
const m = git(['ls-remote', 'origin', 'refs/heads/mlk/master']).split(/\s+/)[0];
const rel = git(['ls-remote', 'origin', 'refs/heads/mlk/release/5.5.5']).split(/\s+/)[0];
console.log(`   origin/mlk/master        = ${m}`);
console.log(`   origin/mlk/release/5.5.5 = ${rel}`);
console.log(`   identical (fast-forward, zero new commits invented): ${m === rel}`);
console.log(`   undo tag: ${git(['tag', '-l', 'mlk/pre-master-merge/5.5.5'])} @ ${git(['rev-parse', 'mlk/pre-master-merge/5.5.5']).slice(0, 10)}`);
console.log(`\n   fixture kept for your own inspection: ${work}`);
