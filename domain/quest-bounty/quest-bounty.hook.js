/**
 * quest-bounty.hook.js — PostToolUse (Bash) — the Phase-2 save hook みや asked for.
 *
 * When a quest is archived (a Bash command runs archive-quest.js), this saves the
 * MemoryCore repo the ordinary way — git add + commit + push to main — automatically.
 * Fires ONLY on the archive command; silent exit on every other Bash command.
 *
 * Runs git SILENTLY via execSync inside the hook: NO command popups, NO permission
 * prompts, NO agent round-trip. Emits at most ONE short confirmation line. Fail-safe
 * (any error -> exit 0, never breaks the session). NEVER touches the etanah repos.
 */
const { execSync } = require('child_process');
const path = require('path');

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const cmd = (data.tool_input && data.tool_input.command) || '';
    if (!/archive-quest\.js/.test(cmd)) { process.exit(0); }     // only on Phase-2 archive
    const qa = (cmd.match(/QA-\d+/) || ['QA-?'])[0];
    const ROOT = process.env.QB_ROOT || path.resolve(__dirname, '..', '..'); // repo this hook lives in (QB_ROOT = test override)
    const g = (a) => execSync(`git ${a}`, { cwd: ROOT, stdio: 'pipe' }).toString().trim();
    if (!g('status --porcelain')) { process.exit(0); }           // nothing to save -> silent
    g('add -A');
    execSync(`git commit -m "quest-bounty ${qa} — Phase 2 save"`, { cwd: ROOT, stdio: 'pipe' });
    let pushed = 'committed (push failed — push manually)';
    try { g('push origin HEAD'); pushed = 'pushed origin'; } catch (e) {}
    const sha = g('rev-parse --short HEAD');
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `quest-bounty: ${qa} — MemoryCore ${pushed} (${sha})`,
      },
    }));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
