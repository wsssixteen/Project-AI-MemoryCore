#!/usr/bin/env node
// subflow-trace.js — the A3b VARIABLE TRACE for alter targets (born 2026-09-04, #275847, after the twice-wrong verdict).
// A callActivity's NAME is a label. What the child does is decided by the variables mapped INTO it and the nodes
// inside the child (and its children) that CONSUME them. This prints that chain so the verdict is read, not guessed.
//
// Usage: node subflow-trace.js <bpmn-root-dir> <parent.bpmn20.xml> <callActivityId>
//   bpmn-root-dir: the state's flowables-bpmn folder (searched recursively for <calledElement>.bpmn20.xml)
// Output: one row per in-parameter → every consumer (scriptTask / conditionExpression / serviceTask expression /
//         nested callActivity in-mapping) in the called model, descending through nested callActivities.
'use strict';
const fs = require('fs');
const path = require('path');

const [rootDir, parentFile, callId] = process.argv.slice(2);
if (!rootDir || !parentFile || !callId) { console.error('usage: subflow-trace.js <bpmn-root-dir> <parent.bpmn20.xml> <callActivityId>'); process.exit(2); }

function findModel(key) {
  const stack = [rootDir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.name === key + '.bpmn20.xml') return p;
    }
  }
  return null;
}
function lines(file) { return fs.readFileSync(file, 'utf8').split(/\r?\n/); }
function callActivityBlock(ls, id) {
  const start = ls.findIndex(l => new RegExp('<callActivity id="' + id + '"').test(l));
  if (start < 0) return null;
  let end = start; while (end < ls.length && !/<\/callActivity>/.test(ls[end])) end++;
  return { start, end, text: ls.slice(start, end + 1) };
}
function consumersOf(varName, file, depth, seen) {
  const ls = lines(file); const out = [];
  const re = new RegExp('\\b' + varName + '\\b');
  ls.forEach((l, i) => {
    const n = i + 1;
    if (/conditionExpression/.test(l) && re.test(l)) out.push({ file, line: n, kind: 'gateway-condition', text: l.trim() });
    else if (/<scriptTask|<script>|<!\[CDATA\[|execution\.(get|set)Variable/.test(l) && re.test(l)) out.push({ file, line: n, kind: 'script', text: l.trim() });
    else if (/<serviceTask/.test(l) && re.test(l)) out.push({ file, line: n, kind: 'serviceTask', text: l.trim() });
    else if (/flowable:in /.test(l) && new RegExp('source="' + varName + '"').test(l)) out.push({ file, line: n, kind: 'in-mapping to nested child', text: l.trim() });
  });
  // a script that WRITES another variable from this one (e.g. urusan = nextUrusan) is the load-bearing consumer;
  // follow the written variable one hop so "urusan" consumers show up too.
  const derived = [];
  ls.forEach((l, i) => { const m = l.match(/setVariable\("([A-Za-z0-9_]+)",\s*([A-Za-z0-9_]+)\)/); if (m) { const src = ls.slice(Math.max(0, i - 3), i + 1).join(' '); if (re.test(src)) derived.push(m[1]); } });
  return { out, derived };
}
function trace(parent, id, depth, seen) {
  const ls = lines(parent); const blk = callActivityBlock(ls, id);
  if (!blk) { console.error('callActivity ' + id + ' not found in ' + parent); process.exit(1); }
  const head = blk.text[0];
  const name = (head.match(/name="([^"]*)"/) || [])[1] || '?';
  const called = (head.match(/calledElement="([^"]*)"/) || [])[1];
  const childFile = called ? findModel(called) : null;
  console.log(`${'  '.repeat(depth)}callActivity ${id}  name="${name}"  calledElement=${called}  → ${childFile ? path.relative(rootDir, childFile) : '⚠️ MODEL NOT ON DISK (dump it first)'}`);
  const ins = blk.text.map(l => l.match(/flowable:in source="([^"]+)" target="([^"]+)"/)).filter(Boolean).map(m => ({ src: m[1], tgt: m[2] }));
  const outs = blk.text.map(l => l.match(/flowable:out source="([^"]+)" target="([^"]+)"/)).filter(Boolean).map(m => m[1] + '→' + m[2]);
  console.log(`${'  '.repeat(depth)}  in : ${ins.map(x => x.src === x.tgt ? x.src : x.src + '→' + x.tgt).join(' · ') || '(none)'}`);
  console.log(`${'  '.repeat(depth)}  out: ${outs.join(' · ') || '(none)'}`);
  if (!childFile) return;
  for (const v of ins) {
    const { out, derived } = consumersOf(v.tgt, childFile, depth, seen);
    const rows = out.slice();
    for (const dv of derived) rows.push(...consumersOf(dv, childFile).out.map(r => ({ ...r, kind: r.kind + ` (via ${v.tgt}→${dv})` })));
    if (!rows.length) { console.log(`${'  '.repeat(depth)}  ${v.tgt}: no consumer in ${path.basename(childFile)}`); continue; }
    for (const r of rows) console.log(`${'  '.repeat(depth)}  ${v.tgt} → ${path.relative(rootDir, r.file)}:${r.line} [${r.kind}] ${r.text.slice(0, 230)}`);
  }
  // descend into nested callActivities that receive any of these variables
  const childLs = lines(childFile);
  childLs.forEach((l, i) => {
    const m = l.match(/<callActivity id="([^"]+)"/);
    if (m && !seen.has(m[1])) { seen.add(m[1]); trace(childFile, m[1], depth + 1, seen); }
  });
}
trace(path.resolve(parentFile), callId, 0, new Set([callId]));
