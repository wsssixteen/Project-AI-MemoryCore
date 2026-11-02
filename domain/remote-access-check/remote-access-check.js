#!/usr/bin/env node
// remote-access-check.js — on the work laptop, is RustDesk reachable from outside right now?
// boundary: covers the RustDesk config, TCP connects to its server and one internet control, the RustDesk and AnyDesk service state · never changes a setting, restarts a service, or sends anything outside these connects · stops at printing the flag; the fix is his or the server owner's
// self_audit: every run tests the live ports and services (nothing cached), reads its own log row back, and prints a warning if the row is missing.
'use strict';
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const { spawnSync } = require('child_process');

const WORK_LAPTOP = 'PJNBRidhwan';
const env = process.env;
const TIMEOUT_MS = Number(env.REMOTE_CHECK_TIMEOUT_MS) || 2000;
const PORTS = (env.REMOTE_CHECK_PORTS || '21116,21117').split(',').map(Number);
const CONTROL = env.REMOTE_CHECK_CONTROL || '1.1.1.1:443';
const CONFIG = env.REMOTE_CHECK_CONFIG || path.join(env.APPDATA || '', 'RustDesk', 'config', 'RustDesk2.toml');
const LOG = env.REMOTE_CHECK_LOG || path.join(__dirname, 'log.jsonl');

function connects(host, port) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port });
    const done = (ok) => { s.destroy(); resolve(ok); };
    s.setTimeout(TIMEOUT_MS);
    s.once('connect', () => done(true));
    s.once('timeout', () => done(false));
    s.once('error', () => done(false));
  });
}

function readServer() {
  let text;
  try { text = fs.readFileSync(CONFIG, 'utf8'); } catch (_) { return { error: 'RustDesk config not readable at ' + CONFIG }; }
  const m = text.match(/custom-rendezvous-server\s*=\s*'([^']*)'/);
  if (!m || !m[1].trim()) return { server: null };
  return { server: m[1].trim().replace(/:\d+$/, '') };
}

function serviceState(name) {
  const fake = (env.REMOTE_CHECK_SERVICES || '').split(',').map((x) => x.split('=')).find((x) => x[0] === name);
  if (fake) return fake[1];
  const r = spawnSync('sc', ['query', name], { encoding: 'utf8', timeout: 1500, windowsHide: true });
  const m = String(r.stdout || '').match(/STATE\s*:\s*\d+\s+(\w+)/);
  return m ? m[1] : 'NOT FOUND';
}

function writeLog(row) {
  try {
    fs.appendFileSync(LOG, JSON.stringify(row) + '\n');
    const last = fs.readFileSync(LOG, 'utf8').trim().split('\n').pop();
    return JSON.parse(last).ts === row.ts;
  } catch (_) { return false; }
}

async function main() {
  const t0 = Date.now();
  const host = env.REMOTE_CHECK_HOSTNAME || os.hostname();
  if (host.toLowerCase() !== WORK_LAPTOP.toLowerCase()) return; // other machines: silent, no connects

  const problems = [];
  const { server, error } = readServer();
  if (error) problems.push(error);

  const rustdesk = serviceState('RustDesk');
  const anydesk = serviceState('AnyDesk');
  if (rustdesk !== 'RUNNING') problems.push('RustDesk service is ' + rustdesk);
  if (anydesk !== 'RUNNING') problems.push('AnyDesk service is ' + anydesk);

  const i = CONTROL.lastIndexOf(':');
  const tests = [connects(CONTROL.slice(0, i), Number(CONTROL.slice(i + 1)))];
  if (server) PORTS.forEach((p) => tests.push(connects(server, p)));
  const [internet, ...portsOk] = await Promise.all(tests);
  const closed = server ? PORTS.filter((_, n) => !portsOk[n]) : [];

  if (!internet) problems.push('this laptop has no internet (' + CONTROL + ' failed), so the RustDesk server could not be judged');
  else if (closed.length) problems.push('RustDesk server ' + server + ' is not answering on port ' + closed.join(', ') + '. Internet on this laptop works, so RustDesk shows Not ready and home cannot reach this laptop through it');

  const note = server ? '' : (error ? '' : ' No custom RustDesk server is set, so its port was not tested.');
  const outcome = problems.length ? 'down' : 'ok';
  const logged = writeLog({ ts: new Date().toISOString(), outcome, server: server || null, closed, internet, rustdesk, anydesk, dur_ms: Date.now() - t0 });
  const audit = logged ? '' : '\nremote-access-check: self-audit FAIL, log row not written to ' + LOG;

  if (problems.length) {
    console.log('🚨 REMOTE ACCESS DOWN: put this in the first lines of the reply to miya, before anything else.\n' +
      problems.map((p) => '- ' + p).join('\n') +
      '\n- AnyDesk service: ' + anydesk + '. If it is RUNNING, AnyDesk is the way in.' + audit);
  } else {
    console.log('remote-access-check: OK. ' + (server ? 'RustDesk server ' + server + ' answers on ' + PORTS.join(', ') + '. ' : '') + 'RustDesk and AnyDesk services running.' + note + audit);
  }
}

main().catch((e) => { console.log('remote-access-check: could not run: ' + e.message); });
