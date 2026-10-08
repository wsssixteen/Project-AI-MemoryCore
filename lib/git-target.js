#!/usr/bin/env node
// git-target.js — which repo does a git call inside a shell command act on, and how sure is that?
//
// WHY (2026-10-02, AWAM stag-env PDBB fix): the push gate read `cd E:\…\stag-awam-pdbb; git push` as repo
// "E:\…\stag-awam-pdbb;" and both gates decided "is this etanah-awam?" from the folder NAME. The remote URL
// is the repo's identity; the folder name is not.
//
// v3 (2026-10-05) — rebuilt after two independent reviews proved 37 ways through the push gate, 24 of them
// older than v2. The lesson: command text can be written in endless ways, so this file no longer tries to
// GUESS. It answers three questions for ONE git call and says plainly when it does not know:
//   id         the repo, by its origin remote (null = unknown)
//   named      the command itself says where git runs (a cd before the call, or git -C)
//   unresolved it says so, and which repo that is cannot be told WITH CERTAINTY — `why` names the reason
// A gate that guards something treats `unresolved` as the unsafe case.
//
// What "certain" means here (each line is a hole one of the reviews demonstrated):
//   - every git call in the command is found: at the start, after ; & | newline ( { = and after `&` (call
//     operator), with git.exe, with env prefixes, with options before the verb (-c k=v, --no-pager, several -C)
//   - `-C` is matched case-sensitively: `git -c http.x=y push` is not `git -C <dir>`
//   - text inside quotes, here-strings and heredocs is not a command (it is reported as `quoted`)
//   - a cd is followed in ORDER from the tool's cwd; a relative cd or -C builds on the one before it
//   - a cd to a folder that does not exist is NOT trusted: in PowerShell the next statement then runs in the
//     OLD folder. Same for popd / Pop-Location / `cd -`, and for a cd inside ( ) in a POSIX shell
//   - a path is read the way the SHELL of that tool reads it: /e/Dev/x is a drive path in Git Bash only
//   - a variable is substituted only when its value is certain: a complete quoted literal, assigned in the
//     same command BEFORE the call, with no other assignment to that name in between; never inside single
//     quotes; $env:NAME only from an assignment in the command or from a short list of stable names
//   - the tool's own cwd is a real path from the harness and is never parsed as shell text
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const Q = String.raw`(?:"([^"]*)"|'([^']*)'|([^\s;&|"']+))`;
// Where a statement can begin: start, ; & | newline ( { = (assignment), plus keywords that open a block.
const SEP = String.raw`(?:^|[;&|\r\n({=]|\b(?:then|do|else|try|catch|finally)\b)\s*`;
const ENV_PREFIX = String.raw`(?:[A-Za-z_]\w*=(?:"[^"]*"|'[^']*'|[^\s;&|]*)\s+)*`;
const GIT_WORD = String.raw`(?:"[^"\r\n]*[\\/][Gg]it(?:\.exe)?"|'[^'\r\n]*[\\/][Gg]it(?:\.exe)?'|[Gg]it(?:\.exe)?|GIT(?:\.EXE)?)`;
// git's own options before the verb. -C is upper-case only.
const GIT_OPTS = String.raw`(?:\s+(?:-C\s+` + Q + String.raw`|-c\s+(?:"[^"]*"|'[^']*'|\S+)|--(?:git-dir|work-tree|namespace|exec-path|super-prefix|config-env|list-cmds)(?:=(?:"[^"]*"|'[^']*'|\S+)|\s+(?:"[^"]*"|'[^']*'|\S+))|--[a-z][a-z-]*|-[pP]))*`;
const CD_WORDS = String.raw`(?:cd|chdir|sl|Set-Location|Push-Location|pushd)`;
const STABLE_ENV = new Set(['TEMP', 'TMP', 'HOME', 'USERPROFILE']);

