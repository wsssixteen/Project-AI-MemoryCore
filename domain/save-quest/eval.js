#!/usr/bin/env node
// save-quest feature eval — the decision lives in lib/save-quest.js; this runs its fixture eval and
// then checks that every place that is supposed to point at it really does. Exit 0 = all pass.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(name, ok, d) { results.push({ name, ok: !!ok, d: d || '' }); }
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };

const lib = spawnSync(process.execPath, [path.join(ROOT, 'lib', 'save-quest.eval.js')], { encoding: 'utf8', timeout: 120000 });
check('1 lib/save-quest.eval.js green', lib.status === 0, (lib.stdout || '').split('\n').filter(l => /FAIL|green/.test(l)).join(' | '));

const skill = read('.claude/skills/close-phase/SKILL.md');
const head = skill.split('\n').slice(0, 5).join('\n').toLowerCase();
for (const phrase of ['save this quest', 'save quest', 'save the quest']) check('2 close-phase description carries trigger "' + phrase + '"', head.includes(phrase));
// A plain YAML value breaks on "colon + space" or " #": the harness then drops the whole description
// and the trigger phrases with it (seen 2026-10-04, minutes after the first ship). Backticks are fine.
for (const [rel, s] of [['close-phase', skill], ['quest', read('.claude/skills/quest/SKILL.md')]]) {
  const fm = (s.match(/^---\r?\n([\s\S]*?)\r?\n---/) || ['', ''])[1];
  const desc = ((fm.split(/\r?\n/).find(l => /^description: /.test(l)) || '').replace(/^description: /, ''));
  const quoted = /^".*"$|^'.*'$/.test(desc.trim());
  check('2b ' + rel + ' skill description is a YAML-safe one-line value', desc.length > 50 && (quoted || (!/: /.test(desc) && !/ #/.test(desc))), desc.slice(0, 80));
}
check('3 close-phase names the script call', /node lib\/save-quest\.js <QA>/.test(skill));
check('4 close-phase has the Save-quest mode section', /^## Save-quest mode/m.test(skill));
check('5 close-phase Step 0 runs the resolver', /Step 0[\s\S]{0,900}node lib\/save-quest\.js/.test(skill));
check('6 close-phase Phase 2 opens with the Redmine check and names the override', /Redmine check before any Phase 2 step/.test(skill) && /archive anyway/.test(skill));
check('7 close-phase keeps every prior Phase 1 step (0-7) and Phase 2 step (0-5)', ['Wrong-fix rows saved', 'Assert local test + falsifier ledger', 'The FIXED git sequence', 'STOP — review gate', 'On approval', '**Return:**', 'Mark closed', 'Checklist C', 'WORKFLOW UPGRADE — MANDATORY', 'Phase 2 emit', 'Archive hygiene — run the atomic mover', 'Harvest + bank', 'Checklist E'].every(s => skill.includes(s)));

const { NEXT, decide, TERMINAL } = require(path.join(ROOT, 'lib', 'save-quest.js'));
const verdicts = [...new Set(Object.keys(NEXT).map(k => k.replace(/\+1$|-IN-WORK$/, '')))];
const section = (skill.match(/## Save-quest mode[\s\S]*?\r?\n---\r?\n/) || [''])[0];
check('7b the Save-quest section was found (either line ending)', section.length > 500);
const missing = verdicts.filter(v => !section.includes('`' + v + '`'));
check('8 every verdict the script can print has a row in the skill table (' + verdicts.length + ')', missing.length === 0, 'missing: ' + missing.join(', '));
check('9 the skill bans archiving on PHASE-1 / WAIT / UNKNOWN', /archiving on `PHASE-1` \/ `WAIT` \/ `UNKNOWN`/.test(section));
check('10 the closed names in the skill match the script', [...TERMINAL].every(s => section.includes(s)));

const quest = read('.claude/skills/quest/SKILL.md');
check('11 quest skill vocabulary points to Save-quest mode and the script', /"save this quest"[^\n]{0,400}close-phase[^\n]{0,200}node lib\/save-quest\.js/.test(quest));
check('12 quest skill keeps the persist-only phrases', /"save everything" \/ "save it" \/ "document the quest"/.test(quest) && /persist into the quest's own MD files/.test(quest));
check('13 save-commands.md has the command row', /`save this quest`[^\n]*node lib\/save-quest\.js/.test(read('.claude/save-commands.md')));
check('14 the closure memory points to the script', /node lib\/save-quest\.js/.test(read('.claude/auto-memory/feedback_quest_closure_both_folders.md')));
check('15 MEMORY.md index line names the rule', /quest-closure\]\(feedback_quest_closure_both_folders\.md\)[^\n]*save this quest/.test(read('.claude/auto-memory/MEMORY.md')));

const readme = read('domain/save-quest/README.md');
check('16 README carries symptom / goal / goal_signal / retention / footprint / state-scoped', ['symptom: ', 'goal: ', 'goal_signal: ', 'retention: keep', 'footprint: on-demand', 'state-scoped: no'].every(k => readme.includes('\n' + k) || readme.startsWith(k)));
check('17 no TODO left in the README keys', !/TODO/.test(readme));
check('18 NUKE-MARKER present with the five fields', ['Created', 'Session', 'Files', 'Rollback', 'Retire'].every(f => read('domain/save-quest/NUKE-MARKER.md').includes('| ' + f)));
const rsc = require(path.join(ROOT, 'quest', 'redmine-status-check.js'));
check('19 the Redmine probe exports fetchIssue and OWNER_ID', typeof rsc.fetchIssue === 'function' && typeof rsc.OWNER_ID === 'number');
const src = read('lib/save-quest.js');
check('20 the script header carries the forge keys', ['// symptom: ', '// goal: ', '// goal_signal: ', '// retention: keep', '// footprint: on-demand'].every(k => src.includes(k)));
check('21 the script never writes to Redmine or the quest files', !/\b(PUT|POST|DELETE)\b/.test(src) && !/writeFileSync/.test(src) && (src.match(/appendFileSync/g) || []).length === 1);
check('22 replay #281638 and #282198: Redmine open never yields an archive verdict', !/PHASE-2|DONE|LEARN/.test(decide('closed', { status: 'Resolved', assigneeId: 699 }, rsc.OWNER_ID).verdict) && !/PHASE-2|DONE|LEARN/.test(decide('closed', { status: 'Ready in PROD', assigneeId: 1184 }, rsc.OWNER_ID).verdict));

let fail = 0;
for (const r of results) { if (!r.ok) fail++; console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok || !r.d ? '' : '  → ' + r.d)); }
console.log('\nsave-quest feature eval: ' + (results.length - fail) + '/' + results.length + ' green');
process.exit(fail ? 1 : 0);
