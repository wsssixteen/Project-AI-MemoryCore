#!/usr/bin/env node
/**
 * lib/apply-bundles.js — one-shot C3 rewire: replace bundled children's individual
 * registrations with ONE dispatcher entry per bundle. Children files untouched
 * (their eval pins stay green); manifests own membership. Idempotent; JSON revalidated.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const SETTINGS = path.join(ROOT, '.claude', 'settings.json');

const BUNDLES = [
  { manifest: 'domain/bundles/stop-claim-integrity.json', event: 'Stop', matcher: '' },
  { manifest: 'domain/bundles/stop-reply-shape.json', event: 'Stop', matcher: '' },
  { manifest: 'domain/bundles/upsm-consult.json', event: 'UserPromptSubmit', matcher: '' },
  { manifest: 'domain/bundles/pretool-editwrite-gates.json', event: 'PreToolUse', matcher: 'Edit|Write' },
  { manifest: 'domain/bundles/upsm-mode.json', event: 'UserPromptSubmit', matcher: '' },
];

const settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
let removed = 0, added = 0;

// collect every child basename across manifests
const childBasenames = new Set();
for (const b of BUNDLES) {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, b.manifest), 'utf8'));
  for (const c of m.children) childBasenames.add(path.basename(c));
}

// remove child registrations (direct or wrapped)
for (const blocks of Object.values(settings.hooks || {})) {
  for (const block of blocks) {
    const before = (block.hooks || []).length;
    block.hooks = (block.hooks || []).filter(h => ![...childBasenames].some(n => (h.command || '').includes(n)));
    removed += before - block.hooks.length;
  }
}

// add dispatcher entries (idempotent)
for (const b of BUNDLES) {
  const cmd = 'node "${CLAUDE_PROJECT_DIR}\\lib\\dispatch-hooks.js" --manifest "' + b.manifest + '" --event ' + b.event;
  const evBlocks = settings.hooks[b.event] = settings.hooks[b.event] || [];
  const exists = evBlocks.some(bl => (bl.hooks || []).some(h => (h.command || '').includes(b.manifest)));
  if (exists) continue;
  let block = evBlocks.find(bl => (bl.matcher || '') === b.matcher);
  if (!block) { block = b.matcher ? { matcher: b.matcher, hooks: [] } : { hooks: [] }; evBlocks.push(block); }
  block.hooks.push({ type: 'command', command: cmd });
  added++;
}

fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2));
JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
let total = 0;
for (const blocks of Object.values(settings.hooks)) for (const b of blocks) total += (b.hooks || []).length;
console.log(`apply-bundles: removed ${removed} child registrations · added ${added} dispatchers · total registrations now ${total}`);
