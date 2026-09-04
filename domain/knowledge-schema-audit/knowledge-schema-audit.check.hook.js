#!/usr/bin/env node
// knowledge-schema-audit.check.hook.js — born via core/forge.js (2026-09-04). ONE hook file, TWO registrations:
//   SessionStart          → boot audit: one advisory line per etanah-knowledge/<state>/ that drifts from KNOWLEDGE-SCHEMA.json
//   PreToolUse Edit|Write → write-time advisory the moment a non-canonical / legacy name or a bad flowables placement
//                           is about to be written under etanah-knowledge/<state>/
// The event is read from stdin (`hook_event_name` / presence of tool_input), so the same component serves both.
// TRIGGER: every session boot — etanah-knowledge/<state>/ folders drift from the canonical layout (missing required
//          files, legacy names, un-indexed extras, reserved folder names) so the quest workflow silently misses a
//          state's knowledge.
// ACTION: audit every state folder against KNOWLEDGE-SCHEMA.json; surface drift (silent when canonical). Never blocks.
//         The CLI in this folder does the repair (`scaffold --state <s>`).
// WHY boot (system-design Rule 8): boot ALWAYS fires; the drift is invisible to prose rules and to me (2026-09-04:
//         perak PERAK-FACTS.md, wp TEST-DATA-AND-ACCESS.md, kedah with no index.md, a CON\ folder that broke OneDrive —
//         none noticed until miya asked). Write-time is the leanest point to stop a wrong name being born.
// STATE-SCOPE (Rule 11): state-scoped: YES — iterates every state in the schema.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const lib = require(path.join(__dirname, 'knowledge-schema-audit.js'));

function bootAudit() {
  let kroot, schema;
  try { kroot = lib.knowledgeRoot(); schema = lib.loadSchema(kroot); } catch (_) { return { fired: false }; } // no knowledge tree here → silent
  let results;
  try { results = lib.auditAll(kroot, schema); } catch (_) { return { fired: false }; }
  const drifting = results.filter(r => r.drift);
  if (!drifting.length) return { fired: false };
  const lines = drifting.map(r => '   ' + lib.renderLine(r, schema));
  return {
    fired: true, blocked: false,
    contextOut:
      '📐 knowledge-schema-audit: ' + drifting.length + '/' + results.length + ' etanah-knowledge state folder(s) drift from KNOWLEDGE-SCHEMA.json\n' +
      lines.join('\n') + '\n' +
      '   Fix: node domain/knowledge-schema-audit/knowledge-schema-audit.js scaffold --state <s>   (skeletons + UNVERIFIED banner, never overwrites)\n' +
      '   Rename legacy files to the canonical name shown; list every extra topic file in that state\'s index.md.\n',
  };
}

function writeTime(data) {
  const fp = (data.tool_input && data.tool_input.file_path) || '';
  if (!fp) return { fired: false };
  const norm = fp.replace(/\\/g, '/');
  const m = norm.match(/etanah-knowledge\/([a-z]+)\/(.+)$/i);
  if (!m) return { fired: false };
  const state = m[1].toLowerCase(), rel = m[2];
  let schema; try { schema = lib.loadSchema(lib.knowledgeRoot()); } catch (_) { return { fired: false }; }
  if (!schema.states[state]) return { fired: false };
  const segs = rel.split('/');
  const notes = [];
  if (segs.length === 1 && /\.md$/i.test(segs[0])) {
    const name = segs[0];
    const legacy = (schema.legacy_names || {})[name];
    const canonical = !!schema.required_files[name] || (schema.optional_files || []).includes(name);
    if (legacy) notes.push(`"${name}" is a LEGACY name — the canonical file is "${legacy}" (write there instead).`);
    else if (!canonical && !fs.existsSync(fp)) notes.push(`"${name}" is NOT in KNOWLEDGE-SCHEMA.json. If this fact belongs to an existing concern, use the canonical file (required: ${Object.keys(schema.required_files).join(', ')}). If it is a genuinely new topic file, keep the name UPPER-KEBAB.md and add a row to ${state}/index.md — the boot audit flags un-indexed extras.`);
  }
  if (segs[0] === 'flowables-bpmn' && segs.length >= 2) {
    const layout = schema.flowables_layout || {};
    const reserved = layout.reserved_folder_names || {};
    if (segs.length >= 3 && reserved[segs[1].toUpperCase()]) notes.push(`folder "${segs[1]}" is a reserved Windows device name (OneDrive refuses it) — use "${reserved[segs[1].toUpperCase()]}/".`);
    if (segs.length === 2 && /\.bpmn20.*\.xml$/i.test(segs[1])) {
      const mod = lib.moduleOf(segs[1].split('.bpmn20')[0], (schema.states[state] || {}).code);
      if (layout.module_subfolders && mod !== layout.root_module) notes.push(`"${segs[1]}" is a ${mod} model — only ${layout.root_module} models live at the flowables-bpmn root; put it in "${reserved[mod] || mod}/".`);
    }
  }
  if (!notes.length) return { fired: false };
  return { fired: true, blocked: false, contextOut: '📐 knowledge-schema-audit (write-time, ' + state + '): ' + notes.join(' ') + '\n' };
}

runHook({ name: 'knowledge-schema-audit', event: 'SessionStart|PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { data = {}; }
  const isWrite = data.hook_event_name === 'PreToolUse' || !!data.tool_input;
  return isWrite ? writeTime(data) : bootAudit();
});
