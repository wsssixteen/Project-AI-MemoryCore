#!/usr/bin/env node
/**
 * eval.js — behavioural evals for bpmn-check.js (run: node domain/bpmn-check/eval.js)
 *
 * E1 pre-fix PPTPB  → MUST surface C7 (the QA-274914 out-map bug) + C6 (kelulusan §10.1) · exit 0 (WARNs only)
 * E2 senior fix + baseline → MUST be VERDICT ✅ AND diff must show the out-map + dedicated task
 * E3 synthetic broken → MUST exit 1 with C2 + C4-no-default-NEW + C5-bare-el-unknown-var
 *
 * Fixtures: E1/E2 use the real corpus files (paths below); E3 is built on the fly.
 */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHECK = path.join(__dirname, 'bpmn-check.js');
const KNOW = 'C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/projects/coding-projects/active/etanah-knowledge/melaka/flowables-bpmn';
const OLD = path.join(KNOW, 'MLK_PLP_PPTPB.bpmn20 - old.xml');
const FIXED = path.join(KNOW, 'MLK_PLP_PPTPB.bpmn20.xml'); // corpus copy of the senior fix
const MLPS = path.join(KNOW, 'MLK_PLP_MLPS.bpmn20.xml');

function run(args) {
  try { return { out: execFileSync('node', [CHECK, ...args], { encoding: 'utf8' }), code: 0 }; }
  catch (e) { return { out: (e.stdout || '') + (e.stderr || ''), code: e.status }; }
}
let pass = 0, fail = 0;
function expect(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }

console.log('E1 pre-fix PPTPB (original-bug detection)');
const e1 = run([OLD]);
expect('C7 catches the out-map bug (Pembetulan gw / pembetulanPP)', /C7-stale-read-after-child.*Pembetulan.*pembetulanPP/s.test(e1.out));
expect('C6 catches the kelulusan §10.1 bug', /C6-mixed-value-space.*kelulusan/.test(e1.out));
expect('exit 0 (WARNs, not blockers)', e1.code === 0);

console.log('E2 senior fix vs baseline');
const e2 = run([FIXED, '--baseline', OLD]);
expect('verdict clean', /VERDICT: ✅/.test(e2.out));
expect('diff shows out-map add', /\+ out-map pembetulanPP/.test(e2.out));
expect('diff shows dedicated task', /\+ node userTask "3\.0 Semakan Kemasukan Maklumat \(Pembetulan\)"/.test(e2.out));
expect('C7 out-map warn GONE for Pembetulan gw', !/C7-stale-read-after-child.*"Pembetulan"/.test(e2.out));

console.log('E3 synthetic broken');
const tmp = path.join(os.tmpdir(), 'bpmn-check-eval-synthetic.xml');
let xml = fs.readFileSync(MLPS, 'utf8');
xml = xml.replace(/<\/process>/, `<exclusiveGateway id="sid-EVILGW-001" name="Broken Gw"></exclusiveGateway>
    <sequenceFlow id="sid-EVIL-F1" sourceRef="sid-EVILGW-001" targetRef="sid-DOES-NOT-EXIST"><conditionExpression xsi:type="tFormalExpression"><![CDATA[\${ghostVar == "X"}]]></conditionExpression></sequenceFlow>
    <sequenceFlow id="sid-EVIL-F2" sourceRef="sid-EVILGW-001" targetRef="sid-EVILGW-001"><conditionExpression xsi:type="tFormalExpression"><![CDATA[\${ghostVar == "Y"}]]></conditionExpression></sequenceFlow>
    </process>`);
fs.writeFileSync(tmp, xml);
const e3 = run([tmp, '--baseline', MLPS]);
expect('exit 1 (blocked)', e3.code === 1);
expect('C2 dangling ref', /C2-dangling-ref/.test(e3.out));
expect('C4 NEW no-default gateway', /C4-no-default-NEW/.test(e3.out));
expect('C5 unknown ghost var = ERROR', /C5-bare-el-unknown-var.*ghostVar/.test(e3.out));
try { fs.unlinkSync(tmp); } catch (_) {}

console.log(`\n${pass} pass · ${fail} fail`);
process.exit(fail ? 1 : 0);
