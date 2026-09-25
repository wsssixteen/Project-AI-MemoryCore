#!/usr/bin/env node
// staging-schema-tracker.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay cases: QA-273460 2026-08-10 — env declared 'ready' without ever checking standalone.xml against the live stg2 target
//   · 2026-09-23 — a background <task-notification> naming "<ticket>-stg1.sql" flipped the pointer stg2→stg1 (hook v2).
// Sandbox: every run points the hook at a temp state + log via STAGING_TRACKER_STATE_PATH / STAGING_TRACKER_LOG_PATH,
// so the live system/melaka-env-state.json is never written (asserted byte-identical at the end).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'staging-schema-tracker.check.hook.js');
const LIVE = path.join(__dirname, '..', '..', 'system', 'melaka-env-state.json');
const liveBefore = fs.existsSync(LIVE) ? fs.readFileSync(LIVE, 'utf8') : null;

const SB = fs.mkdtempSync(path.join(os.tmpdir(), 'staging-schema-tracker-eval-'));
const STATE = path.join(SB, 'melaka-env-state.json');
const LOG = path.join(SB, 'log.jsonl');
const META = {
  stg1: { melaka_staging_schema: 'stg1', schema_name: 'et_main_stg1', schema_user: 'et_main_stg1', mcp_server: 'postgres-mlkstg1-pg' },
  stg2: { melaka_staging_schema: 'stg2', schema_name: 'et_main_stg2', schema_user: 'et_main_stg2', mcp_server: 'postgres-mlkstg-pg' },
};
let base;
try { base = JSON.parse(liveBefore); } catch (_) { base = null; }
if (!base) base = { standalone_datasource: 'etanahDS', standalone_path: 'E:/Dev/jboss-7.4-plp-melaka/standalone/configuration/standalone.xml', history: [] };

function seed(s) { fs.writeFileSync(STATE, JSON.stringify(Object.assign({}, base, META[s || 'stg2'], { updated: '2000-01-01' }), null, 2) + '\n'); }
function state() { return JSON.parse(fs.readFileSync(STATE, 'utf8')); }
function logRows() { try { return fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch (_) { return []; } }
function run(stdin) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: stdin, encoding: 'utf8', timeout: 30000, windowsHide: true,
    env: Object.assign({}, process.env, { STAGING_TRACKER_STATE_PATH: STATE, STAGING_TRACKER_LOG_PATH: LOG }),
  });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const say = (prompt) => run(JSON.stringify({ prompt }));

const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
function noSwitch(label, prompt, from) {
  seed(from); const r = say(prompt); const s = state();
  check(label, s.melaka_staging_schema === (from || 'stg2') && s.updated === '2000-01-01' && !/Recorded:/.test(r.out),
    'schema=' + s.melaka_staging_schema + ' out=' + r.out.slice(0, 140));
  return r;
}
function switches(label, prompt, to, from) {
  seed(from); const r = say(prompt); const s = state();
  check(label, s.melaka_staging_schema === to && s.mcp_server === META[to].mcp_server && r.out.includes('Recorded: Melaka staging \u2192 ' + to),
    'schema=' + s.melaka_staging_schema + ' out=' + r.out.slice(0, 140));
  return r;
}

