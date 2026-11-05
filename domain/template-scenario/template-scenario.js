#!/usr/bin/env node
// boundary: covers one template ticket's requirement checklist, its doc-sim chain, the generated paper's CC values, a word diff against the requirement docx and a green-highlighted PDF · never writes to any database, never edits the template or the qa_doc, never posts to Redmine · stops at the TEMPLATE-SCENARIO line (PASS or FAIL with the gaps named)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const TS = require('./tag-sources.js');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '..', '..');
const PY = path.join(HERE, 'ts.py');
const LOG = path.join(HERE, 'log.jsonl');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

function py(...a) {
  const r = spawnSync('python', ['-I', PY, ...a], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('ts.py ' + a[0] + ' failed: ' + (r.stderr || '').slice(-400));
  return JSON.parse(r.stdout);
}

function mainRoot() {
  const r = spawnSync('git', ['-C', ROOT, 'rev-parse', '--git-common-dir'], { encoding: 'utf8' });
  if (r.status === 0) {
    const g = path.resolve(ROOT, r.stdout.trim());
    return path.dirname(g);
  }
  return ROOT;
}

// Checklist: the "## Template checklist" table in QA-<n>.md.
// | R | Source | Text | Status | Find |   Status = done | na: <reason> | todo
function parseChecklist(md) {
  const m = /^## Template checklist[^\n]*\n([\s\S]*?)(?=\n## |(?![\s\S]))/m.exec(md || '');
  if (!m) return null;
  const rows = [];
  for (const line of m[1].split(/\r?\n/)) {
    if (!/^\s*\|/.test(line) || /^\s*\|\s*-/.test(line) || /\|\s*R\s*\|\s*Source/i.test(line)) continue;
    const c = line.split('|').slice(1, -1).map(s => s.trim());
    if (c.length < 4) continue;
    rows.push({ id: c[0], source: c[1], text: c[2], status: c[3], find: (c[4] || '').replace(/^`|`$/g, '') });
  }
  return rows;
}

function checklistState(rows) {
  if (!rows) return { ok: false, total: 0, done: 0, open: ['no "## Template checklist" section'] };
  const open = rows.filter(r => !/^(done|na\s*:\s*\S)/i.test(r.status)).map(r => r.id + ' ' + r.text.slice(0, 50));
  return { ok: rows.length > 0 && open.length === 0, total: rows.length, done: rows.length - open.length, open: rows.length ? open : ['checklist has no rows'] };
}

// Chain: every action the config block runs for this document must be rendered.
const SAME_AS_CREATE = new Set(['STATUS_PENYEDIAAN_SEDIA']);
const NOT_A_FILL_STEP = new Set(['STATUS_PENYEDIAAN_PEMBETULAN']);
function requiredActions(block) {
  const set = new Set();
  for (const a of (block.actions || [])) {
    if (NOT_A_FILL_STEP.has(a.type)) continue;
    set.add(SAME_AS_CREATE.has(a.type) ? 'CREATE' : a.type.replace(/^STATUS_PENYEDIAAN_/, ''));
  }
  return [...set];
}
function chainCoverage(required, steps) {
  const have = new Set(steps.map(s => s.split(':')[1].replace(/^STATUS_PENYEDIAAN_/, '').toUpperCase()).map(s => s === 'SEDIA' ? 'CREATE' : s));
  const missing = required.filter(a => !have.has(a));
  return { ok: missing.length === 0, have: required.length - missing.length, need: required.length, missing };
}

// CC coverage: tags in paragraphs the fix changed must hold a real value in the final paper.
function touchedTags(oldParas, newParas) {
  const key = p => p.text + ' ' + p.tags.join(',');
  const oldSet = new Map();
  for (const p of oldParas) oldSet.set(key(p), (oldSet.get(key(p)) || 0) + 1);
  const touched = new Set();
  for (const p of newParas) {
    const k = key(p);
    if (oldSet.get(k)) { oldSet.set(k, oldSet.get(k) - 1); continue; }
    p.tags.forEach(t => touched.add(t));
  }
  return [...touched];
}
const MIN_IMAGE_BYTES = 1024;
function ccGaps(tags, ccList, accepted) {
  const gaps = [];
  for (const tag of tags) {
    if (accepted[tag]) continue;
    const hits = ccList.filter(c => c.tag === tag);
    if (!hits.length) { gaps.push(tag + '=not in paper'); continue; }
    for (const c of hits) {
      if (c.images.length) {
        if (c.images.some(b => b < MIN_IMAGE_BYTES)) { gaps.push(tag + '=blank image ' + Math.min(...c.images) + ' B'); break; }
        continue;
      }
      const t = c.text.trim();
      if (!t) { gaps.push(tag + '=empty'); break; }
      if (/^<[^>]*>$/.test(t) || /<[A-Za-z][^>]*>/.test(t)) { gaps.push(tag + '=placeholder ' + t.slice(0, 30)); break; }
      if (/^-+$/.test(t)) { gaps.push(tag + '=dash'); break; }
    }
  }
  return gaps;
}

// Word diff: requirement docx vs final paper, token level. A change whose paper side is only CC-filled words is DATA.
function lcsOps(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = [];
  let i = 0, j = 0, cur = null;
  const push = (t) => { if (!cur || cur.type !== t) { cur = { type: t, a: [], b: [] }; ops.push(cur); } };
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { cur = null; i++; j++; }
    else if (j < m && (i === n || dp[i][j + 1] >= dp[i + 1][j])) { push('chg'); cur.b.push(j); j++; }
    else { push('chg'); cur.a.push(i); i++; }
  }
  return ops;
}
const norm = s => s.toLowerCase().replace(/[.,;:()]+$/g, '').replace(/^[(]+/, '');
function wordDiff(reqTokens, paperTokens, accepts) {
  const a = reqTokens.map(norm), b = paperTokens.map(t => norm(t[0]));
  const rows = [];
  for (const op of lcsOps(a, b)) {
    const reqText = op.a.map(i => reqTokens[i]).join(' ');
    const ours = op.b.map(j => paperTokens[j]);
    const oursText = ours.map(t => t[0]).join(' ');
    const allCc = ours.length > 0 && ours.every(t => t[1] === 'cc');
    const staticWordLost = op.a.some(i => /^\([A-Za-z][A-Za-z ]*\)[.,;:]?$/.test(reqTokens[i]) && !oursText.includes(reqTokens[i].replace(/[.,;:]$/, '')));
    let cls = allCc && !staticWordLost ? 'DATA' : 'DEFECT';
    if (!ours.length && reqText && /^[\d\-./]+$/.test(reqText.replace(/\s/g, ''))) cls = 'DATA';
    const acc = accepts.find(x => x && (reqText.includes(x) || oursText.includes(x)));
    if (cls === 'DEFECT' && acc) cls = 'ACCEPTED';
    rows.push({ cls, req: reqText, ours: oursText });
  }
  return rows;
}

const NUMBERING_RE = /^\d+(\.\d+)*\.?$|^[ivx]+\.$/i;
function flatTokens(paras) {
  return paras.flatMap(p => p.tokens)
    .map(t => [t[0].replace(/^\d+(\.\d+)+(?=[A-Za-z])/, ''), t[1]])
    .filter(t => t[0] && !NUMBERING_RE.test(t[0]));
}

function word2pdf(docx, pdf) {
  const ps = `$w=New-Object -ComObject Word.Application;$w.Visible=$false;$d=$w.Documents.Open('${docx.replace(/'/g, "''")}',$false,$true);$d.SaveAs([ref]'${pdf.replace(/'/g, "''")}',[ref]17);$d.Close([ref]0);$w.Quit()`;
  const r = spawnSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8', timeout: 180000 });
  if (r.status !== 0 || !fs.existsSync(pdf)) throw new Error('Word PDF save failed: ' + (r.stderr || '').slice(-300));
}

function runChain(o) {
  const a = [path.join(ROOT, 'domain', 'doc-sim', 'doc-sim.js'), 'chain', '--permohonan', o.permohonan, '--steps', o.steps, '--dokumen', o.dokumen, '--template', path.basename(o.template)];
  if (o.templateDir) a.push('--template-dir', o.templateDir);
  if (o.classesDir) a.push('--classes-dir', o.classesDir);
  const r = spawnSync('node', a, { encoding: 'utf8', cwd: ROOT, maxBuffer: 64 * 1024 * 1024, timeout: 900000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = /\[chain\] done: \d+ steps -> (.+\.docx)/.exec(out.replace(/\r?\n(?!\[)/g, ''));
  if (!m) throw new Error('doc-sim chain gave no final docx:\n' + out.slice(-800));
  return { filled: m[1].trim(), docsim: (out.match(/DOC-SIM:.*/) || [''])[0] };
}

async function main() {
  const qa = String(arg('qa', '')).replace(/^QA-/i, '');
  const req = arg('req');
  const template = arg('template');
  const base = arg('base');
  const steps = arg('steps', '');
  const out = arg('out');
  if (!qa || !req || !template || !base || !out) {
    console.error('usage: template-scenario.js --qa <num> --req <requirement.docx> --template <edited .docx> --base <template before the fix .docx> --out <2. Fix folder> (--filled <generated .docx> | --permohonan <id> --steps a:CREATE,b:SEMAK,c:PERAKU --dokumen <kod> [--template-dir <dir>] [--classes-dir <dir>]) [--config <template.config.json>] [--qa-doc <md>] [--accept "<text>|<text>"] [--case "empty|<permohonan>|<filled .docx>" --env <mlit|stg1|stg2>] [--case "ba|<BA permohonan>|<filled .docx>" | --no-ba-id "<reason>"] [--urusan <kod>] [--state <key>]');
    process.exit(2);
  }
  const qaDoc = arg('qa-doc', path.join(mainRoot(), 'projects', 'coding-projects', 'active', 'QA-' + qa, 'QA-' + qa + '.md'));
  const result = { qa, ts: new Date().toISOString() };
  const fails = [];

  const rows = parseChecklist(fs.existsSync(qaDoc) ? fs.readFileSync(qaDoc, 'utf8') : '');
  const cl = checklistState(rows);
  if (!rows) {
    const seeds = py('comments', req).map((c, i) => `| C${i + 1} | requirement comment | ${c.comment} (on "${c.anchor.slice(0, 40)}") | todo | |`);
    console.log('SEED (paste into QA-' + qa + '.md under "## Template checklist", add the ticket Issue/Expected lines and every BA ask):\n| R | Source | Text | Status | Find |\n|---|---|---|---|---|\n' + seeds.join('\n'));
  }
  if (!cl.ok) fails.push('checklist ' + cl.done + '/' + cl.total + ' open: ' + cl.open.slice(0, 4).join('; '));

  let filled = arg('filled');
  let required = [];
  const cfgPath = arg('config');
  if (cfgPath) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const block = (cfg.templates || []).find(t => t.template === path.basename(template));
    if (!block) fails.push('config has no block for ' + path.basename(template));
    else required = requiredActions(block);
  }
  const chain = chainCoverage(required, steps ? steps.split(',') : []);
  if (required.length && !chain.ok) fails.push('chain ' + chain.have + '/' + chain.need + ' actions, missing ' + chain.missing.join(','));
  if (!filled) {
    const r = runChain({ permohonan: arg('permohonan'), steps, dokumen: arg('dokumen'), template, templateDir: arg('template-dir'), classesDir: arg('classes-dir') });
    filled = r.filled; result.docsim = r.docsim;
  }

  const accepted = {};
  for (const r of rows || []) { const m = /^FIXED-DATA\s+(\S+)/i.exec(r.source); if (m && /^(done|na)/i.test(r.status)) accepted[m[1]] = r.status; }
  const touched = touchedTags(py('paras', base), py('paras', template));
  const gaps = ccGaps(touched, py('cc', filled), accepted);
  if (gaps.length) fails.push('CC gaps: ' + gaps.join(', '));

  // Tag source check: every printed text tag has a source; a source empty on PROD for this urusan needs an empty-case paper; the BA's own ID always runs.
  const src = await sourceCheck({ filled, rows, accepted });
  fails.push(...src.fails);

  const accepts = String(arg('accept', '')).split('|').map(s => s.trim()).filter(Boolean)
    .concat((rows || []).filter(r => /^diff/i.test(r.source) && /^(done|na)/i.test(r.status)).map(r => r.text.replace(/^`|`$/g, '')));
  const reqTok = flatTokens(py('paras', req)).map(t => t[0]);
  const diff = wordDiff(reqTok, flatTokens(py('paras', filled)), accepts);
  const defects = diff.filter(d => d.cls === 'DEFECT');
  if (defects.length) fails.push('word diff ' + defects.length + ' defect(s)');

  const find = (rows || []).map(r => r.find).filter(Boolean);
  fs.mkdirSync(out, { recursive: true });
  const n = (fs.readdirSync(out).map(f => parseInt(f, 10)).filter(x => !isNaN(x)).sort((x, y) => y - x)[0] || 0) + 1;
  const tmpPdf = path.join(os.tmpdir(), 'ts-' + qa + '-' + Date.now() + '.pdf');
  word2pdf(filled, tmpPdf);
  const phrases = path.join(os.tmpdir(), 'ts-' + qa + '-phrases.json');
  fs.writeFileSync(phrases, JSON.stringify(find));
  const pdfOut = path.join(out, n + '. ' + path.basename(template, '.docx') + ' ditanda - ' + String(arg('permohonan', 'paper')).replace(/\//g, '-') + '.pdf');
  const hl = py('highlight', tmpPdf, pdfOut, phrases);
  if (hl.annots) fails.push('highlight has ' + hl.annots + ' annotation(s)');
  if (hl.missing.length) fails.push('highlight phrase not found: ' + hl.missing.slice(0, 3).join(' | '));

  const status = fails.length ? 'FAIL' : 'PASS';
  const line = `TEMPLATE-SCENARIO: ${status} QA-${qa} · checklist ${cl.done}/${cl.total} · chain ${chain.have}/${chain.need} actions · CC ${touched.length} touched, gaps ${gaps.length ? gaps.join(', ') : 'none'} · sources ${src.summary} · word diff defect ${defects.length}, data ${diff.filter(d => d.cls === 'DATA').length}, accepted ${diff.filter(d => d.cls === 'ACCEPTED').length} · highlight ${pdfOut} annots ${hl.annots}`;
  if (defects.length) console.log('DEFECTS (requirement → paper):\n' + defects.map(d => `  "${d.req}" → "${d.ours}"`).join('\n'));
  if (fails.length) console.log('FAILS:\n  ' + fails.join('\n  '));
  console.log(line);
  fs.appendFileSync(LOG, JSON.stringify({ ...result, status, checklist: cl, chain, touched, gaps, defects: defects.length, pdf: pdfOut, fails }) + '\n');
  process.exit(fails.length ? 1 : 0);
}

async function sourceCheck({ filled, rows, accepted }) {
  const states = require(path.join(ROOT, 'lib', 'states.js'));
  const permohonan = arg('permohonan', '');
  const state = arg('state') || (permohonan && states.stateForPrefix(permohonan)) || states.reference();
  const st = states.get(state);
  const urusan = arg('urusan') || TS.urusanOf(permohonan) || TS.urusanOf((TS.parseCases(process.argv)[0] || {}).permohonan);
  const fails = [];
  const tags = TS.printedTags(py('cc', filled));
  const src = TS.resolveSources(tags, TS.loadMap(state), rows);
  const counts = {};
  const prodMcp = st && st.db && st.db.mcp && st.db.mcp.prod;
  const prodSchema = st && st.db && st.db.schemas && st.db.schemas.prod;
  if (!urusan) fails.push('sources: no urusan (pass --urusan <kod> or a --permohonan id)');
  else if (!prodMcp || !prodSchema) fails.push('sources: state ' + state + ' has no prod DB in the registry');
  else {
    const byCol = {};
    for (const m of src.mapped) (byCol[m.table + '.' + m.column] = byCol[m.table + '.' + m.column] || []).push(m);
    for (const [col, ms] of Object.entries(byCol)) {
      let c;
      try { const r = await TS.dbSelect(prodMcp, TS.countSql(prodSchema, ms[0].table, ms[0].column, urusan)); c = r[0] ? { total: Number(r[0].total), empty: Number(r[0].empty) } : { error: 'no row' }; }
      catch (e) { c = { error: String(e.message || e).slice(0, 120) }; }
      ms.forEach(m => { counts[m.tag] = c; });
    }
  }
  const emptyOk = {};
  for (const r of rows || []) { const m = /^EMPTY-OK\s+(\S+)/i.exec(r.source); if (m && /^(done|na\s*:\s*\S)/i.test(r.status)) emptyOk[m[1]] = r.status; }
  const mappedTags = src.mapped.map(m => m.tag);
  const envKey = arg('env');
  const envMcp = envKey && st && st.db.mcp[envKey === 'stg2' ? 'stg' : envKey];
  const envSchema = envKey && st && st.db.schemas[envKey];
  const cases = [];
  for (const k of TS.parseCases(process.argv)) {
    if (!['empty', 'ba'].includes(k.kind) || !k.permohonan || !k.docx || !fs.existsSync(k.docx)) { fails.push('bad --case ' + [k.kind, k.permohonan, k.docx].join('|') + ' (kind empty|ba, permohonan, an existing .docx)'); continue; }
    const one = { kind: k.kind, permohonan: k.permohonan, gaps: ccGaps(mappedTags, py('cc', k.docx), accepted), emptyCols: new Set() };
    if (k.kind === 'empty') {
      if (!envMcp || !envSchema) fails.push('empty case ' + k.permohonan + ' needs --env <mlit|stg1|stg2> to prove its columns are empty');
      else for (const m of src.mapped) {
        if (!counts[m.tag] || !(counts[m.tag].empty > 0)) continue;
        try { const r = await TS.dbSelect(envMcp, TS.caseSql(envSchema, m.table, m.column, k.permohonan)); if (r[0] && Number(r[0].empty) > 0) one.emptyCols.add(m.tag); }
        catch (e) { fails.push('empty case read ' + m.tag + ' failed: ' + String(e.message || e).slice(0, 80)); }
      }
    }
    cases.push(one);
  }
  const j = TS.judge({ src, counts, cases, emptyOk, noBa: TS.noBaOk(arg('no-ba-id')) });
  fails.push(...j.fails.map(f => 'sources: ' + f));
  const emptyOnProd = Object.entries(counts).filter(([, c]) => c.empty > 0).map(([t, c]) => t + ' ' + c.empty + '/' + c.total);
  const summary = `${src.mapped.length + src.none.length}/${tags.length} known, PROD empty ${emptyOnProd.length ? emptyOnProd.join(', ') : 'none'}, cases ${cases.map(k => k.kind + ' ' + k.permohonan).join(', ') || 'none'}`;
  if (emptyOnProd.length) console.log('PROD EMPTY (urusan ' + urusan + ', ' + prodMcp + '):\n' + Object.entries(counts).filter(([, c]) => c.empty > 0).map(([t, c]) => '  ' + t + ' ' + c.empty + ' of ' + c.total).join('\n'));
  return { fails, summary, log: { state, urusan, tags: tags.length, unknown: src.unknown, counts, cases: cases.map(k => ({ kind: k.kind, permohonan: k.permohonan, gaps: k.gaps, emptyCols: [...k.emptyCols] })) } };
}

module.exports = { parseChecklist, checklistState, requiredActions, chainCoverage, touchedTags, ccGaps, wordDiff };
// Sources only (no chain, no diff, no PDF): node template-scenario.js sources --qa <num> --filled <docx> --permohonan <id> [--case ...] [--env ...]
async function sourcesOnly() {
  const qa = String(arg('qa', '')).replace(/^QA-/i, '');
  const filled = arg('filled');
  if (!filled || !fs.existsSync(filled)) { console.error('usage: template-scenario.js sources --qa <num> --filled <generated .docx> --permohonan <id> [--case "empty|<id>|<docx>" --env <env>] [--case "ba|<id>|<docx>" | --no-ba-id "<reason>"]'); process.exit(2); }
  const qaDoc = arg('qa-doc', path.join(mainRoot(), 'projects', 'coding-projects', 'active', 'QA-' + qa, 'QA-' + qa + '.md'));
  const rows = parseChecklist(fs.existsSync(qaDoc) ? fs.readFileSync(qaDoc, 'utf8') : '') || [];
  const accepted = {};
  for (const r of rows) { const m = /^FIXED-DATA\s+(\S+)/i.exec(r.source); if (m && /^(done|na)/i.test(r.status)) accepted[m[1]] = r.status; }
  const src = await sourceCheck({ filled, rows, accepted });
  if (src.fails.length) console.log('FAILS:\n  ' + src.fails.join('\n  '));
  console.log('TAG-SOURCES: ' + (src.fails.length ? 'FAIL' : 'PASS') + ' QA-' + qa + ' · ' + src.summary);
  fs.appendFileSync(LOG, JSON.stringify({ qa, ts: new Date().toISOString(), mode: 'sources', status: src.fails.length ? 'FAIL' : 'PASS', sources: src.log, fails: src.fails }) + '\n');
  process.exit(src.fails.length ? 1 : 0);
}

if (require.main === module) (process.argv[2] === 'sources' ? sourcesOnly() : main()).catch(e => { console.error('TEMPLATE-SCENARIO: FAIL ' + (e.message || e)); process.exit(1); });
