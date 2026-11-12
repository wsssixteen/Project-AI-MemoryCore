#!/usr/bin/env node
// ticket-close-block — deterministic git commit-reference block for a ticket close.
// Usage: node ticket-close-block.js --repo <path> --ticket <num> --module <pelupusan|awam>
//        [--branch <name>] [--intenv-sha <sha>] [--cherrypick]
// AWAM      -> branch only (another team does the PROD merge and refers to the branch).
// pelupusan -> branch + merged to mlk/int-env (we deploy PROD; BA tests on int-env).

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG = path.resolve(__dirname, 'log.jsonl');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i >= 0 && (i + 1 >= process.argv.length || process.argv[i + 1].startsWith('--'))) return true; // flag
  return i >= 0 ? process.argv[i + 1] : def;
}
function git(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
}
function logRow(row) {
  try { fs.appendFileSync(LOG, JSON.stringify(row) + '\n'); } catch (_) {}
}

// --patch (2026-11-11 per miya, 288974: "the types of patching will always include these datas, the things we've
// patched"): the patch-done note is read off the patch itself, so every thing the script changed is one line and
// nothing is typed from memory. The note lists what changed only; it never says "not changed" about anything.
// node ticket-close-block.js --patch --ticket <num> --ba "<BA name>" [--sql <num>.sql] [--file "<Dokumen name>=<new file>"]...
//      [--was "[<ID Permohonan>|]<column>=<value from the BEFORE check>"]... [--tugasan "<tugasan>"] [--user <login>] [--id <ID>]
// The plain-word maps below are the one home of BA wording for a column. A column or table not in them is printed
// by its raw name with a warn on stderr: add its word here, never drop the line.
const KEY = { id_pengenalan: 'ID Permohonan', no_permit_lesen: 'No. Lesen', no_resit: 'No. Resit', no_hakmilik: 'No. Hakmilik' };
const SCOPE = { umm_aplikasi: 'permohonan', umm_a_permohonan_tnh: 'permohonan', ind_mklmt_tnh_permit_lesen: 'lesen asal' };
const ROW = {
  umm_tgsn_semasa: { D: u => ['Tugasan', 'removed from Senarai Tugasan' + (u ? ' of ' + u : '')], I: u => ['Tugasan', 'added to Senarai Tugasan' + (u ? ' of ' + u : '')] },
};
const COL = {
  status_proses: 'Status', status_awam: 'Status',
  status_keputusan: v => ['Status', `(${v})`],
  trkh_tamat: () => ['Status', ''],
  tempat: 'Tempat', nama_kawasan_terlibat: 'Tempat',
  nama: 'Nama', perihal: 'Nama',
  hubungan_aplikasi_id: (v, x) => {
    if (v !== null) return [`Link to ${(/id_pengenalan\s*=\s*'([^']+)'/i.exec(x.expr) || [])[1] || v}`, 'added'];
    if (x.was === undefined) x.warn('hubungan_aplikasi_id set to NULL: give --was hubungan_aplikasi_id=<the ID Permohonan it pointed to in the BEFORE check; empty when it pointed to nothing>');
    return x.was === '' ? null : [`Link to ${x.was || 'another permohonan'}`, 'removed'];
  },
  // MLPS Maksud Pendudukan (289265): the lesen string is what the Borang shows; clearing the officer's own text and kegunaan only lets it show
  'umm_a_permit_lesen.tujuan_permohonan': 'Maksud Pendudukan',
  'umm_a_permohonan_tnh.tujuan_permohonan': v => v === null ? null : ['Maksud Pendudukan', v],
  'umm_a_permohonan_tnh.tujuan_permohonan_id': () => null,
  'umm_a_permit_lesen.kegunaan': v => v === null ? null : ['Kegunaan', v],
  'umm_a_permit_lesen.kegunaan_id': () => null,
  'umm_a_tgsn.flag_aktif': v => ['Tugasan', v === 'N' ? 'closed' : 'reopened'],
  'umm_a_tgsn.status_tugasan': v => ['Tugasan', v === 'Selesai' ? 'closed' : v],
  'umm_a_tgsn.trkh_tetap': () => ['Tugasan', ''],
  lokasi_fail_pdf: (v, x) => {
    if (v !== null) return ['PDF file', String(v)];
    if (x.files) return null; // the --file line says the document was replaced; this statement only makes its PDF regenerate
    x.warn('lokasi_fail_pdf set to NULL with no --file: give --file "<Dokumen name>=<new file name>"');
    return ['Dokumen', 'replaced'];
  },
};

