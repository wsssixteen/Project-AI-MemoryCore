#!/usr/bin/env node
// memory-write-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-10-05 commit subjects written in formal Malay on #244600: the only corrective action was a line added to feedback_commit_deploy_runbook.md, while the rule's home was the commit workflow gate
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'memory-write-gate.check.hook.js');
const REAL_ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// Sandbox: base = the "main repo", base/.claude/worktrees/wt = the "worktree" (CLAUDE_PROJECT_DIR).
function sandbox() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'mwg-'));
  const root = path.join(base, '.claude', 'worktrees', 'wt');
  const put = (p, t) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t); };
  for (const f of ['hook-runtime.js', 'turn-context.js']) put(path.join(root, 'lib', f), fs.readFileSync(path.join(REAL_ROOT, 'lib', f)));
  put(path.join(root, '.claude', 'skills', 'system-design', 'SKILL.md'), '# skill\n');
  put(path.join(root, 'domain', 'commit-subject-gate', 'commit-subject-gate.check.hook.js'), '// gate\n');
  put(path.join(root, 'domain', 'foo-dir', 'inner.js'), '// inner\n');
  put(path.join(base, '.claude', 'skills', 'only-in-main', 'SKILL.md'), '# main only\n');
  fs.mkdirSync(path.join(root, '.claude', 'auto-memory'), { recursive: true });
  fs.mkdirSync(path.join(base, '.claude', 'auto-memory'), { recursive: true });
  const sb = { base, root, put, mem: n => path.join(root, '.claude', 'auto-memory', n), mainMem: n => path.join(base, '.claude', 'auto-memory', n), rel: p => path.join(root, p) };
  sb.log = () => { try { return fs.readFileSync(path.join(root, 'domain', 'memory-write-gate', 'log.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch (_) { return null; } };
  return sb;
}

const U = t => ({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: t }] } });
const A = t => ({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: t }] } });
const TU = (name, input, id) => ({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id, name, input }] } });
const R = (id, text, err) => ({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, is_error: !!err, content: text }] } });
const line = (eb, extra, file) => 'RULE-PLACEMENT: file=' + (file || 'feedback_x.md') + ' · workflow=commit · step=draft subject · enforced-by=' + eb + ' · memory-because=a note keeps the reason next to the rule' + (extra || '');
const ENF = 'domain/commit-subject-gate/commit-subject-gate.check.hook.js';

function fire(sb, o) {
  o = o || {};
  const file = o.file || sb.mem('feedback_x.md');
  let tp = o.transcript;
  if (Array.isArray(o.events)) {
    tp = path.join(sb.base, 't-' + (o.tname || 'a') + '.jsonl');
    fs.writeFileSync(tp, o.events.map(e => JSON.stringify(e)).join(o.crlf ? '\r\n' : '\n') + '\n');
  }
  const input = o.rawStdin !== undefined ? o.rawStdin : JSON.stringify({
    tool_name: o.tool || 'Write',
    tool_input: o.input || { file_path: file, content: o.content !== undefined ? o.content : '---\nname: x\nmetadata:\n  type: feedback\n---\nrule\n' },
    ...(tp ? { transcript_path: tp } : {}),
  });
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8', timeout: 60000, env: { ...process.env, CLAUDE_PROJECT_DIR: sb.root } });
  r.ms = Date.now() - t0;
  return r;
}
const blocked = r => r.status === 2 && /memory-write-gate/.test(r.stderr || '');
const passed = r => r.status === 0;
const lastDecision = sb => { const l = sb.log(); return l && l.length ? l[l.length - 1].decision : null; };

