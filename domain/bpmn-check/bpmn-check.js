#!/usr/bin/env node
/**
 * bpmn-check.js — deterministic BPMN validator for eTanah Flowable models (v1.0)
 *
 * BORN 2026-08-19 from the QA-274914 PPTPB Pembetulan quest, where FOUR separate
 * BPMN mistakes shipped or nearly shipped:
 *   B1 missing <flowable:out> on a callActivity → parent gateway read a stale var
 *      (the ticket's original bug — child set pembetulanPP, parent never saw it)
 *   B2 bare-identifier EL condition `${var == "X"}` on a process without the var
 *      → PropertyNotFoundException "Cannot resolve identifier" on Hantar (mlit 19/08)
 *   B3 no-default all-conditional exclusive gateway + unset var
 *      → "No outgoing sequence flow could be selected" (skipPengagihan?/skipPTB;
 *        FLOWABLE-KNOWLEDGE.md §10.1 class)
 *   B4 wrong routing variable chosen because two look-alike vars exist
 *      (pembetulanUnit = Charting-Mohon correction ≠ pembetulanPP=KM = PLT Unit
 *       correction) — deterministically we can only SURFACE the value-space, the
 *       judgment lives in the bpmn-check skill checklist.
 *
 * USAGE:
 *   node domain/bpmn-check/bpmn-check.js <file.bpmn20.xml> [--baseline <old.xml>] [--json]
 *
 * Exit code: 0 = no ERROR-level findings · 1 = ≥1 ERROR · 2 = cannot read/parse.
 * ERROR  = would break the engine or the change (blockers).
 * WARN   = risky pattern, needs a human eye (pre-existing debt is WARN, not ERROR).
 * INFO   = census facts a reviewer should see.
 *
 * Deterministic scope (CAN): structure, references, DI, gateway defaults, EL idiom,
 *   value-space consistency, var read/write mapping, baseline diff.
 * NOT in scope (judgment — see .claude/skills/bpmn-check/SKILL.md): whether the
 *   routing matches the BA's expected flow, which variable is the RIGHT
 *   discriminator, loop termination semantics, per-env deployed-version drift.
 */
'use strict';
const fs = require('fs');
const path = require('path');

function parseModel(xmlPath) {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const model = { xml, nodes: {}, flows: [], callActivities: [], gateways: [], conditions: [], diIds: new Set() };
  // flow nodes (process side)
  const nodeRe = /<(userTask|callActivity|exclusiveGateway|parallelGateway|inclusiveGateway|serviceTask|startEvent|endEvent|intermediateCatchEvent|boundaryEvent)\b([^>]*)\bid="([^"]+)"([^>]*)>/g;
  let m;
  while ((m = nodeRe.exec(xml))) {
    const attrs = m[2] + m[4];
    const name = (attrs.match(/\bname="([^"]*)"/) || [])[1] || '';
    const def = (attrs.match(/\bdefault="([^"]+)"/) || [])[1] || null;
    model.nodes[m[3]] = { type: m[1], id: m[3], name, default: def };
    if (m[1] === 'exclusiveGateway') model.gateways.push(model.nodes[m[3]]);
    if (m[1] === 'callActivity') {
      const called = (attrs.match(/\bcalledElement="([^"]+)"/) || [])[1] || '';
      // capture the callActivity BLOCK to read in/out maps
      const blockRe = new RegExp('<callActivity[^>]*id="' + m[3] + '"[\\s\\S]*?</callActivity>');
      const block = (xml.match(blockRe) || [''])[0];
      const ins = [...block.matchAll(/<flowable:in\s+source="([^"]+)"/g)].map(x => x[1]);
      const outs = [...block.matchAll(/<flowable:out\s+source="([^"]+)"/g)].map(x => x[1]);
      model.callActivities.push({ id: m[3], name, called, ins, outs });
    }
  }
  // sequence flows + conditions
  const flowRe = /<sequenceFlow\b[^>]*\bid="([^"]+)"[^>]*\bsourceRef="([^"]+)"[^>]*\btargetRef="([^"]+)"[^>]*(?:\/>|>([\s\S]*?)<\/sequenceFlow>)/g;
  while ((m = flowRe.exec(xml))) {
    const head = xml.substr(m.index, 300);
    const name = (head.match(/\bname="([^"]*)"/) || [])[1] || '';
    const cond = ((m[4] || '').match(/CDATA\[([\s\S]*?)\]\]/) || [])[1] || '';
    model.flows.push({ id: m[1], src: m[2], tgt: m[3], name, cond: cond.trim() });
    if (cond.trim()) model.conditions.push({ flowId: m[1], src: m[2], cond: cond.trim() });
  }
  // DI ids
  for (const d of xml.matchAll(/bpmnElement="([^"]+)"/g)) model.diIds.add(d[1]);
  return model;
}

