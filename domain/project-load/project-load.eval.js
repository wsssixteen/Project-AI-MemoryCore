#!/usr/bin/env node
// project-load.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-10-08 miya: 'Let's continue PymTime' in a new session must load the project folder; the PymTime folder went unread and stale for six weeks while everything went into one memory note
// Every fixture is a real stdin -> stdout round trip through the registered hook file, against a temp project tree.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'project-load.check.hook.js');
const ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12 (scenario | verdict) ═══
const SCENARIOS = [
  ['Alias in another case (PYMTIME, pymtime)', 'fixture-added (S1)'],
  ['Alias inside a longer word (pymtimer, mypymtime)', 'fixture-added (S2, silent)'],
  ['Alias made of several words', 'fixture-added (S3)'],
  ['Folder without project.json (a quest folder such as QA-123)', 'fixture-added (S4, silent)'],
  ['project.json that is not valid JSON', 'fixture-added (S5, silent, exit 0)'],
  ['project.json with no aliases', 'fixture-added (S6, the name alone still matches)'],
  ['Two projects named in one prompt', 'fixture-added (S7, one block each)'],
  ['Second prompt in the same session inside the re-arm time', 'fixture-added (S8, silent)'],
  ['Same project named in a different session', 'fixture-added (S9, fires)'],
  ['Re-arm time passed (a compaction may have dropped the context)', 'fixture-added (S10, fires again)'],
  ['Bypass token with a reason', 'fixture-added (S11, silent)'],
  ['Bypass token with an empty reason', 'fixture-added (S12, still fires)'],
  ['Stdin that is not JSON', 'fixture-added (S13, exit 0, silent)'],
  ['JSON without a prompt field', 'fixture-added (S14)'],
  ['Very large prompt (2 MB) that names the project', 'fixture-added (S15, fires under 5 s)'],
  ['The project folder has no PROJECT.md', 'fixture-added (S16, says the index is missing)'],
  ['The projects folder does not exist at all', 'fixture-added (S17, silent, exit 0)'],
  ['Session runs in a folder under .claude/worktrees', 'fixture-added (S18, the main checkout is resolved)'],
  ['Alias shorter than 3 letters', 'fixture-added (S19, ignored)'],
  ["The hook's own injected text pasted back", 'fixture-added (S20, silent inside the re-arm time)'],
  ['The log folder cannot be created', 'fixture-added (S21, still fires)'],
  ['Unrelated prompt (a ticket number)', 'fixture-added (S22, silent)'],
  ['hook-runtime.js missing or renamed', 'accepted-risk: the same dependency every native hook has; the boot audit reports it'],
  ['Two sessions fire at the same moment', 'accepted-risk: one short log line per append; a lost line only means one extra announcement'],
  ['miya says not to load the project this turn', 'handled: the bypass token; the block is advisory, never a block'],
];

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'project-load-eval-'));
let seq = 0;
function tree(projects) {
  const main = path.join(TMP, 'm' + (++seq));
  const act = path.join(main, 'projects', 'coding-projects', 'active');
  fs.mkdirSync(act, { recursive: true });
  for (const [dir, spec] of Object.entries(projects || {})) {
    fs.mkdirSync(path.join(act, dir), { recursive: true });
    if (spec.manifest !== undefined) fs.writeFileSync(path.join(act, dir, 'project.json'), typeof spec.manifest === 'string' ? spec.manifest : JSON.stringify(spec.manifest));
    if (spec.index !== false) fs.writeFileSync(path.join(act, dir, 'PROJECT.md'), '# index\n');
  }
  return main;
}
const PYM = { PymTime: { manifest: { name: 'PymTime', aliases: ['pymtime', 'protime clock-in app', 'pt'] } } };
function ask(main, prompt, opts) {
  const o = opts || {};
  const env = Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: ROOT, PROJECT_LOAD_MAIN_ROOT: main, PROJECT_LOAD_LOG: o.log || path.join(main, 'log.jsonl') }, o.env || {});
  const stdin = o.raw !== undefined ? o.raw : JSON.stringify(Object.assign({ hook_event_name: 'UserPromptSubmit', session_id: o.session || 's1' }, prompt === null ? {} : { prompt }));
  const r = spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const fired = (o) => /project-load: /.test(o.out);

