#!/usr/bin/env node
// adhoc-register.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-07-29: the ADHOC-REGISTER rule was written 2026-07-28 into expansion-protocol.md:50 + domain-expansion/SKILL.md:39 but the FILE was never created, and tonight's PLTP diagnosis got parked in todo.md instead. A ticket arriving later would have triggered a full re-investigation of an issue already diagnosed to 93%.
//
// CONTRACT under test (miya 2026-07-29):
//   "when you retrieve a ticket and start a quest, during phase 0, you will MANDATORY check for
//    pending issues. If yes, during that moment you will update it."
//
//   F1  clean/empty input exits 0 (no false block)
//   F2  REPLAY: prefixed ticket number + an OPEN row → fires and surfaces that row's symptom
//   F3  bare 5-7 digit ticket number → fires
//   F4  quest-start phrase with no number → fires
//   F5  Redmine-retrieval phrase → fires
//   F6  no ticket signal at all → SILENT (no ceremony on ordinary turns)
//   F7  register has zero OPEN rows → SILENT
//   F8  a row already promoted to a ticket number is NOT surfaced
//   F9  a row marked n/a (resolved without a ticket) is NOT surfaced
//   F10 register file MISSING → warns loudly (the ghost-reference case this was born from)
//   F11 [skip-adhoc-register: ...] bypass honoured
//   F12 when it fires with rows, the promote instruction (set the Ticket cell) is always present
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'adhoc-register.check.hook.js');
const REL = path.join('projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka', 'ADHOC-REGISTER.md');
const REAL_ROOT = path.resolve(__dirname, '..', '..');

const HEADER = [
  '| # | Date | Source | Symptom (searchable) | Urusan / Area | Verdict | Conf | Findings doc | Ticket |',
  '|---|---|---|---|---|---|---|---|---|',
].join('\n');
const ROW_OPEN = '| 1 | 2026-07-28 | BA PDTJ | hakmilik lain radio flips to TIADA with 2 pemohon | PLTP SKM | app-scoped flag written from a per-pemohon VO | 93% | `x/FINDINGS.md` | none |';
const ROW_PROMOTED = '| 2 | 2026-07-20 | BA | footer margin too wide | Pelupusan surat | template-static | high | `y/FINDINGS.md` | 272527 |';
const ROW_NA = '| 3 | 2026-07-22 | miya | PRU agihan dropdown blank | PRU KKMMKN | data — capaian penuh | 100% | `z/FINDINGS.md` | n/a |';

function makeRoot(registerBody /* string | null */) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'adhoc-reg-'));
  fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
  fs.copyFileSync(path.join(REAL_ROOT, 'lib', 'hook-runtime.js'), path.join(root, 'lib', 'hook-runtime.js'));
  if (registerBody !== null) {
    const p = path.join(root, REL);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, registerBody, 'utf8');
  }
  return root;
}

function run(root, prompt) {
  const r = spawnSync(process.execPath, [HOOK, 'UserPromptSubmit'], {
    input: JSON.stringify({ prompt }),
    encoding: 'utf8',
    timeout: 30000,
    env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: root }),
  });
  return { out: (r.stdout || '') + (r.stderr || ''), status: r.status };
}

const withOpen = makeRoot([HEADER, ROW_OPEN, ROW_PROMOTED, ROW_NA].join('\n'));
const noOpen = makeRoot([HEADER, ROW_PROMOTED, ROW_NA].join('\n'));
const missing = makeRoot(null);

const results = [];
function check(n, cond, d) { results.push({ n, pass: !!cond, d: d || '' }); }

// F1 — clean input, no prompt at all
let r = spawnSync(process.execPath, [HOOK, 'UserPromptSubmit'], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

const cases = [
  { id: 'F2 REPLAY prefixed ticket + open row surfaces it', root: withOpen,
    prompt: 'lets look at eSOKONGAN #272611 now',
    want: ['adhoc-register', 'hakmilik lain', 'MANDATORY'], notWant: [] },
  { id: 'F3 bare ticket number fires', root: withOpen, prompt: 'start 272611',
    want: ['adhoc-register', 'PLTP SKM'], notWant: [] },
  { id: 'F4 quest-start phrase fires', root: withOpen, prompt: '/quest start',
    want: ['adhoc-register', 'OPEN pending issue'], notWant: [] },
  { id: 'F5 redmine-retrieval phrase fires', root: withOpen, prompt: 'read redmine please',
    want: ['adhoc-register'], notWant: [] },
  { id: 'F6 no ticket signal is SILENT', root: withOpen, prompt: 'what is the weather like today',
    want: [], notWant: ['adhoc-register'] },
  { id: 'F7 zero open rows is SILENT', root: noOpen, prompt: 'lets look at eSOKONGAN #272611 now',
    want: [], notWant: ['adhoc-register'] },
  { id: 'F8 promoted row not surfaced', root: withOpen, prompt: 'start 272611',
    want: [], notWant: ['footer margin'] },
  { id: 'F9 n/a row not surfaced', root: withOpen, prompt: 'start 272611',
    want: [], notWant: ['agihan dropdown'] },
  { id: 'F10 missing register warns loudly', root: missing, prompt: 'start 272611',
    want: ['NOT FOUND', 'ADHOC-REGISTER.md'], notWant: [] },
  { id: 'F11 bypass honoured', root: withOpen, prompt: 'start 272611 [skip-adhoc-register: unrelated area]',
    want: [], notWant: ['adhoc-register'] },
  { id: 'F12 promote instruction always present', root: withOpen, prompt: 'start 272611',
    want: ['Ticket cell'], notWant: [] },
];

for (const c of cases) {
  const { out } = run(c.root, c.prompt);
  const miss = c.want.filter(w => !out.includes(w));
  const leak = c.notWant.filter(w => out.includes(w));
  check(c.id, !miss.length && !leak.length, 'missing=[' + miss.join(', ') + '] leaked=[' + leak.join(', ') + ']');
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nadhoc-register.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
