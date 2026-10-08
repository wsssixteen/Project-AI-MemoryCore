#!/usr/bin/env node
// save-rules.eval.js: fixtures for lib/save-rules.js, built in temp sandboxes (never the real logs).
// Replay: 2026-10-06 miya asked that each kind of system part declare its own save rule and a script check it.
// Run: node lib/save-rules.eval.js            Table: node lib/save-rules.eval.js --table
//
// ADVERSARIAL SCENARIOS (system-design Rule 12): scenario | verdict
const SCENARIOS = [
  ['Feature README missing footprint:', 'fixture-added (A1)'],
  ['README mentions "footprint:" only mid-sentence, not as a key line', 'fixture-added (A2)'],
  ['New Feature folder with no NUKE-MARKER.md', 'fixture-added (A3)'],
  ['Feature folder already present at base, no NUKE-MARKER', 'fixture-added (A4, rule not applicable)'],
  ['Complete Feature (README keys, eval, log, marker)', 'fixture-added (A5)'],
  ['domain/bundles manifest treated as a Feature', 'fixture-added (A6, most specific pattern wins, UNRULED)'],
  ['Memory note with no MEMORY.md index line', 'fixture-added (B1)'],
  ['MEMORY.md links a different file whose name ends the same', 'fixture-added (B2)'],
  ['Memory note with type nested under metadata:', 'fixture-added (B3)'],
  ['Memory note with no front matter', 'fixture-added (B4)'],
  ['Rule file changed, no stamp change and no changelog touch', 'fixture-added (C1)'],
  ['Rule file stamp changed but changelog untouched', 'fixture-added (C2)'],
  ['Rule file with stamp and changelog both changed', 'fixture-added (C3)'],
  ['Rule file that carries no stamp line at all', 'fixture-added (C4)'],
  ['No git repository to diff against', 'fixture-added (C5, FAIL not silent PASS)'],
  ['Kernel script with no eval and no registry row', 'fixture-added (D1)'],
  ['Eval exists but exits non-zero', 'fixture-added (D2)'],
  ['Eval hangs', 'fixture-added (D3, FAIL timeout, script still finishes)'],
  ['Eval listed in the quarantine file', 'fixture-added (D4, SKIP)'],
  ['Only the .eval.js file of a script was touched', 'fixture-added (D5, maps to the script part)'],
  ['Quest doc with no heading dated today', 'fixture-added (E1)'],
  ['Today appears in the quest doc only in prose, not in a heading', 'fixture-added (E2)'],
  ['Quest doc with a dated heading and a full block', 'fixture-added (E3)'],
  ['Quest with no active.txt block', 'fixture-added (E4)'],
  ['Block whose qa_doc path does not resolve', 'fixture-added (E5)'],
  ['Worktree and main copies of the quest doc differ', 'fixture-added (E6)'],
  ['Only one of the two quest doc copies exists', 'fixture-added (E7 main only = PASS with note, E7b worktree only = FAIL)'],
  ['Task folder named in the block is gone', 'fixture-added (E8)'],
  ['Quest dir named by digits only', 'fixture-added (E9)'],
  ['Quest named only through --quests', 'fixture-added (E10)'],
  ['Path matched by no kind', 'fixture-added (F1, unmapped, exit unaffected)'],
  ['Ledger and log paths', 'fixture-added (F2, ignored, not parts)'],
  ['Kind with no written rule for the part', 'fixture-added (F3, UNRULED not FAIL)'],
  ['Nothing touched', 'fixture-added (F4, 0 part(s), exit 0)'],
  ['Backslash and mixed-case Windows style paths', 'fixture-added (F5)'],
  ['Many files in one part collapse to one part', 'fixture-added (F6)'],
  ['Malformed save-rules.json', 'fixture-added (G1, exit 2)'],
  ['Rule naming a check that does not exist', 'fixture-added (G2, exit 2)'],
  ['save-rules.json missing', 'fixture-added (G3, exit 2)'],
  ['--since and --paths overrides', 'fixture-added (G4, G5)'],
  ['Log row and close-gate marker written; override runs marked partial', 'fixture-added (H1, H2)'],
  ['INDEX.md map fence drifts from the declared kinds', 'fixture-added (I1, parity against the real fence)'],
  ['A rule cites a source file that does not exist', 'fixture-added (I2, against the real rules file)'],
  ['Project folder complete, repo commit named in VERSIONS.md', 'fixture-added (J1)'],
  ['Project folder missing one of the five documents', 'fixture-added (J2)'],
  ['Project repo has a commit that VERSIONS.md does not name', 'fixture-added (J3, the 2026-10-08 stale-folder replay)'],
  ['PROJECT.md dated before the latest commit', 'fixture-added (J3b)'],
  ['Project repo path does not exist on this machine', 'fixture-added (J4, SKIP not FAIL)'],
  ['Uncommitted work in the project repo, no Work in progress section', 'fixture-added (J5, then PASS once the section exists)'],
  ['No memory note points at the project folder', 'fixture-added (J6)'],
  ['Nothing in this repo changed, only the project repo got a commit today', 'fixture-added (J7, found without --paths)'],
  ['project.json is not valid JSON', 'fixture-added (J8)'],
  ['project.json has no aliases', 'fixture-added (J9)'],
  ['A projects-kind path with no project.json (etanah_atlas)', 'handled: not a project folder, the docs rules do not apply (J10)'],
  ['Two sessions append to the log at the same moment', 'accepted-risk: one short line per append, readers ignore bad lines'],
  ['Table cell text containing a pipe character', 'accepted-risk: display only, --json is the machine form'],
];

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, 'save-rules.js');
const REAL_ROOT = path.resolve(__dirname, '..');
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d });
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'save-rules-eval-'));
let seq = 0;
const d = new Date();
const TODAY = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

