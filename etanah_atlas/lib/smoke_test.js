// lib/smoke_test.js — headless boot + interaction + data-contract smoke test for Etanah Atlas.
// Runs the REAL app.js startup path under a minimal DOM shim (no browser needed), then
// exercises every modul in both layout modes and validates the data contract.
// Usage:  node lib/smoke_test.js     (exit 0 = all pass, 1 = any failure)
// Run this after `python build.py` as the build gate.
"use strict";
const fs = require("fs"), vm = require("vm"), path = require("path");

const ROOT = path.resolve(__dirname, "..");
const datasetStr = fs.readFileSync(path.join(ROOT, "build/dataset.json"), "utf8");
const dataset = JSON.parse(datasetStr);
const profile = dataset.profile || "melaka";
const mappingStr = fs.readFileSync(path.join(ROOT, `config/mapping.${profile}.json`), "utf8");
const appCode = fs.readFileSync(path.join(ROOT, "src/app.js"), "utf8");

let passes = 0, failures = 0;
const out = [];
function check(name, cond, detail) {
  (cond ? passes++ : failures++);
  out.push(`  ${cond ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

// ---------- minimal permissive DOM shim ----------
const stub = new Proxy(function () { return stub; }, {
  get(t, p) {
    if (p === Symbol.iterator) return function* () {};
    if (p === Symbol.toPrimitive) return () => 0;
    if (p === "length") return 0;
    if (p === "options") return [];
    if (p === "value") return "";
    if (p === "textContent" || p === "innerHTML") return "";
    if (p === "getAttribute") return () => "";
    if (p === "querySelectorAll") return () => [];
    if (p === "files") return [];
    return stub;
  },
  set() { return true; }, apply() { return stub; },
});
const counts = { modul: 0, urusan: 0, picker: 0, compare: 0, search_modul: 0 };
const counterEl = (key) => ({
  appendChild() { counts[key]++; }, set value(v) {}, get value() { return ""; },
  classList: { add() {}, remove() {}, toggle() {} }, dataset: {}, addEventListener() {},
  cloneNode() { return stub; }, querySelector() { return stub; }, querySelectorAll() { return []; },
  style: {}, set innerHTML(v) {}, set textContent(v) {},
});
const tracked = {
  "#ctl-modul": counterEl("modul"), "#ctl-urusan": counterEl("urusan"),
  "#urusan-picker": counterEl("picker"), "#urusan-compare": counterEl("compare"),
  "#search-modul": counterEl("search_modul"),
};
const document = {
  getElementById(id) {
    if (id === "dataset") return { textContent: datasetStr };
    if (id === "mapping-doc") return { textContent: mappingStr };
    return stub;
  },
  querySelector(sel) { return tracked[sel] || stub; },
  querySelectorAll() { return []; },
  createElement() { return stub; }, createElementNS() { return stub; },
  documentElement: stub, addEventListener() {},
};
const sandbox = {
  document,
  window: { addEventListener() {}, print() {}, matchMedia() { return { matches: false, addListener() {} }; } },
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: {}, console, FileReader: function () {},
};
sandbox.globalThis = sandbox;

// ---------- T1: boot ----------
let bootErr = null;
try {
  vm.createContext(sandbox);
  vm.runInContext(appCode +
    "\n;globalThis.__hook={MAP_STATE:(typeof MAP_STATE!=='undefined')?MAP_STATE:null,DATA:(typeof DATA!=='undefined')?DATA:null,layoutAndRender:(typeof layoutAndRender!=='undefined')?layoutAndRender:null,visibleNodes:(typeof visibleNodes!=='undefined')?visibleNodes:null,visibleEdges:(typeof visibleEdges!=='undefined')?visibleEdges:null,buildEdgeRoutes:(typeof buildEdgeRoutes!=='undefined')?buildEdgeRoutes:null,edgePoints:(typeof edgePoints!=='undefined')?edgePoints:null,nodeSize:(typeof nodeSize!=='undefined')?nodeSize:null,urusanTables:(typeof urusanTables!=='undefined')?urusanTables:null,newOcc:(typeof newOcc!=='undefined')?newOcc:null,markOcc:(typeof markOcc!=='undefined')?markOcc:null,nudgeEdges:(typeof nudgeEdges!=='undefined')?nudgeEdges:null,panelGroups:(typeof panelGroups!=='undefined')?panelGroups:null};",
    sandbox, { filename: "app.js" });
} catch (e) { bootErr = (e.stack || String(e)); }
check("boot: app.js startup runs with no exception", bootErr === null, bootErr ? bootErr.split("\n")[0] : "clean");

// ---------- T2: dropdowns populated ----------
const expectModuls = dataset.moduls.filter((m) => m.key !== "operations").length;
check("dropdown: Modul options", counts.modul === expectModuls, `${counts.modul} (expected ${expectModuls})`);
check("dropdown: Urusan options", counts.urusan === dataset.urusans.length, `${counts.urusan} (expected ${dataset.urusans.length})`);
check("dropdown: Journey picker options", counts.picker === dataset.urusans.length, `${counts.picker}`);
check("dropdown: compare chips", counts.compare === dataset.urusans.length, `${counts.compare}`);

// ---------- T3: interaction — render every modul × both layout modes ----------
const hook = sandbox.__hook;
if (hook && hook.layoutAndRender && hook.MAP_STATE) {
  let rErr = 0, rN = 0;
  for (const m of dataset.moduls) {
    try {
      hook.MAP_STATE.modul = m.key; hook.MAP_STATE.urusan = "";
      hook.MAP_STATE.positions = {};
      hook.layoutAndRender(); rN++;
    } catch (e) { rErr++; out.push(`        ↳ ${m.key}: ${e.message || e}`); }
  }
  check("interaction: render all moduls (swimlanes-only since 2026-08-27)", rErr === 0, `${rN} renders, ${rErr} errors`);
  let uErr = 0;
  try {
    hook.MAP_STATE.modul = "pelupusan";
    for (const u of dataset.urusans) { hook.MAP_STATE.urusan = u.kod; hook.layoutAndRender(); }
    hook.MAP_STATE.urusan = "";
  } catch (e) { uErr++; out.push(`        ↳ urusan filter: ${e.message || e}`); }
  check("interaction: urusan filter across all urusans", uErr === 0, `${dataset.urusans.length} filters`);
} else {
  check("interaction: internals exposed for testing", false, "test hook missing");
}

// ---------- T4: data-contract evals ----------
const names = new Set(dataset.tables.map((t) => t.name));
const deadStage = [];
for (const u of dataset.urusans) for (const s of u.stages) {
  for (const t of s.tables) if (t !== "tkl_*" && !names.has(t)) deadStage.push(`${u.kod}/${s.kod}:${t}`);
  if (s.fork) for (const o of s.fork.outcomes) for (const st of o.steps) for (const t of st.tables) if (!names.has(t)) deadStage.push(`${u.kod}/${s.kod}/${o.kind}:${t}`);
}
check("data: all urusan stage tables exist in schema", deadStage.length === 0, deadStage.length ? deadStage.join(", ") : "all resolve");
const deadMain = [];
for (const m of dataset.moduls) for (const mt of (m.main_tables || [])) if (!names.has(mt)) deadMain.push(`${m.key}:${mt}`);
check("data: all modul main_tables exist in schema", deadMain.length === 0, deadMain.length ? deadMain.join(", ") : "all resolve");
check("data: totals populated", !!(dataset.totals && dataset.totals.tables > 0 && dataset.totals.moduls > 0), dataset.totals ? `${dataset.totals.tables} tables, ${dataset.totals.moduls} moduls` : "missing");
check("data: urusan count == 13", dataset.urusans.length === 13, `${dataset.urusans.length}`);
const KINDS = new Set(["lulus", "tolak", "tangguh"]);
const forkBad = [];
for (const kod of ["PT", "PLPS"]) {
  const u = dataset.urusans.find(x => x.kod === kod);
  const dec = u && u.stages.find(s => s.fork && Array.isArray(s.fork.outcomes));
  if (!dec) { forkBad.push(kod + " no fork"); continue; }
  const f = dec.fork;
  if (f.outcomes.length !== 3) forkBad.push(kod + " has " + f.outcomes.length + " outcomes");
  if (!KINDS.has(f.default)) forkBad.push(kod + " bad default " + f.default);
  for (const o of f.outcomes) {
    if (!KINDS.has(o.kind)) forkBad.push(kod + " bad kind " + o.kind);
    if (!Array.isArray(o.steps) || !o.steps.length) forkBad.push(kod + "/" + o.kind + " no steps");
    else for (const st of o.steps) if (!st.tables || !st.tables.length) forkBad.push(kod + "/" + o.kind + " step no tables");
  }
}
check("journey: PT + PLPS decision selector (default + 3 outcomes w/ steps)", forkBad.length === 0, forkBad.length ? forkBad.join(", ") : "both pilots OK");

// ---------- T5: urusan-filter correctness (right tables highlight per urusan) ----------
if (hook && hook.urusanTables) {
  const urBad = [];
  for (const u of dataset.urusans) {
    const expect = new Set();
    for (const s of u.stages) {
      for (const t of s.tables) if (!t.includes("*")) expect.add(t);
      if (s.fork) for (const o of s.fork.outcomes) for (const st of o.steps) for (const t of st.tables) if (!t.includes("*")) expect.add(t);
    }
    ["umm_aplikasi", "ind_ursn", "umm_a_tgsn", "ind_tgsn", "umm_a_pihak_bkptg"].forEach(s => expect.add(s)); // workflow spine (2026-08-27)
    const got = hook.urusanTables(u.kod);
    let same = got.size === expect.size; if (same) for (const t of expect) if (!got.has(t)) { same = false; break; }
    if (!same) urBad.push(u.kod + " (got " + got.size + " vs " + expect.size + ")");
    for (const t of got) if (!names.has(t)) urBad.push(u.kod + ":" + t + " missing");
  }
  check("urusan filter: highlight set = stage tables & all exist", urBad.length === 0, urBad.length ? urBad.slice(0,4).join(", ") : "all 13 correct");
} else check("urusan filter: urusanTables exposed", false, "hook missing");

// ---------- T6a: ALWAYS-ON card-overlap check (2026-08-27 — the old T6 silently SKIPs
// on lost v2.3 routing internals, which let real overlaps ship unseen) ----------
if (hook && hook.layoutAndRender && hook.nodeSize && hook.MAP_STATE) {
  const rectOf2 = (id, pos) => { const b = hook.nodeSize(id), p = pos[id]; return { x0: p.x - b.w/2, y0: p.y - b.h/2, x1: p.x + b.w/2, y1: p.y + b.h/2 }; };
  const ovl2 = (A, B) => A.x0 < B.x1 - 0.5 && B.x0 < A.x1 - 0.5 && A.y0 < B.y1 - 0.5 && B.y0 < A.y1 - 0.5;
  const bad = [];
  for (const m of dataset.moduls) {
    hook.MAP_STATE.modul = m.key; hook.MAP_STATE.urusan = ""; hook.MAP_STATE.positions = {};
    hook.layoutAndRender();
    const pos = hook.MAP_STATE.positions, ids = Object.keys(pos);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++)
      if (ovl2(rectOf2(ids[i], pos), rectOf2(ids[j], pos))) bad.push(m.key + ":" + ids[i] + "x" + ids[j]);
  }
  check("geometry: no overlapping cards — ALWAYS-ON lane-stack check", bad.length === 0, bad.length ? bad.slice(0,4).join(", ") : "none across all moduls");
} else check("geometry: always-on overlap check ran", false, "hook missing");

// ---------- T6b: urusan highlight includes the workflow spine ----------
if (hook && hook.urusanTables) {
  const SPINE = ["umm_aplikasi", "ind_ursn", "umm_a_tgsn", "ind_tgsn", "umm_a_pihak_bkptg"];
  const noSpine = [];
  for (const u of dataset.urusans) {
    const got = hook.urusanTables(u.kod);
    for (const s of SPINE) if (!got.has(s)) noSpine.push(u.kod + ":" + s);
  }
  check("urusan filter: workflow spine present for all 13", noSpine.length === 0, noSpine.length ? noSpine.slice(0,4).join(", ") : "spine complete");
}

// ---------- T6c: full BPMN tugasan sequence attached per urusan (2026-08-27) ----------
{
  const noSeq = dataset.urusans.filter(u => !(u.bpmn_seq && u.bpmn_seq.tasks && u.bpmn_seq.tasks.length >= 2)).map(u => u.kod);
  check("journey: BPMN full tugasan sequence attached (all 13)", noSeq.length === 0, noSeq.length ? "missing: " + noSeq.join(",") : "13/13");
}

// ---------- T6: geometric quality - no overlapping cards, no coinciding edge endpoints ----------
if (hook && hook.layoutAndRender && hook.visibleEdges && hook.buildEdgeRoutes && hook.edgePoints && hook.nodeSize) {
  const GW = 1100, GH = 720;
  const rectOf = (id, pos) => { const b = hook.nodeSize(id), p = pos[id]; return { x0: p.x - b.w/2, y0: p.y - b.h/2, x1: p.x + b.w/2, y1: p.y + b.h/2 }; };
  const overlaps = (A, B) => A.x0 < B.x1 - 0.5 && B.x0 < A.x1 - 0.5 && A.y0 < B.y1 - 0.5 && B.y0 < A.y1 - 0.5;
  const cardOverlap = [], coincide = [];
  for (const m of dataset.moduls) for (const mode of ["bands", "swimlanes"]) {
    hook.MAP_STATE.modul = m.key; hook.MAP_STATE.layoutMode = mode; hook.MAP_STATE.urusan = "";
    hook.MAP_STATE.expanded = new Set(); hook.MAP_STATE.pinned = false; hook.MAP_STATE.positions = {};
    hook.layoutAndRender();
    const pos = hook.MAP_STATE.positions, ids = Object.keys(pos); if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++)
      if (overlaps(rectOf(ids[i], pos), rectOf(ids[j], pos))) cardOverlap.push(m.key + "/" + mode + ":" + ids[i] + "x" + ids[j]);
    const edges = hook.visibleEdges(ids), routes = hook.buildEdgeRoutes(edges, pos, mode, GW, GH), ends = [];
    edges.forEach((e, idx) => { const pts = hook.edgePoints(edges, pos, routes, idx, GW, GH); if (pts) { ends.push(pts[0]); ends.push(pts[pts.length - 1]); } });
    for (let i = 0; i < ends.length; i++) for (let j = i + 1; j < ends.length; j++)
      if (Math.hypot(ends[i][0] - ends[j][0], ends[i][1] - ends[j][1]) < 5) coincide.push(m.key + "/" + mode);
  }
  check("geometry: no overlapping cards (all moduls x modes)", cardOverlap.length === 0, cardOverlap.length ? cardOverlap.slice(0,4).join(", ") : "none");
  check("geometry: no coinciding edge endpoints (<5px)", coincide.length === 0, coincide.length ? Array.from(new Set(coincide)).join(", ") : "none");
} else out.push("  SKIP  geometry: routing internals — v2.3 A* routing lost (never committed); current app draws straight edges. Backlog: rebuild edge routing.");

// ---------- T7: NO edge segment passes behind a non-endpoint box (the core requirement) ----------
function segInt(a,b,c,d){const ccw=(A,B,C)=>(C[1]-A[1])*(B[0]-A[0])>(B[1]-A[1])*(C[0]-A[0]);return ccw(a,c,d)!==ccw(b,c,d)&&ccw(a,b,c)!==ccw(a,b,d);}
function segHitsRect(p1,p2,r){
  if(Math.max(p1[0],p2[0])<r.x0||Math.min(p1[0],p2[0])>r.x1||Math.max(p1[1],p2[1])<r.y0||Math.min(p1[1],p2[1])>r.y1)return false;
  const inside=p=>p[0]>r.x0&&p[0]<r.x1&&p[1]>r.y0&&p[1]<r.y1;
  if(inside(p1)||inside(p2))return true;
  const E=[[[r.x0,r.y0],[r.x1,r.y0]],[[r.x1,r.y0],[r.x1,r.y1]],[[r.x1,r.y1],[r.x0,r.y1]],[[r.x0,r.y1],[r.x0,r.y0]]];
  for(const e of E)if(segInt(p1,p2,e[0],e[1]))return true;
  return false;
}
if (hook && hook.layoutAndRender && hook.visibleEdges && hook.buildEdgeRoutes && hook.edgePoints && hook.nodeSize) {
  const behind = [];
  for (const m of dataset.moduls) for (const mode of ["bands","swimlanes"]) {
    hook.MAP_STATE.modul=m.key; hook.MAP_STATE.layoutMode=mode; hook.MAP_STATE.urusan="";
    hook.MAP_STATE.expanded=new Set(); hook.MAP_STATE.pinned=false; hook.MAP_STATE.positions={};
    hook.layoutAndRender();
    const pos=hook.MAP_STATE.positions, ids=Object.keys(pos); if(ids.length<2) continue;
    const rects={}; for(const id of ids){ const b=hook.nodeSize(id),p=pos[id]; rects[id]={x0:p.x-b.w/2+2,y0:p.y-b.h/2+2,x1:p.x+b.w/2-2,y1:p.y+b.h/2-2}; }
    const edges=hook.visibleEdges(ids), routes=hook.buildEdgeRoutes(edges,pos,mode,1100,720);
    edges.forEach((e,idx)=>{
      const pts=hook.edgePoints(edges,pos,routes,idx,1100,720); if(!pts||pts.length<2) return;
      for(let sgi=0;sgi<pts.length-1;sgi++) for(const id of ids){
        if(id===e.from||id===e.to) continue;
        if(segHitsRect(pts[sgi],pts[sgi+1],rects[id])){ behind.push(m.key+"/"+mode+": "+e.from+"->"+e.to+" under "+id); return; }
      }
    });
  }
  check("geometry: NO edge segment passes behind a box", behind.length===0, behind.length?(behind.length+" violations e.g. "+behind.slice(0,3).join("; ")):"none across all moduls x modes");
} else out.push("  SKIP  geometry: behind-box check — depends on lost v2.3 routing internals.");

// ---------- T8: drawn (occupancy-routed) edges don't overlap each other, still avoid boxes ----------
function segOverlapLen(s1,s2){
  const h1=Math.abs(s1[0][1]-s1[1][1])<0.5,h2=Math.abs(s2[0][1]-s2[1][1])<0.5,v1=Math.abs(s1[0][0]-s1[1][0])<0.5,v2=Math.abs(s2[0][0]-s2[1][0])<0.5;
  if(h1&&h2&&Math.abs(s1[0][1]-s2[0][1])<2){const a0=Math.min(s1[0][0],s1[1][0]),a1=Math.max(s1[0][0],s1[1][0]),b0=Math.min(s2[0][0],s2[1][0]),b1=Math.max(s2[0][0],s2[1][0]);return Math.min(a1,b1)-Math.max(a0,b0);}
  if(v1&&v2&&Math.abs(s1[0][0]-s2[0][0])<2){const a0=Math.min(s1[0][1],s1[1][1]),a1=Math.max(s1[0][1],s1[1][1]),b0=Math.min(s2[0][1],s2[1][1]),b1=Math.max(s2[0][1],s2[1][1]);return Math.min(a1,b1)-Math.max(a0,b0);}
  return -1;
}
if (hook && hook.nudgeEdges && hook.layoutAndRender && hook.visibleEdges && hook.buildEdgeRoutes && hook.edgePoints && hook.nodeSize) {
  const ovl=[], behind2=[];
  for (const m of dataset.moduls) for (const mode of ["bands","swimlanes"]) {
    hook.MAP_STATE.modul=m.key; hook.MAP_STATE.layoutMode=mode; hook.MAP_STATE.urusan="";
    hook.MAP_STATE.expanded=new Set(); hook.MAP_STATE.pinned=false; hook.MAP_STATE.positions={};
    hook.layoutAndRender();
    const pos=hook.MAP_STATE.positions, ids=Object.keys(pos); if(ids.length<2) continue;
    const rects={}; for(const id of ids){ const b=hook.nodeSize(id),p=pos[id]; rects[id]={x0:p.x-b.w/2+2,y0:p.y-b.h/2+2,x1:p.x+b.w/2-2,y1:p.y+b.h/2-2}; }
    const edges=hook.visibleEdges(ids), routes=hook.buildEdgeRoutes(edges,pos,mode,1100,720), segs=[];
    const allPts=edges.map((e,idx)=>(pos[e.from]&&pos[e.to])?hook.edgePoints(edges,pos,routes,idx,1100,720,null):null);
    hook.nudgeEdges(allPts);
    allPts.forEach((pts,idx)=>{ if(!pts||pts.length<2) return; const e=edges[idx];
      for(let s=0;s<pts.length-1;s++){ segs.push({ei:idx,a:pts[s],b:pts[s+1]});
        for(const id of ids){ if(id===e.from||id===e.to) continue; if(segHitsRect(pts[s],pts[s+1],rects[id])){ behind2.push(m.key+"/"+mode); break; } } } });
    for(let i=0;i<segs.length;i++){ let hit=false; for(let j=i+1;j<segs.length;j++){ if(segs[i].ei===segs[j].ei) continue; if(segOverlapLen([segs[i].a,segs[i].b],[segs[j].a,segs[j].b])>8){ ovl.push(m.key+"/"+mode); hit=true; break; } } if(hit) break; }
  }
  check("geometry: drawn edges still avoid boxes (occupancy routes)", behind2.length===0, behind2.length?Array.from(new Set(behind2)).join(", "):"none");
  out.push("  INFO  geometry: edge-edge overlap after nudging = " + (ovl.length?Array.from(new Set(ovl)).join(", "):"NONE"));
} else out.push("  SKIP  geometry: occupancy routing — depends on lost v2.3 routing internals.");


if (hook && hook.panelGroups && hook.DATA) {
  const list = hook.DATA.in_fk["umm_aplikasi"] || [];
  const uniq = new Set(list.map(x => x.from)).size;
  hook.MAP_STATE.panelGroupBy = "cat";
  const htmlCat = hook.panelGroups(list, "from");
  const nGroupsCat = (htmlCat.match(/pgrp-h/g) || []).length;
  const nItems = (htmlCat.match(/data-open=/g) || []).length;
  hook.MAP_STATE.panelGroupBy = "layer";
  const nGroupsLayer = (hook.panelGroups(list, "from").match(/pgrp-h/g) || []).length;
  hook.MAP_STATE.panelGroupBy = "cat";
  check("panel: group-by buckets hub children (Category >=2 groups, no items lost)", nGroupsCat >= 2 && nItems === uniq && nGroupsLayer >= 1, `cat=${nGroupsCat} groups, layer=${nGroupsLayer} groups, items=${nItems}/${uniq}`);
} else out.push("  SKIP  panel: group-by (panelGroups) — v2.3 side-panel grouping lost (never committed). Backlog: rebuild.");

console.log(`\nEtanah Atlas — smoke test (profile: ${profile})`);
console.log(out.join("\n"));
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
