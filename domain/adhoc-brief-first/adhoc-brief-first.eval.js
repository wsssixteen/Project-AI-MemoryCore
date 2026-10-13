#!/usr/bin/env node
// adhoc-brief-first.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-10-13 ADHOC-MLPS-2026-4: five save-set writes on the main thread before the brief
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'adhoc-brief-first.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'adhoc-brief-first-'));
let seq = 0;
const L = o => JSON.stringify(o);
const U = text => L({ type: 'user', message: { role: 'user', content: text } });
const UM = text => L({ type: 'user', isMeta: true, message: { role: 'user', content: text } });
const AT = text => L({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });
const AU = (name, input) => L({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't' + (++seq), name, input }] } });
const BRIEF = 'Title: MLKSTG - MLPS tandatangan Borang 4Ae ralat GIS\n' + 'The Tandatangan click fails because the licence write to GIS fails. '.repeat(8);
const NARRATION = 'Investigation is done; now saving the adhoc and running its audit before I give you the result.';
const QUERY = AU('mcp__postgres-mlkstg1-pg__query_database', { query: 'SELECT 1' });
const ASK = U('start adhoc quest for melaka internal staging: klik tandatangan > error');

function transcript(lines) {
  const f = path.join(TMP, 't' + (++seq) + '.jsonl');
  fs.writeFileSync(f, lines.join('\n'));
  return f;
}
function run(tool, input, lines, extra) {
  const payload = Object.assign({ tool_name: tool, tool_input: input }, lines === undefined ? {} : { transcript_path: Array.isArray(lines) ? transcript(lines) : lines }, extra || {});
  return spawnSync(process.execPath, [HOOK], { input: JSON.stringify(payload), encoding: 'utf8', timeout: 30000, env: process.env });
}
const blocked = r => r.status === 2 || /"decision"\s*:\s*"(block|deny)"|permissionDecision"\s*:\s*"deny"/.test(r.stdout || '');
const said = r => (r.stdout || '') + (r.stderr || '');
function expectBlock(n, r) { check(n, blocked(r) && /adhoc-brief-first/.test(said(r)), 'exit=' + r.status + ' out=' + said(r).slice(0, 120)); }
function expectPass(n, r) { check(n, !blocked(r) && r.status === 0, 'exit=' + r.status + ' out=' + said(r).slice(0, 120)); }

const START = { command: 'node "$m\\quest\\active-cli.js" start ADHOC-MLPS-2026-4 phase=0 status=active ticket_type=adhoc' };
const DOC = { file_path: 'C:\\x\\projects\\coding-projects\\active\\ADHOC-MLPS-2026-4\\ADHOC-MLPS-2026-4.md', content: '# doc' };

// ── the replay case and its siblings: a save-set write with no brief and no agent → BLOCK
expectBlock('R1 replay 2026-10-13: investigation, a one-line note, then active-cli start ADHOC', run('PowerShell', START, [ASK, QUERY, AT(NARRATION)]));
expectBlock('B2 Write of the ADHOC quest doc', run('Write', DOC, [ASK, QUERY]));
expectBlock('B3 register row appended', run('PowerShell', { command: "Add-Content -LiteralPath $reg -Value $row  # ADHOC-REGISTER.md" }, [ASK, QUERY]));
expectBlock('B4 the audit', run('PowerShell', { command: 'node "$m\\lib\\adhoc-save-audit.js" ADHOC-MLPS-2026-4' }, [ASK, QUERY]));
expectBlock('B5 notes.js test data', run('Bash', { command: 'node quest/notes.js --qa ADHOC-MLPS-2026-4 --env MLKSTG --urusan MLPS --reset' }, [ASK, QUERY]));
expectBlock('B6 Task folder created', run('PowerShell', { command: "New-Item -ItemType Directory -Force -Path 'C:\\Tasks\\Melaka\\291. AH - STG - MLPS - Tandatangan ralat GIS\\1. Brief'" }, [ASK, QUERY]));
expectBlock('B7 a status update of an ADHOC block is a save too', run('PowerShell', { command: 'node quest\\active-cli.js update ADHOC-MLPS-2026-4 status=hold' }, [ASK, QUERY]));
expectBlock('B8 Edit of ADHOC-REGISTER.md', run('Edit', { file_path: 'C:\\x\\etanah-knowledge\\melaka\\ADHOC-REGISTER.md', old_string: 'a', new_string: 'b' }, [ASK, QUERY]));

// ── the allowed routes
expectPass('P1 the save was handed to a background Agent earlier in this turn', run('PowerShell', START, [ASK, QUERY, AU('Agent', { description: 'Save adhoc', prompt: 'Write the adhoc save-set for ADHOC-MLPS-2026-4', model: 'sonnet' })]));
expectPass('P2 the call comes from a subagent (agent_id present), empty turn', run('Write', DOC, [ASK], { agent_id: 'a1' }));
expectPass('P3 a brief of 400+ characters is already shown in this turn', run('PowerShell', START, [ASK, QUERY, AT(BRIEF)]));
expectPass('P4 hook feedback inside the turn does not reset it (brief, feedback, then save)', run('PowerShell', START, [ASK, QUERY, AT(BRIEF), UM('Stop hook feedback:\nBLOCKED'), AT('delta')]));
expectPass('P5 miya waives it in his own message', run('PowerShell', START, [U('save it now on the main thread [skip-brief-first: agent tool is down]'), QUERY]));

