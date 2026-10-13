// system-audit: skip-ghost-check — eval harness, run by hand or by lib/eval-battery.js, NOT an event hook
// system-audit.eval.js — v1.2 (2026-10-06): the audit runs in full only when something it reads changed, or once a day.
// What must hold: (1) a full run prints exactly what the audit printed before, plus the three small scripts it now
// runs; (2) an unchanged start is fast and says how many findings stand; (3) ANY change to a hook file, the
// settings, a bundle, CLAUDE.md or the architecture doc brings the full audit back; (4) a new day brings it back;
// (5) a broken cache can only cause a full run, never silence.
// Read-only on the repo: only a temp cache file is written (SYSTEM_AUDIT_CACHE).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'system-audit.js');
const ROOT = path.resolve(__dirname, '..', '..');
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-eval-'));
const CACHE = path.join(tmp, 'cache.json');
const env = { ...process.env, SYSTEM_AUDIT_CACHE: CACHE };
const run = (...args) => { const t = Date.now(); const r = spawnSync(process.execPath, [HOOK, ...args], { input: '{}', encoding: 'utf8', timeout: 120000, env }); r.ms = Date.now() - t; return r; };
const isFull = o => /system-audit(?: findings \(Layer 0 structural integrity\)|: PASS)/.test(o) && /boot-required-read-gate: \d+ refs/.test(o);
const cache = () => { try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch (_) { return null; } };

// 1. no cache → full
let a = run();
check('F1 first run (no cache): the full audit, exit 0', a.status === 0 && isFull(a.stdout), a.stdout.slice(0, 160));
check('F2 a full run also prints the pointer check that left session start (refs line + verdict line)', /boot-required-read-gate: \d+ refs — \d+ resolve/.test(a.stdout));
const c1 = cache();
check('F3 it records the fingerprint, the time and the finding count', !!c1 && /^[0-9a-f]{40}$/.test(c1.fp) && typeof c1.at === 'number' && Number.isInteger(c1.findings), JSON.stringify(c1));
const nFind = c1 ? c1.findings : -1;
const listed = (a.stdout.match(/^ {2}\S/gm) || []).length;

// 2. unchanged → fast path
let b = run();
check('F4 second run, nothing changed: no full audit', b.status === 0 && !isFull(b.stdout), b.stdout.slice(0, 160));
check('F5 it states the standing finding count and how to get the full list (or is silent when the count is 0)', nFind > 0 ? new RegExp('system-audit: ' + nFind + ' finding\\(s\\), unchanged since the full run at \\d\\d:\\d\\d').test(b.stdout) && /node \.claude\/hooks\/system-audit\.js --full/.test(b.stdout) : b.stdout === '', b.stdout);
check('F6 the unchanged run is at least 3 times faster than the full run', b.ms * 3 < a.ms, b.ms + ' ms vs ' + a.ms + ' ms');
check('F7 the unchanged run leaves the cache as it was', JSON.stringify(cache()) === JSON.stringify(c1));

// 3. --full → full, identical text
let f = run('--full');
check('F8 --full prints the full audit again, byte-for-byte the same as the first run', f.status === 0 && f.stdout === a.stdout, 'len ' + f.stdout.length + ' vs ' + a.stdout.length);

// 4. what brings the full audit back
const withCache = (mut, fn) => { const c = cache(); fs.writeFileSync(CACHE, JSON.stringify(mut(c))); const r = fn(); return r; };
let d = withCache(c => ({ ...c, fp: '0'.repeat(40) }), () => run());
check('F9 a different fingerprint (something it reads changed) → the full audit', isFull(d.stdout) && d.stdout === a.stdout);
check('F10 and the cache is brought up to date again', cache().fp === c1.fp);
d = withCache(c => ({ ...c, at: Date.now() - 26 * 3600 * 1000 }), () => run());
check('F11 a cache from yesterday → the full audit (first start of the day)', isFull(d.stdout));
fs.writeFileSync(CACHE, '{ broken');
d = run();
check('F12 a corrupt cache → the full audit, never silence', isFull(d.stdout));
fs.writeFileSync(CACHE, JSON.stringify({ fp: c1.fp }));
d = run();
check('F13 a cache with no time → the full audit', isFull(d.stdout));
fs.rmSync(CACHE, { force: true });
const bad = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 120000, env: { ...process.env, SYSTEM_AUDIT_CACHE: path.join(tmp, 'no', 'such', 'dir', 'c.json') } });
check('F14 a cache that cannot be written → still the full audit, exit 0', bad.status === 0 && isFull(bad.stdout));

// 5. the fingerprint covers every file kind the audit reads (checked on the source: a stat list is the contract)
const src = fs.readFileSync(HOOK, 'utf8');
const fpBody = src.slice(src.indexOf('function fingerprint()'), src.indexOf('const dayOf'));
for (const [what, rx] of [['settings.json', /SETTINGS_JSON/], ['settings.local.json', /SETTINGS_LOCAL/], ['CLAUDE.md', /CLAUDE_MD/], ['system-architecture.md', /SYSTEM_ARCH/], ['every .js in .claude/hooks', /readdirSync\(HOOKS_DIR\)/], ['every *.hook.js under domain/', /\\\.hook\\\.js\$/], ['bundle manifests', /'bundles'/]]) {
  check('F15 fingerprint includes ' + what, rx.test(fpBody));
}
// a real change, on a temp copy of one input: a new hook file name changes the fingerprint
const probe = path.join(ROOT, '.claude', 'hooks', 'zz-eval-probe-' + process.pid + '.js');
run();                                                    // settle the cache
const settled = cache().fp;
fs.writeFileSync(probe, '// system-audit: skip-ghost-check — eval probe, removed at once\n');
let p;
try { p = run(); } finally { fs.rmSync(probe, { force: true }); }
check('F16 a NEW hook file on disk → the full audit runs at the next start', isFull(p.stdout) && cache().fp !== settled, p.stdout.slice(0, 120));
p = run();
check('F17 after the probe is removed the fingerprint differs again → full audit, then it settles back', isFull(p.stdout) && cache().fp === settled);

// 6. registration: the three scripts left session start and are run by the audit
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
const boot = (settings.hooks.SessionStart || []).flatMap(g => g.hooks.map(h => h.command)).join('\n');
check('F18 system-audit itself is still registered at SessionStart', /system-audit\.js/.test(boot));
for (const f of ['boot-required-read-gate', 'evolution-check-trigger', 'system-check-trigger']) {
  check('F19 ' + f + ': not at SessionStart, named in the audit\'s full-run list, file present, opted out of the ghost check', !new RegExp(f).test(boot) && src.includes("'" + f + ".js'") && fs.existsSync(path.join(ROOT, '.claude', 'hooks', f + '.js')) && /system-audit:\s*skip-ghost-check/.test(fs.readFileSync(path.join(ROOT, '.claude', 'hooks', f + '.js'), 'utf8')));
}
check('F20 none of the three is reported as a ghost hook by the full audit', !/GHOST[^\n]*(boot-required-read-gate|evolution-check-trigger|system-check-trigger)/i.test(a.stdout));
const cut = a.stdout.indexOf('boot-required-read-gate:');
check('F21 the audit text comes first and whole (header to its closing line), the small scripts after it', cut > 0 && /system-audit/.test(a.stdout.slice(0, cut)) && (nFind === 0 || /\(advisory — does not block boot\./.test(a.stdout.slice(0, cut))), String(cut));

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nsystem-audit.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
