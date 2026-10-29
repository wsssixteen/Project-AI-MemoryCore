#!/usr/bin/env node
// redmine-write-gate.check.hook.js — born via core/forge.js (2026-09-04), implemented same day
// TRIGGER: a Bash/PowerShell command is about to WRITE to Redmine — a PUT/POST/DELETE/PATCH verb, a request body,
//          or a payload key (issue envelope · notes · status_id · assigned_to_id · done_ratio · journal · uploads)
//          against the Redmine API. A field READ (`i.done_ratio`) is not a write (v1.3).
// ACTION:  BLOCK unless the LAST USER MESSAGE in the transcript is an explicit post approval
//          (post it · post now · Yes, post · [redmine-post-ok]). The note text must have been SHOWN in chat first.
//
// REPLAY (#275847, 2026-09-04): I posted the alter note + reassigned to Ammar on the strength of "Start with the
//   standard Salam Amar" — a WORDING instruction, not a post approval. miya wanted to review first; the journal
//   cannot be edited through the API (PUT /journals/<id>.json → 404), so the wrong wording is permanent.
// NOD: miya 2026-09-04 — "Create a stophook now for me to review your comments first next time."
// Rule this hardens: memory feedback_redmine_write_needs_nod (prose — it did not fire).
//
// state-scoped: no — Redmine host is shared by every state.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.join(__dirname, 'log.jsonl');