function argAll(name) {
  const o = [];
  process.argv.forEach((a, i) => { const v = process.argv[i + 1]; if (a === '--' + name && v && !v.startsWith('--')) o.push(v); });
  return o;
}
// Same string with everything inside quotes or brackets blanked, so a top-level comma, ; or WHERE is found by position.
function mask(s) {
  let d = 0, q = false, o = '';
  for (const c of s) {
    if (q) { if (c === "'") q = false; o += c === "'" && d === 0 ? c : ' '; continue; }
    if (c === "'") { q = true; o += d === 0 ? c : ' '; continue; }
    if (c === ')') d--;
    o += d > 0 ? ' ' : c;
    if (c === '(') d++;
  }
  return o;
}
function cut(s, ch) {
  const m = mask(s), out = [];
  let from = 0;
  for (let i = 0; i < m.length; i++) if (m[i] === ch) { out.push(s.slice(from, i)); from = i + 1; }
  out.push(s.slice(from));
  return out.map(x => x.trim()).filter(Boolean);
}
function lit(v) {
  v = String(v).trim();
  const m = /^'([\s\S]*)'$/.exec(v);
  if (m) return m[1].replace(/''/g, "'");
  if (/^null$/i.test(v)) return null;
  return /^(sysdate|now\(\)|current_\w+)$/i.test(v) ? 'now' : v;
}
// Reads the patch (.sql + replaced files) into one group of note lines per ID Permohonan.
function patchGroups(inAlter) { // inAlter: --tugasan and --user belong to the alter lines, not to the patch lines
  const warns = [];
  const warn = w => { if (!warns.includes(w)) warns.push(w); };
  const user = !inAlter && arg('user') && arg('user') !== true ? String(arg('user')) : '';
  const tugasan = !inAlter && arg('tugasan') && arg('tugasan') !== true ? String(arg('tugasan')) : '';
  const files = argAll('file');
  const was = {};
  for (const w of argAll('was')) { const m = /^(?:(.+)\|)?(\w+)=(.*)$/.exec(w); if (m) was[(m[1] || '') + '|' + m[2].toLowerCase()] = m[3]; }
  let sql = '';
  if (arg('sql') && arg('sql') !== true) sql = fs.readFileSync(String(arg('sql')), 'utf8');
  sql = sql.replace(/('(?:[^']|'')*')|--[^\n]*/g, (m, q) => q || '');

  const stmts = [];
  for (const s of cut(sql, ';')) {
    let m, kind, set = [], where = '';
    if ((m = /^UPDATE\s+([\w.]+)\s+SET\s+/i.exec(s))) {
      kind = 'U';
      const rest = s.slice(m[0].length), wi = mask(rest).search(/\bWHERE\b/i);
      where = wi < 0 ? '' : rest.slice(wi + 5);
      set = cut(wi < 0 ? rest : rest.slice(0, wi), ',').map(a => [a.slice(0, a.indexOf('=')).trim().toLowerCase(), a.slice(a.indexOf('=') + 1).trim()]);
    } else if ((m = /^DELETE\s+FROM\s+([\w.]+)\s*/i.exec(s))) {
      kind = 'D'; where = s.slice(m[0].length);
    } else if ((m = /^INSERT\s+INTO\s+([\w.]+)\s*/i.exec(s))) {
      kind = 'I'; where = s;
      const r = /^\(([^)]*)\)\s*VALUES\s*\(([\s\S]*)\)$/i.exec(s.slice(m[0].length));
      const cols = r ? r[1].split(',').map(c => c.trim().toLowerCase()) : [], vals = r ? cut(r[2], ',') : [];
      if (r && cols.length === vals.length) set = cols.map((c, i) => [c, vals[i]]);
      else warn(`INSERT INTO ${m[1]}: values not read (not a single VALUES row); add what was inserted to the note by hand`);
    } else continue;
    const keys = {}, top = {};
    where.replace(/\b(\w+)\s*(?:=|\bIN\b)\s*\(?\s*((?:'[^']*'\s*,?\s*)+)/gi, (_, c, list) => { (keys[c.toLowerCase()] = keys[c.toLowerCase()] || []).push(...list.match(/'[^']*'/g).map(lit)); });
    if (kind !== 'I') mask(where).replace(/\b(\w+)\s*=\s*'/g, (hit, c, i) => { const q = /^'((?:[^']|'')*)'/.exec(where.slice(i + hit.length - 1)); if (q) top[c.toLowerCase()] = q[1]; });
    stmts.push({ kind, table: m[1].split('.').pop().toLowerCase(), set, keys, top });
  }

  const groups = new Map();
  const G = id => groups.get(id) || groups.set(id, { keys: new Map(), lines: new Map() }).get(id);
  const add = (g, label, part, before, scope) => {
    const l = g.lines.get(label) || g.lines.set(label, { parts: [], scopes: [], before: '' }).get(label);
    if (part && !l.parts.includes(part)) l.parts.push(part);
    if (before && !l.before) l.before = before;
    if (scope && !l.scopes.includes(scope)) l.scopes.push(scope);
  };
  const allIds = [...new Set(stmts.flatMap(s => s.keys.id_pengenalan || []))];
  const idArg = arg('id') && arg('id') !== true ? String(arg('id')) : '';
  if (idArg && !allIds.includes(idArg)) allIds.unshift(idArg);
  if (idArg) G(idArg);
  for (const s of stmts) {
    for (const id of (s.keys.id_pengenalan || (allIds.length === 1 ? allIds : ['']))) {
      const g = G(id);
      const setCols = s.set.map(a => a[0]);
      // header lines: the named keys (No. Lesen …) wherever they sit; with no ID Permohonan, the row's own top-level key too
      const heads = Object.entries(s.keys).filter(([c]) => KEY[c]).concat(id ? [] : Object.entries(s.top).filter(([c]) => !KEY[c]).map(([c, v]) => [c, [v]]));
      for (const [c, vals] of heads) {
        if (c === 'id_pengenalan' || setCols.includes(c)) continue;
        const k = g.keys.get(KEY[c] || c) || g.keys.set(KEY[c] || c, []).get(KEY[c] || c);
        vals.forEach(v => { if (!k.includes(v)) k.push(v); });
      }
      const scope = SCOPE[s.table] || s.table;
      if (s.kind === 'U') for (const [c, expr] of s.set) {
        const v = lit(expr), entry = COL[s.table + '.' + c] || COL[c];
        const w = was[id + '|' + c] !== undefined ? was[id + '|' + c] : was['|' + c];
        const shown = v === null ? '(empty)' : v;
        if (typeof entry === 'function') { const r = entry(v, { was: w, expr, files: files.length, warn }); if (r) add(g, r[0], r[1], '', scope); continue; }
        if (!entry) warn(`no plain word for column ${s.table}.${c}: printed by its raw name; add it to COL in ticket-close-block.js`);
        const before = w !== undefined ? w : s.top[c];
        if (before !== undefined && before === (v === null ? '' : v)) continue;
        add(g, entry || c, shown, before, scope);
      } else {
        const row = ROW[s.table] && ROW[s.table][s.kind];
        if (row) { add(g, ...row(user)); continue; }
        warn(`no plain word for a row ${s.kind === 'D' ? 'deleted from' : 'inserted into'} ${s.table}: printed by its raw name; add it to ROW in ticket-close-block.js`);
        const det = s.set.filter(a => !/_id$|^version$|^created_|^last_modified_/.test(a[0]) && lit(a[1]) !== null && lit(a[1]) !== 'now')
          .map(a => `${typeof COL[a[0]] === 'string' ? COL[a[0]] : a[0]} ${lit(a[1])}`);
        add(g, `${s.table} row`, (s.kind === 'D' ? 'deleted' : 'added') + (det.length ? ` (${det.join(', ')})` : ''));
      }
    }
  }
  if (files.length && !groups.size) G('');
  const fg = groups.get(idArg) || [...groups.values()][0];
  if (files.some(f => !f.includes('|')) && groups.size > 1 && !idArg) warn('--file with more than one ID Permohonan in the script: the file line went under the first; give --file "<ID Permohonan>|<Dokumen name>=<new file>" or --id');
  // --file "[<ID Permohonan>|]<Dokumen name>=<new file>": the ID puts the line under that permohonan (289265: 3 files, 3 permohonan)
  for (let f of files) { const b = f.indexOf('|'), tg = b > 0 ? G(f.slice(0, b).trim()) : fg; if (b > 0) f = f.slice(b + 1); const i = f.indexOf('='); if (i > 0) add(tg, f.slice(0, i).trim(), 'replaced with ' + f.slice(i + 1).trim()); else add(tg, 'Dokumen ' + path.basename(f), 'replaced'); }

  const out = new Map();
  for (const [id, g] of groups) {
    const lines = [...g.keys].map(([k, v]) => `${k}: ${v.join(', ')}`);
    let userSaid = false;
    for (const [label, l] of g.lines) {
      const text = [l.parts.filter(p => !p.startsWith('(')).join(', '), l.parts.filter(p => p.startsWith('(')).join(' ')].filter(Boolean).join(' ') || 'date updated';
      if (user && text.includes(user)) userSaid = true;
      lines.push(`${label === 'Tugasan' && tugasan ? 'Tugasan ' + tugasan : label}: ${l.before ? l.before + ' -> ' : ''}${text}${l.scopes.length > 1 ? ` (${l.scopes.join(' + ')})` : ''}`);
    }
    if (user && !userSaid) lines.push(`User ID: ${user}`);
    out.set(id, lines);
  }
  return { groups: out, warns };
}

if (arg('patch') === true) {
  const need = ['ticket', 'ba'].filter(k => !arg(k) || arg(k) === true);
  if (need.length) { console.error('--patch needs: ' + need.map(k => '--' + k).join(' ')); process.exit(1); }
  const { groups, warns } = patchGroups();
  if (![...groups.values()].some(l => l.length)) { console.error('--patch found nothing changed: give --sql <num>.sql and/or --file "<Dokumen name>=<new file>"'); process.exit(1); }
  let names = {};
  try { names = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'ba-names.json'), 'utf8')); } catch (_) {}
  const baArg = String(arg('ba'));
  const key = Object.keys(names).find(k => k.toLowerCase() === baArg.toLowerCase());
  if (!key) console.error(`warn: no short name for "${baArg}" in ba-names.json — check how miya greets this BA`);
  warns.forEach(w => console.error('warn: ' + w));
  const body = [...groups].map(([id, lines]) => [...(id ? [`ID Permohonan: ${id}`] : []), ...lines].join('\n')).join('\n\n');
  console.log([`Salam ${key ? names[key] : baArg}, have patched as below. Can proceed to verify.`, '', '<pre>', body, '</pre>', '', 'Thank you.'].join('\n'));
  logRow({ ts: new Date().toISOString(), ticket: arg('ticket'), mode: 'patch', ids: [...groups.keys()].filter(Boolean), warns: warns.length, outcome: 'printed' });
  process.exit(0);
}

