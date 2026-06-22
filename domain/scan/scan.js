#!/usr/bin/env node
/**
 * scan.js — the /scan Power runner. Static bug-pattern scan for etanah.
 *
 * Runs PMD (curated bug-only ruleset, on source) + SpotBugs (-high, bytecode
 * dataflow on target/classes), merges the findings, prints a bug-focused table.
 * Why this exists: codegraph / SootUp map STRUCTURE; this finds DEFECTS the
 * structure tools can't — resource leaks, NPE-order, locale-casing, dead stores,
 * non-short-circuit logic, null derefs.
 *
 * Usage:
 *   node domain/scan/scan.js <target> [--record] [--base <etanah-root>] [--pmd-only|--spotbugs-only]
 *       <target> = a path (absolute, or relative to <base>/src/main/java) OR a dotted package
 *   node domain/scan/scan.js --setup        verify the tools are present
 *   node domain/scan/scan.js --selftest     run the bundled fixture eval
 *
 * Tools home: %LOCALAPPDATA%\etanah-static-analysis  (PMD 7 + SpotBugs 4)
 * Log: domain/scan/log.jsonl   ·   Known-bug store: domain/scan/known-bugs.jsonl
 */
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TOOLS = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'etanah-static-analysis');
const PMD = path.join(TOOLS, 'pmd-bin-7.25.0', 'bin', 'pmd.bat');
const SPOTBUGS = path.join(TOOLS, 'spotbugs-4.10.2', 'bin', 'spotbugs.bat');
const POWER_DIR = __dirname;
const RULESET = path.join(POWER_DIR, 'bug-ruleset.xml');
const LOG = path.join(POWER_DIR, 'log.jsonl');
const KNOWN = path.join(POWER_DIR, 'known-bugs.jsonl');
const DEFAULT_BASE = process.env.ETANAH_BASE || 'E:\\Projects\\Melaka\\etanah-pelupusan';

function log(obj) { try { fs.appendFileSync(LOG, JSON.stringify(Object.assign({ ts: new Date().toISOString() }, obj)) + '\n'); } catch (_) {} }
function die(msg) { console.error('scan: ' + msg); process.exit(2); }
function toolsPresent() { return fs.existsSync(PMD) && fs.existsSync(SPOTBUGS); }

// ---- target resolution -------------------------------------------------
function resolveTarget(arg, base) {
  const srcRoot = path.join(base, 'src', 'main', 'java');
  let srcPath;
  if (fs.existsSync(arg)) srcPath = path.resolve(arg);
  else if (/[\\/]/.test(arg)) srcPath = path.join(srcRoot, arg);
  else if (arg.includes('.') && !arg.endsWith('.java')) srcPath = path.join(srcRoot, arg.replace(/\./g, path.sep));
  else srcPath = path.join(srcRoot, arg);
  if (!fs.existsSync(srcPath)) die('target not found: ' + srcPath);
  const isFile = fs.statSync(srcPath).isFile();
  // map source -> compiled classes dir (package dir) for SpotBugs
  const classesRoot = path.join(base, 'target', 'classes');
  let rel = path.relative(srcRoot, srcPath);
  let classesTarget = null;
  if (!rel.startsWith('..')) {
    const relDir = isFile ? path.dirname(rel) : rel;
    classesTarget = path.join(classesRoot, relDir);
    if (!fs.existsSync(classesTarget)) classesTarget = null;
  }
  return { srcPath, isFile, srcRoot, classesRoot, classesTarget, base,
           fileFilter: isFile ? path.basename(srcPath) : null };
}

// ---- PMD ---------------------------------------------------------------
function runPmd(t) {
  if (!fs.existsSync(RULESET)) die('ruleset missing: ' + RULESET);
  const out = path.join(os.tmpdir(), 'scan-pmd-' + process.pid + '.csv');
  try {
    execSync(`"${PMD}" check -d "${t.srcPath}" -R "${RULESET}" -f csv --no-cache --no-progress -r "${out}"`,
      { stdio: 'ignore', windowsHide: true });
  } catch (e) { /* exit 4 = violations found, not an error */ }
  if (!fs.existsSync(out)) return [];
  const rows = parseCsv(fs.readFileSync(out, 'utf8'));
  try { fs.unlinkSync(out); } catch (_) {}
  return rows.map(r => ({
    tool: 'PMD', file: path.basename((r.File || '').replace(/"/g, '')), line: +(r.Line || 0),
    rule: r.Rule, sev: 'P' + r.Priority, msg: (r.Description || '').trim()
  })).filter(f => !t.fileFilter || f.file === t.fileFilter);
}
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const hdr = splitCsvLine(lines[0]);
  return lines.slice(1).map(l => { const c = splitCsvLine(l); const o = {}; hdr.forEach((h, i) => o[h] = c[i]); return o; });
}
function splitCsvLine(l) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < l.length; i++) { const ch = l[i];
    if (ch === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; }
  out.push(cur); return out.map(s => s.replace(/^"|"$/g, ''));
}

