#!/usr/bin/env node
// project-load.save.hook.js — Stop (child of bundle domain/bundles/stop-claim-integrity.json), 2026-10-17, the project system
// TRIGGER: end of a turn in a session bound to a project in shape 2 (project.json "shape": 2).
// ACTION: BLOCK when (a) the reply states a decision (an agreed fix, his ruling, a spec change) and no DECISIONS.md of a
//         bound project was written since this turn began; or (b) the session is delegated (its brief named
//         reports\<name>.md) and that report is missing, lacks one of the six fixed headings, or is older than the newest
//         change in the project folder since the session began. Logs one "stop-check" row per project for lib/save-rules.js.
// Never blocks twice in a row (stop_hook_active). Bypass, with a reason, in the reply:
//   [skip-project-decision: <reason>] · [skip-project-report: <reason>]
// NOD: miya 2026-10-17 — "like you've already agreed on a fix because of latest findings, then you suddenly forgot about it".
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const P = require(path.join(__dirname, 'project.js'));

const DECISION_RE = /\b(we\s+(have\s+|'ve\s+)?(agreed|decided|settled\s+on)|(he|you|miya|みや)\s+(ruled|decided|agreed\s+to|chose|picked|approved)|i\s+(have\s+|'ve\s+)?decided|we'?ll\s+go\s+with|going\s+with\s+(option|design|plan|sample)|the\s+(agreed\s+)?fix\s+is|ruling\s*:|decision\s*:|decided\s*:|agreed\s*:)/i;
const DECISIONS_SECTION_RE = /^#+\s*(\d+\.\s*)?Decisions made[^\n]*\n+(?!\s*(\(?none|—|-\s*none|n\/a|_none|nothing))\s*\S/im;
const bypass = (text, name) => new RegExp('\\[skip-' + name + ':\\s*[^\\]\\s][^\\]]*\\]', 'i').test(text);

// The words of a decision count only in my own prose: not inside code, not in a quoted line, not in a table row that quotes a rule.
function prose(text) {
  return String(text || '').replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, ' ').split(/\r?\n/).filter(l => !/^\s*>/.test(l)).join('\n');
}
function decisionShape(text) { const t = prose(text); return DECISION_RE.test(t) || DECISIONS_SECTION_RE.test(t); }

function evaluate(data, now) {
  const session = String(data.session_id || 'no-session');
  const all = P.listProjects();
  const bound = P.bindings(session).map(b => Object.assign({}, b, { p: all.find(x => x.name === b.project) })).filter(b => b.p && b.p.shape >= 2);
  if (!bound.length) return { applies: false };
  const reply = String(data.last_assistant_message || '');
  const tp = data.transcript_path;
  const turnStart = (tp && P.turnStartMs(tp)) || (now - 15 * 60000);
  const sessionStart = (tp && P.sessionStartMs(tp)) || turnStart;
  const problems = [], rows = [];
  const shape = decisionShape(reply);
  const ledgers = bound.map(b => ({ name: b.p.name, file: path.join(b.p.dir, 'DECISIONS.md') }));
  const written = ledgers.some(l => P.mtime(l.file) >= turnStart - 3000);
  if (shape && !written && !bypass(reply, 'project-decision')) {
    problems.push('🧾 project-save: this reply states a decision, and no decisions ledger was written this turn.\n   Write it now (one row: date · decision · why · who · spec row):\n' +
      ledgers.map(l => '   node domain/project-load/project.js decide ' + JSON.stringify(l.name) + ' --decision "…" --why "…" --who "…" --serves S#').join('\n') +
      '\n   Not a decision (a quote, a plan, an option)? Add [skip-project-decision: <reason>] to the reply.');
  }
  for (const b of bound) {
    const row = { action: 'stop-check', session, project: b.p.name, decision_shape: shape, ledger_written: written };
    if (b.report) {
      const rtext = P.read(b.report);
      const missing = rtext === null ? ['the file'] : P.reportMissing(rtext);
      const last = P.newestChange(b.p.dir, sessionStart);
      const rm = P.mtime(b.report);
      Object.assign(row, { report: b.report, report_mtime: rm, last_change: last.ms, last_change_file: last.file });
      const stale = last.ms && rm + 2000 < last.ms;
      if ((missing.length || stale) && !bypass(reply, 'project-report')) {
        problems.push('📝 project-save: your report ' + b.report + (rtext === null ? ' does not exist.' : missing.length ? ' lacks: ' + missing.join(' · ') + '.' : ' is older than your last change (' + path.basename(last.file) + ').') +
          '\n   Write it before you end the turn, with exactly: ' + P.REPORT_HEADINGS.map(h => h[0]).join(' · ') + '. [skip-project-report: <reason>] if this turn changed nothing of yours.');
      }
    }
    rows.push(row);
  }
  return { applies: true, problems, rows };
}

if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'project-save', event: 'Stop' }, (input) => {
    let data; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    const r = evaluate(data, Date.now());
    if (!r.applies) return { fired: false };
    const block = r.problems.length > 0 && !data.stop_hook_active;
    for (const row of r.rows) P.logAppend(Object.assign(row, { blocked: block, would_block: r.problems.length > 0 }));
    if (!r.problems.length) return { fired: false };
    if (!block) return { fired: true, blocked: false };
    return { fired: true, blocked: true, blockReason: r.problems.join('\n') + '\n' };
  });
}

module.exports = { evaluate, decisionShape, prose, DECISION_RE };
