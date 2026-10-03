#!/usr/bin/env node
// etanah-intake-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-08-21 hakmilik-luas patch — free-text patch ask + 3 hakmilik IDs matched NO gate;
// wrong banked 1:1 linkage trusted, wrong rows patched twice, one input ID silently substituted.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'etanah-intake-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function fire(prompt) {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000, env: process.env });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// F1: clean/empty input -> no false block
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: THE REPLAY — fires DATA-PATCH lane + routes hakmilik knowledge + names all 4 disciplines
r = fire('5040140PM00000100\n040202PM00000298\n040327HSM00001293\n\nHi boleh tolong patch luas hakmilik to 6 hektar @ stg & it, thanks');
check('F2 replay fires DATA-PATCH lane', r.status === 0 && /DATA-PATCH lane/.test(r.out), r.out.slice(0, 200));
check('F2b routes DATABASE.md + hakmilik map', /DATABASE\.md/.test(r.out) && /reference_hakmilik_change_map/.test(r.out), r.out.slice(0, 300));
check('F2c carries KEY-PATH + IDs VERBATIM + CROSS-VERIFY + script-check', /KEY-PATH EVIDENCE/.test(r.out) && /IDs VERBATIM/.test(r.out) && /CROSS-VERIFY/.test(r.out) && /script-check/.test(r.out), 'effect check');
check('F2d names both STG schemas', /et_main_stg1/.test(r.out) && /et_main_stg2/.test(r.out), 'env completeness');

// F3: ticket number present -> silent (ticket-gate owns)
r = fire('QA 276549 PRBB tak boleh seterusnya, patch the hakmilik data');
check('F3 ticket number -> silent', r.status === 0 && !/etanah-intake/.test(r.out), r.out.slice(0, 120));

// F4: labelled-field paste -> silent (adhoc-paste-detector owns)
r = fire('Urusan: PPTPB\nTugasan: SKM\nId: PTMLK/03/L/PPTPB/2026/4\nUser: aliya\ntolong check kenapa error');
check('F4 labelled paste -> silent', r.status === 0 && !/etanah-intake/.test(r.out), r.out.slice(0, 120));

// F5: free-text error signal -> ADHOC-CANDIDATE lane
r = fire('PPTPB Teknikal NPE bila klik seterusnya kat tugasan tu');
check('F5 error signal fires ADHOC-CANDIDATE', r.status === 0 && /ADHOC-CANDIDATE lane/.test(r.out), r.out.slice(0, 200));

// F6: pure question -> LOOKUP lane with DATABASE.md routing
r = fire('apa beza ind_hkmlk dengan fatmk.hakmilik?');
check('F6 question fires LOOKUP + DATABASE.md', r.status === 0 && /LOOKUP lane/.test(r.out) && /DATABASE\.md/.test(r.out), r.out.slice(0, 200));

// F7: non-etanah prompt -> silent
r = fire('commit and push the memory core changes then update the diary');
check('F7 non-etanah -> silent', r.status === 0 && !/etanah-intake/.test(r.out), r.out.slice(0, 120));

// F8: bypass token -> silent
r = fire('[skip-etanah-intake: already scaffolded] patch luas hakmilik 040202PM00000298');
check('F8 bypass token -> silent', r.status === 0 && !/DATA-PATCH/.test(r.out), r.out.slice(0, 120));

