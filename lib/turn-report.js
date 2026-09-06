#!/usr/bin/env node
// turn-report — born via forge (2026-09-06) — plan §M M6 (the consumer)
// symptom: 2026-09-04: 216 proposals, 0 rulings; gate yield judged from fire counts because no ledger had true/false blocks
// goal: system/monitoring-dashboard.md shows gate yield (true_blocks), cost per quest phase, reask rate,
//       goal-lens met-rates and overdue watches from the last 30 days, regenerated at every DE
// goal_signal: the dashboard mtime equals the last DE and its gate table has a true_blocks column
// retention: regenerate (the dashboard is a derived view; the ledgers it reads are rotate/keep)
//
//   node lib/turn-report.js [--days 30] [--out system/monitoring-dashboard.md] [--print]
// Reads: system/telemetry/turns*.jsonl (dedupe on turn_id) · hook-fires*.jsonl · domain/*/goal-log.jsonl ·
//        system/claude-md-watchlist*.jsonl. Tolerates bad lines. Never hand-edit the output.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const TEL = path.join(ROOT, 'system', 'telemetry');
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; }
const DAYS = parseInt(arg('days', '30'), 10);
const OUT = path.resolve(ROOT, arg('out', 'system/monitoring-dashboard.md'));
const SINCE = Date.now() - DAYS * 86400000;

function jsonl(file) { try { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean); } catch (_) { return []; } }
function glob(dir, re) { try { return fs.readdirSync(dir).filter(f => re.test(f)).map(f => path.join(dir, f)); } catch (_) { return []; } }
function inWindow(r, k) { const t = Date.parse(r[k] || r.ts || ''); return Number.isFinite(t) && t >= SINCE; }
function norm(h) { return String(h).replace(/\.(check|gate|discipline|trigger)?\.?hook$/, ''); }
function pct(a, b) { return b ? Math.round(100 * a / b) + '%' : '—'; }

function build() {
  // turns (scenario 14: union + dedupe)
  const seen = new Set();
  const turns = [];
  for (const f of glob(TEL, /^turns.*\.jsonl$/)) for (const r of jsonl(f)) { if (!inWindow(r, 'closed_ts')) continue; const k = r.turn_id || (r.closed_ts + '|' + r.session_id); if (seen.has(k)) continue; seen.add(k); turns.push(r); }
  const fires = [];
  for (const f of glob(TEL, /^hook-fires.*\.jsonl$/)) for (const r of jsonl(f)) if (inWindow(r, 'ts')) fires.push(r);

  // (a) gate yield: fires · blocks · fp · true_blocks · avg ms · verdict
  const fpByHook = {};
  let unmapped = 0, unclassified = 0;
  for (const t of turns) { for (const b of (t.bypasses || [])) { if (b.hook === '?') unmapped++; if (b.fp) fpByHook[b.hook] = (fpByHook[b.hook] || 0) + 1; } unclassified += t.bypass_reason_unclassified || 0; }
  const g = {};
  for (const r of fires) {
    const h = norm(r.hook); const s = g[h] || (g[h] = { fires: 0, blocks: 0, ms: 0, n: 0, events: new Set() });
    s.fires++; if (r.blocked) s.blocks++; if (Number.isFinite(r.dur_ms)) { s.ms += r.dur_ms; s.n++; } s.events.add(r.event);
  }
  const gate = Object.entries(g).map(([h, s]) => {
    const fp = fpByHook[h] || 0; const tb = Math.max(0, s.blocks - fp); const avg = s.n ? Math.round(s.ms / s.n) : 0;
    const eff = s.blocks ? tb / s.blocks : 0;
    let verdict = 'KEEP';
    if (s.fires === 0) verdict = 'DEAD';
    else if (s.blocks === 0 && s.fires >= 20 && (s.ms / 1000) >= 60) verdict = 'REVIEW (0 blocks, ' + Math.round(s.ms / 1000) + ' s)';
    else if (s.blocks >= 3 && eff < 0.5) verdict = 'REDESIGN (fp ' + pct(fp, s.blocks) + ')';
    else if (s.blocks > 0 && eff >= 0.5) verdict = 'KEEP (true ' + pct(tb, s.blocks) + ')';
    return { hook: h, events: [...s.events].join(','), fires: s.fires, blocks: s.blocks, fp, true_blocks: tb, avg, total_s: Math.round(s.ms / 1000), verdict };
  }).sort((a, b) => b.total_s - a.total_s);

  // (b) cost by quest phase
  const ph = {};
  for (const t of turns) { const k = (t.qa || '—') + ' · ' + (t.phase || '—'); const s = ph[k] || (ph[k] = { turns: 0, tools: 0, ms: 0, blocks: 0, reask: 0 }); s.turns++; s.tools += t.tool_calls || 0; s.ms += t.hook_ms || 0; s.blocks += (t.blocks || []).length; if (t.user_signal === 'reask') s.reask++; }
  const phase = Object.entries(ph).map(([k, s]) => ({ k, ...s })).sort((a, b) => b.turns - a.turns);

  // (c) reask / correction rate per session
  const ses = {};
  for (const t of turns) { const s = ses[t.session_id || '—'] || (ses[t.session_id || '—'] = { turns: 0, reask: 0, corr: 0, nod: 0 }); s.turns++; if (t.user_signal === 'reask') s.reask++; if (t.user_signal === 'correction') s.corr++; if (t.user_signal === 'nod') s.nod++; }

  // (d) goal-lens met-rates
  const goals = [];
  for (const d of glob(path.join(ROOT, 'domain'), /.*/)) {
    const rows = jsonl(path.join(d, 'goal-log.jsonl')).filter(r => inWindow(r, 'ts'));
    if (!rows.length) continue;
    const met = rows.filter(r => r.met === 'y').length;
    const gaps = {}; for (const r of rows) if (r.gap) gaps[r.gap] = (gaps[r.gap] || 0) + 1;
    const topGap = Object.entries(gaps).sort((a, b) => b[1] - a[1])[0];
    const flag = (rows.length >= 20 && met / rows.length < 0.7) || (topGap && topGap[1] >= 3) ? '🚩 PROPOSAL' : '';
    goals.push({ feature: path.basename(d), rows: rows.length, rate: pct(met, rows.length), topGap: topGap ? topGap[0] + ' ×' + topGap[1] : '—', flag });
  }
  const pending = jsonl(path.join(ROOT, 'domain', 'turn-ledger', 'goal-lens-pending.jsonl')).length;

  // (e) overdue watches
  const wl = [];
  for (const f of glob(path.join(ROOT, 'system'), /^claude-md-watchlist.*\.jsonl$/)) wl.push(...jsonl(f));
  const state = {};
  for (const r of wl) { if (r.kind === 'watch') state[r.id] = { ...r, left: r.sessions_left, resolved: false }; else if (r.kind === 'tick' && state[r.id]) state[r.id].left = r.sessions_left; else if (r.kind === 'resolve' && state[r.id]) state[r.id].resolved = true; }
  const overdue = Object.values(state).filter(w => !w.resolved && w.left <= 0);

  return { turns, fires, gate, phase, ses, goals, pending, overdue, unmapped, unclassified };
}

