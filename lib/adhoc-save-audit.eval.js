#!/usr/bin/env node
// adhoc-save-audit.eval.js — fixture eval (born with the component; must be green before ship).
// Replay: 2026-09-25 ADHOC-PLTP-2026-1 — notes.js wrote "1. 2 026.txt"; ADHOC-REDMINE-RC-2026-1 and
// ADHOC-PRBB-2026-5 both claimed register row A27; ADHOC-FLOWABLE-2026-1 open while its row said RESOLVED.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, 'adhoc-save-audit.js');
const ID = 'ADHOC-PLTP-2026-1';

function fixture(mut) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'adhoc-save-audit-'));
  const k = path.join(root, 'k');
  const s = {
    block: [`qa=${ID}`, 'phase=0', 'status=hold', 'ticket_type=adhoc', 'env=PROD', 'urusan=PLTP', 'quest_start=2026-09-25',
      'local_test_confirmed=false', 'adhoc_register_row=A32', `qa_doc=projects/coding-projects/active/${ID}/${ID}.md`,
      `task_folder=${path.join(root, 'tasks', '234. AH - PROD - PLTP - x')}`, 'issue_one_liner=syer popup', 'branch=none-until-ticket'],
    archive: '',
    other: '',
    row: `| A32 | 2026-09-25 | BA | ask | concl | \`${ID}\` | \`OPEN\` — awaiting ticket |`,
    qa: `# ${ID}\n\n## Issue Summary\n- Symptom : x\n- Screen  : y\n- Verdict : z\n\n## Match Keys\n- permohonan : —\n- aplikasi   : —\n\n## 0. Resume Point\n| a | b |\n\n## Next-Steps Checklist\n- [ ] x\n`,
    notes: `1. ${ID}.txt`,
    brief: true,
  };
  if (mut) mut(s);
  fs.mkdirSync(path.join(root, 'quest'), { recursive: true });
  fs.writeFileSync(path.join(root, 'quest', 'active.txt'), (s.block.length ? s.block.join('\n') + '\n' : '') + s.other);
  fs.writeFileSync(path.join(root, 'quest', 'active-archive.txt'), s.archive);
  fs.mkdirSync(path.join(k, 'melaka'), { recursive: true });
  fs.writeFileSync(path.join(k, 'melaka', 'ADHOC-REGISTER.md'), '# reg\n\n| # | Date |\n|---|---|\n' + s.row + '\n');
  if (s.qa !== null) {
    fs.mkdirSync(path.join(root, 'projects', 'coding-projects', 'active', ID), { recursive: true });
    fs.writeFileSync(path.join(root, 'projects', 'coding-projects', 'active', ID, ID + '.md'), s.qa);
  }
  const tf = path.join(root, 'tasks', '234. AH - PROD - PLTP - x');
  fs.mkdirSync(path.join(tf, '0. Brief'), { recursive: true });
  if (s.brief) fs.writeFileSync(path.join(tf, '0. Brief', 'brief.txt'), 'BA text');
  if (s.notes) fs.writeFileSync(path.join(tf, s.notes), '1) PROD');
  return { root, k };
}
function run(fx, id) {
  const r = spawnSync(process.execPath, [SCRIPT, id || ID, '--root', fx.root, '--state', 'melaka'], {
    encoding: 'utf8', timeout: 30000, env: Object.assign({}, process.env, { KNOWLEDGE_ROOT: fx.k, CLAUDE_PROJECT_DIR: fx.root }),
  });
  return { out: (r.stdout || '') + (r.stderr || ''), status: r.status };
}

