/**
 * lib/clean-words.js — the one swear-word list for Memory (みや 2026-10-28: his swearing is
 * remembered as anger, disagreement or frustration, never as the words).
 * Used by: domain/memory-clean-words (PreToolUse gate) · lib/save-rules.js check `no-swearing`.
 */
'use strict';

const SWEAR_RE = /\bf+u+c+k\w*|\bbullshit\w*|\bshit\w*|\bbitch\w*|\bdamn(?!ing)\w*|\basshole\w*|\bcunt\w*|\bbastard\w*|\bwtf\b|\bstfu\b|\bfml\b/i;

// Memory shelves (system/INDEX.md kind Memory) that hold words about みや.
const MEMORY_PATH_RE = /(^|\/)(main\/[^\/]+|daily-diary\/.+|\.claude\/auto-memory\/.+)$/i;

function findSwears(text) {
  const hits = [];
  String(text || '').split(/\r?\n/).forEach((line, i) => {
    const m = line.match(SWEAR_RE);
    if (m) hits.push({ line: i + 1, word: m[0] });
  });
  return hits;
}

function isMemoryPath(p) { return MEMORY_PATH_RE.test(String(p || '').replace(/\\/g, '/')); }

module.exports = { SWEAR_RE, MEMORY_PATH_RE, findSwears, isMemoryPath };
