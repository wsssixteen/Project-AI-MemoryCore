#!/usr/bin/env node
// eval.js — the project system (domain/project-load v2, 2026-10-17). Every fixture is a real stdin → stdout/exit round trip
// through the hook file that settings.json registers, against a temp main checkout (projects, quest/active.txt, log, transcript).
// Replay cases: DawahMap 2026-10-10..16 (11 compactions in 6 days; the voice rule repeated 3 times "EVERY SINGLE TIME YOU GO
// THROUGH COMPACTION"; an agreed fix forgotten in the next session) and the Masterline brief of 2026-10-17 (requirements 1-7).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const D = __dirname;
const ROOT = path.resolve(D, '..', '..');
const HOOK = { prompt: path.join(D, 'project-load.check.hook.js'), resume: path.join(D, 'project-load.resume.hook.js'), pre: path.join(D, 'project-load.precompact.hook.js'), save: path.join(D, 'project-load.save.hook.js') };
const CLI = path.join(D, 'project.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12 (scenario | verdict) ═══
const SCENARIOS = [
  ['A shape-1 project (PymTime, DawahMap today) is named', 'fixture-added (E4: the old pointer text, unchanged)'],
  ['The same project is named again in the same session', 'fixture-added (E2: one short pointer line, not the card again)'],
  ['A delegated brief names reports\\<name>.md', 'fixture-added (E3: card says "delegated", binding carries the report)'],
  ['A later prompt quotes another session report path (the orchestrator, 2026-10-19)', 'fixture-added (E3c: never binds; only the start brief can)'],
  ['A start brief quotes one report and says to write another (app-samples, 2026-10-19)', 'fixture-added (E3d: the written one; E3e: two with no write = none)'],
  ['A session wrongly bound as delegated', 'fixture-added (E19f marker, E19h command: report check off, decision gate kept)'],
  ['The brief names the template placeholder reports\\_template.md', 'fixture-added (E3b: not bound as a report)'],
  ['SessionStart with source startup or clear', 'fixture-added (E6: silent; the first prompt loads the project)'],
  ['Compaction in a session never bound in the log (log lost, or resume under a new id)', 'fixture-added (E7: bound from the aliases in his prompts in the transcript)'],
  ['Compaction in a session working a ticket, no project', 'fixture-added (E8: the quest card with its Resume Point)'],
  ['A qa_doc without a "0. Resume Point" section', 'fixture-added (E8b: the head of the doc)'],
  ['Transcript holds tool results, skill expansions (isMeta), task notifications, peer messages, compaction summaries', 'fixture-added (E9: none of them copied as his words)'],
  ['His ruling given only in a popup answer (AskUserQuestion)', 'fixture-added (E9: copied as his popup answer, question and answer)'],
  ['A prompt carries a system-reminder block or a slash command', 'fixture-added (E9: reminder stripped, the command and its arguments kept)'],
  ['PreCompact runs twice on the same transcript', 'fixture-added (E9b: nothing copied twice)'],
  ['The SessionStart card does not arrive after a compaction', 'fixture-added (E12: the next prompt prints it, once)'],
  ['A reply states a decision and no ledger was written (the DawahMap failure)', 'fixture-added (E13: BLOCK)'],
  ['The decision words sit only in code, inline code or a quoted line', 'fixture-added (E15: no block)'],
  ['The bypass token with an empty reason', 'fixture-added (E16b: still blocks)'],
  ['stop_hook_active (the gate already blocked once this turn)', 'fixture-added (E17: no second block, the would-block row is logged)'],
  ['A "Decisions made: none" section in a report-shaped reply', 'fixture-added (E20b: no block)'],
  ['A delegated report that is missing, lacks a heading, or is older than the last change', 'fixture-added (E19 a/b/c: BLOCK; current report passes)'],
  ['Stdin that is not JSON, for every hook', 'fixture-added (E21: exit 0, silent)'],
  ['Huge START.md (60,000 characters)', 'fixture-added (E22: card stays under 9,300 characters, says it was cut)'],
  ['Two projects and two quests bound in one session', 'fixture-added (E23: one SessionStart output under 9,500 characters)'],
  ['A table cell with a pipe in a decision written by the CLI', 'fixture-added (E24: escaped, row stays one row)'],
  ['A new project from the templates', 'fixture-added (E25: passes the shape-2 check and gets a card at once)'],
  ['save-rules at Domain Expansion with a stale report in the Stop log', 'fixture-added (E26: FAIL row, PASS once the report is rewritten)'],
  ['The transcript format changes in a Claude Code release', 'accepted-risk: every parser fails open; the compact log row records mined:0 visibly and E9 pins today\'s shape'],
  ['Two sessions append to one DECISIONS.md at the same moment', 'accepted-risk: appendFileSync of one line per row; the row number may repeat, never a lost row'],
  ['The orchestrator edits the project while a delegated session runs', 'accepted-risk: the child is asked to refresh its report; the bypass token covers a turn that changed nothing of its own'],
  ['He says to skip a decision this turn', 'handled: [skip-project-decision: <reason>] in the reply'],
];

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'project-system-eval-'));
let seq = 0;
const START_OK = '# X — START\n\n## 1. Goal (his words)\n\n> "build the reminder app" (2026-10-17)\n\n## 2. Spec (his words)\n\n| # | Requirement | Status |\n|---|---|---|\n| S1 | "a reminder when is the next service" | open |\n| S2 | "documents for the engineers" | open |\n\n## 3. Hard rules\n\n| # | Rule | Why |\n|---|---|---|\n| 1 | Blue first, from the logo | his words |\n| 2 | The app is light | his words |\n\n## 4. State now\n\n| Item | Value |\n|---|---|\n| Phase | 0 discovery |\n\n## 5. Next step\n\n1. Show him the module table.\n\n## 6. Open decisions (his)\n\n| # | Decision | Options |\n|---|---|---|\n| 1 | Which modules | a table |\n';
const DEC_OK = '# X — decisions ledger\n\n| # | Date | Decision | Why | Who | Serves |\n|---|---|---|---|---|---|\n| 1 | 2026-10-17 | Reminder module first | the CEO\'s idea | みや | S1 |\n';
function tree(opts) {
  const o = opts || {};
  const main = path.join(TMP, 'm' + (++seq));
  const act = path.join(main, 'projects', 'coding-projects', 'active');
  fs.mkdirSync(act, { recursive: true });
  const ml = path.join(act, 'Masterline');
  fs.mkdirSync(ml);
  fs.writeFileSync(path.join(ml, 'project.json'), JSON.stringify({ name: 'Masterline', aliases: ['masterline', 'misb'], index: 'START.md', shape: 2 }));
  fs.writeFileSync(path.join(ml, 'START.md'), o.start || START_OK.replace(/X/g, 'Masterline'));
  fs.writeFileSync(path.join(ml, 'DECISIONS.md'), DEC_OK.replace(/X/g, 'Masterline'));
  fs.writeFileSync(path.join(ml, 'PROJECT.md'), '# index\n');
  const pt = path.join(act, 'PymTime'); fs.mkdirSync(pt);
  fs.writeFileSync(path.join(pt, 'project.json'), JSON.stringify({ name: 'PymTime', aliases: ['pymtime'] }));
  fs.writeFileSync(path.join(pt, 'PROJECT.md'), '# index\n');
  if (o.second) { const w = path.join(act, 'WaRead'); fs.mkdirSync(w); fs.writeFileSync(path.join(w, 'project.json'), JSON.stringify({ name: 'WaRead', aliases: ['waread'], index: 'START.md', shape: 2 })); fs.writeFileSync(path.join(w, 'START.md'), o.start || START_OK.replace(/X/g, 'WaRead')); fs.writeFileSync(path.join(w, 'DECISIONS.md'), DEC_OK); }
  fs.mkdirSync(path.join(main, 'quest'));
  const qdir = path.join(act, 'QA-285159'); fs.mkdirSync(qdir);
  fs.writeFileSync(path.join(qdir, 'QA-285159.md'), '# QA-285159\n\n## 0. Resume Point\n\nFix = alter tugasan to SBTM via the modeler; proof banked: act_ru_task row 991.\n\n## 1. Ticket\n\nbody\n');
  const q2 = path.join(act, 'QA-285171'); fs.mkdirSync(q2);
  fs.writeFileSync(path.join(q2, 'QA-285171.md'), '# QA-285171\n\nHEAD-OF-DOC: the ticket summary line.\n');
  fs.writeFileSync(path.join(main, 'quest', 'active.txt'), 'qa=QA-285159\nstatus=active\ncurrent_phase=Rubric\nissue_one_liner=MCL alter tugasan to SBTM\nqa_doc=projects/coding-projects/active/QA-285159/QA-285159.md\n\nqa=QA-285171\nstatus=hold\nqa_doc=projects/coding-projects/active/QA-285171/QA-285171.md\n\nqa=QA-111111\nstatus=archived\n');
  return { main, ml, log: path.join(main, 'log.jsonl') };
}
function env(t, extra) { return Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: ROOT, PROJECT_LOAD_MAIN_ROOT: t.main, PROJECT_LOAD_LOG: t.log, PROJECT_LOAD_ACTIVE_TXT: path.join(t.main, 'quest', 'active.txt') }, extra || {}); }
function run(hook, t, stdin) { const r = spawnSync(process.execPath, [hook], { input: typeof stdin === 'string' ? stdin : JSON.stringify(stdin), encoding: 'utf8', timeout: 30000, env: env(t) }); return { status: r.status, out: r.stdout || '', err: r.stderr || '' }; }
function rows(t) { try { return fs.readFileSync(t.log, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch (_) { return []; } }
// transcript lines in the shape Claude Code 2.1.295 writes them (verified on this machine 2026-10-17)
let u = 0;
const iso = (minAgo) => new Date(Date.now() - minAgo * 60000).toISOString();
const L = {
  human: (text, minAgo, origin) => JSON.stringify({ type: 'user', uuid: 'u' + (++u), timestamp: iso(minAgo), sessionId: 'S', turnOrigin: origin || 'human', promptSource: 'sdk', message: { role: 'user', content: text } }),
  meta: (text, minAgo) => JSON.stringify({ type: 'user', uuid: 'u' + (++u), timestamp: iso(minAgo), isMeta: true, sessionId: 'S', message: { role: 'user', content: [{ type: 'text', text }] } }),
  tool: (minAgo) => JSON.stringify({ type: 'user', uuid: 'u' + (++u), timestamp: iso(minAgo), sessionId: 'S', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't', content: 'masterline tool output' }] } }),
  note: (minAgo) => JSON.stringify({ type: 'user', uuid: 'u' + (++u), timestamp: iso(minAgo), sessionId: 'S', turnOrigin: 'task_notification', message: { role: 'user', content: '<task-notification> masterline agent done </task-notification>' } }),
  peer: (minAgo) => JSON.stringify({ type: 'user', uuid: 'u' + (++u), timestamp: iso(minAgo), sessionId: 'S', turnOrigin: 'peer', isMeta: true, message: { role: 'user', content: 'Another Claude session sent a message: masterline' } }),
  summary: (text, minAgo) => JSON.stringify({ type: 'user', uuid: 'u' + (++u), timestamp: iso(minAgo), sessionId: 'S', isCompactSummary: true, isVisibleInTranscriptOnly: true, turnOrigin: 'human', message: { role: 'user', content: 'This session is being continued from a previous conversation that ran out of context. ' + text } }),
  popup: (q, a, minAgo) => JSON.stringify({ type: 'user', uuid: 'u' + (++u), timestamp: iso(minAgo), sessionId: 'S', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'ask1', content: 'The user answered: ' + q + '=' + a }] }, toolUseResult: { questions: [{ question: q }], answers: { [q]: a } } }),
  assistant: (text, minAgo) => JSON.stringify({ type: 'assistant', uuid: 'a' + (++u), timestamp: iso(minAgo), sessionId: 'S', message: { role: 'assistant', content: [{ type: 'text', text }] } }),
};
function transcript(t, lines) { const f = path.join(t.main, 'tx-' + (++seq) + '.jsonl'); fs.writeFileSync(f, lines.join('\n') + '\n'); return f; }
function age(file, minAgo) { const d = new Date(Date.now() - minAgo * 60000); fs.utimesSync(file, d, d); }