function mk(files, opts) {
  const root = path.join(TMP, 's' + (++seq));
  fs.mkdirSync(path.join(root, 'system'), { recursive: true });
  if (!(opts && opts.noRules)) fs.copyFileSync(path.join(REAL_ROOT, 'system', 'save-rules.json'), path.join(root, 'system', 'save-rules.json'));
  put(root, files || {});
  return root;
}
function put(root, files) {
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(root, ...rel.split('/'));
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
}
function git(root, ...a) { return spawnSync('git', ['-c', 'user.email=e@e', '-c', 'user.name=e', '-c', 'commit.gpgsign=false'].concat(a), { cwd: root, encoding: 'utf8' }); }
function gitInit(root) { git(root, 'init', '-q'); git(root, 'add', '-A'); git(root, 'commit', '-qm', 'base'); }
function run(root, args, env, main) {
  const r = spawnSync(process.execPath, [SCRIPT].concat(args || [], ['--json', '--main-root', main || root]), { cwd: root, encoding: 'utf8', timeout: 90000, env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: root }, env || {}) });
  let j = null; try { j = JSON.parse(r.stdout); } catch (_) {}
  return { status: r.status, out: r.stdout, err: r.stderr, j };
}
const row = (r, rule, part) => ((r.j && r.j.rows) || []).find(x => x.rule === rule && (!part || x.part === part));
const OK_EVAL = "console.log('1/1 green'); process.exit(0);\n";
const FEATURE_README = '# x\ngoal: do a thing\nretention: keep\nfootprint: on-demand: none\n';

// A. Features
let sb = mk({ 'domain/x/README.md': '# x\ngoal: g\nretention: keep\n', 'domain/x/x.eval.js': OK_EVAL });
let r = run(sb, ['--paths', 'domain/x/README.md', '--since', 'HEAD']);
check('A1 README missing footprint -> FAIL on that rule', row(r, 'feat-readme-keys') && row(r, 'feat-readme-keys').result === 'FAIL' && /footprint/.test(row(r, 'feat-readme-keys').detail), JSON.stringify(row(r, 'feat-readme-keys')));
check('A1b FAIL makes exit code 1', r.status === 1, 'exit=' + r.status);
sb = mk({ 'domain/x/README.md': '# x\ngoal: g\nretention: keep\nsee footprint: somewhere in prose\n' });
r = run(sb, ['--paths', 'domain/x/README.md']);
check('A2 footprint only mid-sentence -> FAIL', row(r, 'feat-readme-keys').result === 'FAIL', JSON.stringify(row(r, 'feat-readme-keys')));
sb = mk({ 'domain/n/README.md': FEATURE_README, 'domain/n/n.eval.js': OK_EVAL, 'keep.txt': 'k' });
gitInit(sb); put(sb, { 'domain/n2/README.md': FEATURE_README, 'domain/n2/n2.eval.js': OK_EVAL });
r = run(sb, ['--paths', 'domain/n2/README.md', '--since', 'HEAD']);
check('A3 new Feature folder without NUKE-MARKER -> FAIL', row(r, 'feat-new-nuke-marker') && row(r, 'feat-new-nuke-marker').result === 'FAIL', JSON.stringify(row(r, 'feat-new-nuke-marker')));
r = run(sb, ['--paths', 'domain/n/README.md', '--since', 'HEAD']);
check('A4 folder present at base -> NUKE-MARKER rule not applicable', !row(r, 'feat-new-nuke-marker'), JSON.stringify(r.j && r.j.rows.map(x => x.rule)));
sb = mk({ 'domain/c/README.md': FEATURE_README, 'domain/c/c.eval.js': OK_EVAL, 'domain/c/log.jsonl': '', 'domain/c/NUKE-MARKER.md': '# m\n' });
r = run(sb, ['--paths', 'domain/c/README.md,domain/c/c.eval.js,domain/c/NUKE-MARKER.md']);
check('A5 complete Feature -> every row PASS', r.j && r.j.fail === 0 && ['feat-readme-keys', 'feat-new-nuke-marker', 'feat-eval-passes', 'feat-census-proper'].every(id => row(r, id) && row(r, id).result === 'PASS') && r.status === 0, JSON.stringify(r.j && r.j.rows.map(x => x.rule + ':' + x.result + ':' + x.detail)));
sb = mk({ 'domain/bundles/a.json': '{}' });
r = run(sb, ['--paths', 'domain/bundles/a.json']);
check('A6 bundle manifest is its own part, UNRULED, not a Feature', r.j && r.j.rows.length === 1 && r.j.rows[0].result === 'UNRULED' && r.j.rows[0].part === 'domain/bundles/a.json', JSON.stringify(r.j && r.j.rows));

