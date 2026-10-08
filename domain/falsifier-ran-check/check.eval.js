#!/usr/bin/env node
// check.eval.js — replay + adversarial eval for the falsifier ledger (check.js), its commit wiring
// (compile-gate) and the BA pass note refusal (ticket-close-block).
// Replay case: #244600 — Rubric 2026-10-01 wrote "Falsifier C1: Word no-op save that changes body XML
// beyond rsid/paraId"; the fix shipped 2026-10-02 as d61fc2e611 with local_test_confirmed=false; the
// falsifier was never run; BA failed it 2026-10-03.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fl-eval-'));
const ROOT = path.join(tmp, 'root');
const DOC = path.join(ROOT, 'projects', 'coding-projects', 'active', 'QA-244600', 'QA-244600.md');
fs.mkdirSync(path.dirname(DOC), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'quest'), { recursive: true });
const ENV = { FALSIFIER_ROOT: ROOT, FALSIFIER_ACTIVE: path.join(ROOT, 'quest', 'active.txt'), FALSIFIER_LOG: path.join(tmp, 'log.jsonl'), FALSIFIER_OVERRIDES: path.join(tmp, 'overrides.jsonl') };
Object.assign(process.env, ENV);
const C = require('./check.js');
const CHECK = path.join(__dirname, 'check.js');
const HOOK = path.join(__dirname, '..', 'compile-gate', 'compile-gate.check.hook.js');
const NOTE = path.join(__dirname, '..', 'ticket-close-block', 'ticket-close-block.js');
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const results = [];
function ok(n, c, d) { results.push({ n, pass: !!c, d: d === undefined ? '' : (typeof d === 'string' ? d : JSON.stringify(d)) }); }
const kinds = r => r.fails.map(f => f.kind).sort().join(',');

function active(localTest, extra) {
  fs.writeFileSync(ENV.FALSIFIER_ACTIVE, [
    'qa=QA-111111', 'status=active', 'local_test_confirmed=true', '',
    'qa=QA-244600', 'status=active', 'qa_doc=projects/coding-projects/active/QA-244600/QA-244600.md',
    'local_test_confirmed=' + localTest, 'commit=d61fc2e611', extra || '', '',
  ].join('\n'));
}
const RUBRIC = [
  '# QA-244600 — Sejarah dokumen', '',
  '## Code-Review — Paired Rubric (2026-10-01)', '',
  '| # | Fix | Site | Owner |', '|---|---|---|---|',
  '| R1 | Page-load saves keep the same version | BasePelupusanDokumenForm.java:792 | ours |',
  '| C1 | Editor upload with unchanged content returns the old id | WordEditorService.java:133 | common |', '',
  '- Falsifier C1: Word no-op save that changes body XML beyond rsid/paraId → compare says "changed" → still bumps.', '',
].join('\n');
const HEAD = '## Falsifier ledger\n\nFix files: BasePelupusanDokumenForm.java, MlkKertasTemplateForm.java\n\n| # | design | falsifier | cheapest test | status |\n|---|---|---|---|---|\n';
const row = (n, status, f) => `| ${n} | same-content compare | ${f || 'Word no-change save changes body XML beyond rsid/paraId'} | Word COM re-save of a template + compare | ${status} |\n`;
const doc = body => fs.writeFileSync(DOC, RUBRIC + body);
const cli = args => spawnSync(process.execPath, [CHECK, ...args], { encoding: 'utf8', env: { ...process.env, ...ENV }, timeout: 30000 });
function transcript(name, entries) {
  const p = path.join(tmp, name);
  fs.writeFileSync(p, entries.map(e => JSON.stringify({ type: e[0], message: { role: e[0], content: e[2] ? e[1] : [{ type: 'text', text: e[1] }] } })).join('\n') + '\n');
  return p;
}

// ── 1-3: the #244600 replay ──
active('false'); doc('');
let r = cli(['QA-244600']);
ok('01 REPLAY as shipped (Rubric + falsifier line, no ledger, local test false) BLOCKS', r.status === 1 && /no-ledger/.test(r.stderr) && /local-test/.test(r.stderr), r.status + ' ' + r.stderr.slice(0, 200));
ok('02 REPLAY effect: message names the doc, the re-check command and "no skip token"', /QA-244600\.md/.test(r.stderr) && /check\.js QA-244600/.test(r.stderr) && /no skip token/.test(r.stderr), r.stderr.slice(-260));
doc(HEAD + row(1, 'OPEN'));
r = cli(['QA-244600']);
ok('03 REPLAY with the falsifier as an OPEN ledger row BLOCKS and prints the cheapest test', r.status === 1 && /row 1 OPEN/.test(r.stderr) && /Word COM re-save/.test(r.stderr), r.stderr.slice(0, 300));

