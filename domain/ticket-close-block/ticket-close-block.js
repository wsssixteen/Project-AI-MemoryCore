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
if (branch) branch = branch.replace(/^origin\//, '');

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

// --ba <name> [--envs "internal & staging"] wraps the git block in miya's BA pass note (#282061, 2026-09-29).
// BA name -> the short name miya greets with (ba-names.json). Unknown name -> printed as given + a stderr warning.
let ba = arg('ba');
const envs = arg('envs');
const prodScript = arg('prod-script');
if (ba && ba !== true) {
  let names = {};
  try { names = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'ba-names.json'), 'utf8')); } catch (_) {}
  const key = Object.keys(names).find(k => k.toLowerCase() === String(ba).toLowerCase());
  if (key) ba = names[key];
  else console.error(`warn: no short name for "${ba}" in ba-names.json — check how miya greets this BA`);
}

// Colleague's fix (#282587, 2026-10-02): commit author is not us -> no issues list, no commit details.
// Branch line only when the Redmine history does not already name the branch. AWAM keeps the branch line
// (another team merges PROD from it).
const OURS = new RegExp(arg('ours-author', 'ridhwan'), 'i');
const foreign = commit && !OURS.test(commit.author);
let historyHasBranch = false;
if (foreign && branch) {
  let hist = arg('history');
  if (!hist || hist === true) {
    try {
      const block = execFileSync('node', [path.resolve(__dirname, '../../quest/active-cli.js'), 'read', `QA-${ticket}`], { encoding: 'utf8' });
      const tf = (block.match(/^task_folder=(.+)$/m) || [])[1];
      if (tf) hist = ['1. Brief', '0. Brief'].map(d => path.join(tf.trim(), d, 'History.txt')).find(p => fs.existsSync(p));
    } catch (_) {}
  }
  try { historyHasBranch = !!hist && fs.readFileSync(hist, 'utf8').includes(branch.replace(/^origin\//, '')); } catch (_) {}
}

// BA pass note for OUR fix (2026-10-04, #244600): refuse while a written falsifier is unrun or the local
// test is unconfirmed. No flag skips it — run the row, or miya accepts the risk / writes [risk-ok:].
if (ba && ba !== true && commit && !foreign) {
  let gate = null;
  try { gate = require(path.resolve(__dirname, '../falsifier-ran-check/check.js')); } catch (_) {}
  const r = gate ? gate.check(`QA-${ticket}`, { ctx: 'note', codeFix: true }) : { ok: true };
  if (!r.ok) {
    console.error(gate.message(`QA-${ticket}`, r, `BA pass note refused for QA-${ticket}`));
    logRow({ ts: new Date().toISOString(), ticket, module: moduleName, branch: branch || null, commit: commit.hash, outcome: 'refused-ledger', kinds: r.fails.map(f => f.kind) });
    process.exit(3);
  }
}

const env = envs && envs !== true ? envs : 'internal';
if (foreign && ba && ba !== true) {
  console.log(`Salam ${ba}, have deployed fixes to ${env}. Please help to verify.`);
  if (prodScript && prodScript !== true) { console.log(''); console.log(`Attached is the script for PROD (${prodScript}).`); }
  if (isAwam || !historyHasBranch) { console.log(''); console.log(`Branch: ${branch || '(not found)'}`); }
  console.log('');
  console.log('Thank you very much.');
} else {
  if (ba && ba !== true) {
    console.log(`Salam ${ba}, have deployed fixes to ${env}. Please help to verify.`);
    console.log('');
    console.log('Issues found and resolved:');
    console.log('1. ');
    console.log('');
  }
  console.log(`*${branch || moduleName}*`);
  console.log(lines.join('\n'));
  if (ba && ba !== true) {
    if (prodScript && prodScript !== true) { console.log(''); console.log(`Attached is the script for PROD (${prodScript}).`); }
    console.log('');
    console.log('Thank you very much.');
  }
}

// Attach line for miya (NOT part of the note): FULL path of every file he uploads (#282587, 2026-10-02).
if (prodScript && prodScript !== true) {
  let full = path.isAbsolute(prodScript) ? prodScript : null;
  if (!full) {
    try {
      const block = execFileSync('node', [path.resolve(__dirname, '../../quest/active-cli.js'), 'read', `QA-${ticket}`], { encoding: 'utf8' });
      const tf = (block.match(/^task_folder=(.+)$/m) || [])[1];
      if (tf) {
        const dirs = fs.readdirSync(tf.trim()).filter(d => /^\d+\. (Rework|Fix)$/.test(d)).sort((a, b) => parseInt(b) - parseInt(a));
        const hit = dirs.map(d => path.join(tf.trim(), d, prodScript)).find(p => fs.existsSync(p));
        full = hit || null;
      }
    } catch (_) {}
  }
  console.log('');
  console.log('--- not part of the note ---');
  console.log(`Attach: ${full || '(not found — give the full path) ' + prodScript}`);
}

logRow({ ts: new Date().toISOString(), ticket, module: moduleName, branch: branch || null, commit: commit ? commit.hash : null, intenv: intenv || null, outcome: commit ? 'ok' : 'no-commit' });
