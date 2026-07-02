/**
 * predicate-box-gate.js — Stop hook
 *
 * WHY: the predicate-box skill (pre-edit Assumption/Evidence/Falsifier diagram,
 * see CLAUDE.md §10 "Predicate Diagram") has ZERO deterministic enforcement today —
 * it only fires if the model remembers to invoke it. wrong-baseline-diagnosis is
 * the #1 slip category in the slip-log; the Predicate Diagram is the specific
 * pre-edit check built to catch exactly that (state the assumption + the proof
 * BEFORE editing, not after). A prose-only rule with no backstop decays silently,
 * same failure class as RCRL before rcrl-emit-check.js existed.
 *
 * WHAT: fires at every Stop. If this session's transcript shows an Edit/Write to
 * an etanah-* .java or .xhtml source file AND quest/active.txt has a status=active
 * block AND the transcript contains NO ASSUMPTION+FALSIFIER pair (the Predicate
 * Diagram's two load-bearing nodes) — emit a <=3-line advisory reminder to run the
 * Predicate Diagram before the NEXT code edit. Never blocks; Stop hooks in this
 * harness cannot deny — this is a reminder for the next turn, not a gate on the
 * turn that already happened.
 *
 * CAN: catch the case where a quest is active, an etanah edit happened this
 *   session, and neither "ASSUMPTION" nor "FALSIFIER" ever appeared in the
 *   transcript — i.e. the Predicate Diagram was never emitted at all.
 * CANNOT: verify the diagram's CONTENT is correct, that the Evidence cited is
 *   real, or that it was emitted BEFORE (vs after) the specific edit it should
 *   have gated. Presence-only, same limitation class as rcrl-emit-check.js /
 *   quest-phase-gate.js. A shape-valid diagram elsewhere in the transcript
 *   silently passes this check even if it wasn't for this edit.
 *
 * Fail-OPEN: any error (no transcript, parse fail, no active.txt) → silent return.
 *
 * Bypass: include [skip-predicate-box: <reason>] anywhere in the session.
 *
 * Detection:
 *   Etanah edit marker (any of):
 *     - "etanah-" + ".java" or ".xhtml" appearing near an Edit/Write tool marker
 *       in the transcript text (heuristic grep, not AST-precise — same tier as
 *       rcrl-emit-check.js's Recon-shape heuristic)
 *   Predicate Diagram marker (BOTH must appear — the two load-bearing nodes):
 *     - "ASSUMPTION" (case-insensitive)
 *     - "FALSIFIER" (case-insensitive)
 *   Bypass token: [skip-predicate-box: <reason>]
 *
 * v1: ADVISORY ONLY — stdout reminder, never blocks. Mirrors rcrl-emit-check.js
 *   stdin/output idiom exactly (same harness, same Stop-hook family).
 *
 * Pairs with: predicate-box skill · quest-phase-gate.js (PreToolUse hard-block,
 *   different mechanism/enforcement point) · rcrl-emit-check.js (sibling Stop hook).
 *
 * Limitation: reads ONLY this turn's transcript text — won't catch a Predicate
 *   Diagram emitted in an earlier turn of the same session (v1.1 candidate: scan
 *   full transcript file via transcript_path if the harness provides one on Stop).
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');

function safeRead(p) {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return null; }
}

function hasActiveQuest() {
  const text = safeRead(ACTIVE_TXT);
  if (!text) return false;
  return /\n\s*status=active\b/.test(text) || /^status=active\b/m.test(text);
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function looksLikeEtanahCodeEdit(text) {
  if (!text) return false;
  // Heuristic: an etanah-* .java/.xhtml path mentioned alongside an edit-shaped cue
  // (tool name, "Edit", "Write", or a diff-ish marker) anywhere in the transcript text.
  const etanahPath = /etanah-(pelupusan|awam|common|teknikal)[\\/][^\s"'`]*\.(java|xhtml)\b/i;
  if (!etanahPath.test(text)) return false;
  const editCue = /\b(Edit|Write|old_string|new_string|file_path)\b/i;
  return editCue.test(text);
}

function hasPredicateDiagram(text) {
  if (!text) return false;
  return /\bASSUMPTION\b/i.test(text) && /\bFALSIFIER\b/i.test(text);
}

function hasBypass(text) {
  return /\[skip-predicate-box:\s*[^\]]+\]/i.test(text);
}

function main() {
  if (!hasActiveQuest()) return;

  // Stop payload is JSON {transcript_path} — read the FILE; raw stdin kept as fixture fallback (fix 2026-07-03, controller smoke)
  const raw = readStdin();
  let transcript = raw;
  try {
    const data = JSON.parse(raw);
    if (data && data.transcript_path) transcript = safeRead(data.transcript_path) || '';
  } catch { /* raw-text fixture */ }
  if (!looksLikeEtanahCodeEdit(transcript)) return;
  if (hasBypass(transcript)) return;
  if (hasPredicateDiagram(transcript)) return;

  console.log('⚠️  predicate-box-gate: etanah-* .java/.xhtml edit detected this session but NO Predicate Diagram');
  console.log('   (ASSUMPTION + FALSIFIER pair) found. Before the NEXT code edit, emit the 3-node Predicate Diagram');
  console.log('   (CLAUDE.md §10) — ASSUMPTION → EVIDENCE → APPLY/FALSIFIER. Bypass: [skip-predicate-box: <reason>]');
}

try { main(); } catch (e) {
  process.stderr.write(`predicate-box-gate error: ${e.message}\n`);
}
