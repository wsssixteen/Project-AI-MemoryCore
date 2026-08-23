"use strict";

let DATA = JSON.parse(document.getElementById("dataset").textContent);
const MAPPING = JSON.parse(document.getElementById("mapping-doc").textContent);

const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);

function tableData(name) { return DATA.tables.find(t => t.name === name); }
function categoryOf(key) { return (DATA.categories || []).find(c => c.key === key); }
function modulOf(key) { return DATA.moduls.find(m => m.key === key); }
function escapeHtml(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]); }
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }

// ========== TAB SWITCHING ==========
$$(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const t = tab.dataset.tab;
    $$(".tab").forEach(x => x.classList.toggle("active", x === tab));
    $$(".view").forEach(v => v.classList.toggle("hidden", v.dataset.view !== t));
    if (t === "map") layoutAndRender();
  });
});

// ========== THEME ==========
const themeBtn = $("#theme-btn");
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  themeBtn.textContent = t === "dark" ? "☀" : "◐";
  try { localStorage.setItem("etanah-theme", t); } catch (e) {}
}
themeBtn.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});
let initialTheme = "light";
try { initialTheme = localStorage.getItem("etanah-theme") || "light"; } catch (e) {}

// ========== HEADER + ABOUT TOTALS ==========
function refreshTotals() {
  $("#hdr-sub").textContent = `${DATA.totals.tables} tables · ${DATA.totals.foreign_keys} FKs · ${DATA.totals.moduls} moduls · profile: ${DATA.profile}`;
  $("#about-totals").innerHTML = `<strong>${DATA.totals.tables}</strong> tables, <strong>${DATA.totals.foreign_keys}</strong> foreign keys, <strong>${DATA.totals.main_tables}</strong> main tables curated across <strong>${DATA.totals.moduls}</strong> moduls.`;
  $("#about-profile").textContent = DATA.profile;
  $("#about-version").textContent = DATA.version;
  $("#about-updated").textContent = DATA.last_updated;
}

// ========== MAP STATE ==========
const MAP_STATE = {
  modul: "pelupusan",
  urusan: "",
  layer: "both",
  expanded: new Set(),
  selected: null,
  positions: {},
  pinned: false,
  layoutMode: "bands",  // "bands" | "swimlanes"
};
try {
  const saved = localStorage.getItem("etanah-layout-mode");
  if (saved === "swimlanes" || saved === "bands") MAP_STATE.layoutMode = saved;
} catch(e){}

// ========== POPULATE DROPDOWNS ==========
function populateDropdowns() {
  const modSel = $("#ctl-modul");
  const searchMod = $("#search-modul");
  DATA.moduls.forEach(m => {
    if (m.key === "operations") return;
    const tag = m.status === "preview" ? " (preview)" : "";
    const opt = document.createElement("option");
    opt.value = m.key; opt.textContent = m.label + tag;
    modSel.appendChild(opt);
    const opt2 = opt.cloneNode(true);
    searchMod.appendChild(opt2);
  });
  modSel.value = MAP_STATE.modul;

  const urSel = $("#ctl-urusan");
  DATA.urusans.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.kod; opt.textContent = `${u.kod} · ${u.name}`;
    urSel.appendChild(opt);
  });

  const pickSel = $("#urusan-picker");
  DATA.urusans.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.kod; opt.textContent = `${u.kod} · ${u.name}`;
    pickSel.appendChild(opt);
  });

  const cmpWrap = $("#urusan-compare");
  DATA.urusans.forEach(u => {
    const chip = document.createElement("button");
    chip.className = "uc-chip";
    chip.dataset.kod = u.kod;
    chip.textContent = u.kod;
    chip.addEventListener("click", () => {
      chip.classList.toggle("on");
      renderUrusanView();
    });
    cmpWrap.appendChild(chip);
  });
}


// ========== SWIMLANE COLUMNS (Mode B) ==========
// Static reference layout. Actual rendered widths come from `activeSwimlanes(nodeIds)`
// which keeps only lanes with at least one node and redistributes width evenly.
const SWIMLANES = [
  { key: "awam",      label: "AWAM / Pra",    x0: 0.04, x1: 0.27, color: "#185FA5" },
  { key: "internal",  label: "Internal (PLP)",x0: 0.28, x1: 0.55, color: "#3B6D11" },
  { key: "decision",  label: "Decision",      x0: 0.56, x1: 0.78, color: "#534AB7" },
  { key: "registry",  label: "Registry",      x0: 0.79, x1: 0.97, color: "#993C1D" },
  { key: "reference", label: "Reference",     x0: 0.02, x1: 0.98, color: "#5F5E5A" },  // floating row at bottom
];
// State holder for the lane geometry actually used by the current render.
let ACTIVE_SWIMLANES = SWIMLANES.slice();
function swimlaneCol(swim) {
  return ACTIVE_SWIMLANES.find(s => s.key === swim) ||
         SWIMLANES.find(s => s.key === swim) ||
         ACTIVE_SWIMLANES.find(s => s.key === "internal") ||
         SWIMLANES.find(s => s.key === "internal");
}
// Compute active lanes: skip the columns that have no nodes; share the canvas width
// among the remaining columns. Reference lane is always rendered floating regardless.
function computeActiveSwimlanes(nodeIds) {
  const present = new Set();
  for (const id of nodeIds) {
    const td = tableData(id);
    const sk = td && td.swimlane ? td.swimlane : "internal";
    present.add(sk);
  }
  // Column lanes (not reference) in left-to-right order
  const cols = SWIMLANES.filter(s => s.key !== "reference" && present.has(s.key));
  const referenceLane = SWIMLANES.find(s => s.key === "reference");
  if (cols.length === 0) {
    ACTIVE_SWIMLANES = referenceLane && present.has("reference") ? [referenceLane] : SWIMLANES.slice();
    return ACTIVE_SWIMLANES;
  }
  const leftMargin = 0.04, rightMargin = 0.03, gap = 0.012;
  const totalGap = gap * (cols.length - 1);
  const w = (1 - leftMargin - rightMargin - totalGap) / cols.length;
  let cursor = leftMargin;
  const reflowed = cols.map(s => {
    const next = { ...s, x0: cursor, x1: cursor + w };
    cursor += w + gap;
    return next;
  });
  if (referenceLane && present.has("reference")) reflowed.push(referenceLane);
  ACTIVE_SWIMLANES = reflowed;
  return ACTIVE_SWIMLANES;
}

// ========== FORCE-DIRECTED LAYOUT (with hard collision) ==========
function nodeSize(id) {
  const td = tableData(id);
  const isMain = td && td.is_main;
  return { w: isMain ? 175 : 145, h: isMain ? 56 : 44 };
}
function forceLayout(nodeIds, edges, width, height) {
  const pos = {}, vel = {};
  const swimMode = MAP_STATE.layoutMode === "swimlanes";
  // Group nodes by swimlane for Y distribution
  const bySwim = {};
  for (const id of nodeIds) {
    const td = tableData(id);
    const sk = td && td.swimlane ? td.swimlane : "internal";
    bySwim[sk] = bySwim[sk] || [];
    bySwim[sk].push(id);
  }
  for (const id of nodeIds) {
    if (MAP_STATE.pinned && MAP_STATE.positions[id]) {
      pos[id] = { x: MAP_STATE.positions[id].x, y: MAP_STATE.positions[id].y };
    } else if (swimMode) {
      const td = tableData(id);
      const sk = td && td.swimlane ? td.swimlane : "internal";
      const col = swimlaneCol(sk);
      const idx = bySwim[sk].indexOf(id);
      const cnt = bySwim[sk].length;
      // Stack vertically inside the column
      const cx = (col.x0 + col.x1) / 2 * width;
      const yStart = sk === "reference" ? height - 90 : 100;
      const yStep = sk === "reference" ? 0 : Math.min(82, (height - 180) / Math.max(1, cnt));
      pos[id] = { x: cx + (sk === "reference" ? (idx - cnt/2) * 160 : 0), y: yStart + idx * yStep };
    } else {
      const td = tableData(id);
      const cIdx = DATA.categories.findIndex(c => c.key === (td ? td.category : "subsystem"));
      const ang = (cIdx / DATA.categories.length) * Math.PI * 2;
      pos[id] = { x: width/2 + Math.cos(ang) * 240 + (Math.random()-0.5)*40, y: height/2 + Math.sin(ang) * 200 + (Math.random()-0.5)*40 };
    }
    vel[id] = { x: 0, y: 0 };
  }
  if (MAP_STATE.pinned) return pos;

  const sizes = {}; for (const id of nodeIds) sizes[id] = nodeSize(id);
  const N = nodeIds.length;
  const iter = 450;
  for (let step = 0; step < iter; step++) {
    const t = 1 - step / iter;
    // Repulsion + collision
    for (let i = 0; i < N; i++) {
      const a = nodeIds[i];
      let fx = 0, fy = 0;
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const b = nodeIds[j];
        const dx = pos[a].x - pos[b].x;
        const dy = pos[a].y - pos[b].y;
        const sizeA = sizes[a], sizeB = sizes[b];
        const minSepX = (sizeA.w + sizeB.w) / 2 + 18;
        const minSepY = (sizeA.h + sizeB.h) / 2 + 14;
        const ax = Math.abs(dx), ay = Math.abs(dy);
        // Hard collision: push out if rectangles overlap (with padding)
        if (ax < minSepX && ay < minSepY) {
          const overlapX = minSepX - ax;
          const overlapY = minSepY - ay;
          if (overlapX < overlapY) {
            fx += (dx >= 0 ? 1 : -1) * overlapX * 0.55;
          } else {
            fy += (dy >= 0 ? 1 : -1) * overlapY * 0.55;
          }
        } else {
          // Soft repulsion (longer range)
          const d2 = Math.max(50, dx*dx + dy*dy);
          const d = Math.sqrt(d2);
          const force = 18000 / d2;
          fx += (dx / d) * force;
          fy += (dy / d) * force;
        }
      }
      // Center gravity (mild)
      fx += (width/2 - pos[a].x) * 0.008;
      fy += (height/2 - pos[a].y) * 0.008;
      vel[a].x = (vel[a].x + fx) * 0.55 * (0.4 + 0.6 * t);
      vel[a].y = (vel[a].y + fy) * 0.55 * (0.4 + 0.6 * t);
    }
    // Attraction along edges (link force)
    for (const e of edges) {
      if (!pos[e.from] || !pos[e.to]) continue;
      const dx = pos[e.to].x - pos[e.from].x;
      const dy = pos[e.to].y - pos[e.from].y;
      const d = Math.max(1, Math.sqrt(dx*dx + dy*dy));
      const targetD = 200;
      const force = (d - targetD) * 0.05;
      vel[e.from].x += (dx / d) * force;
      vel[e.from].y += (dy / d) * force;
      vel[e.to].x -= (dx / d) * force;
      vel[e.to].y -= (dy / d) * force;
    }
    // Category cohesion (Bands mode only) — pull same-category nodes toward their centroid
    // so bands form tight clusters and band-rectangles stop overlapping across the canvas.
    if (!swimMode) {
      const cats = {};
      for (const id of nodeIds) {
        const td = tableData(id);
        const ck = td && td.category ? td.category : "subsystem";
        cats[ck] = cats[ck] || { sx: 0, sy: 0, n: 0, ids: [] };
        cats[ck].sx += pos[id].x;
        cats[ck].sy += pos[id].y;
        cats[ck].n += 1;
        cats[ck].ids.push(id);
      }
      for (const ck in cats) {
        const c = cats[ck];
        if (c.n < 2) continue;  // singletons have no cohesion target
        const cx = c.sx / c.n, cy = c.sy / c.n;
        for (const id of c.ids) {
          const dx = cx - pos[id].x;
          const dy = cy - pos[id].y;
          vel[id].x += dx * 0.04;
          vel[id].y += dy * 0.04;
        }
      }
    }
    // Apply with damping + bounds; if swimlanes, clamp X to column
    for (const id of nodeIds) {
      pos[id].x += Math.max(-14, Math.min(14, vel[id].x));
      pos[id].y += Math.max(-14, Math.min(14, vel[id].y));
      const sz = sizes[id];
      if (swimMode) {
        const td = tableData(id);
        const col = swimlaneCol(td && td.swimlane ? td.swimlane : "internal");
        const minX = col.x0 * width + sz.w/2 + 8;
        const maxX = col.x1 * width - sz.w/2 - 8;
        pos[id].x = Math.max(minX, Math.min(maxX, pos[id].x));
      } else {
        pos[id].x = Math.max(sz.w/2 + 20, Math.min(width - sz.w/2 - 20, pos[id].x));
      }
      pos[id].y = Math.max(sz.h/2 + 20, Math.min(height - sz.h/2 - 20, pos[id].y));
    }
  }
  return pos;
}

