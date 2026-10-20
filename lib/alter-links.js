#!/usr/bin/env node
/*
 * alter-links.js — one command before an Alter ticket: the permohonan's DB state, the Alter page link,
 * the Flowable admin links, the live engine tasks, and the Initiate/Alter-with-Reset=No trap check.
 * READ-ONLY. Every SQL statement is a SELECT (the runner refuses anything else). Nothing is POSTed, PUT or
 * DELETEd to Flowable; the Alter page is never opened or clicked.
 *
 *   node lib/alter-links.js <permohonan id> --env prod|mlit|stg [--engine-json <file>] [--no-engine]
 *                           [--profile <dir>] [--login]
 *   node lib/alter-links.js PTMLK/02/L/PLPS/2026/2 --env prod
 *
 * Prints, for the permohonan:
 *   1. aplikasi_id, urusan, pejabat                         (umm_aplikasi by id_pengenalan)
 *   2. every umm_aliran_kerja row                           (id, process_instance_id, created_by, created_date)
 *   3. live tugasan: umm_a_tgsn flag_aktif='Y' + ind_tgsn kod, and the umm_tgsn_semasa row count
 *   4. the Pelupusan Flowable Alter Page link for the env   (VERIFIED / UNVERIFIED stated per host)
 *   5. the Flowable admin link of each process_instance_id
 *   6. the engine, when readable: process end/deleteReason, live tasks, variables; WARNING lines for
 *      - a live task with no umm_a_tgsn row carrying that id_bpm_task
 *      - a task whose umm_a_tgsn row exists but is not flag_aktif=Y gives a NOTE, not a warning
 *      - penghantaranId "PND/..." on a non-UPND urusan, or variable urusan != the urusan kod of the process's own
 *        umm_aliran_kerja row (= the app's urusan for a main process; a UPND notis process legitimately runs as UPND)
 *        (the FLOWABLE-KNOWLEDGE.md §19 trap: the callback switches to UPND, the tugasan row is never written)
 *
 * How it reaches things (nothing new built):
 *   DB     the db-gateway at 127.0.0.1:7411 (MCP over HTTP, token in %USERPROFILE%\.db-gateway\token), the same
 *          servers the mcp__postgres-*__query_database tools use. Servers + schemas come from lib/states.js
 *          (stg: system/melaka-env-state.json).
 *   Engine (first match wins):
 *          a) --engine-json <file>: a REST capture taken in an already logged-in browser, shape
 *             {root, tasks, variables} (one process) or {"<processId>": {root,tasks,variables}, ...}.
 *          b) mlit / stg: SELECT on the engine schema (et_flowable_mlit / et_flowable17) through the same gateway.
 *             Live, headless, no login, no approval.
 *          c) prod (its engine schema has no grant for et_read, and none is to be requested) or --browser: Flowable admin REST through headless
 *             Playwright on the saved browser profile E:\Dev\scripts\FlowableAlter\profiles\melaka-<env> (override
 *             --profile). The Flowable admin login is separate from CAS. Log in once with --login (a window opens, you
 *             log in, the script never holds a password); the cookies are saved to alter-links-state.json in the profile
 *             because Chromium drops session cookies when a Playwright profile closes. No session, a busy profile or no
 *             Playwright prints "engine not read" + the reason.
 *          --wait-login [seconds]: when the saved session is missing or expired, open the Flowable admin login in a
 *          visible Edge window, wait for YOU to log in there (default 600 s), then read the engine in the same run.
 *   Either way the links and the DB part are always printed.
 *
 * Eval: node lib/alter-links.eval.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const states = require(path.join(__dirname, 'states.js'));

const GATEWAY = 'http://127.0.0.1:7411';
const ALTER_PAGE = '/etanah-pelupusan/protected/internal/InitiateBPMFlowableForm.xhtml';
const REST = '/flowable-ui/admin-app/rest/admin/';
// host table: `page` states what was actually seen when the Alter page was opened (title "Pelupusan Flowable Alter Page")
const HOSTS = {
  prod: { base: 'https://etanah-app.melaka.gov.my', flowableSchema: null, page: 'VERIFIED 2026-10-19 (page title "Pelupusan Flowable Alter Page", per ticket #285181)', admin: 'VERIFIED (admin opened in a logged-in session 2026-10-19)' },
  mlit: { base: 'https://mlit.melaka.gov.my', flowableSchema: 'et_flowable_mlit', page: 'UNVERIFIED (host answers; /etanah-pelupusan/ is live and /protected/ redirects to CAS login; page not opened: no login)', admin: 'UNVERIFIED (/flowable-ui/admin/ answers 401 without a session; not opened)' },
  stg: { base: 'https://etanah-appstg.melaka.gov.my', flowableSchema: 'et_flowable17', page: 'UNVERIFIED (host answers and /protected/ redirects to CAS login; nodes http://172.30.12.176|177|178:8080 redirect to this host; page not opened: no login)', admin: 'UNVERIFIED (/flowable-ui/admin/ answers 401 without a session; not opened)' },
};

// ---------- args ----------
function parseArgs(argv) {
  const a = { id: null, env: null, engineJson: null, noEngine: false, snippet: false, setupLogin: false, browser: false, waitLogin: 0, profile: null, login: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--env') a.env = argv[++i];
    else if (t === '--engine-json') a.engineJson = argv[++i];
    else if (t === '--no-engine') a.noEngine = true;
    else if (t === '--browser') a.browser = true;
    else if (t === '--engine-snippet') a.snippet = true;
    else if (t === '--setup-login') a.setupLogin = true;
    else if (t === '--wait-login') { a.waitLogin = /^\d+$/.test(argv[i + 1] || '') ? Number(argv[++i]) : 600; a.browser = true; }
    else if (t === '--profile') a.profile = argv[++i];
    else if (t === '--login') a.login = true;
    else if (t.startsWith('--')) throw new Error('unknown option ' + t);
    else if (!a.id) a.id = t;
    else throw new Error('unexpected argument ' + t);
  }
  if (!a.id && a.setupLogin) { if (!a.env) a.env = 'prod'; return a; }
  if (!a.id) throw new Error('usage: node lib/alter-links.js <permohonan id> --env prod|mlit|stg');
  if (!HOSTS[a.env] && !(a.setupLogin && a.env === 'all')) throw new Error('--env must be prod, mlit or stg');
  if (!/^[A-Za-z0-9/_\- ]{3,60}$/.test(a.id)) throw new Error('permohonan id has characters that are not allowed: ' + a.id);
  return a;
}

// ---------- DB through the gateway (SELECT only) ----------
function dbTarget(env) {
  const rec = states.get('melaka');
  if (env === 'stg') {
    const s = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'system', 'melaka-env-state.json'), 'utf8'));
    return { mcp: s.mcp_server, schema: s.schema_name };
  }
  return { mcp: rec.db.mcp[env], schema: rec.db.schemas[env] };
}

function gatewayToken() {
  return fs.readFileSync(path.join(os.homedir(), '.db-gateway', 'token'), 'utf8').trim();
}

function parseResult(text) {
  const m = text.match(/Results \([^)]*\):?\n/);
  if (!m) throw new Error('unreadable DB result: ' + text.slice(0, 200));
  const lines = text.slice(m.index + m[0].length).split('\n').filter(l => l.length);
  const head = lines.shift().split('\t');
  return lines.map(l => { const c = l.split('\t'); const o = {}; head.forEach((h, i) => { o[h] = c[i] === undefined ? null : c[i]; }); return o; });
}

async function select(target, sql) {
  if (!/^\s*SELECT\b/i.test(sql) || /;\s*\S/.test(sql)) throw new Error('alter-links is read-only: refusing non-SELECT SQL');
  const res = await fetch(`${GATEWAY}/${target.mcp}/mcp`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + gatewayToken(), 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'query_database', arguments: { query: sql, limit: 1000 } } }),
  });
  const j = await res.json();
  if (j.error || !j.result || j.result.isError) throw new Error('DB error: ' + JSON.stringify(j.error || j.result).slice(0, 400));
  return parseResult(j.result.content[0].text);
}

async function readDb(target, id) {
  const S = target.schema;
  const q = id.replace(/'/g, "''");
  const apps = await select(target,
    `SELECT a.aplikasi_id, a.id_pengenalan, ` +
    `(SELECT u.kod FROM ${S}.ind_ursn u WHERE u.ursn_id = a.ursn_id) AS urusan_kod, ` +
    `(SELECT u.nama FROM ${S}.ind_ursn u WHERE u.ursn_id = a.ursn_id) AS urusan_nama, ` +
    `a.pejabat_id, (SELECT p.nama FROM ${S}.ind_pejabat p WHERE p.pejabat_id = a.pejabat_id) AS pejabat ` +
    `FROM ${S}.umm_aplikasi a WHERE a.id_pengenalan = '${q}'`);
  const out = { apps, aliran: [], tgsn: [], semasa: null };
  if (!apps.length) return out;
  const apl = apps[0].aplikasi_id;
  if (!/^\d+$/.test(apl)) throw new Error('unexpected aplikasi_id ' + apl);
  out.aliran = await select(target,
    `SELECT k.aliran_kerja_id, k.process_instance_id, k.created_by, k.created_date, ` +
    `(SELECT u.kod FROM ${S}.ind_ursn u WHERE u.ursn_id = k.ursn_id) AS urusan_kod ` +
    `FROM ${S}.umm_aliran_kerja k WHERE k.aplikasi_id = ${apl} ORDER BY k.aliran_kerja_id`);
  out.tgsn = await select(target,
    `SELECT t.a_tgsn_id, t.aliran_kerja_id, (SELECT g.kod FROM ${S}.ind_tgsn g WHERE g.tgsn_id = t.tgsn_id) AS tgsn_kod, ` +
    `t.peranan_semasa, t.status_tugasan, t.id_bpm_task, t.created_date ` +
    `FROM ${S}.umm_a_tgsn t WHERE t.aplikasi_id = ${apl} AND t.flag_aktif = 'Y' ORDER BY t.a_tgsn_id`);
  const c = await select(target, `SELECT count(*) AS n FROM ${S}.umm_tgsn_semasa WHERE aplikasi_id = ${apl}`);
  out.semasa = Number(c[0].n);
  return out;
}

// the engine task ids that have (or lack) an umm_a_tgsn row, any flag_aktif
async function tgsnRowsForTasks(target, aplikasiId, taskIds) {
  const ids = taskIds.filter(t => /^[A-Za-z0-9-]+$/.test(t));
  if (!ids.length) return [];
  return select(target,
    `SELECT a_tgsn_id, id_bpm_task, flag_aktif, status_tugasan FROM ${target.schema}.umm_a_tgsn ` +
    `WHERE aplikasi_id = ${aplikasiId} AND id_bpm_task IN (${ids.map(t => `'${t}'`).join(',')})`);
}

// ---------- links ----------
function links(env, processIds) {
  const h = HOSTS[env];
  return {
    alter: { url: h.base + ALTER_PAGE, status: h.page },
    admin: processIds.map(pid => ({ pid, url: `${h.base}/flowable-ui/admin/#/process-instance/${pid}` })),
    adminStatus: h.admin,
  };
}

// ---------- engine ----------
function varMap(variables) {
  const arr = Array.isArray(variables) ? variables : (variables && variables.data) || [];
  const m = {};
  for (const e of arr) { const v = e.variable || e; if (v && v.name !== undefined) m[v.name] = v.value; }
  return m;
}

// getter: async (relPath) => ({status, json}); returns {ok, ...} or {ok:false, reason}
async function readProcess(getter, pid) {
  const base = `process-instances/${pid}`;
  const root = await getter(base);
  if (root.status === 401 || root.status === 403) return { ok: false, auth: true, reason: `Flowable admin answered ${root.status} (no logged-in Flowable session)` };
  if (root.status === 404) return { ok: false, reason: 'process instance not found in the engine' };
  if (root.status !== 200) return { ok: false, reason: `process-instances/${pid} answered ${root.status}` };
  const paged = async rel => {
    let r = await getter(rel);
    if (r.status === 200 && r.json && r.json.total > (r.json.data || []).length) r = await getter(`${rel}?size=${r.json.total}`);
    return r;
  };
  const tasks = await paged(`${base}/tasks`);
  const vars = await paged(`${base}/variables`);
  if (tasks.status !== 200 || vars.status !== 200) return { ok: false, reason: `tasks ${tasks.status} / variables ${vars.status}` };
  return fromCapture({ root: root.json, tasks: tasks.json, variables: vars.json });
}

function fromCapture(c) {
  const all = (c.tasks && c.tasks.data) || [];
  return {
    ok: true,
    id: c.root.id,
    definition: c.root.processDefinitionName || c.root.processDefinitionId || null,
    startTime: c.root.startTime || null,
    endTime: c.root.endTime || null,
    deleteReason: c.root.deleteReason || null,
    liveTasks: all.filter(t => !t.endTime).map(t => ({ id: t.id, name: t.name, taskDefinitionKey: t.taskDefinitionKey, startTime: t.startTime })),
    vars: varMap(c.variables),
  };
}

function engineFromFile(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const by = {};
  if (j.root) by[j.root.id] = j; else Object.assign(by, j);
  return async pid => (by[pid] ? fromCapture(by[pid]) : { ok: false, reason: `process ${pid} is not in ${path.basename(file)}` });
}

// Engine straight from the engine schema (mlit: et_flowable_mlit, stg: et_flowable17): SELECT only, no browser, no
// login. PROD has no grant on its engine schema (et_read lacks USAGE), so PROD uses the browser path.
async function engineFromSql(target, fschema, pids) {
  const F = fschema;
  const list = pids.filter(p => /^\d+$/.test(p)).map(p => `'${p}'`).join(',');
  const none = async pid => ({ ok: false, reason: 'no numeric process id' });
  if (!list) return none;
  const roots = await select(target,
    `SELECT p.id_, (SELECT d.key_ FROM ${F}.act_re_procdef d WHERE d.id_ = p.proc_def_id_) AS def_key, p.start_time_, p.end_time_, p.delete_reason_ ` +
    `FROM ${F}.act_hi_procinst p WHERE p.id_ IN (${list})`);
  const tasks = await select(target, `SELECT id_, proc_inst_id_, name_, task_def_key_, create_time_ FROM ${F}.act_ru_task WHERE proc_inst_id_ IN (${list})`);
  const names = `'penghantaranId','urusan','aliranKerjaId'`;
  const live = await select(target, `SELECT proc_inst_id_, name_, text_ FROM ${F}.act_ru_variable WHERE proc_inst_id_ IN (${list}) AND task_id_ IS NULL AND name_ IN (${names})`);
  const hist = await select(target, `SELECT proc_inst_id_, name_, text_ FROM ${F}.act_hi_varinst WHERE proc_inst_id_ IN (${list}) AND task_id_ IS NULL AND name_ IN (${names})`);
  const by = {};
  for (const r of roots) {
    by[r.id_] = {
      root: { id: r.id_, processDefinitionName: r.def_key, startTime: r.start_time_, endTime: r.end_time_ || null, deleteReason: r.delete_reason_ || null },
      tasks: { data: tasks.filter(t => t.proc_inst_id_ === r.id_).map(t => ({ id: t.id_, name: t.name_, taskDefinitionKey: t.task_def_key_, startTime: t.create_time_, endTime: null })) },
      variables: { data: [] },
    };
    const seen = {};
    for (const v of [...live, ...hist]) {   // runtime value wins over history
      if (v.proc_inst_id_ !== r.id_ || seen[v.name_]) continue;
      seen[v.name_] = true; by[r.id_].variables.data.push({ variable: { name: v.name_, value: v.text_ } });
    }
  }
  return async pid => (by[pid] ? fromCapture(by[pid]) : { ok: false, reason: `process ${pid} is not in ${F}.act_hi_procinst` });
}

function loadPlaywright() {
  for (const t of ['playwright', 'E:/Dev/scripts/FlowableAlter/node_modules/playwright', 'E:/Dev/scripts/attendance/node_modules/playwright']) {
    try { return require(t); } catch (_) { /* next */ }
  }
  return null;
}

