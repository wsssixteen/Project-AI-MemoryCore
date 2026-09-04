#!/usr/bin/env node
/**
 * eval.js — /agih skill fixture eval
 *
 * /agih answers ONE question: is this officer actually eligible for this tugasan,
 * and if not, what is the real fix. Its value is that it refuses to hand over a
 * patch script before the eligibility checks have run — because the 2026-07-28
 * PSBS/SKM case proved a patched row gives an officer a task he cannot see.
 *
 * This eval pins: the id-resolution facts (which are easy to get wrong and were
 * got wrong live), the four eligibility checks, the verdict-before-script policy,
 * the code-owner column set, and the env/reachability rules.
 *
 * Run: node domain/agih/eval.js
 */

const fs = require('fs');
const path = require('path');

const SKILL = path.resolve(__dirname, '..', '..', '.claude', 'skills', 'agih', 'SKILL.md');

let pass = 0;
let fail = 0;

function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('eval: /agih skill\n');

if (!fs.existsSync(SKILL)) {
  console.log(`  FAIL  SKILL.md exists at ${SKILL}`);
  process.exit(1);
}
const src = fs.readFileSync(SKILL, 'utf8');
const fm = src.slice(0, src.indexOf('---', 4) + 3);

// --- 1. frontmatter / triggering -----------------------------------------
check('name is agih', /^name:\s*agih\s*$/m.test(fm));
check('triggers on the BA phrasing "patch user"', /patch user/i.test(fm));
check('triggers on the not-showing symptom', /not showing in his dashboard|tak masuk dalam senarai/i.test(fm));
check('description states it decides capaian vs screen vs patch', /capaian grant.*screen.*patch/is.test(fm));

// --- 2. the core rule -----------------------------------------------------
check('states a patch request is an eligibility question', /is an eligibility question/i.test(src));
check('states task list filters by capaian', /task list (also )?filters by capaian/i.test(src));
check('states patched row = task he cannot see', /owns a task he cannot see/i.test(src));
check('cites the 2026-07-28 PSBS case', /2026-07-28[\s\S]{0,200}PSBS/.test(src));
check('records capaianPenggunaList empty as the proven cause', /capaianPenggunaList:\[\]/.test(src));

// --- 3. id resolution (each of these was got wrong live) ------------------
check('permohonan id maps to id_pengenalan', /id_pengenalan/.test(src));
check('warns id is NOT no_fail', /NOT `?no_fail`?/i.test(src));
check('umm_tgsn_semasa named as the Dashboard entity', /umm_tgsn_semasa[\s\S]{0,80}Dashboard entity/i.test(src));
check('warns no table is named %dashboard%', /no table named `?%dashboard%`?/i.test(src));
check('flag_aktif=Y is the live-row filter', /flag_aktif='Y'[\s\S]{0,60}live/i.test(src));

// --- 4. the agihan log is read FIRST -------------------------------------
check('log column named as the evidence source', /umm_tgsn_semasa\.log/.test(src));
check('log read before forming a theory', /before forming any theory/i.test(src));
check('AgihanKepada param interpreted', /AgihanKepada/.test(src));
check('already-failed-through-proper-channel rule present', /already\s+failed once through the proper channel/i.test(src));

// --- 5. the four eligibility checks --------------------------------------
check('check 1 user identity', /User identity[\s\S]{0,120}pcp_pengguna/.test(src));
check('check 2 peranan', /Peranan[\s\S]{0,140}pcp_capaian_pengguna/.test(src));
check('check 3 pejabat', /Pejabat[\s\S]{0,140}pejabat_id/.test(src));
check('check 4 capaian urusan chain', /pcp_capaian_modul[\s\S]{0,120}pcp_capaian_jns_ursn[\s\S]{0,80}pcp_capaian_ursn/.test(src));
check('duplicate-user trap recorded', /duplicate/i.test(src) && /iskandarz@melaka\.gov\.my/.test(src));
check('bans resolving user by nama or partial match', /[Nn]ever resolve a user by `?nama`?/.test(src));
check('capaian_penuh latent defect flagged', /flag_capaian_penuh[\s\S]{0,220}INNER JOIN/is.test(src));
check('peranan matched dash-wrapped not substring', /-KOD-[\s\S]{0,40}never a substring/i.test(src));

