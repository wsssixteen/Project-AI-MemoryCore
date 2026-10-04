#!/usr/bin/env node
/**
 * lib/redmine-role.js — who wrote this ticket text, and in what role (born 2026-10-04).
 *
 * symptom: 2026-10-04 miya: "you do not remember & do not know what name represents TSO or BA,
 *          so at times you thought the description is by the BA, when TSO is the one that writes it."
 * goal: no TSO (or other non-BA) text is ever shown or quoted as the BA spec.
 * goal_signal: every echoed Description and Issue/Expected block carries its author and role.
 * retention: none (reads the regenerated roster; writes nothing).
 * footprint: none (one small file read inside callers that already run).
 * state-scoped: yes, keyed by lib/states.js knowledgeDir(<state>)/REDMINE-PEOPLE.md.
 *
 * The roster (quest/redmine-people.js) is the only source. A name that is not in it is
 * "role unknown", never a guess. A BA can work several states, so the ticket's own state
 * roster is read first and every other state's roster after it.
 *
 * API (all sync, none throws):
 *   roleOf(name, { state, id })   → { name, cls, isBA, src, notes[] }   cls = BA|TSO|QA|Developer|<raw>|unknown
 *   tag(role)                     → "BA" · "TSO, shared account" · "role unknown, not in roster"
 *   parseBlocks(historyText)      → { issue: [{stamp, author, items}], expected: [...] }
 *   specFromHistory(text, state)  → { issue: pick|null, expected: pick|null }
 *                                    pick = { block, role, isSpec, newer|null }
 *   headline(kind, pick)          → the label line for one pick
 *   descriptionAuthor(historyText, descriptionText) → name | null
 *   descriptionNote(role)         → one plain sentence on how far to trust the Description
 * CLI:
 *   node lib/redmine-role.js "<name>" [--state <key>] [--id <n>]
 *   node lib/redmine-role.js --history <History.txt> [--state <key>]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROSTER_FILE = 'REDMINE-PEOPLE.md';
const STALE_DAYS = 7;
// A login shared by a team: the role is right, the person is not known from the name.
const SHARED_RX = /^(?:itso\b|tso\b|hlp_|help_)|\badmin$/i;
const STAMP_RX = /^---\s*(\S+)\s+by\s+(.+?)\s*---\s*$/;
const ITEM_RX = /^\s*(\d+)\.\s+(.+\S)\s*$/;

function statesLib() { try { return require('./states.js'); } catch (_) { return null; } }
function norm(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase(); }
// "Ahmad Ridhwan Anuar (Dev PLP)" and "Ahmad Ridhwan Anuar" are one person: drop trailing "(…)".
function loose(s) {
  let v = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  while (/\s*\([^()]*\)$/.test(v)) v = v.replace(/\s*\([^()]*\)$/, '').trim();
  return v.toLowerCase();
}

const _rosters = new Map();
function loadRoster(stateKey) {
  if (_rosters.has(stateKey)) return _rosters.get(stateKey);
  const r = { state: stateKey, missing: true, file: null, refreshed: null, stale: false, rows: [], byId: new Map(), byExact: new Map(), byLoose: new Map() };
  _rosters.set(stateKey, r);
  try {
    const S = statesLib();
    const dir = S && S.knowledgeDir(stateKey);
    if (!dir) return r;
    r.file = path.join(dir, ROSTER_FILE);
    const text = fs.readFileSync(r.file, 'utf8');
    r.missing = false;
    r.refreshed = (text.match(/Refreshed:\s*(\d{4}-\d{2}-\d{2})/) || [])[1] || null;
    const age = r.refreshed ? (Date.now() - new Date(r.refreshed + 'T00:00:00Z').getTime()) / 86400000 : Infinity;
    r.stale = !(age <= STALE_DAYS);
    let col = null;
    for (const line of text.split(/\r?\n/)) {
      if (!/^\s*\|/.test(line)) continue;
      const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      if (!col) {
        const low = cells.map(c => c.toLowerCase());
        if (low.includes('name') && low.includes('class')) col = { name: low.indexOf('name'), cls: low.indexOf('class'), id: low.indexOf('id') };
        continue;
      }
      if (cells.every(c => /^:?-+:?$/.test(c))) continue;
      const name = cells[col.name], cls = cells[col.cls];
      if (!name || !cls) continue;
      const row = { name, cls, id: col.id >= 0 && cells[col.id] ? String(cells[col.id]) : null };
      r.rows.push(row);
      if (row.id) r.byId.set(row.id, row);
      for (const [map, key] of [[r.byExact, norm(name)], [r.byLoose, loose(name)]]) {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(row);
      }
    }
  } catch (_) { /* unreadable roster = missing roster */ }
  return r;
}
function resetCache() { _rosters.clear(); }