// Verbatim 2026-09-23 notification that flipped the pointer (background agent a83da84fb139f06d8).
const NOTIF = "<task-notification>\n<task-id>a83da84fb139f06d8</task-id>\n<tool-use-id>toolu_01XRyWKKeF9yjieNsrVVEP7e</tool-use-id>\n<output-file>C:\\Users\\Ridhwan\\AppData\\Local\\Temp\\claude\\C--Users-Ridhwan-OneDrive---Pymsoft-Sdn-Bhd-0--AI-Project-AI-MemoryCore--claude-worktrees-quest-280176-regression-003efe\\50e3ef37-1291-499f-9bb0-b8c2ff06a2a7\\tasks\\a83da84fb139f06d8.output</output-file>\n<status>completed</status>\n<summary>Agent \"Build Task-folder script naming rule\" finished</summary>\n<note>A task-notification fires each time this agent stops with no live background children of its own. The user can send it another message and resume it, so the same task-id may notify more than once.</note>\n<result>All three edits are done. Summary:\n\n1. `.claude/auto-memory/feedback_script_file_naming.md` — rewritten in place. New `description:` line: `&lt;ticket&gt;.sql = Redmine/PROD upload only (schema-qualified et_main, infra header format); &lt;ticket&gt;-stag.sql = script miya runs locally on staging (unqualified); same pattern for -mlit/-stg1. Never give the local run script the bare &lt;ticket&gt;.sql name.` Added the reserved-name rule, Why (2026-09-23 #280166: local staging script was `280166.sql`, PROD script `280166-2.sql`, backwards), and How-to-apply; kept the ticket-number-only / no-descriptive-names content.\n\n2. `.claude/auto-memory/MEMORY.md` — pointer line updated to: `- [script-file-naming](feedback_script_file_naming.md) — 🚨 &lt;ticket&gt;.sql = Redmine/PROD only, &lt;ticket&gt;-stag.sql = local staging run…`\n\n3. `.claude/skills/script-check/SKILL.md` — rule 7's name clause changed from `patch-&lt;ticket&gt;.sql` to Redmine/PROD `&lt;ticket&gt;.sql` vs local staging `&lt;ticket&gt;-stag.sql` (cites `feedback_script_file_naming`). Added `v4 — 2026-09-23 per みや (#280166)` line at the bottom noting rules 1-6 and 8 untouched.\n\nNo commit, no push, per instruction.</result>\n<usage><subagent_tokens>133010</subagent_tokens><tool_uses>8</tool_uses><duration_ms>80136</duration_ms></usage>\n</task-notification>";

