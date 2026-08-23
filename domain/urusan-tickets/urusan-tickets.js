#!/usr/bin/env node
// urusan-tickets.js — regenerate the per-urusan Redmine ticket-history docs.
//
// Usage:
//   node domain/urusan-tickets/urusan-tickets.js            — full pull + regenerate all docs
//   node domain/urusan-tickets/urusan-tickets.js --dry-run  — pull + classify, print counts, write nothing
//
// WHAT: pulls EVERY helpdesk_melaka ticket (open + closed) whose Module is
// Pelupusan / Awam Pelupusan (+ every ticket assigned to miya regardless of module),
// classifies each into its urusan, and regenerates
//   <main-repo>/projects/coding-projects/active/etanah-knowledge/melaka/urusan/<KOD>-TICKETS.md
// one doc per urusan + _UNCLASSIFIED.md + _INDEX.md.
//
// WHY (miya 2026-08-23): past tickets ARE the distribution of future tickets — a
// per-urusan precedent index turns Phase 0 into "check precedent" instead of a fresh
// trace. Full regenerate each run (idempotent, self-healing — no delta state to rot).
//
// CONSUMER: ticket-gate.js Phase-0 row 1c ("URUSAN PRECEDENT") reads the urusan doc.
// FEEDER:   re-run this script (any session, office network required) + quest-bounty
//           Step 3 appends requirement decisions at Phase-2 close.
//
// Classification priority (deterministic):
//   1. cf_33 "Urusan" custom field (exact kod, else exact nama, else nama-contains)
//   2. Permohonan-ID pattern PTMLK/<pej>/<x>/<KOD>/<year>/<n> in subject+description
//   3. Word-boundary kod match in subject + description head (kods of length >= 3 only —
//      2-letter kods like PT/PS false-positive on PTG/PTD; they classify via 1 or 2)
//   4. else UNCLASSIFIED (kept visible in _UNCLASSIFIED.md — nothing silently dropped)
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const REDMINE_BASE = 'http://172.16.90.169/redmine';
const REDMINE_KEY = '9565c21aa6cd9672fd3c7c2c7fec4c934c2f7c66'; // same constant as redmine-board.js:27
const PROJECT = 'helpdesk_melaka';

