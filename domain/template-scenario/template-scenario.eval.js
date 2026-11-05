#!/usr/bin/env node
// template-scenario.eval.js — fixtures for the orchestrator logic, the Stop gate and the fix-photo box rule.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const T = require('./template-scenario.js');
const { decide } = require('./template-scenario.check.hook.js');

let pass = 0, fail = 0;
function check(name, ok, info) { if (ok) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name + (info ? '  :: ' + info : '')); } }

// ---- checklist
const md = '# QA\n\n## Template checklist\n| R | Source | Text | Status | Find |\n|---|---|---|---|---|\n| R1 | requirement | RM 100 (Nominal) | done | `(Nominal)` |\n| R2 | Description Issue 2 | Tujuan papar | todo | |\n| R3 | diff | Penjenisa | na: typo in requirement | |\n\n## Next\n';
const rows = T.parseChecklist(md);
check('F01 checklist parsed (3 rows)', rows && rows.length === 3, JSON.stringify(rows));
const st = T.checklistState(rows);
check('F02 a todo row keeps the checklist open and names R2', !st.ok && st.open[0].startsWith('R2'), JSON.stringify(st));
check('F03 no checklist section = not ok', !T.checklistState(T.parseChecklist('# QA\n')).ok);
check('F04 na without a reason stays open', !T.checklistState(T.parseChecklist('## Template checklist\n| R | Source | Text | Status | Find |\n|---|---|---|---|---|\n| R1 | x | y | na | |\n')).ok);

// ---- chain coverage
const block = { actions: [{ type: 'CREATE' }, { type: 'STATUS_PENYEDIAAN_SEDIA' }, { type: 'STATUS_PENYEDIAAN_SEMAK' }, { type: 'STATUS_PENYEDIAAN_PERAKU' }, { type: 'STATUS_PENYEDIAAN_PEMBETULAN' }] };
const req = T.requiredActions(block);
check('F05 MCL config needs CREATE, SEMAK, PERAKU', req.sort().join(',') === 'CREATE,PERAKU,SEMAK', req.join(','));
check('F06 CREATE-only chain = 1/3, blocked', !T.chainCoverage(req, ['1:CREATE']).ok && T.chainCoverage(req, ['1:CREATE']).have === 1);
check('F07 full chain = 3/3', T.chainCoverage(req, ['1:CREATE', '2:SEMAK', '3:PERAKU']).ok);

// ---- touched tags + CC gaps
const oldP = [{ text: 'Premium : x', tags: ['premium'] }, { text: 'Utara : lot', tags: ['lotUtara'] }];
const newP = [{ text: 'Premium : x (Nominal)', tags: ['premium'] }, { text: 'Utara : lot', tags: ['lotUtara'] }, { text: 'Tarikh:', tags: ['tarikhSignPTNH'] }];
const touched = T.touchedTags(oldP, newP);
check('F08 touched = changed paragraphs only (premium, tarikhSignPTNH)', touched.sort().join(',') === 'premium,tarikhSignPTNH', touched.join(','));
check('F09 288095 replay: <Permohonan Dahulu> placeholder is a gap', T.ccGaps(['permohonanDahulu'], [{ tag: 'permohonanDahulu', text: '<Permohonan Dahulu>', images: [] }], {}).length === 1);
check('F10 448-byte signature is a gap', /blank image 448/.test(T.ccGaps(['signPPD'], [{ tag: 'signPPD', text: '', images: [448] }], {})[0] || ''));
check('F11 dash value is a gap', T.ccGaps(['premium'], [{ tag: 'premium', text: '-', images: [] }], {}).length === 1);
check('F12 real value is no gap', T.ccGaps(['premium'], [{ tag: 'premium', text: 'RM1000.00', images: [] }], {}).length === 0);
check('F13 FIXED-DATA acceptance clears the gap', T.ccGaps(['signPPD'], [{ tag: 'signPPD', text: '', images: [448] }], { signPPD: 'na: staging signature blank' }).length === 0);
check('F14 tag missing from the paper is a gap', /not in paper/.test(T.ccGaps(['namaPPD'], [], {})[0] || ''));

// ---- word diff (287346 replays)
const tok = (s, o) => s.split(' ').map(w => [w, o]);
const d1 = T.wordDiff('Premium : RM 100 (Nominal) Cukai'.split(' '), [...tok('Premium :', 'static'), ...tok('RM1000.00', 'cc'), ...tok('Cukai', 'static')], []);
check('F15 287346 replay: missing (Nominal) is a DEFECT', d1.some(d => d.cls === 'DEFECT' && /Nominal/.test(d.req)), JSON.stringify(d1));
const d2 = T.wordDiff('Lot 0061364 Mukim Machap seluas 465'.split(' '), [...tok('Lot', 'static'), ...tok('14701', 'cc'), ...tok('seluas', 'static'), ...tok('164', 'cc'), ...tok('Mukim', 'static'), ...tok('Umbai', 'cc')], []);
check('F16 287346 replay: Lot seluas Mukim order is a DEFECT', d2.some(d => d.cls === 'DEFECT'), JSON.stringify(d2));
const d3 = T.wordDiff('Nama Norazmar bin Jais'.split(' '), [...tok('Nama', 'static'), ...tok('Roslan Bin Mis', 'cc')], []);
check('F17 sample name vs real name is DATA', d3.length && d3.every(d => d.cls === 'DATA'), JSON.stringify(d3));
const d4 = T.wordDiff('Penjenisa : Bangunan'.split(' '), [...tok('Penjenisan', 'static'), ...tok(':', 'static'), ...tok('Bangunan', 'cc')], ['Penjenisa']);
check('F18 accepted requirement typo is ACCEPTED, not DEFECT', d4.every(d => d.cls !== 'DEFECT'), JSON.stringify(d4));

