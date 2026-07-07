/**
 * eval.js — regression fixtures for domain/predicate-box/predicate-box.discipline.hook.js
 *
 * Run: node domain/predicate-box/eval.js
 * Exits 0 only if ALL 7 fixtures pass. Prints PASS/FAIL per case.
 *
 * Fixture transcripts are temp .jsonl files under the OS temp dir, mirroring the
 * shape the hook parses (same as real Stop transcripts):
 *   {"message":{"role":"user","content":"..."}}
 *   {"message":{"role":"assistant","content":[{"type":"text","text":"..."}]}}
 * The hook receives stdin JSON {transcript_path, stop_hook_active}.
 *
 * Every fixture runs with cwd = the temp dir (NOT the repo root) and no
 * quest/active.txt anywhere in sight — fixture 7 makes the quest-independence
 * assertion explicit.
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.resolve(__dirname, 'predicate-box.discipline.hook.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'predicate-box-eval-'));

function jl(obj) { return JSON.stringify(obj); }
function userLine(text) { return jl({ message: { role: 'user', content: text } }); }
function asstLine(text) { return jl({ message: { role: 'assistant', content: [{ type: 'text', text }] } }); }

const ETANAH_EDIT_TEXT =
  'I ran Edit with file_path etanah-pelupusan/src/main/java/my/etanah/view/melaka/MlkKertasTemplateForm.java ' +
  'and changed the populator branch. Done.';
const NON_ETANAH_TEXT =
  'I reviewed the memory notes and updated main/current-session.md with the recap. Done.';
const MARKERS_TEXT =
  ETANAH_EDIT_TEXT +
  '\nASSUMPTION: the populator only skips when isFirstEntry is false.' +
  '\nEVIDENCE: BasePelupusanDokumenForm.java:468 quoted.' +
  '\nFALSIFIER: a stored doc row with isFirstEntry true would break this.';

function writeTranscript(name, lines) {
  const p = path.join(TMP, name + '.jsonl');
  fs.writeFileSync(p, lines.join('\n') + '\n', 'utf8');
  return p;
}

function runHook(transcriptPath, stopHookActive) {
  const input = jl({ transcript_path: transcriptPath, stop_hook_active: !!stopHookActive });
  const r = spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8', cwd: TMP, timeout: 15000 });
  return { stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim(), status: r.status };
}

function expectBlock(out) {
  if (!out.stdout) return 'expected decision:block, got empty stdout';
  let parsed;
  try { parsed = JSON.parse(out.stdout); } catch (e) { return 'stdout not JSON: ' + out.stdout.slice(0, 120); }
  if (parsed.decision !== 'block') return 'decision !== block: ' + out.stdout.slice(0, 120);
  if (!/ASSUMPTION/i.test(parsed.reason) || !/FALSIFIER/i.test(parsed.reason)) {
    return 'reason does not mention ASSUMPTION/FALSIFIER';
  }
  return null;
}

function expectSilent(out) {
  if (out.stdout) return 'expected silent pass, got stdout: ' + out.stdout.slice(0, 120);
  return null;
}

const fixtures = [
  {
    name: '1. fix-intent + etanah edit + NO markers -> block (reason names ASSUMPTION/FALSIFIER)',
    run() {
      const t = writeTranscript('f1', [
        userLine('Please fix the JT-empty bug on the kertas template.'),
        asstLine(ETANAH_EDIT_TEXT),
      ]);
      return expectBlock(runHook(t, false));
    },
  },
  {
    name: '2. same but reply HAS both ASSUMPTION + FALSIFIER -> silent pass',
    run() {
      const t = writeTranscript('f2', [
        userLine('Please fix the JT-empty bug on the kertas template.'),
        asstLine(MARKERS_TEXT),
      ]);
      return expectSilent(runHook(t, false));
    },
  },
  {
    name: '3. same as 1 + [skip-predicate-box: test] in transcript -> pass',
    run() {
      const t = writeTranscript('f3', [
        userLine('Please fix the JT-empty bug. [skip-predicate-box: test]'),
        asstLine(ETANAH_EDIT_TEXT),
      ]);
      return expectSilent(runHook(t, false));
    },
  },
  {
    name: '4. NO fix-intent in last user message -> silent',
    run() {
      const t = writeTranscript('f4', [
        userLine('Thanks, looks good. Show me the summary table again.'),
        asstLine(ETANAH_EDIT_TEXT),
      ]);
      return expectSilent(runHook(t, false));
    },
  },
  {
    name: '5. fix-intent but NO etanah-edit cue -> silent',
    run() {
      const t = writeTranscript('f5', [
        userLine('Please fix the recap section wording.'),
        asstLine(NON_ETANAH_TEXT),
      ]);
      return expectSilent(runHook(t, false));
    },
  },
  {
    name: '6. stop_hook_active:true -> immediate silent exit (anti-loop)',
    run() {
      const t = writeTranscript('f6', [
        userLine('Please fix the JT-empty bug on the kertas template.'),
        asstLine(ETANAH_EDIT_TEXT),
      ]);
      return expectSilent(runHook(t, true));
    },
  },
  {
    name: '7. quest-independence: no quest/active.txt anywhere (cwd=temp) -> still blocks',
    run() {
      const activeTxt = path.join(TMP, 'quest', 'active.txt');
      if (fs.existsSync(activeTxt)) return 'test setup broken: temp quest/active.txt exists';
      const t = writeTranscript('f7', [
        userLine('Debug why the syarat dropdown is broken and patch it.'),
        asstLine(ETANAH_EDIT_TEXT),
      ]);
      return expectBlock(runHook(t, false));
    },
  },
];

let failed = 0;
for (const f of fixtures) {
  let err;
  try { err = f.run(); } catch (e) { err = 'threw: ' + e.message; }
  if (err) { failed++; console.log('FAIL  ' + f.name + '\n      -> ' + err); }
  else { console.log('PASS  ' + f.name); }
}

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* best effort */ }

console.log(failed === 0 ? '\nALL 7 PASS' : '\n' + failed + ' FIXTURE(S) FAILED');
process.exit(failed === 0 ? 0 : 1);
