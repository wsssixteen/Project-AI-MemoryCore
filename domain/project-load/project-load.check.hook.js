#!/usr/bin/env node
// project-load.check.hook.js — born via core/forge.js (2026-10-08); v2 2026-10-17 (the project system)
// TRIGGER: the prompt names a project that has a folder projects/coding-projects/active/<Name>/ with project.json (matched by its aliases)
// ACTION: inject: read that project's index first. v2: a project in shape 2 (project.json "shape": 2, index START.md) gets its
//         PROJECT CARD on the first mention in a session (goal, spec, hard rules, state, next step, open decisions, last
//         decisions), the session is bound to the project in log.jsonl, and a report path named in the prompt marks the
//         session as delegated. Fallback: a session bound to a project that was compacted and got no card at SessionStart
//         gets the card on its next prompt, named or not.
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// NOD: miya 2026-10-08 — "make sure everything WILL be loaded every single time we load a project".
// NOD v2: miya 2026-10-17 — "it will only naturally survive compaction ... I can confidently and without worry know you'll remember the critical & key details".
// A project = a folder with project.json { name, aliases[], repo?, index?, shape? }. No registry to keep: the folders ARE the list.
// The folder is not in git, so it is always read from the MAIN checkout, whatever folder this session runs in.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const P = require(path.join(__dirname, 'project.js'));
const { listProjects, namedIn, mainRootOf } = P;
const REARM_MS = Number(process.env.PROJECT_LOAD_REARM_MS) || 30 * 60000;   // the same project is announced again after 30 min
const BYPASS_RE = /\[skip-project-load:\s*[^\]\s][^\]]*\]/i;

// Shape 1 (the 2026-10-08 folder): the pointer text, unchanged.
function contextFor(p) {
  const idx = path.join(p.dir, p.index);
  const has = fs.existsSync(idx);
  return [
    '📂 project-load: ' + p.name + ' is a project with its own folder (main checkout, not in git).',
    has ? '   READ FIRST: ' + idx : '   ⚠️ its index is MISSING: ' + idx + ' — create it first (shape: .claude/skills/project/SKILL.md).',
    '   It is the index: state now, which file answers which question, hard rules, how to resume. Then open only the file its table names.',
    '   Every bulk change ends with: VERSIONS.md row + PROJECT.md state + ROADMAP.md status, same turn (Domain Expansion checks this with lib/save-rules.js).',
  ].join('\n') + '\n';
}
function pointerFor(p) {
  return '📂 project-load: ' + p.name + ' — its card was given earlier in this session; START.md is the record: ' + path.join(p.dir, 'START.md') + '\n';
}
function reportIn(prompt, p) {
  const m = /reports[\\/]([A-Za-z0-9._-]+\.md)\b/i.exec(String(prompt || ''));
  if (!m || /^_template\.md$/i.test(m[1])) return null;
  return path.join(p.dir, 'reports', m[1]);
}

function decide(data, rows, now) {
  const prompt = data && data.prompt;
  if (!prompt || BYPASS_RE.test(prompt)) return { out: '', log: [] };
  const session = String((data && data.session_id) || 'no-session');
  const mine = rows.filter(r => r.session === session);
  const projects = listProjects();
  const out = [], log = [];
  const seen = new Set();
  for (const p of namedIn(prompt, projects).slice(0, 3)) {
    const prior = mine.filter(r => r.project === p.name && (r.action === 'fired' || r.action === 'resumed'));
    const recent = prior.some(r => now - Date.parse(r.ts) < REARM_MS);
    const report = reportIn(prompt, p);
    if (recent && !report) continue;
    seen.add(p.name);
    let text;
    if (p.shape >= 2) text = prior.length ? pointerFor(p) : P.card(p, { kind: 'mention', report });
    else text = contextFor(p);
    if (recent && report) text = P.card(p, { kind: 'mention', report });
    out.push(text);
    log.push({ action: 'fired', session, project: p.name, index_exists: fs.existsSync(path.join(p.dir, p.index)), shape: p.shape, card: p.shape >= 2 && (!prior.length || !!report), ...(report ? { report } : {}) });
  }
  // Fallback: compacted after its last card and no card came back at SessionStart → print it now.
  for (const b of P.bindings(session)) {
    if (seen.has(b.project)) continue;
    const last = (act) => mine.filter(r => r.project === b.project && act.includes(r.action)).map(r => Date.parse(r.ts)).reduce((a, x) => Math.max(a, x), 0);
    const compacted = last(['compact']);
    if (!compacted || last(['resumed', 'fired']) > compacted) continue;
    const p = projects.find(x => x.name === b.project); if (!p) continue;
    const mined = (mine.filter(r => r.project === b.project && r.action === 'compact').pop() || {}).mined;
    out.push('⚠️ project-load fallback: the SessionStart card did not arrive after the compaction; here it is.\n' + P.card(p, { kind: 'compact', report: b.report, mined }));
    log.push({ action: 'resumed', via: 'prompt-fallback', session, project: p.name });
  }
  return { out: out.join(''), log };
}

if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'project-load', event: 'UserPromptSubmit' }, (input) => {
    let data = input;
    if (typeof input === 'string') { try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; } }
    const now = Date.now();
    const d = decide(data, P.logRows(), now);
    for (const row of d.log) P.logAppend(row);
    return d.out ? { fired: true, blocked: false, contextOut: d.out } : { fired: false };
  });
}

module.exports = { listProjects, namedIn, mainRootOf, contextFor, decide };
