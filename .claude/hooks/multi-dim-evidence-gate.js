/**
 * multi-dim-evidence-gate.js — UserPromptSubmit hook
 *
 * WHY: visual-evidence-dimensions-missed has ~8 strikes — BA screenshots /
 * photos / PDFs in "0. Brief/" get read partially (one file, or filename
 * matching current theory only), missing annotations / other attachments.
 * CLAUDE.md §10 "BA attachments — EXPLICIT per-file open + content emit"
 * + the `annotations` skill exist for this but slip when not top-of-mind.
 *
 * WHAT: if the user prompt references visual/attachment evidence, emit a
 * <=3-line reminder to open EVERY file in 0. Brief/, emit one line per
 * file, and treat uncommented highlights as questions for みや, not scope.
 *
 * CAN: advisory reminder only, based on regex match against prompt text.
 * CANNOT: detect whether 0. Brief/ was actually opened; verify per-file
 * emit compliance; block the turn.
 *
 * Bypass: include [skip-mde: <reason>] in the message.
 */
const TRIGGERS = /\b(screenshot|photo|image|attached|attachment|\.png|\.jpg|\.jpeg|\.pdf|video|\.mp4|red box|highlight)\b/i;

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';
    if (prompt.length < 60) process.exit(0);
    if (/\[skip-mde\s*:/i.test(prompt)) process.exit(0);
    if (!TRIGGERS.test(prompt)) process.exit(0);

    const context = [
      '',
      '⚙️  multi-dim-evidence-gate: visual/attachment evidence referenced.',
      'Open EVERY file in 0. Brief/ (not just the one matching your theory) — emit 1 line per file.',
      'Uncommented highlights/red-boxes are QUESTIONS for みや, not confirmed scope.',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