// ---- SpotBugs ----------------------------------------------------------
function runSpotbugs(t) {
  if (!t.classesTarget) return { findings: [], note: 'no compiled classes (target/classes) — run mvn compile for SpotBugs' };
  const out = path.join(os.tmpdir(), 'scan-sb-' + process.pid + '.txt');
  try {
    execSync(`"${SPOTBUGS}" -maxHeap 3072 -textui -effort:default -high -auxclasspath "${t.classesRoot}" -sourcepath "${t.srcRoot}" -output "${out}" "${t.classesTarget}"`,
      { stdio: 'ignore', windowsHide: true });
  } catch (e) { /* spotbugs may exit non-zero with findings */ }
  if (!fs.existsSync(out)) return { findings: [] };
  const text = fs.readFileSync(out, 'utf8');
  try { fs.unlinkSync(out); } catch (_) {}
  const findings = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([HML])\s+(\w)\s+(\w+):\s+(.*?)\s+At\s+(\S+\.java):\[line\s+(\d+)\]/);
    if (m) findings.push({ tool: 'SpotBugs', file: m[5], line: +m[6], rule: m[3], sev: m[1], msg: m[4].trim() });
  }
  return { findings: findings.filter(f => !t.fileFilter || f.file === t.fileFilter) };
}

// ---- noise filter: SpotBugs perf-only patterns we treat as low-value ----
const SB_NOISE = new Set(['Bx', 'Dm', 'UPM', 'UrF', 'SIC', 'SS']);

function render(findings, sbNote) {
  if (sbNote) console.log('  (SpotBugs: ' + sbNote + ')\n');
  if (!findings.length) { console.log('  No bug-pattern findings. ✓'); return; }
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  const w = (s, n) => (s + '').padEnd(n).slice(0, n);
  console.log('  ' + w('file:line', 34) + w('tool', 9) + w('rule', 26) + 'message');
  console.log('  ' + '-'.repeat(95));
  for (const f of findings) {
    const noise = f.tool === 'SpotBugs' && SB_NOISE.has(f.rule);
    console.log('  ' + (noise ? '· ' : '  ') + w(f.file + ':' + f.line, 32) + w(f.tool, 9) + w(f.rule, 26) + f.msg.slice(0, 70));
  }
  console.log('\n  (rows prefixed "·" = perf/style, likely low-harm — judge the rest)');
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length || args[0] === '--help') { console.log('usage: node scan.js <target> [--record] [--base <root>] [--pmd-only|--spotbugs-only]'); return; }
  if (args[0] === '--setup') { console.log(toolsPresent() ? 'tools OK: ' + TOOLS : 'MISSING tools at ' + TOOLS + ' (re-download PMD 7 + SpotBugs 4)'); return; }
  if (args[0] === '--selftest') { return selftest(); }
  if (!toolsPresent()) die('tools not found at ' + TOOLS + ' — run setup');

  let base = DEFAULT_BASE, record = false, only = null;
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base') base = args[++i];
    else if (args[i] === '--record') record = true;
    else if (args[i] === '--pmd-only') only = 'pmd';
    else if (args[i] === '--spotbugs-only') only = 'spotbugs';
    else positional.push(args[i]);
  }
  if (!positional.length) die('no target given');
  const t = resolveTarget(positional[0], base);
  console.log('\n  /scan  target: ' + path.relative(base, t.srcPath) + '  (base ' + base + ')\n');

  let findings = [], sbNote = null;
  if (only !== 'spotbugs') findings = findings.concat(runPmd(t));
  if (only !== 'pmd') { const sb = runSpotbugs(t); findings = findings.concat(sb.findings); sbNote = sb.note; }
  render(findings, sbNote);

  if (record && findings.length) {
    const real = findings.filter(f => !(f.tool === 'SpotBugs' && SB_NOISE.has(f.rule)));
    for (const f of real) fs.appendFileSync(KNOWN, JSON.stringify({ ts: new Date().toISOString(), status: 'unverified', file: f.file, line: f.line, tool: f.tool, rule: f.rule, sev: f.sev, msg: f.msg }) + '\n');
    console.log('\n  recorded ' + real.length + ' finding(s) to known-bugs.jsonl (status=unverified)');
  }
  log({ target: path.relative(base, t.srcPath), findings: findings.length, recorded: record });
  console.log('');
}

function selftest() {
  // fixture: a tiny Java file with 3 deliberate bug patterns
  const dir = path.join(os.tmpdir(), 'scan-selftest', 'src', 'main', 'java', 'x');
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, 'Bad.java');
  fs.writeFileSync(f, [
    'package x;',
    'public class Bad {',
    '  public boolean eq(String s) { return s.equals("LITERAL"); }   // NPE-order',
    '  public String up(String s) { return s.toUpperCase(); }        // locale',
    '  public void leak() throws Exception { java.io.InputStream in = new java.io.FileInputStream("a"); in.read(); } // resource leak',
    '}'
  ].join('\n'));
  const t = { srcPath: f, isFile: true, srcRoot: path.join(os.tmpdir(), 'scan-selftest', 'src', 'main', 'java'),
              classesTarget: null, classesRoot: '', fileFilter: 'Bad.java', base: '' };
  const pmd = runPmd(t);
  const rules = new Set(pmd.map(p => p.rule));
  const want = ['LiteralsFirstInComparisons', 'UseLocaleWithCaseConversions', 'CloseResource'];
  const hit = want.filter(r => rules.has(r));
  console.log('selftest PMD findings: ' + pmd.length + ' | matched bug-rules: ' + hit.join(', '));
  const pass = hit.length >= 2;
  console.log('SELFTEST ' + (pass ? 'PASS' : 'FAIL') + ' (>=2 of 3 expected bug-rules detected)');
  process.exit(pass ? 0 : 1);
}

main();
