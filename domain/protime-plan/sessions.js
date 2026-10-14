// sessions.js — what miya asked for on one day, read from his own session transcripts (read-only).
// Used by `protime-plan.js --sessions <day>` so the protime skill can title the day's adhocs from what really happened,
// not only from what was saved as an adhoc (2026-10-14: 6 of 7 adhocs on 13 Oct had no saved block).
'use strict';
const fs = require('fs');
const path = require('path');

const PROJECTS = path.join(process.env.USERPROFILE || 'C:\\Users\\Ridhwan', '.claude', 'projects');
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const NOISE = /^(Stop hook|\[Request interrupted|<task-notification|Base directory for this skill|<command-|Caveat:|This session is being continued|\[SYSTEM)/;

// Pure: one transcript's lines -> his typed prompts on `day` [{ time, text }]
function promptsOf(lines, day) {
  const out = [];
  for (const l of lines) {
    let r; try { r = JSON.parse(l); } catch (_) { continue; }
    if (r.type !== 'user' || !r.message || r.isMeta || r.isSidechain || !r.timestamp) continue;
    if (iso(new Date(r.timestamp)) !== day) continue;
    const c = r.message.content;
    let t = typeof c === 'string' ? c : Array.isArray(c) ? c.filter(x => x && x.type === 'text').map(x => x.text).join(' ') : '';
    t = t.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').replace(/\s+/g, ' ').trim();
    if (!t || NOISE.test(t)) continue;
    out.push({ time: new Date(r.timestamp).toTimeString().slice(0, 5), text: t.slice(0, 300) });
  }
  return out;
}

// Every session with at least one prompt on `day`, oldest first.
function sessionsOn(day) {
  const res = [];
  let dirs = [];
  try { dirs = fs.readdirSync(PROJECTS); } catch (_) { return res; }
  for (const d of dirs) {
    let files = [];
    try { files = fs.readdirSync(path.join(PROJECTS, d)).filter(f => f.endsWith('.jsonl')); } catch (_) { continue; }
    for (const f of files) {
      const p = path.join(PROJECTS, d, f);
      let st; try { st = fs.statSync(p); } catch (_) { continue; }
      if (iso(st.mtime) < day) continue;                       // not touched since that day: cannot hold its prompts
      let text = ''; try { text = fs.readFileSync(p, 'utf8'); } catch (_) { continue; }
      if (text.indexOf('"timestamp":"' + day.slice(0, 8)) < 0 && text.indexOf(day) < 0) continue;
      const prompts = promptsOf(text.split('\n'), day);
      if (prompts.length) res.push({ session: f.slice(0, 8), folder: d.replace(/^.*worktrees-/, ''), prompts });
    }
  }
  return res.sort((a, b) => a.prompts[0].time.localeCompare(b.prompts[0].time));
}

module.exports = { promptsOf, sessionsOn, iso };
