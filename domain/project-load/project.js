#!/usr/bin/env node
// project.js — the project system's one module (domain/project-load v2, born 2026-10-17)
// goal: a project or quest survives auto-compaction and new sessions: its spec, hard rules, decisions and next
//       step are re-injected by hooks, his words are copied out of the transcript by script, and a decision or a
//       delegated report that was not written down stops the turn.
// Used by: project-load.check.hook.js (UserPromptSubmit) · project-load.resume.hook.js (SessionStart compact|resume)
//          · project-load.precompact.hook.js (PreCompact) · project-load.save.hook.js (Stop) · lib/save-rules.js
//          · .claude/skills/project/SKILL.md (CLI).
// CLI:  node domain/project-load/project.js card <Name> [--kind mention|compact|resume]
//       node domain/project-load/project.js drill <Name>            (prints exactly what a compact start injects)
//       node domain/project-load/project.js new <Name> --aliases "a,b" [--repo <dir>]
//       node domain/project-load/project.js decide <Name> --decision "..." --why "..." --who "..." [--serves S1]
//       node domain/project-load/project.js words <Name> --transcript <file.jsonl> [--session <id>]
//       node domain/project-load/project.js check <Name>
//       node domain/project-load/project.js unbind <Name> --session <id> [--all] [--reason "..."]   (not delegated; --all: not bound)
//       node domain/project-load/project.js bind <Name> --session <id> [--report <file>.md]          (repair a binding)
// The transcript format is internal to Claude Code (docs: it changes between versions): every parser here fails open.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
function mainRootOf(root) {
  try { return require(path.join(root, 'lib', 'states.js')).mainRoot(root); } catch (_) { return String(root).replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/, ''); }
}
const MAIN = path.resolve(process.env.PROJECT_LOAD_MAIN_ROOT || mainRootOf(ROOT));
const ACTIVE = path.join(MAIN, 'projects', 'coding-projects', 'active');
const LOG = process.env.PROJECT_LOAD_LOG || path.join(MAIN, 'domain', 'project-load', 'log.jsonl');
const ACTIVE_TXT = process.env.PROJECT_LOAD_ACTIVE_TXT || path.join(MAIN, 'quest', 'active.txt');
const TEMPLATES = path.join(__dirname, 'templates');