// variables read in a condition: both bare `${var ==` and execution.getVariable("var")
function varsInCondition(cond) {
  const out = new Set();
  for (const g of cond.matchAll(/execution\.getVariable\(\s*["']([^"']+)["']\s*\)/g)) out.add(g[1]);
  const stripped = cond.replace(/execution\.getVariable\(\s*["'][^"']+["']\s*\)/g, ' ');
  for (const b of stripped.matchAll(/\$\{?\s*!?\s*([A-Za-z_][A-Za-z0-9_]*)\s*[=!<>]/g)) out.add(b[1]);
  for (const b of stripped.matchAll(/(?:&&|\|\|)\s*!?\s*([A-Za-z_][A-Za-z0-9_]*)\s*[=!<>]/g)) out.add(b[1]);
  return [...out].filter(v => !['execution', 'true', 'false', 'null', 'task', 'empty'].includes(v));
}
function literalsFor(cond, v) {
  const lits = [];
  const re = new RegExp('(?:' + v + '|execution\\.getVariable\\(\\s*["\']' + v + '["\']\\s*\\))\\s*[=!]=\\s*"([^"]*)"', 'g');
  for (const m of cond.matchAll(re)) lits.push(m[1]);
  return lits;
}

function check(model, baseline) {
  const F = []; // findings {level, code, msg}
  const add = (level, code, msg) => F.push({ level, code, msg });
  const ids = new Set(Object.keys(model.nodes));
  const baseGwIds = baseline ? new Set(baseline.gateways.map(g => g.id)) : null;
  const baseFlowIds = baseline ? new Set(baseline.flows.map(f => f.id)) : null;

  // C1 tag balance (cheap well-formedness signal; full parse belongs to the modeler)
  const opens = (model.xml.match(/<definitions\b/g) || []).length;
  const closes = (model.xml.match(/<\/definitions>/g) || []).length;
  if (opens !== 1 || closes !== 1) add('ERROR', 'C1-structure', `definitions open/close = ${opens}/${closes} (expected 1/1)`);

  // C2 dangling references
  for (const f of model.flows) {
    if (!ids.has(f.src)) add('ERROR', 'C2-dangling-ref', `flow ${f.id} sourceRef ${f.src} does not exist`);
    if (!ids.has(f.tgt)) add('ERROR', 'C2-dangling-ref', `flow ${f.id} targetRef ${f.tgt} does not exist`);
  }
  for (const g of model.gateways) if (g.default && !model.flows.some(f => f.id === g.default))
    add('ERROR', 'C2-dangling-ref', `gateway ${g.name || g.id} default="${g.default}" is not an existing flow`);

  // C3 connectivity: every non-start node has ≥1 in, every non-end has ≥1 out
  for (const id of ids) {
    const n = model.nodes[id];
    const hasIn = model.flows.some(f => f.tgt === id);
    const hasOut = model.flows.some(f => f.src === id);
    if (!hasIn && !/startEvent/.test(n.type)) add('ERROR', 'C3-orphan-node', `${n.type} "${n.name || id}" has NO incoming flow`);
    if (!hasOut && !/endEvent|boundaryEvent/.test(n.type)) add('ERROR', 'C3-dead-end', `${n.type} "${n.name || id}" has NO outgoing flow`);
  }

  // C4 exclusive-gateway default safety (§10.1). NEW gateways (not in baseline) = ERROR; pre-existing = WARN census.
  let preExisting = 0;
  for (const g of model.gateways) {
    const out = model.flows.filter(f => f.src === g.id);
    if (!out.length) continue;
    const hasDefaultAttr = !!g.default;
    const hasUncondFlow = out.some(f => !f.cond);
    if (!hasDefaultAttr && !hasUncondFlow && out.every(f => f.cond)) {
      const isNew = baseGwIds ? !baseGwIds.has(g.id) : false;
      if (isNew) add('ERROR', 'C4-no-default-NEW', `NEW gateway "${g.name || g.id}" has ${out.length} all-conditional arms and NO default → will throw "No outgoing sequence flow" when none match (§10.1)`);
      else preExisting++;
    }
    // unconditioned NON-default extra flow alongside conditional ones = ambiguous first-wins
    if (out.length > 1 && out.some(f => !f.cond && f.id !== g.default) && out.some(f => f.cond))
      add('WARN', 'C4-uncond-arm', `gateway "${g.name || g.id}" mixes an unconditioned non-default arm with conditional arms — first-true-in-XML-order decides; make it the default= instead`);
  }
  if (preExisting) add('WARN', 'C4-no-default-census', `${preExisting} PRE-EXISTING no-default all-conditional gateway(s) (endemic debt — do not fix in a ticket unless on the changed path; list with --json)`);

  // Build var read/write tables
  const written = new Set();
  for (const ca of model.callActivities) for (const v of ca.outs) written.add(v);
  const readVars = new Map(); // var -> [{flowId, cond, src}]
  for (const c of model.conditions) for (const v of varsInCondition(c.cond)) {
    if (!readVars.has(v)) readVars.set(v, []);
    readVars.get(v).push(c);
  }

  // C5 EL null-safety. Corpus calibration (2026-08-19 census): bare `${var==` is the NORM
  // (2028 uses vs 2 getVariable across 25 files) — so bare alone is NOT an error.
  // Severity ladder:
  //   ERROR  = NEW/CHANGED flow reads a bare var that has NO writer mapped in this file
  //            (can genuinely be absent → PropertyNotFoundException, the mlit 19/08 crash)
  //   WARN   = NEW/CHANGED flow bare var WITH a writer — confirm every inbound path runs the writer
  //   (pre-existing bare vars: silent — corpus norm)
  const writtenEarly = new Set();
  for (const ca of model.callActivities) for (const v of ca.outs) writtenEarly.add(v);
  for (const c of model.conditions) {
    const bare = varsInCondition(c.cond).filter(v => !c.cond.includes(`getVariable("${v}"`) && !c.cond.includes(`getVariable('${v}'`));
    if (!bare.length) continue;
    const isNewFlow = baseFlowIds ? !baseFlowIds.has(c.flowId) : false;
    const changed = baseline ? (() => { const bf = baseline.flows.find(f => f.id === c.flowId); return bf && bf.cond !== c.cond; })() : false;
    if (!(isNewFlow || changed)) continue;
    // "established" var = referenced by OTHER conditions in this file (someone
    // writes it — often a userTask BpmNameValue outcome, invisible to BPMN;
    // e.g. keputusan). A var seen ONLY on this new flow and in no map = ERROR.
    for (const v of bare) {
      // "elsewhere" must mean PRE-EXISTING usage — a ghost var spread across
      // several NEW arms is still a ghost (the synthetic eval-3 edge).
      const elsewhere = model.conditions.some(o => o.flowId !== c.flowId
        && (baseFlowIds ? baseFlowIds.has(o.flowId) : true)
        && varsInCondition(o.cond).includes(v));
      if (!writtenEarly.has(v) && !elsewhere)
        add('ERROR', 'C5-bare-el-unknown-var', `NEW/CHANGED flow ${c.flowId.slice(0, 18)} reads bare var "${v}" that appears NOWHERE else in this file (no map, no other condition) — typo or never-set var → PropertyNotFoundException "Cannot resolve identifier" (mlit 19/08 class). Use \${execution.getVariable("${v}")} or fix the name.`);
      else
        add('WARN', 'C5-bare-el-new', `NEW/CHANGED flow ${c.flowId.slice(0, 18)} uses bare var "${v}" (corpus norm, null-UNSAFE) — confirm EVERY inbound path (incl. MIGRATED old processes: migration moves the definition pointer only, never backfills vars — CommonBPMServiceClient.java:448-533) has this var set; else use \${execution.getVariable("${v}")}.`);
    }
  }

  // C6 value-space consistency per variable
  for (const [v, reads] of readVars) {
    const lits = new Set();
    for (const c of reads) for (const l of literalsFor(c.cond, v)) lits.add(l);
    if (lits.size > 1) {
      // Corpus idiom: "false" is the legit NONE-sentinel among code values
      // (pembetulanPP ∈ {false, KM, PLPP}) — do NOT flag that.
      // The real §10.1 kelulusan bug shape: "true" compared alongside CODE literals
      // (a boolean-minded arm on a code-valued variable).
      const hasTrue = lits.has('true');
      const hasCode = [...lits].some(l => l !== 'true' && l !== 'false');
      if (hasTrue && hasCode)
        add('WARN', 'C6-mixed-value-space', `variable "${v}" compared against "true" AND code literals {${[...lits].join(', ')}} — a boolean-minded arm on a code-valued variable can never match (the §10.1 kelulusan case)`);
    }
  }

  // C7 stale-read-after-child: THE QA-274914 original bug class, made precise.
  // A gateway reads var v AND is fed DIRECTLY by a callActivity that does NOT
  // <flowable:out> v → the officer's just-completed child step CANNOT have
  // refreshed the value the gateway routes on. (Vars written by plain userTask
  // submits travel as BpmNameValue outcome vars — invisible in BPMN, hence this
  // check is scoped to callActivity predecessors only, per 2026-08-19 Java sweep:
  // CommonBPMServiceClient.java:569 BpmNameValue path.)
  const caById = new Map(model.callActivities.map(c => [c.id, c]));
  const c7Seen = new Set();
  for (const c of model.conditions) {
    const gwId = c.src;
    const preds = model.flows.filter(f => f.tgt === gwId).map(f => f.src);
    const caPreds = preds.filter(p => caById.has(p));
    if (!caPreds.length || caPreds.length !== preds.length) continue; // only when ALL inbound are callActivities
    for (const v of varsInCondition(c.cond)) {
      const missing = caPreds.filter(p => !caById.get(p).outs.includes(v));
      const key = gwId + '|' + v;
      if (missing.length === caPreds.length && !c7Seen.has(key)) {
        c7Seen.add(key);
        add('WARN', 'C7-stale-read-after-child', `gateway "${(model.nodes[gwId] || {}).name || gwId.slice(0, 12)}" routes on "${v}" straight after callActivity [${missing.map(p => caById.get(p).name || p.slice(0, 10)).join(', ')}] which does NOT out-map it — the child step cannot refresh this value (QA-274914 out-map bug: add <flowable:out source="${v}" target="${v}"> if the child sets it)`);
      }
    }
  }

  // C8 DI completeness
  for (const id of ids) if (!model.diIds.has(id)) add('ERROR', 'C8-missing-di', `${model.nodes[id].type} "${model.nodes[id].name || id}" has NO BPMNShape (invisible in modeler)`);
  for (const f of model.flows) if (!model.diIds.has(f.id)) add('WARN', 'C8-missing-di-edge', `flow ${f.id.slice(0, 18)} has NO BPMNEdge (invisible arrow in modeler)`);

  // C9 duplicate listener kod census (dedicated-task pattern is legit — surface it)
  const kodCount = {};
  for (const t of model.xml.matchAll(/receiveUserTask\(&quot;([^&]+)&quot;,&quot;([^&]+)&quot;/g)) {
    const k = t[1] + '/' + t[2];
    kodCount[k] = (kodCount[k] || 0) + 1;
  }
  for (const [k, n] of Object.entries(kodCount)) if (n > 1)
    add('INFO', 'C9-shared-kod', `tugasan kod/peranan ${k} used by ${n} userTasks (dedicated-task pattern; confirm both should share the same skrin + ind_tgsn row)`);

  return F;
}

function diffModels(oldM, newM) {
  const rows = [];
  const oldFlows = new Map(oldM.flows.map(f => [f.id, f]));
  const newFlows = new Map(newM.flows.map(f => [f.id, f]));
  for (const [id, f] of newFlows) {
    const o = oldFlows.get(id);
    if (!o) rows.push(`+ flow ${id.slice(0, 22)} ${label(newM, f.src)} --${f.name}${f.cond ? ' [' + f.cond + ']' : ''}--> ${label(newM, f.tgt)}`);
    else if (o.cond !== f.cond) rows.push(`~ flow ${id.slice(0, 22)} condition: [${o.cond}] -> [${f.cond}]`);
    else if (o.tgt !== f.tgt) rows.push(`~ flow ${id.slice(0, 22)} target: ${label(oldM, o.tgt)} -> ${label(newM, f.tgt)}`);
  }
  for (const [id, f] of oldFlows) if (!newFlows.has(id)) rows.push(`- flow ${id.slice(0, 22)} ${label(oldM, f.src)} --> ${label(oldM, f.tgt)}`);
  const oldIds = new Set(Object.keys(oldM.nodes)), newIds = new Set(Object.keys(newM.nodes));
  for (const id of newIds) if (!oldIds.has(id)) rows.push(`+ node ${newM.nodes[id].type} "${newM.nodes[id].name || id}"`);
  for (const id of oldIds) if (!newIds.has(id)) rows.push(`- node ${oldM.nodes[id].type} "${oldM.nodes[id].name || id}"`);
  // callActivity map deltas
  const oldCA = new Map(oldM.callActivities.map(c => [c.id, c])), newCA = new Map(newM.callActivities.map(c => [c.id, c]));
  for (const [id, c] of newCA) {
    const o = oldCA.get(id); if (!o) continue;
    for (const v of c.outs) if (!o.outs.includes(v)) rows.push(`+ out-map ${v} on callActivity "${c.name || id}"`);
    for (const v of o.outs) if (!c.outs.includes(v)) rows.push(`- out-map ${v} on callActivity "${c.name || id}"`);
  }
  return rows;
}
function label(m, id) { const n = m.nodes[id]; return n ? (n.name || n.type + ':' + id.slice(0, 10)) : id.slice(0, 12); }

// ---- main ----
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const baseIdx = args.indexOf('--baseline');
const baseFile = baseIdx >= 0 ? args[baseIdx + 1] : null;
const asJson = args.includes('--json');
if (!file) { console.error('usage: node bpmn-check.js <file.bpmn20.xml> [--baseline <old.xml>] [--json]'); process.exit(2); }

let model, baseline = null;
try { model = parseModel(file); } catch (e) { console.error('CANNOT READ/PARSE: ' + e.message); process.exit(2); }
if (baseFile) { try { baseline = parseModel(baseFile); } catch (e) { console.error('baseline unreadable: ' + e.message); } }

const findings = check(model, baseline);
const errors = findings.filter(f => f.level === 'ERROR');
if (asJson) {
  console.log(JSON.stringify({ file, findings, diff: baseline ? diffModels(baseline, model) : null }, null, 1));
} else {
  console.log(`═══ BPMN-CHECK v1.0 — ${path.basename(file)} ═══`);
  console.log(`nodes:${Object.keys(model.nodes).length} flows:${model.flows.length} gateways:${model.gateways.length} callActivities:${model.callActivities.length}`);
  for (const lvl of ['ERROR', 'WARN', 'INFO']) {
    for (const f of findings.filter(x => x.level === lvl)) console.log(`${lvl === 'ERROR' ? '🚨' : lvl === 'WARN' ? '⚠' : 'ℹ'} [${f.code}] ${f.msg}`);
  }
  if (baseline) {
    console.log('── DIFF vs baseline ──');
    const d = diffModels(baseline, model);
    d.length ? d.forEach(r => console.log('  ' + r)) : console.log('  (no element-level differences)');
  }
  console.log(`VERDICT: ${errors.length ? '🚨 ' + errors.length + ' ERROR(s) — fix before publish' : '✅ no blocking findings'}`);
}
process.exit(errors.length ? 1 : 0);