// ALTER_LINKS_FLOWABLE_BASE points the REST reads at another host (the eval uses a local test server)
function flowableBase(env) { return process.env.ALTER_LINKS_FLOWABLE_BASE || HOSTS[env].base; }

function defaultProfile(env) { return path.join('E:', 'Dev', 'scripts', 'FlowableAlter', 'profiles', 'melaka-' + env); }

// Chromium drops SESSION cookies when a Playwright profile closes; --login also saves them here and every
// headless start puts them back (verified with a local test server: profile alone keeps only the persistent one).
const stateFile = profile => path.join(profile, 'alter-links-state.json');

async function openBrowser(env, profile, headless) {
  const pw = loadPlaywright();
  if (!pw) throw new Error('Playwright not found (install it in E:\\Dev\\scripts\\FlowableAlter)');
  fs.mkdirSync(profile, { recursive: true });
  const opts = { headless, ignoreHTTPSErrors: true, viewport: { width: 1300, height: 850 } };
  let ctx;
  try { ctx = await pw.chromium.launchPersistentContext(profile, { ...opts, channel: 'msedge' }); }
  catch (e) {
    if (/already in use|ProcessSingleton|lock|being used/i.test(e.message)) throw new Error('browser profile is busy (close the window that uses ' + profile + ')');
    ctx = await pw.chromium.launchPersistentContext(profile, opts);
  }
  try { if (fs.existsSync(stateFile(profile))) await ctx.addCookies(JSON.parse(fs.readFileSync(stateFile(profile), 'utf8')).cookies || []); } catch (_) { /* no saved session */ }
  return ctx;
}

