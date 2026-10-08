#!/usr/bin/env node
// pena — born via forge
// symptom: 2026-10-08 #279554 miya: 'Have you built like a Feature for you to learn my writing style? Where you log the sentences I changed, what are the keywords I used' after five rounds of corrections on one Redmine note
// goal: text written in miya's name follows the named style modules of its surface, and every sentence he changes becomes a stored example the next draft is checked against
// goal_signal: the reply that carries a draft in his name also carries a PENA line naming the profile and the check result
// retention: keep
// footprint: on-demand: 1 node process under 1 second per show, add or check; nothing at boot, per prompt or per session
//
// Commands:
//   list                                         profiles and modules, one line each
//   show  --profile <p> | --module <m[,m]>       what each module means + his latest changed sentences
//   check --profile <p> | --module <m[,m]>  --file <draft> | --text "<draft>"
//   add   --module <m> --mine "<..>" --his "<..>" [--ticket n] [--surface p] [--his-words "<..>"]
//   keyword --word "<w>" --meant "<..>" --evidence "<..>" [--module m]
//   analyze [--days n]                           counts per module, repeats, keywords
// Data lives in domain/pena/ (PENA_DIR overrides it for the eval).
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = process.env.PENA_DIR || path.join(__dirname, '..', 'domain', 'pena');
const F = { modules: 'modules.json', profiles: 'profiles.json', corpus: 'corpus.jsonl', keywords: 'keywords.jsonl', log: 'log.jsonl' };
const p = (k) => path.join(DIR, F[k]);

function readJson(k) {
  try { return JSON.parse(fs.readFileSync(p(k), 'utf8')); }
  catch (e) { fail('cannot read ' + p(k) + ': ' + e.message); }
}
function readRows(k) {
  if (!fs.existsSync(p(k))) return [];
  const rows = [];
  for (const line of fs.readFileSync(p(k), 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch (e) { /* a broken row is skipped, never fatal */ }
  }
  return rows;
}
function appendRow(k, row) { fs.appendFileSync(p(k), JSON.stringify(row) + '\n'); }
function log(row) {
  try { appendRow('log', Object.assign({ ts: new Date().toISOString() }, row)); } catch (e) { /* logging never breaks a run */ }
}
function fail(msg) { process.stderr.write('pena: ' + msg + '\n'); process.exit(2); }
function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) o[key] = true; else { o[key] = next; i++; }
    } else o._.push(a);
  }
  return o;
}

function resolveModules(o) {
  const modules = readJson('modules');
  const profiles = readJson('profiles');
  let names = [];
  let profile = null;
  if (typeof o.profile === 'string') {
    profile = o.profile;
    if (!profiles[profile]) fail('unknown profile "' + profile + '". Known: ' + Object.keys(profiles).join(', '));
    names = profiles[profile].modules.slice();
  }
  if (typeof o.module === 'string') {
    for (const m of o.module.split(',').map((s) => s.trim()).filter(Boolean)) if (!names.includes(m)) names.push(m);
  }
  if (!names.length) fail('give --profile <name> or --module <name[,name]>. Run: node lib/pena.js list');
  for (const m of names) if (!modules[m]) fail('unknown module "' + m + '". Known: ' + Object.keys(modules).join(', '));
  return { modules, profiles, names, profile };
}

// ---------- draft parsing ----------
function parse(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const out = [];
  let inPre = false;
  lines.forEach((raw, i) => {
    const t = raw.trim();
    if (/<pre>/i.test(t)) inPre = true;
    let kind = 'prose';
    if (inPre) kind = 'pre';
    else if (/^\|/.test(t)) kind = 'table';
    else if (!t) kind = 'blank';
    out.push({ n: i + 1, raw, t, kind });
    if (/<\/pre>/i.test(t)) inPre = false;
  });
  return out;
}
const ABBR = /\b(No|no|Sdn|Bhd|Dr|En|Pn|Hj|e\.g|i\.e|etc)\.(?=\s)/g;
function sentences(t) {
  const s = t.replace(ABBR, '$1').replace(/@[^@]*@/g, 'x');
  return s.split(/[.!?]+(?:\s+|$)/).map((x) => x.trim()).filter((x) => x.split(/\s+/).length >= 2);
}
const isSql = (t) => /^\s*(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|UPDATE|DELETE|INSERT|SET|VALUES)\b/i.test(t);
const stripParens = (t) => { let prev; let s = t; do { prev = s; s = s.replace(/\([^()]*\)/g, ''); } while (s !== prev); return s; };