function clean(p) {
  return String(p || '').trim().replace(/[;&|]+$/, '').replace(/^["']|["']$/g, '');
}

// ── quoted spans: [start, end) of the INSIDE of "…", '…', PowerShell here-strings and shell heredocs ──
function quotedSpans(cmd) {
  const c = String(cmd || ''); const spans = [];
  let i = 0;
  while (i < c.length) {
    const ch = c[i];
    if (ch === '@' && (c[i + 1] === '"' || c[i + 1] === "'") && /[\r\n]/.test(c[i + 2] || '')) {       // PowerShell here-string
      const q = c[i + 1]; const end = c.indexOf('\n' + q + '@', i + 2);
      const stop = end < 0 ? c.length : end + 1;
      spans.push({ start: i + 2, end: stop, quote: q === '"' ? 'double' : 'single', here: true }); i = stop + 2; continue;
    }
    if (ch === '<' && c[i + 1] === '<') {                                                                // shell heredoc
      const m = /^<<-?\s*(["']?)([A-Za-z_]\w*)\1[^\r\n]*\r?\n/.exec(c.slice(i));
      if (m) {
        const bodyStart = i + m[0].length; const endRx = new RegExp('^[ \\t]*' + m[2] + '[ \\t]*$', 'm');
        const e = endRx.exec(c.slice(bodyStart)); const stop = e ? bodyStart + e.index : c.length;
        spans.push({ start: bodyStart, end: stop, quote: m[1] === '' ? 'double' : 'single', here: true }); i = stop; continue;
      }
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < c.length) {
        if (ch === '"' && (c[j] === '`' || c[j] === '\\') && j + 1 < c.length) { j += 2; continue; }      // escaped char inside "…"
        if (c[j] === ch) { if (ch === "'" && c[j + 1] === "'") { j += 2; continue; } break; }             // '' inside '…' (PowerShell)
        j++;
      }
      spans.push({ start: i + 1, end: j, quote: ch === '"' ? 'double' : 'single' }); i = j + 1; continue;
    }
    i++;
  }
  return spans;
}
function spanAt(spans, idx) { return spans.find(s => idx >= s.start && idx < s.end) || null; }

// ── every git call in the command ──
// → { index (of the word git), end, verb, dirs:[{text, quote}], gitDirOpt, args, quoted }
function findGitCalls(cmd, verb, opts) {
  const c = String(cmd || ''); const spans = (opts && opts.spans) || quotedSpans(c);
  const rx = new RegExp('(' + SEP + ')(?:&\\s*)?(' + ENV_PREFIX + ')(' + GIT_WORD + ')(' + GIT_OPTS + ')\\s+(' + (verb || '[a-z][\\w-]*') + ')(?![\\w-])', 'g');
  const calls = [];
  let m;
  while ((m = rx.exec(c)) !== null) {
    // groups: 1 SEP · 2 env prefix · 3 git word · 4 options (with 3 inner Q groups of the LAST -C) · last = verb
    const gitIdx = m.index + m[1].length + (m[0].slice(m[1].length).match(/^&\s*/) || [''])[0].length + m[2].length;
    const optText = m[4] || '';
    const verbText = m[m.length - 1];
    const end = m.index + m[0].length;
    const dirs = [];
    const dr = new RegExp('(?:^|\\s)-C\\s+' + Q, 'g'); let d;
    while ((d = dr.exec(optText)) !== null) dirs.push({ text: d[1] !== undefined ? d[1] : (d[2] !== undefined ? d[2] : d[3]), quote: d[1] !== undefined ? 'double' : (d[2] !== undefined ? 'single' : 'bare') });
    const gitDirOpt = /(?:^|\s)--(?:git-dir|work-tree)\b/.test(optText);
    // args: up to the next statement separator outside quotes
    let k = end; let inQ = null;
    for (; k < c.length; k++) {
      const ch = c[k];
      if (inQ) { if (ch === inQ) inQ = null; continue; }
      if (ch === '"' || ch === "'") { inQ = ch; continue; }
      if (ch === ';' || ch === '\n' || ch === '\r' || ch === '|' || ch === ')' || ch === '}') break;
      if (ch === '&' && c[k + 1] === '&') break;
    }
    const sp = spanAt(spans, gitIdx);
    calls.push({ index: gitIdx, end, verb: verbText, dirs, gitDirOpt, args: c.slice(end, k), quoted: !!sp, span: sp || null });
    rx.lastIndex = Math.max(rx.lastIndex, end);
  }
  return calls;
}

// ── variables assigned in the same command, with their position ──
function assignments(cmd, spans) {
  const c = String(cmd || ''); const out = [];
  const TERM = String.raw`(?=\s*(?:;|\r|\n|$|&&|\|\|))`;
  let m;
  const ps = new RegExp('(' + SEP + ')\\$(env:)?([A-Za-z_]\\w*)\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')' + TERM, 'gi');
  while ((m = ps.exec(c)) !== null) { const idx = m.index + m[1].length; if (spanAt(spans, idx)) continue; out.push({ style: 'ps', env: !!m[2], name: m[3].toLowerCase(), index: idx, value: m[4] !== undefined ? m[4] : m[5], quote: m[4] !== undefined ? 'double' : 'single' }); }
  const sh = new RegExp('(' + SEP + ')(?:(?:export|local|readonly|declare(?:\\s+-\\w+)*)\\s+)?([A-Za-z_]\\w*)=(?:"([^"]*)"|\'([^\']*)\'|([^\\s;&|"\'$`()]*))' + TERM, 'g');
  while ((m = sh.exec(c)) !== null) { const idx = m.index + m[1].length; if (spanAt(spans, idx)) continue; out.push({ style: 'sh', env: false, name: m[2], index: idx, value: m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : m[5]), quote: m[3] !== undefined ? 'double' : (m[4] !== undefined ? 'single' : 'bare') }); }
  return out;
}
// every place the command gives that name a value in ANY form (so an unreadable assignment is noticed)
function looseAssignCount(cmd, spans, style, env, name, before) {
  const c = String(cmd || '');
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = style === 'ps'
    ? new RegExp('\\$' + (env ? 'env:' : '(?:(?:script|global|local):)?') + esc + '\\s*(?:[+\\-*/]?=)(?!=)', 'gi')
    : new RegExp('(?:^|[;&|\\r\\n({\\s])(?:(?:export|local|readonly|declare(?:\\s+-\\w+)*)\\s+)?' + esc + '\\+?=', 'g');
  let n = 0, m;
  while ((m = rx.exec(c)) !== null) { if (m.index >= before) break; if (spanAt(spans, m.index + (m[0].length - 1))) continue; n++; }
  if (style === 'sh') {                                                    // `read r`, `for r in …` also set it
    const rd = new RegExp('(?:^|[;&|\\r\\n({]\\s*)(?:read(?:\\s+-\\w+)*\\s+' + esc + '\\b|for\\s+' + esc + '\\s+in\\b)', 'g');
    while ((m = rd.exec(c)) !== null) { if (m.index >= before) break; n++; }
  }
  return n;
}

// ── a directory as WRITTEN in a command → a path git can open, read the way THAT shell reads it ──
// ctx = { cmd, spans, assigns, shell ('bash' | 'powershell'), pos (where it is used), base (dir so far) }
// → { path } or { why }
function resolveWritten(text, quote, ctx, depth) {
  let d = String(text || '');
  if (!d) return { why: 'empty path' };
  if ((depth || 0) > 5) return { why: 'variable (nested too deep)' };
  const shell = ctx.shell === 'bash' ? 'bash' : 'powershell';
  if (quote !== 'single') {
    if (/`|\$\(/.test(d)) return { why: 'command substitution' };
    let unknown = null;
    d = d.replace(/\$\{?(env:)?([A-Za-z_]\w*)\}?/gi, (all, env, name) => {
      const style = shell === 'bash' ? 'sh' : 'ps';
      const key = style === 'ps' ? name.toLowerCase() : name;
      const isEnv = !!env;
      const mine = ctx.assigns.filter(a => a.style === style && a.env === isEnv && a.name === key && a.index < ctx.pos);
      const loose = looseAssignCount(ctx.cmd, ctx.spans, style, isEnv, name, ctx.pos);
      if (loose !== mine.length) { unknown = unknown || 'variable $' + name + ' (set in a way that cannot be read)'; return all; }
      if (mine.length) {
        const a = mine[mine.length - 1];
        if (a.quote === 'single' || !/[$`]/.test(a.value)) return a.value;
        const r = resolveWritten(a.value, 'double', Object.assign({}, ctx, { pos: a.index, base: ctx.base }), (depth || 0) + 1);
        if (r.path === undefined && r.text === undefined) { unknown = unknown || r.why; return all; }
        return r.text;
      }
      // not assigned in the command: only a short list of stable environment names, and only when written as an env read
      if ((isEnv || style === 'sh') && STABLE_ENV.has(name.toUpperCase()) && process.env[name.toUpperCase()] !== undefined) return process.env[name.toUpperCase()];
      unknown = unknown || 'variable $' + name + ' (not set in this command)';
      return all;
    });
    if (unknown) return { why: unknown };
    if (shell !== 'bash') {
      d = d.replace(/%([A-Za-z_]\w*)%/g, (all, name) => (STABLE_ENV.has(name.toUpperCase()) && process.env[name.toUpperCase()] !== undefined ? process.env[name.toUpperCase()] : all));
      if (/%[A-Za-z_]\w*%/.test(d)) return { why: 'variable %…%' };
    }
    if (shell === 'bash' && quote === 'bare') d = d.replace(/\\(.)/g, '$1');     // an unquoted backslash is an escape in a POSIX shell
  } else if (/^\$/.test(d) && shell !== 'bash') {
    // single quotes: literal text. A path that really starts with $ is possible but then it will simply not exist.
  }
  const text2 = d;
  if (/^~(?=$|[\\/])/.test(d)) d = os.homedir() + d.slice(1);
  if (shell === 'bash' && process.platform === 'win32') {
    const drive = d.match(/^\/([A-Za-z])(?:\/(.*))?$/);
    if (drive) d = drive[1].toUpperCase() + ':/' + (drive[2] || '');
    else if (/^\/tmp(?:\/|$)/.test(d)) d = os.tmpdir() + d.slice(4);
  }
  if (!path.isAbsolute(d) || (process.platform === 'win32' && /^[\\/](?![\\/])/.test(d))) {
    if (!ctx.base) return { why: 'relative path with no known starting folder' };
    d = path.resolve(ctx.base, d);
  }
  return { path: d, text: text2 };
}