// ========== COMPUTE VISIBLE NODE SET ==========
function visibleNodes() {
  const m = modulOf(MAP_STATE.modul);
  if (!m) return [];
  // The full main-table set for this modul
  const mainSet = new Set(m.main_tables || []);
  // Shared main tables — always visible (anchors like umm_aplikasi, ind_ursn etc.)
  if (MAP_STATE.modul !== "shared" && DATA.anchor_blurbs) {
    Object.keys(DATA.anchor_blurbs).forEach(n => {
      const td = tableData(n);
      if (td && td.modul === "shared") mainSet.add(n);
    });
  }

  // FOCUS MODE — when anything is expanded, hide other main tables (per user feedback).
  // Visible = (expanded parents) ∪ (children of expanded) ∪ (always-on hub anchors).
  const expandedActive = MAP_STATE.expanded && MAP_STATE.expanded.size > 0;
  const set = new Set();
  if (expandedActive) {
    // Always keep these "you-can't-orient-without-them" anchors visible
    const ALWAYS_ON = new Set(["umm_aplikasi", "umm_p_aplikasi"]);
    ALWAYS_ON.forEach(n => { if (mainSet.has(n)) set.add(n); });
    for (const parent of MAP_STATE.expanded) {
      if (!mainSet.has(parent)) continue;
      set.add(parent);
      const ch = DATA.anchor_children[parent] || [];
      ch.slice(0, 8).forEach(c => set.add(c.from));
    }
  } else {
    // Default: show all main tables
    mainSet.forEach(n => set.add(n));
  }
  return Array.from(set);
}

function visibleEdges(nodeIds) {
  const setN = new Set(nodeIds);
  const result = [];
  for (const n of nodeIds) {
    const outs = DATA.out_fk[n] || [];
    for (const e of outs) {
      if (setN.has(e.to)) {
        result.push({ from: n, to: e.to, col: e.col });
      }
    }
  }
  return result;
}

function urusanTables(kod) {
  const u = DATA.urusans.find(x => x.kod === kod);
  if (!u) return new Set();
  const set = new Set();
  for (const s of u.stages) {
    for (const t of (s.tables || [])) {
      if (!t.includes("*")) set.add(t);
    }
    if (s.fork) for (const o of (s.fork.outcomes || [])) {
      for (const st of (o.steps || [])) {
        for (const t of (st.tables || [])) {
          if (!t.includes("*")) set.add(t);
        }
      }
    }
  }
  return set;
}

function svgEl(tag, attrs) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function boxEdge(box, bx, by, tx, ty) {
  const dx = tx - bx, dy = ty - by;
  if (dx === 0 && dy === 0) return [bx, by];
  const hx = box.w / 2, hy = box.h / 2;
  const sx = dx === 0 ? Infinity : (Math.sign(dx) * hx) / dx;
  const sy = dy === 0 ? Infinity : (Math.sign(dy) * hy) / dy;
  const s = Math.min(sx, sy);
  return [bx + dx * s, by + dy * s];
}


