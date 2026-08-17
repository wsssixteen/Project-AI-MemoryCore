/**
 * attachment-ledger-gate.check.hook.js — Stop hook (BLOCKING)
 * Power: domain/attachment-ledger-gate/  ·  born via core/forge.js 2026-08-17
 *
 * WHY (みや 2026-08-17, QA-275009): diagnosed a ticket (Recon+Rubric) after
 *   opening only 5 of 11 files in `0. Brief/` — skipping the 6 that did not
 *   match my code theory "to save tokens". The skipped tail carried BA's most
 *   explicit instructions (C8: "rujuk UAT-CR #233646 untuk template 3 sign" +
 *   PPD-slot sign/nama overwrite note; C3: strikethrough-reflect requirement).
 *   Same miss occurred in the earlier sweep. The two existing hooks
 *   (multi-dim-evidence-gate.js, attachment-context.trigger.hook.js) are
 *   ADVISORY injectors — headers state they CANNOT block — so the silent skip
 *   survived. Slip: evidence-read. This gate promotes that advisory to a BLOCK.
 *
 * WHAT: fires at Stop. HARD-BLOCKS when ALL hold:
 *   (a) assistant text this session contains a quest-DIAGNOSIS emit
 *       (Recon/Rubric/Scout/root cause/blast-radius/reconcile/fix direction/Predicate);
 *   (b) an active-quest (status=active) whose QA-number appears in assistant
 *       text has a NON-EMPTY `0. Brief/` with VISUAL attachments (image/pdf/doc/video);
 *   (c) >=1 such attachment's EXACT filename is absent from assistant text.
 *
 * ANTI-LOOP: stop_hook_active -> exit. Bypass: [skip-attachment-ledger: <reason>].
 * Fail-OPEN on any error. Log: domain/attachment-ledger-gate/log.jsonl.
 * CANNOT: verify the ledger LINE is accurate (presence-of-filename only). It
 *   kills the SILENT skip, not a lazy summary. Eval: attachment-ledger-gate.eval.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const LOG = path.resolve(__dirname, 'log.jsonl');
const projectRoot = path.resolve(__dirname, '..', '..');
const activePath = process.env.ATTACH_LEDGER_ACTIVE_TXT || path.join(projectRoot, 'quest', 'active.txt');

const DIAGNOSIS = /\b(Recon|Rubric|Scout|root cause|blast[- ]radius|reconcile|fix direction|fix shape|Predicate)\b/i;
const BYPASS = /\[skip-attachment-ledger:\s*[^\]]+\]/i;
const VISUAL = /\.(png|jpe?g|pdf|docx?|mp4|mov|avi|mkv|webp)$/i;

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail }) + '\n'); } catch (e) { /* best effort */ }
}

function textFromContent(c) {
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.filter(b => b && b.type === 'text' && typeof b.text === 'string').map(b => b.text).join('\n');
  return '';
}

function parseTranscript(p) {
  let raw;
  try { raw = fs.readFileSync(p, 'utf8'); } catch (e) { return null; }
  const assistantTexts = [];
  for (const line of raw.split(/\r?\n/).filter(Boolean)) {
    let obj; try { obj = JSON.parse(line); } catch (e) { continue; }
    const msg = obj.message || obj;
    const role = msg.role || obj.type;
    const text = textFromContent(msg.content);
    if (role === 'assistant' && text.trim()) assistantTexts.push(text);
  }
  return { raw, assistantText: assistantTexts.join('\n') };
}

function activeQuests() {
  let t;
  try { t = fs.readFileSync(activePath, 'utf8'); } catch (e) { return []; }
  const out = [];
  for (const block of t.split(/\n(?=qa=)/)) {
    const lines = block.split(/\r?\n/);
    const qa = (lines[0] || '').trim().replace(/^qa=/, '');
    if (!/^QA-\d+/.test(qa)) continue;
    if (!lines.some(l => l.trim() === 'status=active')) continue;
    const tfLine = lines.find(l => l.startsWith('task_folder='));
    if (!tfLine) continue;
    out.push({ qa, num: qa.replace(/^QA-/, ''), taskFolder: tfLine.slice('task_folder='.length).trim() });
  }
  return out;
}

function briefVisuals(taskFolder) {
  try {
    return fs.readdirSync(path.join(taskFolder, '0. Brief')).filter(f => !f.startsWith('.') && VISUAL.test(f));
  } catch (e) { return []; }
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    if (data.stop_hook_active) process.exit(0);

    const t = parseTranscript(data.transcript_path || '');
    if (!t) process.exit(0);
    if (BYPASS.test(t.raw)) { logFire('bypassed'); process.exit(0); }
    if (!DIAGNOSIS.test(t.assistantText)) { logFire('skipped-no-diagnosis'); process.exit(0); }

    const missingByQuest = [];
    for (const q of activeQuests()) {
      if (!t.assistantText.includes(q.qa) && !t.assistantText.includes(q.num)) continue;
      const files = briefVisuals(q.taskFolder);
      if (!files.length) continue;
      const missing = files.filter(f => !t.assistantText.includes(f));
      if (missing.length) missingByQuest.push({ qa: q.qa, missing });
    }

    if (!missingByQuest.length) { logFire('passed'); process.exit(0); }

    const reasonLines = ['BLOCKED — attachment-ledger: a quest was diagnosed but not every 0. Brief/ attachment was opened + ledgered this session.'];
    for (const m of missingByQuest) {
      reasonLines.push('   ' + m.qa + ' — ' + m.missing.length + ' un-ledgered file(s):');
      m.missing.forEach(f => reasonLines.push('      ⬜ ' + f));
    }
    reasonLines.push('   Open EACH missing file, emit 1 line citing its EXACT filename + content/annotation, then re-send.');
    reasonLines.push('   Filename-based / theory-based prioritization is BANNED. Genuinely N/A? [skip-attachment-ledger: <reason>]');
    logFire('blocked', missingByQuest);
    process.stdout.write(JSON.stringify({ decision: 'block', reason: reasonLines.join('\n') }));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
