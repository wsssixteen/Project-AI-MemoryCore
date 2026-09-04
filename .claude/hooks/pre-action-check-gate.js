/**
 * pre-action-check-gate.js — PreToolUse hook (Edit | Write)
 *
 * Catches the "pre-action-check-skip" slip category (9 occurrences in
 * 14-day baseline — Notes.txt missed 4×, PDF annotation skipped, server
 * log not loaded, env-check skipped, etc.).
 *
 * v1 scope: detect when Edit/Write touches a quest-related path
 * (1. Tasks/Melaka/, projects/coding-projects/active/QA-*, quest/active.txt)
 * and remind Ruri to verify Notes.txt is current before proceeding.
 * Doesn't BLOCK (would trip on legitimate cases); injects visible-gate
 * reminder.
 *

 * Created 2026-05-23 — Phase 2 of system-layer build.
 * Iteration: tighten matching as evidence accumulates.
 *
 * v1.1 2026-05-28 — Added single-canonical-doc enforcement (plan Phase 1).
 * Blocks edits to sibling files under projects/coding-projects/active/QA-NNN/
 * that aren't QA-NNN.md itself (the canonical doc). Sibling files like
 * early-diagnostic.md / scout-report.md / handoff-XXX.md / class-chain-traces.md
 * / Fix.txt are deprecated for new quests. Pre-2026-05-28 quests retain
 * their multi-file pattern (no migration); the gate only fires on new
 * quest folders.
 *
 * v1.2 2026-07-03 — Added SCOPE-ANCHOR ECHO advisory. When the edited path
 * is quest-related AND the in-focus active block in quest/active.txt carries
 * a scope_anchor= field, and this turn's transcript does NOT contain that
 * scope_anchor value verbatim, append an advisory line reminding to re-anchor
 * before editing. Catches scope drift (a wrong-baseline variant) — the
 * scope-anchor-echo skill exists but is unenforced. Advisory only, never
 * blocks. Bypass: not needed (advisory, no deny).
 *
 * v1.3 2026-09-02 — DELIVERABLE-IN-QUEST-FOLDER DENY (per miya, QA-277697). The v1.1
 * sibling-file advisory is now a hard deny for ANY non-QA-<NNN>.md file under
 * projects/coding-projects/active/QA-<NNN>/ (any extension, any depth). Redmine-bound
 * deliverables live in the Task folder 2. Fix/ or 3. Rework/ only. Spec-preservation:
 * v1.1 advisory text retained for the (now unreachable without bypass) sibling case;
 * bypass token unchanged: [skip-canonical-doc: <reason>]. Smoke-tested 20 fixtures.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = require('path').resolve(__dirname, '..', '..'); // machine-independent (GHOST-HOOKS-2 fix 2026-07-19)
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');

function safeRead(p) {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return null; }
}

// Returns the scope_anchor= value from the FIRST block with status=active,
// or null if no active block / no scope_anchor field. Blocks are separated
// by blank-line-delimited groups; a block "starts" at a qa= line.
function getActiveScopeAnchor() {
  const text = safeRead(ACTIVE_TXT);
  if (!text) return null;
  const blocks = text.split(/\n\s*\n/); // blank-line separated
  for (const block of blocks) {
    if (/^\s*status=active\b/m.test(block)) {
      const m = block.match(/^\s*scope_anchor=(.+)$/m);
      if (m) return m[1].trim();
    }
  }
  return null;
}

// Best-effort read of the session transcript (JSONL) so far, via the
// transcript_path field PreToolUse payloads carry. Returns raw text
// (not parsed) — good enough for a substring/verbatim-echo check.
function readTranscript(transcriptPath) {
  if (!transcriptPath) return '';
  try { return fs.readFileSync(transcriptPath, 'utf-8'); } catch { return ''; }
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || toolInput.path || '';

    // Notes-file tool-only DENY (tool-choice-skip escalation 2026-06-04, QA-264006 — 5th cluster strike).
    // The Task-folder Notes file `1. <NNN NNN>.txt` (or legacy `1. Notes.txt`) is generated ONLY by
    // `node quest/notes.js`. Direct Write/Edit hand-writing drifts the locked 3-line format
    // (banned per quest-protocol.md:421). notes.js writes via Node fs through Bash, bypassing this
    // Edit|Write tool gate — so this deny ONLY catches direct hand-writes, never notes.js itself.
    if (/1\.\s?Tasks[\\/]Melaka[\\/].*[\\/]1\.\s[^\\/]*\.txt$/i.test(filePath)) {
      const reason = [
        '🚫 Notes file is tool-generated — do NOT Write/Edit it directly.',
        `   File: ${filePath}`,
        '   Locked 3-line format; hand-writing drifts it (banned per quest-protocol.md:421 — no env/prose/annotations).',
        '   Use instead:',
        '     node quest/notes.js --folder "<Task folder>" --env <UAT|FAT> --urusan <X> --id <permohonan> --user <login> [--reset]',
        '   (--reset writes entry 1; omit it to append the next numbered entry.)',
      ].join('\n');
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: reason,
        },
      }));
      process.exit(0);
    }

    // v1.3 2026-09-02 — DELIVERABLE-IN-QUEST-FOLDER DENY (per miya, QA-277697).
    // Anything miya must open / upload to Redmine (audit report, script, doc, patch, evidence)
    // lives ONLY in the Task folder `2. Fix/` or `3. Rework/`. The quest project folder
    // holds exactly ONE file: QA-<NNN>.md. A second file there is a deliverable in the
    // wrong home — miya had to go hunting for 277697-docx-audit.md. This upgrades the
    // v1.1 advisory to a hard deny for ANY non-canonical file under the quest folder.
    // Bypass: `[skip-canonical-doc: <reason>]` in the current message (legacy quests only).
    {
      const inQuestFolder = /projects[\\/]coding-projects[\\/]active[\\/]QA-\d+[\\/]/i.test(filePath);
      const isCanonical = /[\\/]QA-\d+\.md$/i.test(filePath);
      if (inQuestFolder && !isCanonical) {
        const transcript = readTranscript(data.transcript_path);
        const tail = transcript ? transcript.slice(-20000) : '';
        if (!/\[skip-canonical-doc:/i.test(tail)) {
          const reason = [
            '🚫 deliverable-in-quest-folder: the quest folder holds ONE file — QA-<NNN>.md.',
            `   File: ${filePath}`,
            '   Anything miya opens or uploads to Redmine (report / script / doc / evidence) goes to the',
            '   Task folder ONLY:  1. Tasks\\Melaka\\<n>. <ticket>\\2. Fix\\   or   \\3. Rework\\',
            '   Need a copy for yourself? Make it in the Task folder too — never here.',
            '   Findings / reasoning / pointers → QA-<NNN>.md. Bypass (legacy quests): [skip-canonical-doc: <reason>]',
          ].join('\n');
          process.stdout.write(JSON.stringify({
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: reason,
            },
          }));
          process.exit(0);
        }
      }
    }

    // Quest-related path patterns
    const questPatterns = [
      /1\.\s?Tasks[\\/]Melaka/i,
      /projects[\\/]coding-projects[\\/]active[\\/]QA-/i,
      /quest[\\/]active\.txt/i,
      /etanah-pelupusan[\\/]src/i,
      /etanah-awam[\\/]src/i,
    ];

    const isQuestPath = questPatterns.some(re => re.test(filePath));

    // v1.1 single-canonical-doc enforcement (per plan Phase 1, 2026-05-28):
    // Edits to projects/coding-projects/active/QA-NNN/<anything-but-QA-NNN.md>
    // get a strong reminder that QA-NNN.md is the canonical doc for new quests.
    // Deprecated sibling files: early-diagnostic.md, scout-report.md,
    // handoff-XXX.md, class-chain-traces.md, Fix.txt.
    // Bypass via [skip-canonical-doc: <reason>] for legitimate edge cases
    // (e.g. pre-2026-05-28 in-flight quests retain multi-file pattern).
    const inActiveQuestFolder = /projects[\\/]coding-projects[\\/]active[\\/]QA-[\d]+[\\/]/i.test(filePath);
    const isCanonicalQADoc = /[\\/]QA-[\d]+\.md$/i.test(filePath);
    const isDeprecatedSibling = inActiveQuestFolder && !isCanonicalQADoc && /\.(md|txt)$/i.test(filePath);

    let canonicalDocReminder = '';
    if (isDeprecatedSibling) {
      canonicalDocReminder = [
        '',
        '🚫 single-canonical-doc rule (plan Phase 1, 2026-05-28):',
        '   Edits should go into `QA-<NNN>.md` (single canonical doc per quest),',
        '   NOT into sibling files. Deprecated for new quests: early-diagnostic.md,',
        '   scout-report.md, handoff-XXX.md, class-chain-traces.md, Fix.txt.',
        '',
        '   If this is a pre-2026-05-28 in-flight quest using the legacy multi-file',
        '   pattern, include `[skip-canonical-doc: pre-existing legacy quest]`',
        '   in your message to bypass.',
        '',
        '   For new quests: write to QA-<NNN>.md\'s appropriate phase section instead.',
        '',
      ].join('\n');
    }

    if (!isQuestPath && !isDeprecatedSibling) process.exit(0);

    // v1.2 SCOPE-ANCHOR ECHO advisory: if the in-focus active block has a
    // scope_anchor= field and this session's transcript hasn't echoed that
    // value verbatim, add a one-line reminder. Fail-open on any read error.
    let scopeAnchorLine = '';
    try {
      const anchor = getActiveScopeAnchor();
      if (anchor) {
        const transcript = readTranscript(data.transcript_path);
        if (!transcript || !transcript.includes(anchor)) {
          scopeAnchorLine = `  ⚠ scope_anchor '${anchor}' not echoed this session — re-anchor before editing.`;
        }
      }
    } catch (e) { /* fail-open */ }

    // Inject reminder
    const context = [
      '',
      '⚙️  pre-action-check-gate: edit on quest-related path detected',
      `   Path: ${filePath}`,
      '',
      'Pre-action checks (run these IF not already done this turn):',
      '  1. Notes file current for active quest? (read <Task folder>/1. <NNN NNN>.txt or legacy 1. Notes.txt)',
      '  2. env-check verified env target? (mlkuat / mlkfat / mkit per ticket)',
      '  3. PDF annotations extracted if BA PDF in 0. Brief/?',
      '  4. Server log path known if debugging? (E:/Dev/jboss-7.4-plp-melaka/standalone/log/server.log)',
      '',
      'If any "NO" — fire the relevant check BEFORE proceeding with this edit.',
      canonicalDocReminder,
      scopeAnchorLine,
    ].join('\n');

    // Use hookSpecificOutput.additionalContext for PreToolUse advisory
    const response = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: context,
      },
    };
    process.stdout.write(JSON.stringify(response));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
