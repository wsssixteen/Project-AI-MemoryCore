#!/usr/bin/env node
// audit-briefing — born via forge (2026-09-07) — plan §9d (the /system-audit skill runs this)
// symptom: miya 2026-09-06: "I am basically almost blind on this" — no single screen says what is not
//          working, too slow, or causing mistakes
// goal: one short screen with four fixed blocks NOT WORKING / TOO SLOW / MISTAKES / HIGH-RETURN
//       OPTIMIZATIONS built from the ledgers, plus the rows that need miya's ruling
// goal_signal: the printed screen has all four block headers and each block is populated or says "none"
// retention: regenerate (prints; the ledgers it reads keep their own retention)
//
//   node lib/audit-briefing.js [--days 30] [--top 5]
// Reads (never writes): system/telemetry/hook-fires*.jsonl · turns*.jsonl · eval-battery.jsonl ·
//   system/eval-quarantine.jsonl · system/slips.jsonl · system/feature-census.md · domain/*/goal-log.jsonl ·
//   domain/turn-ledger/goal-lens-pending.jsonl · domain/quest-bounty/log.jsonl (wrong-fix rows) ·
//   system/claude-md-watchlist*.jsonl · .claude/settings.json
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const TEL = path.join(ROOT, 'system', 'telemetry');
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; }
const DAYS = parseInt(arg('days', '30'), 10), TOP = parseInt(arg('top', '5'), 10);
const SINCE = Date.now() - DAYS * 86400000, WEEK = Date.now() - 7 * 86400000;
function jsonl(f) { try { return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean); } catch (_) { return []; } }
function glob(dir, re) { try { return fs.readdirSync(dir).filter(f => re.test(f)).map(f => path.join(dir, f)); } catch (_) { return []; } }
function norm(h) { return String(h).replace(/\.(check|gate|discipline|trigger)?\.?hook$/, ''); }
function ts(r, k) { return Date.parse(r[k] || r.ts || '') || 0; }
function line(s) { return '  - ' + s; }

