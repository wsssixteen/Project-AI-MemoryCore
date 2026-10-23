#!/usr/bin/env node
// doc-sim.js — runner for the offline template generator (E:\Dev\scripts\EtanahTemplateGen\tg.ps1).
// Adds: argument checks, a test-schema guard, a one-line DOC-SIM summary, a log row per run.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TOOL_HOME = process.env.DOC_SIM_HOME || 'E:\\Dev\\scripts\\EtanahTemplateGen';
// One log for every session: a worktree copy of this file still writes into the main checkout's domain/doc-sim/.
const WORKTREE = path.sep + '.claude' + path.sep + 'worktrees' + path.sep;
const MAIN_HOME = __dirname.includes(WORKTREE) ? path.join(__dirname.split(WORKTREE)[0], 'domain', 'doc-sim') : __dirname;
const LOG = process.env.DOC_SIM_LOG || path.join(MAIN_HOME, 'log.jsonl');
const DEFAULT_JBOSS = 'E:\\Dev\\jboss-7.4-plp-melaka';
const TEST_SCHEMA = /(stg|mlit|trn|int|uat|fat|dev|test)/i;
const NOISE = /JaxbValidationEventHandler|JaxbXmlPartXPathAware|consider using Xerces|XmlUtils: default|NamespacePrefixMapperUtils|ResponseProcessCookies|DocumentSettingsPart|liquibase\.database|Unknown database: EnterpriseDB|Recompile with -Xlint|use or override a deprecated API|^\s+at (org\.spring|java\.|jdk\.|org\.hibernate)|^\s+\.\.\. \d+ more/;
const KNOWN_WARN = /^\[WARN\] (Load3: No JAXB model|XSLTUtils: |PreloaderSVG: Batik not in class path|PelupusanTemplateReportMethodParameter: Could not flush session)/;
const MODES = ['repro', 'gen', 'chain', 'compare', 'build', 'stop', 'status'];
const STEPS = /^\d+:[A-Za-z_]+(,\d+:[A-Za-z_]+)*$/;

function die(code, msg) { process.stderr.write('doc-sim: ' + msg + '\n'); process.exit(code); }

function parseArgs(argv) {
  const opt = { flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { if (!opt.mode) opt.mode = a; continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) { opt[key] = next; i++; } else opt.flags.add(key);
  }
  return opt;
}

function readSchema(jboss) {
  const file = path.join(jboss, 'standalone', 'configuration', 'standalone.xml');
  if (!fs.existsSync(file)) return { error: 'standalone.xml not found under ' + jboss };
  const xml = fs.readFileSync(file, 'utf8');
  const block = xml.match(/<datasource\b[^>]*jndi-name="java:jboss\/datasources\/etanahDS"[\s\S]*?<\/datasource>/);
  if (!block) return { error: 'datasource etanahDS not found in ' + file };
  const url = (block[0].match(/<connection-url>([^<]+)<\/connection-url>/) || [])[1] || '';
  const schema = (url.match(/currentSchema=([A-Za-z0-9_]+)/) || [])[1] || '';
  return { schema, url };
}