const adminProbe = (ctx, env) => ctx.request.get(flowableBase(env) + '/flowable-ui/admin-app/rest/admin/process-instances?size=1', { timeout: 20000 }).then(r => r.status(), () => 0);

// Opens the Flowable admin in a visible window and waits for YOU to log in there (the script never types a password),
// then saves the session cookies. Returns true when the admin REST answered 200 before the deadline.
async function waitForLogin(ctx, env, profile, seconds) {
  const page = ctx.pages()[0] || await ctx.newPage();
  console.log(`  >> Log in to the Flowable admin in the Edge window that just opened (${env.toUpperCase()}). Waiting up to ${seconds} s...`);
  await page.goto(flowableBase(env) + '/flowable-ui/admin/', { waitUntil: 'domcontentloaded' }).catch(() => {});
  const deadline = Date.now() + seconds * 1000;
  let last = 0;
  while (Date.now() < deadline) {
    await page.waitForTimeout(2000);
    last = await adminProbe(ctx, env);
    if (last === 200) { fs.writeFileSync(stateFile(profile), JSON.stringify(await ctx.storageState())); return true; }
  }
  // tell "nobody logged in" apart from "logged in but the REST still refuses"
  console.log(`  last REST probe answered ${last}; the window ended on ${await page.evaluate(() => location.href).catch(() => '(window closed)')}`);
  return false;
}

