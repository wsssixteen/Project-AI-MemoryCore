#!/usr/bin/env node
/**
 * local-test-prep.js — make miya's LOCAL machine ready for a test hand-back, in one run.
 *
 *   node quest/local-test-prep.js --qa <num> --env <stg1|stg2|mlit> --permohonan "<id>[,<id>]"
 *        [--repo etanah-pelupusan|etanah-awam] [--branch <ticket branch>] [--trunk <trunk>] [--dry]
 *
 * It does, in order: (1) switch the local datasource + cas.url to the schema that holds the test
 * data (quest/env-switch.js), (2) place the ticket branch's changed files, uncommitted, on miya's
 * repo, (3) read whether JBoss is running and whether it must restart, (4) write a log row.
 * `check()` re-reads the machine and says whether a test hand-back is backed by a valid run; the
 * test-scenario-login-gate Stop hook calls it, so a hand-back cannot ship without this script.
 *
 * WHY (2026-10-04, #282442): a test row named an MLIT permohonan while the local app read
 * et_main_stg2 and the repo carried none of the ticket's fixes. miya started JBoss and found nothing.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const STANDALONE = process.env.ENV_SWITCH_STANDALONE || 'E:\\Dev\\jboss-7.4-plp-melaka\\standalone\\configuration\\standalone.xml';
// The gate may run from another checkout of this repo than the one that ran the prep, so the
// row it reads lives at one machine-wide path. The copy under domain/env-switch/ is the audit log.
const LOG = process.env.LTP_LOG || path.join(require('os').tmpdir(), 'claude', 'local-test-prep', 'log.jsonl');
const AUDIT_LOG = path.join(ROOT, 'domain', 'env-switch', 'prep-log.jsonl');
const FRESH_MS = 45 * 60 * 1000;
const PERMOHONAN_RE = /\bPT[A-Z]{2,4}\/\d{2}\/[A-Z]\/[A-Z0-9]+\/\d{4}\/\d+\b/g;

const repoDir = (repo) => process.env.LTP_REPO || path.join('E:\\Projects\\Melaka', repo);
const srcDir = (repo) => process.env.LTP_SRC || path.join('E:\\Dev\\etanah-work', repo);

function git(cwd, args, buf) {
    const r = spawnSync('git', ['-C', cwd].concat(args), { encoding: buf ? 'buffer' : 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return { ok: r.status === 0, out: r.stdout, err: String(r.stderr || '') };
}

// Same content? Compared as git blob ids, so a CRLF working copy equals its LF blob.
function sameAsTip(repo, tip, f) {
    const target = path.join(repoDir(repo), f);
    if (!fs.existsSync(target)) return false;
    const want = git(srcDir(repo), ['rev-parse', '--verify', '--quiet', tip + ':' + f]);
    const have = git(repoDir(repo), ['hash-object', '--path', f, '--', target]);
    return want.ok && have.ok && want.out.trim() === have.out.trim();
}

function activeSchema() {
    const xml = fs.readFileSync(STANDALONE, 'utf-8');
    const m = xml.match(/<datasource jndi-name="java:jboss\/datasources\/etanahDS" pool-name="etanahDS"[^>]*>\s*\r?\n\s*<connection-url>([^<]+)</);
    return m ? ((m[1].match(/currentSchema=([A-Za-z0-9_]+)/) || [])[1] || null) : null;
}

// A datasource whose pool-name differs from its jndi name is invisible to env-switch.js.
function poolNameMismatches() {
    const xml = fs.readFileSync(STANDALONE, 'utf-8');
    const bad = [];
    const re = /<datasource jndi-name="java:jboss\/datasources\/(etanahDS\d*)" pool-name="([^"]+)"/g;
    for (let m; (m = re.exec(xml));) if (m[1] !== m[2]) bad.push(m[1] + ' has pool-name ' + m[2]);
    return bad;
}

function jbossState() {
    if (process.env.LTP_JBOSS) return process.env.LTP_JBOSS;
    const r = spawnSync('powershell', ['-NoProfile', '-Command',
        "(Get-CimInstance Win32_Process -Filter \"Name like 'java%'\" | Where-Object { $_.CommandLine -like '*jboss*' } | Measure-Object).Count"], { encoding: 'utf8' });
    return parseInt(String(r.stdout).trim(), 10) > 0 ? 'running' : 'stopped';
}

// A JBoss that started before the config was last written still holds the old database.
function jbossStartedBeforeConfig() {
    if (process.env.LTP_JBOSS_STALE) return process.env.LTP_JBOSS_STALE === 'yes';
    if (process.env.LTP_JBOSS) return false;
    const r = spawnSync('powershell', ['-NoProfile', '-Command',
        "(Get-CimInstance Win32_Process -Filter \"Name like 'java%'\" | Where-Object { $_.CommandLine -like '*jboss*' } | Sort-Object CreationDate | Select-Object -First 1).CreationDate.ToUniversalTime().ToString('o')"], { encoding: 'utf8' });
    const started = Date.parse(String(r.stdout).trim());
    return Number.isFinite(started) && started < fs.statSync(STANDALONE).mtimeMs;
}

// The quest block, through the CLI that knows where active.txt lives (it is absent from worktrees).
// Returns null when the quest has no block, '' when the block has no such field.
function blockField(qa, field) {
    if (process.env.LTP_BLOCK !== undefined) return process.env.LTP_BLOCK === 'none' ? null : process.env.LTP_BLOCK;
    const r = spawnSync(process.execPath, [path.join(__dirname, 'active-cli.js'), 'read', 'QA-' + qa], { encoding: 'utf8' });
    if (r.status !== 0 || !/^qa=/m.test(r.stdout)) return null;
    return ((r.stdout.match(new RegExp('^' + field + '=(.*)$', 'm')) || [])[1] || '').trim();
}

// The ticket's changed files: where each stands on miya's repo, and (unless dry) place the missing ones.
function fixFiles(repo, branch, trunk, dry) {
    const res = { total: 0, present: [], placed: [], conflict: [], tip: '', note: '' };
    if (!branch) { res.note = 'no ticket branch yet'; return res; }
    const src = srcDir(repo), dst = repoDir(repo);
    const tip = git(src, ['rev-parse', '--verify', '--quiet', 'origin/' + branch]);
    if (!tip.ok) { res.note = 'branch origin/' + branch + ' not found in ' + src; res.conflict.push('(branch)'); return res; }
    res.tip = tip.out.trim();
    const base = git(src, ['merge-base', 'origin/' + trunk, res.tip]);
    if (!base.ok) { res.note = 'no merge-base with origin/' + trunk; res.conflict.push('(trunk)'); return res; }
    const files = git(src, ['diff', '--name-only', '--diff-filter=AM', base.out.trim(), res.tip]).out.split(/\r?\n/).filter(Boolean);
    res.total = files.length;
    for (const f of files) {
        const want = git(src, ['show', res.tip + ':' + f], true);
        const target = path.join(dst, f);
        if (sameAsTip(repo, res.tip, f)) { res.present.push(f); continue; }
        // Safe to place only when the local file is exactly the trunk copy. Blob ids, not `git status`:
        // status flags a CRLF copy of an unchanged file as modified.
        const baseId = git(src, ['rev-parse', '--verify', '--quiet', base.out.trim() + ':' + f]);
        const exists = fs.existsSync(target);
        const haveId = exists ? git(dst, ['hash-object', '--path', f, '--', target]) : { ok: false, out: '' };
        const untouched = baseId.ok ? (haveId.ok && haveId.out.trim() === baseId.out.trim()) : !exists;
        if (!untouched || !want.ok) { res.conflict.push(f); continue; }
        if (!dry) {
            // Keep the local file's own line endings so the placed file shows only the fix as a diff.
            const CRLF = Buffer.from([13, 10]);
            const crlf = fs.existsSync(target) && fs.readFileSync(target).includes(CRLF);
            const body = crlf && !want.out.includes(CRLF) ? Buffer.from(want.out.toString('latin1').split(String.fromCharCode(10)).join(String.fromCharCode(13, 10)), 'latin1') : want.out;
            fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, body);
        }
        res.placed.push(f);
    }
    return res;
}

function lastRow() {
    if (!fs.existsSync(LOG)) return null;
    const lines = fs.readFileSync(LOG, 'utf-8').split(/\r?\n/).filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) { try { const r = JSON.parse(lines[i]); if (r.action === 'prep' && !r.dry) return r; } catch (_) { /* skip */ } }
    return null;
}

