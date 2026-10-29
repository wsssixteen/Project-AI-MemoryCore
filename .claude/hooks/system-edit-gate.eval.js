#!/usr/bin/env node
// system-edit-gate eval — v1.4 system-file-birth predicate (2026-10-28, per miya).
// The failing case: DE step 7.5 Writing system/agentic-ticket-workflow-assessment-<date>.md → must DENY.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'system-edit-gate.js');
const ROOT = path.resolve(__dirname, '..', '..');
const tmp = path.join(os.tmpdir(), 'seg-eval-' + process.pid + '.jsonl');

function transcript(assistantText) {
  const rows = [
    { type: 'user', message: { role: 'user', content: 'go' } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: assistantText }] } },
  ];
  fs.writeFileSync(tmp, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  return tmp;
}
// Other predicates (arch-doc, design-consult) are satisfied by this text so only the birth predicate is under test.
const CONSULTED = 'Read system/system-architecture.md; invoked system-rules.';

function run(toolName, filePath, assistantText) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ tool_name: toolName, tool_input: { file_path: filePath }, transcript_path: transcript(assistantText) }),
    encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT },
  });
  return r.stdout || '';
}

const NEW_DATED = path.join(ROOT, 'system', 'agentic-ticket-workflow-assessment-2026-10-28-eval-' + process.pid + '.md');
const NEW_TELEMETRY = path.join(ROOT, 'system', 'telemetry', 'eval-' + process.pid + '.jsonl');
const EXISTING = path.join(ROOT, 'system', 'INDEX.md');
const NEW_DOMAIN = path.join(ROOT, 'domain', 'eval-' + process.pid, 'README.md');

const cases = [
  ['Write a new dated file under system/ -> deny (the 7.5 case)', () => run('Write', NEW_DATED, CONSULTED), out => /"deny"/.test(out) && /system-file-birth/.test(out)],
  ['Write a new file under system/telemetry/ -> deny', () => run('Write', NEW_TELEMETRY, CONSULTED), out => /"deny"/.test(out) && /system-file-birth/.test(out)],
  ['Write an existing system file -> not a birth (advisory only)', () => run('Write', EXISTING, CONSULTED), out => !/"deny"/.test(out) && /additionalContext/.test(out)],
  ['Write a new file under system/ with the bypass this turn -> not a birth', () => run('Write', NEW_DATED, CONSULTED + ' [skip-system-file-birth: eval]'), out => !/system-file-birth/.test(out)],
  ['empty bypass -> still deny', () => run('Write', NEW_DATED, CONSULTED + ' [skip-system-file-birth: ]'), out => /system-file-birth/.test(out)],
  ['bypass only in an EARLIER turn -> deny', () => {
    const rows = [
      { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: '[skip-system-file-birth: old]' }] } },
      { type: 'user', message: { role: 'user', content: 'again' } },
      { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: CONSULTED }] } },
    ];
    fs.writeFileSync(tmp, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
    const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: NEW_DATED }, transcript_path: tmp }), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
    return r.stdout || '';
  }, out => /system-file-birth/.test(out)],
  ['Edit (not Write) on a system path -> not a birth', () => run('Edit', NEW_DATED, CONSULTED), out => !/system-file-birth/.test(out)],
  ['Write a new file outside system/ -> not a birth', () => run('Write', NEW_DOMAIN, CONSULTED), out => !/system-file-birth/.test(out)],
  ['bad stdin -> fails open', () => (spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8' }).stdout || ''), out => out === ''],
];

let pass = 0, fail = 0;
for (const [name, go, ok] of cases) {
  let out = ''; try { out = go(); } catch (e) { out = 'THREW ' + e.message; }
  if (ok(out)) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + ' :: ' + out.slice(0, 200)); }
}
try { fs.unlinkSync(tmp); } catch (_) {}
console.log(`system-edit-gate eval: ${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);