// B. Memory
const MEM = '---\nname: n\ndescription: d\ntype: feedback\n---\nbody\n';
sb = mk({ '.claude/auto-memory/a.md': MEM, '.claude/auto-memory/MEMORY.md': '# idx\n- [other](data.md) - x\n' });
r = run(sb, ['--paths', '.claude/auto-memory/a.md']);
check('B1 memory note with no index line -> FAIL', row(r, 'mem-index-line').result === 'FAIL', JSON.stringify(row(r, 'mem-index-line')));
check('B2 link to a different file is not an index line for a.md', row(r, 'mem-index-line').result === 'FAIL', '');
put(sb, { '.claude/auto-memory/MEMORY.md': '# idx\n- [a](a.md) - x\n' });
r = run(sb, ['--paths', '.claude/auto-memory/a.md']);
check('B1b with the index line -> PASS (frontmatter PASS too)', row(r, 'mem-index-line').result === 'PASS' && row(r, 'mem-frontmatter').result === 'PASS', JSON.stringify(r.j && r.j.rows));
put(sb, { '.claude/auto-memory/a.md': '---\nname: n\ndescription: d\nmetadata:\n  type: feedback\n---\n' });
r = run(sb, ['--paths', '.claude/auto-memory/a.md']);
check('B3 type nested under metadata -> PASS', row(r, 'mem-frontmatter').result === 'PASS', JSON.stringify(row(r, 'mem-frontmatter')));
put(sb, { '.claude/auto-memory/a.md': 'no front matter here\n' });
r = run(sb, ['--paths', '.claude/auto-memory/a.md']);
check('B4 no front matter -> FAIL', row(r, 'mem-frontmatter').result === 'FAIL', JSON.stringify(row(r, 'mem-frontmatter')));
sb = mk({ 'main/current-session.md': 'x\n'.repeat(501) });
r = run(sb, ['--paths', 'main/current-session.md']);
check('B5 session file over 500 lines -> FAIL', row(r, 'mem-session-cap').result === 'FAIL', JSON.stringify(row(r, 'mem-session-cap')));
sb = mk({ 'daily-diary/current/2026-01-01.md': '# Daily Diary\n## Sessions\nx\n## Closing\ny\n' });
r = run(sb, ['--paths', 'daily-diary/current/2026-01-01.md']);
check('B6 diary missing the Index section -> FAIL', row(r, 'mem-diary-template').result === 'FAIL' && /Index/.test(row(r, 'mem-diary-template').detail), JSON.stringify(row(r, 'mem-diary-template')));

// C. Rules
const RULE_V1 = '# R\n*Version: 1.0 | Last updated: 2026-01-01*\nbody\n';
sb = mk({ '.claude/CLAUDE.md': RULE_V1, 'system/claude-md-changelog.md': '# c\n' });
gitInit(sb);
put(sb, { '.claude/CLAUDE.md': RULE_V1 + 'more body\n' });
r = run(sb, ['--paths', '.claude/CLAUDE.md', '--since', 'HEAD']);
check('C1 rule file changed with no stamp and no changelog -> both FAIL', row(r, 'rules-version-stamp').result === 'FAIL' && row(r, 'rules-changelog').result === 'FAIL', JSON.stringify(r.j && r.j.rows));
put(sb, { '.claude/CLAUDE.md': RULE_V1.replace('1.0', '1.1') + 'more body\n' });
r = run(sb, ['--paths', '.claude/CLAUDE.md', '--since', 'HEAD']);
check('C2 stamp changed, changelog untouched -> stamp PASS, changelog FAIL', row(r, 'rules-version-stamp').result === 'PASS' && row(r, 'rules-changelog').result === 'FAIL', JSON.stringify(r.j && r.j.rows));
r = run(sb, ['--paths', '.claude/CLAUDE.md,system/claude-md-changelog.md', '--since', 'HEAD']);
check('C3 stamp changed and changelog touched -> both PASS', r.j.fail === 0 && row(r, 'rules-changelog').result === 'PASS', JSON.stringify(r.j && r.j.rows));
sb = mk({ 'quest/x-protocol.md': '# P\n*Updated 2026-01-01 — first*\nbody\n' });
gitInit(sb); put(sb, { 'quest/x-protocol.md': '# P\n*Updated 2026-10-06 — second*\n*Updated 2026-01-01 — first*\nbody\n' });
r = run(sb, ['--paths', 'quest/x-protocol.md', '--since', 'HEAD']);
check('C3b protocol file using the "*Updated <date>" stamp style -> stamp change PASS', row(r, 'wf-protocol-version-stamp') && row(r, 'wf-protocol-version-stamp').result === 'PASS', JSON.stringify(r.j && r.j.rows));
sb = mk({ '.claude/personality.md': '# p\nno stamp anywhere\n' });
gitInit(sb); put(sb, { '.claude/personality.md': '# p\nno stamp anywhere\nedit\n' });
r = run(sb, ['--paths', '.claude/personality.md', '--since', 'HEAD']);
check('C4 rule file with no stamp line at all -> FAIL', row(r, 'rules-version-stamp').result === 'FAIL' && /no version stamp/.test(row(r, 'rules-version-stamp').detail), JSON.stringify(row(r, 'rules-version-stamp')));
sb = mk({ '.claude/CLAUDE.md': RULE_V1 });
r = run(sb, ['--paths', '.claude/CLAUDE.md']);
check('C5 no git repository -> FAIL, never a silent PASS', row(r, 'rules-version-stamp').result === 'FAIL', JSON.stringify(row(r, 'rules-version-stamp')));
sb = mk({ 'system/INDEX.md': '# no fence\n', 'system/FOLDER-STRUCTURE.md': '# none\n' });
r = run(sb, ['--paths', 'system/INDEX.md']);
check('C6 INDEX.md without a valid map -> folder-map FAIL', row(r, 'rules-folder-map').result === 'FAIL', JSON.stringify(row(r, 'rules-folder-map')));
r = run(sb, ['--paths', 'system/save-rules.json']);
check('C7 save-rules.json touched -> validity row PASS', row(r, 'rules-save-rules-valid').result === 'PASS', JSON.stringify(r.j && r.j.rows));