// ── Requirement 2: load fast on mention ──
let t = tree();
let r = run(HOOK.prompt, t, { session_id: 's1', prompt: "let's continue Masterline" });
check('E1 req 2: naming Masterline prints its card: goal, spec rows, hard rules, state, next step, open decisions, last decision, the START.md path', r.status === 0 && /PROJECT CARD/.test(r.out) && /build the reminder app/.test(r.out) && /S2 \| "documents for the engineers"/.test(r.out) && /Blue first, from the logo/.test(r.out) && /0 discovery/.test(r.out) && /Show him the module table/.test(r.out) && /Which modules/.test(r.out) && /Reminder module first/.test(r.out) && r.out.includes(path.join(t.ml, 'START.md')) && r.out.length < 9300, r.out.slice(0, 400));
check('E1b the fire binds the session in the log (card:true, shape 2)', rows(t).some(x => x.action === 'fired' && x.session === 's1' && x.project === 'Masterline' && x.card === true && x.shape === 2));
r = run(HOOK.prompt, t, { session_id: 's1', prompt: 'masterline again' });
check('E2 a second mention in the same session (inside the re-arm time) is silent', r.status === 0 && r.out === '', r.out.slice(0, 200));
fs.writeFileSync(t.log, JSON.stringify({ ts: iso(40), action: 'fired', session: 's9', project: 'Masterline' }) + '\n');
r = run(HOOK.prompt, t, { session_id: 's9', prompt: 'back to masterline' });
check('E2b after the re-arm time a session that already had the card gets one pointer line, not the card again', /its card was given earlier/.test(r.out) && !/── SPEC ──/.test(r.out), r.out.slice(0, 200));
// A start brief = the first prompt of the session (the transcript holds no earlier prompt).
function briefRun(t, session, prompt, earlier) { const tx = transcript(t, (earlier || []).map((e, i) => L.human(e, 30 - i)).concat([L.human(prompt, 1)])); return run(HOOK.prompt, t, { session_id: session, prompt, transcript_path: tx }); }
t = tree();
r = briefRun(t, 'd1', 'Task for Masterline. At every bulk change write C:\\x\\Masterline\\reports\\project-system.md with the fixed headings.');
check('E3 req 5: a start brief that says write reports\\project-system.md: the card says delegated and the binding carries the report', /YOU ARE A DELEGATED SESSION/.test(r.out) && rows(t).some(x => x.report === path.join(t.ml, 'reports', 'project-system.md')), r.out.slice(0, 300));
t = tree(); briefRun(t, 'd2', 'Masterline: copy reports\\_template.md');
check('E3b the template placeholder is not bound as a report', !rows(t).some(x => x.report));
t = tree(); r = briefRun(t, 'd3', 'Masterline status? The website session wrote reports\\website.md, see its decision 13.', ['start the orchestration please']);
check('E3c RED (2026-10-19 orchestrator): a LATER prompt quoting another session\'s reports\\website.md does not make this session delegated', !/DELEGATED/.test(r.out) && !rows(t).some(x => x.report), r.out.slice(0, 200));
t = tree(); r = briefRun(t, 'd4', 'Masterline app samples. Use the website session\'s method (its report reports\\website.md decision 13). At every bulk change write ...\\Masterline\\reports\\app-samples.md with exactly the headings.');
check('E3d RED (2026-10-19 app-samples): a start brief naming two reports binds the one it says to write (app-samples.md), never the first one quoted', rows(t).some(x => x.report === path.join(t.ml, 'reports', 'app-samples.md')) && !rows(t).some(x => x.report && /website\.md$/.test(x.report)), JSON.stringify(rows(t).map(x => x.report)));
t = tree(); briefRun(t, 'd5', 'Masterline: compare reports\\website.md and reports\\app-samples.md');
check('E3e a start brief naming two reports with no write instruction binds none', !rows(t).some(x => x.report));
t = tree(); run(HOOK.prompt, t, { session_id: 'd6', prompt: 'Masterline: write reports\\x.md' });
check('E3f no transcript to prove it is the start brief: not delegated', !rows(t).some(x => x.report));
t = tree(); r = run(HOOK.prompt, t, { session_id: 's1', prompt: 'continue pymtime' });
check('E4 a shape-1 project keeps the 2026-10-08 pointer text (no card)', /PymTime is a project with its own folder/.test(r.out) && /READ FIRST: .*PROJECT\.md/.test(r.out) && !/PROJECT CARD/.test(r.out), r.out.slice(0, 200));

