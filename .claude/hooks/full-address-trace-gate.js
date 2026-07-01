/**
 * full-address-trace-gate.js — Stop hook (advisory)
 *
 * Enforces the FULL-ADDRESS TRACE rule: every code reference in a trace / class
 * chain must be GREPPABLE by みや on his own:
 *   - a file:line must carry its PATH (folder + which repo), never a bare filename
 *     (a bare `penyediaanDokumen.xhtml:291` is un-findable — it lives in etanah-common,
 *      not etanah-pelupusan; QA-267976 2026-07-01).
 *   - a method():line must carry its CLASS  → `Class.method():line`, never a bare method.
 *
 * Built 2026-07-01 per みや: "ALWAYS write the class name. BANNED to start with methods
 *   only. Methods are BANNED to be mentioned alone without class/file names."
 * Fires only when the reply looks like a trace/class-chain (≥2 code refs with :line +
 *   arrows or the words chain/trace). Advisory — lists the offenders to fix.
 * Design: /system-rules + /system-design consulted 2026-07-01 (Stop-side discipline hook,
 *   start-simple advisory, promote to block on evidence). Log: full-address-trace-gate.log.jsonl
 */
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'full-address-trace-gate.log.jsonl');

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail }) + '\n'); } catch (_) {}
}

function lastAssistantText(transcriptPath) {
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split(/\r?\n/);
    for (let i = lines.length - 1; i >= 0; i--) {
      let ev; try { ev = JSON.parse(lines[i]); } catch (_) { continue; }
      if (ev.type === 'assistant' && ev.message && Array.isArray(ev.message.content)) {
        return ev.message.content.filter(p => p.type === 'text').map(p => p.text).join('\n');
      }
    }
  } catch (_) {}
  return '';
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const text = lastAssistantText(data.transcript_path);
    if (!text) process.exit(0);

    // Only fire on trace / class-chain shaped replies.
    const refCount = (text.match(/:\d+\b/g) || []).length;
    const looksLikeTrace = refCount >= 2 && (/[↓→]/.test(text) || /class chain|\btrace\b/i.test(text));
    if (!looksLikeTrace) process.exit(0);

    const offenders = [];

    // (A) bare filename with a line number but NO path (no / or \ before it).
    const fileRe = /(^|[^\w/\\.-])([A-Za-z0-9_-]+\.(?:xhtml|java|js|ts|jsx|tsx|css|scss)):(\d+)/g;
    let m;
    while ((m = fileRe.exec(text)) !== null) {
      offenders.push(`bare file (needs path + repo): ${m[2]}:${m[3]}`);
    }

    // (B) method():line NOT preceded by a Class. → bare method.
    const methRe = /(^|[^.\w])([a-z][A-Za-z0-9_]*)\((?:[^)]*)\):(\d+)/g;
    while ((m = methRe.exec(text)) !== null) {
      offenders.push(`bare method (needs Class.): ${m[2]}():${m[3]}`);
    }

    if (offenders.length === 0) { logFire('clean', { refCount }); process.exit(0); }

    const uniq = [...new Set(offenders)].slice(0, 8);
    logFire('flagged', uniq);
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext: [
          '',
          '⚙️  full-address-trace-gate (ADVISORY): your trace has un-greppable code reference(s) —',
          '   みや must be able to grep straight to each node himself.',
          '   Fix each so it is a FULL address:',
          '     • file → <repo>\\<full\\path>\\<File>.<ext>:<line>  (name which repo — pelupusan vs common vs awam)',
          '     • method → <ClassName>.<method>():<line>  — NEVER a bare method',
          ...uniq.map(o => `   - ${o}`),
          '',
        ].join('\n'),
      },
    }));
    process.exit(0);
  } catch (e) { process.exit(0); }
});