// --alter (2026-11-05 per miya, 288533: "Does quest not load the format?"): the done-alter / patch+alter note in
// ALTER-TICKET-PLAYBOOK §5.1 shape, generated here so no step writes it by hand. No repo needed.
// node ticket-close-block.js --alter --ticket <num> --ba "<BA name>" --id <ID> --tugasan "<tugasan>" --user <login from the AFTER check>
//      [--resit "<no1>, <no2>"] [--patched] [--prod-script <num>.sql]
if (arg('alter') === true) {
  const need = ['ticket', 'ba', 'id', 'tugasan', 'user'].filter(k => !arg(k) || arg(k) === true);
  if (need.length) { console.error('--alter needs: ' + need.map(k => '--' + k).join(' ')); process.exit(1); }
  let names = {};
  try { names = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'ba-names.json'), 'utf8')); } catch (_) {}
  const baArg = String(arg('ba'));
  const key = Object.keys(names).find(k => k.toLowerCase() === baArg.toLowerCase());
  if (!key) console.error(`warn: no short name for "${baArg}" in ba-names.json — check how miya greets this BA`);
  const patched = arg('patched') === true;
  const resit = arg('resit');
  const script = arg('prod-script');
  // patch + alter: --sql / --file / --was put the --patch lines of this ID under it (2026-11-11, 288974)
  const pg = (arg('sql') && arg('sql') !== true) || argAll('file').length ? patchGroups(true) : null;
  if (pg) {
    pg.warns.forEach(w => console.error('warn: ' + w));
    const others = [...pg.groups.keys()].filter(k => k !== String(arg('id')));
    if (others.length) console.error('warn: patched but not in this note: ' + others.map(k => k || '(no ID Permohonan)').join(', '));
  }
  const out = [
    // every done-alter is a PROD action the BA passes to the user: "Can proceed to verify." (miya 2026-11-12, 288625)
    `Salam ${key ? names[key] : baArg}, have ${patched ? 'patched the data and altered' : 'altered'} as below. Can proceed to verify.`,
    '',
    '<pre>',
    `ID Permohonan: ${arg('id')}`,
    ...(resit && resit !== true ? [`No. Resit: ${resit}`] : []),
    ...(pg ? pg.groups.get(String(arg('id'))) || [] : []),
    `Tugasan: ${arg('tugasan')}`,
    `User ID: ${arg('user')}`,
    '</pre>',
    '',
    ...(script && script !== true ? [`Attached is the script for PROD (${path.basename(String(script))}).`, ''] : []),
    'Thank you.',
  ];
  console.log(out.join('\n'));
  logRow({ ts: new Date().toISOString(), ticket: arg('ticket'), mode: 'alter', patched, outcome: 'printed' });
  process.exit(0);
}

