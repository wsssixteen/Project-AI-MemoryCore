#!/usr/bin/env node
/**
 * lib/events.js — the ONE query tool for the turn log (born 2026-11-10 with domain/turn-log, stage 8 of the over-complexity audit).
 *
 * symptom: 2026-11-06 audit: no tool could answer "what did he ask, what did I understand, what did I choose, what did it cost";
 *          observatory --brief did not return in 15 minutes on a 1.8 GB hook-fires family.
 * goal: an audit question about one turn, session, ask, gate or slip is answered by one command that reads at most the last
 *       two monthly files of system/telemetry/turn-log and prints a table.
 * goal_signal: `node lib/events.js --turn <id>` prints his words, the model, the tools and the gates of that turn in under 2 seconds.
 * retention: none (reads, writes nothing).
 * footprint: none: a library other readers require; the CLI is one node process on demand, exits.
 * self_audit: `--audit` prints, for the window, how many turns have an ask, a model and a ticket, and exits 1 when a month file has a turn row without turn_id.
 *
 *   node lib/events.js                       last 20 turns
 *   node lib/events.js --turn <turn_id>      one turn in full: his words, restated ask, cause step, model, tools, files, skills, gates
 *   node lib/events.js --session <id>        every turn of a session (an id prefix is enough)
 *   node lib/events.js --ask "<text>"        turns whose ask contains the text (case-insensitive)
 *   node lib/events.js --since 2026-11-01    turns from that date
 *   node lib/events.js --gates               turns where a gate blocked or a bypass token was used (who typed it)
 *   node lib/events.js --slips               slips joined to the turn that caused them (his words, rule expected, repeat_of)
 *   node lib/events.js --tools [--tool Edit] tool rows
 *   node lib/events.js --audit               coverage of the log in the window
 *   flags: --months N (default 2) · --legacy (also the old system/telemetry/turns*.jsonl) · --json · --limit N · --root <dir>
 * API (used by audit-briefing, turn-report, observatory): readTurns(root, opts) returns turns in the old turns.jsonl shape
 *   (blocks, bypasses, opened_ts, closed_ts, hooks_fired) plus the new fields; readTools; readSlips; readHookFires.
 */
'use strict';
const fs = require('fs');
const path = require('path');

function argv(name) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined; }
function flag(name) { return process.argv.includes('--' + name); }
const ROOT = (() => { const i = process.argv.indexOf('--root'); return i > 0 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : (process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..')); })();

function readJsonl(f) {
  let text; try { text = fs.readFileSync(f, 'utf8'); } catch (_) { return []; }
  const out = [];
  for (const l of text.split('\n')) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch (_) {} }
  return out;
}
function monthsBack(n) {
  const out = []; const d = new Date();
  for (let i = 0; i < n; i++) { out.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)).toISOString().slice(0, 7)); }
  return out;
}
// month files of every machine for the last n months (OneDrive brings the other machine's files)
function logFiles(root, months) {
  const dir = path.join(root, 'system', 'telemetry', 'turn-log');
  let names = []; try { names = fs.readdirSync(dir); } catch (_) { return []; }
  const want = new Set(monthsBack(months));
  return names.filter(n => /-(\d{4}-\d{2})\.jsonl$/.test(n) && want.has(n.match(/-(\d{4}-\d{2})\.jsonl$/)[1])).map(n => path.join(dir, n));
}
function readRows(root, months) { const rows = []; for (const f of logFiles(root, months)) rows.push(...readJsonl(f)); return rows; }

// the old turns.jsonl shape on top of the new row, so existing readers need only the new source
function legacyShape(t) {
  return Object.assign({}, t, { opened_ts: t.ts_open, closed_ts: t.ts_close, blocks: t.gates_blocked || [], bypasses: t.gates_bypassed || [], hooks_fired: t.hooks_run });
}
function readTurns(root, opts) {
  root = root || ROOT; opts = opts || {};
  const rows = readRows(root, opts.months || 2);
  const best = new Map(); const sig = new Map();
  for (const r of rows) {
    if (r.kind === 'turn' && r.turn_id) { const b = best.get(r.turn_id); if (!b || (r.rev || 0) > (b.rev || 0) || ((r.rev || 0) === (b.rev || 0) && r.ts > b.ts)) best.set(r.turn_id, r); }
    else if (r.kind === 'signal' && r.turn_id) sig.set(r.turn_id, r);
  }
  const turns = [...best.values()].map(t => { const s = sig.get(t.turn_id); return legacyShape(s ? Object.assign({}, t, { next_signal: s.next_signal }) : t); });
  if (opts.legacy) {
    const have = new Set(turns.map(t => t.turn_id));
    const tdir = path.join(root, 'system', 'telemetry');
    let names = []; try { names = fs.readdirSync(tdir).filter(n => /^turns.*\.jsonl$/.test(n)); } catch (_) {}
    for (const n of names) for (const r of readJsonl(path.join(tdir, n))) if (r.turn_id && !have.has(r.turn_id)) { have.add(r.turn_id); turns.push(Object.assign({ legacy: true }, r)); }
  }
  return turns.sort((a, b) => String(a.ts_close || a.closed_ts || '').localeCompare(String(b.ts_close || b.closed_ts || '')));
}
function readTools(root, opts) { return readRows(root || ROOT, (opts || {}).months || 2).filter(r => r.kind === 'tool'); }
function readSlips(root, opts) { return readJsonl(path.join(root || ROOT, 'system', 'slips.jsonl')).filter(r => !(opts && opts.type) || r.type === opts.type); }
function readHookFires(root, opts) {
  root = root || ROOT;
  const dir = path.join(root, 'system', 'telemetry');
  const want = new Set(monthsBack((opts || {}).months || 2));
  let names = []; try { names = fs.readdirSync(dir); } catch (_) {}
  const rows = [];
  for (const n of names) { const m = n.match(/^hook-fires-.+-(\d{4}-\d{2})\.jsonl$/); if (m && want.has(m[1])) rows.push(...readJsonl(path.join(dir, n))); }
  return rows;
}

