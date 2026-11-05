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

// ---- tag source check (2026-11-06, QA-287346 rework 1)
const S = require('./tag-sources.js');
check('F34 urusan from permohonan id', S.urusanOf('PTMLK/03/L/MCL/2026/9') === 'MCL');
check('F35 bad id gives no urusan', S.urusanOf('MCL-9') === null && S.urusanOf('') === null);
const pt = S.printedTags([{ tag: 'luasDipohon', text: '164', images: [] }, { tag: 'luasDipohon', text: '164', images: [] }, { tag: 'signPPD', text: '', images: [3000] }]);
check('F36 printed tags: images out, duplicates once', pt.join(',') === 'luasDipohon', pt.join(','));
const map = { luasDipohon: { table: 'umm_a_permohonan_tnh', column: 'luas_dipohon' }, namaPPD: { none: 'chain' }, evil: { table: 'x; drop table y', column: 'z' } };
const srcRows = T.parseChecklist('## Template checklist\n| R | Source | Text | Status | Find |\n|---|---|---|---|---|\n| S1 | SOURCE noKP | umm_p_pemohon.no_pengenalan | done | |\n| S2 | SOURCE premium | - | na: computed from two columns | |\n| S3 | SOURCE cukai | the cukai column | done | |\n| S4 | SOURCE luasDipohon | umm_a_hakmilik.luas | done | |\n');
const rs = S.resolveSources(['luasDipohon', 'namaPPD', 'noKP', 'premium', 'cukai', 'lotUtara', 'evil'], map, srcRows);
check('F37 SOURCE row beats the map (luasDipohon -> umm_a_hakmilik.luas)', rs.mapped.some(m => m.tag === 'luasDipohon' && m.table === 'umm_a_hakmilik'), JSON.stringify(rs));
check('F38 SOURCE done row maps noKP', rs.mapped.some(m => m.tag === 'noKP' && m.column === 'no_pengenalan'));
check('F39 na row and map none -> none', rs.none.map(n => n.tag).sort().join(',') === 'namaPPD,premium', JSON.stringify(rs.none));
check('F40 SOURCE text not table.column -> bad', rs.bad.some(b => b.startsWith('cukai')));
check('F41 unmapped tag -> unknown', rs.unknown.join(',') === 'lotUtara', rs.unknown.join(','));
check('F42 SQL-looking map entry refused (injection)', rs.bad.some(b => b.startsWith('evil')));
const cs = S.countSql('et_main', 'umm_a_permohonan_tnh', 'luas_dipohon', 'MCL');
check('F43 count SQL: schema-qualified, kod subquery, no JOIN, empty = null/blank/dash', /et_main\.umm_a_permohonan_tnh/.test(cs) && /kod = 'MCL'/.test(cs) && !/\bjoin\b/i.test(cs) && /IN \('', '-'\)/.test(cs), cs);
check('F44 case SQL escapes a quote in the permohonan id', /'PT''X'/.test(S.caseSql('s', 't', 'c', "PT'X")));
const src1 = { mapped: [{ tag: 'luasDipohon', table: 't', column: 'c' }], none: [], unknown: [], bad: [] };
const prodEmpty = { luasDipohon: { total: 3551, empty: 1718 } };
const j1 = S.judge({ src: src1, counts: prodEmpty, cases: [], emptyOk: {}, noBa: false });
check('F45 287346 replay: PROD empty 1718/3551 and no empty case = FAIL naming luasDipohon', !j1.ok && j1.fails.some(f => /empty case never ran for luasDipohon \(PROD empty 1718\/3551\)/.test(f)), JSON.stringify(j1.fails));
check('F46 no BA case and no reason = FAIL', j1.fails.some(f => /BA test ID never ran/.test(f)));
const goodEmpty = { kind: 'empty', permohonan: 'P/25', gaps: [], emptyCols: new Set(['luasDipohon']) };
check('F47 empty case prints a value + reasoned no-BA = PASS', S.judge({ src: src1, counts: prodEmpty, cases: [goodEmpty], emptyOk: {}, noBa: true }).ok);
const dashEmpty = { kind: 'empty', permohonan: 'P/25', gaps: ['luasDipohon=dash'], emptyCols: new Set(['luasDipohon']) };
check('F48 empty case prints "-" = FAIL (the BA symptom)', S.judge({ src: src1, counts: prodEmpty, cases: [dashEmpty], emptyOk: {}, noBa: true }).fails.some(f => /prints luasDipohon=dash/.test(f)));
const filledCase = { kind: 'empty', permohonan: 'P/1', gaps: [], emptyCols: new Set() };
check('F49 "empty" case whose column is filled does not count', !S.judge({ src: src1, counts: prodEmpty, cases: [filledCase], emptyOk: {}, noBa: true }).ok);
check('F50 EMPTY-OK row accepts a blank by design', S.judge({ src: src1, counts: prodEmpty, cases: [], emptyOk: { luasDipohon: 'na: blank is the requirement' }, noBa: true }).ok);
check('F51 PROD count error = FAIL, never a silent pass', !S.judge({ src: src1, counts: { luasDipohon: { error: 'gateway down' } }, cases: [], emptyOk: {}, noBa: true }).ok);
check('F52 column never empty on PROD = no empty case needed', S.judge({ src: src1, counts: { luasDipohon: { total: 10, empty: 0 } }, cases: [], emptyOk: {}, noBa: true }).ok);
check('F53 BA paper with a gap = FAIL', !S.judge({ src: src1, counts: { luasDipohon: { total: 10, empty: 0 } }, cases: [{ kind: 'ba', permohonan: 'B/9', gaps: ['luasDipohon=dash'], emptyCols: new Set() }], emptyOk: {}, noBa: false }).ok);
check('F54 unknown source = FAIL', !S.judge({ src: { ...src1, unknown: ['lotUtara'] }, counts: {}, cases: [], emptyOk: {}, noBa: true }).ok);
const pc = S.parseCases(['node', 'x', '--case', 'empty|P/25|a.docx', '--case', 'BA|B/9|b.docx', '--case']);
check('F55 --case repeatable, kind lower-cased, dangling flag ignored', pc.length === 2 && pc[1].kind === 'ba' && pc[0].docx === 'a.docx', JSON.stringify(pc));
check('F56 --no-ba-id refuses <reason>, one word, empty', !S.noBaOk('<reason>') && !S.noBaOk('none') && !S.noBaOk('') && S.noBaOk('BA gave no ID on the ticket'));
const tsMap = JSON.parse(fs.readFileSync(S.MAP, 'utf8'));
const bad = Object.entries(tsMap).filter(([k]) => k !== '_about').flatMap(([st, m]) => Object.entries(m).filter(([, v]) => !(v.none || (/^[a-z_][a-z0-9_]*$/.test(v.table || '') && /^[a-z_][a-z0-9_]*$/.test(v.column || ''))) || !v.seen).map(([t]) => st + '.' + t));
check('F57 tag-sources.json: every entry has table.column or none, and a seen line', bad.length === 0, bad.join(','));
check('F58 tag-sources.json is keyed by a registered state', Object.keys(tsMap).filter(k => k !== '_about').every(k => require('../../lib/states.js').get(k)));

console.log('\ntemplate-scenario.eval: ' + pass + '/' + (pass + fail) + (fail ? ' FAIL' : ' green'));
process.exit(fail ? 1 : 0);
