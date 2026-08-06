/**
 * eval.js — behavioural eval for quest/env-switch.js
 *
 * Round-trips on FIXTURE copies (via ENV_SWITCH_STANDALONE / ENV_SWITCH_ENVPROPS), never on
 * みや's live machine config — an eval that mutates the real standalone.xml would be the
 * defect it is meant to prevent.
 *
 * Run: node domain/env-switch/eval.js
 */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(REPO, 'quest', 'env-switch.js');

const XML_FIXTURE = `<server>
  <subsystem xmlns="urn:jboss:domain:datasources:6.0">
    <datasources>
      <datasource jndi-name="java:jboss/datasources/etanahDS" pool-name="etanahDS" enabled="true" use-java-context="true">
        <connection-url>jdbc:postgresql://172.30.12.202:5444/mlkstg?currentSchema=et_main_stg1</connection-url>
      </datasource>
      <datasource jndi-name="java:jboss/datasources/etanahDS2" pool-name="etanahDS2" enabled="true" use-java-context="true">
        <connection-url>jdbc:postgresql://172.30.12.202:5444/mlkstg?currentSchema=et_main_stg2</connection-url>
      </datasource>
      <datasource jndi-name="java:jboss/datasources/etanahDS3" pool-name="etanahDS3" enabled="true" use-java-context="true">
        <connection-url>jdbc:postgresql://172.16.100.197:5444/mkit?currentSchema=et_main_mlit</connection-url>
      </datasource>
      <datasource jndi-name="java:jboss/datasources/etanahDMSDS" pool-name="etanahDMSDS" enabled="true" use-java-context="true">
        <connection-url>jdbc:postgresql://172.30.12.202:5444/mlkstg?currentSchema=et_dms_stg1</connection-url>
      </datasource>
      <datasource jndi-name="java:jboss/datasources/etanahAuditDS" pool-name="etanahAuditDS" enabled="true" use-java-context="true">
        <connection-url>jdbc:postgresql://172.30.12.202:5444/mlkstg?currentSchema=et_sistem_stg1</connection-url>
      </datasource>
    </datasources>
  </subsystem>
</server>
`;

const PROPS_FIXTURE = [
    '#cas.url=http\\://172.16.100.41/etanah-cas',
    'cas.url=https\\://etanah-appstg.melaka.gov.my/etanah-cas',
    '#cas.url=https\\://mlit.melaka.gov.my/etanah-cas',
    '#cas.url=https\\://etanah-app.melaka.gov.my/etanah-cas',
    'proxy.url=http\\://127.0.0.1:8080',
].join('\n');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-switch-eval-'));
const xmlPath = path.join(dir, 'standalone.xml');
const propsPath = path.join(dir, 'environment.properties');

function reset() {
    fs.writeFileSync(xmlPath, XML_FIXTURE, 'utf-8');
    fs.writeFileSync(propsPath, PROPS_FIXTURE, 'utf-8');
}

