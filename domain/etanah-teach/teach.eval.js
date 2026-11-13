#!/usr/bin/env node
// teach.eval.js — fixtures for domain/etanah-teach/teach.js (system-design Rules 6 + 12)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { auditLesson } = require('./teach.js');

let pass = 0, fail = 0;
function check(name, cond, info) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (info ? ' — ' + info : '')); } }

const layer = (n, first, extra) => `## L${n} · Layer ${n}\n${first}\n\n| a | b |\n|---|---|\n| 1 | 2 |\n${extra || ''}source: DOMAIN-GLOSSARY.md\nchecked: 2026-11-13\n`;
const lesson = (n, opts = {}) => {
  let t = (opts.noTitle ? '' : '# Learn — PRBB (Permohonan Permit Bahan Batuan)\n') + (opts.noState ? '' : 'state: melaka\n') + '\n';
  for (let i = 0; i <= n; i++) t += (opts.layer && opts.layer[i] !== undefined ? opts.layer[i] : layer(i, 'A plain sentence about layer ' + i + '.')) + '\n';
  if (!opts.noQuestions) t += '## Questions asked\n| Date | Question | Stop layer |\n|---|---|---|\n| 2026-11-13 | why 07/12 | L4 |\n';
  return t;
};
const fails = t => auditLesson(t, null).fails;
const failsTo = (t, to) => auditLesson(t, to).fails;

