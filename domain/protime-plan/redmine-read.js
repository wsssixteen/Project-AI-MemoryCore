#!/usr/bin/env node
// redmine-read.js — READ-ONLY Redmine calls for protime-plan.js (GET only, never a write).
// Kept apart from protime-plan.js on purpose: that file writes to ProTime, and the Redmine write check reads any
// script that names the Redmine key next to a write call. This file holds the Redmine side and only reads.
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const ROOT = path.resolve(__dirname, '..', '..');
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Redmine: tickets he wrote on that day, and whether each one was ever assigned to him.
const REDMINE = (() => {
  try {
    const src = fs.readFileSync(path.join(ROOT, 'quest', 'redmine-board.js'), 'utf8');   // the one home of the Redmine address + key
    return { base: /REDMINE_BASE\s*=\s*'([^']+)'/.exec(src)[1], key: /REDMINE_KEY\s*=\s*'([^']+)'/.exec(src)[1], project: (/PROJECT\s*=\s*'([^']+)'/.exec(src) || [])[1] || 'helpdesk_melaka' };
  } catch (_) { return null; }
})();
async function rget(p) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const j = await rgetOnce(p);
    if (j) return j;
    await new Promise(r => setTimeout(r, 3000 * attempt));
  }
  return null;
}
function rgetOnce(p) {
  return new Promise(resolve => {
    const req = http.get(REDMINE.base + p, { headers: { 'X-Redmine-API-Key': REDMINE.key }, timeout: 30000 }, res => {
      let b = ''; res.setEncoding('utf8'); res.on('data', d => b += d);
      res.on('end', () => { try { resolve(res.statusCode === 200 ? JSON.parse(b) : null); } catch (_) { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}
async function redmineDays(days, extraIds) {
  if (!REDMINE) return { ok: false, error: 'redmine address not readable' };
  const me = await rget('/users/current.json');
  if (!me || !me.user) return { ok: false, error: 'redmine unreachable' };
  const myId = me.user.id, since = [...days].sort()[0];
  const cand = new Set(extraIds.map(String));
  for (const base of [`/issues.json?status_id=*&assigned_to_id=me`, `/projects/${REDMINE.project}/issues.json?status_id=*`]) {
    for (let offset = 0; offset < 600; offset += 100) {
      const j = await rget(`${base}&updated_on=%3E%3D${since}&limit=100&offset=${offset}`);
      if (!j || !Array.isArray(j.issues)) return { ok: false, error: 'redmine list failed' };
      for (const is of j.issues) cand.add(String(is.id));
      if (offset + 100 >= (j.total_count || 0)) break;
    }
  }
  const worked = Object.fromEntries(days.map(d => [d, []]));
  for (const id of cand) {
    const j = await rget(`/issues/${id}.json?include=journals`);
    if (!j || !j.issue) continue;                                // a ticket he cannot open: skipped
    const is = j.issue, journals = is.journals || [];
    const own = (is.assigned_to && is.assigned_to.id === myId) || journals.some(jr => (jr.details || []).some(det => det.property === 'attr' && det.name === 'assigned_to_id' && (String(det.new_value) === String(myId) || String(det.old_value) === String(myId))));
    const wrote = new Set(journals.filter(jr => jr.user && jr.user.id === myId).map(jr => iso(new Date(jr.created_on))));
    // resolve facts (miya 2026-10-14): he passed it on that day, or wrote on it that day and it now sits with someone else
    const handedOn = d => journals.some(jr => jr.user && jr.user.id === myId && iso(new Date(jr.created_on)) === d && (jr.details || []).some(det => det.name === 'assigned_to_id' && String(det.old_value) === String(myId)));
    const withOther = !!(is.assigned_to && is.assigned_to.id !== myId);
    for (const d of days) if (wrote.has(d) || (extraIds.includes(id) && (extraIds.byDay || {})[d] && extraIds.byDay[d].includes(id))) worked[d].push({ id, own: !!own, done: handedOn(d) || (wrote.has(d) && withOther) });
  }
  return { ok: true, worked, candidates: cand.size };
}

module.exports = { redmineDays };
