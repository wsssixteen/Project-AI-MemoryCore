#!/usr/bin/env node
// ticket-close-block — deterministic git commit-reference block for a ticket close.
// Usage: node ticket-close-block.js --repo <path> --ticket <num> --module <pelupusan|awam>
//        [--branch <name>] [--intenv-sha <sha>] [--cherrypick]
// AWAM      -> branch only (another team does the PROD merge and refers to the branch).
// pelupusan -> branch + merged to mlk/int-env (we deploy PROD; BA tests on int-env).

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG = path.resolve(__dirname, 'log.jsonl');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i >= 0 && (i + 1 >= process.argv.length || process.argv[i + 1].startsWith('--'))) return true; // flag
  return i >= 0 ? process.argv[i + 1] : def;
}
function git(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
}
function logRow(row) {
  try { fs.appendFileSync(LOG, JSON.stringify(row) + '\n'); } catch (_) {}
}

const repo = arg('repo');
const ticket = arg('ticket');
const module_ = String(arg('module') || '').toLowerCase();
if (!repo || !ticket || !module_) {
  console.error('usage: --repo <path> --ticket <num> --module <pelupusan|awam> [--branch <name>] [--intenv-sha <sha>] [--cherrypick]');
  process.exit(1);
}
const isAwam = module_.includes('awam');
const moduleName = isAwam ? 'etanah-awam' : 'etanah-pelupusan';

let branch = arg('branch');
if (!branch) {
  let branches = [];
  try {
    branches = git(repo, ['branch', '-a', '--list', `*${ticket}*`, '--format=%(refname:short)'])
      .split('\n').map(s => s.trim().replace(/^origin\//, '')).filter(Boolean);
  } catch (_) {}
  branches = branches.filter(b => !/(int-env|stag-env|mlit|master|release)/.test(b));
  branch = branches.find(b => new RegExp(`/${ticket}(v\\d+)?$`).test(b))
        || branches.find(b => b.includes(ticket)) || null;
}

let commit = null;
try {
  const args = branch
    ? ['log', '-1', '--format=%H%n%an%n%ad%n%s', '--date=format:%d/%m/%Y %H:%M:%S', branch]
    : ['log', '-1', '--all', `--grep=#${ticket}`, '--format=%H%n%an%n%ad%n%s', '--date=format:%d/%m/%Y %H:%M:%S'];
  const out = git(repo, args);
  if (out) {
    const parts = out.split('\n');
    commit = { hash: parts[0], author: parts[1], date: parts[2], subject: parts.slice(3).join('\n') };
  }
} catch (_) {}

let intenv = arg('intenv-sha');
const cherrypick = arg('cherrypick') === true;
if (!isAwam && !intenv) {
  try { intenv = git(repo, ['log', '-1', '--format=%h', 'mlk/int-env', `--grep=#${ticket}`]) || null; } catch (_) { intenv = null; }
}

const lines = ['<pre>'];
if (commit) {
  lines.push(`Commit  : ${commit.hash}`);
  lines.push(`Author  : ${commit.author}`);
  lines.push(`Date    : ${commit.date}`);
  lines.push(`Subject : ${commit.subject}`);
}
let branchLine = `Branch  : ${branch || '(not found)'}`;
if (!isAwam && intenv) branchLine += cherrypick ? `  (cherry-picked to mlk/int-env: ${intenv})` : `  (merged to mlk/int-env: ${intenv})`;
lines.push(branchLine);
lines.push(`Module  : ${moduleName}`);
lines.push('</pre>');

console.log(`*${branch || moduleName}*`);
console.log(lines.join('\n'));

logRow({ ts: new Date().toISOString(), ticket, module: moduleName, branch: branch || null, commit: commit ? commit.hash : null, intenv: intenv || null, outcome: commit ? 'ok' : 'no-commit' });
