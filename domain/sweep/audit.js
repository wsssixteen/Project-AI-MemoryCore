#!/usr/bin/env node
// domain/sweep/audit.js — the /sweep run audit (Tool, called by the sweep skill at Step 0 and Step 7).
// Reads every familiar transcript of the run + the main folder's hook log, writes ONE ledger row,
// flags defects, and names the refinement each defect class asks for, judged against the goal
// (accuracy first, speed second). Self-audits by reading the row back (system-design Rule 16).
//
// USAGE:
//   node domain/sweep/audit.js flag on [--hours 4]      orchestration flag in the MAIN folder (hooks read it there)
//   node domain/sweep/audit.js flag off
//   node domain/sweep/audit.js run --tickets 286655,286646 --since <iso> [--scratch <dir>] [--subagents <dir>]
//        [--waves "<text>"] [--skips <json>] [--verified <n>] [--w4-changed <t,t>] [--controller-caught <t,t>]
//        [--resumed] [--run-id <id>] [--write] [--json]
//   node domain/sweep/audit.js audit                    self-audit the last ledger row only
// Exit: 0 PASS (no open run defect) · 1 FAIL (a run defect or a ledger read-back failure) · 2 usage error.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && i + 1 < args.length ? args[i + 1] : d; };
const has = k => args.includes(k);

// The MAIN folder: hooks, telemetry and the ledger live there, never in a worktree copy.
function mainFolder() {
  if (process.env.SWEEP_MAIN) return path.resolve(process.env.SWEEP_MAIN);
  try {
    const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'],
      { cwd: __dirname, encoding: 'utf8', windowsHide: true }).trim();
    return path.dirname(common);
  } catch { return path.resolve(__dirname, '..', '..'); }
}
const MAIN = mainFolder();
const FLAG = path.join(MAIN, 'system', 'orchestration-mode.flag');
const LEDGER = path.join(MAIN, 'domain', 'sweep', 'log.jsonl');
const HOOKLOG = path.join(MAIN, 'system', 'telemetry', 'hook-fires.jsonl');
const QUESTS = path.join(MAIN, 'projects', 'coding-projects', 'active');

// Refinement per defect class. `accuracy` says what the fix does to accuracy; a fix that would
// lower it is never proposed (the sweep's goal puts accuracy first).
const CLASSES = {
  'blind-break':        { sev: 'run', fix: 'W3 opened the qa_doc: discard that W3 pass and re-run it blind', refine: 'pass W3 its facts in-prompt only and name the banned files in the prompt', accuracy: 'restores the independent second pass' },
  'task-folder-write':  { sev: 'run', fix: 'remove the written file from the Task folder after reading it', refine: 'safety clause 6 in the prompt; check the write path in the prompt template', accuracy: 'none' },
  'write-outside-scratch': { sev: 'warn', fix: 'bank the file from where it landed', refine: 'give each familiar its exact scratch output path in the prompt', accuracy: 'none' },
  'spawned-agent':      { sev: 'run', fix: 'check the sub-agent output as untrusted data', refine: 'safety clause 2 in the prompt', accuracy: 'keeps one checked answer per familiar' },
  'no-return-table':    { sev: 'run', fix: 're-run only that (ticket, wave) cell', refine: 'put the forced output schema at the END of the prompt', accuracy: 'a missing answer is a missing check' },
  'baseline-not-pinned':{ sev: 'warn', fix: 'controller re-checks that familiar\'s code claims against origin/mlk/master', refine: 'state "read code with git show origin/mlk/master:<path>" in the prompt', accuracy: 'stops findings from a stale local branch' },
  'background-job':     { sev: 'warn', fix: 'stop the job the familiar left running', refine: 'ban run_in_background in the familiar prompt', accuracy: 'none' },
  'tool-errors-high':   { sev: 'warn', fix: 'read that familiar\'s failed calls before trusting its answer', refine: 'name the right MCP server and schema prefix in the prompt', accuracy: 'a failed query can hide a wrong conclusion' },
  'not-banked':         { sev: 'run', fix: 'copy the wave file from scratch into the quest folder', refine: 'bank each file the moment its familiar returns', accuracy: 'the next session resumes from the banked file' },
  'flag-left':          { sev: 'run', fix: 'node domain/sweep/audit.js flag off', refine: 'Step 7 runs flag off before the audit', accuracy: 'none' },
  'flag-never-on':      { sev: 'warn', fix: 'none for this run', refine: 'Step 0 runs flag on (main folder) before the first launch', accuracy: 'none; costs extra Stop-hook turns' },
  'fable-familiar':     { sev: 'run', fix: 're-run the cell on sonnet or opus', refine: 'name the model in every Agent call', accuracy: 'none' },
};