// One roster's answer for one person: { classes: [...] } (0 = not there, 1 = hit, 2+ = ambiguous).
function lookup(roster, name, id) {
  if (roster.missing) return { classes: [] };
  if (id != null && roster.byId.has(String(id))) return { classes: [roster.byId.get(String(id)).cls] };
  for (const rows of [roster.byExact.get(norm(name)), roster.byLoose.get(loose(name))]) {
    if (rows && rows.length) return { classes: [...new Set(rows.map(x => x.cls))] };
  }
  return { classes: [] };
}

function roleOf(name, opts) {
  const o = opts || {};
  const out = { name: String(name == null ? '' : name).replace(/\s+/g, ' ').trim(), cls: 'unknown', isBA: false, src: null, notes: [] };
  try {
    if (!out.name || /^unknown$/i.test(out.name)) { out.notes.push('no author'); return out; }
    const S = statesLib();
    if (!S) { out.notes.push('state registry unreadable'); return out; }
    const home = o.state && S.get(o.state) ? S.get(o.state).key : null;
    const keys = Object.values(S.all()).filter(s => s.knowledge_dir).map(s => s.key);
    const order = home ? [home, ...keys.filter(k => k !== home)] : keys;
    const hits = [];
    let anyRoster = false;
    for (const k of order) {
      const roster = loadRoster(k);
      if (!roster.missing) anyRoster = true;
      const got = lookup(roster, out.name, o.id);
      if (got.classes.length) hits.push({ k, roster, classes: got.classes });
      if (home && hits.length) break; // the ticket's own state answers first; other states only fill a gap
    }
    if (home && loadRoster(home).missing) out.notes.push('roster missing for ' + home);
    const classes = [...new Set(hits.flatMap(h => h.classes))];
    if (classes.length === 1) {
      out.cls = classes[0];
      out.src = hits[0].k;
      if (!home) out.notes.push('state unknown, from ' + hits[0].k + ' roster');
      else if (hits[0].k !== home) out.notes.push('from ' + hits[0].k + ' roster');
      if (hits[0].roster.stale) out.notes.push('roster stale ' + (hits[0].roster.refreshed || 'no date'));
    } else if (classes.length > 1) {
      out.notes.push('ambiguous: ' + classes.join(' / '));
    } else {
      out.notes.push(anyRoster ? 'not in roster' : 'roster missing');
    }
    if (SHARED_RX.test(out.name)) out.notes.push('shared account');
    out.isBA = out.cls === 'BA';
  } catch (e) {
    out.cls = 'unknown'; out.isBA = false; out.notes = ['lookup failed'];
  }
  return out;
}

function tag(role) {
  const r = role || { cls: 'unknown', notes: [] };
  return [r.cls === 'unknown' ? 'role unknown' : r.cls, ...(r.notes || [])].join(', ');
}

/**
 * Every numbered Issue:/Expected: list in a History.txt, in file order, with the journal
 * stamp and author it sits under. Tolerates Redmine bold (*Issue:*) and bare (Issue:) markers.
 */
function parseBlocks(historyText) {
  const blocks = { issue: [], expected: [] };
  if (!historyText) return blocks;
  const isMarker = (l, word) => new RegExp(`^\\s*\\*{0,2}${word}\\s*:?\\s*\\*{0,2}\\s*$`, 'i').test(l);
  let curStamp = null, curAuthor = null, curKind = null, curItems = [];
  const flush = () => {
    if (curKind && curItems.length) blocks[curKind].push({ stamp: curStamp, author: curAuthor, items: curItems.slice() });
    curItems = [];
  };
  for (const raw of String(historyText).split(/\r?\n/)) {
    const m = raw.match(STAMP_RX);
    if (m) { flush(); curStamp = m[1]; curAuthor = m[2]; curKind = null; continue; }
    if (isMarker(raw, 'Issue')) { flush(); curKind = 'issue'; continue; }
    if (isMarker(raw, 'Expected')) { flush(); curKind = 'expected'; continue; }
    if (curKind) {
      const im = raw.match(ITEM_RX);
      if (im) curItems.push(`${im[1]}. ${im[2]}`);
      else if (raw.trim() === '' && curItems.length) { flush(); curKind = null; }
    }
  }
  flush();
  return blocks;
}

