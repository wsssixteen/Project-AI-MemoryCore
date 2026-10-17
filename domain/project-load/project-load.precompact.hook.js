#!/usr/bin/env node
// project-load.precompact.hook.js — PreCompact (manual and auto), 2026-10-17, the project system
// TRIGGER: a compaction is about to run (auto at the context limit, or /compact).
// ACTION: copy his prompts (typed by him, or the brief that started a delegated session) since the session was bound
//         into every bound project's history\words.md, by script, word for word; log one "compact" row per project so the
//         SessionStart card can say how many were copied. A PreCompact hook cannot add text to the conversation and
//         this one never blocks a compaction: its whole job is the copy, before the summary replaces the turns.
// NOD: miya 2026-10-17 — "make use properly the jsonl or anything that is produced by the compaction".
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const P = require(path.join(__dirname, 'project.js'));

function run(data) {
  const session = String(data.session_id || 'no-session');
  const tp = data.transcript_path;
  const all = P.listProjects();
  let bound = P.bindings(session);
  if (!bound.length && tp) {
    const named = new Set(); for (const x of P.humanPrompts(tp)) for (const p of P.namedIn(x.text, all)) named.add(p.name);
    bound = [...named].slice(0, 2).map(n => ({ project: n, first: null }));
    for (const b of bound) P.logAppend({ action: 'bound', via: 'transcript', session, project: b.project });
  }
  const rows = [];
  for (const b of bound) {
    const p = all.find(x => x.name === b.project); if (!p) continue;
    const r = tp ? P.mineWords(p, tp, { session, sinceTs: b.first }) : { added: 0, error: 'no transcript_path' };
    const row = { action: 'compact', trigger: data.trigger || '', session, project: p.name, mined: r.added, ...(r.error ? { error: r.error } : {}) };
    P.logAppend(row); rows.push(row);
  }
  if (!rows.length) P.logAppend({ action: 'compact', trigger: data.trigger || '', session, project: null, mined: 0 });
  return rows;
}

if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'project-load-precompact', event: 'PreCompact' }, (input) => {
    let data; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    const rows = run(data);
    return { fired: rows.length > 0, blocked: false };
  });
}

module.exports = { run };
