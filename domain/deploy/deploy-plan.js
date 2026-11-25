#!/usr/bin/env node
// deploy-plan — born 2026-11-25 per miya (290517: "We can definitely automate a ticket that BA simply asks to deploy to another environment")
// symptom: 290517: the QA asked "Need help to deploy the fixing in STAG for testing"; the merge, its checks and the note took several turns by hand
// goal: a BA or QA request to deploy a ticket to another environment becomes one sealed plan and one approval code; the merge runs only on that code
// goal_signal: log.jsonl rows planned / stopped / merged, each merged row naming the code miya approved
// retention: keep
// footprint: on-demand: 1 node process plus git children per call, a few seconds; nothing runs otherwise
// boundary: merges a ticket branch into an env branch (int-env, stag-env) of its state and pushes; never builds or deploys a server,
//           never touches trunk, release, training, PAT, UAT or PROD branches, never posts to Redmine
//
// USAGE
//   node domain/deploy/deploy-plan.js plan --ticket <num> --env <internal|staging> --state <state> [--repo <work clone>] [--ba <short name>]
//   node domain/deploy/deploy-plan.js run --approve <XXXX-XXXX>
//   node domain/deploy/deploy-plan.js status <XXXX-XXXX>
// The approval record <code>.miya.json is written only by domain/prod-alter-gate from miya's own message "approve deploy <code>".
// Exit 0 = plan sealed / merged · 1 = stopped (the reason is printed) · 2 = bad input.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PLANS = process.env.DEPLOY_PLANS || path.join(__dirname, 'plans');
const LOG = process.env.DEPLOY_LOG || path.join(__dirname, 'log.jsonl');
const STATES = process.env.DEPLOY_STATES_FILE || path.join(ROOT, 'system', 'states.json');
const DEFAULT_REPO = 'E:/Dev/etanah-work/etanah-pelupusan';
const ENV_WORDS = { internal: 'int-env', int: 'int-env', 'int-env': 'int-env', staging: 'stag-env', stag: 'stag-env', stg: 'stag-env', 'stag-env': 'stag-env' };
const FORBIDDEN = /prod|pat|uat|training|release|master/i;

function arg(n) { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; }
function git(repo, args, ok) {
  const r = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', windowsHide: true, timeout: 180000 });
  if (!ok && r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + (r.stderr || r.stdout || '').trim().split('\n').pop());
  return ok ? r : (r.stdout || '').trim();
}
function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) { /* never fail on logging */ } }
const fmt = c => c.slice(0, 4) + '-' + c.slice(4);
const norm = c => String(c || '').replace(/-/g, '').toUpperCase();
class Stop extends Error { constructor(why, extra) { super(why); this.extra = extra || {}; } }
// a stop throws, so the finally of run() still removes its temporary work folder
function stop(why, extra) { throw new Stop(why, extra); }

function envBranches(state) {
  let all = {}; try { all = JSON.parse(fs.readFileSync(STATES, 'utf8')); } catch (_) { /* below */ }
  const list = all.states || all;
  const s = Array.isArray(list) ? list.find(x => x && (x.id === state || x.name === state || x.key === state)) : list[state];
  return (s && s.env_branches) || null;
}