async function login(env, profile) {
  const ctx = await openBrowser(env, profile, false);
  const ok = await waitForLogin(ctx, env, profile, 300);
  await ctx.close();
  console.log(ok ? 'Flowable session saved in ' + profile : 'Login not finished in time.');
  return ok;
}

// ---------- stored Flowable login (DPAPI, the PymTime pattern) ----------
// The password is typed ONCE by you into a hidden prompt (--setup-login, in a terminal you open), encrypted with Windows
// DPAPI (tied to your Windows account) and kept in %USERPROFILE%\.alter-links\flowable-cred.json. Every later run decrypts it
// in memory, fills the Flowable IDM login form in a headless Edge and reads the REST. It is never printed, logged or passed to Claude.
const CRED_FILE = process.env.ALTER_LINKS_CRED_FILE || path.join(os.homedir(), '.alter-links', 'flowable-cred.json');

// the secret travels in a child-only environment variable, never on a command line, never printed
function powershell(script, secret) {
  // Windows PowerShell 5.1 by its absolute path, and WITHOUT the caller's PSModulePath: when the script is started from a
  // PowerShell 7 terminal, 7's module folders would be inherited and 5.1 fails to load Microsoft.PowerShell.Security.
  const env = { ...process.env, ALTER_LINKS_SECRET: secret };
  for (const k of Object.keys(env)) if (k.toLowerCase() === 'psmodulepath') delete env[k];
  const exe = path.join(process.env.SystemRoot || 'C:\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const r = require('child_process').spawnSync(fs.existsSync(exe) ? exe : 'powershell', ['-NoProfile', '-NonInteractive', '-Command', script],
    { encoding: 'utf8', timeout: 60000, windowsHide: true, env });
  if (r.status !== 0) {
    const why = r.error ? r.error.message : `exit ${r.status}, ${String(r.stderr || '').split('\n').find(l => l.trim()) || 'no message'}`;
    throw new Error('Windows DPAPI call failed (' + why.replace(secret, '***').slice(0, 200) + ')');
  }
  return r.stdout.replace(/\r?\n$/, '');
}
// base64 (UTF-8) both ways so no code page or special character can change the password on its way through PowerShell
const b64 = t => Buffer.from(t, 'utf8').toString('base64');
const dpapiEncrypt = pw => powershell('$p=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($env:ALTER_LINKS_SECRET)); ConvertTo-SecureString $p -AsPlainText -Force | ConvertFrom-SecureString', b64(pw));
const dpapiDecrypt = blob => Buffer.from(powershell('$s=ConvertTo-SecureString $env:ALTER_LINKS_SECRET; $p=[Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)); [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($p))', blob), 'base64').toString('utf8');

