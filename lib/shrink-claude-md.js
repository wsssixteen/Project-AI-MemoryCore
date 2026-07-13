#!/usr/bin/env node
/**
 * lib/shrink-claude-md.js — one-shot C1 (conservative pass): replace the CLAUDE.md sections
 * whose content is PARITY-VERIFIED elsewhere with short pointers. Sections whose content has
 * no verified second home are NOT touched (parity beats line-count — the May-trim lesson).
 * Deterministic heading-based splice; prints before/after line counts; revalidates pointers.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const FILE = path.join(ROOT, '.claude', 'CLAUDE.md');
const src = fs.readFileSync(FILE, 'utf8');
const before = src.split('\n').length;

// heading (exact ## line prefix) -> replacement body (pointer). Body spans up to the next '\n## ' or '\n---\n## '.
const REPLACEMENTS = {
  '## 🗣️ Explanation & Output-Format Discipline': `
> **CANONICAL SPEC**: \`.claude/reply-shape-spec.md\` — THE single output spec (audit R4); the reply-shape gate bundle enforces its mechanical floor. This section became a pointer 2026-07-13 (external-audit C1); full rule bodies live in the spec, history in git (\`pre-phase2-baseline\`).

**🏛️ PILLAR — SHOW, DON'T EXPLAIN**: tables + story diagrams carry the load; prose gets ONE short sentence per point (TWO when splitting a layman + a technical sentence). Order: **Bottom Line → Table/Drawing → Arrows** — skip-don't-reorder, never lead with structure. One register per container · bird's-eye before granular · anchor to what みや can SEE (\`UI → code → table\`). Personal/reflective replies are EXEMPT (personality.md personal-expression governs).
`,
  '## 🗄️ Database & Entity Resolution': `
> **MOVED to the quest skill** (JIT on every ticket trigger via ticket-gate): \`.claude/skills/quest/SKILL.md\` §Boot-summary content — Entity-first SQL · schema-prefix rules (MCP-prefixed vs みや-unqualified) · the \`umm_aplikasi\`/\`aplikasi_id\` spine · \`ind_langkah.nama\` symptom→screen lookup · patch-script portability + Stage-Match Block + expected-outcome annotation · RAW-FIRST scripts · Verify-SELECT true-values. (external-audit C1 2026-07-13; parity verified — changelog v1.65.)
`,
  '## ⚔️ Quest Workflow': `
**THE ENGINE — \`Scout → Recon → Rubric → Apply\`.** Full workflow body: \`.claude/skills/quest/SKILL.md\` (incl. §Boot-summary content absorbed from this file 2026-07-13) + \`quest/quest-protocol.md\`. JIT-loading is deterministic: \`ticket-gate.js\` force-injects on ANY ticket mention (number / continuation / rework — the full trigger table now lives in the skill). The forced phase emits (Scout · RCRL · Recon · Rubric · Predicate Diagram · per-file sibling-diff line · Quest Briefing SD) remain MANDATORY — enforced by \`quest-phase-gate\` + the quest skill. Quest Preparation Verification table · scope-disambiguation cascade · Notes/History-first rules · Permohonan-ID 4-tier hierarchy · canonical task-state SQL: all in the quest skill. (external-audit C1 2026-07-13; parity verified — changelog v1.65.)
`,
  '## 🔢 Phase 1 Closure — Git Sequence': `
> **MOVED to the quest skill**: \`.claude/skills/quest/SKILL.md\` §Boot-summary content → Phase 1 Closure (ordered pull→branch→stage→commit→push→verify sequence + Commit-Push hard rule + branch-at-Apply ban). Runs ONLY after \`local_test_confirmed=true\`. (external-audit C1 2026-07-13.)
`,
};

const lines = src.split('\n');
const out = [];
let skipUntilNextH2 = false;
let replaced = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^## /.test(line)) {
    skipUntilNextH2 = false;
    const rep = Object.keys(REPLACEMENTS).find(h => line.startsWith(h));
    if (rep) {
      out.push(line);
      out.push(REPLACEMENTS[rep].trimEnd());
      skipUntilNextH2 = true;
      replaced++;
      continue;
    }
  }
  if (skipUntilNextH2) {
    if (line === '---' && i + 1 < lines.length && /^\s*$/.test(lines[i + 1] || '') && lines.slice(i + 1, i + 4).some(l => /^## /.test(l))) {
      out.push(''); out.push(line); skipUntilNextH2 = false; continue;
    }
    continue; // body line of a replaced section — dropped (content lives at the pointer target)
  }
  out.push(line);
}

if (replaced !== Object.keys(REPLACEMENTS).length) {
  console.error(`shrink: expected ${Object.keys(REPLACEMENTS).length} sections, matched ${replaced} — ABORTING (no write)`);
  process.exit(2);
}
fs.writeFileSync(FILE, out.join('\n'));
const after = out.length;
console.log(`shrink-claude-md: ${before} → ${after} lines (${replaced} sections → pointers). Untouched: Etanah non-negotiables, Phase 2 Closure, boot order, Disposition, File Ownership, Meta-Layer, Cost-Efficiency.`);