// ── HOTFIX lane (2026-09-24, #281392 replay) ────────────────────────────────
// H1: THE REPLAY — verbatim opening prompt; it got LOOKUP, no scaffold, no hotfix workflow.
r = fire('Ruri, we have an adhoc issue, we will be releasing hotfix today. Related to a ticket we released yesterday. Related to our fix ticket 280176 you can check back. The clues, during BA testing in internal, there was no issue, so please check data as well for PROD vs STAG. Please check jrxml as well.\nUser speaking to BA:\n[[Assalamualaikum fizah, user dah try buat tapi bila click borang 4Ae no resit keluar null dan tarikh 31/12/206 bukan 31/12/2025]]');
check('H1 replay fires HOTFIX lane + names hotfix skill + scaffold', r.status === 0 && /HOTFIX lane/.test(r.out) && /`hotfix` skill/.test(r.out) && /SCAFFOLD FIRST/.test(r.out), r.out.slice(0, 200));
check('H1b effect: branch rule + knowledge §8 rendered', /mlk\/hotfix\/<own #>/.test(r.out) && /BRANCH-AND-DEPLOY\.md §8/.test(r.out), 'effect check');
// H2: hotfix with a #ticket present → still HOTFIX (beats the ticket silence)
r = fire('hotfix for #280176 — PROD borang 4Ae null');
check('H2 hotfix + #ticket → HOTFIX lane (not silent)', r.status === 0 && /HOTFIX lane/.test(r.out), r.out.slice(0, 160));
// H3: "dah release" + ralat, no word hotfix
r = fire('semalam dah release, sekarang PROD papar ralat kat Pengeluaran Lesen');
check('H3 "dah release" + ralat → HOTFIX lane', r.status === 0 && /HOTFIX lane/.test(r.out), r.out.slice(0, 160));
// H4: hotfix word with no etanah / env / error / ticket signal → silent
r = fire('what is a hotfix in git terminology?');
check('H4 generic hotfix question → silent', r.status === 0 && !/HOTFIX lane/.test(r.out), r.out.slice(0, 160));
// H5: bypass token silences HOTFIX too
r = fire('[skip-etanah-intake: scaffolded] hotfix PROD ralat');
check('H5 bypass → silent', r.status === 0 && !/HOTFIX lane/.test(r.out), r.out.slice(0, 160));
// H6: plain ticket without hotfix signal → still silent (sibling ownership unchanged)
r = fire('#280895 continue the Rubric please');
check('H6 plain #ticket → silent (unchanged)', r.status === 0 && !/etanah-intake/.test(r.out), r.out.slice(0, 160));

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12 (>=10, verdict each) ═══
// 1. Own emit text pasted back (self-disarm class): prompt quoting "DATA-PATCH lane" -> A1 fixture:
//    still classifies by SIGNALS not by its own vocabulary; quoting the banner alone (no etanah signal) stays silent.
r = fire('what does "DATA-PATCH lane" mean in that banner?');
check('A1 own vocabulary quoted, no etanah signal -> silent', r.status === 0 && !/etanah-intake/.test(r.out), r.out.slice(0, 120));
// 2. Malformed JSON stdin -> fixture A2: exit 0, no crash.
r = spawnSync(process.execPath, [HOOK], { input: 'not-json{{', encoding: 'utf8', timeout: 30000, env: process.env });
check('A2 malformed stdin exits 0', r.status === 0, 'exit=' + r.status);
// 3. "fix it" plain English (mutation verb + it-env trap) -> fixture A3: no etanah context -> silent.
r = fire('can you fix it please, the tests are failing');
check('A3 "fix it" without etanah context -> silent', r.status === 0 && !/etanah-intake/.test(r.out), r.out.slice(0, 120));
// 4. worktree vs main repo: hook resolves lib via CLAUDE_PROJECT_DIR || __dirname/../.. — handled (forge template convention, F1 proves load).
// 5. huge prompt (multi-MB) -> fixture A5: regex on one string, exits fast.
r = fire('hakmilik '.repeat(200000) + ' patch luas @ stg');
check('A5 1.6MB prompt exits 0 fast', r.status === 0, 'exit=' + r.status);
// 6. bypass token in an OLD turn: gate reads ONLY the current prompt (no transcript scan) — handled by design; cannot be disarmed by history.
// 7. dependency deleted (lib/hook-runtime.js): process throws at require -> hook exits non-zero, hook-syntax-check SessionStart audit + system-audit surface it — accepted-risk (shared failure mode of every gate in the repo).
// 8. two concurrent sessions: gate is stateless (no file writes beyond runHook telemetry append) — handled.
// 9. eval-sandbox copy without adjacent lib: same as 4 — CLAUDE_PROJECT_DIR env resolves — handled (this eval passes env through).
// 10. user-instruction reversal: a prompt that ASKS to skip knowledge ("patch terus, jangan baca knowledge") -> still fires; only the explicit bypass token silences. Fixture A10:
r = fire('patch terus luas hakmilik 040202PM00000298, tak payah baca knowledge');
check('A10 "skip knowledge" plea still fires DATA-PATCH', r.status === 0 && /DATA-PATCH lane/.test(r.out), r.out.slice(0, 160));
// 11. permohonan-ID free text (PTMLK...) without labels -> should FIRE (adhoc-paste-detector needs >=3 labels; this is the gap feedback_adhoc_scaffold_delegate names). Fixture A11:
r = fire('boleh check kenapa PTMLK/02/L/PT/2026/26 stuck, ada error kat SKM');
check('A11 bare permohonan-ID + error fires ADHOC-CANDIDATE', r.status === 0 && /ADHOC-CANDIDATE/.test(r.out), r.out.slice(0, 160));
// 12. uppercase/mixed-case IDs and tables -> regexes are /i — handled (F6 lowercase fatmk proves).

// ═══ STATE ROUTING (2026-10-03, Terengganu went active) ═════════════════════
// Sandbox: temp registry (STATES_FILE) + temp knowledge root (KNOWLEDGE_ROOT). Never the real Task folders,
// active.txt, Redmine or git. The Melaka goldens are sha1 of the hook's stdout captured BEFORE this change.
{
  const fs = require('fs'), os = require('os'), crypto = require('crypto');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'intake-state-'));
  const mods = (t) => ({ pelupusan: { repo: 'etanah-pelupusan', trunk: t }, awam: { repo: 'etanah-awam', trunk: t } });
  const reg = { version: 1, reference_state: 'melaka', tasks_root: 'x/1. Tasks', repos_root: 'E:/Projects', knowledge_root: 'projects/coding-projects/active/etanah-knowledge', states: {
    melaka: { label: 'Melaka', code: 'MLK', aliases: ['Melaka', 'MLK', 'mlk'], permohonan_prefix: 'PTMLK', work_scope: 'active', knowledge_dir: 'melaka', modules: mods('mlk/master'), branch_prefix: 'mlk', ticket_branch: 'mlk/<tracker>/<num>', db: { engine: 'postgres', mcp: { mlit: 'postgres-mlit-pg' }, schemas: { mlit: 'et_main_mlit' }, primary_env: 'mlit' } },
    perak: { label: 'Perak', code: 'PRK', aliases: ['Perak', 'PRK', 'prk'], permohonan_prefix: 'PTPK', work_scope: 'active', knowledge_dir: 'perak', modules: mods('master'), branch_prefix: 'prk', ticket_branch: 'prk/<tracker>/<num>', trunk_ref: 'origin/master', db: { engine: 'oracle', mcp: { dev: 'oracle-prk-dev', prod: 'oracle-prk-prod' }, schemas: { prod: 'ET_MAIN' }, primary_env: 'prod' } },
    kedah: { label: 'Kedah', code: 'KDH', aliases: ['Kedah', 'KDH', 'kdh'], permohonan_prefix: 'PTKDH', work_scope: 'scaffold', knowledge_dir: 'kedah', modules: {}, branch_prefix: 'kdh', ticket_branch: null, db: { engine: null, mcp: {}, schemas: {}, primary_env: null } },
    terengganu: { label: 'Terengganu', code: 'TRG', aliases: ['Terengganu', 'TRG', 'trg'], permohonan_prefix: 'PTTRG', work_scope: 'active', knowledge_dir: 'terengganu', modules: mods('trg/master'), branch_prefix: 'trg', ticket_branch: 'trg/<tracker>/<num>', trunk_ref: 'origin/trg/master', work_clone_root: 'E:/Dev/etanah-work', db: { engine: 'postgres', mcp: { stg2: 'postgres-trgstg2-pg', stg1: 'postgres-trgstg1-pg' }, schemas: { stg2: 'et_main_stg2', stg1: 'et_main_stg1' }, primary_env: 'stg2' } },
  } };
  fs.writeFileSync(path.join(tmp, 'states.json'), JSON.stringify(reg));
  const kroot = path.join(tmp, 'k');
  for (const f of ['index.md', 'STATE-FACTS.md', 'DATABASE.md', 'BRANCH-AND-DEPLOY.md']) { fs.mkdirSync(path.join(kroot, 'terengganu'), { recursive: true }); fs.writeFileSync(path.join(kroot, 'terengganu', f), '# ' + f); }
  fs.mkdirSync(path.join(kroot, 'perak'), { recursive: true });
  const env = Object.assign({}, process.env, { STATES_FILE: path.join(tmp, 'states.json'), STATES_LOCAL_FILE: path.join(tmp, 'none.json'), KNOWLEDGE_ROOT: kroot });
  delete env.ETANAH_STATE;
  const fireS = (prompt, extra) => { const x = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000, env: Object.assign({}, env, extra || {}) }); return { status: x.status, out: x.stdout || '', err: x.stderr || '' }; };
  const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');
  const KD = 'etanah-knowledge/';

  // S1: 7-segment PTTRG id + patch -> DATA-PATCH on Terengganu paths, nothing Melaka.
  let s = fireS('tolong patch luas hakmilik PTTRG/07/01/L/PLPS/2026/135 @ stg');
  check('S1 PTTRG patch -> DATA-PATCH + STATE Terengganu', s.status === 0 && /DATA-PATCH lane/.test(s.out) && /STATE — Terengganu \(TRG\), from permohonan-ID prefix PTTRG/.test(s.out), s.out.slice(0, 300));
  check('S1b terengganu/DATABASE.md, no melaka path, no Melaka-banked memory', s.out.includes(KD + 'terengganu/DATABASE.md') && !/melaka/i.test(s.out) && !/reference_hakmilik_change_map/.test(s.out), s.out);
  check('S1c env line from the record (stg2 primary + MCP), no mlit', /primary stg2 = et_main_stg2 via postgres-trgstg2-pg/.test(s.out) && /stg1 = et_main_stg1 via postgres-trgstg1-pg/.test(s.out) && !/mlit/.test(s.out), s.out);
  check('S1d disciplines kept (KEY-PATH · IDs VERBATIM · CROSS-VERIFY · script-check)', /KEY-PATH EVIDENCE/.test(s.out) && /IDs VERBATIM/.test(s.out) && /CROSS-VERIFY/.test(s.out) && /script-check/.test(s.out), 'effect');
  // S2: bare 7-segment id, nothing else -> fires (the generic id regex cannot see the second 2-digit block).
  s = fireS('PTTRG/07/01/L/PLPS/2026/135');
  check('S2 bare PTTRG id fires LOOKUP on terengganu/index.md', /LOOKUP lane/.test(s.out) && s.out.includes(KD + 'terengganu/index.md') && !/melaka/i.test(s.out), s.out);
  // S3: state named as a word; lane file absent on disk -> index.md + STATE-FACTS.md, never a missing file.
  s = fireS('Terengganu: skrin tugasan papar ralat bila klik dropdown');
  check('S3 alias "Terengganu" -> ADHOC-CANDIDATE on Terengganu', /ADHOC-CANDIDATE lane/.test(s.out) && /STATE — Terengganu/.test(s.out) && !/melaka/i.test(s.out), s.out);
  check('S3b missing lane files -> index.md + STATE-FACTS.md + a note, no path to a missing file', s.out.includes('- ' + path.posix.join('projects/coding-projects/active', KD, 'terengganu/index.md')) && s.out.includes(KD + 'terengganu/STATE-FACTS.md') && !s.out.includes(KD + 'terengganu/JSF-WIRING.md') && !s.out.includes(KD + 'terengganu/FLOWABLE-WORKFLOWS.md') && /\(no FLOWABLE-WORKFLOWS\.md/.test(s.out), s.out);
  // S4: short code as listed ("TRG") + hotfix -> trunk / ticket shape / work clone from the record.
  s = fireS('TRG hotfix, PROD papar ralat lepas release semalam');
  check('S4 TRG hotfix -> origin/trg/master + trg/<tracker>/<num> + work clone, no mlk', /HOTFIX lane/.test(s.out) && /off fresh origin\/trg\/master \(work clone E:\/Dev\/etanah-work\)/.test(s.out) && /`trg\/<tracker>\/<num>`/.test(s.out) && !/mlk\//.test(s.out) && s.out.includes(KD + 'terengganu/BRANCH-AND-DEPLOY.md') && !/§8/.test(s.out), s.out);
  // S5: Perak — oracle record, knowledge dir empty on disk.
  s = fireS('Perak hotfix, PROD papar ralat lepas release semalam');
  check('S5 Perak hotfix -> origin/master + perak index/STATE-FACTS', /STATE — Perak \(PRK\)/.test(s.out) && /off fresh origin\/master/.test(s.out) && s.out.includes(KD + 'perak/index.md + ') && !/mlk\//.test(s.out), s.out);
  s = fireS('boleh patch hakmilik PTPK/02/L/PT/2026/9 @ prod');
  check('S5b Perak patch -> oracle primary prod = ET_MAIN via oracle-prk-prod', /Perak \(oracle\): primary prod = ET_MAIN via oracle-prk-prod; also dev via oracle-prk-dev/.test(s.out), s.out);
  // S6: empty registry fields (no MCP, no trunk, no ticket branch) -> says UNKNOWN, never invents.
  s = fireS('Kedah: patch luas hakmilik 040202PM00000298 @ stg');
  check('S6 empty db -> "state UNKNOWN envs"', /state UNKNOWN envs: system\/states\.json holds no DB MCP for Kedah/.test(s.out) && !/et_main_/.test(s.out), s.out);
  // S7: two states named, no id -> default text + state UNKNOWN line (never a silent pick).
  s = fireS('beza flow tugasan Melaka dengan Terengganu?');
  check('S7 two states named -> state UNKNOWN line', /LOOKUP lane/.test(s.out) && /⚠ state UNKNOWN — the prompt names Melaka \+ Terengganu/.test(s.out), s.out);
  // S8: id of one state + name of another -> the id wins, the other is flagged.
  s = fireS('PTTRG/02/L/OPLPS/2026/47 error, sama macam Melaka punya kes');
  check('S8 PTTRG id + "Melaka" word -> Terengganu paths + flag', /STATE — Terengganu/.test(s.out) && /also names Melaka/.test(s.out), s.out);
  s = fireS('Terengganu ticket, tengok PTMLK/02/L/PT/2026/26 kenapa error');
  check('S8b PTMLK id + "Terengganu" word -> Melaka text + flag', s.out.includes(KD + 'melaka/') && !/STATE —/.test(s.out) && /also names Terengganu/.test(s.out), s.out);
  // S9: unregistered prefix / lower-case short code inside a word -> no state, today's text.
  s = fireS('boleh check kenapa PTXYZ/02/L/PT/2026/26 stuck, ada error');
  check('S9 unknown prefix -> default text, no STATE line', /ADHOC-CANDIDATE/.test(s.out) && s.out.includes(KD + 'melaka/') && !/STATE —|state UNKNOWN/.test(s.out), s.out);
  // S10: registry unreadable -> today's text, exit 0.
  s = fireS('tolong patch luas hakmilik PTTRG/07/01/L/PLPS/2026/135 @ stg', { STATES_FILE: path.join(tmp, 'gone.json') });
  check('S10 registry missing -> exit 0 + default text', s.status === 0 && /DATA-PATCH lane/.test(s.out) && !/STATE —/.test(s.out), s.out + s.err);
  // S11: ETANAH_STATE env (lib/states.js cascade) beats the prompt text.
  s = fireS('apa beza ind_hkmlk dengan fatmk.hakmilik?', { ETANAH_STATE: 'terengganu' });
  check('S11 ETANAH_STATE=terengganu -> Terengganu paths', /STATE — Terengganu \(TRG\), from env ETANAH_STATE/.test(s.out) && s.out.includes(KD + 'terengganu/DATABASE.md'), s.out);
  // S12: ticket number + Terengganu, no hotfix -> still silent (sibling ownership unchanged).
  s = fireS('#281000 Terengganu continue the Rubric please');
  check('S12 #ticket + state word -> silent', s.status === 0 && s.out === '', s.out);

  // M: MELAKA UNCHANGED — stdout byte-identical to the pre-change capture (no state / PTMLK id / "Melaka" word).
  const GOLD = [
    ['M1 no-state DATA-PATCH', '5040140PM00000100\n040202PM00000298\n040327HSM00001293\n\nHi boleh tolong patch luas hakmilik to 6 hektar @ stg & it, thanks', '378b2280fe862892c761a2636493c1c1365c2d43'],
    ['M2 PTMLK id ADHOC-CANDIDATE', 'boleh check kenapa PTMLK/02/L/PT/2026/26 stuck, ada error kat SKM', 'db22147a0ec1465a04805b8d8c9473cf97197beb'],
    ['M3 no-state LOOKUP', 'apa beza ind_hkmlk dengan fatmk.hakmilik?', 'a2885ad6b776d94360ced1368b6c3fb1c45b7e84'],
    ['M4 no-state HOTFIX', 'hotfix for #280176 — PROD borang 4Ae null', 'ac83eca47478bdfb033be39a41644b056ae3e5ab'],
    ['M5 no-route index.md fallback', 'permohonan tu macam mana?', '0c1ae708c44af1b7e810a6ad72520bd72796fc68'],
    ['M6 "Melaka" word ADHOC-CANDIDATE', 'Melaka: kenapa tugasan SKM tak papar dropdown, error', '9410f1005ff924af0ddbe939da02dde18b4ac7ad'],
  ];
  for (const [n, p, h] of GOLD) {
    const a = fireS(p);
    check(n + ' byte-identical (sandbox registry)', sha(a.out) === h, sha(a.out));
    if (!process.env.ETANAH_STATE) { const live = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt: p }), encoding: 'utf8', timeout: 30000, env: process.env }); check(n + ' byte-identical (live registry)', sha(live.stdout || '') === h, sha(live.stdout || '')); }
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\netanah-intake-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
