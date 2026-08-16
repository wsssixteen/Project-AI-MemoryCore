#!/usr/bin/env node
// domain/quest-bounty/bulk.js — Phase-2 harvest-debt enumerator (read-only).
// Part of the quest-bounty Feature (extends the existing folder — no new shape;
// built 2026-08-16 per miya's reconciliation plan, B2).
//
//   node domain/quest-bounty/bulk.js --debt   → list archived quests with NO harvest
//                                               evidence; last line "N unharvested"
//
// Debt definition: a QA appears in quest/active-archive.txt (or its Task folder sits
// under 1. Tasks\Melaka\Archive) AND it has neither (a) a bounty row in log.jsonl
// nor (b) a "## Bounty"/"## Phase-2 bounty" section in its qa_doc (active or archive).
// Acceptance for the reconciliation: this prints "0 unharvested".
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const TASKS_ARCHIVE = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka\\Archive';

function safeRead(p) { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; } }

// 1. archived QA population: active-archive blocks + Archive folder names
const qas = new Set();
for (const m of safeRead(path.join(ROOT, 'quest', 'active-archive.txt')).matchAll(/^qa=(QA-\d+)$/gm)) qas.add(m[1]);
try {
  for (const d of fs.readdirSync(TASKS_ARCHIVE)) {
    const m = d.match(/#\s?(\d{6})/); if (m) qas.add('QA-' + m[1]);
  }
} catch (_) { console.error('warn: Tasks Archive dir unreadable — folder population skipped'); }

// 2. harvest evidence: log rows + qa_doc sections
const logged = new Set();
for (const line of safeRead(path.join(__dirname, 'log.jsonl')).split('\n').filter(Boolean)) {
  try {
    const r = JSON.parse(line);
    if (!r.qa) continue;
    if (r.action === 'refused') continue;                      // a gate refusal is NOT harvest evidence
    if (r.archive_atomic && r.qa_doc_has_bounty === false) continue; // stub receipt — harvest still owed
    logged.add(r.qa);
  } catch (_) {}
}
function docHasBounty(qa) {
  for (const dir of ['archive', 'active']) {
    const p = path.join(ROOT, 'projects', 'coding-projects', dir, qa, qa + '.md');
    if (fs.existsSync(p) && /^## (Phase-2 )?[Bb]ounty/m.test(safeRead(p))) return true;
  }
  return false;
}

// 3. diff
const debt = [...qas].filter(qa => !logged.has(qa) && !docHasBounty(qa)).sort();
for (const qa of debt) console.log(qa);
console.log(debt.length + ' unharvested (population: ' + qas.size + ' archived quests · ' + logged.size + ' logged rows)');
process.exit(0);
