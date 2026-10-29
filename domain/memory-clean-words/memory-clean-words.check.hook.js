#!/usr/bin/env node
// memory-clean-words.check.hook.js — born via core/forge.js (2026-10-28)
// TRIGGER: an Edit, Write or MultiEdit to a Memory file (main/, daily-diary/, .claude/auto-memory/) whose new text holds a swear word
// ACTION: block the write; the message says to record his anger as anger, without the swear words
// Word list + memory paths: lib/clean-words.js (shared with lib/save-rules.js check `no-swearing`).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const { findSwears, isMemoryPath } = require(path.join(ROOT, 'lib', 'clean-words.js'));

const TOOLS = new Set(['Edit', 'Write', 'MultiEdit']);

function newText(name, input) {
  if (name === 'Write') return input.content || '';
  if (name === 'Edit') return input.new_string || '';
  if (name === 'MultiEdit') return (input.edits || []).map(e => e.new_string || '').join('\n');
  return '';
}

runHook({ name: 'memory-clean-words', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  if (!TOOLS.has(data.tool_name)) return { fired: false };
  const ti = data.tool_input || {};
  if (!isMemoryPath(ti.file_path)) return { fired: false };
  const hits = findSwears(newText(data.tool_name, ti));
  if (!hits.length) return { fired: false };
  const shown = hits.slice(0, 5).map(h => 'line ' + h.line).join(', ');
  return {
    fired: true, blocked: true,
    blockReason: '⛔ memory-clean-words: this memory write holds a swear word (' + shown + ').\n' +
      '   Record みや\'s anger as anger, not as the words: keep his meaning, drop the swear word, mark his state.\n' +
      '   Example: a sworn "what is this reply?" is written as "what is this reply?" (frustrated)\n' +
      '   Word list: lib/clean-words.js. No bypass: rewrite the text and write again.\n'
  };
});