// Turns the tool's output into the one line a quest doc or reply carries.
function summarise(text, opt) {
  const lines = text.split(/\r?\n/);
  const gens = lines.filter(l => /^\[gen\] .*filled in \d+ ms/.test(l));
  const templates = [];
  for (const l of lines) {
    const m = l.match(/^\s+\* (\S+)\s+<-\s+(\S+)/);
    if (m) templates.push(m[2]);
  }
  const fillMs = gens.map(l => Number((l.match(/filled in (\d+) ms/) || [])[1])).filter(n => !isNaN(n));
  const hidden = lines.filter(l => /^\[ERROR\]/.test(l)).length;
  const notGenerated = lines.filter(l => /NOT generated|nothing generated/.test(l)).length;
  const result = (lines.find(l => /^\s+RESULT: (SAME|CHANGED|UNREADABLE)/.test(l)) || '').match(/RESULT: (\w+)/);
  const first = (lines.find(l => /first difference: paragraph/.test(l)) || '').match(/paragraph (\d+).*-> (\w+)/);
  const byTag = (lines.find(l => /differing paragraphs by content control/.test(l)) || '').match(/\{([^}]*)\}/);
  const timeouts = lines.filter(l => /\bTIMEOUT\b/.test(l) && !/note:/.test(l)).length;
  const from = (lines.find(l => /^\[compare\] code from /.test(l)) || '').replace(/^\[compare\] code from /, '');
  const boot = (lines.find(l => /^\[boot\] context ready in \d+ ms/.test(l)) || '').match(/(\d+) ms/);
  const bootMs = boot ? Number(boot[1]) : null;
  const warm = lines.some(l => /^\[warm\] reusing JVM/.test(l));
  const toolTotal = (lines.find(l => /^\[time\] tg\.ps1 \w+ total \d+ ms/.test(l)) || '').match(/total (\d+) ms/);
  const images = lines.filter(l => /^\[tags\] images \d+/.test(l)).map(l => Number(l.match(/images (\d+)/)[1]));
  const steps = lines.filter(l => /^\[chain\] step \d+\//.test(l)).length;
  const timing = { bootMs, warm, toolMs: toolTotal ? Number(toolTotal[1]) : null, images, steps };
  if (opt.mode === 'build') {
    const ok = lines.find(l => /^\[build\] ok/.test(l));
    return { line: 'DOC-SIM: build ' + (ok ? ok.replace(/^\[build\] /, '') : 'not confirmed'), verdict: null, templates: [], hidden: 0, fillMs: [] };
  }
  if (opt.mode === 'compare') {
    const cmp = [path.basename(opt.a || 'A') + ' vs ' + path.basename(opt.b || 'B'), 'compare ' + (result ? result[1] : 'n/a')];
    if (first) cmp.push('first diff paragraph ' + first[1] + ' ' + first[2] + (byTag ? ' in {' + byTag[1] + '}' : ''));
    if (from) cmp.push('code ' + from);
    return { line: 'DOC-SIM: ' + cmp.join(' · '), verdict: result ? result[1] : null, templates: [], hidden, fillMs: [] };
  }
  const parts = [
    opt.permohonan || '(no permohonan)',
    templates.length ? [...new Set(templates)].join(' + ') : 'no template picked',
  ];
  if (steps) parts.push('chain ' + steps + ' step' + (steps === 1 ? '' : 's'));
  parts.push(fillMs.length ? 'fill ' + fillMs.join('+') + ' ms' : (notGenerated ? 'NOT generated' : 'fill n/a'));
  if (images.length) parts.push('images ' + images.join('→'));
  parts.push(hidden + ' hidden error' + (hidden === 1 ? '' : 's'));
  if (warm) parts.push('warm JVM');
  else if (bootMs !== null) parts.push('boot ' + bootMs + ' ms');
  if (timeouts) parts.push(timeouts + ' tag timeout' + (timeouts === 1 ? '' : 's'));
  parts.push('compare ' + (result ? result[1] : 'n/a'));
  if (first) parts.push('first diff paragraph ' + first[1] + ' ' + first[2] + (byTag ? ' in {' + byTag[1] + '}' : ''));
  return { line: 'DOC-SIM: ' + parts.join(' · '), verdict: result ? result[1] : null, templates, hidden, fillMs, timing };
}

function logRow(row) {
  try { fs.appendFileSync(LOG, JSON.stringify(Object.assign({ ts: new Date().toISOString() }, row)) + '\n'); } catch (_) { /* a log failure never fails the run */ }
}

