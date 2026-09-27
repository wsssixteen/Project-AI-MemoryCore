#!/usr/bin/env node
// Lapis Lazuli Observatory — local server (zero dependencies, 127.0.0.1 only).
//   node domain/observatory/server.js            → http://127.0.0.1:7790
//   PORT=7791 node domain/observatory/server.js  → another port
// Routes: /  /app.js  /styles.css  /api/snapshot?days=30[&fresh=1]  /api/audit[?fresh=1]  /api/health
// The snapshot is cached 30 s; git state, stale-worktree sizes and the audit block are slow on
// OneDrive, so they are computed in the background and merged into the next response.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const obs = require(path.join(__dirname, '..', '..', 'lib', 'observatory.js'));

const HOST = '127.0.0.1';
const PORT = parseInt(process.env.PORT || '7790', 10);
const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const SNAP_TTL = 30000, AUDIT_TTL = 300000, GIT_TTL = 60000, SIZE_TTL = 1800000;

const snaps = new Map();            // days → { t, data }
const bg = { git: null, gitT: 0, sizes: {}, sizesT: 0, sizing: false, audit: null, auditT: 0 };
const started = Date.now();

function snapshot(days, fresh) {
  const c = snaps.get(days);
  if (!fresh && c && Date.now() - c.t < SNAP_TTL) return c.data;
  const data = obs.build({ days, by: 'server' });
  snaps.set(days, { t: Date.now(), data });
  return data;
}
function decorate(s) {
  const out = Object.assign({}, s, { meta: Object.assign({}, s.meta, { git: bg.git, sizesAt: bg.sizesT ? new Date(bg.sizesT).toISOString() : null, sizing: bg.sizing }) });
  out.strays = Object.assign({}, s.strays, { staleWorktrees: s.strays.staleWorktrees.map(w => Object.assign({}, w, { bytes: bg.sizes[w.name] !== undefined ? bg.sizes[w.name] : null })) });
  out.kpis = Object.assign({}, s.kpis);
  out.findings = obs.findingsFor(out);          // re-derived with git state + folder sizes attached
  return out;
}
function refreshGit() {
  if (Date.now() - bg.gitT < GIT_TTL) return;
  bg.gitT = Date.now();
  obs.gitStates().then(g => { bg.git = g; }).catch(() => {});
}
function refreshSizes(names) {
  if (bg.sizing || (bg.sizesT && Date.now() - bg.sizesT < SIZE_TTL)) return;
  bg.sizing = true;
  obs.staleSizes(names).then(s => { bg.sizes = s; bg.sizesT = Date.now(); }).catch(() => {}).finally(() => { bg.sizing = false; });
}
function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let url;
  try { url = new URL(req.url, 'http://' + HOST); } catch (_) { return send(res, 400, '{"error":"bad url"}'); }
  if (req.method !== 'GET') return send(res, 405, '{"error":"GET only"}');
  const p = url.pathname;
  try {
    if (p === '/api/health') return send(res, 200, JSON.stringify({ ok: true, uptimeS: Math.round((Date.now() - started) / 1000), cached: [...snaps.keys()], sizing: bg.sizing, git: !!bg.git }));
    if (p === '/api/snapshot') {
      const days = Math.max(1, Math.min(90, parseInt(url.searchParams.get('days') || '30', 10) || 30));
      const s = snapshot(days, url.searchParams.get('fresh') === '1');
      refreshGit(); refreshSizes(s.strays.staleWorktrees.map(w => w.name));
      return send(res, 200, JSON.stringify(decorate(s)));
    }
    if (p === '/api/audit') {
      if (url.searchParams.get('fresh') === '1' || !bg.audit || Date.now() - bg.auditT > AUDIT_TTL) { bg.audit = obs.audit(); bg.auditT = Date.now(); }
      return send(res, 200, JSON.stringify(bg.audit));
    }
    // static files: only names that exist directly inside public/ (no traversal)
    const name = p === '/' ? 'index.html' : decodeURIComponent(p.slice(1));
    if (!/^[\w.-]+$/.test(name)) return send(res, 404, '{"error":"not found"}');
    const file = path.join(PUBLIC, name);
    if (path.dirname(file) !== PUBLIC || !fs.existsSync(file)) return send(res, 404, '{"error":"not found"}');
    return send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] || 'application/octet-stream');
  } catch (e) {
    return send(res, 500, JSON.stringify({ error: String(e && e.message || e) }));
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`Lapis Lazuli Observatory → http://${HOST}:${PORT}`);
    try { const s = snapshot(30, true); refreshGit(); refreshSizes(s.strays.staleWorktrees.map(w => w.name)); console.log(obs.summary(s)); } catch (e) { console.error('warm-up failed: ' + e.message); }
  });
}
module.exports = { server };
