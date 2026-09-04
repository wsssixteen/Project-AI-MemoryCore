#!/usr/bin/env node
// commit-subject-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: QA-277697 2026-09-02: five drafts of one subject, each longer, with ';', dashes and
// 'keep 3 trg pages' (a non-change) until miya wrote the message himself.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'commit-subject-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function transcript(texts) {
  const p = path.join(os.tmpdir(), 'csg-eval-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(p, texts.map(t => JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: t }] } })).join('\n') + '\n');
  return p;
}
function run(stdin) { return spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: process.env }); }
function runT(texts) { return run(JSON.stringify({ transcript_path: transcript(texts) })); }
const fenced = s => 'Here is the message:\n\n```text\n' + s + '\n```\n';
const blocked = r => r.status === 2 && /commit-subject-gate/.test(r.stdout || '');
const silent = r => r.status === 0;

// F1: clean input → must NOT block (exit 0)
let r = run('{}');
check('F1 clean input exits 0 (no false block)', silent(r), 'exit=' + r.status);

// F2: REPLAY — the 2026-09-02 draft with ';' and 'keep' → BLOCK
r = runT([fenced('Ref #277697 - Remove TRG code and resources; move 2 internal composites from components/trg to components/mlk; keep 3 trg pages used by Melaka fail induk and gabungan')]);
check('F2 replay: ";" + non-change word + >100 chars → BLOCK', blocked(r) && /R1/.test(r.stdout) && /R4/.test(r.stdout) && /R5/.test(r.stdout), 'exit=' + r.status + ' ' + (r.stdout || '').slice(0, 120));

// F3: the approved final message → silent pass
r = runT([fenced('Ref #277697 - Remove TRG code & resources, rename 2 shared composites to mlk')]);
check('F3 approved final subject → pass', silent(r), 'exit=' + r.status + ' ' + (r.stdout || '').slice(0, 120));

// F4: spaced dash inside the description (4th separator) → BLOCK R2
r = runT([fenced('Ref #277697 - PT - SKM - Remove TRG - rename composites')]);
check('F4 dash inside description → BLOCK R2', blocked(r) && /R2/.test(r.stdout), 'exit=' + r.status);

// F5: three separators (prefix, URUSAN, TUGASAN, description) → pass
r = runT([fenced('QA #262762 - OPLPS - PB - Tujuan Pengiklanan save + Borang papar maklumat reflect changes')]);
check('F5 canonical 3-separator subject → pass', silent(r), 'exit=' + r.status + ' ' + (r.stdout || '').slice(0, 120));

// F6: em dash → BLOCK R2
r = runT([fenced('Ref #277697 - Remove TRG — rename composites')]);
check('F6 em dash → BLOCK R2', blocked(r) && /R2/.test(r.stdout), 'exit=' + r.status);

// F7: non-change word only → BLOCK R4
r = runT([fenced('Ref #277697 - Remove TRG, keep 3 trg pages Melaka uses')]);
check('F7 "keep" → BLOCK R4', blocked(r) && /R4/.test(r.stdout), 'exit=' + r.status);

// F8: > 100 chars, otherwise clean → BLOCK R5
r = runT([fenced('Ref #277697 - Remove TRG code and resources and rename two shared internal composites from the trg folder to mlk folder')]);
check('F8 >100 chars → BLOCK R5', blocked(r) && /R5/.test(r.stdout), 'exit=' + r.status);

// F9: redraft LONGER than previous draft for same ticket → BLOCK R6
r = runT([fenced('Ref #277697 - Remove TRG, rename 2 composites to mlk'), 'some talk', fenced('Ref #277697 - Remove TRG code and resources, rename 2 shared composites to mlk')]);
check('F9 longer redraft same ticket → BLOCK R6', blocked(r) && /R6/.test(r.stdout), 'exit=' + r.status + ' ' + (r.stdout || '').slice(0, 120));

// F10: redraft SHORTER than previous → pass
r = runT([fenced('Ref #277697 - Remove TRG code and resources, rename 2 shared composites to mlk'), fenced('Ref #277697 - Remove TRG, rename 2 composites to mlk')]);
check('F10 shorter redraft → pass', silent(r), 'exit=' + r.status + ' ' + (r.stdout || '').slice(0, 120));

