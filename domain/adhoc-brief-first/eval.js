#!/usr/bin/env node
// eval.js — the Stop half of adhoc-brief-first (the Stop branch of adhoc-brief-first.check.hook.js).
// The PreToolUse half has its own eval: adhoc-brief-first.eval.js. Run both before shipping.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'adhoc-brief-first.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'adhoc-brief-first-stop-'));
let seq = 0;
const L = o => JSON.stringify(o);
const U = text => L({ type: 'user', message: { role: 'user', content: text } });
const UM = text => L({ type: 'user', isMeta: true, message: { role: 'user', content: text } });
const AT = text => L({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });
const AU = (name, input) => L({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't' + (++seq), name, input }] } });
const BODY = 'Title: MLKSTG - MLPS tandatangan Borang 4Ae ralat GIS\n' + 'The Tandatangan click fails because the licence write to GIS fails. '.repeat(8);
const BA = '\n## Reply to BA\n**Short**\n```\nCuba klik semula.\n```\n**Full**\n```\nLicence tak sampai GIS. Cuba klik semula.\n```\n';
const BRIEF = BODY + BA + '\nSaving in the background next: ADHOC-MLPS-2026-4';
// ADHOC-MLMS-2026-1 first brief (2026-10-22): finding + Next steps, no reply to the BA
const NO_BA = BODY + '\n## Next steps\n| # | Action |\n|---|---|\n| 1 | Reply to the BA with the workaround in section 3 |\n\nSaving in the background next: ADHOC-MLPS-2026-4';
const ASK = U('start adhoc quest for melaka internal staging: klik tandatangan > error');
const QUERY = AU('mcp__postgres-mlkstg1-pg__query_database', { query: 'SELECT 1' });
const AGENT = AU('Agent', { description: 'Save adhoc', prompt: '[skip-brief-first: background save agent] write the save-set for ADHOC-MLPS-2026-4, run adhoc-save-audit', model: 'sonnet', run_in_background: true });
const OTHER_AGENT = AU('Agent', { description: 'Explore', prompt: 'find callers of insertGITP' });

function run(lines) {
  let payload = { hook_event_name: 'Stop' };
  if (lines !== undefined) {
    const f = Array.isArray(lines) ? path.join(TMP, 't' + (++seq) + '.jsonl') : lines;
    if (Array.isArray(lines)) fs.writeFileSync(f, lines.join('\n'));
    payload = { hook_event_name: 'Stop', transcript_path: f };
  }
  return spawnSync(process.execPath, [HOOK], { input: JSON.stringify(payload), encoding: 'utf8', timeout: 30000, env: process.env });
}
const said = r => (r.stdout || '') + (r.stderr || '');
const blocked = r => r.status === 2 || /"decision"\s*:\s*"block"/.test(r.stdout || '');
const expectBlock = (n, r) => check(n, blocked(r) && /adhoc-brief-first/.test(said(r)) && /ADHOC-MLPS-2026-4/.test(said(r)), 'exit=' + r.status + ' out=' + said(r).slice(0, 120));
const expectPass = (n, r) => check(n, !blocked(r) && r.status === 0, 'exit=' + r.status + ' out=' + said(r).slice(0, 120));

expectBlock('S1 the brief closes the turn with the marker and no save agent yet: ask for the agent', run([ASK, QUERY, AT(BRIEF)]));
expectPass('S2 the save agent was started AFTER the brief: let the turn end', run([ASK, QUERY, AT(BRIEF), UM('Stop hook feedback:\n▶ adhoc-brief-first'), AGENT, AT('save started in the background for ADHOC-MLPS-2026-4.')]));
expectBlock('S3 an agent started BEFORE the brief does not count (the 2026-10-13 second miss)', run([ASK, QUERY, AGENT, AT(BRIEF)]));
expectBlock('S4 an agent for something else after the brief does not count', run([ASK, QUERY, AT(BRIEF), OTHER_AGENT]));
expectPass('S5 a brief with no marker (nothing to save this round)', run([ASK, QUERY, AT(BODY)]));
expectPass('S6 a plain reply turn', run([U('thanks'), AT('Noted.')]));
expectPass('S7 the marker in an EARLIER turn does not hold this turn', run([ASK, AT(BRIEF), U('ok'), AT('Noted.')]));
expectPass('S8 the marker quoted inside hook feedback (meta) is not my brief', run([ASK, UM('Stop hook feedback:\nSaving in the background next: ADHOC-MLPS-2026-4'), AT('delta')]));
const expectBaBlock = (n, r) => check(n, blocked(r) && /no reply to the BA/.test(said(r)) && /Short then Full/.test(said(r)), 'exit=' + r.status + ' out=' + said(r).slice(0, 120));
expectBaBlock('B1 the ADHOC-MLMS-2026-1 miss: brief with no Reply to BA blocks, even with the save agent started', run([ASK, QUERY, AT(NO_BA), AGENT]));
expectBaBlock('B2 a Reply to BA heading with only the Short version blocks', run([ASK, AT(BODY + '\n## Reply to BA\n**Short**\n```\nx\n```\nSaving in the background next: ADHOC-MLPS-2026-4'), AGENT]));
expectPass('B3 the BA reply sent as the delta after the block, then the agent', run([ASK, AT(NO_BA), UM('Stop hook feedback:\nno reply to the BA'), AT(BA), AGENT]));
expectPass('B4 a round with nothing for the BA says so in one line', run([ASK, AT(BODY + '\nBA reply: none (internal check only)\nSaving in the background next: ADHOC-MLPS-2026-4'), AGENT]));
expectBaBlock('B5 "Reply to the BA" only inside a Next steps row is not the section', run([ASK, AT(NO_BA)]));
expectBaBlock('B6 "BA reply: none" with no reason does not count', run([ASK, AT(BODY + '\nBA reply: none\nSaving in the background next: ADHOC-MLPS-2026-4'), AGENT]));
expectBaBlock('B7 the BA heading quoted inside hook feedback (meta) is not my section', run([ASK, AT(NO_BA), UM('## Reply to BA\nShort Full'), AGENT]));
expectPass('B8 heading "### BA reply (WhatsApp)" with Short and Full', run([ASK, AT(BODY + '\n### BA reply (WhatsApp)\n**Short**\na\n**Full**\nb\nSaving in the background next: ADHOC-MLPS-2026-4'), AGENT]));
let r = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8', timeout: 30000, env: process.env });
check('S9 malformed stdin exits 0', r.status === 0, 'exit=' + r.status);
expectPass('S10 no transcript path: fail-open', run(undefined));
expectPass('S11 transcript missing on disk: fail-open', run(path.join(TMP, 'nope.jsonl')));
const plain = path.join(TMP, 'plain.jsonl'); fs.writeFileSync(plain, 'not json\nstill not json');
expectPass('S12 plain-text transcript: fail-open', run(plain));

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nadhoc-brief-first stop eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