const repo = arg('repo');
const ticket = arg('ticket');
const module_ = String(arg('module') || '').toLowerCase();
if (!repo || !ticket || !module_) {
  console.error('usage: --repo <path> --ticket <num> --module <pelupusan|awam> [--branch <name>] [--intenv-sha <sha>] [--cherrypick]');
  process.exit(1);
}
const isAwam = module_.includes('awam');
const moduleName = isAwam ? 'etanah-awam' : 'etanah-pelupusan';

let branch = arg('branch');
if (!branch) {
  let branches = [];
  try {
    branches = git(repo, ['branch', '-a', '--list', `*${ticket}*`, '--format=%(refname:short)'])
      .split('\n').map(s => s.trim().replace(/^origin\//, '')).filter(Boolean);
  } catch (_) {}
  branches = branches.filter(b => !/(int-env|stag-env|mlit|master|release)/.test(b));
  branch = branches.find(b => new RegExp(`/${ticket}(v\\d+)?$`).test(b))
        || branches.find(b => b.includes(ticket)) || null;
}

let commit = null;
try {
  const args = branch
    ? ['log', '-1', '--format=%H%n%an%n%ad%n%s', '--date=format:%d/%m/%Y %H:%M:%S', branch]
    : ['log', '-1', '--all', `--grep=#${ticket}`, '--format=%H%n%an%n%ad%n%s', '--date=format:%d/%m/%Y %H:%M:%S'];
  const out = git(repo, args);
  if (out) {
    const parts = out.split('\n');
    commit = { hash: parts[0], author: parts[1], date: parts[2], subject: parts.slice(3).join('\n') };
  }
} catch (_) {}
if (branch) branch = branch.replace(/^origin\//, '');

let intenv = arg('intenv-sha');
const cherrypick = arg('cherrypick') === true;
if (!isAwam && !intenv) {
  try { intenv = git(repo, ['log', '-1', '--format=%h', 'mlk/int-env', `--grep=#${ticket}`]) || null; } catch (_) { intenv = null; }
}

const lines = ['<pre>'];
if (commit) {
  lines.push(`Commit  : ${commit.hash}`);
  lines.push(`Author  : ${commit.author}`);
  lines.push(`Date    : ${commit.date}`);
  lines.push(`Subject : ${commit.subject}`);
}
let branchLine = `Branch  : ${branch || '(not found)'}`;
if (!isAwam && intenv) branchLine += cherrypick ? `  (cherry-picked to mlk/int-env: ${intenv})` : `  (merged to mlk/int-env: ${intenv})`;
lines.push(branchLine);
lines.push(`Module  : ${moduleName}`);
lines.push('</pre>');

// --ba <name> [--envs "internal & staging"] wraps the git block in miya's BA pass note (#282061, 2026-09-29).
// BA name -> the short name miya greets with (ba-names.json). Unknown name -> printed as given + a stderr warning.
let ba = arg('ba');
const envs = arg('envs');
const prodScript = arg('prod-script');
if (ba && ba !== true) {
  let names = {};
  try { names = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'ba-names.json'), 'utf8')); } catch (_) {}
  const key = Object.keys(names).find(k => k.toLowerCase() === String(ba).toLowerCase());
  if (key) ba = names[key];
  else console.error(`warn: no short name for "${ba}" in ba-names.json — check how miya greets this BA`);
}

