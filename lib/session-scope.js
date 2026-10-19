#!/usr/bin/env node
// lib/session-scope.js — one per-prompt decision for the hooks that print etanah ticket text
// symptom: 2026-10-16 cost scout: about 630k tokens of etanah hook text (OBJECTIVE LOCK, quest mode, codemap advice,
//          ticket list, registers) rode on DawahMap prompts in 6 days; DawahMap DECISIONS.md row 55, his nod 2026-10-18:
//          "May I change those MemoryCore hooks so they stay silent when a prompt is about DawahMap and no ticket is named?"
//          → "Yes, change them (Recommended)"
//          2026-10-19: his DawahMap prompt "So what's left? Have you done everything without stopping so that I can
//          check and give my feedback?" named no project and got all the etanah text (step 5 below closes it)
// goal: a prompt about DawahMap that names no etanah ticket carries none of the etanah ticket text; any prompt that
//       names a ticket or etanah work carries all of it, exactly as before
// goal_signal: on a quiet prompt every guarded hook prints nothing and system/telemetry/hook-fires.jsonl has a
//              'scope-quiet' row per guarded hook; on any other prompt their output is unchanged
// retention: regenerate (no data of its own; one telemetry row per quiet decision in the existing hook-fires stream)
// footprint: in-process, about 2 ms per guarded hook per prompt (one readdir of the project folders), no new process;
//            on a prompt that names nothing, up to 8 MB of this session's transcript read backwards (about 90 ms)
// state-scoped: no — the etanah signal covers every state's permohonan prefix (PT<state>/)
//
// wantsEtanah(input, hook) → false ONLY when the prompt names a quiet project (QUIET, by the aliases in its
// project.json, matched the way project-load matches them) AND carries no etanah signal. Everything else → true:
// no prompt (a SessionStart run, a hand run), an unreadable stdin, a missing project.json, any error.
// Decided per prompt, never from a marker file: the prompt hooks run in parallel, so a marker written on this prompt
// is not seen by the others on this prompt.
// "ticket" alone is NOT an etanah signal: DawahMap's own wayfinder says "ticket 04", "the open ticket".
// Step 5 (2026-10-19): a prompt that names no project and carries no etanah signal ("So what's left?") takes the topic
// of his last typed prompt that had one, read from this session's transcript, newest first, at most TAIL_MAX bytes:
// DawahMap → quiet; an etanah signal or another project → print. No topic in that window → quiet only when the
// session is bound to DawahMap alone in project-load's log. A short "tickets" or "board" message always prints.
// Kill switch: rename this file; every guarded hook fails open and prints as before.
// CLI: node lib/session-scope.js --decide "<prompt>" [--transcript <file>] [--session <id>]   → quiet | print, and why
'use strict';
const fs = require('fs');
const path = require('path');

const QUIET = ['DawahMap'];   // a second project here needs his nod (row 55 names DawahMap only)
const ETANAH_SIGNAL = [
  /(?<!\d)\d{6,8}(?!\d)/,                                        // a ticket number 282303, an aplikasi id 3408184, an engine id 23393230
  /\bPT[A-Z]{2,4}\/\d/,                                          // a permohonan id PTMLK/01/…, PTTRG/02/…, PTPK/18/…
  /\b(?:QA|ADHOC|ALTER|PATCH)-[A-Z0-9]/,                         // a quest or adhoc id QA-285159, ADHOC-PRBB-2026-14
  /\b(?:redmine|e-?tanah|e-?sokongan|urusan|tugasan|permohonan|pelupusan|hakmilik|flowable|bpmn|jboss|pymsoft|melaka|terengganu|stg1|stg2|mlit|mlkstg)\b/i,
  /\b(?:prbb|psbs|pltp|plps|plpsl|mlps|oplps|pptpb|opptpb|plbp|oplbp|pdbb|upnd|ups_plp|hkmlk|sbtm|psjt|sjtlt|pssk|awam)\b/i,   // urusan / tugasan codes, any case
  /\b(?:PLP|PRU|MCL|SKM|PROD)\b/,                                // short codes that are also English letters: upper case only
  /(?:^|\s)\/(?:quest|agih|close-phase|list-redmine|retrieve-redmine|sweep|hotfix|release-mlk-plp|patch-mlk-doc|adhoc-save|adhoc-titles|script-check|bpmn-check|env-check|doc-sim|cross-module-check|review-etanah)\b/i,
];