const CARD_MAX = 9300;          // one project's card; the harness cuts hook output over 10,000 characters to a 2,000-char preview
const SESSION_MAX = 9500;       // everything one SessionStart prints (the cut is per hook output, at 10,000)
const START_MAX = 20000;        // START.md stays short (about 5,000 tokens, his ruling 2026-10-16)
const START_HEADINGS = ['Goal', 'Spec', 'Hard rules', 'State now', 'Next step', 'Open decisions'];
const REPORT_HEADINGS = [['What changed', /^#+\s*(\d+\.\s*)?What changed/im], ['Decisions made', /^#+\s*(\d+\.\s*)?Decisions made/im],
  ['Open questions for みや', /^#+\s*(\d+\.\s*)?Open questions/im], ['Blockers', /^#+\s*(\d+\.\s*)?Blockers/im],
  ['Unverified', /^#+\s*(\d+\.\s*)?Unverified/im], ['Next step', /^#+\s*(\d+\.\s*)?Next step/im]];
const OPEN_QUEST = new Set(['active', 'hold', 'blocked', 'delegated']);

const read = (p) => { try { return fs.readFileSync(p, 'utf8').replace(/^﻿/, ''); } catch (_) { return null; } };
const mtime = (p) => { try { return fs.statSync(p).mtimeMs; } catch (_) { return 0; } };
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => ymd(new Date());
const stamp = (ms) => { const d = new Date(ms); return ymd(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function cut(s, n) { s = String(s || '').trim(); return s.length <= n ? s : s.slice(0, Math.max(0, n - 40)).replace(/\s+\S*$/, '') + ' …(cut, read the file)'; }

// ---------- projects ----------
function listProjects() {
  let dirs; try { dirs = fs.readdirSync(ACTIVE, { withFileTypes: true }); } catch (_) { return []; }
  const out = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    let j; try { j = JSON.parse(read(path.join(ACTIVE, d.name, 'project.json'))); } catch (_) { continue; }
    if (!j || typeof j !== 'object') continue;
    const name = typeof j.name === 'string' && j.name ? j.name : d.name;
    const aliases = [...new Set([name].concat(Array.isArray(j.aliases) ? j.aliases : []).map(a => String(a || '').trim().toLowerCase()).filter(a => a.length >= 3))];
    out.push({ name, dir: path.join(ACTIVE, d.name), index: typeof j.index === 'string' && j.index ? j.index : 'PROJECT.md', aliases, shape: Number(j.shape) || 1, manifest: j });
  }
  return out;
}
function findProject(name) { const n = String(name || '').toLowerCase(); return listProjects().find(p => p.name.toLowerCase() === n || p.aliases.includes(n)) || null; }
function namedIn(prompt, projects) {
  const text = String(prompt || '').toLowerCase();
  return projects.filter(p => p.aliases.some(a => new RegExp('(^|[^a-z0-9])' + esc(a) + '([^a-z0-9]|$)').test(text)));
}

// ---------- markdown sections ----------
// "## 1. Goal (his words)" → key "goal". A section runs until the next heading of the same or a higher level.
function sections(md) {
  const out = {}; const lines = String(md || '').split(/\r?\n/);
  let open = [];   // [{ key, level, buf }] — every heading collects its lines until a heading of the same or a higher level
  const close = (s) => { if (!(s.key in out)) out[s.key] = s.buf.join('\n').trim(); };
  let fence = false;
  for (const l of lines) {
    if (/^\s*```/.test(l)) fence = !fence;
    const m = !fence && /^(#{1,6})\s+(.*)$/.exec(l);
    if (m) {
      const level = m[1].length;
      open = open.filter(s => { if (s.level >= level) { close(s); return false; } return true; });
      for (const s of open) s.buf.push(l);
      open.push({ key: m[2].replace(/^\d+[.)]\s*/, '').replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase(), level, buf: [] });
      continue;
    }
    for (const s of open) s.buf.push(l);
  }
  for (const s of open) close(s);
  return out;
}
function section(map, heading) { const h = heading.toLowerCase(); if (h in map) return map[h]; const k = Object.keys(map).find(x => x.startsWith(h)); return k ? map[k] : null; }
function lastDecisions(p, n) {
  const t = read(path.join(p.dir, 'DECISIONS.md')); if (!t) return [];
  return t.split(/\r?\n/).filter(l => /^\|\s*\d+\s*\|/.test(l)).slice(-n);
}

// ---------- the card ----------
function card(p, opts) {
  const o = opts || {};
  const max = o.max || CARD_MAX;
  const startPath = path.join(p.dir, 'START.md');
  const start = read(startPath);
  const head = [];
  if (o.kind === 'compact' || o.kind === 'resume') {
    head.push('🧭 project-load: ' + p.name + ' — PROJECT CARD — ' + (o.kind === 'compact' ? 'this session was just COMPACTED' : 'this session was RESUMED') + '. The summary is not the record; these files are.');
  } else head.push('📂 project-load: ' + p.name + ' — PROJECT CARD (cut from its START.md; the files are the record, not memory).');
  head.push('   Folder (main checkout, not in git): ' + p.dir);
  if (!start || p.shape < 2) {
    const idx = path.join(p.dir, p.index);
    head.push(fs.existsSync(idx) ? '   READ FIRST: ' + idx : '   ⚠️ its index is MISSING: ' + idx + ' — create it first (/project skill).');
    head.push('   It is the index: state now, which file answers which question, hard rules, how to resume. Then open only the file its table names.');
    head.push('   Every bulk change ends with: VERSIONS.md row + PROJECT.md state + ROADMAP.md status, same turn (Domain Expansion checks this with lib/save-rules.js).');
    if (o.kind === 'compact' || o.kind === 'resume') head.push('   Re-read that index now, before the next step. ' + minedLine(o, 'its decisions record'));
    return head.join('\n') + '\n';
  }
  head.push('   READ FIRST: ' + startPath + '  (then only the file its table names)');
  if (o.kind === 'compact' || o.kind === 'resume') head.push('   ' + minedLine(o) + ' Never re-decide a row of DECISIONS.md.');
  if (o.report) head.push('   YOU ARE A DELEGATED SESSION. Your report: ' + o.report + ' — headings: ' + REPORT_HEADINGS.map(h => h[0]).join(' · ') + '. Update it at every bulk change and before every end of turn (the Stop gate checks).');
  const foot = '   Rules of the system: every deliverable names the spec row it serves (S1, S2 …). A decision (his ruling, an agreed fix, a spec change) goes into DECISIONS.md the moment it is made: node domain/project-load/project.js decide ' + JSON.stringify(p.name) + ' --decision "…" --why "…" --who "…" --serves S#. The Stop gate blocks a reply that states a decision with no ledger write.';
  const map = sections(start);
  const caps = { 'goal': 0.15, 'spec': 0.24, 'hard rules': 0.22, 'state now': 0.10, 'next step': 0.07, 'open decisions': 0.08 };
  const dec = lastDecisions(p, 5);
  const budget = max - head.join('\n').length - foot.length - 260 - Math.min(2100, dec.reduce((n, r) => n + Math.min(420, r.length) + 1, 0));
  // Each section gets its share; what a short section leaves unused passes to the sections that would be cut.
  const texts = START_HEADINGS.map(h => section(map, h));
  const capSum = Object.values(caps).reduce((x, y) => x + y, 0);
  const alloc = START_HEADINGS.map(h => Math.floor(budget * caps[h.toLowerCase()] / capSum));
  for (let pass = 0; pass < 4; pass++) {
    let spare = 0; const want = [];
    texts.forEach((s, i) => { const len = s === null ? 0 : s.length; if (len < alloc[i]) { spare += alloc[i] - len; alloc[i] = len; } else if (len > alloc[i]) want.push(i); });
    if (!spare || !want.length) break;
    const need = want.reduce((n, i) => n + texts[i].length - alloc[i], 0);
    for (const i of want) alloc[i] += Math.floor(spare * (texts[i].length - alloc[i]) / need);
  }
  const body = [];
  START_HEADINGS.forEach((h, i) => {
    body.push('── ' + h.toUpperCase() + ' ──');
    body.push(texts[i] === null ? '   (START.md has no "' + h + '" section)' : cut(texts[i], Math.max(alloc[i], 120)));
  });
  body.push('── LAST DECISIONS (DECISIONS.md, newest last) ──');
  body.push(dec.length ? dec.map(r => cut(r, 420)).join('\n') : '   (none yet)');
  let text = head.join('\n') + '\n' + body.join('\n') + '\n' + foot + '\n';
  if (text.length > max) text = text.slice(0, max - 60) + '\n…(card cut at ' + max + ' characters: read START.md)\n';
  return text;
}
function minedLine(o, ledger) {
  const where = ledger || 'DECISIONS.md';
  if (o.mined === undefined || o.mined === null) return 'His words are copied to history\\words.md at every compaction and at /project save.';
  return o.mined + ' of his prompt(s) were copied to history\\words.md just before the compaction: read the newest ones now and put any decision in them into ' + where + '.';
}

// ---------- quests (read only: the quest save path is unchanged) ----------
function questBlocks() {
  const t = read(ACTIVE_TXT); if (!t) return [];
  const out = [];
  for (const b of t.split(/\r?\n\s*\r?\n/)) {
    const f = {}; for (const l of b.split(/\r?\n/)) { const m = /^\s*([a-z_]+)=(.*)$/.exec(l); if (m && !(m[1] in f)) f[m[1]] = m[2].trim(); }
    if (f.qa) out.push(f);
  }
  return out;
}
function questCard(q, max) {
  const lim = max || 2600;
  const lines = ['🎫 QUEST CARD — ' + q.qa + ' (status ' + (q.status || '?') + ', phase ' + (q.current_phase || q.phase || '?') + '). The qa_doc is the record.'];
  for (const k of ['issue_one_liner', 'branch', 'qa_doc', 'task_folder']) if (q[k]) lines.push('   ' + k + ': ' + cut(q[k], 260));
  const doc = q.qa_doc ? read(path.join(MAIN, q.qa_doc.replace(/\//g, path.sep))) : null;
  if (doc) {
    const m = sections(doc);
    const rp = section(m, '0. resume point') || section(m, 'resume point');
    lines.push('── RESUME POINT ──');
    lines.push(cut(rp !== null ? rp : doc.split(/\r?\n/).slice(0, 40).join('\n'), Math.max(400, lim - lines.join('\n').length - 120)));
  }
  lines.push('   Re-read the qa_doc before the next step; never re-derive what its Resume Point already proves.');
  return cut(lines.join('\n'), lim) + '\n';
}

// ---------- the log (one row per fire; the session→project binding lives here) ----------
function logRows() { const t = read(LOG); if (!t) return []; const out = []; for (const l of t.split('\n').slice(-4000)) { try { const r = JSON.parse(l); if (r && r.ts) out.push(r); } catch (_) {} } return out; }
function logAppend(row) { try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, JSON.stringify(Object.assign({ ts: new Date().toISOString() }, row)) + '\n'); } catch (_) {} }
// prompts copied since this session last got a card for the project (several compactions can come between two cards)
function minedSince(session, project) {
  let n = 0;
  for (const r of logRows()) { if (r.session !== session || r.project !== project) continue; if (r.action === 'resumed') n = 0; else if (r.action === 'compact') n += Number(r.mined) || 0; }
  return n;
}
function bindings(session) {
  const out = new Map();
  for (const r of logRows()) {
    if (r.session !== session || !r.project) continue;
    if (r.action === 'unbound') {   // a later unbind wins: report_only keeps the project card, otherwise the binding goes
      if (r.report_only) { const b = out.get(r.project); if (b) b.report = null; } else out.delete(r.project);
      continue;
    }
    if (r.action !== 'fired' && r.action !== 'bound') continue;
    const b = out.get(r.project) || { project: r.project, first: r.ts, report: null };
    if (r.report) b.report = r.report;
    out.set(r.project, b);
  }
  return [...out.values()];
}

// ---------- transcript ----------
function transcriptLines(file, tailBytes) {
  try {
    if (!tailBytes) return fs.readFileSync(file, 'utf8').split('\n');
    const st = fs.statSync(file); const len = Math.min(st.size, tailBytes);
    const fd = fs.openSync(file, 'r'); const buf = Buffer.alloc(len); fs.readSync(fd, buf, 0, len, st.size - len); fs.closeSync(fd);
    const lines = buf.toString('utf8').split('\n'); if (len < st.size) lines.shift();
    return lines;
  } catch (_) { return []; }
}
function entryText(o) {
  const c = o && o.message && o.message.content;
  let t = typeof c === 'string' ? c : Array.isArray(c) && !c.some(x => x && x.type === 'tool_result') ? c.filter(x => x && x.type === 'text').map(x => x.text).join('\n') : '';
  t = String(t || '').replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();
  const cmd = /<command-name>\s*([^<]+?)\s*<\/command-name>/.exec(t);
  if (cmd) { const a = /<command-args>([\s\S]*?)<\/command-args>/.exec(t); t = (cmd[1].startsWith('/') ? cmd[1] : '/' + cmd[1]) + (a && a[1].trim() ? ' ' + a[1].trim() : ''); }
  return t;
}
// His prompts: typed by him (turnOrigin human) or the brief that started a delegated session (sdk). Never tool results,
// skill expansions (isMeta), compaction summaries, task notifications or messages from other sessions.
function humanPrompts(file) {
  const out = [];
  for (const l of transcriptLines(file)) {
    if (!l || l[0] !== '{') continue;
    let o; try { o = JSON.parse(l); } catch (_) { continue; }
    if (o.type !== 'user' || o.isMeta || o.isCompactSummary || o.isSidechain) continue;
    // His answers in a popup (AskUserQuestion) are his words too: a ruling often lives only there (DawahMap 2026-10-11..13).
    const tur = o.toolUseResult;
    if (tur && tur.answers && typeof tur.answers === 'object' && !Array.isArray(tur.answers)) {
      const notes = tur.annotations && typeof tur.annotations === 'object' ? tur.annotations : {};
      const qa = Object.keys(tur.answers).map(q => 'Q: ' + q + '\nA: ' + tur.answers[q] + (notes[q] && notes[q].notes ? '\nNote: ' + notes[q].notes : '')).join('\n\n');
      if (qa) out.push({ uuid: o.uuid || '', ts: o.timestamp || '', origin: 'popup', session: o.sessionId || '', text: qa });
      continue;
    }
    const origin = o.turnOrigin || o.promptSource || '';
    if (origin && !/^(human|sdk|user|cli)$/.test(origin)) continue;
    const text = entryText(o);
    if (!text || /^<task-notification>/.test(text) || /^This session is being continued from a previous conversation/.test(text)) continue;
    out.push({ uuid: o.uuid || '', ts: o.timestamp || '', origin: origin || 'human', session: o.sessionId || '', text });
  }
  return out;
}
function lastSummary(file) {
  let best = null;
  for (const l of transcriptLines(file, 8 * 1024 * 1024)) { if (l.indexOf('isCompactSummary') < 0) continue; try { const o = JSON.parse(l); if (o.isCompactSummary) best = { uuid: o.uuid, ts: o.timestamp, text: entryText(o) }; } catch (_) {} }
  return best;
}
function turnStartMs(file) {
  for (const tail of [3 * 1024 * 1024, 0]) {
    const lines = transcriptLines(file, tail);
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i]; if (!l || l.indexOf('"type":"user"') < 0) continue;
      let o; try { o = JSON.parse(l); } catch (_) { continue; }
      if (o.type !== 'user' || o.isMeta || o.isCompactSummary) continue;
      const c = o.message && o.message.content;
      if (Array.isArray(c) && c.some(x => x && x.type === 'tool_result')) continue;
      const ms = Date.parse(o.timestamp); if (ms) return ms;
    }
    if (!tail) break;
  }
  return null;
}
function sessionStartMs(file) {
  for (const l of transcriptLines(file, 0).slice(0, 60)) { try { const o = JSON.parse(l); const ms = Date.parse(o.timestamp); if (ms) return ms; } catch (_) {} }
  return null;
}
function questsNamed(file, blocks) {
  const prompts = humanPrompts(file).slice(-60);
  const hits = [];
  for (let i = prompts.length - 1; i >= 0; i--) {
    const t = prompts[i].text;
    for (const q of blocks) {
      if (!OPEN_QUEST.has(q.status) || hits.includes(q)) continue;
      const id = q.qa, num = (/(\d{6})/.exec(id) || [])[1];
      if (new RegExp('(^|[^A-Za-z0-9-])' + esc(id) + '([^A-Za-z0-9-]|$)', 'i').test(t) || (num && new RegExp('(^|[^0-9])' + num + '([^0-9]|$)').test(t))) hits.push(q);
    }
    if (hits.length >= 2) break;
  }
  return hits;
}

// ---------- his words → history\words.md ----------
function mineWords(p, file, opts) {
  const o = opts || {};
  const hist = path.join(p.dir, 'history'); const out = path.join(hist, 'words.md');
  const have = read(out) || '';
  const seen = new Set((have.match(/<!-- uuid:([^ ]+) -->/g) || []).map(s => s.slice(10, -4)));
  const since = o.sinceTs ? Date.parse(o.sinceTs) - 120000 : 0;
  const all = humanPrompts(file);
  const bySession = o.session && all.some(x => x.session === o.session);   // a resumed transcript can carry an older session id
  const fresh = all.filter(x => x.uuid && !seen.has(x.uuid) && (!since || Date.parse(x.ts) >= since) && (!bySession || !x.session || x.session === o.session));
  if (!fresh.length) return { added: 0, file: out };
  const parts = [];
  if (!have) parts.push('# ' + p.name + ' — his words, copied from the session transcripts by script\n\n> Never edited by hand. Newest at the bottom. Written by `node domain/project-load/project.js words` (run at every compaction by the PreCompact hook, and at /project save). A decision found here goes into DECISIONS.md.\n');
  for (const x of fresh) {
    parts.push('\n### ' + (x.ts ? stamp(Date.parse(x.ts)) : '?') + ' · ' + (x.origin === 'sdk' ? 'brief from another session' : x.origin === 'popup' ? 'his popup answer' : 'typed by him') + ' · session ' + String(x.session).slice(0, 8) + ' <!-- uuid:' + x.uuid + ' -->\n');
    parts.push(x.text.split(/\r?\n/).map(l => '> ' + l).join('\n') + '\n');
  }
  try { fs.mkdirSync(hist, { recursive: true }); fs.appendFileSync(out, parts.join('')); } catch (e) { return { added: 0, file: out, error: e.message }; }
  return { added: fresh.length, file: out };
}
function saveSummary(p, file) {
  const s = lastSummary(file); if (!s || !s.text) return false;
  const out = path.join(p.dir, 'history', 'compactions.md');
  const have = read(out) || '';
  if (s.uuid && have.includes('<!-- uuid:' + s.uuid + ' -->')) return false;
  try { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.appendFileSync(out, (have ? '' : '# ' + p.name + ' — compaction summaries (copied by script; the summary is lossy, history\\words.md and DECISIONS.md are the record)\n') + '\n## ' + (s.ts ? stamp(Date.parse(s.ts)) : '?') + ' <!-- uuid:' + s.uuid + ' -->\n\n' + s.text + '\n'); } catch (_) { return false; }
  return true;
}

// ---------- the decisions ledger ----------
const DECISION_HEADER = '| # | Date | Decision | Why | Who | Serves |\n|---|---|---|---|---|---|';
function decide(p, d) {
  const f = path.join(p.dir, 'DECISIONS.md');
  let t = read(f);
  if (t === null) { t = '# ' + p.name + ' — decisions ledger\n\n> One row per decision, written the moment it is made (his ruling, an agreed fix, a spec change). Never re-decided without a new row that names the old one.\n\n' + DECISION_HEADER + '\n'; fs.writeFileSync(f, t); }
  const nums = t.split(/\r?\n/).map(l => /^\|\s*(\d+)\s*\|/.exec(l)).filter(Boolean).map(m => Number(m[1]));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  const cell = (s) => String(s || '').replace(/\|/g, '/').replace(/\r?\n/g, ' ').trim();
  const row = '| ' + n + ' | ' + (d.date || today()) + ' | ' + cell(d.decision) + ' | ' + cell(d.why) + ' | ' + cell(d.who) + ' | ' + cell(d.serves || '') + ' |\n';
  fs.appendFileSync(f, (t.endsWith('\n') ? '' : '\n') + row);
  return n;
}

// ---------- checks ----------
function newestChange(dir, sinceMs, skipDirs) {
  let best = 0, bestFile = null;
  const skip = new Set((skipDirs || ['reports', 'history', 'media', 'node_modules', '.git']).map(s => s.toLowerCase()));
  (function walk(d, depth) {
    let ents; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (_) { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (depth < 3 && !skip.has(e.name.toLowerCase())) walk(p, depth + 1); continue; }
      const m = mtime(p); if (m > best && (!sinceMs || m >= sinceMs)) { best = m; bestFile = p; }
    }
  })(dir, 0);
  return { ms: best, file: bestFile };
}
function reportMissing(text) { return REPORT_HEADINGS.filter(h => !h[1].test(String(text || ''))).map(h => h[0]); }
function checkShape2(p) {
  const errs = [];
  if (p.shape < 2) return errs;
  if (p.index !== 'START.md') errs.push('project.json "index" is ' + JSON.stringify(p.index) + ', not "START.md"');
  const start = read(path.join(p.dir, 'START.md'));
  if (start === null) errs.push('START.md missing');
  else {
    const map = sections(start);
    const miss = START_HEADINGS.filter(h => section(map, h) === null);
    if (miss.length) errs.push('START.md lacks section(s): ' + miss.join(', '));
    if (start.length > START_MAX) errs.push('START.md is ' + start.length + ' characters (max ' + START_MAX + ')');
    if (!/^\s*\|?\s*S\d+\b/m.test(section(map, 'spec') || '')) errs.push('START.md "Spec" has no numbered row (S1, S2 …)');
  }
  const dec = read(path.join(p.dir, 'DECISIONS.md'));
  if (dec === null) errs.push('DECISIONS.md missing');
  else if (!/\|\s*#\s*\|\s*Date\s*\|\s*Decision\s*\|/i.test(dec)) errs.push('DECISIONS.md has no "| # | Date | Decision |" table');
  return errs;
}
// Stop-log verdict per delegated report (read by lib/save-rules.js at Domain Expansion)
function reportVerdicts(projectName, dayIso) {
  const last = new Map();
  // the row's LOCAL day, as save-rules counts today (a UTC slice skipped every row written 00:00-08:00 MYT, 2026-10-20)
  for (const r of logRows()) if (r.action === 'stop-check' && r.project === projectName && r.report && (!dayIso || ymd(new Date(Date.parse(r.ts))) >= dayIso)) last.set(r.session + '\u0000' + r.report, r);
  const out = [];
  for (const r of last.values()) {
    const now = mtime(r.report);
    const stale = r.last_change && (now + 2000 < r.last_change);
    const missing = !fs.existsSync(r.report);
    out.push({ report: r.report, session: r.session, ok: !stale && !missing, why: missing ? 'report missing' : stale ? 'report older than the session\'s last change (' + path.basename(r.last_change_file || '?') + ')' : 'current' });
  }
  return out;
}

// ---------- scaffold ----------
function scaffold(name, opts) {
  const o = opts || {};
  const dir = path.join(ACTIVE, name);
  if (fs.existsSync(path.join(dir, 'project.json'))) throw new Error(dir + ' already holds a project.json');
  fs.mkdirSync(path.join(dir, 'history'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'reports'), { recursive: true });
  const vars = { NAME: name, DATE: today(), DIR: dir };
  const written = [];
  for (const f of fs.readdirSync(TEMPLATES)) {
    const target = path.join(dir, f === 'report.md' ? path.join('reports', '_template.md') : f);
    if (fs.existsSync(target)) continue;
    let t = read(path.join(TEMPLATES, f)).replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m);
    if (f === 'project.json') { const j = JSON.parse(t); j.aliases = [...new Set([name.toLowerCase()].concat((o.aliases || []).map(a => String(a).toLowerCase())))]; if (o.repo) j.repo = o.repo; t = JSON.stringify(j, null, 2) + '\n'; }
    fs.writeFileSync(target, t); written.push(target);
  }
  return written;
}

module.exports = { MAIN, ACTIVE, LOG, ACTIVE_TXT, CARD_MAX, SESSION_MAX, START_HEADINGS, REPORT_HEADINGS, listProjects, findProject, namedIn, mainRootOf, sections, section, card, questBlocks, questCard, questsNamed, logRows, logAppend, bindings, minedSince, humanPrompts, lastSummary, turnStartMs, sessionStartMs, mineWords, saveSummary, decide, newestChange, reportMissing, checkShape2, reportVerdicts, scaffold, read, mtime };

// ---------- CLI ----------
if (require.main === module) {
  const a = process.argv.slice(2);
  const flag = (n) => { const i = a.indexOf('--' + n); return i >= 0 && a[i + 1] !== undefined ? a[i + 1] : undefined; };
  const cmd = a[0], name = a[1];
  const need = () => { const p = findProject(name); if (!p) { console.error('no project named ' + JSON.stringify(name) + ' under ' + ACTIVE); process.exit(2); } return p; };
  try {
    if (cmd === 'card') { const p = need(); process.stdout.write(card(p, { kind: flag('kind') || 'mention' })); }
    else if (cmd === 'drill') {
      const p = need(); const resume = require(path.join(__dirname, 'project-load.resume.hook.js'));
      const text = resume.composeFor({ projects: [p], quests: [], kind: 'compact', mined: { [p.name]: Number(flag('mined') || 0) } });
      process.stdout.write(text + '\n[drill] ' + text.length + ' characters (the harness cuts at 10,000)\n');
    }
    else if (cmd === 'new') { const w = scaffold(name, { aliases: String(flag('aliases') || '').split(',').map(s => s.trim()).filter(Boolean), repo: flag('repo') }); console.log('created:\n  ' + w.join('\n  ')); }
    else if (cmd === 'decide') { const p = need(); if (!flag('decision') || !flag('why') || !flag('who')) { console.error('decide needs --decision --why --who'); process.exit(2); } const n = decide(p, { decision: flag('decision'), why: flag('why'), who: flag('who'), serves: flag('serves'), date: flag('date') }); logAppend({ action: 'decided', project: p.name, n }); console.log('DECISIONS.md row ' + n + ' written: ' + path.join(p.dir, 'DECISIONS.md')); }
    else if (cmd === 'unbind') {   // unbind <Name> --session <id> [--all] [--reason "..."]: not delegated (default) or not bound at all
      const p = need(); const s = flag('session'); if (!s) { console.error('unbind needs --session <session id>'); process.exit(2); }
      const all = a.includes('--all');
      logAppend({ action: 'unbound', via: 'cli', report_only: !all, session: s, project: p.name, ...(flag('reason') ? { reason: flag('reason') } : {}) });
      console.log(p.name + ': session ' + s + (all ? ' unbound' : ' no longer delegated (report check off, card kept)'));
    }
    else if (cmd === 'bind') {   // bind <Name> --session <id> [--report <file.md>]: repair a binding by hand
      const p = need(); const s = flag('session'); if (!s) { console.error('bind needs --session <session id>'); process.exit(2); }
      const rep = flag('report') ? path.join(p.dir, 'reports', path.basename(flag('report'))) : null;
      logAppend({ action: 'bound', via: 'cli', session: s, project: p.name, ...(rep ? { report: rep } : {}) });
      console.log(p.name + ': session ' + s + ' bound' + (rep ? ', delegated, report ' + rep : ''));
    }
    else if (cmd === 'words') { const p = need(); const t = flag('transcript'); if (!t) { console.error('words needs --transcript <file.jsonl>'); process.exit(2); } const r = mineWords(p, t, { session: flag('session'), sinceTs: flag('since') }); console.log(r.added + ' prompt(s) added to ' + r.file + (r.error ? ' (error: ' + r.error + ')' : '')); }
    else if (cmd === 'check') { const p = need(); const e = checkShape2(p); console.log(p.shape < 2 ? p.name + ': shape 1 (no START.md checks)' : e.length ? 'FAIL ' + p.name + ':\n  ' + e.join('\n  ') : 'PASS ' + p.name + ': START.md, DECISIONS.md, index'); process.exit(e.length ? 1 : 0); }
    else { console.log('usage: project.js card|drill|new|decide|words|check|unbind|bind <Name> [...]'); process.exit(cmd ? 2 : 0); }
  } catch (e) { console.error('project.js: ' + e.message); process.exit(1); }
}