// ── Requirement 1: survive compaction mechanically ──
t = tree(); run(HOOK.prompt, t, { session_id: 'c1', prompt: 'Masterline please' });
let tx = transcript(t, [L.human('Masterline please', 30), L.assistant('ok', 29), L.human('we go with the light sample for the app', 10)]);
r = run(HOOK.resume, t, { session_id: 'c1', source: 'compact', transcript_path: tx });
check('E5 req 1 (compaction drill): SessionStart compact prints the card marked COMPACTED, under 9,500 characters, and logs resumed', r.status === 0 && /just COMPACTED/.test(r.out) && /The summary is not the record/.test(r.out) && /── HARD RULES ──/.test(r.out) && r.out.length < 9500 && rows(t).some(x => x.action === 'resumed' && x.session === 'c1' && x.source === 'compact'), r.out.slice(0, 300));
r = run(HOOK.resume, t, { session_id: 'c1', source: 'resume', transcript_path: tx });
check('E5b SessionStart resume prints the card marked RESUMED', /was RESUMED/.test(r.out));
r = run(HOOK.resume, t, { session_id: 'c1', source: 'startup', transcript_path: tx });
const r2 = run(HOOK.resume, t, { session_id: 'c1', source: 'clear', transcript_path: tx });
check('E6 SessionStart startup and clear are silent', r.out === '' && r2.out === '' && r.status === 0);
t = tree(); tx = transcript(t, [L.human('hello', 50), L.human('let us work on MISB today', 40)]);
r = run(HOOK.resume, t, { session_id: 'new-id', source: 'resume', transcript_path: tx });
check('E7 no binding in the log: the project is found from the aliases in his prompts in the transcript and bound', /PROJECT CARD/.test(r.out) && rows(t).some(x => x.action === 'bound' && x.via === 'transcript' && x.project === 'Masterline'), r.out.slice(0, 200));
t = tree(); tx = transcript(t, [L.human('continue 285159 please', 20), L.human('also look at QA-285171', 10), L.human('and 111111', 5)]);
r = run(HOOK.resume, t, { session_id: 'q1', source: 'compact', transcript_path: tx });
check('E8 a ticket session: the quest card comes back with its Resume Point (archived quest left out)', /QUEST CARD — QA-285159/.test(r.out) && /proof banked: act_ru_task row 991/.test(r.out) && /MCL alter tugasan to SBTM/.test(r.out) && !/QA-111111/.test(r.out), r.out.slice(0, 400));
check('E8b a qa_doc with no Resume Point: the head of the doc instead', /QUEST CARD — QA-285171/.test(r.out) && /HEAD-OF-DOC/.test(r.out));

