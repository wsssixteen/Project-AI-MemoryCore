/**
 * veritas-claim-gate.js — Stop hook  (TRUTH layer; sibling to show-gate's FORMAT layer)
 *
 * WHY (root cause, QA-265964 2026-06-19 / built 2026-06-20):
 *   Every existing anti-lying gate keys on TASK-COMPLETION verbs only
 *   (silent-claim-drift-gate.js:34-39 = done|complete|shipped|fixed) and accepts
 *   code-EXISTENCE as backing (diff|commit|file-edited). So a SYSTEM-BEHAVIOUR
 *   assertion — "the data IS saved", "it persists", "the dropdown displays" —
 *   contains NO completion verb, sails through every gate, and is "backed" by a
 *   diff that only proves the code CHANGED, not that the behaviour HAPPENS.
 *   That hole is how "it saves" (a lie — the per-row Kategori had no DB column)
 *   reached みや. Same hole let "I checked GitHub" pass with ZERO web tools run.
 *
 * WHAT THIS DOES — two checks, split by confidence (eval proved hard-blocking
 *   behavioural claims false-positives live, so only the zero-doubt class blocks):
 *
 *   1. EXTERNAL-RESEARCH lie  -> HARD BLOCK (decision:block).
 *      Reply claims an external lookup ("I checked GitHub / searched the web /
 *      did the research") AND zero search tools (WebSearch/WebFetch/gh/curl/
 *      ToolSearch/mcp-search) fired THIS turn -> block. Bypass for genuine recap
 *      of a prior-turn search: [skip-veritas: recap of <which> search].
 *
 *   2. BEHAVIOURAL/runtime claim -> ADVISORY (additionalContext) for now.
 *      Reply asserts the running system saves/persists/displays/loads/populates
 *      with no runtime evidence in the text (DB read-back / server.log / みや test).
 *      Advisory until the structured tool_use_id binder is fixture-validated;
 *      then it flips to block. Disclosed, never silently inert.
 *
 * SAFETY (verified against incumbent block hooks):
 *   - line 1 of handler: if (stop_hook_active) exit(0)  — matches
 *     show-gate.discipline.hook.js + codemap-recon-consult.discipline.hook.js;
 *     re-firing on Stop re-entry IS the infinite-loop bug.
 *   - fail-OPEN on ANY parse error (exit 0). Unreadable transcript -> ABSTAIN,
 *     never a false block (the research block requires a SUCCESSFULLY-parsed turn
 *     showing zero search tools).
 *   - EXEMPT-first (shares show-gate's set) + FRAME classification
 *     (negation / hedge / hand-back / external-env / recap -> abstain) BEFORE any
 *     evidence demand, so closing/personal/hedged/recap turns never trip.
 *
 * Ledger: .claude/state/veritas-claim-ledger.jsonl (one line per fire) — feeds the
 *   validation window that gates the behavioural-advisory -> block flip.
 *
 * meta-layer-audit: this .js MUST be registered in settings.json Stop array at the
 *   MAIN-repo path or it is a ghost. (Built after discovering branch-at-apply-gate.js
 *   was itself a ghost — file in worktree, path in settings pointed at main.)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LEDGER = path.resolve(__dirname, '..', 'state', 'veritas-claim-ledger.jsonl');

const EXEMPT = /\[skip-veritas:|\[skip-show-gate:|═══|るり結界|Domain Expansion/;

// FRAME — honest-by-construction; route to abstain, never block
const FRAME_ABSTAIN = [
  /\b(did|does|do|was|were|is|are|will|has|have|had)\s*n[o']?t\b/i,   // negation
  /\b(never|no longer|not yet)\b/i,
  /\bHYPOTHESIS\b|\bBA-?Q\b/i,
  /\bI (think|suspect|believe|assume|guess|expect)\b|\b(probably|likely|might|may|could|should)\b/i,
  /\bto (verify|test|confirm|check)\b|\bplease (verify|test|check)\b|\b(みや|you) to (verify|test|confirm)\b|\bpending (test|verification)\b/i,
  /\bon (FAT|UAT|staging)\b|\bBA (tested|said|reported|wrote)\b|\bSKM\b/i,
  /\bas (we|you|i) (confirmed|saw|established|found|verified)\b|\bearlier (we|i)\b|\balready (confirmed|verified|shown|established)\b/i,
];

// EXTERNAL-research claims (first person)
const EXTERNAL_RESEARCH_CLAIM = [
  /\bI (checked|searched|looked (up|through|at)|browsed|googled|researched|scanned)\b[^.\n]*\b(github|gitlab|the web|the internet|online|stack ?overflow|npm|the docs|documentation|the registry|the marketplace)\b/i,
  /\bI (did|ran|performed|conducted)\b[^.\n]*\b(a |some |the |web )?(research|web search|internet search|online search|github search)\b/i,
  /\b(web ?search|internet search)\b[^.\n]*\b(found|shows?|says?|returned|confirms?|surfaced)\b/i,
];
const EXTERNAL_TOOL = /^(WebSearch|WebFetch|ToolSearch)$/;
const EXTERNAL_BASH = /\b(gh |git ls-remote|curl |wget |npm (view|search|info)|pip (search|index))/i;
const EXTERNAL_MCP = /mcp__.*(search|fetch|web)/i;

// BEHAVIOURAL / runtime claims
const BEHAVIOURAL_CLAIM = [
  /\b(it|this|the (data|value|field|dropdown|form|record|row|column|page|save|listener|populator|fix))\s+(saves?|is saved|are saved|gets? saved|persists?|is persisted|displays?|is displayed|loads?|renders?|populates?|is populated|fires?)\b/i,
  /\b(saved|persisted|displayed|loaded|populated|rendered|stored|written)\s+(correctly|properly|fine|successfully|as expected|to (the )?(db|database|table|column))\b/i,
  /\bdata (is|gets?) (saved|persisted|stored|written|displayed|loaded)\b/i,
  /\bthe (save|persist|display|load|populate) (works|happens|fires|succeeds|is working)\b/i,
];
const RUNTIME_EVIDENCE = /server\.?log|mcp__postgres|\bSELECT\b[\s\S]{0,120}\bFROM\b|read-?back|screenshot|local_test_confirmed|test (passed|confirmed)|みや (confirmed|tested|verified|screenshot)/i;

function readTurn(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return { ok: false }; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const objs = lines.map(l => { try { return JSON.parse(l); } catch (_) { return null; } });
  let boundary = -1;
  for (let i = objs.length - 1; i >= 0; i--) {
    const o = objs[i]; if (!o) continue;
    const msg = o.message || o;
    if ((msg.role || o.type) !== 'user') continue;
    const c = msg.content;
    const isReal = (typeof c === 'string') || (Array.isArray(c) && c.some(b => b && b.type !== 'tool_result'));
    if (isReal) { boundary = i; break; }
  }
  if (boundary === -1) return { ok: false };
  const tools = [], bash = [];
  let lastText = '';
  for (let i = boundary + 1; i < objs.length; i++) {
    const o = objs[i]; if (!o) continue;
    const msg = o.message || o;
    if ((msg.role || o.type) !== 'assistant') continue;
    const c = msg.content;
    if (Array.isArray(c)) {
      for (const b of c) {
        if (b && b.type === 'tool_use') {
          tools.push(b.name || '');
          if ((b.name === 'Bash' || b.name === 'PowerShell') && b.input && b.input.command) bash.push(String(b.input.command));
        }
        if (b && b.type === 'text' && b.text && b.text.trim()) lastText = b.text;
      }
    } else if (typeof c === 'string' && c.trim()) lastText = c;
  }
  return { ok: true, text: lastText, tools, bash };
}

function logLedger(kind, text) {
  try {
    fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
    fs.appendFileSync(LEDGER, JSON.stringify({ ts: new Date().toISOString(), kind, quote: String(text).slice(0, 240) }) + '\n');
  } catch (_) {}
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    if (data.stop_hook_active) process.exit(0);          // anti-loop, line 1

    const turn = readTurn(data.transcript_path || '');
    if (!turn.ok || !turn.text) process.exit(0);          // parse-fail -> abstain
    const text = turn.text;
    if (text.length < 300) process.exit(0);               // short reply / ack
    if (EXEMPT.test(text)) process.exit(0);

    const framed = FRAME_ABSTAIN.some(re => re.test(text));

    // CHECK 1 — external-research lie -> HARD BLOCK
    if (!framed && EXTERNAL_RESEARCH_CLAIM.some(re => re.test(text))) {
      const searched = turn.tools.some(t => EXTERNAL_TOOL.test(t) || EXTERNAL_MCP.test(t)) ||
                       turn.bash.some(c => EXTERNAL_BASH.test(c));
      if (!searched) {
        logLedger('research-block', text);
        process.stdout.write(JSON.stringify({
          decision: 'block',
          reason: [
            '⛔ veritas-gate: you claimed an EXTERNAL search/research (GitHub / web / docs) but ran ZERO search tools this turn',
            '   (no WebSearch / WebFetch / ToolSearch / gh / curl / mcp-search).',
            '   ACTUALLY run the search now and cite the real result — OR, if recapping a search from a PRIOR turn,',
            '   add [skip-veritas: recap of <which> prior search]. Claiming a lookup you did not perform is the lie this gate stops.',
          ].join('\n'),
        }));
        process.exit(0);
      }
    }

    // CHECK 2 — behavioural/runtime claim with no runtime evidence -> ADVISORY
    if (!framed && BEHAVIOURAL_CLAIM.some(re => re.test(text)) && !RUNTIME_EVIDENCE.test(text)) {
      logLedger('behavioural-advisory', text);
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'Stop',
          additionalContext: [
            '⚙️  veritas-gate (ADVISORY — TRUTH layer): you asserted the running system DOES something',
            '   (saves / persists / displays / loads / populates) with no runtime evidence in the reply.',
            '   A diff or a code Read proves the CODE EXISTS — NOT that the behaviour HAPPENS. Bind it to runtime proof:',
            '     • a DB read-back (mcp__postgres SELECT showing the value landed)  • a server.log line  • みや test confirmation',
            '   …or downgrade to HYPOTHESIS and hand the test back to みや.',
            '   (Advisory now; flips to hard-block once the structured binder is fixture-validated.)',
          ].join('\n'),
        },
      }));
      process.exit(0);
    }

    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-OPEN
  }
});