function main() {
  const opt = parseArgs(process.argv.slice(2));

  if (opt.flags.has('where-log')) { console.log(LOG); return; }
  if (opt.parse) {
    if (!fs.existsSync(opt.parse)) die(2, '--parse file not found: ' + opt.parse);
    console.log(summarise(fs.readFileSync(opt.parse, 'utf8'), opt).line);
    return;
  }

  if (!opt.mode || !MODES.includes(opt.mode)) {
    die(2, 'usage: node domain/doc-sim/doc-sim.js <repro|gen|chain|compare|build|stop|status> --permohonan "<id>" [--tugasan <kod>] [--a-tgsn <id>] [--action <CREATE|SEMAK|PERAKU|...>] [--input <docx>] [--steps <a_tgsn>:<action>,...] [--dokumen <kod>] [--template <file.docx>] [--template-dir <folder>] [--java-src <file.java,...>] [--classes-dir <folder>] [--warm] [--idle-min <n>] [--profile] [--keep-existing] [--compare-ref <git ref|WORKTREE>] [--jboss <home>] [--a <docx> --b <docx>] [--dry-run]');
  }

  const needsData = opt.mode === 'repro' || opt.mode === 'gen' || opt.mode === 'chain';
  if (needsData) {
    if (!opt.permohonan) die(2, '--permohonan is required for ' + opt.mode);
    if (!/^PT[A-Z]{1,4}\/[A-Za-z0-9/]+$/.test(opt.permohonan)) die(2, 'not a permohonan id: ' + opt.permohonan);
  }
  if (opt.mode === 'chain' && !opt.steps) die(2, 'chain needs --steps "<a_tgsn>:<action>,<a_tgsn>:<action>,..."');
  if (opt.steps && opt.mode !== 'chain') die(2, '--steps is only for the chain mode');
  if (opt.steps && !STEPS.test(opt.steps)) die(2, 'a chain step is <a_tgsn>:<action>, e.g. 2757501:CREATE,2757934:SEMAK; got: ' + opt.steps);
  if (opt['a-tgsn'] && !/^\d+$/.test(opt['a-tgsn'])) die(2, '--a-tgsn is a number: ' + opt['a-tgsn']);
  if (opt.action && !/^[A-Za-z_]+$/.test(opt.action)) die(2, '--action is one word: ' + opt.action);
  for (const k of ['input', 'classes-dir']) if (opt[k] && !fs.existsSync(opt[k])) die(2, '--' + k + ' not found: ' + opt[k]);
  for (const f of (opt['java-src'] || '').split(',').filter(Boolean)) if (path.isAbsolute(f) && !fs.existsSync(f)) die(2, '--java-src file not found: ' + f);
  if (opt.mode === 'compare' && (!opt.a || !opt.b)) die(2, 'compare needs --a <docx> and --b <docx>');
  if (opt['template-dir'] && !fs.existsSync(opt['template-dir'])) die(2, '--template-dir not found: ' + opt['template-dir']);
  for (const k of ['a', 'b']) if (opt.mode === 'compare' && !fs.existsSync(opt[k])) die(2, '--' + k + ' not found: ' + opt[k]);

  const jboss = opt.jboss || DEFAULT_JBOSS;
  let schema = null;
  if (needsData) {
    const ds = readSchema(jboss);
    if (ds.error) die(3, ds.error);
    schema = ds.schema;
    // RAHSIA papers must not be generated from live data onto a laptop.
    if (!TEST_SCHEMA.test(schema) && opt['allow-schema'] !== schema) {
      die(3, 'refused: etanahDS points at schema "' + schema + '", which does not look like a test schema. Switch the local datasource, or pass --allow-schema ' + schema + ' on miya\'s word.');
    }
  }

  const script = path.join(TOOL_HOME, 'tg.ps1');
  if (!fs.existsSync(script)) die(4, 'tool not found: ' + script + ' (set DOC_SIM_HOME, or see domain/doc-sim/README.md)');

  const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, opt.mode];
  const map = { permohonan: '-Permohonan', tugasan: '-Tugasan', 'a-tgsn': '-ATgsn', action: '-Action', input: '-InputDoc', steps: '-Steps', dokumen: '-Dokumen', template: '-Template', 'template-dir': '-TemplateDir', 'java-src': '-JavaSrc', 'classes-dir': '-ClassesDir', 'idle-min': '-IdleMin', 'compare-ref': '-CompareRef', a: '-A', b: '-B', out: '-Out', timeout: '-TimeoutSec' };
  for (const k of Object.keys(map)) if (opt[k]) args.push(map[k], opt[k]);
  if (opt.jboss) args.push('-Jboss', opt.jboss);
  if (opt.flags.has('profile')) args.push('-Profile');
  if (opt.flags.has('keep-existing')) args.push('-KeepExisting');
  if (opt.flags.has('warm')) args.push('-Warm');

  if (opt.flags.has('dry-run')) {
    console.log('DRY-RUN schema=' + (schema || 'n/a') + ' :: pwsh ' + args.map(a => (/\s/.test(a) ? '"' + a + '"' : a)).join(' '));
    return;
  }

  const started = Date.now();
  // DOC_SIM_RUNNER tells tg.ps1 this runner writes the log row, so a run is logged once.
  const run = spawnSync('pwsh', args, { encoding: 'utf8', windowsHide: true, timeout: 25 * 60 * 1000, maxBuffer: 64 * 1024 * 1024, env: Object.assign({}, process.env, { DOC_SIM_RUNNER: '1' }) });
  const text = (run.stdout || '') + '\n' + (run.stderr || '');
  // Known library warnings (and the stack lines under them) are dropped; [ERROR] lines never are.
  let skipIndented = false;
  for (const line of text.split(/\r?\n/)) {
    if (skipIndented && /^\s+(->|at )/.test(line)) continue;
    skipIndented = KNOWN_WARN.test(line);
    if (skipIndented || !line.trim() || NOISE.test(line)) continue;
    console.log(line.length > 600 ? line.slice(0, 600) + ' …' : line);
  }

  const code = run.error ? 5 : (run.status === null ? 6 : run.status);
  if (opt.mode === 'stop' || opt.mode === 'status') process.exit(code === 0 ? 0 : 1);
  const sum = summarise(text, opt);
  const line = code === 0 ? sum.line : sum.line.replace(/^DOC-SIM: /, 'DOC-SIM: FAILED (exit ' + code + (run.error ? ', ' + run.error.code : '') + ') · ');
  console.log('\n' + line);
  const t = sum.timing || {};
  logRow({ via: 'doc-sim.js', mode: opt.mode, permohonan: opt.permohonan || null, schema, templates: [...new Set(sum.templates)], verdict: sum.verdict, hidden_errors: sum.hidden, fill_ms: sum.fillMs, steps: t.steps || null, images: t.images && t.images.length ? t.images : null, boot_ms: t.bootMs === undefined ? null : t.bootMs, warm: !!t.warm, java_src: !!opt['java-src'], ms: Date.now() - started, exit: code });
  process.exit(code === 0 ? 0 : 1);
}

main();
