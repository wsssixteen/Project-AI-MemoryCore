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
// 2026-09-25 replay: /quest resume step 1a-ii runs this local-only reader; its body names redmine-sync.js + a /notes:/ regex.
const TLV = path.join(ROOT, 'quest', 'ticket-load-verify.js');
const TLV_CMD = 'node quest/ticket-load-verify.js 256334';
const tlvCopy = path.join(sb, 'tlv-copy.js'); fs.copyFileSync(TLV, tlvCopy);
const spacedDir = path.join(sb, 'dir with space'); fs.mkdirSync(spacedDir);
const spacedWriter = path.join(spacedDir, 'post-note.js'); fs.copyFileSync(postScript, spacedWriter);
const lookalike = path.join(sb, 'xticket-load-verify.js'); fs.copyFileSync(postScript, lookalike);

// Legacy fixtures (F1-F55) test the post-window behaviour; the v1.4 stage-only fixtures pass their own date.
function run(payload, until = '2000-01-01', root = ROOT) {
  // REDMINE_GATE_SLIPS: a blocked fixture must never write a repeat-block slip row into the real ledger (57 bogus rows on 2026-10-30).
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(payload), encoding: 'utf8', timeout: 30000, cwd: root, env: { ...process.env, REDMINE_STAGE_ONLY_UNTIL: until, CLAUDE_PROJECT_DIR: root, REDMINE_GATE_SLIPS: path.join(sb, 'slips-sandbox.jsonl') } });
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
const noApproval = () => transcript([user('/quest resume 256334')]);
const silent = r => !blocked(r) && !/redmine-write-gate/.test(r.out);
r = run({ tool_name: 'PowerShell', tool_input: { command: TLV_CMD }, transcript_path: noApproval() });
check('F18 REPLAY 2026-09-25: node quest/ticket-load-verify.js 256334 → silent', silent(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${tlvCopy}" 256334` }, transcript_path: noApproval() });
check('F19 same body under another name → BLOCK (F18 passes on the exemption, not a vacuous body)', blocked(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: 'node .\\quest\\ticket-load-verify.js 256334' }, transcript_path: noApproval() });
check('F20 backslash path form → silent', silent(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${TLV}" 256334` }, transcript_path: noApproval() });
check('F21 absolute quoted path (repo root has spaces) → silent', silent(r), r.out.slice(0, 120));
r = run({ tool_name: 'Bash', tool_input: { command: `${TLV_CMD} && ${INLINE_WRITE}` }, transcript_path: noApproval() });
check('F22 exempt script + inline curl PUT in the same command → BLOCK', blocked(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: `${TLV_CMD}; node "${postScript}"` }, transcript_path: noApproval() });
check('F23 exempt script chained with a writer script → BLOCK (the writer body is still scanned)', blocked(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${postScript}" "C:/x/quest/ticket-load-verify.js"` }, transcript_path: noApproval() });
check('F24 writer passes ticket-load-verify.js as an ARGUMENT → BLOCK', blocked(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${lookalike}" 256334` }, transcript_path: noApproval() });
check('F25 look-alike name xticket-load-verify.js → BLOCK (basename anchor)', blocked(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${spacedWriter}"` }, transcript_path: noApproval() });
check('F26 writer at a quoted path with spaces → BLOCK (body is read)', blocked(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: 'node quest/redmine-sync.eval.js' }, transcript_path: noApproval() });
check('F27 redmine-sync.eval.js (read-only eval) → silent', silent(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node quest/redmine-sync.js 256334 && ${TLV_CMD}` }, transcript_path: noApproval() });
check('F28 two exempt scripts chained → silent', silent(r), r.out.slice(0, 120));
r = run({ tool_name: 'Bash', tool_input: { command: `node core/slips.js add --category x --evidence "blocked node quest/ticket-load-verify.js 256334 on resume"` }, transcript_path: noApproval() });
check('F30 exempt script only MENTIONED inside an argument of a clean script → silent (live false positive 2026-09-25)', silent(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: `${TLV_CMD} --x "-X PUT"` }, transcript_path: noApproval() });
check('F31 exempt script + mutation-shaped text in the command → exemption void → BLOCK', blocked(r), r.out.slice(0, 120));
r = run({ tool_name: 'PowerShell', tool_input: { command: `${TLV_CMD} --x "status_id"` }, transcript_path: noApproval() });
check('F31b exempt script + a bare field name in the command → silent (v1.3: a field name is not a write)', silent(r), r.out.slice(0, 120));
// 2026-09-29 (#282061): status-only writes + the real popup-answer shape (a tool_result, not user text)
const statusScript = path.join(sb, 'set-status.js');
fs.writeFileSync(statusScript, "// X-Redmine-API-Key\nreq('PUT', '/issues/282061.json', { issue: { status_id: 2 } });");
const statusNoteScript = path.join(sb, 'set-status-note.js');
fs.writeFileSync(statusNoteScript, "// X-Redmine-API-Key\nreq('PUT', '/issues/282061.json', { issue: { status_id: 2, notes: 'x' } });");
const popup = t => JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: t }] } });
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${statusScript}"` }, transcript_path: transcript([user("4. Yes, for goodness sake, update the redmine")]) });
check('F32 status-only write + "update the redmine" → allow', !blocked(r) && /status-only write approved/.test(r.out), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${statusNoteScript}"` }, transcript_path: transcript([user('update the redmine')]) });
check('F33 status + NOTE write + "update the redmine" → BLOCK (a note still needs post it)', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${statusScript}"` }, transcript_path: transcript([user("don't update the redmine yet")]) });
check('F34 status-only + "don\'t update the redmine" → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${statusScript}"` }, transcript_path: transcript([user('why does that happen'), popup('Your questions have been answered: "Set status?"="Yes, post In Progress". You can now continue.')]) });
check('F35 real popup answer (tool_result) "Yes, post In Progress" → allow', !blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${statusScript}"` }, transcript_path: transcript([user('post it'), popup('Your questions have been answered: "Set status?"="Not now". You can now continue.')]) });
check('F36 popup answer "Not now" after an older "post it" → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${statusScript}"` }, transcript_path: transcript([user('why does that happen in the first place?')]) });
check('F37 status-only + unrelated question → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${statusScript}"` }, transcript_path: transcript([user('update the redmine'), popup('file contents: ok')]) });
check('F38 a non-popup tool_result after "update the redmine" is skipped → allow', !blocked(r), r.out.slice(0, 160));
// 2026-09-28 (v1.3): a GET script that READS done_ratio / status_id / notes is not a write.
const getAudit = path.join(sb, 'audit.js');
fs.writeFileSync(getAudit, [
  "const http = require('http'); const BASE = 'http://172.16.90.169/redmine'; const KEY = process.env.REDMINE_KEY;",
  "for (const n of [282061, 281324]) http.get(`${BASE}/issues/${n}.json?include=journals&key=${KEY}`, res => {",
  "  let body = ''; res.on('data', c => body += c);",
  "  res.on('end', () => { const i = JSON.parse(body).issue;",
  "    const notes = (i.journals || []).map(j => j.notes).filter(Boolean);",
  "    console.log(n, 'Post', i.status.name, i.status_id, i.done_ratio, i.assigned_to_id, i['notes'], 'Journal:', notes.length); }); });",
].join('\n'));
const getAuditExplicit = path.join(sb, 'audit-get.js');
fs.writeFileSync(getAuditExplicit, "const r = await fetch(`http://172.16.90.169/redmine/issues/282061.json`, { method: 'GET', headers: { 'X-Redmine-API-Key': KEY } }); const i = (await r.json()).issue; console.log(i.done_ratio, i.status_id);");
const writer = (name, text) => { const p = path.join(sb, name); fs.writeFileSync(p, text); return p; };
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${getAudit}"` }, transcript_path: noApproval() });
check('F39 REPLAY 2026-09-28: http.get script reading done_ratio / status_id / notes → silent', silent(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${getAuditExplicit}"` }, transcript_path: noApproval() });
check('F40 fetch with method GET reading done_ratio → silent', silent(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `Invoke-RestMethod -Method Get -Headers @{'X-Redmine-API-Key'=$k} http://172.16.90.169/redmine/issues/282061.json | % { $_.issue.done_ratio }` }, transcript_path: noApproval() });
check('F41 Invoke-RestMethod GET reading done_ratio → silent', silent(r), r.out.slice(0, 160));
r = run({ tool_name: 'Bash', tool_input: { command: `node "${getAudit}" && ${INLINE_WRITE}` }, transcript_path: noApproval() });
check('F42 GET audit chained with an inline curl PUT → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `Invoke-RestMethod -Method Put -Headers @{'X-Redmine-API-Key'=$k} -Body $json http://172.16.90.169/redmine/issues/282061.json` }, transcript_path: noApproval() });
check('F43 Invoke-RestMethod -Method Put -Body → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `invoke-restmethod -method put -headers @{'X-Redmine-API-Key'=$k} http://172.16.90.169/redmine/issues/282061.json` }, transcript_path: noApproval() });
check('F44 lowercase -method put → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'Bash', tool_input: { command: `curl --request POST -H "X-Redmine-API-Key: abc" http://172.16.90.169/redmine/issues/282061.json` }, transcript_path: noApproval() });
check('F45 curl --request POST → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'Bash', tool_input: { command: `curl -H "X-Redmine-API-Key: abc" -d "issue[notes]=hi" http://172.16.90.169/redmine/issues/282061.json` }, transcript_path: noApproval() });
check('F46 curl -d with no -X (implied POST) → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'Bash', tool_input: { command: `curl -H "X-Redmine-API-Key: abc" -H "Content-Type: application/octet-stream" --data-binary @shot.png http://172.16.90.169/redmine/uploads.json` }, transcript_path: noApproval() });
check('F47 curl --data-binary upload → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${writer('attach.js', "// X-Redmine-API-Key\nsend(`/issues/282061.json`, { issue: { uploads: [{ token, filename: 'a.png' }] } });")}"` }, transcript_path: noApproval() });
check('F48 issue envelope with uploads, verb hidden in a helper → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${writer('verbvar.js', "// X-Redmine-API-Key\nconst m = isNew ? 'POST' : 'PUT'; req(m, '/issues/282061.json', payload);")}"` }, transcript_path: noApproval() });
check('F49 verb held in a variable (quoted PUT literal) → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'Bash', tool_input: { command: `python -c "import requests; requests.put('http://172.16.90.169/redmine/issues/282061.json', json=p)"` }, transcript_path: noApproval() });
check('F50 python requests.put → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${writer('patch.js', "fetch(`${REDMINE_BASE}/issues/1.json`, { method: 'PATCH', headers })")}"` }, transcript_path: noApproval() });
check('F51 fetch method PATCH → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'Bash', tool_input: { command: `wget --header "X-Redmine-API-Key: abc" --post-data "x=1" http://172.16.90.169/redmine/issues/1.json` }, transcript_path: noApproval() });
check('F52 wget --post-data → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${writer('journal.js', "// X-Redmine-API-Key\nsubmit({ journal: { notes: 'x' } });")}"` }, transcript_path: noApproval() });
check('F53 journal payload key, verb hidden in a helper → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${writer('fieldonly.js', "// X-Redmine-API-Key\nupdateIssue(282061, { notes, status_id: 2 });")}"` }, transcript_path: noApproval() });
check('F54 field written as a KEY, verb hidden in a helper → BLOCK (a key is a payload, only a read is exempt)', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${writer('form.js', "// X-Redmine-API-Key\npost('/issues/1.json', { \"notes\": text });")}"` }, transcript_path: noApproval() });
check('F55 quoted "notes": JSON key → BLOCK', blocked(r), r.out.slice(0, 160));
const tlvBody = fs.readFileSync(TLV, 'utf8');
check('F29 guard: ticket-load-verify.js stays network-free (else re-review its exemption)',
  // v1.10: one local spawn allowed since b1e2c96e, python on quest/pdf-annotations.py, which must import no network module.
  !/require\(\s*['"](?:node:)?(?:https?|net|child_process)['"]\s*\)(?!\.spawnSync\(process\.env\.TLV_PYTHON \|\| 'python',\s*\n\s*\['-I', path\.join\(__dirname, 'pdf-annotations\.py'\))|\bfetch\s*\(/.test(tlvBody)
  && (tlvBody.match(/child_process/g) || []).length <= 1
  && !/^\s*(?:import|from)\s+(?:urllib|requests|socket|http|ftplib|smtplib)/m.test(fs.readFileSync(path.join(path.dirname(TLV), 'pdf-annotations.py'), 'utf8')), 'network/process I/O found in ' + TLV);
// F15 log rows
const logP = path.join(__dirname, 'log.jsonl');
const lastLog = fs.existsSync(logP) ? fs.readFileSync(logP, 'utf8').trim().split('\n').pop() : '';
check('F15 log.jsonl row carries ts + outcome', /"ts"/.test(lastLog) && /"outcome"/.test(lastLog), lastLog.slice(0, 100));

// ── v1.4 (2026-09-30, #282555): stage-only window · view-first · browser guard ─────────────────────────────
const STAGE = '2999-01-01';
const findResult = (ref, label) => JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: [{ type: 'text', text: `Found 1 matching element\n\n- ${ref}: button "${label}" (submit) - submit button of the issue edit form` }] }] } });
const CHROME_JS = 'mcp__claude-in-chrome__javascript_tool', CHROME_CLICK = 'mcp__claude-in-chrome__computer', PANE_JS = 'mcp__Claude_Browser__javascript_tool';
const POPUP_JS = "const out = {}; for (const n of [281712, 281638]) { const j = await fetch(`/redmine/issues/${n}.json`).then(r => r.json()); out[n] = j.issue.custom_fields; } out";
const FILL_JS = "const s = document.getElementById('issue_status_id'); s.value = '3'; document.getElementById('issue_notes').value = 'Salam Amirah'; s.value";
const SUBMIT_JS = "document.querySelector('#issue-form input[name=commit]').click()";
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([user('ok post it')]) }, STAGE);
check('F56 stage-only window: "post it" still BLOCKS an API write, names staging', blocked(r) && /STAGE-ONLY/.test(r.out) && /redmine-phase1-prefill/.test(r.out), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([user('[skip-redmine-write-gate: infra asked for API post]')]) }, STAGE);
check('F57 stage-only window: miya bypass token still allows', !blocked(r) && /bypassed/.test(r.out), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([user('prepare it first, I want to see in the same page, then post it')]) });
check('F58 after the window: a view-first ask forces staging even with "post it"', blocked(r) && /view it first/.test(r.out), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: READ_CMD }, transcript_path: transcript([user('retrieve 282555')]) }, STAGE);
check('F59 stage-only window: read-only redmine-sync stays silent', !blocked(r) && !/redmine-write-gate/.test(r.out), r.out.slice(0, 120));
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: POPUP_JS }, transcript_path: transcript([user('can you prepare first the Redmine')]) }, STAGE);
check('F60 REPLAY popup: browser fetch of /redmine/issues/N.json → BLOCK (password box)', blocked(r) && /password/.test(r.out), r.out.slice(0, 200));
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: "document.getElementById('issue_notes').value = 'Salam Amirah'" }, transcript_path: transcript([user('prepare first')]) }, STAGE);
check('F61 staging JS (set the notes value) → silent', !blocked(r) && !/redmine-write-gate/.test(r.out), r.out.slice(0, 120));
// ── v1.9 (2026-11-02, 286610): a STATUS write on the staged form needs his order naming that status ──────────────
const CHROME_FORM = 'mcp__claude-in-chrome__form_input';
const formRun = (value, lines, ref = 'ref_549') => run({ tool_name: CHROME_FORM, tool_input: { tabId: 1, ref, value, action_summary: 'sets a field' }, transcript_path: transcript(lines) }, STAGE);
r = formRun('Resolved', [user('Okay please stage the Redmine and share here as well, we can ask BA to proceed I guess')]);
check('F132 REPLAY 286610: form_input Status = Resolved while staging a BA note, no status order → BLOCK', blocked(r) && /never set back/.test(r.out), r.out.slice(0, 200));
r = formRun('Resolved', [user('set status to Resolved and stage the note')]);
check('F133 form_input Status = Resolved after "set status to Resolved" → allow', !blocked(r) && /set on miya's order/.test(r.out), r.out.slice(0, 200));
r = formRun('Nurul Amirah Nadiah', [user('stage the redmine')], 'ref_568');
check('F134 form_input Assignee (not a status name) → silent', !blocked(r) && !/redmine-write-gate/.test(r.out), r.out.slice(0, 120));
r = formRun('Salam Mira, Isu 3 is not from the MCL flow.\n\nThank you.', [user('stage the redmine')], 'ref_2482');
check('F135 form_input Notes text → silent', !blocked(r) && !/redmine-write-gate/.test(r.out), r.out.slice(0, 120));
r = formRun('Verified', [user('post it')]);
check('F136 form_input Status = Verified with only "post it" → BLOCK (a post order is not a status order)', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: 'mcp__claude-in-chrome__browser_batch', tool_input: { actions: [{ name: 'form_input', input: { tabId: 1, ref: 'ref_549', value: 'Closed' } }] }, transcript_path: transcript([user('stage it')]) }, STAGE);
check('F137 browser_batch hiding a form_input Status = Closed → BLOCK', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: FILL_JS }, transcript_path: transcript([user('prepare first')]) }, STAGE);
check('F138 JS assigning issue_status_id.value with no status order → BLOCK', blocked(r), r.out.slice(0, 200));
r = formRun('In Progress', [user('update it to in progress')]);
check('F139 "update it to in progress" → form_input Status = In Progress allowed', !blocked(r), r.out.slice(0, 200));
r = formRun('Resolved', [user('set status to Resolved'), toolResult(), user("no, don't change the status")]);
check('F140 a later "don\'t change the status" wins over an older order → BLOCK', blocked(r), r.out.slice(0, 200));
r = formRun('Resolved', [user('[redmine-status-ok: Resolved]')]);
check('F141 [redmine-status-ok: Resolved] → allow', !blocked(r), r.out.slice(0, 200));
r = formRun('Rework', [user('set status to Resolved')]);
check('F142 his order names Resolved, the form sets Rework → BLOCK (the named status only)', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: SUBMIT_JS }, transcript_path: transcript([user('Beautiful, audit again')]) }, STAGE);
check('F62 JS submit of the issue form without approval → BLOCK, says stop at staging', blocked(r) && /STOP AT STAGING/.test(r.out), r.out.slice(0, 200));
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: SUBMIT_JS }, transcript_path: transcript([user('Then proceed to update that ticket. I approve current send.')]) }, STAGE);
check('F63 REPLAY 282555: "I approve current send" → JS submit allowed', !blocked(r) && /Submit approved/.test(r.out), r.out.slice(0, 200));
r = run({ tool_name: CHROME_CLICK, tool_input: { action: 'left_click', tabId: 1, ref: 'ref_2598' }, transcript_path: transcript([findResult('ref_2598', 'Submit'), user('Beautiful, let me check again')]) }, STAGE);
check('F64 click on a ref the find result named button "Submit", no approval → BLOCK', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: CHROME_CLICK, tool_input: { action: 'left_click', tabId: 1, ref: 'ref_2598' }, transcript_path: transcript([findResult('ref_2598', 'Submit'), user('Then proceed to update that ticket. I approve current send.')]) }, STAGE);
check('F65 same click after "I approve current send" → allow', !blocked(r), r.out.slice(0, 200));
r = run({ tool_name: CHROME_CLICK, tool_input: { action: 'left_click', tabId: 1, ref: 'ref_77' }, transcript_path: transcript([findResult('ref_2598', 'Submit'), user('open the edit form')]) }, STAGE);
check('F66 click on a different ref (Edit link) → silent', !blocked(r) && !/redmine-write-gate/.test(r.out), r.out.slice(0, 120));
r = run({ tool_name: 'mcp__claude-in-chrome__browser_batch', tool_input: { actions: [{ name: 'computer', input: { action: 'screenshot', tabId: 1 } }, { name: 'javascript_tool', input: { action: 'javascript_exec', tabId: 1, text: POPUP_JS } }] }, transcript_path: transcript([user('prepare')]) }, STAGE);
check('F67 browser_batch hiding a .json fetch → BLOCK', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: PANE_JS, tool_input: { action: 'javascript_exec', text: "fetch('http://172.16.90.169/redmine/issues/1.json', { method: 'PUT' })" }, transcript_path: transcript([user('post it')]) }, STAGE);
check('F68 built-in browser pane fetch PUT to redmine → BLOCK even with "post it"', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: SUBMIT_JS }, transcript_path: transcript([user("I don't approve current send yet")]) }, STAGE);
check('F69 negated approval "I don\'t approve current send" → BLOCK', blocked(r), r.out.slice(0, 200));
// 2026-10-27 (#246964): words sent while I work arrive as queued_command attachments; every go-word form counts.
const queued = t => JSON.stringify({ type: 'attachment', attachment: { type: 'queued_command', prompt: t, origin: { kind: 'human' } } });
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: SUBMIT_JS }, transcript_path: transcript([user('Salam Mira, ... Thankss.'), toolResult(), queued('Go'), queued('Submit'), queued('send'), queued('pass'), queued('Nex tticket please.'), toolResult()]) }, STAGE);
check('F91 the 246964 replay: Go / Submit / send / pass sent mid-turn, then "Nex tticket please." → Submit allowed', !blocked(r), r.out.slice(0, 200));
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: SUBMIT_JS }, transcript_path: transcript([user('draft it'), toolResult(), queued('Nex tticket please.'), toolResult()]) }, STAGE);
check('F92 mid-turn message with no go-word → BLOCK', blocked(r), r.out.slice(0, 200));
for (const [id, w] of [['F93', 'submitted'], ['F94', 'send it'], ['F95', 'pass'], ['F96', 'hantarkan'], ['F97', 'ok'], ['F98', 'go']]) {
  r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: SUBMIT_JS }, transcript_path: transcript([user(w)]) }, STAGE);
  check(`${id} go-word variation "${w}" → Submit allowed`, !blocked(r), r.out.slice(0, 200));
}
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: SUBMIT_JS }, transcript_path: transcript([user('wait, do not send yet')]) }, STAGE);
check('F99 "wait, do not send yet" → BLOCK', blocked(r), r.out.slice(0, 200));
// v1.7 (2026-10-29, #261986): five submits he had ordered were blocked; harness lines were read as his words.
const meta = t => JSON.stringify({ type: 'user', isMeta: true, message: { role: 'user', content: [{ type: 'text', text: t }] } });
const goalCmd = a => user(`<command-name>/goal</command-name>\n<command-message>goal</command-message>\n<command-args>${a}</command-args>`);
const submitWith = lines => run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: SUBMIT_JS }, transcript_path: transcript(lines) }, STAGE);
r = submitWith([user('WHY THE FUCK YOU ARE NOT SUBMITTING IT YOU STUPID FUCKER!!!')]);
check('F100 REPLAY 261986 "WHY ... ARE NOT SUBMITTING IT" → Submit allowed (complaint = order)', !blocked(r) && /Submit approved/.test(r.out), r.out.slice(0, 200));
r = submitWith([goalCmd("do not stop until you've fucking posted the redmine you stupid fuck."), meta('A session-scoped Stop hook is now active with condition: "do not stop until you\'ve fucking posted the redmine". Briefly acknowledge')]);
check('F101 REPLAY 261986 /goal "do not stop until you\'ve posted" + harness notice → Submit allowed', !blocked(r), r.out.slice(0, 200));
r = submitWith([user('SEND THE FUCKING REDMINE'), meta('Base directory for this skill: C:\\x\\.claude\\skills\\redmine-phase1-prefill')]);
check('F102 a loaded skill text after "SEND" is skipped → Submit allowed', !blocked(r), r.out.slice(0, 200));
r = submitWith([user('hmm'), meta('Base directory for this skill: post it, submit it')]);
check('F103 go-words only inside a harness/skill line → BLOCK (never his words)', blocked(r), r.out.slice(0, 200));
r = submitWith([goalCmd('do not post it yet')]);
check('F104 /goal args "do not post it yet" → BLOCK', blocked(r), r.out.slice(0, 200));
r = submitWith([user("don't submit")]);
check('F105 "don\'t submit" → BLOCK', blocked(r), r.out.slice(0, 200));
r = submitWith([user('stop, do not send it')]);
check('F106 "stop, do not send it" → BLOCK', blocked(r), r.out.slice(0, 200));
r = submitWith([user('why did you post it without asking')]);
check('F107 "why did you post it without asking" → a question decides nothing → BLOCK (v1.8; v1.7 allowed it as accepted-risk)', blocked(r), r.out.slice(0, 200));
r = submitWith([user('never post on my behalf')]);
check('F108 "never post on my behalf" → BLOCK', blocked(r), r.out.slice(0, 200));
r = submitWith([user('hold on, let me read it before you send')]);
check('F109 "hold on, let me read it before you send" → BLOCK (no go-word)', blocked(r), r.out.slice(0, 200));
r = submitWith([meta('A session-scoped Stop hook is now active with condition: "submit it"')]);
check('F110 only a harness line, no human line → BLOCK', blocked(r), r.out.slice(0, 200));
// ── v1.8 (2026-10-29, system-rules Rule 8): the shared reader lib/his-words.js; his order stands up to 8 messages back ──
const SKILL_LINE = JSON.stringify({ type: 'user', isMeta: true, message: { role: 'user', content: 'Base directory for this skill: C:\\x\\.claude\\skills\\redmine-phase1-prefill\n# prefill' } });
const SLIPS = path.join(sb, 'slips.jsonl'); fs.writeFileSync(SLIPS, '');
const run8 = (lines, until) => spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: SUBMIT_JS }, transcript_path: transcript(lines) }), encoding: 'utf8', timeout: 30000, cwd: ROOT, env: { ...process.env, REDMINE_STAGE_ONLY_UNTIL: until || STAGE, CLAUDE_PROJECT_DIR: ROOT, REDMINE_GATE_SLIPS: SLIPS } });
const b8 = r => /redmine-write-gate/.test((r.stdout || '') + (r.stderr || '')) && /⛔/.test((r.stdout || '') + (r.stderr || ''));
let r8 = run8([user('post it'), toolResult(), user('what does the BA journal say?'), toolResult(), user('and the second photo?')]);
check('F111 his "post it" three messages back, then two questions → Submit allowed (an order stands until a hold)', !b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user('post it'), toolResult(), user('wait, let me read the note first')]);
check('F112 his "post it", then "wait, let me read it first" → BLOCK (a later hold wins)', b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user('Do that then straight away upload to the redmine. Simple.')]);
check('F113 REPLAY 13:42 "straight away upload to the redmine" → Submit allowed', !b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user('now just please update yourself on the redmine tickets progress')]);
check('F114 "update yourself on the redmine tickets" is a read ask, not a send → BLOCK', b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user('do not ever, under any case, post without me')]);
check('F115 "do not ever, under any case, post" → BLOCK (a no in the same clause as the verb, any distance)', b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user('SEND'), toolResult(), SKILL_LINE, toolResult(), user('<system-reminder>\nLinked sessions now: x\n</system-reminder>')]);
check('F116 REPLAY 13:57: "SEND", then a skill line, then a reminder-only line → Submit allowed', !b8(r8), (r8.stdout || '').slice(0, 200));
fs.writeFileSync(SLIPS, '');
r8 = run8([user('draft it')]); const r8b = run8([user('draft it')]);
check('F117 a second block of the same send within 30 min writes a gate/repeat-block slip row and says so', b8(r8b) && /block \d+ of the same send/.test((r8b.stdout || '') + (r8b.stderr || '')) && /gate\/repeat-block/.test(fs.readFileSync(SLIPS, 'utf8')), ((r8b.stdout || '') + (r8b.stderr || '')).slice(0, 240));
r8 = run8([user('ok post it'), toolResult(), user('<command-name>/goal</command-name>\n<command-message>goal</command-message>\n<command-args>do not stop until the ticket is posted</command-args>')]);
check('F118 /goal "do not stop until the ticket is posted" after "post it" → Submit allowed', !b8(r8), (r8.stdout || '').slice(0, 200));
// ── 2026-10-30 replay (#287186): 10 rounds. His "approve A1E3-7EAD, submit it", then lines that neither hold nor refuse.
const GO = 'approve A1E3-7EAD, submit it';
r8 = run8([user(GO), toolResult(), user("You're going to ask again?")]);
check('F119 REPLAY 287186: "submit it", then "You\'re going to ask again?" → Submit allowed', !b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user(GO), toolResult(), user('Is that clear enough?')]);
check('F120 REPLAY 287186: "submit it", then "Is that clear enough?" → Submit allowed', !b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user('Approve, submit it ' + GO + GO)]);
check('F121 REPLAY 287186: pasted run-on "…submit itapprove…" → Submit allowed', !b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user(GO), toolResult(), user('then please check what are my weekly plan in protime for today so far. We can change these 2 tickets to resolved.')]);
check('F122 REPLAY 287186: "submit it", then an unrelated ProTime ask → Submit allowed (no hold)', !b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user(GO), toolResult(), user('And why the fuck you would leave the percentage.')]);
check('F123 REPLAY 287186: "submit it", then a complaint about the % → Submit allowed (a question decides nothing)', !b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user(GO), toolResult(), user('wait, don\'t submit yet')]);
check('F124 "submit it", then "wait, don\'t submit yet" → BLOCK (a later hold wins)', b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user(GO), toolResult(), user('let me review it first')]);
check('F125 "submit it", then "let me review it first" → BLOCK (view-first holds)', b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user(GO), ...Array.from({ length: 9 }, (_, i) => user('unrelated question ' + i))]);
check('F126 "submit it" 10 of his messages back → BLOCK (outside the window)', b8(r8), (r8.stdout || '').slice(0, 200));
r8 = run8([user(GO), toolResult(), goalCmd('please audit this behaviour again and find a way to stop this behaviour that keeps on asking in and stopping work')]);
check('F127 REPLAY 287186: "submit it", then the /goal about stopping the asking → Submit allowed ("stop" names no send)', !b8(r8), (r8.stdout || '').slice(0, 200));
const findOut = JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'Found 1 matching element\n\n- ref_2437: button "Submit" (submit) - the issue edit form' }] } });
const rClick = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'mcp__claude-in-chrome__computer', tool_input: { action: 'left_click', tabId: 1, ref: 'ref_2437' }, transcript_path: transcript([user(GO), findOut, user('Is that clear enough?'), findOut]) }), encoding: 'utf8', timeout: 30000, cwd: ROOT, env: { ...process.env, REDMINE_STAGE_ONLY_UNTIL: STAGE, CLAUDE_PROJECT_DIR: ROOT, REDMINE_GATE_SLIPS: SLIPS } });
check('F128 REPLAY 287186: click on the Submit button by ref after "submit it" + "Is that clear enough?" → allowed', !b8(rClick), (rClick.stdout || '').slice(0, 200));
const setRun = (words) => spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'mcp__claude-in-chrome__computer', tool_input: { action: 'left_click', tabId: 1, ref: 'ref_2437' }, transcript_path: transcript([user(words), findOut]) }), encoding: 'utf8', timeout: 30000, cwd: ROOT, env: { ...process.env, REDMINE_STAGE_ONLY_UNTIL: STAGE, CLAUDE_PROJECT_DIR: ROOT, REDMINE_GATE_SLIPS: SLIPS } });
check('F129 REPLAY 287233: "Set 287233 100%" is an order → Submit allowed', !b8(setRun('Set 287233 100%')), (setRun('Set 287233 100%').stdout || '').slice(0, 200));
check('F130 "should I set 287233 to 100%?" is a question → Submit blocked', b8(setRun('should I set 287233 to 100%?')), '');
const approvedOut = setRun('submit it');
check('F131 REPLAY 287186/287233: an approved Submit names the patch close as the next step (close-phase Phase 1 + Phase 2, no question)', !b8(approvedOut) && /close-phase now/.test(approvedOut.stdout || '') && /no question/.test(approvedOut.stdout || ''), (approvedOut.stdout || '').slice(0, 300));
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: "document.querySelector('.attributes').innerText" }, transcript_path: transcript([user('check the ticket')]) }, STAGE);
check('F70 DOM read of the issue page → silent', !blocked(r) && !/redmine-write-gate/.test(r.out), r.out.slice(0, 120));
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: "fetch('https://example.com/api/x.json')" }, transcript_path: transcript([user('x')]) }, STAGE);
check('F71 browser fetch to a non-Redmine .json → silent', !blocked(r), r.out.slice(0, 120));
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: SUBMIT_JS }, transcript_path: transcript([asst('I approve current send'), user('hmm')]) }, STAGE);
check('F72 "I approve" only in an ASSISTANT line → BLOCK (self-approval)', blocked(r), r.out.slice(0, 120));
r = run({ tool_name: CHROME_JS, tool_input: { action: 'javascript_exec', tabId: 1, text: SUBMIT_JS } }, STAGE);
check('F73 browser submit with no transcript → BLOCK', blocked(r), r.out.slice(0, 120));

