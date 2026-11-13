#!/usr/bin/env node
// ticket-close-block.eval — pins the exact --alter note (ALTER-TICKET-PLAYBOOK §5.1 points here).
// Runs a copy of the script in a temp folder, so the real log.jsonl gets no test rows.
// node domain/ticket-close-block/ticket-close-block.eval.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const sb = fs.mkdtempSync(path.join(os.tmpdir(), 'tcb-eval-'));
for (const f of ['ticket-close-block.js', 'ba-names.json']) fs.copyFileSync(path.join(__dirname, f), path.join(sb, f));
const run = args => {
  const r = spawnSync(process.execPath, [path.join(sb, 'ticket-close-block.js'), ...args], { encoding: 'utf8' });
  return { out: (r.stdout || '').replace(/\r\n/g, '\n'), err: r.stderr || '', status: r.status };
};
let pass = 0, total = 0;
function check(name, ok, detail) {
  total++; if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + String(detail).slice(0, 300).replace(/\n/g, '\\n')}`);
}

// F1 alter only
let r = run(['--alter', '--ticket', '284775', '--ba', 'Nurhafizah Hasan', '--id', 'PTMLK/02/L/PT/2026/343', '--tugasan', 'Penyediaan Borang 4Ae', '--user', 'irwanf@melaka.gov.my']);
const want1 = [
  'Salam Fizah, have altered as below. Can proceed to verify.',
  '',
  '<pre>',
  'ID Permohonan: PTMLK/02/L/PT/2026/343',
  'Tugasan: Penyediaan Borang 4Ae',
  'User ID: irwanf@melaka.gov.my',
  '</pre>',
  '',
  'Thank you.',
  '',
].join('\n');
check('F1 alter only: exact note, exit 0, no warning', r.status === 0 && r.out === want1 && !/warn/.test(r.err), r.out + ' | ' + r.err);

// F2 patch + alter with --resit and --prod-script (a path: only its file name is printed)
r = run(['--alter', '--ticket', '288533', '--ba', 'mira', '--id', 'PTMLK/02/L/PRBB/2026/9', '--tugasan', 'Semakan Permohonan', '--user', 'aminah@melaka.gov.my',
  '--resit', 'R100, R101', '--patched', '--prod-script', 'C:\\Tasks\\2. Fix\\288533.sql']);
const want2 = [
  'Salam Mira, have patched the data and altered as below. Can proceed to verify.',
  '',
  '<pre>',
  'ID Permohonan: PTMLK/02/L/PRBB/2026/9',
  'No. Resit: R100, R101',
  'Tugasan: Semakan Permohonan',
  'User ID: aminah@melaka.gov.my',
  '</pre>',
  '',
  'Attached is the script for PROD (288533.sql).',
  '',
  'Thank you.',
  '',
].join('\n');
check('F2 patch+alter with --resit and --prod-script: exact note, BA name case-insensitive', r.status === 0 && r.out === want2, r.out);

// F3 unknown BA: warning on stderr, greeted as given, still exit 0
r = run(['--alter', '--ticket', '1', '--ba', 'Zulaikha', '--id', 'X/1', '--tugasan', 'T', '--user', 'u@melaka.gov.my']);
check('F3 unknown BA prints a warning and greets the name as given', r.status === 0 && /warn: no short name for "Zulaikha"/.test(r.err) && r.out.startsWith('Salam Zulaikha, have altered as below.'), r.out + ' | ' + r.err);

// F4 missing args: exit 1, names each missing flag, prints no note
r = run(['--alter', '--ticket', '1', '--ba', 'Fizah']);
check('F4 missing args exit 1 and name --id --tugasan --user', r.status === 1 && /--alter needs: --id --tugasan --user/.test(r.err) && r.out === '', r.status + ' ' + r.err);

// F5 a flag given with no value counts as missing
r = run(['--alter', '--ticket', '1', '--ba', 'Fizah', '--id', 'X/1', '--tugasan', 'T', '--user']);
check('F5 --user with no value -> exit 1', r.status === 1 && /--user/.test(r.err), r.status + ' ' + r.err);

// F6 every --alter run writes one log row (the monitoring layer)
const rows = fs.readFileSync(path.join(sb, 'log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
check('F6 log rows: one per printed note, mode alter, patched flag kept', rows.length === 3 && rows.every(x => x.mode === 'alter' && x.outcome === 'printed') && rows[1].patched === true && rows[0].patched === false, JSON.stringify(rows));

// ── one non-merge commit per cycle (2026-11-05, #287811: five failed commits reached origin before the note) ──
const { execFileSync } = require('child_process');
const g = (cwd, args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const repo = path.join(sb, 'repo'); fs.mkdirSync(repo);
g(repo, ['init', '-q']); g(repo, ['config', 'user.email', 'ridhwan@x']); g(repo, ['config', 'user.name', 'Ridhwan']);
fs.writeFileSync(path.join(repo, 'a.txt'), '1\n'); g(repo, ['add', '-A']); g(repo, ['commit', '-q', '-m', 'base']);
g(repo, ['branch', '-m', 'mlk/master']);
g(repo, ['checkout', '-q', '-b', 'mlk/internal/287811']);
fs.writeFileSync(path.join(repo, 'a.txt'), '2\n'); g(repo, ['commit', '-q', '-am', 'Ref #287811 - fix 1']);
fs.writeFileSync(path.join(repo, 'a.txt'), '3\n'); g(repo, ['commit', '-q', '-am', 'Ref #287811 - fix 2']);
const note = extra => run(['--repo', repo, '--ticket', '287811', '--module', 'pelupusan', '--branch', 'mlk/internal/287811', '--ba', 'mira', ...(extra || [])]);
r = note();
check('F7 two non-merge commits in cycle 1 -> refused exit 3, names the count and origin-rewrite', r.status === 3 && /2 non-merge commits/.test(r.err) && /origin-rewrite/.test(r.err) && !/Salam/.test(r.out), r.status + ' ' + r.err.slice(0, 200));
r = note(['--multi-ok', 'miya 2026-11-05: keep both, he said so']);
check('F8 --multi-ok "<his words>" -> note printed, exit 0', r.status === 0 && /Salam Mira/.test(r.out), r.status + ' ' + r.err.slice(0, 120));
g(repo, ['reset', '-q', '--soft', 'mlk/master']); g(repo, ['commit', '-q', '-m', 'Ref #287811 - one commit']);
r = note();
check('F9 squashed to one commit -> note printed, exit 0', r.status === 0 && /Salam Mira/.test(r.out) && /one commit/.test(r.out), r.status + ' ' + r.err.slice(0, 120));
g(repo, ['checkout', '-q', 'mlk/master']); fs.writeFileSync(path.join(repo, 'b.txt'), 'm\n'); g(repo, ['add', '-A']); g(repo, ['commit', '-q', '-m', 'master moves']);
g(repo, ['checkout', '-q', 'mlk/internal/287811']); g(repo, ['merge', '-q', '--no-edit', 'mlk/master']);
r = note();
check('F10 a master merge on the branch is not counted -> exit 0', r.status === 0 && /Salam Mira/.test(r.out), r.status + ' ' + r.err.slice(0, 120));
const rows2 = fs.readFileSync(path.join(sb, 'log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
check('F11 log carries refused-multi-commit (n=2, cycles=1) and multi-ok rows', rows2.some(x => x.outcome === 'refused-multi-commit' && x.n === 2 && x.cycles === 1) && rows2.some(x => x.outcome === 'multi-ok'), JSON.stringify(rows2.slice(-5)));

// ── --patch: the note is read off the patch itself (2026-11-11, 288974: a hand-written note said "tidak diubah"
//    about a permohonan whose link the script had removed). fixtures/ = the real shipped scripts. ──
const fx = n => path.join(__dirname, 'fixtures', n);
const tmpSql = (n, body) => { const p = path.join(sb, n); fs.writeFileSync(p, body); return p; };
const pre = out => (out.split('<pre>\n')[1] || '').split('\n</pre>')[0];

r = run(['--patch', '--ticket', '288974', '--ba', 'Nurhafizah Hasan', '--sql', fx('288974.sql'), '--was', 'hubungan_aplikasi_id=PTMLK/02/L/PPTPB/2026/9', '--tugasan', 'Penyediaan Surat', '--user', 'norlina@melaka.gov.my']);
const wantP1 = [
  'Salam Fizah, have patched as below. Can proceed to verify.',
  '',
  '<pre>',
  'ID Permohonan: PTMLK/02/L/UPS_PLP/2026/15',
  'Status: Tamat (Batal)',
  'Link to PTMLK/02/L/PPTPB/2026/9: removed',
  'Tugasan Penyediaan Surat: closed, removed from Senarai Tugasan of norlina@melaka.gov.my',
  '</pre>',
  '',
  'Thank you.',
  '',
].join('\n');
check('P1 288974 as shipped: Status Tamat (Batal), link removed, task closed + off Senarai Tugasan; exact note, no warning', r.status === 0 && r.out === wantP1 && r.err === '', r.out + ' | ' + r.err);
check('P1b the note never says "not changed" / "tidak diubah" about anything', !/not changed|tidak diubah|not touched/i.test(r.out), r.out);

r = run(['--patch', '--ticket', '288974', '--ba', 'Fizah', '--sql', fx('288974.sql')]);
check('P1c link column nulled with no --was: the link line is still printed, and a warning asks for the ID it pointed to', r.status === 0 && /^Link to another permohonan: removed$/m.test(r.out) && /warn: hubungan_aplikasi_id set to NULL/.test(r.err), r.out + ' | ' + r.err);

r = run(['--patch', '--ticket', '288963', '--ba', 'Fizah', '--sql', fx('288963.sql'), '--file', 'Pelan L1e=Pelan Baharu dirotate.pdf', '--user', 'nurulazura@melaka.gov.my']);
check('P2 288963 + --file: Tempat before -> after over both rows, pelan replaced, User ID last', r.status === 0 && r.err === '' && pre(r.out) === [
  'ID Permohonan: PTMLK/02/L/MLPS/2026/12',
  'No. Lesen: A02/2026/27',
  'Tempat: PT 2 -> SEK II (permohonan + lesen asal)',
  'Pelan L1e: replaced with Pelan Baharu dirotate.pdf',
  'User ID: nurulazura@melaka.gov.my',
].join('\n'), r.out + ' | ' + r.err);

r = run(['--patch', '--ticket', '283980', '--ba', 'Fizah', '--sql', fx('283980.sql'), '--was', 'PTMLK/02/L/UPS_PLP/2026/12|hubungan_aplikasi_id=PTMLK/02/L/PPTPB/2026/7', '--was', 'PTMLK/02/L/UPS_PLP/2026/13|hubungan_aplikasi_id=']);
check('P3 283980, two permohonan in one script: both listed, --was per ID (one link removed, one never linked)', r.status === 0 && r.err === '' && pre(r.out) === [
  'ID Permohonan: PTMLK/02/L/UPS_PLP/2026/12',
  'Status: Tamat (Batal)',
  'Link to PTMLK/02/L/PPTPB/2026/7: removed',
  'Tugasan: closed, removed from Senarai Tugasan',
  '',
  'ID Permohonan: PTMLK/02/L/UPS_PLP/2026/13',
  'Status: Tamat (Batal)',
  'Tugasan: closed, removed from Senarai Tugasan',
].join('\n'), r.out + ' | ' + r.err);

const reset = tmpSql('doc.sql', 'UPDATE ET_DMS.DOKUMEN_REVISION SET LOKASI_FAIL_PDF=NULL WHERE DOKUMEN_REVISION_ID=41110560;\n-- 1 row updated\n');
r = run(['--patch', '--ticket', '2', '--ba', 'Fizah', '--id', 'PTMLK/02/L/PT/2026/1', '--sql', reset, '--file', 'Dokumen Surat Kelulusan=Surat Kelulusan baharu.docx']);
check('P4 document replace + PDF reset: one "Dokumen <name>: replaced" line', r.status === 0 && r.err === '' && pre(r.out) === 'ID Permohonan: PTMLK/02/L/PT/2026/1\nDokumen Surat Kelulusan: replaced with Surat Kelulusan baharu.docx', r.out + ' | ' + r.err);
r = run(['--patch', '--ticket', '2', '--ba', 'Fizah', '--id', 'PTMLK/02/L/PT/2026/1', '--sql', reset]);
check('P4b PDF reset with no --file: "Dokumen: replaced" + a warning asking for the name', r.status === 0 && /^Dokumen: replaced$/m.test(r.out) && /warn: lokasi_fail_pdf set to NULL with no --file/.test(r.err), r.out + ' | ' + r.err);
r = run(['--patch', '--ticket', '2', '--ba', 'Fizah', '--id', 'PTMLK/02/L/PT/2026/1', '--file', 'Pelan L1e=Pelan Baharu.pdf']);
check('P4c file-only replace, no script: ID from --id, the file line', r.status === 0 && pre(r.out) === 'ID Permohonan: PTMLK/02/L/PT/2026/1\nPelan L1e: replaced with Pelan Baharu.pdf', r.out + ' | ' + r.err);

r = run(['--patch', '--ticket', '3', '--ba', 'Fizah', '--sql', tmpSql('ins.sql',
  "INSERT INTO et_main.umm_a_bayaran (a_bayaran_id, aplikasi_id, amaun, no_resit, version)\nVALUES (nextval('s'), (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/PT/2026/1'), 50.00, 'R, 1', 0);\n-- 1 row inserted\n")]);
check('P5 an INSERT: the row is listed with its values (ids and version left out), raw table name + a warning', r.status === 0 && pre(r.out) === 'ID Permohonan: PTMLK/02/L/PT/2026/1\numm_a_bayaran row: added (amaun 50.00, no_resit R, 1)' && /warn: no plain word for a row inserted into umm_a_bayaran/.test(r.err), r.out + ' | ' + r.err);

r = run(['--patch', '--ticket', '4', '--ba', 'Fizah', '--sql', tmpSql('unk.sql',
  "UPDATE et_main.umm_a_permohonan_tnh SET tempat = 'SEK II', kod_xyz = NULL WHERE aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/PT/2026/1');\n-- 1 row updated\n")]);
check('P6 unknown column: printed by its raw name, with a warning, never dropped', r.status === 0 && pre(r.out) === 'ID Permohonan: PTMLK/02/L/PT/2026/1\nTempat: SEK II\nkod_xyz: (empty)' && /warn: no plain word for column umm_a_permohonan_tnh\.kod_xyz/.test(r.err), r.out + ' | ' + r.err);

r = run(['--patch', '--ticket', '5', '--ba', 'Fizah', '--sql', tmpSql('ref.sql',
  "UPDATE et_main.ind_tgsn SET nama = 'Semakan Minit Bebas', perihal = 'Semakan Minit Bebas' WHERE kod = 'SMB' AND ursn_id = (SELECT ursn_id FROM et_main.ind_ursn WHERE kod = 'PT');\n-- 1 row updated\n")]);
check('P7 reference-table patch, no permohonan: the row key heads the lines', r.status === 0 && r.err === '' && pre(r.out) === 'kod: SMB\nNama: Semakan Minit Bebas', r.out + ' | ' + r.err);

r = run(['--patch', '--ticket', '6', '--ba', 'Fizah', '--sql', tmpSql('none.sql', "SELECT 1;\n-- 1 row\n")]);
check('P8 nothing changed in the script: exit 1, no note', r.status === 1 && r.out === '' && /found nothing changed/.test(r.err), r.status + ' ' + r.err);
r = run(['--patch', '--ticket', '6', '--sql', fx('288974.sql')]);
check('P8b --ba missing: exit 1, no note', r.status === 1 && r.out === '' && /--patch needs: --ba/.test(r.err), r.status + ' ' + r.err);

r = run(['--alter', '--ticket', '7', '--ba', 'mira', '--id', 'PTMLK/02/L/MLPS/2026/12', '--tugasan', 'Semakan Permohonan', '--user', 'aminah@melaka.gov.my', '--patched', '--sql', fx('288963.sql')]);
check('P9 patch + alter: the patched lines sit under the ID, above the alter lines', r.status === 0 && pre(r.out) === [
  'ID Permohonan: PTMLK/02/L/MLPS/2026/12',
  'No. Lesen: A02/2026/27',
  'Tempat: PT 2 -> SEK II (permohonan + lesen asal)',
  'Tugasan: Semakan Permohonan',
  'User ID: aminah@melaka.gov.my',
].join('\n'), r.out + ' | ' + r.err);

r = run(['--alter', '--ticket', '284775', '--ba', 'Nurhafizah Hasan', '--id', 'PTMLK/02/L/PT/2026/343', '--tugasan', 'Penyediaan Borang 4Ae', '--user', 'irwanf@melaka.gov.my']);
check('P10 --alter with no patch flags is byte for byte what it was (F1)', r.status === 0 && r.out === want1 && r.err === '', r.out + ' | ' + r.err);
const rows3 = fs.readFileSync(path.join(sb, 'log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
check('P11 each printed --patch note writes a log row (mode patch, its IDs, its warning count)', rows3.filter(x => x.mode === 'patch' && x.outcome === 'printed').length === 10 && rows3.some(x => x.mode === 'patch' && x.ids.length === 2) && rows3.some(x => x.mode === 'patch' && x.warns === 1), JSON.stringify(rows3.filter(x => x.mode === 'patch')));

// 289265: MLPS Maksud Pendudukan in plain words (the cleared officer text and kegunaan print nothing); --file "<ID>|..." per permohonan
r = run(['--patch', '--ticket', '289265', '--ba', 'Fizah', '--sql', fx('289265.sql'), '--file', 'PTMLK/02/L/MLPS/2026/7|Pelan=Pelan MLPS 7.pdf', '--file', 'PTMLK/02/L/MLPS/2026/14|Pelan=Pelan Baharu MLPS 14.pdf']);
check('P12 289265: Maksud Pendudukan words, no raw column, no warning, each pelan under its own ID', r.status === 0 && r.err === ''
  && /ID Permohonan: PTMLK\/02\/L\/MLPS\/2026\/8\nMaksud Pendudukan: Tanaman Jagung Mutiara\n/.test(r.out)
  && /ID Permohonan: PTMLK\/02\/L\/MLPS\/2026\/14\nTempat: -\nPelan: replaced with Pelan Baharu MLPS 14\.pdf/.test(r.out)
  && /ID Permohonan: PTMLK\/02\/L\/MLPS\/2026\/7\nPelan: replaced with Pelan MLPS 7\.pdf/.test(r.out)
  && !/tujuan_permohonan|kegunaan/.test(r.out), r.out + ' | ' + r.err);

fs.rmSync(sb, { recursive: true, force: true });
console.log(`\nticket-close-block.eval: ${pass}/${total} ${pass === total ? 'green' : 'RED'}`);
process.exit(pass === total ? 0 : 1);