// ── 4-13: row statuses ──
active('true');
doc(HEAD + row(1, 'RAN: 2026-10-04 Word COM re-save of Risalat template, body XML identical after rsid strip'));
r = C.check('QA-244600'); ok('04 RAN with evidence + local test true passes', r.ok === true, kinds(r));
doc(HEAD + row(1, 'RAN:')); r = C.check('QA-244600'); ok('05 RAN with no evidence blocks', kinds(r) === 'bad-status', kinds(r));
doc(HEAD + row(1, 'RAN: ok')); r = C.check('QA-244600'); ok('06 RAN with a token word as evidence blocks', kinds(r) === 'bad-status', kinds(r));
doc(HEAD + row(1, 'ACCEPTED-RISK: "ship it, BA will test the editor path" miya 2026-10-04')); r = C.check('QA-244600'); ok('07 ACCEPTED-RISK with quote + name + date passes', r.ok, kinds(r));
doc(HEAD + row(1, 'ACCEPTED-RISK: low risk')); r = C.check('QA-244600'); ok('08 ACCEPTED-RISK without miya quote/date blocks', kinds(r) === 'bad-status', kinds(r));
doc(HEAD + row(1, 'BROKE: 2026-10-04 re-save changed w:lastRenderedPageBreak, compare said changed')); r = C.check('QA-244600'); ok('09 BROKE with no replacement row blocks', kinds(r) === 'broke', kinds(r));
doc(HEAD + row(1, 'BROKE: re-save changed body XML, compare said changed → row 2') + row(2, 'OPEN', 'text + run format compare still differs after a no-change save'));
r = C.check('QA-244600'); ok('10 BROKE → row 2, row 2 OPEN: still blocks on the replacement', kinds(r) === 'open', kinds(r));
doc(HEAD + row(1, 'BROKE: re-save changed body XML, compare said changed → row 2') + row(2, 'RAN: 2026-10-04 same re-save, text+run compare says unchanged'));
r = C.check('QA-244600'); ok('11 BROKE → row 2, row 2 RAN passes', r.ok, kinds(r));
doc(HEAD + row(1, 'SUPERSEDED: row 1')); r = C.check('QA-244600'); ok('12 SUPERSEDED pointing at itself blocks', kinds(r) === 'bad-status', kinds(r));
doc(HEAD + row(1, 'done')); r = C.check('QA-244600'); ok('13 unknown status word blocks (no free-text "done")', kinds(r) === 'bad-status', kinds(r));

// ── 14-19: parsing traps ──
doc(HEAD + row(1, 'RAN: 2026-10-04 re-save run, compare unchanged', 'row stays OPEN in Word when the doc is OPEN \\| locked'));
r = C.check('QA-244600'); ok('14 the word OPEN and an escaped pipe inside the falsifier cell do not flip the status', r.ok, kinds(r));
doc(HEAD + row(1, 'open')); r = C.check('QA-244600'); ok('15 lowercase "open" is OPEN', kinds(r) === 'open', kinds(r));
doc(HEAD); r = C.check('QA-244600'); ok('16 ledger with zero rows blocks', kinds(r) === 'empty-ledger', kinds(r));
doc((HEAD + row(1, 'OPEN')).replace(/\n/g, '\r\n')); r = C.check('QA-244600'); ok('17 CRLF doc parses (OPEN seen)', kinds(r) === 'open', kinds(r));
doc('```\n' + HEAD + row(1, 'RAN: example text inside a code fence only') + '```\n'); r = C.check('QA-244600'); ok('18 a ledger that exists only inside a code fence is not a ledger', kinds(r) === 'no-ledger', kinds(r));
doc(HEAD + row(1, 'OPEN') + '\n## Rework cycle 1\n\n' + HEAD.replace('## ', '### ') + row(2, 'RAN: 2026-10-04 re-save run, compare unchanged'));
r = C.check('QA-244600'); ok('19 a newer ledger section does not hide an older OPEN row', kinds(r) === 'open', kinds(r));