// ── adversarial: things that look like a save and are not
expectPass('N1 Read of an ADHOC quest doc', run('Read', { file_path: DOC.file_path }, [ASK]));
expectPass('N2 Write of another file whose CONTENT names an ADHOC doc and active-cli start', run('Write', { file_path: 'C:\\x\\lib\\some.eval.js', content: 'node quest\\active-cli.js start ADHOC-X-2026-1 ADHOC-X-2026-1.md' }, [ASK]));
expectPass('N3 a search for the save command is not a save', run('PowerShell', { command: "Select-String -Path quest\\*.js -Pattern 'active-cli.js start ADHOC-'" }, [ASK]));
expectPass('N4 a ticket quest doc (QA-284544.md)', run('Write', { file_path: 'C:\\x\\projects\\coding-projects\\active\\QA-284544\\QA-284544.md', content: 'x' }, [ASK]));
expectPass('N5 active-cli update of a ticket block', run('PowerShell', { command: 'node quest\\active-cli.js update QA-284544 status=active' }, [ASK]));
expectPass('N6 Edit of the adhoc-save skill itself', run('Edit', { file_path: 'C:\\x\\.claude\\skills\\adhoc-save\\SKILL.md', old_string: 'a', new_string: 'ADHOC-REGISTER.md' }, [ASK]));
expectPass('N7 the eval of the audit is not the audit', run('PowerShell', { command: 'node lib\\adhoc-save-audit.eval.js' }, [ASK]));

// ── adversarial: the waiver and the brief cannot be faked from my side
expectBlock('A1 the waiver token in MY text does not waive it (self-disarm)', run('PowerShell', START, [ASK, QUERY, AT('[skip-brief-first: I am in a hurry]')]));
expectBlock('A2 the waiver token echoed inside hook feedback does not waive it', run('PowerShell', START, [ASK, QUERY, UM('Stop hook feedback:\n[skip-brief-first: echoed]')]));
expectBlock('A3 a brief shown in an EARLIER turn does not cover this turn', run('PowerShell', START, [ASK, AT(BRIEF), U('ok thanks, anything else?'), QUERY]));
expectBlock('A4 an Agent started for something else does not count', run('PowerShell', START, [ASK, AU('Agent', { description: 'Explore', prompt: 'find callers of insertGITP in etanah-common' })]));
expectBlock('A5 an empty waiver has no reason and does not waive it', run('PowerShell', START, [U('save it [skip-brief-first: ]'), QUERY]));

// ── the save agent itself may only start AFTER the brief (the second miss of 2026-10-13: agent first, brief second)
const SAVE_AGENT = { description: 'Save adhoc', prompt: '[skip-brief-first: background save agent] write the save-set for ADHOC-MLPS-2026-4 and run adhoc-save-audit', model: 'sonnet', run_in_background: true };
expectBlock('G1 the adhoc save agent started BEFORE any brief', run('Agent', SAVE_AGENT, [ASK, QUERY]));
expectPass('G2 the adhoc save agent started after the brief (stop feedback in between)', run('Agent', SAVE_AGENT, [ASK, QUERY, AT(BRIEF), UM('Stop hook feedback:\n▶ adhoc-brief-first: the brief is delivered')]));
expectPass('G3 an Agent that is not a save agent is not touched', run('Agent', { description: 'Explore', prompt: 'find callers of insertGITP in etanah-common' }, [ASK, QUERY]));
expectBlock('G4 the waiver line inside the agent prompt does not let the PARENT start it early', run('Agent', SAVE_AGENT, [ASK]));
expectPass('G5 seen from the agent: its own prompt opens the turn and carries the waiver line', run('PowerShell', START, [U(SAVE_AGENT.prompt)]));

// ── adversarial: broken inputs never block
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);
r = spawnSync(process.execPath, [HOOK], { input: 'not json at all', encoding: 'utf8', timeout: 30000, env: process.env });
check('F2 malformed stdin exits 0', r.status === 0, 'exit=' + r.status);
expectPass('F3 transcript path missing on disk: fail-open', run('PowerShell', START, path.join(TMP, 'nope.jsonl')));
expectPass('F4 no transcript path at all: fail-open', run('PowerShell', START, undefined));
const plain = path.join(TMP, 'plain.jsonl'); fs.writeFileSync(plain, 'this is not json\nneither is this');
expectPass('F5 plain-text transcript: fail-open', run('PowerShell', START, plain));
const big = [ASK]; for (let i = 0; i < 4000; i++) big.push(QUERY);
r = run('PowerShell', START, big);
expectBlock('F6 a 4000-event turn is still read and blocked', r);
expectPass('F7 tool_input missing', run('PowerShell', undefined, [ASK]));

// accepted-risk (not fixtures): (1) a mid-turn text that the session log did not record cannot count as a brief,
//   so "brief then save on the main thread" may be blocked; the block text sends the save to the background agent,
//   which is the wanted route. (2) a subagent call that carries no agent_id and whose parent turn has no Agent
//   event in the transcript it is given would be blocked; P1 covers the normal case.

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nadhoc-brief-first.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
