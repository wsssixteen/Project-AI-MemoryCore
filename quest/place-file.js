// place-file.js — moves a file miya gives during a quest to its home (2026-11-02, per miya, 287773).
//   node quest/place-file.js <file> --qa <num> --as fix|brief|original [--replace] [--dry-run]
//   node quest/place-file.js <file> --qa <num>      a .bpmn20.xml picks its own home, or exits 2 and asks
//   Homes: fix = the latest cycle folder (N. Rework root, else 2. Fix) · brief = the latest Brief folder
//          original = etanah-knowledge/<state>/flowables-bpmn, state and module read from the model key
// goal: a file he gives lands in its one home the same turn, and the source stays until the copy is proven
// goal_signal: a PLACE-FILE line naming source, destination and kind, and the destination bytes equal the source
// self_audit: every move re-reads the destination and compares its sha256 with the source before removing the source
// boundary: covers one named file, the quest's Task folder and the state's flowables-bpmn folder · never overwrites a different file without --replace, never deletes a replaced copy (it is kept as "<name> - old <date>"), never touches a file he did not name, never writes to Redmine or the modeler · stops at exit 2 with the question when the home cannot be read from the file
// footprint: on-demand: 1 node process under 1 second per move
// retention: system/telemetry/place-file.jsonl rotate monthly
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const taskFolder = require('../lib/task-folder');
const states = require('../lib/states');

const BPMN_RE = /\.bpmn20\.xml$/i;
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const processOf = s => { const a = s.indexOf('<process'), b = s.indexOf('</process>'); return a >= 0 && b > a ? s.slice(a, b) : null; };

// PNG_PLP_PRU -> { state record, module: 'PLP', key }
function modelInfo(file) {
  const key = path.basename(file).replace(BPMN_RE, '');
  const m = key.match(/^([A-Z]+)_([A-Z]+)_/);
  if (!m) return { key };
  const st = Object.values(states.all()).find(s => s.bpmn && s.bpmn.prefix === m[1]);
  return { key, state: st, module: m[2] };
}

// Root = our module (PLP); another module goes in its own subfolder when that folder exists.
function knowledgeHome(file) {
  const info = modelInfo(file);
  if (!info.state) return null;
  const root = path.join(states.knowledgeDir(info.state.key), 'flowables-bpmn');
  const sub = info.module === 'CON' ? 'CONSENT' : info.module;
  const dir = info.module !== 'PLP' && fs.existsSync(path.join(root, sub)) ? path.join(root, sub) : root;
  return path.join(dir, path.basename(file));
}

