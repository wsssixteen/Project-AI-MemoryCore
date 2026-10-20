#!/usr/bin/env node
// disk-cleanup — the laptop disk cleanup engine. Acts only on paths listed in catalog.json; every change needs --yes.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HERE = __dirname;
const CATALOG = process.env.DISK_CLEANUP_CATALOG || path.join(HERE, 'catalog.json');
const LOG = process.env.DISK_CLEANUP_LOG || path.join(HERE, 'log.jsonl');
const FRAMES_DIR = path.join(os.tmpdir(), 'disk-cleanup-frames');
const GB = 2 ** 30;
const YOUTUBE_URL = /^https:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]{11}\b/;
const NEVER = ['C:\\', 'C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)', 'C:\\Users', 'C:\\ProgramData'];

const expand = (p) => p.replace(/%([A-Z_]+)%/gi, (m, v) => process.env[v] || process.env[v.toUpperCase()] || m);
const loadCatalog = () => JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const items = () => loadCatalog().items.map((i) => ({ ...i, path: expand(i.path), to: i.to ? expand(i.to) : undefined }));
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; };
const has = (n) => process.argv.includes('--' + n);
const t0 = Date.now();

function log(row) {
  fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), dur_ms: Date.now() - t0, ...row }) + '\n');
}
function freeGB(drive) {
  try { const s = fs.statfsSync(drive); return s.bavail * s.bsize / GB; } catch (_) { return null; }
}
function sizeOf(p) {
  let total = 0;
  const stack = [p];
  while (stack.length) {
    const cur = stack.pop();
    let st;
    try { st = fs.lstatSync(cur); } catch (_) { continue; }
    if (st.isSymbolicLink()) continue;
    if (!st.isDirectory()) { total += st.size; continue; }
    let names = [];
    try { names = fs.readdirSync(cur); } catch (_) { continue; }
    for (const n of names) stack.push(path.join(cur, n));
  }
  return total;
}
function itemGB(it) {
  if (it.sizeFrom) {
    try { const m = fs.readFileSync(expand(it.sizeFrom.file), 'utf8').match(new RegExp(it.sizeFrom.regex)); return m ? Number(m[1]) : null; } catch (_) { return null; }
  }
  return fs.existsSync(it.path) ? sizeOf(it.path) / GB : 0;
}
// A path is safe to remove only when it is long enough and is not a top-level system or profile folder.
function safePath(p) {
  const n = path.resolve(p).replace(/[\\/]+$/, '');
  if (NEVER.some((x) => x.toLowerCase() === n.toLowerCase())) return false;
  if (n.toLowerCase() === path.resolve(os.homedir()).toLowerCase()) return false;
  return n.split(/[\\/]/).filter(Boolean).length >= 3;
}
function runAdmin(psCommand) {
  const r = spawnSync('powershell', ['-NoProfile', '-Command', `Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile','-Command',"${psCommand.replace(/"/g, '`"')}"`], { encoding: 'utf8' });
  return r.status === 0;
}
const fmt = (g) => (g == null ? '  ?  ' : g.toFixed(1).padStart(5));

function scan() {
  const c = freeGB('C:\\'), d = freeGB('D:\\');
  const rows = items().map((it) => ({ id: it.id, label: it.label, gb: itemGB(it), action: it.action, note: it.note }));
  const big = rows.filter((r) => (r.gb || 0) >= 0.05).sort((a, b) => (b.gb || 0) - (a.gb || 0));
  const out = [];
  out.push(`C: free ${c == null ? '?' : c.toFixed(1)} GB` + (d == null ? '' : `   D: free ${d.toFixed(1)} GB`));
  out.push('│');
  for (const r of big) out.push(`├── ${fmt(r.gb)} GB  ${r.id.padEnd(20)} ${r.action.padEnd(11)} ${r.label}`);
  out.push('└── (items under 0.05 GB hidden)');
  console.log(out.join('\n'));
  log({ cmd: 'scan', outcome: 'ok', c_free_gb: c && +c.toFixed(2), items: big.map((r) => ({ id: r.id, gb: r.gb && +r.gb.toFixed(2) })) });
}

function clearOld(dir, days, skipNames) {
  const cutoff = Date.now() - days * 86400000;
  let freed = 0;
  let names = [];
  try { names = fs.readdirSync(dir); } catch (_) { return 0; }
  for (const n of names) {
    if (skipNames.some((s) => n.toLowerCase().includes(s.toLowerCase()))) continue;
    const p = path.join(dir, n);
    try {
      const st = fs.lstatSync(p);
      if (st.mtimeMs > cutoff) continue;
      const sz = st.isDirectory() ? sizeOf(p) : st.size;
      fs.rmSync(p, { recursive: true, force: true });
      freed += sz;
    } catch (_) { /* in use: skipped */ }
  }
  return freed / GB;
}

function caches() {
  const yes = has('yes');
  const before = freeGB('C:\\');
  for (const it of items().filter((i) => i.action === 'auto')) {
    const gb = itemGB(it);
    if (!yes) { console.log(`would clear ${it.id} (${gb.toFixed(2)} GB)`); continue; }
    let ok = true, freed = null;
    if (it.run) {
      const r = spawnSync(it.run[0], it.run.slice(1), { encoding: 'utf8', shell: true, windowsHide: true });
      ok = r.status === 0;
    } else if (it.olderThanDays) {
      freed = clearOld(it.path, it.olderThanDays, it.skipNames || []);
    }
    const after = itemGB(it);
    console.log(`${ok ? 'cleared' : 'FAILED '} ${it.id}: ${gb.toFixed(2)} → ${after.toFixed(2)} GB`);
    log({ cmd: 'caches', item: it.id, outcome: ok ? 'ok' : 'failed', freed_gb: +(freed != null ? freed : Math.max(0, gb - after)).toFixed(2) });
  }
  if (yes) console.log(`C: free ${before.toFixed(1)} → ${freeGB('C:\\').toFixed(1)} GB`);
}

function act(id) {
  const it = items().find((i) => i.id === id);
  if (!it) { console.error(`no catalog item "${id}"`); process.exit(2); }
  const yes = has('yes');
  if (['keep', 'report', 'handoff', 'auto'].includes(it.action)) {
    console.log(`${it.id}: ${it.action}. ${it.note}${it.handoff ? ' → run ' + it.handoff : ''}`);
    log({ cmd: 'act', item: id, outcome: 'no-change', action: it.action });
    return;
  }
  if (it.action !== 'recycle' && !safePath(it.path)) { console.error(`REFUSED: ${it.path} is not a safe path`); log({ cmd: 'act', item: id, outcome: 'refused-path' }); process.exit(2); }
  if (!fs.existsSync(it.path) && it.action !== 'recycle') { console.log(`${it.id}: already gone`); log({ cmd: 'act', item: id, outcome: 'already-gone' }); return; }
  const gb = it.action === 'recycle' ? 0 : itemGB(it);
  const plan = { delete: `delete ${it.path}`, recycle: 'empty the Recycle Bin', 'online-only': `make ${it.path} online-only in OneDrive`, move: `move ${it.path} → ${it.to}` }[it.action];
  if (!yes) { console.log(`would ${plan} (${gb.toFixed(2)} GB). Add --yes after his yes.`); return; }
  const before = freeGB('C:\\');
  let ok = false;
  if (it.action === 'delete') {
    try { fs.rmSync(it.path, { recursive: true, force: true }); ok = !fs.existsSync(it.path); } catch (_) { ok = false; }
    if (!ok && it.admin) ok = runAdmin(`Remove-Item -LiteralPath '${it.path}' -Recurse -Force`) && !fs.existsSync(it.path);
  } else if (it.action === 'recycle') {
    ok = spawnSync('powershell', ['-NoProfile', '-Command', 'Clear-RecycleBin -Force -ErrorAction SilentlyContinue'], { windowsHide: true }).status === 0;
  } else if (it.action === 'online-only') {
    ok = spawnSync('attrib', ['+U', '-P', path.join(it.path, '*'), '/S', '/D'], { windowsHide: true }).status === 0;
  } else if (it.action === 'move') {
    if (!fs.existsSync(path.parse(it.to).root)) { console.error(`REFUSED: ${it.to} drive missing`); process.exit(2); }
    const cmd = `robocopy '${it.path}' '${it.to}' /E /MOVE /R:1 /W:1 /NFL /NDL /NJH /NJS`;
    const r = spawnSync('powershell', ['-NoProfile', '-Command', cmd], { windowsHide: true });
    ok = r.status !== null && r.status < 8;
    if (!ok && it.admin) ok = runAdmin(cmd);
  }
  const freed = before != null ? freeGB('C:\\') - before : null;
  console.log(`${ok ? 'DONE' : 'FAILED'} ${plan}. C: free now ${freeGB('C:\\').toFixed(1)} GB`);
  log({ cmd: 'act', item: id, action: it.action, outcome: ok ? 'ok' : 'failed', freed_gb: freed != null ? +freed.toFixed(2) : null });
  if (!ok) process.exit(1);
}

function decided() {
  const done = new Set();
  try {
    for (const l of fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean)) {
      const r = JSON.parse(l);
      if (r.cmd === 'clip' && r.decision === 'kept' && r.outcome === 'ok') done.add(r.clip.toLowerCase());
    }
  } catch (_) {}
  return done;
}
function pendingClips() {
  const c = loadCatalog().clips;
  const dir = expand(c.dir);
  const kept = decided();
  let names = [];
  try { names = fs.readdirSync(dir); } catch (_) { return { dir, list: [] }; }
  const list = names.filter((n) => c.ext.includes(path.extname(n).toLowerCase()))
    .map((n) => ({ file: path.join(dir, n), st: fs.statSync(path.join(dir, n)) }))
    .filter((x) => !kept.has(x.file.toLowerCase()))
    .sort((a, b) => a.st.mtimeMs - b.st.mtimeMs);
  return { dir, list };
}
function tool(name) {
  const r = spawnSync('where', [name], { encoding: 'utf8', windowsHide: true });
  if (r.status === 0) return r.stdout.split(/\r?\n/)[0].trim();
  const fallback = path.join('C:\\ffmpeg\\bin', name + '.exe');
  return fs.existsSync(fallback) ? fallback : null;
}
function defaultTitle(file) {
  const m = path.basename(file).match(/^(.*?)\s*(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return path.parse(file).name;
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[3] - 1];
  return `${m[1] || 'Clip'} | ${+m[4]} ${mon} ${m[2]}`;
}

function clips() {
  const { dir, list } = pendingClips();
  const gb = list.reduce((s, x) => s + x.st.size, 0) / GB;
  console.log(`${list.length} clip(s) waiting in ${dir}, ${gb.toFixed(1)} GB`);
}

function clipNext() {
  const { list } = pendingClips();
  if (!list.length) { console.log(JSON.stringify({ done: true })); return; }
  const x = list[0];
  const ffprobe = tool('ffprobe'), ffmpeg = tool('ffmpeg');
  let duration = null;
  if (ffprobe) {
    const r = spawnSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', x.file], { encoding: 'utf8', windowsHide: true });
    duration = parseFloat(r.stdout) || null;
  }
  const frames = [];
  if (ffmpeg && duration) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
    const n = loadCatalog().clips.frames || 4;
    for (let i = 0; i < n; i++) {
      const at = (duration * (i + 0.5) / n).toFixed(2);
      const out = path.join(FRAMES_DIR, `${path.parse(x.file).name}-${i + 1}.jpg`);
      spawnSync(ffmpeg, ['-y', '-v', 'error', '-ss', at, '-i', x.file, '-frames:v', '1', '-vf', 'scale=640:-2', out], { windowsHide: true });
      if (fs.existsSync(out)) frames.push(out);
    }
  }
  console.log(JSON.stringify({ file: x.file, date: new Date(x.st.mtimeMs - x.st.mtime.getTimezoneOffset() * 60000).toISOString().slice(0, 16).replace('T', ' '), size_mb: Math.round(x.st.size / 2 ** 20), duration_s: duration && Math.round(duration), frames, default_title: defaultTitle(x.file), left: list.length }, null, 1));
}

function clipDone(file) {
  if (!file) { console.error('usage: clip-done <file> --uploaded <youtube url> --title "<t>" | --deleted | --kept'); process.exit(2); }
  const dir = path.resolve(expand(loadCatalog().clips.dir)).toLowerCase();
  const full = path.resolve(file);
  if (!full.toLowerCase().startsWith(dir + path.sep)) { console.error(`REFUSED: ${full} is not in the clips folder`); process.exit(2); }
  const url = arg('uploaded');
  const decision = url ? 'uploaded' : has('deleted') ? 'deleted' : has('kept') ? 'kept' : null;
  if (!decision) { console.error('pick one: --uploaded <url> | --deleted | --kept'); process.exit(2); }
  if (decision === 'uploaded' && !YOUTUBE_URL.test(url)) { console.error(`REFUSED: "${url}" is not a YouTube video link; the local file stays`); log({ cmd: 'clip', clip: full, decision, outcome: 'refused-url' }); process.exit(2); }
  const size = fs.existsSync(full) ? fs.statSync(full).size / GB : 0;
  if (decision !== 'kept') { try { fs.rmSync(full, { force: true }); } catch (_) {} }
  const ok = decision === 'kept' || !fs.existsSync(full);
  console.log(`${ok ? 'OK' : 'FAILED'} ${decision}: ${path.basename(full)}${decision !== 'kept' ? ` (${size.toFixed(2)} GB freed)` : ''}`);
  log({ cmd: 'clip', clip: full, decision, url: url || null, title: arg('title') || null, outcome: ok ? 'ok' : 'failed', freed_gb: decision !== 'kept' && ok ? +size.toFixed(2) : 0 });
  if (!ok) process.exit(1);
}

module.exports = { safePath, defaultTitle, YOUTUBE_URL };
if (require.main === module) {
  const cmd = process.argv[2];
  const table = { scan, caches, act: () => act(process.argv[3]), clips, 'clip-next': clipNext, 'clip-done': () => clipDone(process.argv[3]) };
  if (!table[cmd]) {
    console.log('usage: disk-cleanup.js scan | caches [--yes] | act <id> [--yes] | clips | clip-next | clip-done <file> --uploaded <url> --title "<t>" | --deleted | --kept');
    process.exit(cmd ? 2 : 0);
  }
  table[cmd]();
}
