#!/usr/bin/env node
// project-load.resume.hook.js — SessionStart, registered with matcher "compact|resume" (2026-10-17, the project system)
// TRIGGER: a session is compacted (auto or /compact) or resumed.
// ACTION: print the card of every project and quest this session works on, so the spec, hard rules, decisions and next
//         step are back in context without anyone asking. Projects come from the session's binding in log.jsonl
//         (written by project-load.check.hook.js); when there is none, from the aliases in his prompts in the transcript.
//         Quests come from the ticket numbers in his prompts (read only: the quest save path is unchanged).
//         On compact it also copies the new compaction summary into each project's history\compactions.md.
// The whole output stays under 9,200 characters: the harness cuts hook output over 10,000 characters to a 2,000-char preview.
// NOD: miya 2026-10-17 — "for Opus 5.5 session, it will only naturally survive compaction".
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const P = require(path.join(__dirname, 'project.js'));

function composeFor(t) {
  const n = t.projects.length + t.quests.length;
  if (!n) return '';
  const qMax = t.projects.length ? 2200 : 4200;
  const pMax = Math.min(P.CARD_MAX, Math.floor((P.SESSION_MAX - t.quests.length * qMax - 200) / Math.max(1, t.projects.length)));
  const parts = [];
  for (const p of t.projects) parts.push(P.card(p, { kind: t.kind, report: (t.reports || {})[p.name], mined: (t.mined || {})[p.name], max: pMax }));
  for (const q of t.quests) parts.push(P.questCard(q, qMax));
  let text = parts.join('\n');
  if (text.length > P.SESSION_MAX) text = text.slice(0, P.SESSION_MAX - 80) + '\n…(cut: read each START.md / qa_doc named above)\n';
  return text;
}

function targets(data) {
  const session = String(data.session_id || 'no-session');
  const all = P.listProjects();
  const bound = P.bindings(session);
  let projects = bound.map(b => all.find(p => p.name === b.project)).filter(Boolean);
  const reports = {}; for (const b of bound) if (b.report) reports[b.project] = b.report;
  const tp = data.transcript_path;
  if (!projects.length && tp) {   // no binding (a resumed session with a new id, or a lost log): read his prompts
    const named = new Set(); for (const x of P.humanPrompts(tp)) for (const p of P.namedIn(x.text, all)) named.add(p.name);
    projects = all.filter(p => named.has(p.name)).slice(0, 2);
    for (const p of projects) P.logAppend({ action: 'bound', via: 'transcript', session, project: p.name });
  }
  const quests = tp ? P.questsNamed(tp, P.questBlocks()) : [];
  const mined = {};
  for (const r of P.logRows()) if (r.session === session && r.action === 'compact' && r.project) mined[r.project] = r.mined;
  return { session, projects: projects.slice(0, 2), quests: quests.slice(0, 2), reports, mined };
}

if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'project-load-resume', event: 'SessionStart' }, (input) => {
    let data; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    const source = String(data.source || '');
    if (source !== 'compact' && source !== 'resume') return { fired: false };
    const t = targets(data);
    if (source === 'compact' && data.transcript_path) for (const p of t.projects) P.saveSummary(p, data.transcript_path);
    const text = composeFor(Object.assign({ kind: source }, t));
    for (const p of t.projects) P.logAppend({ action: 'resumed', via: 'session-start', source, session: t.session, project: p.name, chars: text.length });
    for (const q of t.quests) P.logAppend({ action: 'resumed', via: 'session-start', source, session: t.session, quest: q.qa, chars: text.length });
    if (!text) { P.logAppend({ action: 'resume-empty', source, session: t.session }); return { fired: false }; }
    return { fired: true, blocked: false, contextOut: text };
  });
}

module.exports = { composeFor, targets };