function plan() {
  const ticket = arg('ticket'), envWord = String(arg('env') || '').toLowerCase(), state = arg('state'), repo = arg('repo') || DEFAULT_REPO, ba = arg('ba');
  if (!ticket || !/^\d{5,7}$/.test(ticket) || !envWord || !state) { console.error('usage: plan --ticket <num> --env <internal|staging> --state <state> [--repo <dir>] [--ba <name>]'); process.exit(2); }
  if (FORBIDDEN.test(envWord) || !ENV_WORDS[envWord]) stop(`environment "${envWord}" is not internal or staging; PAT, UAT, PROD, training and release go by their own route`, { ticket });
  const branches = envBranches(state);
  if (!branches) stop(`state "${state}" has no env_branches in system/states.json`, { ticket });
  const target = branches.find(b => b.endsWith('/' + ENV_WORDS[envWord]));
  if (!target) stop(`state "${state}" has no ${ENV_WORDS[envWord]} branch`, { ticket });
  const prefix = target.split('/')[0];

  git(repo, ['fetch', 'origin', '--prune', '-q']);
  const heads = git(repo, ['ls-remote', '--heads', 'origin']).split('\n').map(l => l.split('\t')[1] || '').map(r => r.replace('refs/heads/', ''))
    .filter(b => b.startsWith(prefix + '/') && new RegExp('(^|/)' + ticket + '$').test(b));
  if (heads.length !== 1) stop(heads.length ? `${heads.length} branches name ${ticket}: ${heads.join(', ')}` : `no ${prefix}/ branch ends with ${ticket} on origin`, { ticket });
  const source = heads[0];
  const sourceSha = git(repo, ['rev-parse', 'origin/' + source]);
  git(repo, ['rev-parse', '--verify', 'origin/' + target]);

  const carried = git(repo, ['log', '--no-merges', '--format=%H%x09%an%x09%s', `origin/${target}..origin/${source}`]).split('\n').filter(Boolean)
    .map(l => { const [sha, author, subject] = l.split('\t'); return { sha: sha.slice(0, 10), author, subject }; });
  if (!carried.length) stop(`${source} is already in ${target}: nothing to merge`, { ticket, source, target });
  const foreign = carried.filter(c => !new RegExp('\\b' + ticket + '\\b').test(c.subject));
  if (foreign.length) stop(`${foreign.length} commit(s) do not name ${ticket}: ${foreign.map(c => c.sha + ' ' + c.subject).join(' | ')}`, { ticket, source, target });
  const files = git(repo, ['diff', '--name-only', `origin/${target}...origin/${source}`]).split('\n').filter(Boolean).sort();
  const touched = new Set();
  for (const c of carried) git(repo, ['show', '--name-only', '--format=', c.sha]).split('\n').filter(Boolean).forEach(f => touched.add(f));
  const extra = files.filter(f => !touched.has(f));
  if (files.some(f => /(^|\/)pom\.xml$/.test(f))) stop('the merge changes pom.xml (a version bump): show him the branch first', { ticket, source, target, files });
  if (extra.length) stop(`the merge changes files no ${ticket} commit touched: ${extra.join(', ')}`, { ticket, source, target, files });
  const mt = git(repo, ['merge-tree', '--write-tree', '--name-only', 'origin/' + target, 'origin/' + source], true);
  if (mt.status !== 0) stop(`the merge conflicts: ${(mt.stdout || '').split('\n').slice(1).filter(l => l && !/^Auto-merging|^CONFLICT/.test(l)).join(', ') || 'see git merge-tree'}`, { ticket, source, target });

  const me = git(repo, ['config', 'user.name']) || '';
  const authors = [...new Set(carried.map(c => c.author))];
  const warnings = authors.filter(a => a !== me).map(a => `commit by ${a}, not ${me}: the ticket is not only ours`);
  const envLabel = ENV_WORDS[envWord] === 'int-env' ? 'internal' : 'staging';
  const note = ba ? `Salam ${ba}, have deployed fixes to ${envLabel}. Please help to verify.\n\nThank you.` : null;
  const body = { kind: 'deploy', ticket, state, repo, source, sourceSha, target, carried, files, warnings, note, created: new Date().toISOString() };
  const code = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 8).toUpperCase();
  fs.mkdirSync(PLANS, { recursive: true });
  fs.writeFileSync(path.join(PLANS, code + '.json'), JSON.stringify({ code, ...body }, null, 2));
  log({ outcome: 'planned', code, ticket, source, sourceSha: sourceSha.slice(0, 10), target, files, warnings });
  console.log(`DEPLOY PLAN ${fmt(code)} · ticket ${ticket} · ${state}`);
  console.log(`  merge  ${source} (${sourceSha.slice(0, 10)}) -> ${target}`);
  for (const c of carried) console.log(`  commit ${c.sha} ${c.author}: ${c.subject}`);
  for (const f of files) console.log(`  file   ${f}`);
  for (const w of warnings) console.log(`  WARN   ${w}`);
  if (note) console.log('  note   ' + note.replace(/\n+/g, ' / '));
  console.log('  stays his: the server deploy, the Redmine Submit');
  console.log(`DEPLOY-PLAN: ${fmt(code)} sealed, valid 60 minutes. His approval line: approve deploy ${fmt(code)}`);
}

