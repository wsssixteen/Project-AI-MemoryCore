#!/usr/bin/env node
// models.js — the one reader of the highest model id (system/evolution-protocol.md State block, `highest-model-id:`).
// boundary: covers reading that one field · never writes it, never calls a model · stops at returning the id; a missing field returns null
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const FILE = process.env.MODELS_STATE_FILE || path.join(ROOT, 'system', 'evolution-protocol.md');

function highest() {
  let text = '';
  try { text = fs.readFileSync(FILE, 'utf8'); } catch (_) { return null; }
  const m = text.match(/^highest-model-id:\s*([a-z0-9.-]+)/m);
  return m ? m[1] : null;
}

// claude-fable-5-1 -> fable (the Agent tool's model name)
function alias(id) {
  const m = String(id || '').match(/^claude-([a-z]+)-/);
  return m ? m[1] : null;
}

module.exports = { highest, alias };

if (require.main === module) {
  const id = highest();
  if (!id) { console.log('MODELS: no highest-model-id in ' + FILE); process.exit(1); }
  console.log(process.argv[2] === 'alias' ? alias(id) : id);
}