try {
  // ── v1 specs (preserved) ──
  seed();
  check('F1 clean input exits 0 (no false block)', run('{}').status === 0, 'nonzero exit');
  check('F2 env-prompt injects live target', /Melaka staging target = stg2/.test(say('please prepare the env for me to test').out), 'no target line');
  check('F3 env-prompt emits a standalone verdict', /(matches|MISMATCH|not readable)/.test(say('here is the test scenario').out), 'no verdict');
  switches('F4 "we switched to stg1 now" rewrites schema + mcp_server', 'we switched to stg1 now', 'stg1');
  switches('F5 "actually use stg2 from now" switches back + confirms', 'actually use stg2 from now', 'stg2', 'stg1');
  noSwitch('F6 question does not clobber the pointer', 'which stg are we on?');
  seed();
  check('F7 unrelated prompt is silent', say('what is the capital of France').out.trim() === '', 'not silent');

  // ── v2: system / background notifications ──
  let before = logRows().length;
  const r9 = noSwitch('F8 verbatim 2026-09-23 task-notification does NOT switch', NOTIF);
  check('F9 notification is skipped whole (silent, no log row)', r9.out.trim() === '' && logRows().length === before, 'out=' + r9.out.slice(0, 80));
  noSwitch('F10 notification body without its tag still does NOT switch', NOTIF.replace(/<\/?task-notification>/g, ''));
  const r11 = noSwitch('F11 [SYSTEM NOTIFICATION - NOT USER INPUT] + switch phrase does NOT switch', '[SYSTEM NOTIFICATION - NOT USER INPUT] switch staging to stg1');
  check('F12 escaped <\\~task-notification> form is skipped whole', say('<\\~task-notification> switch staging to stg1').out.trim() === '' && r11.out.trim() === '', 'not silent');

  // ── v2: file names / schema / server tokens ──
  noSwitch('F13 "280166-stg1.sql" does NOT switch', '280166-stg1.sql');
  noSwitch('F14 "use 280166-stg1.sql for the local run" does NOT switch', 'use 280166-stg1.sql for the local run');
  noSwitch('F15 et_main_stg1 / postgres-mlkstg1-pg tokens do NOT switch', 'use et_main_stg1 via postgres-mlkstg1-pg to check apl 3398208');

  // ── v2: genuine switch phrases ──
  before = logRows().length;
  const r16 = switches('F16 "switch staging to stg1" switches', 'switch staging to stg1', 'stg1');
  check('F17 switch echoes the trigger phrase', r16.out.includes('Phrase: "switch staging to stg1"'), 'no phrase echo');
  const lr = logRows();
  check('F18 switch appends one log row (written + phrase)', lr.length === before + 1 && lr[lr.length - 1].outcome === 'written' && lr[lr.length - 1].phrase === 'switch staging to stg1', JSON.stringify(lr[lr.length - 1] || {}));
  switches('F19 miya\'s real 2026-08-10 wording (upper case) switches', 'AMEND YOUR CURRENT MEMORY EVERYWHERE ON THIS, WE HAVE SWITCHED TO STG2 FOR NOW.', 'stg2', 'stg1');
  switches('F20 "staging now stg1" switches', 'staging now stg1', 'stg1');
  switches('F21 "we\'re on stg1 now" switches', "we're on stg1 now", 'stg1');
  switches('F22 "set the env to stg1" switches', 'set the env to stg1', 'stg1');
  switches('F23 "switch from stg2 to stg1" takes the to-target', 'switch from stg2 to stg1', 'stg1');
  switches('F24 "switch to stg 1." (space + full stop) switches', 'switch to stg 1.', 'stg1');
  switches('F25 switch inside a longer work prompt still switches', 'for 280540 please switch staging to stg1, then prepare the test data', 'stg1');

  // ── v2: phrases that look like a switch but are not miya switching ──
  noSwitch('F26 negated "don\'t use stg1" does NOT switch', "don't use stg1, it is stale");
  noSwitch('F27 question "can we switch to stg1?" does NOT switch', 'can we switch to stg1?');
  noSwitch('F28 double-quoted example does NOT switch', 'the rule example is "use stg1" for the local script');
  noSwitch('F29 inline-code example does NOT switch', 'the doc says `switch to stg1` somewhere');
  noSwitch('F30 pasted block does NOT switch', '<pasted_content id="x">BA: switch to stg1 please</pasted_content> what does this mean');
  noSwitch('F31 third-person narration does NOT switch', 'the hook read it as miya switching Melaka staging to stg1');
  noSwitch('F32 "user" no longer matches "use"', 'the user ran it on stg1 yesterday');
  noSwitch('F33 "were on stg1" is not "we\'re on stg1"', 'those rows were on stg1 last week');
  noSwitch('F34 "go to stg1 and check" is an investigation, not a switch', 'go to stg1 and check apl 3398208');
  const r35 = noSwitch('F35 prompt about the tracker itself does NOT switch', 'staging-schema-tracker misfired again, I only said use stg1 in a file name');
  check('F36 about-the-tracker prompt says pointer NOT changed', /pointer NOT changed \(still stg2\)/.test(r35.out), r35.out.slice(0, 120));
  const r37 = noSwitch('F37 conflicting targets do NOT switch', 'switch to stg1. no wait, switch to stg2');
  check('F38 conflicting targets are surfaced', /conflicting switch phrases/.test(r37.out), r37.out.slice(0, 120));
  noSwitch('F39 the hook\'s own output pasted back does NOT switch',
    '\u2705 Recorded: Melaka staging \u2192 stg1 (et_main_stg1, MCP postgres-mlkstg1-pg). Was stg2. Wrote system/melaka-env-state.json. Phrase: "switch staging to stg1".');

  // ── v2: edges ──
  seed();
  const r40 = say('switch to stg2');
  check('F40 already on target → no rewrite, silent', state().updated === '2000-01-01' && r40.out.trim() === '', 'rewrote or spoke');
  seed();
  const r41 = run('not json at all');
  check('F41 malformed stdin exits 0 without writing', r41.status === 0 && state().updated === '2000-01-01', 'exit=' + r41.status);
  fs.unlinkSync(STATE);
  check('F42 missing state file + env prompt → UNKNOWN, never a default', /target UNKNOWN/.test(say('prepare the env please').out), 'no UNKNOWN line');
} finally {
  const liveAfter = fs.existsSync(LIVE) ? fs.readFileSync(LIVE, 'utf8') : null;
  check('F43 live system/melaka-env-state.json untouched by the eval', liveAfter === liveBefore, 'LIVE POINTER CHANGED');
  try { fs.rmSync(SB, { recursive: true, force: true }); } catch (_) {}
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nstaging-schema-tracker.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