// ---- gate
const J = (o) => JSON.stringify(o);
const asst = (text, tools) => J({ type: 'assistant', message: { content: [...(tools || []).map(i => ({ type: 'tool_use', input: i })), { type: 'text', text }] } });
const result = (text) => J({ type: 'user', message: { content: [{ type: 'tool_result', content: text }] } });
const long = (s) => s + ' ' + 'x'.repeat(220);
const work = { command: 'node domain/doc-sim/doc-sim.js chain --template TemplateKertasPertimbanganPentadbirTanah_MCL.docx' };
check('F19 template hand-back with no run = BLOCK', decide([asst('run', [work]), asst(long('Salam Anis ... Redmine handover staged'))].join('\n')).blocked === true);
check('F20 PASS line in a tool result = silent', !decide([asst('run', [work]), result('TEMPLATE-SCENARIO: PASS QA-287346 ...'), asst(long('Redmine handover staged'))].join('\n')).fired);
check('F21 PASS typed only in my reply = still BLOCK (no self-disarm)', decide([asst('run', [work]), asst(long('TEMPLATE-SCENARIO: PASS QA-287346 · Redmine'))].join('\n')).blocked === true);
check('F22 FAIL line does not satisfy', decide([asst('run', [work]), result('TEMPLATE-SCENARIO: FAIL QA-287346'), asst(long('Redmine handover'))].join('\n')).blocked === true);
check('F23 non-template session hand-back = silent', !decide(asst(long('Redmine handover for a data patch'))).fired);
check('F24 real bypass reason = bypassed', decide([asst('run', [work]), asst(long('[skip-template-scenario: PROD document patch, no template change] Redmine'))].join('\n')).bypassed === true);
check('F25 placeholder bypass is refused', decide([asst('run', [work]), asst(long('[skip-template-scenario: <reason>] Redmine'))].join('\n')).blocked === true);
check('F26 short reply = silent', !decide([asst('run', [work]), asst('Redmine?')].join('\n')).fired);
check('F27 template work but no hand-back words = silent', !decide([asst('run', [work]), asst(long('Checked the sempadan rows.'))].join('\n')).fired);
check('F28 bad JSON lines are skipped', decide(['{oops', asst('run', [work]), asst(long('Test Scenario'))].join('\n')).blocked === true);
check('F29 block reason names the command and the bypass', /template-scenario\.js/.test(decide([asst('run', [work]), asst(long('Test Scenario'))].join('\n')).blockReason || '') && /skip-template-scenario/.test(decide([asst('run', [work]), asst(long('Test Scenario'))].join('\n')).blockReason || ''));

// ---- fix-photo box rule (mark.py)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-eval-'));
const fixDir = path.join(tmp, '2. Fix'); fs.mkdirSync(fixDir);
const src = path.join(tmp, 'src.png');
spawnSync('python', ['-I', '-c', 'from PIL import Image; Image.new("RGB",(400,300),"white").save(r"' + src + '")']);
const mark = path.join(__dirname, '..', 'fix-photo', 'mark.py');
const run = (boxes, extra) => spawnSync('python', ['-I', mark, '--src', src, '--dst', path.join(fixDir, '1. PKPPT - test.png'), ...boxes.flatMap(b => ['--box', b]), ...(extra || [])], { encoding: 'utf8', env: { ...process.env, FIX_PHOTO_LOG: path.join(tmp, 'log.jsonl') } });
const nested = run(['10,10,200,200', '50,50,100,100']);
check('F30 nested boxes refused (exit 2)', nested.status === 2 && /overlap or one sits inside/.test(nested.stdout), nested.stdout);
const over = run(['10,10,150,150', '100,100,250,250']);
check('F31 overlapping boxes refused (exit 2)', over.status === 2, over.stdout);
const merged = run(['10,10,150,150', '100,100,250,250'], ['--merge']);
check('F32 --merge draws one union box (exit 0)', merged.status === 0 && /FIX-PHOTO:/.test(merged.stdout), merged.stdout);
const apart = run(['10,10,100,100', '200,200,300,280']);
check('F33 separate boxes saved', apart.status === 0, apart.stdout);

console.log('\ntemplate-scenario.eval: ' + pass + '/' + (pass + fail) + (fail ? ' FAIL' : ' green'));
process.exit(fail ? 1 : 0);
