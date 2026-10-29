#!/usr/bin/env node
// phase0-alter.eval.js — runs the REAL .claude/workflows/quest-phase0.js with stub agent()/parallel()/phase(),
// records each stage's prompt, and checks that the ALTER layer reaches Phase 0 (goal 1, 2026-10-29 per miya):
// KnowledgeLoad reads it when the layer is flowable or the ask is an alter; Synthesize reads it whenever the
// fix-shape moves a token, even when the ticket never said alter (#277926).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, '.claude', 'workflows', 'quest-phase0.js'), 'utf8').replace(/^export const meta/m, 'const meta');

async function runWith(discovery, knowledgeReply) {
  const prompts = {};
  const agent = async (prompt, opts) => {
    prompts[opts.label] = prompt;
    if (opts.label === 'discovery') return discovery;
    if (opts.label === 'knowledge-load') return knowledgeReply;
    if (opts.label === 'synthesis') return { fixShape: 'x', confidence: 'x', reproAchieved: 'n/a', seniorBlocker: 'none', qaDocWritten: false };
    return { findings: [], refuted: false, verdict: 'n/a', text: '' };
  };
  const parallel = async fns => Promise.all(fns.map(f => f()));
  const pipeline = async (xs, ...stages) => xs;
  const phase = () => {};
  const log = () => {}; const budget = () => ({}); const fn = new Function('agent', 'phase', 'parallel', 'pipeline', 'args', 'log', 'budget', `return (async () => { ${SRC} })()`);
  await fn(agent, phase, parallel, pipeline, { qa: 'QA-286988', state: 'melaka', knowledgeDir: 'k', qaDocPath: 'q', dbMcp: 'm', ticketType: 'bug', depth: 'quick', codebaseRoot: 'etanah-pelupusan' }, log, budget);
  return prompts;
}
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d });

(async () => {
  const flow = await runWith({ layerGuess: 'flowable', symptom: 'Request untuk Alter tugasan ke Penyediaan Laporan Tanah', urusans: ['PLPS'] }, { alwaysLoaded: [], conditionalLoaded: [], analogs: [], alterLayerLoaded: true });
  check('P1 KnowledgeLoad prompt carries the ALTER rule with the playbook + both tool READMEs', /ALTER: when the layer is "flowable"/.test(flow['knowledge-load'] || '') && /ALTER-TICKET-PLAYBOOK\.md/.test(flow['knowledge-load']) && /FlowableAlter\\README\.md/.test(flow['knowledge-load']) && /runner\\README\.md/.test(flow['knowledge-load']), (flow['knowledge-load'] || '').slice(0, 120));
  check('P2 KnowledgeLoad names the Internal Issue (PROD) "Request untuk Alter" case', /Internal Issue \(PROD\)/.test(flow['knowledge-load'] || ''), '');
  check('P3 Synthesize carries the TOKEN-MOVE rule and sees KnowledgeLoad already read it (alterLayerLoaded=true)', /TOKEN-MOVE FIX/.test(flow.synthesis || '') && /alterLayerLoaded=true\)/.test(flow.synthesis), (flow.synthesis || '').slice(0, 120));
  check('P4 the runner is described as refusing PROD (never offered for PROD)', /refuses PROD/.test(flow.synthesis || ''), '');
  const jsf = await runWith({ layerGuess: 'jsf', symptom: 'ID permohonan tidak papar pada dashboard user', urusans: ['MCL'] }, { alwaysLoaded: [], conditionalLoaded: [], analogs: [] });
  check('P5 #277926 shape: layer jsf, no alter word → Synthesize still carries the TOKEN-MOVE rule, alterLayerLoaded=false (must read it itself)', /TOKEN-MOVE FIX/.test(jsf.synthesis || '') && /alterLayerLoaded=false\)/.test(jsf.synthesis) && /even when the ticket never said "alter"/.test(jsf.synthesis), (jsf.synthesis || '').slice(0, 160));
  const calls = [...SRC.matchAll(/\bagent\(\s*`[\s\S]*?`\s*,\s*\{/g)].map(m => {
    let i = m.index + m[0].length, depth = 1, out = '{';
    while (i < SRC.length && depth) { const c = SRC[i++]; if (c === '{') depth++; if (c === '}') depth--; out += c; }
    return out;
  });
  const noModel = calls.filter(o => !/model\s*:|\.\.\.(READ|TRACE)\b|\.\.\.d\b/.test(o));
  check(`P6 every agent() opts names a model (${calls.length} calls scanned)`, calls.length >= 4 && noModel.length === 0, noModel.join(' | '));
  check('P7 SYNTH_SCHEMA requires alterCommand ("n/a" allowed), so every run states token-move or not', /SYNTH_SCHEMA = \{ type: 'object', required: \[[^\]]*'alterCommand'/.test(SRC), '');
  let failed = 0;
  for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
  console.log('\nphase0-alter.eval: ' + (results.length - failed) + '/' + results.length + (failed ? ' RED' : ' green'));
  process.exit(failed ? 1 : 0);
})().catch(e => { console.log('FAIL  script did not run under stubs → ' + e.message); process.exit(1); });
