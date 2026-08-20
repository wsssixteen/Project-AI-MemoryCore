#!/usr/bin/env node
/**
 * de-run-verify.js — Stop hook (Domain Expansion "no-misses" guard)
 *
 * みや /goal 2026-07-01: "Domain Expansion needs to be the Ultimate no misses despite it
 * still does previously. Do we have a stophook to verify our domain expansion runs properly?"
 *
 * THE HOLE this closes: de-output-integrity-checker.js fires ONLY when the DE closing banner
 * is ALREADY in the reply — it checks OUTPUT quality, not whether DE RAN. domain-expansion-
 * trigger.js only PROMPTS on a trigger phrase. So a FULL DE skip at session-end raised zero
 * alarm (same silent-skip class as the 2026-05-17 boot-step miss).
 *
 * What this does: at Stop, if the latest user turn carries a SESSION-WRAP signal
 * (good night / wrap up / end session / save everything / call it a day / goodbye ...) AND
 * no DE close banner has appeared anywhere this session → emit a LOUD warn: DE must run before
 * the session ends. If DE already ran (banner present) → silent. If no wrap signal → silent.
 *
 * WARN-only (exit 0) in v1 — never blocks Stop. v1.1 candidate: flip to a soft-block that
 * asks Ruri to confirm "DE intentionally skipped" before the wrap Stop completes.
 *
 * Bypass:  [skip-de-verify] anywhere in the turn.
 * Log:     .claude/hooks/de-run-verify.log.jsonl
 * Fail-OPEN: any error → exit 0 silently.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const LOG = path.join(__dirname, 'de-run-verify.log.jsonl');
const BYPASS = /\[skip-de-verify\]/i;

// Session-wrap signals in the user's own words.
const WRAP_RX = /\b(good\s*night|goodnight|wrap\s*(up|it up|for (the day|today))|end (the )?session|call it (a day|a night)|that'?s (all|it) for (today|tonight|the day)|save everything|sign(ing)?\s*off|good\s*bye|see you (tomorrow|later)|done for (today|the day)|let'?s (end|close|wrap))\b/i;

// DE actually ran — its close banner / barrier signature.
const DE_RAN_RX = /Domain Expansion\s*[—-]{1,2}\s*closed|Barrier settles\.\s*Quest threads are at rest|るり結界|ラピス\s*バリアー|═+\s*\[?\s*Domain Expansion/i;

function log(entry) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'); } catch (_) {}
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    let transcript = '';
    try { transcript = fs.readFileSync(data.transcript_path, 'utf8'); } catch (_) { return process.exit(0); }
    // current-turn assistant text only (2026-08-21 self-disarm fix)
    if ((function(){ try { return require((process.env.CLAUDE_PROJECT_DIR || require('path').resolve(__dirname, '..', '..')) + '/lib/bypass-scope.js').bypassInCurrentTurn; } catch (_) { return function () { return false; }; } })()(data.transcript_path, BYPASS)) return process.exit(0);

    // Collect the LAST user message text + all assistant text.
    let lastUser = '';
    let allText = '';
    for (const line of transcript.split(/\r?\n/)) {
      if (!line.trim()) continue;
      let obj;
      try { obj = JSON.parse(line); } catch (_) { continue; }
      const role = obj.role || obj.type || (obj.message && obj.message.role);
      let text = '';
      const content = (obj.message && obj.message.content) || obj.content;
      if (typeof content === 'string') text = content;
      else if (Array.isArray(content)) text = content.map(c => (typeof c === 'string' ? c : c.text || '')).join(' ');
      if (!text) continue;
      allText += '\n' + text;
      if (role === 'user') lastUser = text; // keep overwriting → ends on the last user turn
    }

    const wrapSignal = WRAP_RX.test(lastUser);
    const deRan = DE_RAN_RX.test(allText);

    if (!wrapSignal) return process.exit(0);       // not wrapping → nothing to guard
    if (deRan) { log({ action: 'ok', reason: 'de-ran-before-wrap' }); return process.exit(0); }

    log({ action: 'warn', reason: 'wrap-without-de' });
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext: [
          '',
          '🚨 de-run-verify: SESSION-WRAP signal detected, but Domain Expansion has NOT run this session.',
          '   Per みや "DE = ultimate no-misses" — DE must run before the session ends.',
          '   → Run Domain Expansion NOW (reconciliation autoscan + Gap Sweep + main-sync + close banner),',
          '     THEN wrap. If the skip is intentional, add [skip-de-verify] and say why.',
          '',
        ].join('\n'),
      },
    }));
    process.exit(0);
  } catch (e) {
    log({ action: 'error', error: String(e.message || e).slice(0, 300) });
    process.exit(0);
  }
});
