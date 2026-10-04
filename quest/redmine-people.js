#!/usr/bin/env node
// redmine-people — born 2026-10-02 per miya: "keep/save the list of names everytime you retrieve
// tickets to know which one is BA, which one is TSO".
// goal: every ticket retrieval refreshes one roster per state of Redmine people with their role.
// goal_signal: REDMINE-PEOPLE.md "Refreshed" date = the last retrieval date.
// retention: regenerate (generated file, safe to rebuild any time).
// footprint: on-demand: 1 node, once a day, started by redmine-sync.js (--if-stale).
// state-scoped: yes, keyed by system/states.json redmine.member_projects (one roster per state).
//
// v2 (2026-10-04): salvaged into main (v1 lived only in a dead worktree folder, so nothing
//   refreshed the roster). One roster per state that names redmine.member_projects in
//   system/states.json, written to etanah-knowledge/<state>/REDMINE-PEOPLE.md. New last column
//   `Id` (Redmine user id) so lib/redmine-role.js can match by id, not only by display name.
//   TSO also = any `help_*` role (was the literal help_mlk).
//   Preserved from v1: read-only on Redmine · class order TSO > Developer > QA > BA ·
//   BA only when Business Analyst is the ONLY role · file left unchanged when nothing is read ·
//   --quiet · --if-stale · first four table columns.
//
// Reads project memberships (with paging) and writes the roster in the MAIN checkout.
// Role = the Redmine membership role. "Business Analyst" is given to almost every member of
// an e-Tanah state project, so a person is classed BA only when it is their ONLY role.
//
// USAGE: node quest/redmine-people.js [--quiet] [--if-stale] [--state <key>]
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const states = require('../lib/states.js');

const REDMINE_BASE = 'http://172.16.90.169/redmine';
const REDMINE_KEY = '9565c21aa6cd9672fd3c7c2c7fec4c934c2f7c66'; // same constant as redmine-sync.js
const QUIET = process.argv.includes('--quiet');
const IF_STALE = process.argv.includes('--if-stale');
const ONLY = (() => { const i = process.argv.indexOf('--state'); return i > 0 ? process.argv[i + 1] : null; })();

function get(u) {
  return new Promise((res, rej) => {
    http.get(REDMINE_BASE + u, { headers: { 'X-Redmine-API-Key': REDMINE_KEY }, timeout: 20000 }, r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(new Error('HTTP ' + r.statusCode + ' ' + u)); } });
    }).on('error', rej).on('timeout', function () { this.destroy(new Error('timeout ' + u)); });
  });
}

function classify(roles) {
  if (roles.has('TSO') || [...roles].some(r => /^help_/i.test(r))) return 'TSO';
  if (roles.has('Software Developer')) return 'Developer';
  if (roles.has('Quality Assurance')) return 'QA';
  if (roles.has('Business Analyst')) return 'BA';
  return [...roles].join(', ') || '-';
}

function render(state, rows, today) {
  const count = c => rows.filter(r => r.cls === c).length;
  const esk = (state.redmine && state.redmine.project) || '';
  return [
    `# REDMINE-PEOPLE — who is BA, who is TSO (${state.label || state.key} Redmine)`,
    '',
    `SCOPE: every person in the ${state.label || state.key} Redmine projects with the role Redmine gives them. Use it to tell BA from TSO from developer when reading a ticket or journal. Read through \`lib/redmine-role.js\`, never by eye.`,
    '',
    `Refreshed: ${today} by \`node quest/redmine-people.js\` (runs on every \`quest/redmine-sync.js\`). Generated file, do not hand-edit.`,
    '',
    `- **TSO** = role \`TSO\` (or a \`help_*\` role) in the eSOKONGAN project (\`${esk}\`). TSO raise eSOKONGAN tickets. A shared account (for example **ITSO Melaka Admin**) authors most of them; the real TSO is usually named in the description.`,
    '- **BA** = `Business Analyst` is their only role. Redmine gives `Business Analyst` to nearly every member, so a developer who also holds it is listed as Developer.',
    '',
    `Counts: TSO ${count('TSO')} · BA ${count('BA')} · QA ${count('QA')} · Developer ${count('Developer')} · total ${rows.length}`,
    '',
    '| Name | Class | Redmine roles | Projects | Id |',
    '|---|---|---|---|---|',
    ...rows.map(r => `| ${r.n} | ${r.cls} | ${r.roles} | ${r.projects} | ${r.id || ''} |`),
    '',
  ].join('\n');
}

async function build(state, today) {
  const projects = (state.redmine && state.redmine.member_projects) || [];
  const out = path.join(states.knowledgeDir(state.key), 'REDMINE-PEOPLE.md');
  if (IF_STALE) {
    try { if (fs.readFileSync(out, 'utf8').includes('Refreshed: ' + today)) return 'fresh'; } catch (_) { /* no file yet */ }
  }
  const people = new Map(); // name -> { roles:Set, projects:Set, id }
  for (const p of projects) {
    for (let off = 0; ; off += 100) {
      let m;
      try { m = await get(`/projects/${p}/memberships.json?limit=100&offset=${off}`); } catch (e) { if (!QUIET) console.error('skip ' + p + ': ' + e.message); break; }
      for (const mm of m.memberships || []) {
        const who = mm.user || mm.group || {};
        const name = (who.name || '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
        if (!name) continue;
        const e = people.get(name) || { roles: new Set(), projects: new Set(), id: mm.user ? who.id : null };
        for (const r of mm.roles || []) e.roles.add(r.name);
        e.projects.add(p);
        people.set(name, e);
      }
      if (off + 100 >= (m.total_count || 0)) break;
    }
  }
  if (!people.size) { if (!QUIET) console.error(`redmine-people: ${state.key}: no memberships read, file left unchanged`); return 'empty'; }
  const order = ['TSO', 'BA', 'QA', 'Developer'];
  const rows = [...people.entries()].map(([n, e]) => ({ n, id: e.id, cls: classify(e.roles), roles: [...e.roles].sort().join(', '), projects: [...e.projects].join(', ') }))
    .sort((a, b) => ((order.indexOf(a.cls) + 1 || 9) - (order.indexOf(b.cls) + 1 || 9)) || a.n.localeCompare(b.n));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, render(state, rows, today), 'utf8');
  if (!QUIET) console.log(`redmine-people: ${state.key}: ${rows.length} people -> ${out}`);
  return 'written';
}

module.exports = { classify, render };

if (require.main === module) {
  (async () => {
    const today = new Date().toISOString().slice(0, 10);
    const targets = Object.values(states.all())
      .filter(s => s.redmine && Array.isArray(s.redmine.member_projects) && s.redmine.member_projects.length && s.knowledge_dir)
      .filter(s => !ONLY || s.key === String(ONLY).toLowerCase());
    let bad = 0;
    for (const s of targets) {
      try { if (await build(s, today) === 'empty') bad++; } catch (e) { bad++; if (!QUIET) console.error(`redmine-people: ${s.key}: ${e.message}`); }
    }
    process.exit(bad ? 1 : 0);
  })();
}