// --- 6. verdict before script (the policy miya chose) ---------------------
check('output declared a verdict not a script', /Output = a verdict, not a script/i.test(src));
check('script withheld until asked', /only when みや asks|only on request/i.test(src));
check('four verdict rows present', /Eligible[\s\S]{0,600}Capaian gap[\s\S]{0,400}Wrong peranan[\s\S]{0,400}Wrong user record/s.test(src));
check('UI preferred in every branch', /Prefer the UI in every branch/i.test(src));

// --- 7. code owner + exact column set ------------------------------------
check('code owner cited with line', /AppTugasanRepository\.updateAppTugasanPengguna\(\):217/.test(src));
check('caller cited with line', /CommonPengagihanSemulaForm\.onChangeAllSelectedPegawai\(\):183/.test(src));
check('owner JPQL quoted verbatim', /SET at\.asalPengguna = :user, at\.semasaPengguna = :user/.test(src));
check('agih updates in place, no new row', /never inserts a new `?umm_a_tgsn`? row/i.test(src));
check('flag_pengagihan_baru semantics recorded', /flag_pengagihan_baru='Y'[\s\S]{0,120}diagih_daripada='-'/.test(src));
check('sets both asal and semasa', /pengguna_asal_id`? \+ `?pengguna_semasa_id/.test(src));
check('bans tdkn_oleh', /Never set[\s\S]{0,60}tdkn_oleh/.test(src));
check('bans version bump', /Never set[\s\S]{0,140}version/.test(src));
check('both companion tables listed', /umm_tgsn_semasa/.test(src) && /umm_sejarah_pengagihan/.test(src));
check('companion writers cited with lines', /DashboardRepository\.updateDashboardPenggunaByDashboardId\(\):246/.test(src)
  && /SejarahPengagihanRepository\.saveAll\(\):195/.test(src));

// --- 8. script conventions (CLAUDE.md hard rules) -------------------------
check('scripts for miya are unqualified', /Scripts handed to みや carry NO prefix/i.test(src));
check('my own queries carry the prefix', /Queries I run carry the schema prefix/i.test(src));
check('no-JOIN rule present', /\*\*no JOIN\*\*/i.test(src));
check('kod-subquery required', /kod-subquery one table per line/i.test(src));
check('no hardcoded PKs', /no hardcoded PKs/i.test(src));
check('expected-row annotation required', /-- N rows updated/.test(src));
check('Stage-Match Block required', /Stage-Match Block[\s\S]{0,120}5 rows/i.test(src));
check('omitting companions declared revert-shape', /omits the companions[\s\S]{0,80}revert-shape/i.test(src));

// --- 9. environments ------------------------------------------------------
check('mlit row present', /et_main_mlit[\s\S]{0,60}172\.16\.100\.197:5444\/mkit/.test(src));
check('stg1 row present', /et_main_stg1[\s\S]{0,60}172\.30\.12\.202:5444/.test(src));
check('stg2 row present', /et_main_stg2[\s\S]{0,60}172\.30\.12\.202:5444/.test(src));
check('trn row present and marked pending', /`trn`[\s\S]{0,120}pending/i.test(src));
check('prod is read-only and gated', /prod[\s\S]{0,120}READ-ONLY[\s\S]{0,60}prod-db-confirm/i.test(src));
check('env must not be assumed', /Never assume the env/i.test(src));
check('MCP-down fallback documented', /MCP down is not a blocker/i.test(src));
check('fallback is read-only transaction', /BEGIN READ ONLY/.test(src));
check('bans writing from fallback client', /Never write from the fallback client/i.test(src));

// --- 10. banned list ------------------------------------------------------
check('bans script before checks', /Emitting a patch script before the four eligibility checks/i.test(src));
check('bans claiming a patch fixes visibility', /Claiming a DB patch fixes visibility/i.test(src));
check('requires a sendable plain message for BA questions', /sendable[\s\S]{0,40}plain-language message/i.test(src));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
