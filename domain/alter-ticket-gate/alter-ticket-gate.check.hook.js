#!/usr/bin/env node
// alter-ticket-gate.check.hook.js — born via core/forge.js (2026-09-04), implemented same day
// TRIGGER: a ticket mention / ad-hoc relay / prior assistant turn carries an ALTER signal
//          (alter ID, alter ke tugasan, Initiate & Alter, Alter Flow, moveActivityIdTo) for an etanah permohonan.
// ACTION:  ADVISORY — inject the state-routed ALTER layer (ALTER-TICKET-PLAYBOOK.md + <state> file) and the
//          A0-A6 deterministic rows + the fixed reply format. State resolved from active.txt / Task folder /
//          permohonan-ID prefix. Never blocks.
//
// REPLAY (#275847, 2026-09-04, Perak): Ammar "can help alter to SPI Semakan Permohonan" — the quest hard-coded
//   melaka knowledge, no alter layer existed; the Perak page/verify/reply mechanics were re-derived from zero.
//   (#277926, 2026-09-03, Melaka): Initiate & Alter picked the wrong SKM twin by NAME on PROD.
// NOD: miya 2026-09-04 — "build a format for deterministic replying to alter type tickets ... include it into our
//   Quest workflow when detecting the solution as flowable type ... just like we loaded other things by layers".
//
// state-scoped: YES — keyed by state (melaka|perak|selangor|terengganu|kedah|wp) via STATE_MAP below.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.join(__dirname, 'log.jsonl');

// A worktree has no quest/active.txt and may lack projects/ (both gitignored) — fall back to the main checkout.
const MAIN_ROOT = ROOT.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/, '');
const ACTIVE_PATH = process.env.ALTER_GATE_ACTIVE_PATH
  || [path.join(ROOT, 'quest', 'active.txt'), path.join(MAIN_ROOT, 'quest', 'active.txt')].find(p => fs.existsSync(p))
  || path.join(ROOT, 'quest', 'active.txt');
const KNOWLEDGE_ROOT = process.env.ALTER_GATE_KNOWLEDGE_ROOT
  || [path.join(ROOT, 'projects', 'coding-projects', 'active', 'etanah-knowledge'),
      path.join(MAIN_ROOT, 'projects', 'coding-projects', 'active', 'etanah-knowledge')].find(p => fs.existsSync(p))
  || path.join(MAIN_ROOT, 'projects', 'coding-projects', 'active', 'etanah-knowledge');
const PLAYBOOK_REL = 'projects/coding-projects/active/etanah-knowledge/ALTER-TICKET-PLAYBOOK.md';

// One row per state. `file` = the state's alter mechanics file (relative to etanah-knowledge/).
const STATE_MAP = {
  melaka:     { prefix: 'PTMLK', folder: 'melaka',     file: 'melaka/FLOWABLE-KNOWLEDGE.md', note: '§6 five actions · §6b verify · §6c admin UI · §11.5 edge-trace' },
  perak:      { prefix: 'PTPK',  folder: 'perak',      file: 'perak/FLOWABLE-ALTER.md',      note: 'Utility page (no one-click Init&Alter) · Oracle verify · staging BPMN dump' },
  selangor:   { prefix: 'PTSGR', folder: 'selangor',   file: 'selangor/FLOWABLE-ALTER.md',   note: '⬜ NOT WRITTEN — derive from the playbook + oracle-slt + Selangor checkout, then write it' },
  terengganu: { prefix: 'PTTRG', folder: 'terengganu', file: 'terengganu/FLOWABLE-ALTER.md', note: '⬜ NOT WRITTEN' },
  kedah:      { prefix: 'PTKDH', folder: 'kedah',      file: 'kedah/FLOWABLE-ALTER.md',      note: '⬜ NOT WRITTEN' },
  wp:         { prefix: 'PTWP',  folder: 'putrajaya',  file: 'wp/FLOWABLE-ALTER.md',         note: '⬜ NOT WRITTEN' },
};
const FOLDER_TO_STATE = { melaka: 'melaka', perak: 'perak', selangor: 'selangor', terengganu: 'terengganu', kedah: 'kedah', putrajaya: 'wp', 'wp': 'wp', kl: 'wp' };

