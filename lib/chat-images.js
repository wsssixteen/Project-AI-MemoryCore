#!/usr/bin/env node
// chat-images.js — write every image miya sent in a session to disk, including the ones sent mid-turn.
// Mid-turn images never reach the session images\ folder; the transcript keeps them as `attachment` entries (base64).
// Usage: node lib/chat-images.js <session.jsonl> <out-dir>
// Prints one line per file: <out-dir>\<n>_<entry type>_<timestamp>.<ext>
// Born 2026-10-30 per miya (287201: "why do you always skip attachments?").
'use strict';
const fs = require('fs');
const path = require('path');

const [, , transcript, outDir] = process.argv;
if (!transcript || !outDir) {
  console.error('usage: node lib/chat-images.js <session.jsonl> <out-dir>');
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

let n = 0;
const seen = new Set();
for (const line of fs.readFileSync(transcript, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  let entry;
  try { entry = JSON.parse(line); } catch (_) { continue; }
  if (entry.type === 'assistant') continue;
  const walk = (x) => {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach(walk); return; }
    if (x.type === 'image' && x.source && x.source.data) {
      const key = x.source.data.slice(0, 200) + x.source.data.length;
      if (!seen.has(key)) {
        seen.add(key);
        n++;
        const ext = (x.source.media_type || 'image/png').split('/')[1];
        const stamp = String(entry.timestamp || '').replace(/[:.]/g, '-');
        const file = path.join(outDir, `${String(n).padStart(2, '0')}_${entry.type}_${stamp}.${ext}`);
        fs.writeFileSync(file, Buffer.from(x.source.data, 'base64'));
        console.log(file);
      }
    }
    for (const k in x) walk(x[k]);
  };
  walk(entry);
}
console.log(`CHAT-IMAGES: ${n} image(s) written to ${outDir}`);