// PLP urusan catalog — source: et_main_mlit.ind_ursn rows whose ind_modul is Pelupusan
// (queried 2026-08-23, 74 rows). kod -> nama.
const URUSAN = {
  '49KTN': 'Kesan Maraan atau Munduran Laut',
  APRU: 'Alihhak Permit Ruang Udara',
  BAPRU: 'Bayaran Alihhak Permit Ruang Udara',
  BB5A: 'Bayaran Borang 5A',
  BMBT: 'Permohonan Pemberimilikan Stratum Tanah Bawah Tanah Di Bawah Subseksyen 92d(1)b',
  BMRE: 'Batal Tanah Rizab Melayu',
  BPBB: 'Bayaran Permit Bahan Batuan',
  BPJBT: 'Bayaran Pajakan Bawah Tanah Rizab',
  BPJK: 'Permohonan Pembatalan Pajakan Tanah Rizab',
  BPRE: 'Bayaran Premium',
  BPRU: 'Bayaran Permit Menggunakan Ruang Udara',
  BPRZ: 'Permohonan Pembatalan Perizaban',
  BRIZ: 'Permohonan Pembatalan Perizaban',
  BTNB: 'Bantahan Masuk Tanah Izin Lalu Dibawah Akta Bekalan Elektrik 1990',
  DMLMSP: 'Migrasi Data Lesen Menduduki Sementara beserta Permit',
  DMMLMS: 'Migrasi Data Membaharui Lesen Pendudukan Sementara',
  DMPLMS: 'Migrasi Data Lesen Menduduki Sementara',
  DMPLPRU: 'Migrasi Data Serahhak Permit Ruang Udara',
  DMPPJK: 'Migrasi Data Pajakan Tanah Perizaban',
  DMPRBB: 'Migrasi Data Permit Bahan Batuan',
  DMPRU: 'Migrasi Data Permit Ruang Udara',
  DMPRZ: 'Migrasi Data Perizaban',
  JTKPA: 'Deposit Kemasukan Pembida Awal',
  JTKPB: 'Deposit Kemasukan Pembida Berjaya',
  LMCRG: 'Permohonan Lesen Mencarigali/Penjelajahan',
  LMSP: 'Lesen Menduduki Sementara beserta Permit',
  MCL: 'Permohonan Malacca Customary Land',
  MLCRG: 'Permohonan Memperbaharui Lesen Mencarigali/Penjelajahan',
  MLPS: 'Membaharui Lesen Pendudukan Sementara',
  MPJLB: 'Permohonan Memperbaharui Pajakan Lombong / Lesen Melombong Tuan Punya',
  OMLPS: 'Membaharui Lesen Pendudukan Sementara',
  OPLBP: 'Pengeluaran Lesen Bercantum Permit',
  OPLPRU: 'Pengeluaran Permit Ruang Udara (Serahhak)',
  OPLPS: 'Pengeluaran Lesen Pendudukan Sementara',
  OPPJK: 'Pengeluaran Pajakan Tanah Rizab',
  OPPTPB: 'Permohonan Permit Khas Untuk Menggunakan Tanah Pertanian / Bangunan Bagi Kegunaan Lain-Lain',
  OPRBB: 'Pengeluaran Permit Bahan Batuan',
  OPRU: 'Pengeluaran Permit Ruang Udara',
  PBGSA: 'Permohonan Pemberimilikan Tanah Dibawah Akta GSA',
  PBHL: 'Permohonan Pembatalan Hak Lalulalang',
  PCRG: 'Permohonan Permit Carigali',
  PDBB: 'Permohonan Pemulangan Wang Cagaran',
  PJBTR: 'Permohonan Pajakan Stratum Tanah Bawah Tanah Dibawah Tanah Rizab',
  PLPS: 'Permohonan Lesen Pendudukan Sementara',
  PLTP: 'Pemohonan Lanjut Tempoh Pajakan',
  PMRE: 'Pinda Sempadan Tanah Rizab Melayu',
  PPDB: 'Permohonan Pemulangan Deposit Bahan Batuan',
  PPJK: 'Permohonan Pajakan Tanah Perizaban',
  PPTPB: 'Permohonan Permit Khas Untuk Menggunakan Tanah Pertanian / Bangunan Bagi Kegunaan Lain-Lain',
  PRBB: 'Permohonan Permit Bahan Batuan (Borang 4C)',
  PRMMK: 'Permohonan Perizaban (Kelulusan MMK)',
  PRU: 'Permohonan Permit Ruang Udara',
  PRZ: 'Permohonan Perizaban',
  PS: 'Permohonan Serahbalik',
  PSBS: 'Permohonan Serahbalik Berimilik Semula',
  PT: 'Permohonan Pemberimilikan',
  PWGSA: 'Permohonan Pewartaan Tanah Dibawah Akta GSA',
  PWTB: 'Permohonan Pewartaan Tanah Dibawah Akta Pemuliharaan Tanah',
  RAYA: 'Rayuan Bayaran Ansuran',
  RAYL: 'Rayuan Lanjut Tempoh Bayaran',
  RHHLL: 'Rayuan Hal-hal Lain (Kelulusan JKKT)',
  RKPJL: 'Rayuan Pengurangan Premium (Kelulusan JKKT)',
  RLKJL: 'Rayuan Melanjutkan Tempoh Bayaran dan Pengurangan Premium (Kelulusan JKKT)',
  RMTJL: 'Rayuan Melanjutkan Tempoh Bayaran Premium (Kelulusan JKKT)',
  RMTL: 'Rayuan Melanjutkan Tempoh Bayaran Premium (Kelulusan PTG)',
  RPPLP: 'Permohonan Rayuan Pelbagai',
  TTNB: 'Bantahan Taksiran Pampasan Dalam Tempoh 21 Hari',
  UKBA: 'Utiliti Kemaskini Bayaran Ansuran/Berfasa',
  UPL: 'Utiliti Pembatalan Lesen',
  UPP: 'Utiliti Pembatalan Permohonan',
  UPS_PLP: 'Utiliti Penyediaan Surat',
  USP: 'Utiliti Jana Surat Peringatan Pembayaran Lesen/ Permit/ Pajakan',
};

// The three union passes — mirrors redmine-board.js FILTERS (a mislabelled module must
// never hide a ticket; assigned_to=me is the safety net).
const PASSES = [
  'cf_17=Pelupusan',
  'cf_77=' + encodeURIComponent('Awam Pelupusan'),
  'assigned_to_id=me',
];