// The spec = the LATEST list written by a BA. With no BA list, the latest list is shown as a report.
function pick(list, state) {
  if (!list || !list.length) return null;
  const withRole = list.map(b => ({ block: b, role: roleOf(b.author, { state }) }));
  const last = withRole[withRole.length - 1];
  let lastBA = null;
  for (const x of withRole) if (x.role.isBA) lastBA = x;
  if (!lastBA) return { block: last.block, role: last.role, isSpec: false, newer: null };
  return { block: lastBA.block, role: lastBA.role, isSpec: true, newer: last === lastBA ? null : { author: last.block.author, stamp: last.block.stamp, role: last.role } };
}
function specFromHistory(historyText, state) {
  const b = parseBlocks(historyText);
  return { issue: pick(b.issue, state), expected: pick(b.expected, state) };
}

function headline(kind, p) {
  const what = kind === 'expected' ? 'EXPECTED' : 'ISSUES';
  const who = `${p.block.stamp || '?'}, by ${p.block.author || '?'}, ${tag(p.role)}`;
  if (p.isSpec) return `BA ${what} (verbatim, ${who})`;
  const role = p.role.cls === 'unknown' ? 'ROLE UNKNOWN' : String(p.role.cls).toUpperCase();
  return `${role} REPORT (not the BA spec) — ${what} (verbatim, ${who})`;
}
function newerLine(kind, p) {
  if (!p || !p.newer) return null;
  return `newer ${kind === 'expected' ? 'Expected' : 'Issue'} list by ${p.newer.author}, ${tag(p.newer.role)}, ${p.newer.stamp || '?'} exists. It is not the BA spec. Read it in History.txt.`;
}

function descriptionAuthor(historyText, descriptionText) {
  const head = String(historyText || '').split(/^─{10,}$/m)[0] || '';
  const h = head.match(/^Description by:\s*(.+?)\s+\[/m);
  if (h) return h[1].trim();
  const d = String(descriptionText || '').match(/^Author:\s*(.+?)(?:\s+\[.*)?\s*$/m);
  return d ? d[1].trim() : null;
}
function descriptionNote(role) {
  if (!role) return 'author not synced. Do not treat the Description as the BA spec.';
  if (role.isBA) return 'written by a BA.';
  if (role.cls === 'unknown') return 'role unknown. Do not treat the Description as the BA spec until the author is confirmed.';
  return `a ${role.cls} report, not the BA spec. A BA journal Issue/Expected list outranks it.`;
}

module.exports = { roleOf, tag, parseBlocks, pick, specFromHistory, headline, newerLine, descriptionAuthor, descriptionNote, loadRoster, resetCache, norm, loose, STAMP_RX, STALE_DAYS };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const flag = n => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : undefined; };
  const state = flag('state');
  if (flag('history')) {
    let text = '';
    try { text = fs.readFileSync(flag('history'), 'utf8'); } catch (e) { console.error('redmine-role: ' + e.message); process.exit(2); }
    const S = statesLib();
    const st = state || (S && S.stateForPath(path.resolve(flag('history'))));
    const spec = specFromHistory(text, st);
    for (const kind of ['issue', 'expected']) {
      const p = spec[kind];
      if (!p) { console.log(`${kind}: none`); continue; }
      console.log(headline(kind, p));
      for (const it of p.block.items) console.log('   ' + it);
      const n = newerLine(kind, p); if (n) console.log('   ↳ ' + n);
    }
    process.exit(0);
  }
  const name = argv.find((a, i) => !a.startsWith('--') && !['--state', '--id', '--history'].includes(argv[i - 1]));
  if (!name) { console.log('usage: node lib/redmine-role.js "<name>" [--state <key>] [--id <n>] | --history <History.txt> [--state <key>]'); process.exit(2); }
  const r = roleOf(name, { state, id: flag('id') });
  console.log(`${r.name} → ${tag(r)}${r.src ? '  (roster: ' + r.src + ')' : ''}`);
  process.exit(r.cls === 'unknown' ? 1 : 0);
}
