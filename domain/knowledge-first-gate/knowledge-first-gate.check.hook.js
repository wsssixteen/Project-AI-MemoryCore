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
// v2 (2026-08-07, #274510, miya): FLOWABLE-CHANGE branch added — touching engine/BPMN state
// (a .bpmn edit, a flowable-core source file, or an Edit/Write/Bash whose SQL hits umm_aliran_kerja/
// umm_a_tgsn/umm_tgsn_semasa/act_*) BLOCKS until FLOWABLE-KNOWLEDGE.md is read THIS session. A generic
// knowledge read does NOT clear this branch (eval F15) — the deep architecture doc is required
// specifically. NOD: "CREATE A HOOK SO THAT WHEN WE WANT TO TOUCH ANYTHING RELATED TO CHANGING/
// UPDATING FLOWABLE/BPMN YOU WILL LOAD THAT <FLOWABLE KNOWLEDGE> MD FILE". Extended (not a new
// component) per inventory-first: this gate already detected flowable keywords. Eval: 17/17 green.
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

// v2 FLOWABLE-CHANGE intent (miya 2026-08-07, #274510): touching engine/BPMN state needs the DEEP
// architecture doc, and a generic knowledge read must NOT clear it. Fires on: a .bpmn file edit;
// a flowable-core source file; or an Edit/Write/Bash whose SQL touches a bridge/engine table.
const FLOWABLE_CORE_SRC = /(InitiateBPMFlowableForm|PelupusanFlowableService|CommonBPMServiceClient|FlowableTaskListener|BpmCallbackService|BpmAlterFlowForm|CommonAsyncService)\.java$/i;
const BPMN_FILE = /\.bpmn20?\.xml$/i;
const FLOWABLE_SQL = /\b(umm_aliran_kerja|umm_a_tgsn|umm_tgsn_semasa|act_ru_|act_hi_|act_re_procdef|process_instance_id_|proc_inst_id_|moveActivityIdTo|alterFlow)\b/i;
const FLOWABLE_KNOWLEDGE_READ = /etanah-knowledge[\\/]melaka[\\/]FLOWABLE-KNOWLEDGE\.md/i;

function isFlowableChange(toolName, fp, ti) {
  if (BPMN_FILE.test(fp) || FLOWABLE_CORE_SRC.test(fp)) return true;
  const body = `${ti.content || ''}\n${ti.new_string || ''}\n${ti.old_string || ''}\n${ti.command || ''}\n${ti.query || ''}`;
  if (/\.(sql)$/i.test(fp) && FLOWABLE_SQL.test(body)) return true;
  if ((toolName === 'Bash' || /postgres.*query/i.test(toolName)) && /\b(update|insert|delete)\b/i.test(body) && FLOWABLE_SQL.test(body)) return true;
  return false;
}

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
  const toolName = data.tool_name || '';
  const fp = ti.file_path || ti.path || ti.pattern || '';

  // v2 FLOWABLE-CHANGE branch first — it demands the DEEP doc specifically, and fires on
  // .sql/.bpmn/Bash that the generic ETANAH_SRC check would miss.
  if (isFlowableChange(toolName, String(fp), ti)) {
    let ftext = '';
    try { ftext = fs.readFileSync(data.transcript_path, 'utf8'); } catch (_) { ftext = ''; }
    if (BYPASS.test(ftext)) return { fired: true, blocked: false, contextOut: 'knowledge-first-gate: bypassed (flowable-change)\n' };
    if (FLOWABLE_KNOWLEDGE_READ.test(ftext)) return { fired: true, blocked: false, contextOut: 'knowledge-first-gate: FLOWABLE-KNOWLEDGE.md read this session\n' };
    const freason = [
      '⛔ knowledge-first-gate: about to CHANGE Flowable/BPMN state without reading FLOWABLE-KNOWLEDGE.md this session.',
      '',
      `   target: ${String(fp).slice(0, 160)}`,
      '',
      '   Read this FIRST (it is the reverse-engineered, engine-VERIFIED architecture), then retry:',
      '     projects/coding-projects/active/etanah-knowledge/melaka/FLOWABLE-KNOWLEDGE.md',
      '',
      '   It carries: the et_main<->et_flowable17 bridge (3 links), the column-name trap',
      '   (proc_inst_id_ vs process_instance_id_), the lifecycle, the routing variables, the',
      '   InitiateBPMFlowableForm 5-action map, and the page-vs-SQL-patch rule. A raw SQL insert of',
      '   umm_a_tgsn/umm_tgsn_semasa without an engine process re-creates the desync (#274510).',
      '',
      '   Genuinely not a flowable change? [skip-knowledge-first: <reason>]',
    ].join('\n');
    return { fired: true, blocked: true, blockReason: freason };
  }

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
