#!/usr/bin/env node
// mizan prove — proves, from the agents' own records, who did what.
// The harness (not the agent) records every tool call an agent makes and what came back. This script reads those records and
// establishes, for one case folder:
//   1. WHO WROTE EACH PART, AND THAT THE PART IS WHAT HE WROTE. The agent's recorded writes are replayed; the result must be,
//      byte for byte, the file that is there now. So a part touched afterwards by anyone (the orchestrator included) is refused.
//      The agent must be the one that was given that part as its task, and no agent may have written two parts.
//   2. THAT EVERY SEARCH A PART LISTS WAS RUN BY ITS WRITER. A listed search is matched to a search, a page fetch or a
//      library-search command that this agent really ran and that returned. What came back is kept beside it. One search stands
//      for one listing; it stands again only for the very same listing written again, and the same listing is never counted twice.
//      A call that came back with an error was made (listing it is true) but looked at nothing, so it is never counted.
//      A roadblock needs every one of its listed searches in the record, the first round in its writer's record and the second round
//      in the record of another agent, and enough DIFFERENT searches in each round that came back with an answer.
//      Any other listed search that is not in its writer's record, or that came back with an error, is marked, and the checks do not count it.
// The result goes to <case folder>/provenance.json; domain/mizan/case.js build then puts it into the case.
// lib/mizan.js check --transcripts runs the same proof again itself, so the stored file is a convenience, not the evidence.
// Usage: node domain/mizan/prove.js <case folder> <transcript folder or .jsonl file> [...]
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { signRb, RULES } = require(path.join(__dirname, '..', '..', 'lib', 'mizan.js'));
const { norm } = require(path.join(__dirname, 'verify.js'));
const C = require(path.join(__dirname, 'case.js'));

