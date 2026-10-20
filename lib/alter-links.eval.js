#!/usr/bin/env node
// lib/alter-links.eval.js — pins for lib/alter-links.js (read-only Alter links + engine trap check).
// OFFLINE cases (A*) need nothing. LIVE cases (L*) read through the db-gateway (127.0.0.1:7411) and are
// SKIPPED when it is down. The Flowable engine side of the live cases uses REST captures taken on
// 2026-10-19 in a logged-in Edge session (embedded below), fed with --engine-json: a headless run has no
// Flowable session of its own. Captures, not live reads, drive every WARNING / NOTE asserted here.
// Replay: #285181 PTMLK/02/L/PLPS/2026/2 (PROD, process 25188131 at 8.0 SJTLT, no tugasan row, penghantaranId trap).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const SCRIPT = path.join(__dirname, 'alter-links.js');
const M = require(SCRIPT);

const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d: d || '' });
const skip = (n, why) => results.push({ n, pass: true, d: 'SKIPPED: ' + why, skipped: true });

// ---- captures (shape of the admin REST: root, tasks (historic list), variables {data:[{variable:{name,value}}]}) ----
const V = (o) => ({ data: Object.entries(o).map(([name, value]) => ({ variable: { name, value } })) });
const PROD_285181 = {
  25188052: { root: { id: '25188052', processDefinitionName: 'MLK_PLP_PLPS', startTime: '2026-10-19T10:24:52.501+08:00', endTime: '2026-10-19T10:44:47.092+08:00', deleteReason: 'End Flowable - Mon Oct 19 10:44:47 MYT 2026' },
    tasks: { data: [{ id: '25188130', name: '4.0 Semakan Kemasukan Maklumat', taskDefinitionKey: 'sid-5BBA4DF7-D952-43E4-8AEE-10CAEB76DD7C', startTime: '2026-10-19T10:25:27.616+08:00', endTime: '2026-10-19T10:44:47.067+08:00' }] },
    variables: V({ aliranKerjaId: '50692', penghantaranId: 'PND/02/L/2026/7', urusan: 'PLPS' }) },
  25188131: { root: { id: '25188131', processDefinitionName: 'MLK_PLP_PLPS', startTime: '2026-10-19T10:44:47.133+08:00', endTime: null, deleteReason: null },
    tasks: { data: [{ id: '25188202', name: 'DELAY (35 s)', taskDefinitionKey: 'sid-331253DA-5FFD-4035-A05A-179E821B321D', startTime: '2026-10-19T10:44:47.135+08:00', endTime: '2026-10-19T10:45:20.024+08:00' },
      { id: '25188205', name: '8.0 Semakan Jabatan Teknikal,Laporan Tanah, Pelan MMK', taskDefinitionKey: 'sid-3E1FF1D8-81A5-4785-872F-56AEE2E965D4', startTime: '2026-10-19T10:45:20.027+08:00', endTime: null }] },
    variables: V({ aliranKerjaId: '50716', applicationName: 'etanah-pelupusan', penghantaranId: 'PND/02/L/2026/7', urusan: 'PLPS' }) },
};
const PROD_OLD_PPJ = {
  14275035: { root: { id: '14275035', processDefinitionName: 'MLK_LLG_PPJ', startTime: '2026-06-18T18:25:08.728+08:00', endTime: null, deleteReason: null },
    tasks: { data: [{ id: '17075247', name: 'Pengesahan Kehadiran Semasa Siasatan', taskDefinitionKey: 'sid-55BFADD7-2134-4650-B656-40075076C76A', startTime: '2026-07-20T13:50:55.403+08:00', endTime: null }] },
    variables: V({ aliranKerjaId: '3', urusan: 'PPJ' }) },
  17102656: { root: { id: '17102656', processDefinitionName: 'MLK_PN_Dalam', startTime: '2026-07-20T14:04:48.725+08:00', endTime: null, deleteReason: null },
    tasks: { data: [{ id: '17080024', name: 'Kemasukan Maklumat Penyampaian Notis', taskDefinitionKey: 'sid-67301B79-A4D3-4228-84C9-155BF609207F', startTime: '2026-07-20T14:05:25.411+08:00', endTime: null }] },
    variables: V({ aliranKerjaId: '13595', penghantaranId: 'PND/01/A/2026/79', urusan: 'UPND' }) },
};
const MLIT_PT29 = {
  4512578: { root: { id: '4512578', processDefinitionName: 'MLK_PLP_PT', startTime: '2026-09-09T10:42:13.397+08:00', endTime: '2026-09-15T10:21:19.859+08:00', deleteReason: 'End Flowable - Tue Sep 15 10:21:19 MYT 2026' }, tasks: { data: [] }, variables: V({ aliranKerjaId: '10975', urusan: 'PT' }) },
  5105001: { root: { id: '5105001', processDefinitionName: 'MLK_PLP_PT', startTime: '2026-09-15T10:21:19.989+08:00', endTime: '2026-10-19T10:48:32.710+08:00', deleteReason: 'End Flowable - Mon Oct 19 10:48:32 MYT 2026' }, tasks: { data: [] }, variables: V({ aliranKerjaId: '11169', urusan: 'PT' }) },
  7125137: { root: { id: '7125137', processDefinitionName: 'MLK_PLP_PT', startTime: '2026-10-19T10:48:32.757+08:00', endTime: '2026-10-19T11:03:11.429+08:00', deleteReason: 'End Flowable - Mon Oct 19 11:03:11 MYT 2026' }, tasks: { data: [] }, variables: V({ aliranKerjaId: '12148', urusan: 'PT' }) },
  7145043: { root: { id: '7145043', processDefinitionName: 'MLK_PLP_PT', startTime: '2026-10-19T11:03:11.473+08:00', endTime: null, deleteReason: null },
    tasks: { data: [{ id: '7145135', name: '28.1 Penyediaan Maklumbalas Tangguh - PDT', taskDefinitionKey: 'sid-7B4E1C90-2D63-4F18-9A57-3C0E8D2A4F61', startTime: '2026-10-19T11:03:54.820+08:00', endTime: null }] },
    variables: V({ aliranKerjaId: '12149', urusan: 'PT' }) },
};

