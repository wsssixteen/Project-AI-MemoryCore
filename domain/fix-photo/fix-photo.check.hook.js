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
// Lifecycle: created 2026-09-28 (#256334) — narrow trigger; widen only with confirmed-fire evidence.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const MAX_BYTES = 20 * 1024 * 1024;
const HANDBACK_RE = /▶ YOUR MOVE|Test Scenario|DEPLOY\s*[—-]|\bRedmine\b/i;
const UI_RE = /\b(medan|field|butang|button|dropdown|checkbox|kotak semak|agihan kepada|panel|popup|pop-up|radio|papar|dipaparkan|hilang|dibuang)\b/i;
const ETANAH_RE = /PTMLK|PTPRK|\btugasan\b|#\d{6}\b|QA-\d{6}/i;
const BYPASS_RE = /\[skip-fix-photo:\s*([^\]<>]{3,})\]/i;
const PHOTO_RE = /FIX-PHOTO:\s*`?([^`\r\n]+?\.(?:png|jpe?g))`?\s*(?:✓|$)/gim;
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
  const out = { assistantTexts: [], hasBaImage: false };
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let obj; try { obj = JSON.parse(line); } catch (_) { continue; }
    const msg = obj.message || obj;
    const role = msg.role || obj.type;
    const c = msg.content;
    if (role === 'user') {
      if (typeof c === 'string') { if (c.includes('[Image: source:')) out.hasBaImage = true; continue; }
      if (!Array.isArray(c)) continue;
      for (const b of c) {
        if (!b) continue;
        if (b.type === 'image') out.hasBaImage = true;
        if (b.type === 'text' && typeof b.text === 'string' && b.text.includes('[Image: source:')) out.hasBaImage = true;
      }
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
    '   1. For each changed screen, copy BA\'s screenshot with a red box + short Malay label on the changed area:',
    '      python domain/fix-photo/mark.py --src "<BA screenshot>" --dst "<Task folder>\\<cycle>\\2. Fix\\<n>. <KOD> - <what changed>.png" --box "x0,y0,x1,y1" --label "x,y=<label>"',
    '   2. Open the saved file and look at it (box on the right field?).',
    '   3. Put one line per photo in the reply:  FIX-PHOTO: <full path> ✓',
    bad.length ? '   Rejected FIX-PHOTO line(s): ' + bad.join(' · ') : '',
    '   Not a UI change? add [skip-fix-photo: <why>] with a real reason.',
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
  if (!HANDBACK_RE.test(current) || !UI_RE.test(current) || !ETANAH_RE.test(current) || !s.hasBaImage) return { fired: false };
  const v = photoVerdict(s.assistantTexts);
  if (v.ok) return { fired: false };
  return { fired: true, blocked: true, blockReason: blockText(v.bad) };
});