/** Is a test hand-back naming these permohonan ids backed by a valid, still-true prep run? */
function check(ids) {
    const row = lastRow();
    if (!row) return { ok: false, reason: 'local-test-prep never ran' };
    if (Date.now() - Date.parse(row.ts) > FRESH_MS) return { ok: false, reason: 'last prep run is older than 45 minutes (' + row.ts + ')' };
    if (!row.ok) return { ok: false, reason: 'last prep run did not finish clean: ' + (row.problem || 'see its output') };
    const now = activeSchema();
    if (now !== row.schema) return { ok: false, reason: 'local app reads ' + now + ' but the prep run set ' + row.schema };
    const missing = (ids || []).filter((id) => !(row.permohonan || []).includes(id));
    if (missing.length) return { ok: false, reason: 'permohonan not covered by the prep run: ' + missing.join(', ') };
    for (const f of row.fix_files || []) {
        if (!sameAsTip(row.repo, row.tip, f)) return { ok: false, reason: 'fix file no longer on the local repo: ' + f };
    }
    return { ok: true, row };
}

function main() {
    const arg = (n) => { const i = process.argv.indexOf('--' + n); return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : ''; };
    const dry = process.argv.includes('--dry');
    const qa = arg('qa').replace(/^QA-/, ''), env = arg('env');
    const ids = (arg('permohonan').match(PERMOHONAN_RE) || []);
    if (process.argv.includes('--check')) { const c = check(ids); console.log(JSON.stringify(c.ok ? { ok: true } : c)); process.exit(c.ok ? 0 : 2); }
    if (!qa || !env || !ids.length) { console.error('usage: node quest/local-test-prep.js --qa <num> --env <stg1|stg2|mlit> --permohonan "<id>[,<id>]" [--repo <repo>] [--branch <b> | --no-branch] [--trunk <t>] [--dry]'); process.exit(1); }

    const repo = arg('repo') || 'etanah-pelupusan';
    const noBranch = process.argv.includes('--no-branch');
    const fromBlock = arg('branch') || noBranch ? '' : blockField(qa, 'branch');
    const branch = arg('branch') || fromBlock || '';
    const trunk = arg('trunk') || (branch.includes('/') ? branch.split('/')[0] + '/master' : 'master');
    const before = activeSchema();
    const problems = [];
    if (!arg('branch') && !noBranch && fromBlock === null) problems.push('quest block for #' + qa + ' not found, so the ticket branch is unknown: pass --branch <ticket branch>, or --no-branch when no fix exists yet');

    const sw = spawnSync(process.execPath, [path.join(__dirname, 'env-switch.js'), '--to', env].concat(dry ? ['--dry'] : []), { encoding: 'utf8', env: process.env });
    if (sw.status !== 0) {
        const mm = poolNameMismatches();
        problems.push('env switch failed: ' + String(sw.stderr || sw.stdout).trim().split(/\r?\n/)[0] + (mm.length ? ' (standalone.xml: ' + mm.join('; ') + ', pool-name must equal the jndi name)' : ''));
    }
    const schema = dry ? 'et_main_' + env : activeSchema();
    const switched = before !== schema;

    const fx = fixFiles(repo, branch, trunk, dry);
    if (fx.conflict.length) problems.push('fix files NOT placed (local file differs from the trunk copy, left untouched): ' + fx.conflict.join(', ') + (fx.note ? ' — ' + fx.note : ''));

    const jboss = jbossState();
    const javaPlaced = fx.placed.some((f) => /\.java$/.test(f));
    const stale = jboss === 'running' && jbossStartedBeforeConfig();
    const restart = jboss === 'running' && (switched || fx.placed.length > 0 || stale);
    const ok = problems.length === 0;

    const row = { ts: new Date().toISOString(), action: 'prep', dry, qa, env, schema, permohonan: ids, repo, branch, tip: fx.tip,
        fix_files: fx.present.concat(fx.placed), placed: fx.placed, conflict: fx.conflict, jboss, restart, ok, problem: problems.join(' | ') };
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, JSON.stringify(row) + '\n');

    console.log('═══ LOCAL TEST PREP — #' + qa + (dry ? ' (dry run)' : '') + ' ═══\n');
    console.log('| Step | Result |\n|---|---|');
    console.log('| Database | ' + (switched ? before + ' → ' + schema : schema + ' (already active)') + ' |');
    console.log('| Fix files on local repo | ' + (fx.total ? (fx.present.length + fx.placed.length) + '/' + fx.total + ' (' + fx.placed.length + ' placed now, uncommitted)' : 'none — ' + (fx.note || 'branch has no change')) + ' |');
    console.log('| JBoss | ' + jboss + (restart ? ' — MUST restart' + (javaPlaced ? ' + publish (Java changed)' : '') + (stale && !switched ? ' (it started before the database switch)' : '') : '') + ' |');
    for (const p of problems) console.log('| 🚨 Problem | ' + p + ' |');
    console.log('\nLOCAL-TEST-PREP: #' + qa + ' · env ' + schema + ' · fixes ' + (fx.present.length + fx.placed.length) + '/' + fx.total + ' · jboss ' + jboss + ' · restart ' + (restart ? 'yes' : 'no') + (ok ? '' : ' · NOT READY'));
    process.exit(ok ? 0 : 2);
}

module.exports = { check, PERMOHONAN_RE };
if (require.main === module) main();
