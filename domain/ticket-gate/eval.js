#!/usr/bin/env node
// domain/ticket-gate/eval.js — pin for .claude/hooks/ticket-gate.js (added 2026-07-13 with the
// bare-number refine: the CLAUDE.md trigger table promised bare-number injection; now the hook delivers).
// Uses TICKET_GATE_ACTIVE_TXT override so fixtures never touch the real quest/active.txt.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const HOOK = path.join(ROOT, '.claude', 'hooks', 'ticket-gate.js');
const REAL_ACTIVE = path.join(ROOT, 'quest', 'active.txt');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ticket-gate-eval-'));
const FIXTURE = path.join(TMP, 'active.txt');
fs.writeFileSync(FIXTURE,
  'active:\n\nqa=QA-90001\nstatus=hold\nphase=0\n' +
  '\nqa=90002\nstatus=hold\nphase=0\n' +
  // 90003 = AWAM no-resit urusan (the #271721 shape) · 90004 = non-no-resit urusan
  '\nqa=90003\nstatus=hold\nphase=0\nurusan=PRBB\nissue_one_liner=Pelupusan - PRBB - Tidak Papar Ratusan\n' +
  '\nqa=90004\nstatus=hold\nphase=0\nurusan=PRZ\nissue_one_liner=PRZ - Bil Mesyuarat\n');

// quest/active.txt is untracked, so a worktree has none: hash "absent" there instead of crashing the whole eval.
const hashReal = () => (fs.existsSync(REAL_ACTIVE) ? crypto.createHash('sha1').update(fs.readFileSync(REAL_ACTIVE)).digest('hex') : 'absent');
const realHashBefore = hashReal();

function run(prompt) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000,
    // KNOWLEDGE_ROOT = sandbox knowledge tree (row 1c checks the precedent doc on disk); ETANAH_STATE cleared so a
    // shell that exports it cannot decide the state for every fixture.
    env: { ...process.env, TICKET_GATE_ACTIVE_TXT: FIXTURE, CLAUDE_PROJECT_DIR: ROOT, KNOWLEDGE_ROOT: path.join(TMP, 'K'), ETANAH_STATE: '' },
  });
}
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1 prefixed mention fires
let r = run('QA 90001 please');
check('F1 prefixed mention fires QUEST GATE', /QUEST GATE/.test(r.stdout), (r.stdout || '').slice(0, 80));

// F2 BARE number cross-matching an active.txt block fires (the 2026-07-13 refine)
r = run('lets start with 90002');
check('F2 bare number fires (cross-matched to qa=90002)', /QUEST GATE/.test(r.stdout), (r.stdout || '').slice(0, 80));
check('F2 exit 0', r.status === 0, 'exit=' + r.status);

// F3 bare number NOT in active.txt stays silent
r = run('the number 90009 means nothing');
check('F3 unknown bare number silent', r.status === 0 && !(r.stdout || '').trim(), (r.stdout || '').slice(0, 60));

// F4 no signal stays silent
r = run('good morning, how are we doing');
check('F4 no signal silent', r.status === 0 && !(r.stdout || '').trim(), '');

// F6 AWAM no-resit urusan (PRBB) injects row 7 — the #271721 replay
r = run('lets start with 90003');
check('F6 PRBB injects the No-Resit row 7', /7\. ⬜ .*No-Resit urusan detected \(PRBB\)/.test(r.stdout), (r.stdout || '').slice(0, 120));
check('F6 row names the derive method + notes.js', /TEST-PERMOHONAN-INDEX/.test(r.stdout) && /notes\.js/.test(r.stdout), '');
check('F6 row warns module is etanah-awam', /etanah-awam/.test(r.stdout), '');
// The row must NOT assert AWAM as fact — a no-resit urusan can be a staff-side ticket.
check('F6 row makes みや settle AWAM-vs-APPS first', /Which side is this ticket/.test(r.stdout), '');
check('F6 row offers a staff-side N/A escape hatch', /N\/A — staff-side/.test(r.stdout), '');
check('F6 closing line extends to rows 0-6+7', /rows 0-6[^+\n]*\+7/.test(r.stdout), '');

// F7 non-no-resit urusan (PRZ) must NOT get the row — no false injection
r = run('lets start with 90004');
check('F7 PRZ does NOT inject the No-Resit row', /QUEST GATE/.test(r.stdout) && !/No-Resit urusan detected/.test(r.stdout), (r.stdout || '').slice(0, 120));
check('F7 PRZ closing line stays rows 0-6', /rows 0-6[^+]*are/.test(r.stdout), '');

