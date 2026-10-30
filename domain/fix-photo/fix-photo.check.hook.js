#!/usr/bin/env node
// fix-photo.check.hook.js — born via core/forge.js (2026-09-28)
// TRIGGER: the current reply is an etanah hand-back (▶ YOUR MOVE / Test Scenario / DEPLOY card /
//          Redmine note) that describes a UI change (medan/field, butang/button, dropdown, checkbox,
//          Agihan Kepada, panel, popup, papar/hilang/dibuang), BA screenshots were seen this session
//          (pasted image, or a Read of an image under "0. Brief"), and no VALID FIX-PHOTO: line
//          exists in any reply this session.
// VALID FIX-PHOTO: absolute path · .png/.jpg · inside a "2. Fix" folder · exists on disk.
// ACTION: BLOCK (Stop advisory text never reaches the model, so a block is the only visible form).
// Bypass: [skip-fix-photo: <reason>] in the CURRENT reply (a "<reason>" placeholder never counts,
//         so this hook's own help text quoted back cannot disarm it).
// v2 (2026-10-04, #282924, miya): fires ONLY when miya asked for a fix photo in his own words this
//   session (fix photo / red box / kotak merah). A fix photo is a REAL after-fix screen (a frame of his
//   test video or a screenshot he gave), never BA's before-screenshot with a box drawn on it: that reads
//   as a fake screenshot of the fix. Spec kept: valid-path rules, bypass, block text shape, log rows.
// Lifecycle: created 2026-09-28 (#256334) — narrow trigger; widen only with confirmed-fire evidence.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const MAX_BYTES = 20 * 1024 * 1024;
const HANDBACK_RE = /▶ YOUR MOVE|Test Scenario|DEPLOY\s*[—-]|\bRedmine\b/i;
const UI_RE = /\b(medan|field|butang|button|dropdown|checkbox|kotak semak|agihan kepada|panel|popup|pop-up|radio|papar|dipaparkan|hilang|dibuang)\b/i;
// Permohonan prefixes come from the state registry; the two literals stay as the fallback and inside the list.
let PT_PREFIXES = 'PTMLK|PTPRK';
try { const p = Object.values(require(path.join(ROOT, 'lib', 'states.js')).all()).map(s => s.permohonan_prefix).filter(Boolean); if (p.length) PT_PREFIXES += '|' + p.join('|'); } catch (_) { /* fallback literal */ }
const ETANAH_RE = new RegExp(PT_PREFIXES + '|\\btugasan\\b|#\\d{6}\\b|QA-\\d{6}', 'i');
const BYPASS_RE = /\[skip-fix-photo:\s*([^\]<>]{3,})\]/i;
const PHOTO_RE = /FIX-PHOTO:\s*`?([^`\r\n]+?\.(?:png|jpe?g))`?\s*(?:✓|$)/gim;
const ASK_RE = /\b(fix[- ]?photo|red[- ]?box|kotak merah)\b/i;
// v3 (2026-10-23, #246964, miya: "install the keyword test result"): miya sharing test screenshots
//   ("test result(s)", "here test scenario", "here screenshot of test", "please save this") together with
//   an image in the SAME message = save them into the Task folder now. The next long reply must carry a
//   valid FIX-PHOTO line, whatever it is about (no hand-back / UI / etanah words needed).
// his-words: not an approval reader — detects an image share that must be saved; lib/his-words.js returns text only, no images
// v4 (2026-10-30, #287048): also "test scenario(s)" alone, "attach ... ticket/redmine", and a message sent mid-turn
//   (a queued_command attachment entry, where his text and images sit instead of a user message).
const TEST_SHARE_RE = /\b(test results?\b|test scenarios?\b|here(?:'s| is)? (?:the )?screenshots? of (?:the )?test|please save (?:this|these|it)\b|attach\w*\b[^.\n]{0,40}\b(?:ticket|redmine)\b)/i;
const HOOK_TEXT_RE = /FIX-PHOTO:|mark\.py|skip-fix-photo|Stop hook/;
const BRIEF_IMG_RE = /[\\/](?:[01]\. )?Brief[\\/][^\\/]+\.(png|jpe?g|webp|gif|bmp)$/i;

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

function scan(raw) {
  const out = { assistantTexts: [], hasBaImage: false, asked: false, testShare: false };
  const ask = (t) => { if (typeof t === 'string' && ASK_RE.test(t) && !HOOK_TEXT_RE.test(t)) out.asked = true; };
  const share = (texts, hasImg) => { if (hasImg && texts.some(t => TEST_SHARE_RE.test(t) && !HOOK_TEXT_RE.test(t))) out.testShare = true; };
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let obj; try { obj = JSON.parse(line); } catch (_) { continue; }
    if (obj.type === 'attachment' && obj.attachment && obj.attachment.type === 'queued_command') {
      const texts = []; let img = false;
      const walk = (x) => {
        if (!x) return;
        if (typeof x === 'string') { texts.push(x); return; }
        if (Array.isArray(x)) { x.forEach(walk); return; }
        if (typeof x !== 'object') return;
        if (x.type === 'image') img = true;
        if (x.type === 'text' && typeof x.text === 'string') texts.push(x.text);
        else for (const k of Object.keys(x)) if (k !== 'type' && typeof x[k] === 'object') walk(x[k]);
      };
      walk(obj.attachment.prompt);
      for (const k of Object.keys(obj.attachment)) if (k !== 'prompt' && typeof obj.attachment[k] === 'object') walk(obj.attachment[k]);
      texts.forEach(ask);
      if (img) out.hasBaImage = true;
      share(texts, img);
      continue;
    }
    const msg = obj.message || obj;
    const role = msg.role || obj.type;
    const c = msg.content;
    if (role === 'user') {
      if (typeof c === 'string') { ask(c); if (c.includes('[Image: source:')) { out.hasBaImage = true; share([c], true); } continue; }
      if (!Array.isArray(c)) continue;
      const texts = []; let img = false;
      for (const b of c) {
        if (!b) continue;
        if (b.type === 'image') { out.hasBaImage = true; img = true; }
        if (b.type === 'text') { ask(b.text); if (typeof b.text === 'string') texts.push(b.text); }
        if (b.type === 'text' && typeof b.text === 'string' && b.text.includes('[Image: source:')) { out.hasBaImage = true; img = true; }
      }
      share(texts, img);
    } else if (role === 'assistant' && Array.isArray(c)) {
      const texts = [];
      for (const b of c) {
        if (!b) continue;
        if (b.type === 'text' && b.text) texts.push(b.text);
        if (b.type === 'tool_use' && b.name === 'Read' && b.input && BRIEF_IMG_RE.test(String(b.input.file_path || ''))) out.hasBaImage = true;
      }
      if (texts.length) out.assistantTexts.push(texts.join('\n'));
    } else if (role === 'assistant' && typeof c === 'string' && c.trim()) {
      out.assistantTexts.push(c);
    }
  }
  return out;
}

function photoVerdict(texts) {
  const found = [];
  for (const t of texts) { let m; PHOTO_RE.lastIndex = 0; while ((m = PHOTO_RE.exec(t))) found.push(m[1].trim()); }
  const bad = [];
  for (const p of found) {
    if (!/^([A-Za-z]:[\\/]|\\\\|\/)/.test(p)) { bad.push(p + ' (not a full path)'); continue; }
    // Cycle 1 → "2. Fix\"; later cycles → loose in the "N. Rework\" root (2026-09-30, miya).
    if (!/[\\/]2\. Fix[\\/]|[\\/]\d+\. Rework[\\/][^\\/]+$/i.test(p)) { bad.push(p + ' (not in "2. Fix" or an "N. Rework" root)'); continue; }
    if (!fs.existsSync(p)) { bad.push(p + ' (file not found)'); continue; }
    return { ok: true, found, bad };
  }
  return { ok: false, found, bad };
}

function blockText(bad) {
  return [
    '\u{1F5BC}️ fix-photo: this hand-back describes a UI change and BA gave screenshots, but no valid FIX-PHOTO line exists.',
    '   miya asked for a fix photo. Use a REAL after-fix screen (a frame of his test video or his own screenshot), never BA\'s before-screenshot.',
    '   1. Mark the changed area with a red box + short label:',
    '      python domain/fix-photo/mark.py --src "<BA screenshot>" --dst "<Task folder>\\<cycle>\\2. Fix\\<n>. <KOD> - <what changed>.png" --box "x0,y0,x1,y1" --label "x,y=<label>"',
    '   2. Open the saved file and look at it (box on the right field?).',
    '   3. Put one line per photo in the reply:  FIX-PHOTO: <full path> ✓',
    bad.length ? '   Rejected FIX-PHOTO line(s): ' + bad.join(' · ') : '',
    '   Not a UI change? add [skip-fix-photo: <why>] with a real reason.',
  ].filter(Boolean).join('\n') + '\n';
}

function testShareText(bad) {
  return [
    '\u{1F5BC}️ fix-photo: miya shared test screenshots ("test result" / "here test scenario" / "please save this"), but none is saved in the Task folder.',
    '   Save EACH one into the current cycle folder ("2. Fix" or the "N. Rework" root), named "<n>. <what it shows>.png" (e.g. "1. Before Jana Semula.png").',
    '   Red box on the changed area when it helps:',
    '      python domain/fix-photo/mark.py --src "<pasted image>" --dst "<Task folder>\\2. Fix\\<n>. <what it shows>.png" --box "x0,y0,x1,y1"',
    '   Open each saved file and look at it, then put one line per photo in the reply:  FIX-PHOTO: <full path> ✓',
    bad.length ? '   Rejected FIX-PHOTO line(s): ' + bad.join(' · ') : '',
  ].filter(Boolean).join('\n') + '\n';
}

runHook({ name: 'fix-photo', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  if (!data.transcript_path) return { fired: false };
  const raw = readTranscript(data.transcript_path);
  if (!raw) return { fired: false };
  const s = scan(raw);
  const current = s.assistantTexts[s.assistantTexts.length - 1] || '';
  if (current.length < 200) return { fired: false };
  if (BYPASS_RE.test(current)) return { fired: true, bypassed: true, bypassToken: 'skip-fix-photo' };
  if (s.testShare) {
    const v = photoVerdict(s.assistantTexts);
    if (v.ok) return { fired: false };
    return { fired: true, blocked: true, blockReason: testShareText(v.bad) };
  }
  if (!HANDBACK_RE.test(current) || !UI_RE.test(current) || !ETANAH_RE.test(current) || !s.hasBaImage || !s.asked) return { fired: false };
  const v = photoVerdict(s.assistantTexts);
  if (v.ok) return { fired: false };
  return { fired: true, blocked: true, blockReason: blockText(v.bad) };
});