// Resolve toward the main repo when running from a worktree (same logic as
// adhoc-register.check.hook.js — the knowledge tree is gitignored, main working tree only).
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
function mainRepoRoot() {
  const marker = path.join('.claude', 'worktrees');
  const idx = ROOT.indexOf(marker);
  return idx > 0 ? ROOT.slice(0, idx).replace(/[\\/]+$/, '') : ROOT;
}
const OUT_DIR = path.join(mainRepoRoot(), 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka', 'urusan');

function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers: { 'X-Redmine-API-Key': REDMINE_KEY } }, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('timeout ' + url)));
  });
}

async function pullPass(filter) {
  const out = [];
  let offset = 0, total = Infinity;
  while (offset < total) {
    const url = `${REDMINE_BASE}/issues.json?key=${REDMINE_KEY}&project_id=${PROJECT}&status_id=*&limit=100&offset=${offset}&${filter}`;
    const page = await get(url);
    total = page.total_count;
    out.push(...page.issues);
    offset += 100;
  }
  return out;
}

function cf(issue, id) {
  const f = (issue.custom_fields || []).find((c) => c.id === id);
  const v = f && f.value;
  if (!v || v === '-Please Select-' || v === '-Sila Pilih-') return '';
  return String(v).trim();
}

const PERMOHONAN_RE = /\bPTMLK\/\d+\/[A-Z]{1,3}\/([A-Z0-9_]{2,10})\/\d{4}\/\d+/;
const NAMA_TO_KOD = Object.fromEntries(Object.entries(URUSAN).map(([k, n]) => [n.toLowerCase(), k]));
const LONG_KODS = Object.keys(URUSAN).filter((k) => k.length >= 3).sort((a, b) => b.length - a.length);

function classify(issue) {
  // 1. cf_33 Urusan field
  const cf33 = cf(issue, 33);
  if (cf33) {
    const up = cf33.toUpperCase();
    if (URUSAN[up]) return { kod: up, via: 'cf33' };
    const byNama = NAMA_TO_KOD[cf33.toLowerCase()];
    if (byNama) return { kod: byNama, via: 'cf33' };
    const contains = Object.entries(NAMA_TO_KOD).find(([n]) => cf33.toLowerCase().includes(n) || n.includes(cf33.toLowerCase()));
    if (contains) return { kod: contains[1], via: 'cf33' };
  }
  const hay = (issue.subject || '') + '\n' + ((issue.description || '').slice(0, 600));
  // 2. Permohonan-ID pattern
  const m = hay.match(PERMOHONAN_RE);
  if (m && URUSAN[m[1]]) return { kod: m[1], via: 'permohonan-id' };
  // 3. kod keyword (length >= 3, longest first)
  const hayUp = hay.toUpperCase();
  for (const k of LONG_KODS) {
    if (new RegExp('\\b' + k.replace(/[^A-Z0-9_]/g, '') + '\\b').test(hayUp)) return { kod: k, via: 'keyword' };
  }
  return { kod: null, via: m ? 'permohonan-id-unknown-kod:' + m[1] : 'none' };
}

function clip(s, max) {
  const one = String(s || '').replace(/\s+/g, ' ').replace(/\|/g, '/').trim();
  return one.length > max ? one.slice(0, max - 1) + '…' : one;
}

function row(i) {
  const root = clip(cf(i, 94) || cf(i, 73), 160);
  return `| [#${i.id}](${REDMINE_BASE}/issues/${i.id}) | ${clip(i.tracker && i.tracker.name, 28)} | ${clip(i.status && i.status.name, 18)} | ${clip(i.subject, 110)} | ${(i.created_on || '').slice(0, 10)} | ${cf(i, 67) || ''} | ${root} |`;
}

const HEADER = '| Ticket | Tracker | Status | Subject | Raised | Closed | Root cause (DEV, else BA) |\n|---|---|---|---|---|---|---|';

function docFor(kod, issues, stamp) {
  const open = issues.filter((i) => !/closed|resolved|rejected|cancel/i.test(i.status && i.status.name || ''));
  const lines = [
    `# ${kod} — Redmine Ticket History (${URUSAN[kod] || 'unclassified'})`,
    '',
    `> **SCOPE**: every helpdesk_melaka ticket classified to urusan **${kod}** — the precedent index. Read at Phase 0 BEFORE tracing: has this urusan seen this symptom / screen / requirement before?`,
    `> **NOT FOR**: root-cause detail (that lives in the ticket's QA doc / BUG-BESTIARY.md) or test data (TEST-PERMOHONAN-INDEX.md).`,
    `> **REGENERATED — do not hand-edit rows**: \`node domain/urusan-tickets/urusan-tickets.js\` rebuilds this file from Redmine (office network). Hand-written notes go BELOW the marker at the bottom; they survive regeneration.`,
    '',
    `Last regenerated: ${stamp} · tickets: ${issues.length} (open: ${open.length})`,
    '',
    HEADER,
    ...issues.sort((a, b) => String(b.updated_on).localeCompare(String(a.updated_on))).map(row),
    '',
  ];
  return lines.join('\n');
}