function run() {
  const code = norm(arg('approve'));
  if (!/^[0-9A-F]{8}$/.test(code)) { console.error('usage: run --approve <XXXX-XXXX>'); process.exit(2); }
  const pf = path.join(PLANS, code + '.json'), rec = path.join(PLANS, code + '.miya.json'), used = path.join(PLANS, code + '.used.json');
  let p; try { p = JSON.parse(fs.readFileSync(pf, 'utf8')); } catch (_) { stop(`no sealed plan ${fmt(code)}`, { code }); }
  if (fs.existsSync(used)) stop(`plan ${fmt(code)} was already run: make a new plan`, { code });
  if ((Date.now() - Date.parse(p.created)) / 60000 > 60) stop(`plan ${fmt(code)} is older than 60 minutes: make a new plan`, { code });
  let r; try { r = JSON.parse(fs.readFileSync(rec, 'utf8')); } catch (_) { stop(`no approval from miya for ${fmt(code)}: he types "approve deploy ${fmt(code)}"`, { code }); }
  if (!(Date.parse(r.ts) >= Date.parse(p.created))) stop(`the approval of ${fmt(code)} is older than its plan`, { code });

  git(p.repo, ['fetch', 'origin', '--prune', '-q']);
  const nowSha = git(p.repo, ['rev-parse', 'origin/' + p.source]);
  if (nowSha !== p.sourceSha) stop(`${p.source} moved since the plan (${p.sourceSha.slice(0, 10)} -> ${nowSha.slice(0, 10)}): make a new plan`, { code });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-' + code + '-'));
  try {
    git(p.repo, ['worktree', 'add', '-q', '--detach', dir, 'origin/' + p.target]);
    git(dir, ['merge', '--no-ff', '-q', 'origin/' + p.source, '-m', `Merge branch '${p.source}' into ${p.target}`]);
    const diff = git(dir, ['diff', '--name-only', 'origin/' + p.target, 'HEAD']).split('\n').filter(Boolean).sort();
    if (JSON.stringify(diff) !== JSON.stringify(p.files)) stop(`the merge changes ${diff.join(', ')}, the plan sealed ${p.files.join(', ')}`, { code });
    const push = git(dir, ['push', '-q', 'origin', 'HEAD:' + p.target], true);
    if (push.status !== 0) stop(`push to ${p.target} refused: ${(push.stderr || '').trim().split('\n').pop()}`, { code });
    const mergeSha = git(dir, ['rev-parse', 'HEAD']);
    const when = git(dir, ['log', '-1', '--format=%ci']);
    fs.writeFileSync(used, JSON.stringify({ code, mergeSha, ts: new Date().toISOString(), approvedBy: r.his }, null, 2));
    log({ outcome: 'merged', code, ticket: p.ticket, source: p.source, target: p.target, mergeSha: mergeSha.slice(0, 10), files: p.files, approval: r.his });
    console.log(`DEPLOY-PLAN: merged ${fmt(code)} · ${p.source} -> ${p.target} · ${when} · "Merge branch '${p.source}' into ${p.target}"`);
    console.log(`  next: miya deploys ${p.target}; then the note to the asker${p.note ? ': ' + p.note.replace(/\n+/g, ' / ') : ''}`);
  } finally {
    spawnSync('git', ['-C', p.repo, 'worktree', 'remove', '--force', dir], { windowsHide: true });
  }
}

function status() {
  const code = norm(process.argv[3]);
  const st = ['json', 'miya.json', 'used.json'].map(s => fs.existsSync(path.join(PLANS, code + '.' + s)));
  console.log(`DEPLOY-PLAN ${fmt(code)}: sealed ${st[0] ? 'yes' : 'no'} · approved ${st[1] ? 'yes' : 'no'} · run ${st[2] ? 'yes' : 'no'}`);
}

if (require.main === module) {
  const cmd = process.argv[2];
  try {
    if (cmd === 'plan') plan(); else if (cmd === 'run') run(); else if (cmd === 'status') status();
    else { console.error('usage: deploy-plan.js plan|run|status (see header)'); process.exit(2); }
  } catch (e) {
    log({ outcome: 'stopped', why: e.message, ...((e && e.extra) || {}) });
    console.log('DEPLOY-PLAN: STOP · ' + e.message);
    process.exit(1);
  }
}
module.exports = { ENV_WORDS, FORBIDDEN };
