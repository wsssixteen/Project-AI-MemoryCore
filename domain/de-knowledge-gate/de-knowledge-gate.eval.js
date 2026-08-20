/**
 * de-knowledge-gate.eval.js — fixture suite for de-knowledge-gate.check.hook.js
 * Run: node domain/de-knowledge-gate/de-knowledge-gate.eval.js
 * Rule 6 v1.2: (b) fire check via evaluate() verdicts + (c) effect check via real process block.
 */
'use strict';
const { evaluate } = require('./de-knowledge-gate.check.hook.js');
const { spawnSync } = require('child_process');
const path = require('path');
const HOOK = path.resolve(__dirname, 'de-knowledge-gate.check.hook.js');

const t = (role, text) => ({ kind: 'text', role, text });
const tool = (name, p) => ({ kind: 'tool', name, path: p || '' });
const DE = t('assistant', 'Domain Expansion — closed. Barrier settles.');
const threeCites = t('assistant', 'Traced: DocumentManagementSystemClient.java:133 and RemotingServiceLocator.java:63 and BaseFileUploadVO.java:110 confirmed.');

const cases = [
  { name: 'not-de-close -> silent', events: [threeCites, t('assistant', 'summary, all done.')], expect: 'silent' },
  { name: 'de-close + no signal -> silent', events: [t('assistant', 'quick chat'), DE], expect: 'silent' },
  { name: 'de-close + S1 (>=3 file:line) + no list -> block', events: [threeCites, DE], expect: 'block' },
  { name: 'de-close + S1 + candidate list -> pass', events: [threeCites, t('assistant', '## Knowledge candidates\n| Discovery | Home |\n| upload flow | bake to FLOW-TRACES.md |'), DE], expect: 'pass' },
  { name: 'de-close + S1 + sentinel -> pass', events: [threeCites, t('assistant', '_no new knowledge this session_'), DE], expect: 'pass' },
  { name: 'de-close + S1 + bypass -> silent', events: [threeCites, t('assistant', 'Domain Expansion — closed [skip-knowledge-gate: personal]')], expect: 'silent' },
  { name: 'de-close + S3 (db tool) + no list -> block', events: [tool('mcp__postgres-mlit-pg__query_database', ''), DE], expect: 'block' },
  { name: 'de-close + S2 (deliverable write) + no list -> block', events: [tool('Write', 'C:/x/eTanah-Upload-Flow-Handover.md'), DE], expect: 'block' },
  { name: 'de-close + S4 (trace intent) + no list -> block', events: [t('user', 'can you research how the file upload flow works from UI to DMS'), tool('Read', 'X.java'), DE], expect: 'block' },
  { name: '2 file:line only (below threshold) -> silent', events: [t('assistant', 'Foo.java:10 and Bar.java:20 only'), DE], expect: 'silent' },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const r = evaluate(c.events);
  const ok = r.verdict === c.expect;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}  -> ${r.verdict} (${r.reason})`);
  ok ? pass++ : fail++;
}

// EFFECT (Rule 6c): real process emits exit 2 + rendered block reason on a block fixture
const proc = spawnSync('node', [HOOK], { input: JSON.stringify({ _testEvents: [threeCites, DE] }), encoding: 'utf8' });
const out = (proc.stdout || '') + (proc.stderr || '');
const effectOk = proc.status === 2 && /de-knowledge-gate/.test(out) && /Knowledge candidates/.test(out);
console.log(`${effectOk ? 'PASS' : 'FAIL'}  EFFECT: real process exits 2 with rendered block reason (status=${proc.status})`);
effectOk ? pass++ : fail++;

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail === 0 ? 0 : 1);
