// Lapis Lazuli Observatory — client (vanilla JS, inline SVG charts, no dependencies)
'use strict';
(function () {
  const $ = s => document.querySelector(s);
  const TABS = ['overview', 'findings', 'catalog', 'runtime', 'monitoring', 'mistakes', 'evals', 'quests', 'memory', 'unmanaged', 'sources'];
  const VERDICT = {
    healthy: { icon: '✓', label: 'Healthy', status: 'good' },
    gaps: { icon: '!', label: 'Gaps', status: 'warning' },
    silent: { icon: '○', label: 'Silent', status: 'warning' },
    unregistered: { icon: '⊘', label: 'Unregistered', status: 'serious' },
    failing: { icon: '✕', label: 'Eval failing', status: 'critical' },
    ghost: { icon: '?', label: 'Ghost', status: 'critical' },
    retired: { icon: '–', label: 'Retired / off', status: 'neutral' },
  };
  const VERDICT_ORDER = ['ghost', 'failing', 'unregistered', 'silent', 'gaps', 'healthy', 'retired'];
  const KIND = { feature: 'Feature hook', package: 'Feature package', 'legacy-hook': 'Legacy hook', bundle: 'Hook bundle', skill: 'Skill', script: 'Script', protocol: 'Protocol system', workflow: 'Workflow', knowledge: 'Knowledge base', project: 'Project', memory: 'Memory store', doc: 'Doc' };
  const QUEST_STATUS = { active: ['info', '▶'], hold: ['warning', '‖'], blocked: ['critical', '✕'], delegated: ['neutral', '→'], closed: ['good', '✓'], archived: ['neutral', '–'] };

  const state = { snap: null, days: 30, audit: null, auditLoading: false, error: null, drawer: null, twins: new Set(), charts: {},
    cat: { q: '', kind: '', verdicts: new Set(), sort: { key: 'verdict', dir: 1 } }, find: { q: '', sev: new Set(), decide: '' } };

  // ── formatting ──
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const int = n => (n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-US'));
  const compact = n => { if (n == null) return '—'; const a = Math.abs(n); if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M'; if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'K'; return String(Math.round(n)); };
  const bytes = b => (b == null ? '—' : b < 1024 ? b + ' B' : b < 1048576 ? Math.round(b / 1024) + ' KB' : b < 1073741824 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1073741824).toFixed(2) + ' GB');
  const ago = ts => { if (!ts) return '—'; const d = (Date.now() - Date.parse(ts)) / 1000; if (!Number.isFinite(d)) return '—'; if (d < 90) return 'just now'; if (d < 5400) return Math.round(d / 60) + ' min ago'; if (d < 129600) return Math.round(d / 3600) + ' h ago'; return Math.round(d / 86400) + ' d ago'; };
  const day = ts => (ts ? String(ts).slice(0, 10) : '—');
  const pct = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '—');
  const chip = v => { const m = VERDICT[v] || { icon: '·', label: v, status: 'neutral' }; return `<span class="chip s-${m.status}"><i aria-hidden="true">${m.icon}</i>${esc(m.label)}</span>`; };
  const schip = (status, icon, label) => `<span class="chip s-${status}"><i aria-hidden="true">${icon}</i>${esc(label)}</span>`;
  const kindLabel = k => KIND[k] || k;
  const byId = id => (state.snap ? state.snap.components.find(c => c.id === id) : null);

  // ── metrics per component (hooks use telemetry; skills use invocations; others use file dates) ──
  function metric(c) {
    if (c.runtime) return { runs: c.runtime.runs, blocks: c.runtime.blocks, avg: c.runtime.avgMs, last: c.runtime.last, spark: c.runtime.spark };
    if (c.kind === 'skill') return { runs: c.usage ? c.usage.window : 0, blocks: null, avg: null, last: c.usage ? c.usage.last : null, spark: null };
    if (c.kind === 'script') return { runs: null, blocks: null, avg: null, last: c.lastRun, spark: null };
    return { runs: null, blocks: null, avg: null, last: c.modified || null, spark: null };
  }

  // ── charts (inline SVG; marks from the dataviz reference: 2 px lines, ≤24 px bars, 4 px rounded data-ends) ──
  function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
  function slot(id, fn, height) { state.charts[id] = { fn, height }; return `<div class="chart" id="ch-${id}" style="height:${height}px"></div>`; }
  function drawAll() {
    for (const [id, c] of Object.entries(state.charts)) {
      const el = document.getElementById('ch-' + id); if (!el) continue;
      const w = Math.max(160, el.clientWidth);
      el.innerHTML = c.fn(w, c.height, id);
    }
  }
  function lineSVG(values, labels, opt) {
    return (w, h, id) => {
      const m = { l: 46, r: 14, t: 10, b: 24 }; const iw = w - m.l - m.r, ih = h - m.t - m.b; const n = values.length;
      const max = niceMax(Math.max(0, ...values)); const x = i => m.l + (n <= 1 ? iw / 2 : (i * iw) / (n - 1)); const y = v => m.t + ih - (v / max) * ih;
      const f = opt.fmt || compact; let s = `<svg width="${w}" height="${h}" role="img" aria-label="${esc(opt.label)}">`;
      for (const t of [0, max / 2, max]) s += `<line class="gridline" x1="${m.l}" x2="${w - m.r}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-t" x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${esc(f(t))}</text>`;
      s += `<line class="baseline" x1="${m.l}" x2="${w - m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
      if (n) {
        const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
        s += `<path class="area-1" d="M${x(0)},${y(0)} L${pts.join(' L')} L${x(n - 1)},${y(0)} Z"/><path class="line-1" d="M${pts.join(' L')}"/>`;
        for (const i of [...new Set([0, Math.floor((n - 1) / 2), n - 1])]) s += `<text class="axis-t" x="${x(i)}" y="${h - 6}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(String(labels[i]).slice(5))}</text>`;
        s += `<line class="cross" id="${id}-x" x1="0" x2="0" y1="${m.t}" y2="${y(0)}" visibility="hidden"/><circle class="marker" id="${id}-m" r="4" cx="0" cy="0" visibility="hidden"/>`;
        const step = n > 1 ? iw / (n - 1) : iw;
        values.forEach((v, i) => { s += `<rect x="${x(i) - step / 2}" y="${m.t}" width="${step}" height="${ih}" fill="transparent" data-line="${id}" data-i="${i}" data-cx="${x(i)}" data-cy="${y(v)}" data-tip="<b>${esc(labels[i])}</b><br>${esc(int(Math.round(v)))} ${esc(opt.unit || '')}"/>`; });
      }
      return s + '</svg>';
    };
  }
  function barPath(x, y, w, h) { if (w < 5) return `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${h}"`; return `<path d="M${x},${y} h${w - 4} a4,4 0 0 1 4,4 v${h - 8} a4,4 0 0 1 -4,4 h${-(w - 4)} z"`; }
  function barsSVG(rows, opt) {
    return w => {
      const rowH = 26, bh = 14, labelW = Math.min(Math.max(96, w * 0.38), 280), valW = 64, bw = Math.max(24, w - labelW - valW - 8);
      const max = Math.max(1, ...rows.map(r => r.value)); const chars = Math.floor(labelW / 6.8) - 1; const h = Math.max(rowH, rows.length * rowH);
      let s = `<svg width="${w}" height="${h}" role="img" aria-label="${esc(opt.label)}">`;
      rows.forEach((r, i) => {
        const y0 = i * rowH; const bwid = (r.value / max) * bw; const lab = String(r.label); const shown = lab.length > chars ? lab.slice(0, chars - 1) + '…' : lab;
        s += `<text class="label-t" x="0" y="${y0 + 17}">${esc(shown)}</text>`;
        s += `${barPath(labelW, y0 + (rowH - bh) / 2, bwid, bh)} class="${r.status ? 'fill-' + r.status : 'bar-1'}"/>`;
        s += `<text class="value-t" x="${labelW + bwid + 6}" y="${y0 + 17}">${esc(r.display != null ? r.display : (opt.fmt || int)(r.value))}</text>`;
        s += `<rect x="0" y="${y0}" width="${w}" height="${rowH}" fill="transparent" data-tip="<b>${esc(lab)}</b><br>${esc(r.tip || (opt.fmt || int)(r.value))}"${r.id ? ` data-open="${esc(r.id)}" style="cursor:pointer"` : ''}/>`;
      });
      return s + '</svg>';
    };
  }
  function stackSVG(rows) {
    return (w, h) => {
      const rowH = Math.max(12, Math.min(28, (h || rows.length * 28) / rows.length)), bh = Math.max(6, Math.min(16, rowH - 8)), labelW = Math.min(150, w * 0.34), valW = 44, bw = Math.max(24, w - labelW - valW - 8);
      const max = Math.max(1, ...rows.map(r => r.total)); let s = `<svg width="${w}" height="${rows.length * rowH}" role="img" aria-label="Components by kind and verdict">`;
      rows.forEach((r, i) => {
        const y0 = i * rowH; let x = labelW;
        s += `<text class="label-t" x="0" y="${y0 + rowH / 2 + 4}">${esc(r.label)}</text>`;
        const parts = r.parts.filter(p => p.value > 0);
        parts.forEach((p, j) => {
          const full = (p.value / max) * bw; const wid = Math.max(1, full - (j < parts.length - 1 ? 2 : 0));
          s += j === parts.length - 1 ? `${barPath(x, y0 + (rowH - bh) / 2, wid, bh)} class="fill-${p.status}"` : `<rect x="${x}" y="${y0 + (rowH - bh) / 2}" width="${wid}" height="${bh}" class="fill-${p.status}"`;
          s += ` data-tip="<b>${esc(r.label)}</b><br>${esc(p.label)}: ${p.value}" data-cat="${esc(r.kind)}|${esc(p.key)}" style="cursor:pointer"/>`;
          x += full;
        });
        s += `<text class="value-t" x="${x + 6}" y="${y0 + rowH / 2 + 4}">${r.total}</text>`;
      });
      return s + '</svg>';
    };
  }
  function sparkSVG(values, w = 96, h = 22) {
    if (!values || !values.length) return '';
    const max = Math.max(1, ...values); const n = values.length; const x = i => (n <= 1 ? w / 2 : (i * (w - 4)) / (n - 1) + 2); const y = v => h - 2 - (v / max) * (h - 4);
    const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `<svg class="spark" width="${w}" height="${h}" aria-hidden="true"><line class="spark-base" x1="0" x2="${w}" y1="${h - 1}" y2="${h - 1}"/><polyline class="spark-line" points="${pts}"/><circle class="spark-dot" r="2.5" cx="${x(n - 1)}" cy="${y(values[n - 1])}"/></svg>`;
  }

  // ── building blocks ──
  function card(id, title, sub, chartHtml, twinHtml) {
    const t = twinHtml != null && state.twins.has(id);
    return `<section class="card"><div class="card-head"><div><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${twinHtml != null ? `<button class="twin-btn" type="button" data-twin="${id}" aria-pressed="${t}">${t ? 'Show chart' : 'Show table'}</button>` : ''}</div>${t ? twinHtml : chartHtml}</section>`;
  }
  function plain(title, sub, body) { return `<section class="card"><div class="card-head"><div><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ''}</div></div>${body}</section>`; }
  function table(cols, rows, opt = {}) {
    if (!rows.length) return `<p class="empty">${esc(opt.empty || 'Nothing here.')}</p>`;
    return `<div class="tablewrap${opt.scroll ? ' scroll-y' : ''}"><table><thead><tr>${cols.map(c => `<th${c.num ? ' class="num"' : ''} scope="col">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr${opt.open && opt.open(r) ? ` class="row" tabindex="0" data-open="${esc(opt.open(r))}"` : ''}>${cols.map(c => `<td class="${c.num ? 'num' : ''}${c.wrap ? ' wrap' : ''}">${c.html ? c.html(r) : esc(r[c.key] == null ? '—' : r[c.key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function tile(label, value, sub, opt = {}) {
    const inner = `<div class="label">${esc(label)}</div><div class="value">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ''}${opt.spark ? `<div class="spark">${opt.spark}</div>` : ''}`;
    const cls = 'tile' + (opt.sm ? ' sm' : '');
    return opt.go ? `<button class="${cls}" type="button" data-go="${esc(opt.go)}">${inner}</button>` : `<div class="${cls}">${inner}</div>`;
  }
  function list(items, empty) {
    if (!items.length) return `<p class="empty">${esc(empty || 'None.')}</p>`;
    return `<ul class="list">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  }
  const dayTable = (rows, cols) => table([{ key: 'day', label: 'Day' }, ...cols], rows.slice().reverse());

  // ── views ──
  // Overview = one screen: KPI strip on top, then findings · health by kind · activity side by side.
  // Chart heights come from the viewport so nothing needs a page scroll on a desktop screen.
  function fitMode() { return window.innerWidth >= 1100 && window.innerHeight >= 620; }
  function vOverview(s) {
    const k = s.kpis; const d = s.runtime.daily; const fit = fitMode();
    const kindRows = s.kinds.map(r => ({ kind: r.kind, label: kindLabel(r.kind), total: r.total, parts: VERDICT_ORDER.map(v => ({ key: v, label: VERDICT[v].label, value: r[v] || 0, status: VERDICT[v].status })) }));
    const kindTable = table([{ label: 'Kind', html: r => esc(kindLabel(r.kind)) }, { key: 'total', label: 'Total', num: true }, ...VERDICT_ORDER.map(v => ({ label: VERDICT[v].label, num: true, html: r => int(r[v] || 0) }))], s.kinds);
    const legend = VERDICT_ORDER.map(v => `<span style="white-space:nowrap">${chip(v)} <span class="muted">${s.components.filter(c => c.verdict === v).length}</span></span>`).join(' ');
    const f = k.findings || {};
    const sevTile = `${f.critical || 0} critical · ${f.serious || 0} serious · ${f.warning || 0} warning`;
    const flist = s.findings.map(x => `<li><button type="button" class="frow" data-finding="${esc(x.id)}">${sevChip(x.severity)}<span class="grow"><span class="ftitle">${esc(x.title)}</span><span class="fjudge">${esc(x.judgement)}</span></span>${x.notes && x.notes.length ? '<span class="tag" title="Ruri recorded an investigation note">note</span>' : ''}</button></li>`).join('');
    const hRuns = fit ? 120 : 200, hBlocks = fit ? 90 : 150, hSlips = fit ? 90 : 150;   // fit mode re-measures these in sizeOverview()
    const sl = s.slips.daily;
    return `<div class="ov${fit ? ' fit' : ''}">
      <div class="ov-top">
        <section class="card ov-hero"><div class="hero-num">${k.healthPct}%</div><div class="hero-text"><strong>healthy</strong>${int(k.healthy)} of ${int(k.judged)} judged · ${int(k.components)} total</div></section>
        <div class="ov-tiles">
          ${tile('Findings', int(s.findings.length), sevTile, { go: 'findings', sm: true })}
          ${tile('Purpose declared', k.purposePct + '%', `${int(k.purposeDeclared)} of ${int(k.purposeTotal)} components`, { go: 'catalog', sm: true })}
          ${tile('Hooks firing', `${k.hooksLive}/${k.hooksRegistered}`, `registered, ran in ${s.meta.windowDays} d`, { go: 'runtime', sm: true })}
          ${tile('Hook runs', compact(k.runs), 'each row counted once', { go: 'runtime', sm: true, spark: sparkSVG(k.runsSpark, 110, 18) })}
          ${tile('Blocks', int(k.blocks), 'gates that stopped a turn', { go: 'runtime', sm: true, spark: sparkSVG(k.blocksSpark, 110, 18) })}
          ${tile('Eval failures', int(k.evalFails), s.evals.battery ? `battery ${s.evals.battery.ageDays} d old` : 'battery never ran', { go: 'evals', sm: true })}
          ${tile('Slips', int(k.slipsWeek), 'last 7 days', { go: 'mistakes', sm: true })}
          ${tile('Stray items', int(k.strays), `${k.staleWorktrees} stale worktree folders`, { go: 'unmanaged', sm: true })}
        </div>
      </div>
      <div class="ov-main">
        <section class="card panel"><div class="card-head"><div><h2>Findings</h2><p>Worst first · fact, context and judgement on the Findings tab</p></div><button class="twin-btn" type="button" data-go="findings">Open all</button></div><ul class="list flist body">${flist || '<li class="empty">No findings.</li>'}</ul></section>
        <section class="card panel"><div class="card-head"><div><h2>Health by kind</h2><p>Segments = verdict · click one to filter the catalog</p></div><button class="twin-btn" type="button" data-twin="kinds" aria-pressed="${state.twins.has('kinds')}">${state.twins.has('kinds') ? 'Show chart' : 'Show table'}</button></div>
          <div class="body"><div class="legend">${legend}</div>${state.twins.has('kinds') ? kindTable : slot('kinds', stackSVG(kindRows), kindRows.length * 26)}</div></section>
        <section class="card panel"><div class="card-head"><div><h2>Activity</h2><p>Last ${s.meta.windowDays} days (UTC days) · hover for values</p></div><button class="twin-btn" type="button" data-twin="activity" aria-pressed="${state.twins.has('activity')}">${state.twins.has('activity') ? 'Show chart' : 'Show table'}</button></div>
          <div class="body">${state.twins.has('activity') ? dayTable(d.map((x, i) => ({ ...x, slips: (sl[i] || {}).slips })), [{ key: 'runs', label: 'Hook runs', num: true }, { key: 'blocks', label: 'Blocks', num: true }, { key: 'slips', label: 'Slips', num: true }])
            : `<p class="mini-h">Hook runs</p>${slot('runs', lineSVG(d.map(x => x.runs), d.map(x => x.day), { label: 'Hook runs per day', unit: 'runs' }), hRuns)}<p class="mini-h">Blocks</p>${slot('blocks', lineSVG(d.map(x => x.blocks), d.map(x => x.day), { label: 'Blocks per day', unit: 'blocks' }), hBlocks)}<p class="mini-h">Slips logged</p>${slot('slips', lineSVG(sl.map(x => x.slips), sl.map(x => x.day), { label: 'Slips per day', unit: 'slips' }), hSlips)}`}</div></section>
      </div>
    </div>`;
  }
  const SEVCHIP = { critical: ['critical', '✕', 'Critical'], serious: ['serious', '!', 'Serious'], warning: ['warning', '!', 'Warning'], info: ['info', 'i', 'Info'] };
  function sevChip(sv) { const x = SEVCHIP[sv] || ['neutral', '·', sv]; return schip(x[0], x[1], x[2]); }
  function purposeCell(x) {
    if (x.purpose == null) return '<span class="muted">n/a</span>';
    return x.purpose ? `<span class="chip s-good" title="${esc(x.purpose)}"><i aria-hidden="true">✓</i>Declared</span>` : '<span class="chip s-warning"><i aria-hidden="true">!</i>Missing</span>';
  }
  function goalTags(ids) { const g = (state.snap.goals || []); return ids.map(id => { const t = g.find(x => x.id === id); return `<span class="tag" title="${esc(t ? t.title : '')}">${esc(id)}${t ? ' · ' + esc(t.title.split(/[,—]/)[0].slice(0, 32)) : ''}</span>`; }).join(' '); }
  function noteHtml(n) {
    return `<div class="note${n.stale ? ' stale' : ''}"><div class="note-h">${n.stale ? schip('warning', '!', 'Stale: evidence changed since') : schip('info', 'i', 'Investigated')} <span class="muted">${esc(n.by || 'ruri')} · ${esc(String(n.ts).slice(0, 10))}</span></div>${n.context ? `<p>${esc(n.context)}</p>` : ''}<p><strong>${esc(n.judgement)}</strong></p><p class="sec">Because: ${esc(n.justification)}</p>${n.action ? `<p>Next: ${esc(n.action)}</p>` : ''}</div>`;
  }
  // fit mode: give the three activity charts exactly the height the Activity panel has left after layout
  function sizeOverview() {
    const body = document.querySelector('.ov.fit .ov-main .panel:nth-child(3) .body'); if (!body || body.querySelector('table')) return;
    let lab = 0; body.querySelectorAll('.mini-h').forEach(l => { lab += l.offsetHeight + 8; });
    const avail = Math.max(120, body.clientHeight - lab - 10);
    for (const [id, p] of [['runs', 0.42], ['blocks', 0.29], ['slips', 0.29]]) { const h = Math.max(40, Math.floor(avail * p)); if (state.charts[id]) state.charts[id].height = h; const el = document.getElementById('ch-' + id); if (el) el.style.height = h + 'px'; }
    const kb = document.querySelector('.ov.fit .ov-main .panel:nth-child(2) .body'), kc = document.getElementById('ch-kinds');
    if (kb && kc && state.charts.kinds) { const lg = kb.querySelector('.legend'); const h = Math.max(12 * 12, kb.clientHeight - (lg ? lg.offsetHeight + 10 : 0) - 16); state.charts.kinds.height = h; kc.style.height = h + 'px'; }
  }
  function vFindings(s) {
    const fl = state.find; const q = fl.q.trim().toLowerCase();
    const rows = s.findings.filter(f => (!fl.sev.size || fl.sev.has(f.severity)) && (!fl.decide || f.decide === fl.decide) && (!q || (f.id + ' ' + f.title + ' ' + f.fact + ' ' + f.context + ' ' + f.judgement + ' ' + f.evidence.map(e => e.text).join(' ')).toLowerCase().includes(q)));
    const chips = ['critical', 'serious', 'warning', 'info'].map(v => `<button type="button" class="fchip" data-sev="${v}" aria-pressed="${fl.sev.has(v)}">${sevChip(v)}<span class="muted">${s.findings.filter(f => f.severity === v).length}</span></button>`).join('');
    const card = f => `<article class="finding" id="f-${esc(f.id)}">
        <header class="finding-h">${sevChip(f.severity)}<h3>${esc(f.title)}</h3><span class="tag">${f.decide === 'miya' ? 'Your decision' : 'Ruri acts'}</span>${goalTags(f.goals || [])}<code class="muted">${esc(f.id)}</code></header>
        <div class="layers">
          <section><h4>Fact <span class="muted">mechanical, from the data</span></h4><p>${esc(f.fact)}</p><details${f.evidence.length <= 6 ? ' open' : ''}><summary>Evidence (${f.evidence.length})</summary><ul class="ev">${f.evidence.map(e => `<li>${e.id ? `<button type="button" class="link" data-open="${esc(e.id)}">${esc(e.text)}</button>` : esc(e.text)}</li>`).join('')}</ul></details></section>
          <section><h4>Context <span class="muted">what it means</span></h4><p>${esc(f.context)}</p></section>
          <section><h4>Judgement <span class="muted">verdict, why, next</span></h4><p><strong>${esc(f.judgement)}</strong></p><p class="sec">Because: ${esc(f.justification)}</p><p>Next: ${esc(f.action)}</p></section>
        </div>
        ${(f.notes || []).length ? `<div class="notes"><h4>Ruri's investigation notes</h4>${f.notes.map(noteHtml).join('')}</div>` : ''}
        <p class="muted retrieve">Retrieve in a terminal: <code>node lib/observatory.js --finding ${esc(f.id)}</code></p>
      </article>`;
    return `<div class="stack">
      <section class="card"><div class="card-head"><div><h2>Findings</h2><p>Every issue the data shows. Each one reads left to right: <strong>Fact</strong> (mechanical, with evidence), <strong>Context</strong> (what it means), <strong>Judgement</strong> (verdict, why, and the next action). Goal tags name the system goal it threatens (system/system-goals.md).</p></div></div>
        <div class="filters"><label class="sr" for="f-q">Search findings</label><input id="f-q" type="search" placeholder="Search fact, evidence, judgement…" value="${esc(fl.q)}">
        <label class="sr" for="f-decide">Who decides</label><select id="f-decide"><option value="">Anyone decides</option><option value="miya"${fl.decide === 'miya' ? ' selected' : ''}>Your decision</option><option value="ruri"${fl.decide === 'ruri' ? ' selected' : ''}>Ruri acts</option></select></div>
        <div class="filters" role="group" aria-label="Severity filter">${chips}<span class="count">${rows.length} of ${s.findings.length} findings · full brief: <code>node lib/observatory.js --brief</code></span></div></section>
      <div id="f-list" class="stack">${rows.map(card).join('') || '<p class="empty">No finding matches.</p>'}</div>
      <section class="card"><details id="audit-details"><summary><strong>Domain Expansion audit screen</strong> <span class="muted">(lib/audit-briefing.js; it still sums overlapping telemetry files, so its hook totals run high)</span></summary><div id="audit-body" class="audit">${auditHtml()}</div></details></section>
    </div>`;
  }
  function auditHtml() {
    const a = state.audit;
    if (!a) return '<p class="empty">Loading the audit…</p>';
    if (a.error) return `<p class="empty">Audit failed: ${esc(a.error)}</p>`;
    const block = (t, rows) => `<h3>${esc(t)}</h3>${rows && rows.length ? `<ul>${rows.map(r => `<li>${esc(String(r).replace(/`/g, ''))}</li>`).join('')}</ul>` : '<p class="empty">none</p>'}`;
    return block('Not working', a.notWorking) + block('Too slow', a.slow) + block('Mistakes', a.mistakes) + block('High-return optimizations', a.optimizations) + block("Needs miya's ruling", a.rulings) + `<p class="muted" style="margin-top:8px">Generated ${esc(ago(a.generated))}.</p>`;
  }

  function catRows() {
    const s = state.snap, c = state.cat, q = c.q.trim().toLowerCase();
    const rows = s.components.filter(x => (!c.kind || x.kind === c.kind) && (!c.verdicts.size || c.verdicts.has(x.verdict)) && (!q || (x.name + ' ' + x.path + ' ' + (x.description || '') + ' ' + (x.purpose || '') + ' ' + (x.gaps || []).join(' ') + ' ' + (x.events || []).join(' ')).toLowerCase().includes(q)));
    const key = c.sort.key, dir = c.sort.dir;
    const val = x => { const m = metric(x); switch (key) {
      case 'name': return x.name.toLowerCase(); case 'kind': return kindLabel(x.kind); case 'purpose': return x.purpose == null ? 2 : x.purpose ? 0 : 1; case 'events': return (x.events || []).join(',');
      case 'reg': return x.registration ? x.registration.mode : ''; case 'eval': return x.evalStatus || '';
      case 'runs': return m.runs == null ? -1 : m.runs; case 'blocks': return m.blocks == null ? -1 : m.blocks; case 'avg': return m.avg == null ? -1 : m.avg;
      case 'last': return m.last || ''; default: return VERDICT_ORDER.indexOf(x.verdict); } };
    return rows.sort((a, b) => { const va = val(a), vb = val(b); return (va < vb ? -1 : va > vb ? 1 : a.name.localeCompare(b.name)) * dir; });
  }
  const EVAL = { pass: ['good', '✓', 'Pass'], fail: ['critical', '✕', 'Fail'], quarantined: ['warning', '!', 'Quarantined'], present: ['info', 'i', 'Has fixtures'], unknown: ['neutral', '?', 'Unknown'], none: null };
  function evalChip(st) { const e = EVAL[st]; return e ? schip(e[0], e[1], e[2]) : '<span class="muted">none</span>'; }
  function catTable() {
    const rows = catRows(); const c = state.cat;
    const th = (key, label, num) => `<th class="sortable${num ? ' num' : ''}" data-sort="${key}" scope="col" aria-sort="${c.sort.key === key ? (c.sort.dir > 0 ? 'ascending' : 'descending') : 'none'}">${label}<span class="arrow">${c.sort.key === key ? (c.sort.dir > 0 ? '▲' : '▼') : ''}</span></th>`;
    const body = rows.map(x => { const m = metric(x); return `<tr class="row" tabindex="0" data-open="${esc(x.id)}">
      <td class="wrap"><strong>${esc(x.name)}</strong><span class="path">${esc(x.path)}</span></td>
      <td>${esc(kindLabel(x.kind))}</td>
      <td>${purposeCell(x)}</td>
      <td>${(x.events || []).map(e => `<span class="tag">${esc(e)}</span>`).join(' ') || '<span class="muted">—</span>'}</td>
      <td>${x.registration ? esc(x.registration.mode) : (['feature', 'legacy-hook', 'bundle'].includes(x.kind) ? (x.optOut ? '<span class="muted">helper</span>' : '<span class="muted">none</span>') : '<span class="muted">n/a</span>')}</td>
      <td>${evalChip(x.evalStatus)}</td>
      <td class="num">${m.runs == null ? '—' : int(m.runs)}</td>
      <td>${m.spark ? sparkSVG(m.spark, 80, 20) : ''}</td>
      <td class="num">${m.blocks == null ? '—' : int(m.blocks)}</td>
      <td class="num">${m.avg == null ? '—' : int(m.avg)}</td>
      <td class="num">${esc(ago(m.last))}</td>
      <td>${chip(x.verdict)}</td></tr>`; }).join('');
    return `<p class="count" id="cat-count">${rows.length} of ${state.snap.components.length} components</p><div class="tablewrap scroll-y"><table><thead><tr>${th('name', 'Component')}${th('kind', 'Kind')}${th('purpose', 'Purpose')}${th('events', 'Events')}${th('reg', 'Registration')}${th('eval', 'Eval')}${th('runs', 'Runs', 1)}<th scope="col">Trend</th>${th('blocks', 'Blocks', 1)}${th('avg', 'Avg ms', 1)}${th('last', 'Last seen', 1)}${th('verdict', 'Verdict')}</tr></thead><tbody>${body || `<tr><td colspan="12" class="empty">No component matches these filters.</td></tr>`}</tbody></table></div>`;
  }
  function vCatalog(s) {
    const c = state.cat;
    const kinds = s.kinds.map(k => `<option value="${esc(k.kind)}"${c.kind === k.kind ? ' selected' : ''}>${esc(kindLabel(k.kind))} (${k.total})</option>`).join('');
    const vchips = VERDICT_ORDER.map(v => `<button type="button" class="fchip" data-verdict="${v}" aria-pressed="${c.verdicts.has(v)}">${chip(v)}<span class="muted">${s.components.filter(x => x.verdict === v).length}</span></button>`).join('');
    return `<section class="card"><div class="card-head"><div><h2>Every component</h2><p>Runs = hook executions (skills: invocations) in the last ${s.meta.windowDays} days. Verdicts use the same rules as lib/feature-census.js. Click a row for details.</p></div></div>
      <div class="filters"><label class="sr" for="cat-q">Search components</label><input id="cat-q" type="search" placeholder="Search name, path, gap, event…" value="${esc(c.q)}">
      <label class="sr" for="cat-kind">Kind</label><select id="cat-kind"><option value="">All kinds</option>${kinds}</select>
      <button type="button" class="btn" id="cat-reset">Clear filters</button></div>
      <div class="filters" role="group" aria-label="Verdict filter">${vchips}</div>
      <div id="cat-table">${catTable()}</div></section>`;
  }

  function vRuntime(s) {
    const r = s.runtime, k = s.kpis, d = r.daily;
    const owner = rel => s.components.find(c => c.path === rel || (c.hooks || []).some(h => h.file === rel));
    const item = (en, nested) => { const o = owner(en.rel); const st = o ? VERDICT[o.verdict].status : (en.exists ? 'neutral' : 'critical'); const name = en.mode === 'bundle' ? 'bundle: ' + en.bundle : (en.key || en.rel);
      return `<button type="button" class="lane-item" ${o ? `data-open="${esc(o.id)}"` : ''} data-tip="<b>${esc(en.rel)}</b><br>${esc(en.mode)} · ${int(en.runs)} runs · avg ${int(en.avgMs)} ms${o ? ' · ' + esc(VERDICT[o.verdict].label) : ''}"><span class="dot s-${st}" aria-hidden="true"></span><span class="nm">${esc(name)}</span>${en.mode !== 'bundle' ? `<span class="rt">${compact(en.runs)} · ${int(en.avgMs)}ms</span>` : ''}</button>${en.children ? `<div class="lane-bundle">${en.children.map(ch => item({ rel: ch.rel, key: ch.key, runs: ch.runs, avgMs: ch.avgMs, mode: 'bundled', exists: true }, true)).join('')}</div>` : ''}`; };
    const lanes = r.lanes.map(l => { const n = l.groups.reduce((a, g) => a + g.entries.reduce((b, e) => b + (e.children ? e.children.length : 1), 0), 0);
      return `<div class="card lane"><h3>${esc(l.event)} <span class="muted">· ${n} hooks</span></h3>${l.groups.map(g => `<div class="matcher">${g.matcher === '*' ? 'every call' : 'matcher: ' + esc(g.matcher)}</div>${g.entries.map(e => item(e)).join('')}`).join('')}</div>`; }).join('');
    const slow = r.slowest.map(h => ({ label: h.hook, value: h.totalS, display: int(h.totalS) + ' s', tip: `${int(h.totalS)} s total · ${int(h.runs)} runs · avg ${int(h.avgMs)} ms` }));
    const blk = r.blockers.map(h => ({ label: h.hook, value: h.blocks, tip: `${int(h.blocks)} blocks · ${int(h.runs)} runs` }));
    const hookCols = [{ key: 'hook', label: 'Hook' }, { label: 'Events', html: x => esc(x.events.join(', ')) }, { key: 'runs', label: 'Runs', num: true }, { key: 'blocks', label: 'Blocks', num: true }, { key: 'totalS', label: 'Total s', num: true }, { key: 'avgMs', label: 'Avg ms', num: true }];
    return `<div class="stack">
      <div class="tiles">
        ${tile('Hooks firing', `${k.hooksLive}/${k.hooksRegistered}`, `registered, fired in ${s.meta.windowDays} d`)}
        ${tile('Hook runs', compact(k.runs), s.meta.windowDays + ' days')}
        ${tile('Hook time', k.hookHours + ' h', 'total inside hooks')}
        ${tile('Sessions started', int(r.boot.boots), `avg ${r.boot.avgS} s of hooks per start`)}
        ${tile('Blocks', int(k.blocks), 'gates that stopped a turn')}
        ${tile('Hook errors', int(k.errors), `${r.errors.length} hooks`)}
      </div>
      ${plain('Hook lanes', 'Every registered hook per event, in firing order. Dot = verdict. Click one for details.', `<div class="lanes">${lanes}</div>`)}
      <div class="grid cols-2">
        ${card('hooktime', 'Hook time per day', 'Seconds spent inside hooks', slot('hooktime', lineSVG(d.map(x => Math.round(x.ms / 1000)), d.map(x => x.day), { label: 'Hook seconds per day', unit: 's' }), 220), dayTable(d.map(x => ({ ...x, s: Math.round(x.ms / 1000) })), [{ key: 's', label: 'Seconds', num: true }, { key: 'runs', label: 'Runs', num: true }]))}
        ${card('slow', 'Slowest hooks', 'Total seconds in the window', slot('slow', barsSVG(slow, { label: 'Slowest hooks' }), Math.max(26, slow.length * 26)), table(hookCols, r.slowest))}
      </div>
      <div class="grid cols-2">
        ${card('yield', 'Gate yield', 'Blocks per gate in the window', blk.length ? slot('yield', barsSVG(blk, { label: 'Blocks per gate' }), blk.length * 26) : '<p class="empty">No gate blocked in this window.</p>', table(hookCols, r.blockers))}
        ${plain('Skill usage', 'Invocations logged by skill-invocation-log', table([{ key: 'skill', label: 'Skill' }, { key: 'window', label: s.meta.windowDays + ' d', num: true }, { key: 'total', label: 'All time', num: true }, { label: 'Last', num: true, html: x => esc(ago(x.last)) }], r.skillUse, { scroll: true, empty: 'No skill invocations logged.' }))}
      </div>
      <div class="grid cols-2">
        ${plain('Hooks that errored', 'Exit code other than 0 (pass) or 2 (block). Timeouts = the hook runtime killed a hook that ran too long.', table([{ key: 'hook', label: 'Hook' }, { key: 'errs', label: 'Errors', num: true }, { key: 'timeouts', label: 'Timeouts', num: true }, { key: 'runs', label: 'Runs', num: true }], r.errors, { empty: 'No hook errors in this window.' }))}
        ${plain('Firing but not registered', 'Telemetry keys with no matching settings.json entry (renamed, bundled or retired hooks)', table([{ key: 'hook', label: 'Telemetry key' }, { key: 'runs', label: 'Runs', num: true }], r.unregisteredFiring, { empty: 'None.' }))}
      </div>
    </div>`;
  }

  function vMonitoring(s) {
    const m = s.monitoring, d = m.daily;
    const sig = m.signals.map(x => ({ label: x.key, value: x.n, status: x.key === 'reask' || x.key === 'correction' ? 'serious' : x.key === 'nod' ? 'good' : null }));
    const reask = (m.signals.find(x => x.key === 'reask') || { n: 0 }).n;
    return `<div class="stack">
      <div class="tiles">
        ${tile('Turns', int(m.turns), `${int(m.sessions)} sessions`)}
        ${tile('Re-asks', int(reask), pct(reask, m.turns) + ' of turns')}
        ${tile('Tool calls', compact(m.toolCalls), 'in logged turns')}
        ${tile('Output tokens', compact(m.tokens.out), 'in logged turns')}
        ${tile('Cache-read tokens', compact(m.tokens.cacheRead), 'in logged turns')}
        ${tile('Hook time in turns', Math.round(m.hookMs / 60000) + ' min', 'from the turn ledger')}
      </div>
      <div class="grid cols-2">
        ${card('turns', 'Turns per day', 'Monitoring layer: one row per turn in turns*.jsonl', slot('turns', lineSVG(d.map(x => x.turns), d.map(x => x.day), { label: 'Turns per day', unit: 'turns' }), 220), dayTable(d, [{ key: 'turns', label: 'Turns', num: true }, { key: 'reask', label: 'Re-asks', num: true }, { key: 'tools', label: 'Tool calls', num: true }]))}
        ${card('signals', 'How you reacted', 'User signal classified per turn', sig.length ? slot('signals', barsSVG(sig, { label: 'User signals' }), sig.length * 26) : '<p class="empty">No turns logged in this window.</p>', table([{ key: 'key', label: 'Signal' }, { key: 'n', label: 'Turns', num: true }], m.signals))}
      </div>
      ${plain('Cost per quest and phase', 'Which quest phase the turns served, and what they cost', table([{ key: 'key', label: 'Quest · phase' }, { key: 'turns', label: 'Turns', num: true }, { key: 'tools', label: 'Tool calls', num: true }, { label: 'Hook s', num: true, html: x => int(Math.round(x.hookMs / 1000)) }, { key: 'blocks', label: 'Blocks', num: true }, { key: 'reask', label: 'Re-asks', num: true }], m.phaseCost, { empty: 'No turns logged.' }))}
      <div class="grid cols-2">
        ${plain('Heaviest turns', 'Most hook time per turn', table([{ key: 'turn', label: 'Turn' }, { key: 'qa', label: 'Quest' }, { key: 'hookS', label: 'Hook s', num: true }, { key: 'tools', label: 'Tools', num: true }, { key: 'prompt', label: 'Prompt head', wrap: true }], m.heaviest, { empty: 'No turns logged.' }))}
        ${plain('Goal-lens', `Did each feature meet its goal on the runs it judged · ${int(m.goalPending)} prompts pending`, table([{ key: 'feature', label: 'Feature' }, { key: 'rows', label: 'Runs', num: true }, { label: 'Met', num: true, html: x => x.rate + '%' }, { key: 'topGap', label: 'Top gap', wrap: true }], m.goals, { empty: 'No goal-lens rows in this window.' }))}
      </div>
      ${plain('Watches', `${m.watches.open} open of ${m.watches.total}`, table([{ key: 'id', label: 'Watch' }, { key: 'target', label: 'Target', wrap: true }, { key: 'left', label: 'Sessions left', num: true }], m.watches.overdue, { empty: 'No overdue watches.' }))}
    </div>`;
  }

  function vMistakes(s) {
    const sl = s.slips; const d = sl.daily;
    const cats = sl.categoriesWindow.map(x => ({ label: x.key, value: x.n }));
    const caught = sl.caughtBy.map(x => ({ label: x.key, value: x.n }));
    return `<div class="stack">
      <div class="tiles">
        ${tile('Slips', int(sl.window), `last ${s.meta.windowDays} days`)}
        ${tile('Slips, last 7 days', int(sl.week), '')}
        ${tile('Proposals not ruled', int(sl.proposalsUnruled), 'improvement ideas waiting')}
        ${tile('Ledger rows', int(sl.total), sl.types.map(t => `${t.key} ${t.n}`).join(' · '))}
      </div>
      <div class="grid cols-2">
        ${card('slipday', 'Slips per day', 'Mistakes logged to system/slips.jsonl', slot('slipday', lineSVG(d.map(x => x.slips), d.map(x => x.day), { label: 'Slips per day', unit: 'slips' }), 220), dayTable(d, [{ key: 'slips', label: 'Slips', num: true }, { key: 'proposals', label: 'Proposals', num: true }, { key: 'upgrades', label: 'Upgrades', num: true }]))}
        ${card('cats', 'Top slip categories', `Last ${s.meta.windowDays} days`, cats.length ? slot('cats', barsSVG(cats, { label: 'Slip categories' }), cats.length * 26) : '<p class="empty">No slips in this window.</p>', table([{ key: 'key', label: 'Category' }, { key: 'n', label: 'Slips', num: true }], sl.categoriesWindow))}
      </div>
      <div class="grid cols-2">
        ${card('caught', 'Who caught them', 'miya, self or a gate', caught.length ? slot('caught', barsSVG(caught, { label: 'Caught by' }), caught.length * 26) : '<p class="empty">No slips in this window.</p>', table([{ key: 'key', label: 'Caught by' }, { key: 'n', label: 'Slips', num: true }], sl.caughtBy))}
        ${plain('Ledger types', 'All rows ever written', table([{ key: 'key', label: 'Type' }, { key: 'n', label: 'Rows', num: true }], sl.types))}
      </div>
      ${plain('Recent entries', 'Newest first', table([{ label: 'When', html: x => esc(day(x.ts)) }, { key: 'type', label: 'Type' }, { key: 'category', label: 'Category' }, { key: 'caught_by', label: 'Caught by' }, { key: 'evidence', label: 'Evidence', wrap: true }], sl.recent, { scroll: true }))}
    </div>`;
  }

  function vEvals(s) {
    const e = s.evals; const cov = e.coverage.map(c => ({ label: kindLabel(c.kind), value: c.total ? Math.round((100 * c.withEval) / c.total) : 0, display: `${c.withEval}/${c.total}`, tip: `${c.withEval} of ${c.total} have an eval (${pct(c.withEval, c.total)})` }));
    return `<div class="stack">
      <div class="tiles">
        ${tile('Battery last run', e.battery ? esc(day(e.battery.ts)) : 'never', e.battery ? `${e.battery.ageDays} days ago` : 'run lib/eval-battery.js')}
        ${tile('Evals in battery', e.battery ? int(e.battery.total) : '—', '')}
        ${tile('Failing', int(e.fails.length), '')}
        ${tile('Quarantined', int(e.quarantined.length), 'known, parked with a reason')}
        ${tile('Eval files on disk', int(e.onDisk), '')}
        ${tile('Eval coverage', s.kpis.evalCoverage + '%', 'hooks, packages and scripts with an eval')}
      </div>
      ${card('cov', 'Eval coverage by kind', 'Share of components that carry an eval file', slot('cov', barsSVG(cov, { label: 'Eval coverage', fmt: v => v + '%' }), cov.length * 26), table([{ label: 'Kind', html: x => esc(kindLabel(x.kind)) }, { key: 'withEval', label: 'With eval', num: true }, { key: 'total', label: 'Total', num: true }, { label: 'Share', num: true, html: x => pct(x.withEval, x.total) }], e.coverage))}
      <div class="grid cols-2">
        ${plain('Failing evals', 'From the latest eval battery run', table([{ key: 'eval', label: 'Eval' }, { label: 'Owner', html: x => esc(x.owner || '—') }], e.fails, { empty: 'No failing evals.', open: x => { const c = s.components.find(c => c.path === x.owner); return c ? c.id : null; } }))}
        ${plain('Quarantined evals', 'Parked with a reason, not counted as failures', table([{ key: 'eval', label: 'Eval' }, { key: 'reason', label: 'Reason', wrap: true }], e.quarantined, { empty: 'None quarantined.' }))}
      </div>
    </div>`;
  }

  function vQuests(s) {
    const q = s.quests; const counts = {}; for (const x of q) counts[x.status] = (counts[x.status] || 0) + 1;
    const order = ['active', 'blocked', 'hold', 'delegated', 'closed', 'archived'];
    const rows = q.slice().sort((a, b) => (order.indexOf(a.status) + 99 * (order.indexOf(a.status) < 0)) - (order.indexOf(b.status) + 99 * (order.indexOf(b.status) < 0)));
    return `<div class="stack">
      <div class="tiles">${order.filter(o => counts[o]).map(o => tile(o[0].toUpperCase() + o.slice(1), int(counts[o]), 'quests')).join('')}${tile('All blocks', int(q.length), 'quest/active.txt')}</div>
      ${plain('Quest board', 'Working memory from quest/active.txt in the main repo', table([{ key: 'qa', label: 'Quest' }, { label: 'Status', html: x => { const st = QUEST_STATUS[x.status] || ['neutral', '·']; return schip(st[0], st[1], x.status); } }, { key: 'phase', label: 'Phase' }, { key: 'type', label: 'Type' }, { key: 'urusan', label: 'Urusan' }, { key: 'env', label: 'Env' }, { label: 'Issue', wrap: true, html: x => esc(x.issue || x.current || '—') }], rows, { scroll: true, empty: 'quest/active.txt is empty or missing.' }))}
    </div>`;
  }

  function vMemory(s) {
    const m = s.memory, a = m.autoMemory; const sess = m.main.find(f => f.name === 'current-session.md');
    const types = a.types.map(t => ({ label: t.key, value: t.n }));
    const meter = sess ? `<div class="meter${sess.lines > m.sessionCap ? ' over' : ''}" role="meter" aria-valuemin="0" aria-valuemax="${m.sessionCap}" aria-valuenow="${sess.lines}" aria-label="Session memory lines"><span style="width:${Math.min(100, (100 * sess.lines) / m.sessionCap)}%"></span></div><p class="muted" style="margin:6px 0 0">${int(sess.lines)} of ${m.sessionCap} lines${sess.lines > m.sessionCap ? ' · over the cap' : ''}</p>` : '<p class="empty">current-session.md missing.</p>';
    return `<div class="stack">
      <div class="tiles">
        ${tile('Memories', int(a.total), a.dir)}
        ${tile('Index lines', int(a.indexLines), 'MEMORY.md')}
        ${tile('Broken index links', int(a.brokenLinks.length), '')}
        ${tile('Not indexed', int(a.unindexed.length), 'memory files missing from MEMORY.md')}
        ${tile('Diary', m.diary.latest ? esc(m.diary.latest) : '—', m.diary.hasToday ? 'entry exists today' : `${m.diary.daysSince} day(s) since last entry`)}
        ${tile('Diary days', int(m.diary.count), 'daily-diary/current')}
      </div>
      <div class="grid cols-2">
        ${card('memtypes', 'Memories by type', 'Frontmatter type of each auto-memory file', slot('memtypes', barsSVG(types, { label: 'Memory types' }), Math.max(26, types.length * 26)), table([{ key: 'key', label: 'Type' }, { key: 'n', label: 'Files', num: true }], a.types))}
        ${plain('Session memory size', 'main/current-session.md against its 500-line cap', meter)}
      </div>
      ${plain('main/ files', 'Identity, session, todo and format files', table([{ key: 'name', label: 'File' }, { key: 'lines', label: 'Lines', num: true }, { label: 'Size', num: true, html: x => bytes(x.bytes) }, { label: 'Modified', num: true, html: x => esc(ago(x.modified)) }], m.main))}
      <div class="grid cols-2">
        ${plain('Not in MEMORY.md', 'Memory files the index does not point to', list(a.unindexed.map(f => `<code>${esc(f)}</code>`), 'Every memory file is indexed.'))}
        ${plain('Broken index links', 'MEMORY.md lines pointing at a missing file', list(a.brokenLinks.map(f => `<code>${esc(f)}</code>`), 'No broken links.'))}
      </div>
    </div>`;
  }

  function vUnmanaged(s) {
    const st = s.strays; const wt = st.staleWorktrees; const safe = wt.filter(w => w.verdict === 'safe'), keep = wt.filter(w => w.verdict === 'keep');
    const sized = wt.filter(w => w.bytes != null); const gb = arr => arr.reduce((a, w) => a + (w.bytes || 0), 0);
    const sizeNote = sized.length ? `${bytes(gb(wt))} measured` : (s.meta.sizing ? 'sizing in the background…' : 'size not measured yet');
    const WT = { safe: ['good', '✓', 'Duplicate of main'], keep: ['serious', '!', 'Holds work not on main'], unchecked: ['neutral', '?', 'Not checked'] };
    const cls = { canonical: ['good', '✓', 'Canonical'], 'pending-nod': ['warning', '!', 'Pending your nod'], orphan: ['serious', '⊘', 'Orphan'] };
    return `<div class="stack">
      <div class="tiles">
        ${tile('Stray items', int(st.total), 'nothing owns these')}
        ${tile('Stale worktree folders', int(wt.length), sizeNote)}
        ${tile('Safe to delete', int(safe.length), sized.length ? bytes(gb(safe)) : 'duplicates of main')}
        ${tile('Hold unsaved work', int(keep.length), sized.length ? bytes(gb(keep)) : 'salvage first')}
        ${tile('Root entries not canonical', int(st.pendingOrOrphan.length), 'system/FOLDER-STRUCTURE.md')}
        ${tile('Conflict copies', int(st.conflictCopies.length), 'OneDrive machine duplicates')}
      </div>
      ${plain('Stale worktree folders', `Folders under .claude/worktrees that git no longer knows. Verdicts from the worktree-cleanup sweep${st.staleSweep ? ' of ' + esc(day(st.staleSweep.ts)) + (st.staleSweep.dry ? ' (dry run)' : '') : ''}.`, table([{ key: 'name', label: 'Folder' }, { label: 'Verdict', html: x => { const v = WT[x.verdict]; return schip(v[0], v[1], v[2]); } }, { key: 'why', label: 'Why', wrap: true }, { label: 'Size', num: true, html: x => (x.bytes == null ? '<span class="muted">…</span>' : bytes(x.bytes)) }, { label: 'Modified', num: true, html: x => esc(ago(x.modified)) }], wt, { scroll: true, empty: 'No stale worktree folders.' }))}
      ${plain('Root entries', 'Every entry at the project root, checked against the allow-list in system/FOLDER-STRUCTURE.md', table([{ key: 'name', label: 'Entry' }, { label: 'Class', html: x => { const c = cls[x.class]; return schip(c[0], c[1], c[2]); } }, { label: 'Files', num: true, html: x => (x.files == null ? '<span class="muted">not walked</span>' : int(x.files)) }, { label: 'Size', num: true, html: x => bytes(x.bytes) }, { label: 'Modified', num: true, html: x => esc(ago(x.modified)) }], st.rootEntries, { scroll: true }))}
      <div class="grid cols-2">
        ${plain('Unregistered hook files', 'Hook files settings.json never runs', list(st.unregisteredHooks.map(p => `<code>${esc(p)}</code>`), 'None.'))}
        ${plain('Scripts nothing references', 'core/ lib/ quest/ system/ scripts with zero references in code or docs', list(st.unreferencedScripts.map(x => `<code>${esc(x.path)}</code>`), 'Every script is referenced.'))}
      </div>
      <div class="grid cols-2">
        ${plain('Loose files inside features', 'Audit dumps, backups and scratch files in domain/ folders', list(st.looseFiles.map(x => `<code>${esc(x.path)}</code>`), 'None.'))}
        ${plain('Eval-only packages', 'A domain folder with an eval but no component', list(st.evalOnlyPackages.map(p => `<code>${esc(p)}</code>`), 'None.'))}
      </div>
      <div class="grid cols-2">
        ${plain('OneDrive conflict copies', 'Machine-suffixed duplicates', list(st.conflictCopies.map(p => `<code>${esc(p)}</code>`), 'None.'))}
        ${plain('Dated reports', `${st.reports.length} one-off report files in system/, .claude/ and the root`, `<details><summary>Show ${st.reports.length} files</summary>${list(st.reports.map(r => `<code>${esc(r.path)}</code> <span class="muted">${bytes(r.bytes)}</span>`))}</details>`)}
      </div>
    </div>`;
  }

  function vSources(s) {
    const t = Object.entries(s.meta.timings || {}).map(([k, v]) => ({ label: k, value: v, display: v + ' ms' }));
    return `<div class="stack">
      <div class="tiles">
        ${tile('Snapshot built in', int(s.meta.buildMs) + ' ms', esc(ago(s.meta.generated)))}
        ${tile('Live roots', int(s.meta.roots.length), s.meta.roots.map(esc).join(', '))}
        ${tile('Data files', int(s.sources.length), 'read for this snapshot')}
        ${tile('Telemetry rows', compact(s.sources.filter(x => x.kind === 'hook telemetry').reduce((a, x) => a + x.rows, 0)), 'hook-fires*.jsonl')}
      </div>
      ${plain('Data files', 'Every file this snapshot read', table([{ key: 'kind', label: 'Kind' }, { key: 'root', label: 'Root' }, { key: 'file', label: 'File' }, { label: 'Rows', num: true, html: x => int(x.rows) }, { label: 'Counted', num: true, html: x => (x.unique == null ? '—' : int(x.unique)) }, { label: 'Duplicates', num: true, html: x => (x.duplicates == null ? '—' : int(x.duplicates)) }, { label: 'Size', num: true, html: x => bytes(x.bytes) }, { label: 'Last write', num: true, html: x => esc(ago(x.last)) }, { key: 'note', label: 'Note', wrap: true }], s.sources, { scroll: true }))}
      <div class="grid cols-2">
        ${card('timings', 'Build time by stage', 'Where the snapshot spends its time', slot('timings', barsSVG(t, { label: 'Build stages' }), t.length * 26), table([{ key: 'label', label: 'Stage' }, { key: 'value', label: 'ms', num: true }], t))}
        ${plain('Git state', 'Main and registered worktrees (refreshed in the background)', s.meta.git ? table([{ key: 'root', label: 'Root' }, { key: 'branch', label: 'Branch' }, { key: 'head', label: 'HEAD' }, { key: 'behindMain', label: 'Behind main', num: true }, { key: 'aheadMain', label: 'Ahead', num: true }, { key: 'dirty', label: 'Changed files', num: true }], s.meta.git) : '<p class="empty">Reading git state… refresh in a few seconds.</p>')}
      </div>
      ${plain('Roots', 'Where the data comes from', `<dl class="kv"><dt>Code root</dt><dd><code>${esc(s.meta.codeRoot)}</code></dd><dt>Data root</dt><dd><code>${esc(s.meta.dataRoot)}</code></dd><dt>Window</dt><dd>${s.meta.windowDays} days (${esc(s.meta.days[0])} to ${esc(s.meta.days[s.meta.days.length - 1])})</dd></dl>`)}
    </div>`;
  }

  // ── drawer ──
  function drawerHtml(c) {
    const m = metric(c); const kv = pairs => `<dl class="kv">${pairs.filter(p => p[1] != null && p[1] !== '').map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
    let h = `<h2>${esc(c.name)}</h2><p style="margin:6px 0 0">${chip(c.verdict)} <span class="tag">${esc(kindLabel(c.kind))}</span></p><p class="muted" style="margin:8px 0 0"><code>${esc(c.path)}</code></p>`;
    h += `<h3>Purpose</h3>${c.purpose == null ? `<p class="muted">Purpose is not judged for this kind.</p>${c.description ? `<p>${esc(c.description)}</p>` : ''}` : c.purpose ? `<p>${esc(c.purpose)}</p>` : `<p>${schip('warning', '!', 'No purpose declared')} <span class="sec">It cannot be judged met or unmet until its goal is written down.</span></p>${c.description ? `<p class="sec">${esc(c.description)}</p>` : ''}`}`;
    if (c.disabled || c.retiredReason) h += `<p>${schip('neutral', '–', 'Switched off')} ${esc(c.disabled || c.retiredReason)}</p>`;
    const inF = state.snap.findings.filter(f => (f.components || []).includes(c.id));
    if (inF.length) h += `<h3>In findings</h3>${list(inF.map(f => `${sevChip(f.severity)}<div class="grow"><button class="link" type="button" data-finding="${esc(f.id)}">${esc(f.title)}</button></div>`))}`;
    if (c.notes && c.notes.length) h += `<h3>Ruri's notes</h3>${c.notes.map(noteHtml).join('')}`;
    if (c.runtime) {
      const days = state.snap.meta.days;
      h += `<h3>Liveness, last ${state.snap.meta.windowDays} days</h3><div class="tiles">${tile('Runs', int(c.runtime.runs), '')}${tile('Triggered', int(c.runtime.fired), 'predicate matched')}${tile('Blocks', int(c.runtime.blocks), '')}${tile('Errors', int(c.runtime.errs), '')}${tile('Avg', int(c.runtime.avgMs) + ' ms', '')}${tile('Last seen', esc(ago(c.runtime.last)), esc(day(c.runtime.last)))}</div>`;
      h += `<div style="margin-top:12px">${slot('drawer', lineSVG(c.runtime.spark, days, { label: 'Runs per day', unit: 'runs' }), 150)}</div>`;
    }
    if (c.kind === 'skill' && c.usage) h += `<h3>Usage</h3>${kv([['Last ' + state.snap.meta.windowDays + ' d', int(c.usage.window)], ['All time', int(c.usage.total)], ['Last used', esc(ago(c.usage.last))], ['Source', esc(c.source)]])}`;
    if (c.gaps && c.gaps.length) h += `<h3>Gaps</h3>${list(c.gaps.map(g => `${schip('warning', '!', 'Gap')}<div class="grow">${esc(g)}</div>`))}`;
    if (c.registration || ['feature', 'legacy-hook', 'bundle'].includes(c.kind)) {
      h += `<h3>Registration</h3>${c.registration ? kv([['Events', esc((c.registration.events || []).join(', '))], ['Matchers', esc((c.registration.matchers || []).join(', ') || 'every call')], ['Mode', esc(c.registration.mode)], ['Bundles', esc((c.registration.bundles || []).join(', '))], ['Observable', c.observable ? 'yes, writes telemetry or a log' : 'no']]) : `<p class="empty">${c.optOut ? 'Helper module (opted out of registration).' : 'Not registered in settings.json.'}</p>`}`;
    }
    if (c.hooks && c.hooks.length) h += `<h3>Hook files</h3>${list(c.hooks.map(x => `<span class="dot s-${x.registration ? 'good' : 'serious'}" aria-hidden="true"></span><div class="grow"><code>${esc(x.file)}</code><br><span class="muted">${x.registration ? 'registered · ' + esc(x.registration.events.join(', ')) + ' · ' + esc(x.registration.mode) : 'not registered'}${x.observable ? ' · observable' : ''}</span></div>`))}`;
    if (c.children) h += `<h3>Bundled hooks</h3>${list(c.children.map(x => `<code>${esc(x)}</code>`))}`;
    h += `<h3>Eval</h3>${c.evals && c.evals.length ? `<p>${evalChip(c.evalStatus)}</p>${list(c.evals.map(x => `<code>${esc(x)}</code>`))}` : '<p class="empty">No eval file.</p>'}`;
    const why = c.readme || {};
    if (why.goal || why.symptom || why.retention || c.lifecycle || c.born) h += `<h3>Why it exists</h3>${kv([['Goal', esc(why.goal)], ['Symptom', esc(why.symptom)], ['Retention', esc(why.retention)], ['Goal status', esc(why.goal_status)], ['Lifecycle', esc(c.lifecycle)], ['Born', esc(day(c.born))]])}`;
    if (c.kind === 'script') h += `<h3>Wiring</h3>${kv([['Referenced by', int(c.refs) + ' file(s)'], ['Last logged run', esc(ago(c.lastRun))], ['Writes a log', c.observable ? 'yes' : 'no']])}${c.refFiles && c.refFiles.length ? list(c.refFiles.map(f => `<code>${esc(f)}</code>`)) : ''}`;
    if (c.log && c.log.last) h += `<h3>Own log</h3>${kv([['Rows in window', int(c.log.rows)], ['Last row', esc(ago(c.log.last))]])}`;
    if (c.fileCount != null) h += `<h3>Size</h3>${kv([['Files', int(c.fileCount)], ['Bytes', bytes(c.bytes)], ['Modified', esc(ago(c.modified))]])}`;
    else if (c.modified) h += `<h3>File</h3>${kv([['Modified', esc(ago(c.modified))], ['Size', bytes(c.bytes)], ['Generated', c.generated ? 'yes (never hand-edit)' : '']])}`;
    const files = (c.files || []).concat(c.support || []).filter((f, i, a) => a.indexOf(f) === i);
    if (files.length) h += `<h3>Files</h3>${list(files.map(f => `<code>${esc(f)}</code>${(c.support || []).includes(f) ? ' <span class="tag">support</span>' : ''}`))}`;
    return h;
  }
  function openDrawer(id) {
    const c = byId(id); if (!c) return;
    state.drawer = id; state.lastFocus = document.activeElement;
    $('#drawer-body').innerHTML = drawerHtml(c);
    $('#drawer').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('open');
    drawAll(); $('#drawer-close').focus();
  }
  function closeDrawer() {
    if (!state.drawer) return;
    state.drawer = null; delete state.charts.drawer;
    $('#drawer').classList.remove('open'); $('#drawer').setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('open');
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  // ── render + routing ──
  const VIEWS = { overview: vOverview, findings: vFindings, catalog: vCatalog, runtime: vRuntime, monitoring: vMonitoring, mistakes: vMistakes, evals: vEvals, quests: vQuests, memory: vMemory, unmanaged: vUnmanaged, sources: vSources };
  function route() { const r = (location.hash || '#overview').slice(1); return TABS.includes(r) ? r : 'overview'; }
  function renderMeta() {
    const s = state.snap; if (!s) return;
    const g = (s.meta.git || []).find(x => x.root === 'main');
    $('#meta').textContent = `${s.meta.project} · ${s.kpis.components} components · window ${s.meta.windowDays} days · generated ${new Date(s.meta.generated).toLocaleString()} in ${(s.meta.buildMs / 1000).toFixed(1)} s${g ? ` · main @ ${g.head}` : ''}`;
  }
  function render() {
    const r = route();
    document.querySelectorAll('#tabs a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + r ? 'page' : 'false'));
    document.body.classList.toggle('fit', r === 'overview' && fitMode());
    document.title = `${r[0].toUpperCase() + r.slice(1)} · Lapis Lazuli Observatory`;
    if (state.error && !state.snap) { $('#view').innerHTML = plain('Could not load the snapshot', '', `<p>${esc(state.error)}</p><button class="btn" type="button" data-retry>Retry</button>`); return; }
    if (!state.snap) { $('#view').innerHTML = '<p class="empty">Building the snapshot…</p>'; return; }
    const keep = state.charts.drawer; state.charts = keep ? { drawer: keep } : {};
    $('#view').innerHTML = VIEWS[r](state.snap);
    renderMeta();
    if (r === 'overview') sizeOverview();
    drawAll();
    if (r === 'findings' && !state.audit && !state.auditLoading) loadAudit(false);
  }
  async function load(fresh) {
    document.body.classList.add('loading'); $('#refresh').disabled = true;
    try {
      const res = await fetch(`/api/snapshot?days=${state.days}${fresh ? '&fresh=1' : ''}`);
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200));
      state.snap = await res.json(); state.error = null;
    } catch (e) { state.error = String(e.message || e); }
    finally { document.body.classList.remove('loading'); $('#refresh').disabled = false; }
    render();
    if (state.drawer) { const c = byId(state.drawer); if (c) { $('#drawer-body').innerHTML = drawerHtml(c); drawAll(); } else closeDrawer(); }
  }
  async function loadAudit(fresh) {
    state.auditLoading = true;
    try { const res = await fetch('/api/audit' + (fresh ? '?fresh=1' : '')); state.audit = res.ok ? await res.json() : { error: 'HTTP ' + res.status }; }
    catch (e) { state.audit = { error: String(e.message || e) }; }
    finally { state.auditLoading = false; }
    const el = document.getElementById('audit-body'); if (el) el.innerHTML = auditHtml();
  }
  function go(target) {
    const [tab, verdict] = String(target).split(':');
    if (tab === 'catalog') { state.cat.q = ''; state.cat.kind = ''; state.cat.verdicts = new Set(verdict ? [verdict] : []); }
    if (location.hash === '#' + tab) render(); else location.hash = tab;
    window.scrollTo(0, 0);
  }

  // ── theme ──
  function effectiveTheme() { return document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function paintThemeButton() { const t = effectiveTheme(); $('#theme').textContent = t === 'dark' ? 'Light theme' : 'Dark theme'; $('#theme').setAttribute('aria-pressed', String(t === 'dark')); }

  // ── events ──
  const tip = $('#tip');
  function showTip(e, html) { tip.innerHTML = html; tip.classList.add('show'); const x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8); const y = Math.max(8, e.clientY - tip.offsetHeight - 12); tip.style.left = Math.max(8, x) + 'px'; tip.style.top = y + 'px'; }
  document.addEventListener('mousemove', e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) { tip.classList.remove('show'); document.querySelectorAll('.cross, .marker').forEach(n => n.setAttribute('visibility', 'hidden')); return; }
    showTip(e, t.getAttribute('data-tip'));
    const id = t.getAttribute('data-line');
    if (id) { const x = document.getElementById(id + '-x'), m = document.getElementById(id + '-m'); if (x && m) { x.setAttribute('x1', t.dataset.cx); x.setAttribute('x2', t.dataset.cx); x.setAttribute('visibility', 'visible'); m.setAttribute('cx', t.dataset.cx); m.setAttribute('cy', t.dataset.cy); m.setAttribute('visibility', 'visible'); } }
  });
  document.addEventListener('click', e => {
    const t = e.target;
    const tw = t.closest('[data-twin]'); if (tw) { const id = tw.dataset.twin; state.twins.has(id) ? state.twins.delete(id) : state.twins.add(id); render(); return; }
    const gt = t.closest('[data-go]'); if (gt) { go(gt.dataset.go); return; }
    const sc = t.closest('[data-cat]'); if (sc) { const [kind, verdict] = sc.dataset.cat.split('|'); state.cat = { ...state.cat, q: '', kind, verdicts: new Set([verdict]) }; location.hash = 'catalog'; return; }
    const so = t.closest('th[data-sort]'); if (so) { const k = so.dataset.sort; state.cat.sort = { key: k, dir: state.cat.sort.key === k ? -state.cat.sort.dir : 1 }; $('#cat-table').innerHTML = catTable(); return; }
    const fr = t.closest('[data-finding]'); if (fr) { const id = fr.dataset.finding; state.find = { q: '', sev: new Set(), decide: '' }; if (location.hash !== '#findings') location.hash = 'findings'; else render(); setTimeout(() => { const el = document.getElementById('f-' + id); if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); } }, 60); return; }
    const sv = t.closest('[data-sev]'); if (sv) { const v = sv.dataset.sev; state.find.sev.has(v) ? state.find.sev.delete(v) : state.find.sev.add(v); render(); return; }
    const vf = t.closest('[data-verdict]'); if (vf) { const v = vf.dataset.verdict; state.cat.verdicts.has(v) ? state.cat.verdicts.delete(v) : state.cat.verdicts.add(v); vf.setAttribute('aria-pressed', String(state.cat.verdicts.has(v))); $('#cat-table').innerHTML = catTable(); return; }
    const op = t.closest('[data-open]'); if (op) { openDrawer(op.dataset.open); return; }
    if (t.closest('[data-retry]')) { load(true); return; }
    if (t.id === 'cat-reset') { state.cat = { q: '', kind: '', verdicts: new Set(), sort: state.cat.sort }; render(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
    if (e.key === 'Enter' && e.target.matches && e.target.matches('tr[data-open]')) openDrawer(e.target.dataset.open);
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'cat-q') { state.cat.q = e.target.value; $('#cat-table').innerHTML = catTable(); }
    if (e.target.id === 'f-q') { state.find.q = e.target.value; const pos = e.target.selectionStart; render(); const el = document.getElementById('f-q'); el.focus(); el.setSelectionRange(pos, pos); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'cat-kind') { state.cat.kind = e.target.value; $('#cat-table').innerHTML = catTable(); }
    if (e.target.id === 'f-decide') { state.find.decide = e.target.value; render(); }
  });
  $('#scrim').addEventListener('click', closeDrawer);
  $('#drawer-close').addEventListener('click', closeDrawer);
  $('#refresh').addEventListener('click', () => { state.audit = null; load(true); });
  $('#days').addEventListener('change', e => { state.days = parseInt(e.target.value, 10); load(false); });
  $('#theme').addEventListener('click', () => { const next = effectiveTheme() === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; try { localStorage.setItem('lapis-theme', next); } catch (_) {} paintThemeButton(); });
  window.addEventListener('hashchange', () => { closeDrawer(); render(); });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => (route() === 'overview' && state.snap ? render() : drawAll()), 150); });

  paintThemeButton();
  render();
  load(false);
  window.__observatory = { state, render, openDrawer, closeDrawer };
})();
