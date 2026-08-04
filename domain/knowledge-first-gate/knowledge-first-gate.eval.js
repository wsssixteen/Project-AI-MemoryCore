#!/usr/bin/env node
// knowledge-first-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case (#273201): PERANAN-MAP.md sections 4-5 already documented
// MlkPelupusanPegawaiAgihService and the peranan hierarchy. Skipped on the original pass, on
// rework-1 and on rework-2; miya had to state the agihan-goes-downward rule himself.
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'knowledge-first-gate.check.hook.js');
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d });

function makeTranscript(assistantText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kfg-eval-'));
  const tp = path.join(dir, 'transcript.jsonl');
  fs.writeFileSync(tp, [
    JSON.stringify({ type: 'user', message: { role: 'user', content: 'work the ticket' } }),
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: assistantText }] } }),
  ].join('\n') + '\n');
  return tp;
}

function run(input) {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(input), encoding: 'utf8', timeout: 30000, env: process.env });
  const combined = (r.stdout || '') + (r.stderr || '');
  const blocked = r.status === 2
    || /"decision"\s*:\s*"block"/.test(r.stdout || '')
    || /reading etanah SOURCE/.test(combined);
  return { status: r.status, combined, blocked };
}

const SERVICE = 'E:/Projects/Melaka/etanah-pelupusan/src/main/java/my/gov/etanah/pelupusan/service/mlk/impl/MlkPelupusanPegawaiAgihService.java';
const XHTML = 'E:/Projects/Melaka/etanah-common/src/main/webapp/protected/common/penyediaanDokumen.xhtml';
const KNOWLEDGE = 'reading projects/coding-projects/active/etanah-knowledge/melaka/PERANAN-MAP.md first';

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: THE REPLAY — the exact #273201 slip. etanah service, zero knowledge read → BLOCK.
r = run({ tool_input: { file_path: SERVICE }, transcript_path: makeTranscript('going straight to the agih service') });
check('F2 REPLAY: etanah .java, no knowledge read → BLOCK', r.blocked, 'blocked=' + r.blocked + ' out=' + r.combined.slice(0, 100));

// F3: effect check — the block must NAME PERANAN-MAP for a peranan/agih path
check('F3 block names PERANAN-MAP.md for an agih path', /PERANAN-MAP\.md/.test(r.combined), r.combined.slice(0, 140));

// F4: same read AFTER a knowledge file → allow
r = run({ tool_input: { file_path: SERVICE }, transcript_path: makeTranscript(KNOWLEDGE + '\nnow the service') });
check('F4 after knowledge read → allow', !r.blocked, 'blocked=' + r.blocked);

// F5: .xhtml routes to the JSF knowledge files
r = run({ tool_input: { file_path: XHTML }, transcript_path: makeTranscript('straight in') });
check('F5 .xhtml block names JSF-WIRING.md', r.blocked && /JSF-WIRING\.md/.test(r.combined), r.combined.slice(0, 140));

// F6: non-etanah path never fires
r = run({ tool_input: { file_path: 'C:/tmp/notes.txt' }, transcript_path: makeTranscript('unrelated') });
check('F6 non-etanah path → no fire', !r.blocked, 'blocked=' + r.blocked);

// F7: MemoryCore's own tooling is not etanah source
r = run({ tool_input: { file_path: 'C:/repo/quest/redmine-sync.js' }, transcript_path: makeTranscript('tooling work') });
check('F7 MemoryCore .js → no fire', !r.blocked, 'blocked=' + r.blocked);

// F8: bypass token honoured
r = run({ tool_input: { file_path: SERVICE }, transcript_path: makeTranscript('[skip-knowledge-first: tooling spike, no domain question]') });
check('F8 bypass token → allow', !r.blocked, 'blocked=' + r.blocked);

// F9: ANY melaka knowledge file clears it (folder-level, not per-topic)
r = run({ tool_input: { file_path: SERVICE }, transcript_path: makeTranscript('read etanah-knowledge/melaka/DATABASE.md earlier') });
check('F9 any melaka knowledge file clears the gate', !r.blocked, 'blocked=' + r.blocked);

// F10: .json is NOT gated — the rule is about reading CODE
r = run({ tool_input: { file_path: 'E:/Projects/Melaka/etanah-pelupusan/src/main/resources/config/MLK/tugasan.config.json' }, transcript_path: makeTranscript('config peek') });
check('F10 etanah .json → no fire', !r.blocked, 'blocked=' + r.blocked);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nknowledge-first-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
