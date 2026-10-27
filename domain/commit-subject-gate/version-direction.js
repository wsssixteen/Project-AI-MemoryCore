// version-direction.js — part of commit-subject-gate (2026-10-15, per miya, #282303)
// WHAT: at an etanah commit that changes <etanah.common.version> in pom.xml, the subject verb must match
//       the direction of the change. "Up / bump / upgrade / naik" is allowed ONLY when the new version is
//       higher. A lower version, or the same number on a different line (a side patch), is a CHANGE:
//       "Change common to <ver> for testing" or "Revert common to <ver>".
// WHY: #282303 2026-10-15 — I committed "Ref #282303 - Up common to 1.7.23-MLK.beta.patch.280808.1" on
//      mlk/int-env, which moved common from 1.10.5-MLK DOWN to an older side branch for a test. The subject
//      said upgrade. I had copied the shape of miya's earlier real bump (#283286) without checking direction.
// CALLED BY: domain/compile-gate/compile-gate.check.hook.js at the git commit moment (PreToolUse).
'use strict';
const { execSync } = require('child_process');

const UP_WORDS = /\b(up|bump|bumped|upgrade|upgraded|naik)\b/i;
const CHANGE_WORDS = /\b(change|changed|revert|reverted|downgrade|downgraded|switch|switched|tukar)\b/i;
const VER_LINE = /<etanah\.common\.version>\s*([^<\s]+)\s*<\/etanah\.common\.version>/;

function numericParts(ver) {
  const m = /^(\d+(?:\.\d+)*)/.exec(String(ver || ''));
  return m ? m[1].split('.').map(Number) : null;
}

// -1 old > new (down) · 0 same number (side line) · 1 new > old (up) · null unreadable
function direction(oldVer, newVer) {
  const a = numericParts(oldVer), b = numericParts(newVer);
  if (!a || !b) return null;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0, y = b[i] || 0;
    if (y > x) return 1;
    if (y < x) return -1;
  }
  return 0;
}

// A beta / patch common is a test build, never an upgrade (2026-10-27 per miya, #285768).
const TEST_BUILD = /beta|patch/i;
const VERIFY_WORDS = /\bverify common\b/i;

// Pure check. Returns { ok, message }.
function checkSubject(subject, oldVer, newVer) {
  if (TEST_BUILD.test(newVer)) {
    if (VERIFY_WORDS.test(subject) && subject.includes(newVer)) return { ok: true };
    const ticket = (/#(\d{4,})/.exec(subject) || [])[1] || '<num>';
    return {
      ok: false,
      message: [
        `⛔ commit-subject-gate (test build): ${newVer} is a beta / patch common, a build to verify a fix.`,
        `   Subject: ${subject}`,
        `   Use:  Ref #${ticket} - Verify common ${newVer}`,
      ].join('\n'),
    };
  }
  const dir = direction(oldVer, newVer);
  if (dir === null || dir === 1) return { ok: true };
  if (UP_WORDS.test(subject) || !CHANGE_WORDS.test(subject)) {
    const what = dir === -1 ? `a LOWER version (${oldVer} -> ${newVer})` : `a side line with the same number (${oldVer} -> ${newVer})`;
    const ticket = (/#(\d{4,})/.exec(subject) || [])[1] || '<num>';
    return {
      ok: false,
      message: [
        `⛔ commit-subject-gate (version direction): this commit moves etanah-common to ${what}.`,
        `   Subject: ${subject}`,
        '   "Up / bump / upgrade" is only for a HIGHER version. This is a change, not an upgrade.',
        `   Use:  Ref #${ticket} - Change common to ${newVer} for testing`,
        `   or:   Ref #${ticket} - Revert common to ${newVer}   (when going back to the version it had before)`,
      ].join('\n'),
    };
  }
  return { ok: true };
}

function subjectFromCommand(command) {
  const m = /git\b[^\n]*?\bcommit\b[^\n]*?-m\s+(["'])([\s\S]*?)\1/.exec(command || '');
  return m ? m[2].split('\n')[0].trim() : null;
}

// Reads the staged pom.xml change in `top`. Fail-open on anything unreadable.
function gateCommit({ command, top }) {
  const subject = subjectFromCommand(command);
  if (!subject || !top) return { ok: true };
  let diff = '';
  try { diff = execSync(`git -C "${top}" diff --cached -U0 -- pom.xml`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (_) { return { ok: true }; }
  let oldVer = null, newVer = null;
  for (const line of diff.split('\n')) {
    const m = VER_LINE.exec(line);
    if (!m) continue;
    if (line.startsWith('-')) oldVer = m[1];
    else if (line.startsWith('+')) newVer = m[1];
  }
  if (!oldVer || !newVer) return { ok: true };
  return checkSubject(subject, oldVer, newVer);
}

module.exports = { direction, checkSubject, subjectFromCommand, gateCommit };
