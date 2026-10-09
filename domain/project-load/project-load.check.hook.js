#!/usr/bin/env node
// project-load.check.hook.js — born via core/forge.js (2026-10-08)
// TRIGGER: the prompt names a project that has a folder projects/coding-projects/active/<Name>/ with project.json (matched by its aliases)
// ACTION: inject: read that project's PROJECT.md in the main checkout first, then only the file its table names; documents updated at every bulk change
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// NOD: miya 2026-10-08 — "make sure everything WILL be loaded every single time we load a project".
// A project = a folder with project.json { name, aliases[], repo?, index? }. No registry to keep: the folders ARE the list.
// The folder is not in git, so it is always read from the MAIN checkout, whatever folder this session runs in.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');

function mainRootOf(root) {
  try { return require(path.join(root, 'lib', 'states.js')).mainRoot(root); } catch (_) { return String(root).replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/, ''); }
}
const MAIN = path.resolve(process.env.PROJECT_LOAD_MAIN_ROOT || mainRootOf(ROOT));
const ACTIVE = path.join(MAIN, 'projects', 'coding-projects', 'active');
const LOG = process.env.PROJECT_LOAD_LOG || path.join(MAIN, 'domain', 'project-load', 'log.jsonl');
const REARM_MS = Number(process.env.PROJECT_LOAD_REARM_MS) || 30 * 60000;   // the same project is announced again after 30 min (a compaction may have dropped it)
const BYPASS_RE = /\[skip-project-load:\s*[^\]\s][^\]]*\]/i;
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// → [{ name, dir, index, aliases[] }] for every folder that holds a readable project.json
function listProjects() {
  let dirs; try { dirs = fs.readdirSync(ACTIVE, { withFileTypes: true }); } catch (_) { return []; }
  const out = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    let j; try { j = JSON.parse(fs.readFileSync(path.join(ACTIVE, d.name, 'project.json'), 'utf8').replace(/^﻿/, '')); } catch (_) { continue; }
    if (!j || typeof j !== 'object') continue;
    const name = typeof j.name === 'string' && j.name ? j.name : d.name;
    const aliases = [...new Set([name].concat(Array.isArray(j.aliases) ? j.aliases : []).map(a => String(a || '').trim().toLowerCase()).filter(a => a.length >= 3))];
    out.push({ name, dir: path.join(ACTIVE, d.name), index: typeof j.index === 'string' && j.index ? j.index : 'PROJECT.md', aliases });
  }
  return out;
}

// whole-word match: "pymtime" fires, "pymtimer" and "mypymtime" do not
function namedIn(prompt, projects) {
  const text = String(prompt || '').toLowerCase();
  return projects.filter(p => p.aliases.some(a => new RegExp('(^|[^a-z0-9])' + esc(a) + '([^a-z0-9]|$)').test(text)));
}

function firedLately(session, name, now) {
  let lines; try { lines = fs.readFileSync(LOG, 'utf8').trim().split('\n').slice(-300); } catch (_) { return false; }
  for (const l of lines) { try { const r = JSON.parse(l); if (r.action === 'fired' && r.session === session && r.project === name && now - Date.parse(r.ts) < REARM_MS) return true; } catch (_) {} }
  return false;
}

function contextFor(p) {
  const idx = path.join(p.dir, p.index);
  const has = fs.existsSync(idx);
  return [
    '📂 project-load: ' + p.name + ' is a project with its own folder (main checkout, not in git).',
    has ? '   READ FIRST: ' + idx : '   ⚠️ its index is MISSING: ' + idx + ' — create it first (shape: .claude/auto-memory/feedback_side_project_folder.md).',
    '   It is the index: state now, which file answers which question, hard rules, how to resume. Then open only the file its table names.',
    '   Every bulk change ends with: VERSIONS.md row + PROJECT.md state + ROADMAP.md status, same turn (Domain Expansion checks this with lib/save-rules.js).',
  ].join('\n') + '\n';
}

if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'project-load', event: 'UserPromptSubmit' }, (input) => {
    let data = input;
    if (typeof input === 'string') { try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; } }
    const prompt = data && data.prompt;
    if (!prompt || BYPASS_RE.test(prompt)) return { fired: false };
    const session = String((data && data.session_id) || 'no-session');
    const now = Date.now();
    const hits = namedIn(prompt, listProjects()).filter(p => !firedLately(session, p.name, now)).slice(0, 3);
    if (!hits.length) return { fired: false };
    for (const p of hits) { try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, JSON.stringify({ ts: new Date(now).toISOString(), action: 'fired', session, project: p.name, index_exists: fs.existsSync(path.join(p.dir, p.index)) }) + '\n'); } catch (_) {} }
    return { fired: true, blocked: false, contextOut: hits.map(contextFor).join('') };
  });
}

module.exports = { listProjects, namedIn, mainRootOf, contextFor };
