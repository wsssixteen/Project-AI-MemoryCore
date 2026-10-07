#!/usr/bin/env node
// agent-spend-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case 1: 2026-07-19: canned deep-research by name spawned 105 agents inheriting session model Fable - 4.08M tokens, monthly spend limit hit mid-verify
// Replay case 2: 2026-10-07: .claude/workflows/quest-phase0.js ran 9 to 15 agents per quest start and none named a model, so all ran on the session model
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'agent-spend-gate.check.hook.js');
const ROOT = path.resolve(__dirname, '..', '..');
const { agentCalls, modelCounts } = require(path.join(__dirname, 'workflow-models.js'));
const sb = fs.mkdtempSync(path.join(os.tmpdir(), 'asg-'));
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d: d === undefined ? '' : String(d) }); }

const user = t => JSON.stringify({ type: 'user', message: { role: 'user', content: t } });
const asst = (model, side) => JSON.stringify({ type: 'assistant', isSidechain: !!side, message: { role: 'assistant', model, content: [{ type: 'tool_use', id: 't1', name: 'Read', input: {} }] } });
let seq = 0;
const transcript = lines => { const p = path.join(sb, 't' + (++seq) + '.jsonl'); fs.writeFileSync(p, lines.join('\n') + '\n'); return p; };
const file = (name, text) => { const p = path.join(sb, name); fs.writeFileSync(p, text); return p; };
const fx = (tool_name, tool_input, transcript_path) => {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name, tool_input, transcript_path }), encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
  return { out: r.stdout || '', err: r.stderr || '', status: r.status };
};
const blocked = r => r.out.includes('⛔') && r.status === 2;
const warned = r => r.out.includes('⚠️') && !r.out.includes('⛔') && r.status === 0;
const silent = r => !r.out.includes('agent-spend-gate') && r.status === 0;
const META = "export const meta = { name: 'x', description: 'y', phases: [{ title: 'A' }] }\n";

// F1: clean input → must NOT block (exit 0)
let rr = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', rr.status === 0, 'exit=' + rr.status);
rr = fx('Workflow', { name: 'deep-research', args: 'x' });
check('F2 replay 1: canned Workflow by name BLOCKED', blocked(rr), rr.out.slice(0, 80));
rr = fx('Agent', { prompt: 'do a thing', subagent_type: 'Explore' });
check('F3 Agent without model BLOCKED', blocked(rr), rr.out.slice(0, 80));
rr = fx('Agent', { prompt: 'do a thing', model: 'sonnet' });
check('F4 Agent WITH model sonnet passes silent', silent(rr), rr.out.slice(0, 80));
const tiered = META + "phase('A')\nconst a = await agent('read x', { label: 'r1', phase: 'A', model: 'sonnet', effort: 'low' })\nconst b = await agent(`sum ${a}`, { label: 'r2', model: 'sonnet' })\nreturn { a, b }\n";
rr = fx('Workflow', { scriptPath: file('nocap.js', tiered) });
check('F5 scriptPath without cap marker WARNS (not block)', warned(rr) && /cap marker/.test(rr.out), rr.out.slice(0, 80));
rr = fx('Workflow', { scriptPath: file('cap.js', 'const MAX_AGENTS = 2\n' + tiered) });
check('F6 scriptPath WITH cap marker and every agent on sonnet passes silent', silent(rr), rr.out.slice(0, 80));
rr = fx('Edit', { file_path: 'x.md' });
check('F7 unrelated tool passes silent', silent(rr), rr.out.slice(0, 80));