// F11: longer draft but DIFFERENT ticket → pass (no cross-ticket comparison)
r = runT([fenced('Ref #111111 - Remove TRG'), fenced('Ref #277697 - Remove TRG code & resources, rename 2 shared composites to mlk')]);
check('F11 different ticket longer → pass', silent(r), 'exit=' + r.status);

// F12: bypass token → pass
r = runT([fenced('Ref #277697 - Remove TRG; keep pages') + ' [skip-commit-subject: miya dictated this exact wording]']);
check('F12 bypass token → pass', silent(r), 'exit=' + r.status);

// F13: subject inside a git commit -m bash block with ';' → BLOCK
r = runT(['```bash\ncd E:/Projects/Melaka/etanah-pelupusan && git commit -m "Ref #277697 - Remove TRG; rename composites"\n```']);
check('F13 git commit -m string with ";" → BLOCK', blocked(r) && /R1/.test(r.stdout), 'exit=' + r.status);

// F14: fenced block that is not a subject (SQL) → silent
r = runT(['```sql\nSELECT * FROM umm_aplikasi WHERE aplikasi_id = 1; -- keep\n```']);
check('F14 non-subject fenced block → silent', silent(r), 'exit=' + r.status);

// F15: arrow in subject → BLOCK R3
r = runT([fenced('Ref #277697 - template/TRG -> template/state/TRG')]);
check('F15 arrow → BLOCK R3', blocked(r) && /R3/.test(r.stdout), 'exit=' + r.status);

// F16: intra-word hyphen (int-env, e-Doket) → pass
r = runT([fenced('Ref #277697 - PRBB - Fix e-Doket surat on int-env deploy')]);
check('F16 intra-word hyphen → pass', silent(r), 'exit=' + r.status + ' ' + (r.stdout || '').slice(0, 120));

// F17: plain-text (non-JSON) transcript → exit 0
{ const p = path.join(os.tmpdir(), 'csg-plain-' + Date.now() + '.txt'); fs.writeFileSync(p, 'Ref #277697 - Remove TRG; keep\n');
  r = run(JSON.stringify({ transcript_path: p })); check('F17 plain-text transcript → exit 0', silent(r), 'exit=' + r.status); }

// F18: missing transcript path → exit 0
r = run(JSON.stringify({ transcript_path: 'C:/nope/none.jsonl' }));
check('F18 missing transcript → exit 0', silent(r), 'exit=' + r.status);

// F19: the gate's OWN block text quoted in prose (self-disarm class) → not a fenced subject → silent
r = runT(['The gate says: R4 non-change word "keep": a subject says what CHANGED. Shape: `Ref #<num> - <URUSAN> - <TUGASAN> - <what changed>`']);
check('F19 own help text in prose → silent', silent(r), 'exit=' + r.status);

// F20: lowercase "ref #" prefix is still a subject → checked
r = runT([fenced('ref #277697 - Remove TRG; rename composites')]);
check('F20 lowercase ref prefix still checked → BLOCK', blocked(r), 'exit=' + r.status);

// F21: CRLF + trailing spaces inside the fence → still parsed
r = runT(['```text\r\nRef #277697 - Remove TRG; rename composites   \r\n```\r\n']);
check('F21 CRLF fenced subject → BLOCK', blocked(r), 'exit=' + r.status);

// F22: "left" as a real word in a change ("left panel") is a false positive → documented accepted-risk, bypass exists
r = runT([fenced('Ref #277697 - PT - Fix left panel width')]);
check('F22 "left panel" → BLOCK (accepted false positive, bypass available)', blocked(r) && /R4/.test(r.stdout), 'exit=' + r.status);

// F23: QA prefix, clean, two separators → pass
r = runT([fenced('QA #266249 - PT - Fix Keluasan Tanah')]);
check('F23 QA prefix clean → pass', silent(r), 'exit=' + r.status);

// F24: two subjects in one reply, one bad → BLOCK naming the bad one
r = runT([fenced('Ref #277697 - Remove TRG') + fenced('Ref #277698 - Fix logo; keep old file')]);
check('F24 two subjects, one bad → BLOCK names 277698', blocked(r) && /277698/.test(r.stdout) , 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ncommit-subject-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