function gather() {
  const fires = []; for (const f of glob(TEL, /^hook-fires.*\.jsonl$/)) for (const r of jsonl(f)) if (ts(r) >= SINCE) fires.push(r);
  const seen = new Set(); const turns = [];
  for (const f of glob(TEL, /^turns.*\.jsonl$/)) for (const r of jsonl(f)) { if (ts(r, 'closed_ts') < SINCE) continue; const k = r.turn_id || r.closed_ts; if (seen.has(k)) continue; seen.add(k); turns.push(r); }
  // registered hooks
  let registered = new Set();
  try { const s = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8')); for (const ev of Object.values(s.hooks || {})) for (const g of ev) for (const h of g.hooks) { const m = String(h.command).match(/([A-Za-z0-9_.-]+)\.js"?\s*(?:UserPromptSubmit|Stop|PreToolUse|PostToolUse|SessionStart)?\s*$/); if (m) registered.add(norm(m[1].replace(/\.js$/, ''))); } } catch (_) {}
  const byHook = {};
  for (const r of fires) { const h = norm(r.hook); const s = byHook[h] || (byHook[h] = { fires: 0, blocks: 0, ms: 0, err: 0, last: 0, events: new Set() }); s.fires++; if (r.blocked) s.blocks++; s.ms += r.dur_ms || 0; if (r.error) s.err++; s.last = Math.max(s.last, ts(r)); s.events.add(r.event); }
  // NOT WORKING
  const notWorking = [];
  for (const h of registered) if (!byHook[h] && !/dispatch-hooks|hook-runtime/.test(h)) notWorking.push(`registered hook never fired in ${DAYS} d: \`${h}\``);
  for (const [h, s] of Object.entries(byHook)) if (s.err >= 3) notWorking.push(`\`${h}\` errored ${s.err}× (${s.fires} fires)`);
  const battery = jsonl(path.join(TEL, 'eval-battery.jsonl')).slice(-1)[0];
  if (battery) { for (const f of battery.fails || []) notWorking.push(`eval FAILING: \`${f}\` (battery ${String(battery.ts).slice(0, 10)})`); }
  else notWorking.push('eval battery has NEVER run (system/telemetry/eval-battery.jsonl missing)');
  if (battery && Date.now() - ts(battery) > 14 * 86400000) notWorking.push(`eval battery last ran ${Math.round((Date.now() - ts(battery)) / 86400000)} d ago`);
  for (const q of jsonl(path.join(ROOT, 'system', 'eval-quarantine.jsonl'))) notWorking.push(`quarantined eval: \`${q.eval}\` — ${String(q.reason).split(':')[0]}`);
  const silent = fires.filter(r => r.blocked && r.reason === '').length; if (silent) notWorking.push(`${silent} silent blocks (exit 2 with empty reason)`);
  // watches overdue
  const wl = []; for (const f of glob(path.join(ROOT, 'system'), /^claude-md-watchlist.*\.jsonl$/)) wl.push(...jsonl(f));
  const st = {}; for (const r of wl) { if (r.kind === 'watch') st[r.id] = { ...r, left: r.sessions_left, done: false }; else if (r.kind === 'tick' && st[r.id]) st[r.id].left = r.sessions_left; else if (r.kind === 'resolve' && st[r.id]) st[r.id].done = true; }
  const overdue = Object.values(st).filter(w => !w.done && w.left <= 0); if (overdue.length) notWorking.push(`${overdue.length} overdue watch(es) — \`node lib/watch.js check\``);
  // TOO SLOW
  const slow = Object.entries(byHook).map(([h, s]) => ({ h, s })).sort((a, b) => b.s.ms - a.s.ms).slice(0, TOP).map(x => `\`${x.h}\` ${Math.round(x.s.ms / 1000)} s / ${DAYS} d (${x.s.fires} fires, avg ${Math.round(x.s.ms / Math.max(1, x.s.fires))} ms, ${x.s.blocks} blocks)`);
  const boot = Object.entries(byHook).filter(([, s]) => s.events.has('SessionStart')).reduce((a, [, s]) => a + s.ms, 0);
  const boots = Math.max(...Object.entries(byHook).filter(([, s]) => s.events.has('SessionStart')).map(([, s]) => s.fires), 0);
  if (boots) slow.unshift(`boot: ${Math.round(boot / 1000 / boots)} s per boot × ${boots} boots = ${(boot / 3600000).toFixed(1)} h`);
  const heavyTurns = turns.slice().sort((a, b) => (b.hook_ms || 0) - (a.hook_ms || 0)).slice(0, 3).map(t => `turn ${t.turn_id} (${t.qa || '—'}): ${Math.round((t.hook_ms || 0) / 1000)} s hooks, ${t.tool_calls} tools, ${t.hooks_fired} fires`);
  // MISTAKES
  const slips = jsonl(path.join(ROOT, 'system', 'slips.jsonl'));
  const week = slips.filter(r => r.type !== 'proposal' && r.type !== 'upgrade' && r.type !== 'feedback' && ts(r) >= WEEK);
  const cat = {}; for (const r of week) cat[r.category] = (cat[r.category] || 0) + 1;
  const mistakes = Object.entries(cat).sort((a, b) => b[1] - a[1]).slice(0, TOP).map(([c, n]) => `slip \`${c}\` ×${n} (7 d)`);
  const wrongFix = jsonl(path.join(ROOT, 'domain', 'quest-bounty', 'log.jsonl')).filter(r => r.kind === 'wrong-fix' && ts(r) >= SINCE);
  if (wrongFix.length) mistakes.push(`${wrongFix.length} wrong-fix row(s) in ${DAYS} d — unruled: ${wrongFix.filter(r => r.was && !wrongFix.some(v => v.qa === r.qa && v.n === r.n && v.verdict)).length}`);
  const fp = {}; for (const t of turns) for (const b of (t.bypasses || [])) if (b.fp) fp[b.hook] = (fp[b.hook] || 0) + 1;
  for (const [h, n] of Object.entries(fp).sort((a, b) => b[1] - a[1]).slice(0, 3)) mistakes.push(`false-positive blocks: \`${h}\` ×${n}`);
  for (const d of glob(path.join(ROOT, 'domain'), /.*/)) { const g = jsonl(path.join(d, 'goal-log.jsonl')).filter(r => ts(r) >= SINCE); if (g.length >= 5) { const met = g.filter(r => r.met === 'y').length; if (met / g.length < 0.7) mistakes.push(`goal-lens: \`${path.basename(d)}\` met-rate ${Math.round(100 * met / g.length)}% over ${g.length} runs`); } }
  const pendingLens = jsonl(path.join(ROOT, 'domain', 'turn-ledger', 'goal-lens-pending.jsonl')).length; if (pendingLens) mistakes.push(`${pendingLens} goal-lens prompt(s) unanswered — \`node lib/goal-lens.js pending\``);
  // OPTIMIZATIONS (numbers = what each saves)
  const opt = [];
  const zeroGates = Object.entries(byHook).filter(([, s]) => s.blocks === 0 && s.fires >= 20 && !s.events.has('SessionStart')).sort((a, b) => b[1].ms - a[1].ms).slice(0, 3);
  if (zeroGates.length) opt.push(`retire/redesign 0-block gates: ${zeroGates.map(([h, s]) => `\`${h}\` (${Math.round(s.ms / 1000)} s)`).join(', ')} → saves ${Math.round(zeroGates.reduce((a, [, s]) => a + s.ms, 0) / 1000)} s / ${DAYS} d`);
  if (boots && boot / boots > 10000) opt.push(`cache the boot hooks (Q7): ${Math.round(boot / 1000 / boots)} s → ≤10 s per boot saves ${((boot / boots - 10000) * boots / 3600000).toFixed(1)} h / ${DAYS} d`);
  const props = slips.filter(r => r.type === 'proposal' && !r.ruled); if (props.length) opt.push(`${props.length} proposals unruled — rule the ${Math.min(10, props.length)} oldest (Q8)`);
  // census
  const census = (() => { try { return fs.readFileSync(path.join(ROOT, 'system', 'feature-census.md'), 'utf8'); } catch (_) { return ''; } })();
  const goalless = (census.match(/goal-less/g) || []).length; if (goalless) opt.push(`${goalless} goal-less features — \`node lib/goal-backfill.js --draft\` then promote 20/session`);
  // rulings for miya
  const rulings = [];
  for (const h of [...registered].filter(h => !byHook[h] && !/dispatch-hooks|hook-runtime/.test(h)).slice(0, 5)) rulings.push(`RETIRE? \`${h}\` (0 fires)`);
  if (overdue.length) rulings.push(`${overdue.length} watch(es) to resolve ok|anomaly`);
  return { notWorking, slow, heavyTurns, mistakes, opt, rulings, n: { fires: fires.length, turns: turns.length, hooks: Object.keys(byHook).length } };
}

function render(d) {
  const block = (title, rows) => [`**${title}**`, ...(rows.length ? rows.map(line) : [line('none')]), ''];
  return [
    `🔎 SYSTEM AUDIT — ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · ${DAYS} d · ${d.n.fires} hook fires · ${d.n.turns} turns · ${d.n.hooks} hooks seen`, '',
    ...block('NOT WORKING', d.notWorking),
    ...block('TOO SLOW', d.slow.concat(d.heavyTurns)),
    ...block('MISTAKES', d.mistakes),
    ...block('HIGH-RETURN OPTIMIZATIONS', d.opt),
    ...block('NEEDS みや\'S RULING', d.rulings),
  ].join('\n');
}
if (require.main === module) process.stdout.write(render(gather()) + '\n');
module.exports = { gather, render };
