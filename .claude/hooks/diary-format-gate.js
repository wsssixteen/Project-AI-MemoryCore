/**
 * diary-format-gate.js — Stop hook
 *
 * Validates structural integrity of the day's diary entry after Domain Expansion
 * closes. The diary template is locked at 3 H2 sections (Sessions / Index /
 * Closing) per `daily-diary/diary-format.md`; this gate catches silent
 * regressions where DE step 4 produces an entry missing one or more sections.
 *
 * Trigger: presence of the DE closing banner text in the Stop event payload
 * ("Domain Expansion — closed" OR "Barrier settles. Quest threads are at rest").
 *
 * Behavior: WARN-only via `hookSpecificOutput.additionalContext`. Never blocks
 * DE close (exit code always 0). Voice quality is NOT measurable enough to
 * block on, and blocking would recreate the rush-pressure that originally
 * caused the voice drift.
 *
 * Created 2026-05-26 — Phase 1 of diary redesign per
 * `~/.claude/plans/yes-very-much-catches-squishy-cake.md`.
 *
 * NOTE: meta-layer-audit hook will catch this if registered but never firing.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DE_CLOSE_PATTERNS = [
  /Domain Expansion — closed/,
  /Domain Expansion -- closed/,
  /Barrier settles\. Quest threads are at rest/,
  /💠 るり結界.+Barrier settles/s,
];

const REQUIRED_SECTIONS = ['## Sessions', '## Index', '## Closing'];

// Find the project root by walking up from CWD until we find .claude/
function findProjectRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(path.join(dir, '.claude'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

// Find the most-recently-modified .md file in daily-diary/current/
// (TZ-safe — sidesteps date math; DE step 4 just wrote it)
function findLatestDiaryFile(diaryDir) {
  if (!fs.existsSync(diaryDir)) return null;
  const files = fs.readdirSync(diaryDir)
    .filter(f => f.endsWith('.md') && /^\d{4}-\d{2}-\d{2}/.test(f))
    .map(f => ({
      name: f,
      path: path.join(diaryDir, f),
      mtime: fs.statSync(path.join(diaryDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? files[0] : null;
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const payloadText = JSON.stringify(data);

    // Gate: only fire when DE close detected
    const isDEClose = DE_CLOSE_PATTERNS.some(re => re.test(payloadText));
    if (!isDEClose) process.exit(0);

    // Find project root + diary directory
    const projectRoot = findProjectRoot(process.cwd());
    if (!projectRoot) process.exit(0);  // can't locate — silent skip

    const diaryDir = path.join(projectRoot, 'daily-diary', 'current');
    const latest = findLatestDiaryFile(diaryDir);

    if (!latest) {
      // DE close detected but no diary file at all — strong warning
      const reminder = [
        '',
        '⚙️  diary-format-gate: DE close detected but NO diary file found in daily-diary/current/',
        '',
        'DE Step 4 should have written/appended today\'s entry per `daily-diary/diary-format.md`.',
        'Check whether Step 4 actually ran. If skipped intentionally, mark with ⏭ + reason per DE protocol.',
        '',
      ].join('\n');
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: { hookEventName: 'Stop', additionalContext: reminder },
      }));
      process.exit(0);
    }

    // Read the latest diary file and check for required sections
    const content = fs.readFileSync(latest.path, 'utf8');
    const lines = content.split('\n');

    const missing = [];
    const empty = [];

    for (const section of REQUIRED_SECTIONS) {
      const headerIdx = lines.findIndex(l => l.trim() === section);
      if (headerIdx === -1) {
        missing.push(section);
        continue;
      }
      // Check section has non-empty content — scan until next H2 or EOF
      let hasContent = false;
      for (let i = headerIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^## /.test(line.trim())) break;  // next H2 reached
        if (line.trim().length > 0 && !/^<.*>$/.test(line.trim())) {
          // non-empty, non-placeholder line
          hasContent = true;
          break;
        }
      }
      if (!hasContent) empty.push(section);
    }

    if (missing.length === 0 && empty.length === 0) process.exit(0);

    // Emit warning via feedback channel — advisory only
    const warningLines = ['', `⚙️  diary-format-gate: structural issues in ${path.basename(latest.path)}`, ''];
    if (missing.length > 0) {
      warningLines.push(`Missing required H2 section(s): ${missing.join(', ')}`);
    }
    if (empty.length > 0) {
      warningLines.push(`Empty H2 section(s) (no content under header): ${empty.join(', ')}`);
    }
    warningLines.push('');
    warningLines.push('The diary template requires 3 H2 sections per `daily-diary/diary-format.md`:');
    warningLines.push('  ## Sessions  — Ruri-voice narrative spine');
    warningLines.push('  ## Index     — Auto-Index + Curated-Index (canonical-form keyword grep surface)');
    warningLines.push('  ## Closing   — Ruri-voice closing (always exists; this is where 🌸 lives)');
    warningLines.push('');
    warningLines.push('This is a WARNING, not a block. DE close proceeds. Fix on next entry or now.');
    warningLines.push('');

    const reminder = warningLines.join('\n');
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'Stop', additionalContext: reminder },
    }));
    process.exit(0);
  } catch (e) {
    // Never block on hook errors
    process.exit(0);
  }
});
