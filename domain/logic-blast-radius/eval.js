#!/usr/bin/env node
/**
 * eval.js — smoke test for logic-blast-radius.discipline.hook.js (v2, quest-independent)
 *
 * Fixture-driven: writes temp transcript files under the OS temp dir, spawns the
 * hook via child_process.spawnSync with PreToolUse JSON on stdin, asserts BOTH
 * exit behavior AND output content (fire check + effect check).
 *
 * Fixture 6 proves quest-independence: the v2 hook no longer reads quest/active.txt
 * at all, so it denies regardless of any active.txt presence or content.
 *
 * Run: node domain/logic-blast-radius/eval.js
 * Exit: 0 = all 6 pass, 1 = any fail
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK = path.join(__dirname, 'logic-blast-radius.discipline.hook.js');

const STATEFUL_PATH =
  'E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\java\\my\\gov\\melaka\\MlkMaklumatTanahForm.java';
const NON_ETANAH_PATH =
  'E:\\Projects\\Other\\some-app\\src\\main\\java\\com\\acme\\CustomerForm.java';
const NON_STATEFUL_PATH =
  'E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\java\\my\\gov\\melaka\\SomeConstant.java';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lbr-eval-'));
const logPath = path.join(tmpRoot, 'eval-log.jsonl');

function makeTranscript(name, content) {
  const p = path.join(tmpRoot, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

const T_NO_BANNER = makeTranscript(
  't-no-banner.txt',
  'Session chatter. Scout done, Recon done. About to edit the form init method now.'
);
const T_WITH_BANNER = makeTranscript(
  't-with-banner.txt',
  'Rubric complete.\n═══ LOGIC BLAST RADIUS ═══\n| Scenario | Change fires? | Outcome | Safe? | Evidence |\n| init | yes | ok | yes | Form.java:42 |\n'
);
// new bypass contract (2026-08-21): token counts only in current-turn ASSISTANT text (JSONL)
const T_WITH_BYPASS = makeTranscript(
  't-with-bypass.txt',
  JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'edit it' }] } }) + '\n' +
  JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Audit-mode edit ahead. [skip-logic-blast: test] Proceeding with the compliance edit.' }] } })
);
const T_NO_BANNER_2 = makeTranscript(
  't-no-banner-2.txt',
  'Ad-hoc fix outside any quest. No matrix emitted, no active quest anywhere.'
);

function runHook(filePath, transcriptPath) {
  const stdin = JSON.stringify({
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: filePath },
    transcript_path: transcriptPath,
  });
  const r = spawnSync('node', [HOOK], {
    input: stdin,
    encoding: 'utf8',
    timeout: 10000,
    env: Object.assign({}, process.env, { LOGIC_BLAST_LOG: logPath }),
  });
  const raw = (r.stdout || '').trim();
  let parsed = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch (_) {}
  const denied =
    !!(parsed &&
      parsed.hookSpecificOutput &&
      parsed.hookSpecificOutput.permissionDecision === 'deny');
  const reason = denied ? parsed.hookSpecificOutput.permissionDecisionReason || '' : '';
  return { raw, parsed, denied, reason, exitCode: r.status, stderr: (r.stderr || '').trim() };
}

const tests = [
  {
    name: '1. stateful etanah .java + NO banner → DENY, reason mentions LOGIC BLAST RADIUS',
    run: () => runHook(STATEFUL_PATH, T_NO_BANNER),
    check: (r) =>
      r.exitCode === 0 && r.denied && /LOGIC BLAST RADIUS/i.test(r.reason),
  },
  {
    name: '2. stateful etanah .java + banner present → ALLOW (no deny)',
    run: () => runHook(STATEFUL_PATH, T_WITH_BANNER),
    check: (r) => r.exitCode === 0 && !r.denied,
  },
  {
    name: '3. stateful etanah .java + [skip-logic-blast: test] → ALLOW',
    run: () => runHook(STATEFUL_PATH, T_WITH_BYPASS),
    check: (r) => r.exitCode === 0 && !r.denied,
  },
  {
    name: '4. non-etanah .java path → silent exit 0, no output',
    run: () => runHook(NON_ETANAH_PATH, T_NO_BANNER),
    check: (r) => r.exitCode === 0 && r.raw === '',
  },
  {
    name: '5. etanah .java but non-stateful filename (SomeConstant.java) → silent',
    run: () => runHook(NON_STATEFUL_PATH, T_NO_BANNER),
    check: (r) => r.exitCode === 0 && r.raw === '',
  },
  {
    name: '6. NO quest/active.txt anywhere → STILL denies (quest-independence, v2)',
    // v2 hook does not read quest/active.txt at all; run from a bare temp cwd
    // that contains no quest folder to prove no quest context is consulted.
    run: () => {
      const bareCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'lbr-noquest-'));
      const stdin = JSON.stringify({
        hook_event_name: 'PreToolUse',
        tool_name: 'Edit',
        tool_input: { file_path: STATEFUL_PATH },
        transcript_path: T_NO_BANNER_2,
      });
      const r = spawnSync('node', [HOOK], {
        input: stdin,
        encoding: 'utf8',
        timeout: 10000,
        cwd: bareCwd,
        env: Object.assign({}, process.env, { LOGIC_BLAST_LOG: logPath }),
      });
      fs.rmSync(bareCwd, { recursive: true, force: true });
      const raw = (r.stdout || '').trim();
      let parsed = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch (_) {}
      const denied =
        !!(parsed &&
          parsed.hookSpecificOutput &&
          parsed.hookSpecificOutput.permissionDecision === 'deny');
      const reason = denied ? parsed.hookSpecificOutput.permissionDecisionReason || '' : '';
      return { raw, parsed, denied, reason, exitCode: r.status, stderr: (r.stderr || '').trim() };
    },
    check: (r) =>
      r.exitCode === 0 && r.denied && /LOGIC BLAST RADIUS/i.test(r.reason),
  },
];

// ── v3 arrival paths (2026-10-30, 287048) ──────────────────────────────────────
const cacheDir = path.join(tmpRoot, 'arrival');
fs.mkdirSync(cacheDir);
const IDS = ['first-pass', 'loop:pembetulanPB4CE', 'alter', 'initiate', 'reassign', 'migrated'];
fs.writeFileSync(path.join(cacheDir, 'PRBB-PB4CE.json'), JSON.stringify({ source: 'engine v15 mlit', ids: IDS }));
const activeFile = path.join(tmpRoot, 'active.txt');
fs.writeFileSync(activeFile, 'qa=QA-287048\nstatus=active\n\nqa=QA-111111\nstatus=closed\n');
const FORM = 'E:\\Dev\\etanah-work\\etanah-pelupusan\\src\\main\\java\\my\\gov\\MlkLaporanP1eForm.java';
const LITE_FORM = 'E:\\Dev\\etanah-work\\etanah-pelupusan\\src\\main\\java\\my\\gov\\BasePelupusanLiteForm.java';
const SERVICE = 'E:\\Dev\\etanah-work\\etanah-pelupusan\\src\\main\\java\\my\\gov\\PelupusanService.java';
const XHTML = 'E:\\Dev\\etanah-work\\etanah-pelupusan\\src\\main\\webapp\\protected\\X.xhtml';
const BANNER = '═══ LOGIC BLAST RADIUS ═══\n| Scenario | Change fires? | Outcome | Safe? | Evidence |\n| init | yes | ok | yes | F.java:1 |\n';
const row = (id, rows, verdict) => `| ${id} | how | ${rows} | r | s | t | ${verdict} |`;
const table = (opts) => {
  const o = Object.assign({ ticket: '287048', source: 'engine v15 mlit', ids: IDS, rows: 'SELECT 1', verdict: '✓' }, opts);
  return `ARRIVAL PATHS · ${o.ticket} · PRBB · PB4CE · source: ${o.source}\n| id | how | rows | check | today | should | verdict |\n|---|---|---|---|---|---|---|\n` + o.ids.map(i => row(i, o.rows, o.verdict)).join('\n') + '\n';
};
const say = (t) => JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: t }] } }) + '\n';
function runV3(file, newString, text, extra) {
  const tp = makeTranscript('v3-' + Math.random().toString(36).slice(2) + '.jsonl', say(text));
  const r = spawnSync('node', [HOOK], {
    input: JSON.stringify(Object.assign({ hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: file, new_string: newString, old_string: '' }, transcript_path: tp }, extra || {})),
    encoding: 'utf8', timeout: 10000,
    env: Object.assign({}, process.env, { LOGIC_BLAST_LOG: logPath, ARRIVAL_CACHE_DIR: cacheDir, ARRIVAL_ACTIVE_FILE: activeFile, ARRIVAL_DOC_ROOT: tmpRoot, CLAUDE_PROJECT_DIR: tmpRoot }),
  });
  const raw = (r.stdout || '').trim();
  let parsed = null; try { parsed = raw ? JSON.parse(raw) : null; } catch (_) {}
  const denied = !!(parsed && parsed.hookSpecificOutput && parsed.hookSpecificOutput.permissionDecision === 'deny');
  return { raw, parsed, denied, reason: denied ? parsed.hookSpecificOutput.permissionDecisionReason : '', exitCode: r.status, stderr: r.stderr || '' };
}
const GATE = 'setHantarSeterusnyaDisabled(!verifySign());';
const blocks = (name, file, str, text, re) => tests.push({ name, run: () => runV3(file, str, text), check: (r) => r.denied && (!re || re.test(r.reason)) });
const allows = (name, file, str, text) => tests.push({ name, run: () => runV3(file, str, text), check: (r) => !r.denied });
blocks('A1 banner, no table, gate edit → BLOCK, names the script', FORM, GATE, BANNER, /arrival-paths\.js/);
blocks('A2 table with first-pass only → BLOCK', FORM, GATE, BANNER + table({ ids: ['first-pass'] }), /row "alter" is missing/);
blocks('A3 loop row says n/a while the flowable has it → BLOCK', FORM, GATE, BANNER + table({ ids: IDS.filter(i => !i.startsWith('loop')) }) + row('loop:pembetulanPB4CE', 'n/a — no loop', '✓'), /loop:pembetulanPB4CE/);
blocks('A4 rows cell is prose, no SELECT → BLOCK', FORM, GATE, BANNER + table({ rows: 'same rows' }), /no SELECT/);
blocks('A5 verdict is not ✓ ✗ BA-Q → BLOCK', FORM, GATE, BANNER + table({ verdict: 'ok' }), /verdict must be/);
allows('A6 complete table → ALLOW', FORM, GATE, BANNER + table());
allows('A7 complete table with a ✗ row → edit ALLOWED (the commit gate owns it)', FORM, GATE, BANNER + table({ verdict: '✗' }));
allows('A8 Form edit with no state-check token → no arrival check', FORM, 'LOGGER.debug("x");', BANNER);
blocks('A9 xhtml edit adding disabled= → BLOCK', XHTML, '<et:commandButton disabled="#{mb.x}"/>', 'nothing', /no ARRIVAL PATHS/);
allows('A10 xhtml edit with no disabled= → silent', XHTML, '<h:outputText value="x"/>', 'nothing');
blocks('A11 table from a closed ticket → BLOCK', FORM, GATE, BANNER + table({ ticket: '111111' }), /not an active quest/);
blocks('A12 shared Lite form, one urusan table of seven → BLOCK', LITE_FORM, GATE, BANNER + table(), /OPRBB/);
blocks('A13 isSignedAllReport edit on the service → fires and asks for the shared urusan', SERVICE, 'boolean isSignedAllReport() {}', BANNER + table(), /shared/);
blocks('A14 table only inside a code fence → BLOCK', FORM, GATE, BANNER + '```\n' + table() + '```\n', /no ARRIVAL PATHS/);
blocks('A15 source line differs from the script (stale file not declared) → BLOCK', FORM, GATE, BANNER + table({ source: 'engine v11 mlit' }), /the script says/);
allows('A16 NOT VERIFIED source with no cache: admin rows only → ALLOW', FORM, GATE, BANNER + 'ARRIVAL PATHS · 287048 · OPRBB · SB · source: NOT VERIFIED: no BPMN\n| id | how | rows | c | t | s | verdict |\n|---|---|---|---|---|---|---|\n' + ['alter', 'initiate', 'reassign', 'migrated'].map(i => row(i, 'n/a — none', 'BA-Q')).join('\n') + '\n');
blocks('A17 no cache and an engine source → BLOCK, run the script', FORM, GATE, BANNER + 'ARRIVAL PATHS · 287048 · PRU · PB4DE · source: engine v3 mlit\n| id | how | rows | c | t | s | verdict |\n', /run node domain/);
tests.push({ name: 'A18 table kept in the quest doc through the DOC line → ALLOW', run: () => { const d = path.join(tmpRoot, 'projects', 'coding-projects', 'active', 'QA-287048'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'QA-287048.md'), '## Arrival paths\n' + table()); return runV3(FORM, GATE, BANNER + 'ARRIVAL PATHS DOC: QA-287048'); }, check: (r) => !r.denied });
tests.push({ name: 'A18b a stale doc copy in the session folder does not hide the main folder copy → ALLOW', run: () => { const d1 = path.join(tmpRoot, 'stale', 'projects', 'coding-projects', 'active', 'QA-287048'); fs.mkdirSync(d1, { recursive: true }); fs.writeFileSync(path.join(d1, 'QA-287048.md'), 'no table here'); const tp = makeTranscript('v3-doc.jsonl', say(BANNER + 'ARRIVAL PATHS DOC: QA-287048')); const rr = spawnSync('node', [HOOK], { input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: FORM, new_string: GATE }, transcript_path: tp }), encoding: 'utf8', env: Object.assign({}, process.env, { LOGIC_BLAST_LOG: logPath, ARRIVAL_CACHE_DIR: cacheDir, ARRIVAL_ACTIVE_FILE: activeFile, ARRIVAL_DOC_ROOT: path.join(tmpRoot, 'stale'), CLAUDE_PROJECT_DIR: tmpRoot }) }); return { raw: rr.stdout, denied: /"deny"/.test(rr.stdout || ''), exitCode: rr.status, stderr: rr.stderr }; }, check: (r) => !r.denied });
tests.push({ name: 'A19 [skip-logic-blast: audit] in the current turn → bypass', run: () => { const tp = makeTranscript('v3-skip.jsonl', JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'go' }] } }) + '\n' + say('[skip-logic-blast: audit edit]')); const rr = spawnSync('node', [HOOK], { input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: FORM, new_string: GATE }, transcript_path: tp }), encoding: 'utf8', env: Object.assign({}, process.env, { LOGIC_BLAST_LOG: logPath, ARRIVAL_CACHE_DIR: cacheDir, ARRIVAL_ACTIVE_FILE: activeFile }) }); return { raw: rr.stdout, denied: /"deny"/.test(rr.stdout || ''), exitCode: rr.status, stderr: rr.stderr }; }, check: (r) => !r.denied });
tests.push({ name: 'A20 broken stdin → fail-open', run: () => { const rr = spawnSync('node', [HOOK], { input: 'not json', encoding: 'utf8' }); return { raw: rr.stdout, denied: false, exitCode: rr.status, stderr: rr.stderr }; }, check: (r) => r.exitCode === 0 && !r.raw });

// arrival-paths.js derive(): the scenario list comes from the flowable
const { derive } = require('./arrival-paths.js');
const XML = `<definitions><process id="P"><startEvent id="s"/>
<userTask id="py" name="Penyediaan"><extensionElements><flowable:taskListener expression="\${l.receiveUserTask(&quot;PYB&quot;,&quot;PT&quot;,task.id)}"/></extensionElements></userTask>
<userTask id="pb" name="Pengesahan"><extensionElements><flowable:taskListener expression="\${l.receiveUserTask(&quot;PB&quot;,&quot;PT&quot;,task.id)}"/></extensionElements></userTask>
<exclusiveGateway id="g" name="Pembetulan"/><endEvent id="e"/>
<sequenceFlow id="f1" sourceRef="s" targetRef="py"></sequenceFlow><sequenceFlow id="f2" sourceRef="py" targetRef="pb"></sequenceFlow><sequenceFlow id="f3" sourceRef="pb" targetRef="g"></sequenceFlow>
<sequenceFlow id="f4" sourceRef="g" targetRef="py"><conditionExpression><![CDATA[\${pembetulanPB=="true"}]]></conditionExpression></sequenceFlow>
<sequenceFlow id="f5" sourceRef="g" targetRef="e"></sequenceFlow></process></definitions>`;
tests.push({ name: 'D1 derive: the feeder is first-pass, the gateway back is loop:<variable>', run: () => derive(XML, 'PB'), check: (r) => { const ids = r.rows.map(x => x.id); return ids.includes('first-pass') && ids.includes('loop:pembetulanPB') && ids.includes('alter'); } });
tests.push({ name: 'D2 derive: admin rows are always listed', run: () => derive(XML, 'PB'), check: (r) => ['alter', 'initiate', 'reassign', 'migrated'].every(i => r.rows.some(x => x.id === i)) });
tests.push({ name: 'D3 derive: an unknown tugasan returns no task', run: () => derive(XML, 'NOPE'), check: (r) => r.task === null });

let pass = 0;
let fail = 0;
console.log('\n===== logic-blast-radius eval results =====');
for (const t of tests) {
  let r;
  let ok = false;
  try {
    r = t.run();
    ok = t.check(r);
  } catch (e) {
    r = { raw: '', denied: false, reason: '', exitCode: -1, stderr: String(e) };
  }
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${t.name}`);
  if (!ok || process.env.VERBOSE) {
    console.log(
      `       exit=${r.exitCode} denied=${r.denied} out=${(r.raw || '(none)').slice(0, 120)}`
    );
    if (r.stderr) console.log(`       stderr: ${r.stderr.slice(0, 120)}`);
  }
}

fs.rmSync(tmpRoot, { recursive: true, force: true });

console.log(`\nTotal: ${pass}/${tests.length} pass · ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