// D. Kernel and evals
sb = mk({ 'lib/nothing.js': '// a header comment line that is long enough to count\nmodule.exports = 1;\n', 'system/registry.jsonl': '' });
r = run(sb, ['--paths', 'lib/nothing.js']);
check('D1 lib script with no eval -> FAIL', row(r, 'kernel-eval').result === 'FAIL', JSON.stringify(row(r, 'kernel-eval')));
check('D1b no registry row -> FAIL', row(r, 'kernel-registry-row').result === 'FAIL', JSON.stringify(row(r, 'kernel-registry-row')));
check('D1c no user -> FAIL', row(r, 'kernel-has-user').result === 'FAIL', JSON.stringify(row(r, 'kernel-has-user')));
put(sb, { 'lib/nothing.eval.js': 'process.exit(1);\n' });
r = run(sb, ['--paths', 'lib/nothing.js']);
check('D2 eval exits non-zero -> FAIL', row(r, 'kernel-eval').result === 'FAIL' && /exit 1/.test(row(r, 'kernel-eval').detail), JSON.stringify(row(r, 'kernel-eval')));
put(sb, { 'lib/nothing.eval.js': 'setInterval(function () {}, 1000);\n' });
let t0 = Date.now();
r = run(sb, ['--paths', 'lib/nothing.js'], { SAVE_RULES_EVAL_TIMEOUT_MS: '1500' });
check('D3 hanging eval -> FAIL timeout and the script still finishes', row(r, 'kernel-eval').result === 'FAIL' && /timeout/.test(row(r, 'kernel-eval').detail) && (Date.now() - t0) < 30000, JSON.stringify(row(r, 'kernel-eval')));
put(sb, { 'system/eval-quarantine.jsonl': JSON.stringify({ eval: 'lib/nothing.eval.js', reason: 'test', since: '2026-01-01' }) + '\n' });
r = run(sb, ['--paths', 'lib/nothing.js']);
check('D4 quarantined eval -> SKIP (quarantined), not FAIL', row(r, 'kernel-eval').result === 'SKIP' && /quarantined/.test(row(r, 'kernel-eval').detail), JSON.stringify(row(r, 'kernel-eval')));
put(sb, { 'lib/nothing.eval.js': OK_EVAL, 'system/eval-quarantine.jsonl': '' });
r = run(sb, ['--paths', 'lib/nothing.eval.js']);
check('D5 only the eval file touched -> part is the script, eval PASS', row(r, 'kernel-eval', 'lib/nothing.js') && row(r, 'kernel-eval', 'lib/nothing.js').result === 'PASS', JSON.stringify(r.j && r.j.rows));
put(sb, { 'system/registry.jsonl': JSON.stringify({ name: 'nothing', kind: 'script' }) + '\n', 'domain/user/user.hook.js': "require('../../lib/nothing.js');\n" });
r = run(sb, ['--paths', 'lib/nothing.js']);
check('D6 registry row and a user -> those rules PASS', row(r, 'kernel-registry-row').result === 'PASS' && row(r, 'kernel-has-user').result === 'PASS', JSON.stringify(r.j && r.j.rows));
put(sb, { '.claude/settings.json': JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}\\\\domain\\\\gone\\\\gone.js"' }] }] } }) });
r = run(sb, ['--paths', '.claude/settings.json']);
check('D7 settings.json naming a missing hook file -> FAIL', row(r, 'kernel-settings').result === 'FAIL', JSON.stringify(row(r, 'kernel-settings')));
sb = mk({ '.claude/skills/s/SKILL.md': '---\nname: s\n---\nbody\n' });
r = run(sb, ['--paths', '.claude/skills/s/SKILL.md']);
check('D8 skill without description -> FAIL', row(r, 'skill-frontmatter').result === 'FAIL' && /description/.test(row(r, 'skill-frontmatter').detail), JSON.stringify(row(r, 'skill-frontmatter')));

// E. Quests
const QDOC = 'projects/coding-projects/active/QA-111111/QA-111111.md';
function questSb(extra, docBody, blockExtra) {
  const files = Object.assign({
    'quest/active.txt': 'qa=QA-111111\nstatus=active\nqa_doc=' + QDOC + '\n' + (blockExtra || '') + '\n',
    [QDOC]: docBody === undefined ? '# QA-111111\n### ' + TODAY + ': saved\n' : docBody,
  }, extra || {});
  return mk(files);
}
sb = questSb({}, '# QA-111111\n### 2026-01-01: old\n');
r = run(sb, ['--paths', QDOC]);
check('E1 quest doc with no heading dated today -> FAIL', row(r, 'quest-doc-dated-today').result === 'FAIL', JSON.stringify(row(r, 'quest-doc-dated-today')));
sb = questSb({}, '# QA-111111\nwe did this on ' + TODAY + ' in prose only\n');
r = run(sb, ['--paths', QDOC]);
check('E2 today only in prose -> FAIL', row(r, 'quest-doc-dated-today').result === 'FAIL', JSON.stringify(row(r, 'quest-doc-dated-today')));
sb = questSb({}, '# QA-111111\n**OUTCOME ' + TODAY + ' evening: resolved**\n- detail\n');
r = run(sb, ['--paths', QDOC]);
check('E2b bold lead line dated today -> PASS', row(r, 'quest-doc-dated-today').result === 'PASS', JSON.stringify(row(r, 'quest-doc-dated-today')));
sb = questSb({});
r = run(sb, ['--paths', QDOC]);
check('E3 dated heading and a full block -> PASS rows', r.j.fail === 0 && row(r, 'quest-doc-dated-today').result === 'PASS' && row(r, 'quest-block').result === 'PASS', JSON.stringify(r.j && r.j.rows));
sb = mk({ 'quest/active.txt': 'qa=QA-999999\nstatus=active\nqa_doc=x\n', [QDOC]: '# d\n' });
r = run(sb, ['--paths', QDOC]);
check('E4 quest with no block -> FAIL', row(r, 'quest-block').result === 'FAIL', JSON.stringify(row(r, 'quest-block')));
sb = questSb({ 'quest/active.txt': 'qa=QA-111111\nstatus=active\nqa_doc=projects/coding-projects/active/QA-111111/none.md\n' });
r = run(sb, ['--paths', QDOC]);
check('E5 qa_doc path does not resolve -> FAIL', row(r, 'quest-doc-resolves').result === 'FAIL', JSON.stringify(row(r, 'quest-doc-resolves')));
const wt = mk({ [QDOC]: '# QA-111111\n### ' + TODAY + ': worktree copy\n' });
const main = mk({ [QDOC]: '# QA-111111\n### ' + TODAY + ': main copy, different\n', 'quest/active.txt': 'qa=QA-111111\nstatus=active\nqa_doc=' + QDOC + '\n' });
r = run(wt, ['--paths', QDOC], {}, main);
check('E6 worktree and main copies differ -> FAIL', row(r, 'quest-doc-copies-agree').result === 'FAIL' && /differ/.test(row(r, 'quest-doc-copies-agree').detail), JSON.stringify(row(r, 'quest-doc-copies-agree')));
fs.copyFileSync(path.join(main, ...QDOC.split('/')), path.join(wt, ...QDOC.split('/')));
r = run(wt, ['--paths', QDOC], {}, main);
check('E6b identical copies -> PASS', row(r, 'quest-doc-copies-agree').result === 'PASS', JSON.stringify(row(r, 'quest-doc-copies-agree')));
fs.unlinkSync(path.join(wt, ...QDOC.split('/')));
r = run(wt, ['--paths', QDOC], {}, main);
check('E7 main copy only (never copied into the worktree) -> PASS with a note', row(r, 'quest-doc-copies-agree').result === 'PASS' && /main copy only/.test(row(r, 'quest-doc-copies-agree').detail), JSON.stringify(row(r, 'quest-doc-copies-agree')));
fs.unlinkSync(path.join(main, ...QDOC.split('/')));
fs.writeFileSync(path.join(wt, ...QDOC.split('/')), '# QA-111111\n### ' + TODAY + ': worktree only\n');
r = run(wt, ['--paths', QDOC], {}, main);
check('E7b worktree copy only (main has none) -> FAIL', row(r, 'quest-doc-copies-agree').result === 'FAIL' && /only the worktree/.test(row(r, 'quest-doc-copies-agree').detail), JSON.stringify(row(r, 'quest-doc-copies-agree')));
sb = questSb({}, undefined, 'task_folder=' + path.join(TMP, 'no-such-folder') + '\n');
r = run(sb, ['--paths', QDOC]);
check('E8 task_folder missing on disk -> FAIL', row(r, 'quest-task-folder-exists').result === 'FAIL', JSON.stringify(row(r, 'quest-task-folder-exists')));
fs.mkdirSync(path.join(TMP, 'real-task-folder'));
sb = questSb({}, undefined, 'task_folder=' + path.join(TMP, 'real-task-folder') + '\n');
r = run(sb, ['--paths', QDOC]);
check('E8b task_folder present -> PASS', row(r, 'quest-task-folder-exists').result === 'PASS', JSON.stringify(row(r, 'quest-task-folder-exists')));
sb = mk({ 'quest/active.txt': 'qa=QA-239386\nstatus=active\nqa_doc=projects/coding-projects/active/239386/239386.md\n', 'projects/coding-projects/active/239386/239386.md': '# q\n### ' + TODAY + ' x\n' });
r = run(sb, ['--paths', 'projects/coding-projects/active/239386/239386.md']);
check('E9 digits-only quest dir maps to its QA block', row(r, 'quest-block').result === 'PASS', JSON.stringify(r.j && r.j.rows));
sb = questSb({});
r = run(sb, ['--paths', '', '--quests', '111111']);
check('E10 quest named through --quests is checked with no touched files', r.j && r.j.parts === 1 && row(r, 'quest-block') && row(r, 'quest-block').result === 'PASS', JSON.stringify(r.j && r.j.rows));
sb = questSb({});
r = run(sb, []);
check('E11 quest doc modified today is found without --paths', r.j && r.j.rows.some(x => x.rule === 'quest-block'), JSON.stringify(r.j && r.j.rows));

// F. Mapping
sb = mk({});
r = run(sb, ['--paths', 'foo/bar.txt,domain/q/README.md']);
check('F1 unmatched path listed under unmapped, exit unaffected by it', r.j.unmapped.includes('foo/bar.txt'), JSON.stringify(r.j && r.j.unmapped));
r = run(sb, ['--paths', 'foo/bar.txt']);
check('F1b only an unmapped path -> exit 0', r.status === 0 && r.j.parts === 0, 'exit=' + r.status);
r = run(sb, ['--paths', 'domain/x/log.jsonl,system/slips.jsonl,system/registry.jsonl,lib/save-rules.log.jsonl']);
check('F2 ledgers and logs are ignored, not parts', r.j.parts === 0 && r.j.ignored === 4 && r.j.unmapped.length === 0, JSON.stringify({ p: r.j.parts, i: r.j.ignored }));
r = run(sb, ['--paths', 'library-items/agent/x.md']);
check('F3 part with no written rule -> UNRULED, exit 0', r.j.rows.length === 1 && r.j.rows[0].result === 'UNRULED' && r.status === 0, JSON.stringify(r.j && r.j.rows));
sb = mk({ 'keep.txt': 'k' }); gitInit(sb);
r = run(sb, []);
check('F4 nothing touched -> "0 part(s) touched", exit 0', r.j && /^SAVE-RULES: 0 part\(s\) touched/.test(r.j.header) && r.status === 0, r.out.slice(0, 120));
const plain = spawnSync(process.execPath, [SCRIPT, '--paths', ''], { cwd: sb, encoding: 'utf8', env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: sb }) });
check('F4b plain header format', /^SAVE-RULES: 0 part\(s\) touched · 0 PASS · 0 FAIL/.test(plain.stdout), plain.stdout.slice(0, 100));
r = run(mk({ 'domain/w/README.md': FEATURE_README }), ['--paths', 'domain\\w\\README.md,.\\domain\\w\\w.eval.js']);
check('F5 backslash paths are normalised to one part', r.j.parts === 1 && r.j.rows.every(x => x.part === 'domain/w'), JSON.stringify(r.j && r.j.rows.map(x => x.part)));
r = run(mk({}), ['--paths', 'domain/m/a.js,domain/m/b.js,domain/m/c.md,domain/m/README.md']);
check('F6 many files in one part collapse to one part', r.j.parts === 1, 'parts=' + r.j.parts);

