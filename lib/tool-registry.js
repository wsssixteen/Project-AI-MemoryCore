#!/usr/bin/env node
// tool-registry — born via forge
// symptom: 2026-10-06 miya: 'I asked you to install and setup it so that YOU USE IT. AND YOU DIDN'T USE IT' (codegraph); no part of the system listed tools or their use
// goal: every Tool Ruri can call is one checked row in system/tools.json, and a Tool nobody uses is visible as unused
// goal_signal: node lib/tool-registry.js check exits 0 with 0 problems
// retention: keep (system/tools.json rows) · rotate monthly (system/telemetry/tool-registry.jsonl)
// footprint: on-demand: 1 node process for under 1 second, no daemon
//
// USAGE
//   node lib/tool-registry.js check [--file <tools.json>] [--root <repo root>] [--no-homes] [--no-log]
//   node lib/tool-registry.js list  [--file ...]
//   node lib/tool-registry.js for <group> [--file ...]
// Exit 0 = no problem. Exit 1 = at least one problem (each printed on its own line).
// state-scoped: yes, a home may carry <state>; it passes when at least one state folder holds it.
'use strict';
const fs = require('fs');
const path = require('path');

const KEYS = ['id', 'answers', 'call', 'home', 'groups', 'state_scope', 'footprint', 'usage', 'status'];
const STATUSES = ['live', 'rare', 'unused'];
// Top folders of this repo: a home that starts with one of them is checked on disk.
const REPO_TOPS = ['projects', 'lib', 'core', 'quest', 'domain', 'tools', 'system', 'main', 'etanah_atlas', '.claude', 'Feature', 'library-items', 'daily-diary'];
// Outside projects, ruled NOT Tools (miya 2026-10-06).
const EXCLUDED = [/(^|\/)etanah-codemap(\/|$)/, /^etanah_atlas(\/|$)/];

function statusFor(sessions) { return sessions >= 10 ? 'live' : sessions >= 1 ? 'rare' : 'unused'; }

function load(file) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (e) { return { problems: ['registry file not found: ' + file] }; }
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  try { return { reg: JSON.parse(raw), problems: [] }; } catch (e) { return { problems: ['registry is not valid JSON: ' + e.message] }; }
}

function homeParts(home) { return String(home).split(' + ').map(s => s.trim().replace(/\\/g, '/')).filter(Boolean); }
function isRepoPath(p) { return REPO_TOPS.some(t => p === t || p.startsWith(t + '/')); }

function homeExists(root, p) {
  if (!p.includes('<state>')) return fs.existsSync(path.join(root, p));
  const before = p.slice(0, p.indexOf('<state>'));
  const after = p.slice(p.indexOf('<state>') + '<state>'.length);
  let states = [];
  try { states = fs.readdirSync(path.join(root, before), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name); } catch (_) { return false; }
  return states.some(s => fs.existsSync(path.join(root, before, s, after)));
}

function check(reg, root, opts) {
  opts = opts || {};
  const problems = [];
  if (!reg || typeof reg !== 'object') return ['registry is not an object'];
  const groups = reg.groups && typeof reg.groups === 'object' ? Object.keys(reg.groups) : [];
  if (!groups.length) problems.push('registry has no "groups"');
  if (!Array.isArray(reg.tools)) return problems.concat('"tools" is not a list');
  if (!reg.tools.length) problems.push('"tools" is empty');
  const seen = new Set();
  reg.tools.forEach((t, i) => {
    const who = t && typeof t.id === 'string' && t.id ? t.id : 'row ' + (i + 1);
    if (!t || typeof t !== 'object') { problems.push(who + ': not an object'); return; }
    for (const k of KEYS) if (t[k] === undefined || t[k] === null || t[k] === '') problems.push(who + ': missing "' + k + '"');
    if (typeof t.id === 'string') {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id)) problems.push(who + ': id must be lower-case words joined by "-"');
      if (seen.has(t.id)) problems.push(who + ': id used twice');
      seen.add(t.id);
    }
    if (t.groups !== undefined) {
      if (!Array.isArray(t.groups) || !t.groups.length) problems.push(who + ': "groups" must be a non-empty list');
      else for (const g of t.groups) if (!groups.includes(g)) problems.push(who + ': unknown group "' + g + '"');
    }
    const u = t.usage;
    let sessions = null;
    if (u !== undefined && u !== null) {
      if (typeof u !== 'object' || !Number.isInteger(u.sessions) || u.sessions < 0) problems.push(who + ': usage.sessions must be a whole number, 0 or more');
      else sessions = u.sessions;
      if (u && typeof u === 'object' && u.last !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(String(u.last))) problems.push(who + ': usage.last must be YYYY-MM-DD or empty');
      if (sessions !== null && sessions > 0 && u.last === '') problems.push(who + ': used in ' + sessions + ' sessions but usage.last is empty');
    }
    if (t.status !== undefined && t.status !== null && t.status !== '') {
      if (!STATUSES.includes(t.status)) problems.push(who + ': status "' + t.status + '" is not one of ' + STATUSES.join(' / '));
      else if (sessions !== null && statusFor(sessions) !== t.status) problems.push(who + ': status "' + t.status + '" does not match ' + sessions + ' sessions (should be "' + statusFor(sessions) + '")');
    }
    if (typeof t.home === 'string' && t.home) {
      for (const p of homeParts(t.home)) {
        if (p.split('/').includes('..') || path.isAbsolute(p)) { problems.push(who + ': home "' + p + '" must be a path inside the repo, or a plain name'); continue; }
        if (EXCLUDED.some(re => re.test(p))) { problems.push(who + ': home "' + p + '" is an outside project (codemap / Atlas), not a Tool'); continue; }
        if (!opts.noHomes && isRepoPath(p) && !homeExists(root, p)) problems.push(who + ': home not found on disk: ' + p);
      }
    }
  });
  return problems;
}

