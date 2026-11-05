/**
 * quest-phase-gate.gate.hook.js — PreToolUse hook (Edit | Write)
 *
 * RELOCATED 2026-07-07 from .claude/hooks/quest-phase-gate.js into the
 * domain/quest-phase-gate/ Feature folder. Behavior unchanged; the ONLY code
 * changes are (a) a log.jsonl fire log beside this file (blocked / allowed /
 * bypassed) and (b) this header note. active.txt resolution is untouched:
 * two levels up from this file = repo root, same depth as the old location.
 *
 * HARD-BLOCK: forbids editing etanah code/template/config DURING AN ACTIVE QUEST
 * until this session has emitted the Scout, Recon, AND Rubric phase banners.
 *
 * Built 2026-06-08 (QA-262762 design session) — the structural defender for the
 * recurring "skip the phases / fix on assumption" slip (root_category
 * wrong-baseline-diagnosis, 🚨-escalated). Commissions the parked todo.md Q1 item.
 * Per the escalation policy: a 🚨 root_category needs a structural defender, not
 * another wording refinement — this hook IS that defender.
 *
 * ── WHAT THIS CAN AND CANNOT DO (read before trusting a PASS) ────────────────
 *   CAN  (shape / presence — ~100%): verify a Scout + Recon + Rubric emit EXIST
 *        this session before an etanah code edit.  → kills SKIPPING.
 *   CANNOT (correctness — stays human judgment): verify the file:line cites are
 *        right, that the data-flow was TRACED not ASSUMED, that the chosen fix is
 *        correct. A shape-valid but premise-wrong emit PASSES this gate.
 *        Correctness = Ruri's honest tracing + みや's glance at the Logic-Blast-
 *        Radius matrix. NEVER read a PASS here as "done right".
 *
 * Fail-OPEN: any error (no transcript, parse fail, no active.txt) → ALLOW.
 * A gate must never block an edit because of its own bug.
 *
 * Bypass: include [skip-phase-gate: <reason>] anywhere in the session (visible in
 * transcript) — for legitimate non-quest edits or audit/compliance work.
 *
 * Fires ONLY when BOTH hold:
 *   (a) Edit/Write target is an etanah-* source/template/config path, AND
 *   (b) quest/active.txt has a status=active block.
 * Otherwise → ALLOW (exit 0, silent).
 *
 * Marker contract: the quest phase emits carry canonical banners
 *   ═══ SCOUT ═══ · ═══ RECON ═══ · ═══ RUBRIC ═══
 * (see quest/quest-protocol.md FORCED PHASE-EMIT GATES). Legacy strong markers
 * (Recon Context Re-load / Logic Blast Radius) are also accepted during transition.
 *
 * Version: v4 (2026-11-05) — v3 requirement read + a REQUIREMENT-RULES row (or R0 none) per read.
 */
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail }) + '\n'); } catch (_) {}
}