const cases = [
  ['E1 complete save-set is green', null, 0, ['26/26 PASS']],
  ['E19 hold adhoc without Resume Point fails', s => { s.qa = s.qa.replace('## 0. Resume Point', '## Notes'); }, 1, ['FAIL  qa_doc: "## 0. Resume Point"']],
  ['E20 missing branch key fails (resume-readiness needs it)', s => { s.block.pop(); }, 1, ['FAIL  block: required keys present  →  add branch']],
  ['E2 missing block fails', s => { s.block = []; }, 1, ['FAIL  block: exactly one']],
  ['E3 digit-mangled notes file fails (the 2026-09-25 notes.js bug)', s => { s.notes = '1. 2 026.txt'; }, 1, ['FAIL  task folder: no digit-mangled', 'FAIL  task folder: notes file']],
  ['E4 register row double-claimed by another open block fails', s => { s.other = '\nqa=ADHOC-X-2026-1\nstatus=active\nadhoc_register_row=A32\n'; }, 1, ['not claimed by another open block  →  A32 also claimed by ADHOC-X-2026-1']],
  ['E5 open block vs RESOLVED register fails', s => { s.row = s.row.replace('`OPEN` — awaiting ticket', '`RESOLVED` 2026-09-04'); }, 1, ['FAIL  register: status ↔ block status']],
  ['E6 closed block still in active.txt fails', s => { s.block[2] = 'status=archived'; s.row = s.row.replace('`OPEN`', '`TICKETED`'); }, 1, ['FAIL  block: open ↔ file location']],
  ['E7 archived block in active-archive.txt + TICKETED row is green', s => { s.block[2] = 'status=archived'; s.archive = s.block.join('\n') + '\n'; s.block = []; s.row = s.row.replace('`OPEN`', '`TICKETED`'); }, 0, ['PASS']],
  ['E8 qa_doc without Match Keys fails', s => { s.qa = s.qa.split('## Match Keys')[0]; }, 1, ['FAIL  qa_doc: has "## Match Keys"']],
  ['E9 missing qa_doc fails', s => { s.qa = null; }, 1, ['FAIL  qa_doc: file exists']],
  ['E10 placeholder in block fails', s => { s.block[8] = 'adhoc_register_row=<A#>'; }, 1, ['FAIL  block: no placeholders']],
  ['E11 duplicate blocks fail', s => { s.other = '\n' + s.block.join('\n') + '\n'; }, 1, ['2 blocks for']],
  ['E12 register row not citing the id fails', s => { s.row = '| A32 | x | y | z | w | elsewhere | `OPEN` |'; }, 1, ['FAIL  register: row A32 cites']],
  ['E13 unknown status vocabulary fails', s => { s.row = s.row.replace('`OPEN` — awaiting ticket', 'maybe'); }, 1, ['FAIL  register: status cell uses the vocabulary']],
  ['E14 empty 0. Brief fails', s => { s.brief = false; }, 1, ['FAIL  task folder: 0. Brief']],
  ['E15 TODO in qa_doc fails', s => { s.qa += '\nTODO fill\n'; }, 1, ['FAIL  qa_doc: no TODO']],
];

const results = [];
for (const [name, mut, wantExit, wants] of cases) {
  const fx = fixture(mut);
  const r = run(fx);
  const miss = wants.filter(w => !r.out.includes(w));
  results.push({ name, pass: r.status === wantExit && !miss.length, d: `exit=${r.status} missing=[${miss.join(' | ')}]` });
}
// E16 lowercase id is normalised
{ const fx = fixture(); const r = run(fx, ID.toLowerCase()); results.push({ name: 'E16 lowercase id normalised', pass: r.status === 0, d: 'exit=' + r.status }); }
// E17 non-ADHOC id is a usage error
{ const fx = fixture(); const r = run(fx, 'QA-281567'); results.push({ name: 'E17 non-ADHOC id → exit 2', pass: r.status === 2, d: 'exit=' + r.status }); }
// E18 log row written with outcome + dur_ms
{ const fx = fixture(); run(fx); const log = path.join(fx.root, 'system', 'telemetry', 'adhoc-save-audit.jsonl');
  const row = fs.existsSync(log) ? JSON.parse(fs.readFileSync(log, 'utf8').trim().split('\n').pop()) : {};
  results.push({ name: 'E18 log row has outcome + dur_ms', pass: row.outcome === 'pass' && typeof row.dur_ms === 'number', d: JSON.stringify(row) }); }

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.name + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nadhoc-save-audit.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
