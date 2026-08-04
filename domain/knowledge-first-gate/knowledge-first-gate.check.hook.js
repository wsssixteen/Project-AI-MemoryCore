#!/usr/bin/env node
// knowledge-first-gate.check.hook.js — born via core/forge.js (2026-08-05), implemented same day
// TRIGGER: Read/Grep/Edit/Write on an etanah-* source file (.java/.xhtml/.jrxml)
// ACTION: BLOCK until >=1 etanah-knowledge/melaka/*.md has been read THIS session.
//         The block message names the SPECIFIC knowledge file for that path.
//
// REPLAY (#273201, 3 sessions): PERANAN-MAP.md sections 4-5 already documented
// MlkPelupusanPegawaiAgihService and the peranan hierarchy. Skipped on the original pass, on
// rework-1 and on rework-2. miya ended up stating the rule himself — "THEY CAN ONLY GIVE PEOPLE
// OF LOWER RANKING" — after which it was derivable in one read and confirmed 4/4 against the code.
// CLAUDE.md's KNOWLEDGE-FIRST rule is prose, and prose does not fire.
//
// NOD: miya 2026-08-05 — "WE COLLECTED ALL THE FUCKING INFO ABOUT ETANAH AND YOU'RE STILL THE SAME"
//
// NOT "read it last session". EVERY session. A memory of a file is not the file — trusting one is
// the resolve-by-resemblance failure this gate family exists to kill.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.join(__dirname, 'log.jsonl');

// etanah SOURCE only. Not .json/.sql/.properties — the rule is about understanding the system
// before reading its CODE.
const ETANAH_SRC = /[\\/]etanah-(pelupusan|common|awam|teknikal)[\\/].+\.(java|xhtml|jrxml)$/i;
const KNOWLEDGE_READ = /etanah-knowledge[\\/]melaka[\\/][A-Za-z0-9._-]+\.md/i;
const BYPASS = /\[skip-knowledge-first:\s*[^\]]+\]/i;

function suggest(fp) {
  const s = String(fp || '').toLowerCase();
  const hits = [];
  if (/peranan|agih|pegawai|capaian/.test(s)) hits.push('PERANAN-MAP.md — the agihan rule (Pembetulan sends DOWN the hierarchy), role codes, capaian chain');
  if (/flowable|bpmn|tugasan|langkah|bpm/.test(s)) hits.push('FLOWABLE-WORKFLOWS.md — tugasan routing, the nextUser contract');
  if (/\.xhtml$/.test(s)) hits.push('JSF-WIRING.md + FRONTEND-PATTERNS.md — composite/EL/binding traps');
  if (/repository|entity|dao|service/.test(s)) hits.push('DATABASE.md — schema, canonical queries, source-of-truth tables');
  if (/word|docx|template/.test(s)) hits.push('WORD-TEMPLATE-RENDERING.md');
  if (/jrxml|report|jasper/.test(s)) hits.push('JASPER-REPORTS.md');
  if (!hits.length) hits.push("index.md — maps every file's SCOPE; start there");
  return hits;
}

runHook({ name: 'knowledge-first-gate', event: 'PreToolUse', log: LOG }, (input) => {
  let data = {};
  try { data = typeof input === 'string' ? JSON.parse(input || '{}') : (input || {}); } catch (_) { return { fired: false }; }

  const ti = data.tool_input || {};
  const fp = ti.file_path || ti.path || ti.pattern || '';
  if (!ETANAH_SRC.test(String(fp))) return { fired: false };

  let text = '';
  try { text = fs.readFileSync(data.transcript_path, 'utf8'); } catch (_) { text = ''; }

  if (BYPASS.test(text)) return { fired: true, blocked: false, contextOut: 'knowledge-first-gate: bypassed\n' };
  if (KNOWLEDGE_READ.test(text)) return { fired: true, blocked: false, contextOut: 'knowledge-first-gate: knowledge read this session\n' };

  const reason = [
    '⛔ knowledge-first-gate: reading etanah SOURCE with ZERO etanah-knowledge file read this session.',
    '',
    `   target: ${String(fp).slice(0, 160)}`,
    '',
    '   Read one of these FIRST, then retry — the gate clears itself:',
    ...suggest(fp).map(p => `     - ${p}`),
    '',
    '   Location: projects/coding-projects/active/etanah-knowledge/melaka/',
    '',
    '   NOT "I read it last session". EVERY session. A memory of a file is not the file.',
    '   #273201: skipped 3 sessions running. PERANAN-MAP.md held the agihan hierarchy rule the',
    '   whole time; miya had to state it himself. One read would have derived it.',
    '',
    '   Genuinely uncovered by the knowledge base? [skip-knowledge-first: <reason>]',
  ].join('\n');

  // NOTE: the field is `blockReason`, NOT `reason` — lib/hook-runtime.js:106 only writes
  // out.blockReason to stderr. Returning `reason` exits 2 with ZERO output: a silent blocker
  // that stops the turn and explains nothing. Caught by this eval's F3/F5 effect checks.
  return { fired: true, blocked: true, blockReason: reason };
});