// ========== DRAG + CLICK HANDLER ==========
// Distinguishes click (no movement) from drag (movement > 4px)
function attachDragAndClick(g, id, pos) {
  let startX, startY, originX, originY, moved, lastMouseTime;
  g.addEventListener("mousedown", (ev) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    const svg = document.getElementById("map-svg");
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const cursorSVG = pt.matrixTransform(ctm.inverse());
    startX = cursorSVG.x; startY = cursorSVG.y;
    originX = pos.x; originY = pos.y;
    moved = false;
    g.style.cursor = "grabbing";
    lastMouseTime = Date.now();

    function onMove(e) {
      const pt2 = svg.createSVGPoint();
      pt2.x = e.clientX; pt2.y = e.clientY;
      const cur = pt2.matrixTransform(ctm.inverse());
      const dx = cur.x - startX, dy = cur.y - startY;
      if (Math.hypot(dx, dy) > 4) moved = true;
      const newX = originX + dx, newY = originY + dy;
      pos.x = newX; pos.y = newY;
      MAP_STATE.positions[id] = { x: newX, y: newY };
      // Update node position
      const size = nodeSize(id);
      const rect = g.querySelector(".node-rect");
      if (rect) { rect.setAttribute("x", newX - size.w/2); rect.setAttribute("y", newY - size.h/2); }
      const texts = g.querySelectorAll("text");
      texts.forEach((t, i) => {
        const cls = t.getAttribute("class") || "";
        if (cls.includes("node-text")) { t.setAttribute("x", newX); t.setAttribute("y", newY - 3); }
        else if (cls.includes("node-sub")) { t.setAttribute("x", newX); t.setAttribute("y", newY + 13); }
        else if (cls.includes("node-shared-badge")) {
          // MAIN badge left-anchored; shared badge right-anchored
          if (t.textContent === "MAIN") { t.setAttribute("x", newX - size.w/2 + 8); t.setAttribute("y", newY - size.h/2 + 14); }
          else { t.setAttribute("x", newX + size.w/2 - 8); t.setAttribute("y", newY - size.h/2 + 14); }
        }
      });
      // Reposition the expanded-state ring if present
      const rings = g.querySelectorAll(".node-expanded-ring");
      rings.forEach(r => {
        r.setAttribute("x", newX - size.w/2 - 3);
        r.setAttribute("y", newY - size.h/2 - 3);
      });
      // Update connected edges in real time
      document.querySelectorAll(".fk-line").forEach(p => {
        const from = p.dataset.from, to = p.dataset.to;
        if (from === id || to === id) {
          const ap = MAP_STATE.positions[from], bp = MAP_STATE.positions[to];
          if (!ap || !bp) return;
          const boxA = nodeSize(from), boxB = nodeSize(to);
          const [sx, sy] = boxEdge(boxA, ap.x, ap.y, bp.x, bp.y);
          const [ex, ey] = boxEdge(boxB, bp.x, bp.y, ap.x, ap.y);
          p.setAttribute("d", `M${sx},${sy} L${ex},${ey}`);
        }
      });
    }
    function onUp(e) {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      g.style.cursor = "grab";
      if (!moved) {
        // Treat as click
        const now = Date.now();
        if (lastMouseTime && now - lastMouseTime < 400) {
          // Maybe dblclick — schedule a delayed click that gets canceled by dblclick
        }
        selectTable(id);
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });
  g.addEventListener("dblclick", (ev) => {
    ev.stopPropagation();
    toggleExpand(id);
  });
}

// ========== MAP RENDER ==========
function layoutAndRender() {
  const svg = $("#map-svg");
  const emptyMsg = $("#canvas-empty");
  svg.innerHTML = "";
  const W = 1100, H = 720;

  const m = modulOf(MAP_STATE.modul);
  if (!m) { emptyMsg.classList.remove("hidden"); emptyMsg.textContent = "Pick a Modul"; return; }
  if (m.status === "preview" && (m.main_tables || []).length === 0) {
    emptyMsg.classList.remove("hidden");
    const count = (DATA.modul_stats[m.key] || {}).table_count || 0;
    emptyMsg.innerHTML = `<div style="text-align:center;padding:30px"><h3 style="font-size:18px;margin-bottom:6px;color:var(--text)">${escapeHtml(m.label)}</h3><p style="color:var(--text-soft);max-width:380px;margin:0 auto 8px">${escapeHtml(m.description)}</p><p style="font-size:11px;color:var(--text-dim)">${count} tables in this modul · curation coming in a future update.</p></div>`;
    return;
  }

  // Build visible set with optional Urusan filter
  let nodeIds = visibleNodes();
  // Apply layer filter
  nodeIds = nodeIds.filter(n => {
    const td = tableData(n);
    if (!td) return false;
    if (MAP_STATE.layer === "both") return true;
    return td.layer === MAP_STATE.layer || td.layer === "neither";
  });
  if (nodeIds.length === 0) {
    emptyMsg.classList.remove("hidden");
    emptyMsg.textContent = "No tables visible with current filters.";
    return;
  }
  emptyMsg.classList.add("hidden");

  // Urusan highlight set
  const urusanSet = MAP_STATE.urusan ? urusanTables(MAP_STATE.urusan) : null;

  // Recompute active swimlanes before layout (so forceLayout's X-clamp uses correct columns)
  computeActiveSwimlanes(nodeIds);

  // Compute layout
  const edges = visibleEdges(nodeIds);
  const pos = forceLayout(nodeIds, edges, W, H);
  MAP_STATE.positions = pos;

  // Defs: arrowhead
  const defs = svgEl("defs", {});
  defs.innerHTML = `<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#888780"/></marker>`;
  svg.appendChild(defs);

  // Background: bands (Mode A) or swimlane columns (Mode B)
  const bgGroup = svgEl("g", { class: "bg-layer" });
  svg.appendChild(bgGroup);
  if (MAP_STATE.layoutMode === "swimlanes") {
    for (const lane of ACTIVE_SWIMLANES) {
      if (lane.key === "reference") continue;
      const x = lane.x0 * W, w = (lane.x1 - lane.x0) * W;
      const r = svgEl("rect", { x, y: 40, width: w, height: H - 80, rx: 10, fill: lane.color, opacity: 0.06, stroke: lane.color, "stroke-width": 0.6, "stroke-dasharray": "4 3" });
      bgGroup.appendChild(r);
      const t = svgEl("text", { x: x + w/2, y: 28, "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: lane.color, opacity: 0.85 });
      t.textContent = lane.label;
      bgGroup.appendChild(t);
    }
  }

  // Draw edges first — use actual node sizes for clean attachment
  for (const e of edges) {
    const a = pos[e.from], b = pos[e.to];
    if (!a || !b) continue;
    const boxA = nodeSize(e.from), boxB = nodeSize(e.to);
    const [sx, sy] = boxEdge(boxA, a.x, a.y, b.x, b.y);
    const [ex, ey] = boxEdge(boxB, b.x, b.y, a.x, a.y);
    const path = svgEl("path", {
      d: `M${sx},${sy} L${ex},${ey}`,
      class: "fk-line",
      stroke: "var(--text-dim)",
      "marker-end": "url(#arr)",
      "data-from": e.from, "data-to": e.to,
    });
    svg.appendChild(path);
  }

  // Draw nodes (drag-enabled, clearer urusan/selected distinction)
  for (const id of nodeIds) {
    const p = pos[id];
    const td = tableData(id);
    if (!td) continue;
    const mod = modulOf(td.modul) || modulOf("shared");
    const cat = categoryOf(td.category) || categoryOf("subsystem");
    const isMain = td.is_main || (m.main_tables || []).includes(id);
    const isShared = td.modul === "shared" && MAP_STATE.modul !== "shared";
    const isUrusanHit = urusanSet && urusanSet.has(id);
    const w = isMain ? 175 : 145;
    const h = isMain ? 56 : 44;

    const classes = ["nd"];
    if (isMain) classes.push("node-main");
    if (urusanSet && !isUrusanHit) classes.push("node-dim");
    if (urusanSet && isUrusanHit) classes.push("node-urusan-hit");
    if (MAP_STATE.expanded.has(id)) classes.push("node-anim-in");

    const g = svgEl("g", { class: classes.join(" "), "data-table": id });
    g.style.cursor = "grab";

    // Color by CATEGORY (not modul) — _p_ tables get lighter shade of same category
    const isPLayer = td.layer === "_p_";
    const fill = isPLayer ? (cat.color_p_light || cat.color_bg_light) : cat.color_bg_light;
    const stroke = cat.color;

    const r = svgEl("rect", { x: p.x - w/2, y: p.y - h/2, width: w, height: h, rx: 9, fill: fill, stroke: stroke, class: "node-rect" });
    g.appendChild(r);

    const t = svgEl("text", { x: p.x, y: p.y - 3, "text-anchor": "middle", class: "node-text", fill: cat.color });
    t.textContent = id;
    g.appendChild(t);

    const sub = svgEl("text", { x: p.x, y: p.y + 13, "text-anchor": "middle", class: "node-sub", fill: cat.color });
    sub.textContent = `\u2193${td.in} \u2191${td.out} \u00b7 ${td.cols} cols`;
    g.appendChild(sub);

    if (isMain) {
      const mark = svgEl("text", { x: p.x - w/2 + 8, y: p.y - h/2 + 14, class: "node-shared-badge", fill: cat.color });
      mark.textContent = "MAIN";
      g.appendChild(mark);
    }
    if (isShared) {
      const sb = svgEl("text", { x: p.x + w/2 - 8, y: p.y - h/2 + 14, "text-anchor": "end", class: "node-shared-badge", fill: "#888" });
      sb.textContent = "shared";
      g.appendChild(sb);
    }

    // Subtle "has children" visual cue — a thin pulse-style ring shown when the node
    // is currently expanded. No always-visible glyph (user feedback: keep the card clean).
    const childCount = (DATA.anchor_children[id] || []).length;
    if (childCount > 0 && MAP_STATE.expanded.has(id)) {
      const ring = svgEl("rect", { x: p.x - w/2 - 3, y: p.y - h/2 - 3, width: w + 6, height: h + 6, rx: 12, class: "node-expanded-ring", fill: "none", stroke: cat.color, "stroke-width": 1.5, "stroke-dasharray": "3 3", opacity: 0.55 });
      g.insertBefore(ring, g.firstChild);
    }

    attachDragAndClick(g, id, p);
    svg.appendChild(g);
  }

  // Draw category bands (Mode A): one band per category that has tables in view
  if (MAP_STATE.layoutMode === "bands") {
    const byCat = {};
    for (const id of nodeIds) {
      const td = tableData(id);
      const ck = td && td.category ? td.category : "subsystem";
      byCat[ck] = byCat[ck] || [];
      byCat[ck].push(pos[id]);
    }
    for (const [ck, points] of Object.entries(byCat)) {
      if (points.length < 1) continue;
      const cat = categoryOf(ck);
      if (!cat) continue;
      const xs = points.map(p => p.x), ys = points.map(p => p.y);
      const sz = nodeSize(nodeIds.find(id => tableData(id).category === ck) || nodeIds[0]);
      const pad = 28;
      const x0 = Math.min(...xs) - sz.w/2 - pad;
      const y0 = Math.min(...ys) - sz.h/2 - pad;
      const x1 = Math.max(...xs) + sz.w/2 + pad;
      const y1 = Math.max(...ys) + sz.h/2 + pad;
      const r = svgEl("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 14, fill: cat.color_bg_light, opacity: 0.18, stroke: cat.color, "stroke-width": 0.6, "stroke-dasharray": "4 3" });
      bgGroup.appendChild(r);
      const lbl = svgEl("text", { x: x0 + 10, y: y0 + 14, "font-size": 10, "font-weight": 600, fill: cat.color, opacity: 0.9 });
      lbl.textContent = cat.label.toUpperCase();
      bgGroup.appendChild(lbl);
    }
  }

  // Re-apply selection highlights
  if (MAP_STATE.selected) selectTable(MAP_STATE.selected, true);

  // Bg click clears selection — but ignore clicks that originated on a node
  svg.onclick = (e) => {
    if (e.target.closest(".nd")) return;
    MAP_STATE.selected = null;
    $$(".nd").forEach(n => n.classList.remove("node-selected"));
    $$(".fk-line").forEach(l => l.classList.remove("highlight", "dim"));
    renderPanel(null);
  };

  // Refresh legend + focus bar each render
  renderMapLegend();
  renderFocusBar();
}

function lighten(hex, amt) {
  // hex like #ffeedd; amt 0..1 toward white
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * amt);
  g = Math.round(g + (255 - g) * amt);
  b = Math.round(b + (255 - b) * amt);
  return `#${[r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')}`;
}

function selectTable(id, silent) {
  MAP_STATE.selected = id;
  $$(".nd").forEach(n => n.classList.remove("node-selected"));
  $$(".fk-line").forEach(l => l.classList.remove("highlight", "dim"));
  const node = document.querySelector(`.nd[data-table="${CSS.escape(id)}"]`);
  if (node) node.classList.add("node-selected");
  $$(".fk-line").forEach(l => {
    if (l.dataset.from === id || l.dataset.to === id) l.classList.add("highlight");
    else l.classList.add("dim");
  });
  renderPanel(id);
}

function toggleExpand(id) {
  if (MAP_STATE.expanded.has(id)) MAP_STATE.expanded.delete(id);
  else MAP_STATE.expanded.add(id);
  layoutAndRender();
  selectTable(id, true);
}

function renderPanel(id) {
  const panel = $("#side-panel");
  if (!id) {
    panel.innerHTML = `<div class="panel-hint">
      <p><strong>Click</strong> any table to inspect its details here.</p>
      <p class="hint-sub"><strong>Double-click</strong> a card to drill into its children. Drag a card to reposition.</p>
    </div>`;
    return;
  }
  const td = tableData(id);
  if (!td) { panel.innerHTML = `<p>Table not found.</p>`; return; }
  const mod = modulOf(td.modul) || modulOf("shared");
  const cat = categoryOf(td.category) || categoryOf("subsystem");
  const blurb = DATA.anchor_blurbs[id];
  const childrenAll = DATA.in_fk[id] || [];
  const parentsAll = DATA.out_fk[id] || [];
  const children = childrenAll.slice(0, 16);
  const parents = parentsAll.slice(0, 16);

  panel.innerHTML = `
    <div class="panel-table-name">${escapeHtml(id)}</div>
    <div class="panel-badges">
      <span class="badge" style="background:${cat.color_bg_light};color:${cat.color}">${escapeHtml(cat.label)}</span>
      <span class="badge" style="background:${mod.color_bg_light};color:${mod.color}">${escapeHtml(mod.label)}</span>
      <span class="badge" style="background:var(--surface-2);color:var(--text-dim)">layer ${escapeHtml(td.layer)}</span>
      ${td.is_main ? '<span class="badge badge-main">main table</span>' : ''}
    </div>
    ${blurb ? `<p class="panel-blurb">${escapeHtml(blurb)}</p>` : ""}
    ${td.comment ? `<p class="panel-blurb" style="font-style:italic;color:var(--text-dim)">${escapeHtml(td.comment)}</p>` : ""}
    <div class="panel-stats">
      <div class="panel-stat"><span class="num">${td.in}</span><span class="lbl">incoming FK</span></div>
      <div class="panel-stat"><span class="num">${td.out}</span><span class="lbl">outgoing FK</span></div>
      <div class="panel-stat"><span class="num">${td.cols}</span><span class="lbl">columns</span></div>
    </div>
    <div class="panel-section">
      <h4>Children (referenced by, ${childrenAll.length})</h4>
      <ul class="panel-list">${children.map(c => `<li data-open="${escapeAttr(c.from)}"><span>${escapeHtml(c.from)}</span><span class="colhint">.${escapeHtml(c.col)}</span></li>`).join("") || "<li><em>None.</em></li>"}</ul>
    </div>
    <div class="panel-section">
      <h4>Points to (outgoing FK, ${parentsAll.length})</h4>
      <ul class="panel-list">${parents.map(p => `<li data-open="${escapeAttr(p.to)}"><span>${escapeHtml(p.to)}</span><span class="colhint">.${escapeHtml(p.col)}</span></li>`).join("") || "<li><em>None.</em></li>"}</ul>
    </div>
  `;
  panel.querySelectorAll("[data-open]").forEach(el => {
    el.addEventListener("click", () => selectTable(el.dataset.open));
  });
}

// ========== MAP-TAB CATEGORY LEGEND ==========
function renderMapLegend() {
  const wrap = $("#map-legend");
  if (!wrap) return;
  const cats = DATA.categories || [];
  if (cats.length === 0) { wrap.innerHTML = ""; return; }
  wrap.innerHTML = cats.map(c => `
    <span class="legend-chip" title="${escapeAttr(c.label)}">
      <span class="legend-swatch" style="background:${c.color_bg_light};border-color:${c.color}"></span>
      <span class="legend-label">${escapeHtml(c.label)}</span>
    </span>
  `).join("");
}

// ========== FOCUS-MODE BAR ==========
// When any table is expanded, show a small bar that lets the user clear focus easily.
function renderFocusBar() {
  const bar = $("#focus-bar");
  if (!bar) return;
  if (!MAP_STATE.expanded || MAP_STATE.expanded.size === 0) {
    bar.classList.add("hidden");
    bar.innerHTML = "";
    return;
  }
  const names = Array.from(MAP_STATE.expanded);
  const chips = names.map(n => `<span class="focus-chip">${escapeHtml(n)}<button class="focus-chip-x" data-collapse="${escapeAttr(n)}" title="Collapse ${escapeAttr(n)}">×</button></span>`).join("");
  bar.classList.remove("hidden");
  bar.innerHTML = `<span class="focus-bar-label">Focused on:</span> ${chips} <button class="btn focus-bar-clear" id="btn-clear-focus">Clear focus</button>`;
  bar.querySelectorAll("[data-collapse]").forEach(el => {
    el.addEventListener("click", () => {
      MAP_STATE.expanded.delete(el.dataset.collapse);
      layoutAndRender();
    });
  });
  const clearBtn = bar.querySelector("#btn-clear-focus");
  if (clearBtn) clearBtn.addEventListener("click", () => {
    MAP_STATE.expanded = new Set();
    layoutAndRender();
  });
}

// ========== CONTROLS WIRING ==========
$("#ctl-modul").addEventListener("change", (e) => {
  MAP_STATE.modul = e.target.value;
  MAP_STATE.expanded = new Set();
  MAP_STATE.selected = null;
  MAP_STATE.pinned = false;
  layoutAndRender();
});
$("#ctl-urusan").addEventListener("change", (e) => {
  MAP_STATE.urusan = e.target.value;
  layoutAndRender();
});
$$("#ctl-layer .seg-btn").forEach(b => {
  b.addEventListener("click", () => {
    $$("#ctl-layer .seg-btn").forEach(x => x.classList.toggle("active", x === b));
    MAP_STATE.layer = b.dataset.layer;
    layoutAndRender();
  });
});
// Layout-mode toggle
$$("#ctl-layout-mode .seg-btn").forEach(b => {
  if (b.dataset.mode === MAP_STATE.layoutMode) b.classList.add("active");
  else b.classList.remove("active");
  b.addEventListener("click", () => {
    $$("#ctl-layout-mode .seg-btn").forEach(x => x.classList.toggle("active", x === b));
    MAP_STATE.layoutMode = b.dataset.mode;
    MAP_STATE.pinned = false;  // re-compute layout on mode switch
    try { localStorage.setItem("etanah-layout-mode", MAP_STATE.layoutMode); } catch(e){}
    layoutAndRender();
  });
});
$("#btn-pin").addEventListener("click", () => {
  MAP_STATE.pinned = true;
  try { localStorage.setItem("etanah-positions-" + MAP_STATE.modul, JSON.stringify(MAP_STATE.positions)); } catch(e){}
  $("#btn-pin").textContent = "Pinned ✓";
  setTimeout(() => $("#btn-pin").textContent = "Pin layout", 1500);
});
$("#btn-reset").addEventListener("click", () => {
  MAP_STATE.pinned = false;
  MAP_STATE.positions = {};
  try { localStorage.removeItem("etanah-positions-" + MAP_STATE.modul); } catch(e){}
  layoutAndRender();
});
$("#btn-print-map").addEventListener("click", () => window.print());
$("#btn-print-urusan").addEventListener("click", () => window.print());

// Restore pinned positions on modul change
function restorePinned() {
  try {
    const raw = localStorage.getItem("etanah-positions-" + MAP_STATE.modul);
    if (raw) { MAP_STATE.positions = JSON.parse(raw); MAP_STATE.pinned = true; }
  } catch(e){}
}

// ========== URUSAN JOURNEY VIEW ==========
const FORK_CHOICE = {};  // kod -> chosen outcome kind

function forkOutcomeColor(kind) {
  return kind === "lulus" ? "#0F6E56" : kind === "tolak" ? "#b91c1c" : "#b45309";
}

function renderUrusanView() {
  const wrap = $("#urusan-content");
  const primary = $("#urusan-picker").value;
  const compareSet = new Set(
    Array.from($$("#urusan-compare .uc-chip.on")).map(c => c.dataset.kod).filter(k => k !== primary)
  );
  const list = [primary, ...compareSet].filter(Boolean);
  if (list.length === 0) {
    wrap.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:30px">Pick a Urusan above to see its workflow journey.</p>`;
    return;
  }
  const colClass = list.length === 1 ? "col-1" : list.length === 2 ? "col-2" : "col-3";
  const cols = list.map(kod => {
    const u = DATA.urusans.find(x => x.kod === kod);
    if (!u) return `<div class="uj-col">Urusan ${escapeHtml(kod)} not found.</div>`;
    const parts = [];
    for (const s of u.stages) {
      parts.push(`
      <div class="uj-stage">
        <div class="uj-stage-dot"${s.fork ? ' style="background:#534AB7"' : ''}></div>
        <div>
          <div class="uj-stage-name">${escapeHtml(s.name)}</div>
          <div class="uj-stage-tables">${(s.tables || []).map(escapeHtml).join(", ")}</div>
        </div>
      </div>`);
      if (s.fork && (s.fork.outcomes || []).length > 1) {
        const chosen = FORK_CHOICE[u.kod] || s.fork.default || s.fork.outcomes[0].kind;
        const btns = s.fork.outcomes.map(o => `
          <button class="fork-btn ${o.kind === chosen ? "on" : ""}" data-kod="${escapeAttr(u.kod)}" data-kind="${escapeAttr(o.kind)}"
            style="--fork-color:${forkOutcomeColor(o.kind)}">${escapeHtml(o.label)}</button>`).join("");
        parts.push(`<div class="uj-fork-selector"><span class="uj-fork-label">Keputusan:</span>${btns}</div>`);
        const outcome = s.fork.outcomes.find(o => o.kind === chosen) || s.fork.outcomes[0];
        const oc = forkOutcomeColor(outcome.kind);
        for (const st of (outcome.steps || [])) {
          parts.push(`
          <div class="uj-stage uj-fork-stage" style="--fork-color:${oc}">
            <div class="uj-stage-dot" style="background:${oc}"></div>
            <div>
              <div class="uj-stage-name">${escapeHtml(st.name)}</div>
              <div class="uj-stage-tables">${(st.tables || []).map(escapeHtml).join(", ")}</div>
            </div>
          </div>`);
        }
        if (outcome.end) parts.push(`<div class="uj-terminal" style="--fork-color:${oc}">◼ ${escapeHtml(outcome.end)}</div>`);
        if (outcome.loop) parts.push(`<div class="uj-terminal uj-loop" style="--fork-color:${oc}">↺ ${escapeHtml(outcome.loop)}</div>`);
      }
    }
    return `
      <div class="uj-col">
        <div class="uj-header">
          <h3>${escapeHtml(u.kod)}</h3>
          <div class="english">${escapeHtml(u.name)}</div>
          <div class="section">${escapeHtml(u.english)}${u.section ? " · " + escapeHtml(u.section) : ""}</div>
        </div>
        <p class="uj-desc">${escapeHtml(u.description)}</p>
        ${u.notes ? `<details class="uj-notes"><summary>⟲ Unhappy-path notes (pembetulan / early-reject / modeling gaps)</summary><p>${escapeHtml(typeof u.notes === "string" ? u.notes : String(u.notes))}</p></details>` : ""}
        <div class="uj-stages">${parts.join("")}</div>
      </div>`;
  }).join("");
  wrap.innerHTML = `<div class="urusan-grid ${colClass}">${cols}</div>`;
  wrap.querySelectorAll(".fork-btn").forEach(b => {
    b.addEventListener("click", () => {
      FORK_CHOICE[b.dataset.kod] = b.dataset.kind;
      renderUrusanView();
    });
  });
}
$("#urusan-picker").addEventListener("change", renderUrusanView);

// ========== TABLES VIEW (search + link-graph + columns) ==========
// Three sub-tabs, one purpose each:
//   Diagram  — know the table -> its link diagram + columns (search goes straight there)
//   Catalog  — browse what exists, filtered by modul/layer
//   By Urusan — stage-grouped tables per urusan (+ tugasan loads/saves)
const TBL_STATE = {
  sub: "diagram",
  selected: null,
  highlightCol: null,
  cameFrom: "diagram",
  chipSpoc: false,
  chipHk: false,
  showImplicit: true,
  showHk: false,
  codeScope: "pelupusan",   // code-truth filter: which module's CODE must use a table (from build/code_usage.json)
};

function scopePass(name) {
  if (!TBL_STATE.codeScope) return true;
  const td = tableData(name);
  if (!td) return true;
  const ub = td.used_by || [];
  if (TBL_STATE.codeScope === "pel-common") return ub.includes("pelupusan") || ub.includes("common");
  return ub.includes(TBL_STATE.codeScope);
}

function isHousekeepingName(n) {
  return /(_backup|_bak|_masked|_test|_tmp|_old|_cutover|_delete)$/.test(n) ||
         /_20[0-9][0-9]$/.test(n) ||
         /^(tkr_|mig|sptb_|toad_|tmp_|dm_|mlk_|msk_|delta_|stage_|ubah_|proses_)/.test(n);
}

function urusanStageIndex(kod) {
  const u = DATA.urusans.find(x => x.kod === kod);
  const idx = {};
  if (!u) return idx;
  const add = (t, label) => { if (t.includes("*")) return; (idx[t] = idx[t] || []).push(label); };
  for (const s of u.stages) {
    (s.tables || []).forEach(t => add(t, s.name));
    if (s.fork) for (const o of s.fork.outcomes || []) {
      (o.steps || []).forEach(st => (st.tables || []).forEach(t => add(t, `${o.label}: ${st.name}`)));
    }
  }
  return idx;
}

function tugasanOf(kod) { return (DATA.tugasans || []).find(t => t.kod === kod); }

function censusTugasans(ursn) {
  return (DATA.tugasan_census || []).filter(t => t.urusan === ursn)
    .sort((a, b) => (a.turutan || 0) - (b.turutan || 0) || a.kod.localeCompare(b.kod));
}
function censusTugasanOf(ursn, kod) {
  return (DATA.tugasan_census || []).find(t => t.urusan === ursn && t.kod === kod);
}
// Table sets for a census tugasan: union of its screens' traced loads/saves,
// plus the per-tugasan pilot trace when one exists for this kod.
function tugasanTableSets(ct) {
  const loads = new Set(), saves = new Set();
  let traced = 0;
  const screens = (ct && ct.screens) || [];
  for (const s of screens) {
    const st = (DATA.screen_tables || {})[s.jsf];
    if (!st) continue;
    traced++;
    (st.loads || []).forEach(x => loads.add(x.table));
    (st.saves || []).forEach(x => saves.add(x.table));
  }
  const pilot = ct ? (DATA.tugasans || []).find(p => p.kod === ct.kod && (p.urusan || "PT") === ct.urusan) : null;
  if (pilot) {
    (pilot.loads || []).forEach(x => loads.add(x.table));
    (pilot.saves || []).forEach(x => saves.add(x.table));
  }
  return { loads, saves, traced, total: screens.length, pilot };
}

let ALL_COLUMN_NAMES = null;
function allColumnNames() {
  if (ALL_COLUMN_NAMES) return ALL_COLUMN_NAMES;
  const s = new Set();
  for (const t of DATA.tables) for (const c of (t.columns || [])) s.add(c.n);
  ALL_COLUMN_NAMES = Array.from(s).sort();
  return ALL_COLUMN_NAMES;
}

// ---- suggestion dropdown (shared by both inputs) ----
function attachSuggest(input, boxId, getItems, onPick) {
  const box = document.getElementById(boxId);
  let items = [], active = -1;
  function close() { box.classList.add("hidden"); box.innerHTML = ""; items = []; active = -1; }
  function render() {
    if (items.length === 0) { close(); return; }
    box.innerHTML = items.map((it, i) =>
      `<div class="suggest-item ${i === active ? "active" : ""}" data-i="${i}">${it.html}</div>`).join("");
    box.classList.remove("hidden");
    box.querySelectorAll(".suggest-item").forEach(el => {
      el.addEventListener("mousedown", (ev) => { ev.preventDefault(); pick(+el.dataset.i); });
    });
  }
  function pick(i) { const it = items[i]; if (!it) return; close(); onPick(it); }
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { close(); return; }
    items = getItems(q).slice(0, 12);
    active = -1;
    render();
  });
  input.addEventListener("keydown", (e) => {
    if (box.classList.contains("hidden")) return;
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(items.length - 1, active + 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(0, active - 1); render(); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(active); }
    else if (e.key === "Escape") { close(); }
  });
  input.addEventListener("blur", () => setTimeout(close, 120));
}

function rankMatches(names, q) {
  const pre = [], sub = [];
  for (const n of names) {
    const ln = n.toLowerCase();
    if (ln.startsWith(q)) pre.push(n);
    else if (ln.includes(q)) sub.push(n);
    if (pre.length > 24) break;
  }
  return pre.concat(sub);
}

// ---- sub-tab switching ----
function selectSubTab(name) {
  TBL_STATE.sub = name;
  $$("#tbl-subtabs .subtab").forEach(b => b.classList.toggle("active", b.dataset.sub === name));
  ["diagram", "catalog", "urusan", "feature"].forEach(k => {
    document.getElementById("sub-" + k).classList.toggle("hidden", k !== name);
  });
}

function selectSideTab(paneId) {
  $$("#tf-side-tabs .sidetab").forEach(b => b.classList.toggle("active", b.dataset.st === paneId));
  $$("#table-focus .st-pane").forEach(p => p.classList.toggle("hidden", p.id !== paneId));
}

function setupSearch() {
  const input = $("#search-input");
  const colInput = $("#col-search-input");
  const catInput = $("#catalog-input");
  const mSel = $("#search-modul");
  const lSel = $("#search-layer");
  const out = $("#search-results");
  const cnt = $("#search-count");
  const hint = $("#filter-hint");
  const ubU = $("#ub-urusan");
  const ubT = $("#ub-tugasan");

  // sub-tab wiring
  $$("#tbl-subtabs .subtab").forEach(b => b.addEventListener("click", () => selectSubTab(b.dataset.sub)));
  $$("#diagram-empty [data-goto-sub]").forEach(b => b.addEventListener("click", () => selectSubTab(b.dataset.gotoSub)));

  // urusan options (By Urusan sub-tab)
  DATA.urusans.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.kod; opt.textContent = `${u.kod} · ${u.name}`;
    ubU.appendChild(opt);
  });
  function rebuildTugasanOptions() {
    const scoped = ubU.value ? censusTugasans(ubU.value) : [];
    ubT.innerHTML = "";
    const first = document.createElement("option");
    first.value = "";
    first.textContent = ubU.value ? `(all — ${scoped.length} tugasan)` : "(pick an urusan first)";
    ubT.appendChild(first);
    scoped.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.kod; opt.textContent = `${t.kod} · ${t.name || ""}`.trim();
      ubT.appendChild(opt);
    });
    ubT.disabled = scoped.length === 0;
  }
  rebuildTugasanOptions();

  // ---- DIAGRAM sub-tab: search -> hits list or straight focus ----
  function diagramState(which) {
    // which: "empty" | "hits" | "focus"
    $("#diagram-empty").classList.toggle("hidden", which !== "empty");
    $("#diagram-hits").classList.toggle("hidden", which !== "hits");
    $("#table-focus").classList.toggle("hidden", which !== "focus");
  }
  TBL_STATE.diagramState = diagramState;

  function renderTableHits(q) {
    const names = rankMatches(DATA.tables.filter(t => scopePass(t.name)).map(t => t.name), q).slice(0, 30);
    if (names.length === 0) {
      $("#diagram-hits").innerHTML = `<p class="tf-empty">No table matches "${escapeHtml(q)}".</p>`;
      diagramState("hits"); return;
    }
    $("#diagram-hits").innerHTML = names.map(n => {
      const t = tableData(n);
      const mod = t ? modulOf(t.modul) : null;
      return `<div class="cc-hit" data-open="${escapeAttr(n)}">
        <span class="cc-col">${escapeHtml(n)}</span>
        <span class="cc-table" style="color:${mod ? mod.color : 'inherit'}">${escapeHtml(mod ? mod.label : "")}</span>
        <span class="cc-type">${t ? t.cols + " cols · ↓" + t.in + " ↑" + t.out : ""}</span>
      </div>`;
    }).join("");
    diagramState("hits");
    $("#diagram-hits").querySelectorAll(".cc-hit").forEach(el =>
      el.addEventListener("click", () => focusTable(el.dataset.open, null, "diagram")));
  }

  function renderColumnHits(cq) {
    const hits = [];
    for (const t of DATA.tables) {
      if (!TBL_STATE.showHk && isHousekeepingName(t.name)) continue;
      if (!scopePass(t.name)) continue;
      for (const c of (t.columns || [])) {
        if (c.n.toLowerCase().includes(cq)) hits.push({ t, c });
        if (hits.length > 300) break;
      }
      if (hits.length > 300) break;
    }
    $("#diagram-hits").innerHTML = (hits.slice(0, 300).map(h => {
      const mod = modulOf(h.t.modul);
      const isPk = (h.t.pk || []).includes(h.c.n);
      const fk = (DATA.out_fk[h.t.name] || []).find(e => e.col === h.c.n);
      const imp = (DATA.implicit_out[h.t.name] || []).find(e => e.col === h.c.n);
      return `<div class="cc-hit" data-open="${escapeAttr(h.t.name)}" data-col="${escapeAttr(h.c.n)}">
        <span class="cc-col">${escapeHtml(h.c.n)}</span>
        <span class="cc-table" style="color:${mod ? mod.color : 'inherit'}">${escapeHtml(h.t.name)}</span>
        <span class="cc-type">${escapeHtml(h.c.t)}</span>
        ${isPk ? '<span class="pk-badge">PK</span>' : ''}
        ${fk ? `<span class="fk-badge">FK → ${escapeHtml(fk.to)}</span>` : ''}
        ${imp && TBL_STATE.showImplicit ? `<span class="imp-badge" title="name-matched link, no declared FK (${imp.status})">⇢ ${escapeHtml(imp.to)}</span>` : ''}
      </div>`;
    }).join("")) || `<p class="tf-empty">No columns match "${escapeHtml(cq)}".</p>`;
    diagramState("hits");
    $("#diagram-hits").querySelectorAll(".cc-hit").forEach(el =>
      el.addEventListener("click", () => focusTable(el.dataset.open, el.dataset.col, "diagram")));
  }

  attachSuggest(input, "table-suggest",
    (q) => rankMatches(DATA.tables.filter(t => scopePass(t.name)).map(t => t.name), q).map(n => {
      const t = tableData(n);
      return { value: n, html: `<span class="s-name">${escapeHtml(n)}</span><span class="s-meta">${t ? t.cols + " cols · ↓" + t.in : ""}</span>` };
    }),
    (it) => { input.value = it.value; focusTable(it.value, null, "diagram"); });
  attachSuggest(colInput, "col-suggest",
    (q) => rankMatches(allColumnNames(), q).map(n => ({ value: n, html: `<span class="s-name">${escapeHtml(n)}</span>` })),
    (it) => { colInput.value = it.value; input.value = ""; renderColumnHits(it.value.toLowerCase()); });

  input.addEventListener("input", () => {
    if (input.value) colInput.value = "";
    const q = input.value.trim().toLowerCase();
    if (!q) { diagramState("empty"); return; }
    const exact = DATA.tables.find(t => t.name === q);
    if (exact) { focusTable(exact.name, null, "diagram"); return; }
    if (q.length >= 2) renderTableHits(q);
  });
  colInput.addEventListener("input", () => {
    if (colInput.value) input.value = "";
    const cq = colInput.value.trim().toLowerCase();
    if (!cq) { diagramState("empty"); return; }
    if (cq.length >= 2) renderColumnHits(cq);
  });

  // ---- CATALOG sub-tab ----
  function tablePassesFilters(t) {
    // Modul filter keeps shared tables visible — shared (umm_/ind_/rjk_/pcp_) is used by EVERY modul
    if (mSel.value && t.modul !== mSel.value && t.modul !== "shared") return false;
    if (lSel.value && t.layer !== lSel.value) return false;
    if (TBL_STATE.chipSpoc && !t.name.startsWith("spc_")) return false;
    if (!TBL_STATE.chipHk && isHousekeepingName(t.name)) return false;
    if (TBL_STATE.chipHk && !isHousekeepingName(t.name)) return false;
    return true;
  }

  function runCatalog() {
    hint.textContent = "";
    const q = catInput.value.trim().toLowerCase();
    const nameMatch = (t) => !q || t.name.toLowerCase().includes(q) || (t.comment || "").toLowerCase().includes(q);
    let matched = DATA.tables.filter(t => nameMatch(t) && tablePassesFilters(t) && scopePass(t.name));
    if (q) {
      const unfiltered = DATA.tables.filter(nameMatch).length;
      if (unfiltered > matched.length) {
        hint.textContent = `${unfiltered - matched.length} match${unfiltered - matched.length === 1 ? "" : "es"} hidden by filters`;
      }
    }
    matched.sort((a, b) => {
      if ((b.is_main ? 1 : 0) !== (a.is_main ? 1 : 0)) return (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0);
      if (a.in !== b.in) return b.in - a.in;
      return a.name.localeCompare(b.name);
    });
    cnt.textContent = `${matched.length} match${matched.length === 1 ? "" : "es"}`;
    const cap = matched.slice(0, 300);
    out.innerHTML = cap.map(t => {
      const mod = modulOf(t.modul);
      return `<div class="tc" data-open="${escapeAttr(t.name)}">
        <div class="tc-name"><span class="tc-name-text">${escapeHtml(t.name)}</span>${t.is_main ? '<span class="tc-main-mark">MAIN</span>' : ''}</div>
        <div class="tc-meta">
          <span class="tc-modul" style="background:${mod?mod.color_bg_light:'#eee'};color:${mod?mod.color:'#333'}">${escapeHtml(mod?mod.label:t.modul)}</span>
          <span>layer ${escapeHtml(t.layer)}</span>
          <span>${t.cols} cols · ↓${t.in} ↑${t.out}</span>
        </div>
        <div class="tc-comment">${escapeHtml(t.comment || '—')}</div>
      </div>`;
    }).join("");
    if (matched.length > 300) out.innerHTML += `<p style="grid-column:1/-1;font-size:11px;color:var(--text-dim);padding:12px">Showing first 300 of ${matched.length}. Narrow your search.</p>`;
    out.querySelectorAll(".tc").forEach(c => {
      c.addEventListener("click", () => focusTable(c.dataset.open, null, "catalog"));
    });
  }
  TBL_STATE.runCatalog = runCatalog;

  catInput.addEventListener("input", runCatalog);
  mSel.addEventListener("change", runCatalog);
  lSel.addEventListener("change", runCatalog);
  $("#chip-spoc").addEventListener("click", () => {
    TBL_STATE.chipSpoc = !TBL_STATE.chipSpoc;
    if (TBL_STATE.chipSpoc) TBL_STATE.chipHk = false;
    syncChips(); runCatalog();
  });
  $("#chip-hk").addEventListener("click", () => {
    TBL_STATE.chipHk = !TBL_STATE.chipHk;
    if (TBL_STATE.chipHk) TBL_STATE.chipSpoc = false;
    syncChips(); runCatalog();
  });
  function syncChips() {
    $("#chip-spoc").classList.toggle("on", TBL_STATE.chipSpoc);
    $("#chip-hk").classList.toggle("on", TBL_STATE.chipHk);
  }
  $("#filters-reset").addEventListener("click", () => {
    catInput.value = ""; mSel.value = ""; lSel.value = "";
    TBL_STATE.chipSpoc = false; TBL_STATE.chipHk = false;
    syncChips(); runCatalog();
  });

  // ---- BY URUSAN sub-tab ----
  function renderUrusanBrowse() {
    const wrap = $("#urusan-browse");
    const kod = ubU.value;
    const cntEl = $("#ub-count");
    if (!kod) {
      wrap.innerHTML = `<div class="card diagram-empty"><p>Pick an urusan to see its tables grouped by stage. Pick a tugasan to see what that step LOADS and SAVES (pilot: PT).</p></div>`;
      cntEl.textContent = "";
      return;
    }
    const u = DATA.urusans.find(x => x.kod === kod);
    const ct = ubT.value ? censusTugasanOf(kod, ubT.value) : null;
    let tgTables = null, tgDetail = "";
    if (ct) {
      const sets = tugasanTableSets(ct);
      if (sets.loads.size || sets.saves.size) {
        tgTables = {};
        sets.loads.forEach(t => { (tgTables[t] = tgTables[t] || new Set()).add("loads"); });
        sets.saves.forEach(t => { (tgTables[t] = tgTables[t] || new Set()).add("saves"); });
      }
      const screenRows = (ct.screens || []).map(s => {
        const st = (DATA.screen_tables || {})[s.jsf];
        const base = s.jsf.split("/").pop();
        const app = s.app || "etanah-common";
        const badge = st
          ? `<span class="tg-badge tg-loads">${(st.loads || []).length} loaded</span> <span class="tg-badge tg-saves">${(st.saves || []).length} saved</span>`
          : (app === "etanah-pelupusan" || app === "etanah-common"
              ? '<span class="ub-untraced">tables not yet traced</span>'
              : `<span class="ub-untraced">${escapeHtml(app)} — module not in local checkout</span>`);
        return `<div class="ub-screen-row"><code>${escapeHtml(base)}</code> <span class="ub-app">${escapeHtml(app)}</span> ${badge}</div>`;
      }).join("") || '<div class="ub-screen-row"><em>No screen recorded in ind_langkah for this tugasan.</em></div>';
      tgDetail = `<div class="card ub-tg-detail">
        <div class="ub-tg-head"><strong>${escapeHtml(ct.kod)}</strong> · ${escapeHtml(ct.name)} <span class="ub-app">peranan: ${escapeHtml(ct.peranan || "—")}</span></div>
        ${screenRows}
        ${tgTables ? "" : '<div class="ub-untraced-note">No table trace available yet for this tugasan’s screens — stage chips below are NOT dimmed.</div>'}
      </div>`;
    }
    const seen = new Set();
    function chip(t) {
      seen.add(t);
      const badge = tgTables && tgTables[t]
        ? Array.from(tgTables[t]).map(k => `<span class="tg-badge tg-${k}">${k === "loads" ? "LOADED" : "SAVED"}</span>`).join("") : "";
      const dim = tgTables && !tgTables[t] ? " ub-dim" : "";
      return `<button class="ub-chip${dim}" data-open="${escapeAttr(t)}">${escapeHtml(t)}${badge}</button>`;
    }
    const parts = [];
    for (const s of u.stages) {
      const tables = (s.tables || []).filter(t => !t.includes("*"));
      parts.push(`<details class="ub-stage" open>
        <summary>${escapeHtml(s.name)} <span class="tf-flow-n">${tables.length}</span></summary>
        <div class="ub-chips">${tables.map(chip).join("") || '<span class="tf-empty">no tables recorded</span>'}</div>
      </details>`);
      if (s.fork && (s.fork.outcomes || []).length > 1) {
        for (const o of s.fork.outcomes) {
          const oc = forkOutcomeColor(o.kind);
          const oTables = [];
          (o.steps || []).forEach(st => (st.tables || []).forEach(t => { if (!t.includes("*") && !oTables.includes(t)) oTables.push(t); }));
          parts.push(`<details class="ub-stage ub-outcome" style="--fork-color:${oc}">
            <summary>${escapeHtml(o.label)} tail <span class="tf-flow-n">${oTables.length}</span></summary>
            <div class="ub-chips">${oTables.map(chip).join("") || '<span class="tf-empty">no tables recorded</span>'}</div>
          </details>`);
        }
      }
    }
    wrap.innerHTML = tgDetail + parts.join("");
    cntEl.textContent = `${seen.size} distinct tables`;
    wrap.querySelectorAll(".ub-chip").forEach(el =>
      el.addEventListener("click", () => focusTable(el.dataset.open, null, "urusan")));
  }
  TBL_STATE.renderUrusanBrowse = renderUrusanBrowse;

  ubU.addEventListener("change", () => { rebuildTugasanOptions(); renderUrusanBrowse(); });
  ubT.addEventListener("change", renderUrusanBrowse);

  // ---- BY FEATURE sub-tab (feature_tables.json — DB-verified 12-group split) ----
  const bfSel = $("#bf-feature");
  function renderFeatureBrowse() {
    const wrap = $("#feature-browse");
    const key = bfSel.value;
    const ft = DATA.feature_tables || { tables: [], unassigned: [], summary: {} };
    const meta = (DATA.feature_meta || {})[key] || { title: key, purpose: "" };
    if (!key) {
      const s = ft.summary || {};
      wrap.innerHTML = `<div class="card diagram-empty"><p><strong>Pick a feature</strong> — the DB split by verified feature group.</p>
        <p class="de-sub">${s.total_db || 0} tables checked against ${escapeHtml(ft.schema_checked || "mlit")} · ${s.assigned || 0} assigned · ${s.unassigned || 0} honestly unassigned.</p></div>`;
      $("#bf-count").textContent = "";
      return;
    }
    let rows;
    if (key === "unassigned") {
      rows = (ft.unassigned || []).map(u => ({ table: u.table, features: [], assigned_by: "unassigned (" + u.prefix + ")", rows_est: -1 }));
    } else {
      rows = (ft.tables || []).filter(t => t.features.includes(key));
    }
    rows.sort((a, b) => (b.rows_est || 0) - (a.rows_est || 0));
    $("#bf-count").textContent = `${rows.length} tables`;
    const fmt = (n) => n < 0 ? "?" : n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : n >= 1000 ? (n / 1000).toFixed(0) + "k" : String(n);
    wrap.innerHTML = `
      <div class="card ub-tg-detail">
        <div class="ub-tg-head"><strong>${escapeHtml(meta.title)}</strong></div>
        <div class="ub-screen-row">${escapeHtml(meta.purpose)}</div>
      </div>
      <div class="card fam-section"><div class="ub-chips">${rows.map(r =>
        `<button class="ub-chip" data-open="${escapeAttr(r.table)}" title="${escapeAttr(r.assigned_by)}">${escapeHtml(r.table)}<span class="ub-app">${fmt(r.rows_est)} rows</span></button>`).join("") || '<span class="tf-empty">no tables in this group</span>'}</div></div>`;
    wrap.querySelectorAll(".ub-chip").forEach(el =>
      el.addEventListener("click", () => focusTable(el.dataset.open, null, "feature")));
  }
  {
    const ft = DATA.feature_tables || { tables: [] };
    const counts = {};
    (ft.tables || []).forEach(t => t.features.forEach(f => { counts[f] = (counts[f] || 0) + 1; }));
    const first = document.createElement("option");
    first.value = ""; first.textContent = "(pick a feature group)";
    bfSel.appendChild(first);
    Object.keys(counts).sort((a, b) => counts[b] - counts[a]).forEach(k => {
      const o = document.createElement("option");
      o.value = k; o.textContent = `${((DATA.feature_meta || {})[k] || {}).title || k} (${counts[k]})`;
      bfSel.appendChild(o);
    });
    if ((ft.unassigned || []).length) {
      const o = document.createElement("option");
      o.value = "unassigned"; o.textContent = `Unassigned (${ft.unassigned.length})`;
      bfSel.appendChild(o);
    }
    bfSel.addEventListener("change", renderFeatureBrowse);
    renderFeatureBrowse();
  }

  // ---- sidebar tabs (focus view) ----
  $$("#tf-side-tabs .sidetab").forEach(b =>
    b.addEventListener("click", () => selectSideTab(b.dataset.st)));

  // ---- family browse (name-stem groups: hkmlk, tgsn, warta, …) ----
  const famSel = $("#dg-family");
  (DATA.families || []).forEach(f => {
    const o = document.createElement("option");
    o.value = f.key; o.textContent = `${f.key} (${f.count})`;
    famSel.appendChild(o);
  });
  function renderFamilyView(key) {
    const fam = (DATA.families || []).find(f => f.key === key);
    if (!fam) { diagramState("empty"); return; }
    const members = fam.tables.filter(t => (TBL_STATE.showHk || !isHousekeepingName(t)) && scopePass(t));
    const memberSet = new Set(members);
    let internalFk = 0, internalImp = 0;
    for (const m of members) {
      (DATA.out_fk[m] || []).forEach(e => { if (memberSet.has(e.to)) internalFk++; });
      if (TBL_STATE.showImplicit) (DATA.implicit_out[m] || []).forEach(e => { if (memberSet.has(e.to)) internalImp++; });
    }
    const byModul = {};
    members.forEach(m => {
      const td = tableData(m);
      const k = td ? td.modul : "?";
      (byModul[k] = byModul[k] || []).push(m);
    });
    const sections = Object.entries(byModul).sort((a, b) => b[1].length - a[1].length).map(([mk, list]) => {
      const mod = modulOf(mk);
      return `<div class="fam-section">
        <div class="fam-sec-h" style="color:${mod ? mod.color : 'inherit'}">${escapeHtml(mod ? mod.label : mk)} <span class="tf-flow-n">${list.length}</span></div>
        <div class="ub-chips">${list.map(m => {
          const td = tableData(m);
          return `<button class="ub-chip" data-open="${escapeAttr(m)}">${escapeHtml(m)}<span class="ub-app">↓${td ? td.in : "?"} ↑${td ? td.out : "?"}</span></button>`;
        }).join("")}</div>
      </div>`;
    }).join("");
    $("#diagram-hits").innerHTML = `
      <div class="fam-head"><strong>${escapeHtml(key)}</strong> family — ${members.length} tables ·
      ${internalFk} FK links inside the family${TBL_STATE.showImplicit ? ` · ${internalImp} implicit` : ""} · click a table for its diagram</div>
      ${sections}`;
    diagramState("hits");
    $("#diagram-hits").querySelectorAll(".ub-chip").forEach(el =>
      el.addEventListener("click", () => focusTable(el.dataset.open, null, "diagram")));
  }
  famSel.addEventListener("change", () => {
    input.value = ""; colInput.value = "";
    if (famSel.value) renderFamilyView(famSel.value); else diagramState("empty");
  });
  TBL_STATE.renderFamilyView = renderFamilyView;

  // ---- code-scope selects (Diagram + Catalog share one state) ----
  const dgScope = $("#dg-scope");
  const catScope = $("#cat-scope");
  function onScopeChange(v) {
    TBL_STATE.codeScope = v;
    dgScope.value = v; catScope.value = v;
    if (TBL_STATE.selected) refreshFocus();
    else if (famSel.value) renderFamilyView(famSel.value);
    else { const q = input.value.trim().toLowerCase(); if (q.length >= 2) renderTableHits(q); }
    const cq = colInput.value.trim().toLowerCase();
    if (cq.length >= 2) renderColumnHits(cq);
    runCatalog();
  }
  dgScope.addEventListener("change", () => onScopeChange(dgScope.value));
  catScope.addEventListener("change", () => onScopeChange(catScope.value));

  // ---- diagram toggles / back / modal ----
  $("#tf-back").addEventListener("click", () => {
    if (TBL_STATE.cameFrom && TBL_STATE.cameFrom !== "diagram") {
      const target = TBL_STATE.cameFrom;
      clearFocus();
      selectSubTab(target);
    } else {
      clearFocus();
      const q = input.value.trim().toLowerCase();
      if (famSel.value) renderFamilyView(famSel.value);
      else if (q.length >= 2) renderTableHits(q);
      else diagramState("empty");
    }
  });
  TBL_STATE.renderTableHits = renderTableHits;
  $("#tf-show-implicit").addEventListener("change", (e) => { TBL_STATE.showImplicit = e.target.checked; if (TBL_STATE.selected) refreshFocus(); });
  $("#tf-show-hk").addEventListener("change", (e) => { TBL_STATE.showHk = e.target.checked; if (TBL_STATE.selected) refreshFocus(); });
  $("#tf-modal-close").addEventListener("click", closeModal);
  $("#tf-modal-overlay").addEventListener("click", (e) => { if (e.target.id === "tf-modal-overlay") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  $("#tf-modal-body").addEventListener("click", (e) => {
    const link = e.target.closest("[data-open]");
    if (link) { closeModal(); focusTable(link.dataset.open, null, TBL_STATE.cameFrom); }
  });

  runCatalog();
  renderUrusanBrowse();
}

function clearFocus() {
  TBL_STATE.selected = null;
  TBL_STATE.highlightCol = null;
  $("#table-focus").classList.add("hidden");
}

function openModal(title, bodyHtml) {
  $("#tf-modal-title").textContent = title;
  $("#tf-modal-body").innerHTML = bodyHtml;
  $("#tf-modal-overlay").classList.remove("hidden");
}
function closeModal() { $("#tf-modal-overlay").classList.add("hidden"); }

// ---- FOCUS MODE: link graph + sidebar cards (always inside the Diagram sub-tab) ----
function focusTable(name, highlightCol, from) {
  const td = tableData(name);
  if (!td) return;
  TBL_STATE.selected = name;
  TBL_STATE.highlightCol = highlightCol || null;
  if (from) TBL_STATE.cameFrom = from;
  selectSubTab("diagram");
  if (TBL_STATE.diagramState) TBL_STATE.diagramState("focus");
  $("#tf-title").textContent = name;
  refreshFocus();
  selectSideTab(TBL_STATE.highlightCol ? "tf-columns" : "tf-identity");
}
function refreshFocus() {
  renderFocusGraph(TBL_STATE.selected);
  renderFocusSidebar(TBL_STATE.selected);
}

function focusNeighbors(name) {
  const hkOk = (n) => TBL_STATE.showHk || !isHousekeepingName(n);
  const keep = (n) => hkOk(n) && scopePass(n);
  const parents = (DATA.out_fk[name] || []).filter(e => keep(e.to)).map(e => ({ table: e.to, col: e.col, kind: "fk" }));
  const children = (DATA.in_fk[name] || []).filter(e => keep(e.from)).map(e => ({ table: e.from, col: e.col, kind: "fk" }));
  if (TBL_STATE.showImplicit) {
    (DATA.implicit_out[name] || []).filter(e => keep(e.to)).forEach(e => parents.push({ table: e.to, col: e.col, kind: "implicit", status: e.status }));
    (DATA.implicit_in[name] || []).filter(e => (!e.hk || TBL_STATE.showHk) && keep(e.from)).forEach(e => children.push({ table: e.from, col: e.col, kind: "implicit", status: e.status }));
  }
  return { parents, children };
}

function renderFocusGraph(name) {
  const svg = $("#tf-svg");
  svg.innerHTML = "";
  const W = 900, H = 620;
  const { parents, children } = focusNeighbors(name);
  const CAPP = 12, CAPC = 14;
  const pShow = parents.slice(0, CAPP);
  const cShow = children.slice(0, CAPC);

  const defs = svgEl("defs", {});
  defs.innerHTML = `<marker id="tf-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#888780"/></marker>`;
  svg.appendChild(defs);

  const cx = W / 2, cy = H / 2;
  const centerSize = { w: 210, h: 64 };
  const nodeSizeSm = { w: 168, h: 40 };
  const positions = {};

  function columnY(count, idx, height) {
    if (count === 1) return cy;
    const span = Math.min(height - 100, count * 58);
    return cy - span / 2 + (span / (count - 1)) * idx;
  }
  pShow.forEach((p, i) => { positions["p" + i] = { x: 130, y: columnY(pShow.length, i, H) }; });
  cShow.forEach((c, i) => { positions["c" + i] = { x: W - 130, y: columnY(cShow.length, i, H) }; });

  const hdrP = svgEl("text", { x: 130, y: 26, "text-anchor": "middle", class: "tf-col-hdr" });
  hdrP.textContent = `POINTS TO (${parents.length})`;
  svg.appendChild(hdrP);
  const hdrC = svgEl("text", { x: W - 130, y: 26, "text-anchor": "middle", class: "tf-col-hdr" });
  hdrC.textContent = `REFERENCED BY (${children.length})`;
  svg.appendChild(hdrC);

  function edge(x1, y1, x2, y2, label, kind, status) {
    const cls = kind === "implicit" ? "tf-edge tf-edge-implicit" : "tf-edge";
    const midX = (x1 + x2) / 2;
    const path = svgEl("path", { d: `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`, class: cls, "marker-end": "url(#tf-arr)" });
    if (kind === "implicit" && status !== "verified") path.classList.add("tf-edge-heuristic");
    svg.appendChild(path);
    const lt = svgEl("text", { x: midX, y: (y1 + y2) / 2 - 5, "text-anchor": "middle", class: "tf-edge-label" });
    lt.textContent = label + (kind === "implicit" ? (status === "verified" ? " ⇢✓" : " ⇢?") : "");
    svg.appendChild(lt);
  }
  pShow.forEach((p, i) => {
    const pos = positions["p" + i];
    edge(cx - centerSize.w / 2, cy, pos.x + nodeSizeSm.w / 2, pos.y, p.col, p.kind, p.status);
  });
  cShow.forEach((c, i) => {
    const pos = positions["c" + i];
    edge(pos.x - nodeSizeSm.w / 2, pos.y, cx + centerSize.w / 2, cy, c.col, c.kind, c.status);
  });

  function drawNode(pos, tname, kind) {
    const td2 = tableData(tname);
    const cat = td2 ? (categoryOf(td2.category) || categoryOf("subsystem")) : categoryOf("subsystem");
    const g = svgEl("g", { class: "tf-node", "data-table": tname });
    g.style.cursor = "pointer";
    const r = svgEl("rect", { x: pos.x - nodeSizeSm.w / 2, y: pos.y - nodeSizeSm.h / 2, width: nodeSizeSm.w, height: nodeSizeSm.h, rx: 8, fill: cat ? cat.color_bg_light : "#eee", stroke: cat ? cat.color : "#666" });
    if (kind === "implicit") r.setAttribute("stroke-dasharray", "5 3");
    g.appendChild(r);
    const t = svgEl("text", { x: pos.x, y: pos.y + 4, "text-anchor": "middle", class: "tf-node-text", fill: cat ? cat.color : "#333" });
    t.textContent = tname;
    g.appendChild(t);
    g.addEventListener("click", () => focusTable(tname, null, TBL_STATE.cameFrom));
    svg.appendChild(g);
  }
  pShow.forEach((p, i) => drawNode(positions["p" + i], p.table, p.kind));
  cShow.forEach((c, i) => drawNode(positions["c" + i], c.table, c.kind));

  if (parents.length > CAPP) {
    const t = svgEl("text", { x: 130, y: H - 16, "text-anchor": "middle", class: "tf-overflow" });
    t.textContent = `+${parents.length - CAPP} more — see Links in the panel`;
    svg.appendChild(t);
  }
  if (children.length > CAPC) {
    const t = svgEl("text", { x: W - 130, y: H - 16, "text-anchor": "middle", class: "tf-overflow" });
    t.textContent = `+${children.length - CAPC} more — see Links in the panel`;
    svg.appendChild(t);
  }

  const td = tableData(name);
  const cat = td ? (categoryOf(td.category) || categoryOf("subsystem")) : categoryOf("subsystem");
  const g = svgEl("g", { class: "tf-node tf-node-center" });
  const ring = svgEl("rect", { x: cx - centerSize.w / 2 - 5, y: cy - centerSize.h / 2 - 5, width: centerSize.w + 10, height: centerSize.h + 10, rx: 13, fill: "none", stroke: cat ? cat.color : "#333", "stroke-width": 2.5, opacity: 0.65 });
  g.appendChild(ring);
  const r = svgEl("rect", { x: cx - centerSize.w / 2, y: cy - centerSize.h / 2, width: centerSize.w, height: centerSize.h, rx: 10, fill: cat ? cat.color_bg_light : "#eee", stroke: cat ? cat.color : "#333", "stroke-width": 2 });
  g.appendChild(r);
  const t1 = svgEl("text", { x: cx, y: cy - 4, "text-anchor": "middle", class: "tf-center-text", fill: cat ? cat.color : "#111" });
  t1.textContent = name;
  g.appendChild(t1);
  const t2 = svgEl("text", { x: cx, y: cy + 16, "text-anchor": "middle", class: "tf-center-sub", fill: cat ? cat.color : "#333" });
  t2.textContent = td ? `↓${td.in} ↑${td.out} · ${td.cols} cols` : "";
  g.appendChild(t2);
  svg.appendChild(g);
}

// ---- FOCUS SIDEBAR: three separated cards ----
function renderFocusSidebar(name) {
  const td = tableData(name);
  if (!td) return;
  const mod = modulOf(td.modul) || modulOf("shared");
  const cat = categoryOf(td.category) || categoryOf("subsystem");
  const blurb = DATA.anchor_blurbs[name];
  const pk = td.pk || [];

  $("#tf-identity").innerHTML = `
    <div class="panel-table-name">${escapeHtml(name)}</div>
    <div class="panel-badges">
      <span class="badge" style="background:${cat.color_bg_light};color:${cat.color}">${escapeHtml(cat.label)}</span>
      <span class="badge" style="background:${mod.color_bg_light};color:${mod.color}">${escapeHtml(mod.label)}</span>
      <span class="badge" style="background:var(--surface-2);color:var(--text-dim)">layer ${escapeHtml(td.layer)}</span>
      ${td.is_main ? '<span class="badge badge-main">main table</span>' : ''}
    </div>
    ${pk.length ? `<div class="tf-pk-line">PK: <code>${pk.map(escapeHtml).join(", ")}</code></div>` : ""}
    ${(td.entity || []).length ? `<div class="tf-pk-line">Entity: <code>${td.entity.map(escapeHtml).join("</code>, <code>")}</code></div>` : ""}
    <div class="tf-pk-line">Used by code: ${(td.used_by || []).length ? td.used_by.map(m => `<span class="ub-badge ub-${escapeAttr(m)}">${escapeHtml(m)}</span>`).join(" ") : '<span class="ub-badge ub-none">none found in scanned modules</span>'}</div>
    ${blurb ? `<p class="panel-blurb">${escapeHtml(blurb)}</p>` : ""}
    ${td.comment ? `<p class="panel-blurb panel-comment">${escapeHtml(td.comment)}</p>` : ""}
  `;

  const inUrusans = [];
  for (const u of DATA.urusans) {
    const idx = urusanStageIndex(u.kod);
    if (idx[name]) inUrusans.push({ kod: u.kod, name: u.name, stages: idx[name] });
  }
  const inTugasans = (DATA.tugasans || []).filter(t =>
    (t.loads || []).some(x => x.table === name) || (t.saves || []).some(x => x.table === name));
  const inScreens = Object.entries(DATA.screen_tables || {}).map(([jsf, st]) => ({
    jsf, st,
    load: (st.loads || []).some(x => x.table === name),
    save: (st.saves || []).some(x => x.table === name),
  })).filter(s => s.load || s.save);
  const { parents, children } = focusNeighbors(name);
  $("#tf-flows").innerHTML = `
    <h4 class="tf-card-h">Where it appears</h4>
    <div class="tf-flow-row"><span>Urusan flows</span><span class="tf-flow-n">${inUrusans.length}</span>
      ${inUrusans.length ? '<button class="btn btn-sm" id="btn-urusan-modal">View</button>' : ''}</div>
    <div class="tf-flow-row"><span>Screens (traced)</span><span class="tf-flow-n">${inScreens.length}</span>
      ${inScreens.length ? '<button class="btn btn-sm" id="btn-screens-modal">View</button>' : ''}</div>
    <div class="tf-flow-row"><span>Tugasan (pilot)</span><span class="tf-flow-n">${inTugasans.length}</span>
      ${inTugasans.length ? '<button class="btn btn-sm" id="btn-tugasan-modal">View</button>' : ''}</div>
    <div class="tf-flow-row"><span>Links</span><span class="tf-flow-n">→${parents.length} · ←${children.length}</span>
      ${(parents.length + children.length) ? '<button class="btn btn-sm" id="btn-links-modal">View all</button>' : ''}</div>
  `;
  const bs = $("#btn-screens-modal");
  if (bs) bs.addEventListener("click", () => openModal(`${name} — screens that touch it`,
    `<table class="modal-table"><tbody>${inScreens.map(s => {
      const nTg = (DATA.tugasan_census || []).filter(t => (t.screens || []).some(x => x.jsf === s.jsf)).length;
      return `<tr><td><code>${escapeHtml(s.jsf.split("/").pop())}</code><div class="modal-sub">${escapeHtml(s.st.repo || "")} · used by ${nTg} tugasan</div></td>
        <td>${s.load ? '<span class="tg-badge tg-loads">LOADED</span>' : ''} ${s.save ? '<span class="tg-badge tg-saves">SAVED</span>' : ''}</td></tr>`;
    }).join("")}</tbody></table>`));
  const bu = $("#btn-urusan-modal");
  if (bu) bu.addEventListener("click", () => openModal(`${name} — urusan flows`,
    `<table class="modal-table"><tbody>${inUrusans.map(u =>
      `<tr><td><strong>${escapeHtml(u.kod)}</strong><div class="modal-sub">${escapeHtml(u.name)}</div></td><td>${u.stages.map(escapeHtml).join("<br>")}</td></tr>`).join("")}</tbody></table>`));
  const bt = $("#btn-tugasan-modal");
  if (bt) bt.addEventListener("click", () => openModal(`${name} — tugasan (pilot trace)`,
    `<table class="modal-table"><tbody>${inTugasans.map(t => {
      const load = (t.loads || []).find(x => x.table === name);
      const save = (t.saves || []).find(x => x.table === name);
      return `<tr><td><strong>${escapeHtml(t.kod)}</strong><div class="modal-sub">${escapeHtml(t.name || "")}</div></td>
        <td>${load ? '<span class="tg-badge tg-loads">LOADED</span>' : ''}${save ? ' <span class="tg-badge tg-saves">SAVED</span>' : ''}
        <div class="modal-sub">${escapeHtml((t.screen || "").split("/").pop())}</div></td></tr>`;
    }).join("")}</tbody></table>`));
  const bl = $("#btn-links-modal");
  if (bl) bl.addEventListener("click", () => openModal(`${name} — all links`,
    `<h5 class="modal-h5">Points to (${parents.length})</h5>
     <table class="modal-table"><tbody>${parents.map(p =>
       `<tr><td><a class="modal-link" data-open="${escapeAttr(p.table)}">${escapeHtml(p.table)}</a></td><td><code>${escapeHtml(p.col)}</code>${p.kind === "implicit" ? ` <span class="imp-badge">⇢${p.status === "verified" ? "✓" : "?"}</span>` : ""}</td></tr>`).join("") || "<tr><td><em>None</em></td></tr>"}</tbody></table>
     <h5 class="modal-h5">Referenced by (${children.length})</h5>
     <table class="modal-table"><tbody>${children.map(c =>
       `<tr><td><a class="modal-link" data-open="${escapeAttr(c.table)}">${escapeHtml(c.table)}</a></td><td><code>${escapeHtml(c.col)}</code>${c.kind === "implicit" ? ` <span class="imp-badge">⇢${c.status === "verified" ? "✓" : "?"}</span>` : ""}</td></tr>`).join("") || "<tr><td><em>None</em></td></tr>"}</tbody></table>`));

  const fkByCol = {};
  (DATA.out_fk[name] || []).forEach(e => { fkByCol[e.col] = fkByCol[e.col] || []; fkByCol[e.col].push({ to: e.to, kind: "fk" }); });
  (DATA.implicit_out[name] || []).forEach(e => { fkByCol[e.col] = fkByCol[e.col] || []; fkByCol[e.col].push({ to: e.to, kind: "implicit", status: e.status }); });
  const hc = TBL_STATE.highlightCol;

  function colRowsHtml(filter) {
    const f = (filter || "").toLowerCase();
    return (td.columns || []).filter(c => !f || c.n.includes(f)).map(c => {
      const badges = [];
      if (pk.includes(c.n)) badges.push('<span class="pk-badge">PK</span>');
      (fkByCol[c.n] || []).forEach(l => {
        if (l.kind === "fk") badges.push(`<span class="fk-badge" data-goto="${escapeAttr(l.to)}">FK → ${escapeHtml(l.to)}</span>`);
        else if (TBL_STATE.showImplicit) badges.push(`<span class="imp-badge" data-goto="${escapeAttr(l.to)}" title="name-matched link, no declared FK (${l.status})">⇢ ${escapeHtml(l.to)}${l.status === "verified" ? " ✓" : " ?"}</span>`);
      });
      return `<div class="col-row ${hc === c.n ? "col-highlight" : ""}">
        <div class="col-row-main"><span class="col-name">${escapeHtml(c.n)}</span><span class="col-type">${escapeHtml(c.t)}</span></div>
        ${badges.length ? `<div class="col-row-badges">${badges.join(" ")}</div>` : ""}
      </div>`;
    }).join("") || `<p class="tf-empty">No columns match.</p>`;
  }

  $("#tf-columns").innerHTML = `
    <h4 class="tf-card-h">Columns <span class="tf-flow-n">${(td.columns || []).length}</span></h4>
    <input type="search" class="col-filter" id="tf-col-filter" placeholder="filter columns…" autocomplete="off">
    <div class="col-list" id="tf-col-list">${colRowsHtml("")}</div>
  `;
  const cf = $("#tf-col-filter");
  cf.addEventListener("input", () => {
    $("#tf-col-list").innerHTML = colRowsHtml(cf.value.trim());
    wireGoto();
  });
  function wireGoto() {
    $("#table-focus").querySelectorAll("[data-goto]").forEach(el => {
      el.addEventListener("click", (ev) => { ev.stopPropagation(); focusTable(el.dataset.goto, null, TBL_STATE.cameFrom); });
    });
  }
  wireGoto();
  if (hc) {
    const row = $("#tf-col-list").querySelector(".col-highlight");
    if (row && row.scrollIntoView) setTimeout(() => row.scrollIntoView({ block: "center" }), 60);
  }
}

// ========== ABOUT VIEW + SQL DROPZONE ==========
function renderAbout() {
  const legend = $("#prefix-legend");
  const labels = {
    plp: "Pelupusan (land disposal)",
    dft: "Pendaftaran (registry)",
    hsl: "Hasil (revenue / cukai)",
    str: "Strata (strata land)",
    pks: "Penguatkuasaan (enforcement)",
    amb: "Pengambilan (acquisition)",
    tkl: "Teknikal (IT-side module)",
    skg: "Document storage",
    umm: "Umum (shared across moduls)",
    ind: "Induk (reference codes)",
    rjk: "Rujukan (lookup tables)",
    pcp: "Pengguna / Capaian (users & access)",
  };
  const counts = {};
  for (const t of DATA.tables) {
    const p = (t.name.match(/^([a-z]+)_/) || [])[1] || "other";
    counts[p] = (counts[p] || 0) + 1;
  }
  legend.innerHTML = Object.entries(counts).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<div class="pl-item"><code>${k}_*</code><span>${v}</span></div>`)
    .join("");
}

// ========== SQL DROPZONE ==========
function setupDropzone() {
  const dz = $("#sql-dropzone");
  const fi = $("#sql-file");
  dz.addEventListener("click", () => fi.click());
  fi.addEventListener("change", (e) => { if (e.target.files[0]) handleSQL(e.target.files[0]); });
  ["dragenter", "dragover"].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("drag-over"); }));
  ["dragleave", "drop"].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("drag-over"); }));
  dz.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files[0]; if (f) handleSQL(f);
  });
}

function handleSQL(file) {
  const dz = $("#sql-dropzone");
  dz.innerHTML = `<p>Parsing ${escapeHtml(file.name)} (${(file.size/1024/1024).toFixed(1)} MB)…</p>`;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const newData = parseSQL(e.target.result);
      // Re-merge with mapping (we keep current MAPPING; the user can ship a new mapping.json too)
      DATA = rebuildFromParsed(newData, MAPPING);
      MAP_STATE.expanded = new Set();
      MAP_STATE.selected = null;
      MAP_STATE.pinned = false;
      MAP_STATE.positions = {};
      refreshTotals();
      renderAbout();
      layoutAndRender();
      renderUrusanView();
      dz.innerHTML = `<p><strong>Reloaded from ${escapeHtml(file.name)}</strong> — ${DATA.tables.length} tables, ${DATA.totals.foreign_keys} FKs.</p><p class="dz-sub">Drop another SQL file to swap again.</p>`;
    } catch (err) {
      dz.innerHTML = `<p style="color:#c00">Parse failed: ${escapeHtml(String(err.message || err))}</p><p class="dz-sub">Drop a different file to try again.</p>`;
    }
  };
  reader.readAsText(file);
}

function parseSQL(text) {
  const tables = [];
  const fks = [];
  const tableComments = {};
  // CREATE TABLE [public.]<name> (...)
  const createRe = /CREATE\s+TABLE\s+(?:[a-z_][a-z0-9_]*\.)?([a-z_][a-z0-9_]*)\s*\(([\s\S]*?)\);/gi;
  let m;
  while ((m = createRe.exec(text)) !== null) {
    const name = m[1];
    const body = m[2];
    // Count columns (lines that start with an identifier and aren't constraints)
    const lines = body.split(/\n/).map(l => l.trim()).filter(l => l);
    const cols = lines.filter(l => /^[a-z_][a-z0-9_]*\s+/i.test(l) && !/^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK|KEY)/i.test(l)).length;
    tables.push({ name, column_count: cols, comment: "", incoming_fk_count: 0, outgoing_fk_count: 0 });
  }
  // ALTER TABLE <t> ADD CONSTRAINT ... FOREIGN KEY (col) REFERENCES <parent> (pcol)
  const fkRe = /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:[a-z_][a-z0-9_]*\.)?([a-z_][a-z0-9_]*)\s+ADD\s+CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s+\(([^)]+)\)\s+REFERENCES\s+(?:[a-z_][a-z0-9_]*\.)?([a-z_][a-z0-9_]*)\s*\(([^)]+)\)/gi;
  while ((m = fkRe.exec(text)) !== null) {
    fks.push({ child_table: m[1], child_column: m[2].trim(), parent_table: m[3], parent_column: m[4].trim() });
  }
  // COMMENT ON TABLE
  const cmtRe = /COMMENT\s+ON\s+TABLE\s+(?:[a-z_][a-z0-9_]*\.)?([a-z_][a-z0-9_]*)\s+IS\s+'((?:[^']|'')*?)'/gi;
  while ((m = cmtRe.exec(text)) !== null) {
    tableComments[m[1]] = m[2].replace(/''/g, "'");
  }
  for (const t of tables) {
    t.comment = tableComments[t.name] || "";
  }
  // Compute FK counts
  const inCnt = {}, outCnt = {};
  for (const fk of fks) {
    inCnt[fk.parent_table] = (inCnt[fk.parent_table] || 0) + 1;
    outCnt[fk.child_table] = (outCnt[fk.child_table] || 0) + 1;
  }
  for (const t of tables) {
    t.incoming_fk_count = inCnt[t.name] || 0;
    t.outgoing_fk_count = outCnt[t.name] || 0;
  }
  return { tables, foreign_keys: fks };
}

function rebuildFromParsed(parsed, mapping) {
  const moduls = mapping.moduls;
  const rawTables = {};
  for (const t of parsed.tables) rawTables[t.name] = t;

  function detectModul(name) {
    for (const m of moduls) {
      if (m.key === "shared" || m.key === "operations") continue;
      for (const p of m.prefix) if (name.startsWith(p)) return m.key;
    }
    for (const m of moduls) if (m.key === "shared") for (const p of m.prefix) if (name.startsWith(p)) return "shared";
    for (const m of moduls) if (m.key === "operations") for (const p of m.prefix) if (name.startsWith(p)) return "operations";
    return "operations";
  }
  function detectLayer(n) { return n.includes("_a_") ? "_a_" : n.includes("_p_") ? "_p_" : "neither"; }

  const allMain = new Set();
  for (const m of moduls) (m.main_tables || []).forEach(x => allMain.add(x));

  const tables = parsed.tables.map(t => ({
    name: t.name, modul: detectModul(t.name), layer: detectLayer(t.name),
    cols: t.column_count, comment: (t.comment || "").slice(0, 300),
    in: t.incoming_fk_count, out: t.outgoing_fk_count, is_main: allMain.has(t.name),
  }));

  const NOISY = new Set(["rjk_senarai_ahli_kumpulan"]);
  const in_fk = {}, out_fk = {};
  for (const fk of parsed.foreign_keys) {
    if (NOISY.has(fk.child_table) || NOISY.has(fk.parent_table)) continue;
    in_fk[fk.parent_table] = in_fk[fk.parent_table] || [];
    in_fk[fk.parent_table].push({ from: fk.child_table, col: fk.child_column });
    out_fk[fk.child_table] = out_fk[fk.child_table] || [];
    out_fk[fk.child_table].push({ to: fk.parent_table, col: fk.child_column });
  }

  const anchorChildren = {};
  for (const name of allMain) {
    anchorChildren[name] = (in_fk[name] || []).slice(0, 12);
  }

  const modulStats = {};
  for (const m of moduls) {
    const members = tables.filter(t => t.modul === m.key);
    modulStats[m.key] = { table_count: members.length, main_count: members.filter(t => t.is_main).length };
  }

  return {
    totals: { tables: tables.length, foreign_keys: parsed.foreign_keys.length, moduls: moduls.length, urusans: mapping.urusans.length, main_tables: allMain.size },
    moduls, modul_stats: modulStats,
    anchor_blurbs: mapping.anchor_blurbs,
    urusans: mapping.urusans,
    tables, in_fk, out_fk,
    anchor_children: anchorChildren,
    anchor_parents: {},
    profile: mapping.profile || "default",
    version: mapping.version || "2.0",
    last_updated: new Date().toISOString().slice(0, 10),
  };
}

// ========== INIT ==========
setTheme(initialTheme);
populateDropdowns();
refreshTotals();
renderAbout();
setupDropzone();
setupSearch();
renderUrusanView();
restorePinned();
layoutAndRender();

// Deep links: ?tab=map|urusan|search|about &sub=diagram|catalog|urusan &table=<name>
//             &urusan=<KOD> &tugasan=<KOD> &pick=<KOD> &fork=lulus|tolak|tangguh
(function initDeepLink() {
  let p;
  try { p = new URLSearchParams(window.location.search); } catch (e) { return; }
  if (!p || ![...p.keys()].length) return;
  const tab = p.get("tab");
  if (tab) {
    $$(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === tab));
    $$(".view").forEach(v => v.classList.toggle("hidden", v.dataset.view !== tab));
    if (tab === "map") layoutAndRender();
  }
  if (p.get("pick")) {
    const picker = $("#urusan-picker");
    picker.value = p.get("pick");
    if (p.get("fork")) FORK_CHOICE[p.get("pick")] = p.get("fork");
    renderUrusanView();
  }
  if (p.get("sub")) selectSubTab(p.get("sub"));
  if (p.get("urusan")) {
    const u = $("#ub-urusan");
    u.value = p.get("urusan");
    u.dispatchEvent(new Event("change", { bubbles: true }));
    if (p.get("tugasan")) {
      const t = $("#ub-tugasan");
      t.value = p.get("tugasan");
      t.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  if (p.get("table")) focusTable(p.get("table"), p.get("col") || null, "diagram");
})();