function run(args = []) {
    return execFileSync(process.execPath, [SCRIPT, ...args], {
        encoding: 'utf-8',
        env: { ...process.env, ENV_SWITCH_STANDALONE: xmlPath, ENV_SWITCH_ENVPROPS: propsPath },
    });
}
function runFail(args) {
    try { run(args); return null; } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

const results = [];
const check = (name, fn) => {
    try { results.push({ name, pass: !!fn() }); }
    catch (e) { results.push({ name, pass: false, err: e.message.split('\n')[0] }); }
};

const activeSchema = () => (fs.readFileSync(xmlPath, 'utf-8')
    .match(/jndi-name="java:jboss\/datasources\/etanahDS" pool-name="etanahDS"[^>]*>\s*\r?\n\s*<connection-url>[^<]*currentSchema=([A-Za-z0-9_]+)/) || [])[1];
const activeCas = () => (fs.readFileSync(propsPath, 'utf-8').split(/\r?\n/)
    .find((l) => /^\s*cas\.url\s*=/.test(l)) || '');

// 1 — read-only mode reports the active env and mutates nothing
reset();
check('read-only detects stg1 active', () => {
    const before = fs.readFileSync(xmlPath, 'utf-8');
    const out = run();
    return /ACTIVE env \| \*\*stg1\*\*/.test(out) && fs.readFileSync(xmlPath, 'utf-8') === before;
});

// 2 — switch to mlit moves the bare name onto mlit and parks stg1 on the freed suffix
reset();
check('switch stg1 -> mlit swaps the suffix both ways', () => {
    run(['--to', 'mlit']);
    const xml = fs.readFileSync(xmlPath, 'utf-8');
    return activeSchema() === 'et_main_mlit'
        && /etanahDS3" pool-name="etanahDS3"[^>]*>\s*\r?\n\s*<connection-url>[^<]*et_main_stg1/.test(xml)
        && /etanahDS2" pool-name="etanahDS2"/.test(xml);
});

// 3 — cas.url toggles by comment marker, URL text untouched, TRG/proxy lines untouched
check('cas.url switches to the mlit host by comment marker only', () => {
    const props = fs.readFileSync(propsPath, 'utf-8');
    return activeCas().includes('mlit.melaka.gov.my')
        && /^#cas\.url=https\\:\/\/etanah-appstg\.melaka\.gov\.my/m.test(props)
        && props.includes('cas.url=https\\://mlit.melaka.gov.my/etanah-cas')
        && /^proxy\.url=http\\:\/\/127\.0\.0\.1:8080$/m.test(props);
});

// 4 — exactly one cas.url uncommented after a switch
check('exactly one cas.url left uncommented', () => fs.readFileSync(propsPath, 'utf-8')
    .split(/\r?\n/).filter((l) => /^\s*cas\.url\s*=/.test(l)).length === 1);

// 5 — round-trip back to stg1 restores the original bytes
check('round-trip mlit -> stg1 restores both files byte-for-byte', () => {
    run(['--to', 'stg1']);
    return fs.readFileSync(xmlPath, 'utf-8') === XML_FIXTURE
        && fs.readFileSync(propsPath, 'utf-8') === PROPS_FIXTURE;
});

// 6 — already-on-target is a no-op, and says so
reset();
check('already-on-target changes nothing', () => {
    const before = fs.readFileSync(xmlPath, 'utf-8') + fs.readFileSync(propsPath, 'utf-8');
    const out = run(['--to', 'stg1']);
    return /ALREADY ON STG1/.test(out)
        && (fs.readFileSync(xmlPath, 'utf-8') + fs.readFileSync(propsPath, 'utf-8')) === before;
});

// 7 — dry run never writes
reset();
check('--dry writes nothing', () => {
    const before = fs.readFileSync(xmlPath, 'utf-8') + fs.readFileSync(propsPath, 'utf-8');
    const out = run(['--to', 'mlit', '--dry']);
    return /DRY RUN/.test(out)
        && (fs.readFileSync(xmlPath, 'utf-8') + fs.readFileSync(propsPath, 'utf-8')) === before;
});

// 8 — unknown target refuses and writes nothing
reset();
check('unknown target refuses without writing', () => {
    const before = fs.readFileSync(xmlPath, 'utf-8');
    const out = runFail(['--to', 'et_main_uat']);
    return out && /no datasource for target/.test(out) && fs.readFileSync(xmlPath, 'utf-8') === before;
});

// 9 — a target with no cas host mapped refuses BEFORE touching the xml
reset();
check('target with no cas host mapped refuses without writing', () => {
    fs.writeFileSync(xmlPath, XML_FIXTURE.replace('et_main_mlit', 'et_main_trn'), 'utf-8');
    const before = fs.readFileSync(xmlPath, 'utf-8');
    const out = runFail(['--to', 'trn']);
    return out && /no cas host mapped/.test(out) && fs.readFileSync(xmlPath, 'utf-8') === before;
});

// 10 — sidecar mismatch is surfaced, not silently ignored
reset();
check('sidecar DMS/Audit mismatch is surfaced on switch', () => {
    const out = run(['--to', 'mlit']);
    return /etanahDMSDS/.test(out) && /NOT changed/.test(out);
});

fs.rmSync(dir, { recursive: true, force: true });

const passed = results.filter((r) => r.pass).length;
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} — ${r.name}${r.err ? ' :: ' + r.err : ''}`);
console.log(`\n${passed}/${results.length}`);
process.exit(passed === results.length ? 0 : 1);