// the harness cwd is a real path: only a Git Bash drive form is mapped, nothing else is interpreted
function nativePath(p) {
  let d = String(p || ''); if (!d) return null;
  if (process.platform === 'win32') { const drive = d.match(/^\/([A-Za-z])(?:\/(.*))?$/); if (drive) d = drive[1].toUpperCase() + ':/' + (drive[2] || ''); }
  return d;
}

function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000, windowsHide: true }).trim();
}

// { dir, top, remote, name } — name = repo name from the origin URL ("etanah-awam"); null when not a repo.
function repoIdentity(dir) {
  if (!dir) return null;
  let top;
  try { top = path.resolve(git(dir, ['rev-parse', '--show-toplevel'])); } catch (_) { return null; }
  let remote = '';
  try { remote = git(dir, ['remote', 'get-url', 'origin']); } catch (_) {}
  const fromRemote = remote ? remote.replace(/[\\/]+$/, '').split(/[\\/:]/).pop().replace(/\.git$/i, '') : '';
  return { dir, top, remote, name: fromRemote || path.basename(top) };
}

// Was that folder created earlier in the same command (worktree add / clone)? Then it does not exist yet
// when a gate looks, and the honest answer is "run the create step first".
function createdEarlier(cmd, before, target) {
  const head = String(cmd || '').slice(0, before).replace(/\\/g, '/').toLowerCase();
  const t = String(target || '').replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '');
  if (!t) return false;
  const tail = t.split('/').pop();
  return /\b(?:worktree\s+add|clone)\b/.test(head) && (head.includes(t) || (tail.length > 3 && head.includes(tail)));
}

