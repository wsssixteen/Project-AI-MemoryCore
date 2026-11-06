#!/usr/bin/env node
// boundary: covers the text CC tags a generated paper prints, their source columns (tag-sources.json + SOURCE checklist rows), one read-only count per column on the state's PROD database, one read-only value read per case permohonan on the env database, and the extra papers (empty case, BA's own ID) · never writes to any database, never edits tag-sources.json, the template or the qa_doc · stops at the SOURCES verdict inside the TEMPLATE-SCENARIO line
// The tag source check (2026-11-06, QA-287346 rework 1): a tag whose source column is empty on PROD
// for this urusan must print a real value on a paper made from an empty permohonan, and the BA's own
// test ID must print every tag. Born because cycle 1 tested one staging permohonan where luas_dipohon
// was 164 while PROD had 1718 of 3551 MCL rows empty; the BA saw "-".
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const MAP = path.join(__dirname, 'tag-sources.json');
const GATEWAY = 'http://127.0.0.1:7411';
const IDENT = /^[a-z_][a-z0-9_]*$/;

// The urusan kod sits in the 4th segment of a permohonan id: PTMLK/03/L/MCL/2026/9 -> MCL.
function urusanOf(permohonan) {
  const p = String(permohonan || '').split('/');
  return p.length >= 6 && /^[A-Z_]{2,8}$/.test(p[3]) ? p[3] : null;
}

// Tags the paper prints as text (image CCs are signatures: the chain check owns them).
function printedTags(ccList) {
  return [...new Set(ccList.filter(c => !c.images.length).map(c => c.tag).filter(Boolean))];
}

// Source of each tag: checklist rows first (| Sx | SOURCE <tag> | table.column | done | or | na: reason |), then the state map.
function resolveSources(tags, map, rows) {
  const fromRows = {};
  for (const r of rows || []) {
    const m = /^SOURCE\s+(\S+)/i.exec(r.source || '');
    if (!m) continue;
    if (/^na\s*:\s*\S/i.test(r.status)) fromRows[m[1]] = { none: r.status.replace(/^na\s*:\s*/i, '') };
    else if (/^done/i.test(r.status)) {
      const c = /^`?([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)`?$/.exec((r.text || '').trim());
      fromRows[m[1]] = c ? { table: c[1], column: c[2] } : { bad: 'SOURCE text is not table.column: ' + r.text };
    }
  }
  const out = { mapped: [], none: [], unknown: [], bad: [] };
  for (const tag of tags) {
    const s = fromRows[tag] || (map || {})[tag];
    if (!s) out.unknown.push(tag);
    else if (s.bad) out.bad.push(tag + ': ' + s.bad);
    else if (s.none) out.none.push({ tag, why: s.none });
    else if (!IDENT.test(s.table) || !IDENT.test(s.column)) out.bad.push(tag + ': not a plain table.column');
    else out.mapped.push({ tag, table: s.table, column: s.column });
  }
  return out;
}

const EMPTY = col => `(${col} IS NULL OR btrim(${col}::text) IN ('', '-'))`;
// One table per line, kod-subquery, no JOIN (CLAUDE.md §8 script shape).
function countSql(schema, table, column, urusan) {
  return `SELECT count(*) AS total, count(*) FILTER (WHERE ${EMPTY(column)}) AS empty FROM ${schema}.${table} WHERE aplikasi_id IN (SELECT aplikasi_id FROM ${schema}.umm_aplikasi WHERE ursn_id = (SELECT ursn_id FROM ${schema}.ind_ursn WHERE kod = '${urusan}'))`;
}
function caseSql(schema, table, column, permohonan) {
  return `SELECT count(*) AS total, count(*) FILTER (WHERE ${EMPTY(column)}) AS empty FROM ${schema}.${table} WHERE aplikasi_id IN (SELECT aplikasi_id FROM ${schema}.umm_aplikasi WHERE id_pengenalan = '${String(permohonan).replace(/'/g, "''")}')`;
}

async function dbSelect(mcp, sql) {
  const token = fs.readFileSync(path.join(os.homedir(), '.db-gateway', 'token'), 'utf8').trim();
  const res = await fetch(`${GATEWAY}/${mcp}/mcp`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'query_database', arguments: { query: sql, limit: 10 } } }),
    signal: AbortSignal.timeout(60000),
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

// Judge. counts: { tag: {total, empty} } on PROD. cases: [{ kind: 'empty'|'ba', permohonan, gaps:[tag=..], emptyCols:Set(tag) }].
// emptyOk: { tag: reason } from EMPTY-OK checklist rows (blank is the intended output for an empty source).
function judge({ src, counts, cases, emptyOk, noBa }) {
  const fails = [];
  if (src.unknown.length) fails.push('source unknown for ' + src.unknown.length + ' tag(s): ' + src.unknown.slice(0, 8).join(', ') + ' (add | Sx | SOURCE <tag> | table.column | done | or na: <reason>)');
  if (src.bad.length) fails.push('bad SOURCE row: ' + src.bad.slice(0, 3).join('; '));
  const needEmpty = Object.entries(counts).filter(([t, c]) => c.error || Number(c.empty) > 0).map(([t]) => t);
  for (const [t, c] of Object.entries(counts)) if (c.error) fails.push('PROD count for ' + t + ' did not run: ' + c.error);
  const uncovered = [];
  for (const tag of needEmpty) {
    if (counts[tag].error || emptyOk[tag]) continue;
    const hit = cases.find(k => k.kind === 'empty' && k.emptyCols.has(tag));
    if (!hit) uncovered.push(tag + ' (PROD empty ' + counts[tag].empty + '/' + counts[tag].total + ')');
    else if (hit.gaps.some(g => g.startsWith(tag + '='))) fails.push('empty case ' + hit.permohonan + ' prints ' + hit.gaps.find(g => g.startsWith(tag + '=')));
  }
  if (uncovered.length) fails.push('empty case never ran for ' + uncovered.join(', ') + ' (--case "empty|<permohonan with the column empty>|<filled .docx>")');
  const ba = cases.filter(k => k.kind === 'ba');
  if (!ba.length && !noBa) fails.push('BA test ID never ran (--case "ba|<BA permohonan>|<filled .docx>", or --no-ba-id "<reason>")');
  for (const k of ba) {
    const g = k.gaps.filter(x => !emptyOk[x.split('=')[0]]);
    if (g.length) fails.push('BA ID ' + k.permohonan + ' prints ' + g.slice(0, 4).join(', '));
  }
  return { ok: fails.length === 0, fails, needEmpty, uncovered };
}

// --no-ba-id needs a real reason: empty, a <placeholder> or a bare word is refused.
function noBaOk(reason) {
  const r = String(reason || '').trim();
  return r.length >= 8 && !/^<.*>$/.test(r) && /\s/.test(r);
}

function loadMap(state) {
  if (!fs.existsSync(MAP)) return {};
  const j = JSON.parse(fs.readFileSync(MAP, 'utf8'));
  return j[state] || {};
}

// --case "kind|permohonan|docx" (repeatable)
function parseCases(argv) {
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--case' || argv[i + 1] === undefined) continue;
    const [kind, permohonan, docx] = argv[i + 1].split('|').map(s => (s || '').trim());
    out.push({ kind: (kind || '').toLowerCase(), permohonan, docx });
  }
  return out;
}

module.exports = { urusanOf, printedTags, resolveSources, countSql, caseSql, dbSelect, judge, loadMap, parseCases, noBaOk, MAP };
