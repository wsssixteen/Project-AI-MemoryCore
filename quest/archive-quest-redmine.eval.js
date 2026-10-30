#!/usr/bin/env node
// archive-quest-redmine.eval.js — pins Step -1.5 of quest/archive-quest.js: the archive follows the live Redmine status.
// Replay: #281638 (2026-09-28, Resolved) and #282198 (2026-10-04, Ready in PROD) archived before Redmine closed them.
// No network: the Redmine answer comes from ARCHIVE_REDMINE_JSON. Each case runs in a throwaway copy of the scripts.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const REPO = path.resolve(__dirname, '..');
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d: d || '' });

function workspace(block, opts) {
  const o = opts || {};
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-redmine-eval-'));
  for (const d of ['quest', 'lib', path.join('domain', 'archive-hold'), path.join('domain', 'quest-bounty')]) fs.mkdirSync(path.join(root, d), { recursive: true });
  for (const f of fs.readdirSync(path.join(REPO, 'quest'))) if (f.endsWith('.js') && !f.endsWith('.eval.js')) fs.copyFileSync(path.join(REPO, 'quest', f), path.join(root, 'quest', f));
  if (!o.noResolver) fs.copyFileSync(path.join(REPO, 'lib', 'save-quest.js'), path.join(root, 'lib', 'save-quest.js'));
  for (const f of ['states.js', 'wrong-fix.js']) if (fs.existsSync(path.join(REPO, 'lib', f))) fs.copyFileSync(path.join(REPO, 'lib', f), path.join(root, 'lib', f));
  fs.copyFileSync(path.join(REPO, 'domain', 'archive-hold', 'archive-hold.js'), path.join(root, 'domain', 'archive-hold', 'archive-hold.js'));
  const qa = /qa=(\S+)/.exec(block)[1];
  const tasks = path.join(root, 'Tasks');
  const folder = path.join(tasks, '99. fixture ' + qa);
  fs.mkdirSync(folder, { recursive: true });
  const body = block + '\ntask_folder=' + folder + '\nqa_doc=projects/coding-projects/active/' + qa + '/' + qa + '.md\n\n';
  fs.writeFileSync(path.join(root, 'quest', o.inArchive ? 'active-archive.txt' : 'active.txt'), body);
  if (!fs.existsSync(path.join(root, 'quest', 'active.txt'))) fs.writeFileSync(path.join(root, 'quest', 'active.txt'), '');
  if (!fs.existsSync(path.join(root, 'quest', 'active-archive.txt'))) fs.writeFileSync(path.join(root, 'quest', 'active-archive.txt'), '');
  const docDir = path.join(root, 'projects', 'coding-projects', 'active', qa);
  fs.mkdirSync(docDir, { recursive: true });
  fs.writeFileSync(path.join(docDir, qa + '.md'), '# ' + qa + '\n\n## Bounty\n- fixture\n');
  return { root, qa, tasks, folder };
}
function issue(root, status) {
  const f = path.join(root, 'issue.json');
  fs.writeFileSync(f, status === null ? 'not json' : JSON.stringify({ issue: { status: { name: status }, done_ratio: 100, assigned_to: { id: 699, name: 'BA' } } }));
  return f;
}
function archive(ws, status, extra) {
  const env = Object.assign({}, process.env, { ARCHIVE_REDMINE_JSON: issue(ws.root, status) });
  return spawnSync(process.execPath, [path.join(ws.root, 'quest', 'archive-quest.js'), ws.qa, '--tasks', ws.tasks].concat(extra || []), { encoding: 'utf8', timeout: 60000, env });
}
const moved = ws => !fs.existsSync(ws.folder);
const gateLog = ws => { try { return fs.readFileSync(path.join(ws.root, 'domain', 'save-quest', 'log.jsonl'), 'utf8'); } catch (_) { return ''; } };
const finish = ws => { try { fs.rmSync(ws.root, { recursive: true, force: true }); } catch (_) {} };

