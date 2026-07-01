/**
 * no-code-comments-gate.js — PreToolUse hook (Edit | Write)
 *
 * Bans Ruri from adding comments into etanah CODE files unless みや asked.
 * Built 2026-07-01 per みや (QA-267976): "Create a hook to ban you from adding
 * comments into codes unless requested." Closes the contradiction where
 * convention-check-gate v1.4 told Ruri to COMMENT-EACH-CHANGE (that line removed
 * in the same pass).
 *
 * Scope: Edit/Write on ETANAH code files (path under an etanah-* repo or Melaka,
 *   extensions .java .js .ts .jsx .tsx .xhtml .css .scss .py .sql). Our own
 *   MemoryCore hooks/skills keep their doc-headers — not in scope.
 * Blocks when the NEW content adds a comment the OLD content did not have.
 * Allows when EITHER: the last user message asked for a comment, OR a bypass
 *   token [comment-ok: <reason>] is present in the session.
 * Fail-OPEN: transcript/parse error -> allow (never block on our own bug).
 * Design: /system-rules + /system-design consulted 2026-07-01 (hook-only primitive,
 *   trigger at edit-moment, etanah-scoped predicate). Log: no-code-comments-gate.log.jsonl
 */
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'no-code-comments-gate.log.jsonl');

const CODE_EXT = /\.(java|js|ts|jsx|tsx|xhtml|css|scss|py|sql)$/i;
const ETANAH = /etanah-(pelupusan|common|awam|teknikal)\b|[\\/]Melaka[\\/]/i;
const BYPASS = /\[(?:comment-ok|skip-comment-gate):/i;
const REQUESTED = /\b(comment|annotate|note in (?:the )?code|label (?:it|this|them)|explain in (?:the )?code|add (?:a )?comment|keep (?:the |a )?comment|leave (?:a )?comment)\b/i;

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail }) + '\n'); } catch (_) {}
}

function commentLines(text) {
  if (!text) return [];
  return text.split(/\r?\n/).map(l => l.trim()).filter(l =>
    l.startsWith('//') || l.startsWith('/*') || l.startsWith('*') ||
    l.startsWith('<!--') || / \/\/ /.test(l) || /\/\*.*\*\//.test(l)
  );
}

function lastUserMessage(transcriptPath) {
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split(/\r?\n/);
    for (let i = lines.length - 1; i >= 0; i--) {
      let ev; try { ev = JSON.parse(lines[i]); } catch (_) { continue; }
      if (ev.type === 'user' && ev.message) {
        const c = ev.message.content;
        if (typeof c === 'string') return c;
        if (Array.isArray(c)) return c.map(p => (typeof p === 'string' ? p : (p.text || ''))).join(' ');
      }
    }
  } catch (_) {}
  return '';
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name || '';
    if (toolName !== 'Edit' && toolName !== 'Write') process.exit(0);

    const ti = data.tool_input || {};
    const filePath = ti.file_path || ti.path || '';
    if (!CODE_EXT.test(filePath) || !ETANAH.test(filePath)) process.exit(0);

    const oldStr = ti.old_string || '';
    const newStr = ti.new_string != null ? ti.new_string : (ti.content || '');

    const oldComments = new Set(commentLines(oldStr));
    const added = commentLines(newStr).filter(l => !oldComments.has(l));
    if (added.length === 0) process.exit(0);

    let transcript = '';
    try { transcript = fs.readFileSync(data.transcript_path, 'utf8'); }
    catch (e) { logFire('fail-open', filePath); process.exit(0); }

    if (BYPASS.test(transcript)) { logFire('allowed-bypass', filePath); process.exit(0); }
    if (REQUESTED.test(lastUserMessage(data.transcript_path))) { logFire('allowed-requested', filePath); process.exit(0); }

    logFire('blocked', { filePath, added: added.slice(0, 3) });
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: [
          `no-code-comments-gate: this edit adds ${added.length} comment(s) to code — みや did not ask for comments.`,
          `   File: ${filePath}`,
          `   Added: ${added.slice(0, 2).map(s => (s.length > 60 ? s.slice(0, 60) + '…' : s)).join('   |   ')}`,
          `   Rule (みや 2026-07-01): no comments in code unless みや asks. Remove the comment, re-do the edit.`,
          `   If みや did ask (or one is truly needed): add [comment-ok: <reason>] to your message.`,
        ].join('\n'),
      },
    }));
    process.exit(0);
  } catch (e) { process.exit(0); }
});