// A Redmine WRITE = the redmine host/key is referenced AND a write verb or a request body is present.
// Field names alone (status_id, done_ratio, notes …) are NOT a write: a GET script reads them from the response
// (2026-09-28: `node audit.js` doing http.get + reading i.done_ratio was blocked). v1.3.
const REDMINE_REF = /172\.16\.90\.169\/redmine|REDMINE_BASE|REDMINE_KEY|X-Redmine-API-Key|redmine-sync\.js/i;
const WRITE_VERB = new RegExp([
  /\bmethod\s*[:=]\s*['"]?(?:PUT|POST|DELETE|PATCH)\b/.source,          // fetch / http.request / axios options
  /-X\s*['"]?(?:PUT|POST|DELETE|PATCH)\b|--request[\s=]+['"]?(?:PUT|POST|DELETE|PATCH)\b/.source, // curl
  /-Method\s+['"]?(?:PUT|POST|DELETE|PATCH)\b/.source,                  // Invoke-RestMethod / Invoke-WebRequest
  /\b(?:requests|axios|got|httpx|session)\.(?:put|post|patch|delete)\s*\(/.source, // client verb calls
  /--post-data|--body-data|--method[\s=]+['"]?(?:PUT|POST|DELETE|PATCH)\b/.source, // wget
].join('|'), 'i');
const QUOTED_VERB = /['"](?:PUT|POST|DELETE|PATCH)['"]/;               // req('PUT', …) — uppercase only, a "Post" label stays text
const REQUEST_BODY = new RegExp([
  /-Body\b/.source,                                                    // Invoke-RestMethod -Body
  /\bcurl\b[^\n|;&]*\s(?:-d|--data(?:-raw|-binary|-urlencode)?|-F|--form|-T|--upload-file)\b/.source,
].join('|'), 'i');
// Redmine payload keys, lowercase only so a printed label ('Journal:') stays text. A bare `body:` key is NOT one:
// fetch refuses a body on GET, so a real body always comes with a verb above, and local rows use `body: []`.
// A field written as a KEY (`{ status_id: 2 }`, `"notes":`) still counts — only a READ (`i.done_ratio`, `i['notes']`) is exempt.
const PAYLOAD_KEY = /(?<!\w)["']?issue["']?\s*:\s*\{|(?<![.\w])["']?(?:uploads?|journal|notes|status_id|assigned_to_id|done_ratio)["']?\s*:/;
const isMutation = t => WRITE_VERB.test(t) || QUOTED_VERB.test(t) || REQUEST_BODY.test(t) || PAYLOAD_KEY.test(t);
// Read-only helpers, matched on the basename. ticket-load-verify.js reads only local Task-folder files — its body names
// redmine-sync.js and a /notes:/ parser regex, which blocked every /quest resume (2026-09-25, #256334).
const READ_ONLY_SCRIPT = /(?:^|[\\/])(?:redmine-(?:sync|board|reconcile|status-check)(?:\.eval)?|ticket-load-verify)\.js$/i;
// Every script the command executes — quoted (spaces allowed) or bare path.
const NODE_SCRIPT = /node\s+(?:"([^"]+?\.js)"|'([^']+?\.js)'|([^"'\s]+\.js))/gi;
// What counts as miya's approval — the LAST user message only, never an older turn.
const APPROVAL = /(?<!\b(?:don'?t|do not|jangan|not|never)\s)(?<!\bI (?:will|'ll) )\b(post it|post now|go ahead and post|yes,? post|postkan|hantar (?:note|nota|komen)|\[redmine-post-ok\])\b/i;
const BYPASS = /\[skip-redmine-write-gate:\s*[^\]]+\]/i;
// A status-only write (no note, assignee, % done, journal or upload) may run on a plain "update the redmine" /
// "set status" / "update in progress" from miya — a status can be set back, a note cannot (2026-09-29, #282061).
const NON_STATUS_MUTATION = /assigned_to_id|done_ratio|["']notes["']|\bnotes\s*[:=]|\bjournal\s*:|\buploads?\s*:/i;
const STATUS_APPROVAL = /(?<!\b(?:don'?t|do not|jangan|not|never)\s)\b(?:update|set|change|tukar|kemaskini)\b[^.\n]{0,40}\b(?:redmine|status|in progress)\b/i;
// v1.8 (2026-10-29, system-rules Rule 8): his words come from the ONE shared reader, lib/his-words.js — his typed lines,
// his /goal words, messages sent mid-turn and popup answers; never a skill's text, a reminder, a hook notice or a summary.
// His order stands up to 8 of his messages back until a later hold or refusal; a no counts only in the clause that
// names the action; a question decides nothing. The gate keeps only its own go-words below.
const { decide, HOLD } = require(path.join(ROOT, 'lib', 'his-words.js'));
// v1.4 (2026-09-30, #282555): STAGE-ONLY for a month or until miya lifts it — every Redmine update is staged in the
// browser edit form and stops before Submit. A view-first ask forces staging even after the date.
const STAGE_ONLY_UNTIL = process.env.REDMINE_STAGE_ONLY_UNTIL || '2026-10-30';
const stageOnly = () => new Date().toISOString().slice(0, 10) < STAGE_ONLY_UNTIL;
const VIEW_FIRST = /\b(?:let me (?:see|check|view|review)|(?:view|see|check|review|prepare) (?:it |them |this )?first|show me (?:it )?first|in the same page|stage (?:it|first|only)|stop at staging)\b/i;
// Submit on the staged form needs miya's explicit send approval in his LAST message.
// 2026-10-19 per miya (#285252, "I have to confirm it many times"): plain go-words also approve a staged submit.
// 2026-10-27 per miya (#246964, "add all and its variations"): every go-word and its forms, alone or in a sentence.
// v1.8: + an imperative that names the Redmine ("upload to the redmine", "update the redmine"; "update yourself on the
// redmine" does not match).
const SUBMIT_APPROVAL = /(?<!\b(?:don'?t|do not|jangan|not|never)\s)\b(?:post(?:s|ed|ing)?(?: it| now)?|yes,? post|\[redmine-post-ok\]|I approve|approved?|submit(?:s|ted|ting)?(?: it| now)?|go(?: ahead)?(?: and)? (?:submit|send|post)|go(?: ahead| on)?|proceed|confirm(?:ed)?|yes|yep|yup|ok(?:ay)?|send(?:s|ing)?(?: it| now)?|sent|pass(?:ed)?(?: it)?|do it|push it|hantar(?:kan)?|teruskan|(?:upload|post|submit|send|hantar|update)\s+(?:it\s+)?(?:to\s+|on\s+|in\s+|into\s+)?(?:the\s+)?redmine)\b/i;
// The verbs a no-word must share a clause with to refuse ("don't post it yet"); the reader does the clause work, so
// "do not stop until you've posted" is an order (v1.7 fixed this with a two-word distance; v1.8 uses the clause).
const SUBMIT_ACTION = /\b(?:approve|submit|send|post|pass|proceed|hantar|upload|update)\w*/i;
// "why are you not submitting it" = an order to submit.
const SUBMIT_COMPLAINT = /\bwhy\b[^.?!\n]{0,60}\bnot\s+(?:submit|send|post|pass|hantar)\w*/i;
// A hold on a Redmine write, anywhere in his message: the reader's holds plus "view it first" shapes.
const REDMINE_HOLD = new RegExp(HOLD.source + '|' + VIEW_FIRST.source, 'i');
const hisSubmitWords = tp => decide(tp, { approve: SUBMIT_APPROVAL, action: SUBMIT_ACTION, complaint: SUBMIT_COMPLAINT, hold: REDMINE_HOLD, bypass: BYPASS });
const hisPostWords = (tp, approve, action) => decide(tp, { approve, action, hold: REDMINE_HOLD, bypass: BYPASS });
// A second block of the same action in one task is the gate's defect, not his (Rule 8d): it is logged as a slip.
function repeatBlock(surface) {
  try {
    const cutoff = Date.now() - 30 * 60 * 1000;
    const rows = fs.readFileSync(LOG, 'utf8').trim().split('\n').slice(-40).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
    const prior = rows.filter(r => r.outcome === 'blocked' && r.surface === surface && Date.parse(r.ts) >= cutoff).length;
    if (prior < 1) return prior;
    const row = { ts: new Date().toISOString(), type: 'slip', category: 'gate/repeat-block', qa: null, guard_expected: 'redmine-write-gate', guard_fired: true,
      evidence: `redmine-write-gate blocked ${surface} ${prior + 1} times within 30 min; a repeat block is the gate's defect (system-rules Rule 8d)`, situation: null, action: null, caught_by: 'gate' };
    const slips = process.env.REDMINE_GATE_SLIPS || path.join(ROOT, 'system', 'slips.jsonl');
    fs.appendFileSync(slips, JSON.stringify(row) + '\n');
    return prior;
  } catch (_) { return 0; }
}
// Browser JS: any network call to Redmine (the .json API pops a basic-auth password box; a PUT/POST posts) is banned —
// read the open page's DOM instead. Form submit via JS needs SUBMIT_APPROVAL.
const BROWSER_NET = /\b(?:fetch|XMLHttpRequest|\$\.(?:ajax|get|post|getJSON)|axios)\b/;
const BROWSER_REDMINE_URL = /\/redmine\/|172\.16\.90\.169|\/issues\/[^'"`\s]*\.json|\.json\b[^\n]{0,40}issues/i;
const BROWSER_SUBMIT = /(?:issue-form|name=["']?commit|#issue_notes|issue_status_id)[\s\S]*(?:\.submit\s*\(|requestSubmit|\.click\s*\(\s*\))|(?:\.submit\s*\(|requestSubmit|\.click\s*\(\s*\))[\s\S]*(?:issue-form|name=["']?commit)/i;
const isBrowserTool = n => /(?:claude-in-chrome|Claude_Browser)__(?:javascript_tool|computer|browser_batch)$/.test(String(n || ''));
// v1.5 (2026-10-07, miya: "straight away update the Redmine ticket's Status as In progress IF the status is New"):
// ONE standing-approved API write, the quest-start claim. Exempt only the forge-born script at
// <repo or its worktree>/lib/quest-start-claim.js, only as the EXECUTED script, only while its body stays status-only,
// only when the command text itself carries no mutation. It holds inside the stage-only window too.
const CLAIM_SCRIPT = /(?:^|[\\/])lib[\\/]quest-start-claim\.js$/i;
const CLAIM_PAYLOAD = /\{ issue: \{ status_id: IN_PROGRESS_ID, done_ratio: START_PERCENT \} \}/;
const CLAIM_FORBIDDEN = /assigned_to_id|["']notes["']|\bnotes\s*[:=]|\bjournal\s*:|\buploads?\s*:/i;
const WORKTREE_SEG =/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+/i;
function isStandingClaim(scriptPath, cwd) {
  if (!CLAIM_SCRIPT.test(scriptPath)) return false;
  const abs = path.resolve(cwd || process.cwd(), scriptPath);
  const home = path.join(ROOT.replace(WORKTREE_SEG, ''), 'lib', 'quest-start-claim.js');
  if (path.normalize(abs.replace(WORKTREE_SEG, '')).toLowerCase() !== path.normalize(home).toLowerCase()) return false;
  let body = ''; try { body = fs.readFileSync(abs, 'utf8'); } catch (_) { return false; }
  // v1.6 (2026-10-09, miya: "build it"): the claim also sets % done to 20. Its one payload must be exactly
  // status + done_ratio; a note, assignee, journal or upload key anywhere in the body still voids the exemption.
  return CLAIM_PAYLOAD.test(body) && !CLAIM_FORBIDDEN.test(body);
}

function transcriptTail(p) {
  try {
    const size = fs.statSync(p).size, want = 400000;
    const fd = fs.openSync(p, 'r'); const buf = Buffer.alloc(Math.min(size, want));
    fs.readSync(fd, buf, 0, buf.length, Math.max(0, size - buf.length)); fs.closeSync(fd);
    return buf.toString('utf8');
  } catch (_) { return ''; }
}

// One browser action → 'net' (Redmine API call) | 'submit' (sends the staged form) | '' (staging/reading, fine).
function browserVerdict(name, input, tail) {
  const n = String(name || ''); const ti = input || {};
  if (/browser_batch$/.test(n) || Array.isArray(ti.actions)) {
    for (const a of (ti.actions || [])) { const v = browserVerdict(a && a.name, a && a.input, tail); if (v) return v; }
    return '';
  }
  if (/javascript_tool$/.test(n) || typeof ti.text === 'string') {
    const t = String(ti.text || '');
    if (BROWSER_NET.test(t) && BROWSER_REDMINE_URL.test(t)) return 'net';
    if (BROWSER_SUBMIT.test(t)) return 'submit';
    return '';
  }
  if (/computer$/.test(n) && /click/.test(String(ti.action || '')) && ti.ref) {
    const ref = String(ti.ref).replace(/[^\w]/g, '');
    if (new RegExp(ref + '\\b[^\\n]{0,20}button\\s+\\\\?"(?:Submit|Hantar)\\\\?"', 'i').test(tail)) return 'submit';
  }
  return '';
}

runHook({ name: 'redmine-write-gate', event: 'PreToolUse', log: LOG }, (input) => {
  let data = {};
  try { data = typeof input === 'string' ? JSON.parse(input || '{}') : (input || {}); } catch (_) { return { fired: false }; }
  const ti = data.tool_input || {};
  const logRow = o => { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) { /* never block */ } };

  // v1.4 browser branch — staging (reading the page, setting field values) is always fine.
  if (isBrowserTool(data.tool_name)) {
    const tail = data.transcript_path ? transcriptTail(String(data.transcript_path)) : '';
    const verdict = browserVerdict(data.tool_name, ti, tail);
    if (!verdict) return { fired: false };
    const his = data.transcript_path ? hisSubmitWords(String(data.transcript_path)) : { verdict: 'none', text: '' };
    const lastB = his.text || '';
    if (verdict === 'net') {
      logRow({ outcome: 'blocked', surface: 'browser-net', last_user: lastB.slice(0, 120) });
      return { fired: true, blocked: true, blockReason: [
        '⛔ redmine-write-gate: browser JS is calling the Redmine API (fetch / XHR to /redmine/… .json).',
        '   That URL pops a sign-in password box in miya\'s Chrome, and a PUT/POST from here posts without review.',
        '   Read the OPEN page\'s DOM instead (form fields, .attributes, #history), or run node quest/redmine-sync.js <num>.',
      ].join('\n') };
    }
    if (his.verdict === 'approve') {
      const said = his.via === 'bypass' ? 'bypass' : (lastB.match(SUBMIT_APPROVAL) || lastB.match(SUBMIT_COMPLAINT) || [his.via])[0];
      logRow({ outcome: 'allowed', surface: 'browser-submit', approval: said, back: his.back });
      return { fired: true, blocked: false, contextOut: `redmine-write-gate: Submit approved by miya ("${said}")\n` };
    }
    const prior = repeatBlock('browser-submit');
    logRow({ outcome: 'blocked', surface: 'browser-submit', why: his.verdict === 'deny' ? 'his ' + his.via : 'no order found', last_user: lastB.slice(0, 120), repeat: prior });
    return { fired: true, blocked: true, blockReason: [
      his.verdict === 'deny'
        ? `⛔ redmine-write-gate: miya held or refused this send ("${lastB.replace(/\s+/g, ' ').slice(0, 100)}"). Do not click Submit.`
        : '⛔ redmine-write-gate: this clicks SUBMIT on a staged Redmine form and none of miya\'s last messages orders it.',
      his.verdict === 'deny' ? '' : `   his newest message: "${lastB.replace(/\s+/g, ' ').slice(0, 140) || '(none)'}"`,
      '   STOP AT STAGING: leave every field filled and show him the staged values as a table.',
      '   One word from him unblocks it: any go-word (post it · submit · send · ok · go) or "upload to the redmine".',
      prior ? `   This is block ${prior + 1} of the same send in 30 min: that is this gate's defect, logged as gate/repeat-block.` : '',
    ].filter(Boolean).join('\n') };
  }

  const cmd = String(ti.command || '');
  if (!cmd) return { fired: false };
  // Script files invoked by path — read each one so a write hidden inside a helper is still seen.
  // A read-only helper's body is skipped ONLY when it is invoked as an executed script AND the command itself carries
  // no mutation; every other script body (a chained writer included) and the command text are always scanned.
  // A writer that passes redmine-sync.js as an argument (to borrow the key) is still a writer.
  let body = cmd;
  const cmdClean = !isMutation(cmd);
  let standing = false;
  for (const x of cmd.matchAll(NODE_SCRIPT)) {
    const s = x[1] || x[2] || x[3];
    if (cmdClean && READ_ONLY_SCRIPT.test(s)) continue;
    if (cmdClean && isStandingClaim(s, data.cwd)) { standing = true; continue; }
    try { body += '\n' + fs.readFileSync(s, 'utf8'); } catch (_) { /* absent */ }
  }
  if (!REDMINE_REF.test(body) || !isMutation(body)) {
    // Nothing else in the command writes. The claim script records its own row in log.jsonl when it really changes a ticket.
    if (standing) return { fired: true, blocked: false, contextOut: 'redmine-write-gate: standing approval (miya 2026-10-07): quest-start claim, status New to In Progress only\n' };
    return { fired: false };
  }

  const post = data.transcript_path ? hisPostWords(String(data.transcript_path), APPROVAL, /\b(?:post|hantar)\w*/i) : { verdict: 'none', text: '' };
  const last = post.text || '';
  if (post.via === 'bypass') return { fired: true, blocked: false, contextOut: 'redmine-write-gate: bypassed by miya\n' };
  // v1.4: stage-only window, or miya asked to view first → no API write at all, even with "post it".
  if (stageOnly() || (post.verdict === 'deny' && post.via === 'hold')) {
    const why = stageOnly() ? `STAGE-ONLY until ${STAGE_ONLY_UNTIL} (miya 2026-09-30)` : 'miya asked to view it first';
    logRow({ outcome: 'blocked', surface: 'api-stage-only', why, last_user: last.slice(0, 120) });
    return { fired: true, blocked: true, blockReason: [
      `⛔ redmine-write-gate: ${why} — no Redmine write through the API.`,
      '',
      '   Stage it instead: open the ticket in miya\'s Chrome, fill the EDIT form fields (skill redmine-phase1-prefill),',
      '   show him the staged values as a table, and STOP before Submit. He clicks Submit, or says "I approve" and you click it.',
      '   Never fetch /redmine/…json from the browser (it pops a password box).',
    ].join('\n') };
  }
  if (post.verdict === 'approve') {
    try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), outcome: 'allowed', approval: (last.match(APPROVAL) || [''])[0], back: post.back }) + '\n'); } catch (_) { /* never block */ }
    return { fired: true, blocked: false, contextOut: `redmine-write-gate: approved by miya ("${(last.match(APPROVAL) || [''])[0]}")\n` };
  }
  const status = (/status_id/i.test(body) && !NON_STATUS_MUTATION.test(body) && data.transcript_path)
    ? hisPostWords(String(data.transcript_path), STATUS_APPROVAL, /\b(?:update|set|change|tukar|kemaskini)\w*/i) : { verdict: 'none' };
  if (status.verdict === 'approve' && status.via !== 'bypass') {
    const said = (status.text.match(STATUS_APPROVAL) || [''])[0];
    try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), outcome: 'allowed', approval: 'status-only: ' + said }) + '\n'); } catch (_) { /* never block */ }
    return { fired: true, blocked: false, contextOut: `redmine-write-gate: status-only write approved by miya ("${said}")\n` };
  }
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), outcome: 'blocked', last_user: last.slice(0, 120) }) + '\n'); } catch (_) { /* never block */ }
  return {
    fired: true, blocked: true,
    blockReason: [
      '⛔ redmine-write-gate: this command WRITES to Redmine (note / assignee / status) and miya has not approved THIS post.',
      '',
      `   last user message: "${last.replace(/\s+/g, ' ').slice(0, 140) || '(none)'}"`,
      '',
      '   Redmine journals cannot be edited through the API (PUT /journals/<id>.json → 404) — a wrong post is permanent.',
      '   Do this instead: SHOW the exact note text in chat (fenced), then wait for miya to reply "post it" / "post now" /',
      '   "Yes, post" / [redmine-post-ok]. A wording instruction ("start with Salam …") is NOT an approval.',
      '',
      '   Genuinely approved elsewhere? miya can write [skip-redmine-write-gate: <reason>] in his message.',
    ].join('\n'),
  };
});