function render(d) {
  const L = [];
  L.push('# Monitoring dashboard — generated by lib/turn-report.js', '', `> Regenerated ${new Date().toISOString()} · window ${DAYS} d · turns ${d.turns.length} · hook fires ${d.fires.length}. NEVER hand-edit — rerun the script. Verdict rules: DEAD = 0 fires · REVIEW = ≥20 fires, 0 blocks, ≥60 s · REDESIGN = ≥3 blocks and <50% true · KEEP otherwise. true_blocks = blocks − fp bypasses (turn-ledger M4).`, '');
  L.push('## Gate yield (Q6 ruling table)', '', '| Hook | Events | Fires | Blocks | fp | true_blocks | avg ms | total s | Verdict |', '|---|---|---|---|---|---|---|---|---|');
  for (const g of d.gate) L.push(`| \`${g.hook}\` | ${g.events} | ${g.fires} | ${g.blocks} | ${g.fp} | ${g.true_blocks} | ${g.avg} | ${g.total_s} | ${g.verdict} |`);
  L.push('', `Unmapped bypass tokens: ${d.unmapped} · bypasses with no reason: ${d.unclassified} (a rising count = the fp: convention is slipping).`, '');
  L.push('## Cost by quest phase', '', '| Quest · phase | Turns | Tool calls | Hook s | Blocks | Reasks |', '|---|---|---|---|---|---|');
  for (const p of d.phase.slice(0, 30)) L.push(`| ${p.k} | ${p.turns} | ${p.tools} | ${Math.round(p.ms / 1000)} | ${p.blocks} | ${p.reask} |`);
  L.push('', '## User signal per session', '', '| Session | Turns | Reask | Correction | Nod |', '|---|---|---|---|---|');
  for (const [k, s] of Object.entries(d.ses).slice(-20)) L.push(`| ${String(k).slice(0, 8)} | ${s.turns} | ${s.reask} | ${s.corr} | ${s.nod} |`);
  L.push('', `## Goal-lens (M7) — met-rate per feature · pending prompts: ${d.pending}`, '', '| Feature | Rows | Met-rate | Top gap | Flag |', '|---|---|---|---|---|');
  for (const g of d.goals) L.push(`| \`${g.feature}\` | ${g.rows} | ${g.rate} | ${g.topGap} | ${g.flag} |`);
  if (!d.goals.length) L.push('| — | 0 | — | — | no goal-log rows yet |');
  L.push('', '## Overdue watches (lib/watch.js)', '');
  if (!d.overdue.length) L.push('none');
  for (const w of d.overdue) L.push(`- [${w.id}] ${w.target} — ${w.observe} (sessions_left ${w.left}) → resolve: node lib/watch.js resolve ${w.id} ok|anomaly`);
  return L.join('\n') + '\n';
}

if (require.main === module) {
  const d = build();
  const md = render(d);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, md);
  if (process.argv.includes('--print')) process.stdout.write(md);
  console.log(`turn-report: ${d.turns.length} turns · ${d.fires.length} fires · ${d.gate.length} hooks · ${d.goals.length} goal-logged features · ${d.overdue.length} overdue watches → ${path.relative(ROOT, OUT)}`);
}
module.exports = { build, render };
