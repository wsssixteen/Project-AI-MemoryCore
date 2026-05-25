/**
 * word-ui-vocab-gate.js — UserPromptSubmit hook
 *
 * Mandatory enforcement of personality.md's chat-vocabulary rule for .docx
 * discussions: when the prompt or context involves Word documents / templates
 * / content controls / text boxes / SDT / OOXML, Ruri MUST explain in Word UI
 * terms alongside any XML jargon — so みや can take the next adjustment via
 * Word UI directly, without needing Ruri's XML surgery.
 *
 * Created 2026-05-25 per みや explicit instruction: "I made it mandatory, a
 * hook every time you explain about word documents you MUST explain from
 * user side (UI) as well. So that next time I can simply use text box without
 * needing your adjustments."
 *
 * Source rule: personality.md "Word .docx edits — UI vocabulary in chat" rule
 * (2026-05-12, strengthened 2026-05-23). The prose rule existed but didn't
 * reliably fire during QA-262370 rework cycle 2 — Ruri spent multiple turns
 * discussing mc:AlternateContent / <w:drawing> / <wp:anchor> / <v:textbox>
 * without ever translating to Insert > Text Box, Developer > Content Control,
 * Wrap Text > In Line With Text, etc. みや: "as a user, I do not understand
 * what are those fixes."
 */
const TRIGGERS = [
  // Direct .docx / Word references
  /\.docx\b/i,
  /\.dotx\b/i,
  /\bword\s+(doc|document|file|template)\b/i,
  /\bWord\s+UI\b/,
  /\bMS\s+Word\b/i,
  /\bMicrosoft\s+Word\b/i,
  // Template / generated-surat references
  /\btemplate\b.*\.(docx|dotx)/i,
  /\bsurat\b.*\.(docx|dotx)/i,
  /\bHeaderSurat\b/,
  /\bTemplate[A-Z][A-Za-z]+\.docx\b/,
  // Content control / SDT
  /\b(content[- ]?control|SDT|CC tag)\b/i,
  /\bSdt(Block|Run|Element|Pr|Content)\b/,
  // Text box / drawing / image positioning
  /\btext[- ]?box\b/i,
  /\b(floating|inline)\s+(image|shape|drawing|logo|picture)\b/i,
  /\banchor(ed|ing)?\b.*\b(image|shape|drawing|logo)\b/i,
  // OOXML / docx4j jargon (flags own XML use too)
  /\bOOXML\b/i,
  /\bdocx4j\b/i,
  /\bmc:AlternateContent\b/i,
  /\bw:drawing\b/i,
  /\bw:sdt\b/i,
  /\bw:tbl\b/i,
  /\bv:textbox\b/i,
  /\bv:shape\b/i,
  /\bw:pict\b/i,
  /\bwp:anchor\b/i,
  /\bwp:inline\b/i,
  /\btxbxContent\b/i,
  /\bDrawingML\b/i,
  /\bVML\b/i,
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';
    const hit = TRIGGERS.some(re => re.test(prompt));
    if (!hit) process.exit(0);

    const context = [
      '',
      '⚙️  word-ui-vocab-gate: Word/.docx topic detected',
      '',
      'MANDATORY (per みや 2026-05-25 hard rule): when explaining a Word document',
      'fix or behaviour, every chat response MUST include a Word UI translation',
      'alongside any XML / docx4j / OOXML detail. みや operates in Word UI —',
      'XML jargon without UI translation is unactionable for him.',
      '',
      'Required emit shape:',
      '  1. PLAIN — 1-2 sentences in plain Word language (what the fix MEANS)',
      '  2. WORD UI STEPS — concrete UI actions (Insert > Text Box / Developer',
      '     > Content Control > Properties / Wrap Text > In Line With Text /',
      '     Layout > Cell width / etc.) so みや can take the next adjustment',
      '     in Word UI without needing Ruri\'s XML surgery',
      '  3. WHAT TO AVOID — UI patterns that recreate the bug (e.g. floating',
      '     text boxes containing CCs → mc:AlternateContent compatibility',
      '     wrapper blinds the populator scanner)',
      '  4. XML LAYER (optional, AFTER the above) — technical detail for the',
      '     audit-trail / commit message',
      '',
      'Banned: emitting only XML element names + framework code without a Word',
      'UI translation in the SAME response. Banned: deferring UI translation',
      'to "later" or "ask if needed" — every time, no exceptions.',
      '',
      'Rule lives in: personality.md "Word .docx edits — UI vocabulary in chat"',
      '(2026-05-12, strengthened 2026-05-23). Hook added 2026-05-25 after',
      'QA-262370 rework cycle 2 violation. みや: "as a user, I do not understand',
      'what are those fixes... So that next time I can simply use text box',
      'without needing your adjustments."',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