// ── 20-23: design drift ──
const GOOD = HEAD + row(1, 'RAN: 2026-10-04 re-save run, compare unchanged');
doc(GOOD);
r = C.check('QA-244600', { ctx: 'commit', staged: ['src/main/java/x/BasePelupusanDokumenForm.java'] }); ok('20 staged file on the Fix files line passes', r.ok, kinds(r));
r = C.check('QA-244600', { ctx: 'commit', staged: ['src/x/BasePelupusanDokumenForm.java', 'src/x/PelupusanDocumentService.java'] });
ok('21 staged file NOT on the Fix files line blocks as drift and names it', kinds(r) === 'drift' && /PelupusanDocumentService\.java/.test(r.fails[0].msg), r.fails);
r = C.check('QA-244600', { ctx: 'commit', staged: ['src/x/PelupusanDocumentService.java'], merge: true }); ok('22 merge commit skips the drift check', r.ok, kinds(r));
doc(GOOD.replace(/Fix files:.*\n/, '')); r = C.check('QA-244600', { ctx: 'commit', staged: ['a/B.java'] }); ok('23 ledger without a Fix files line blocks a commit', kinds(r) === 'no-fix-files', kinds(r));

// ── 24-31: the local-test override belongs to miya's last message only ──
doc(GOOD); active('false');
r = C.check('QA-244600', { ctx: 'commit' }); ok('24 local_test_confirmed=false blocks a commit even with a clean ledger', kinds(r) === 'local-test', kinds(r));
let tp = transcript('t-assistant.jsonl', [['user', 'commit it'], ['assistant', 'ok [risk-ok: 244600 tested enough]']]);
r = C.check('QA-244600', { ctx: 'commit', transcriptPath: tp }); ok('25 the token in MY OWN text is not an override', kinds(r) === 'local-test', kinds(r));
tp = transcript('t-tool.jsonl', [['user', 'commit it'], ['assistant', 'running'], ['user', [{ type: 'tool_result', content: 'blocked: miya writes [risk-ok: 244600 reason]' }], true]]);
r = C.check('QA-244600', { ctx: 'commit', transcriptPath: tp }); ok('26 the token echoed in a tool result (the gate\'s own help text) is not an override', kinds(r) === 'local-test', kinds(r));
tp = transcript('t-other.jsonl', [['user', '[risk-ok: 282442 BA tests on mlit]']]);
r = C.check('QA-244600', { ctx: 'commit', transcriptPath: tp }); ok('27 a token for another ticket is not an override', kinds(r) === 'local-test', kinds(r));
tp = transcript('t-old.jsonl', [['user', '[risk-ok: 244600 I deploy straight to int-env]'], ['assistant', 'noted'], ['user', 'now commit']]);
r = C.check('QA-244600', { ctx: 'commit', transcriptPath: tp }); ok('28 a token in an OLDER user message (not the last) is not read', kinds(r) === 'local-test', kinds(r));
tp = transcript('t-miya.jsonl', [['assistant', 'local test not run'], ['user', 'go. [risk-ok: 244600 I deploy straight to int-env, BA tests first]']]);
r = C.check('QA-244600', { ctx: 'commit', transcriptPath: tp }); ok('29 the token in miya\'s LAST message clears the local test', r.ok && r.override && /int-env/.test(r.override.reason), r.fails);
r = C.check('QA-244600', { ctx: 'note', codeFix: true }); ok('30 the recorded override carries to the BA pass note (no transcript there)', r.ok, kinds(r));
doc(HEAD + row(1, 'OPEN')); r = C.check('QA-244600', { ctx: 'commit', transcriptPath: tp }); ok('31 miya\'s override NEVER clears an OPEN row', kinds(r) === 'open', kinds(r));
fs.writeFileSync(ENV.FALSIFIER_OVERRIDES, JSON.stringify({ ts: new Date(Date.now() - 80 * 3600 * 1000).toISOString(), qa: 'QA-244600', reason: 'stale' }) + '\n'); doc(GOOD);
r = C.check('QA-244600', { ctx: 'note', codeFix: true }); ok('32 an override older than 72 h no longer counts (a rework needs a fresh one)', kinds(r) === 'local-test', kinds(r));
fs.writeFileSync(ENV.FALSIFIER_OVERRIDES, '');

