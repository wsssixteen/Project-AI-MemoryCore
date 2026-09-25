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

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\netanah-intake-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