// ── follow every cd before `upto`, in order, starting from the tool cwd ──
function cdChain(cmd, upto, cwd, shell, pre) {
  const c = String(cmd || ''); const spans = pre.spans; const assigns = pre.assigns;
  let dir = cwd || null, named = false, certain = true, why = null, raw = null;
  const events = [];
  let m;
  const cd = new RegExp('(' + SEP + ')(' + CD_WORDS + ')\\s+(?:/d\\s+)?(?:-(?:LiteralPath|Path)\\s+)?' + Q, 'gi');
  while ((m = cd.exec(c)) !== null) { const idx = m.index + m[1].length; if (idx >= upto) break; if (spanAt(spans, idx)) continue; events.push({ idx, kind: 'cd', text: m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : m[5]), quote: m[3] !== undefined ? 'double' : (m[4] !== undefined ? 'single' : 'bare'), end: m.index + m[0].length }); }
  const pop = new RegExp('(' + SEP + ')(?:popd|Pop-Location)\\b|(' + SEP + ')(?:cd|chdir|sl|Set-Location)\\s+-(?=\\s|;|$)', 'gi');
  while ((m = pop.exec(c)) !== null) { const idx = m.index + (m[1] || m[2] || '').length; if (idx >= upto) break; if (spanAt(spans, idx)) continue; events.push({ idx, kind: 'pop' }); }
  const bare = new RegExp('(' + SEP + ')(?:cd|Set-Location|sl)\\s*(?=;|\\r|\\n|$|&&|\\|\\|)', 'gi');   // `cd` with no argument = home
  while ((m = bare.exec(c)) !== null) { const idx = m.index + m[1].length; if (idx >= upto) break; if (spanAt(spans, idx)) continue; events.push({ idx, kind: 'home' }); }
  events.sort((a, b) => a.idx - b.idx);
  for (const e of events) {
    named = true;
    if (e.kind === 'pop') { certain = false; why = why || 'a popd / Pop-Location / cd - comes before the git call'; continue; }
    if (e.kind === 'home') { certain = false; why = why || 'a cd with no folder comes before the git call'; continue; }
    raw = e.text;
    // a cd inside ( … ) that closes before the git call: a subshell in POSIX shells, a real move in PowerShell
    const open = c.lastIndexOf('(', e.idx);
    if (open >= 0 && !spanAt(spans, open)) { const close = c.indexOf(')', e.end); if (close >= 0 && close < upto && c.slice(open, e.idx).indexOf(')') < 0) { certain = false; why = why || 'the cd sits inside ( … ) that closes before the git call'; continue; } }
    // an ABSOLUTE cd sets the folder whatever happened before it, so it restores certainty; a relative one inherits the doubt
    const abs = resolveWritten(e.text, e.quote, { cmd: c, spans, assigns, shell, pos: e.idx, base: null });
    const r = abs.path !== undefined ? abs : resolveWritten(e.text, e.quote, { cmd: c, spans, assigns, shell, pos: e.idx, base: certain ? dir : null });
    if (r.path === undefined) { if (certain) { certain = false; why = why || r.why; } continue; }
    if (abs.path !== undefined && !certain) { certain = true; why = null; }
    let isDir = false; try { isDir = fs.statSync(r.path).isDirectory(); } catch (_) {}
    if (!isDir) {
      certain = false;
      why = why || (createdEarlier(c, e.idx, r.path) ? 'the folder is created by this same command (' + r.path + ')' : 'the folder does not exist (' + r.path + '); a failed cd leaves the next statement in the old folder');
      continue;
    }
    dir = r.path;
  }
  return { dir, named, certain, why, raw };
}

