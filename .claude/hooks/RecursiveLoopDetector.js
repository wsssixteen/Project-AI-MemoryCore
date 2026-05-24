/**
 * RecursiveLoopDetector.js — PostToolUse hook
 *
 * Tracks recent tool calls in JSONL ring-buffer (last 10). Warns if same
 * tool + similar args fired 3+ times in window. Catches loop patterns.
 *
 * Per LangGraph recursion_limit pattern (Audit 5, Task #29).
 * Created 2026-05-24.
 *
 * Trifecta:
 *   Goal:       Detect repeated-tool-call loops before token waste
 *   Guardrails: Window-bounded (10 calls); fires on 3+ matches only
 *   Grounded:   PostToolUse payload + in-session call buffer
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const BUFFER_FILE = path.join(PROJECT_ROOT, 'meta', 'recent-tool-calls.jsonl');
const WINDOW_SIZE = 10;
const REPEAT_THRESHOLD = 3;

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};
    const argSnippet = JSON.stringify(toolInput).slice(0, 100);
    const fingerprint = `${toolName}::${argSnippet}`;

    let buffer = [];
    if (fs.existsSync(BUFFER_FILE)) {
      const content = fs.readFileSync(BUFFER_FILE, 'utf8');
      buffer = content.split('\n').filter(line => line.trim()).map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(x => x);
    }

    buffer.push({ ts: new Date().toISOString(), fingerprint });
    if (buffer.length > WINDOW_SIZE) buffer = buffer.slice(-WINDOW_SIZE);

    try {
      fs.mkdirSync(path.dirname(BUFFER_FILE), { recursive: true });
      fs.writeFileSync(BUFFER_FILE, buffer.map(b => JSON.stringify(b)).join('\n') + '\n');
    } catch (e) { /* silent */ }

    const matchCount = buffer.filter(b => b.fingerprint === fingerprint).length;
    if (matchCount >= REPEAT_THRESHOLD) {
      const reminder = [
        '',
        `⚙️  RecursiveLoopDetector: ${toolName} called ${matchCount}× similar args in last ${WINDOW_SIZE} calls`,
        '',
        'Possible loop / stuck-on-same-approach. Per Momentum Circuit-Breaker (Debug Ritual 3): theory fails 2× → RESET + try alternatives.',
        '',
      ].join('\n');

      const response = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: reminder,
        },
      };
      process.stdout.write(JSON.stringify(response));
    }

    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
