#!/usr/bin/env node
// bypass-scope.js — born via forge (2026-08-21)
// Shared primitive: a [skip-*] bypass token only counts when *deliberately written* —
// an ASSISTANT text block in the CURRENT turn (after the last genuine user text message).
//
// WHY: gates used to scan the WHOLE raw transcript for their token. The first time a
// gate blocked and printed its own help text ("Add [skip-x: <reason>] ..."), that text
// landed in the transcript and every later fire auto-bypassed for the rest of the
// session — the gate disarmed itself (design-consult-gate, found 2026-08-21; same
// pattern in 7 more gates).
//
// Tool_result / hook-feedback blocks are type 'tool_result', not 'text', so they are
// never counted; user-role text resets the turn boundary.
'use strict';
const fs = require('fs');

function collectTexts(transcriptPath) {
  const texts = [];
  let raw;
  try { raw = fs.readFileSync(transcriptPath || '', 'utf8'); } catch (_) { return texts; }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch (_) { continue; }
    const m = o.message || o;
    const role = m.role || o.type;
    const c = m.content;
    if (typeof c === 'string') texts.push({ role, text: c });
    else if (Array.isArray(c)) {
      for (const b of c) if (b && b.type === 'text' && b.text) texts.push({ role, text: b.text });
    }
  }
  return texts;
}

/** Token present in assistant text of the CURRENT turn (after the last user text message). */
function bypassInCurrentTurn(transcriptPath, tokenRe) {
  const texts = collectTexts(transcriptPath);
  let lastUser = -1;
  for (let i = texts.length - 1; i >= 0; i--) if (texts[i].role === 'user') { lastUser = i; break; }
  return texts.slice(lastUser + 1).some(t => t.role === 'assistant' && tokenRe.test(t.text));
}

module.exports = { bypassInCurrentTurn, collectTexts };
