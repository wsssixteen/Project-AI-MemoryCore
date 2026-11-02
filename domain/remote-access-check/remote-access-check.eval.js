#!/usr/bin/env node
// remote-access-check.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-10-31 RustDesk Not ready: server 202.186.75.193 ports 21116 and 21117 time out while 1.1.1.1:443 is open
'use strict';
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const { execFile } = require('child_process');

const SCRIPT = path.join(__dirname, 'remote-access-check.js');
const HOOK = path.join(__dirname, 'remote-access-check.check.hook.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'rac-'));
const LOG = path.join(TMP, 'log.jsonl');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function config(body) { const f = path.join(TMP, 'c' + Math.random().toString(36).slice(2) + '.toml'); fs.writeFileSync(f, body); return f; }
function run(file, extra, input) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const p = execFile(process.execPath, [file], { encoding: 'utf8', timeout: 15000, windowsHide: true, env: { ...process.env, REMOTE_CHECK_LOG: LOG, REMOTE_CHECK_HOSTNAME: 'PJNBRidhwan', REMOTE_CHECK_SERVICES: 'RustDesk=RUNNING,AnyDesk=RUNNING', REMOTE_CHECK_TIMEOUT_MS: '500', ...extra } }, (e, stdout) => resolve({ out: String(stdout || ''), code: e ? e.code : 0, ms: Date.now() - t0 }));
    p.stdin.end(input === undefined ? '{}' : input);
  });
}
function listen() { return new Promise((res) => { const s = net.createServer((c) => c.destroy()); s.listen(0, '127.0.0.1', () => res(s)); }); }

(async () => {
  const a = await listen(), b = await listen(), ctl = await listen(), dead = await listen();
  const A = a.address().port, B = b.address().port, C = ctl.address().port, D = dead.address().port;
  await new Promise((r) => dead.close(r)); // D is now a closed port
  const local = config("[options]\nkey = 'SECRETKEY123'\ncustom-rendezvous-server = '127.0.0.1'\n");
  const base = { REMOTE_CHECK_CONFIG: local, REMOTE_CHECK_CONTROL: '127.0.0.1:' + C, REMOTE_CHECK_PORTS: A + ',' + B };

  let r = await run(SCRIPT, { ...base, REMOTE_CHECK_HOSTNAME: 'HOME-LAPTOP' });
  check('F1 another machine: silent', r.out.trim() === '', r.out);

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_PORTS: D + ',' + D });
  check('F2 REPLAY 2026-10-31: server ports dead, internet up = flag naming the port', /REMOTE ACCESS DOWN/.test(r.out) && r.out.includes(String(D)) && /Internet on this laptop works/.test(r.out) && /AnyDesk service: RUNNING/.test(r.out), r.out);

  r = await run(SCRIPT, base);
  check('F3 all healthy: one OK line, no flag', /remote-access-check: OK/.test(r.out) && !/DOWN/.test(r.out), r.out);

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_CONTROL: '127.0.0.1:' + D, REMOTE_CHECK_PORTS: D + '' });
  check('F4 no internet: blames the laptop link, not the server', /no internet/.test(r.out) && !/not answering/.test(r.out), r.out);

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_CONFIG: path.join(TMP, 'missing.toml') });
  check('F5 config missing: flag names it', /not readable/.test(r.out), r.out);

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_CONFIG: config("[options]\nkey = 'x'\n") });
  check('F6 no custom server: says it was not tested', /remote-access-check: OK/.test(r.out) && /not tested/.test(r.out), r.out);

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_SERVICES: 'RustDesk=STOPPED,AnyDesk=RUNNING' });
  check('F7 RustDesk service stopped: flag', /RustDesk service is STOPPED/.test(r.out), r.out);

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_SERVICES: 'RustDesk=RUNNING,AnyDesk=STOPPED' });
  check('F8 AnyDesk service stopped: flag', /AnyDesk service is STOPPED/.test(r.out), r.out);

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_PORTS: A + ',' + D });
  check('F9 one port dead: names only that port', r.out.includes('port ' + D) && !r.out.includes(String(A)), r.out);

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_CONFIG: config("custom-rendezvous-server = '10.255.255.1'\n"), REMOTE_CHECK_PORTS: '21116,21117' });
  check('F10 silent timeout stays inside the budget', /not answering/.test(r.out) && r.ms < 5000, 'ms=' + r.ms + ' ' + r.out);

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_PORTS: D + '' });
  check('F11 the RustDesk key is never printed', !r.out.includes('SECRETKEY123'), r.out);

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_CONFIG: config("custom-rendezvous-server = '127.0.0.1:21116'\n") });
  check('F12 server written with a port is still read', /RustDesk server 127\.0\.0\.1 /.test(r.out), r.out);

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_CONFIG: TMP });
  check('F13 config path is a folder: flag, no crash', /not readable/.test(r.out) && r.code === 0, r.out);

  const before = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').trim().split('\n').length : 0;
  await run(SCRIPT, base);
  const rows = fs.readFileSync(LOG, 'utf8').trim().split('\n');
  const row = JSON.parse(rows[rows.length - 1]);
  check('F14 each run writes one log row with outcome and duration', rows.length === before + 1 && row.outcome === 'ok' && typeof row.dur_ms === 'number', JSON.stringify(row));

  r = await run(SCRIPT, { ...base, REMOTE_CHECK_LOG: path.join(TMP, 'no', 'such', 'dir', 'log.jsonl') });
  check('F15 log not writable: self-audit says so, check still reports', /self-audit FAIL/.test(r.out) && /OK/.test(r.out), r.out);

  r = await run(HOOK, { ...base, REMOTE_CHECK_PORTS: D + '' }, 'not json');
  check('F16 hook end to end: bad stdin, flag still reaches output', r.code === 0 && /REMOTE ACCESS DOWN/.test(r.out), r.code + ' ' + r.out);

  r = await run(HOOK, { ...base, REMOTE_CHECK_HOSTNAME: 'HOME-LAPTOP' });
  check('F17 hook on another machine: exit 0, no flag', r.code === 0 && !/REMOTE ACCESS/.test(r.out), r.out);

  a.close(); b.close(); ctl.close();
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}

  let failed = 0;
  for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
  console.log('\nremote-access-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
  process.exit(failed ? 1 : 0);
})();
