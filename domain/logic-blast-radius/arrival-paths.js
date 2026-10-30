#!/usr/bin/env node
// arrival-paths.js — every way a permohonan can arrive at one tugasan, derived from the flowable.
// Usage: node domain/logic-blast-radius/arrival-paths.js <URUSAN> <TUGASAN> --env mlit|stg [--key <processKey>] [--file <bpmn>] [--json]
// Source order: the engine DB (the model that actually runs); --file only when the engine cannot be read,
// and then the output says STALE with both byte counts. Writes arrival/<URUSAN>-<TUGASAN>.json for the gate.
// Born 2026-10-30, 287048. miya: "the scenario can simply refer to the flowable, whether DB or BPMN file, which ever is the most efficient."
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseXml, varsInCondition } = require('../bpmn-check/bpmn-check.js');

const GATEWAY = 'http://127.0.0.1:7411';
const ENGINE = { mlit: { mcp: 'postgres-mlit-pg', schema: 'et_flowable_mlit' }, stg: { mcp: 'postgres-mlkstg-pg', schema: 'et_flowable17' } };
const ADMIN_ROWS = [
  { id: 'alter', how: 'Alter Flow to this tugasan or to an earlier node; app rows are not deleted' },
  { id: 'initiate', how: 'Initiate or Initiate & Alter: a new process runs to this tugasan; app rows are not deleted' },
  { id: 'reassign', how: 'agihan or admin changes the holder inside the same pass' },
  { id: 'migrated', how: 'data migration created the rows; no user pass produced them' },
];

async function dbSelect(mcp, sql) {
  const token = fs.readFileSync(path.join(os.homedir(), '.db-gateway', 'token'), 'utf8').trim();
  const res = await fetch(`${GATEWAY}/${mcp}/mcp`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'query_database', arguments: { query: sql, limit: 200 } } }),
  });
  let txt = await res.text();
  const ev = txt.match(/^data: (.*)$/m); if (ev) txt = ev[1];
  const j = JSON.parse(txt);
  if (j.error || !j.result || j.result.isError) throw new Error('DB error: ' + JSON.stringify(j.error || j.result).slice(0, 200));
  const t = j.result.content[0].text;
  const m = t.match(/Results \([^)]*\):?\n/);
  if (!m) return [];
  const lines = t.slice(m.index + m[0].length).split('\n').filter(Boolean);
  const head = lines.shift().split('\t');
  return lines.map(l => { const c = l.split('\t'); const o = {}; head.forEach((h, i) => { o[h] = c[i]; }); return o; });
}

async function loadEngine(env, key) {
  const e = ENGINE[env];
  if (!e) throw new Error('unknown env ' + env);
  const rows = await dbSelect(e.mcp, `SELECT d.key_, d.version_, length(b.bytes_) AS bytes, replace(encode(b.bytes_, 'base64'), chr(10), '') AS b64 FROM ${e.schema}.act_re_procdef d, ${e.schema}.act_ge_bytearray b WHERE d.key_ = '${key}' AND b.deployment_id_ = d.deployment_id_ AND b.name_ LIKE '%.xml' ORDER BY d.version_ DESC LIMIT 1`);
  if (!rows.length) return null;
  return { xml: Buffer.from(rows[0].b64, 'base64').toString('utf8'), version: rows[0].version_, bytes: Number(rows[0].bytes) };
}

function findTask(xml, kod) {
  const re = /<userTask\b[^>]*\bid="([^"]+)"[\s\S]*?<\/userTask>/g;
  let m;
  while ((m = re.exec(xml))) {
    if (new RegExp('receiveUserTask\\((?:"|&quot;)' + kod + '(?:"|&quot;)').test(m[0])) return m[1];
  }
  return null;
}

