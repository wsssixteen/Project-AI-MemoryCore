#!/usr/bin/env node
// system-change-title eval — the 286462 audit reply (must BLOCK) plus 21 scenarios around it.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { evaluate } = require('./system-change-title.check.hook.js');

const AUDIT_286462 = `## 3. What is built now\n\n| Part | What it solves |\n|---|---|\n| \`lib/handover-check.js\` | built: names who wrote the Expected |\n| Quest skill hand-over step | added a step |`;
const GOOD = `## [Tool · new] handover-check.js\nNames who wrote the Expected. Built in lib/handover-check.js.\n\n## [Workflow · changed] Quest hand-over step\nRuns the check first.`;

const cases = [
  ['286462 audit reply, no kind heading -> block', AUDIT_286462, 'block'],
  ['kind headings present -> pass', GOOD, 'pass'],
  ['[Feature · new] heading -> pass', '## [Feature · new] handover-check-gate\nAdded domain/handover-check-gate/ in the Stop bundle.', 'pass'],
  ['[Rule · changed] at h3 -> pass', '### [Rule · changed] Reply spec 3i\nUpdated .claude/reply-shape-spec.md.', 'pass'],
  ['plural [Features] heading -> pass', '## [Features · new] two gates\nAdded domain/a/ and domain/b/.', 'pass'],
  ['bold label, not a heading -> block', '**[Feature] handover-check-gate**\nAdded domain/handover-check-gate/.', 'block'],
  ['unknown kind [Hook] -> block', '## [Hook · new] x\nAdded domain/x/.', 'block'],
  ['path cited, no change verb -> pass', 'The role tool lives in lib/redmine-role.js and reads the roster.', 'pass'],
  ['change verb, no system path -> pass', 'I updated the Redmine tab for kak Yati.', 'pass'],
  ['etanah code change (not our system) -> pass', 'Changed PelupusanWordCCMethodConstant.java to bold the phrases.', 'pass'],
  ['path + verb only inside a code block -> pass', 'Run it:\n```\nnode lib/handover-check.js --brief x  # added today\n```', 'pass'],
  ['path + verb only in Next steps -> pass', 'Done.\n\n## Next steps\n| # | Action |\n|---|---|\n| 1 | I add a stamp to lib/handover-check.js |', 'pass'],
  ['memory change -> block', 'Added kak Yati to etanah-knowledge/melaka/STATE-FACTS.md.', 'block'],
  ['memory change with [Memory] heading -> pass', '## [Memory · changed] People list\nAdded kak Yati to etanah-knowledge/melaka/STATE-FACTS.md.', 'pass'],
  ['settings.json change -> block', 'Removed the entry from .claude/settings.json.', 'block'],
  ['Windows path with backslash -> block', 'Created domain\\system-change-title\\ with an eval.', 'block'],
  ['quest script change -> block', 'Updated quest/redmine-sync.js to read the role.', 'block'],
  ['bypass with reason -> pass', AUDIT_286462 + '\n[skip-system-change-title: quoting the old reply]', 'pass'],
  ['empty bypass -> block', AUDIT_286462 + '\n[skip-system-change-title: ]', 'block'],
  ['no text -> pass', '', 'pass'],
  ['word "news" not the verb "new" -> pass', 'The news in system/INDEX.md is nothing.', 'pass'],
  ['heading text mid-line, not at start -> block', 'See ## [Feature] x\nAdded domain/x/.', 'block'],
];

let pass = 0, fail = 0;
for (const [name, text, want] of cases) {
  const got = evaluate(text).verdict;
  if (got === want) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + ' :: got ' + got); }
}

const tmp = path.join(os.tmpdir(), 'sct-eval-' + process.pid + '.jsonl');
fs.writeFileSync(tmp, JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: AUDIT_286462 }] } }) + '\n');
const r = spawnSync(process.execPath, [path.join(__dirname, 'system-change-title.check.hook.js')], { input: JSON.stringify({ transcript_path: tmp }), encoding: 'utf8' });
if (/"decision":"block"/.test(r.stdout) && /\[<Rule\|Workflow\|Feature\|Tool/.test(r.stdout)) { pass++; console.log('PASS hook process blocks the 286462 reply and shows the heading shape'); } else { fail++; console.log('FAIL hook process :: ' + r.stdout); }
const r2 = spawnSync(process.execPath, [path.join(__dirname, 'system-change-title.check.hook.js')], { input: 'not json', encoding: 'utf8' });
if (r2.status === 0 && !r2.stdout) { pass++; console.log('PASS bad stdin fails open'); } else { fail++; console.log('FAIL bad stdin'); }
try { fs.unlinkSync(tmp); } catch (_) {}

console.log(`system-change-title.eval: ${pass}/${pass + fail} green`);
process.exit(fail ? 1 : 0);