// F8 word-boundary: PRZ must not match inside PRBB and vice versa
r = run('QA 90001 please');
check('F8 urusan-less block injects nothing', !/No-Resit urusan detected/.test(r.stdout), '');

// F9 🐛 LAST-BLOCK REGRESSION (found live 2026-07-22): the terminator used `\Z`, which JS treats
// as a literal "Z", so the final block in active.txt never matched and ALL its fields read empty.
// 90005 is deliberately the last block in the fixture and carries a no-resit urusan.
// NOTE: must stay phase=0/status=hold — a past-Phase-0 quest exits silently by design (:103).
fs.appendFileSync(FIXTURE, '\nqa=90005\nstatus=hold\nphase=0\nurusan=PSBS\nissue_one_liner=PSBS - last block in file\n');
r = run('lets start with 90005');
check('F9 LAST block parses (status read from the block)', /status=hold/.test(r.stdout), (r.stdout || '').slice(0, 140));
check('F9 LAST block injects the No-Resit row', /No-Resit urusan detected \(PSBS\)/.test(r.stdout), (r.stdout || '').slice(0, 140));

// F10 past-Phase-0 quest stays silent even when it IS a no-resit urusan (no nag after Phase 0)
fs.appendFileSync(FIXTURE, '\nqa=90006\nstatus=active\nphase=1\nurusan=PRBB\nissue_one_liner=PRBB - past phase 0\n');
r = run('lets start with 90006');
check('F10 past-Phase-0 no-resit quest stays silent', r.status === 0 && !(r.stdout || '').trim(), (r.stdout || '').slice(0, 100));

// F11 LATEST-STATE row (added 2026-07-27, stale-conversation slip): every Phase-0 injection must
// demand the journal-timeline table + OPEN/ALREADY-SOLVED classification + DO-NOT-RESOLVE list.
r = run('QA 90001 please');
check('F11 LATEST-STATE row 1b injected', /1b\. ⬜ .*LATEST-STATE/.test(r.stdout), (r.stdout || '').slice(0, 140));
check('F11 row demands the journal-timeline table', /journal-timeline table/.test(r.stdout) && /date · author · assignee-change/.test(r.stdout), '');
check('F11 row demands OPEN vs ALREADY-SOLVED + DO-NOT-RESOLVE', /ALREADY-SOLVED/.test(r.stdout) && /DO-NOT-RESOLVE/.test(r.stdout), '');
check('F11 row bans scouting a solved issue', /scouting an issue solved earlier in the thread/.test(r.stdout), '');

// ── F12-F22 STATE-AWARE ROWS (added 2026-10-03, Terengganu went active) ─────────────────────────────
// Replay: a Terengganu ticket got row 0 "baseline mlk/master + git pull origin" (its developer checkout has a dead
// remote), row 0.6 "run staging-schema-check" (prints ANOTHER state's schema), row 1c pointing at a missing file and
// row 1d reading the reference state's test-data index. Expected values are read from the registry, not typed here.
const S = require(path.join(ROOT, 'lib', 'states.js'));
const TRG = S.get('terengganu'), REF = S.get(S.reference());
const out = () => { try { return JSON.parse(r.stdout).additionalContext; } catch (_) { return r.stdout || ''; } };
const row = (o, n) => (o.split('\n').find(l => l.startsWith(n + ' ⬜')) || '');
const T = (n) => 'C:\\x\\1. Tasks\\' + n;
fs.mkdirSync(path.join(TMP, 'K', TRG.knowledge_dir, 'urusan'), { recursive: true });
fs.writeFileSync(path.join(TMP, 'K', TRG.knowledge_dir, 'urusan', 'OPLPS-TICKETS.md'), '# fixture\n');
fs.appendFileSync(FIXTURE,
  `\nqa=90101\nstatus=hold\nphase=0\nstate=Terengganu\nurusan=PLPS\ntask_folder=${T(TRG.task_folder)}\\3. ES #90101 - x\n` +
  `\nqa=90102\nstatus=hold\nphase=0\ntask_folder=${T(TRG.task_folder)}\\4. [STG] #90102 - y\n` +       // folder only, brackets, no state=
  '\nqa=90103\nstatus=hold\nphase=0\n' +                                                                // nothing: prompt decides
  '\nqa=90104\nstatus=hold\nphase=0\nstate=Perak\n' +
  `\nqa=90105\nstatus=hold\nphase=0\nstate=Melaka\nurusan=PRZ\ntask_folder=${T(REF.task_folder)}\\5. QA #90105 - z\n` +
  '\nqa=90106\nstatus=hold\nphase=0\nstate=Johor\n' +                                                   // unregistered state=
  `\nqa=90107\nstatus=hold\nphase=0\ntask_folder=${T(TRG.task_folder)}\\Archive\\6. ES #90107 - a\nurusan=OPLPS\n` + // Archive subfolder + doc on disk
  '\nqa=90108\nstatus=hold\nphase=0\nstate=kedah\n' +                                                   // scaffold: no modules, no db
  '\nqa=90109\nstatus=hold\nphase=0\nstate=TERENGGANU\n');                                              // capitalised

