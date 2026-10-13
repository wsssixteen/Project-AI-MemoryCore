#!/usr/bin/env node
// quest-start-claim feature eval. Every run talks to a local stub server on 127.0.0.1; the real
// ticket server is never called by the script under test. Exit 0 = all pass.
// Replay it pins: 2026-10-02, two tickets stayed New overnight while their quests ran and a
// colleague took both the next morning.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'lib', 'quest-start-claim.js');
const CLI = path.join(ROOT, 'quest', 'active-cli.js');
const rsc = require(path.join(ROOT, 'quest', 'redmine-status-check.js'));
const OWNER = rsc.OWNER_ID, OTHER = 999;
const results = [];
function check(name, ok, d) { results.push({ name, ok: !!ok, d: d === undefined ? '' : String(d) }); }
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const NEW = () => ({ id: 1, name: 'New' });
const mine = () => ({ id: OWNER, name: 'Owner (Dev PLP)' });

// ── stub ticket server ───────────────────────────────────────────────────────
const tickets = {};
const seen = [];
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const num = (req.url.match(/\/redmine\/issues\/(\d+)\.json/) || [])[1];
    const t = tickets[num];
    const keyHeader = Object.keys(req.headers).find(h => /api-key$/.test(h));
    seen.push({ at: Date.now(), method: req.method, num, hasKey: !!(keyHeader && req.headers[keyHeader]), body });
    const answer = () => {
      if (!t) { res.writeHead(404); return res.end('{}'); }
      if (req.method === 'GET') {
        if (t.garbage) { res.writeHead(200); return res.end('<html>login</html>'); }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ issue: { id: Number(num), status: t.status, done_ratio: t.pct || 0, assigned_to: t.assignee || undefined } }));
      }
      if (t.put === 'refuse') { res.writeHead(422, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ errors: ['Status is not allowed'] })); }
      if (t.put !== 'ignore') { try { const sent = JSON.parse(body).issue; if (sent.status_id === 2) t.status = { id: 2, name: 'In Progress' }; if (typeof sent.done_ratio === 'number' && !t.keepPct) t.pct = sent.done_ratio; } catch (_) { /* leave as is */ } }
      res.writeHead(204); res.end();
    };
    if (t && t.delay && req.method === 'GET') setTimeout(answer, t.delay); else answer();
  });
});
const writes = num => seen.filter(s => s.num === String(num) && s.method !== 'GET');
const calls = num => seen.filter(s => s.num === String(num));

