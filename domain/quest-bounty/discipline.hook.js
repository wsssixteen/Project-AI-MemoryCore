/**
 * quest-bounty-verify — domain/quest-bounty/discipline.hook.js — Stop hook
 *
 * Makes a SKIPPED quest-bounty VISIBLE. Eval wf_3c67b23f flagged that close-phase
 * invokes quest-bounty via a prose step (~70-85% reliable) and a skip is invisible —
 * nothing emits "bounty skipped". This is the defender: at Stop, if a RECENTLY-archived
 * quest (status=archived + closed= within N days) has no matching line in
 * domain/quest-bounty/log.jsonl, warn.
 *
 * Trigger-design note (why Stop, not PostToolUse-on-archive): quest-bounty writes its
 * log line AFTER archive-quest.js runs (close-phase Phase 2 step 4 comes after step 2),
 * so an archive-time check would ALWAYS false-positive. A Stop-side "recently-archived-
 * without-log" check fires after bounty has had its chance and goes quiet once the line
 * lands. Scoped to closed= within N days so it never spams the historical archive.
 *
 * Advisory (additionalContext, non-blocking) + fail-safe (any error -> exit 0).
 * Built 2026-07-02 as the quest-bounty Power's pending verify-hook (todo.md).
 */
const fs = require('fs');
const path = require('path');

const WINDOW_DAYS = 3;

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
    const archTxt = path.join(ROOT, 'quest', 'active-archive.txt');
    const logFile = path.join(ROOT, 'domain', 'quest-bounty', 'log.jsonl');
    if (!fs.existsSync(archTxt)) { process.exit(0); }
    const text = fs.readFileSync(archTxt, 'utf8');
    const logged = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
    const now = Date.now();
    const windowMs = WINDOW_DAYS * 24 * 3600 * 1000;
    const flagged = [];
    for (const block of text.split(/\n\s*\n/)) {
      const qa = (block.match(/^qa=(QA-\d+)/m) || [])[1];
      if (!qa) continue;
      if (!/^status=archived\b/m.test(block)) continue;
      const closed = (block.match(/^closed=(\d{4}-\d{2}-\d{2})/m) || [])[1];
      if (!closed) continue;                          // only post-quest-bounty era (has closed=)
      const t = Date.parse(closed);
      if (isNaN(t) || now - t > windowMs) continue;   // only recent archives
      if (logged.includes(qa)) continue;              // bounty ran for this qa
      flagged.push(`${qa} (closed ${closed})`);
    }
    if (!flagged.length) { process.exit(0); }
    const reminder = [
      '',
      '⚙️  quest-bounty-verify: a recently-archived quest has NO bounty log line — Phase-2 harvest+bank was SKIPPED.',
      `   ${flagged.join(' · ')}`,
      '',
      'quest-bounty (Phase 2 step 4) harvests the quest doc + system improvements + new knowledge,',
      'mines ONE refinement, and banks to MemoryCore main. A silent skip loses all of that.',
      '  -> Invoke the quest-bounty skill for the QA above, OR note why it was intentionally skipped.',
      'Once quest-bounty appends its domain/quest-bounty/log.jsonl line, this clears.',
      '',
    ].join('\n');
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'Stop', additionalContext: reminder },
    }));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