function saveCredential(envs, user, password, file) {
  file = file || CRED_FILE;
  let all = {}; try { all = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { /* first save */ }
  const blob = dpapiEncrypt(password);
  for (const e of envs) all[e] = { user, blob, saved: new Date().toISOString() };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(all, null, 2));
}

function loadCredential(env, file) {
  try {
    const c = JSON.parse(fs.readFileSync(file || CRED_FILE, 'utf8'))[env];
    return c && c.user && c.blob ? { user: c.user, password: dpapiDecrypt(c.blob) } : null;
  } catch (_) { return null; }
}

const hasCredential = (env, file) => { try { return !!JSON.parse(fs.readFileSync(file || CRED_FILE, 'utf8'))[env]; } catch (_) { return false; } };

function ask(q, hidden) {
  return new Promise(res => {
    const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = s => { if (s.includes(q)) process.stdout.write(s); };
    rl.question(q, a => { rl.close(); if (hidden) process.stdout.write('\n'); res(a); });
  });
}

async function setupLogin(env) {
  const envs = env === 'all' ? Object.keys(HOSTS) : [env];
  console.log(`Flowable admin login for: ${envs.join(', ')}. Typed here once, stored with Windows DPAPI, never shown again.`);
  const user = (await ask('Flowable username: ', false)).trim();
  const pw = await ask('Flowable password (hidden): ', true);
  if (!user || !pw) throw new Error('username and password are both required');
  saveCredential(envs, user, pw);
  console.log(`Saved for ${envs.join(', ')} in ${CRED_FILE}. Now run: node lib/alter-links.js <permohonan id> --env ${envs[0]}`);
}