// Colleague's fix (#282587, 2026-10-02): commit author is not us -> no issues list, no commit details.
// Branch line only when the Redmine history does not already name the branch. AWAM keeps the branch line
// (another team merges PROD from it).
const OURS = new RegExp(arg('ours-author', 'ridhwan'), 'i');
const foreign = commit && !OURS.test(commit.author);
let historyHasBranch = false;
if (foreign && branch) {
  let hist = arg('history');
  if (!hist || hist === true) {
    try {
      const block = execFileSync('node', [path.resolve(__dirname, '../../quest/active-cli.js'), 'read', `QA-${ticket}`], { encoding: 'utf8' });
      const tf = (block.match(/^task_folder=(.+)$/m) || [])[1];
      if (tf) hist = ['1. Brief', '0. Brief'].map(d => path.join(tf.trim(), d, 'History.txt')).find(p => fs.existsSync(p));
    } catch (_) {}
  }
  try { historyHasBranch = !!hist && fs.readFileSync(hist, 'utf8').includes(branch.replace(/^origin\//, '')); } catch (_) {}
}

// BA pass note for OUR fix (2026-10-04, #244600): refuse while a written falsifier is unrun or the local
// test is unconfirmed. No flag skips it — run the row, or miya accepts the risk / writes [risk-ok:].
if (ba && ba !== true && commit && !foreign) {
  // 2026-11-05 (#287811): one non-merge commit per cycle on the ticket branch. Five failed commits reached
  // origin and his SourceTree before the note; the note is the last point where the count is still ours to fix.
  // --multi-ok "<his order>" (logged) lets a branch he ordered kept as-is through.
  const multiOk = arg('multi-ok');
  if (branch && !(multiOk && multiOk !== true)) {
    try {
      const baseRef = ['origin/mlk/master', 'mlk/master'].find(r => { try { git(repo, ['rev-parse', '--verify', '-q', r]); return true; } catch (_) { return false; } });
      if (baseRef) {
        const base = git(repo, ['merge-base', baseRef, branch]);
        const n = parseInt(git(repo, ['rev-list', '--no-merges', '--count', `${base}..${branch}`]), 10);
        let blk = '';
        try { blk = execFileSync('node', [path.resolve(__dirname, '../../quest/active-cli.js'), 'read', `QA-${ticket}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (_) {}
        const cycles = 1 + (blk.match(/^closed(_cycle\d+)?=/mg) || []).length;
        if (n > cycles) {
          console.error(`BA pass note refused for QA-${ticket}: ${n} non-merge commits on ${branch} since ${baseRef}, ${cycles} cycle(s). One commit per cycle: git reset --soft <master merge>; git commit; then push through lib/origin-rewrite.js (his clone follows). His order to keep them: --multi-ok "<his words>".`);
          logRow({ ts: new Date().toISOString(), ticket, module: moduleName, branch, commit: commit.hash, outcome: 'refused-multi-commit', n, cycles });
          process.exit(3);
        }
      }
    } catch (_) {}
  } else if (multiOk && multiOk !== true) logRow({ ts: new Date().toISOString(), ticket, branch: branch || null, outcome: 'multi-ok', why: String(multiOk).slice(0, 200) });
  let gate = null;
  try { gate = require(path.resolve(__dirname, '../falsifier-ran-check/check.js')); } catch (_) {}
  const r = gate ? gate.check(`QA-${ticket}`, { ctx: 'note', codeFix: true }) : { ok: true };
  if (!r.ok) {
    console.error(gate.message(`QA-${ticket}`, r, `BA pass note refused for QA-${ticket}`));
    logRow({ ts: new Date().toISOString(), ticket, module: moduleName, branch: branch || null, commit: commit.hash, outcome: 'refused-ledger', kinds: r.fails.map(f => f.kind) });
    process.exit(3);
  }
}

// AWAM: the env line names the module, "internal (Awam)" (2026-10-19 per miya, #285252).
// Every branch line names its module, "(Awam)" or "(Pelupusan)" (2026-10-27 per miya, #264355: a two-repo ticket whose note named only the AWAM branch).
const moduleTag = isAwam ? '(Awam)' : '(Pelupusan)';
let env = envs && envs !== true ? envs : 'internal';
if (isAwam && !/\(awam\)/i.test(env)) env = `${env} (Awam)`;
if (foreign && ba && ba !== true) {
  console.log(`Salam ${ba}, have deployed fixes to ${env}. Please help to verify.`);
  if (prodScript && prodScript !== true) { console.log(''); console.log(`Attached is the script for PROD (${prodScript}).`); }
  if (isAwam || !historyHasBranch) { console.log(''); console.log(`Branch: ${branch || '(not found)'} ${moduleTag}`); }
  console.log('');
  console.log('Thank you.');
} else {
  if (ba && ba !== true) {
    console.log(`Salam ${ba}, have deployed fixes to ${env}. Please help to verify.`);
    console.log('');
    console.log('Issues resolved:');
    console.log('1. ');
    console.log('');
  }
  console.log(`*${branch || moduleName}* ${moduleTag}`);
  console.log(lines.join('\n'));
  if (ba && ba !== true) {
    if (prodScript && prodScript !== true) { console.log(''); console.log(`Attached is the script for PROD (${prodScript}).`); }
    console.log('');
    console.log('Thank you.');
  }
}

// Attach line for miya (NOT part of the note): FULL path of every file he uploads (#282587, 2026-10-02).
if (prodScript && prodScript !== true) {
  let full = path.isAbsolute(prodScript) ? prodScript : null;
  if (!full) {
    try {
      const block = execFileSync('node', [path.resolve(__dirname, '../../quest/active-cli.js'), 'read', `QA-${ticket}`], { encoding: 'utf8' });
      const tf = (block.match(/^task_folder=(.+)$/m) || [])[1];
      if (tf) {
        const dirs = fs.readdirSync(tf.trim()).filter(d => /^\d+\. (Rework|Fix)$/.test(d)).sort((a, b) => parseInt(b) - parseInt(a));
        const hit = dirs.map(d => path.join(tf.trim(), d, prodScript)).find(p => fs.existsSync(p));
        full = hit || null;
      }
    } catch (_) {}
  }
  console.log('');
  console.log('--- not part of the note ---');
  console.log(`Attach: ${full || '(not found — give the full path) ' + prodScript}`);
}

logRow({ ts: new Date().toISOString(), ticket, module: moduleName, branch: branch || null, commit: commit ? commit.hash : null, intenv: intenv || null, outcome: commit ? 'ok' : 'no-commit' });
