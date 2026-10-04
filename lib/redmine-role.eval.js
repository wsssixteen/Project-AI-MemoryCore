#!/usr/bin/env node
/**
 * lib/redmine-role.eval.js — fixtures for lib/redmine-role.js and its three callers.
 *
 * Nothing here touches Redmine or miya's real Task folders: rosters, History files, an
 * active.txt and a copy of the objective-anchor hook live in a temp sandbox.
 * Scenario numbers (S1..S21) match the adversarial table shown to miya on 2026-10-04.
 *
 * Run: node lib/redmine-role.eval.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const SB = fs.mkdtempSync(path.join(os.tmpdir(), 'redmine-role-eval-'));
const KROOT = path.join(SB, 'knowledge');
const today = new Date().toISOString().slice(0, 10);

const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail === undefined ? '' : String(detail) }); }
function write(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text, 'utf8'); }
function roster(state, refreshed, rows, header) {
  write(path.join(KROOT, state, 'REDMINE-PEOPLE.md'), [
    '# REDMINE-PEOPLE', '', `Refreshed: ${refreshed} by generator.`, '',
    header || '| Name | Class | Redmine roles | Projects | Id |', '|---|---|---|---|---|',
    ...rows.map(r => `| ${r.join(' | ')} |`), '',
  ].join('\n'));
}

const MLK_ROWS = [
  ['ITSO Melaka Admin', 'TSO', 'help_mlk', 'helpdesk', '1268'],
  ['Amila Qistina Rohizat', 'TSO', 'TSO', 'helpdesk', '900'],
  ['Nurul Amirah Nadiah', 'BA', 'Business Analyst', 'helpdesk', '901'],
  ['Nurhafizah Hasan', 'BA', 'Business Analyst', 'helpdesk', '902'],
  ['Adlina Afendi (Ed)', 'BA', 'Business Analyst', 'helpdesk', '903'],
  ['Ahmad Ridhwan Anuar (Dev PLP)', 'Developer', 'Software Developer', 'helpdesk', '1311'],
  ['Nurul Amani', 'QA', 'Quality Assurance', 'helpdesk', '904'],
  ['Siti Aminah (BA)', 'BA', 'Business Analyst', 'helpdesk', '905'],
  ['Siti Aminah (Dev)', 'Developer', 'Software Developer', 'helpdesk', '906'],
  ['Two State Person', 'BA', 'Business Analyst', 'helpdesk', '907'],
];
const TRG_ROWS = [
  ['Two State Person', 'TSO', 'TSO', 'esokongan', '907'],
  ['Trg Only Tso', 'TSO', 'TSO', 'esokongan', '950'],
];
roster('melaka', today, MLK_ROWS);
roster('terengganu', today, TRG_ROWS);

process.env.KNOWLEDGE_ROOT = KROOT;
const R = require('./redmine-role.js');
const of = (n, o) => R.roleOf(n, o || { state: 'melaka' });
const t = (n, o) => R.tag(of(n, o));

// ---------- names ----------
check('S1 name with a role suffix is found exactly', of('Ahmad Ridhwan Anuar (Dev PLP)').cls === 'Developer', t('Ahmad Ridhwan Anuar (Dev PLP)'));
check('S2 the same person without the suffix (old journals)', of('Ahmad Ridhwan Anuar').cls === 'Developer', t('Ahmad Ridhwan Anuar'));
check('S3 roster name with a nickname suffix, journal without it', of('Adlina Afendi').cls === 'BA', t('Adlina Afendi'));
check('S4 double space and tab inside a name', of('Nurul  Amani').cls === 'QA' && of('Nurul \t Amani').cls === 'QA', t('Nurul  Amani'));
const amb = of('Siti Aminah');
check('S5 one loose name in two classes is ambiguous, never picked', amb.cls === 'unknown' && !amb.isBA && /ambiguous: /.test(R.tag(amb)), R.tag(amb));
check('S8 shared account keeps its role and says shared', t('ITSO Melaka Admin') === 'TSO, shared account', t('ITSO Melaka Admin'));
check('S13 a deleted user ("Unknown") is role unknown', of('Unknown').cls === 'unknown' && of('').cls === 'unknown' && of(null).cls === 'unknown', t('Unknown'));
check('not in the roster is role unknown, never BA', t('Somebody Nobody') === 'role unknown, not in roster' && !of('Somebody Nobody').isBA, t('Somebody Nobody'));
check('match by Redmine id beats a renamed display name', R.roleOf('Renamed Person', { state: 'melaka', id: 901 }).cls === 'BA', R.tag(R.roleOf('Renamed Person', { state: 'melaka', id: 901 })));

// ---------- states ----------
check('S11 a Terengganu ticket reads the Terengganu roster first', of('Two State Person', { state: 'terengganu' }).cls === 'TSO' && of('Two State Person', { state: 'melaka' }).cls === 'BA', t('Two State Person', { state: 'terengganu' }));
const cross = of('Nurul Amirah Nadiah', { state: 'terengganu' });
check('S11b a BA from another state is still a BA, and the source is named', cross.isBA && /from melaka roster/.test(R.tag(cross)), R.tag(cross));
const unk = R.roleOf('Two State Person', {});
check('S12 state unknown and the rosters disagree is ambiguous', unk.cls === 'unknown' && /ambiguous/.test(R.tag(unk)), R.tag(unk));
const unk2 = R.roleOf('Trg Only Tso', {});
check('S12b state unknown and one answer says where it came from', unk2.cls === 'TSO' && /state unknown, from terengganu roster/.test(R.tag(unk2)), R.tag(unk2));
check('S20 a worktree path resolves to the main checkout', require('./states.js').mainRoot(path.join('X', '.claude', 'worktrees', 'abc')) === 'X', require('./states.js').mainRoot(path.join('X', '.claude', 'worktrees', 'abc')));

// ---------- generator classes (S9, S10) ----------
const { classify } = require('../quest/redmine-people.js');
check('S9 Software Developer + Business Analyst is Developer', classify(new Set(['Software Developer', 'Business Analyst'])) === 'Developer', '');
check('S10 a help_* role outranks Software Developer (TSO)', classify(new Set(['Software Developer', 'help_mlk'])) === 'TSO' && classify(new Set(['help_trg'])) === 'TSO', '');
check('BA only when Business Analyst is the only role', classify(new Set(['Business Analyst'])) === 'BA' && classify(new Set(['Business Analyst', 'Quality Assurance'])) === 'QA', '');

// ---------- History blocks ----------
const H = (...entries) => ['Redmine ticket journal — synced 2026-10-04T00:00:00.000Z', 'Issue: ESOKONGAN #900001 — fixture', 'Status: In Progress | Last updated: 2026-10-01T00:00:00Z',
  'Description by: ITSO Melaka Admin [TSO, shared account] — a TSO report, not the BA spec. A BA journal Issue/Expected list outranks it.',
  '─'.repeat(70), '', ...entries.map(e => [`--- ${e.ts} by ${e.by} ---`, ...(e.role ? [`  [role] ${e.role}`] : []), '  notes:', ...e.lines.map(l => '    ' + l), ''].join('\n'))].join('\n');
const list = (word, ...items) => [`*${word}:*`, ...items.map((x, i) => `${i + 1}. ${x}`), ''];

const hTso = H({ ts: '2026-09-01T01:00:00Z', by: 'ITSO Melaka Admin', lines: [...list('Issue', 'screen is wrong'), ...list('Expected', 'screen is right')] });
let s = R.specFromHistory(hTso, 'melaka');
check('TSO-only list is a report, not the BA spec', s.issue && !s.issue.isSpec && R.headline('issue', s.issue).startsWith('TSO REPORT (not the BA spec)'), s.issue && R.headline('issue', s.issue));

const hBoth = H(
  { ts: '2026-09-01T01:00:00Z', by: 'ITSO Melaka Admin', lines: list('Issue', 'tso wording') },
  { ts: '2026-09-02T01:00:00Z', by: 'Nurul Amirah Nadiah', lines: [...list('Issue', 'ba item one', 'ba item two'), ...list('Expected', 'ba expected one')] },
);
s = R.specFromHistory(hBoth, 'melaka');
check('a BA list is labelled BA ISSUES with name, date and role', R.headline('issue', s.issue) === 'BA ISSUES (verbatim, 2026-09-02T01:00:00Z, by Nurul Amirah Nadiah, BA)' && s.issue.block.items.length === 2 && !s.issue.newer, R.headline('issue', s.issue));
check('BA EXPECTED carries the same author line', R.headline('expected', s.expected) === 'BA EXPECTED (verbatim, 2026-09-02T01:00:00Z, by Nurul Amirah Nadiah, BA)', R.headline('expected', s.expected));

const hNewerDev = H(
  { ts: '2026-09-02T01:00:00Z', by: 'Nurul Amirah Nadiah', lines: list('Issue', 'ba item') },
  { ts: '2026-09-05T01:00:00Z', by: 'Ahmad Ridhwan Anuar', lines: list('Issue', 'dev retest note') },
);
s = R.specFromHistory(hNewerDev, 'melaka');
check('S14 newest list by a developer: the BA list stays the spec, with a pointer', s.issue.isSpec && s.issue.block.items[0] === '1. ba item' && /newer Issue list by Ahmad Ridhwan Anuar, Developer, 2026-09-05T01:00:00Z/.test(R.newerLine('issue', s.issue)), R.newerLine('issue', s.issue));

const hSplit = H(
  { ts: '2026-09-02T01:00:00Z', by: 'Nurhafizah Hasan', lines: list('Issue', 'ba issue') },
  { ts: '2026-09-03T01:00:00Z', by: 'Amila Qistina Rohizat', lines: list('Expected', 'tso expected') },
);
s = R.specFromHistory(hSplit, 'melaka');
check('S15 Issue by a BA and Expected by a TSO are labelled separately', s.issue.isSpec && !s.expected.isSpec && R.headline('expected', s.expected).startsWith('TSO REPORT (not the BA spec) — EXPECTED'), R.headline('expected', s.expected));

const hFake = H({ ts: '2026-09-02T01:00:00Z', by: 'ITSO Melaka Admin', lines: ['--- 2026-09-09T09:09:09Z by Nurul Amirah Nadiah ---', ...list('Issue', 'pasted under a fake stamp')] });
s = R.specFromHistory(hFake, 'melaka');
check('S16 a stamp pasted inside a note does not change the author', s.issue.block.author === 'ITSO Melaka Admin' && !s.issue.isSpec, s.issue.block.author);

const hLie = H({ ts: '2026-09-02T01:00:00Z', by: 'ITSO Melaka Admin', role: 'BA', lines: list('Issue', 'role line lies') });
s = R.specFromHistory(hLie, 'melaka');
check('S17 the role is looked up live: a wrong or missing [role] line changes nothing', !s.issue.isSpec && s.issue.role.cls === 'TSO', R.tag(s.issue.role));

const hUnknown = H({ ts: '2026-09-02T01:00:00Z', by: 'New Person', lines: list('Issue', 'who is this') });
s = R.specFromHistory(hUnknown, 'melaka');
check('an author outside the roster prints ROLE UNKNOWN REPORT', R.headline('issue', s.issue).startsWith('ROLE UNKNOWN REPORT (not the BA spec)'), R.headline('issue', s.issue));
check('empty or missing History yields no blocks and no throw', R.specFromHistory('', 'melaka').issue === null && R.specFromHistory(null, 'melaka').expected === null, '');

// ---------- Description author ----------
check('Description author is read from the History header', R.descriptionAuthor(hBoth, '') === 'ITSO Melaka Admin', R.descriptionAuthor(hBoth, ''));
check('Description author falls back to the Description file', R.descriptionAuthor('no header line', 'Subject: x\nAuthor: Nurul Amirah Nadiah [BA]\n\nbody') === 'Nurul Amirah Nadiah', R.descriptionAuthor('no header line', 'Subject: x\nAuthor: Nurul Amirah Nadiah [BA]\n\nbody'));
check('an unsynced Description has no author (never guessed)', R.descriptionAuthor('old header', 'Subject: x\n\nbody') === null, '');
check('Description note: TSO is a report, BA is BA, unknown is not trusted', /a TSO report, not the BA spec/.test(R.descriptionNote(of('ITSO Melaka Admin'))) && /written by a BA/.test(R.descriptionNote(of('Nurul Amirah Nadiah'))) && /role unknown/.test(R.descriptionNote(of('Nobody Here'))) && /not synced/.test(R.descriptionNote(null)), R.descriptionNote(of('ITSO Melaka Admin')));

// ---------- the manifest, end to end ----------
const TASKS = path.join(SB, '1. Tasks', 'Melaka');
const TF_DIR = path.join(TASKS, '900001. ES #900001 - fixture');
write(path.join(TF_DIR, '1. Brief', 'History.txt'), hSplit);
write(path.join(TF_DIR, '1. Brief', 'Description.txt'), 'Ticket: ESOKONGAN #900001\nSubject: fixture\n\nIssue:\n1) from the TSO');
{
  const r = spawnSync(process.execPath, [path.join(REPO, 'quest', 'ticket-load-verify.js'), '900001'], { encoding: 'utf8', env: { ...process.env, TLV_TASKS_ROOT: TASKS, KNOWLEDGE_ROOT: KROOT }, windowsHide: true });
  const out = (r.stdout || '') + (r.stderr || '');
  check('manifest A: each author carries a role', /A1\. \S+  Nurhafizah Hasan \[BA\]/.test(out) && /A2\. \S+  Amila Qistina Rohizat \[TSO\]/.test(out), out.slice(0, 600));
  check('manifest B: the Description is named as a TSO report', out.includes('by ITSO Melaka Admin [TSO, shared account] — a TSO report, not the BA spec.'), out.slice(0, 900));
  check('manifest B2: Issue is the BA spec, Expected is a TSO report', /Issue   : BA ISSUES \(verbatim, .*by Nurhafizah Hasan, BA\)/.test(out) && /Expected: TSO REPORT \(not the BA spec\)/.test(out), out.slice(0, 1200));
  const j = spawnSync(process.execPath, [path.join(REPO, 'quest', 'ticket-load-verify.js'), '900001', '--json'], { encoding: 'utf8', env: { ...process.env, TLV_TASKS_ROOT: TASKS, KNOWLEDGE_ROOT: KROOT }, windowsHide: true });
  let parsed = null; try { parsed = JSON.parse(j.stdout); } catch (_) { parsed = null; }
  check('manifest --json keeps its old keys and adds the two new ones', parsed && parsed.journals === 2 && parsed.cycle && parsed.descriptionBy.role === 'TSO' && parsed.specSource[0].isBaSpec === true && parsed.specSource[1].isBaSpec === false, j.stdout.slice(0, 300));
}

// ---------- the objective-anchor hook, end to end (a sandbox copy, so it reads a fixture active.txt) ----------
function runHook(kroot) {
  const HB = fs.mkdtempSync(path.join(SB, 'hook-'));
  write(path.join(HB, '.claude', 'hooks', 'quest-objective-anchor.js'), fs.readFileSync(path.join(REPO, '.claude', 'hooks', 'quest-objective-anchor.js'), 'utf8'));
  for (const f of ['redmine-role.js', 'states.js', 'task-folder.js']) write(path.join(HB, 'lib', f), fs.readFileSync(path.join(REPO, 'lib', f), 'utf8'));
  write(path.join(HB, 'system', 'states.json'), fs.readFileSync(path.join(REPO, 'system', 'states.json'), 'utf8'));
  const tf2 = path.join(TASKS, '900002. ES #900002 - both');
  write(path.join(tf2, '1. Brief', 'History.txt'), hNewerDev);
  const tf3 = path.join(TASKS, '900003. ES #900003 - tso only');
  write(path.join(tf3, '1. Brief', 'History.txt'), hTso);
  write(path.join(HB, 'quest', 'active.txt'), [
    'qa=QA-900002', 'status=active', 'phase=0', `task_folder=${tf2}`, 'issue_one_liner=fixture both', '',
    'qa=QA-900003', 'status=active', 'phase=0', `task_folder=${tf3}`, 'issue_one_liner=fixture tso only', '',
  ].join('\n'));
  const env = { ...process.env, KNOWLEDGE_ROOT: kroot, STATES_FILE: path.join(HB, 'system', 'states.json') };
  delete env.CLAUDE_PROJECT_DIR; delete env.STATES_ROOT; delete env.ETANAH_STATE;
  const r = spawnSync(process.execPath, [path.join(HB, '.claude', 'hooks', 'quest-objective-anchor.js')], { encoding: 'utf8', input: '{}', env, windowsHide: true });
  let log = '';
  try { log = fs.readFileSync(path.join(HB, 'domain', 'quest-objective-anchor', 'log.jsonl'), 'utf8'); } catch (_) { log = ''; }
  return { status: r.status, out: r.stdout || '', err: r.stderr || '', log };
}
{
  const h = runHook(KROOT);
  check('hook fires: exit 0 and both quests locked', h.status === 0 && /OBJECTIVE LOCK — QA-900002/.test(h.out) && /OBJECTIVE LOCK — QA-900003/.test(h.out), h.err || h.out.slice(0, 300));
  check('hook effect: the BA list is labelled with name and role', h.out.includes('BA ISSUES (verbatim, 2026-09-02T01:00:00Z, by Nurul Amirah Nadiah, BA):') && h.out.includes('      1. ba item'), h.out.slice(0, 700));
  check('hook effect: the newer developer list gets one pointer line, not its items', /↳ newer Issue list by Ahmad Ridhwan Anuar, Developer/.test(h.out) && !h.out.includes('dev retest note'), h.out.slice(0, 700));
  check('hook effect: a TSO-only list prints TSO REPORT (not the BA spec)', h.out.includes('TSO REPORT (not the BA spec) — ISSUES (verbatim, 2026-09-01T01:00:00Z, by ITSO Melaka Admin, TSO, shared account):') && h.out.includes('no BA list of this kind in the journal'), h.out.slice(0, 1200));
  check('hook effect: no line calls the TSO list "BA ISSUES"', !/BA ISSUES[^\n]*ITSO/.test(h.out), '');
  check('hook keeps Rules 1-4', /1\. The reported symptom is GROUND TRUTH/.test(h.out) && /4\. ANY scope-contraction/.test(h.out), '');
  check('hook log carries author and role', /"issueBy":"Nurul Amirah Nadiah"/.test(h.log) && /"issueRole":"TSO"/.test(h.log) && /"issueIsBaSpec":false/.test(h.log), h.log.slice(0, 400));
}

// ---------- roster trouble (last: these swap the roster files) ----------
roster('melaka', '2026-01-01', MLK_ROWS);
R.resetCache();
check('S7 a roster older than 7 days still answers and says stale', t('Nurul Amirah Nadiah') === 'BA, roster stale 2026-01-01', t('Nurul Amirah Nadiah'));
roster('melaka', today, [['x', 'y', 'z']], '| Person | Kind | Other |');
R.resetCache();
check('S19 a changed table header yields role unknown, no throw', of('Nurul Amirah Nadiah').cls === 'unknown', t('Nurul Amirah Nadiah'));
{
  const EMPTY = path.join(SB, 'no-knowledge');
  fs.mkdirSync(EMPTY, { recursive: true });
  process.env.KNOWLEDGE_ROOT = EMPTY;
  R.resetCache();
  const m = of('Nurul Amirah Nadiah');
  check('S6 roster missing is role unknown and says so', m.cls === 'unknown' && !m.isBA && /roster missing/.test(R.tag(m)), R.tag(m));
  const h = runHook(EMPTY);
  check('S6 hook with no roster never prints a BA label', h.status === 0 && !/BA ISSUES/.test(h.out) && /ROLE UNKNOWN REPORT \(not the BA spec\)/.test(h.out), h.out.slice(0, 500));
  process.env.KNOWLEDGE_ROOT = KROOT;
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.name + (x.pass ? '' : ' → ' + x.detail)); }
console.log('\nredmine-role.eval: ' + (results.length - failed) + '/' + results.length + ' green');
try { fs.rmSync(SB, { recursive: true, force: true }); } catch (_) { /* temp dir, best effort */ }
process.exit(failed ? 1 : 0);