// ---------- checks, one per module ----------
const CHECKS = {
  greet(L) {
    const f = [];
    const body = L.filter((l) => l.kind !== 'blank');
    if (!body.length) return f;
    if (!/^(Salam\s+\S+|Hi infra)/i.test(body[0].t)) f.push({ line: body[0].n, why: 'first line is not "Salam <short name>," or "Hi infra,"', text: body[0].t });
    const last = body[body.length - 1];
    if (!/^(Thank you( very much)?|Thanks)[.!]?$/i.test(last.t)) f.push({ line: last.n, why: 'last line is not the closing (Thank you. / Thanks)', text: last.t });
    return f;
  },
  lean(L) {
    const f = [];
    const leadIn = /^(everything\b|as you can see|please note( that)?|i would like to|for your information|fyi\b|as mentioned|kindly be informed)/i;
    const verdict = /\b(DB-proven|verified|double.checked|as mentioned (above|earlier))\b/i;
    for (const l of L) {
      if (l.kind !== 'prose') continue;
      for (const s of l.t.split(/(?<=[.!?])\s+/)) {
        if (leadIn.test(s.trim())) f.push({ line: l.n, why: 'lead-in words; start with the fact', text: s.trim() });
      }
      if (verdict.test(l.t)) f.push({ line: l.n, why: 'verdict word about our own work', text: l.t });
    }
    return f;
  },
  line(L) {
    const f = [];
    for (const l of L) {
      if (l.kind !== 'prose') continue;
      const ss = sentences(l.t);
      if (ss.length > 2) f.push({ line: l.n, why: ss.length + ' sentences on one line (at most 2)', text: l.t });
      for (const s of ss) {
        const words = s.split(/\s+/).length;
        if (words > 18 && /\b(jadi|so|sebab|bila|kerana|because)\b/i.test(s)) f.push({ line: l.n, why: 'long sentence joined by jadi / so / sebab / bila; split the facts', text: s });
        if ((s.match(/\/\d+\b/g) || []).length >= 3) f.push({ line: l.n, why: '3 or more ids listed inside one sentence', text: s });
      }
    }
    return f;
  },
  table(L) {
    const f = [];
    const hasTable = L.some((l) => l.kind === 'table');
    const labels = L.filter((l) => /^\s*(Table|Column)\s*:/i.test(l.t));
    if (!hasTable && labels.length >= 2) f.push({ line: labels[0].n, why: 'Table : / Column : label lines; this data goes in a table', text: labels[0].t });
    const header = L.filter((l) => l.kind === 'table');
    if (hasTable && !header.some((l) => /^\|_\./.test(l.t))) f.push({ line: header[0].n, why: 'table has no Textile header row (|_. Head |)', text: header[0].t });
    return f;
  },
  separate(L) {
    const f = [];
    let lastTable = -1;
    L.forEach((l, i) => { if (l.kind === 'table') lastTable = i; });
    if (lastTable < 0) return f;
    for (let i = 0; i < lastTable; i++) {
      if (/^\s*SELECT\b/i.test(L[i].t)) { f.push({ line: L[i].n, why: 'a script sits before the last mapping table; scripts go in their own section after the tables', text: L[i].t }); break; }
    }
    return f;
  },
  script(L) {
    const f = [];
    for (const l of L) {
      if (!(l.kind === 'pre' || isSql(l.t))) continue;
      if (/\bSELECT\s+\*/i.test(l.t)) f.push({ line: l.n, why: 'SELECT *; select the mapped columns', text: l.t });
      if (/\bJOIN\b/i.test(l.t)) f.push({ line: l.n, why: 'JOIN; resolve the id with a subquery', text: l.t });
      if (/\bet_main\w*\./i.test(l.t)) f.push({ line: l.n, why: 'schema prefix; the reader pastes it into any schema', text: l.t });
      const flat = stripParens(l.t);
      if (/^\s*SELECT\b.*\bFROM\b/i.test(flat) || /\bFROM\b.*\bWHERE\b/i.test(flat)) f.push({ line: l.n, why: 'more than one clause on a line; one clause per line', text: l.t });
    }
    return f;
  },
  plain(L) {
    const f = [];
    for (const l of L) {
      if (l.kind !== 'prose') continue;
      if (/\b[\w-]+\.(java|xhtml|js|json|xml|jrxml)\b/i.test(l.t)) f.push({ line: l.n, why: 'file name in a BA note', text: l.t });
      else if (/:\d{2,5}\b/.test(l.t) && /[A-Za-z]\w+:\d{2,5}\b/.test(l.t) && !/\d{1,2}:\d{2}/.test(l.t)) f.push({ line: l.n, why: 'line number in a BA note', text: l.t });
      if (/\b[A-Z][a-z]+[A-Z]\w+\.\w+\(/.test(l.t)) f.push({ line: l.n, why: 'method name in a BA note', text: l.t });
    }
    return f;
  },
  rojak(L, mod) {
    const f = [];
    const words = (mod.banned || []).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return f;
    const re = new RegExp('(^|[^A-Za-z])(' + words.join('|') + ')(?![A-Za-z])', 'i');
    for (const l of L) {
      if (l.kind !== 'prose') continue;
      const m = l.t.match(re);
      if (m) f.push({ line: l.n, why: 'formal Malay or a translated dev word: "' + m[2] + '"', text: l.t });
    }
    return f;
  }
};

function cmdList() {
  const modules = readJson('modules');
  const profiles = readJson('profiles');
  const out = ['PROFILES (a surface = a set of modules)'];
  for (const [k, v] of Object.entries(profiles)) out.push('  ' + k + ' — ' + v.for + '\n      modules: ' + v.modules.join(' · '));
  out.push('', 'MODULES (one style aspect each)');
  for (const [k, v] of Object.entries(modules)) out.push('  ' + k + ' — ' + v.title + ': ' + v.means);
  process.stdout.write(out.join('\n') + '\n');
}

function cmdShow(o) {
  const { modules, profiles, names, profile } = resolveModules(o);
  const corpus = readRows('corpus');
  const keywords = readRows('keywords');
  const out = ['PENA: ' + (profile ? 'profile=' + profile + ' · ' : '') + 'modules=' + names.join(',')];
  if (profile) {
    out.push('For: ' + profiles[profile].for);
    for (const ptr of profiles[profile].pointers || []) out.push('Also read: ' + ptr);
  }
  for (const m of names) {
    const mod = modules[m];
    out.push('', '== ' + m + ' — ' + mod.title + ' ==', mod.means);
    for (const r of mod.rules) out.push('  - ' + r);
    if (mod.banned && mod.banned.length) out.push('  Banned: ' + mod.banned.join(' · '));
    if (mod.check === 'manual') out.push('  Answer before sending: ' + mod.ask);
    const kw = keywords.filter((k) => k.module === m);
    for (const k of kw) out.push('  His word "' + k.word + '" = ' + k.meant);
    const ex = corpus.filter((c) => c.module === m).slice(-3);
    for (const c of ex) out.push('  Changed (#' + (c.ticket || '-') + ', ' + c.date + '): mine "' + c.mine + '" -> his "' + c.his + '"');
  }
  process.stdout.write(out.join('\n') + '\n');
  log({ cmd: 'show', profile, modules: names, outcome: 'shown' });
}

function cmdCheck(o) {
  const { modules, names, profile } = resolveModules(o);
  let text = null;
  if (typeof o.file === 'string') {
    if (!fs.existsSync(o.file)) fail('draft file not found: ' + o.file);
    text = fs.readFileSync(o.file, 'utf8');
  } else if (typeof o.text === 'string') text = o.text;
  if (text === null) fail('give --file <draft> or --text "<draft>"');
  if (!text.trim()) fail('the draft is empty');
  const L = parse(text);
  const findings = [];
  const manual = [];
  for (const m of names) {
    const mod = modules[m];
    if (mod.check === 'manual') { manual.push({ module: m, ask: mod.ask }); continue; }
    const fn = CHECKS[mod.check];
    if (!fn) continue;
    for (const x of fn(L, mod)) findings.push(Object.assign({ module: m }, x));
  }
  const head = 'PENA: ' + (profile ? 'profile=' + profile + ' · ' : '') + 'modules=' + names.join(',') + ' · ' + findings.length + ' finding(s)' + (manual.length ? ' · ' + manual.length + ' to answer by hand' : '');
  const out = [head];
  for (const x of findings) out.push('  [' + x.module + '] line ' + x.line + ': ' + x.why + '\n      ' + x.text.slice(0, 160));
  for (const x of manual) out.push('  [' + x.module + '] by hand: ' + x.ask);
  process.stdout.write(out.join('\n') + '\n');
  log({ cmd: 'check', profile, modules: names, findings: findings.length, by_module: findings.reduce((a, x) => { a[x.module] = (a[x.module] || 0) + 1; return a; }, {}), outcome: findings.length ? 'findings' : 'clean' });
  process.exit(findings.length ? 1 : 0);
}

function cmdAdd(o) {
  const modules = readJson('modules');
  if (typeof o.module !== 'string' || !modules[o.module]) fail('--module must be one of: ' + Object.keys(modules).join(', '));
  if (typeof o.mine !== 'string' || typeof o.his !== 'string') fail('give --mine "<my sentence>" and --his "<his sentence>"');
  const rows = readRows('corpus');
  if (rows.some((r) => r.mine === o.mine && r.his === o.his)) { process.stdout.write('PENA: already stored, nothing added\n'); return; }
  const row = { id: 'c' + (rows.length + 1), date: new Date().toISOString().slice(0, 10), ticket: typeof o.ticket === 'string' ? o.ticket : '', surface: typeof o.surface === 'string' ? o.surface : '', module: o.module, mine: o.mine, his: o.his, his_words: typeof o['his-words'] === 'string' ? o['his-words'] : '', source: 'pena add' };
  appendRow('corpus', row);
  process.stdout.write('PENA: stored ' + row.id + ' under ' + row.module + '\n');
  log({ cmd: 'add', module: row.module, id: row.id, outcome: 'stored' });
}

function cmdKeyword(o) {
  if (typeof o.word !== 'string' || typeof o.meant !== 'string' || typeof o.evidence !== 'string') fail('give --word "<his word>" --meant "<what he meant>" --evidence "<ticket + his words>"');
  const row = { word: o.word.toLowerCase(), date: new Date().toISOString().slice(0, 10), meant: o.meant, evidence: o.evidence, module: typeof o.module === 'string' ? o.module : '', reading: typeof o.reading === 'string' ? o.reading : 'mine, from the reply he accepted' };
  appendRow('keywords', row);
  process.stdout.write('PENA: keyword "' + row.word + '" stored\n');
  log({ cmd: 'keyword', word: row.word, outcome: 'stored' });
}

function cmdAnalyze(o) {
  const days = Number(o.days) > 0 ? Number(o.days) : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const corpus = readRows('corpus').filter((c) => (c.date || '') >= since);
  const keywords = readRows('keywords');
  const modules = readJson('modules');
  const count = {};
  for (const c of corpus) count[c.module] = (count[c.module] || 0) + 1;
  const out = ['PENA ANALYZE: ' + corpus.length + ' changed sentence(s) since ' + since];
  for (const m of Object.keys(modules).sort((a, b) => (count[b] || 0) - (count[a] || 0))) out.push('  ' + m + ': ' + (count[m] || 0));
  const repeat = Object.keys(count).filter((m) => count[m] >= 3);
  out.push('', 'REPEATS (3 or more in the window = the module is not holding; tighten its rule or its check):');
  if (!repeat.length) out.push('  none');
  for (const m of repeat) {
    out.push('  ' + m + ' (' + count[m] + '): ' + modules[m].means);
    for (const c of corpus.filter((x) => x.module === m).slice(-3)) out.push('      #' + (c.ticket || '-') + ' his: "' + String(c.his).slice(0, 110) + '"');
  }
  const byWord = {};
  for (const k of keywords) (byWord[k.word] = byWord[k.word] || []).push(k);
  out.push('', 'KEYWORDS (his word = what he meant):');
  for (const [w, list] of Object.entries(byWord)) {
    const meanings = [...new Set(list.map((k) => k.meant))];
    out.push('  ' + w + (meanings.length > 1 ? '  [' + meanings.length + ' meanings: ask which]' : '') + ': ' + meanings.join(' | '));
  }
  const runs = readRows('log').filter((r) => r.cmd === 'check');
  const dirty = runs.filter((r) => r.findings > 0).length;
  out.push('', 'CHECK RUNS: ' + runs.length + ' · with findings ' + dirty);
  process.stdout.write(out.join('\n') + '\n');
  log({ cmd: 'analyze', days, rows: corpus.length, repeats: repeat, outcome: 'printed' });
}

function main() {
  const o = args(process.argv.slice(2));
  const cmd = o._[0];
  if (cmd === 'list') return cmdList();
  if (cmd === 'show') return cmdShow(o);
  if (cmd === 'check') return cmdCheck(o);
  if (cmd === 'add') return cmdAdd(o);
  if (cmd === 'keyword') return cmdKeyword(o);
  if (cmd === 'analyze') return cmdAnalyze(o);
  fail('usage: node lib/pena.js <list|show|check|add|keyword|analyze> ...');
}
main();
