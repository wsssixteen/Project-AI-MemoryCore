// proposal-judge.js — Stop-side judge for domain/design-consult-gate (added 2026-09-30).
// Called by design-consult-gate.gate.hook.js when hook_event_name === 'Stop'.
// A reply that PROPOSES a system component (new hook / gate / skill / Feature / check, placement,
// "where it lives" — in text or an AskUserQuestion this turn) is blocked when:
//   (1) system-rules or system-design was not invoked this session;
//   (2) it has no `UNIVERSAL:` line naming the class of cases the rule covers;
//   (3) the UNIVERSAL line names one specific case (ticket number, permohonan id, etanah class,
//       CONSTANT_NAME, screen/tugasan/urusan kod) — the case belongs in eval fixtures, not the rule.
// Bypass: [skip-design-proposal: <real reason>] in the CURRENT reply ("<reason>" never counts).
'use strict';
const fs = require('fs');

const MAX_BYTES = 20 * 1024 * 1024;
// Future-tense build intent (reports of past work never match).
const PROPOSE_RE = /\b(?:I(?:'d|'ll| would| will| can) (?:build|put|add|place|create|register|wire|make)|I recommend|placement(?=\s*[:?])|where (?:should|will|would|does) (?:it|this|the(?: [\w-]+)? (?:check|gate|rule|hook|skill)) (?:live|sit|go|fire)|where (?:it|this|the(?: [\w-]+)? (?:check|gate|rule|hook|skill)) (?:will |should )?(?:live|lives|sit|sits|go|goes)(?=\s*\?)|(?:the|a) (?:universal|mechanical|static)(?: \w+)? (?:rule|check))/i;
// A concrete system location must be named, so ordinary replies that say "check" or "gate" stay silent.
const SYSPATH_RE = /domain[\\/][\w.-]+|\.claude[\\/](?:hooks|skills)|settings\.json|\.hook\.js|SKILL\.md|pre-code-check|Stop hook|PreToolUse|new (?:hook|gate|Feature|skill)\b/i;
const COMPONENT_RE = /\b(?:hook|gate|skill|Feature|bundle|eval|pre-code-check|PreToolUse|Stop hook|SKILL\.md|settings\.json)\b/gi;
const UNIVERSAL_RE = /^[ \t]*[*_>-]*[ \t]*\**UNIVERSAL:\**[ \t]*(.+)$/im;
const BYPASS_RE = /\[skip-design-proposal:\s*([^\]<>]{3,})\]/i;
const CAPS_OK = new Set(['UNIVERSAL', 'README', 'NUKE', 'MARKER', 'SKILL', 'CLAUDE', 'JSON', 'SUBMIT', 'PATH', 'DEPLOY', 'REDMINE', 'ETANAH', 'MEMORY', 'HANTAR', 'SIMPAN', 'AWAM', 'PROD', 'XHTML', 'JAVA', 'BPMN', 'MLIT', 'EVERY', 'ONLY', 'NEVER']);

function specificTokens(line) {
  const hits = [];
  const add = (re) => { let m; while ((m = re.exec(line))) hits.push(m[0]); };
  add(/#?\b\d{6}\b/g);                                                        // ticket number
  add(/\bPT[A-Z]{3}\/\S+/g);                                                  // permohonan id
  add(/\b(?:Mlk|Prk|Pelupusan|Awam)[A-Z]\w*(?:Form|Constant|Helper|Service|Bean)\b/g); // etanah class
  add(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g);                                  // CONSTANT_NAME
  let m; const kod = /\b[A-Z]{4,10}\b/g;                                      // screen / tugasan / urusan kod
  while ((m = kod.exec(line))) if (!CAPS_OK.has(m[0])) hits.push(m[0]);
  return [...new Set(hits)];
}

function readTranscript(p) {
  let fd;
  try {
    const st = fs.statSync(p);
    fd = fs.openSync(p, 'r');
    const len = Math.min(st.size, MAX_BYTES);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, st.size - len);
    return buf.toString('utf8');
  } catch (_) { return null; } finally { if (fd !== undefined) try { fs.closeSync(fd); } catch (_) {} }
}

function judge(raw) {
  let hasSR = false, hasSD = false;
  let turn = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let obj; try { obj = JSON.parse(line); } catch (_) { continue; }
    const msg = obj.message || obj;
    const role = msg.role || obj.type;
    const c = msg.content;
    if (role === 'user') {
      if (/Launching skill: system-rules\b/.test(line)) hasSR = true;
      if (/Launching skill: system-design\b/.test(line)) hasSD = true;
      const genuine = typeof c === 'string' ? c.trim().length > 0
        : Array.isArray(c) && !c.some(b => b && b.type === 'tool_result')
          && c.some(b => b && b.type === 'text' && b.text && b.text.trim() && !/^Base directory for this skill:/.test(b.text));
      if (genuine) turn = [];
    } else if (role === 'assistant') {
      if (typeof c === 'string') { turn.push(c); continue; }
      if (!Array.isArray(c)) continue;
      for (const b of c) {
        if (!b) continue;
        if (b.type === 'tool_use' && b.name === 'Skill' && b.input) {
          if (b.input.skill === 'system-rules') hasSR = true;
          if (b.input.skill === 'system-design') hasSD = true;
        }
        if (b.type === 'text' && b.text) turn.push(b.text);
        if (b.type === 'tool_use' && b.name === 'AskUserQuestion') turn.push(JSON.stringify(b.input || {}));
      }
    }
  }
  const reply = turn.join('\n');
  if (reply.length < 150) return { fired: false };
  if (BYPASS_RE.test(reply)) return { fired: true, bypassed: true };
  const comps = (reply.match(COMPONENT_RE) || []).length;
  if (!PROPOSE_RE.test(reply) || !SYSPATH_RE.test(reply) || comps < 2) return { fired: false };
  const problems = [];
  if (!hasSR || !hasSD) problems.push('consult missing: ' + [!hasSR && 'system-rules', !hasSD && 'system-design'].filter(Boolean).join(' + ') + ' not invoked this session');
  const u = reply.match(UNIVERSAL_RE);
  if (!u) problems.push('no UNIVERSAL: line');
  else if (/[<>]/.test(u[1])) problems.push('UNIVERSAL line is a placeholder (contains < >)');
  else {
    const t = specificTokens(u[1]);
    if (t.length) problems.push('UNIVERSAL line names one case: ' + t.join(', '));
  }
  const trigger = (reply.match(PROPOSE_RE) || [''])[0] + ' + ' + (reply.match(SYSPATH_RE) || [''])[0];
  return problems.length ? { fired: true, blocked: true, problems, trigger } : { fired: true, blocked: false, trigger };
}

function blockText(problems) {
  return [
    '⛔ design-consult-gate (proposal): this reply proposes a system component but fails:',
    ...problems.map(p => '   - ' + p),
    '   1. Invoke system-rules and system-design via the Skill tool (if missing), then redo the proposal.',
    '   2. Add one line:  UNIVERSAL: <the class of cases this covers, e.g. any screen change in any etanah module>',
    '      No ticket number, permohonan id, class name, constant or kod on that line; the founding case goes in eval fixtures.',
    '   Not a design proposal? add [skip-design-proposal: <why>] with a real reason.',
  ].join('\n') + '\n';
}

module.exports = { judge, specificTokens, readTranscript, blockText };
