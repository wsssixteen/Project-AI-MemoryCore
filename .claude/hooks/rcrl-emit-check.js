/**
 * rcrl-emit-check.js — Stop hook
 *
 * Backstop for the Recon Context Re-load (RCRL) primitive added to CLAUDE.md
 * §10 FORCED PHASE-EMIT GATES on 2026-06-01.
 *
 * Fires at every Stop. If the turn appears to be doing Quest Recon work
 * (Recon-shape emit detected) AND there's an active quest in active.txt,
 * checks whether the RCRL block was emitted. If not — advisory reminder.
 *
 * Recon-shape detection (any of):
 *   - "Recon" header in the response text
 *   - "Universal Checks" emit shape
 *   - "Recon emit" / "Recon Summary" in response
 *
 * RCRL block detection (any of):
 *   - "═══ Recon Context Re-load ═══" literal block header
 *   - "RCRL" acronym used
 *   - "Recon Context Re-load" phrase
 *   - Bypass token: [skip-rcrl: <reason>]
 *
 * v1: ADVISORY ONLY — emits warning to stdout, never blocks turn-end.
 *     Stage 2 (decision:block) deferred until observation confirms predicate quality.
 *
 * Why this exists:
 *   2026-06-01 — みや: "let's implement RCRL". The CLAUDE.md prose rule
 *   added Step 0 to Recon emit but prose-only rules slip (per the 2026-05-25
 *   ghost-hook + 2026-06-01 QA-246923 Description-vs-History clash). Stop-hook
 *   backstop catches the case where Recon ran but RCRL was silently skipped.
 *
 * Pairs with: silent-claim-drift-gate.js (same Stop-hook backstop family),
 *   scout-completeness-gate.js (UserPromptSubmit prompt-side reminder),
 *   quest-active-grounding.js (UserPromptSubmit grounding sibling).
 *
 * Limitation: hook reads ONLY this turn's transcript text — won't catch
 *   cross-turn RCRL claims (Recon emit in turn N, RCRL claimed-but-not-emitted
 *   in turn N+1). v1.1 candidate: scan last 3 turns.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = require('path').resolve(__dirname, '..', '..'); // machine-independent (GHOST-HOOKS-2 fix 2026-07-19)
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');

function safeRead(p) {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return null; }
}

function hasActiveQuest() {
  const text = safeRead(ACTIVE_TXT);
  if (!text) return false;
  // Match any block-level `status=active` line
  return /\n\s*status=active\b/.test(text) || /^status=active\b/m.test(text);
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function looksLikeReconEmit(text) {
  if (!text) return false;
  // Heuristic: Recon-shape emit signals
  const reconHeaders = /\bRecon (Summary|emit|Universal Checks?|Step \d|Context Re-load)\b/i;
  const universalChecks = /\bUniversal Checks?\b.*✓/i;
  return reconHeaders.test(text) || universalChecks.test(text);
}

function hasRCRLBlock(text) {
  if (!text) return false;
  // Detect RCRL block in any reasonable form
  return /═══ ?Recon Context Re-load ?═══/i.test(text)
      || /\bRCRL\b/.test(text)
      || /\bRecon Context Re-load\b/i.test(text)
      || /\[skip-rcrl:\s*[^\]]+\]/i.test(text);
}

function main() {
  // Only fire when there's an active quest — otherwise this is non-quest work
  if (!hasActiveQuest()) return;

  const transcript = readStdin();
  const reconLooking = looksLikeReconEmit(transcript);
  if (!reconLooking) return;

  if (hasRCRLBlock(transcript)) {
    // RCRL block present — silent pass
    return;
  }

  // Recon-shape emit detected but no RCRL block found
  console.log('⚠️  rcrl-emit-check: Recon-shape emit detected in this turn but NO `Recon Context Re-load` (RCRL) block found.');
  console.log('   Per CLAUDE.md §10 FORCED PHASE-EMIT GATES Step 0 (added 2026-06-01): RCRL is MANDATORY before Recon-claim verify.');
  console.log('   Required shape: verbatim quotes from (1) Ticket Description, (2) Latest-cycle BA Journal, (3) prior cycle Notes,');
  console.log('   (4) BA attachments key annotations, (5) prior QA-NNNN.md claims — then extract BA-claim / asks / ruled-out / BA-Q candidates.');
  console.log('   Bypass for legitimate edge cases: include `[skip-rcrl: <one-line reason>]` in your message.');
}

try { main(); } catch (e) {
  process.stderr.write(`rcrl-emit-check error: ${e.message}\n`);
}