// headless Edge, fill the Flowable IDM login form, wait until the admin REST answers 200. Returns the context.
async function loginWithCredential(env, cred) {
  const pw = loadPlaywright();
  if (!pw) throw new Error('Playwright not found (install it in E:\Dev\scripts\FlowableAlter)');
  let browser;
  try { browser = await pw.chromium.launch({ channel: 'msedge', headless: true }); } catch (_) { browser = await pw.chromium.launch({ headless: true }); }
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const page = await ctx.newPage();
    await page.goto(flowableBase(env) + '/flowable-ui/idm/#/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.locator('#username').fill(cred.user, { timeout: 30000 });
    await page.locator('#password').fill(cred.password, { timeout: 30000 });
    await page.locator('#login-form button[type=submit]').click({ timeout: 30000 });
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      await page.waitForTimeout(1000);
      if (await adminProbe(ctx, env) === 200) return ctx;
    }
    throw new Error('Flowable login refused or not finished in 30 s (wrong stored password? run --setup-login again)');
  } catch (e) { await browser.close().catch(() => {}); throw e; }
}

// ---------- analysis (pure) ----------
// The urusan a process is expected to run as = the urusan of its own umm_aliran_kerja row (aliranUrusan[pid]);
// a UPND notis process of a PLPS app legitimately runs as UPND, so the app's urusan is only the fallback.
function warnings(app, procs, tgsnByTask, aliranUrusan) {
  const w = [];
  for (const p of procs) {
    if (!p.ok || p.endTime) continue;
    const expected = (aliranUrusan && aliranUrusan[p.id]) || app.urusan_kod;
    for (const t of p.liveTasks) {
      const row = tgsnByTask[t.id];
      if (!row) w.push(`WARNING process ${p.id}: live task ${t.id} "${t.name}" has no umm_a_tgsn row with that id_bpm_task (no tugasan written)`);
      else if (row.flag_aktif !== 'Y') w.push(`NOTE process ${p.id}: live task ${t.id} "${t.name}" has umm_a_tgsn row ${row.a_tgsn_id} but flag_aktif=${row.flag_aktif} (engine task live, tugasan not active)`);
    }
    const pg = p.vars.penghantaranId;
    if (typeof pg === 'string' && pg.startsWith('PND/') && expected !== 'UPND') {
      w.push(`WARNING process ${p.id}: penghantaranId="${pg}" on urusan ${expected} (FLOWABLE-KNOWLEDGE.md §19: the tugasan callback switches to UPND and the tugasan row is never written)`);
    }
    if (p.vars.urusan !== undefined && p.vars.urusan !== expected) {
      w.push(`WARNING process ${p.id}: variable urusan="${p.vars.urusan}" differs from the urusan ${expected} of its aliran row (§19 trap)`);
    }
  }
  return w;
}

// ---------- printing ----------
function table(rows, cols) {
  if (!rows.length) return '  (none)';
  const w = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] == null ? '' : r[c]).length)));
  const line = r => '  ' + cols.map((c, i) => String(r[c] == null ? '' : r[c]).padEnd(w[i])).join('  ').trimEnd();
  return [line(Object.fromEntries(cols.map(c => [c, c]))), '  ' + w.map(n => '-'.repeat(n)).join('  '), ...rows.map(line)].join('\n');
}

