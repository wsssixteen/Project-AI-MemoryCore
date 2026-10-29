#!/usr/bin/env node
/**
 * lib/his-words.js — the ONE reader of what miya himself said (Kernel; born 2026-10-29).
 *
 * symptom: 2026-10-29 five browser Submits he had ordered were refused in 8 minutes (redmine-write-gate log.jsonl
 *          14:01-14:09 UTC), and four commits of 286646 were refused after he had waived the local test. Every gate
 *          read "the last user line" of the transcript with its own copy of a reader (7 copies, 7 different
 *          exclusions): a loaded skill's text, a system-reminder, a Stop-hook notice and a /goal condition each counted
 *          as his last message, and "do not stop until you've posted" read as a refusal. miya: "find a universal
 *          solution ... so that you DO NOT EVER build a step or workflow or gate ... like this ever again".
 * goal: a gate that needs his approval finds the order he already gave, in his own words, wherever it sits in the
 *       current ask, and never makes him say it twice (system-rules Rule 8).
 * goal_signal: `node lib/his-words.js --audit` lists no gate with its own transcript reader; the eval replays the
 *              2026-10-29 refusals and each one is let through on his first order.
 * retention: none (reads transcripts, writes nothing).
 * footprint: none: a library required in-process by the gates; `--audit` is one node process on demand, exits.
 * self_audit: `--audit` reads every gate file back from disk and fails when one parses user lines itself.
 * state-scoped: no, state-agnostic.
 * rollback: delete lib/his-words.js + lib/his-words.eval.js + lib/his-words.diagram.*; each gate keeps its own
 *           reader in git history (b566ef72 and before); drop system-rules Rule 8 and the design-consult-gate rider.
 *
 * API
 *   hisMessages(transcriptPath, { limit = 12, tailBytes = 600000 })
 *       → his messages, newest first: [{ text, kind, ts, back }]
 *         kind 'typed' (a prompt) · 'command' (the arguments of a slash command he typed, e.g. /goal <words>)
 *              'queued' (a message sent while I worked) · 'popup' (his AskUserQuestion answers, answers only)
 *         Never his: a system-reminder, a task notice, hook feedback, a loaded skill's text, a /goal notice, a
 *         compaction summary, tool output, anything `isMeta`. Embedded <system-reminder> blocks are cut out.
 *   lastHis(transcriptPath) → the newest text he wrote, '' when none
 *   decide(transcriptPath, { approve, action, deny, hold, complaint, bypass, limit = 8 })
 *       → { verdict: 'approve' | 'deny' | 'none', text, kind, back, via }
 *       Newest message first; the first message that approves, denies or holds decides (so a later "wait" beats an
 *       earlier "go", and an earlier "go" still counts under a later question or an unrelated line).
 *       approve  RegExp: his go on the action ("post it", "submit", "go ahead").
 *       action   RegExp: the action verbs; a negation (deny) counts only inside the clause that names the action,
 *                so "do not stop until you've posted" is an order to post, "don't post it yet" is a refusal.
 *       hold     RegExp: a hold anywhere in the message ("wait", "not yet", "let me see it first").
 *       complaint RegExp: a question that is an order ("why are you not submitting it").
 *       A question clause decides nothing. A popup answer always decides: approve, else deny. bypass (RegExp) wins.
 *   clauses(text) → the clauses of a message (split at . ! ? ; , newline and until/unless/before/after/then).
 *   isInjected(text) → true for a line the app wrote, not him.
 *   audit(root) → [{ file, line, text }] gate files that parse user lines themselves without requiring this module.
 *
 * CLI
 *   node lib/his-words.js --audit [root]            exit 0 clean · 1 one or more own readers listed
 *   node lib/his-words.js --last <transcript.jsonl>  prints his messages newest first (debug)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');

// A user-role line the app wrote. His own prompt never starts like this.
const INJECTED = /^\s*(?:<system-reminder>|<task-notification|<side-sessions-event|<ci-monitor-event|<local-command|<user-prompt-submit-hook>|<command-message>|Stop hook feedback|Base directory for this skill:|A session-scoped Stop hook is now active|\[Request interrupted|Launching skill:|This session is being continued from a previous conversation|Your task is to create a detailed summary)/i;
const REMINDER_BLOCK = /<system-reminder>[\s\S]*?<\/system-reminder>/g;
const COMMAND_LINE = /<command-name>[\s\S]*?<\/command-name>/;
const COMMAND_ARGS = /<command-args>([\s\S]*?)<\/command-args>/;
const POPUP_ANSWER = /^\s*Your questions have been answered:/;
// Defaults a gate may override. A negation denies only beside the action it names.
const NEGATION = /\b(?:don'?t|do not|does not|never|jangan|tak|tidak|stop)\b/i;
// A hold is a decision on its own, wherever it sits in the message.
const HOLD = /\b(?:not yet|wait|hold on|hold it|belum lagi|tunggu|nanti dulu)\b|\b(?:let me (?:see|check|view|review|read)|(?:view|see|check|review|read|prepare) (?:it |them |this )?first|show me (?:it )?first|stop at staging|stage (?:it|first|only))\b|\bI(?:'ll| will) (?:\w+ ){0,2}(?:it |that )?myself\b/i;
// A question: a wh-word, or an auxiliary followed by its subject ("can you", "did it"). "do not post" is not a question.
const QUESTION_START = /^\s*(?:why|how|what|where|who|which|when|kenapa|mengapa|bagaimana|adakah|bolehkah|macam mana)\b|^\s*(?:is|are|was|were|do|does|did|can|could|should|would|will|shall|have|has|am|isn'?t|aren'?t|doesn'?t|didn'?t|won'?t)\s+(?:you|we|i|it|he|she|they|this|that|there|u|ur|your|the)\b/i;
// A clause ends at a sentence mark or a subordinator. A comma does not split: "Yes, post it" and
// "do not ever, under any case, post" are each one clause.
const CLAUSE_SPLIT = /[.!?\n;]+|\b(?:until|unless|before|after|then|so that|sehingga|sebelum|selepas|kemudian)\b/i;

function readTail(p, want) {
  try {
    const size = fs.statSync(p).size;
    const n = Math.min(size, want || 600000);
    const fd = fs.openSync(p, 'r'); const buf = Buffer.alloc(n);
    fs.readSync(fd, buf, 0, n, Math.max(0, size - n)); fs.closeSync(fd);
    return buf.toString('utf8');
  } catch (_) { return ''; }
}

function isInjected(text) { return INJECTED.test(String(text || '')); }

// His words out of one user-role entry; '' when the entry carries none.
function ownText(obj) {
  if (!obj || obj.type !== 'user' || obj.isMeta === true) return { text: '', kind: '' };
  const c = obj.message && obj.message.content;
  let text = '';
  if (typeof c === 'string') text = c;
  else if (Array.isArray(c)) {
    text = c.filter(x => x && x.type === 'text' && typeof x.text === 'string').map(x => x.text).join('\n');
    if (!text) {
      for (const x of c) {                                      // a popup answer IS his reply (answers only)
        if (!x || x.type !== 'tool_result') continue;
        const t = typeof x.content === 'string' ? x.content
          : Array.isArray(x.content) ? x.content.filter(y => y && y.type === 'text').map(y => y.text).join('\n') : '';
        if (POPUP_ANSWER.test(t)) return { text: [...t.matchAll(/"="([^"]*)"/g)].map(m => m[1]).join('\n'), kind: 'popup' };
      }
      return { text: '', kind: '' };
    }
  } else return { text: '', kind: '' };
  text = text.replace(REMINDER_BLOCK, '').trim();
  if (!text) return { text: '', kind: '' };
  if (COMMAND_LINE.test(text)) {                                // a slash command: his words are its arguments
    const m = COMMAND_ARGS.exec(text);
    return { text: m ? m[1].trim() : '', kind: 'command' };
  }
  if (isInjected(text)) return { text: '', kind: '' };
  return { text, kind: 'typed' };
}

function hisMessages(transcriptPath, opts) {
  const o = opts || {};
  const limit = o.limit || 12;
  const out = [];
  if (!transcriptPath) return out;
  const lines = readTail(String(transcriptPath), o.tailBytes).split('\n');
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
    const l = lines[i];
    if (!/"type"\s*:\s*"(?:user|attachment)"/.test(l)) continue;
    let obj; try { obj = JSON.parse(l); } catch (_) { continue; }
    if (obj && obj.type === 'attachment') {
      const a = obj.attachment;
      if (a && a.type === 'queued_command' && typeof a.prompt === 'string' && a.prompt.trim() && (!a.origin || a.origin.kind === 'human')) {
        out.push({ text: a.prompt.trim(), kind: 'queued', ts: obj.timestamp || null, back: out.length });
      }
      continue;
    }
    const w = ownText(obj);
    if (w.text) out.push({ text: w.text, kind: w.kind, ts: obj.timestamp || null, back: out.length });
  }
  return out;
}

function lastHis(transcriptPath, opts) {
  const m = hisMessages(transcriptPath, Object.assign({ limit: 1 }, opts || {}));
  return m.length ? m[0].text : '';
}

function clauses(text) {
  return String(text || '').split(CLAUSE_SPLIT).map(s => s.trim().replace(/^[,\s]+|[,\s]+$/g, '')).filter(Boolean);
}
const isQuestion = clause => QUESTION_START.test(clause) || /\?\s*$/.test(clause);

// Judge one message. Returns 'approve' | 'deny' | 'none' and how.
function judge(msg, o) {
  const text = msg.text;
  if (o.bypass && o.bypass.test(text)) return { verdict: 'approve', via: 'bypass' };
  if (msg.kind === 'popup') return o.approve && o.approve.test(text) ? { verdict: 'approve', via: 'popup' } : { verdict: 'deny', via: 'popup' };
  const hold = o.hold === undefined ? HOLD : o.hold;
  if (hold && hold.test(text)) return { verdict: 'deny', via: 'hold' };
  const neg = o.deny === undefined ? NEGATION : o.deny;
  let approved = null;
  for (const cl of clauses(text)) {
    if (o.complaint && o.complaint.test(cl)) { approved = approved || { verdict: 'approve', via: 'complaint' }; continue; }
    if (isQuestion(cl)) continue;                               // a question decides nothing
    if (neg && o.action && neg.test(cl) && o.action.test(cl)) return { verdict: 'deny', via: 'negation' };
    if (o.approve && o.approve.test(cl)) approved = approved || { verdict: 'approve', via: 'go', said: (cl.match(o.approve) || [''])[0] };
  }
  return approved || { verdict: 'none' };
}

function decide(transcriptPath, opts) {
  const o = opts || {};
  const msgs = hisMessages(transcriptPath, { limit: o.limit || 8, tailBytes: o.tailBytes });
  for (const m of msgs) {
    const j = judge(m, o);
    if (j.verdict !== 'none') return Object.assign({ text: m.text, kind: m.kind, back: m.back, ts: m.ts }, j);
  }
  return { verdict: 'none', text: msgs.length ? msgs[0].text : '', kind: msgs.length ? msgs[0].kind : '', back: -1 };
}

// ── audit: no gate reads user lines by itself ───────────────────────────────────────────────────────────────
const OWN_READER = /"type"[^\n]{0,12}"user"|\b(?:type|role)\b[^\n]{0,10}(?:===|!==|==|!=)[^\n]{0,4}['"]user['"]|queued_command|questions have been answered|\bisMeta\b/;
const USES_THIS = /his-words(?:\.js)?['"]/;
const DECIDES = /POPUP_ANSWER|questions have been answered|queued_command|\blast_?[uU]ser\w*\s*(?:=[^=]|\()|function\s+(?:last\w*|readSession|userText|hisWords)\s*\(|his (?:own )?(?:last|latest) (?:chat |typed )?message|\b(?:LAST|latest) (?:user |chat )?message|NOT_A_TURN_START/i;
// A file that reads user lines for another purpose (a turn boundary, a prompt count, monitoring) says so in one
// comment line and is exempt: `// his-words: not an approval reader — <purpose>`.
const NOT_APPROVAL = /\/\/\s*his-words:\s*not an approval reader/i;
function auditFile(file) {
  let src; try { src = fs.readFileSync(file, 'utf8'); } catch (_) { return null; }
  if (USES_THIS.test(src) || NOT_APPROVAL.test(src)) return null;
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) if (OWN_READER.test(lines[i])) return { file, line: i + 1, text: lines[i].trim().slice(0, 100) };
  return null;
}
function auditTargets(root) {
  const out = [];
  const add = d => { let es = []; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch (_) { return; }
    for (const e of es) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'node_modules') add(p); } else if (/\.js$/.test(e.name) && !/\.eval\.js$|eval\.workflow\.js$/.test(e.name)) out.push(p); } };
  add(path.join(root, 'domain'));
  add(path.join(root, '.claude', 'hooks'));
  return out;
}
function audit(root) {
  const r = root || ROOT;
  const hits = [];
  for (const f of auditTargets(r)) {
    // Only files that DECIDE on his words: they keep his last text, read a popup answer or a queued message, or say
    // "his last message". A turn-boundary reader (`if (role === 'user') break;`) or a prompt counter is not one.
    let src = ''; try { src = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
    if (!DECIDES.test(src)) continue;
    const h = auditFile(f);
    if (h) hits.push({ file: path.relative(r, h.file).replace(/\\/g, '/'), line: h.line, text: h.text });
  }
  return hits;
}

module.exports = { hisMessages, lastHis, decide, judge, clauses, isInjected, audit, NEGATION, HOLD, OWN_READER };

if (require.main === module) {
  const a = process.argv.slice(2);
  if (a[0] === '--audit') {
    const hits = audit(a[1] ? path.resolve(a[1]) : ROOT);
    if (!hits.length) { console.log('HIS-WORDS: OK no gate reads user lines by itself'); process.exit(0); }
    console.log('HIS-WORDS: FAIL ' + hits.length + ' gate(s) parse user lines themselves (system-rules Rule 8: require lib/his-words.js):');
    for (const h of hits) console.log('  ' + h.file + ':' + h.line + '  ' + h.text);
    process.exit(1);
  }
  if (a[0] === '--last' && a[1]) {
    for (const m of hisMessages(a[1], { limit: 12 })) console.log(`[${m.back}] ${m.kind} ${m.ts || ''} | ${m.text.replace(/\s+/g, ' ').slice(0, 140)}`);
    process.exit(0);
  }
  console.error('usage: node lib/his-words.js --audit [root] | --last <transcript.jsonl>'); process.exit(2);
}