const MATCH_RE = /REQUIREMENT-MATCH:\s*#?(\d{5,7})\s*(?:→|->|\\u2192)\s*(#?\d{5,7}|none)\b([\s\S]{0,400}?)(?:—|-{1,2}|\\u2014)\s*(aligned|extends|contradicts|none found|not needed)\b(?!\s*\|)([\s\S]{0,40})/g;
function requirementRead(transcript) {
  let m;
  MATCH_RE.lastIndex = 0;
  while ((m = MATCH_RE.exec(transcript))) {
    const req = m[2].replace('#', '');
    if (/^(none found|not needed)$/.test(m[4])) return true;
    const quoted = /^\s*(?:—|-{1,2}|\\u2014)\s*read:\s*\\?["“]/.test(m[5]);
    if (quoted && new RegExp('REQUIREMENT-READ #' + req + '\\b').test(transcript)) return true;
  }
  return false;
}

// v4 (2026-11-05, per miya, handoff 2026-11-05 item 7): every REQUIREMENT-READ #<req> this session
// needs a ledger row in a REQUIREMENT-RULES: block — `R<n> · #<req> · "<quote>"` — or one `R0 none`
// line (covers every read). Same raw transcript as v3, no other reader. Self-disarm guards: the row
// needs digits for n and req and a quote that does not open with "<" (template text never passes);
// R0 none counts only right after the marker or at a line start (the deny text writes it after a backtick).
const RULES_MARK = 'REQUIREMENT-RULES:';
const READ_RE = /REQUIREMENT-READ #(\d{5,7})\b/g;
const SEP = '[ \\t]*(?:·|\\\\u00b7)[ \\t]*';
const ROW_RE = new RegExp('(?:(?<![A-Za-z0-9])|(?<=\\\\n))R[1-9]\\d{0,2}' + SEP + '#(\\d{5,7})' + SEP + '(?:\\\\?["“]|\\\\u201c)(?![ \\t]*<)(?=[ \\t]*[^\\s"\\\\])', 'g');
const R0_RE = /(?:^|\r?\n|\\n|REQUIREMENT-RULES:)[ \t]*(?:[-*•|>][ \t]*)*R0(?:[ \t]*(?:·|\\u00b7))?[ \t]*none\b/;
const BLOCK_END_RE = /\r?\n[ \t]*\r?\n|\\n[ \t]*\\n|(?<!\\)"\s*[,}\]]/; // blank line, or the end of a JSONL string
function rulesMissing(transcript) {
  const reads = new Set();
  let m;
  READ_RE.lastIndex = 0;
  while ((m = READ_RE.exec(transcript))) reads.add(m[1]);
  if (reads.size === 0) return []; // no read this session: v3 alone decides
  const covered = new Set();
  let i = transcript.indexOf(RULES_MARK);
  while (i !== -1) {
    const body = transcript.slice(i + RULES_MARK.length, i + RULES_MARK.length + 4000);
    const lead = body.match(/^(?:\s|\\[nrt])*/)[0].length;
    const end = BLOCK_END_RE.exec(body.slice(lead));
    const block = RULES_MARK + body.slice(0, end ? lead + end.index : body.length);
    if (R0_RE.test(block)) return [];
    ROW_RE.lastIndex = 0;
    while ((m = ROW_RE.exec(block))) covered.add(m[1]);
    i = transcript.indexOf(RULES_MARK, i + RULES_MARK.length);
  }
  return [...reads].filter(r => !covered.has(r));
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || toolInput.path || '';

    // (a) Predicate 1 — etanah code / template / config path
    const isEtanahCode =
      /etanah-(pelupusan|awam|common|teknikal)[\\/]/i.test(filePath) &&
      /\.(java|xhtml|docx|json|xml|properties)$/i.test(filePath);
    if (!isEtanahCode) process.exit(0);

    // (b) Predicate 2 — an active quest exists
    const root = path.resolve(__dirname, '..', '..');
    let activeTxt = '';
    try {
      activeTxt = fs.readFileSync(path.join(root, 'quest', 'active.txt'), 'utf8');
    } catch (e) {
      process.exit(0); // no active.txt → not in quest context → allow
    }
    if (!/\bstatus=active\b/.test(activeTxt)) process.exit(0);

    // Read this session's transcript (fail-open if unavailable — never block on our bug)
    let transcript = '';
    try {
      transcript = fs.readFileSync(data.transcript_path, 'utf8');
    } catch (e) {
      process.exit(0);
    }

    // Bypass token — current-turn assistant text only (2026-08-21 self-disarm fix)
    if ((function(){ try { return require((process.env.CLAUDE_PROJECT_DIR || require('path').resolve(__dirname, '..', '..')) + '/lib/bypass-scope.js').bypassInCurrentTurn; } catch (_) { return function () { return false; }; } })()(data.transcript_path, /\[skip-phase-gate:/i)) {
      logFire('bypassed', filePath);
      process.exit(0);
    }

    // Phase-emit markers (canonical banner + accepted legacy markers)
    const phases = [
      { name: 'Issue Checklist', re: /Issue Checklist/i },
      { name: 'Scout', re: /═══\s*SCOUT\b|\bSCOUT EMIT\b/i },
      { name: 'Recon', re: /═══\s*RECON\b|\bRECON EMIT\b|Recon Context Re-load/i },
      { name: 'Rubric', re: /═══\s*RUBRIC\b|\bRUBRIC EMIT\b|Logic Blast Radius/i },
    ];
    // v3 (2026-11-03, 287811 "Always read"): a requirement verdict counts only when the requirement was
    // read in full this session (REQUIREMENT-READ #<req> from requirement-index.js --read) and the line
    // quotes the deciding rule. none found / not needed pass as they are. Template lines ("<req>",
    // "aligned | extends") never match: the req must be digits or none, the verdict one word.
    phases.push({ name: 'Requirement read', test: requirementRead });
    const noRow = rulesMissing(transcript);
    phases.push({ name: 'Requirement rules', test: () => noRow.length === 0 });
    const missing = phases.filter(p => !(p.test ? p.test(transcript) : p.re.test(transcript))).map(p => p.name);
    if (missing.length === 0) {
      logFire('allowed', filePath);
      // v2 (2026-07-03, audit E2+E3): phases exist — run the two ADVISORY checks that
      // QA-268273 proved the phases alone don't cover. Advisory v1 (promote-on-slip).
      const base = path.basename(filePath).replace(/\.[^.]+$/, '');
      const advisories = [];
      // E3 — mechanism git-history: the fix-file's own history read this session?
      const mechRe = new RegExp('(git log[^\\n]{0,120}' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '|MECHANISM-HISTORY:[^\\n]{0,80}' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i');
      if (!mechRe.test(transcript)) advisories.push(
        `E3 mechanism-history: no \`git log -- ...${base}...\` evidence this session — recent commits on THIS file often ARE the mechanism (QA-268273: 25 sibling commits unseen). Run it + read the matched tickets BEFORE relying on the Rubric.`);
      // E2 — entry-point proof: for UI-reachable code, is the handler binding proven?
      if (/\.(java|xhtml)$/i.test(filePath) && !/ENTRY-POINT(-PROOF)?:/i.test(transcript)) advisories.push(
        `E2 entry-point proof: no \`ENTRY-POINT:\` line this session — grep the BA-screenshot page's xhtml for the ACTUAL action/listener binding and emit \`ENTRY-POINT: <page.xhtml:line> -> <Class.method()>\` (QA-268273 fix-1 patched the wrong handler).`);
      if (advisories.length === 0) process.exit(0);
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse',
        additionalContext: '\n⚠️  quest-phase-gate v2 (ADVISORY — edit allowed):\n' + advisories.map(a => '   • ' + a).join('\n') + '\n' } }));
      process.exit(0);
    }

    const reason = [
      `🚫 quest-phase-gate: missing phase emit(s) this session → ${missing.join(', ')}`,
      `   Edit blocked: ${filePath}`,
      '   An active quest is running and you are about to edit etanah code without the full loop.',
      '   Emit the missing phase(s) FIRST — Scout → Recon → Rubric — each with its banner:',
      ...missing.filter(m => !/^Requirement /.test(m)).map(m => `     ═══ ${m.toUpperCase()} ═══`),
      ...(missing.includes('Requirement read') ? [
        '   Requirement read: run node quest/requirement-index.js --read <req> --for <ticket> (description, journals,',
        '   spec attachments), then write REQUIREMENT-MATCH: <ticket> → #<req> "<subject>" — <verdict> — read: "<the rule, quoted>"',
        '   (or — none found / — not needed). A subject match is never a verdict (287811).'] : []),
      ...(noRow.length ? [
        `   Requirement rules: no REQUIREMENT-RULES row for read ${noRow.map(r => '#' + r).join(', ')} — write \`REQUIREMENT-RULES:\` with \`R<n> · #<req> · "<quote>"\` or \`R0 none\``] : []),
      '',
      '   This gate checks the phases EXIST (anti-skip). It does NOT verify they are correct —',
      "   tracing data-flow honestly (OBSERVED, not ASSUMED) is still your job + みや's glance",
      '   at the Logic-Blast-Radius matrix.',
      '   Legitimate non-quest / audit edit? add [skip-phase-gate: <reason>] to your message.',
    ].join('\n');

    logFire('blocked', filePath);
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: reason,
        },
      })
    );
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
