#!/usr/bin/env node
// domain-expansion-trigger.eval.js — eval for .claude/hooks/domain-expansion-trigger.js (v1.2, 2026-10-08)
// system-audit: skip-ghost-check   (an eval, not a hook: never registered)
//
// Founding case of v1.2: on 2026-10-08 the session-end prompt fired this hook, and the reply still wrote
// "⏭ Domain Expansion: not run in full. Other live sessions own today's diary and session file".
// The injected text banned skipping a STEP without a marker; nothing banned skipping the RITUAL with one.
// Rows 1-2 replay that prompt; rows 3-8 assert the text that was missing; the rest are out-of-spec inputs.
//
// Run: node .claude/hooks/domain-expansion-trigger.eval.js            (--table prints the scenario table)
'use strict';
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'domain-expansion-trigger.js');

function run(stdin) {
  const r = spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 15000 });
  return { out: r.stdout || '', code: r.status };
}
const P = (prompt) => JSON.stringify({ prompt, session_id: 'eval' });
const fires = (o) => o.out.includes('domain-expansion-trigger:');
const src = fs.readFileSync(HOOK, 'utf8');
const big = 'fix the label on the form. '.repeat(20000);

// [id, scenario, class, stdin, check(o) -> bool, verdict]
const ROWS = [
  [1, 'REPLAY 2026-10-08: "we\'ll continue in another session safely"', 'founding', P("Make sure we are prepared to start for another session, then we'll continue in another session safely."), (o) => fires(o) && o.out.includes('RITUAL ITSELF'), 'fixture-added'],
  [2, 'REPLAY 2026-10-08: "I want to compact this conversation"', 'founding', P('I want to compact this conversation and expect you to load this quest back.'), (o) => fires(o) && o.out.includes('RITUAL ITSELF'), 'fixture-added'],
  [3, 'the text says a marker covers ONE step only', 'missing text', P('Domain Expansion'), (o) => /covers ONE step, never the whole Domain Expansion/.test(o.out), 'fixture-added'],
  [4, 'the text rejects "another session owns the diary"', 'missing text', P('Domain Expansion'), (o) => /NEVER a reason: append YOUR OWN entry/.test(o.out), 'fixture-added'],
  [5, 'the text says every session runs its own full DE', 'missing text', P('save all'), (o) => o.out.includes('Every session runs its own full DE'), 'fixture-added'],
  [6, 'the text names the stat read-back (never regress)', 'missing text', P('Domain Expansion'), (o) => o.out.includes('git show --stat HEAD') && o.out.includes('git diff --cached --stat'), 'fixture-added'],
  [7, 'the text points at system-design Rule 15', 'missing text', P('Domain Expansion'), (o) => o.out.includes('system-design Rule 15'), 'fixture-added'],
  [8, 'the old per-step ban is still there (spec preservation)', 'spec', P('Domain Expansion'), (o) => o.out.includes('skipping any step without explicit reason marker'), 'fixture-added'],
  [9, 'the sacred banner text is unchanged (spec preservation)', 'spec', P('Domain Expansion'), (o) => o.out.includes('═══ [ Domain Expansion ] ═══') && o.out.includes('💠 るり結界 (ラピス バリアー) 💠'), 'fixture-added'],
  [10, 'still routes to the skill (spec preservation)', 'spec', P('goodnight'), (o) => o.out.includes('INVOKE the /domain-expansion skill'), 'fixture-added'],
  [11, 'plain work prompt stays silent', 'silent', P('fix the bug on line 5 of the form'), (o) => o.out === '' && o.code === 0, 'handled'],
  [12, 'empty prompt stays silent', 'malformed', P(''), (o) => o.out === '' && o.code === 0, 'handled'],
  [13, 'stdin is not JSON: silent, exit 0', 'malformed', 'this is not json {', (o) => o.out === '' && o.code === 0, 'handled'],
  [14, 'stdin is empty: silent, exit 0', 'malformed', '', (o) => o.out === '' && o.code === 0, 'handled'],
  [15, 'prompt key missing: silent', 'malformed', JSON.stringify({ session_id: 'x' }), (o) => o.out === '' && o.code === 0, 'handled'],
  [16, 'prompt is a number: silent, no crash', 'malformed', JSON.stringify({ prompt: 12345 }), (o) => o.out === '' && o.code === 0, 'handled'],
  [17, 'prompt is an array: no crash, exit 0', 'malformed', JSON.stringify({ prompt: ['Domain Expansion'] }), (o) => o.code === 0, 'handled'],
  [18, 'half-megabyte prompt without a trigger: silent', 'malformed', P(big), (o) => o.out === '' && o.code === 0, 'handled'],
  [19, 'half-megabyte prompt WITH a trigger at the end: fires', 'malformed', P(big + ' goodnight'), (o) => fires(o), 'handled'],
  [20, 'Japanese invocation るり結界 fires', 'trigger', P('るり結界'), (o) => fires(o) && o.out.includes('RITUAL ITSELF'), 'handled'],
  [21, 'the hook\'s OWN output pasted back as a prompt: fires again, never disarms', 'self-reference', P('BANNED: skipping or shrinking the RITUAL ITSELF. A marker covers ONE step, never the whole Domain Expansion'), (o) => fires(o), 'handled'],
  [22, 'a "skip" token in the prompt does not silence it (no bypass exists)', 'escape hatch', P('[skip-domain-expansion: busy] wrap up for today'), (o) => fires(o), 'handled'],
  [23, 'the slip sentence itself as a prompt fires', 'self-reference', P('Domain Expansion: not run in full. Other live sessions own today\'s diary.'), (o) => fires(o), 'handled'],
  [24, 'lower-case "domain expansion" alone stays silent (the trigger is case-exact)', 'trigger width', P('what is domain expansion in the anime'), (o) => o.out === '', 'accepted-risk: pre-existing width, not changed by v1.2; the skill description still matches it'],
  [25, '"a compact table" fires (broad word)', 'trigger width', P('show it as a compact table'), (o) => fires(o), 'accepted-risk: pre-existing over-trigger; advisory text only, costs one paragraph'],
  [26, 'hook never blocks: the source has no exit code other than 0', 'never blocks', null, () => !/process\.exit\((?!0\))/.test(src), 'handled'],
  [27, 'two prompts in a row both fire (no state file to go stale)', 'state', P('done for today'), (o) => fires(o) && fires(run(P('done for today'))), 'handled'],
  [28, 'the injected text never tells the session to wait for another session', 'reversal', P('Domain Expansion'), (o) => !/wait for the other session|leave .* to the other session/i.test(o.out), 'handled'],
];

if (process.argv.includes('--table')) {
  console.log('| # | Scenario | Class | Verdict |\n|---|---|---|---|');
  for (const r of ROWS) console.log('| ' + r[0] + ' | ' + r[1] + ' | ' + r[2] + ' | ' + r[5] + ' |');
  process.exit(0);
}
let pass = 0; const fail = [];
for (const [id, name, , stdin, check] of ROWS) {
  let ok = false;
  try { ok = !!check(stdin === null ? null : run(stdin)); } catch (e) { ok = false; }
  if (ok) pass++; else fail.push(id + ' ' + name);
  console.log((ok ? 'PASS ' : 'FAIL ') + String(id).padStart(2) + '  ' + name);
}
console.log('\n' + pass + '/' + ROWS.length + ' passed');
if (fail.length) { console.log('FAILED: ' + fail.join(' | ')); process.exit(1); }
