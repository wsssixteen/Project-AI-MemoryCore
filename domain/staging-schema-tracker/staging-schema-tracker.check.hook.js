#!/usr/bin/env node
// staging-schema-tracker.check.hook.js — born via core/forge.js (2026-08-10)
// TRIGGER: miya switch-phrase ('switch staging to stg1' / 'we switched to stg2' / 'use stg1') OR any env-prep / test-scenario prompt
// ACTION: on switch: rewrite system/melaka-env-state.json to the new schema + confirm; on env/test: inject the live staging target and auto-verify standalone.xml etanahDS matches it
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
// v2 2026-09-23 — a background <task-notification> naming "<ticket>-stg1.sql" flipped the pointer stg2→stg1
//   (bare stg token matched inside a file name; unbounded `use` matched inside "user"). Now: system/background
//   notifications are skipped whole; a switch needs an explicit phrase in miya's own text (quotes, code, pasted
//   blocks and file names ignored); negated, questioned, conflicting, or about-this-tracker phrases never write.
//   Every pointer decision appends one log.jsonl row. Spec kept: switch rewrites + confirms · env prompt injects
//   target + standalone verdict · question never clobbers · unrelated prompt silent. Dropped: loose
//   `remember.{0,25}stg` / `amend.{0,40}stg` / bare `using` / `now on` / `move to` — replaced by SWITCH_PHRASES.
//   Added: STAGING_TRACKER_STATE_PATH + STAGING_TRACKER_LOG_PATH overrides (eval sandbox — the eval no longer
//   writes the live pointer).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const fs = require('fs');
const STATE = process.env.STAGING_TRACKER_STATE_PATH || path.join(ROOT, 'system', 'melaka-env-state.json');
const LOG = process.env.STAGING_TRACKER_LOG_PATH || path.join(__dirname, 'log.jsonl');

function safeRead(p) { try { return fs.readFileSync(p, 'utf-8'); } catch { return null; } }
function loadState() { const raw = safeRead(STATE); if (!raw) return null; try { return JSON.parse(raw); } catch { return null; } }
function schemaMeta(n) {
  return { melaka_staging_schema: 'stg' + n, schema_name: 'et_main_stg' + n,
           schema_user: 'et_main_stg' + n, mcp_server: n === '1' ? 'postgres-mlkstg1-pg' : 'postgres-mlkstg-pg' };
}
function standaloneSchema(state) {
  const p = state && state.standalone_path;
  if (!p) return { found: false };
  const xml = safeRead(p);
  if (xml === null) return { found: false };
  const ds = state.standalone_datasource || 'etanahDS';
  const idx = xml.indexOf('pool-name="' + ds + '"');
  if (idx === -1) return { found: true, schema: null };
  const m = xml.slice(idx, idx + 400).match(/currentSchema=(\w+)/);
  return { found: true, schema: m ? m[1] : null };
}

// System / background-agent messages reach UserPromptSubmit too — they are never miya.
const NOTIFICATION = /<\\?~?task-notification>|\[SYSTEM NOTIFICATION - NOT USER INPUT\]/i;
// A prompt that names this tracker or its state file is ABOUT the switch, not a switch.
const META = /melaka-env-state|staging-schema-tracker/i;
// stg token standing alone — never inside a file name / schema / server (280166-stg1.sql, et_main_stg1, mlkstg1-pg).
const T = String.raw`(?<![\w./\\-])stg\s?([12])(?![\w/\\-]|\.\w)`;
const SWITCH_PHRASES = [
  // switch staging to stg1 · we switched to stg2 · switch back to stg2 · switch from stg1 to stg2 · I'm switching to stg1
  String.raw`\b(?:switch(?:ed)?|(?:i['’]?m|i am|we['’]re|we are)\s+switching|chang(?:e|ed))\s+(?:(?:the\s+)?(?:melaka\s+)?(?:staging|env(?:ironment)?|schema)\s+)?(?:from\s+stg\s?[12]\s+)?(?:back\s+|over\s+)?to\s+` + T,
  // staging now stg1 · staging is now on stg2 · staging = stg1 · staging is stg2
  String.raw`\bstaging\s*(?:=|is\s+now|is|now)\s*(?:on\s+)?` + T,
  // use stg1 · actually use stg2 from now · we're using stg1
  String.raw`\b(?:use|(?:we['’]re|we are|i['’]?m)\s+using)\s+` + T,
  // we're on stg1 now · we are now on stg2
  String.raw`\b(?:we['’]re|we are|i['’]?m|i am)\s+(?:now\s+)?on\s+` + T,
  // set the env to stg1 · point staging to stg2 · amend memory to stg1
  String.raw`\b(?:set|point|amend)\s+(?:the\s+|your\s+)?(?:env(?:ironment)?|staging|schema|pointer|memory)\s+to\s+` + T,
].map(s => new RegExp(s, 'gi'));
const NEGATED = /\b(?:don['’]?t|do not|not|never|no longer|stop|avoid|can['’]?t|cannot|won['’]?t)\b[\w\s'’]{0,15}$/i;
const ENV_TRIGGER   = /(prepare|set ?up|setting up|\bprep\b)\s+(the\s+)?(env|environment)|env-?check|test scenario|prepare.*\btest\b|which\s+(schema|stg|staging)|standalone(?:\.xml)?|current schema|what schema/i;

// miya's own words only: drop pasted blocks, code, quoted examples, blockquotes.
function ownText(prompt) {
  return prompt
    .replace(/<pasted_content[\s\S]*?<\/pasted_content>/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/"[^"\n]*"|\u201c[^\u201d\n]*\u201d/g, ' ')
    .replace(/^[ \t]*>.*$/gm, ' ');
}
function sentenceAt(text, start, end) {
  let a = start; while (a > 0 && !/[.!?\n]/.test(text[a - 1])) a--;
  let b = end; while (b < text.length && !/[.!?\n]/.test(text[b])) b++;
  return text.slice(a, Math.min(b + 1, text.length));
}
function findSwitches(text) {
  const hits = [];
  for (const re of SWITCH_PHRASES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const before = text.slice(Math.max(0, m.index - 30), m.index);
      if (NEGATED.test(before) || /\?/.test(sentenceAt(text, m.index, m.index + m[0].length))) continue;
      hits.push({ n: m[1], phrase: m[0].replace(/\s+/g, ' ').trim() });
    }
  }
  return hits;
}
function logDecision(row) {
  try { fs.appendFileSync(LOG, JSON.stringify(Object.assign({ ts: new Date().toISOString() }, row)) + '\n'); } catch (_) {}
}