// Strong signals — page/engine vocabulary that means "alter" unambiguously.
const ALTER_STRONG = /initiate\s*(?:&(?:amp;)?|and|\+|-)\s*alter|InitiateBPMFlowableForm|BpmAlterFlowForm|moveActivityIdTo|alter\s*flow\s*flowable|flowable\s+alter\b|alter\s+page|flowable\s+utility\s+page|initiate\s+flowable\b|on-submit\s+flowable|migrate\s+bpm\s+to\s+flowable/i;
// DFT serahan ids (07MH412/2026 · 04MH109/2026 · 07N209/2022) — an alter relay may name only the serahan.
const SERAHAN_ID = /\b\d{2}[A-Z]{1,4}\d{1,6}\/\d{4}\b/;
// Ask signals — "alter" as a request about a token/tugasan/ID. \balter\b never matches "alternative"/"alteration".
const ALTER_ASK = /\b(?:tolong|please|mohon|boleh|can|help|kindly|sila|need\s+to|nak)\b[^.\n]{0,40}\balter\b|\balter(?:ed|ing)?\b\s*(?:the\s+|this\s+|semula\s+|balik\s+)?(?:id\b|permohonan|tugasan|ke\s|to\s|balik|semula|flow\b|token|process|SPI\b|SKM\b|[A-Z]{2,6}\b\s*[-–(])|\b(?:pindah(?:kan)?|kembalikan|undur(?:kan)?)\s+(?:tugasan|token|process|ke\s+tugasan)\b|\bmove\s+(?:the\s+)?(?:token|process)\b|\balter\s*id\b/i;
const PERMOHONAN_ID = /\bPT([A-Z]{2,4})\/\d{2}\/[A-Z]\/[A-Z0-9]+\/\d{4}\/\d+/;
const TICKET_RE = /\b(?:QA|FAT-OR|UAT-CR|FAT|UAT|REQUIREMENT|REQ|CR|Redmine|ticket|issue|II|ES|ESOKONGAN)\s*#?\s*(\d{5,7})\b/i;
const BYPASS = /\[skip-alter-gate:\s*[^\]]+\]/i;
// A genuine Read of the playbook — the hook's own advisory text names the file in prose, never as a tool_use file_path.
const PLAYBOOK_READ = /"file_path"\s*:\s*"[^"]*ALTER-TICKET-PLAYBOOK\.md"/;
const OWN_OUTPUT = /alter-ticket-gate|ALTER-TICKET GATE/;