// 1 happy path
check('S1 good lesson L0-L4 passes', fails(lesson(4)).length === 0, fails(lesson(4)).join('; '));
// 2 reaches the stop layer
check('S2 --to L4 passes when L4 present', failsTo(lesson(4), 'L4').length === 0);
// 3 stops short of the asked layer
check('S3 --to L4 fails when lesson ends at L2', failsTo(lesson(2), 'L4').some(f => /L3: missing/.test(f)));
// 4 gap in the ladder
check('S4 gap L0 L1 L3 fails', fails(lesson(3, { layer: { 2: '' } })).some(f => /out of order or a gap/.test(f)));
// 5 out of order
{ const t = lesson(1).replace('## L0 · Layer 0', '## L1 · X').replace('## L1 · Layer 1', '## L0 · Y'); check('S5 L1 before L0 fails', fails(t).some(f => /out of order/.test(f))); }
// 6 layer opens with a table
check('S6 layer starting with a table fails', fails(lesson(1, { layer: { 1: '## L1 · T\n| x | y |\n|---|---|\nsource: a.md\nchecked: 2026-11-13\n' } })).some(f => /L1: first line/.test(f)));
// 7 layer opens with code
check('S7 layer starting with a code fence fails', fails(lesson(0, { layer: { 0: '## L0 · T\n```\nx\n```\n| a |\n|---|\nsource: a.md\nchecked: 2026-11-13\n' } })).some(f => /first line/.test(f)));
// 8 layer opens with file:line
check('S8 first line with Form.java:961 fails', fails(lesson(0, { layer: { 0: layer(0, 'See MlkBorang4CeForm.java:961 for it.') } })).some(f => /first line/.test(f)));
// 9 no source
check('S9 layer without source: fails', fails(lesson(0, { layer: { 0: '## L0 · T\nPlain.\n| a |\n|---|\nchecked: 2026-11-13\n' } })).some(f => /source: line missing/.test(f)));
// 10 empty source
check('S10 "source:" with nothing fails', fails(lesson(0, { layer: { 0: '## L0 · T\nPlain.\n| a |\n|---|\nsource: \nchecked: 2026-11-13\n' } })).some(f => /source/.test(f)));
// 11 no table or picture
check('S11 layer with prose only fails', fails(lesson(0, { layer: { 0: '## L0 · T\nPlain sentence.\nMore prose.\nsource: a.md\nchecked: 2026-11-13\n' } })).some(f => /table or picture/.test(f)));
// 12 picture counts as the visual
check('S12 picture instead of table passes', fails(lesson(0, { layer: { 0: '## L0 · T\nPlain sentence.\n![flow](learn/prbb-l2.png)\nsource: a.md\nchecked: 2026-11-13\n' } })).length === 0);
// 13 no checked date
check('S13 missing checked: fails', fails(lesson(0, { layer: { 0: '## L0 · T\nPlain.\n| a |\n|---|\nsource: a.md\n' } })).some(f => /checked/.test(f)));
// 14 TODO left
check('S14 TODO in lesson fails', fails(lesson(1, { layer: { 1: layer(1, 'TODO explain the urusan.') } })).some(f => /TODO/.test(f)));
// 15 missing title / state / questions
check('S15 no title fails', fails(lesson(0, { noTitle: true })).some(f => /title/.test(f)));
check('S16 no state fails', fails(lesson(0, { noState: true })).some(f => /state/.test(f)));
check('S17 no Questions asked fails', fails(lesson(0, { noQuestions: true })).some(f => /Questions asked/.test(f)));
// 18 empty file
check('S18 empty file fails', fails('').length >= 3);
// 19 CRLF line endings (Windows editors)
check('S19 CRLF lesson passes', fails(lesson(2).replace(/\n/g, '\r\n')).length === 0, fails(lesson(2).replace(/\n/g, '\r\n')).join('; '));
// 20 a list as first line
check('S20 bullet list as first line fails', fails(lesson(0, { layer: { 0: layer(0, '- a bullet') } })).some(f => /first line/.test(f)));
// 21 other ## sections between layers do not break the ladder
{ const t = lesson(2).replace('## L2', '## Notes\nsome note\n\n## L2'); check('S21 extra ## section between layers tolerated', fails(t).length === 0, fails(t).join('; ')); }
// 22 the CLI: PASS exit 0, FAIL exit 1, unreadable file exit 1, bad command exit 2
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'teach-eval-'));
  const good = path.join(dir, 'PRBB.md'); fs.writeFileSync(good, lesson(4));
  const bad = path.join(dir, 'BAD.md'); fs.writeFileSync(bad, lesson(1, { noState: true }));
  const env = Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: dir, TEACH_LOG: path.join(dir, 'log.jsonl') });
  const run = a => spawnSync(process.execPath, [path.join(__dirname, 'teach.js'), ...a], { encoding: 'utf8', env });
  const r1 = run(['audit', good, '--to', 'L4']);
  check('S22 CLI PASS exit 0 + TEACH: PASS line', r1.status === 0 && /TEACH: PASS/.test(r1.stdout), r1.stdout);
  const r2 = run(['audit', bad]);
  check('S23 CLI FAIL exit 1 + named line', r2.status === 1 && /TEACH: FAIL/.test(r2.stdout) && /state/.test(r2.stdout), r2.stdout);
  const r3 = run(['audit', path.join(dir, 'nope.md')]);
  check('S24 CLI unreadable file exit 1', r3.status === 1 && /cannot read/.test(r3.stdout));
  const r4 = run(['bogus']);
  check('S25 CLI bad command exit 2', r4.status === 2);
  const r5 = run(['sources', 'PRBB; rm -rf /']);
  check('S26 sources rejects a hostile urusan code', r5.status === 2);
  // sources with a planted knowledge folder
  const kd = path.join(dir, 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka');
  fs.mkdirSync(path.join(kd, 'learn'), { recursive: true }); fs.mkdirSync(path.join(kd, 'flowables-bpmn'), { recursive: true });
  fs.writeFileSync(path.join(kd, 'DOMAIN-GLOSSARY.md'), 'x'); fs.writeFileSync(path.join(kd, 'flowables-bpmn', 'MLK_PLP_PRBB.bpmn20.xml'), 'x');
  fs.copyFileSync(good, path.join(kd, 'learn', 'PRBB.md'));
  const r6 = run(['sources', 'prbb']);
  check('S27 sources lists the saved lesson layers and the BPMN', r6.status === 0 && /layers L0 2026-11-13/.test(r6.stdout) && /ok flowables-bpmn\/MLK_PLP_PRBB\.bpmn20\.xml/.test(r6.stdout), r6.stdout);
  const r7 = run(['sources', 'PRBB', '--state', 'perak']);
  check('S28 sources on a state with no folder says FAIL, exit 1', r7.status === 1 && /FAIL/.test(r7.stdout));
  // a session folder (worktree) with a partial knowledge copy must read the main checkout's full copy
  const wt = path.join(dir, '.claude', 'worktrees', 'wt1');
  const wtk = path.join(wt, 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka');
  fs.mkdirSync(wtk, { recursive: true }); fs.writeFileSync(path.join(wtk, 'DATABASE.md'), 'x');
  const r8 = spawnSync(process.execPath, [path.join(__dirname, 'teach.js'), 'sources', 'PRBB'], { encoding: 'utf8', env: Object.assign({}, env, { CLAUDE_PROJECT_DIR: wt }) });
  check('S30 from a session folder, sources reads the main checkout copy', r8.status === 0 && r8.stdout.includes(kd) && /saved lesson: learn\/PRBB\.md/.test(r8.stdout), r8.stdout.split('\n')[0]);
  // the sandbox log carries the monitoring fields; the real log.jsonl stays free of eval rows
  const rows = fs.readFileSync(path.join(dir, 'log.jsonl'), 'utf8').trim().split('\n').map(l => { try { return JSON.parse(l); } catch (_) { return {}; } });
  const last = rows.filter(r => r.cmd === 'audit').pop() || {};
  check('S29 audit log row has ts, outcome, goal_met, dur_ms', !!(last.ts && last.outcome && typeof last.goal_met === 'boolean' && typeof last.dur_ms === 'number'));
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\nteach.eval: ${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
