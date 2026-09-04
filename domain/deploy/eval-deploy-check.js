// eval-deploy-check.js — fixture eval for deploy-check.js (Rule 6: run before ship).
// Synthetic bare-origin + clone per run; randomized tickets/content. node eval-deploy-check.js [--n 5]
'use strict';
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const N = (() => { const i = process.argv.indexOf('--n'); return i > -1 ? parseInt(process.argv[i + 1], 10) : 5; })();
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'depcheck-eval-'));
const CHECK = path.join(__dirname, 'deploy-check.js');

const sh = (cwd, cmd, a) => execFileSync(cmd, a, { cwd, encoding: 'utf8' }).trim();
const rnd = () => String(Math.floor(Math.random() * 9e5) + 1e5);
const w = (repo, rel, c) => { const p = path.join(repo, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); };

function fixture(name) {
  const dir = path.join(ROOT, name);
  fs.mkdirSync(dir, { recursive: true });
  sh(dir, 'git', ['init', '--bare', 'origin.git']);
  sh(dir, 'git', ['clone', path.join(dir, 'origin.git'), 'work']);
  const work = path.join(dir, 'work');
  sh(work, 'git', ['config', 'user.name', 'eval']); sh(work, 'git', ['config', 'user.email', 'e@l']);
  sh(work, 'git', ['checkout', '-b', 'mlk/master']);
  w(work, 'a.java', 'base\n');
  sh(work, 'git', ['add', '-A']); sh(work, 'git', ['commit', '-m', 'seed']);
  sh(work, 'git', ['push', 'origin', 'mlk/master']);
  sh(work, 'git', ['checkout', '-b', 'mlk/int-env']); sh(work, 'git', ['push', 'origin', 'mlk/int-env']);
  return work;
}
function branch(work, name, file, content, msg) {
  sh(work, 'git', ['checkout', '-B', name, 'origin/mlk/master']);
  w(work, file, content);
  sh(work, 'git', ['add', '-A']); sh(work, 'git', ['commit', '-m', msg]);
  sh(work, 'git', ['push', 'origin', name]);
}
function mergeToEnv(work, name) {
  sh(work, 'git', ['checkout', 'mlk/int-env']);
  sh(work, 'git', ['merge', '--no-ff', `origin/${name}`, '-m', `Merge ${name} into mlk/int-env`]);
  sh(work, 'git', ['push', 'origin', 'mlk/int-env']);
}
const run = (work, ticket, env) => spawnSync('node', [CHECK, ticket, env, '--repo', work], { encoding: 'utf8' });

let pass = 0, total = 0;
const results = [];
const CASES = [
  ['v2-class stranded rework -> exit 2', () => {
    const t = rnd(), work = fixture(`v2-${t}`);
    branch(work, `mlk/qa/${t}`, 'a.java', `v1 ${rnd()}\n`, `Ref #${t} v1`);
    branch(work, `mlk/qa/${t}v2`, 'b.java', `v2 ${rnd()}\n`, `Ref #${t} v2`);
    mergeToEnv(work, `mlk/qa/${t}`);
    const r = run(work, t, 'mlk/int-env');
    return r.status === 2 && /V2-CLASS/.test(r.stdout);
  }],
  ['clean merged branch -> exit 0', () => {
    const t = rnd(), work = fixture(`clean-${t}`);
    branch(work, `mlk/qa/${t}`, 'a.java', `fix ${rnd()}\n`, `Ref #${t}`);
    mergeToEnv(work, `mlk/qa/${t}`);
    const r = run(work, t, 'mlk/int-env');
    return r.status === 0 && /clean/.test(r.stdout);
  }],
  ['revert on env base -> exit 2', () => {
    const t = rnd(), work = fixture(`rev-${t}`);
    branch(work, `mlk/qa/${t}`, 'a.java', `fix ${rnd()}\n`, `Ref #${t} the fix`);
    mergeToEnv(work, `mlk/qa/${t}`);
    sh(work, 'git', ['checkout', 'mlk/int-env']);
    const m = sh(work, 'git', ['rev-parse', 'HEAD']);
    sh(work, 'git', ['revert', '-m', '1', '--no-edit', m]);
    sh(work, 'git', ['commit', '--amend', '-m', `Revert "Ref #${t} the fix"`]);
    sh(work, 'git', ['push', 'origin', 'mlk/int-env']);
    const r = run(work, t, 'mlk/int-env');
    return r.status === 2 && /REVERT/.test(r.stdout);
  }],
  ['no matching branch -> exit 2, no guess', () => {
    const t = rnd(), work = fixture(`none-${t}`);
    const r = run(work, t, 'mlk/int-env');
    return r.status === 2 && /no origin branch/.test(r.stderr);
  }],
  ['release base refused -> exit 2', () => {
    const t = rnd(), work = fixture(`base-${t}`);
    branch(work, `mlk/qa/${t}`, 'a.java', 'x\n', `Ref #${t}`);
    const r = run(work, t, 'mlk/release/1.3.6');
    return r.status === 2 && /release-mlk-plp/.test(r.stderr);
  }],
  ['both siblings unmerged -> exit 0 + canonical warning', () => {
    const t = rnd(), work = fixture(`unm-${t}`);
    branch(work, `mlk/qa/${t}`, 'a.java', `v1 ${rnd()}\n`, `Ref #${t} v1`);
    branch(work, `mlk/qa/${t}v2`, 'b.java', `v2 ${rnd()}\n`, `Ref #${t} v2`);
    const r = run(work, t, 'mlk/int-env');
    return r.status === 0 && /confirm which is canonical/.test(r.stdout);
  }],
];

for (const [name, fn] of CASES) {
  let p = 0;
  for (let i = 0; i < N; i++) {
    total++;
    let ok = false;
    try { ok = fn(); } catch { ok = false; }
    if (ok) { p++; pass++; }
  }
  results.push(`| ${name} | ${p}/${N} ${p === N ? '✅' : '❌'} |`);
}
console.log(`\n## deploy-check eval — ${pass}/${total} correct · N=${N}\n\n| Case | Result |\n|---|---|`);
results.forEach(r => console.log(r));
if (pass === total) fs.rmSync(ROOT, { recursive: true, force: true });
else console.log(`fixtures kept: ${ROOT}`);
process.exit(pass === total ? 0 : 1);
