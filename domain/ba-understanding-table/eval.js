/**
 * eval.js — behavioural eval for ba-understanding-table (v1.2)
 *
 * Proves the RED path, not just the green one. Fixture = QA-270900 cycle-2, the live slip:
 * History.txt read, Description.txt + both 0. Brief attachments never opened, BA table emitted.
 * v1.1 PASSED that turn. v1.2 must BLOCK it and name every unopened source.
 *
 * Run: node domain/ba-understanding-table/eval.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HOOK = path.join(__dirname, 'ba-understanding-table.discipline.hook.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ba-eval-'));

const BA_TABLE_TEXT = 'x'.repeat(600) + `
QA-270900 Phase 0 — 0. Brief loaded.

| BA said (verbatim) | My understanding |
|---|---|
| "Papar peranan KPT sahaja" | only one role renders |
`;

function transcript(name, toolUses) {
  const lines = [JSON.stringify({ message: { role: 'user', content: 'go' } })];
  for (const t of toolUses) {
    lines.push(JSON.stringify({ message: { role: 'assistant', content: [{ type: 'tool_use', name: t.name, input: t.input }] } }));
  }
  lines.push(JSON.stringify({ message: { role: 'assistant', content: [{ type: 'text', text: BA_TABLE_TEXT }] } }));
  const p = path.join(TMP, name + '.jsonl');
  fs.writeFileSync(p, lines.join('\n'));
  return p;
}

function run(transcriptPath) {
  const out = execFileSync(process.execPath, [HOOK], {
    input: JSON.stringify({ transcript_path: transcriptPath }), encoding: 'utf8',
  });
  return out.trim() ? JSON.parse(out) : {};
}

const read = f => ({ name: 'Read', input: { file_path: 'C:\\Tasks\\100. X\\0. Brief\\' + f } });
const grep = f => ({ name: 'PowerShell', input: { command: `Select-String -Path "${f}" -Pattern peranan` } });

// Discover what the hook actually demands for the CURRENT active quest, so the eval
// asserts against real disk state rather than a hard-coded guess.
const required = (() => {
  const src = fs.readFileSync(HOOK, 'utf8');
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', '__dirname', src.replace(/process\.stdin[\s\S]*$/, 'module.exports={requiredSourceFiles};'))(
    mod, mod.exports, require, __dirname);
  return mod.exports.requiredSourceFiles();
})();

const cases = [];

// 1. THE LIVE SLIP — History.txt only. Must BLOCK and name Description.txt.
cases.push({
  name: 'RED  history-only (the QA-270900 slip v1.1 let through)',
  t: transcript('red-history-only', [read('History.txt')]),
  expect: r => r.decision === 'block' && /Description\.txt/.test(r.reason),
});

// 2. Both .txt read, attachments untouched. Must BLOCK naming an attachment.
const attachments = required.filter(f => !/\.(txt)$/i.test(f));
cases.push({
  name: 'RED  both .txt read, attachments unopened',
  t: transcript('red-no-attach', [read('Description.txt'), read('History.txt')]),
  expect: r => attachments.length === 0
    ? true // no attachments on disk for the active quest -> nothing to assert
    : r.decision === 'block' && attachments.some(a => r.reason.includes(a)),
});

// 3. A grep is not a read.
cases.push({
  name: 'RED  grep of Description.txt does not count as reading',
  t: transcript('red-grep', required.map(f => grep(f))),
  expect: r => r.decision === 'block',
});

// 4. GREEN — every required source opened.
cases.push({
  name: 'GREEN all required sources opened',
  t: transcript('green-all', required.map(f => read(f))),
  expect: r => !r.decision,
});

// 5. GREEN — bypass token honoured.
cases.push({
  name: 'GREEN bypass token',
  t: (() => {
    const p = path.join(TMP, 'green-bypass.jsonl');
    fs.writeFileSync(p, [
      JSON.stringify({ message: { role: 'user', content: 'go' } }),
      JSON.stringify({ message: { role: 'assistant', content: [{ type: 'text', text: BA_TABLE_TEXT + '\n[skip-ba-table: not intake]' }] } }),
    ].join('\n'));
    return p;
  })(),
  expect: r => !r.decision,
});

let pass = 0;
console.log(`required sources for the active quest (${required.length}):`);
for (const f of required) console.log('   • ' + f);
console.log('');
for (const c of cases) {
  let r;
  try { r = run(c.t); } catch (e) { r = { error: String(e) }; }
  const ok = c.expect(r);
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}`);
  if (!ok) console.log('      got: ' + JSON.stringify(r).slice(0, 400));
}
console.log(`\n${pass}/${cases.length} passed`);
process.exit(pass === cases.length ? 0 : 1);