// F12 Terengganu block → row 0 from the registry: trunk, work clone, read-only developer checkout, ticket branch
r = run('lets start with 90101'); let o = out(), r0 = row(o, '0.');
const wc = TRG.work_clone_root.replace(/\//g, '\\') + '\\<repo>';
check('F12 TRG row 0 names the registry trunk, never the reference trunk', r0.includes('`' + S.trunk('terengganu', 'pelupusan') + '` etanah-pelupusan') && !r0.includes(S.trunk(S.reference(), 'pelupusan')), r0.slice(0, 200));
check('F12 TRG row 0 fetches + counts ONLY in the work clone', r0.includes('ONLY in the work clone** `' + wc + '`') && r0.includes('git -C "' + wc + '" fetch origin') && r0.includes('rev-list --count HEAD..origin/<baseline>'), r0.slice(0, 300));
check('F12 TRG row 0 makes the developer checkout read-only', r0.includes(path.dirname(S.repoPath('terengganu', 'pelupusan')) + '\\<repo>` gets READ-ONLY') && /NEVER fetch \/ pull \/ checkout \/ stash there/.test(r0), '');
check('F12 TRG row 0 has no pull instruction', !/git pull/.test(r0), '');
check('F12 TRG row 0 prints the ticket branch shape + shapes + branch note', r0.includes('`' + TRG.ticket_branch + '`') && r0.includes(Object.values(TRG.ticket_branch_shapes)[0]) && r0.includes(TRG.branch_note), '');
check('F12 TRG row 0 keeps the existing-fix probe for this ticket', r0.includes('--list "*90101*"') && r0.includes('--grep="#90101"'), '');
// F13 row 0.6 → registry DB line, staging-schema-check NOT ordered
let r06 = row(o, '0.6');
check('F13 TRG row 0.6 names primary env + MCP + schema + note', r06.includes('`' + TRG.db.primary_env + '`') && r06.includes('`' + S.mcp('terengganu') + '`') && r06.includes('`' + TRG.db.schemas[TRG.db.primary_env] + '`') && r06.includes(TRG.db.note), r06.slice(0, 200));
check('F13 TRG output never orders the staging-schema script', !/staging-schema\.js/.test(o) && /Do NOT run `staging-schema-check`/.test(r06), '');
check('F13 row 0.7 survives the 0.6 swap, clean', row(o, '0.7').startsWith('0.7 ⬜ **🚨 MODULE SET') && /0\.5 ⬜ /.test(o) && /\n1\. ⬜ Task folder loaded/.test(o), '');
// F14 row 1c says the file is absent; row 1d carries --state
check('F14 TRG row 1c says the precedent doc does NOT exist', /none on file for Terengganu yet/.test(row(o, '1c.')) && row(o, '1c.').includes(TRG.knowledge_dir + '/urusan/PLPS-TICKETS.md` does NOT exist') && row(o, '1c.').includes('urusan-tickets.js --state terengganu'), row(o, '1c.').slice(0, 200));
check('F14 TRG row 1d passes --state', row(o, '1d.').includes('node lib/test-data-db.js PLPS --state terengganu`'), row(o, '1d.').slice(0, 120));
check('F14 TRG knowledge dir line', o.includes('`etanah-knowledge/' + TRG.knowledge_dir + '/`'), '');
// F15 Task folder only (no state=, bracket chars, no urusan) → same state rows; 1c says no docs at all
r = run('lets start with 90102'); o = out();
check('F15 folder-only block resolves Terengganu (brackets in the name)', row(o, '0.').includes('ONLY in the work clone') && row(o, '1d.').includes('<urusan or keyword> --state terengganu'), row(o, '0.').slice(0, 120));
check('F15 no urusan + precedent doc present in sandbox → original 1c row kept', /URUSAN PRECEDENT — read/.test(row(o, '1c.')), row(o, '1c.').slice(0, 120));
// F16 Archive subfolder + precedent doc on disk → the normal 1c row pointing at the real file
r = run('lets start with 90107'); o = out();
check('F16 Archive subfolder resolves + existing doc keeps the read row', row(o, '1c.').includes('read `etanah-knowledge/' + TRG.knowledge_dir + '/urusan/OPLPS-TICKETS.md`'), row(o, '1c.').slice(0, 160));
check('F16b existing-doc 1c row regenerates THIS state, not the reference one', row(o, '1c.').includes('`node domain/urusan-tickets/urusan-tickets.js --state terengganu`'), row(o, '1c.').slice(-220));
// F17 PROMPT fallback — block carries nothing, the prompt quotes a 7-segment and a 6-segment id
r = run('ticket 90103 PTTRG/07/01/L/PLPS/2026/135 tak boleh hantar'); o = out();
check('F17 prompt id resolves the state (7-segment id)', o.includes('etanah-knowledge/' + TRG.knowledge_dir + '/') && row(o, '0.').includes('ONLY in the work clone'), o.slice(0, 200));
check('F17 a resolved state (non-reference) prints NO unresolved notice', !/STATE UNRESOLVED/.test(o), '');
check('F17 row 0.7 lists THIS state\'s registry modules and asserts no other state\'s call-activity pattern or "not deployed" stop',
  row(o, '0.7').includes('modules from the state registry') && Object.values(TRG.modules).every(m => row(o, '0.7').includes(m.repo))
  && /reference only: read, never edit/.test(row(o, '0.7')) && !/MLK_TKL_|not deployed locally/.test(row(o, '0.7'))
  && /Persist `module=` in active\.txt/.test(row(o, '0.7')) && /Banned: loading a ticket without the module line/.test(row(o, '0.7')), row(o, '0.7').slice(0, 300));
check('F17 header says the state came from the prompt, not silently', /state=terengganu \(read from the permohonan id in the prompt/.test(o), o.slice(0, 200));
r = run('ticket 90103 PTTRG/02/L/OPLPS/2026/47'); o = out();
check('F17b prompt id resolves (6-segment id)', row(o, '0.6').includes(S.mcp('terengganu')), '');
// F18 nothing resolves → STATE UNKNOWN stays, rows stay as before (no default picked by the new logic)
r = run('ticket 90103 please'); o = out();
check('F18 no state anywhere → STATE UNKNOWN: ASK miya', /STATE UNKNOWN/.test(o) && /ASK miya/.test(o) && !/DB FOR THIS STATE/.test(o), '');
check('F18 unresolved state → the notice says the rows below are the reference state\'s text', /STATE UNRESOLVED — rows 0, 0\.6 and 1d below are the REFERENCE state's text/.test(o) && o.indexOf('STATE UNRESOLVED') < o.indexOf('0. ⬜'), o.slice(0, 300));
r = run('ticket 90103 compare PTMLK/01/L/PT/2026/1 with PTTRG/07/01/L/PLPS/2026/135'); o = out();
check('F18b ids of TWO states in the prompt → ambiguous → STATE UNKNOWN', /STATE UNKNOWN/.test(o) && !/ONLY in the work clone/.test(o), o.slice(0, 200));
r = run('ticket 90106 PTTRG/07/01/L/PLPS/2026/135'); o = out();
check('F18c unregistered state= in the block is NOT overridden by a prompt id', /STATE UNKNOWN/.test(o) && !/ONLY in the work clone/.test(o), o.slice(0, 200));
r = run('QA 99998 PTTRG/07/01/L/PLPS/2026/135'); o = out();
check('F18d no block at all + prompt id → Terengganu rows', row(o, '0.').includes('ONLY in the work clone'), o.slice(0, 160));
// F19 block state outranks a foreign id quoted in the prompt
r = run('QA 90105 same as PTTRG/07/01/L/PLPS/2026/135 ?'); o = out();
const MLK_ROW0 = '0. ⬜ **🚨 GIT-STATE CHECK (Phase-0, COMPULSORY — run even if it returns nothing)** — `git status` + `git branch --show-current`; if NOT on the repo baseline (`mlk/master` pelupusan · `mlk/master` AWAM — corrected v1.55; stag-env/mlit are downstream) → stash → checkout baseline → `git pull --ff-only origin <baseline>` → pop (STOP if the pull fails — unknown commits). Then `git rev-list --count HEAD..origin/<baseline>` (behind-count). **Existing-fix probe**: `git branch -a --list "*90105*"` + `git log --all --grep="#90105" --format="%h %ci %an %s"`. **Emit a GIT-STATE summary** (branch · behind-count · existing-fix? · ticket-keyword log hits for context). **STOP + surface** if a fix exists under another author, the baseline pull fails, or behind-count is large (stale base).';
check('F19 Melaka block + foreign prompt id → still Melaka', row(o, '0.') === MLK_ROW0 && o.includes('`etanah-knowledge/melaka/`'), row(o, '0.').slice(0, 160));
// F20 MELAKA UNCHANGED — the four touched rows, pinned to the pre-change text
r = run('lets start with 90105'); o = out();
check('F20 Melaka row 0 byte-identical to the pre-change literal', row(o, '0.') === MLK_ROW0, row(o, '0.').slice(0, 200));
check('F20 a resolved state (reference) prints NO unresolved notice', !/STATE UNRESOLVED/.test(o), '');
check('F20 Melaka row 0.7 is the pre-change literal (module menu + the teknikal STOP + the BPMN-FIRST pointer)',
  o.includes('0.7 ⬜ **🚨 MODULE SET — declare the module(s) in focus in ONE line at load, BEFORE any analysis** — `etanah-pelupusan | etanah-awam | etanah-teknikal (STOP — not deployed locally) | etanah-common`, with the evidence (BPMN userTask vs MLK_TKL_* callActivity per CLAUDE.md BPMN-FIRST')
  && !o.includes('modules from the state registry'), (o.split('\n').find(l => l.includes('0.7 ⬜')) || '').slice(0, 260));
check('F20 Melaka row 0.6 still orders staging-schema-check', row(o, '0.6').startsWith('0.6 ⬜ **🚨 STAGING SCHEMA — resolve it at LOAD, never assume, never copy it from a qa_doc** — run `node domain/staging-schema-check/staging-schema.js` and EMIT the line it prints.') && !/DB FOR THIS STATE/.test(o), '');
check('F20 Melaka row 1c still the read row', row(o, '1c.').startsWith('1c. ⬜ **URUSAN PRECEDENT — read `etanah-knowledge/melaka/urusan/PRZ-TICKETS.md`** (derive the KOD first'), row(o, '1c.').slice(0, 120));
check('F20 Melaka row 1c regenerate command has NO --state', row(o, '1c.').includes('`node domain/urusan-tickets/urusan-tickets.js` (office network)'), row(o, '1c.').slice(-220));
check('F20 Melaka row 1d has NO --state', row(o, '1d.').startsWith('1d. ⬜ **TEST-DATA LOOKUP FIRST — run `node lib/test-data-db.js PRZ` and paste the result**'), row(o, '1d.').slice(0, 120));
check('F20 Melaka header unchanged', o.includes('⚔️ QUEST GATE — QA #90105 detected (state: phase=0, status=hold, state=Melaka).'), '');
// F21 another active state without a work clone (Perak) → its own trunk, ordinary pull sequence, its own DB line
r = run('lets start with 90104'); o = out();
check('F21 Perak row 0 = its trunk + pull sequence, no work clone', row(o, '0.').includes('`' + S.trunk('perak', 'pelupusan') + '` etanah-pelupusan') && /git pull --ff-only origin <baseline>/.test(row(o, '0.')) && !/work clone/.test(row(o, '0.')) && !row(o, '0.').includes('mlk/master'), row(o, '0.').slice(0, 200));
check('F21 Perak row 0.6 = its MCP, 1d = --state perak', row(o, '0.6').includes(S.mcp('perak')) && row(o, '1d.').includes('--state perak'), '');
// F22 scaffold state with empty registry fields → says ASK, never crashes, never borrows another state's value
r = run('lets start with 90108'); o = out();
check('F22 empty modules/db → "ASK miya" in rows 0 + 0.6, exit 0', r.status === 0 && /baseline UNKNOWN \(not in the state registry: ASK miya\)/.test(row(o, '0.')) && /primary env `not in the state registry: ASK miya`/.test(row(o, '0.6')) && !row(o, '0.').includes('mlk/master'), row(o, '0.').slice(0, 200));
r = run('lets start with 90109'); o = out();
check('F22b state=TERENGGANU (capitalised) resolves', row(o, '0.').includes('ONLY in the work clone'), '');

// F5 real active.txt untouched by the whole eval
const realHashAfter = hashReal();
check('F5 real quest/active.txt byte-identical', realHashBefore === realHashAfter, '');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log(`\nticket-gate.eval: ${results.length - failed}/${results.length} green`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
