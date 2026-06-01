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
    for (const t of s.tables) {
      if (!t.includes("*")) set.add(t);
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
    const stages = u.stages.map(s => `
      <div class="uj-stage">
        <div class="uj-stage-dot"></div>
        <div>
          <div class="uj-stage-name">${escapeHtml(s.name)}</div>
          <div class="uj-stage-tables">${s.tables.map(escapeHtml).join(", ")}</div>
        </div>
      </div>
    `).join("");
    return `
      <div class="uj-col">
        <div class="uj-header">
          <h3>${escapeHtml(u.kod)}</h3>
          <div class="english">${escapeHtml(u.name)}</div>
          <div class="section">${escapeHtml(u.english)} · ${escapeHtml(u.section)}</div>
        </div>
        <p class="uj-desc">${escapeHtml(u.description)}</p>
        <div class="uj-stages">${stages}</div>
      </div>`;
  }).join("");
  wrap.innerHTML = `<div class="urusan-grid ${colClass}">${cols}</div>`;
}
$("#urusan-picker").addEventListener("change", renderUrusanView);

// ========== SEARCH VIEW ==========
function setupSearch() {
  const input = $("#search-input");
  const mSel = $("#search-modul");
  const lSel = $("#search-layer");
  const out = $("#search-results");
  const cnt = $("#search-count");

  function run() {
    const q = input.value.trim().toLowerCase();
    const mFilter = mSel.value;
    const lFilter = lSel.value;
    let matched = DATA.tables.filter(t => {
      if (q && !t.name.toLowerCase().includes(q) && !(t.comment || "").toLowerCase().includes(q)) return false;
      if (mFilter && t.modul !== mFilter) return false;
      if (lFilter && t.layer !== lFilter) return false;
      return true;
    });
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
        <div class="tc-name">${escapeHtml(t.name)}${t.is_main ? '<span class="tc-main-mark">MAIN</span>' : ''}</div>
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
      c.addEventListener("click", () => {
        const name = c.dataset.open;
        // Switch to Map view with this table's modul + select
        const td = tableData(name);
        if (!td) return;
        // Pick the table's modul, unless shared then keep Pelupusan default
        const targetMod = td.modul === "shared" ? "pelupusan" : td.modul;
        MAP_STATE.modul = targetMod;
        $("#ctl-modul").value = targetMod;
        $$(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === "map"));
        $$(".view").forEach(v => v.classList.toggle("hidden", v.dataset.view !== "map"));
        layoutAndRender();
        setTimeout(() => selectTable(name), 80);
      });
    });
  }
  input.addEventListener("input", run);
  mSel.addEventListener("change", run);
  lSel.addEventListener("change", run);
  run();
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
