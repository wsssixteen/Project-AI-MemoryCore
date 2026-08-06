#!/usr/bin/env node
/*
 * quest/env-switch.js — read or switch the local Melaka test environment.
 *
 * Exists because env switching was model-driven prose in the env-check skill, so its
 * mapping table drifted to decommissioned envs (FAT/UAT) while the machine moved on to
 * stg1/stg2/mlit/trn. A script reads the machine instead of remembering it.
 *
 * The mechanic (みや 2026-08-06): the ACTIVE datasource is the one whose jndi-name and
 * pool-name are the BARE `etanahDS`. Every other candidate parks a numeric suffix.
 * Switching = exchange the suffix between the currently-active block and the target block.
 * cas.url switches by moving the `#` comment marker, never by editing URL text.
 *
 * Usage:
 *   node quest/env-switch.js                 # report current state, change nothing
 *   node quest/env-switch.js --to mlit       # switch to mlit
 *   node quest/env-switch.js --to stg1       # switch to stg1
 *   node quest/env-switch.js --to stg2 --dry # show the edits without writing
 *
 * Targets are discovered from the connection-url schemas present in standalone.xml —
 * nothing is hardcoded except the cas-host map below, which is not derivable from the file.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

// Overridable so the eval can round-trip on fixture copies instead of the live machine config.
const STANDALONE = process.env.ENV_SWITCH_STANDALONE || 'E:\\Dev\\jboss-7.4-plp-melaka\\standalone\\configuration\\standalone.xml';
const ENVPROPS = process.env.ENV_SWITCH_ENVPROPS || 'C:\\etanahv3\\config\\environment.properties';

// Not derivable from standalone.xml: which CAS host fronts which DB schema family.
// stg1 and stg2 share the staging CAS; mlit has its own. TRG hosts are out of scope.
const CAS_HOST = { stg1: 'etanah-appstg.melaka.gov.my', stg2: 'etanah-appstg.melaka.gov.my', mlit: 'mlit.melaka.gov.my' };

const arg = (n) => { const i = process.argv.indexOf('--' + n); return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : ''; };
const hasFlag = (n) => process.argv.includes('--' + n);

function fail(msg) { console.error('ERROR — ' + msg); process.exit(1); }

for (const p of [STANDALONE, ENVPROPS]) if (!fs.existsSync(p)) fail('not found: ' + p);

const xml = fs.readFileSync(STANDALONE, 'utf-8');
const props = fs.readFileSync(ENVPROPS, 'utf-8');

/* ---------- parse standalone.xml datasources ---------- */
// One entry per etanahDS-family datasource: its suffix ('' when active) and its schema.
const DS_RE = /<datasource jndi-name="java:jboss\/datasources\/(etanahDS(\d*))" pool-name="\1"([^>]*)>\s*\r?\n\s*<connection-url>([^<]+)<\/connection-url>/g;
const datasources = [];
for (let m; (m = DS_RE.exec(xml));) {
    const schema = (m[4].match(/currentSchema=([A-Za-z0-9_]+)/) || [])[1] || '(none)';
    datasources.push({ jndi: m[1], suffix: m[2], schema, url: m[4], index: m.index });
}
if (!datasources.length) fail('no etanahDS datasources matched — standalone.xml layout changed, update the regex');

const targetOf = (schema) => (schema.match(/^et_main_(.+)$/) || [])[1] || null;
const active = datasources.find((d) => d.suffix === '');
if (!active) fail('no datasource carries the bare `etanahDS` name — nothing is active');

// Sibling datasources that follow the env but are NOT part of the suffix dance.
const sidecars = [];
for (const name of ['etanahDMSDS', 'etanahAuditDS']) {
    const re = new RegExp('pool-name="' + name + '"[^>]*>\\s*\\r?\\n\\s*<connection-url>([^<]+)<\\/connection-url>');
    const m = xml.match(re);
    if (m) sidecars.push({ name, schema: (m[1].match(/currentSchema=([A-Za-z0-9_]+)/) || [])[1] || '(none)' });
}