// G. Rules file and overrides
sb = mk({ 'x.txt': '' }, { noRules: true });
put(sb, { 'system/save-rules.json': '{ not json' });
r = run(sb, ['--paths', 'x.txt']);
check('G1 malformed save-rules.json -> clear error, exit 2', r.status === 2 && /not valid JSON/.test(r.err), 'exit=' + r.status + ' ' + r.err.slice(0, 80));
const cfg = JSON.parse(fs.readFileSync(path.join(REAL_ROOT, 'system', 'save-rules.json'), 'utf8'));
cfg.kinds[0].rules[0].check = 'no-such-check';
put(sb, { 'system/save-rules.json': JSON.stringify(cfg) });
r = run(sb, ['--paths', 'x.txt']);
check('G2 unknown check id -> clear error, exit 2', r.status === 2 && /unknown check/.test(r.err), 'exit=' + r.status + ' ' + r.err.slice(0, 80));
r = run(mk({}, { noRules: true }), ['--paths', 'x.txt']);
check('G3 missing save-rules.json -> exit 2', r.status === 2, 'exit=' + r.status);
sb = mk({ 'a.txt': 'a', 'domain/p/README.md': FEATURE_README }); gitInit(sb);
put(sb, { 'domain/p/p.eval.js': OK_EVAL }); git(sb, 'add', '-A'); git(sb, 'commit', '-qm', 'second');
r = run(sb, ['--since', 'HEAD~1']);
check('G4 --since HEAD~1 includes the file committed after it', r.j.rows.some(x => x.part === 'domain/p'), JSON.stringify(r.j && r.j.rows.map(x => x.part)));
r = run(sb, []);
check('G4b without --since a clean tree has nothing to check', r.j.parts === 0, 'parts=' + r.j.parts);
r = run(sb, ['--paths', 'domain/p/README.md']);
check('G5 --paths replaces the git set', r.j.parts === 1, 'parts=' + r.j.parts);