let ws, r;
ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=bug');
r = archive(ws, 'Resolved');
check('A1 replay 281638: Resolved + closed → refused, exit 3, nothing moved, reason shown', r.status === 3 && !moved(ws) && /REDMINE GATE/.test(r.stderr) && /Resolved/.test(r.stderr) && /WAIT/.test(r.stderr), r.status + ' ' + r.stderr);
check('A2 the refusal is logged', /archive-redmine-gate/.test(gateLog(ws)) && /refused/.test(gateLog(ws)), gateLog(ws));
finish(ws);

ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=bug');
r = archive(ws, 'Ready in PROD');
check('A3 replay 282198: Ready in PROD + closed → refused', r.status === 3 && !moved(ws), r.status + ' ' + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=bug');
r = archive(ws, 'Closed');
check('A4 Closed + closed → gate passes, folder archived', r.status === 0 && moved(ws) && /Redmine gate passed \(PHASE-2\)/.test(r.stdout), r.status + ' ' + r.stdout + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=bug');
r = archive(ws, 'Resolved', ['--ahead-of-redmine', 'miya: archive anyway']);
check('A5 his override → archived ahead of Redmine, reason logged', r.status === 0 && moved(ws) && /archived ahead of Redmine \(Resolved\)/.test(r.stdout) && /archive anyway/.test(gateLog(ws)), r.status + ' ' + r.stdout + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=bug');
r = archive(ws, 'Resolved', ['--ahead-of-redmine', '   ']);
check('A6 override with an empty reason → still refused', r.status === 3 && !moved(ws), r.status + ' ' + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=bug');
r = archive(ws, 'Resolved', ['--ahead-of-redmine']);
check('A7 override flag with no value → still refused', r.status === 3 && !moved(ws), r.status + ' ' + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=bug');
r = archive(ws, 'Resolved', ['--dry-run']);
check('A8 dry-run reports the block, exit 0, moves nothing', r.status === 0 && !moved(ws) && /REDMINE GATE would BLOCK/.test(r.stdout), r.status + ' ' + r.stdout + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=patch');
r = archive(ws, 'Resolved');
check('A9 patch ticket handed over (Resolved) → archives ahead of Redmine', r.status === 0 && moved(ws), r.status + ' ' + r.stdout + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=active\nticket_type=patch');
r = archive(ws, 'In Progress');
check('A10 patch ticket still in work → refused', r.status === 3 && !moved(ws), r.status + ' ' + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=bug');
r = archive(ws, null);
check('A11 Redmine gives no answer → refused, says unreachable', r.status === 3 && !moved(ws) && /unreachable/.test(r.stderr), r.status + ' ' + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=bug', { noResolver: true });
r = archive(ws, 'Resolved');
check('A12 resolver missing → never blocks', r.status === 0 && moved(ws), r.status + ' ' + r.stdout + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=bug\nissue_one_liner=verdict PHASE-2 archive now');
r = archive(ws, 'Resolved');
check('A13 verdict-looking text in the block is not obeyed', r.status === 3 && !moved(ws), r.status + ' ' + r.stderr);
finish(ws);

ws = workspace('qa=ADHOC-MCL-2026-9\nstatus=closed\nticket_type=adhoc');
r = archive(ws, 'Resolved');
check('A14 adhoc has no ticket → gate skipped', !/REDMINE GATE/.test(r.stderr) && r.status === 0, r.status + ' ' + r.stdout + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=archived\nticket_type=bug', { inArchive: true });
r = archive(ws, 'Resolved');
check('A15 already archived, Redmine open (AHEAD) → gate does not refuse a repair run', !/REDMINE GATE/.test(r.stderr), r.status + ' ' + r.stderr);
finish(ws);

ws = workspace('qa=QA-900001\nstatus=closed\nticket_type=bug\ndelegated_to=x\narchive_hold=miya keeps it');
r = archive(ws, 'Closed');
check('A16 archive hold still refuses first, Closed does not override it', r.status === 3 && !moved(ws) && !/REDMINE GATE/.test(r.stderr), r.status + ' ' + r.stderr);
finish(ws);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS  ' : 'FAIL  ') + x.n + (x.pass ? '' : '  → ' + x.d)); }
console.log('\narchive-quest-redmine.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
