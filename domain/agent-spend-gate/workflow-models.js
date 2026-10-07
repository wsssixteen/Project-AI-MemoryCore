// workflow-models.js — part of the agent-spend-gate Feature (2026-10-07).
// Lists every agent() call in a Workflow script with its line, label and model, so the gate can
// block a call that names no model (it would run on the session model) and spawn-telemetry can
// count models per run. Static scan only: the script is never executed.
//
// A call "has a model" when its own arguments carry a model: key, or spread / pass a constant
// declared in the same script as an object literal with a model: key
//   const SONNET = { model: 'sonnet', effort: 'medium' }   …   agent(prompt, { ...SONNET, label })
// A model: key whose value is not a quoted tier (model: d.model) counts as chosen, tier "dynamic".
// Text inside strings, template literals and comments is never read as code: "agent(" in a prompt
// or a comment is not a call, and "model:" in a prompt is not a model.
'use strict';

// Same length as src. Code stays; everything inside a string, a template literal (its ${} parts
// included) or a comment becomes a space. Newlines stay, so line numbers hold.
function mask(src) {
  const out = new Array(src.length);
  const st = [{ t: 'code' }];
  for (let i = 0; i < src.length; i++) {
    const c = src[i], n = src[i + 1], top = st[st.length - 1];
    const keep = ch => { out[i] = ch; };
    const blank = () => { out[i] = c === '\n' ? '\n' : ' '; };
    if (top.t === 'line') { blank(); if (c === '\n') st.pop(); continue; }
    if (top.t === 'block') { blank(); if (c === '*' && n === '/') { out[++i] = ' '; st.pop(); } continue; }
    if (top.t === 'str') { blank(); if (c === '\\') { out[++i] = ' '; continue; } if (c === top.q || c === '\n') st.pop(); continue; }
    if (top.t === 'tpl') {
      blank();
      if (c === '\\') { out[++i] = ' '; continue; }
      if (c === '`') { st.pop(); continue; }
      if (c === '$' && n === '{') { out[++i] = ' '; st.push({ t: 'expr', b: 1 }); }
      continue;
    }
    const inTemplate = st.some(x => x.t === 'tpl');
    const put = inTemplate ? blank : () => keep(c);
    if (c === '/' && n === '/') { blank(); st.push({ t: 'line' }); continue; }
    if (c === '/' && n === '*') { blank(); out[++i] = ' '; st.push({ t: 'block' }); continue; }
    if (c === '\'' || c === '"') { blank(); st.push({ t: 'str', q: c }); continue; }
    if (c === '`') { blank(); st.push({ t: 'tpl' }); continue; }
    if (top.t === 'expr') {
      if (c === '{') top.b++;
      else if (c === '}') { top.b--; if (top.b === 0) { blank(); st.pop(); continue; } }
    }
    put();
  }
  return out.join('');
}

// Index of the bracket that closes the one opened just before `start`, on masked text; -1 if none.
function closeOf(masked, start, open, close) {
  let depth = 1;
  for (let i = start; i < masked.length; i++) {
    if (masked[i] === open) depth++;
    else if (masked[i] === close && --depth === 0) return i;
  }
  return -1;
}

// The model named by a `model:` key inside masked[a..b): a quoted tier, "dynamic", or null.
function modelIn(src, masked, a, b) {
  const re = /(?<![\w.$])model\s*:/g;
  re.lastIndex = a;
  const m = re.exec(masked);
  if (m && m.index < b) {
    const lit = /^\s*['"`]([\w.-]+)['"`]/.exec(src.slice(m.index + m[0].length, b));
    return lit ? lit[1].toLowerCase() : 'dynamic';
  }
  // shorthand property: { model } or { label, model, schema }
  return /[{,]\s*model\s*[,}]/.test(masked.slice(a, b)) ? 'dynamic' : null;
}

// Constants declared as an object literal that carries a model: key.
function tierConstants(src, masked) {
  masked = masked || mask(src);
  const map = {};
  const re = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g;
  let m;
  while ((m = re.exec(masked))) {
    const end = closeOf(masked, m.index + m[0].length, '{', '}');
    if (end < 0) continue;
    const t = modelIn(src, masked, m.index + m[0].length, end);
    if (t) map[m[1]] = t;
  }
  return map;
}

function agentCalls(src) {
  src = String(src || '');
  const masked = mask(src);
  const consts = tierConstants(src, masked);
  const out = [];
  const re = /(?<![\w.$])agent\s*\(/g;
  let m;
  while ((m = re.exec(masked))) {
    const start = m.index + m[0].length;
    const end = closeOf(masked, start, '(', ')');
    const line = src.slice(0, m.index).split('\n').length;
    const span = end < 0 ? masked.length : end;
    let model = modelIn(src, masked, start, span);
    if (!model) {
      const args = masked.slice(start, span);
      const used = Object.keys(consts).find(k => new RegExp('(?:\\.\\.\\.\\s*|[,(]\\s*)' + k.replace(/\$/g, '\\$') + '(?![\\w$])').test('(' + args));
      if (used) model = consts[used];
    }
    const lab = /(?<![\w.$])label\s*:/.exec(masked.slice(start, span));
    const label = lab ? ((/^\s*[`'"]([^`'"$\n]{1,40})/.exec(src.slice(start + lab.index + lab[0].length, span)) || [])[1] || '') : '';
    out.push({ line, label, model, parsed: end >= 0 });
  }
  return out;
}

// { sonnet: 8, opus: 2, none: 1 } for telemetry.
function modelCounts(src) {
  const counts = {};
  for (const c of agentCalls(src)) { const k = c.model || 'none'; counts[k] = (counts[k] || 0) + 1; }
  return counts;
}

// Number of "opus-reason:" comments in the script: one is owed per call that names opus or fable.
function reasonCount(src) { return (String(src || '').match(/\/\/[^\n]*\bopus-reason\s*:\s*\S/g) || []).length; }

module.exports = { agentCalls, modelCounts, reasonCount, tierConstants, mask };