// F0: Rule 9 / Rule 13 build artefacts present
check('F0 NUKE-MARKER.md + README keys present', fs.existsSync(path.join(__dirname, 'NUKE-MARKER.md')) && ['symptom', 'goal', 'goal_signal', 'retention', 'footprint'].every(k => new RegExp('^' + k + ':\\s*\\S', 'm').test(fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8'))), 'missing');
// F0b: registered in settings.json under a matcher that covers Edit, Write and MultiEdit
{
  let reg = false;
  try {
    const s = JSON.parse(fs.readFileSync(path.join(REAL_ROOT, '.claude', 'settings.json'), 'utf8'));
    for (const g of (s.hooks.PreToolUse || [])) for (const h of g.hooks || []) if (/memory-write-gate/.test(h.command) && /Edit/.test(g.matcher || '') && /Write/.test(g.matcher || '') && /MultiEdit/.test(g.matcher || '')) reg = true;
  } catch (_) {}
  check('F0b registered in settings.json PreToolUse (Edit|Write|MultiEdit)', reg, 'not registered');
}

// F1: feedback memory, no line -> BLOCK, message names the file and the three questions
{ const sb = sandbox(); const r = fire(sb, { events: [U('fix it'), A('I will save a note.')] });
  check('F1 no line -> BLOCK', blocked(r), 'exit=' + r.status);
  check('F1 message: names file, 3 questions, shape, pointers', /feedback_x\.md/.test(r.stderr) && /which workflow/.test(r.stderr) && /which step/.test(r.stderr) && /which gate, hook or skill/.test(r.stderr) && /RULE-PLACEMENT: file=<name\.md>/.test(r.stderr) && /one line per memory file/.test(r.stderr) && /system-design\/SKILL\.md/.test(r.stderr) && /system\/INDEX\.md/.test(r.stderr), (r.stderr || '').slice(0, 200));
  check('F1 logged as block', lastDecision(sb) === 'block', JSON.stringify(sb.log())); }

// F2: complete line + existing path + that path edited this turn -> PASS
{ const sb = sandbox(); const r = fire(sb, { events: [U('go'), A(line(ENF)), TU('Edit', { file_path: sb.rel(ENF) }, 't1'), R('t1', 'ok')] });
  check('F2 valid line, existing path, edited this turn -> PASS', passed(r), 'exit=' + r.status + ' ' + r.stderr);
  check('F2 logged as pass', lastDecision(sb) === 'pass', JSON.stringify(sb.log())); }

// F3: path that does not exist -> BLOCK
{ const sb = sandbox(); const r = fire(sb, { events: [U('go'), A(line('domain/nope/nope.hook.js'))] });
  check('F3 path not on disk -> BLOCK, says not found', blocked(r) && /not found on disk/.test(r.stderr), r.stderr); }

// F4: path exists, not edited, no already-enforced -> BLOCK ; with already-enforced -> PASS
{ const sb = sandbox(); const r = fire(sb, { events: [U('go'), A(line(ENF))] });
  check('F4 path exists but not edited -> BLOCK with the exact sentence', blocked(r) && /you named the enforcing file but did not change it; put the rule there first, then write the memory/.test(r.stderr), r.stderr);
  const sb2 = sandbox(); const r2 = fire(sb2, { events: [U('go'), A(line(ENF, ' · already-enforced: the gate already blocks this shape since it was installed'))] });
  check('F4b already-enforced sentence -> PASS', passed(r2), r2.stderr);
  const sb3 = sandbox(); const r3 = fire(sb3, { events: [U('go'), A(line(ENF, ' · already-enforced: n/a'))] });
  check('F4c already-enforced: n/a -> BLOCK', blocked(r3), r3.stderr); }

// F5/F6: new: and none:
{ const sb = sandbox(); check('F5 enforced-by=new: x -> PASS', passed(fire(sb, { events: [U('go'), A(line('new: commit-language-gate'))] })), '');
  const sb2 = sandbox(); check('F6 enforced-by=none: why -> PASS', passed(fire(sb2, { events: [U('go'), A(line('none: this is a tone preference no gate can check'))] })), '');
  const sb3 = sandbox(); check('F5b new: with empty name -> BLOCK', blocked(fire(sb3, { events: [U('go'), A(line('new:'))] })), '');
  const sb4 = sandbox(); check('F6b none: with a one-word reason -> BLOCK', blocked(fire(sb4, { events: [U('go'), A(line('none: x'))] })), '');
  const sb5 = sandbox(); check('F6c bare none -> BLOCK', blocked(fire(sb5, { events: [U('go'), A(line('none'))] })), ''); }

// F7: non-rule memory types pass without a line
{ const evs = [U('go'), A('saving')];
  for (const [label, name, content] of [['top-level type: user in user_a.md', 'user_a.md', '---\nname: u\ntype: user\n---\nbody\n'], ['nested type: project in project_p.md', 'project_p.md', '---\nname: p\nmetadata:\n  type: project\n---\nbody\n'], ['type: reference in reference_r.md', 'reference_r.md', '---\nname: r\ntype: reference\n---\nbody\n']]) {
    const sb = sandbox(); const r = fire(sb, { events: evs, file: sb.mem(name), content });
    check('F7 ' + label + ' -> PASS without a line', passed(r) && /type-exempt/.test(JSON.stringify(sb.log())), r.stderr + JSON.stringify(sb.log()));
    const sbr = sandbox(); const rr = fire(sbr, { events: evs, file: sbr.mem('feedback_' + name), content });
    check('F7r the same content under a feedback_ name (relabelling) -> BLOCK', blocked(rr), rr.stderr);
  }
  const sb = sandbox(); sb.put(sb.mem('user_a.md'), '---\nname: a\ntype: user\n---\nold text\n');
  check('F7b Edit on an existing type: user file -> PASS', passed(fire(sb, { events: evs, tool: 'Edit', input: { file_path: sb.mem('user_a.md'), old_string: 'old text', new_string: 'new text' } })), '');
  const sb2 = sandbox(); sb2.put(sb2.mem('feedback_e.md'), '---\nname: e\nmetadata:\n  type: feedback\n---\nold rule\n');
  check('F7c Edit on an existing type: feedback file, no line -> BLOCK', blocked(fire(sb2, { events: evs, tool: 'Edit', input: { file_path: sb2.mem('feedback_e.md'), old_string: 'old rule', new_string: 'new rule' } })), '');
  const sb3 = sandbox(); check('F7d Write of feedback_ file with no frontmatter -> BLOCK', blocked(fire(sb3, { events: evs, content: 'just a rule\n' })), '');
  const sb4 = sandbox(); check('F7e non-feedback name without a type (notes.md) -> PASS', passed(fire(sb4, { events: evs, file: sb4.mem('notes.md'), content: 'text\n' })), '');
  const sb5 = sandbox(); check('F7f type: feedback in a file not named feedback_ -> BLOCK', blocked(fire(sb5, { events: evs, file: sb5.mem('reply_shape.md'), content: '---\ntype: feedback\n---\nrule\n' })), ''); }

// F8: non-memory path -> PASS, no log noise
{ const sb = sandbox(); const r = fire(sb, { events: [U('go')], file: path.join(sb.root, 'notes', 'x.md'), content: 'hi' });
  check('F8 non-memory path -> PASS and domain log.jsonl untouched', passed(r) && sb.log() === null, JSON.stringify(sb.log()));
  const sb2 = sandbox();
  for (const p of [path.join(sb2.root, '.claude', 'auto-memory', 'sub', 'feedback_x.md'), path.join(sb2.root, '.claude', 'auto-memory.md'), path.join(sb2.root, '.claude', 'skills', 'x', 'SKILL.md'), path.join(sb2.root, '.claude', 'auto-memory', 'feedback_x.txt')]) {
    const r2 = fire(sb2, { events: [U('go')], file: p, content: 'x' });
    check('F8b not an auto-memory .md child: ' + path.relative(sb2.root, p), passed(r2), r2.stderr);
  }
  check('F8c none of those wrote a log row', sb2.log() === null, JSON.stringify(sb2.log()));
  const sb3 = sandbox(); check('F8d tool Read on a memory path is ignored', passed(fire(sb3, { events: [U('go')], tool: 'Read', input: { file_path: sb3.mem('feedback_x.md') } })) && sb3.log() === null, ''); }

// F9: the gate's own block text in the transcript (assistant text AND tool_result), no real line -> still BLOCK
{ const sb = sandbox(); const first = fire(sb, { events: [U('go'), A('saving')] });
  const text = first.stderr;
  const r = fire(sb, { events: [U('go'), A('saving'), A('The gate said:\n' + text), TU('Write', { file_path: sb.mem('feedback_x.md') }, 't1'), R('t1', text, true), A('retrying')] });
  check('F9 own block text quoted in assistant text + tool_result -> still BLOCK', blocked(r), 'exit=' + r.status);
  const shapeLine = text.split('\n').find(l => /RULE-PLACEMENT:/.test(l));
  const r2 = fire(sb, { events: [U('go'), A(shapeLine)] });
  check('F9b the shape line copied verbatim (placeholders) -> BLOCK', blocked(r2) && /placeholder/.test(r2.stderr), r2.stderr);
  const r3 = fire(sb, { events: [U('go'), A(text)] });
  check('F9c whole block text as assistant text, no bypass credit from <reason> -> BLOCK', blocked(r3), 'exit=' + r3.status); }

// F10: line only in an older turn -> BLOCK
{ const sb = sandbox(); const r = fire(sb, { events: [U('first'), A(line('new: x')), U('second request'), A('ok')] });
  check('F10 line from an older turn -> BLOCK', blocked(r), 'exit=' + r.status); }

// F11: MEMORY.md
{ const sb = sandbox();
  const sibling = fire(sb, { events: [U('go'), A(line('new: x'))] });
  const idx = { file_path: sb.mem('MEMORY.md'), old_string: '## Always on', new_string: '## Always on\n> NEVER write a rule here\n- [x](feedback_x.md) — hook line' };
  const r = fire(sb, { events: [U('go'), A(line('new: x'))], tool: 'Edit', input: idx });
  check('F11 index edit with rule text after a passed sibling this turn -> PASS', passed(sibling) && passed(r) && /sibling-passed/.test(JSON.stringify(sb.log())), r.stderr);
  const sb2 = sandbox();
  const r2 = fire(sb2, { events: [U('go'), A('x')], tool: 'Edit', input: idx });
  check('F11b same edit, no sibling passed -> BLOCK', blocked(r2), r2.stderr);
  const r3 = fire(sb2, { events: [U('go'), A('x')], tool: 'Edit', input: { file_path: sb2.mem('MEMORY.md'), old_string: '## Always on', new_string: '## Always on\n- [x](feedback_x.md) — hook line' } });
  check('F11c pure index-line Edit -> PASS with no sibling', passed(r3) && /index-lines-only/.test(JSON.stringify(sb2.log())), r3.stderr);
  sb2.put(sb2.mem('MEMORY.md'), '# Memory Index\n\n> header rule text\n\n- [a](feedback_a.md) — one\n');
  const r4 = fire(sb2, { events: [U('go'), A('x')], file: sb2.mem('MEMORY.md'), content: '# Memory Index\n\n> header rule text\n\n- [a](feedback_a.md) — one\n- [b](feedback_b.md) — two\n' });
  check('F11d full-file Write that only adds an index line -> PASS', passed(r4), r4.stderr);
  const r5 = fire(sb2, { events: [U('go'), A('x')], file: sb2.mem('MEMORY.md'), content: '# Memory Index\n\n> header rule text\n> a NEW rule sentence\n\n- [a](feedback_a.md) — one\n' });
  check('F11e full-file Write that adds a rule sentence -> BLOCK', blocked(r5), r5.stderr);
  const sb3 = sandbox();
  fire(sb3, { events: [U('go'), A(line('new: x'))], tname: 'a' });
  const r6 = fire(sb3, { events: [U('go'), A(line('new: x'))], tname: 'b', tool: 'Edit', input: idx });
  check('F11f sibling passed in ANOTHER session/transcript does not count -> BLOCK', blocked(r6), r6.stderr);
  const sb4 = sandbox();
  fire(sb4, { events: [U('go'), A(line('new: x'))], tname: 'a' });
  const r7 = fire(sb4, { events: [U('a different second request'), A('ok')], tname: 'a2', tool: 'Edit', input: idx });
  check('F11g sibling passed in an EARLIER turn does not count -> BLOCK', blocked(r7), r7.stderr); }

// F12: fail OPEN
{ const sb = sandbox();
  const a = fire(sb, { rawStdin: '' });
  check('F12 empty stdin -> exit 0, logged fail-open', passed(a) && lastDecision(sb) === 'fail-open', JSON.stringify(sb.log()));
  const b = fire(sb, { rawStdin: '{not json' });
  check('F12b malformed stdin -> exit 0, logged fail-open', passed(b) && sb.log().filter(x => x.decision === 'fail-open').length === 2, JSON.stringify(sb.log()));
  const c = fire(sb, { transcript: path.join(sb.base, 'nope.jsonl') });
  check('F12c missing transcript file -> exit 0, logged fail-open', passed(c) && /transcript-unreadable/.test(JSON.stringify(sb.log())), c.stderr);
  const d = fire(sb, {});
  check('F12d no transcript_path at all -> exit 0 (fail open)', passed(d), d.stderr);
  const pt = path.join(sb.base, 'plain.txt'); fs.writeFileSync(pt, 'RULE-PLACEMENT: nothing here\njust text\n');
  const e = fire(sb, { transcript: pt });
  check('F12e plain-text (non-JSON) transcript -> exit 0 (fail open)', passed(e), e.stderr);
  const f = fire(sb, { rawStdin: '{}' });
  check('F12f {} (forge smoke shape) -> exit 0', passed(f), f.stderr); }

// F13: forward slashes and a different drive-letter case
{ const sb = sandbox();
  const flip = s => s.replace(/^([A-Za-z]):/, (m, d) => (d === d.toUpperCase() ? d.toLowerCase() : d.toUpperCase()) + ':');
  const memFwd = flip(sb.mem('feedback_x.md')).replace(/\\/g, '/');
  const editedBack = sb.rel(ENF);
  const r = fire(sb, { file: memFwd, events: [U('go'), A(line(ENF)), TU('Edit', { file_path: flip(editedBack).replace(/\\/g, '/') }, 't1'), R('t1', 'ok')] });
  check('F13 forward slashes + flipped drive-letter case: gated and satisfied -> PASS', passed(r) && lastDecision(sb) === 'pass', r.stderr + JSON.stringify(sb.log()));
  const r2 = fire(sb, { file: memFwd, events: [U('go'), A('nothing')] });
  check('F13b same path form, no line -> BLOCK (still gated)', blocked(r2), 'exit=' + r2.status); }

// F14: main-repo auto-memory path while the project dir is a worktree
{ const sb = sandbox();
  const r = fire(sb, { file: sb.mainMem('feedback_x.md'), events: [U('go'), A('nothing')] });
  check('F14 main-repo memory path, no line -> BLOCK', blocked(r), 'exit=' + r.status);
  const mainEnf = '.claude/skills/only-in-main/SKILL.md';
  const r2 = fire(sb, { file: sb.mainMem('feedback_x.md'), events: [U('go'), A(line(mainEnf)), TU('Edit', { file_path: path.join(sb.base, mainEnf) }, 't1'), R('t1', 'ok')] });
  check('F14b enforcing file that exists only in the main repo resolves -> PASS', passed(r2), r2.stderr);
  const r3 = fire(sb, { events: [U('go'), A(line(mainEnf)), TU('Edit', { file_path: path.join(sb.base, mainEnf) }, 't1'), R('t1', 'ok')] });
  check('F14c worktree memory path, enforcing file in the main repo -> PASS', passed(r3), r3.stderr); }

// F15: bypass
{ const sb = sandbox();
  const r = fire(sb, { events: [U('go'), A('[skip-memory-write: miya dictated this exact memory line]')] });
  check('F15 bypass token in assistant text -> PASS and logged', passed(r) && lastDecision(sb) === 'bypass', r.stderr + JSON.stringify(sb.log()));
  const r2 = fire(sb, { events: [U('go'), A('saving'), TU('Bash', {}, 't1'), R('t1', '[skip-memory-write: miya dictated this exact memory line]')] });
  check('F15b bypass token only inside a tool_result -> BLOCK', blocked(r2), 'exit=' + r2.status);
  const r3 = fire(sb, { events: [U('go'), A('[skip-memory-write: <reason>]')] });
  check('F15c bypass with the placeholder <reason> -> BLOCK', blocked(r3), 'exit=' + r3.status);
  const r4 = fire(sb, { events: [U('first'), A('[skip-memory-write: miya dictated this exact memory line]'), U('second'), A('x')] });
  check('F15d bypass from an older turn -> BLOCK', blocked(r4), 'exit=' + r4.status);
  const r5 = fire(sb, { events: [U('go'), A('[skip-memory-write: x]')] });
  check('F15e bypass with a one-character reason -> BLOCK', blocked(r5), 'exit=' + r5.status);
  const r6 = fire(sb, { events: [U('[skip-memory-write: user typed this long reason]'), A('x')] });
  check('F15f bypass typed by the USER does not count (assistant-authored only) -> BLOCK', blocked(r6), 'exit=' + r6.status); }

// F16: line validation
{ const run = txt => { const sb = sandbox(); return fire(sb, { events: [U('go'), A(txt)] }); };
  check('F16 workflow=TODO -> BLOCK', blocked(run('RULE-PLACEMENT: file=feedback_x.md · workflow=TODO · step=a step · enforced-by=new: gate-x · memory-because=reason is long enough')), '');
  check('F16b step=tbd -> BLOCK', blocked(run('RULE-PLACEMENT: file=feedback_x.md · workflow=quest · step=tbd · enforced-by=new: gate-x · memory-because=reason is long enough')), '');
  check('F16c memory-because=n/a -> BLOCK', blocked(run('RULE-PLACEMENT: file=feedback_x.md · workflow=quest · step=a step · enforced-by=new: gate-x · memory-because=n/a')), '');
  check('F16d memory-because missing -> BLOCK', blocked(run('RULE-PLACEMENT: file=feedback_x.md · workflow=quest · step=a step · enforced-by=new: gate-x')), '');
  check('F16e workflow=none + step=none -> PASS', passed(run('RULE-PLACEMENT: file=feedback_x.md · workflow=none · step=none · enforced-by=new: gate-x · memory-because=reason is long enough')), '');
  check('F16f memory-because=none -> BLOCK', blocked(run('RULE-PLACEMENT: file=feedback_x.md · workflow=quest · step=a step · enforced-by=new: gate-x · memory-because=none')), '');
  check('F16g line decorated with bullet and backticks -> PASS', passed(run('- `' + line('new: gate-x') + '`')), '');
  check('F16h line inside a code fence -> PASS', passed(run('```\n' + line('new: gate-x') + '\n```')), '');
  check('F16i bare gate name as enforced-by -> BLOCK with a hint', (() => { const r = run(line('commit-subject-gate')); return blocked(r) && /name the file inside/.test(r.stderr); })(), '');
  check('F16j invalid line first, valid line later -> PASS', passed(run('RULE-PLACEMENT: file=feedback_x.md · workflow=TODO\n' + line('new: gate-x'))), '');
  check('F16k key spelled in different case still parsed -> PASS', passed(run(line('new: gate-x').replace('workflow=', 'Workflow='))), ''); }

// F17: enforcing-file edge cases
{ const sb = sandbox(); sb.put(sb.mem('feedback_other.md'), '---\ntype: feedback\n---\nx\n');
  const r = fire(sb, { events: [U('go'), A(line('.claude/auto-memory/feedback_other.md')), TU('Edit', { file_path: sb.mem('feedback_other.md') }, 't1'), R('t1', 'ok')] });
  check('F17 enforced-by pointing at a memory file -> BLOCK (a memory is not an enforcer)', blocked(r) && /not an enforcer/.test(r.stderr), r.stderr);
  const r2 = fire(sb, { events: [U('go'), A(line(ENF)), TU('Edit', { file_path: sb.rel(ENF) }, 't1'), R('t1', 'blocked by hook', true)] });
  check('F17b the edit to the enforcing file errored -> does not count -> BLOCK', blocked(r2), r2.stderr);
  const r3 = fire(sb, { events: [U('go'), A(line('domain/foo-dir')), TU('Edit', { file_path: sb.rel('domain/foo-dir/inner.js') }, 't1'), R('t1', 'ok')] });
  check('F17c enforced-by is a folder, a file inside it edited -> PASS', passed(r3), r3.stderr);
  const r4 = fire(sb, { events: [U('go'), A(line('.claude/skills/system-design/SKILL.md:12')), TU('Edit', { file_path: sb.rel('.claude/skills/system-design/SKILL.md') }, 't1'), R('t1', 'ok')] });
  check('F17d path with :line suffix resolves -> PASS', passed(r4), r4.stderr);
  const r5 = fire(sb, { events: [U('go'), A(line('.claude/skills/system-design/SKILL.md#rule-8')), TU('Write', { file_path: sb.rel('.claude/skills/system-design/SKILL.md') }, 't1'), R('t1', 'ok')] });
  check('F17e path with #anchor resolves -> PASS', passed(r5), r5.stderr);
  const r6 = fire(sb, { events: [U('go'), A(line(ENF)), TU('Bash', { command: 'echo > ' + ENF }, 't1'), R('t1', 'ok')] });
  check('F17f a Bash command is not an Edit/Write tool call -> BLOCK', blocked(r6), r6.stderr);
  const r7 = fire(sb, { events: [U('go'), A(line(ENF)), TU('Edit', { file_path: sb.rel('domain/foo-dir/inner.js') }, 't1'), R('t1', 'ok')] });
  check('F17g a different file was edited -> BLOCK', blocked(r7), r7.stderr);
  const r8 = fire(sb, { events: [U('go'), A(line(ENF)), TU('Edit', { file_path: path.join(sb.base, 'other-copy', ENF) }, 't1'), R('t1', 'ok')] });
  check('F17h same relative path under an unrelated folder -> BLOCK', blocked(r8), r8.stderr); }

// F18: turn-boundary and text-source edge cases
{ const sb = sandbox();
  const r = fire(sb, { events: [U('go'), A('saving'), TU('Write', { file_path: sb.mem('feedback_x.md') }, 't1'), R('t1', line('new: x'))] });
  check('F18 a valid line inside a tool_result -> BLOCK', blocked(r), r.stderr);
  const r2 = fire(sb, { events: [U(line('new: x')), A('saving')] });
  check('F18b a valid line inside the user message itself -> BLOCK', blocked(r2), r2.stderr);
  const r3 = fire(sb, { events: [U('go'), A(line('new: x')), U('<system-reminder>\nnote\n</system-reminder>'), A('now writing')] });
  check('F18c a system-reminder user text mid-turn does not reset the turn -> PASS', passed(r3), r3.stderr);
  const r4 = fire(sb, { events: [U('go'), A(line('new: x')), R('t0', 'x'), A('more')], crlf: true });
  check('F18d CRLF transcript lines -> PASS', passed(r4), r4.stderr);
  const sb2 = sandbox(); const tp = path.join(sb2.base, 'str.jsonl');
  fs.writeFileSync(tp, JSON.stringify({ type: 'user', message: { role: 'user', content: 'go' } }) + '\n' + JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: line('new: x') } }) + '\n');
  check('F18e string (non-array) message content -> PASS', passed(fire(sb2, { transcript: tp })), '');
  const r5 = fire(sb, { events: [A(line('new: x'))] });
  check('F18f transcript with no user message: whole transcript is the turn -> PASS', passed(r5), r5.stderr); }