// ── the repo ONE git call acts on ──
function targetOfCall(cmd, call, cwd, shell, pre) {
  const p = pre || { spans: quotedSpans(cmd), assigns: null };
  if (!p.assigns) p.assigns = assignments(cmd, p.spans);
  const base = nativePath(cwd);
  const cwdId = repoIdentity(base);
  const chain = cdChain(cmd, call.index, base, shell, p);
  let dir = chain.dir, named = chain.named, certain = chain.certain, why = chain.why, raw = chain.raw;
  for (const d of call.dirs) {
    named = true; raw = d.text;
    // an ABSOLUTE -C does not depend on the cd before it, so it restores certainty; a relative one inherits the doubt
    const r = resolveWritten(d.text, d.quote, { cmd, spans: p.spans, assigns: p.assigns, shell, pos: call.index, base: certain ? dir : null });
    if (r.path === undefined) { if (certain) { certain = false; why = why || r.why; } break; }
    if (!certain) { certain = true; why = null; }
    let isDir = false; try { isDir = fs.statSync(r.path).isDirectory(); } catch (_) {}
    if (!isDir) { certain = false; why = why || (createdEarlier(cmd, call.index, r.path) ? 'the folder is created by this same command (' + r.path + ')' : 'the folder does not exist (' + r.path + ')'); dir = r.path; break; }
    dir = r.path;
  }
  if (call.gitDirOpt) { named = true; certain = false; why = why || 'git --git-dir / --work-tree is used'; }
  if (call.quoted) { named = true; certain = false; why = why || 'the git call sits inside a quoted string'; }
  let id = null;
  if (!named) id = cwdId;
  else if (certain) { id = repoIdentity(dir); if (!id) { why = why || 'that folder is not a git repo (' + dir + ')'; } }
  return { dir: dir || raw || base || null, raw, named, certain, unresolved: named && (!certain || !id), why: named && (!certain || !id) ? (why || 'unknown') : null, id, cwdId, viaCd: chain.named && !call.dirs.length };
}

