#!/usr/bin/env node
// redmine-write-gate.eval.js — replay of 2026-09-04 #275847: a note was posted after "Start with the standard Salam Amar"
// (a wording instruction), never a post approval. The gate must BLOCK that shape and ALLOW an explicit "post it".
'use strict';
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'redmine-write-gate.check.hook.js');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const sb = fs.mkdtempSync(path.join(os.tmpdir(), 'rwg-'));
const user = t => JSON.stringify({ type: 'user', message: { role: 'user', content: t } });
const toolResult = () => JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'ok' }] } });
const asst = t => JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: t }] } });
function transcript(lines) { const p = path.join(sb, 't-' + Math.random().toString(36).slice(2) + '.jsonl'); fs.writeFileSync(p, lines.join('\n') + '\n'); return p; }
// the real writer shape used on 2026-09-04
const postScript = path.join(sb, 'post-note.js');
fs.writeFileSync(postScript, "const r=await fetch(`${BASE}/issues/275847.json`,{method:'PUT',headers:{'X-Redmine-API-Key':KEY},body:JSON.stringify({issue:{notes,assigned_to_id:1218}})});");
const WRITE_CMD = `node "${postScript}" "C:/x/quest/redmine-sync.js" "C:/x/note.txt"`;
const INLINE_WRITE = `curl -X PUT -H "X-Redmine-API-Key: abc" http://172.16.90.169/redmine/issues/275847.json -d '{"issue":{"notes":"hi"}}'`;
const READ_CMD = `node quest/redmine-sync.js 275847`;
const OTHER_PUT = `curl -X PUT https://example.com/api/thing -d '{"notes":"x"}'`;

function run(payload) {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(payload), encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
  return { out: (r.stdout || '') + (r.stderr || ''), status: r.status };
}
const blocked = r => /redmine-write-gate/.test(r.out) && /⛔/.test(r.out);
const results = []; const check = (n, c, d) => results.push({ n, pass: !!c, d });

let r = run({}); check('F1 clean stdin → exit 0', r.status === 0 && !blocked(r), 'exit=' + r.status);
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([asst('Note text: Salam Amar …'), user('Start with the standard "Salam Amar, ..."')]) });
check('F2 REPLAY #275847: wording instruction is NOT approval → BLOCK', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([asst('Note text …'), user('ok post it')]) });
check('F3 "post it" in the last user message → allow', !blocked(r) && /approved by miya/.test(r.out), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([user('post it'), asst('…'), user('perhaps I should review first?')]) });
check('F4 approval in an OLDER turn, last message is a review request → BLOCK', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([user('Your questions have been answered: "Post the Redmine note…"="Yes, post + reassign to Ammar (Recommended)"')]) });
check('F5 AskUserQuestion answer "Yes, post + reassign" → allow', !blocked(r), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([user('post it'), toolResult()]) });
check('F6 last line is a tool_result, real last user text says post it → allow', !blocked(r), r.out.slice(0, 200));
r = run({ tool_name: 'Bash', tool_input: { command: INLINE_WRITE }, transcript_path: transcript([user('show me the note first')]) });
check('F7 inline curl PUT to the redmine host → BLOCK', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: READ_CMD }, transcript_path: transcript([user('retrieve 275847')]) });
check('F8 redmine-sync.js (read-only) → silent', !blocked(r) && !/redmine-write-gate/.test(r.out), r.out.slice(0, 120));
r = run({ tool_name: 'Bash', tool_input: { command: OTHER_PUT }, transcript_path: transcript([user('x')]) });
check('F9 PUT to a non-redmine host → silent', !blocked(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([user('[skip-redmine-write-gate: already approved on WhatsApp]')]) });
check('F10 bypass token in the last user message → allow', !blocked(r) && /bypassed/.test(r.out), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD } });
check('F11 no transcript at all → BLOCK (no approval visible)', blocked(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([asst('miya said post it earlier'), user('hmm')]) });
check('F12 "post it" only inside an ASSISTANT line → BLOCK (self-approval)', blocked(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([user('Start with Salam')]) });
check('F13 effect — block text names the 404 fact + the approval phrases', blocked(r) && /404/.test(r.out) && /post it/.test(r.out), r.out.slice(0, 120));
r = run('{not json');
check('F14 malformed stdin → exit 0', r.status === 0, 'exit=' + r.status);
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([user("No, I will post it myself")]) });
check('F16 "I will post it myself" → BLOCK (reversal)', blocked(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([user("don't post it yet")]) });
check('F17 "don\'t post it yet" → BLOCK (negation)', blocked(r), r.out.slice(0, 120));
// F15 log rows
const logP = path.join(__dirname, 'log.jsonl');
const lastLog = fs.existsSync(logP) ? fs.readFileSync(logP, 'utf8').trim().split('\n').pop() : '';
check('F15 log.jsonl row carries ts + outcome', /"ts"/.test(lastLog) && /"outcome"/.test(lastLog), lastLog.slice(0, 100));

let failed = 0; for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nredmine-write-gate.eval: ' + (results.length - failed) + '/' + results.length + (failed ? ' RED' : ' green'));
fs.rmSync(sb, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
