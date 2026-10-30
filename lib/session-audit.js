#!/usr/bin/env node
// session-audit.js — reads ONE session's transcript and lists what went wrong in it, mechanically.
// Domain Expansion's other scripts check that files were saved; this one checks what the session did.
// Read-only: writes nothing, blocks nothing, exit 0 always.
//
//   node lib/session-audit.js                     newest transcript of this folder's project
//   node lib/session-audit.js --transcript <path> [--until "<text>"] [--json]
//
// --until stops at the first user message containing the text (to audit only the turns before it).
// Why (2026-10-30, per miya, design by Fable 5.1): audit of the audit on session 22cc0457: DE's scripts
// caught 0 of 13 failures. Rollback: delete this file + its eval + the DE step 7.4 sentence.
// his-words: not an approval reader — it counts tool results and prompt boundaries, it never decides on his words
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const argOf = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };

function newestTranscript(cwd) {
  const slug = path.resolve(cwd).replace(/[^A-Za-z0-9]/g, '-');
  const dir = path.join(os.homedir(), '.claude', 'projects', slug);
  let files;
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')); } catch (_) { return null; }
  if (!files.length) return null;
  return files.map((f) => path.join(dir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}

function parse(raw) {
  const rows = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch (_) { /* partial last line */ }
  }
  return rows;
}

const textOf = (content) => {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map((c) => (c && c.type === 'text' ? c.text : (c && typeof c.content === 'string' ? c.content
    : (c && Array.isArray(c.content) ? textOf(c.content) : '')))).join('\n');
};

// Flattens the transcript to the events the checks need, in order.
function toEvents(rows, until) {
  const events = [];
  for (const o of rows) {
    if (o.attachment && /^hook_/.test(o.attachment.type || '')) {
      events.push({ kind: 'hook', type: o.attachment.type, event: o.attachment.hookEvent, name: o.attachment.hookName || '',
        text: String(o.attachment.content || o.attachment.stdout || (o.attachment.stderr || '')) });
      continue;
    }
    if (o.type === 'user' && o.message) {
      const c = o.message.content;
      const results = Array.isArray(c) ? c.filter((x) => x && x.type === 'tool_result') : [];
      if (results.length) {
        for (const r of results) events.push({ kind: 'result', id: r.tool_use_id, error: !!r.is_error, text: textOf(r.content), ts: o.timestamp });
        continue;
      }
      const text = textOf(c).replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();
      const hasImage = (Array.isArray(c) && c.some((x) => x && x.type === 'image')) || /\[Image[:\s#]/.test(text);
      if (until && text.includes(until)) break;
      if (o.isMeta) continue;
      if (/^\s*<task-notification>/.test(text)) { events.push({ kind: 'notification', text }); continue; }
      if (/^\s*<(local-command|command-name|system-reminder)/.test(text)) continue;
      events.push({ kind: 'prompt', text, hasImage });
      continue;
    }
    if (o.type === 'assistant' && o.message && Array.isArray(o.message.content)) {
      for (const c of o.message.content) {
        if (c.type === 'text') events.push({ kind: 'say', text: c.text });
        if (c.type === 'tool_use') events.push({ kind: 'tool', id: c.id, name: c.name, input: c.input || {}, ts: o.timestamp });
      }
    }
  }
  return events;
}

const base = (p) => String(p || '').split(/[\\/]/).pop();
const short = (s, n = 90) => { const t = String(s).replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + '…' : t; };

// A hook demands a read when it says so and then lists the files.
function demandedFiles(text) {
  if (!/(MANDATORY READS|Read NOW|READ FIRST|required reads)/.test(text)) return [];
  const out = [];
  const after = text.split(/MANDATORY READS|Read NOW|READ FIRST|required reads/).slice(1).join('\n');
  for (const line of after.split('\n')) {
    const m = line.match(/^\s*(?:\d+[.)]|-)\s+(\S*\.md)\b/);
    if (m) out.push(base(m[1]));
  }
  return out;
}

function audit(events) {
  const findings = [];
  const add = (cls, what, home) => findings.push({ class: cls, what, home });
  const results = new Map(events.filter((e) => e.kind === 'result').map((e) => [e.id, e]));
  const tools = events.filter((e) => e.kind === 'tool');
  const hooks = events.filter((e) => e.kind === 'hook');
  const readsOk = new Set();
  const readsFailed = new Set();
  for (const t of tools) {
    if (t.name !== 'Read') continue;
    const r = results.get(t.id);
    (r && !r.error ? readsOk : readsFailed).add(base(t.input.file_path));
  }

  // 1 + 2: a file a hook demanded was never read; a failed attempt with no block means a gate let it pass.
  const demanded = new Set();
  for (const h of hooks) for (const f of demandedFiles(h.text)) demanded.add(f);
  const missing = [...demanded].filter((f) => !readsOk.has(f));
  for (const f of missing) add('demanded-read-missing', `${f}: a hook demanded it, no successful Read${readsFailed.has(f) ? ' (the attempt failed and was not retried)' : ''}`, 'knowledge');
  const blockedByKnowledgeGate = events.some((e) => e.kind === 'result' && e.error && /knowledge-first-gate/.test(e.text));
  const failedKnowledge = missing.filter((f) => readsFailed.has(f));
  if (failedKnowledge.length && !blockedByKnowledgeGate) add('gate-false-pass', `${failedKnowledge.join(', ')}: read failed, yet no knowledge gate blocked`, 'gate:knowledge-first-gate');

  // 3: the same long command run again.
  const seen = new Map();
  for (const t of tools) {
    const cmd = t.input.command;
    if (typeof cmd !== 'string') continue;
    const key = t.name + ':' + cmd.split('|')[0].replace(/\s+/g, ' ').trim();
    const r = results.get(t.id);
    const secs = r && r.ts && t.ts ? (Date.parse(r.ts) - Date.parse(t.ts)) / 1000 : 0;
    const prev = seen.get(key);
    if (prev && Math.max(prev.secs, secs) >= 60) add('slow-repeat', `run again after ${Math.round(prev.secs)} s: ${short(cmd)}`, 'tool');
    if (!prev) seen.set(key, { secs });
  }

  // 4: database queries that failed or found nothing.
  for (const t of tools) {
    if (!/query_database$/.test(t.name)) continue;
    const r = results.get(t.id);
    if (!r) continue;
    if (r.error || /Error executing query/.test(r.text)) add('query-miss', `query error: ${short(t.input.query)}`, 'knowledge');
    else if (/Results \(0 rows\)/.test(r.text)) add('query-miss', `0 rows: ${short(t.input.query)}`, 'knowledge');
  }

  // 5: an alter ask the alter gate did not see on the first message about it.
  let firstAlterPrompt = -1;
  let firstGate = -1;
  events.forEach((e, i) => {
    if (firstAlterPrompt < 0 && e.kind === 'prompt' && /\balter/i.test(e.text) && (e.hasImage || /PT[A-Z]+\/\d/.test(e.text))) firstAlterPrompt = i;
    if (firstGate < 0 && e.kind === 'hook' && /ALTER-TICKET GATE/.test(e.text)) firstGate = i;
  });
  if (firstAlterPrompt > -1) {
    const nextPrompt = events.findIndex((e, i) => i > firstAlterPrompt && e.kind === 'prompt');
    const late = firstGate < 0 || (nextPrompt > -1 && firstGate > nextPrompt);
    if (late) add('gate-silent', `alter-ticket-gate silent on: ${short(events[firstAlterPrompt].text, 60)}`, 'gate:alter-ticket-gate');
  }

  // 6: an advisory fired and the next reply used no tool.
  events.forEach((e, i) => {
    if (e.kind !== 'hook' || e.type !== 'hook_additional_context' || e.event !== 'Stop') return;
    const m = e.text.match(/([a-z][a-z-]+-gate)/);
    if (!m) return;
    let tool = false; let said = false;
    for (let j = i + 1; j < events.length; j++) {
      if (events[j].kind === 'prompt') break;
      if (events[j].kind === 'tool') { tool = true; break; }
      if (events[j].kind === 'say') said = true;
    }
    if (said && !tool) add('advisory-ignored', `${m[1]} fired, the reply checked nothing`, 'workflow');
  });

  // 7: objective locks injected for quests the message does not name.
  let lockTurns = 0;
  let lastPrompt = '';
  for (const e of events) {
    if (e.kind === 'prompt') lastPrompt = e.text;
    if (e.kind === 'hook' && /OBJECTIVE LOCK/.test(e.text)) {
      const ids = [...e.text.matchAll(/OBJECTIVE LOCK — (\S+)/g)].map((x) => x[1].replace(/^QA-/, ''));
      if (ids.length && !ids.some((id) => lastPrompt.includes(id))) lockTurns++;
    }
  }
  if (lockTurns) add('foreign-lock', `objective locks injected on ${lockTurns} turn(s) for quests the message did not name`, 'gate:quest-objective-anchor');

  // 8: a question to him with no plan picture in the turn.
  let drew = false;
  let asks = 0;
  for (const e of events) {
    if (e.kind === 'prompt') drew = false;
    if (e.kind === 'tool' && typeof e.input.command === 'string' && /diagram-render/.test(e.input.command)) drew = true;
    const asked = (e.kind === 'say' && /\|\s*Your reply\s*\|/.test(e.text)) || (e.kind === 'tool' && e.name === 'AskUserQuestion');
    if (asked && !drew) asks++;
  }
  if (asks) add('ask-no-picture', `${asks} question(s) with no plan picture in the same turn (Disposition 8)`, 'workflow');

  // 9: a hook ordered rows emitted and none appeared.
  if (hooks.some((h) => /EMIT the rows/.test(h.text))) {
    const emitted = events.some((e) => e.kind === 'say' && /\bA4\b.*(✓|⬜)|(✓|⬜).*\bA4\b/.test(e.text));
    if (!emitted) add('emit-missing', 'the alter gate ordered rows A0-A6, none were emitted', 'workflow:alter-ticket-gate');
  }

  // 10: an edit guard refused a Read.
  for (const t of tools) {
    if (t.name !== 'Read') continue;
    const r = results.get(t.id);
    if (r && r.error && /PreToolUse:Read hook error/.test(r.text)) {
      const m = r.text.match(/([a-z-]+-guard|[a-z-]+-gate)/);
      add('read-blocked', `${m ? m[1] : 'a hook'} refused a Read: ${base(t.input.file_path)}`, 'gate');
    }
  }

  // 11: prompt hooks fired on an agent's notification, as if he had typed.
  let notifTurns = 0;
  events.forEach((e, i) => {
    if (e.kind !== 'notification') return;
    for (let j = i + 1; j < events.length && events[j].kind === 'hook'; j++) {
      if (events[j].event === 'UserPromptSubmit') { notifTurns++; break; }
    }
  });
  if (notifTurns) add('notification-as-turn', `prompt hooks fired on ${notifTurns} agent notification(s)`, 'gate');

  return findings;
}

function main() {
  const transcript = argOf('--transcript') || newestTranscript(process.cwd());
  if (!transcript) { console.log('SESSION-AUDIT: no transcript found for this folder'); return; }
  const events = toEvents(parse(fs.readFileSync(transcript, 'utf8')), argOf('--until'));
  const findings = audit(events);
  if (process.argv.includes('--json')) { console.log(JSON.stringify(findings, null, 1)); return; }
  const classes = new Set(findings.map((f) => f.class));
  console.log(`SESSION-AUDIT: ${findings.length} finding(s) in ${classes.size} class(es) · ${path.basename(transcript)}`);
  for (const f of findings) console.log(`  ${f.class} | ${f.what} | home: ${f.home}`);
  if (!findings.length) console.log('  none of the mechanical checks fired; the model still judges wrong theories and wrong tool output');
}

if (require.main === module) main();
module.exports = { audit, toEvents, parse, demandedFiles };