// ── v1.5 (2026-10-07): the one standing-approved API write, the quest-start claim (lib/quest-start-claim.js) ──────────
const CLAIM = path.join(ROOT, 'lib', 'quest-start-claim.js');
const CLAIM_CMD = 'node lib/quest-start-claim.js 281324';
const claimBody = fs.readFileSync(CLAIM, 'utf8');
const standingOk = r => !blocked(r) && /standing approval/.test(r.out);
r = run({ tool_name: 'PowerShell', tool_input: { command: CLAIM_CMD }, transcript_path: noApproval() }, STAGE);
check('F74 the claim script, no approval phrase, inside the stage-only window → allowed as the standing approval', standingOk(r), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${CLAIM}" 281324 --dry-run` }, transcript_path: noApproval() }, STAGE);
check('F75 absolute quoted path (repo root has spaces) → allowed', standingOk(r), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: 'node .\\lib\\quest-start-claim.js --result 281324' }, transcript_path: noApproval() }, STAGE);
check('F76 backslash path form → allowed', standingOk(r), r.out.slice(0, 200));
const fakeLib = path.join(sb, 'lib'); fs.mkdirSync(fakeLib);
const claimCopy = path.join(fakeLib, 'quest-start-claim.js'); fs.writeFileSync(claimCopy, claimBody);
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${claimCopy}" 281324` }, transcript_path: noApproval() });
check('F77 the same body at another path (…/lib/quest-start-claim.js outside the repo) → BLOCK (one path only)', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'Bash', tool_input: { command: `${CLAIM_CMD} && ${INLINE_WRITE}` }, transcript_path: noApproval() });
check('F78 claim script + inline curl PUT in the same command → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `${CLAIM_CMD} --x "-X PUT"` }, transcript_path: noApproval() });
check('F79 claim script + mutation-shaped text in the command → exemption void → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `node "${postScript}" lib/quest-start-claim.js` }, transcript_path: noApproval() });
check('F80 a writer passes the claim script as an ARGUMENT → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: `${CLAIM_CMD}; node "${postScript}"` }, transcript_path: noApproval() });
check('F81 claim script chained with a writer script → BLOCK (the writer body is still scanned)', blocked(r), r.out.slice(0, 160));
// A copy of the repo layout where the script was edited to also send a note: the body check must void the exemption.
const mkRepo = (name, body) => { const d = path.join(sb, name); fs.mkdirSync(path.join(d, 'lib'), { recursive: true });
  for (const f of ['hook-runtime.js', 'turn-context.js', 'his-words.js']) { try { fs.copyFileSync(path.join(ROOT, 'lib', f), path.join(d, 'lib', f)); } catch (_) { /* optional */ } }
  fs.writeFileSync(path.join(d, 'lib', 'quest-start-claim.js'), body); return d; };
const cleanRepo = mkRepo('repo-clean', claimBody);
// v1.10: the claim builds `payload` (f8af263c); each tamper edits whichever form the live body has.
const tamper = (oldTo, newTo) => claimBody.replace('{ issue: { status_id: IN_PROGRESS_ID, done_ratio: START_PERCENT } }', oldTo).replace('payload.done_ratio = START_PERCENT;', newTo);
const tamperedRepo = mkRepo('repo-tampered', tamper("{ issue: { status_id: IN_PROGRESS_ID, done_ratio: START_PERCENT, notes: 'taken' } }", "payload.done_ratio = START_PERCENT; payload.notes = 'taken';"));
const assigneeRepo = mkRepo('repo-assignee', tamper('{ issue: { status_id: IN_PROGRESS_ID, done_ratio: START_PERCENT, assigned_to_id: 5 } }', 'payload.done_ratio = START_PERCENT; payload.assigned_to_id = 5;'));
const statusOnlyRepo = mkRepo('repo-status-only', tamper('{ issue: { status_id: IN_PROGRESS_ID, done_ratio: 100 } }', 'payload.done_ratio = 100;'));
r = run({ tool_name: 'PowerShell', tool_input: { command: CLAIM_CMD }, transcript_path: noApproval() }, STAGE, cleanRepo);
check('F82 control: an untouched copy at <root>/lib of another root → allowed', standingOk(r), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: CLAIM_CMD }, transcript_path: noApproval() }, STAGE, tamperedRepo);
check('F83 the script edited to also send a note → exemption void → BLOCK', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: 'node quest/active-cli.js update QA-281324 status=active phase=0 quest_start=@now' }, transcript_path: noApproval() }, STAGE);
check('F84 the quest start command itself (active-cli update … quest_start=@now) → silent, never blocked', silent(r), r.out.slice(0, 160));
check('F85 guard: lib/quest-start-claim.js sends status + 20 percent only (else re-review its exemption)',
  /\{ issue: \{ status_id: IN_PROGRESS_ID, done_ratio: START_PERCENT \} \}|const payload = \{ status_id: IN_PROGRESS_ID \};\s*\n[^\n]*payload\.done_ratio = START_PERCENT;\s*\n[\s\S]*\{ issue: payload \}/.test(claimBody) && !/payload\.(?!done_ratio = START_PERCENT;)\w+\s*=|payload\[/.test(claimBody) && /const START_PERCENT = 20;/.test(claimBody) && !/assigned_to_id|["']notes["']|\bnotes\s*[:=]|\bjournal\s*:|\buploads?\s*:/i.test(claimBody) && (claimBody.match(/'PUT'/g) || []).length === 1, 'shape changed in ' + CLAIM);
r = run({ tool_name: 'PowerShell', tool_input: { command: CLAIM_CMD }, transcript_path: noApproval() }, STAGE, assigneeRepo);
check('F88 the script edited to also change the assignee → exemption void → BLOCK', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: CLAIM_CMD }, transcript_path: noApproval() }, STAGE, statusOnlyRepo);
check('F89 the script edited to send a literal 100 percent → payload shape changed → BLOCK', blocked(r), r.out.slice(0, 200));
r = run({ tool_name: 'PowerShell', tool_input: { command: 'node lib/xquest-start-claim.js 281324; node "' + path.join(fakeLib, 'quest-start-claim.js') + '"' }, transcript_path: noApproval() });
check('F86 look-alike name + outside copy chained → BLOCK', blocked(r), r.out.slice(0, 160));
r = run({ tool_name: 'PowerShell', tool_input: { command: WRITE_CMD }, transcript_path: transcript([user('ok post it')]) }, STAGE);
check('F87 the stage-only window still blocks every OTHER API write (F56 unchanged by v1.5)', blocked(r) && /STAGE-ONLY/.test(r.out), r.out.slice(0, 160));

// ── v1.11 (2026-11-03, 287747/287638): his standing rule decides a Status = Resolved fill; the gate reads the ticket from
// the last navigate, its live status + assignee through status-rule.js (REDMINE_GATE_TICKET_STATE = a fixture file here).
const STATE_FILE = path.join(sb, 'ticket-state.json');
fs.writeFileSync(STATE_FILE, JSON.stringify({
  287747: { status: 'In Progress', assignee: 'Ahmad Ridhwan Anuar (Dev PLP)', assigneeId: 1311 },
  287638: { status: 'Rework', assignee: 'Ahmad Ridhwan Anuar', assigneeId: 1311 },
  300001: { status: 'New', assignee: 'Aaron Loh Zhi Yong', assigneeId: 777 },
  300002: { status: 'In Progress', assignee: 'Aaron Loh Zhi Yong', assigneeId: 777 },
  300003: { status: 'Verified', assignee: 'Ahmad Ridhwan Anuar', assigneeId: 1311 },
  300004: { status: 'Closed', assignee: 'Anis Nabilah J Daud', assigneeId: 559 },
  300005: { status: 'Ready in PROD', assignee: 'Ahmad Ridhwan Anuar', assigneeId: 1311 },
  300006: { status: 'Cancelled', assignee: 'Ahmad Ridhwan Anuar', assigneeId: 1311 },
  300007: { status: 'Resolved', assignee: 'Ahmad Ridhwan Anuar', assigneeId: 1311 },
  300008: { status: 'New', assignee: 'Anis Nabilah J Daud', assigneeId: 559 },
  300009: { status: 'New', assignee: null, assigneeId: null },
  300010: { status: 'KIV', assignee: 'Ahmad Ridhwan Anuar', assigneeId: 1311 },
  300011: { status: 'New', assignee: 'Ahmad Ridhwan Anuar', assigneeId: 1311 },
  300012: { status: 'Rework', assignee: 'Aaron Loh Zhi Yong', assigneeId: 777 },
}));
const nav = (num, tabId = 1) => JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't' + num, name: 'mcp__claude-in-chrome__navigate', input: { url: 'http://172.16.90.169/redmine/issues/' + num + '/edit', tabId } }] } });
const run11 = (toolName, toolInput, lines) => { const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: toolName, tool_input: toolInput, transcript_path: transcript(lines) }), encoding: 'utf8', timeout: 30000, cwd: ROOT, env: { ...process.env, REDMINE_STAGE_ONLY_UNTIL: STAGE, CLAUDE_PROJECT_DIR: ROOT, REDMINE_GATE_SLIPS: SLIPS, REDMINE_GATE_TICKET_STATE: STATE_FILE, REDMINE_GATE_LOG: path.join(sb, 'gate-log.jsonl') } }); return { out: (r.stdout || '') + (r.stderr || ''), status: r.status }; };
const statusFill = (value, lines, tabId = 1) => run11(CHROME_FORM, { tabId, ref: 'ref_549', value, action_summary: 'sets the Status' }, lines);
const ruled = r => !blocked(r) && /allowed by miya's standing rule/.test(r.out);
const staging = [user('Retry prefill')];
r = statusFill('Resolved', [nav(287747), ...staging]);
check('F143 REPLAY 287747: his ticket, In Progress → Resolved, no words → allowed by the rule (row 2)', ruled(r) && /row 2/.test(r.out), r.out.slice(0, 200));
r = statusFill('Resolved', [nav(287638), ...staging]);
check('F144 his ticket, Rework → Resolved → allowed (row 1, a gap he left open)', ruled(r) && /row 1/.test(r.out), r.out.slice(0, 200));
r = statusFill('Resolved', [nav(300010), ...staging]);
check('F145 his ticket, KIV → Resolved → allowed (row 1)', ruled(r), r.out.slice(0, 200));
r = statusFill('Resolved', [nav(300001), ...staging]);
check('F146 someone else\'s ticket, New, no BA staged → BLOCK, says stage the Assignee first', blocked(r) && /Stage the Assignee/.test(r.out), r.out.slice(0, 240));
r = run11(CHROME_FORM, { tabId: 1, ref: 'ref_568', value: 'Nurul Amirah Nadiah', action_summary: 'sets the Assignee' }, [nav(300001), ...staging]);
check('F147 Assignee = a BA on that form → silent (remembered)', !blocked(r) && !/redmine-write-gate/.test(r.out), r.out.slice(0, 120));
r = statusFill('Resolved', [nav(300001), ...staging]);
check('F148 then Status = Resolved on the same New ticket → allowed (row 3: sent back to the BA)', ruled(r) && /row 3/.test(r.out) && /Nurul Amirah Nadiah/.test(r.out), r.out.slice(0, 240));
r = statusFill('Resolved', [nav(300002), ...staging]);
check('F149 someone else\'s ticket, In Progress → BLOCK (row 3 covers New only)', blocked(r) && /someone else's work/.test(r.out), r.out.slice(0, 240));
r = statusFill('Resolved', [nav(300012), ...staging]);
check('F150 someone else\'s ticket, Rework → BLOCK', blocked(r), r.out.slice(0, 200));
for (const [id, num, name] of [['F151', 300003, 'Verified'], ['F152', 300004, 'Closed'], ['F153', 300005, 'Ready in PROD'], ['F154', 300006, 'Cancelled'], ['F155', 300007, 'Resolved']]) {
  r = statusFill('Resolved', [nav(num), ...staging]);
  check(id + ' ' + name + ' → BLOCK always by the rule (row 4, never set back)', blocked(r) && /row 4/.test(r.out) && /never set back/.test(r.out), r.out.slice(0, 240));
}
r = statusFill('Resolved', [nav(300003), user('set status to Resolved')]);
check('F156 Verified + his named order → allowed on his order (the rule never overrides his words)', !blocked(r) && /set on miya's order/.test(r.out), r.out.slice(0, 200));
r = statusFill('Resolved', [nav(287747), user("no, don't change the status")]);
check('F157 his ticket, In Progress, but "don\'t change the status" → BLOCK (a hold wins over the rule)', blocked(r), r.out.slice(0, 200));
r = statusFill('Resolved', [nav(300008), ...staging]);
check('F158 New and already under a BA (Anis) → allowed (row 3)', ruled(r) && /row 3/.test(r.out), r.out.slice(0, 200));
r = statusFill('Resolved', staging);
check('F159 no navigate to /issues/<num> in the transcript → BLOCK, says the ticket is not known', blocked(r) && /ticket is not known/.test(r.out), r.out.slice(0, 240));
r = statusFill('Resolved', [nav(399999), ...staging]);
check('F160 Redmine does not answer for the ticket → BLOCK, says so', blocked(r) && /did not answer/.test(r.out), r.out.slice(0, 240));
r = statusFill('In Progress', [nav(300011), ...staging]);
check('F161 his New ticket, Status = In Progress through the form, no words → BLOCK (the rule covers Resolved only)', blocked(r), r.out.slice(0, 200));
r = run11('mcp__claude-in-chrome__browser_batch', { actions: [{ name: 'form_input', input: { tabId: 1, ref: 'ref_568', value: 'Devayani Priya Shanmugam' } }, { name: 'form_input', input: { tabId: 1, ref: 'ref_549', value: 'Resolved' } }] }, [nav(300009), ...staging]);
check('F162 browser_batch: Assignee = BA then Status = Resolved on an unassigned New ticket → allowed (row 3)', ruled(r) && /Devayani/.test(r.out), r.out.slice(0, 240));
r = statusFill('Resolved', [nav(300002, 1), nav(287747, 2), ...staging], 2);
check('F163 two tabs: the status fill on tab 2 reads tab 2\'s ticket (287747, his) → allowed', ruled(r) && /#287747/.test(r.out), r.out.slice(0, 200));
const cli = spawnSync(process.execPath, [path.join(__dirname, 'status-rule.js'), '287747', '--json'], { encoding: 'utf8', timeout: 20000, env: { ...process.env, REDMINE_GATE_TICKET_STATE: STATE_FILE } });
check('F164 status-rule.js CLI prints the state and the verdict as JSON', /"allow":true/.test(cli.stdout || '') && /"row":2/.test(cli.stdout || ''), (cli.stdout || cli.stderr || '').slice(0, 200));
const SRM = require(path.join(__dirname, 'status-rule.js'));
check('F165 guard: status-rule.json keeps the owner id 1311, Resolved as the hand-back and the five frozen statuses', SRM.rule().owner.id === 1311 && SRM.rule().handback_status === 'Resolved' && ['Resolved', 'Verified', 'Closed', 'Ready in PROD', 'Cancelled'].every(x => SRM.rule().frozen.includes(x)), JSON.stringify(SRM.rule().frozen));

let failed = 0; for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nredmine-write-gate.eval: ' + (results.length - failed) + '/' + results.length + (failed ? ' RED' : ' green'));
fs.rmSync(sb, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