// ── compatibility API (first matching call of the command) ──
// The repo a command's `git <verb>` acts on. verb null = any git call; when the command has no git call at
// all (a raw `mvn compile`), the cd chain of the whole command is used.
function targetRepo(cmd, fallbackCwd, verb, shell) {
  const spans = quotedSpans(cmd); const pre = { spans, assigns: assignments(cmd, spans) };
  const calls = findGitCalls(cmd, verb, { spans }).filter(c => !c.quoted);
  if (calls.length) return targetOfCall(cmd, calls[0], fallbackCwd, shell, pre);
  const base = nativePath(fallbackCwd);
  const chain = cdChain(cmd, String(cmd || '').length, base, shell, pre);
  const cwdId = repoIdentity(base);
  let id = null, why = chain.why;
  if (!chain.named) id = cwdId; else if (chain.certain) { id = repoIdentity(chain.dir); if (!id) why = why || 'that folder is not a git repo (' + chain.dir + ')'; }
  const unresolved = chain.named && (!chain.certain || !id);
  return { dir: chain.dir || chain.raw || base || null, raw: chain.raw, named: chain.named, certain: chain.certain, unresolved, why: unresolved ? (why || 'unknown') : null, id, cwdId, viaCd: chain.named };
}

// Directory text as written (first -C of the first call, else the last cd before it). Kept for callers that only
// need the text; a decision must use targetRepo / targetOfCall.
function cmdDir(cmd, verb) {
  const spans = quotedSpans(cmd);
  const call = findGitCalls(cmd, verb, { spans }).filter(c => !c.quoted)[0];
  if (call && call.dirs.length) return clean(call.dirs[0].text);
  const c = String(cmd || ''); const limit = call ? call.index : c.length;
  const cd = new RegExp('(' + SEP + ')' + CD_WORDS + '\\s+(?:/d\\s+)?(?:-(?:LiteralPath|Path)\\s+)?' + Q, 'gi');
  let m, last = null;
  while ((m = cd.exec(c)) !== null) { const idx = m.index + m[1].length; if (idx >= limit) break; if (spanAt(spans, idx)) continue; last = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]); }
  return last ? clean(last) : null;
}

// True when the command really invokes `git <verb>` outside any quoted text.
function invokesGit(cmd, verb) { return findGitCalls(cmd, verb).some(c => !c.quoted); }

// shell of a tool call: Git Bash for the Bash tool, PowerShell for everything else (PowerShell tool, Terminal panel)
function shellOf(toolName) { return toolName === 'Bash' ? 'bash' : 'powershell'; }

module.exports = { cmdDir, repoIdentity, targetRepo, targetOfCall, findGitCalls, quotedSpans, assignments, resolveWritten, nativePath, invokesGit, shellOf, clean };

if (require.main === module) {
  const cmd = process.argv.slice(2).join(' ');
  console.log(JSON.stringify(targetRepo(cmd, process.cwd(), null, 'powershell'), null, 2));
}