// F1: clean input -> must NOT fire (exit 0)
let m = tree(PYM);
let r = ask(m, null, { raw: '{}' });
check('F1 clean input exits 0 (no false fire)', r.status === 0 && !fired(r), 'exit=' + r.status);
// F2: the replay case
r = ask(m, "Let's continue PymTime.");
check('F2 replay: "Let\'s continue PymTime" names the index at its full path in the main checkout and the three documents to update', r.status === 0 && fired(r) && r.out.includes(path.join(m, 'projects', 'coding-projects', 'active', 'PymTime', 'PROJECT.md')) && /READ FIRST/.test(r.out) && /VERSIONS\.md row/.test(r.out) && /ROADMAP\.md status/.test(r.out), r.out.slice(0, 300));

m = tree(PYM); check('S1 other letter case fires', fired(ask(m, 'did PYMTIME run today')));
m = tree(PYM); check('S2 alias inside a longer word is silent', !fired(ask(m, 'the pymtimer and mypymtime words')));
m = tree(PYM); check('S3 several-word alias fires', fired(ask(m, 'open the Protime clock-in app please')));
m = tree({ 'QA-123456': { index: true }, PymTime: PYM.PymTime }); check('S4 folder without project.json never fires on its own name', !fired(ask(m, 'continue QA-123456')));
m = tree({ PymTime: { manifest: '{ not json' } }); r = ask(m, 'continue pymtime'); check('S5 broken project.json is silent, exit 0', r.status === 0 && !fired(r), 'exit=' + r.status);
m = tree({ WaRead: { manifest: { name: 'WaRead' } } }); check('S6 no aliases: the name alone matches', fired(ask(m, 'work on waread now')));
m = tree({ PymTime: PYM.PymTime, WaRead: { manifest: { name: 'WaRead', aliases: ['waread'] } } }); r = ask(m, 'compare pymtime and waread');
check('S7 two projects named: one block each', (r.out.match(/project-load: /g) || []).length === 2 && /PymTime is a project/.test(r.out) && /WaRead is a project/.test(r.out), r.out.slice(0, 200));
m = tree(PYM); ask(m, 'continue pymtime'); check('S8 second prompt in the same session is silent', !fired(ask(m, 'pymtime again')));
check('S9 a different session fires', fired(ask(m, 'pymtime status', { session: 's2' })));
m = tree(PYM); fs.writeFileSync(path.join(m, 'log.jsonl'), JSON.stringify({ ts: new Date(Date.now() - 31 * 60000).toISOString(), action: 'fired', session: 's1', project: 'PymTime' }) + '\n');
check('S10 after the re-arm time it fires again', fired(ask(m, 'back to pymtime')));
m = tree(PYM); check('S11 bypass token with a reason is silent', !fired(ask(m, 'pymtime [skip-project-load: only a status question]')));
m = tree(PYM); check('S12 empty bypass reason does not disarm', fired(ask(m, 'pymtime [skip-project-load: ]')));
m = tree(PYM); r = ask(m, null, { raw: 'this is not json pymtime' }); check('S13 stdin that is not JSON exits 0 and is silent', r.status === 0 && !fired(r));
m = tree(PYM); r = ask(m, null); check('S14 no prompt field is silent', r.status === 0 && !fired(r));
m = tree(PYM); { const t0 = Date.now(); r = ask(m, 'x'.repeat(2 * 1024 * 1024) + ' pymtime'); check('S15 2 MB prompt fires in under 5 s', fired(r) && Date.now() - t0 < 5000, (Date.now() - t0) + ' ms'); }
m = tree({ PymTime: { manifest: PYM.PymTime.manifest, index: false } }); r = ask(m, 'continue pymtime'); check('S16 no PROJECT.md: says the index is MISSING', fired(r) && /MISSING/.test(r.out) && !/READ FIRST/.test(r.out), r.out.slice(0, 200));
{ const empty = path.join(TMP, 'none'); fs.mkdirSync(empty); r = ask(empty, 'continue pymtime'); check('S17 no projects folder: silent, exit 0', r.status === 0 && !fired(r)); }
{ const H = require(HOOK); const wt = path.join('X:', 'repo', '.claude', 'worktrees', 'some-session-1a2b3c'); const got = String(H.mainRootOf(wt)).replace(/[\\/]+$/, ''); check('S18 a session folder under .claude/worktrees resolves to the main checkout', got === path.join('X:', 'repo'), got); }
m = tree(PYM); check('S19 an alias shorter than 3 letters is ignored ("pt")', !fired(ask(m, 'what is pt doing')));
m = tree(PYM); { const own = ask(m, 'continue pymtime').out; check('S20 own injected text pasted back in the same session is silent', !fired(ask(m, own))); }
m = tree(PYM); { const blocker = path.join(m, 'blocked'); fs.writeFileSync(blocker, 'a file where a folder is wanted'); r = ask(m, 'continue pymtime', { log: path.join(blocker, 'sub', 'log.jsonl') }); check('S21 unwritable log: still fires, exit 0', r.status === 0 && fired(r), 'exit=' + r.status); }
m = tree(PYM); check('S22 unrelated ticket prompt is silent', !fired(ask(m, 'QA-281650 MLPS patch tempat, continue')));
m = tree(PYM); ask(m, 'continue pymtime'); { const row = JSON.parse(fs.readFileSync(path.join(m, 'log.jsonl'), 'utf8').trim().split('\n')[0]); check('L1 a fire writes one log row with ts, action, session, project, index_exists', row.action === 'fired' && row.session === 's1' && row.project === 'PymTime' && row.index_exists === true && !!row.ts, JSON.stringify(row)); }

