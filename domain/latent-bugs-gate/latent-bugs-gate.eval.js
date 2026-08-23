#!/usr/bin/env node
// eval.js — latent-bugs-gate replay eval (born WITH the component per system-design Rule 6).
// Replay case: miya 2026-08-23 — "if we do find a bug, we put it into bug list, then it will
// load during Phase 0 to check if it is a known bug. But we will need to make it deterministic
// so that it won't go missed." A judgment-only consult (knowledge-first prose) can be skipped;
// this hook makes the Phase-0 latent-bug check fire on every ticket signal.
//
// CONTRACT under test:
//   F1  clean/empty input exits 0 (no false block)
//   F2  prefixed ticket number + SUSPECT row → fires, surfaces row id + symptom
//   F3  bare ticket number → fires
//   F4  quest-start phrase → fires
//   F5  no ticket signal → SILENT
//   F6  register with only TICKETED/FIXED/REFUTED rows → SILENT
//   F7  TICKETED row content never surfaced
//   F8  register file MISSING → warns loudly
//   F9  [skip-latent-bugs: ...] bypass honoured
//   F10 graduate instruction (Status -> TICKETED) always present when fired
//   F11 VERIFIED row IS surfaced
//   F12 malformed stdin (not JSON) exits 0 silently — never blocks the turn
//   F13 separator/header table rows never parsed as data (no ghost rows on schema-only file)
// Adversarial scenarios (system-design Rule 12) enumerated in README.md; credible ones are F6/F7/F12/F13.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'latent-bugs-gate.check.hook.js');
const REL = path.join('projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka', 'LATENT-BUGS.md');
const REAL_ROOT = path.resolve(__dirname, '..', '..');

const HEADER = [
  '| # | Date | Family | Where | Urusan/Screen | Symptom if triggered | Status | Evidence |',
  '|---|---|---|---|---|---|---|---|',
].join('\n');
const ROW_SUSPECT = '| L1 | 2026-08-23 | loop-reassign-returns-last | `PelupusanService.findMaklumatPerizabanVOByNoWartaAndTarikhWarta():10232` | PPJK Senarai Warta | multi-lot warta shows only the last lot | `SUSPECT` | grep hit, mirrors 276349 |';
const ROW_VERIFIED = '| L2 | 2026-08-23 | half-wired-jsf-input | `MlkSomeForm.xhtml:88` | MCL syarat panel | dropdown selection silently not saved | `VERIFIED` | read: no listener attr vs sibling |';
const ROW_TICKETED = '| L3 | 2026-08-23 | two-route-divergence | `SpocService.save():120` | PPTPB SKM | counter fields blank at SKM | `TICKETED` | #276436 |';

function makeRoot(registerBody) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'latent-bugs-'));
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

const withOpen = makeRoot([HEADER, ROW_SUSPECT, ROW_VERIFIED, ROW_TICKETED].join('\n'));
const noOpen = makeRoot([HEADER, ROW_TICKETED].join('\n'));
const schemaOnly = makeRoot(HEADER);
const missing = makeRoot(null);

const results = [];
function check(n, cond, d) { results.push({ n, pass: !!cond, d: d || '' }); }

let r = spawnSync(process.execPath, [HOOK, 'UserPromptSubmit'], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0', r.status === 0, 'exit=' + r.status);

const cases = [
  { id: 'F2 prefixed ticket + SUSPECT row surfaces it', root: withOpen,
    prompt: 'lets look at eSOKONGAN #276999 now',
    want: ['latent-bugs-gate', 'L1', 'only the last lot', 'MANDATORY'], notWant: [] },
  { id: 'F3 bare ticket number fires', root: withOpen, prompt: 'start 276999',
    want: ['latent-bugs-gate', 'loop-reassign'], notWant: [] },
  { id: 'F4 quest-start phrase fires', root: withOpen, prompt: '/quest start',
    want: ['latent-bugs-gate'], notWant: [] },
  { id: 'F5 no ticket signal is SILENT', root: withOpen, prompt: 'what is the weather like today',
    want: [], notWant: ['latent-bugs-gate'] },
  { id: 'F6 only TICKETED rows is SILENT', root: noOpen, prompt: 'start 276999',
    want: [], notWant: ['latent-bugs-gate'] },
  { id: 'F7 TICKETED row content never surfaced', root: withOpen, prompt: 'start 276999',
    want: [], notWant: ['counter fields blank'] },
  { id: 'F8 missing register warns loudly', root: missing, prompt: 'start 276999',
    want: ['NOT FOUND', 'LATENT-BUGS.md'], notWant: [] },
  { id: 'F9 bypass honoured', root: withOpen, prompt: 'start 276999 [skip-latent-bugs: template-only ticket]',
    want: [], notWant: ['latent-bugs-gate'] },
  { id: 'F10 graduate instruction present', root: withOpen, prompt: 'start 276999',
    want: ['TICKETED', 'append the ticket number'], notWant: [] },
  { id: 'F11 VERIFIED row IS surfaced', root: withOpen, prompt: 'start 276999',
    want: ['L2', 'silently not saved'], notWant: [] },
  { id: 'F13 schema-only register is SILENT (no ghost rows)', root: schemaOnly, prompt: 'start 276999',
    want: [], notWant: ['latent-bugs-gate'] },
];

for (const c of cases) {
  const { out } = run(c.root, c.prompt);
  const miss = c.want.filter(w => !out.includes(w));
  const leak = c.notWant.filter(w => out.includes(w));
  check(c.id, !miss.length && !leak.length, 'missing=[' + miss.join(', ') + '] leaked=[' + leak.join(', ') + ']');
}

// F12 malformed stdin
r = spawnSync(process.execPath, [HOOK, 'UserPromptSubmit'], { input: 'this is not json{{', encoding: 'utf8', timeout: 30000, env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: withOpen }) });
check('F12 malformed stdin exits 0 silently', r.status === 0 && !((r.stdout || '') + (r.stderr || '')).includes('latent-bugs-gate'), 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nlatent-bugs-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