// ---------- A: offline ----------
let e;
check('A1 parseArgs: id + env', (() => { const a = M.parseArgs(['PTMLK/02/L/PLPS/2026/2', '--env', 'prod']); return a.id === 'PTMLK/02/L/PLPS/2026/2' && a.env === 'prod'; })());
for (const [n, argv] of [['A2 no id', ['--env', 'prod']], ['A3 bad env', ['X/1', '--env', 'uat']], ['A4 quote in id', ["X'; DROP TABLE a;--", '--env', 'prod']], ['A5 unknown option', ['X/1', '--env', 'prod', '--write']], ['A6 two ids', ['A/1', 'B/2', '--env', 'prod']]]) {
  e = null; try { M.parseArgs(argv); } catch (x) { e = x; }
  check(n + ' → refused', !!e, e && e.message);
}
(async () => {
  for (const sql of ['UPDATE x SET a=1', 'DELETE FROM x', 'INSERT INTO x VALUES (1)', 'SELECT 1; DROP TABLE x', '  with t as (select 1) delete from x']) {
    e = null; try { await M.select({ mcp: 'postgres-mlit-pg', schema: 'x' }, sql); } catch (x) { e = x; }
    check('A7 select() refuses «' + sql.slice(0, 28) + '»', e && /read-only/.test(e.message), e && e.message);
  }
  check('A8 parseResult: rows', JSON.stringify(M.parseResult('Database: x\n\nSQL Query:\nSELECT 1\n\nResults (2 rows):\na\tb\n1\t2\n3\t4')) === '[{"a":"1","b":"2"},{"a":"3","b":"4"}]');
  check('A9 parseResult: 0 rows → []', M.parseResult('Results (0 rows):\na\tb').length === 0);
  check('A10 parseResult: "N rows shown, more available" header', M.parseResult('Results (100 rows shown, more available - use offset=100):\na\n1').length === 1);

  const L = M.links('prod', ['25188131']);
  check('A11 PROD Alter page = the verified URL', L.alter.url === 'https://etanah-app.melaka.gov.my/etanah-pelupusan/protected/internal/InitiateBPMFlowableForm.xhtml' && /^VERIFIED/.test(L.alter.status), L.alter.url);
  check('A12 PROD admin link', L.admin[0].url === 'https://etanah-app.melaka.gov.my/flowable-ui/admin/#/process-instance/25188131');
  check('A13 MLIT + STG hosts are marked UNVERIFIED, PROD is not', /^UNVERIFIED/.test(M.links('mlit', []).alter.status) && /^UNVERIFIED/.test(M.links('stg', []).alter.status) && !/^UNVERIFIED/.test(L.alter.status));
  check('A14 MLIT admin link on mlit.melaka.gov.my', M.links('mlit', ['7145043']).admin[0].url === 'https://mlit.melaka.gov.my/flowable-ui/admin/#/process-instance/7145043');

  // warnings (pure): replay #285181
  const app = { urusan_kod: 'PLPS' };
  const P = Object.values(PROD_285181).map(M.fromCapture);
  const aliasPLPS = { 25188052: 'PLPS', 25188131: 'PLPS' };
  let w = M.warnings(app, P, {}, aliasPLPS);
  check('A15 #285181: live task without a tugasan row → WARNING', w.some(x => /^WARNING process 25188131: live task 25188205 "8\.0 Semakan Jabatan Teknikal,Laporan Tanah, Pelan MMK"/.test(x)), w.join('|'));
  check('A16 #285181: penghantaranId PND/ on PLPS → WARNING', w.some(x => /penghantaranId="PND\/02\/L\/2026\/7" on urusan PLPS/.test(x)), w.join('|'));
  check('A17 #285181: the ENDED process 25188052 (same variables) gives no warning', !w.some(x => /25188052/.test(x)));
  check('A18 fromCapture: live task = endTime null only', P[1].liveTasks.length === 1 && P[1].liveTasks[0].id === '25188205' && P[1].liveTasks[0].taskDefinitionKey === 'sid-3E1FF1D8-81A5-4785-872F-56AEE2E965D4');
  w = M.warnings(app, P, { 25188205: { a_tgsn_id: '1', flag_aktif: 'Y' } }, aliasPLPS);
  check('A19 row present + flag Y → the tugasan warning goes, the variable trap stays', w.length === 1 && /penghantaranId/.test(w[0]), w.join('|'));
  w = M.warnings(app, [M.fromCapture({ ...PROD_285181[25188131], variables: V({ urusan: 'UPND' }) })], { 25188205: { a_tgsn_id: '1', flag_aktif: 'Y' } }, { 25188131: 'PLPS' });
  check('A20 variable urusan ≠ aliran urusan → WARNING', w.length === 1 && /variable urusan="UPND" differs from the urusan PLPS/.test(w[0]), w.join('|'));
  w = M.warnings({ urusan_kod: 'PPJ' }, Object.values(PROD_OLD_PPJ).map(M.fromCapture), { 17075247: { a_tgsn_id: '2745378', flag_aktif: 'N' }, 17080024: { a_tgsn_id: '2745440', flag_aktif: 'N' } }, { 14275035: 'PPJ', 17102656: 'UPND' });
  check('A21 old PROD PPJ: a legitimate UPND notis process (PND/ + urusan UPND on a UPND aliran) is NOT a warning', !w.some(x => /^WARNING/.test(x)), w.join('|'));
  check('A22 old PROD PPJ: live task with a flag_aktif=N row → NOTE (2)', w.filter(x => /^NOTE/.test(x)).length === 2, w.join('|'));
  w = M.warnings(app, [M.fromCapture(PROD_285181[25188052])], {}, aliasPLPS);
  check('A23 ended process never warns', w.length === 0);

  // readProcess with an injected getter (the REST paths + paging + auth)
  const seen = [];
  const getter = (resp) => async (rel) => { seen.push(rel); return resp(rel); };
  let r = await M.readProcess(getter(() => ({ status: 401, json: null })), '1');
  check('A24 401 → engine not read, auth flag', r.ok === false && r.auth === true && /401/.test(r.reason));
  r = await M.readProcess(getter(() => ({ status: 404, json: null })), '1');
  check('A25 404 → not found in engine', r.ok === false && /not found/.test(r.reason));
  seen.length = 0;
  r = await M.readProcess(getter(rel => {
    if (rel === 'process-instances/9') return { status: 200, json: { id: '9', processDefinitionName: 'K', endTime: null } };
    if (rel === 'process-instances/9/tasks') return { status: 200, json: { total: 3, data: [{ id: 't1', endTime: 'x' }] } };
    if (rel === 'process-instances/9/tasks?size=3') return { status: 200, json: { total: 3, data: [{ id: 't1', endTime: 'x' }, { id: 't2', endTime: null, name: 'N' }, { id: 't3', endTime: 'x' }] } };
    if (rel === 'process-instances/9/variables') return { status: 200, json: V({ urusan: 'PT' }) };
  }), '9');
  check('A26 paging: total > data → refetch with ?size=total; live task found', r.ok && r.liveTasks.length === 1 && r.liveTasks[0].id === 't2' && seen.includes('process-instances/9/tasks?size=3'), seen.join(','));
  check('A27 REST is only ever GET paths under process-instances/<id>', seen.every(s => /^process-instances\/9(\/tasks|\/variables)?(\?size=\d+)?$/.test(s)), seen.join(','));
  check('A28 source has no write verb to Flowable or the DB', !/\.(post|put|delete|patch)\(|method:\s*'(PUT|DELETE|PATCH)'/i.test(fs.readFileSync(SCRIPT, 'utf8').replace(/method: 'POST',\n\s+headers: \{ Authorization/, '')));

  // ---------- L: live (db-gateway) ----------
  let up = false;
  try { const t = fs.readFileSync(path.join(os.homedir(), '.db-gateway', 'token'), 'utf8').trim(); up = (await fetch('http://127.0.0.1:7411/postgres-mlit-pg/mcp', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'eval', version: '1' } } }) })).ok; } catch (_) { up = false; }
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'alter-links-'));
  const cap = (name, o) => { const f = path.join(TMP, name + '.json'); fs.writeFileSync(f, JSON.stringify(o)); return f; };
  const run = (args) => spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8', timeout: 120000 });

  if (!up) {
    skip('L* live cases', 'db-gateway not reachable on 127.0.0.1:7411');
  } else {
    // L1 MLIT, a permohonan with a live process (found from MLIT umm_aliran_kerja + umm_a_tgsn flag_aktif Y, 2026-10-19)
    let o = run(['PTMLK/01/L/PT/2026/29', '--env', 'mlit', '--engine-json', cap('mlit', MLIT_PT29)]);
    check('L1 MLIT PTMLK/01/L/PT/2026/29: exit 0, aplikasi 3409210, urusan PT, Melaka Tengah', o.status === 0 && /3409210\s+PTMLK\/01\/L\/PT\/2026\/29\s+PT\s/.test(o.stdout) && /Melaka Tengah/.test(o.stdout), o.stderr || o.stdout.slice(0, 400));
    check('L2 MLIT: all four process ids listed with admin links on mlit.melaka.gov.my', ['4512578', '5105001', '7125137', '7145043'].every(p => o.stdout.includes('https://mlit.melaka.gov.my/flowable-ui/admin/#/process-instance/' + p)));
    check('L3 MLIT: Alter page link printed and marked UNVERIFIED', /mlit\.melaka\.gov\.my\/etanah-pelupusan\/protected\/internal\/InitiateBPMFlowableForm\.xhtml\n\s+UNVERIFIED/.test(o.stdout));
    check('L4 MLIT: engine part prints the live task of 7145043 and 3 ENDED processes', /live task 7145135\s+"28\.1 Penyediaan Maklumbalas Tangguh - PDT"/.test(o.stdout) && (o.stdout.match(/ENDED/g) || []).length === 3);
    check('L5 MLIT: live umm_a_tgsn row printed (tgsn_kod column + umm_tgsn_semasa count)', /tgsn_kod/.test(o.stdout) && /umm_tgsn_semasa rows: \d+/.test(o.stdout));

    // L6-L9 PROD #285181
    o = run(['PTMLK/02/L/PLPS/2026/2', '--env', 'prod', '--engine-json', cap('prod', PROD_285181)]);
    check('L6 PROD #285181: aplikasi 3384691, PLPS, Jasin', o.status === 0 && /3384691\s+PTMLK\/02\/L\/PLPS\/2026\/2\s+PLPS\s/.test(o.stdout) && /Jasin/.test(o.stdout), o.stderr || o.stdout.slice(0, 400));
    check('L7 PROD #285181: verified Alter page URL + VERIFIED mark', /https:\/\/etanah-app\.melaka\.gov\.my\/etanah-pelupusan\/protected\/internal\/InitiateBPMFlowableForm\.xhtml\n\s+VERIFIED/.test(o.stdout));
    check('L8 PROD #285181: process 25188131 + live task "8.0 Semakan Jabatan Teknikal,Laporan Tanah, Pelan MMK"', /process 25188131\s.*LIVE/.test(o.stdout) && /live task 25188205\s+"8\.0 Semakan Jabatan Teknikal,Laporan Tanah, Pelan MMK"/.test(o.stdout));
    check('L9 PROD #285181: both WARNINGs (no tugasan row; penghantaranId PND/)', /WARNING process 25188131: live task 25188205/.test(o.stdout) && /WARNING process 25188131: penghantaranId="PND\/02\/L\/2026\/7"/.test(o.stdout), o.stdout.slice(-700));

    // L10-L12 old PROD permohonan (oldest umm_aliran_kerja rows on PROD, 2026-06-18)
    o = run(['0401AUC2026000097', '--env', 'prod', '--engine-json', cap('old', PROD_OLD_PPJ)]);
    check('L10 old PROD 0401AUC2026000097: aplikasi 3152479, PPJ, aliran 3 from 2026-06-18', o.status === 0 && /3152479\s+0401AUC2026000097\s+PPJ/.test(o.stdout) && /\b3\s+14275035\s+SYSTEM\s+2026-06-18/.test(o.stdout), o.stderr || o.stdout.slice(0, 500));
    check('L11 old PROD: no live umm_a_tgsn → "(none)", engine shows both processes LIVE', /\(none\)/.test(o.stdout) && (o.stdout.match(/LIVE/g) || []).length === 2);
    check('L12 old PROD: UPND notis process is not a WARNING; the flag_aktif=N rows are NOTEs', !/\nWARNING|\n\s+WARNING/.test(o.stdout.split('7. Trap check')[1]) && (o.stdout.match(/NOTE process/g) || []).length === 2);

    // L13 headless engine path with no Flowable session in the profile → "engine not read", links + DB stand, exit 0
    o = run(['PTMLK/01/L/PT/2026/29', '--env', 'mlit']);
    check('L13 no engine file: either reads the engine (logged-in profile) or says "engine not read" and still prints links + DB', o.status === 0 && /1\. Aplikasi/.test(o.stdout) && /5\. Flowable admin links/.test(o.stdout) && (/engine not read/.test(o.stdout) || /ENDED|LIVE/.test(o.stdout)), o.stderr || o.stdout.slice(-500));
    o = run(['PTMLK/01/L/PT/2026/29', '--env', 'mlit', '--no-engine']);
    check('L14 --no-engine → "engine not read: --no-engine"', o.status === 0 && /engine not read: --no-engine/.test(o.stdout));
    // L15 unknown id → exit 1, message, no crash
    o = run(['PTMLK/99/Z/NOPE/2000/1', '--env', 'mlit', '--no-engine']);
    check('L15 unknown permohonan id → exit 1 with "No umm_aplikasi row"', o.status === 1 && /No umm_aplikasi row/.test(o.stdout), o.stderr || o.stdout);
    // L16 stg resolves its DB from system/melaka-env-state.json
    const stg = M.dbTarget('stg');
    check('L16 stg target = mcp_server + schema_name of system/melaka-env-state.json', stg.mcp === 'postgres-mlkstg-pg' && /^et_main_stg/.test(stg.schema), JSON.stringify(stg));

    // L17-L18 engine from the engine schema: no login, no browser (mlit et_flowable_mlit, stg et_flowable17)
    o = run(['PTMLK/01/L/PT/2026/29', '--env', 'mlit']);
    check('L17 MLIT without --engine-json: engine read from SQL et_flowable_mlit, 3 ENDED processes with their deleteReason', /source: SQL postgres-mlit-pg et_flowable_mlit/.test(o.stdout) && (o.stdout.match(/ENDED/g) || []).length >= 3 && /deleteReason: End Flowable/.test(o.stdout), o.stderr || o.stdout.slice(-600));
    o = run(['PTMLK/02/L/PT/2026/32', '--env', 'stg']);
    check('L18 STG: engine read from SQL et_flowable17, process 10465085 present', /source: SQL postgres-mlkstg-pg et_flowable17/.test(o.stdout) && /process 10465085\s+MLK_PLP_PT/.test(o.stdout), o.stderr || o.stdout.slice(-600));
    // L19 PROD has no SQL engine path (et_read lacks USAGE on its engine schema): it goes to the browser session
    o = run(['PTMLK/02/L/PLPS/2026/2', '--env', 'prod', '--profile', path.join(TMP, 'empty-profile')]);
    check('L19 PROD without a saved session: says "engine not read" with the --login command, links + DB stand', o.status === 0 && /source: Flowable admin REST through a Flowable login/.test(o.stdout) && /engine not read/.test(o.stdout) && /--login/.test(o.stdout) && /3384691/.test(o.stdout), o.stderr || o.stdout.slice(-500));

    // L20-L21 the headless browser path against a local stand-in for the Flowable admin REST that wants a session cookie
    const http = require('http');
    const EVAL_PW = 'pw-' + require('crypto').randomBytes(9).toString('hex');   // throwaway test password for the local stand-in only
    const procOf = id => ({ id, processDefinitionName: 'MLK_PLP_MOCK', startTime: '2026-10-19T09:00:00.000+08:00', endTime: null, deleteReason: null });
    const srv = http.createServer((q, r) => {
      if (q.method === 'POST' && q.url === '/flowable-ui/app/authentication') {
        let body = ''; q.on('data', d => { body += d; });
        return q.on('end', () => { const f = new URLSearchParams(body); if (f.get('j_username') === 'eval-user' && f.get('j_password') === EVAL_PW) { r.setHeader('Set-Cookie', 'sess=ok; Path=/; HttpOnly'); r.end('{}'); } else { r.statusCode = 401; r.end(); } });
      }
      if (q.url.startsWith('/flowable-ui/idm/')) return r.end('<html><body><form id="login-form"><input type="text" id="username"><input type="password" id="password"><button type="submit">Login</button></form>' +
        '<script>document.getElementById("login-form").addEventListener("submit",function(e){e.preventDefault();fetch("/flowable-ui/app/authentication",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({j_username:document.getElementById("username").value,j_password:document.getElementById("password").value})});});</script></body></html>');
      const ok = /(^|;\s*)sess=ok(;|$)/.test(q.headers.cookie || '');
      const m = q.url.match(/process-instances\/(\d+)(\/tasks|\/variables)?/);
      if (/^\/flowable-ui\/admin\/?$/.test(q.url)) { r.setHeader('Set-Cookie', 'sess=ok; Path=/; HttpOnly'); return r.end('<html>logged in</html>'); }   // the stand-in "login page": opening it logs in
      if (!ok) { r.statusCode = 401; return r.end(); }
      r.setHeader('Content-Type', 'application/json');
      if (!m) return r.end('{"data":[]}');   // the list endpoint the session probe uses
      if (!m[2]) return r.end(JSON.stringify(procOf(m[1])));
      if (m[2] === '/tasks') return r.end(JSON.stringify({ total: 1, data: [{ id: 'T' + m[1], name: 'Mock live task', taskDefinitionKey: 'sid-MOCK', startTime: 'x', endTime: null }] }));
      return r.end(JSON.stringify({ total: 1, data: [{ variable: { name: 'urusan', value: 'PT' } }] }));
    });
    await new Promise(res => srv.listen(0, '127.0.0.1', res));
    const env2 = { ...process.env, ALTER_LINKS_FLOWABLE_BASE: 'http://127.0.0.1:' + srv.address().port };
    // async spawn: the stand-in server lives in this process, a blocking spawnSync would starve it
    const run2 = (args) => new Promise(res => {
      const c = require('child_process').spawn('node', [SCRIPT, ...args], { env: env2 });
      let out = '', err = ''; c.stdout.on('data', d => { out += d; }); c.stderr.on('data', d => { err += d; });
      c.on('close', code => res({ status: code, stdout: out, stderr: err }));
    });
    const prof = path.join(TMP, 'prof'); fs.mkdirSync(prof, { recursive: true });
    o = await run2(['PTMLK/01/L/PT/2026/29', '--env', 'mlit', '--browser', '--profile', prof]);
    check('L20 browser path, no saved session → 401 → "engine not read" + --login hint', /engine not read: Flowable admin answered 401/.test(o.stdout) && /--login/.test(o.stdout), o.stderr || o.stdout.slice(-400));
    fs.writeFileSync(path.join(prof, 'alter-links-state.json'), JSON.stringify({ cookies: [{ name: 'sess', value: 'ok', domain: '127.0.0.1', path: '/', expires: -1, httpOnly: true, secure: false, sameSite: 'Lax' }], origins: [] }));
    o = await run2(['PTMLK/01/L/PT/2026/29', '--env', 'mlit', '--browser', '--profile', prof]);
    check('L21 browser path with the saved SESSION cookie restored → all 4 processes read over REST (headless, no window)', (o.stdout.match(/\n\s+live task T\d+\s+"Mock live task"/g) || []).length === 4 && !/engine not read/.test(o.stdout), o.stderr || o.stdout.slice(-600));
    // L22 --wait-login: no saved session → the admin page is opened, the login happens there, the same run reads the engine and saves the session
    const prof2 = path.join(TMP, 'prof2');
    env2.ALTER_LINKS_TEST_HEADLESS = '1';
    o = await run2(['PTMLK/01/L/PT/2026/29', '--env', 'mlit', '--wait-login', '30', '--profile', prof2]);
    check('L22 --wait-login: waits for the login, says so, then reads all 4 processes in the same run', /Log in to the Flowable admin/.test(o.stdout) && /login received, continuing/.test(o.stdout) && (o.stdout.match(/\n\s+live task T\d+\s+"Mock live task"/g) || []).length === 4, o.stderr || o.stdout.slice(-600));
    check('L23 --wait-login saved the session: a second run without the flag reads the engine straight away', fs.existsSync(path.join(prof2, 'alter-links-state.json')) && (o = await run2(['PTMLK/01/L/PT/2026/29', '--env', 'mlit', '--browser', '--profile', prof2]), (o.stdout.match(/\n\s+live task T\d+\s+"Mock live task"/g) || []).length === 4 && !/Log in to the Flowable/.test(o.stdout)), o.stderr || o.stdout.slice(-400));
    // L24-L26 stored credential (DPAPI): save, headless login on the stand-in, read; wrong password; password never printed
    const credOK = path.join(TMP, 'cred-ok.json'), credBad = path.join(TMP, 'cred-bad.json');
    M.saveCredential(['mlit'], 'eval-user', EVAL_PW, credOK);
    M.saveCredential(['mlit'], 'eval-user', EVAL_PW + 'x', credBad);
    check('L24 DPAPI round trip: file holds no plain password, loadCredential decrypts it', !fs.readFileSync(credOK, 'utf8').includes(EVAL_PW) && M.loadCredential('mlit', credOK).password === EVAL_PW);
    const nasty = 'p@ss w0rd!$x "q" ' + String.fromCharCode(233, 252, 241) + ' \ ` %PATH% ;|&<>';
    M.saveCredential(['mlit'], 'eval-user', nasty, path.join(TMP, 'cred-nasty.json'));
    check('L24b DPAPI round trip keeps a password with quotes, backslash, backtick, percent, shell characters and accents exact', M.loadCredential('mlit', path.join(TMP, 'cred-nasty.json')).password === nasty);
    env2.ALTER_LINKS_CRED_FILE = credOK;
    o = await run2(['PTMLK/01/L/PT/2026/29', '--env', 'mlit', '--browser', '--profile', path.join(TMP, 'prof3')]);
    check('L25 stored credential: headless login on the stand-in, all 4 processes read, no window, no prompt', /logging in headless with the stored credential/.test(o.stdout) && (o.stdout.match(/\n\s+live task T\d+\s+"Mock live task"/g) || []).length === 4 && !/engine not read/.test(o.stdout), o.stderr || o.stdout.slice(-500));
    check('L26 the password never appears in stdout or stderr', !(o.stdout + o.stderr).includes(EVAL_PW));
    env2.ALTER_LINKS_CRED_FILE = credBad;
    o = await run2(['PTMLK/01/L/PT/2026/29', '--env', 'mlit', '--browser', '--profile', path.join(TMP, 'prof4')]);
    check('L27 wrong stored password → "engine not read: Flowable login refused", links + DB stand, password not printed', /engine not read: Flowable login refused/.test(o.stdout) && /1. Aplikasi/.test(o.stdout) && !(o.stdout + o.stderr).includes(EVAL_PW), o.stderr || o.stdout.slice(-400));
    srv.close();
  }
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}

  let failed = 0;
  for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? (x.skipped ? 'SKIP  ' : 'PASS  ') : 'FAIL  ') + x.n + (x.pass ? (x.skipped ? '  (' + x.d + ')' : '') : '  → ' + x.d)); }
  console.log('\nalter-links.eval: ' + (results.length - failed) + '/' + results.length + ' green');
  process.exit(failed ? 1 : 0);
})();
