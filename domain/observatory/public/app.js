// Lapis Lazuli Observatory — client (vanilla JS, inline SVG charts, no dependencies)
// Top-down by design: L0 Overview (glance) → L1 area tabs → L2 item (expanded finding, Feature drawer) → L3 evidence (collapsed lists).
'use strict';
(function () {
  const $ = s => document.querySelector(s);

  // ── vocabulary: one definition per word; labels, tooltips, the glossary and the guide all read from here ──
  const TERMS = {
    feature: ['Feature', 'One capability of Lapis Lazuli with a purpose, made of parts. The top unit here (system-design: a skill, hook and eval together, any piece optional).'],
    part: ['Part', 'A file that does one job for a Feature: its folder (hooks, eval, README, log), a skill, a hook, a script, a protocol doc or a workflow.'],
    hook: ['Hook', 'A part Claude Code runs by itself on an event: session start, your prompt, a tool call, or the end of a reply.'],
    skill: ['Skill', 'Written instructions a session follows when its name or trigger phrase comes up.'],
    script: ['Script', 'A program run by hand or by a hook.'],
    eval: ['Eval', 'A Feature’s tests: the mechanical proof it still does what it should.'],
    purpose: ['Purpose', 'The goal a part declares: README goal:, a script header goal:, or a skill description. Without one, a part cannot be judged met or unmet.'],
    verdict: ['Verdict', 'A Feature’s health in a word or two, taken from its worst part.'],
    layout: ['Layout', 'Where a Feature’s parts live. Feature folder = domain/<name>/ (the current standard). Legacy hook = .claude/hooks, built before Features. Skill only = just a skill. Protocol = a Feature/ doc system. Workflow = a multi-agent script.'],
    finding: ['Finding', 'Something wrong the data shows, read left to right: Fact, Context, Judgement.'],
    fact: ['Fact', 'The mechanical statement and its evidence, computed from the files. No opinion.'],
    context: ['Context', 'What the fact means in this system.'],
    judgement: ['Judgement', 'My verdict, why I think so, the next action, and who decides: you or me.'],
    note: ['Note', 'An investigation I recorded on a finding or Feature. Marked stale when the evidence it was written against changes.'],
    run: ['Run', 'One execution of a hook. Rows repeated across telemetry files are counted once.'],
    block: ['Block', 'A gate stopping a reply or a tool call.'],
    turn: ['Turn', 'One prompt from you and one reply from me.'],
    slip: ['Slip', 'A mistake logged to system/slips.jsonl.'],
    shared: ['Shared library', 'A script several Features use, so it belongs to none of them.'],
    stray: ['Stray', 'A file or folder no Feature owns.'],
    observability: ['Observability', 'Did it run, did it block, how long did it take.'],
    monitoring: ['Monitoring', 'Why it ran, for which quest and phase, and what it cost you: re-asks and corrections.'],
    quest: ['Quest', 'A ticket or adhoc task tracked in quest/active.txt.'],
  };
  const term = (k, text) => `<span class="term" tabindex="0" data-tip="<b>${esc(TERMS[k][0])}</b><br>${esc(TERMS[k][1])}">${esc(text || TERMS[k][0])}</span>`;

  const VERDICT = {
    ghost: { icon: '?', label: 'Broken wiring', status: 'critical', means: 'settings.json points at a file that does not exist' },
    failing: { icon: '✕', label: 'Failing tests', status: 'critical', means: 'its eval failed in the last battery run' },
    unregistered: { icon: '⊘', label: 'Not wired', status: 'serious', means: 'a hook file settings.json never runs' },
    silent: { icon: '○', label: 'Not running', status: 'warning', means: 'registered, yet 0 runs in the window' },
    gaps: { icon: '!', label: 'Needs work', status: 'warning', means: 'missing an eval, README, purpose, retention or log' },
    healthy: { icon: '✓', label: 'Healthy', status: 'good', means: 'no gap, runs when it should, tests pass' },
    retired: { icon: '–', label: 'Retired', status: 'neutral', means: 'switched off on purpose; the reason is in its file' },
  };
  const VORDER = ['ghost', 'failing', 'unregistered', 'silent', 'gaps', 'healthy', 'retired'];
  const SEV = { critical: ['critical', '✕', 'Critical'], serious: ['serious', '!', 'Serious'], warning: ['warning', '!', 'Warning'], info: ['info', 'i', 'Info'] };
  const ROLE = { folder: 'Folder', skill: 'Skill', hook: 'Hook', script: 'Script', protocol: 'Protocol doc', workflow: 'Workflow' };
  const NAV = [
    { id: 'overview', label: 'Overview' },
    { id: 'findings', label: 'Findings' },
    { id: 'features', label: 'Features' },
    { id: 'activity', label: 'Activity', subs: [['hooks', 'Hooks'], ['turns', 'Turns & quests'], ['mistakes', 'Mistakes'], ['evals', 'Evals']] },
    { id: 'estate', label: 'Estate', subs: [['strays', 'Strays'], ['stores', 'Stores & docs'], ['sources', 'Data sources']] },
  ];

  const state = { snap: null, days: 30, audit: null, auditLoading: false, error: null, drawer: null, twins: new Set(), charts: {}, open: new Set(),
    feat: { q: '', layout: '', verdicts: new Set(), sort: { key: 'verdict', dir: 1 } }, find: { q: '', sev: new Set(), decide: '' } };

  // ── formatting ──
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  const int = n => (n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-US'));
  const compact = n => { if (n == null) return '—'; const a = Math.abs(n); if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M'; if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'K'; return String(Math.round(n)); };
  const bytes = b => (b == null ? '—' : b < 1024 ? b + ' B' : b < 1048576 ? Math.round(b / 1024) + ' KB' : b < 1073741824 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1073741824).toFixed(2) + ' GB');
  const ago = ts => { if (!ts) return '—'; const d = (Date.now() - Date.parse(ts)) / 1000; if (!Number.isFinite(d)) return '—'; if (d < 90) return 'just now'; if (d < 5400) return Math.round(d / 60) + ' min ago'; if (d < 129600) return Math.round(d / 3600) + ' h ago'; return Math.round(d / 86400) + ' d ago'; };
  const day = ts => (ts ? String(ts).slice(0, 10) : '—');
  const pct = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '—');
  const chip = v => { const m = VERDICT[v] || { icon: '·', label: v, status: 'neutral' }; return `<span class="chip s-${m.status}" title="${esc(m.means || '')}"><i aria-hidden="true">${m.icon}</i>${esc(m.label)}</span>`; };
  const schip = (status, icon, label) => `<span class="chip s-${status}"><i aria-hidden="true">${icon}</i>${esc(label)}</span>`;
  const sevChip = sv => { const x = SEV[sv] || ['neutral', '·', sv]; return schip(x[0], x[1], x[2]); };
  const byId = id => (state.snap ? state.snap.components.find(c => c.id === id) : null);
  const featById = id => (state.snap ? state.snap.features.find(f => f.id === id) : null);

  // ── charts (inline SVG; dataviz reference marks: 2 px lines, ≤24 px bars, 4 px rounded data-ends) ──
  function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
  function slot(id, fn, height) { state.charts[id] = { fn, height }; return `<div class="chart" id="ch-${id}" style="height:${height}px"></div>`; }
  function drawAll() { for (const [id, c] of Object.entries(state.charts)) { const el = document.getElementById('ch-' + id); if (!el) continue; el.innerHTML = c.fn(Math.max(160, el.clientWidth), c.height, id); } }
  // axis top and ticks on round steps (1, 2, 5 × 10^n) with at most 4 intervals: 0 · 10K · 20K · 30K, never 13K
  function niceStep(v) { if (v <= 0) return 1; for (let p = Math.pow(10, Math.floor(Math.log10(v)) - 1); ; p *= 10) for (const m of [1, 2, 5]) if (Math.ceil(v / (m * p)) <= 4) return m * p; }
  function niceTop(v) { const st = niceStep(v); return Math.max(st, Math.ceil(v / st) * st); }
  function ticks(top) { const st = niceStep(top), out = []; for (let t = 0; t <= top + st / 2; t += st) out.push(t); return out; }
  function lineSVG(values, labels, opt) {
    return (w, h, id) => {
      const m = { l: 46, r: 14, t: 10, b: 24 }; const iw = w - m.l - m.r, ih = Math.max(20, h - m.t - m.b); const n = values.length;
      const max = niceTop(Math.max(0, ...values)); const x = i => m.l + (n <= 1 ? iw / 2 : (i * iw) / (n - 1)); const y = v => m.t + ih - (v / max) * ih;
      const f = opt.fmt || compact; let s = `<svg width="${w}" height="${h}" role="img" aria-label="${esc(opt.label)}">`;
      for (const t of ticks(max)) s += `<line class="gridline" x1="${m.l}" x2="${w - m.r}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-t" x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${esc(f(t))}</text>`;
      s += `<line class="baseline" x1="${m.l}" x2="${w - m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
      if (n) {
        const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
        s += `<path class="area-1" d="M${x(0)},${y(0)} L${pts.join(' L')} L${x(n - 1)},${y(0)} Z"/><path class="line-1" d="M${pts.join(' L')}"/>`;
        for (const i of [...new Set([0, Math.floor((n - 1) / 2), n - 1])]) s += `<text class="axis-t" x="${x(i)}" y="${h - 6}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(String(labels[i]).slice(5))}</text>`;
        s += `<line class="cross" id="${id}-x" x1="0" x2="0" y1="${m.t}" y2="${y(0)}" visibility="hidden"/><circle class="marker" id="${id}-m" r="4" cx="0" cy="0" visibility="hidden"/>`;
        const step = n > 1 ? iw / (n - 1) : iw;
        values.forEach((v, i) => { s += `<rect x="${x(i) - step / 2}" y="${m.t}" width="${step}" height="${ih}" fill="transparent" data-line="${id}" data-cx="${x(i)}" data-cy="${y(v)}" data-tip="<b>${esc(labels[i])}</b><br>${esc(int(Math.round(v)))} ${esc(opt.unit || '')}"/>`; });
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
        s += `<rect x="0" y="${y0}" width="${w}" height="${rowH}" fill="transparent" data-tip="<b>${esc(lab)}</b><br>${esc(r.tip || (opt.fmt || int)(r.value))}"/>`;
      });
      return s + '</svg>';
    };
  }
  function sparkSVG(values, w, h) {
    if (!values || !values.length) return '';
    const max = Math.max(1, ...values); const n = values.length; const x = i => (n <= 1 ? w / 2 : (i * (w - 4)) / (n - 1) + 2); const y = v => h - 3 - (v / max) * (h - 6);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%" height="${h}" aria-hidden="true"><line class="spark-base" x1="0" x2="${w}" y1="${h - 1}" y2="${h - 1}"/><polyline class="spark-line" vector-effect="non-scaling-stroke" points="${values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}"/></svg>`;
  }
  function verdictBar(counts, total) {
    const segs = VORDER.filter(v => counts[v]).map(v => `<span class="vseg fill-${VERDICT[v].status}" style="flex:${counts[v]}" data-tip="<b>${esc(VERDICT[v].label)}</b><br>${counts[v]} Features · ${esc(VERDICT[v].means)}" data-fverdict="${v}"></span>`).join('');
    return `<div class="vbar" role="img" aria-label="${esc(VORDER.filter(v => counts[v]).map(v => counts[v] + ' ' + VERDICT[v].label).join(', '))} of ${total} Features">${segs}</div>`;
  }

  // ── building blocks (one anatomy per block, reused everywhere) ──
  function card(title, sub, body, opt = {}) {
    const twin = opt.twin != null; const t = twin && state.twins.has(opt.id);
    return `<section class="card${opt.cls ? ' ' + opt.cls : ''}"${opt.tour ? ` data-tour="${opt.tour}"` : ''}><div class="card-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${twin ? `<button class="twin-btn" type="button" data-twin="${opt.id}" aria-pressed="${t}">${t ? 'Show chart' : 'Show table'}</button>` : ''}${opt.action || ''}</div>${t ? opt.twin : body}</section>`;
  }
  // a closed-by-default level: the heading says what is inside; the body is built only once opened
  function fold(id, title, summary, body) {
    const open = state.open.has(id);
    return `<details class="card fold" data-fold="${id}"${open ? ' open' : ''}><summary><span class="fold-t">${title}</span><span class="fold-s">${summary}</span></summary><div class="fold-b">${open ? body : ''}</div></details>`;
  }
  function table(cols, rows, opt = {}) {
    if (!rows.length) return `<p class="empty">${esc(opt.empty || 'Nothing here.')}</p>`;
    return `<div class="tablewrap${opt.scroll ? ' scroll-y' : ''}"><table><thead><tr>${cols.map(c => `<th${c.num ? ' class="num"' : ''} scope="col">${c.label}</th>`).join('')}</tr></thead><tbody>${rows.map(r => { const o = opt.open && opt.open(r); return `<tr${o ? ` class="row" tabindex="0" data-open="${esc(o)}"` : ''}>${cols.map(c => `<td class="${c.num ? 'num' : ''}${c.wrap ? ' wrap' : ''}">${c.html ? c.html(r) : esc(r[c.key] == null ? '—' : r[c.key])}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div>`;
  }
  // stat card anatomy: label · value · sub · a reserved chart row (so text and sparkline never overlap)
  function kpi(label, value, sub, opt = {}) {
    const inner = `<span class="kpi-l">${label}</span><span class="kpi-v">${value}</span><span class="kpi-s">${sub || '&nbsp;'}</span><span class="kpi-c">${opt.spark || ''}</span>`;
    return opt.go ? `<button class="kpi" type="button" data-go="${esc(opt.go)}">${inner}</button>` : `<div class="kpi">${inner}</div>`;
  }
  const kpis = items => `<div class="kpis">${items.join('')}</div>`;
  function list(items, empty) { return items.length ? `<ul class="list">${items.map(i => `<li>${i}</li>`).join('')}</ul>` : `<p class="empty">${esc(empty || 'None.')}</p>`; }
  const dayTable = (rows, cols) => table([{ key: 'day', label: 'Day (UTC)' }, ...cols], rows.slice().reverse(), { scroll: true });
  const code = s => `<code>${esc(s)}</code>`;
  function noteHtml(n) {
    return `<div class="note${n.stale ? ' stale' : ''}"><div class="note-h">${n.stale ? schip('warning', '!', 'Stale: evidence changed since') : schip('info', 'i', 'Investigated')} <span class="muted">${esc(n.by || 'ruri')} · ${esc(day(n.ts))}</span></div>${n.context ? `<p>${esc(n.context)}</p>` : ''}<p><strong>${esc(n.judgement)}</strong></p><p class="sec">Because: ${esc(n.justification)}</p>${n.action ? `<p>Next: ${esc(n.action)}</p>` : ''}</div>`;
  }
  const openTarget = cid => (state.snap.partOf[cid] || cid);   // a part opens its Feature; anything else opens on its own

  // ═════════ L0 · Overview: is it OK, what needs me ═════════
  function fitMode() { return window.innerWidth >= 1100 && window.innerHeight >= 620; }
  function vOverview(s) {
    const k = s.kpis; const fit = fitMode(); const d = s.runtime.daily;
    const top = s.findings.filter(f => f.severity === 'critical' || f.severity === 'serious').concat(s.findings.filter(f => f.severity === 'warning')).slice(0, 10);
    const legend = VORDER.filter(v => k.featureVerdicts[v]).map(v => `<button type="button" class="vl" data-fverdict="${v}">${chip(v)}<span class="vl-n">${k.featureVerdicts[v]}</span></button>`).join('');
    const tot = d.reduce((a, x) => ({ runs: a.runs + x.runs, blocks: a.blocks + x.blocks, errs: a.errs + x.errs }), { runs: 0, blocks: 0, errs: 0 });
    const f = k.findings || {};
    return `<div class="ov${fit ? ' fit' : ''}">
      <div class="ov-top">
        <section class="card ov-health" data-tour="health">
          <div class="ov-health-top"><div class="hero-num">${k.featureHealthPct}%</div><div class="hero-text"><strong>of ${term('feature', 'Features')} are healthy</strong><span>${int(k.featuresHealthy)} of ${int(k.featuresActive)} Features · ${int(k.featureVerdicts.retired || 0)} retired, not counted</span></div></div>
          ${verdictBar(k.featureVerdicts, k.features)}
          <div class="vlegend">${legend}</div>
        </section>
        <div data-tour="kpis">${kpis([
          kpi(term('finding', 'Open findings'), int(s.findings.length), `${f.critical || 0} critical · ${f.serious || 0} serious`, { go: 'findings' }),
          kpi(`${term('hook', 'Hooks')} running`, `${k.hooksLive} <small>of ${k.hooksRegistered}</small>`, `ran in the last ${s.meta.windowDays} days`, { go: 'activity/hooks', spark: sparkSVG(k.runsSpark, 120, 26) }),
          kpi(term('slip', 'Mistakes'), int(k.slipsWeek), 'logged in the last 7 days', { go: 'activity/mistakes', spark: sparkSVG(k.slipsSpark, 120, 26) }),
        ])}</div>
      </div>
      <div class="ov-main">
        ${card('Needs attention', `Worst first · ${term('fact', 'fact')}, ${term('context', 'context')} and ${term('judgement', 'judgement')} one click away`, `<ul class="list attn body">${top.map(x => `<li><button type="button" class="frow" data-finding="${esc(x.id)}">${sevChip(x.severity)}<span class="grow"><span class="ftitle">${esc(x.title)}</span><span class="fjudge">${esc(x.judgement)}</span></span></button></li>`).join('') || '<li class="empty">Nothing needs attention.</li>'}</ul>`,
          { cls: 'panel', tour: 'attention', action: `<button class="twin-btn" type="button" data-go="findings">All ${s.findings.length} findings</button>` })}
        ${card(`${term('run', 'Hook runs')} per day`, `Last ${s.meta.windowDays} days (UTC) · ${compact(tot.runs)} runs · ${int(tot.blocks)} ${term('block', 'blocks')} · ${int(tot.errs)} errors`, `<div class="body">${slot('runs', lineSVG(d.map(x => x.runs), d.map(x => x.day), { label: 'Hook runs per day', unit: 'runs' }), fit ? 160 : 220)}</div>`,
          { cls: 'panel', tour: 'trend', action: `<button class="twin-btn" type="button" data-go="activity/hooks">Open activity</button>` })}
      </div>
    </div>`;
  }
  // refit when the panels change size for any reason (late fonts, the meta line wrapping), not only on window resize
  let ovObserver = null;
  function watchOverview() {
    if (ovObserver) ovObserver.disconnect(); const main = document.querySelector('.ov.fit .ov-main'); if (!main || !window.ResizeObserver) return;
    let lastH = main.clientHeight, raf = 0;
    ovObserver = new ResizeObserver(() => { if (main.clientHeight === lastH) return; lastH = main.clientHeight; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { sizeOverview(); drawAll(); }); });
    ovObserver.observe(main);
  }
  function sizeOverview() {
    const body = document.querySelector('.ov.fit .ov-main .panel:nth-child(2) .body'); if (!body) return;
    const h = Math.max(120, body.clientHeight - 6); if (state.charts.runs) state.charts.runs.height = h; const el = document.getElementById('ch-runs'); if (el) el.style.height = h + 'px';
    // show only the rows that fit whole; the rest stay one click away behind All findings
    const ul = document.querySelector('.ov.fit .attn'); if (!ul) return;
    const lis = [...ul.children]; lis.forEach(li => { li.hidden = false; }); const bottom = ul.getBoundingClientRect().bottom + 1; let cut = false;
    for (const li of lis) { if (!cut && li.getBoundingClientRect().bottom > bottom) cut = true; if (cut) li.hidden = true; }
  }

  // ═════════ L1 · Findings: an accordion — title + judgement first, the three layers and evidence on open ═════════
  function goalTags(ids) { const g = state.snap.goals || []; return ids.map(id => { const t = g.find(x => x.id === id); return `<span class="tag" title="System goal ${esc(id)}: ${esc(t ? t.title : '')}">${esc(id)} ${esc(t ? t.title.split(/[,—]/)[0].slice(0, 30) : '')}</span>`; }).join(' '); }
  function findingBody(f) {
    const feats = (f.features || []).map(featById).filter(Boolean);
    return `<div class="layers">
        <section><h4>${term('fact')} <span class="muted">from the data</span></h4><p>${esc(f.fact)}</p><details${f.evidence.length <= 5 ? ' open' : ''}><summary>Evidence (${f.evidence.length})</summary><ul class="ev">${f.evidence.map(e => `<li>${e.id ? `<button type="button" class="link" data-open="${esc(openTarget(e.id))}">${esc(e.text)}</button>` : esc(e.text)}</li>`).join('')}</ul></details></section>
        <section><h4>${term('context')} <span class="muted">what it means</span></h4><p>${esc(f.context)}</p></section>
        <section><h4>${term('judgement')} <span class="muted">verdict, why, next</span></h4><p><strong>${esc(f.judgement)}</strong></p><p class="sec">Because: ${esc(f.justification)}</p><p>Next: ${esc(f.action)}</p></section>
      </div>
      <div class="fmeta">${f.decide === 'miya' ? schip('warning', '!', 'Your decision') : schip('info', 'i', 'I act on this')} ${goalTags(f.goals || [])}${feats.length ? ` <span class="muted">· ${feats.length} Feature${feats.length > 1 ? 's' : ''}:</span> ${feats.slice(0, 6).map(x => `<button type="button" class="tag link-tag" data-open="${esc(x.id)}">${esc(x.name)}</button>`).join(' ')}${feats.length > 6 ? ` <span class="muted">+${feats.length - 6} more in the evidence</span>` : ''}` : ''}</div>
      ${(f.notes || []).length ? `<details class="notes"><summary>${f.notes.length} investigation note${f.notes.length > 1 ? 's' : ''}</summary>${f.notes.map(noteHtml).join('')}</details>` : ''}
      <p class="muted retrieve">In a terminal: ${code('node lib/observatory.js --finding ' + f.id)}</p>`;
  }
  function vFindings(s) {
    const fl = state.find; const q = fl.q.trim().toLowerCase();
    const rows = s.findings.filter(f => (!fl.sev.size || fl.sev.has(f.severity)) && (!fl.decide || f.decide === fl.decide) && (!q || (f.id + ' ' + f.title + ' ' + f.fact + ' ' + f.context + ' ' + f.judgement + ' ' + f.evidence.map(e => e.text).join(' ')).toLowerCase().includes(q)));
    const chips = ['critical', 'serious', 'warning', 'info'].map(v => `<button type="button" class="fchip" data-sev="${v}" aria-pressed="${fl.sev.has(v)}">${sevChip(v)}<span class="muted">${s.findings.filter(f => f.severity === v).length}</span></button>`).join('');
    const item = f => { const open = state.open.has('f:' + f.id); return `<article class="fitem${open ? ' is-open' : ''}" id="f-${esc(f.id)}">
        <button type="button" class="fhead" data-toggle="f:${esc(f.id)}" aria-expanded="${open}">${sevChip(f.severity)}<span class="grow"><span class="ftitle">${esc(f.title)}</span><span class="fjudge">${esc(f.judgement)}</span></span>${f.decide === 'miya' ? '<span class="tag">Your decision</span>' : ''}${(f.notes || []).length ? '<span class="tag">note</span>' : ''}<span class="chev" aria-hidden="true">›</span></button>
        ${open ? `<div class="fbody">${findingBody(f)}</div>` : ''}</article>`; };
    return `<div class="stack">
      ${card('Findings', `Everything the data shows is wrong, worst first. Open one to read it as ${term('fact')} → ${term('context')} → ${term('judgement')}.`,
        `<div class="filters"><label class="sr" for="f-q">Search findings</label><input id="f-q" type="search" placeholder="Search fact, evidence, judgement…" value="${esc(fl.q)}"><label class="sr" for="f-decide">Who decides</label><select id="f-decide"><option value="">Anyone decides</option><option value="miya"${fl.decide === 'miya' ? ' selected' : ''}>Your decision</option><option value="ruri"${fl.decide === 'ruri' ? ' selected' : ''}>I act on it</option></select></div><div class="filters" role="group" aria-label="Severity">${chips}<span class="count">${rows.length} of ${s.findings.length}</span></div>`, { tour: 'findings-filters' })}
      <div class="flist" data-tour="finding-list">${rows.map(item).join('') || '<p class="empty">No finding matches.</p>'}</div>
      ${fold('audit', 'Domain Expansion audit screen', 'lib/audit-briefing.js · its hook totals run high until it de-duplicates telemetry', `<div id="audit-body" class="audit">${auditHtml()}</div>`)}
    </div>`;
  }
  function auditHtml() {
    const a = state.audit; if (!a) return '<p class="empty">Loading the audit…</p>'; if (a.error) return `<p class="empty">Audit failed: ${esc(a.error)}</p>`;
    const b = (t, rows) => `<h3>${esc(t)}</h3>${rows && rows.length ? `<ul>${rows.map(r => `<li>${esc(String(r).replace(/`/g, ''))}</li>`).join('')}</ul>` : '<p class="empty">none</p>'}`;
    return b('Not working', a.notWorking) + b('Too slow', a.slow) + b('Mistakes', a.mistakes) + b('High-return optimizations', a.optimizations) + b('Needs your ruling', a.rulings);
  }

  // ═════════ L1 · Features: every Feature with its parts; the drawer is L2 ═════════
  function partsSummary(ft) { const n = {}; for (const p of ft.parts) n[p.role] = (n[p.role] || 0) + 1; return Object.entries(n).map(([r, c]) => `<span class="tag">${c > 1 ? c + ' ' : ''}${esc(ROLE[r] || r)}${c > 1 ? 's' : ''}</span>`).join(' '); }
  function featRows() {
    const s = state.snap, fl = state.feat, q = fl.q.trim().toLowerCase();
    const rows = s.features.filter(f => (!fl.layout || f.layout === fl.layout) && (!fl.verdicts.size || fl.verdicts.has(f.verdict)) && (!q || (f.name + ' ' + f.purpose + ' ' + f.parts.map(p => p.path).join(' ') + ' ' + f.gaps.map(g => g.gap).join(' ')).toLowerCase().includes(q)));
    const key = fl.sort.key, dir = fl.sort.dir;
    const val = f => key === 'name' ? f.name : key === 'layout' ? f.layout : key === 'runs' ? (f.runtime ? f.runtime.runs : f.skillUse ? f.skillUse.window : -1) : key === 'parts' ? f.parts.length : VORDER.indexOf(f.verdict);
    return rows.sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : a.name.localeCompare(b.name)) * dir; });
  }
  function featTable() {
    const rows = featRows(); const fl = state.feat;
    const th = (key, label, num) => `<th class="sortable${num ? ' num' : ''}" data-sort="${key}" scope="col" aria-sort="${fl.sort.key === key ? (fl.sort.dir > 0 ? 'ascending' : 'descending') : 'none'}">${label}<span class="arrow">${fl.sort.key === key ? (fl.sort.dir > 0 ? '▲' : '▼') : ''}</span></th>`;
    const body = rows.map(f => `<tr class="row" tabindex="0" data-open="${esc(f.id)}"><td class="wrap"><strong>${esc(f.name)}</strong>${f.purposeDraft ? ' <span class="tag" title="Auto-derived by goal-backfill and never promoted">draft purpose</span>' : ''}<span class="path clamp">${f.purpose ? esc(f.purpose) : '<span class="warn-t">No purpose declared</span>'}</span></td><td>${esc(f.layout)}</td><td>${partsSummary(f)}</td><td class="num">${f.runtime ? int(f.runtime.runs) : f.skillUse ? int(f.skillUse.window) + ' <small class="muted">uses</small>' : '—'}</td><td class="trend">${f.runtime ? sparkSVG(f.runtime.spark, 80, 20) : ''}</td><td>${chip(f.verdict)}</td></tr>`).join('');
    return `<p class="count">${rows.length} of ${state.snap.features.length} Features</p><div class="tablewrap scroll-y"><table><thead><tr>${th('name', 'Feature and purpose')}${th('layout', 'Layout')}${th('parts', 'Parts')}${th('runs', 'Runs', 1)}<th scope="col">Trend</th>${th('verdict', 'Verdict')}</tr></thead><tbody>${body || '<tr><td colspan="6" class="empty">No Feature matches these filters.</td></tr>'}</tbody></table></div>`;
  }
  function vFeatures(s) {
    const fl = state.feat; const layouts = [...new Set(s.features.map(f => f.layout))];
    const vchips = VORDER.filter(v => s.kpis.featureVerdicts[v]).map(v => `<button type="button" class="fchip" data-verdict="${v}" aria-pressed="${fl.verdicts.has(v)}">${chip(v)}<span class="muted">${s.kpis.featureVerdicts[v]}</span></button>`).join('');
    const sharedRows = s.shared.concat(s.unowned.map(u => ({ ...u, unowned: true })));
    return `<div class="stack">
      ${card('Features', `Every ${term('feature')} of Lapis Lazuli and the ${term('part', 'parts')} that make it. A Feature takes the ${term('verdict')} of its worst part; ${term('layout')} says where its parts live. Open one for its purpose, parts, activity and findings.`,
        `<div class="filters"><label class="sr" for="ft-q">Search Features</label><input id="ft-q" type="search" placeholder="Search name, purpose, file, gap…" value="${esc(fl.q)}"><label class="sr" for="ft-layout">Layout</label><select id="ft-layout"><option value="">Every layout</option>${layouts.map(l => `<option${fl.layout === l ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select><button type="button" class="btn" id="ft-reset">Clear filters</button></div><div class="filters" role="group" aria-label="Verdict">${vchips}</div><div id="ft-table">${featTable()}</div>`, { tour: 'features-table' })}
      ${fold('shared', 'Shared libraries and unowned scripts', `${s.shared.length} shared by several Features · ${s.unowned.length} used by no Feature`, table([{ label: 'Script or bundle', html: r => { const c = byId(r.id); return `<strong>${esc(c.name)}</strong><span class="path">${esc(c.path)}</span>`; } }, { label: 'Used by', html: r => r.unowned ? '<span class="warn-t">no Feature</span>' : `${r.usedBy.length} Feature${r.usedBy.length === 1 ? '' : 's'}` }, { label: 'Verdict', html: r => chip(byId(r.id).verdict) }], sharedRows, { open: r => r.id, scroll: true }))}
    </div>`;
  }

  // ═════════ L1 · Activity (observability + monitoring) ═════════
  function vHooks(s) {
    const r = s.runtime, k = s.kpis, d = r.daily;
    const compOf = rel => s.components.find(c => c.path === rel || (c.hooks || []).some(h => h.file === rel));
    const item = en => { const c = compOf(en.rel); const o = c ? openTarget(c.id) : null; const st = c ? VERDICT[c.verdict].status : (en.exists ? 'neutral' : 'critical'); const name = en.mode === 'bundle' ? 'bundle: ' + en.bundle : (en.key || en.rel);
      return `<button type="button" class="lane-item" ${o ? `data-open="${esc(o)}"` : ''} data-tip="<b>${esc(en.rel)}</b><br>${esc(en.mode)} · ${int(en.runs)} runs · avg ${int(en.avgMs)} ms"><span class="dot s-${st}" aria-hidden="true"></span><span class="nm">${esc(name)}</span>${en.mode !== 'bundle' ? `<span class="rt">${compact(en.runs)}</span>` : ''}</button>${en.children ? `<div class="lane-bundle">${en.children.map(ch => item({ rel: ch.rel, key: ch.key, runs: ch.runs, avgMs: ch.avgMs, mode: 'bundled', exists: true })).join('')}</div>` : ''}`; };
    const lanes = r.lanes.map(l => { const n = l.groups.reduce((a, g) => a + g.entries.reduce((b, e) => b + (e.children ? e.children.length : 1), 0), 0);
      return `<div class="lane"><h3>${esc(l.event)} <span class="muted">· ${n}</span></h3>${l.groups.map(g => `<div class="matcher">${g.matcher === '*' ? 'every call' : 'when: ' + esc(g.matcher)}</div>${g.entries.map(item).join('')}`).join('')}</div>`; }).join('');
    const slow = r.slowest.slice(0, 10).map(h => ({ label: h.hook, value: h.totalS, display: int(h.totalS) + ' s', tip: `${int(h.totalS)} s · ${int(h.runs)} runs · avg ${int(h.avgMs)} ms` }));
    const blk = r.blockers.slice(0, 10).map(h => ({ label: h.hook, value: h.blocks, tip: `${int(h.blocks)} blocks · ${int(h.runs)} runs` }));
    const hookCols = [{ key: 'hook', label: 'Hook' }, { key: 'runs', label: 'Runs', num: true }, { key: 'blocks', label: 'Blocks', num: true }, { key: 'errs', label: 'Errors', num: true }, { key: 'timeouts', label: 'Timeouts', num: true }, { key: 'totalS', label: 'Total s', num: true }, { key: 'avgMs', label: 'Avg ms', num: true }];
    return `<div class="stack">
      <p class="lede">${term('observability', 'Observability')}: did each hook run, block, and how long did it take.</p>
      ${kpis([kpi('Hooks running', `${k.hooksLive} <small>of ${k.hooksRegistered}</small>`, `ran in ${s.meta.windowDays} days`), kpi(term('run', 'Runs'), compact(k.runs), 'each row counted once', { spark: sparkSVG(k.runsSpark, 120, 26) }), kpi('Time in hooks', k.hookHours + ' h', `over ${s.meta.windowDays} days`), kpi('Per session start', r.boot.avgS + ' s', `${int(r.boot.boots)} starts`), kpi(term('block', 'Blocks'), int(k.blocks), 'gates that stopped something', { spark: sparkSVG(k.blocksSpark, 120, 26) }), kpi('Errors', int(k.errors), `${r.errors.length} hooks`)])}
      <div class="grid cols-2">
        ${card('Time in hooks per day', 'Seconds, UTC days', slot('hooktime', lineSVG(d.map(x => Math.round(x.ms / 1000)), d.map(x => x.day), { label: 'Hook seconds per day', unit: 's' }), 220), { id: 'hooktime', twin: dayTable(d.map(x => ({ ...x, s: Math.round(x.ms / 1000) })), [{ key: 's', label: 'Seconds', num: true }, { key: 'runs', label: 'Runs', num: true }]) })}
        ${card('Slowest hooks', `Top 10 by total time in ${s.meta.windowDays} days`, slot('slow', barsSVG(slow, { label: 'Slowest hooks' }), Math.max(26, slow.length * 26)), { id: 'slow', twin: table(hookCols, r.slowest) })}
      </div>
      <div class="grid cols-2">
        ${card('Gates that blocked', 'Top 10 by blocks', blk.length ? slot('yield', barsSVG(blk, { label: 'Blocks per gate' }), blk.length * 26) : '<p class="empty">No gate blocked in this window.</p>', { id: 'yield', twin: table(hookCols, r.blockers) })}
        ${card('Hooks that failed', 'Error exits; a timeout means the runtime killed a slow hook, so its check did not run', table(hookCols, r.errors.slice(0, 12), { empty: 'No hook errors.' }))}
      </div>
      ${fold('lanes', 'Hook lanes', 'every registered hook per event, in firing order · click one to open its Feature', `<div class="lanes">${lanes}</div>`)}
      ${fold('skilluse', 'Skill usage', `${r.skillUse.length} skills invoked · logged by skill-invocation-log`, table([{ key: 'skill', label: 'Skill' }, { key: 'window', label: s.meta.windowDays + ' d', num: true }, { key: 'total', label: 'All time', num: true }, { label: 'Last', num: true, html: x => esc(ago(x.last)) }], r.skillUse, { scroll: true }))}
      ${fold('orphankeys', 'Telemetry with no registered hook', `${r.unregisteredFiring.length} names · renamed, bundled or retired hooks`, table([{ key: 'hook', label: 'Telemetry name' }, { key: 'runs', label: 'Runs', num: true }], r.unregisteredFiring))}
    </div>`;
  }
  function vTurns(s) {
    const m = s.monitoring, d = m.daily; const reask = (m.signals.find(x => x.key === 'reask') || { n: 0 }).n;
    const sig = m.signals.map(x => ({ label: x.key, value: x.n, status: x.key === 'reask' || x.key === 'correction' ? 'serious' : x.key === 'nod' ? 'good' : null }));
    const open = s.quests.filter(q => ['active', 'hold', 'blocked', 'delegated'].includes(q.status));
    const QS = { active: ['info', '▶'], hold: ['warning', '‖'], blocked: ['critical', '✕'], delegated: ['neutral', '→'], closed: ['good', '✓'], archived: ['neutral', '–'] };
    return `<div class="stack">
      <p class="lede">${term('monitoring', 'Monitoring')}: why hooks ran, for which ${term('quest')} and phase, and what each ${term('turn')} cost you.</p>
      ${kpis([kpi(term('turn', 'Turns'), int(m.turns), `${int(m.sessions)} sessions`), kpi('Re-asks', int(reask), pct(reask, m.turns) + ' of turns'), kpi('Tool calls', compact(m.toolCalls), 'in logged turns'), kpi('Output tokens', compact(m.tokens.out), 'in logged turns'), kpi('Open quests', int(open.length), 'active, hold, blocked, delegated')])}
      <div class="grid cols-2">
        ${card('Turns per day', 'UTC days', slot('turns', lineSVG(d.map(x => x.turns), d.map(x => x.day), { label: 'Turns per day', unit: 'turns' }), 220), { id: 'turns', twin: dayTable(d, [{ key: 'turns', label: 'Turns', num: true }, { key: 'reask', label: 'Re-asks', num: true }]) })}
        ${card('How you reacted', 'Your next message after each reply, classified', sig.length ? slot('signals', barsSVG(sig, { label: 'User signals' }), sig.length * 26) : '<p class="empty">No turns logged.</p>', { id: 'signals', twin: table([{ key: 'key', label: 'Signal' }, { key: 'n', label: 'Turns', num: true }], m.signals) })}
      </div>
      ${card('Cost per quest and phase', 'Top 10 · which quest phase the turns served', table([{ key: 'key', label: 'Quest · phase' }, { key: 'turns', label: 'Turns', num: true }, { key: 'tools', label: 'Tool calls', num: true }, { label: 'Hook s', num: true, html: x => int(Math.round(x.hookMs / 1000)) }, { key: 'reask', label: 'Re-asks', num: true }], m.phaseCost.slice(0, 10), { empty: 'No turns logged.' }))}
      ${fold('goallens', 'Did Features meet their goal', `goal-lens · ${m.goals.length} Features judged · ${int(m.goalPending)} prompts pending`, table([{ key: 'feature', label: 'Feature' }, { key: 'rows', label: 'Runs judged', num: true }, { label: 'Met', num: true, html: x => x.rate + '%' }, { key: 'topGap', label: 'Top gap', wrap: true }], m.goals, { empty: 'No goal-lens rows in this window.' }))}
      ${fold('heavy', 'Heaviest turns', 'most hook time in one turn', table([{ key: 'turn', label: 'Turn' }, { key: 'qa', label: 'Quest' }, { key: 'hookS', label: 'Hook s', num: true }, { key: 'tools', label: 'Tools', num: true }, { key: 'prompt', label: 'Prompt start', wrap: true }], m.heaviest))}
      ${fold('watches', 'Watches', `${m.watches.open} open · ${m.watches.overdue.length} overdue`, table([{ key: 'id', label: 'Watch' }, { key: 'target', label: 'Target', wrap: true }, { key: 'left', label: 'Sessions left', num: true }], m.watches.overdue, { empty: 'No overdue watches.' }))}
      ${fold('quests', 'Quests in flight', `${open.length} open of ${s.quests.length} in quest/active.txt · the work these turns served`, table([{ key: 'qa', label: 'Quest' }, { label: 'Status', html: x => { const q = QS[x.status] || ['neutral', '·']; return schip(q[0], q[1], x.status); } }, { key: 'phase', label: 'Phase' }, { key: 'urusan', label: 'Urusan' }, { label: 'Issue', wrap: true, html: x => esc(x.issue || x.current || '—') }], open, { scroll: true, empty: 'No open quests.' }))}
    </div>`;
  }
  function vMistakes(s) {
    const sl = s.slips, d = sl.daily; const cats = sl.categoriesWindow.slice(0, 10).map(x => ({ label: x.key, value: x.n }));
    return `<div class="stack">
      <p class="lede">${term('slip', 'Slips')}: the mistakes I made that were caught and logged, by you, by me or by a gate.</p>
      ${kpis([kpi('Slips', int(sl.window), `last ${s.meta.windowDays} days`, { spark: sparkSVG(d.map(x => x.slips), 120, 26) }), kpi('Last 7 days', int(sl.week), ''), kpi('Proposals not ruled', int(sl.proposalsUnruled), 'improvement ideas waiting'), kpi('Ledger rows', int(sl.total), sl.types.map(t => `${t.key} ${t.n}`).join(' · '))])}
      <div class="grid cols-2">
        ${card('Slips per day', 'UTC days', slot('slipday', lineSVG(d.map(x => x.slips), d.map(x => x.day), { label: 'Slips per day', unit: 'slips' }), 220), { id: 'slipday', twin: dayTable(d, [{ key: 'slips', label: 'Slips', num: true }, { key: 'proposals', label: 'Proposals', num: true }]) })}
        ${card('Most repeated', `Top 10 categories in ${s.meta.windowDays} days`, cats.length ? slot('cats', barsSVG(cats, { label: 'Slip categories' }), cats.length * 26) : '<p class="empty">No slips.</p>', { id: 'cats', twin: table([{ key: 'key', label: 'Category' }, { key: 'n', label: 'Slips', num: true }], sl.categoriesWindow) })}
      </div>
      ${fold('caught', 'Who caught them', sl.caughtBy.map(x => `${x.key} ${x.n}`).join(' · '), table([{ key: 'key', label: 'Caught by' }, { key: 'n', label: 'Slips', num: true }], sl.caughtBy))}
      ${fold('recent', 'Recent entries', 'newest 40 rows of the ledger', table([{ label: 'When', html: x => esc(day(x.ts)) }, { key: 'type', label: 'Type' }, { key: 'category', label: 'Category' }, { key: 'evidence', label: 'Evidence', wrap: true }], sl.recent, { scroll: true }))}
    </div>`;
  }
  function vEvals(s) {
    const e = s.evals; const act = s.features.filter(f => f.verdict !== 'retired'); const withE = act.filter(f => f.evals.length);
    const byLayout = [...new Set(act.map(f => f.layout))].map(l => { const fs = act.filter(f => f.layout === l); const w = fs.filter(f => f.evals.length).length; return { label: l, value: fs.length ? Math.round(100 * w / fs.length) : 0, display: `${w}/${fs.length}`, tip: `${w} of ${fs.length} ${l} Features have an eval` }; });
    const ownerFeature = x => { const c = s.components.find(c => c.path === x.owner); return c ? featById(s.partOf[c.id]) : null; };
    return `<div class="stack">
      <p class="lede">${term('eval', 'Evals')}: the mechanical proof each Feature still does what it should.</p>
      ${kpis([kpi('Last battery run', e.battery ? esc(day(e.battery.ts)) : 'never', e.battery ? `${e.battery.ageDays} days ago` : 'run lib/eval-battery.js'), kpi('Evals run', e.battery ? int(e.battery.total) : '—', ''), kpi('Failing', int(e.fails.length), ''), kpi('Quarantined', int(e.quarantined.length), 'parked with a reason'), kpi('Features with an eval', pct(withE.length, act.length), `${withE.length} of ${act.length}`)])}
      ${card('Eval coverage by layout', 'Share of Features that carry an eval', slot('cov', barsSVG(byLayout, { label: 'Eval coverage', fmt: v => v + '%' }), byLayout.length * 26), { id: 'cov', twin: table([{ key: 'label', label: 'Layout' }, { key: 'display', label: 'With eval', num: true }], byLayout) })}
      <div class="grid cols-2">
        ${card('Failing evals', 'From the latest battery run', table([{ key: 'eval', label: 'Eval' }, { label: 'Feature', html: x => { const f = ownerFeature(x); return f ? esc(f.name) : esc(x.owner || '—'); } }], e.fails, { empty: 'No failing evals.', open: x => { const f = ownerFeature(x); return f ? f.id : null; } }))}
        ${card('Quarantined evals', 'Not counted as failures', table([{ key: 'eval', label: 'Eval' }, { key: 'reason', label: 'Reason', wrap: true }], e.quarantined, { empty: 'None.' }))}
      </div>
    </div>`;
  }

  // ═════════ L1 · Estate (what is on disk, and where the data comes from) ═════════
  function vStrays(s) {
    const st = s.strays; const wt = st.staleWorktrees; const safe = wt.filter(w => w.verdict === 'safe'), keep = wt.filter(w => w.verdict === 'keep');
    const measured = wt.filter(w => w.bytes != null); const sum = a => a.reduce((x, w) => x + (w.bytes || 0), 0);
    const WT = { safe: ['good', '✓', 'Duplicate of main'], keep: ['serious', '!', 'Holds work not on main'], unchecked: ['neutral', '?', 'Not checked'] };
    const CLS = { canonical: ['good', '✓', 'Canonical'], 'pending-nod': ['warning', '!', 'Waiting for your ruling'], orphan: ['serious', '⊘', 'Not listed'] };
    const folds = [
      { id: 'unreg', title: 'Hook files never run', unit: 'files', n: st.unregisteredHooks.length, body: () => list(st.unregisteredHooks.map(code)) },
      { id: 'unref', title: 'Scripts nothing references', unit: 'scripts', n: st.unreferencedScripts.length, body: () => list(st.unreferencedScripts.map(x => code(x.path))) },
      { id: 'loose', title: 'Loose files inside Feature folders', unit: 'files', n: st.looseFiles.length, body: () => list(st.looseFiles.map(x => code(x.path))) },
      { id: 'evalonly', title: 'Feature folders with an eval but nothing to test', unit: 'folders', n: st.evalOnlyPackages.length, body: () => list(st.evalOnlyPackages.map(code)) },
      { id: 'conflicts', title: 'OneDrive conflict copies', unit: 'copies', n: st.conflictCopies.length, body: () => list(st.conflictCopies.map(code)) },
      { id: 'reports', title: 'Dated reports', unit: 'one-off report files', n: st.reports.length, body: () => list(st.reports.map(r => `${code(r.path)} <span class="muted">${bytes(r.bytes)}</span>`)) },
    ];
    return `<div class="stack">
      <p class="lede">${term('stray', 'Strays')}: files and folders no Feature owns.</p>
      ${kpis([kpi('Stray items', int(st.total), 'nothing owns these'), kpi('Stale worktree folders', int(wt.length), measured.length ? bytes(sum(wt)) : (s.meta.sizing ? 'measuring size…' : 'size not measured')), kpi('Safe to delete', int(safe.length), 'duplicates of main'), kpi('Hold unsaved work', int(keep.length), 'salvage first'), kpi('Conflict copies', int(st.conflictCopies.length), 'OneDrive duplicates')])}
      ${fold('worktrees', 'Stale worktree folders', `${wt.length} folders git no longer knows · verdicts from the cleanup sweep of ${esc(day(st.staleSweep && st.staleSweep.ts))}`, table([{ key: 'name', label: 'Folder' }, { label: 'Verdict', html: x => { const v = WT[x.verdict]; return schip(v[0], v[1], v[2]); } }, { key: 'why', label: 'Why', wrap: true }, { label: 'Size', num: true, html: x => (x.bytes == null ? '…' : bytes(x.bytes)) }, { label: 'Changed', num: true, html: x => esc(ago(x.modified)) }], wt, { scroll: true }))}
      ${fold('root', 'Project root', `${st.rootEntries.length} entries · ${st.pendingOrOrphan.length} not canonical (system/FOLDER-STRUCTURE.md)`, table([{ key: 'name', label: 'Entry' }, { label: 'Class', html: x => { const c = CLS[x.class]; return schip(c[0], c[1], c[2]); } }, { label: 'Files', num: true, html: x => (x.files == null ? 'not walked' : int(x.files)) }, { label: 'Size', num: true, html: x => bytes(x.bytes) }], st.rootEntries, { scroll: true }))}
      ${folds.filter(x => x.n).map(x => fold(x.id, x.title, x.n + ' ' + x.unit, x.body())).join('')}
      ${folds.some(x => !x.n) ? `<p class="muted">Nothing found: ${folds.filter(x => !x.n).map(x => x.title.toLowerCase()).join(' · ')}.</p>` : ''}
    </div>`;
  }
  function vStores(s) {
    const m = s.memory, a = m.autoMemory; const sess = m.main.find(f => f.name === 'current-session.md');
    const types = a.types.map(t => ({ label: t.key, value: t.n }));
    const stores = s.stores.map(byId).filter(Boolean); const kb = stores.filter(c => c.kind === 'knowledge'), docs = stores.filter(c => c.kind === 'doc'), proj = stores.filter(c => c.kind === 'project');
    const meter = sess ? `<div class="meter${sess.lines > m.sessionCap ? ' over' : ''}" role="meter" aria-valuemin="0" aria-valuemax="${m.sessionCap}" aria-valuenow="${sess.lines}" aria-label="Session memory lines"><span style="width:${Math.min(100, (100 * sess.lines) / m.sessionCap)}%"></span></div><p class="muted" style="margin:6px 0 0">${int(sess.lines)} of ${m.sessionCap} lines</p>` : '<p class="empty">current-session.md missing.</p>';
    return `<div class="stack">
      <p class="lede">Stores and docs: memory, knowledge and written rules. Features read and write them; they are not Features themselves.</p>
      ${kpis([kpi('Memories', int(a.total), a.dir), kpi('Not indexed', int(a.unindexed.length), 'missing from MEMORY.md'), kpi('Broken index links', int(a.brokenLinks.length), ''), kpi('Diary', m.diary.latest ? esc(m.diary.latest) : '—', m.diary.hasToday ? 'entry exists today' : `${m.diary.daysSince} day(s) since last entry`), kpi('Knowledge bases', int(kb.length), kb.map(k => k.name).join(', '))])}
      <div class="grid cols-2">
        ${card('Memories by type', 'Frontmatter type of each memory file', slot('memtypes', barsSVG(types, { label: 'Memory types' }), Math.max(26, types.length * 26)), { id: 'memtypes', twin: table([{ key: 'key', label: 'Type' }, { key: 'n', label: 'Files', num: true }], a.types) })}
        ${card('Session memory size', 'main/current-session.md against its 500-line cap', meter)}
      </div>
      ${fold('unindexed', 'Memory files not in MEMORY.md', `${a.unindexed.length} files · a memory the index does not list never reaches a session`, list(a.unindexed.map(code), 'Every memory is indexed.'))}
      ${fold('mainfiles', 'main/ files', `${m.main.length} files`, table([{ key: 'name', label: 'File' }, { key: 'lines', label: 'Lines', num: true }, { label: 'Size', num: true, html: x => bytes(x.bytes) }, { label: 'Changed', num: true, html: x => esc(ago(x.modified)) }], m.main))}
      ${fold('kb', 'Knowledge bases', `${kb.length} states · untracked, main repo only`, table([{ key: 'name', label: 'State' }, { label: 'Files', num: true, html: x => int(x.fileCount) }, { label: 'Size', num: true, html: x => bytes(x.bytes) }, { label: 'Changed', num: true, html: x => esc(ago(x.modified)) }], kb, { open: x => x.id }))}
      ${fold('docs', 'Written rules and docs', `${docs.length} docs in system/, .claude/ and the root${proj.length ? ` · project: ${proj.map(p => p.name).join(', ')}` : ''}`, table([{ key: 'name', label: 'Doc' }, { key: 'description', label: 'Title', wrap: true }, { label: 'Changed', num: true, html: x => esc(ago(x.modified)) }], docs, { open: x => x.id, scroll: true }))}
    </div>`;
  }
  function vSources(s) {
    const t = Object.entries(s.meta.timings || {}).map(([k, v]) => ({ label: k, value: v, display: v + ' ms' }));
    return `<div class="stack">
      <p class="lede">Where every number on this screen comes from, and how long it took to read.</p>
      ${kpis([kpi('Built in', int(s.meta.buildMs) + ' ms', esc(ago(s.meta.generated))), kpi('Live roots', int(s.meta.roots.length), s.meta.roots.map(esc).join(', ')), kpi('Data files', int(s.sources.length), 'read for this snapshot'), kpi('Telemetry rows', compact(s.sources.filter(x => x.kind === 'hook telemetry').reduce((a, x) => a + (x.unique || 0), 0)), 'unique, after removing repeats')])}
      ${card('Data files', 'Every file this snapshot read', table([{ key: 'kind', label: 'Kind' }, { key: 'root', label: 'Root' }, { key: 'file', label: 'File' }, { label: 'Rows', num: true, html: x => int(x.rows) }, { label: 'Counted', num: true, html: x => (x.unique == null ? '—' : int(x.unique)) }, { label: 'Repeats', num: true, html: x => (x.duplicates == null ? '—' : int(x.duplicates)) }, { label: 'Last write', num: true, html: x => esc(ago(x.last)) }, { key: 'note', label: 'Note', wrap: true }], s.sources, { scroll: true }))}
      ${fold('timings', 'Build time by stage', `${int(s.meta.buildMs)} ms in ${t.length} stages`, slot('timings', barsSVG(t, { label: 'Build stages' }), t.length * 26))}
      ${fold('git', 'Git state', 'main and the registered worktrees', s.meta.git ? table([{ key: 'root', label: 'Root' }, { key: 'branch', label: 'Branch' }, { key: 'head', label: 'HEAD' }, { key: 'behindMain', label: 'Behind main', num: true }, { key: 'aheadMain', label: 'Ahead', num: true }, { key: 'dirty', label: 'Changed files', num: true }], s.meta.git) : '<p class="empty">Reading git state… refresh in a few seconds.</p>')}
    </div>`;
  }

  // ═════════ L2 · drawers ═════════
  function kv(pairs) { return `<dl class="kv">${pairs.filter(p => p[1] != null && p[1] !== '').map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`; }
  function featureDrawer(f) {
    const s = state.snap; const days = s.meta.days;
    let h = `<h2>${esc(f.name)}</h2><p class="d-sub">${chip(f.verdict)} <span class="tag">${esc(f.layout)}</span></p>`;
    h += `<h3>${term('purpose')}${f.purposeDraft ? ' <span class="tag">draft</span>' : ''}</h3>${f.purposeDraft ? `<p class="sec">Auto-derived from old headers and never promoted. Promote it with ${code('node lib/goal-backfill.js promote ' + f.name)} once it reads right.</p>` : ''}${f.purpose ? `<p>${esc(f.purpose)}</p>` : `<p>${schip('warning', '!', 'No purpose declared')} <span class="sec">It cannot be judged met or unmet until its goal is written down.</span></p>`}`;
    h += `<h3>Why: ${esc(VERDICT[f.verdict].label)}</h3>`;
    if (f.verdict === 'retired') h += `<p>${esc(f.retiredReason)}</p>`;
    else if (f.verdict === 'healthy') h += `<p class="sec">Every part is healthy: ${esc(VERDICT.healthy.means)}.</p>`;
    else h += list(f.parts.filter(p => p.verdict !== 'healthy' && p.verdict !== 'retired').map(p => `${chip(p.verdict)}<div class="grow"><code>${esc(p.path)}</code>${p.gaps.length ? `<br><span class="sec">${esc(p.gaps.join(' · '))}</span>` : ''}</div>`));
    h += `<h3>Parts (${f.parts.length})</h3>` + list(f.parts.map(p => `<span class="dot s-${p.status}" aria-hidden="true"></span><div class="grow"><span class="tag">${esc(ROLE[p.role] || p.role)}</span> <code>${esc(p.path)}</code></div>`));
    if (f.hooks.length) h += `<h3>Hooks</h3>` + list(f.hooks.map(x => `<span class="dot s-${x.mode ? 'good' : x.optOut ? 'neutral' : 'serious'}" aria-hidden="true"></span><div class="grow"><code>${esc(x.file)}</code><br><span class="sec">${x.mode ? `runs on ${esc(x.events.join(', '))} · ${esc(x.mode)}` : x.optOut ? 'deliberately not registered' : 'not registered in settings.json'}</span></div>`));
    if (f.runtime) h += `<h3>Activity, last ${s.meta.windowDays} days</h3>${kpis([kpi('Runs', int(f.runtime.runs), ''), kpi('Blocks', int(f.runtime.blocks), ''), kpi('Avg time', int(f.runtime.avgMs) + ' ms', ''), kpi('Last run', esc(ago(f.runtime.last)), esc(day(f.runtime.last)))])}<div style="margin-top:10px">${slot('drawer', lineSVG(f.runtime.spark, days, { label: 'Runs per day', unit: 'runs' }), 140)}</div>`;
    if (f.skillUse) h += `<h3>Skill use</h3>${kv([['Last ' + s.meta.windowDays + ' days', int(f.skillUse.window)], ['All time', int(f.skillUse.total)], ['Last used', esc(ago(f.skillUse.last))]])}`;
    const fs = s.findings.filter(x => (f.findingIds || []).includes(x.id));
    if (fs.length) h += `<h3>Findings (${fs.length})</h3>` + list(fs.map(x => `${sevChip(x.severity)}<div class="grow"><button class="link" type="button" data-finding="${esc(x.id)}">${esc(x.title)}</button></div>`));
    if ((f.notes || []).length) h += `<h3>Notes</h3>${f.notes.map(noteHtml).join('')}`;
    h += `<details class="d-more"><summary>Details</summary>${kv([['Evals', f.evals.length ? f.evals.map(esc).join('<br>') : 'none'], ['Eval status', esc(f.evalStatus)], ['Born', esc(day(f.born))], ['Record a note', code('node lib/observatory.js --judge ' + f.id + ' --judgement "…" --justification "…"')]])}</details>`;
    return h;
  }
  function componentDrawer(c) {
    const s = state.snap; const sh = s.shared.find(x => x.id === c.id) || s.unowned.find(x => x.id === c.id);
    const label = c.kind === 'script' ? (sh && sh.usedBy.length ? 'Shared library' : 'Unowned script') : ({ bundle: 'Hook bundle', knowledge: 'Knowledge base', memory: 'Memory store', doc: 'Doc', project: 'Project' }[c.kind] || c.kind);
    let h = `<h2>${esc(c.name)}</h2><p class="d-sub">${chip(c.verdict)} <span class="tag">${esc(label)}</span></p><p class="muted"><code>${esc(c.path)}</code></p>`;
    if (c.purpose != null) h += `<h3>Purpose</h3>${c.purpose ? `<p>${esc(c.purpose)}</p>` : `<p>${schip('warning', '!', 'No purpose declared')}</p>`}`; else if (c.description) h += `<p>${esc(c.description)}</p>`;
    if (sh) h += `<h3>Used by</h3>${sh.usedBy.length ? `<p>${sh.usedBy.map(n => `<button type="button" class="tag link-tag" data-open="feature:${esc(n)}">${esc(n)}</button>`).join(' ')}</p>` : '<p class="sec">No Feature references it; only docs, or nothing.</p>'}`;
    if (c.gaps && c.gaps.length) h += `<h3>Gaps</h3>${list(c.gaps.map(g => `${schip('warning', '!', 'Gap')}<div class="grow">${esc(g)}</div>`))}`;
    if (c.children) h += `<h3>Hooks it runs</h3>${list(c.children.map(code))}`;
    h += kv([['Files', c.fileCount != null ? int(c.fileCount) : ''], ['Size', c.bytes != null ? bytes(c.bytes) : ''], ['Changed', c.modified ? esc(ago(c.modified)) : ''], ['Referenced by', c.refs != null ? int(c.refs) + ' file(s)' : '']]);
    return h;
  }
  function showDrawer(html) { $('#drawer-body').innerHTML = html; $('#drawer').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('open'); drawAll(); $('#drawer-close').focus(); }
  function openDrawer(id) {
    const f = featById(id); const c = f ? null : byId(id); if (!f && !c) return;
    state.drawer = id; state.lastFocus = document.activeElement; showDrawer(f ? featureDrawer(f) : componentDrawer(c));
  }
  function glossaryDrawer() {
    state.drawer = 'glossary'; state.lastFocus = document.activeElement;
    showDrawer(`<h2>Words on this screen</h2><p class="sec">Each word means one thing everywhere. Dotted words show their meaning on hover.</p>` +
      `<dl class="gloss">${Object.values(TERMS).map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>` +
      `<h3>Verdicts</h3>${list(VORDER.map(v => `${chip(v)}<div class="grow sec">${esc(VERDICT[v].means)}</div>`))}` +
      `<h3>Severity</h3>${list(['critical', 'serious', 'warning', 'info'].map(v => `${sevChip(v)}<div class="grow sec">${esc({ critical: 'something is broken now', serious: 'real risk or loss if left', warning: 'worth fixing; nothing breaks today', info: 'good to know' }[v])}</div>`))}`);
  }
  function closeDrawer() {
    if (!state.drawer) return; state.drawer = null; delete state.charts.drawer;
    $('#drawer').classList.remove('open'); $('#drawer').setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('open');
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  // ═════════ routing + render ═════════
  const VIEWS = { overview: vOverview, findings: vFindings, features: vFeatures, 'activity/hooks': vHooks, 'activity/turns': vTurns, 'activity/mistakes': vMistakes, 'activity/evals': vEvals, 'estate/strays': vStrays, 'estate/stores': vStores, 'estate/sources': vSources };
  function route() {
    const [tab, sub] = (location.hash || '#overview').slice(1).split('/');
    const n = NAV.find(x => x.id === tab); if (!n) return { tab: 'overview', key: 'overview' };
    if (!n.subs) return { tab, key: tab, arg: sub };
    const sb = n.subs.find(x => x[0] === sub) ? sub : n.subs[0][0];
    return { tab, sub: sb, key: tab + '/' + sb };
  }
  function renderNav(r) {
    $('#tabs').innerHTML = NAV.map(n => `<a href="#${n.id}${n.subs ? '/' + (r.tab === n.id ? r.sub : n.subs[0][0]) : ''}"${r.tab === n.id ? ' aria-current="page"' : ''}>${n.label}</a>`).join('');
    const n = NAV.find(x => x.id === r.tab);
    $('#subnav').innerHTML = n && n.subs ? n.subs.map(([id, label]) => `<a href="#${n.id}/${id}"${r.sub === id ? ' aria-current="page"' : ''}>${label}</a>`).join('') : '';
    $('#subnav').hidden = !(n && n.subs);
  }
  function renderMeta() {
    const s = state.snap; if (!s) return; const g = (s.meta.git || []).find(x => x.root === 'main');
    $('#meta').textContent = `${s.kpis.features} Features · ${s.kpis.components} parts · last ${s.meta.windowDays} days · updated ${ago(s.meta.generated)}, built in ${(s.meta.buildMs / 1000).toFixed(1)} s${g ? ` · main @ ${g.head}` : ''}`;
  }
  function render() {
    const r = route(); renderNav(r);
    document.body.classList.toggle('fit', r.key === 'overview' && fitMode());
    document.title = `${(NAV.find(x => x.id === r.tab) || NAV[0]).label} · Lapis Lazuli Observatory`;
    if (state.error && !state.snap) { $('#view').innerHTML = card('Could not load the snapshot', '', `<p>${esc(state.error)}</p><button class="btn" type="button" data-retry>Retry</button>`); return; }
    if (!state.snap) { $('#view').innerHTML = '<p class="empty">Building the snapshot…</p>'; return; }
    if (r.tab === 'findings' && r.arg) state.open.add('f:' + r.arg);
    const keep = state.charts.drawer; state.charts = keep ? { drawer: keep } : {};
    $('#view').innerHTML = VIEWS[r.key](state.snap);
    renderMeta();
    if (r.key === 'overview') { sizeOverview(); watchOverview(); }
    drawAll();
    if (r.tab === 'findings' && r.arg && state.flashed !== r.arg) { state.flashed = r.arg; const t = document.getElementById('f-' + r.arg); if (t) { t.scrollIntoView({ block: 'nearest' }); t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 1600); } }
  }
  async function load(fresh) {
    document.body.classList.add('loading'); $('#refresh').disabled = true;
    try { const res = await fetch(`/api/snapshot?days=${state.days}${fresh ? '&fresh=1' : ''}`); if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200)); state.snap = await res.json(); state.error = null; }
    catch (e) { state.error = String(e.message || e); }
    finally { document.body.classList.remove('loading'); $('#refresh').disabled = false; }
    render();
    if (state.drawer && state.drawer !== 'glossary') { const f = featById(state.drawer), c = byId(state.drawer); if (f || c) { $('#drawer-body').innerHTML = f ? featureDrawer(f) : componentDrawer(c); drawAll(); } else closeDrawer(); }
    if (!state.tourChecked) { state.tourChecked = true; let seen = false; try { seen = localStorage.getItem('lapis-guide-v1') === 'done'; } catch (_) {} if (/[?&]guide=off\b/.test(location.search)) seen = true; if (!seen && !state.error) setTimeout(startTour, 400); }
  }
  async function loadAudit() {
    state.auditLoading = true;
    try { const res = await fetch('/api/audit'); state.audit = res.ok ? await res.json() : { error: 'HTTP ' + res.status }; } catch (e) { state.audit = { error: String(e.message || e) }; } finally { state.auditLoading = false; }
    const el = document.getElementById('audit-body'); if (el) el.innerHTML = auditHtml();
  }
  function go(target) { if (location.hash === '#' + target) render(); else location.hash = target; window.scrollTo(0, 0); }

  // ═════════ the guide: shown once on the first visit, replayed from the header ═════════
  const TOUR = [
    { route: 'overview', sel: '.brand', title: 'Lapis Lazuli Observatory', body: 'One place for the health of the whole system: every Feature, what is wrong with it, and what to do next. It reads top-down: this page is the glance, and each click goes one level deeper.' },
    { route: 'overview', sel: '[data-tour="health"]', title: 'How healthy the Features are', body: 'A Feature is one capability made of parts: hooks, skills, scripts, evals. It takes the verdict of its worst part. Click a colour or a verdict to list those Features.' },
    { route: 'overview', sel: '[data-tour="kpis"]', title: 'Three numbers that matter', body: 'Open findings, hooks that actually ran, and mistakes this week. Each card opens its area.' },
    { route: 'overview', sel: '[data-tour="attention"]', title: 'Needs attention', body: 'The worst findings first, each with my one-line judgement. Click one to read it in full.' },
    { route: 'findings', sel: '[data-tour="finding-list"]', open: true, title: 'A finding reads left to right', body: 'Fact: what the data shows, with evidence. Context: what it means here. Judgement: my verdict, why, the next action, and whether it is your decision or mine. Evidence and my notes stay folded until you open them.' },
    { route: 'features', sel: '[data-tour="features-table"]', title: 'Every Feature and its parts', body: 'Purpose sits under each name; a missing purpose is a gap. Sort, filter by verdict or layout, and click a row for its parts, activity, findings and notes.' },
    { route: 'activity/hooks', sel: '#subnav', title: 'Activity', body: 'Hooks is observability: did it run, block, how long. Turns & quests is monitoring: why it ran, for which quest, and what it cost you. Mistakes and Evals sit beside them.' },
    { route: 'estate/strays', sel: '#subnav', title: 'Estate', body: 'What is on disk that nothing owns, the memory and docs Features read, and the data files every number comes from.' },
    { route: 'overview', sel: '.controls', title: 'Controls', body: 'Change the time window, refresh the data, switch the theme, open the glossary for any word, or replay this guide.' },
  ];
  let tourAt = -1;
  function startTour() { closeDrawer(); tourAt = 0; $('#tour').hidden = false; showStep(); }
  function endTour() { tourAt = -1; $('#tour').hidden = true; try { localStorage.setItem('lapis-guide-v1', 'done'); } catch (_) {} }
  function showStep() {
    const st = TOUR[tourAt];
    if (st.open && state.snap && state.snap.findings[0]) state.open.add('f:' + state.snap.findings[0].id);
    if (location.hash !== '#' + st.route) location.hash = st.route; else render();
    setTimeout(() => {
      if (tourAt < 0) return;
      const el = document.querySelector(st.sel); const spot = $('#tour-spot'), box = $('#tour-card');
      $('#tour-step').textContent = `${tourAt + 1} of ${TOUR.length}`; $('#tour-title').textContent = st.title; $('#tour-body').textContent = st.body;
      $('#tour-back').disabled = tourAt === 0; $('#tour-next').textContent = tourAt === TOUR.length - 1 ? 'Finish' : 'Next';
      if (!el) { spot.style.display = 'none'; box.style.cssText = 'left:50%;top:50%;transform:translate(-50%,-50%)'; $('#tour-next').focus(); return; }
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect(); const pad = 6; const vh = window.innerHeight, vw = window.innerWidth;
      spot.style.display = 'block'; spot.style.left = (r.left - pad) + 'px'; spot.style.top = Math.max(4, r.top - pad) + 'px'; spot.style.width = (r.width + pad * 2) + 'px'; spot.style.height = Math.min(r.height + pad * 2, vh - Math.max(4, r.top - pad) - 4) + 'px';
      const bw = Math.min(380, vw - 24); const bh = box.offsetHeight || 200;
      let top = r.bottom + 14; if (top + bh > vh - 12) top = r.top - 14 - bh; if (top < 12) top = Math.max(12, vh - bh - 12);
      const left = Math.min(Math.max(12, r.left), vw - bw - 12);
      box.style.cssText = `left:${left}px;top:${top}px;width:${bw}px`;
      $('#tour-next').focus();
    }, 380);
  }

  // ═════════ theme ═════════
  function effectiveTheme() { return document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function paintThemeButton() { const t = effectiveTheme(); $('#theme').textContent = t === 'dark' ? 'Light theme' : 'Dark theme'; $('#theme').setAttribute('aria-pressed', String(t === 'dark')); }

  // ═════════ events ═════════
  const tip = $('#tip');
  function showTip(e, html) { tip.innerHTML = html; tip.classList.add('show'); const x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8); const y = Math.max(8, e.clientY - tip.offsetHeight - 12); tip.style.left = Math.max(8, x) + 'px'; tip.style.top = y + 'px'; }
  document.addEventListener('mousemove', e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) { tip.classList.remove('show'); document.querySelectorAll('.cross, .marker').forEach(n => n.setAttribute('visibility', 'hidden')); return; }
    showTip(e, t.getAttribute('data-tip'));
    const id = t.getAttribute('data-line');
    if (id) { const x = document.getElementById(id + '-x'), m = document.getElementById(id + '-m'); if (x && m) { x.setAttribute('x1', t.dataset.cx); x.setAttribute('x2', t.dataset.cx); x.setAttribute('visibility', 'visible'); m.setAttribute('cx', t.dataset.cx); m.setAttribute('cy', t.dataset.cy); m.setAttribute('visibility', 'visible'); } }
  });
  document.addEventListener('focusin', e => { const t = e.target.closest && e.target.closest('.term'); if (t) { const r = t.getBoundingClientRect(); showTip({ clientX: r.left, clientY: r.top }, t.getAttribute('data-tip')); } });
  document.addEventListener('focusout', e => { if (e.target.closest && e.target.closest('.term')) tip.classList.remove('show'); });
  document.addEventListener('toggle', e => { const d = e.target; if (!d.matches || !d.matches('details[data-fold]')) return; const id = d.dataset.fold; if (d.open && !state.open.has(id)) { state.open.add(id); const y = window.scrollY; render(); window.scrollTo(0, y); if (id === 'audit' && !state.audit && !state.auditLoading) loadAudit(); } else if (!d.open) state.open.delete(id); }, true);
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('.term') && !t.closest('button, a')) return;
    const tw = t.closest('[data-twin]'); if (tw) { const id = tw.dataset.twin; state.twins.has(id) ? state.twins.delete(id) : state.twins.add(id); const y = window.scrollY; render(); window.scrollTo(0, y); return; }
    const tg = t.closest('[data-toggle]'); if (tg) { const id = tg.dataset.toggle; state.open.has(id) ? state.open.delete(id) : state.open.add(id); const y = window.scrollY; render(); window.scrollTo(0, y); return; }
    const fv = t.closest('[data-fverdict]'); if (fv) { state.feat = { ...state.feat, q: '', layout: '', verdicts: new Set([fv.dataset.fverdict]) }; go('features'); return; }
    const fr = t.closest('[data-finding]'); if (fr) { closeDrawer(); state.find = { q: '', sev: new Set(), decide: '' }; state.flashed = null; go('findings/' + fr.dataset.finding); return; }
    const gt = t.closest('[data-go]'); if (gt) { go(gt.dataset.go); return; }
    const sv = t.closest('[data-sev]'); if (sv) { const v = sv.dataset.sev; state.find.sev.has(v) ? state.find.sev.delete(v) : state.find.sev.add(v); render(); return; }
    const so = t.closest('th[data-sort]'); if (so) { const k = so.dataset.sort; state.feat.sort = { key: k, dir: state.feat.sort.key === k ? -state.feat.sort.dir : 1 }; $('#ft-table').innerHTML = featTable(); return; }
    const vf = t.closest('[data-verdict]'); if (vf) { const v = vf.dataset.verdict; state.feat.verdicts.has(v) ? state.feat.verdicts.delete(v) : state.feat.verdicts.add(v); vf.setAttribute('aria-pressed', String(state.feat.verdicts.has(v))); $('#ft-table').innerHTML = featTable(); return; }
    const op = t.closest('[data-open]'); if (op) { openDrawer(op.dataset.open); return; }
    if (t.closest('[data-retry]')) { load(true); return; }
    if (t.id === 'ft-reset') { state.feat = { q: '', layout: '', verdicts: new Set(), sort: state.feat.sort }; render(); }
  });
  document.addEventListener('keydown', e => {
    if (tourAt >= 0) { if (e.key === 'Escape') endTour(); else if (e.key === 'ArrowRight') $('#tour-next').click(); else if (e.key === 'ArrowLeft' && tourAt > 0) $('#tour-back').click(); return; }
    if (e.key === 'Escape') closeDrawer();
    if (e.key === 'Enter' && e.target.matches && e.target.matches('tr[data-open]')) openDrawer(e.target.dataset.open);
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'ft-q') { state.feat.q = e.target.value; $('#ft-table').innerHTML = featTable(); }
    if (e.target.id === 'f-q') { state.find.q = e.target.value; const pos = e.target.selectionStart; render(); const el = document.getElementById('f-q'); el.focus(); el.setSelectionRange(pos, pos); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'ft-layout') { state.feat.layout = e.target.value; $('#ft-table').innerHTML = featTable(); }
    if (e.target.id === 'f-decide') { state.find.decide = e.target.value; render(); }
  });
  $('#scrim').addEventListener('click', closeDrawer);
  $('#drawer-close').addEventListener('click', closeDrawer);
  $('#refresh').addEventListener('click', () => { state.audit = null; load(true); });
  $('#days').addEventListener('change', e => { state.days = parseInt(e.target.value, 10); load(false); });
  $('#theme').addEventListener('click', () => { const next = effectiveTheme() === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; try { localStorage.setItem('lapis-theme', next); } catch (_) {} paintThemeButton(); });
  $('#glossary').addEventListener('click', glossaryDrawer);
  $('#guide').addEventListener('click', startTour);
  $('#tour-next').addEventListener('click', () => { if (tourAt >= TOUR.length - 1) endTour(); else { tourAt++; showStep(); } });
  $('#tour-back').addEventListener('click', () => { if (tourAt > 0) { tourAt--; showStep(); } });
  $('#tour-skip').addEventListener('click', endTour);
  window.addEventListener('hashchange', () => { if (tourAt < 0) closeDrawer(); render(); });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (route().key === 'overview' && state.snap) render(); else drawAll(); if (tourAt >= 0) showStep(); }, 150); });

  paintThemeButton();
  render();
  load(false);
  window.__observatory = { state, render, openDrawer, closeDrawer, startTour, endTour, TOUR, TERMS, VERDICT };
})();