// One JS expression for a logged-in Flowable admin tab (Claude in Chrome / DevTools console): same-origin GETs only,
// returns compact JSON in the --engine-json shape. Ended processes keep root + variables, live ones add their live tasks.
function engineSnippet(pids) {
  return `await (async()=>{const keep=['penghantaranId','urusan','aliranKerjaId'],B='/flowable-ui/admin-app/rest/admin/process-instances/',out={};` +
    `for(const pid of ${JSON.stringify(pids)}){const g=async s=>{let r=await fetch(B+pid+s,{credentials:'include'});if(r.status!==200)return null;let j=await r.json();` +
    `if(j.total>(j.data||[]).length){r=await fetch(B+pid+s+'?size='+j.total,{credentials:'include'});j=await r.json()}return j};` +
    `const r=await g('');if(!r){out[pid]={root:{id:pid},missing:true};continue}const t=await g('/tasks'),v=await g('/variables');` +
    `out[pid]={root:{id:r.id,processDefinitionName:r.processDefinitionName,startTime:r.startTime,endTime:r.endTime,deleteReason:r.deleteReason},` +
    `tasks:{data:((t&&t.data)||[]).filter(x=>!x.endTime).map(x=>({id:x.id,name:x.name,taskDefinitionKey:x.taskDefinitionKey,startTime:x.startTime,endTime:null}))},` +
    `variables:{data:((v&&v.data)||[]).filter(e=>keep.includes(e.variable.name)).map(e=>({variable:{name:e.variable.name,value:e.variable.value}}))}}}` +
    `return JSON.stringify(out)})()`;
}