const TAIL_MAX = Number(process.env.SESSION_SCOPE_TAIL_BYTES) || 8 * 1024 * 1024;
const CHUNK = 512 * 1024;
const SHORT_ASK = /\b(?:tickets|board)\b/i;   // his short asks for the ticket list (open-quest-surfacer MAJOR_RX + "board")
const SHORT_MAX_WORDS = 8;                     // = open-quest-surfacer MAJOR_MAX_WORDS

function readStdin() { try { return process.stdin.isTTY ? '' : fs.readFileSync(0, 'utf8'); } catch (_) { return ''; } }
function parsed(input) {
  let d = input === undefined ? readStdin() : input;
  if (typeof d === 'string') { try { d = JSON.parse(d || '{}'); } catch (_) { return {}; } }
  return d && typeof d === 'object' ? d : {};
}
function projectLoad() { return require(path.join(__dirname, '..', 'domain', 'project-load', 'project.js')); }
// a typed prompt from one transcript line, or null (same filters as project-load's humanPrompts/entryText, minus popups:
// a popup answer answers my question and carries no topic of its own)
function typedPrompt(line) {
  if (!line || line[0] !== '{' || line.indexOf('"type":"user"') < 0 || line.indexOf('"tool_result"') >= 0 || line.length > 1000000) return null;
  let o; try { o = JSON.parse(line); } catch (_) { return null; }
  if (o.type !== 'user' || o.isMeta || o.isCompactSummary || o.isSidechain || o.toolUseResult) return null;
  const origin = o.turnOrigin || o.promptSource || '';
  if (origin && !/^(human|sdk|user|cli)$/.test(origin)) return null;
  const c = o.message && o.message.content;
  let t = typeof c === 'string' ? c : Array.isArray(c) ? c.filter(x => x && x.type === 'text').map(x => x.text).join('\n') : '';
  t = String(t || '').replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();
  const cmd = /<command-name>\s*([^<]+?)\s*<\/command-name>/.exec(t);
  if (cmd) { const a = /<command-args>([\s\S]*?)<\/command-args>/.exec(t); t = (cmd[1].startsWith('/') ? cmd[1] : '/' + cmd[1]) + (a && a[1].trim() ? ' ' + a[1].trim() : ''); }
  if (!t || /^<task-notification>/.test(t) || /^This session is being continued from a previous conversation/.test(t)) return null;
  return t;
}
function topicOf(text, projects) {
  const sig = ETANAH_SIGNAL.find(rx => rx.test(text));
  if (sig) return { quiet: false, what: 'etanah "' + text.match(sig)[0].trim() + '"' };
  const hit = projectLoad().namedIn(text, projects);
  if (!hit.length) return null;
  return { quiet: hit.every(p => QUIET.includes(p.name)), what: hit.map(p => p.name).join(' + ') };
}
// his last typed prompt with a topic, newest first, at most TAIL_MAX bytes back; the prompt being decided is skipped
function lastTopic(file, current) {
  let fd; try { fd = fs.openSync(file, 'r'); } catch (_) { return null; }
  try {
    const projects = projectLoad().listProjects();
    let pos = fs.fstatSync(fd).size, scanned = 0, rest = Buffer.alloc(0);
    while (pos > 0 && scanned < TAIL_MAX) {
      const len = Math.min(CHUNK, pos, TAIL_MAX - scanned); pos -= len; scanned += len;
      const buf = Buffer.alloc(len); fs.readSync(fd, buf, 0, len, pos);
      const data = Buffer.concat([buf, rest]);
      let start = 0;
      if (pos > 0) { const nl = data.indexOf(10); if (nl < 0) { rest = data; continue; } rest = data.subarray(0, nl); start = nl + 1; }
      const lines = data.subarray(start).toString('utf8').split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const t = typedPrompt(lines[i]);
        if (t === null || t === current) continue;
        const topic = topicOf(t, projects);
        if (topic) return topic;
      }
    }
    return null;
  } catch (_) { return null; } finally { try { fs.closeSync(fd); } catch (_) {} }
}
// → { quiet: bool, why: string }; ctx = the hook input ({ transcript_path, session_id }) or {}
function decide(prompt, ctx) {
  if (process.env.SESSION_SCOPE === 'off') return { quiet: false, why: 'SESSION_SCOPE=off' };
  if (!prompt) return { quiet: false, why: 'no prompt' };
  const sig = ETANAH_SIGNAL.find(rx => rx.test(prompt));
  if (sig) return { quiet: false, why: 'etanah signal "' + prompt.match(sig)[0].trim() + '"' };
  const P = projectLoad();
  const named = P.namedIn(prompt, P.listProjects());
  const quietNamed = named.filter(p => QUIET.includes(p.name));
  if (quietNamed.length) return { quiet: true, why: 'names ' + quietNamed[0].name + ', no etanah signal' };
  if (named.length) return { quiet: false, why: 'names ' + named[0].name };
  // step 5: the prompt names nothing
  if (SHORT_ASK.test(prompt) && prompt.trim().split(/\s+/).length <= SHORT_MAX_WORDS) return { quiet: false, why: 'a short ask for the ticket list' };
  const c = ctx || {};
  if (!c.transcript_path && !c.session_id) return { quiet: false, why: 'names no quiet project' };
  const topic = c.transcript_path ? lastTopic(c.transcript_path, prompt.trim()) : null;
  if (topic) return { quiet: topic.quiet, why: 'names nothing; last topic in this session: ' + topic.what };
  const bound = c.session_id ? P.bindings(String(c.session_id)).map(b => b.project) : [];
  if (bound.length && bound.every(p => QUIET.includes(p))) return { quiet: true, why: 'names nothing; no topic in the last ' + Math.round(TAIL_MAX / 1048576) + ' MB; session bound to ' + bound.join(' + ') };
  return { quiet: false, why: 'names nothing; no earlier topic' + (bound.length ? '; session bound to ' + bound.join(' + ') : '') };
}
function wantsEtanah(input, hook) {
  try {
    const data = parsed(input);
    const d = decide(typeof data.prompt === 'string' ? data.prompt : '', data);
    if (!d.quiet) return true;
    try {
      require(path.join(__dirname, 'hook-runtime.js')).appendTelemetry({ ts: new Date().toISOString(), hook: hook || '?', event: 'UserPromptSubmit', mode: 'scope-quiet', exit: 0, blocked: false, fired: false, session_id: data.session_id || null, reason: d.why });
    } catch (_) { /* telemetry never decides */ }
    return false;
  } catch (_) { return true; }   // fail open: print as before
}

module.exports = { wantsEtanah, decide, lastTopic, QUIET, ETANAH_SIGNAL };

if (require.main === module && process.argv[2] === '--decide') {
  const a = process.argv.slice(3); const ctx = {};
  for (const k of ['--transcript', '--session']) { const i = a.indexOf(k); if (i >= 0) { ctx[k === '--transcript' ? 'transcript_path' : 'session_id'] = a[i + 1]; a.splice(i, 2); } }
  const d = (() => { try { return decide(a.join(' '), ctx); } catch (e) { return { quiet: false, why: 'error: ' + e.message }; } })();
  console.log((d.quiet ? 'quiet' : 'print') + ' — ' + d.why);
}
