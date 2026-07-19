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
 *
 * v1.1 (2026-07-03, per Miya): DEFER-FIRST + once-per-session.
 * Why: v1.0 fired at the session's first Stop and its wording ("Invoke the quest-bounty
 * skill") pushed a full 2-quest harvest at BOOT, hijacking the session start Miya wanted
 * for other work. A missed bounty is NEVER boot-urgent — it only needs to run at the next
 * Phase-2 close / DE / an explicit go. So: (a) the message now says PARK IT (1-line flag),
 * never "run it now"; (b) a session-scoped marker file caps it at one emit per session.
 *
 * v1.2 (2026-07-03): worktree-aware clear-signal. log.jsonl is gitignored (main working
 * tree only, OneDrive-synced) — a worktree session's CLAUDE_PROJECT_DIR points at
 * .claude/worktrees/<name>, so the hook resolved log.jsonl to a nonexistent path and
 * re-flagged quests whose harvest was already logged. Resolve log.jsonl against the
 * main repo root derived by stripping the worktree suffix from ROOT.
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
    // log.jsonl is gitignored (main working tree only) — strip a worktree suffix so the clear-signal resolves
    const MAIN_ROOT = ROOT.replace(/[\\\/]\.claude[\\\/]worktrees[\\\/][^\\\/]+[\\\/]?$/, '');
    const archTxt = path.join(ROOT, 'quest', 'active-archive.txt');
    const logFile = path.join(MAIN_ROOT, 'domain', 'quest-bounty', 'log.jsonl');
    if (!fs.existsSync(archTxt)) { process.exit(0); }

    // v1.1 once-per-session cap: one advisory per session, then silent.
    let sessionId = '';
    try { sessionId = (JSON.parse(input).session_id || '').toString(); } catch (e) { /* no payload */ }
    const marker = path.join(__dirname, '.verify-notified');
    if (sessionId) {
      try {
        if (fs.existsSync(marker) && fs.readFileSync(marker, 'utf8').trim() === sessionId) { process.exit(0); }
      } catch (e) { /* fail-open */ }
    }
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
    if (sessionId) { try { fs.writeFileSync(marker, sessionId); } catch (e) { /* fail-open */ } }
    const reminder = [
      '',
      '⚙️  quest-bounty-verify (defer-first): a recently-archived quest has NO bounty log line — Phase-2 harvest+bank was skipped.',
      `   ${flagged.join(' · ')}`,
      '',
      '  -> Do NOT run the harvest now. PARK it: surface ONE line to Miya ("bounty pending: <QA>")',
      '     and run quest-bounty at the next natural stop — Phase-2 close, Domain Expansion, or Miya\'s explicit go.',
      'This fires once per session. It clears when quest-bounty appends its domain/quest-bounty/log.jsonl line.',
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
