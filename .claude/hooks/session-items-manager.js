/**
 * session-items-manager.js — UserPromptSubmit hook
 *
 * Manages `.claude/state/session-items.md` lifecycle based on natural-language
 * commands in みや's prompt. Detects when an active session-item should be
 * promoted to todo.md / standing-flag / done / rejected and flags Ruri to
 * make the move.
 *
 * Does NOT auto-edit the file (avoids false-detection risk) — instead injects
 * a context line telling Ruri "lifecycle command detected for X; apply the
 * move + remove from session-items."
 *
 * SURFACES NOTHING when no command detected (no mid-turn clutter per
 * みや 2026-05-25). Surfacing of active items happens ONLY at end-of-session
 * via DE Step 13 / Quest Postscript / save commands (separate code paths).
 *
 * Created 2026-05-25 per Design Memo applied via system-design v1.1 after
 * the git-health Design Memo got lost across 3 turns including a DE close.
 */

const fs = require('fs');
const path = require('path');

// Lifecycle command patterns — みや's natural language
const LIFECYCLE_PATTERNS = [
  // Move-to-todo signals
  { regex: /\b(add (it |this )?to todo|park (it|this|that)|save for (later|next session)|defer to next session)\b/i, target: 'moved-to-todo' },
  // Move-to-standing-flag signals
  { regex: /\b(make (it |this )?a? ?standing flag|surface as flag|add (as a |as )?flag)\b/i, target: 'moved-to-standing-flag' },
  // Done signals
  { regex: /\b(it'?s done|mark (it |this )?(as )?done|completed|that'?s (closed|finished))\b/i, target: 'done' },
  // Rejected signals
  { regex: /\b(drop (it|this|that)|reject|cancel (it|this|that)|don'?t (build|need) (it|this|that))\b/i, target: 'rejected' },
  // Fix-now signals (don't track, fix in-turn instead)
  { regex: /\b(fix (it |this )?now|just do it|build (it |this )?now|proceed with (the )?build)\b/i, target: 'in-progress' },
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';

    // Locate the session-items file (relative to project root)
    const cwd = data.cwd || process.cwd();
    const itemsPath = path.join(cwd, '.claude', 'state', 'session-items.md');

    if (!fs.existsSync(itemsPath)) {
      // No state file = no active items = nothing to do
      process.exit(0);
    }

    const content = fs.readFileSync(itemsPath, 'utf8');

    // Extract active items (rows in "## Active items" section)
    const activeSection = content.split('## Active items')[1];
    if (!activeSection) process.exit(0);
    const activeRows = activeSection.split('---')[0]
      .split('\n')
      .filter(line => /^\| S\d+ \|/.test(line));

    if (activeRows.length === 0) process.exit(0);

    // Detect lifecycle commands in prompt
    let detectedMove = null;
    for (const { regex, target } of LIFECYCLE_PATTERNS) {
      if (regex.test(prompt)) {
        detectedMove = target;
        break;
      }
    }

    if (!detectedMove) process.exit(0); // silent — no clutter

    // Surface to Ruri: lifecycle command detected; she handles the move
    const itemSummaries = activeRows.map(row => {
      const cols = row.split('|').map(c => c.trim());
      return `${cols[1]} (${cols[3]}): ${cols[4]}`;
    });

    const context = [
      '',
      `⚙️  session-items-manager: lifecycle command detected → "${detectedMove}"`,
      '',
      'Active session-items:',
      ...itemSummaries.map(s => `  - ${s}`),
      '',
      `If みや's command applies to one of these, update its status to "${detectedMove}"`,
      `in .claude/state/session-items.md and move it to the archive section.`,
      `If "in-progress" — that means みや wants Ruri to BUILD/FIX NOW (not defer).`,
      'If no match — proceed normally; the command may refer to something else.',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    // Fail silent — never block on hook error
    process.exit(0);
  }
});