// F19: other tools and path forms
{ const sb = sandbox(); sb.put(sb.mem('feedback_m.md'), '---\nmetadata:\n  type: feedback\n---\nold\n');
  const r = fire(sb, { events: [U('go'), A('x')], tool: 'MultiEdit', input: { file_path: sb.mem('feedback_m.md'), edits: [{ old_string: 'old', new_string: 'new' }] } });
  check('F19 MultiEdit on a feedback memory -> BLOCK', blocked(r), r.stderr);
  const sb2 = sandbox();
  const trav = path.join(sb2.root, '.claude', 'skills', '..', 'auto-memory', 'feedback_x.md');
  check('F19b path traversal that lands in auto-memory -> BLOCK', blocked(fire(sb2, { events: [U('go'), A('x')], file: trav })), '');
  check('F19c upper-case file name FEEDBACK_X.MD -> BLOCK', blocked(fire(sb2, { events: [U('go'), A('x')], file: sb2.mem('FEEDBACK_X.MD'), content: 'rule' })), '');
  const r4 = fire(sb2, { events: [U('go'), A('x')], file: '.claude/auto-memory/feedback_rel.md', rawStdin: JSON.stringify({ tool_name: 'Write', cwd: sb2.root, tool_input: { file_path: '.claude/auto-memory/feedback_rel.md', content: 'rule' }, transcript_path: path.join(sb2.base, 't-a.jsonl') }) });
  check('F19d relative file_path resolved against cwd -> BLOCK', blocked(r4), r4.stderr); }

