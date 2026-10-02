#!/usr/bin/env node
// handoff-load.check.hook.js — born via core/forge.js (2026-10-02)
// TRIGGER: user prompt names a hand-off, handover, another team or module, or a Redmine note to another team
// ACTION: inject the full cross-module hand-off procedure and the ticket writing shape into context; ask for a HANDOFF-LOADED first line
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.join(__dirname, 'log.jsonl');

const TRIGGER = /\b(hand[\s-]?over|hand[\s-]?off|pass (?:it )?to (?:the )?(?:common|spoc|another|other|hasil|report)|(?:common|spoc|other|another|hasil) (?:team|module)|cross[\s-]?module|not our module|redmine (?:note|handover|hand-?off))\b/i;

const MAIN_ROOT = ROOT.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/i, '');
const MEM_DIRS = [path.join(ROOT, '.claude', 'auto-memory'), path.join(MAIN_ROOT, '.claude', 'auto-memory')];

function readMemory(name) {
  for (const dir of MEM_DIRS) {
    try { return fs.readFileSync(path.join(dir, name), 'utf8'); } catch (_) {}
  }
  return null;
}

function body(text) {
  return text.replace(/^---[\s\S]*?\n---\s*\n/, '').trim();
}

runHook({ name: 'handoff-load', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const prompt = String(data.prompt || data.user_message || '');
  if (!prompt || prompt.length > 20000) return { fired: false };
  if (/^\s*(?:\[|<|═)/.test(prompt) && /handoff-load:/.test(prompt)) return { fired: false };
  const m = prompt.match(TRIGGER);
  if (!m) return { fired: false };

  const handoff = readMemory('feedback_cross_module_handoff_artifact.md');
  const style = readMemory('feedback_ticket_writing_style.md');
  const loaded = [];
  let out = 'handoff-load: hand-off request detected ("' + m[0] + '"). The procedure below is now LOADED. Follow it exactly.\n'
    + '   First line of the reply: HANDOFF-LOADED: cross-module-handoff ✓ · ticket-writing-style ✓\n';

  if (handoff) {
    loaded.push('cross-module-handoff');
    out += '\n═══ feedback_cross_module_handoff_artifact.md (full) ═══\n' + body(handoff) + '\n';
  }
  if (style) {
    loaded.push('ticket-writing-style');
    const lines = body(style).split('\n');
    const cut = lines.findIndex((l, i) => i > 5 && /^\*\*Pre-send split check/.test(l));
    out += '\n═══ feedback_ticket_writing_style.md (rules + shape) ═══\n' + lines.slice(0, cut > 0 ? cut + 1 : 40).join('\n') + '\n';
  }
  if (loaded.length < 2) {
    out += '\n⚠️ handoff-load: missing memory file(s) in ' + MEM_DIRS.join(' or ') + ' — loaded only [' + loaded.join(', ') + ']. Tell miya before drafting.\n';
  }

  try {
    fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), matched: m[0], loaded }) + '\n');
  } catch (_) {}

  return { fired: true, blocked: false, contextOut: out };
});
