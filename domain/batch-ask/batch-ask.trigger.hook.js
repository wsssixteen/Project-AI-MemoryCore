/**
 * batch-ask.trigger.hook.js — UserPromptSubmit hook
 *
 * Power: domain/batch-ask/
 *
 * PURPOSE: when みや's prompt signals extensive / sweep / thorough / in-one-go
 * intent, force ALL clarifying questions for this turn through the
 * AskUserQuestion tool (popup). Ban chat-written "should I X?" stalling.
 *
 * Created 2026-06-02 per みや — pattern: written-questions during extensive
 * work waste many round-trips. Popup batches them so みや answers all at once.
 */
const fs = require('fs');
const path = require('path');

const LOG = path.resolve(__dirname, 'log.jsonl');

const TRIGGER_PATTERNS = [
  /\b(extensive|extensively|exhaustive|exhaustively)\b/i,
  /\b(thoroughly|comprehensive|comprehensively|in depth)\b/i,
  /\b(full sweep|sweep everything|sweep)\b/i,
  /\b(all the|every) [a-z]+/i,
  /\b(in one go|in one shot|all at once|batch|together)\b/i,
  /\b(save time|don'?t waste time|be quick|quickly|fast)\b/i,
  /\b(extensive logging|extensive loggers|debug everything)\b/i,
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';
    const hit = TRIGGER_PATTERNS.some(re => re.test(prompt));
    if (!hit) process.exit(0);

    // Log the fire per /system-rules Rule 5
    try {
      fs.appendFileSync(LOG, JSON.stringify({
        ts: new Date().toISOString(),
        prompt_excerpt: prompt.slice(0, 160),
      }) + '\n');
    } catch {}

    const reminder = [
      '',
      '⚡ batch-ask: extensive-intent detected',
      '',
      'MANDATORY: use the AskUserQuestion tool (popup) for ALL clarifying',
      'questions this turn. BANNED: chat-written "should I X?" / "what about Y?"',
      'questions that force みや to reply before you continue.',
      '',
      'If 0 clarifying questions needed → proceed without asking.',
      'If ≥1 needed → batch them ALL into one AskUserQuestion call.',
      '',
    ].join('\n');

    process.stdout.write(reminder);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