// F20: one line per memory FILE; file= must match the file being written
{ const sb = sandbox(); const evs = [U('go'), A(line('new: x', '', 'feedback_one.md'))];
  const a = fire(sb, { events: evs, file: sb.mem('feedback_one.md') });
  const b = fire(sb, { events: evs, file: sb.mem('feedback_two.md') });
  check('F20 one line covers only its own file: feedback_one.md PASS, feedback_two.md BLOCK', passed(a) && blocked(b) && /does not match this write/.test(b.stderr), 'a=' + a.status + ' b=' + b.status + ' ' + b.stderr);
  const sb2 = sandbox(); const evs2 = [U('go'), A(line('new: x', '', 'feedback_one.md')), A(line('new: y', '', 'feedback_two.md'))];
  const c = fire(sb2, { events: evs2, file: sb2.mem('feedback_one.md') });
  const d = fire(sb2, { events: evs2, file: sb2.mem('feedback_two.md') });
  check('F20b two files, two matching lines -> both PASS', passed(c) && passed(d), 'c=' + c.status + ' d=' + d.status);
  const sb3 = sandbox(); const noFile = 'RULE-PLACEMENT: workflow=commit · step=draft subject · enforced-by=new: gate-x · memory-because=a note keeps the reason next to the rule';
  const e = fire(sb3, { events: [U('go'), A(noFile)] });
  check('F20c line with no file= key -> BLOCK', blocked(e) && /file= is empty/.test(e.stderr), e.stderr);
  const f = fire(sb3, { events: [U('go'), A(line('new: x', '', 'feedback_x'))] });
  check('F20d file= without the .md extension -> PASS', passed(f), f.stderr);
  const g = fire(sb3, { events: [U('go'), A(line('new: x', '', 'FEEDBACK_X.MD'))] });
  check('F20e file= in a different case -> PASS', passed(g), g.stderr);
  const h = fire(sb3, { events: [U('go'), A(line('new: x', '', '<name.md>'))] });
  check('F20f file=<name.md> placeholder -> BLOCK', blocked(h), h.stderr);
  const i = fire(sb3, { events: [U('go'), A(line('new: x', '', 'feedback_other.md'))] });
  check('F20g line for another file, error names both files', blocked(i) && /feedback_other\.md/.test(i.stderr) && /feedback_x\.md/.test(i.stderr), i.stderr);
  const sb4 = sandbox(); const j = fire(sb4, { events: [U('go'), A(line('new: x', '', 'reply_shape.md'))], file: sb4.mem('reply_shape.md'), content: '---\ntype: feedback\n---\nrule\n' });
  check('F20h type: feedback in a non-feedback name needs its own file= line -> PASS', passed(j), j.stderr);
  const sb5 = sandbox(); const k = fire(sb5, { events: [U('go'), A(line('new: x', '', 'feedback_one.md'))], file: sb5.mem('feedback_one.md'), content: '---\ntype: reference\n---\nrule\n' });
  const l = fire(sb5, { events: [U('go'), A('no line')], file: sb5.mem('feedback_one.md'), content: '---\ntype: reference\n---\nrule\n' });
  check('F20i feedback_ name relabelled type: reference -> still gated (PASS only with its line)', passed(k) && blocked(l), 'k=' + k.status + ' l=' + l.status); }

// F21: huge transcript stays fast
{ const sb = sandbox(); const evs = [U('go')];
  for (let i = 0; i < 25000; i++) evs.push(A('filler line number ' + i + ' ' + 'x'.repeat(200)));
  evs.push(A(line('new: x')));
  const r = fire(sb, { events: evs });
  check('F21 ~6 MB transcript -> PASS in under 8 s', passed(r) && r.ms < 8000, 'exit=' + r.status + ' ms=' + r.ms); }

// F22: block output reaches stderr with exit 2 and is non-empty (effect check)
{ const sb = sandbox(); const r = fire(sb, { events: [U('go'), A('x')] });
  check('F22 block = exit 2 + message on stderr', r.status === 2 && (r.stderr || '').length > 200, 'exit=' + r.status + ' len=' + (r.stderr || '').length); }

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nmemory-write-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