// ── P1-P10: miya's plain words waive the local test (2026-10-08, #283751) ──
const plainCase = (name, text) => { fs.writeFileSync(ENV.FALSIFIER_OVERRIDES, ''); doc(GOOD); active('false'); return C.check('QA-244600', { ctx: 'commit', transcriptPath: transcript(name, [['assistant', 'fix ready'], ['user', text]]) }); };
r = plainCase('p1.jsonl', 'okay please apply I want to test on server. Must I copy and paste what you mention or can\'t you simply create a gate and then you assess if my phrase mentions [test on server/skip local testing]? Please do so.');
ok('P1 REPLAY #283751: "I want to test on server" in his last message clears the local test', r.ok && r.override && r.override.via === 'plain' && /I want to test on server/.test(r.override.reason), r.fails);
r = plainCase('p2.jsonl', 'skip local testing, deploy it'); ok('P2 "skip local testing" clears it', r.ok && r.override.via === 'plain', r.fails);
r = plainCase('p3.jsonl', 'BA will check it on staging'); ok('P3 "check it on staging" clears it', r.ok, r.fails);
r = plainCase('p4.jsonl', 'can I test on server?'); ok('P4 a QUESTION is not a waiver', kinds(r) === 'local-test', kinds(r));
r = plainCase('p5.jsonl', 'I do not want to test on server yet'); ok('P5 a NEGATED sentence is not a waiver', kinds(r) === 'local-test', kinds(r));
r = plainCase('p6.jsonl', 'let me test locally before we test on server'); ok('P6 "before we test on server" is not a waiver', kinds(r) === 'local-test', kinds(r));
r = plainCase('p7.jsonl', 'for 282442 I will test on server'); ok('P7 a message that names only ANOTHER ticket is not a waiver', kinds(r) === 'local-test', kinds(r));
r = plainCase('p8.jsonl', 'for 244600 I will test on server'); ok('P8 a message that names THIS ticket is a waiver', r.ok, r.fails);
r = plainCase('p9.jsonl', 'what does [test on server/skip local testing] mean'); ok('P9 the phrase inside a bracketed option list alone is not a waiver', kinds(r) === 'local-test', kinds(r));
fs.writeFileSync(ENV.FALSIFIER_OVERRIDES, ''); doc(HEAD + row(1, 'OPEN')); active('false');
r = C.check('QA-244600', { ctx: 'commit', transcriptPath: transcript('p10.jsonl', [['user', 'I want to test on server']]) }); ok('P10 plain words NEVER clear an OPEN row', kinds(r) === 'open', kinds(r));
fs.writeFileSync(ENV.FALSIFIER_OVERRIDES, ''); doc(GOOD); active('false');
r = C.check('QA-244600', { ctx: 'commit', transcriptPath: transcript('p11.jsonl', [['user', 'commit it'], ['assistant', 'he said he will test on server, skip local testing']]) }); ok('P11 the phrase in MY OWN text is not a waiver', kinds(r) === 'local-test', kinds(r));
fs.writeFileSync(ENV.FALSIFIER_OVERRIDES, '');

// ── 33-37: context + lifecycle ──
r = C.check('QA-999999', { ctx: 'commit' }); ok('33 a ticket with no quest block is skipped, not blocked (colleague\'s commit)', r.ok && r.skipped === 'no-quest', r);
fs.unlinkSync(DOC); active('true'); r = C.check('QA-244600', { ctx: 'commit' }); ok('34 a code commit whose quest doc is missing blocks', kinds(r) === 'no-doc', kinds(r));
fs.writeFileSync(DOC, '# QA-244600\n\n## Ticket Summary\nphase 0 only\n'); r = C.check('QA-244600'); ok('35 a Phase-0 doc with no Rubric and no falsifier passes the CLI check', r.ok, kinds(r));
r = C.check('QA-244600', { ctx: 'commit' }); ok('36 the same doc blocks a COMMIT (a fix always needs a ledger)', kinds(r) === 'no-ledger', kinds(r));
ok('37 a worktree root resolves to the main repo (shared active.txt)', C.mainRoot('C:\\x\\MemoryCore\\.claude\\worktrees\\keen-fox') === 'C:\\x\\MemoryCore', C.mainRoot('C:\\x\\MemoryCore\\.claude\\worktrees\\keen-fox'));
r = cli([]); ok('38 CLI with no ticket is a usage error (exit 2), never a pass', r.status === 2, r.status);
const rows = fs.readFileSync(ENV.FALSIFIER_LOG, 'utf8').trim().split('\n').map(JSON.parse);
ok('39 every check wrote a log row with outcome + dur_ms (Rule 5)', rows.length > 30 && rows.filter(x => x.qa === 'QA-244600').every(x => x.outcome && (typeof x.dur_ms === 'number' || x.why)), rows.length);