// ── v2 (2026-10-07): every agent() in a workflow names its model ───────────────────────────────
const OLD_PHASE0 = META + [
  "const base = `Quest Phase 0 for ticket ${t.qa}. Codebase root: ${t.codebaseRoot}.`",
  "phase('Discovery')",
  "const discovery = await agent(`${base}",
  "",
  "Read the brief (FULL), then classify (bug | enhancement).`,",
  "  { label: 'discovery', phase: 'Discovery', schema: DISCOVERY_SCHEMA })",
  "const recon = (await parallel(dims.map(d => () =>",
  "  agent(`${base}\\n\\nContext: ${ctx}\\n\\n${d.prompt}`, { label: `recon:${d.key}`, phase: 'Recon', schema: FINDING_SCHEMA })))).filter(Boolean)",
  "const synthesis = await agent(`${base} Synthesize.`, { label: 'synthesis', agentType: 'general-purpose', schema: SYNTH_SCHEMA })",
  "return { discovery, recon, synthesis }",
].join('\n');
rr = fx('Workflow', { script: OLD_PHASE0 });
check('F8 replay 2: the old quest-phase0 shape (3 agents, no model) BLOCKED, all three lines named', blocked(rr) && /3 of 3 agent\(\) call/.test(rr.out) && /line 4 \(discovery\)/.test(rr.out) && /recon:/.test(rr.out) && /synthesis/.test(rr.out), rr.out.slice(0, 260));
check('F9 effect: the block text names the rule, the default model and how to bypass', /Delegation Economy/.test(rr.out) && /model: 'sonnet' \(Sonnet 5\.5\)/.test(rr.out) && /skip-spend-gate/.test(rr.out) && /Delegation Economy/.test(rr.err), rr.err.slice(0, 120));
rr = fx('Workflow', { script: tiered });
check('F10 inline script, every agent on sonnet → silent', silent(rr), rr.out.slice(0, 120));
rr = fx('Workflow', { script: tiered + "const c = await agent('one more', { label: 'r3' })\n" });
check('F11 one agent without a model among three → BLOCKED, "1 of 3", its line and label named', blocked(rr) && /1 of 3 agent/.test(rr.out) && /line 6 \(r3\)/.test(rr.out), rr.out.slice(0, 200));
rr = fx('Workflow', { script: META + "// call agent() per file, then agent(x) again\nconst p = 'ask the agent(s) nicely: agent(y)'\nconst a = await agent(`tell me about agent(z) and model: 'opus'`, { model: 'sonnet' })\n" });
check('F12 "agent(" inside a comment, a string and a prompt is not a call → silent, 1 call counted', silent(rr) && agentCalls(META + "// agent()\nconst a = await agent(`x agent(z)`, { model: 'sonnet' })").length === 1, rr.out.slice(0, 160));
rr = fx('Workflow', { script: META + "const a = await agent(`use model: 'sonnet' for this, thanks`, { label: 'x' })\n" });
check('F13 "model:" only inside the prompt text → BLOCKED (a prompt is not a model)', blocked(rr), rr.out.slice(0, 160));
rr = fx('Workflow', { script: META + "const SONNET = { model: 'sonnet', effort: 'medium' }\nconst a = await agent('x', { ...SONNET, label: 'a' })\nconst b = await agent('y', SONNET)\n" });
check('F14 a tier constant, spread or passed whole → silent', silent(rr), rr.out.slice(0, 160));
rr = fx('Workflow', { script: META + "const out = await parallel(DIMS.map(d => () => agent(d.prompt, { label: d.key, model: d.model, effort: d.effort })))\n" });
check('F15 model chosen per item (model: d.model) → silent', silent(rr), rr.out.slice(0, 160));
rr = fx('Workflow', { script: META + "const a = await agent('x', { model: 'haiku' })\n" });
check('F16 haiku agent in a workflow → BLOCKED (banned from delegation)', blocked(rr) && /banned from delegation/.test(rr.out), rr.out.slice(0, 160));
rr = fx('Agent', { prompt: 'read it', model: 'haiku' });
check('F17 Agent tool with haiku → BLOCKED', blocked(rr) && /banned from delegation/.test(rr.out), rr.out.slice(0, 160));
rr = fx('Workflow', { script: META + "const a = await agent('x', { model: 'sonnet' })\nconst v = await agent('refute it', { model: 'opus' })\n" });
check('F18 opus agent with no stated reason → WARN, not block', warned(rr) && /1 agent\(\) call\(s\) run on opus\/fable but the script states 0 reason/.test(rr.out), rr.out.slice(0, 200));
rr = fx('Workflow', { script: META + "const a = await agent('x', { model: 'sonnet' })\n// opus-reason: adversarial check of the root cause that decides the fix\nconst v = await agent('refute it', { model: 'opus' })\n" });
check('F19 opus agent with an opus-reason comment → silent', silent(rr), rr.out.slice(0, 200));
rr = fx('Workflow', { script: META + "// opus-reason: verdict that ships\nconst v = await agent('a', { model: 'opus' })\nconst w = await agent('b', { model: 'fable' })\n" });
check('F20 two heavy agents, one reason → WARN names both lines', warned(rr) && /2 agent\(\) call\(s\)/.test(rr.out) && /states 1 reason/.test(rr.out), rr.out.slice(0, 200));
rr = fx('Agent', { prompt: 'judge it', model: 'opus' });
check('F21 Agent tool with opus → WARN (the plan row must say why), not block', warned(rr) && /DELEGATION PLAN row must say why/.test(rr.out), rr.out.slice(0, 200));
rr = fx('Agent', { prompt: 'do a thing' }, transcript([user('run it [skip-spend-gate: one-off probe I asked for]')]));
check('F22 bypass token in miya\'s LAST message → allowed, marked bypassed', rr.status === 0 && /bypassed by miya/.test(rr.out), rr.out.slice(0, 120));
rr = fx('Agent', { prompt: 'do a thing' }, transcript([user('[skip-spend-gate: earlier run]'), asst('claude-opus-5-5'), user('ok now the next ticket')]));
check('F23 bypass token only in an OLDER message → BLOCKED', blocked(rr), rr.out.slice(0, 120));
rr = fx('Agent', { prompt: 'do a thing', description: '[skip-spend-gate: I say so]' }, transcript([user('go on')]));
check('F24 bypass token written into the tool call by the assistant → BLOCKED (only his message counts)', blocked(rr), rr.out.slice(0, 120));
rr = fx('Agent', { prompt: 'read it', model: 'sonnet' }, transcript([user('go'), asst('claude-fable-5-1')]));
check('F25 session not on Opus 5.5 → WARN names the session model, not block', warned(rr) && /runs on claude-fable-5-1, not Opus 5\.5/.test(rr.out), rr.out.slice(0, 200));
rr = fx('Agent', { prompt: 'read it', model: 'sonnet' }, transcript([user('go'), asst('claude-opus-5-5')]));
check('F26 session on Opus 5.5 + sonnet agent → silent', silent(rr), rr.out.slice(0, 200));
rr = fx('Agent', { prompt: 'read it', model: 'sonnet' }, transcript([user('go'), asst('claude-opus-5-5'), asst('claude-sonnet-5-5', true)]));
check('F27 a subagent entry (sidechain, sonnet) after the main opus entry → silent (not read as the session model)', silent(rr), rr.out.slice(0, 200));
rr = fx('Workflow', { script: META + "const ask = (p, o) => agent(p, { model: 'sonnet', effort: 'low', ...o })\nconst a = await ask('x', { label: 'a' })\nconst b = await ask('y', { label: 'b' })\n" });
check('F28 a wrapper that sets the model once → silent', silent(rr), rr.out.slice(0, 160));
rr = fx('Workflow', { script: META + "const a = await agent(`a ) b ( ${JSON.stringify({ x: ')', y: \"}\" })} \\` c`, { label: 'odd', model: 'sonnet' }).then(v => ({ v, n: f(1) }))\n" });
check('F29 brackets, quotes and a backtick inside the prompt do not confuse the scan → silent', silent(rr), rr.out.slice(0, 160));
rr = fx('Workflow', { scriptPath: path.join(sb, 'missing.js') });
check('F30 unreadable scriptPath → cap WARN only (nothing to scan), never a crash', warned(rr), rr.out.slice(0, 120));
rr = spawnSync(process.execPath, [HOOK], { input: '{not json', encoding: 'utf8', timeout: 30000, env: process.env });
check('F31 malformed stdin → exit 0', rr.status === 0, 'exit=' + rr.status);
rr = fx('Workflow', { script: META + "const a = await agent('x', { agentType: 'general-purpose', schema: S })\n" });
check('F32 agentType without a model → BLOCKED', blocked(rr), rr.out.slice(0, 120));
rr = fx('Workflow', { script: META + "const r = await myagent('x', {})\nconst s = await tools.agent('y', {})\nconst agents = 3\nlog(`agents(${agents})`)\n" });
check('F33 myagent( · tools.agent( · agents → not agent() calls → silent', silent(rr), rr.out.slice(0, 120));
rr = fx('Workflow', { script: META + "const a = await agent('x', { schema: { type: 'object', properties: { model: { type: 'string' } } } })\n" });
check('F34 accepted risk, pinned: a schema property named model reads as a chosen model → not blocked', !blocked(rr), rr.out.slice(0, 120));
check('F35 modelCounts gives the per-model tally telemetry needs', JSON.stringify(modelCounts(tiered + "await agent('v', { model: 'opus' })\nawait agent('w', {})")) === '{"sonnet":2,"opus":1,"none":1}', JSON.stringify(modelCounts(tiered)));