const NOTES_MARKER = '<!-- MANUAL NOTES BELOW — everything under this line survives regeneration -->';

function writeDocPreservingNotes(file, generated) {
  let notes = '';
  if (fs.existsSync(file)) {
    const old = fs.readFileSync(file, 'utf8');
    const at = old.indexOf(NOTES_MARKER);
    if (at >= 0) notes = old.slice(at);
  }
  if (!notes) notes = NOTES_MARKER + '\n';
  fs.writeFileSync(file, generated + '\n' + notes);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const byId = new Map();
  for (const p of PASSES) {
    const issues = await pullPass(p);
    for (const i of issues) byId.set(i.id, i);
    console.log(`pass ${decodeURIComponent(p)}: ${issues.length} (union so far: ${byId.size})`);
  }
  const all = [...byId.values()];
  const buckets = new Map();
  const unclassified = [];
  for (const i of all) {
    const c = classify(i);
    if (c.kod) {
      if (!buckets.has(c.kod)) buckets.set(c.kod, []);
      buckets.get(c.kod).push(i);
    } else {
      unclassified.push(i);
    }
  }
  const stamp = new Date().toISOString().slice(0, 10);
  const counts = [...buckets.entries()].sort((a, b) => b[1].length - a[1].length);
  console.log(`\nclassified: ${all.length - unclassified.length}/${all.length} into ${buckets.size} urusan · unclassified: ${unclassified.length}`);
  for (const [k, v] of counts) console.log(`  ${k.padEnd(8)} ${v.length}`);
  if (dryRun) return;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [kod, issues] of buckets) {
    writeDocPreservingNotes(path.join(OUT_DIR, `${kod}-TICKETS.md`), docFor(kod, issues, stamp));
  }
  const unDoc = [
    '# _UNCLASSIFIED — tickets no rule could place',
    '',
    '> Tickets from the Pelupusan/Awam-Pelupusan/assigned-to-me union that carry no Urusan field, no Permohonan-ID and no kod keyword. Kept visible so nothing is silently dropped. Improve `classify()` in `domain/urusan-tickets/urusan-tickets.js` as patterns emerge.',
    '',
    `Last regenerated: ${stamp} · tickets: ${unclassified.length}`,
    '',
    HEADER,
    ...unclassified.sort((a, b) => String(b.updated_on).localeCompare(String(a.updated_on))).map(row),
    '',
  ].join('\n');
  writeDocPreservingNotes(path.join(OUT_DIR, '_UNCLASSIFIED.md'), unDoc);

  const idx = [
    '# urusan/ — per-urusan Redmine precedent docs',
    '',
    '> One `<KOD>-TICKETS.md` per urusan. CONSUMER: ticket-gate Phase-0 row 1c. FEEDER: re-run the generator (below) + quest-bounty Step 3 manual notes.',
    '',
    '```',
    'node domain/urusan-tickets/urusan-tickets.js',
    '```',
    '',
    `Last regenerated: ${stamp} · total tickets: ${all.length} · unclassified: ${unclassified.length}`,
    '',
    '| Urusan | Nama | Tickets |',
    '|---|---|---|',
    ...counts.map(([k, v]) => `| [${k}](${k}-TICKETS.md) | ${clip(URUSAN[k], 70)} | ${v.length} |`),
    `| [_UNCLASSIFIED](_UNCLASSIFIED.md) | — | ${unclassified.length} |`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, '_INDEX.md'), idx);
  try {
    fs.appendFileSync(path.join(__dirname, 'log.jsonl'), JSON.stringify({
      ts: new Date().toISOString(), total: all.length, classified: all.length - unclassified.length,
      unclassified: unclassified.length, docs: buckets.size + 2,
    }) + '\n');
  } catch (_) {}
  console.log(`\nwrote ${buckets.size + 2} docs to ${OUT_DIR}`);
}

main().catch((e) => { console.error('FAILED: ' + e.message); process.exit(1); });