/* ---------- parse cas.url ---------- */
const propLines = props.split(/\r?\n/);
const casRows = [];
propLines.forEach((line, i) => {
    const m = line.match(/^(\s*#?\s*)cas\.url\s*=\s*(.+?)\s*$/);
    if (!m) return;
    casRows.push({ lineNo: i + 1, i, commented: /#/.test(m[1]), value: m[2] });
});
const casActive = casRows.find((r) => !r.commented);

const currentEnv = targetOf(active.schema);

/* ---------- report ---------- */
function report(title) {
    console.log('═══ ' + title + ' ═══\n');
    console.log('| Slot | Value |');
    console.log('|---|---|');
    console.log(`| ACTIVE env | **${currentEnv || '(unrecognised)'}** |`);
    console.log(`| etanahDS (bare = active) | ${active.schema} |`);
    for (const d of datasources.filter((x) => x.suffix !== '')) console.log(`| ${d.jndi} (parked) | ${d.schema} |`);
    for (const s of sidecars) {
        const follows = currentEnv && s.schema.endsWith(currentEnv);
        console.log(`| ${s.name} | ${s.schema} ${follows ? '✓ follows active' : '⚠️ does NOT match active env'} |`);
    }
    console.log(`| cas.url active | ${casActive ? casActive.value : '(none uncommented)'} |`);
    console.log('');
}

const to = arg('to').trim();
if (!to) {
    report('ENV STATE — read-only');
    const names = datasources.map((d) => targetOf(d.schema)).filter(Boolean);
    console.log('Switch with: node quest/env-switch.js --to <' + names.join('|') + '>');
    process.exit(0);
}

/* ---------- switch ---------- */
const targetDs = datasources.find((d) => targetOf(d.schema) === to);
if (!targetDs) fail(`no datasource for target "${to}" — available: ` + datasources.map((d) => targetOf(d.schema)).filter(Boolean).join(', '));
if (!CAS_HOST[to]) fail(`no cas host mapped for "${to}" — add it to CAS_HOST in this script`);

if (targetDs.suffix === '') {
    report('ENV ALREADY ON ' + to.toUpperCase() + ' — nothing changed');
    console.log('No edit needed. JBoss restart NOT required.');
    process.exit(0);
}

const movedSuffix = targetDs.suffix; // the number the target parked on goes to the outgoing block
let newXml = xml;
// target: suffixed -> bare
newXml = newXml.replace(
    new RegExp('jndi-name="java:jboss/datasources/etanahDS' + movedSuffix + '" pool-name="etanahDS' + movedSuffix + '"'),
    'jndi-name="java:jboss/datasources/etanahDS" pool-name="etanahDS"');
// outgoing: bare -> the freed number. Anchor on the outgoing block's own schema so we
// cannot accidentally re-hit the block we just renamed.
const outRe = new RegExp('jndi-name="java:jboss/datasources/etanahDS" pool-name="etanahDS"([^>]*>\\s*\\r?\\n\\s*<connection-url>[^<]*currentSchema=' + active.schema + ')');
if (!outRe.test(newXml)) fail('could not locate the outgoing datasource block for ' + active.schema + ' — aborted, no file written');
newXml = newXml.replace(outRe, 'jndi-name="java:jboss/datasources/etanahDS' + movedSuffix + '" pool-name="etanahDS' + movedSuffix + '"$1');

const host = CAS_HOST[to];
let casChanged = null;
const newLines = propLines.slice();
const wanted = casRows.find((r) => r.value.includes(host));
if (!wanted) fail(`no cas.url line mentions ${host} — environment.properties has no line for ${to}`);
for (const r of casRows) {
    const isWanted = r.i === wanted.i;
    if (isWanted && r.commented) {
        newLines[r.i] = newLines[r.i].replace(/^(\s*)#\s*/, '$1');
        casChanged = { from: casActive ? casActive.value : '(none)', to: r.value };
    } else if (!isWanted && !r.commented) {
        newLines[r.i] = newLines[r.i].replace(/^(\s*)/, '$1#');
    }
}

if (hasFlag('dry')) {
    report('DRY RUN — would switch ' + currentEnv + ' → ' + to);
    console.log(`standalone.xml: etanahDS${movedSuffix} (${targetDs.schema}) → etanahDS · etanahDS (${active.schema}) → etanahDS${movedSuffix}`);
    console.log(`environment.properties: cas.url → ${wanted.value}`);
    process.exit(0);
}

const stamp = Date.now();
const backupDir = path.join(os.tmpdir(), 'claude', 'env-switch-backups');
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, `standalone.${stamp}.xml`), xml, 'utf-8');
fs.writeFileSync(path.join(backupDir, `environment.${stamp}.properties`), props, 'utf-8');

fs.writeFileSync(STANDALONE, newXml, 'utf-8');
fs.writeFileSync(ENVPROPS, newLines.join('\n'), 'utf-8');

console.log('═══ ENV SWITCHED — ' + currentEnv + ' → ' + to + ' ═══\n');
console.log('| Change | From | To |');
console.log('|---|---|---|');
console.log(`| etanahDS (active) | ${active.schema} | ${targetDs.schema} |`);
console.log(`| parked suffix ${movedSuffix} | ${targetDs.schema} | ${active.schema} |`);
if (casChanged) console.log(`| cas.url | ${casChanged.from} | ${casChanged.to} |`);
for (const s of sidecars) {
    if (!s.schema.endsWith(to)) console.log(`| ⚠️ ${s.name} | ${s.schema} | NOT changed — still points at ${s.schema} |`);
}
console.log(`\nBackups: ${backupDir}`);
console.log('\nPost-change steps (env-only switch, no rebuild):');
console.log('  1. Stop JBoss completely (no java.exe left)');
console.log('  2. Delete standalone\\tmp\\* and standalone\\data\\*');
console.log('  3. Start JBoss');
console.log('  4. Tail server.log — confirm the datasource URL and the cas.url binding');