// Registration and the real project
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
const regs = (settings.hooks.UserPromptSubmit || []).flatMap(g => g.hooks || []).filter(h => /project-load\.check\.hook\.js/.test(h.command || ''));
check('R1 registered once under UserPromptSubmit in .claude/settings.json', regs.length === 1, regs.length + ' registrations');
const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
check('R2 README carries goal, retention and footprint lines and no TODO', /^goal: /m.test(readme) && /^retention: /m.test(readme) && /^footprint: /m.test(readme) && !/TODO\(forge/.test(readme));
check('R3 NUKE-MARKER.md present', fs.existsSync(path.join(__dirname, 'NUKE-MARKER.md')));
{ // the real PymTime manifest, read the way the hook reads it (main checkout of THIS repo)
  const realMain = require(HOOK).mainRootOf(ROOT);
  const man = path.join(realMain, 'projects', 'coding-projects', 'active', 'PymTime', 'project.json');
  if (!fs.existsSync(man)) check('R4 real PymTime project.json (not on this machine: skipped)', true);
  else { const j = JSON.parse(fs.readFileSync(man, 'utf8')); check('R4 the real PymTime project.json has a name and the alias "pymtime", and its PROJECT.md exists', j.name === 'PymTime' && j.aliases.includes('pymtime') && fs.existsSync(path.join(path.dirname(man), 'PROJECT.md'))); }
}
check('R12 at least 20 adversarial scenarios, each with a verdict', SCENARIOS.length >= 20 && SCENARIOS.every(s => /^(handled|fixture-added|accepted-risk: .+)/.test(s[1])), 'n=' + SCENARIOS.length);

if (process.argv.includes('--table')) { console.log('scenario | verdict'); for (const s of SCENARIOS) console.log(s[0] + ' | ' + s[1]); console.log(''); }
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nproject-load.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