function projectTranscriptDir() {
  const slug = process.cwd().replace(/[^A-Za-z0-9]/g, '-');
  return path.join(os.homedir(), '.claude', 'projects', slug);
}
function newestSubagentsDir() {
  const root = projectTranscriptDir();
  if (!fs.existsSync(root)) return null;
  const cands = fs.readdirSync(root).map(s => path.join(root, s, 'subagents')).filter(p => fs.existsSync(p));
  cands.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return cands[0] || null;
}

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

// One familiar's metrics + defects from its transcript.
function familiar(dir, f, ctx) {
  const id = f.replace(/^agent-|\.jsonl$/g, '');
  const metaPath = path.join(dir, `agent-${id}.meta.json`);
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch { /* no meta: still audited */ }
  const lines = readJsonl(path.join(dir, f));
  const stamps = lines.map(l => Date.parse(l.timestamp)).filter(n => !isNaN(n)).sort((a, b) => a - b);
  const desc = meta.description || '';
  const ticket = (desc.match(/\d{6}/) || [])[0] || null;
  const wave = (desc.match(/\bW[1-4](\+W[1-4])?\b/i) || [''])[0].toUpperCase();
  const tok = { total: 0, out: 0, cacheRead: 0 };
  const tools = {}; const reads = new Set(); const writes = []; const cmds = [];
  let errors = 0, bg = 0; const seen = new Set();
  for (const l of lines) {
    if (l.type === 'assistant') {
      const u = l.message && l.message.usage;
      if (u && !seen.has(l.requestId)) {
        seen.add(l.requestId);
        // new spend only; cache re-reads are counted apart (they repeat the same context each call)
        tok.total += (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.output_tokens || 0);
        tok.cacheRead += u.cache_read_input_tokens || 0;
        tok.out += u.output_tokens || 0;
      }
      for (const c of (l.message && l.message.content) || []) {
        if (c.type !== 'tool_use') continue;
        tools[c.name] = (tools[c.name] || 0) + 1;
        const inp = c.input || {};
        if (c.name === 'Read' && inp.file_path) reads.add(inp.file_path);
        if ((c.name === 'Write' || c.name === 'Edit') && inp.file_path) writes.push(inp.file_path);
        if (c.name === 'Bash' || c.name === 'PowerShell') { cmds.push(inp.command || ''); if (inp.run_in_background) bg++; }
      }
    } else if (l.type === 'user' && l.message && Array.isArray(l.message.content)) {
      for (const c of l.message.content) if (c.type === 'tool_result' && c.is_error) errors++;
    }
  }
  const texts = lines.filter(l => l.type === 'assistant').map(l => ((l.message && l.message.content) || []).filter(c => c.type === 'text').map(c => c.text).join('\n')).filter(Boolean);
  const defects = [];
  const norm = p => p.replace(/\//g, '\\').toLowerCase();
  if (/W3/.test(wave) && ticket) {
    const banned = [...reads].filter(p => new RegExp(`QA-${ticket}(\\.md|-audit|-verify)`, 'i').test(p));
    if (banned.length) defects.push({ class: 'blind-break', detail: banned.join(' | ') });
  }
  const shellWrites = cmds.filter(c => /(Set-Content|Out-File|Add-Content|Copy-Item|Move-Item|\bcp\b|\bmv\b|>\s*["']?[A-Za-z]:)/.test(c) && /1\. Tasks/i.test(c));
  const taskWrites = writes.filter(w => /1\. Tasks/i.test(w)).concat(shellWrites.map(c => 'shell: ' + c.slice(0, 100)));
  if (taskWrites.length) defects.push({ class: 'task-folder-write', detail: taskWrites.join(' | ') });
  if (ctx.scratch) {
    const out = writes.filter(w => !norm(w).startsWith(norm(ctx.scratch)));
    if (out.length) defects.push({ class: 'write-outside-scratch', detail: out.join(' | ') });
  }
  if ((tools.Agent || 0) + (tools.Workflow || 0) > 0) defects.push({ class: 'spawned-agent', detail: `${(tools.Agent || 0) + (tools.Workflow || 0)} launch(es)` });
  // the forced schema is pipe-separated (a markdown row or a bare `a | b | c` return line)
  if (!texts.some(t => t.split('\n').some(l => (l.match(/\|/g) || []).length >= 2))) defects.push({ class: 'no-return-table', detail: 'no pipe-separated answer line in any message' });
  const codeRead = [...reads].some(p => /etanah-(pelupusan|awam|common|teknikal)/i.test(p)) || cmds.some(c => /etanah-(pelupusan|awam|common|teknikal)/i.test(c));
  if (codeRead && !cmds.some(c => /origin\/mlk\/master/.test(c))) defects.push({ class: 'baseline-not-pinned', detail: 'read etanah code, never via origin/mlk/master' });
  if (bg) defects.push({ class: 'background-job', detail: `${bg} background command(s)` });
  const calls = Object.values(tools).reduce((a, b) => a + b, 0);
  if (calls >= 10 && errors / calls > 0.25) defects.push({ class: 'tool-errors-high', detail: `${errors} of ${calls} calls failed` });
  if (/fable/i.test(meta.model || '')) defects.push({ class: 'fable-familiar', detail: meta.model });
  return {
    id, desc, ticket, wave, model: meta.model || null, effort: meta.effort || null,
    start: stamps[0] || null, end: stamps[stamps.length - 1] || null,
    minutes: stamps.length ? +((stamps[stamps.length - 1] - stamps[0]) / 60000).toFixed(1) : 0,
    tokens: tok.total, tokens_out: tok.out, cache_read: tok.cacheRead, tool_calls: calls, tool_errors: errors,
    files_read: reads.size, db_queries: Object.entries(tools).filter(([k]) => /query_database|__query$/.test(k)).reduce((a, [, v]) => a + v, 0),
    defects,
  };
}

// Count orch-suppressed rows in the main hook log since the run start (streamed: the file is large).
// Rows carry no session id, so the window is bounded at both ends to keep other sessions out.
async function suppressedSince(sinceMs, untilMs) {
  if (!fs.existsSync(HOOKLOG)) return { count: null, gates: {} };
  const rl = readline.createInterface({ input: fs.createReadStream(HOOKLOG, 'utf8'), crlfDelay: Infinity });
  let count = 0; const gates = {};
  for await (const line of rl) {
    if (!line.includes('orch-suppressed')) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    const t = Date.parse(r.ts || r.timestamp);
    if (!isNaN(t) && t >= sinceMs && t <= untilMs) { count++; const g = r.hook || r.gate || r.name || '?'; gates[g] = (gates[g] || 0) + 1; }
  }
  return { count, gates };
}

function expectedFiles(ticket, wavesRun) {
  const files = [];
  if (/W1|W2/.test(wavesRun)) files.push(`QA-${ticket}.md`);
  if (/W3/.test(wavesRun)) files.push(`QA-${ticket}-wave3.md`);
  if (/W4/.test(wavesRun)) files.push(`QA-${ticket}-audit.md`);
  return files;
}

// Classes seen in earlier ledger rows (refine rule: the same class 3 times = refine the part).
let currentRunId = null;
function history() {
  const byRun = {};
  if (!fs.existsSync(LEDGER)) return {};
  for (const r of readJsonl(LEDGER).filter(r => r.run_id && r.type !== 'self-audit' && r.run_id !== currentRunId)) {
    const set = byRun[r.run_id] || (byRun[r.run_id] = new Set());
    for (const c of (r.defect_classes || []).concat(legacyClasses(r.defects || []))) set.add(c);
  }
  const seen = {};
  for (const set of Object.values(byRun)) for (const c of set) seen[c] = (seen[c] || 0) + 1;
  return seen;
}
// Older rows carry defects as free text; map the recurring ones to a class.
function legacyClasses(texts) {
  const out = [];
  for (const t of texts.map(String)) {
    if (/redirect|refused|write guard/i.test(t)) out.push('write-outside-scratch');
    if (/origin\/mlk\/master|behind origin|stale local/i.test(t)) out.push('baseline-not-pinned');
    if (/flag written in the worktree|0 orch-suppressed/i.test(t)) out.push('flag-never-on');
    if (/background job/i.test(t)) out.push('background-job');
  }
  return out;
}

function selfAudit(runId) {
  const t0 = Date.now();
  let outcome = 'PASS', why = '';
  try {
    const rows = readJsonl(LEDGER).filter(r => r.type !== 'self-audit');
    const last = rows[rows.length - 1];
    const need = ['ts', 'run_id', 'tickets', 'agents', 'subagent_tokens', 'defect_classes', 'refinements', 'orch_suppressed'];
    const miss = last ? need.filter(k => !(k in last)) : need;
    if (!last) { outcome = 'FAIL'; why = 'ledger has no run row'; }
    else if (runId && last.run_id !== runId) { outcome = 'FAIL'; why = `last row is ${last.run_id}, expected ${runId}`; }
    else if (miss.length) { outcome = 'FAIL'; why = 'missing keys: ' + miss.join(', '); }
    else if (last.defect_classes.some(c => !last.refinements.find(x => x.class === c))) { outcome = 'FAIL'; why = 'a defect class has no refinement line'; }
  } catch (e) { outcome = 'FAIL'; why = 'ledger unreadable: ' + e.message; }
  const row = { type: 'self-audit', ts: new Date().toISOString(), run_id: runId || null, outcome, goal_met: outcome === 'PASS', why, dur_ms: Date.now() - t0 };
  try { fs.appendFileSync(LEDGER, JSON.stringify(row) + '\n'); } catch { /* read-only ledger: the exit code still reports */ }
  return row;
}

async function run() {
  const tickets = (opt('--tickets', '') || '').split(',').map(s => s.trim()).filter(Boolean);
  const sinceIso = opt('--since');
  if (!tickets.length || !sinceIso || isNaN(Date.parse(sinceIso))) { console.error('usage: run --tickets <t,t> --since <iso> [...]'); process.exit(2); }
  const sinceMs = Date.parse(sinceIso);
  const dir = opt('--subagents') || newestSubagentsDir();
  if (!dir || !fs.existsSync(dir)) { console.error('no subagents folder found; pass --subagents <dir>'); process.exit(2); }
  const ctx = { scratch: opt('--scratch') };
  const fams = fs.readdirSync(dir).filter(n => /^agent-.*\.jsonl$/.test(n)).map(f => familiar(dir, f, ctx))
    .filter(r => r.start && r.start >= sinceMs && r.ticket && tickets.includes(r.ticket));
  const wavesRun = opt('--waves', [...new Set(fams.map(f => f.wave).filter(Boolean))].join(' '));
  currentRunId = opt('--run-id', 'sweep-' + sinceIso.slice(0, 16));
  const lastEnd = Math.max(0, ...fams.map(f => f.end || 0));
  const untilMs = opt('--until') ? Date.parse(opt('--until')) : (lastEnd ? lastEnd + 15 * 60000 : Date.now());
  const runDefects = [];
  if (fs.existsSync(FLAG)) runDefects.push({ class: 'flag-left', detail: FLAG });
  const sup = await suppressedSince(sinceMs, untilMs);
  if (sup.count === 0) runDefects.push({ class: 'flag-never-on', detail: '0 orch-suppressed rows since run start' });
  for (const t of tickets) {
    for (const f of expectedFiles(t, wavesRun)) {
      if (!fs.existsSync(path.join(QUESTS, `QA-${t}`, f))) runDefects.push({ class: 'not-banked', detail: `QA-${t}/${f}` });
    }
  }
  const all = fams.flatMap(f => f.defects.map(d => ({ ...d, familiar: f.desc }))).concat(runDefects);
  const classes = [...new Set(all.map(d => d.class))];
  const hist = history();
  const refinements = classes.map(c => {
    const k = CLASSES[c] || { sev: 'warn', fix: 'read the detail', refine: 'name it in CLASSES', accuracy: 'unknown' };
    const runs = (hist[c] || 0) + 1;
    return { class: c, count: all.filter(d => d.class === c).length, runs_seen: runs, severity: k.sev,
      fix_now: k.fix, refine: runs >= 3 ? 'REFINE NOW: ' + k.refine : k.refine, accuracy: k.accuracy };
  });
  const starts = fams.map(f => f.start).filter(Boolean), ends = fams.map(f => f.end).filter(Boolean);
  const csv = k => (opt(k, '') || '').split(',').map(s => s.trim()).filter(Boolean);
  const models = {};
  for (const f of fams) { const w = f.wave || '?'; models[w] = `${f.model || '?'}/${f.effort || '?'}`; }
  const row = {
    ts: new Date().toISOString(), run_id: currentRunId,
    tickets, waves_run: wavesRun, skips: JSON.parse(opt('--skips', '[]')),
    agents: fams.length, model: models,
    subagent_tokens: fams.reduce((a, f) => a + f.tokens, 0),
    cache_read_tokens: fams.reduce((a, f) => a + f.cache_read, 0),
    agent_minutes: +fams.reduce((a, f) => a + f.minutes, 0).toFixed(1),
    wall_min: starts.length ? +((Math.max(...ends) - Math.min(...starts)) / 60000).toFixed(1) : 0,
    verified_lines: +opt('--verified', 0), resumed: has('--resumed'),
    accuracy: { w4_changed_fix: csv('--w4-changed'), controller_caught: csv('--controller-caught') },
    orch_suppressed: sup.count, orch_gates: sup.gates,
    defect_classes: classes, defects: all.map(d => `${d.class}: ${d.detail}${d.familiar ? ' (' + d.familiar + ')' : ''}`),
    refinements,
    familiars: fams.map(f => ({ desc: f.desc, model: f.model, minutes: f.minutes, tokens: f.tokens, tool_errors: f.tool_errors, defects: f.defects.map(d => d.class) })),
  };
  const openRun = refinements.filter(r => r.severity === 'run');
  if (has('--write')) {
    fs.appendFileSync(LEDGER, JSON.stringify(row) + '\n');
    const sa = selfAudit(row.run_id);
    row.self_audit = sa;
  }
  if (has('--json')) { console.log(JSON.stringify(row, null, 1)); }
  else {
    console.log(`SWEEP AUDIT ${row.run_id} · ${row.agents} familiars · ${row.subagent_tokens.toLocaleString()} tokens · ${row.agent_minutes} agent-min · wall ${row.wall_min} min · orch-suppressed ${row.orch_suppressed}`);
    console.log(`accuracy: W4 changed the fix on ${row.accuracy.w4_changed_fix.length} of ${tickets.length} · controller caught ${row.accuracy.controller_caught.length}`);
    for (const f of fams) console.log(`  ${f.desc} [${f.model}/${f.effort}] ${f.minutes} min · ${f.tokens.toLocaleString()} tok · errors ${f.tool_errors}${f.defects.length ? ' · ' + f.defects.map(d => d.class).join(', ') : ''}`);
    if (!refinements.length) console.log('defects: none');
    for (const r of refinements) console.log(`DEFECT ${r.class} x${r.count} (${r.severity}; runs seen ${r.runs_seen}) · fix now: ${r.fix_now} · refine: ${r.refine} · accuracy: ${r.accuracy}`);
    if (row.self_audit) console.log(`self-audit ${row.self_audit.outcome}${row.self_audit.why ? ': ' + row.self_audit.why : ''}`);
  }
  const fail = openRun.length > 0 || (row.self_audit && row.self_audit.outcome !== 'PASS');
  process.exit(fail ? 1 : 0);
}

function flag() {
  const mode = args[1];
  if (mode === 'on') {
    const hours = +opt('--hours', 4);
    const exp = Date.now() + Math.min(Math.max(hours, 0.5), 8) * 3600 * 1000;
    fs.writeFileSync(FLAG, String(exp) + '\n');
    console.log(`flag ON ${FLAG} · expires ${new Date(exp).toLocaleString()}`);
  } else if (mode === 'off') {
    if (fs.existsSync(FLAG)) fs.unlinkSync(FLAG);
    console.log(`flag OFF ${FLAG} · ${fs.existsSync(FLAG) ? 'STILL PRESENT' : 'gone'}`);
    process.exit(fs.existsSync(FLAG) ? 1 : 0);
  } else { console.error('usage: flag on|off'); process.exit(2); }
}

if (require.main === module) {
  const cmd = args[0];
  if (cmd === 'flag') flag();
  else if (cmd === 'run') run().catch(e => { console.error('audit failed: ' + e.message); process.exit(1); });
  else if (cmd === 'audit') { const r = selfAudit(null); console.log(`self-audit ${r.outcome}${r.why ? ': ' + r.why : ''}`); process.exit(r.outcome === 'PASS' ? 0 : 1); }
  else { console.error('usage: audit.js flag on|off · run --tickets <t,t> --since <iso> [...] · audit'); process.exit(2); }
}

module.exports = { familiar, legacyClasses, expectedFiles, CLASSES };