function readActiveBlock(qaNum) {
  const st = {};
  try {
    const text = fs.readFileSync(ACTIVE_PATH, 'utf8');
    const blocks = text.split(/^(?=qa=)/m);
    const head = new RegExp(`^qa=(?:QA-)?${qaNum}\\b`);
    const block = blocks.find(b => head.test(b));
    if (!block) return st;
    block.split('\n').forEach(l => { const i = l.indexOf('='); if (i > -1) st[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
  } catch (_) { /* absent */ }
  return st;
}
function bareTicket(prompt) {
  try {
    const text = fs.readFileSync(ACTIVE_PATH, 'utf8');
    for (const n of (prompt.match(/\b\d{5,7}\b/g) || [])) if (new RegExp('^qa=(?:QA-)?' + n + '\\b', 'm').test(text)) return n;
  } catch (_) { /* absent */ }
  return null;
}
function readBrief(folder) {
  if (!folder) return '';
  let out = '';
  for (const f of ['Description.txt', 'History.txt']) { try { out += '\n' + fs.readFileSync(path.join(folder, '0. Brief', f), 'utf8'); } catch (_) { /* absent */ } }
  return out;
}
function readTranscriptTail(p) {
  try {
    const size = fs.statSync(p).size, want = 250000;
    const fd = fs.openSync(p, 'r'); const buf = Buffer.alloc(Math.min(size, want));
    fs.readSync(fd, buf, 0, buf.length, Math.max(0, size - buf.length)); fs.closeSync(fd);
    return buf.toString('utf8');
  } catch (_) { return ''; }
}
// "Was the playbook opened THIS session?" must look at the WHOLE transcript — in a long session the Read sits
// megabytes before the tail (this session: 6.4 MB). Streamed in 1 MB chunks; never parsed.
function playbookReadInSession(p) {
  try {
    const fd = fs.openSync(p, 'r'); const chunk = Buffer.alloc(1048576); let pos = 0, carry = '', hit = false;
    for (;;) {
      const n = fs.readSync(fd, chunk, 0, chunk.length, pos); if (n <= 0) break;
      const s = carry + chunk.toString('utf8', 0, n);
      if (PLAYBOOK_READ.test(s)) { hit = true; break; }
      carry = s.slice(-300); pos += n;
    }
    fs.closeSync(fd); return hit;
  } catch (_) { return false; }
}
function assistantTextOnly(tail) {
  // only assistant lines, and never the gate's own advisory (self-disarm / self-trigger guard)
  return tail.split('\n').filter(l => /"type"\s*:\s*"assistant"/.test(l) && !OWN_OUTPUT.test(l)).join('\n');
}
function resolveState(st, texts) {
  if (st.state && FOLDER_TO_STATE[st.state.toLowerCase()]) return { state: FOLDER_TO_STATE[st.state.toLowerCase()], src: 'active.txt state=' };
  const m = (st.task_folder || '').match(/[\\/]1\. Tasks[\\/]([^\\/]+)/i);
  if (m && FOLDER_TO_STATE[m[1].toLowerCase()]) return { state: FOLDER_TO_STATE[m[1].toLowerCase()], src: 'Task folder ' + m[1] };
  for (const t of texts) {
    const id = t.match(PERMOHONAN_ID);
    if (id) { const hit = Object.entries(STATE_MAP).find(([, v]) => v.prefix === 'PT' + id[1]); if (hit) return { state: hit[0], src: 'permohonan-ID prefix ' + id[0] }; }
  }
  return { state: 'unknown', src: 'no state evidence' };
}
function signalIn(text) {
  const m = text.match(ALTER_STRONG) || text.match(ALTER_ASK);
  return m ? m[0].replace(/\s+/g, ' ').slice(0, 60) : null;
}

runHook({ name: 'alter-ticket-gate', event: 'UserPromptSubmit', log: LOG }, (input) => {
  let data = {};
  try { data = typeof input === 'string' ? JSON.parse(input || '{}') : (input || {}); } catch (_) { return { fired: false }; }
  const prompt = String(data.prompt || '');
  if (!prompt) return { fired: false };
  if (BYPASS.test(prompt)) return { fired: true, blocked: false, contextOut: 'alter-ticket-gate: bypassed\n' };

  const tm = prompt.match(TICKET_RE);
  const qaNum = tm ? tm[1] : bareTicket(prompt);
  const st = qaNum ? readActiveBlock(qaNum) : {};
  const brief = qaNum ? readBrief(st.task_folder) : '';
  const tail = data.transcript_path ? readTranscriptTail(String(data.transcript_path)) : '';
  const priorTurns = assistantTextOnly(tail);
  if (BYPASS.test(priorTurns)) return { fired: false };

  const context = qaNum || PERMOHONAN_ID.test(prompt) || PERMOHONAN_ID.test(priorTurns) || SERAHAN_ID.test(prompt);
  if (!context) return { fired: false };

  const where = [['prompt', prompt], ['ticket brief', brief + ' ' + (st.issue_one_liner || '')], ['prior turn', priorTurns]];
  let signal = null, src = null;
  for (const [name, text] of where) { const s = signalIn(text); if (s) { signal = s; src = name; break; } }
  if (!signal) return { fired: false };

  const { state, src: stateSrc } = resolveState(st, [prompt, brief, priorTurns]);
  const row = STATE_MAP[state];
  // The knowledge folder is untracked and lives in BOTH the worktree and the main checkout (OneDrive copies that
  // can lag each other) — a file present in either copy is not "missing".
  const knowledgeRoots = process.env.ALTER_GATE_KNOWLEDGE_ROOT ? [KNOWLEDGE_ROOT]
    : [KNOWLEDGE_ROOT, path.join(MAIN_ROOT, 'projects', 'coding-projects', 'active', 'etanah-knowledge')];
  const stateFileExists = row ? knowledgeRoots.some(k => fs.existsSync(path.join(k, row.file))) : false;
  const alreadyRead = PLAYBOOK_READ.test(tail) || (data.transcript_path ? playbookReadInSession(String(data.transcript_path)) : false);
  const label = qaNum ? `QA #${qaNum}` : 'ad-hoc alter relay (no ticket)';

  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), qa: qaNum || null, state, state_src: stateSrc, signal, signal_src: src, mode: alreadyRead ? 'reminder' : 'full', outcome: 'fired' }) + '\n'); } catch (_) { /* never block */ }

  if (alreadyRead) {
    return { fired: true, blocked: false, contextOut: `🔀 alter-ticket-gate: ALTER layer already loaded this session (state=${state}) — rows A0–A6 + the §5 reply format still apply; re-read ${row ? row.file : 'the state file'} if the target node or action changed.\n` };
  }

  const lines = [
    `🔀 ALTER-TICKET GATE — ${label} · state=${state} (from ${stateSrc}) · signal="${signal}" in ${src}`,
    `   MANDATORY READS this session, BEFORE any node pick, runbook, or reply:`,
    `     1. ${PLAYBOOK_REL}   ← procedure A0–A6 + the fixed reply formats (§5)`,
    row ? `     2. projects/coding-projects/active/etanah-knowledge/${row.file}   ← ${row.note}${stateFileExists ? '' : '   ⚠️ FILE MISSING — write it from the playbook before proceeding'}`
        : `     2. ⚠️ state UNKNOWN — ask みや which state; never default to Melaka silently`,
    `   EMIT the rows as ✓/⬜ (a skipped row must be VISIBLE):`,
    `     A0 ⬜ RESOLVE words → objects: "ID Permohonan" → aplikasi_id · urusan · pejabat; "tugasan X" → ind_tgsn kod(s) under THAT urusan; each "serahan" → its own aplikasi + hubungan_aliran_kerja_id`,
    `     A1 ⬜ LIVE-PROCESS CHECK: umm_aliran_kerja (process ids) · umm_a_tgsn flag_aktif='Y' · umm_tgsn_semasa · header status/trkh_tamat (Tamat/Tarik Balik = ended → Alter Flow impossible)`,
    `     A2 ⬜ BIRTH CHECK: integration child (hubungan set) vs counter/standalone (hubungan NULL, KodPemula=PEMULA_ABK) — decides whether "re-run X to regenerate Y" is a mechanism at all`,
    `     A3 ⬜ NODE EDGE-TRACE table for the target (grep receiveUserTask(&quot;KOD&quot; in <state>/flowables-bpmn/<KEY>.bpmn20.xml — dump if absent); OUTGOING edge = intended next step? twins by edges, never by name`,
    `     A4 ⬜ ACTION DECISION: Alter Flow (live) | Initiate→Alter (ended, node in LATEST model) | NOT EXECUTABLE (no process / node absent / born elsewhere) — one row, evidence per cell`,
    `     A5 ⬜ RUNBOOK for みや (he types the login, Ruri never does) + BEFORE/AFTER verify SQL in the state dialect — or the not-executable evidence`,
    `     A6 ⬜ REPLY in the playbook §5 format (done-alter 5-line block | not-executable options block) — BA register, no file:line / SQL / engine ids`,
    `   Bypass: [skip-alter-gate: <reason>]`,
    '',
  ];
  return { fired: true, blocked: false, contextOut: lines.join('\n') };
});