// ── his words out of the transcript ──
t = tree(); run(HOOK.prompt, t, { session_id: 'w1', prompt: 'Masterline: start' });
tx = transcript(t, [L.human('Masterline: start', 1), L.tool(1), L.meta('skill body text masterline', 1), L.note(1), L.peer(1), L.human('<system-reminder>noise masterline</system-reminder>Use blue as the main colour.\nSecond line stays.', 1), L.human('<command-name>/goal</command-name> <command-message>goal</command-message> <command-args>finish the reminder module</command-args>', 1), L.summary('old summary text', 1), L.popup('Which sample for the app?', 'The light one, and add a dark toggle later', 1), L.assistant('we decided nothing', 1)]);
r = run(HOOK.pre, t, { session_id: 'w1', transcript_path: tx, trigger: 'auto' });
const words = fs.readFileSync(path.join(t.ml, 'history', 'words.md'), 'utf8');
check('E9 req 1 (mining): PreCompact copies exactly his 3 prompts and his 1 popup answer word for word (reminder stripped, slash command kept); no tool result, skill body, notification, peer message or summary', r.status === 0 && (words.match(/^### /gm) || []).length === 4 && /his popup answer/.test(words) && /> A: The light one, and add a dark toggle later/.test(words) && /> Use blue as the main colour\.\n> Second line stays\./.test(words) && /> \/goal finish the reminder module/.test(words) && !/noise|skill body|task-notification|Another Claude|old summary|tool output/.test(words), words.slice(0, 600));
check('E9a the compact row records how many were copied', rows(t).some(x => x.action === 'compact' && x.project === 'Masterline' && x.mined === 4 && x.trigger === 'auto'));
run(HOOK.pre, t, { session_id: 'w1', transcript_path: tx, trigger: 'manual' });
check('E9b a second PreCompact on the same transcript copies nothing twice', (fs.readFileSync(path.join(t.ml, 'history', 'words.md'), 'utf8').match(/^### /gm) || []).length === 4);
r = run(HOOK.resume, t, { session_id: 'w1', source: 'compact', transcript_path: tx });
check('E10 the compact card says how many of his prompts were copied', /4 of his prompt\(s\) were copied/.test(r.out), (r.out.match(/\d+ of his prompt[^\n]*/) || [''])[0]);
const comp = path.join(t.ml, 'history', 'compactions.md');
check('E11 the compaction summary is copied once into history\\compactions.md', fs.existsSync(comp) && /old summary text/.test(fs.readFileSync(comp, 'utf8')));
run(HOOK.resume, t, { session_id: 'w1', source: 'compact', transcript_path: tx });
check('E11b not copied twice', (fs.readFileSync(comp, 'utf8').match(/old summary text/g) || []).length === 1);

// ── fallback when the SessionStart card does not arrive ──
t = tree();
fs.writeFileSync(t.log, JSON.stringify({ ts: iso(10), action: 'fired', session: 'f1', project: 'Masterline', card: true }) + '\n' + JSON.stringify({ ts: iso(5), action: 'compact', session: 'f1', project: 'Masterline', mined: 2 }) + '\n');
r = run(HOOK.prompt, t, { session_id: 'f1', prompt: 'what next' });
const r3 = run(HOOK.prompt, t, { session_id: 'f1', prompt: 'and then' });
check('E12 compacted with no SessionStart card: the next prompt prints the card (fallback), the one after is silent', /fallback/.test(r.out) && /2 of his prompt\(s\) were copied/.test(r.out) && r3.out === '', r.out.slice(0, 200) + ' | ' + r3.out.slice(0, 80));

// ── Requirement 3: the decisions ledger and its Stop gate ──
function bound(session, extra) { const x = tree(extra); briefRun(x, session, 'Masterline' + ((extra && extra.brief) || '')); return x; }
t = bound('g1'); age(path.join(t.ml, 'DECISIONS.md'), 60);
tx = transcript(t, [L.human('Masterline', 30), L.human('ok go with the light one', 2)]);
r = run(HOOK.save, t, { session_id: 'g1', transcript_path: tx, last_assistant_message: 'Done. We agreed: the internal app uses the light sample.' });
check('E13 req 3 RED: a reply with an agreed decision and no ledger write this turn is BLOCKED (exit 2, the decide command shown)', r.status === 2 && /decisions ledger was written this turn/.test(r.err) && /project\.js decide "Masterline"/.test(r.err), 'exit=' + r.status + ' ' + r.err.slice(0, 200));
fs.appendFileSync(path.join(t.ml, 'DECISIONS.md'), '| 2 | 2026-10-17 | light sample | his pick | みや | S5 |\n');
r = run(HOOK.save, t, { session_id: 'g1', transcript_path: tx, last_assistant_message: 'Done. We agreed: the internal app uses the light sample.' });
check('E14 the same reply after the row is written passes', r.status === 0, 'exit=' + r.status + ' ' + r.err.slice(0, 120));
age(path.join(t.ml, 'DECISIONS.md'), 60);
for (const [n, msg] of [['code fence', 'Example:\n```\nwe agreed: x\n```\nnothing else'], ['inline code', 'The gate matches `the fix is` and `we decided`.'], ['quote', '> we decided to go blue\nThat was his old note.']]) {
  r = run(HOOK.save, t, { session_id: 'g1', transcript_path: tx, last_assistant_message: msg });
  check('E15 decision words only inside a ' + n + ': no block', r.status === 0, 'exit=' + r.status);
}
r = run(HOOK.save, t, { session_id: 'g1', transcript_path: tx, last_assistant_message: 'He ruled: blue first. [skip-project-decision: already row 4]' });
check('E16 bypass with a reason passes', r.status === 0);
r = run(HOOK.save, t, { session_id: 'g1', transcript_path: tx, last_assistant_message: 'He ruled: blue first. [skip-project-decision: ]' });
check('E16b bypass with an empty reason still blocks', r.status === 2);
r = run(HOOK.save, t, { session_id: 'g1', transcript_path: tx, stop_hook_active: true, last_assistant_message: 'The fix is to cache the card.' });
check('E17 stop_hook_active: never a second block; the would-block row is logged', r.status === 0 && rows(t).some(x => x.action === 'stop-check' && x.would_block === true && x.blocked === false));
{ const s1 = tree(); run(HOOK.prompt, s1, { session_id: 'p1', prompt: 'pymtime' }); r = run(HOOK.save, s1, { session_id: 'p1', last_assistant_message: 'We decided to ship v18.' }); check('E18 a session bound only to a shape-1 project is never gated', r.status === 0 && r.err === ''); }
r = run(HOOK.save, t, { session_id: 'g1', transcript_path: tx, last_assistant_message: '## Decisions made\n\n| Decision | Why |\n|---|---|\n| card cut from START.md | short |\n' });
check('E20 a "Decisions made" section with rows counts as a decision', r.status === 2);
r = run(HOOK.save, t, { session_id: 'g1', transcript_path: tx, last_assistant_message: '## Decisions made\n\nnone this turn\n\n## Next step\n' });
check('E20b "Decisions made: none" does not', r.status === 0, 'exit=' + r.status);

// ── Requirement 5: delegated report ──
t = bound('r1', { brief: ' — write reports\\child.md' });
const rep = path.join(t.ml, 'reports', 'child.md');
tx = transcript(t, [L.human('Masterline — write reports\\child.md', 30)]);
r = run(HOOK.save, t, { session_id: 'r1', transcript_path: tx, last_assistant_message: 'progress made' });
check('E19a req 5: the delegated report does not exist → BLOCK', r.status === 2 && /does not exist/.test(r.err), r.err.slice(0, 160));
fs.mkdirSync(path.dirname(rep), { recursive: true });
fs.writeFileSync(rep, '# Report\n## What changed\n## Decisions made\nnone\n## Blockers\n## Unverified\n## Next step\n');
r = run(HOOK.save, t, { session_id: 'r1', transcript_path: tx, last_assistant_message: 'progress made' });
check('E19b the report lacks a heading (Open questions) → BLOCK naming it', r.status === 2 && /Open questions/.test(r.err), r.err.slice(0, 160));
fs.writeFileSync(rep, '# Report\n## What changed\n## Decisions made\nnone\n## Open questions for みや\n## Blockers\n## Unverified\n## Next step\n'); age(rep, 5);
fs.writeFileSync(path.join(t.ml, 'ARCHITECTURE.md'), 'changed after the report');
r = run(HOOK.save, t, { session_id: 'r1', transcript_path: tx, last_assistant_message: 'progress made' });
check('E19c the report is older than the last change in the folder → BLOCK naming the file', r.status === 2 && /older than your last change \(ARCHITECTURE\.md\)/.test(r.err), r.err.slice(0, 200));
fs.writeFileSync(rep, fs.readFileSync(rep, 'utf8') + '\nupdated');
r = run(HOOK.save, t, { session_id: 'r1', transcript_path: tx, last_assistant_message: 'progress made' });
check('E19d a current report with all six headings passes', r.status === 0, r.err.slice(0, 160));
// unbind: by a prompt marker and by the command; the report gate never fires on an unbound session
fs.writeFileSync(rep, '# stale'); age(rep, 5); fs.writeFileSync(path.join(t.ml, 'ARCHITECTURE.md'), 'changed again');
r = run(HOOK.save, t, { session_id: 'r1', transcript_path: tx, last_assistant_message: 'progress made' });
check('E19e (before the unbind) the stale report blocks', r.status === 2);
r = run(HOOK.prompt, t, { session_id: 'r1', prompt: 'not your report [project-unbind: Masterline]' });
const r2b = run(HOOK.save, t, { session_id: 'r1', transcript_path: tx, last_assistant_message: 'progress made' });
check('E19f the prompt marker [project-unbind: Masterline] turns the report check off for this session (no block), the card binding stays', /no longer bound as delegated/.test(r.out) && r2b.status === 0 && rows(t).some(x => x.action === 'unbound' && x.report_only === true), r.out.slice(0, 160) + ' | exit ' + r2b.status);
age(path.join(t.ml, 'DECISIONS.md'), 60);
r = run(HOOK.save, t, { session_id: 'r1', transcript_path: tx, last_assistant_message: 'We agreed: nothing new.' });
check('E19g after the unbind the decision gate still holds for the bound project', r.status === 2 && /decisions ledger/.test(r.err));
{ const u = bound('r2', { brief: ' — write reports\\child2.md' });
  const c1 = spawnSync(process.execPath, [CLI, 'unbind', 'Masterline', '--session', 'r2', '--reason', 'misbound'], { encoding: 'utf8', env: env(u) });
  const r3 = run(HOOK.save, u, { session_id: 'r2', last_assistant_message: 'progress made' });
  const c2 = spawnSync(process.execPath, [CLI, 'bind', 'Masterline', '--session', 'r2', '--report', 'child2.md'], { encoding: 'utf8', env: env(u) });
  const r4 = run(HOOK.save, u, { session_id: 'r2', last_assistant_message: 'progress made' });
  check('E19h the unbind command turns the report check off; the bind command puts it back (missing report → block)', c1.status === 0 && r3.status === 0 && c2.status === 0 && r4.status === 2 && /does not exist/.test(r4.err), c1.stdout + c1.stderr + ' | ' + r3.status + ' | ' + r4.status); }
{ const u = tree(); const c = spawnSync(process.execPath, [CLI, 'unbind', 'Masterline', '--session', 'z9', '--all'], { encoding: 'utf8', env: env(u) }); run(HOOK.prompt, u, { session_id: 'z9', prompt: 'hello' }); const r5 = run(HOOK.save, u, { session_id: 'z9', last_assistant_message: 'We agreed: x' });
  check('E19i a session never bound (or unbound with --all) is never gated', c.status === 0 && r5.status === 0 && r5.err === ''); }

// ── robustness ──
t = tree();
const bad = Object.values(HOOK).map(h => run(h, t, 'this is not json masterline'));
check('E21 stdin that is not JSON: every hook exits 0 and prints nothing', bad.every(x => x.status === 0 && x.out === '' && x.err === ''), bad.map(x => x.status).join(','));
t = tree({ start: START_OK.replace(/X/g, 'Masterline').replace('| S2 |', '| S2 | ' + 'long words '.repeat(5000) + ' |') });
r = run(HOOK.prompt, t, { session_id: 'h1', prompt: 'masterline' });
check('E22 a 60,000-character START.md: the card stays under 9,300 characters and says it was cut', r.out.length < 9300 && /cut, read the file|card cut/.test(r.out), 'len=' + r.out.length);
t = tree({ second: true }); run(HOOK.prompt, t, { session_id: 'm1', prompt: 'masterline and waread' });
tx = transcript(t, [L.human('masterline and waread, plus 285159 and QA-285171', 10)]);
r = run(HOOK.resume, t, { session_id: 'm1', source: 'compact', transcript_path: tx });
check('E23 two projects + two quests in one session: one output under 9,500 characters with all four cards', r.out.length < 9500 && /Masterline — PROJECT CARD/.test(r.out) && /WaRead — PROJECT CARD/.test(r.out) && /QA-285159/.test(r.out) && /QA-285171/.test(r.out), 'len=' + r.out.length);

// ── CLI: decide · new · check ──
t = tree();
let c = spawnSync(process.execPath, [CLI, 'decide', 'Masterline', '--decision', 'use a | b split', '--why', 'his pick', '--who', 'みや', '--serves', 'S1'], { encoding: 'utf8', env: env(t) });
const decTxt = fs.readFileSync(path.join(t.ml, 'DECISIONS.md'), 'utf8');
check('E24 decide appends row 2 with the pipe escaped, one line', c.status === 0 && /^\| 2 \| \d{4}-\d{2}-\d{2} \| use a \/ b split \| his pick \| みや \| S1 \|$/m.test(decTxt), c.stdout + c.stderr);
c = spawnSync(process.execPath, [CLI, 'new', 'Kedai', '--aliases', 'kedai app'], { encoding: 'utf8', env: env(t) });
const k = path.join(t.main, 'projects', 'coding-projects', 'active', 'Kedai');
const ck = spawnSync(process.execPath, [CLI, 'check', 'Kedai'], { encoding: 'utf8', env: env(t) });
r = run(HOOK.prompt, t, { session_id: 'k1', prompt: 'start the kedai app' });
check('E25 req 6: a new project from the templates passes the shape-2 check and gets a card at once', c.status === 0 && ck.status === 0 && fs.existsSync(path.join(k, 'reports', '_template.md')) && fs.existsSync(path.join(k, 'history')) && /Kedai — PROJECT CARD/.test(r.out), c.stdout + c.stderr + ck.stdout);

// ── Requirement 5 at Domain Expansion: lib/save-rules.js ──
t = tree();
const report = path.join(t.ml, 'reports', 'child.md'); fs.mkdirSync(path.dirname(report), { recursive: true }); fs.writeFileSync(report, 'x'); age(report, 30);
fs.appendFileSync(t.log, JSON.stringify({ ts: new Date().toISOString(), action: 'stop-check', session: 'z1', project: 'Masterline', report, report_mtime: Date.now() - 1800000, last_change: Date.now() - 60000, last_change_file: path.join(t.ml, 'START.md') }) + '\n');
const sr = () => { const x = spawnSync(process.execPath, [path.join(ROOT, 'lib', 'save-rules.js'), '--json', '--paths', 'projects/coding-projects/active/Masterline/START.md', '--main-root', t.main], { encoding: 'utf8', cwd: ROOT, env: env(t), timeout: 120000 }); try { return JSON.parse(x.stdout); } catch (_) { return { rows: [], raw: (x.stdout || '') + (x.stderr || '') }; } };
let j = sr();
const row = (id) => (j.rows || []).find(x => x.rule === id) || {};
check('E26 req 5 at DE: save-rules FAILs a project whose report is older than the session\'s last change', row('project-report-current').result === 'FAIL', JSON.stringify(row('project-report-current')) + (j.raw ? j.raw.slice(0, 300) : ''));
check('E26b save-rules PASSes the shape-2 check on the same folder', row('project-shape2').result === 'PASS', JSON.stringify(row('project-shape2')));
fs.writeFileSync(report, 'rewritten');
j = sr();
check('E26c once the report is rewritten the same row PASSes', row('project-report-current').result === 'PASS', JSON.stringify(row('project-report-current')));

// ── Registration, the real instance, portability ──
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
const cmds = (ev, re) => (settings.hooks[ev] || []).filter(g => !re || re.test(g.matcher || '')).flatMap(g => g.hooks || []).map(h => h.command || '');
check('R1 SessionStart registers the resume hook under a matcher that names compact and resume', cmds('SessionStart', /compact/).some(c2 => /project-load\.resume\.hook\.js/.test(c2)) && (settings.hooks.SessionStart || []).some(g => /compact/.test(g.matcher || '') && /resume/.test(g.matcher || '')));
check('R2 PreCompact registers the precompact hook', cmds('PreCompact').some(c2 => /project-load\.precompact\.hook\.js/.test(c2)));
const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'domain', 'bundles', 'stop-claim-integrity.json'), 'utf8'));
check('R3 the Stop gate rides the stop-claim-integrity bundle (no new Stop registration, system-rules Rule 7)', bundle.children.includes('domain/project-load/project-load.save.hook.js') && !cmds('Stop').some(c2 => /project-load/.test(c2)));
check('R4 UserPromptSubmit still registers project-load once', cmds('UserPromptSubmit').filter(c2 => /project-load\.check\.hook\.js/.test(c2)).length === 1);
{
  const P = require(path.join(D, 'project.js'));
  const real = path.join(P.mainRootOf(ROOT), 'projects', 'coding-projects', 'active', 'Masterline', 'project.json');
  if (!fs.existsSync(real)) check('R5 the real Masterline (not on this machine: skipped)', true);
  else {
    const out = spawnSync(process.execPath, [CLI, 'check', 'Masterline'], { encoding: 'utf8', env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: ROOT }) });
    const crd = spawnSync(process.execPath, [CLI, 'card', 'Masterline'], { encoding: 'utf8', env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: ROOT }) });
    check('R5 req 4 + 6: the real Masterline is shape 2, passes the check, and its card carries his goal words and spec row S8 whole', out.status === 0 && /core idea from the founder and CEO/.test(crd.stdout) && /\| S8 \|/.test(crd.stdout) && crd.stdout.length < 9300, out.stdout + ' len=' + crd.stdout.length);
  }
}
const skill = path.join(ROOT, '.claude', 'skills', 'project', 'SKILL.md');
const sk = fs.existsSync(skill) ? fs.readFileSync(skill, 'utf8') : '';
check('R6 req 7: the rules live in the skill and the templates (portable), not only in auto-memory', /^name: project$/m.test(sk) && /START\.md/.test(sk) && /DECISIONS\.md/.test(sk) && /reports\\/.test(sk) && /history\\words\.md/.test(sk) && ['START.md', 'DECISIONS.md', 'project.json', 'report.md'].every(f => fs.existsSync(path.join(D, 'templates', f))));
check('R7 at least 20 adversarial scenarios, each with a verdict', SCENARIOS.length >= 20 && SCENARIOS.every(s => /^(handled|fixture-added|accepted-risk: .+)/.test(s[1])), 'n=' + SCENARIOS.length);

if (process.argv.includes('--table')) { console.log('scenario | verdict'); for (const s of SCENARIOS) console.log(s[0] + ' | ' + s[1]); console.log(''); }
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nproject-system eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
