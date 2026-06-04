/**
 * quest-knowledge-save-gate.js — Stop hook (warn-only v1)
 *
 * Fires at the end of every turn. If an Etanah quest is ACTIVE and this turn's
 * reply surfaced a DURABLE finding (schema / JSF wiring / bug shape / flow /
 * domain term / test tuple), nudge Ruri to persist it NOW — instead of letting
 * findings pile up until the session-end DE Step-7 sweep.
 *
 * Routing (split per みや 2026-06-03):
 *   - DURABLE codebase knowledge → the matching etanah-knowledge/<category>.md
 *   - QUEST-specific detail       → projects/coding-projects/active/QA-<n>/QA-<n>.md
 *
 * A hook cannot classify + write the finding itself (model judgment) — it only
 * fires the reminder deterministically. The actual categorized write is Ruri's.
 *
 * v1: warn-only (stderr + log). v1.1 candidate: block Stop if an active-quest
 * investigation turn surfaced a finding and nothing was written this turn.
 *
 * Skips silently when: no active quest · no discovery signal in the reply ·
 * the reply already states it saved to a knowledge file / QA-doc this turn.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const activePath = path.join(projectRoot, 'quest', 'active.txt');
const knowledgeDir = path.join(projectRoot, 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka');
const logPath = path.join(projectRoot, 'Feature', 'Forge-Self-Improvement-System', 'quest-knowledge-save-log.jsonl');

// Category → etanah-knowledge file (mirrors DE Step-7 sweep table).
const CATEGORY_TABLE = [
  ['DB schema · table · @Column · @Table · canonical query · aplikasi_id join', 'DATABASE.md'],
  ['bean/class convention · package boundary · populator framework', 'MODULE-ARCHITECTURE.md'],
  ['composite · EL binding · selectOneMenu/listener wiring · xhtml pattern', 'JSF-WIRING.md'],
  ['BPMN · tugasan · langkah · skrin routing · userTask vs callActivity', 'FLOWABLE-WORKFLOWS.md'],
  ['Malay term · urusan code · business rule', 'DOMAIN-GLOSSARY.md'],
  ['recurring bug pattern · slip shape', 'BUG-BESTIARY.md'],
  ['known issue we cannot fix yet', 'DEFERRED-CRITICAL-ISSUES.md'],
  ['verified permohonan-tugasan-user tuple', 'TEST-PERMOHONAN-INDEX.md'],
  ['UX pattern · mode-binding convention', 'FRONTEND-PATTERNS.md'],
  ['cross-urusan flow · role/peranan map', 'URUSAN-FLOW.md / PERANAN-MAP.md'],
];

// Signals that a durable finding was likely surfaced this turn.
const DISCOVERY_RX = /root cause|the chain|class chain|@Column|@Table|populator|tugasan|langkah|ind_skrin|ind_langkah|\bBPMN\b|callActivity|userTask|turns out|it turns out|discovered that|the bug is|because the |selectOneMenu|listener=|aplikasi_id|\b[A-Z][A-Za-z]+\.(java|xhtml)\b|:\d{2,4}\b/;

// Phrases that mean Ruri already persisted this turn → don't nag.
const ALREADY_SAVED_RX = /saved to|wrote to|appended to|written into|→ (DATABASE|MODULE-ARCHITECTURE|JSF-WIRING|FLOWABLE-WORKFLOWS|DOMAIN-GLOSSARY|BUG-BESTIARY|DEFERRED-CRITICAL|TEST-PERMOHONAN|FRONTEND-PATTERNS|URUSAN-FLOW|PERANAN-MAP|QA-\d+)\.md|updated QA-\d+\.md|etanah-knowledge\/melaka\//;

function getActiveQuest() {
  try {
    const text = fs.readFileSync(activePath, 'utf8');
    // walk every qa= block; pick the first with status=active
    const blocks = text.split(/(?=^qa=QA-\d+)/m).filter(b => /^qa=QA-\d+/.test(b));
    for (const block of blocks) {
      const status = (block.match(/^status=(\S+)/m) || [])[1];
      if (status !== 'active') continue;
      const qa = (block.match(/^qa=(QA-\d+)/) || [])[1];
      const phase = (block.match(/^current_phase=(\S+)/m) || [])[1] || (block.match(/^phase=(\S+)/m) || [])[1];
      const qaDoc = (block.match(/^qa_doc=(.+)$/m) || [])[1];
      const scope = (block.match(/^(?:scope|env|urusan)=(.+)$/m) || [])[1];
      return { qa, phase: phase || '?', qaDoc: qaDoc ? qaDoc.trim() : null, scope: scope ? scope.trim() : '' };
    }
    return null;
  } catch (e) { return null; }
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    if (data.stop_hook_active) process.exit(0); // avoid re-entrancy loops
    const text = JSON.stringify(data);

    const active = getActiveQuest();
    if (!active) process.exit(0);

    if (!DISCOVERY_RX.test(text)) process.exit(0);        // no finding this turn
    if (ALREADY_SAVED_RX.test(text)) process.exit(0);     // already persisted this turn

    const qaDocPath = active.qaDoc
      ? active.qaDoc
      : `projects/coding-projects/active/${active.qa}/${active.qa}.md`;

    const entry = {
      ts: new Date().toISOString(),
      qa: active.qa,
      phase: active.phase,
      action: 'warn-only-v1',
    };
    try { fs.appendFileSync(logPath, JSON.stringify(entry) + '\n'); } catch (_) {}

    const table = CATEGORY_TABLE.map(([k, f]) => `     ${f.padEnd(34)} ← ${k}`).join('\n');
    process.stderr.write(
`\n📚 quest-knowledge-save: ${active.qa} (phase ${active.phase}) surfaced a finding this turn — persist it before it's lost.
   DURABLE codebase knowledge → the matching etanah-knowledge/melaka file:
${table}
   QUEST-specific detail → ${qaDocPath}
   (warn-only — if nothing durable surfaced, ignore. Say what you saved to silence next turn.)\n`);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