// ── 40-45: wiring, end to end (fire + effect) ──
const repo = path.join(tmp, 'etanah-pelupusan');
fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
const g = (...a) => spawnSync('git', ['-C', repo, ...a], { encoding: 'utf8' });
spawnSync('git', ['init', '-q', repo]);
g('remote', 'add', 'origin', '10.16.63.27:etanah/etanah-pelupusan.git');
fs.writeFileSync(path.join(repo, 'src', 'BasePelupusanDokumenForm.java'), 'class A {}');
g('add', '.'); g('-c', 'user.name=ridhwan-eval', '-c', 'user.email=e@e', 'commit', '-q', '-m', 'QA #244600 - PLTP - base');
g('checkout', '-q', '-b', 'mlk/qa/244600v3');
fs.writeFileSync(path.join(repo, 'src', 'BasePelupusanDokumenForm.java'), 'class A { int x; }'); g('add', '.');
const hook = (cmd, t) => spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'PowerShell', tool_input: { command: cmd }, cwd: tmp, transcript_path: t }), encoding: 'utf8', timeout: 60000, env: { ...process.env, ...ENV, CLAUDE_PROJECT_DIR: REPO_ROOT } });
const bypassT = transcript('t-bypass.jsonl', [['user', 'commit'], ['assistant', '[skip-compile-gate: eval fixture, no maven here]']]);
active('false'); doc(HEAD + row(1, 'OPEN'));
r = hook(`cd ${repo}; git commit -q -m "QA #244600 - PLTP - x"`, bypassT);
ok('40 HOOK: #244600 commit with an OPEN row + local test false is BLOCKED (exit 2), even with the compile bypass token', r.status === 2 && /falsifier-ledger/.test(r.stderr) && /row 1 OPEN/.test(r.stderr) && /local-test/.test(r.stderr), r.status + ' ' + r.stderr.slice(0, 240));
active('true'); doc(GOOD);
r = hook(`cd ${repo}; git commit -q -m "QA #244600 - PLTP - x"`, bypassT);
ok('41 HOOK: clean ledger + local test true lets the commit through (exit 0)', r.status === 0, r.status + ' ' + r.stderr.slice(0, 200));
r = hook(`cd ${repo}; git add . ; git commit -q -m "QA #244600 - PLTP - x"`, bypassT);
ok('42 HOOK: add + commit in one command is blocked (drift check needs the staged list)', r.status === 2 && /stage first/.test(r.stderr), r.status + ' ' + r.stderr.slice(0, 160));
r = hook(`cd ${repo}; git status`, bypassT);
ok('43 HOOK: a non-commit git command is untouched', r.status === 0 && !/falsifier/.test(r.stderr), r.status);
const note = () => spawnSync(process.execPath, [NOTE, '--repo', repo, '--ticket', '244600', '--module', 'pelupusan', '--branch', 'mlk/qa/244600v3', '--ba', 'Fizah', '--ours-author', 'ridhwan-eval'], { encoding: 'utf8', env: { ...process.env, ...ENV }, timeout: 30000 });
g('-c', 'user.name=ridhwan-eval', '-c', 'user.email=e@e', 'commit', '-q', '-m', 'QA #244600 - PLTP - fix');
active('false'); doc(HEAD + row(1, 'OPEN')); r = note();
ok('44 NOTE: the BA pass note is REFUSED (exit 3, no "Salam" printed) for the #244600 replay', r.status === 3 && !/Salam/.test(r.stdout) && /BA pass note refused/.test(r.stderr), r.status + ' ' + r.stdout.slice(0, 80));
active('true'); doc(GOOD); r = note();
ok('45 NOTE: clean ledger + local test true prints the note', r.status === 0 && /Salam Fizah/.test(r.stdout), r.status + ' ' + r.stderr.slice(0, 160));

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nfalsifier-ledger check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