function mkRoot(active) {
  const r = fs.mkdtempSync(path.join(os.tmpdir(), 'qsc-'));
  fs.mkdirSync(path.join(r, 'quest'));
  fs.mkdirSync(path.join(r, 'domain', 'redmine-write-gate'), { recursive: true });
  fs.writeFileSync(path.join(r, 'quest', 'active.txt'), active);
  return r;
}
const rows = (r, feature) => { try { return fs.readFileSync(path.join(r, 'domain', feature, 'log.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch (_) { return []; } };
const started = (num, extra) => `qa=QA-${num}\nstatus=active\nphase=0\nquest_start=2026-10-07\n${extra || ''}\n`;

function run(file, args, env) {
  return new Promise(resolve => {
    const t0 = Date.now();
    const p = spawn(process.execPath, [file, ...args], { env: { ...process.env, ...env }, windowsHide: true });
    let out = '';
    p.stdout.on('data', c => out += c); p.stderr.on('data', c => out += c);
    p.on('close', code => resolve({ code, out, ms: Date.now() - t0, exitAt: Date.now() }));
  });
}
async function until(fn, ms) { const end = Date.now() + ms; while (Date.now() < end) { if (fn()) return true; await new Promise(r => setTimeout(r, 50)); } return !!fn(); }

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const PORT = server.address().port;
  const ENV = { QUEST_CLAIM_HOST: '127.0.0.1', QUEST_CLAIM_PORT: String(PORT), QUEST_CLAIM_RETRY_MS: '0' };
  const claim = async (target, active, flags) => { const r = mkRoot(active); const res = await run(SCRIPT, [target, '--root', r, ...(flags || [])], ENV); return { res, r, log: rows(r, 'quest-start-claim'), ledger: rows(r, 'redmine-write-gate') }; };

  // F1 the founding case
  tickets[900001] = { status: NEW(), assignee: mine() };
  let x = await claim('QA-900001', started(900001));
  const w1 = writes(900001);
  check('F1 REPLAY: New + mine + started → set', x.res.code === 0 && /New → In Progress, 20% \(set\)/.test(x.res.out) && x.log[0] && x.log[0].outcome === 'set' && x.log[0].pct === 20, x.res.out);
  check('F1b exactly one write, and it carries ONLY the status and 20 percent', w1.length === 1 && w1[0].method === 'PUT' && JSON.stringify(JSON.parse(w1[0].body)) === '{"issue":{"status_id":2,"done_ratio":20}}', w1.map(s => s.method + ' ' + s.body).join(' | '));
  check('F1c the write carries the API key header', w1.length === 1 && w1[0].hasKey);
  check('F1d log row has ts, num, from, to, dur_ms', x.log[0] && x.log[0].ts && x.log[0].num === '900001' && x.log[0].from === 'New' && x.log[0].to === 'In Progress' && typeof x.log[0].dur_ms === 'number', JSON.stringify(x.log[0]));
  check('F1e a real change adds one row to the write ledger, marked standing', x.ledger.length === 1 && x.ledger[0].outcome === 'allowed' && x.ledger[0].surface === 'quest-start-claim' && /standing: miya 2026-10-07/.test(x.ledger[0].approval), JSON.stringify(x.ledger));

  tickets[900002] = { status: { id: 2, name: 'In Progress' }, assignee: mine() };
  x = await claim('900002', started(900002));
  check('F2 already In Progress → no-change, nothing sent', x.log[0].outcome === 'no-change' && writes(900002).length === 0 && x.ledger.length === 0, x.res.out);

  tickets[900003] = { status: { id: 23, name: 'Rework' }, assignee: mine() };
  x = await claim('900003', started(900003));
  check('F3 reopened ticket in Rework → no-change, Rework stays', x.log[0].outcome === 'no-change' && writes(900003).length === 0 && tickets[900003].status.name === 'Rework', x.res.out);

  tickets[900004] = { status: NEW(), assignee: { id: OTHER, name: 'A Colleague' } };
  x = await claim('900004', started(900004));
  check('F4 New but a colleague holds it → skipped-not-mine, nothing sent', x.log[0].outcome === 'skipped-not-mine' && writes(900004).length === 0 && /assigned to A Colleague/.test(x.res.out), x.res.out);

  tickets[900005] = { status: NEW() };
  x = await claim('900005', started(900005));
  check('F5 New and unassigned → skipped-not-mine, nothing sent', x.log[0].outcome === 'skipped-not-mine' && writes(900005).length === 0 && /assigned to nobody/.test(x.res.out), x.res.out);

  tickets[900006] = { status: NEW(), assignee: mine() };
  x = await claim('900006', 'qa=QA-900006\nstatus=hold\nphase=0\nassigned_to_me=2026-10-07\n');
  check('F6 retrieval shape (status=hold, no stamp) → skipped-not-started, the server is never called', x.log[0].outcome === 'skipped-not-started' && calls(900006).length === 0, x.res.out);

  tickets[900007] = { status: NEW(), assignee: mine() };
  x = await claim('900007', 'qa=QA-900007\nstatus=active\nphase=0\n');
  check('F7 active but no quest_start stamp → skipped-not-started, the server is never called', x.log[0].outcome === 'skipped-not-started' && calls(900007).length === 0, x.res.out);

  tickets[900008] = { status: NEW(), assignee: mine() };
  x = await claim('900008', started(900001));
  check('F8 no block for the ticket → skipped-no-block, the server is never called', x.log[0].outcome === 'skipped-no-block' && calls(900008).length === 0, x.res.out);

  x = await claim('ADHOC-PT-2026-11', 'qa=ADHOC-PT-2026-11\nstatus=active\nquest_start=2026-10-07\n');
  check('F9 ADHOC id (no ticket number) → skipped-no-number, exit 0', x.res.code === 0 && x.log[0].outcome === 'skipped-no-number', x.res.out);

  const r10 = mkRoot(started(900010));
  const closed = await new Promise(r => { const s = http.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
  let res = await run(SCRIPT, ['900010', '--root', r10], { ...ENV, QUEST_CLAIM_PORT: String(closed) });
  check('F10 server not answering → unreachable, exit 0, the retry command is printed', res.code === 0 && rows(r10, 'quest-start-claim')[0].outcome === 'unreachable' && /Retry: node lib\/quest-start-claim\.js 900010/.test(res.out), res.out);

  tickets[900011] = { status: NEW(), assignee: mine(), put: 'refuse' };
  x = await claim('900011', started(900011));
  check('F11 server refuses the status (422) → failed with its words, no ledger row', x.log[0].outcome === 'failed' && x.log[0].http === 422 && /Status is not allowed/.test(x.res.out) && x.ledger.length === 0, x.res.out);

  tickets[900012] = { status: NEW(), assignee: mine(), put: 'ignore' };
  x = await claim('900012', started(900012));
  check('F12 server answers 204 but the status did not move → failed-verify, never a false set', x.log[0].outcome === 'failed-verify' && x.ledger.length === 0 && !/\(set\)/.test(x.res.out), x.res.out);

  tickets[900013] = { status: NEW(), assignee: mine() };
  x = await claim('900013', started(900013), ['--dry-run']);
  check('F13 dry run on a real candidate → would-set, nothing sent', x.log[0].outcome === 'would-set' && x.log[0].dry === true && writes(900013).length === 0 && tickets[900013].status.name === 'New', x.res.out);

  tickets[900014] = { status: NEW(), assignee: mine(), garbage: true };
  x = await claim('900014', started(900014));
  check('F14 server answers 200 with a login page → unreachable, nothing sent', x.log[0].outcome === 'unreachable' && writes(900014).length === 0, x.res.out);

  tickets[900015] = { status: NEW(), assignee: mine() };
  x = await claim('900015', started(900015));
  res = await run(SCRIPT, ['--result', 'QA-900015', '--root', x.r], ENV);
  const res15b = await run(SCRIPT, ['--result', '900099', '--root', x.r], ENV);
  check('F15 --result prints the last run for that ticket, and says so when there is none', /#900015 New → In Progress, 20% \(set\)\s+\[20/.test(res.out) && /#900099 no run recorded/.test(res15b.out), res.out + ' | ' + res15b.out);

  tickets[900001].status = NEW();
  const before16 = writes(900001).length;
  x = await claim('900001', 'qa=QA-9000012\nstatus=active\nquest_start=2026-10-07\n');
  check('F16 a longer ticket number that starts the same (9000012) is not this ticket', x.log[0].outcome === 'skipped-no-block' && writes(900001).length === before16, x.res.out);

  tickets[900017] = { status: NEW(), assignee: mine() };
  x = await claim('QA-900017', 'qa=QA-900016\r\nstatus=hold\r\n\r\nqa=QA-900017\r\nstatus=active\r\nquest_start=2026-10-07\r\n');
  check('F17 active.txt with CRLF line ends → set', x.log[0].outcome === 'set', x.res.out);

  tickets[900018] = { status: NEW(), assignee: mine() };
  x = await claim('900018', 'qa=QA-900018\nstatus=hold\nissue_one_liner=note says status=active quest_start=2026-10-07\n');
  check('F18 hold block whose one-liner TEXT contains status=active quest_start= → skipped-not-started', x.log[0].outcome === 'skipped-not-started' && calls(900018).length === 0, x.res.out);

  tickets[900019] = { status: NEW(), assignee: mine() };
  x = await claim('900019', 'qa=QA-900019\nstatus=closed\nquest_start=2026-09-01\n');
  check('F19 closed block that still carries its old stamp → skipped-not-started', x.log[0].outcome === 'skipped-not-started' && calls(900019).length === 0, x.res.out);

  tickets[900020] = { status: NEW(), assignee: mine() };
  const r20 = mkRoot(started(900020));
  const both = await Promise.all([run(SCRIPT, ['900020', '--root', r20], ENV), run(SCRIPT, ['900020', '--root', r20], ENV)]);
  check('F20 two runs at once for one ticket → both exit 0, the ticket ends In Progress', both.every(b => b.code === 0) && tickets[900020].status.name === 'In Progress' && rows(r20, 'quest-start-claim').length === 2, both.map(b => b.out.trim()).join(' | '));

  // ── the moment it starts: quest/active-cli.js ──────────────────────────────
  const cliEnv = (r, test) => ({ ...ENV, ACTIVE_TXT: path.join(r, 'quest', 'active.txt'), ACTIVE_ARCH: path.join(r, 'quest', 'active-archive.txt'), QUEST_CLAIM_ROOT: r, ...(test ? { QUEST_CLAIM_TEST: '1' } : {}) });

  tickets[900021] = { status: NEW(), assignee: mine() };
  const r21 = mkRoot('active:\n');
  res = await run(CLI, ['start', 'QA-900021', 'phase=0', 'status=hold', 'ticket_type=bug', 'assigned_to_me=2026-10-07'], cliEnv(r21, true));
  await new Promise(r => setTimeout(r, 700));
  check('F21 retrieval (start … status=hold) starts no background check and the server is never asked', res.code === 0 && !/🔖/.test(res.out) && calls(900021).length === 0 && tickets[900021].status.name === 'New', res.out);

  const r22 = mkRoot('active:\n');
  res = await run(CLI, ['start', 'ADHOC-PT-2026-12', 'phase=0', 'status=active', 'quest_start=@now'], cliEnv(r22, true));
  check('F22 an ADHOC start (status=active + stamp, no ticket number) starts no background check', res.code === 0 && !/🔖/.test(res.out), res.out);

  tickets[900023] = { status: NEW(), assignee: mine(), delay: 1200 };
  const r23 = mkRoot('qa=QA-900023\nstatus=active\nphase=0\n');
  res = await run(CLI, ['update', 'QA-900023', 'quest_start=@now'], cliEnv(r23, true));
  const landed23 = await until(() => tickets[900023].status.name === 'In Progress', 9000);
  const w23 = writes(900023)[0];
  check('F23 the quest_start stamp starts the check, and the command returns BEFORE the change is sent', /🔖 Redmine #900023/.test(res.out) && landed23 && w23 && res.exitAt < w23.at, `exit ${res.ms}ms · landed=${landed23} · ` + res.out.trim());
  check('F23b the background run left its own log row', await until(() => rows(r23, 'quest-start-claim').some(l => l.outcome === 'set'), 3000), JSON.stringify(rows(r23, 'quest-start-claim')));

  tickets[900123] = { status: NEW(), assignee: mine() };
  const r23c = mkRoot('qa=QA-900123\nstatus=hold\nphase=0\nassigned_to_me=2026-10-06\n');
  res = await run(CLI, ['update', 'QA-900123', 'status=active', 'phase=0', 'current_phase=Discovery', 'ticket_type=bug', 'local_test_confirmed=false', 'quest_start=@now'], cliEnv(r23c, true));
  check('F23c the /quest start step-6 command (hold → active + stamp) sets the ticket', /🔖 Redmine #900123/.test(res.out) && await until(() => tickets[900123].status.name === 'In Progress', 9000), res.out.trim());

  tickets[900024] = { status: NEW(), assignee: mine() };
  const r24 = mkRoot('qa=QA-900024\nstatus=active\nphase=0\n');
  res = await run(CLI, ['update', 'QA-900024', 'quest_start=@now'], cliEnv(r24, false));
  await new Promise(r => setTimeout(r, 700));
  check('F24 a self-test of active-cli (ACTIVE_TXT override, no test switch) starts no background check', res.code === 0 && !/🔖/.test(res.out) && calls(900024).length === 0, res.out);

  tickets[900124] = { status: NEW(), assignee: mine() };
  const r24b = mkRoot('qa=QA-900124\nstatus=active\nphase=0\nquest_start=2026-10-07\n');
  res = await run(CLI, ['update', 'QA-900124', 'current_phase=Recon'], cliEnv(r24b, true));
  await new Promise(r => setTimeout(r, 700));
  check('F24b a later phase update (no status, no stamp in the call) starts no background check', !/🔖/.test(res.out) && calls(900124).length === 0, res.out);

  // ── shape pins ─────────────────────────────────────────────────────────────
  const cli = read('quest/active-cli.js');
  const spawnLine = (cli.match(/spawn\(process\.execPath, \[script, qa\], \{[^}]*\}\)\.unref\(\)/) || [''])[0];
  check('F25 the background process is detached, silent and windowless', /detached: true/.test(spawnLine) && /stdio: 'ignore'/.test(spawnLine) && /windowsHide: true/.test(spawnLine), spawnLine);

  const gate = read('domain/redmine-write-gate/redmine-write-gate.check.hook.js');
  const lit = name => { const m = gate.match(new RegExp('const ' + name + ' = /(.+)/([a-z]*);')); return m ? new RegExp(m[1], m[2]) : null; };
  const NON_STATUS = lit('CLAIM_FORBIDDEN'), REF = lit('REDMINE_REF');
  const src = read('lib/quest-start-claim.js');
  check('F26 the script sends status + 20 percent only: no note / assignee / journal / upload key anywhere in it', !!NON_STATUS && !NON_STATUS.test(src) && (src.match(/'PUT'/g) || []).length === 1 && /\{ issue: \{ status_id: IN_PROGRESS_ID, done_ratio: START_PERCENT \} \}/.test(src) && /const START_PERCENT = 20;/.test(src), NON_STATUS ? String(src.match(NON_STATUS)) : 'gate regex not found');
  check('F27 active-cli.js carries no ticket-server host or key text (else the write gate would block every quest state write)', !!REF && !REF.test(cli), REF ? String(cli.match(REF)) : 'gate regex not found');

  tickets[900028] = { status: NEW(), assignee: mine() };
  x = await claim('900028', started(900028, 'redmine_claim=off'));
  check('F28 opt out (redmine_claim=off on the block) → skipped-opt-out, the server is never called', x.log[0].outcome === 'skipped-opt-out' && calls(900028).length === 0, x.res.out);

  tickets[900036] = { status: NEW(), assignee: mine(), keepPct: true };
  x = await claim('900036', started(900036));
  check('F36 Redmine takes the status but keeps its own % → set, and the line prints the % Redmine shows', x.log[0].outcome === 'set' && x.log[0].pct === 0 && /New → In Progress, 0% \(set\)/.test(x.res.out), x.res.out);

  const { shouldClaim } = require(CLI);
  check('F29 shouldClaim: active + stamp + number only', shouldClaim('QA-900001', ['qa=QA-900001', 'status=active', 'quest_start=2026-10-07']) && !shouldClaim('QA-900001', ['qa=QA-900001', 'status=hold', 'quest_start=2026-10-07']) && !shouldClaim('QA-900001', ['qa=QA-900001', 'status=active']) && !shouldClaim('QA-900001', ['qa=QA-900001', 'status=active', 'quest_start=']) && !shouldClaim('ADHOC-PT-2026-1', ['status=active', 'quest_start=2026-10-07']) && !shouldClaim('QA-900001', ['status=delegated', 'quest_start=2026-10-07']));

  // ── wiring ─────────────────────────────────────────────────────────────────
  const skill = read('.claude/skills/quest/SKILL.md');
  const step6b = (skill.match(/^6b\. [^\n]*/m) || [''])[0];
  check('F30 quest skill step 6b names the script, the result command and the opt out', /lib\/quest-start-claim\.js/.test(step6b) && /--result/.test(step6b) && /redmine_claim=off/.test(step6b), step6b.slice(0, 160));
  check('F31 step 6b keeps: status and 20% only · never at retrieval or in a sweep · report in the first lines', /status and 20% done only/i.test(step6b) && /Never at retrieval or in a multi-ticket sweep/.test(step6b) && /first lines/.test(step6b), step6b.slice(0, 160));
  check('F32 step 6b keeps the patch-ticket path for a status that is not New', /patch/i.test(step6b) && /row 1 of Next steps/.test(step6b), step6b.slice(0, 160));
  const readme = read('domain/quest-start-claim/README.md');
  check('F33 README carries symptom / goal / goal_signal / retention / footprint / state-scoped, no TODO', ['symptom: ', 'goal: ', 'goal_signal: ', 'retention: keep', 'footprint: on-demand', 'state-scoped: no'].every(k => readme.includes('\n' + k)) && !/TODO/.test(readme));
  check('F34 NUKE-MARKER present with the five fields', ['Created', 'Session', 'Files', 'Rollback', 'Retire'].every(f => read('domain/quest-start-claim/NUKE-MARKER.md').includes('| ' + f)));
  check('F35 the script header carries the forge keys', ['// symptom: ', '// goal: ', '// goal_signal: ', '// retention: keep', '// footprint: on-demand'].every(k => src.includes(k)));
  check('F36 the memory index line for the write-nod rule names its one standing exception', /redmine-write-nod\]\(feedback_redmine_write_needs_nod\.md\)[^\n]*standing exception: New to In Progress at quest start/.test(read('.claude/auto-memory/MEMORY.md')));
  check('F37 the write gate names the one exempt path', /quest-start-claim\\\.js/.test(gate) || /quest-start-claim\.js/.test(gate));
  check('F38 host and key still have one home, exported for this script', typeof rsc.REDMINE_HOST === 'string' && typeof rsc['REDMINE_' + 'KEY'] === 'string' && !/\d+\.\d+\.\d+\.\d+/.test(src));

  server.close();
  let fail = 0;
  for (const r of results) { if (!r.ok) fail++; console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok || !r.d ? '' : '  → ' + r.d.slice(0, 300))); }
  console.log('\nquest-start-claim feature eval: ' + (results.length - fail) + '/' + results.length + ' green');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('eval crashed: ' + (e && e.stack || e)); process.exit(1); });
