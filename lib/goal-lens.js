#!/usr/bin/env node
// goal-lens — born via forge (2026-09-06) — plan §M M7 (miya 2026-09-04 17:50)
// symptom: every feature run should check LIVE whether it met its goal and document what to improve
// goal: a feature's goal-log.jsonl holds met/gap/improve rows written at the moment the feature ran,
//       rolled up to a met-rate per feature by lib/turn-report.js
// goal_signal: domain/<feature>/goal-log.jsonl gains a row for the named feature + turn
// retention: keep (goal-log.jsonl is the optimization dataset) · goal-lens-pending.jsonl regenerate
//
//   node lib/goal-lens.js note <feature> --turn <turn_id> --met y|n|partial [--gap "<what fell short>"]
//        [--improve "<change that reaches the goal>"] [--beyond "<how the goal itself was too small>" --evidence "<turn_id or file:line>"]
//   node lib/goal-lens.js pending            → prompts the turn-ledger emitted that have no note yet
//   node lib/goal-lens.js rate <feature>     → met-rate + top gap/improve for one feature
// Rules (plan §M.2b): --improve is REQUIRED when --met is not y. --beyond is REJECTED without --evidence.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const PENDING = path.join(ROOT, 'domain', 'turn-ledger', 'goal-lens-pending.jsonl');

function arg(name, dflt) { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] !== undefined && !String(process.argv[i + 1]).startsWith('--') ? process.argv[i + 1] : dflt; }
function die(msg) { console.error('goal-lens: ' + msg); process.exit(2); }
function rows(file) { try { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean); } catch (_) { return []; } }
function goalLogPath(feature) { return path.join(ROOT, 'domain', feature, 'goal-log.jsonl'); }

function note(feature) {
  if (!feature || feature.startsWith('--')) die('usage: goal-lens note <feature> --turn <id> --met y|n|partial [--gap] [--improve] [--beyond --evidence]');
  if (!fs.existsSync(path.join(ROOT, 'domain', feature))) die('no domain/' + feature + ' — the feature must exist');
  const met = arg('met'); const turn = arg('turn', null);
  if (!['y', 'n', 'partial'].includes(met)) die('--met must be y | n | partial');
  const gap = arg('gap', ''); const improve = arg('improve', ''); const beyond = arg('beyond', ''); const evidence = arg('evidence', turn || '');
  if (met !== 'y' && !improve.trim()) die('--improve is REQUIRED when --met is not y (the corrective loop is never optional)');
  if (beyond && !arg('evidence')) die('--beyond needs --evidence "<turn_id or file:line>" — a surpass-goal claim without a cited instance is a wish, not a row');
  const row = { ts: new Date().toISOString(), turn_id: turn, feature, met, mode: 'judgment', gap: gap.slice(0, 200), improve: improve.slice(0, 200), evidence: evidence.slice(0, 120) };
  if (beyond) row.beyond = beyond.slice(0, 200);
  fs.appendFileSync(goalLogPath(feature), JSON.stringify(row) + '\n');
  // clear the pending prompt for this feature+turn
  try {
    const keep = rows(PENDING).filter(p => !(p.feature === feature && (!turn || p.turn_id === turn)));
    fs.writeFileSync(PENDING, keep.map(r => JSON.stringify(r)).join('\n') + (keep.length ? '\n' : ''));
  } catch (_) {}
  console.log('goal-lens: ' + feature + ' met=' + met + (gap ? ' gap="' + gap + '"' : '') + (improve ? ' improve="' + improve + '"' : '') + ' → domain/' + feature + '/goal-log.jsonl');
}

function pending() {
  const p = rows(PENDING);
  if (!p.length) { console.log('goal-lens: no pending prompts'); return; }
  for (const r of p) console.log('- ' + r.feature + ' (turn ' + r.turn_id + ', ' + String(r.ts).slice(0, 16) + '): goal: ' + r.goal);
  console.log(p.length + ' pending — answer each with: node lib/goal-lens.js note <feature> --turn <id> --met y|n|partial --gap "..." --improve "..."');
}

function rate(feature) {
  const r = rows(goalLogPath(feature));
  if (!r.length) { console.log('goal-lens: no rows for ' + feature); return; }
  const met = r.filter(x => x.met === 'y').length;
  const top = (k) => { const c = {}; for (const x of r) if (x[k]) c[x[k]] = (c[x[k]] || 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3); };
  console.log(feature + ': ' + r.length + ' rows · met-rate ' + Math.round(100 * met / r.length) + '% · top gap: ' + JSON.stringify(top('gap')) + ' · top improve: ' + JSON.stringify(top('improve')));
}

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'note') note(process.argv[3]);
  else if (cmd === 'pending') pending();
  else if (cmd === 'rate') rate(process.argv[3]);
  else die('usage: goal-lens <note|pending|rate> ...');
}
module.exports = { rows, goalLogPath, PENDING };