function questFolder(num, active) {
  const out = active !== undefined ? active : cp.execFileSync(process.execPath, [path.join(__dirname, 'active-cli.js'), 'read', 'QA-' + num], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const m = out.match(/^task_folder=(.+)$/m);
  return m ? m[1].trim() : null;
}

function fixHome(folder) {
  const c = taskFolder.cycleFolders(folder);
  return c.length ? c[c.length - 1].full : path.join(folder, '2. Fix');
}

// A model that differs from the knowledge copy and names this ticket is the fix; one that matches or names no ticket is a reference copy.
function autoKind(file, num) {
  if (!BPMN_RE.test(file)) return { ask: 'not a Flowable model, so its home cannot be read from the file; say --as fix, --as brief or --as original' };
  const home = knowledgeHome(file);
  if (!home) return { ask: 'the model key names no state in the registry; say --as fix or --as brief' };
  const text = fs.readFileSync(file, 'utf8');
  const mine = processOf(text);
  if (!mine) return { ask: 'no process section in this file; say --as fix or --as brief' };
  if (fs.existsSync(home) && processOf(fs.readFileSync(home, 'utf8')) === mine) return { kind: 'original', same: true };
  if (num && new RegExp('#' + num + '\\b').test(mine)) return { kind: 'fix' };
  if (modelInfo(file).state && !fs.existsSync(home)) return { kind: 'original' };
  return { ask: 'this model differs from the knowledge copy and does not name this ticket; say --as fix or --as original' };
}

function place(src, opts) {
  const { kind, num, replace, dryRun, folder } = opts;
  if (!fs.existsSync(src) || !fs.statSync(src).isFile()) return { code: 1, msg: 'FAIL not a file: ' + src };
  let dst;
  if (kind === 'original') {
    if (!BPMN_RE.test(src)) return { code: 1, msg: 'FAIL --as original takes a .bpmn20.xml only: ' + src };
    dst = knowledgeHome(src);
    if (!dst) return { code: 1, msg: 'FAIL the model key names no state in the registry: ' + path.basename(src) };
  } else {
    if (!folder) return { code: 1, msg: 'FAIL no task_folder on QA-' + num + ' in active.txt' };
    const dir = kind === 'fix' ? fixHome(folder) : kind === 'brief' ? taskFolder.latestBriefDir(folder) : null;
    if (!dir) return { code: 1, msg: 'FAIL unknown --as ' + kind + ' (fix, brief or original)' };
    dst = path.join(dir, path.basename(src));
  }
  if (path.resolve(src) === path.resolve(dst)) return { code: 0, msg: 'already home: ' + dst, dst };
  const bytes = fs.readFileSync(src);
  let old = null;
  if (fs.existsSync(dst)) {
    if (sha(fs.readFileSync(dst)) === sha(bytes)) {
      if (!dryRun) fs.unlinkSync(src);
      return { code: 0, msg: 'same bytes already at ' + dst + ', source removed', dst };
    }
    if (!replace) return { code: 1, msg: 'FAIL a different file is already at ' + dst + '; look at it, then rerun with --replace (the old copy is kept)', dst };
    const stamp = new Date().toISOString().slice(0, 10);
    const ext = BPMN_RE.test(dst) ? '.xml' : path.extname(dst);
    const stem = dst.slice(0, dst.length - ext.length);
    old = stem + ' - old ' + stamp + ext;
    for (let i = 2; fs.existsSync(old); i++) old = stem + ' - old ' + stamp + ' (' + i + ')' + ext;
  }
  if (dryRun) return { code: 0, msg: 'dry run: ' + src + ' -> ' + dst + (old ? ' (old copy -> ' + old + ')' : ''), dst };
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (old) fs.copyFileSync(dst, old);
  fs.copyFileSync(src, dst);
  if (sha(fs.readFileSync(dst)) !== sha(bytes)) return { code: 1, msg: 'FAIL the copy at ' + dst + ' does not match the source; source kept', dst };
  fs.unlinkSync(src);
  return { code: 0, msg: path.basename(src) + ' -> ' + dst + (old ? ' (old copy kept: ' + path.basename(old) + ')' : ''), dst };
}

function log(row) {
  try {
    const f = path.join(taskFolder.mainRoot(__dirname), 'system', 'telemetry', 'place-file.jsonl');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.appendFileSync(f, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n');
  } catch (_) { /* a log failure never blocks the move */ }
}

module.exports = { place, autoKind, knowledgeHome, fixHome, questFolder, modelInfo, processOf };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const flag = n => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : undefined; };
  const has = n => argv.includes('--' + n);
  const valued = new Set(['--qa', '--as']);
  const src = argv.find((a, i) => !a.startsWith('--') && !valued.has(argv[i - 1]));
  const num = String(flag('qa') || '').replace(/^QA-/i, '');
  if (!src) { console.error('usage: node quest/place-file.js <file> --qa <num> [--as fix|brief|original] [--replace] [--dry-run]'); process.exit(2); }
  const started = Date.now();
  if (!fs.existsSync(src)) { console.error('PLACE-FILE: FAIL not a file: ' + src); process.exit(1); }
  let kind = flag('as');
  if (!kind) {
    const a = autoKind(src, num);
    if (a.ask) { console.log('PLACE-FILE: ASK ' + path.basename(src) + ': ' + a.ask); log({ src, outcome: 'ask', dur_ms: Date.now() - started }); process.exit(2); }
    kind = a.kind;
  }
  let folder = null;
  if (kind !== 'original') { try { folder = questFolder(num); } catch (_) { folder = null; } }
  const r = place(src, { kind, num, replace: has('replace'), dryRun: has('dry-run'), folder });
  console.log('PLACE-FILE: ' + kind + ' · ' + r.msg);
  log({ src, dst: r.dst, kind, qa: num, outcome: r.code ? 'fail' : 'moved', goal_met: !r.code, dur_ms: Date.now() - started });
  process.exit(r.code);
}