const arr = v => (Array.isArray(v) ? v : []);
const localDay = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const sha =t => crypto.createHash('sha1').update(t).digest('hex').slice(0, 16);
const normUrl = u => { let s = String(u || '').trim(); try { s = decodeURIComponent(s); } catch (e) { /* as written */ } return s.replace(/^https?:\/\/(www\.)?/i, '').replace(/#.*$/, '').replace(/\/+$/, '').toLowerCase(); };
const normPath = p => String(p || '').replace(/\\\\/g, '\\').replace(/\//g, '\\').toLowerCase();
const text = c => (typeof c === 'string' ? c : arr(c).map(x => (x && (x.text || x.content)) || '').join(' '));
const URL_RE = /https?:\/\/[^\s"'`<>\\)]+/g;
const LIBRARY = /turath|shamela|wikisource|openalex|archive\.org|internet archive/i, WEB = /google|bing|duckduckgo|web search|the web|scholar/i;
// How a fetch tool says, in plain words and with no error flag, that it read nothing of the page.
const NOTHING_READ = /^(the server returned http \d{3}|redirect detected|request failed|failed to fetch|unable to fetch|error fetching|fetch failed|maxcontentlength|getaddrinfo|timeout of \d+ ?ms)|response body was not retrieved|was not fetched automatically|\b(ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT)\b|socket hang up/i;

// Which library a place or an address belongs to.
const FAMILY = [['shamela', /turath|shamela/i], ['wikisource', /wikisource/i], ['openalex', /openalex/i], ['archive', /archive/i]];
const family = s => (FAMILY.find(f => f[1].test(String(s))) || [''])[0];
// What the find tool itself printed: "MIZAN FIND: <address> · N words" for a page it read; "<service>: N hit(s)" for each library
// it asked and then "MIZAN FIND: "<words>" · N hit(s) · K search service(s) answering" for a search of the libraries.
function findSaid(out) {
  // (a file read back by the Read tool carries a line number before each line: it is taken off)
  const lines = String(out).split('\n').map(l => l.replace(/^\s*\d+(→|\t)/, '').replace(/\s+$/, '')), page = new Map(), library = new Map();
  const QUOTED = '("(?:[^"\\\\]|\\\\.)*")', LINE = '^(\\S[^:]*): (\\d+ hit\\(s\\)|no answer)', unq = s => { try { return JSON.parse(s); } catch (e) { return null; } };
  const entry = words => { const k = norm(words); if (!library.has(k)) library.set(k, { engines: {}, each: [], summary: '', alive: -1 }); return library.get(k); };
  const note = (en, e, rest) => { const fam = family(e[1]), dead = /did not answer/.test(rest) || !/hit/.test(e[2]); en.engines[fam] = !dead; en.each.push(e[1].replace(/\s*\(.*\)\s*$/, '') + ': ' + e[2] + (/did not answer/.test(rest) ? ' (its control search did not answer)' : '')); };
  const NAMED = new RegExp(LINE + ' for ' + QUOTED + '(.*)$'), BARE = new RegExp(LINE + '(.*)$');
  lines.forEach((l, i) => {
    let m = /MIZAN FIND: (https?:\/\/\S+) · (\d+) words/.exec(l);
    if (m) { page.set(normUrl(m[1]), { ok: true, text: lines.slice(i, i + 3).join(' ').replace(/\s+/g, ' ').slice(0, 220) }); return; }
    m = /MIZAN FIND: (https?:\/\/\S+) · NOT READABLE[^\n]*/.exec(l);
    if (m) { if (!page.has(normUrl(m[1]))) page.set(normUrl(m[1]), { ok: false, text: m[0].replace(/\s+/g, ' ').slice(0, 220) }); return; }
    // A library's own line that names the words it was asked for stands by itself, wherever the output was cut.
    m = NAMED.exec(l);
    if (m && family(m[1]) && unq(m[3]) !== null) { const en = entry(unq(m[3])); if (!(family(m[1]) in en.engines)) note(en, m, m[4]); }
  });
  lines.forEach((l, i) => {
    const m = new RegExp('MIZAN FIND: ' + QUOTED + ' · (\\d+) hit\\(s\\) · (\\d+) search service').exec(l);
    if (!m || unq(m[1]) === null) return;
    const en = entry(unq(m[1])); en.summary = m[0] + '(s) answering'; en.alive = +m[3];
    if (Object.keys(en.engines).length) return;
    // The older form (a library's line does not name the words): the lines of this one search stand right above its summary, one
    // line per library asked, each followed by its indented rows. Anything else (another summary, a line that names its own
    // words, a line the agent printed) ends them, so one search is never read as another's.
    const found = [];
    for (let j = i - 1; j >= 0; j--) {
      if (/^\s{2}\S/.test(lines[j]) || !lines[j]) continue;
      const e = NAMED.test(lines[j]) ? null : BARE.exec(lines[j]), fam = e ? family(e[1]) : '';
      if (!fam || found.some(x => family(x[1]) === fam)) break;
      found.unshift(e);
    }
    for (const e of found) note(en, e, e[3]);
  });
  // A search looked if a library answered it: by the libraries' own lines where there are any, else by the summary's count.
  for (const en of library.values()) { const some = Object.values(en.engines).some(Boolean); en.ok = en.each.length ? some && en.alive !== 0 : en.alive > 0; en.text = en.each.concat(en.summary || []).join(' · ').replace(/\s+/g, ' ').slice(0, 400); }
  return { page, library, any: page.size + library.size > 0 };
}
// Which files of a case a file path or a command names, and which commands that print marks it runs. (The blind view and the
// translator's list are not among them: those are what a judge and a translator are meant to read.)
function opened(text) {
  const t = String(text || ''), out = [];
  if (/(^|[^\w-])view\.md/i.test(t)) out.push('view.md');
  if (/view-translate-given\.md/i.test(t)) out.push('the given English');
  if (/view-blind\.md/i.test(t)) out.push('view-blind.md');
  // A name written with a wildcard can be any file of the case: it is counted as one that shows marks.
  if (/[\w\\/:. -]*[*?][\w*?.-]*\.(md|json)\b/i.test(t.replace(/parts[\\/]+\*/gi, ''))) out.push('a file named with a wildcard');
  if (/case\.json/i.test(t)) out.push('case.json');
  if (/provenance\.json/i.test(t)) out.push('provenance.json');
  for (const m of t.matchAll(/parts[\\/]+(\d{3}-[a-z0-9]+)/gi)) out.push('part:' + m[1].toLowerCase());
  if (/parts[\\/]+\*/i.test(t) || /(Get-ChildItem|\bls\b|\bdir\b|\bgci\b)[^|\n]*parts[^|\n]*\|\s*(Get-Content|gc\b|cat\b|%|ForEach|Select-String)/i.test(t) || /(Select-String|\bgrep\b|\bfindstr\b|\brg\b)[^\n]*parts["']?(\s|$)/i.test(t)) out.push('all parts');
  for (const line of t.split(/\n|;/)) { const m = /mizan\.js["']?\s+(outcome|check|render)\b/i.exec(line); if (m) out.push(m[1].toLowerCase() + (/--blind\b/.test(line) ? ' (blind)' : ' (not blind)')); }
  return [...new Set(out)];
}
// What a role may not have opened too early. A judge and a second judge: nothing that shows a mark other than their own, before their
// own marks were final (their last write). A translator: nothing that shows the English a gatherer gave, before his own was written (his first write).
// A second searcher: nothing that shows how the first search was made (the view shows what is sought, not the searches), before his own part was final.
const SEALED = ['judge', 'judge2', 'translate', 'second'], MARKERS = ['judge', 'judge2', 'check', 'swap'];
// The same, judged by what came back and not by how it was asked for: the lines only the marked view carries (domain/mizan/case.js
// view), the shape of another agent's part, and what the outcome command prints when it is not blind. Each is written here as the
// line looks with its values in it, so that the scripts' own source, which holds the bare words, is not taken for it.
const STATUS = '(confirmed|false|unsupported|disputed)';
const SHOWN = [
  [new RegExp('MARKED ' + STATUS + ' . level: |earlier marks: ' + STATUS + ' \\(|NOT YET CHECKED\\s*(\\n|$)|NO READER HAS YET SAID WHETHER THESE BEAR ON IT: \\S'), 'the marked view (by what came back to him)'],
  [/"(second_opinion|swap|premises|verdict)"\s*:\s*[\[{]/, 'another agent\'s part (by what came back to him)'],
  [/published outcome: \w|by the second judge's "/, 'the outcome with both judges\' marks (by what came back to him)'],
];
const GIVEN_SHOWN = /THE ENGLISH THAT WAS GIVEN for the passages/;
// The checker's own scripts and rules, read (not run): a judge who reads them knows which words the wording checks look for.
const RULES_FILE = /(lib[\\/]+mizan\.js|domain[\\/]+mizan[\\/]+[\w.-]+\.js(on)?|checks\.json)/i, READS = /\b(Get-Content|gc|cat|type|more|head|tail|Select-String|sls|grep|findstr|rg)\b[^|;\n]*/gi;
const readRules = c => (/^(Read|Grep|Glob)$/.test(c.name) && RULES_FILE.test(c.file + ' ' + c.text)) || (/^(PowerShell|Bash)$/.test(c.name) && (c.text.match(READS) || []).some(x => RULES_FILE.test(x)));
const GIVEN = /THE QUESTION \(([^)\n]+)\): ([^\n]*)\n\s*THE CLAIM AS IT WAS ASKED: ([^\n]*)/;
const flat = s => String(s || '').replace(/\s+/g, ' ').trim();
function tooEarly(role, own, what) {
  if (what === 'the given English') return role === 'translate';
  if (what === 'view-blind.md') return role === 'translate';   // it prints the English of pairs already checked, and the dispute
  if (what === 'a file named with a wildcard') return true;
  if (role === 'second') return ['case.json', 'provenance.json', 'all parts'].includes(what) || (what.startsWith('part:') && what.slice(5) !== own.toLowerCase());
  if (['view.md', 'case.json', 'provenance.json', 'all parts'].includes(what)) return true;
  if (what.startsWith('part:')) { const name = what.slice(5); return name !== own.toLowerCase() && (role === 'translate' || MARKERS.includes(name.replace(/^\d+-/, ''))); }
  if (role === 'translate') return false;
  return role === 'judge2' ? /^(outcome|check|render)/.test(what) : /\(not blind\)$/.test(what) || /^render/.test(what);
}
// What each agent really did, from its record: the files it wrote (in order) and the searches and fetches it ran (with what came back).
function readAgents(sources) {
  const files = [], agents = [];
  for (const s of sources) {
    if (!fs.existsSync(s)) throw new Error('no such transcript folder or file: ' + s);
    if (fs.statSync(s).isDirectory()) for (const f of fs.readdirSync(s).filter(x => /\.jsonl$/.test(x) && x !== 'journal.jsonl')) files.push(path.join(s, f)); else files.push(s);
  }
  for (const f of files) {
    const id = path.basename(f).replace(/^agent-|\.jsonl$/g, '');
    let label = '';
    try { label = JSON.parse(fs.readFileSync(f.replace(/\.jsonl$/, '.meta.json'), 'utf8')).description || ''; } catch (e) { /* no label */ }
    const uses = [], results = new Map(), models = new Set();
    let given = null;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      // Which model answered: the harness writes it on each of the agent's own messages.
      if (line.includes('"model"')) { const m = /"model"\s*:\s*"([^"]+)"/.exec(line); if (m && !/^<|synthetic/i.test(m[1])) models.add(m[1]); }
      // The question and the claim this agent was given: the harness's own message to it carries both, before anything the agent did.
      if (!given && !uses.length && line.includes('THE QUESTION (') && line.includes('"type":"user"')) { try { const j = JSON.parse(line), m = j.type === 'user' && j.message && j.message.role !== 'assistant' ? GIVEN.exec(text(j.message.content)) : null; if (m) given = { id: m[1], question: m[2], claim: m[3] }; } catch (e) { /* not a message */ } }
      if (!line.includes('"tool_use"') && !line.includes('"tool_result"')) continue;
      let j; try { j = JSON.parse(line); } catch (e) { continue; }
      for (const b of (j.message && Array.isArray(j.message.content) ? j.message.content : [])) {
        if (b.type === 'tool_use' && b.input) uses.push({ id: b.id, name: b.name, input: b.input, ts: j.timestamp || '' });
        if (b.type === 'tool_result') results.set(b.tool_use_id, { error: b.is_error === true, text: text(b.content) });
      }
    }
    const writes = new Map(), searches = [], events = [], calls = [];
    uses.forEach((u, i) => {
      // What the agent opened, and when it wrote, in order: a judge is to see no marks but his own, and a translator no English before his own.
      const r = results.get(u.id); if (!r) return;
      const text = u.name === 'Read' ? String(u.input.file_path || '') : /^(PowerShell|Bash)$/.test(u.name) ? String(u.input.command || '') : /^(Grep|Glob)$/.test(u.name) ? String(u.input.path || '') + ' ' + String(u.input.glob || '') + ' ' + String(u.input.pattern || '') : '';
      // What came back from every call is kept too (also from one that ended in an error: a command can print and then fail),
      // so that what an agent saw is judged by what he was shown and not only by how he asked for it.
      calls.push({ i, name: u.name, file: /^(Read|Write|Edit)$/.test(u.name) ? normPath(u.input.file_path) : '', folder: /^(Grep|Glob)$/.test(u.name) ? normPath(u.input.path).replace(/\\+$/, '') : '', only: normPath(u.name === 'Glob' ? u.input.pattern : u.name === 'Grep' ? u.input.glob : ''), text, out: r.text });
      if (r.error && !/^(PowerShell|Bash)$/.test(u.name)) return;   // a shell command that ended in an error still ran what stood before the error
      if ((u.name === 'Write' || u.name === 'Edit') && u.input.file_path) return events.push({ i, kind: 'write', path: normPath(u.input.file_path), content: u.name === 'Write' ? String(u.input.content) : null });
      for (const what of opened(text)) events.push({ i, kind: 'open', what, text });
    });
    for (const u of uses) {
      const r = results.get(u.id);
      if (!r) continue;                                              // a call that never returned did nothing
      // A search or fetch that came back with an error WAS made: what came back is kept, marked as failed. It may be listed
      // (listing it is true), but it does not count as a search that looked, because it saw nothing.
      const seen = (r.error ? 'FAILED: ' : '') + r.text.replace(/\s+/g, ' ').slice(0, 220), add = s => searches.push(Object.assign({ seen, failed: r.error, ts: u.ts, used: new Map() }, s));
      // A fetch tool reports a refused or unreachable page in plain words, with no error flag: such an answer read nothing either.
      const unread = !r.error && NOTHING_READ.test(r.text.replace(/\s+/g, ' ').slice(0, 300)) ? { failed: true, seen: 'FAILED: ' + r.text.replace(/\s+/g, ' ').slice(0, 220) } : {};
      if (u.name === 'Write' || u.name === 'Edit') { if (!r.error && u.input.file_path) { const k = normPath(u.input.file_path); if (!writes.has(k)) writes.set(k, []); writes.get(k).push(u); } }   // a write that failed wrote nothing
      else if (u.name === 'WebSearch' && u.input.query) add({ kind: 'web', query: norm(u.input.query) });
      else if (u.name === 'WebFetch' && u.input.url) add(Object.assign({ kind: 'page', url: normUrl(u.input.url) }, unread));
      else if (/navigate/.test(u.name) && u.input.url) add(Object.assign({ kind: 'page', url: normUrl(u.input.url) }, unread));
      else if (/^(PowerShell|Bash)$/.test(u.name)) {
        // Only what a command really runs counts: comment lines and text that is merely printed are taken out first.
        const cmd = String(u.input.command || '').split('\n').filter(l => !/^\s*#/.test(l)).join('\n').replace(/\b(Write-Output|Write-Host|echo)\s+("[^"]*"|'[^']*')/gi, ' ');
        const viaFind = /find\.js/.test(cmd), fetches = viaFind || /(Invoke-WebRequest|Invoke-RestMethod|\bcurl\b|\bwget\b|\biwr\b|\birm\b|fetch\()/i.test(cmd);
        // A shell command may ask several things and end with one error. Where the find tool's own lines say what it did, they
        // decide, thing by thing; where they say nothing, the command as a whole does. What the command asks comes from the
        // command (printed text is taken out above), so a printed line alone proves nothing.
        // A command that ran too long is moved to the background and its result is not in the answer to it. What the agent read
        // of that result afterwards is its result; what it did not read, it never saw, and that is not a search that looked.
        const bg = /moved to the background \(ID: (\w+)\)/.exec(r.text), whole = !r.error && !bg;
        // Its output counts only as the harness hands it over: a read of the task's own output file, or the harness's tool for a task's
        // output. What another command of the agent's prints is the agent's text, whatever id it names.
        const handed = x => (x.name === 'Read' && new RegExp('[\\\\/]tasks[\\\\/]' + bg[1] + '\\.output$', 'i').test(String(x.input.file_path || ''))) || (/^(TaskOutput|BashOutput|Monitor)$/.test(x.name) && x.input.command === undefined && JSON.stringify(x.input).includes(bg[1]));
        const out = bg ? uses.filter(x => x !== u && handed(x) && results.has(x.id) && !results.get(x.id).error).map(x => results.get(x.id).text).join('\n') : r.text;
        const base = whole ? {} : { failed: true, seen: 'FAILED: ' + (bg ? 'the command was moved to the background, and the tool\'s own result line for this is not in what the agent read of its output afterwards' : r.text.replace(/\s+/g, ' ').slice(0, 200)) };
        const said = viaFind ? findSaid(out) : { page: new Map(), library: new Map(), any: false }, urls = (cmd.match(URL_RE) || []).map(normUrl);
        // An address handed to the find tool was read only if the tool's own line says it read that address (a pipe after it
        // can hide the tool's exit code, so the command's own success proves nothing here).
        const notRead = viaFind && /--read\b/.test(cmd) ? { failed: true, seen: 'FAILED: ' + ((/MIZAN FIND: [^\n]*not readable[^\n]*/i.exec(r.text) || [])[0] || 'the find tool printed no line saying it read this address').replace(/\s+/g, ' ').slice(0, 200) } : {};
        if (fetches) for (const k of urls) { const h = said.page.get(k); add(Object.assign({ kind: 'page', url: k }, base, notRead, h ? (h.ok === false ? { seen: 'FAILED: ' + h.text, failed: true } : { seen: h.text, failed: false }) : {})); }
        if (viaFind) {
          const families = [...new Set(urls.concat([...said.page.keys()]).map(family).filter(Boolean))];
          for (const m of cmd.matchAll(/(--at\s+)?(?:"([^"\n]{4,400})"|'([^'\n]{4,400})')/g)) {
            const s = m[2] || m[3]; if (/^https?:|\.js$|^[A-Za-z]:\\|^--/.test(s.trim()) || norm(s).split(' ').length < 2) continue;
            const k = norm(s), h = said.library.get(k);
            // The tool's own summary line for these words: it searched the libraries for them, and says which answered.
            if (h) add({ kind: 'library', query: k, engines: h.engines, seen: (h.ok ? '' : 'FAILED: ') + h.text, failed: !h.ok });
            // Words looked for on a page that was read are a look into that page's library, not a search of the libraries.
            else if (m[1] || (said.page.size && !said.library.size) || (/--read\b/.test(cmd) && !said.any)) { const read = [...said.page.values()].filter(p => p.ok !== false); add(Object.assign({ kind: 'look', query: k, families }, base, notRead, read.length ? { seen: read[0].text, failed: false } : {})); }
            // No line of the tool's own for these words is in the record (the agent cut the output short): the command as a whole decides.
            else add(Object.assign({ kind: 'library', query: k, seen: 'the whole command came back with: ' + seen.slice(0, 180) }, base));
          }
        }
      }
    }
    agents.push({ id, label, writes, searches, events, calls, given, models: [...models].sort(), last: uses.length ? uses[uses.length - 1].ts : '' });
  }
  return agents;
}
// The file an agent's recorded writes produce, replayed in order. null when the record cannot account for the file.
function replay(ops) {
  let content = null;
  for (const u of ops) {
    if (u.name === 'Write') content = String(u.input.content);
    else if (content !== null && typeof u.input.old_string === 'string' && content.includes(u.input.old_string)) content = u.input.replace_all ? content.split(u.input.old_string).join(u.input.new_string) : content.replace(u.input.old_string, () => u.input.new_string);
    else return null;
  }
  return content;
}
// What makes two listings the same listing: the same place, the same words, the same address.
const listing = a => String(a.where || '').trim().toLowerCase() + '|' + norm(a.query) + '|' + normUrl(a.url);
// One listed search is matched to ONE search this agent really ran: by the address it fetched, or by the words it searched for,
// in the kind of place the listing names. A search already matched stands again only for the very same listing (one search for an
// author, written under each of his quotes), never for a different one. Counting never counts the same listing twice (lib: counted).
function match(agent, a) {
  if (!agent) return null;
  const u = normUrl(a.url), q = norm(a.query).split(' ').filter(w => w.length > 1), where = String(a.where || ''), key = listing(a);
  // The library search tool asks several libraries in one run, so one run may stand for one listing per library named; anything else stands for one listing.
  // (a listing may name several libraries, "OpenAlex, Internet Archive and English Wikisource": the first names its place)
  const libs = FAMILY.filter(f => f[1].test(where)).map(f => f[0]), lib = libs[0] || '', slot = s => (s.kind === 'library' && lib ? lib : 'once');
  // A place already taken is open only to the same listing; a free one only when the search has not been spent on another kind of listing.
  const can = s => { const sl = slot(s); return s.used.has(sl) ? s.used.get(sl) === key : sl === 'once' ? s.used.size === 0 : !s.used.has('once'); };
  // Where the tool's own lines name the libraries it asked in that run: one of those the listing names must be among them,
  // and the listing is a search that looked only if one of them answered there.
  const known = s => s.kind === 'library' && libs.length > 0 && !!s.engines && Object.keys(s.engines).length > 0;
  const asked = s => !known(s) || libs.some(l => l in s.engines), dead = s => known(s) && !libs.some(l => s.engines[l] === true);
  // By address: the very address, or a longer one that begins with the listed one. A fetch of a shorter address is not the listed fetch.
  const byAddress = s => s.kind === 'page' && can(s) && (s.url === u || s.url.startsWith(u));
  const byWords = s => {
    if (!s.query || !can(s)) return false;
    // Words looked for on one page: a look into that page's library and no other, and only for a listing that says it was a page read.
    if (s.kind === 'look') { if (!lib || !s.families.includes(lib) || !/\bread|\bpage\b|--at/i.test(where)) return false; }
    else { if (LIBRARY.test(where) && s.kind !== 'library') return false; if (WEB.test(where) && !LIBRARY.test(where) && s.kind !== 'web') return false; if (!asked(s)) return false; }
    // Every word the listing gives must have been typed: a listing with a word that was never searched for is another search.
    const set = new Set(s.query.split(' ')); return q.every(w => set.has(w));
  };
  // An agent that tried again after a failure ran the search twice: the try that answered is the one a listing stands on.
  const pick = pred => agent.searches.find(s => !s.failed && !dead(s) && pred(s)) || agent.searches.find(pred);
  let hit = null;
  if (u.length > 12) hit = pick(byAddress);
  if (!hit && q.length >= 2) hit = pick(byWords);
  if (!hit) return null;
  hit.used.set(slot(hit), key);
  // None of the libraries this listing names answered in that run (their own lines, or their control searches): made, but it looked at nothing.
  const none = !hit.failed && dead(hit);
  // What the listing says came back, against what did: "nothing found" beside an answer that shows hits is not that search's result.
  // (Of a run that asked several libraries, only the lines of the libraries this listing names are read.)
  // (A listing that reports hits and adds "none of them is his" or "nothing new" says what came back: it is not this.)
  const said = String(a.result || ''), nothing = /\b(nothing (was )?found|found nothing|no (results?|hits?|match(es)?)|(0|zero) (hits?|results?|works?|papers?|pages?)|not found)\b|^\s*(none|nothing)[\s.]*$/i.test(said) && !/\b([1-9]\d*|one|two|three|four|five|six|seven|eight|nine|ten|several|many|some)\s+(\w+\s+){0,2}(hits?|results?|works?|papers?|pages?|places?)\b/i.test(said);
  const lines = hit.kind === 'library' ? hit.seen.split(' · ').filter(l => (libs.length ? libs.includes(family(l)) : !family(l))) : [hit.seen];
  const hits = lines.some(l => [...l.matchAll(/Found (\d+) results?|(\d+) hit\(s\)/gi)].some(m => Number(m[1] || m[2]) > 0));
  return { seen: (none ? 'FAILED: ' : '') + hit.seen, failed: hit.failed || none, kind: hit.kind, differs: nothing && hits && !hit.failed && !none };
}

// q: the case of this folder as it stands (its roadblocks carry the part that declared them).
function prove(dir, sources, q) {
  const agents = readAgents(sources), R = RULES.roadblock;
  const { parts } = C.readParts(dir);
  // Where the agents wrote. As a rule that is this folder. A case folder that was moved or copied afterwards (kept in an archive)
  // has no part at an address any agent wrote to; its parts are then matched by the last three names of the address,
  // <question id>\parts\<part>.json, and the proof says so. The content must still be the agent's, byte for byte.
  const here = name => normPath(path.resolve(dir, 'parts', name + '.json')), tail = name => '\\' + normPath(path.basename(path.resolve(dir))) + '\\parts\\' + name.toLowerCase() + '.json';
  const caseDir = normPath(path.resolve(dir)), caseTail = '\\' + normPath(path.basename(path.resolve(dir)));
  const moved = parts.length > 0 && !parts.some(p => agents.some(a => a.writes.has(here(p.name))));
  const file = (name, a) => (moved ? (a ? [...a.writes.keys()].find(k => k.endsWith(tail(name))) || '' : '') : here(name));
  const writers = name => agents.filter(a => (moved ? !!file(name, a) : a.writes.has(here(name))));
  const provenance = { transcripts: agents.length, parts: [], unproven: [], searches_listed: 0, newest_search: '', moved };
  for (const p of parts) {
    const w = writers(p.name), a = w[0];
    const made = a ? replay(a.writes.get(file(p.name, a))) : null;
    const rec = { part: p.name, sha1: p.sha1, agent: a ? a.id : '', label: a ? a.label : '', writers: w.length, content_matches: made !== null && sha(made) === p.sha1, label_matches: !!a && a.label.split(':')[0] === p.name, model: a ? a.models.join(' + ') : '' };
    // 3. THAT THE JUDGES JUDGED BLIND AND THE TRANSLATOR TRANSLATED FIRST: from the order of what each opened and wrote.
    const role = p.name.replace(/^\d+-/, '');
    if (SEALED.includes(role)) {
      const mine = a ? a.events.filter(e => e.kind === 'write' && e.path === file(p.name, a)).map(e => e.i) : [], limit = mine.length ? (role === 'translate' ? Math.min(...mine) : Math.max(...mine)) : -1;
      // (a name with a wildcard counts when it is a name inside this case folder)
      const inCase = e => e.what !== 'a file named with a wildcard' || normPath(e.text).includes(caseTail + '\\');
      let early = a ? a.events.filter(e => e.kind === 'open' && e.i < limit && tooEarly(role, p.name, e.what) && inCase(e)) : [];
      // Where a pair is planted among those a translator is given, he may not look up which ids are real either: until his
      // part is final he opens only his list and, after his own translations are written, the English given for it.
      if (a && role === 'translate' && Number((q || {}).rules) >= C.PLANT_RULES) early = early.concat(a.events.filter(e => e.kind === 'open' && e.i < Math.max(...mine, -1) && e.what !== 'the given English' && tooEarly(role, p.name, e.what) && inCase(e)));
      const saw = early.map(e => e.what);
      // By what came back: every answer he received before that moment is looked through for what he may not see, however he
      // asked for it. His own part is his own (read back, or echoed by the tool that wrote it).
      const before = a ? a.calls.filter(c => c.i < limit && c.file !== file(p.name, a) && !(opened(c.text).length === 1 && opened(c.text)[0] === 'part:' + p.name.toLowerCase())) : [];
      if (role === 'judge' || role === 'judge2') {
        // A search tool pointed at the case folder or its parts reaches every file in it, unless it names the one file it is for
        // and that file is the blind view or his own part.
        const mineOnly = c => ['view-blind.md', p.name.toLowerCase() + '.json'].includes(c.only.replace(/^.*\\/, ''));
        for (const c of before) { for (const [re, what] of SHOWN) if (re.test(c.out)) saw.push(what); if (c.folder && !mineOnly(c) && (c.folder === caseDir || c.folder === caseDir + '\\parts' || c.folder.endsWith(caseTail) || c.folder.endsWith(caseTail + '\\parts'))) saw.push('a search of the case folder'); }
        // A note, not a fault: he read the checker's own scripts or its rules file before his part was final.
        if (before.some(readRules)) rec.read_rules = true;
      }
      if (role === 'translate') {
        if (before.some(c => GIVEN_SHOWN.test(c.out))) saw.push('the given English (by what came back to him)');
        // "Translated first" is a statement about what his first write held: his own English, of at least three words, for every
        // passage he goes on to judge. A first write that holds none of it proves no order at all.
        const firstAt = Math.min(...mine), first = a ? a.events.find(e => e.kind === 'write' && e.i === firstAt) : null, own = new Set();
        try { for (const t of arr(JSON.parse(String((first || {}).content || '').trim()).translations)) if (String(t.own_translation || '').trim().split(/\s+/).filter(Boolean).length >= 3) own.add(String(t.evidence_id)); } catch (e) { /* the first write holds no list */ }
        const judged = arr(p.p.translations).map(t => String(t.evidence_id)), lacking = judged.filter(id => !own.has(id));
        rec.translated = { judged: judged.length, first: judged.length - lacking.length };
        if (lacking.length) saw.push('no translation of his own in his first write for ' + lacking.slice(0, 4).join(', ') + (lacking.length > 4 ? ' and ' + (lacking.length - 4) + ' more' : ''));
      }
      rec.sealed = mine.length > 0 && saw.length === 0; rec.saw = [...new Set(saw)].slice(0, 6);
    }
    provenance.parts.push(rec);
  }
  // What the record shows beside the parts that are here. A part some agent wrote for this question that is not in the folder now
  // was taken out by somebody; an agent that was given a part of this question and wrote none was stopped, or failed. Both are said.
  const folder = normPath(path.resolve(dir, 'parts')) + '\\', anyTail = '\\' + normPath(path.basename(path.resolve(dir))) + '\\parts\\', qid = String((q || {}).id || path.basename(path.resolve(dir)));
  const partIn = k => { const i = moved ? k.lastIndexOf(anyTail) : (k.startsWith(folder) ? 0 : -1), m = i < 0 ? null : /^(\d+-[\w-]+)\.json$/.exec(k.slice(i + (moved ? anyTail : folder).length)); return m ? m[1] : ''; };
  const writtenParts = [...new Set(agents.flatMap(a => [...a.writes.keys()].map(partIn)).filter(Boolean))];
  provenance.written_missing = writtenParts.filter(name => !fs.existsSync(path.join(dir, 'parts', name + '.json'))).sort();
  provenance.parts_written = writtenParts.length;
  // The question and the claim are what the agents were given, not what question.json says today: every agent's first message
  // from the harness carries both, and they are compared with the file (spacing aside).
  let Q = {}; try { Q = JSON.parse(fs.readFileSync(path.join(dir, 'question.json'), 'utf8')); } catch (e) { /* no question file */ }
  const told = agents.filter(a => a.given && a.given.id === qid);
  provenance.question_given = told.length;
  provenance.question_differs = told.filter(a => flat(a.given.question) !== flat(Q.question) || flat(a.given.claim) !== flat(Q.claim)).map(a => a.label || a.id).sort();
  provenance.started_no_part = agents.filter(a => { const m = /^(\d+-[\w-]+):(.*)$/.exec(a.label); return !!m && m[2] === qid && ![...a.writes.keys()].some(k => partIn(k) === m[1].toLowerCase()); }).map(a => a.label).sort();
  const searches = {};
  // A roadblock's own searches first: every one of them must be in the right agent's record.
  for (const rb of arr(q && q.roadblocks)) {
    const first = writers(rb.part)[0], second = writers((rb.second_search || {}).part)[0];
    const a1 = arr(rb.attempts), a2 = arr((rb.second_search || {}).attempts);
    const failed = new Set();
    for (const [list, agent] of [[a1, first], [a2, second]]) for (const a of list) { const h = match(agent, a); a.proved_by = h && !h.differs ? agent.id : ''; if (h) a.result_seen = (h.differs ? 'DIFFERS: ' : '') + h.seen; else delete a.result_seen; if (h && h.failed) failed.add(a); }   // a search whose written result is not what came back is not proven
    // Every listed search must be in the record (nothing listed that was not done). What counts toward "searched enough" is
    // narrower: different searches that came back with an answer. A fetch that was refused looked at nothing.
    const answered = list => new Set(list.filter(a => a.proved_by && !failed.has(a)).map(listing)).size;
    const p = searches[rb.id] = {
      first_proved: a1.filter(a => a.proved_by).length, first_total: a1.length, first_answered: answered(a1),
      second_proved: a2.filter(a => a.proved_by).length, second_total: a2.length, second_answered: answered(a2),
      first_agent: first ? first.id + ' (' + first.label + ')' : '', second_agent: second ? second.id + ' (' + second.label + ')' : '',
      independent: !!first && !!second && first.id !== second.id, hash: signRb(rb),
    };
    p.ok = p.first_proved === p.first_total && p.first_answered >= R.min_attempts && p.second_proved === p.second_total && p.second_answered >= R.min_second_attempts && p.independent;
  }
  // Every other search a part says it ran (in a side's libraries, for a later position, for the support of a point, for a further
  // answer, for dissent) is looked for in its writer's record too. One that is not there is marked, and the checks do not count it.
  for (const { name, p } of parts) {
    const w = writers(name)[0];
    const listed = arr(p.searched).concat(arr(p.looked_for_more), arr(p.other_objections_searched), arr(p.later).flatMap(l => arr(l.searched)), arr(p.premises).flatMap(m => arr(m.looked)), arr(p.consensus_claims).flatMap(c => arr(c.dissent_search)));
    for (const a of listed) {
      provenance.searches_listed++;
      const h = match(w, a);
      // Not counted either way; but "made and refused" is not the same statement as "not in the record", and each is said as it is.
      if (!h || h.failed || h.differs) provenance.unproven.push({ part: name, where: String(a.where || '').trim(), query: String(a.query || '').trim(), why: !h ? 'not in the record' : h.differs ? 'the result written does not match what came back' : 'made, got no answer', seen: h ? h.seen.slice(0, 120) : '' });
    }
  }
  // When the newest search behind this case was made: a conclusion cannot be more current than its last look at the sources.
  provenance.newest_search = agents.filter(a => provenance.parts.some(x => x.agent === a.id)).flatMap(a => a.searches.map(s => s.ts)).filter(Boolean).sort().pop() || '';
  return { provenance, searches };
}

function main() {
  const [dir, ...sources] = process.argv.slice(2);
  if (!dir || !sources.length) { console.error('usage: node domain/mizan/prove.js <case folder> <transcript folder or .jsonl file> [...]'); process.exitCode = 2; return; }
  let q = null; try { q = JSON.parse(fs.readFileSync(path.join(dir, 'case.json'), 'utf8')).questions[0]; } catch (e) { console.error('build the case first: node domain/mizan/case.js build "' + dir + '"'); process.exitCode = 2; return; }
  const r = prove(dir, sources, q);
  fs.writeFileSync(path.join(dir, 'provenance.json'), JSON.stringify(Object.assign({ proved_on: localDay(new Date()) }, r), null, 2) + '\n');
  const seen = new Map(), R = RULES.roadblock; let bad = 0;
  if (r.provenance.moved) console.log('NOTE     this folder is not where the agents wrote: its parts are matched by question id, part name and content');
  for (const p of r.provenance.parts) {
    const state = !p.agent ? 'NO WRITER IN THE RECORD' : p.writers > 1 ? 'MORE THAN ONE WRITER' : !p.content_matches ? 'NOT WHAT ITS AGENT WROTE (changed afterwards, or not written with the Write tool)' : !p.label_matches ? 'WRITTEN BY AN AGENT GIVEN ANOTHER TASK' : seen.has(p.agent) ? 'SAME AGENT AS ' + seen.get(p.agent) : 'written by';
    if (state !== 'written by') bad++; else seen.set(p.agent, p.part);
    const nothing = p.saw && p.saw.length ? p.saw.join(', ') : 'nothing, and wrote nothing';
    const sealed = p.sealed === undefined ? '' : /-translate$/.test(p.part) ? (p.sealed ? ((p.translated || {}).judged === 0 ? ' | had nothing to translate (his part lists no pair), and opened nothing he may not' : ' | wrote his own translation before opening the given English') : ' | NOT SHOWN TO HAVE TRANSLATED FIRST: before his own translation his record shows ' + nothing)
      : /-second$/.test(p.part) ? (p.sealed ? ' | opened nothing that shows how the first search was made' : ' | NOT SHOWN TO HAVE SEARCHED ON HIS OWN: before his part was final he opened ' + nothing)
      : (p.sealed ? ' | opened nothing that shows another\'s marks before his own were final' : ' | NOT SHOWN TO HAVE JUDGED BLIND: before his marks were final he opened ' + nothing);
    console.log((state === 'written by' ? 'PROVEN   ' : 'UNPROVEN ') + p.part + ' | ' + state + ' ' + (p.agent ? p.agent + ' (' + p.label + ')' : '') + (p.model ? ' on ' + p.model : '') + sealed + (p.read_rules ? ' | read the checker\'s own rules before writing' : ''));
  }
  if (r.provenance.written_missing.length) { bad++; console.log('WRITTEN AND MISSING ' + r.provenance.written_missing.join(', ') + ' | parts written in the records ' + r.provenance.parts_written + ', in the case ' + r.provenance.parts.length); }
  if (r.provenance.question_differs.length) { bad++; console.log('QUESTION CHANGED | the question or the claim in question.json is not what the agents were given (' + r.provenance.question_differs.slice(0, 4).join(', ') + (r.provenance.question_differs.length > 4 ? ' and ' + (r.provenance.question_differs.length - 4) + ' more' : '') + ')'); }
  else if (!r.provenance.question_given) console.log('NOTE     no agent record carries the question it was given: question.json is compared with nothing');
  if (r.provenance.started_no_part.length) console.log('STARTED AND WROTE NO PART ' + r.provenance.started_no_part.join(', '));
  for (const rb of arr(q.roadblocks)) {
    const p = r.searches[rb.id]; if (!p.ok) bad++;
    console.log((p.ok ? 'PROVEN   ' : 'UNPROVEN ') + rb.id + ' | ' + String(rb.sought).slice(0, 60) + ' | first search ' + p.first_proved + ' of ' + p.first_total + ' in the record of ' + (p.first_agent || 'nobody') + ' (' + p.first_answered + ' different, answered; ' + R.min_attempts + ' needed) | second search ' + p.second_proved + ' of ' + p.second_total + ' in the record of ' + (p.second_agent || 'nobody') + ' (' + p.second_answered + ' different, answered; ' + R.min_second_attempts + ' needed)' + (p.independent ? '' : ' | NOT shown to be two agents'));
    for (const a of arr(rb.attempts).concat(arr((rb.second_search || {}).attempts))) {
      if (!a.proved_by) console.log((/^DIFFERS: /.test(a.result_seen || '') ? '   the result written does not match what came back: ' : '   not in that agent\'s record: ') + String(a.where).slice(0, 40) + ' | ' + String(a.query).slice(0, 60) + ' | ' + (a.url || ''));
      else if (/^FAILED: /.test(a.result_seen || '')) console.log('   made, got no answer (listed truly, not counted): ' + String(a.where).slice(0, 40) + ' | ' + (a.url || String(a.query).slice(0, 60)) + ' | ' + a.result_seen.slice(0, 90));
    }
  }
  const gone = r.provenance.unproven.filter(u => u.why === 'not in the record'), differ = r.provenance.unproven.filter(u => /does not match/.test(u.why)), refused = r.provenance.unproven.length - gone.length - differ.length;
  for (const u of r.provenance.unproven) console.log('NOT COUNTED ' + u.part + ' | ' + (u.why === 'not in the record' ? 'a search it lists is not in its writer\'s record' : /does not match/.test(u.why) ? 'the result written does not match what came back' : 'a search it lists was made and got no answer') + ': ' + u.where.slice(0, 40) + ' | ' + u.query.slice(0, 70) + (u.seen ? ' | ' + u.seen.slice(0, 80) : ''));
  console.log('other searches listed: ' + r.provenance.searches_listed + ' · counted (in the writer\'s record, answered): ' + (r.provenance.searches_listed - r.provenance.unproven.length) + ' · made but got no answer (an error, a library that did not answer, a result never read): ' + refused + ' · not in the record: ' + gone.length + (differ.length ? ' · written result not what came back: ' + differ.length : '') + ' · newest search behind this case: ' + (r.provenance.newest_search || 'none'));
  console.log('MIZAN PROVE: ' + r.provenance.transcripts + ' agent record(s) read · ' + r.provenance.parts.length + ' part(s) · ' + arr(q.roadblocks).length + ' roadblock(s) · ' + bad + ' unproven → then build the case again');
  process.exitCode = bad ? 1 : 0;
}
if (require.main === module) main();
module.exports = { readAgents, prove, match, replay };
