#!/usr/bin/env node
// redmine-people — born 2026-10-02 per miya: "keep/save the list of names everytime you retrieve
// tickets to know which one is BA, which one is TSO".
// goal: every ticket retrieval refreshes one roster of Melaka Redmine people with their role.
// goal_signal: REDMINE-PEOPLE.md "Refreshed" date = the last retrieval date.
// retention: keep (regenerate-class output).
//
// Reads project memberships (with paging) of the Melaka Redmine projects and writes
// etanah-knowledge/melaka/REDMINE-PEOPLE.md in the MAIN checkout. Read-only on Redmine.
// Role = the Redmine membership role. "Business Analyst" is given to almost every member of
// e-Tanah Melaka, so a person is classed BA only when it is their ONLY role.
//
// USAGE: node quest/redmine-people.js [--quiet]
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const REDMINE_BASE = 'http://172.16.90.169/redmine';
const REDMINE_KEY = '9565c21aa6cd9672fd3c7c2c7fec4c934c2f7c66'; // same constant as redmine-sync.js
const PROJECTS = ['helpdesk_melaka', 'e-tanah-melaka', 'e-tanah-melaka-fat', 'e-tanah-melaka-uat', 'e-tanah-melaka-pat'];
const QUIET = process.argv.includes('--quiet');

function mainRoot() {
  try { return require('../lib/states.js').mainRoot(path.resolve(__dirname, '..')); } catch (_) { return path.resolve(__dirname, '..'); }
}
const OUT = path.join(mainRoot(), 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka', 'REDMINE-PEOPLE.md');

function get(u) {
  return new Promise((res, rej) => {
    http.get(REDMINE_BASE + u, { headers: { 'X-Redmine-API-Key': REDMINE_KEY }, timeout: 20000 }, r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(new Error('HTTP ' + r.statusCode + ' ' + u)); } });
    }).on('error', rej).on('timeout', function () { this.destroy(new Error('timeout ' + u)); });
  });
}

function classify(roles) {
  if (roles.has('TSO') || roles.has('help_mlk')) return 'TSO';
  if (roles.has('Software Developer')) return 'Developer';
  if (roles.has('Quality Assurance')) return 'QA';
  if (roles.has('Business Analyst')) return 'BA';
  return [...roles].join(', ') || '-';
}

(async () => {
  if (process.argv.includes('--if-stale')) {
    try { if (fs.readFileSync(OUT, 'utf8').includes('Refreshed: ' + new Date().toISOString().slice(0, 10))) return; } catch (_) { /* no file yet */ }
  }
  const people = new Map(); // name -> { roles:Set, projects:Set }
  for (const p of PROJECTS) {
    for (let off = 0; ; off += 100) {
      let m;
      try { m = await get(`/projects/${p}/memberships.json?limit=100&offset=${off}`); } catch (e) { if (!QUIET) console.error('skip ' + p + ': ' + e.message); break; }
      for (const mm of m.memberships || []) {
        const name = ((mm.user || mm.group || {}).name || '').replace(/\s+/g, ' ').trim();
        if (!name) continue;
        const e = people.get(name) || { roles: new Set(), projects: new Set() };
        for (const r of mm.roles || []) e.roles.add(r.name);
        e.projects.add(p);
        people.set(name, e);
      }
      if (off + 100 >= (m.total_count || 0)) break;
    }
  }
  if (!people.size) { if (!QUIET) console.error('redmine-people: no memberships read, file left unchanged'); process.exit(1); }

  const order = ['TSO', 'BA', 'QA', 'Developer'];
  const rows = [...people.entries()].map(([n, e]) => ({ n, cls: classify(e.roles), roles: [...e.roles].sort().join(', '), projects: [...e.projects].join(', ') }))
    .sort((a, b) => ((order.indexOf(a.cls) + 1 || 9) - (order.indexOf(b.cls) + 1 || 9)) || a.n.localeCompare(b.n));
  const count = c => rows.filter(r => r.cls === c).length;
  const today = new Date().toISOString().slice(0, 10);
  const md = [
    '# REDMINE-PEOPLE — who is BA, who is TSO (Melaka Redmine)',
    '',
    'SCOPE: every person in the Melaka Redmine projects with the role Redmine gives them. Use it to tell BA from TSO from developer when reading a ticket or journal.',
    '',
    `Refreshed: ${today} by \`node quest/redmine-people.js\` (runs on every \`quest/redmine-sync.js\`). Generated file, do not hand-edit.`,
    '',
    '- **TSO** = role `TSO` (or `help_mlk`) in eSOKONGAN MELAKA (`helpdesk_melaka`). TSO raise eSOKONGAN tickets. The shared account **ITSO Melaka Admin** authors most eSOKONGAN MELAKA tickets; the real TSO is usually named in the description.',
    '- **BA** = `Business Analyst` is their only role. Redmine gives `Business Analyst` to nearly every e-Tanah Melaka member, so a developer who also holds it is listed as Developer.',
    '',
    `Counts: TSO ${count('TSO')} · BA ${count('BA')} · QA ${count('QA')} · Developer ${count('Developer')} · total ${rows.length}`,
    '',
    '| Name | Class | Redmine roles | Projects |',
    '|---|---|---|---|',
    ...rows.map(r => `| ${r.n} | ${r.cls} | ${r.roles} | ${r.projects} |`),
    '',
  ].join('\n');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, md, 'utf8');
  if (!QUIET) console.log(`redmine-people: ${rows.length} people (TSO ${count('TSO')}, BA ${count('BA')}, QA ${count('QA')}, Developer ${count('Developer')}) -> ${OUT}`);
})().catch(e => { if (!QUIET) console.error('redmine-people: ' + e.message); process.exit(1); });
