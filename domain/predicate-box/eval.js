/**
 * eval.js — regression fixtures for domain/predicate-box/predicate-box.discipline.hook.js
 *
 * Run: node domain/predicate-box/eval.js
 * Exits 0 only if ALL fixtures pass. Prints PASS/FAIL per case.
 * Fixtures 1-7 pin requirement 1 (Predicate Diagram, v2). Fixtures 8+ pin requirement 2
 * (probe decision, v3) and use real tool_use blocks, the shape of a live transcript.
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
const LOG = path.join(TMP, 'log.jsonl'); // keeps eval rows out of the live fire log

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
  return runRaw(input);
}

function runRaw(input) {
  const env = Object.assign({}, process.env, { PREDICATE_BOX_LOG: LOG });
  const r = spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8', cwd: TMP, timeout: 15000, env });
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
  if (out.status !== 0) return 'expected exit 0, got ' + out.status + ' stderr=' + out.stderr.slice(0, 120);
  return null;
}

// Real transcript shape for a tool call: one assistant line holding a tool_use block.
function toolLine(name, input) { return jl({ message: { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_x', name, input }] } }); }
function editLine(file, extra) { return toolLine('Edit', Object.assign({ file_path: file, old_string: 'kodPejabat = null;', new_string: 'kodPejabat = fallback();' }, extra || {})); }

// The path the #282442 edits really used (work clone, backslashes).
const JAVA = 'E:\\Dev\\etanah-work\\etanah-pelupusan\\src\\main\\java\\my\\gov\\etanah\\pelupusan\\web\\form\\utiliti\\mlk\\MlkUtilitiPembatalanPermohonanForm.java';
const JAVA2 = 'E:\\Dev\\etanah-work\\etanah-pelupusan\\src\\main\\java\\my\\gov\\etanah\\pelupusan\\web\\form\\MlkSuratTemplateForm.java';
const XHTML = 'E:\\Dev\\etanah-work\\etanah-pelupusan\\src\\main\\webapp\\pages\\utiliti\\mlk\\MlkUtilitiPembatalanPermohonanForm.xhtml';
const DIAGRAM = 'ASSUMPTION: kodPejabat is empty for PRBB.\nEVIDENCE: MlkUtilitiPembatalanPermohonanForm.java:412 quoted.\nFALSIFIER: a PRBB row with bandar set.';
const MATRIX =
  'PROBE COVERAGE MATRIX\n' +
  '| # | Candidate writer (full address) | Probe placed? | If silent, what it proves |\n' +
  '|---|---|---|---|\n' +
  '| 1 | MlkUtilitiPembatalanPermohonanForm.initBPMFlow | yes | the Jana click never reached the form |\n' +
  '| 2 | PelupusanHelper.getKodPejabat (PRBB branch) | yes | helper skipped for PRBB |\n' +
  '| 3 | AppPermohonanTanah kodPejabat read | yes | no tanah row for the permohonan |\n' +
  '| 4 | FALLBACK: outermost onJana() entry + persist boundary | yes | the click never reached the bean at all |';
const MATRIX_ONE_ROW = MATRIX.split('\n').slice(0, 4).join('\n');
const MATRIX_NO_FALLBACK = MATRIX.split('\n').slice(0, 6).join('\n');

function expectProbeBlock(out) {
  if (out.status !== 2) return 'expected exit 2, got ' + out.status + ' stdout=' + out.stdout.slice(0, 80);
  if (out.stdout) return 'expected empty stdout on exit 2, got: ' + out.stdout.slice(0, 80);
  if (!/probe-matrix/.test(out.stderr) || !/PROBE COVERAGE MATRIX/.test(out.stderr) || !/Probe placed\?/.test(out.stderr)) {
    return 'stderr does not carry the probe reason: ' + out.stderr.slice(0, 120);
  }
  if (/commit (the|your) probe/i.test(out.stderr)) return 'reason pushes a probe commit';
  return null;
}

function expectLog(needle) {
  let raw = ''; try { raw = fs.readFileSync(LOG, 'utf8'); } catch (e) { /* none */ }
  return raw.includes(needle) ? null : 'log.jsonl has no "' + needle + '" row';
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
  // ── requirement 2: probe decision (v3) ──────────────────────────────────
  {
    name: '8. THE MISS (#282442): .java Edit + Predicate Diagram + NO matrix, no fix-intent word -> exit 2, reason on stderr, probe-blocked logged',
    run() {
      const t = writeTranscript('f8', [userLine('ok proceed'), editLine(JAVA), asstLine(DIAGRAM)]);
      return expectProbeBlock(runHook(t, false)) || expectLog('probe-blocked');
    },
  },
  {
    name: '9. same + PROBE COVERAGE MATRIX table in the reply -> exit 0',
    run() {
      const t = writeTranscript('f9', [userLine('ok proceed'), editLine(JAVA), asstLine(DIAGRAM + '\n' + MATRIX)]);
      return expectSilent(runHook(t, false));
    },
  },
  {
    name: '10. xhtml-only Edit -> exit 0',
    run() {
      const t = writeTranscript('f10', [userLine('ok proceed'), editLine(XHTML), asstLine(DIAGRAM)]);
      return expectSilent(runHook(t, false));
    },
  },
  {
    name: '11. skip token with a real reason after the edit -> exit 0, reason logged',
    run() {
      const t = writeTranscript('f11', [userLine('ok proceed'), editLine(JAVA),
        asstLine(DIAGRAM + '\n[skip-probe-matrix: constant renamed only, no runtime branch changed]')]);
      return expectSilent(runHook(t, false)) || expectLog('probe-bypassed') || expectLog('no runtime branch changed');
    },
  },
  {
    name: '12. help-text token quoted back ([skip-probe-matrix: <reason>]) -> exit 2',
    run() {
      const t = writeTranscript('f12', [userLine('ok proceed'), editLine(JAVA),
        asstLine(DIAGRAM + '\nThe gate says to add [skip-probe-matrix: <reason>] to the reply.')]);
      return expectProbeBlock(runHook(t, false));
    },
  },
  {
    name: '13. stop_hook_active:true on the miss -> exit 0',
    run() {
      const t = writeTranscript('f13', [userLine('ok proceed'), editLine(JAVA), asstLine(DIAGRAM)]);
      return expectSilent(runHook(t, true));
    },
  },
  {
    name: '14. malformed stdin -> exit 0',
    run() { return expectSilent(runRaw('{not json')); },
  },
  {
    name: '15. skip reason argues from size ("too small") -> exit 2, refusal named',
    run() {
      const t = writeTranscript('f15', [userLine('ok proceed'), editLine(JAVA),
        asstLine(DIAGRAM + '\n[skip-probe-matrix: the fix is too small to need loggers]')]);
      const out = runHook(t, false);
      return expectProbeBlock(out) || (/Refused: skip reason argues from size/.test(out.stderr) ? null : 'stderr does not name the refusal');
    },
  },
  {
    name: '16. ONE probe placed in the .java edit, no matrix (single-hypothesis probe) -> exit 2',
    run() {
      const t = writeTranscript('f16', [userLine('ok proceed'),
        editLine(JAVA, { new_string: 'LOGGER.info("QA282442-PROBE: kodPejabat=" + kodPejabat);' }), asstLine(DIAGRAM)]);
      return expectProbeBlock(runHook(t, false));
    },
  },
  {
    name: '17. QA<num>-PROBE named in reply text only, none placed, no matrix -> exit 2',
    run() {
      const t = writeTranscript('f17', [userLine('ok proceed'), editLine(JAVA),
        asstLine(DIAGRAM + '\nFalsifier logger would be QA282442-PROBE: kodPejabat.')]);
      return expectProbeBlock(runHook(t, false));
    },
  },
  {
    name: '18. matrix header only, no data row -> exit 2',
    run() {
      const t = writeTranscript('f18', [userLine('ok proceed'), editLine(JAVA),
        asstLine(DIAGRAM + '\n| # | Candidate writer (full address) | Probe placed? | If silent, what it proves |\n|---|---|---|---|\n')]);
      return expectProbeBlock(runHook(t, false));
    },
  },
  {
    name: '19. skip token from an EARLIER edit, new .java edit after it -> exit 2',
    run() {
      const t = writeTranscript('f19', [userLine('ok proceed'), editLine(JAVA),
        asstLine('[skip-probe-matrix: constant renamed only, no runtime branch changed]'),
        userLine('next one'), editLine(JAVA2), asstLine(DIAGRAM)]);
      return expectProbeBlock(runHook(t, false));
    },
  },
  {
    name: '20. matrix written into the quest .md (Write tool), not the chat -> exit 0',
    run() {
      const t = writeTranscript('f20', [userLine('ok proceed'), editLine(JAVA),
        toolLine('Write', { file_path: 'C:\\repo\\projects\\coding-projects\\active\\QA-282442\\QA-282442.md', content: '## Probes\n' + MATRIX }),
        asstLine(DIAGRAM)]);
      return expectSilent(runHook(t, false));
    },
  },
  {
    name: '21. fix-intent + .java Edit + NEITHER diagram NOR matrix -> one decision:block naming both',
    run() {
      const t = writeTranscript('f21', [userLine('Please fix the bug.'), editLine(JAVA), asstLine('Done.')]);
      const out = runHook(t, false);
      const e = expectBlock(out); if (e) return e;
      return /PROBE COVERAGE MATRIX/.test(JSON.parse(out.stdout).reason) ? null : 'reason does not carry the probe lines';
    },
  },
  {
    name: '22. .java path only READ (no edit tool) -> exit 0',
    run() {
      const t = writeTranscript('f22', [userLine('ok proceed'), toolLine('Read', { file_path: JAVA }), asstLine('Read it.')]);
      return expectSilent(runHook(t, false));
    },
  },
  {
    name: '23. Edit of a MemoryCore file whose CONTENT names an etanah .java path -> exit 0',
    run() {
      const t = writeTranscript('f23', [userLine('ok proceed'),
        toolLine('Edit', { file_path: 'C:\\repo\\domain\\x\\notes.txt', old_string: 'a', new_string: JAVA }), asstLine('Noted.')]);
      return expectSilent(runHook(t, false));
    },
  },
  {
    name: '24. transcript file missing -> exit 0',
    run() { return expectSilent(runHook(path.join(TMP, 'nope.jsonl'), false)); },
  },
  {
    name: '25. transcript is plain text, not JSONL -> exit 0',
    run() {
      const p = path.join(TMP, 'f25.jsonl');
      fs.writeFileSync(p, 'Edit etanah-pelupusan/src/A.java\nnot json at all\n', 'utf8');
      return expectSilent(runHook(p, false));
    },
  },
  {
    name: '26. old token quoted with its placeholder no longer disarms requirement 1 -> block',
    run() {
      const t = writeTranscript('f26', [userLine('Please fix the JT-empty bug.'),
        asstLine(ETANAH_EDIT_TEXT + '\nThe gate offers [skip-predicate-box: <reason>] as a bypass.')]);
      return expectBlock(runHook(t, false));
    },
  },
  {
    name: '27. probe CLEANUP edit (old_string holds the marker, new_string does not) -> exit 0',
    run() {
      const t = writeTranscript('f27', [userLine('remove the loggers'),
        editLine(JAVA, { old_string: 'LOGGER.info("QA282442-PROBE: x");\nint a = 1;', new_string: 'int a = 1;' }), asstLine('Removed.')]);
      return expectSilent(runHook(t, false));
    },
  },
  {
    name: '28. MultiEdit on a .java file -> exit 2',
    run() {
      const t = writeTranscript('f28', [userLine('ok proceed'),
        toolLine('MultiEdit', { file_path: JAVA, edits: [{ old_string: 'a', new_string: 'b' }] }), asstLine(DIAGRAM)]);
      return expectProbeBlock(runHook(t, false));
    },
  },
  {
    name: '29. skip reason too short ("n/a") -> exit 2',
    run() {
      const t = writeTranscript('f29', [userLine('ok proceed'), editLine(JAVA), asstLine(DIAGRAM + '\n[skip-probe-matrix: n/a]')]);
      return expectProbeBlock(runHook(t, false));
    },
  },
  {
    name: '30. valid-looking skip token in a USER-role message only (hook text, pasted doc) -> exit 2',
    run() {
      const t = writeTranscript('f30', [userLine('ok proceed'), editLine(JAVA),
        userLine('docs say [skip-probe-matrix: constant renamed only, no runtime branch changed]'), asstLine(DIAGRAM)]);
      return expectProbeBlock(runHook(t, false));
    },
  },
  {
    name: '31. forward-slash repo path (E:/Projects/Melaka/etanah-awam/...java) -> exit 2',
    run() {
      const t = writeTranscript('f31', [userLine('ok proceed'),
        editLine('E:/Projects/Melaka/etanah-awam/src/main/java/my/gov/etanah/awam/web/form/CarianRasmiHakmilikForm.java'), asstLine(DIAGRAM)]);
      return expectProbeBlock(runHook(t, false));
    },
  },
  {
    name: '32. matrix emitted in an EARLIER turn (Rubric), edit in a later turn -> exit 0',
    run() {
      const t = writeTranscript('f32', [userLine('rubric please'), asstLine(MATRIX), userLine('apply'), editLine(JAVA), asstLine(DIAGRAM)]);
      return expectSilent(runHook(t, false));
    },
  },
  {
    name: '33. matrix with ONE row (only the favourite hypothesis) -> exit 2, refusal names the row count',
    run() {
      const t = writeTranscript('f33', [userLine('ok proceed'), editLine(JAVA), asstLine(DIAGRAM + '\n' + MATRIX_ONE_ROW)]);
      const out = runHook(t, false);
      return expectProbeBlock(out) || (/matrix incomplete: 1 row/.test(out.stderr) ? null : 'stderr does not name the incomplete matrix');
    },
  },
  {
    name: '34. matrix with 3 rows but NO fallback row -> exit 2, refusal names the missing fallback',
    run() {
      const t = writeTranscript('f34', [userLine('ok proceed'), editLine(JAVA), asstLine(DIAGRAM + '\n' + MATRIX_NO_FALLBACK)]);
      const out = runHook(t, false);
      return expectProbeBlock(out) || (/fallback row MISSING/.test(out.stderr) ? null : 'stderr does not name the missing fallback');
    },
  },
  {
    name: '35. cleanup edit AND a fresh fix edit in one session, no matrix -> exit 2 (cleanup does not cover the fix)',
    run() {
      const t = writeTranscript('f35', [userLine('ok proceed'),
        editLine(JAVA, { old_string: 'LOGGER.info("QA282442-PROBE: x");', new_string: '' }), editLine(JAVA2), asstLine(DIAGRAM)]);
      return expectProbeBlock(runHook(t, false));
    },
  },
  {
    name: '36. probes placed AND complete matrix (the intended shape) -> exit 0, probe-passed logged',
    run() {
      const t = writeTranscript('f36', [userLine('ok proceed'), asstLine(MATRIX),
        editLine(JAVA, { new_string: 'LOGGER.info("QA282442-PROBE: entry onJana");' }), asstLine(DIAGRAM)]);
      return expectSilent(runHook(t, false)) || expectLog('probe-passed');
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

console.log(failed === 0 ? '\nALL ' + fixtures.length + ' PASS' : '\n' + failed + ' FIXTURE(S) FAILED');
process.exit(failed === 0 ? 0 : 1);