async function main(argv) {
  const a = parseArgs(argv);
  const profile = a.profile || process.env.ALTER_LINKS_PROFILE || defaultProfile(a.env);
  if (a.setupLogin) { await setupLogin(a.env); return; }
  if (a.login) { process.exitCode = (await login(a.env, profile)) ? 0 : 1; return; }
  const target = dbTarget(a.env);
  console.log(`alter-links · ${a.id} · env ${a.env} · DB ${target.mcp} (${target.schema}) · read-only`);

  const db = await readDb(target, a.id);
  console.log('\n1. Aplikasi');
  console.log(table(db.apps, ['aplikasi_id', 'id_pengenalan', 'urusan_kod', 'urusan_nama', 'pejabat_id', 'pejabat']));
  if (!db.apps.length) { console.log(`\nNo umm_aplikasi row with id_pengenalan "${a.id}" in ${target.schema}. Stopped.`); process.exitCode = 1; return; }
  if (db.apps.length > 1) console.log('  NOTE: more than one aplikasi matches; the rest of this output uses the first.');
  const app = db.apps[0];

  console.log('\n2. umm_aliran_kerja');
  console.log(table(db.aliran, ['aliran_kerja_id', 'process_instance_id', 'created_by', 'created_date', 'urusan_kod']));

  console.log('\n3. Live tugasan (umm_a_tgsn flag_aktif = Y)');
  console.log(table(db.tgsn, ['a_tgsn_id', 'aliran_kerja_id', 'tgsn_kod', 'peranan_semasa', 'status_tugasan', 'id_bpm_task', 'created_date']));
  console.log(`  umm_tgsn_semasa rows: ${db.semasa}`);

  const pids = [...new Set(db.aliran.map(r => r.process_instance_id).filter(Boolean))];
  const L = links(a.env, pids);
  console.log('\n4. Pelupusan Flowable Alter Page');
  console.log('  ' + L.alter.url + '\n  ' + L.alter.status);
  console.log('\n5. Flowable admin links  [' + L.adminStatus + ']');
  L.admin.forEach(x => console.log(`  ${x.pid}  ${x.url}`));

  if (a.snippet) {
    console.log('\n6. Engine snippet: paste it (the leading await is for the DevTools console / Claude in Chrome REPL) into the logged-in ' + L.admin[0].url.split('/flowable-ui')[0] + ' tab (same-origin GETs only), save the result, re-run with --engine-json <file>');
    console.log(engineSnippet(pids));
    return;
  }
  console.log('\n6. Engine');
  let getProc = null, notRead = null, ctx = null;
  if (a.noEngine) notRead = 'engine not read: --no-engine';
  else if (a.engineJson) { getProc = engineFromFile(a.engineJson); console.log('  source: ' + path.basename(a.engineJson) + ' (REST capture)'); }
  else if (HOSTS[a.env].flowableSchema && !a.browser) {
    try { getProc = await engineFromSql(target, HOSTS[a.env].flowableSchema, pids); console.log(`  source: SQL ${target.mcp} ${HOSTS[a.env].flowableSchema} (live, no login)`); }
    catch (e) { notRead = 'engine not read: ' + e.message; }
  } else {
    console.log('  source: Flowable admin REST through a Flowable login (stored credential, saved session or login window)');
    try {
      const visible = !process.env.ALTER_LINKS_TEST_HEADLESS;   // the eval logs in on a local stand-in without a window
      const stored = hasCredential(a.env) ? loadCredential(a.env) : null;
      if (stored) { console.log('  (logging in headless with the stored credential)'); ctx = await loginWithCredential(a.env, stored); }
      else ctx = await openBrowser(a.env, profile, true);
      if (!stored && a.waitLogin && await adminProbe(ctx, a.env) === 401) {
        await ctx.close();
        ctx = await openBrowser(a.env, profile, !visible);
        if (!(await waitForLogin(ctx, a.env, profile, a.waitLogin))) throw new Error(`no Flowable login within ${a.waitLogin} s`);
        console.log('  login received, continuing');
      }
      const base = flowableBase(a.env) + '/flowable-ui/admin-app/rest/admin/';
      getProc = async pid => readProcess(async rel => {
        const r = await ctx.request.get(base + rel, { timeout: 30000 });
        let json = null; try { json = await r.json(); } catch (_) { /* not json */ }
        return { status: r.status(), json };
      }, pid);
    } catch (e) { notRead = 'engine not read: ' + e.message; }
  }
  const procs = [];
  if (getProc) {
    for (const pid of pids) {
      let p;
      try { p = await getProc(pid); } catch (e) { p = { ok: false, reason: e.message }; }
      if (p.ok) procs.push(p);
      else {
        console.log(`  process ${pid}: engine not read: ${p.reason}`);
        if (p.auth) { notRead = 'engine not read: ' + p.reason + `. Log in once: node lib/alter-links.js ${a.id} --env ${a.env} --login`; break; }
      }
      if (p.ok) {
        console.log(`  process ${p.id}  ${p.definition}  started ${p.startTime}  ` + (p.endTime ? `ENDED ${p.endTime}  deleteReason: ${p.deleteReason}` : 'LIVE'));
        if (!p.endTime) {
          if (!p.liveTasks.length) console.log('    live tasks: none');
          p.liveTasks.forEach(t => console.log(`    live task ${t.id}  "${t.name}"  ${t.taskDefinitionKey}  started ${t.startTime}`));
        }
        console.log(`    variables: penghantaranId=${p.vars.penghantaranId === undefined ? '(absent)' : p.vars.penghantaranId}  urusan=${p.vars.urusan === undefined ? '(absent)' : p.vars.urusan}  aliranKerjaId=${p.vars.aliranKerjaId === undefined ? '(absent)' : p.vars.aliranKerjaId}`);
      }
    }
  }
  if (ctx) { const b = ctx.browser && ctx.browser(); await ctx.close().catch(() => {}); if (b) await b.close().catch(() => {}); }
  if (notRead) console.log('  ' + notRead + '. Links above and the DB part stand.');

  const tgsnByTask = {};
  const liveIds = procs.filter(p => !p.endTime).flatMap(p => p.liveTasks.map(t => t.id));
  if (liveIds.length) for (const r of await tgsnRowsForTasks(target, app.aplikasi_id, liveIds)) tgsnByTask[r.id_bpm_task] = r;
  const aliranUrusan = Object.fromEntries(db.aliran.map(r => [r.process_instance_id, r.urusan_kod]));
  const ws = warnings(app, procs, tgsnByTask, aliranUrusan);
  console.log('\n7. Trap check');
  if (!procs.length) console.log('  not run (engine not read)');
  else if (!ws.length) console.log('  no warnings on the live processes read');
  else ws.forEach(x => console.log('  ' + x));
}

module.exports = { saveCredential, loadCredential, hasCredential, parseArgs, parseResult, links, varMap, fromCapture, readProcess, warnings, select, dbTarget, HOSTS, ALTER_PAGE };

if (require.main === module) {
  main(process.argv.slice(2)).catch(e => { console.error('alter-links: ' + e.message); process.exit(1); });
}