// H. Logging and the close-gate marker
sb = mk({ 'domain/de-close-gate/log.jsonl': '', 'lib/keep.txt': 'k' }); gitInit(sb);
r = run(sb, ['--paths', 'lib/keep.txt']);
let gl = fs.readFileSync(path.join(sb, 'domain', 'de-close-gate', 'log.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(x => JSON.parse(x));
check('H1 close-gate marker row written, marked partial for an override run', gl.length === 1 && gl[0].action === 'save-rules-ran' && gl[0].partial === true && typeof gl[0].fail === 'number', JSON.stringify(gl));
r = run(sb, []);
gl = fs.readFileSync(path.join(sb, 'domain', 'de-close-gate', 'log.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(x => JSON.parse(x));
check('H2 a plain run writes a non-partial marker with parts/pass/fail', gl[1] && gl[1].partial === false && 'parts' in gl[1] && 'pass' in gl[1], JSON.stringify(gl[1]));
const own = fs.readFileSync(path.join(sb, 'lib', 'save-rules.log.jsonl'), 'utf8').trim().split('\n').map(x => JSON.parse(x));
check('H3 own log row carries ts, parts, pass, fail, dur_ms', own.length === 2 && ['ts', 'parts', 'pass', 'fail', 'dur_ms'].every(k => k in own[0]), JSON.stringify(own[0]));
sb = mk({});
r = run(sb, ['--paths', 'x.txt']);
check('H4 no close-gate folder -> none is created', !fs.existsSync(path.join(sb, 'domain')), '');

// J. Project folders (kind "projects"; the folder name must be one the real rules file lists)
const PJ = 'projects/coding-projects/active/PymTime';
const DOCS5 = { 'PROJECT.md': '# P\n> Last updated: ' + TODAY + '\n', 'VERSIONS.md': '# V\n', 'ARCHITECTURE.md': 'a\n', 'PROOFS.md': 'p\n', 'ROADMAP.md': 'r\n' };
const MEMPTR = { '.claude/auto-memory/project_x.md': '---\nname: x\ndescription: d\ntype: project\n---\nfolder: projects\\coding-projects\\active\\PymTime\\\n', '.claude/auto-memory/MEMORY.md': '- [x](project_x.md) - x\n' };
function projSandbox(opts) {
  const o = opts || {};
  const repo = fs.mkdtempSync(path.join(TMP, 'repo-'));
  fs.writeFileSync(path.join(repo, 'a.txt'), 'one\n'); gitInit(repo);
  const head = git(repo, 'rev-parse', '--short=7', 'HEAD').stdout.trim();
  const files = Object.assign({}, o.noMem ? {} : MEMPTR);
  for (const [f, c] of Object.entries(DOCS5)) if (f !== o.drop) files[PJ + '/' + f] = f === 'VERSIONS.md' && !o.noSha ? c + '| v1 | ' + head + ' |\n' : f === 'PROJECT.md' && o.projectMd ? o.projectMd : c;
  files[PJ + '/project.json'] = o.manifest !== undefined ? o.manifest : JSON.stringify({ name: 'PymTime', repo: o.repoPath || repo, aliases: ['pymtime'] });
  return { root: mk(files), repo, head };
}
let pj = projSandbox();
r = run(pj.root, ['--paths', PJ + '/PROJECT.md']);
check('J1 complete project folder -> three project rows PASS, exit 0', ['project-docs-present', 'project-docs-current', 'project-memory-pointer'].every(id => row(r, id) && row(r, id).result === 'PASS') && r.status === 0, JSON.stringify(r.j && r.j.rows));
check('J1b the part is the project folder and its kind is projects', row(r, 'project-docs-present').part === PJ && row(r, 'project-docs-present').kind === 'projects', JSON.stringify(row(r, 'project-docs-present')));
pj = projSandbox({ drop: 'ROADMAP.md' });
r = run(pj.root, ['--paths', PJ + '/PROJECT.md']);
check('J2 missing ROADMAP.md -> docs-present FAIL names it', row(r, 'project-docs-present').result === 'FAIL' && /ROADMAP\.md/.test(row(r, 'project-docs-present').detail), JSON.stringify(row(r, 'project-docs-present')));
pj = projSandbox({ noSha: true });
r = run(pj.root, ['--paths', PJ + '/PROJECT.md']);
check('J3 latest repo commit not named in VERSIONS.md -> docs-current FAIL names the commit', row(r, 'project-docs-current').result === 'FAIL' && row(r, 'project-docs-current').detail.includes(pj.head) && r.status === 1, JSON.stringify(row(r, 'project-docs-current')));
pj = projSandbox({ projectMd: '# P\n> Last updated: 2020-01-01\n' });
r = run(pj.root, ['--paths', PJ + '/PROJECT.md']);
check('J3b PROJECT.md dated before the latest commit -> FAIL', row(r, 'project-docs-current').result === 'FAIL' && /2020-01-01/.test(row(r, 'project-docs-current').detail), JSON.stringify(row(r, 'project-docs-current')));
pj = projSandbox({ repoPath: path.join(TMP, 'no-such-repo') });
r = run(pj.root, ['--paths', PJ + '/PROJECT.md']);
check('J4 repo not on this machine -> SKIP, never FAIL', row(r, 'project-docs-current').result === 'SKIP' && r.status === 0, JSON.stringify(row(r, 'project-docs-current')));
pj = projSandbox();
fs.writeFileSync(path.join(pj.repo, 'a.txt'), 'two\n');
r = run(pj.root, ['--paths', PJ + '/PROJECT.md']);
check('J5 uncommitted work, no Work in progress section -> FAIL', row(r, 'project-docs-current').result === 'FAIL' && /uncommitted/.test(row(r, 'project-docs-current').detail), JSON.stringify(row(r, 'project-docs-current')));
put(pj.root, { [PJ + '/PROJECT.md']: '# P\n> Last updated: ' + TODAY + '\n\n## Work in progress\n- a.txt half done\n' });
r = run(pj.root, ['--paths', PJ + '/PROJECT.md']);
check('J5b the same with a Work in progress section -> PASS', row(r, 'project-docs-current').result === 'PASS', JSON.stringify(row(r, 'project-docs-current')));
pj = projSandbox({ noMem: true });
r = run(pj.root, ['--paths', PJ + '/PROJECT.md']);
check('J6 no memory note names the folder -> FAIL', row(r, 'project-memory-pointer').result === 'FAIL', JSON.stringify(row(r, 'project-memory-pointer')));
pj = projSandbox({ noSha: true });
gitInit(pj.root);
{ const old = new Date(Date.now() - 3 * 86400000); const walkOld = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walkOld(p); else fs.utimesSync(p, old, old); } }; walkOld(path.join(pj.root, 'projects')); }
r = run(pj.root, []);
check('J7 no file of this repo changed, the project repo has a commit today -> the project is still found and FAILS docs-current', row(r, 'project-docs-current', PJ) && row(r, 'project-docs-current', PJ).result === 'FAIL', JSON.stringify(r.j && r.j.rows));
pj = projSandbox({ manifest: '{ not json' });
r = run(pj.root, ['--paths', PJ + '/PROJECT.md']);
check('J8 project.json not valid JSON -> docs-present FAIL', row(r, 'project-docs-present').result === 'FAIL' && /parse/.test(row(r, 'project-docs-present').detail), JSON.stringify(row(r, 'project-docs-present')));
pj = projSandbox({ manifest: JSON.stringify({ name: 'PymTime' }) });
r = run(pj.root, ['--paths', PJ + '/PROJECT.md']);
check('J9 project.json without aliases -> docs-present FAIL', row(r, 'project-docs-present').result === 'FAIL' && /aliases/.test(row(r, 'project-docs-present').detail), JSON.stringify(row(r, 'project-docs-present')));
sb = mk({ 'etanah_atlas/x.md': 'x\n', 'system/FOLDER-STRUCTURE.md': '| `etanah_atlas/` | x |\n' });
r = run(sb, ['--paths', 'etanah_atlas/x.md']);
check('J10 etanah_atlas keeps only its owner-row rule (no project-docs rows)', row(r, 'project-owner-row') && !row(r, 'project-docs-present') && !row(r, 'project-docs-current'), JSON.stringify(r.j && r.j.rows));

// I. Parity with the real INDEX.md and the real rules file
const fence = (/```json\s*([\s\S]*?)```/.exec(fs.readFileSync(path.join(REAL_ROOT, 'system', 'INDEX.md'), 'utf8')) || [])[1];
let idx = null; try { idx = JSON.parse(fence); } catch (_) {}
check('I0 INDEX.md map fence parses', idx && idx.kinds, 'no fence');
const SR = require('./save-rules.js');
const classify = SR.makeClassifier(cfg0());
function cfg0() { return JSON.parse(fs.readFileSync(path.join(REAL_ROOT, 'system', 'save-rules.json'), 'utf8')); }
const IGNORED_OK = ['REGISTRY.md', 'quest/active.txt']; // generated file / checked per quest, so ignored on purpose
const drift = [];
for (const [kind, paths] of Object.entries((idx && idx.kinds) || {})) for (const p of paths) {
  const probe = /[^/.]\.\w+$/.test(p) ? p : p + '/probe.md';
  const c = classify(probe);
  if (c.kind !== kind && !(c.ignored && IGNORED_OK.includes(p))) drift.push(p + ' -> ' + (c.kind || (c.ignored ? 'ignored' : 'unmapped')) + ' (INDEX says ' + kind + ')');
}
check('I1 every INDEX.md fence path maps to its own kind in save-rules.json', drift.length === 0, drift.join('; '));
const bad = [];
for (const k of cfg0().kinds) for (const rule of k.rules) for (const m of rule.source.match(/[\w.-]+(?:\/[\w.-]+)+\.(?:json|js|md)/g) || []) if (!fs.existsSync(path.join(REAL_ROOT, ...m.split('/')))) bad.push(rule.id + ': ' + m);
check('I2 every rule source file named in save-rules.json exists', bad.length === 0, bad.join('; '));
check('I3 the real rules file validates', SR.validateConfig(cfg0(), SR.builtinIds()).length === 0, SR.validateConfig(cfg0(), SR.builtinIds()).join('; '));

// Rule 12 table
const okVerdict = SCENARIOS.every(s => /^(handled|fixture-added|accepted-risk: .+)/.test(s[1]));
check('R12 at least 20 adversarial scenarios, each with a verdict', SCENARIOS.length >= 20 && okVerdict, 'n=' + SCENARIOS.length);

if (process.argv.includes('--table')) { console.log('scenario | verdict'); for (const s of SCENARIOS) console.log(s[0] + ' | ' + s[1]); console.log(''); }
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\nsave-rules.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