function kodOf(xml, id) {
  const block = (xml.match(new RegExp('<userTask\\b[^>]*\\bid="' + id + '"[\\s\\S]*?</userTask>')) || [''])[0];
  return (block.match(/receiveUserTask\((?:"|&quot;)([^"&]+)(?:"|&quot;)/) || [])[1] || null;
}

const STOP = new Set(['userTask', 'callActivity', 'startEvent']);
// Nodes a process can reach from its start without passing through the task: anything else feeding the task is a loop.
function reachableWithout(model, task) {
  const seen = new Set(); const stack = Object.values(model.nodes).filter(n => n.type === 'startEvent').map(n => n.id);
  while (stack.length) { const n = stack.pop(); for (const f of model.flows) if (f.src === n && f.tgt !== task && !seen.has(f.tgt)) { seen.add(f.tgt); stack.push(f.tgt); } }
  return seen;
}
// Each path back from node to the nearest userTask, callActivity or start event, with the conditions passed on the way.
function walkBack(model, node) {
  const out = [];
  const go = (n, conds, via, seen) => {
    for (const f of model.flows.filter(x => x.tgt === n)) {
      if (seen.has(f.id)) continue;
      const src = model.nodes[f.src];
      const c = f.cond ? conds.concat(f.cond) : conds;
      if (!src || STOP.has(src.type)) { out.push({ src: f.src, type: src && src.type, conds: c, via }); continue; }
      go(f.src, c, via.concat(src.name || src.type), new Set([...seen, f.id]));
    }
  };
  go(node, [], [], new Set());
  return out;
}

const slug = s => String(s).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'unnamed';

function derive(xml, kod) {
  const model = parseXml(xml);
  const task = findTask(xml, kod);
  if (!task) return { task: null, rows: [] };
  const beforeTask = reachableWithout(model, task);
  const isLoopSrc = s => s === task || (!beforeTask.has(s) && model.nodes[s] && model.nodes[s].type !== 'startEvent');
  const rows = new Map();
  const add = (id, how) => { if (!rows.has(id)) rows.set(id, { id, how }); };
  const name = id => { const n = model.nodes[id]; return kodOf(xml, id) || (n && n.name) || id; };
  const label = p => {
    const v = p.conds.flatMap(c => [...varsInCondition(c)]);
    return v.length ? v[0] : (p.via.length ? slug(p.via[0]) : slug(name(p.src)));
  };
  const direct = walkBack(model, task);
  for (const p of direct) {
    const isLoop = isLoopSrc(p.src);
    if (p.type === 'callActivity') add('subflow:' + slug(name(p.src)), `sub-process ${name(p.src)} returns here`);
    else if (isLoop) add('loop:' + label(p), `${name(task)} goes on and comes back through ${name(p.src)}`);
    else add('first-pass', `${name(p.src)} sends to ${kod}`);
  }
  // one level up: a loop or an entry into the feeder is a fresh pass at the target
  for (const p of direct.filter(x => x.type === 'userTask' && !isLoopSrc(x.src))) {
    for (const q of walkBack(model, p.src)) {
      const isLoop = isLoopSrc(q.src);
      if (isLoop) add('loop:' + label(q), `${kod} goes back to ${name(p.src)} through ${q.via.join(' > ') || name(q.src)}, then forward again`);
      else if (q.conds.length || q.via.length) add('entry:' + label(q), `${name(q.src)} enters ${name(p.src)} through ${q.via.join(' > ') || 'a condition'}`);
    }
  }
  for (const r of ADMIN_ROWS) add(r.id, r.how);
  return { task, rows: [...rows.values()] };
}

async function main() {
  const argv = process.argv.slice(2);
  const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
  const opt = n => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : null; };
  const [urusan, tugasan] = pos;
  if (!urusan || !tugasan) { console.error('usage: node arrival-paths.js <URUSAN> <TUGASAN> --env mlit|stg [--key <processKey>] [--file <bpmn>] [--json]'); process.exit(2); }
  const env = opt('env') || 'mlit';
  // the online (Lite) urusan all run on one process, MLK_PLP_UPLP (engine, 2026-10-30)
  const LITE = ['OPLPS', 'OMLPS', 'OPRU', 'OPRBB', 'OPLBP', 'OPPJK', 'OPPTPB'];
  const key = opt('key') || (LITE.includes(urusan) ? 'MLK_PLP_UPLP' : 'MLK_PLP_' + urusan);
  let xml = null, source = null;
  let engine = null;
  try { engine = await loadEngine(env, key); } catch (e) { console.error('engine not readable: ' + e.message); }
  const file = opt('file');
  if (file) {
    xml = fs.readFileSync(file, 'utf8');
    source = `file STALE ${Buffer.byteLength(xml)}/${engine ? engine.bytes : 'unknown'}`;
  } else if (engine) {
    xml = engine.xml;
    source = `engine v${engine.version} ${env}`;
  }
  const dir = path.join(__dirname, 'arrival');
  fs.mkdirSync(dir, { recursive: true });
  let result = { task: null, rows: ADMIN_ROWS.slice() };
  if (xml) { result = derive(xml, tugasan); if (!result.task) { console.error(`no userTask receiveUserTask("${tugasan}") in ${key}`); process.exit(3); } } else { source = 'NOT VERIFIED: no BPMN'; }
  const out = { urusan, tugasan, key, env, source, ts: new Date().toISOString(), ids: result.rows.map(r => r.id), rows: result.rows };
  fs.writeFileSync(path.join(dir, `${urusan}-${tugasan}.json`), JSON.stringify(out, null, 1));
  if (argv.includes('--json')) { console.log(JSON.stringify(out, null, 1)); return; }
  console.log(`ARRIVAL PATHS · <ticket> · ${urusan} · ${tugasan} · source: ${source}`);
  console.log('| id | how to reach | rows on arrival (SELECT) | check result | state today | should be | verdict |');
  console.log('|---|---|---|---|---|---|---|');
  for (const r of result.rows) console.log(`| ${r.id} | ${r.how} |  |  |  |  |  |`);
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
module.exports = { derive, findTask, walkBack };
