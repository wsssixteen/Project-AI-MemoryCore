/**
 * ticket-gate.js — UserPromptSubmit hook
 *
 * Fires deterministically when みや's message contains a quest signal
 * (ticket-number mention or Redmine-retrieval phrase). Injects a Phase-0
 * gate reminder with the full process checklist as ✓/⬜ rows.
 *
 * Refined 2026-05-19 (QA-262039 retrospective):
 *  - Trigger broadened: QA/FAT/UAT ticket numbers + Read-Redmine family.
 *  - State lookup is now per-QA (not last-block-wins).
 *  - Reminder upgraded with: independent enumeration, utility sweep,
 *    working-analog compare, cross-reference chase.
 * Refined 2026-06-20 (per みや — compulsory git-check research): added Row 0
 *  GIT-STATE CHECK (baseline-verify + behind-origin count + existing-fix probe)
 *  as the FIRST Phase-0 row. Evidence: QA-260139 stale-base, QA-261986 ~293-behind
 *  base, QA-266215 existing-fix-missed. Prose git-discipline decayed (prompt-driven);
 *  injecting it deterministically here makes the Phase-0 git-check compulsory.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const activePath = process.env.TICKET_GATE_ACTIVE_TXT || path.join(projectRoot, 'quest', 'active.txt'); // env override = eval-fixture path (same convention as CODEGRAPH_GATE_ACTIVE_TXT)

// Per-QA block lookup — active.txt has many qa=QA-NNNN blocks; find the one for `qaNum`.
function readQAState(qaNum) {
  const state = { qa: qaNum, phase: '', status: 'idle', local_test_confirmed: 'false' };
  if (!fs.existsSync(activePath)) return state;
  const text = fs.readFileSync(activePath, 'utf8');
  // Find the block starting with qa=QA-<num> (with or without zero-pad) and ending at next qa= or EOF.
  const re = new RegExp(`^qa=(?:QA-)?${qaNum}\\b[\\s\\S]*?(?=^qa=|\\Z)`, 'm');
  const m = text.match(re);
  if (!m) return state;
  m[0].split('\n').forEach(l => {
    const idx = l.indexOf('=');
    if (idx > -1) state[l.substring(0, idx).trim()] = l.substring(idx + 1).trim();
  });
  return state;
}

// ── AWAM No-Resit detection (added 2026-07-22, #271721) ──────────────────────
// The 5 PLP urusan whose AWAM flow starts at CarianRasmiHakmilikForm and therefore
// REQUIRE a No Resit Carian Rasmi as test data. Source of truth:
// etanah-awam\...\consent\web\form\CarianRasmiHakmilikForm.java URUSAN_CARIAN_RASMI :107-119.
// Why this row exists: #271721 (PRBB) ran Phase 0 → Apply → a full Test Scenario with no
// receipt. The rule was CLAUDE.md prose only; this makes it fire at ticket-read, the same
// way the permohonan-ID requirement already fires for Pelupusan tickets.
const NO_RESIT_URUSAN = ['PLTP', 'PSBS', 'MCL', 'PPTPB', 'PRBB'];

// urusan comes from active.txt (redmine-sync writes `urusan=`); the one-liner is the fallback
// for a ticket synced before that field existed.
function noResitRow(state) {
  const hay = `${state.urusan || ''} ${state.issue_one_liner || ''}`.toUpperCase();
  const hit = NO_RESIT_URUSAN.filter(u => new RegExp(`\\b${u}\\b`).test(hay));
  if (!hit.length) return null;
  const u = hit[0];
  return `7. ⬜ **🚨 AWAM No-Resit urusan detected (${hit.join('/')}) — DERIVE THE No Resit Carian Rasmi NOW** — ${u} starts at \`CarianRasmiHakmilikForm.xhtml\`; みや cannot open the permohonan without a receipt and BA never supplies one. It is ONE query away — do NOT hand back asking for it. Method + the 7 validations: \`etanah-knowledge/melaka/TEST-PERMOHONAN-INDEX.md\` § *No Resit Carian Rasmi* (V3 <6 months · V4 jenis-hakmilik allow-list for PSBS/PLTP · V6 no cukai arrears · V7 not Batal). Write it into the Task notes file: \`node quest/notes.js --folder "<Task folder>" --qa ${state.qa || '<n>'} --env <env> --urusan ${u} --id "No Resit: <no_resit>" --user "<login>"\`. **Also confirm the module** — an AWAM ticket's fix usually lives in \`etanah-awam\`, NOT \`etanah-pelupusan\`. Enforced at hand-back by \`domain/awam-no-resit-gate\`.`;
}

let inputData = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => inputData += d);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);
    const prompt = input.prompt || '';

    // Signal A — ticket-number mention (QA/FAT/UAT family)
    const qaMatch = prompt.match(/\b(?:QA|FAT-OR|UAT-CR|FAT|UAT)\s*#?\s*(\d{4,})\b/i);
    // Signal B — Redmine-retrieval phrase (no specific ticket yet)
    const redmineRetrieval = /\b(Read\s+Redmine|retrieve\s+(tickets|new\s+quests|quests|tickets\s+from\s+(the\s+)?Redmine|quests\s+from\s+(the\s+)?Redmine)|check\s+(new\s+)?(tickets|redmine|quests)|pull\s+(redmine|new\s+quests|quests\s+from\s+(the\s+)?Redmine)|redmine\s+sync|sync\s+Redmine|fetch\s+(tickets|new\s+quests|quests)|any\s+new\s+(tickets|quests|ones)|look\s+(up|for)\s+new\s+(tickets|quests)|import\s+(tickets|quests)|load\s+Redmine)\b/i.test(prompt);

    // Signal A2 — BARE ticket number cross-matching an active.txt qa= block. The CLAUDE.md
    // trigger table always documented this ("262233", "let's start with 262233") but the hook
    // never implemented it — closed 2026-07-13 (external-audit sprint; the shrunken CLAUDE.md
    // pointer RELIES on ticket-gate injecting on ANY ticket mention).
    let bareMatch = null;
    if (!qaMatch && fs.existsSync(activePath)) {
      const candidates = prompt.match(/\b\d{5,7}\b/g) || [];
      if (candidates.length) {
        const activeText = fs.readFileSync(activePath, 'utf8');
        for (const n of candidates) {
          if (new RegExp('^qa=(?:QA-)?' + n + '\\b', 'm').test(activeText)) { bareMatch = n; break; }
        }
      }
    }

    if (!qaMatch && !bareMatch && !redmineRetrieval) process.exit(0);

    let context;

    if (qaMatch || bareMatch) {
      const qaNum = qaMatch ? qaMatch[1] : bareMatch;
      const state = readQAState(qaNum);
      // Past Phase 0 already → let through silently
      const pastPhase0 = state.phase && state.phase !== '0' && state.status !== 'idle' && state.status !== 'hold';
      if (pastPhase0) process.exit(0);

      // Side-effect: set quest_start_ts on first gate-firing for this QA (per みや 2026-05-19 —
      // "start" = when みや signals start, not retrieval. Gate firing IS the start signal.)
      if (!state.quest_start_ts) {
        try {
          const text = fs.readFileSync(activePath, 'utf8');
          const blockRe = new RegExp('(^qa=(?:QA-)?' + qaNum + '\\b[\\s\\S]*?)(?=^qa=|\\Z)', 'm');
          const m = text.match(blockRe);
          if (m) {
            const oldBlock = m[1];
            const ts = new Date().toISOString();
            // Insert quest_start_ts= line right after the qa= header line
            const newBlock = oldBlock.replace(/^(qa=QA-\d+\s*\n)/m, '$1quest_start_ts=' + ts + '\n');
            fs.writeFileSync(activePath, text.replace(oldBlock, newBlock));
          }
        } catch (e) { /* never block */ }
      }

      context = [
        `⚔️ QUEST GATE — QA #${qaNum} detected (state: phase=${state.phase || 'none'}, status=${state.status}).`,
        ``,
        `MANDATORY — emit the Phase-0 gate checklist FIRST as ✓/⬜ rows (a skipped item must be VISIBLE):`,
        ``,
        `0. ⬜ **🚨 GIT-STATE CHECK (Phase-0, COMPULSORY — run even if it returns nothing)** — \`git status\` + \`git branch --show-current\`; if NOT on the repo baseline (\`mlk/master\` pelupusan · \`mlk/master\` AWAM — corrected v1.55; stag-env/mlit are downstream) → stash → checkout baseline → \`git pull --ff-only origin <baseline>\` → pop (STOP if the pull fails — unknown commits). Then \`git rev-list --count HEAD..origin/<baseline>\` (behind-count). **Existing-fix probe**: \`git branch -a --list "*${qaNum}*"\` + \`git log --all --grep="#${qaNum}" --format="%h %ci %an %s"\`. **Emit a GIT-STATE summary** (branch · behind-count · existing-fix? · ticket-keyword log hits for context). **STOP + surface** if a fix exists under another author, the baseline pull fails, or behind-count is large (stale base).`,
        ``,
        `1. ⬜ Task folder loaded — \`handoff_file\` from active.txt OR ask みや for path. Read every file in \`0. Brief/\` (Description, History, every PDF/docx/photo).`,
        `2. ⬜ **Issue Checklist created at quest creation** in \`projects/coding-projects/active/QA-${qaNum}/QA-${qaNum}.md\` — from PRIMARY SOURCES (BA Description + History + attachments). NOT copied from Scout. Scout's diagnostic is DIFFED against this. List GROWS through Recon/Apply/Test; out-of-scope findings get explicit OOS rows. **Enumerate ALL** (every BA-numbered item, every gate-writer, every OR-bypass, every data-axis branch) — see \`checklist\` skill "Enumeration completeness".`,
        `3. ⬜ **Existing-utility sweep** — grep for existing helpers/constants/sets/templates BEFORE proposing custom ones. Applies even when みや says "create our own X" — flag the existing util first.`,
        `4. ⬜ **Working-analog compare** — sibling templates / sibling urusan classes / sibling beans. Identify the canonical pattern BEFORE recommending tags/methods.`,
        `5. ⬜ **Cross-reference chase** — if Description/History references other tickets (Requirement #NNNNN, relates #, refs, "rujuk ... tic ini"), spawn the background cross-ref agent per \`quest/cross-ref-agent.md\` (non-blocking; ONE agent for the batch, sequential, browser MCP).`,
        `6. ⬜ **Recon block** emitted — Universal Checks 1-8 with file:line evidence per row.`,
        ...(noResitRow(state) ? [noResitRow(state)] : []),
        ``,
        `Do NOT propose fixes / commit / open codebase files for editing until rows 0-6${noResitRow(state) ? '+7' : ''} are ✓ or have explicit deferrals (OOS / BA-Q / not-applicable + reason). Row 0 (git-state) is the FIRST thing — before reading the Task folder.`
      ].join('\n');
    } else {
      // Redmine retrieval — no specific ticket yet
      context = [
        `⚔️ QUEST GATE — Redmine retrieval signal detected.`,
        ``,
        `MANDATORY at retrieval:`,
        `1. Run \`node quest/redmine-sync.js\` (+ \`--create\` for new tickets). On failure: notify with the error one-liner; do NOT abort.`,
        `2. For EACH new ticket — spawn Scout familiar for \`projects/coding-projects/active/QA-NNNN/early-diagnostic.md\` if missing.`,
        `3. **At quest creation (BEFORE Scout's diagnostic is considered)** — create the Issue Checklist in each \`QA-NNNN.md\` from PRIMARY SOURCES (BA Description + History + every attached PDF/docx/photo). Scout will be DIFFED against this.`,
        `4. **Cross-reference chase** — for tickets whose Description/History references others (Requirement #NNNNN, relates #, refs, "rujuk ... tic ini"), spawn ONE background agent (\`run_in_background: true\`) using \`quest/cross-ref-agent.md\`. Non-blocking; sweeps the batch via browser MCP.`,
        `5. Emit the consolidated results table for みや (one row per ticket).`
      ].join('\n');
    }

    console.log(JSON.stringify({ additionalContext: context }));
    process.exit(0);

  } catch (e) {
    process.exit(0); // never block on error
  }
});