// The one saved workflow that runs on every quest start must stay tiered.
const phase0 = fs.readFileSync(path.join(ROOT, '.claude', 'workflows', 'quest-phase0.js'), 'utf8');
const p0 = agentCalls(phase0), p0c = modelCounts(phase0);
check('F36 shipped quest-phase0.js: every agent() names a model', p0.length >= 6 && p0.every(c => c.model), JSON.stringify(p0.filter(c => !c.model)));
check('F37 shipped quest-phase0.js: sonnet is the majority, no haiku, each opus call has a stated reason', (p0c.sonnet || 0) > (p0c.opus || 0) && !p0c.haiku && !p0c.none && (phase0.match(/\/\/[^\n]*opus-reason\s*:/g) || []).length >= (p0c.opus || 0), JSON.stringify(p0c));
rr = fx('Workflow', { scriptPath: path.join(ROOT, '.claude', 'workflows', 'quest-phase0.js') });
check('F38 shipped quest-phase0.js through the gate → never blocked', !blocked(rr), rr.out.slice(0, 200));
const readme = (() => { try { return fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8'); } catch (_) { return ''; } })();
check('F39 README carries symptom / goal / goal_signal / retention / footprint / state-scoped', ['symptom: ', 'goal: ', 'goal_signal: ', 'retention: ', 'footprint: per-tool', 'state-scoped: no'].every(k => readme.includes(k)) && !/TODO/.test(readme));
const claudeMd = fs.readFileSync(path.join(ROOT, '.claude', 'CLAUDE.md'), 'utf8');
check('F40 CLAUDE.md Delegation Economy names the orchestrator and the default the gate enforces', /Orchestrator[^\n]*Opus 5\.5/.test(claudeMd) && /`sonnet` \(Sonnet 5\.5/.test(claudeMd) && /agent-spend-gate/.test(claudeMd));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d.slice(0, 300))); }
console.log('\nagent-spend-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
fs.rmSync(sb, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