function byUse(a, b) { return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || (b.usage && b.usage.sessions || 0) - (a.usage && a.usage.sessions || 0); }
function line(t) { return String(t.status).padEnd(7) + String(t.usage && t.usage.sessions).padStart(4) + ' sessions  ' + String(t.id).padEnd(38) + (t.groups || []).join(' · '); }

function main(argv) {
  const get = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : undefined; };
  const cmd = argv[0];
  const root = path.resolve(get('root') || process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..'));
  const file = path.resolve(get('file') || path.join(root, 'system', 'tools.json'));
  const out = [];
  let code = 0;
  const loaded = load(file);
  if (cmd === 'check') {
    const problems = loaded.reg ? loaded.problems.concat(check(loaded.reg, root, { noHomes: argv.includes('--no-homes') })) : loaded.problems;
    const rows = loaded.reg && Array.isArray(loaded.reg.tools) ? loaded.reg.tools.length : 0;
    problems.forEach(p => out.push('PROBLEM  ' + p));
    out.push('tool-registry check: ' + rows + ' rows · ' + problems.length + ' problem(s)' + (argv.includes('--no-homes') ? ' · homes not checked' : ''));
    code = problems.length ? 1 : 0;
    if (!argv.includes('--no-log')) {
      try {
        const logFile = path.join(root, 'system', 'telemetry', 'tool-registry.jsonl');
        fs.mkdirSync(path.dirname(logFile), { recursive: true });
        fs.appendFileSync(logFile, JSON.stringify({ ts: new Date().toISOString(), cmd: 'check', rows, problems: problems.length, outcome: code ? 'problems' : 'ok' }) + '\n');
      } catch (_) { /* a log that cannot be written never fails the check */ }
    }
  } else if (cmd === 'list' || cmd === 'for') {
    if (!loaded.reg || !Array.isArray(loaded.reg.tools)) { out.push('PROBLEM  ' + (loaded.problems[0] || '"tools" is not a list')); code = 1; }
    else {
      let tools = loaded.reg.tools.filter(t => t && typeof t === 'object');
      if (cmd === 'for') {
        const g = argv[1];
        const known = Object.keys(loaded.reg.groups || {});
        if (!g || g.startsWith('--') || !known.includes(g)) { out.push('PROBLEM  unknown group "' + (g || '') + '". Groups: ' + known.join(' · ')); code = 1; tools = []; }
        else tools = tools.filter(t => Array.isArray(t.groups) && t.groups.includes(g));
      }
      tools.slice().sort(byUse).forEach(t => out.push(line(t)));
    }
  } else {
    out.push('usage: node lib/tool-registry.js check | list | for <group>  [--file <tools.json>] [--root <repo root>] [--no-homes] [--no-log]');
    code = 1;
  }
  return { code, out };
}

if (require.main === module) {
  const r = main(process.argv.slice(2));
  console.log(r.out.join('\n'));
  process.exit(r.code);
}
module.exports = { check, load, statusFor, main, homeExists };