runHook({ name: 'staging-schema-tracker', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const prompt = data.prompt || '';
  if (NOTIFICATION.test(prompt)) return { fired: false };
  const out = [];
  let state = loadState();

  // (A) SWITCH — miya sets the pointer with an explicit phrase in his own words.
  const hits = findSwitches(ownText(prompt));
  const targets = [...new Set(hits.map(h => h.n))];
  const cur = state ? state.melaka_staging_schema : 'unknown';
  if (hits.length && META.test(prompt)) {
    logDecision({ outcome: 'refused-meta', target: 'stg' + targets.join('/stg'), phrase: hits[0].phrase, current: cur });
    out.push('\u2139\ufe0f staging-schema-tracker: switch phrase "' + hits[0].phrase + '" sits in a prompt about the tracker itself \u2014 pointer NOT changed (still ' + cur + '). To switch, say it on its own line.');
  } else if (targets.length > 1) {
    logDecision({ outcome: 'refused-conflict', target: 'stg' + targets.join('/stg'), phrase: hits.map(h => h.phrase).join(' | '), current: cur });
    out.push('\u26a0\ufe0f staging-schema-tracker: conflicting switch phrases (' + hits.map(h => h.phrase).join(' | ') + ') \u2014 pointer NOT changed (still ' + cur + '). Ask miya which one.');
  } else if (hits.length) {
    const n = targets[0];
    const phrase = hits[0].phrase;
    const meta = schemaMeta(n);
    if (!state) state = { standalone_datasource: 'etanahDS', standalone_path: 'E:/Dev/jboss-7.4-plp-melaka/standalone/configuration/standalone.xml', history: [] };
    if (state.melaka_staging_schema !== meta.melaka_staging_schema) {
      Object.assign(state, meta);
      state.updated = new Date().toISOString().slice(0, 10);
      state.source = 'miya';
      state.history = (state.history || []).concat([{ schema: meta.melaka_staging_schema, from: state.updated }]);
      try {
        fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');
        logDecision({ outcome: 'written', target: meta.melaka_staging_schema, phrase, current: cur });
        out.push('\u2705 Recorded: Melaka staging \u2192 ' + meta.melaka_staging_schema + ' (' + meta.schema_name + ', MCP ' + meta.mcp_server + '). Was ' + cur + '. Wrote system/melaka-env-state.json. Phrase: "' + phrase + '".');
        out.push('   \u2192 Also update standalone.xml etanahDS currentSchema+user to ' + meta.schema_name + ', and sync the prose pointer in feedback_staging_schema_stg2.md.');
      } catch (e) {
        logDecision({ outcome: 'write-failed', target: meta.melaka_staging_schema, phrase, current: cur, error: e.message });
        out.push('\u26a0\ufe0f staging-schema-tracker: could not write state file: ' + e.message);
      }
    }
  }

  // (B) ENV / TEST-SCENARIO — surface the live target + verify standalone.
  if (ENV_TRIGGER.test(prompt)) {
    state = loadState() || state;
    if (state && state.melaka_staging_schema) {
      const t = state.schema_name, srv = state.mcp_server, sch = state.melaka_staging_schema;
      const sa = standaloneSchema(state);
      out.push('');
      out.push('\ud83c\udfaf Melaka staging target = ' + sch + ' (' + t + ') \u00b7 MCP ' + srv + ' \u00b7 per system/melaka-env-state.json (set ' + state.updated + ').');
      if (!sa.found) {
        out.push('   standalone.xml not readable here \u2014 verify ' + state.standalone_datasource + ' currentSchema=' + t + ' manually before declaring env ready.');
      } else if (sa.schema === t) {
        out.push('   \u2705 standalone.xml ' + state.standalone_datasource + ' = ' + sa.schema + ' \u2014 matches. Env correct for ' + sch + '.');
      } else {
        out.push('   \ud83d\udea8 MISMATCH: standalone.xml ' + state.standalone_datasource + ' = ' + sa.schema + ', target = ' + t + '. Change its connection-url currentSchema + <user-name> to ' + t + ' BEFORE declaring env ready or handing a test scenario.');
      }
      out.push('   SQL handed to miya stays UNQUALIFIED (he copy-pastes between schemas).');
    } else {
      out.push('\ud83c\udfaf Melaka staging target UNKNOWN \u2014 system/melaka-env-state.json missing/empty. Ask miya stg1 or stg2; do NOT default.');
    }
  }

  if (!out.length) return { fired: false };
  return { fired: true, blocked: false, contextOut: out.join('\n') + '\n' };
});