// ---------- printing ----------
function cell(v, n) { const s = v == null ? '' : String(v).replace(/\s+/g, ' '); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function table(cols, rows) {
  const w = cols.map(c => Math.min(c.w, Math.max(c.h.length, ...rows.map(r => cell(c.f(r), c.w).length))));
  const line = (vals) => '| ' + vals.map((v, i) => cell(v, w[i]).padEnd(w[i])).join(' | ') + ' |';
  return [line(cols.map(c => c.h)), '|' + w.map(x => '-'.repeat(x + 2)).join('|') + '|', ...rows.map(r => line(cols.map(c => c.f(r))))].join('\n');
}
function ms(v) { return v == null ? '' : (v >= 60000 ? Math.round(v / 60000) + 'm' : Math.round(v / 1000) + 's'); }
const TURN_COLS = [
  { h: 'closed', w: 16, f: t => String(t.ts_close || t.closed_ts || '').slice(0, 16).replace('T', ' ') },
  { h: 'turn', w: 14, f: t => t.turn_id }, { h: 'qa', w: 10, f: t => t.qa },
  { h: 'model', w: 18, f: t => t.model }, { h: 'tools', w: 5, f: t => t.tool_calls },
  { h: 'out tok', w: 7, f: t => t.tokens && t.tokens.out }, { h: 'wall', w: 5, f: t => ms(t.wall_ms) },
  { h: 'signal', w: 10, f: t => t.next_signal || t.user_signal }, { h: 'ask', w: 60, f: t => t.ask || t.prompt_head },
];

function showTurn(t, tools) {
  const L = [];
  const p = (k, v) => L.push(k.padEnd(18) + (v == null || v === '' ? '—' : (typeof v === 'object' ? JSON.stringify(v) : v)));
  p('turn', t.turn_id + ' (rev ' + (t.rev || 1) + ') session ' + t.session_id); p('prompt_id', t.prompt_id);
  p('opened → closed', (t.ts_open || t.opened_ts) + ' → ' + (t.ts_close || t.closed_ts) + '  wall ' + ms(t.wall_ms));
  p('HIS WORDS', t.ask); p('restated ask', t.restated_ask); p('cause step', t.cause_step); p('change · new parts', (t.change_lines == null ? '—' : t.change_lines + ' lines') + ' · ' + (t.new_parts == null ? '—' : t.new_parts));
  p('model · effort', (t.model || '—') + ' · ' + (t.effort || '—')); p('tokens', t.tokens); p('tools', t.tool_names);
  p('files touched', t.files_touched); p('parts created', t.parts_created); p('parts retired', t.parts_retired);
  p('skills triggered', t.skills_triggered); p('skills invoked', t.skills_invoked);
  p('hooks run · ms', (t.hooks_run == null ? '—' : t.hooks_run) + ' · ' + (t.hook_ms == null ? '—' : t.hook_ms));
  p('gates blocked', (t.gates_blocked || t.blocks || []).map(b => b.hook + ': ' + b.reason));
  p('gates bypassed', (t.gates_bypassed || t.bypasses || []).map(b => b.token + ' (typed by ' + (b.typed_by || '?') + (b.fp ? ', fp' : '') + ')'));
  p('ticket', (t.qa || '—') + ' (' + (t.qa_source || '—') + ')');
  p('his reaction next', t.next_signal); p('caused by turn', t.caused_by_turn_id);
  if (tools && tools.length) { L.push(''); L.push(table([{ h: 'seq', w: 4, f: r => r.seq }, { h: 'tool', w: 18, f: r => r.tool }, { h: 'result', w: 8, f: r => r.result }, { h: 'ms', w: 7, f: r => r.dur_ms }, { h: 'target', w: 90, f: r => r.target }], tools)); }
  return L.join('\n');
}

function main() {
  const months = parseInt(argv('months') || '2', 10);
  const limit = parseInt(argv('limit') || '20', 10);
  const json = flag('json');
  const out = (rows, text) => console.log(json ? JSON.stringify(rows, null, 1) : text);
  let turns = readTurns(ROOT, { months, legacy: flag('legacy') });
  const since = argv('since');
  if (since) turns = turns.filter(t => String(t.ts_close || t.closed_ts || '') >= since);

  if (flag('audit')) {
    const known = turns.filter(t => !t.legacy);
    const pct = (n) => known.length ? Math.round(100 * n / known.length) + '%' : 'n/a';
    const noId = readRows(ROOT, months).filter(r => r.kind === 'turn' && !r.turn_id).length;
    console.log(`turn-log audit — window ${months} month(s), ${known.length} turn(s)`);
    console.log(`  ask recorded     ${pct(known.filter(t => t.ask).length)}\n  model recorded   ${pct(known.filter(t => t.model).length)}\n  ticket recorded  ${pct(known.filter(t => t.qa).length)}\n  restated ask     ${pct(known.filter(t => t.restated_ask).length)}\n  cause step       ${pct(known.filter(t => t.cause_step).length)}\n  turn rows without turn_id: ${noId}`);
    process.exit(noId ? 1 : 0);
  }
  if (flag('slips')) {
    const byTurn = new Map(turns.map(t => [t.turn_id, t]));
    let rows = readSlips(ROOT).filter(r => r.type !== 'upgrade' && r.type !== 'proposal');
    if (since) rows = rows.filter(r => String(r.ts) >= since);
    rows = rows.filter(r => r.turn_id || flag('all')).slice(-limit);
    return out(rows, table([{ h: 'ts', w: 16, f: r => String(r.ts).slice(0, 16).replace('T', ' ') }, { h: 'category', w: 24, f: r => r.category }, { h: 'by', w: 6, f: r => r.caught_by }, { h: 'turn', w: 14, f: r => r.turn_id }, { h: 'rule expected', w: 24, f: r => r.rule_expected }, { h: 'repeat of', w: 14, f: r => r.repeat_of }, { h: 'his words', w: 50, f: r => r.his_words }, { h: 'the turn asked', w: 40, f: r => (byTurn.get(r.turn_id) || {}).ask }], rows));
  }
  if (flag('tools')) {
    let rows = readTools(ROOT, { months }); const tool = argv('tool');
    if (tool) rows = rows.filter(r => r.tool === tool);
    if (argv('turn')) rows = rows.filter(r => r.turn_id === argv('turn'));
    return out(rows.slice(-limit * 5), table([{ h: 'turn', w: 14, f: r => r.turn_id }, { h: 'seq', w: 4, f: r => r.seq }, { h: 'tool', w: 18, f: r => r.tool }, { h: 'result', w: 8, f: r => r.result }, { h: 'ms', w: 7, f: r => r.dur_ms }, { h: 'target', w: 90, f: r => r.target }], rows.slice(-limit * 5)));
  }
  if (argv('turn')) {
    const t = turns.find(x => x.turn_id === argv('turn'));
    if (!t) { console.error('no turn ' + argv('turn') + ' in the last ' + months + ' month(s) (try --months 6 or --legacy)'); process.exit(1); }
    const tools = readTools(ROOT, { months }).filter(r => r.turn_id === t.turn_id).sort((a, b) => a.seq - b.seq);
    return out({ turn: t, tools }, showTurn(t, tools));
  }
  if (flag('gates')) {
    const rows = turns.filter(t => (t.gates_blocked || t.blocks || []).length || (t.gates_bypassed || t.bypasses || []).length).slice(-limit);
    const flatRows = rows.flatMap(t => [...(t.gates_blocked || t.blocks || []).map(b => ({ t, what: 'blocked', who: '', hook: b.hook, detail: b.reason })), ...(t.gates_bypassed || t.bypasses || []).map(b => ({ t, what: 'bypassed', who: b.typed_by || '?', hook: b.hook, detail: b.token + (b.fp ? ' (fp)' : '') + ' ' + (b.reason || '') }))]);
    return out(flatRows.map(r => ({ turn_id: r.t.turn_id, what: r.what, typed_by: r.who, hook: r.hook, detail: r.detail })), table([{ h: 'turn', w: 14, f: r => r.t.turn_id }, { h: 'what', w: 8, f: r => r.what }, { h: 'by', w: 4, f: r => r.who }, { h: 'hook', w: 28, f: r => r.hook }, { h: 'detail', w: 70, f: r => r.detail }, { h: 'ask', w: 40, f: r => r.t.ask || r.t.prompt_head }], flatRows));
  }
  if (argv('session')) turns = turns.filter(t => String(t.session_id || '').startsWith(argv('session')) || String(t.turn_id || '').startsWith(argv('session')));
  if (argv('ask')) turns = turns.filter(t => String(t.ask || t.prompt_head || '').toLowerCase().includes(argv('ask').toLowerCase()));
  const shown = (argv('session') || argv('ask') || since) ? turns : turns.slice(-limit);
  out(shown, table(TURN_COLS, shown) + '\n' + shown.length + ' turn(s)');
}

if (require.main === module) main();
module.exports = { readTurns, readTools, readSlips, readHookFires, readRows, logFiles, legacyShape, monthsBack, showTurn, table };
