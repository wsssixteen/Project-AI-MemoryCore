#!/usr/bin/env node
// lint.js - checks a story-video scenes JSON before render.py draws it.
// usage: node domain/story-video/lint.js <scenes.json>      exit 0 = clean, exit 1 = one line per finding
// The numbers come from kinds.json, the same file render.py draws with.
'use strict';
const fs = require('fs');
const path = require('path');

const K = JSON.parse(fs.readFileSync(path.join(__dirname, 'kinds.json'), 'utf8'));
const LIM = K.limits;

// Words a non-technical viewer should never meet. Edit here, the eval pins the list.
const BANNED = /\b(process(es|ing)?|sub-?flows?|flows?|workflows?|variables?|bags?|engine|callbacks?|flowable|etanah|database|sql|quer(y|ies)|scripts?|api|servers?|backend|frontend|bug)\b/i;
// A known fix is THE fix: no hedging in a fix or after-fix scene.
const HEDGE = /\b(propos(ed|e|al)|expect(ed|s)?|suggest(ed|s)?|recommend(ed|s)?|planned|should|might|could|maybe)\b/i;
const MONTH = /^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/;

const kv = o => (o && typeof o === 'object' && 'k' in o) ? [String(o.k), String(o.v)] : [String(o)];
const cardTexts = c => c ? [c.title].concat(...(c.lines || []).map(kv)) : [];

function texts(s) {
  const t = [s.headline, s.detail, s.caption, s.label];
  t.push(...cardTexts(s.card), ...cardTexts(s.from), ...cardTexts(s.to));
  (s.steps || []).forEach(x => t.push(typeof x === 'string' ? x : x.text));
  (s.items || []).forEach(x => t.push(x));
  if (s.screen) { t.push(s.screen.title); (s.screen.values || []).forEach(v => t.push(v.label, v.value)); }
  return t.filter(x => typeof x === 'string' && x.length);
}

function labelled(s) {
  switch (s.kind) {
    case 'title': return 0;
    case 'card': return 1 + ((s.card && s.card.lines) || []).length;
    case 'copy': return 2 + (s.label ? 1 : 0);
    case 'steps': return (s.steps || []).length;
    case 'checklist': return (s.items || []).length;
    case 'screen': return 1 + ((s.screen && s.screen.values) || []).length;
    default: return 0;
  }
}

function strip(text, drop) {
  let t = text;
  for (const d of drop) t = t.split(d).join(' ');
  return t;
}

function lint(j) {
  const out = [];
  const bad = (i, s, m) => out.push(i == null ? m : `scene ${i + 1} (${s.kind}${s.role ? ', ' + s.role : ''}): ${m}`);
  if (!j || typeof j !== 'object' || !Array.isArray(j.scenes)) return ['file has no "scenes" array'];
  const allowed = Array.isArray(j.allowed_terms) ? j.allowed_terms : [];
  const known = Array.isArray(j.known_names) ? j.known_names : [];
  const sc = j.scenes;

  if (sc.length > LIM.max_scenes) out.push(`${sc.length} scenes, max ${LIM.max_scenes}`);
  if (!sc.length) out.push('no scenes');
  if (allowed.length > LIM.max_allowed_terms) out.push(`${allowed.length} allowed_terms, max ${LIM.max_allowed_terms}`);
  if (known.length > LIM.max_known_names) out.push(`${known.length} known_names, max ${LIM.max_known_names}`);
  known.forEach(n => { if (typeof n !== 'string' || n.split(/\s+/).length > 4) out.push(`known_names entry "${n}" is not a short screen name (max 4 words)`); });
  allowed.forEach(n => { if (typeof n !== 'string' || !n.trim()) out.push('allowed_terms holds an empty or non-text entry'); });
  const drop = allowed.concat(known).filter(x => typeof x === 'string' && x).sort((a, b) => b.length - a.length);

  const fixText = [];
  sc.forEach((s, i) => {
    if (!s || typeof s !== 'object') return out.push(`scene ${i + 1}: not an object`);
    const kd = K.kinds[s.kind];
    if (!kd) return bad(i, s, `unknown kind "${s.kind}" (known: ${Object.keys(K.kinds).join(', ')})`);
    const role = s.role || (s.kind === 'title' ? 'title' : 'event');
    if (s.role && !K.roles.includes(s.role)) bad(i, s, `unknown role "${s.role}" (known: ${K.roles.join(', ')})`);
    if (i === 0 && s.kind !== 'title') bad(i, s, 'the first scene must be a title');
    if (i > 0 && s.kind === 'title') bad(i, s, 'only the first scene may be a title');

    if (typeof s.headline !== 'string' || !s.headline.trim()) bad(i, s, 'headline is missing');
    else {
      const hm = s.kind === 'title' ? LIM.title_headline_max_chars : LIM.headline_max_chars;
      if (s.headline.length > hm) bad(i, s, `headline is ${s.headline.length} chars, max ${hm}`);
    }
    if (s.detail != null) {
      if (typeof s.detail !== 'string') bad(i, s, 'detail must be text');
      else if (s.detail.length > LIM.detail_max_chars) bad(i, s, `detail is ${s.detail.length} chars, max ${LIM.detail_max_chars}`);
    }
    if (typeof s.seconds !== 'number' || !(s.seconds > 0)) { bad(i, s, 'seconds is missing or not a positive number'); return; }

    // caption + timing
    if (kd.caption_full == null) {
      if (s.caption) bad(i, s, 'a title scene has no caption slot (put the sentence in detail)');
    } else {
      if (typeof s.caption !== 'string' || !s.caption.trim()) bad(i, s, 'caption is missing');
      else {
        if (s.caption.length > LIM.caption_max_chars) bad(i, s, `caption is ${s.caption.length} chars, max ${LIM.caption_max_chars}`);
        const tail = i === sc.length - 1 ? K.timing.fade_out : K.timing.crossfade_half;
        const visible = s.seconds - tail - kd.caption_full;
        if (s.seconds < LIM.caption_scene_min_seconds) bad(i, s, `${s.seconds} s, a caption scene needs at least ${LIM.caption_scene_min_seconds} s`);
        if (visible < LIM.caption_visible_min_seconds - 1e-9) {
          const need = Math.ceil(LIM.caption_visible_min_seconds + tail + kd.caption_full);
          bad(i, s, `caption fully visible only ${visible.toFixed(1)} s, needs ${LIM.caption_visible_min_seconds} s (give this scene at least ${need} s)`);
        }
      }
    }

    // shape per kind
    const need = (cond, m) => { if (!cond) bad(i, s, m); };
    const cardOk = (c, nm) => {
      if (!c || typeof c.title !== 'string') return bad(i, s, `${nm} needs a title`);
      const n = (c.lines || []).length;
      need(n >= 1 && n <= 2, `${nm} needs 1 or 2 lines, has ${n}`);
      (c.lines || []).forEach(l => { if (typeof l === 'object' && !(typeof l.k === 'string' && typeof l.v === 'string')) bad(i, s, `${nm} line object needs k and v`); });
    };
    if (s.kind === 'card') cardOk(s.card, 'card');
    if (s.kind === 'copy') { cardOk(s.from, 'from'); cardOk(s.to, 'to'); }
    if (s.kind === 'steps') need(Array.isArray(s.steps) && s.steps.length >= 2 && s.steps.length <= 3, `steps needs 2 or 3 boxes, has ${(s.steps || []).length}`);
    if (s.kind === 'checklist') need(Array.isArray(s.items) && s.items.length >= 2 && s.items.length <= 4, `checklist needs 2 to 4 lines, has ${(s.items || []).length}`);
    if (s.kind === 'screen') {
      need(s.screen && typeof s.screen.title === 'string', 'screen needs a title');
      const n = ((s.screen && s.screen.values) || []).length;
      need(n >= 1 && n <= 2, `screen needs 1 or 2 values, has ${n}`);
    }
    const nl = labelled(s);
    if (nl > LIM.max_labelled_per_scene) bad(i, s, `${nl} labelled things, max ${LIM.max_labelled_per_scene}`);

    // wording
    const tx = texts(s);
    for (const t of tx) {
      const clean = strip(t, drop);
      const w = clean.match(BANNED);
      if (w) bad(i, s, `banned word "${w[0]}" in "${t}"`);
      const noRef = clean.replace(/\S*[\/\d]\S*/g, ' ');
      const code = noRef.match(/\b[A-Z]{3,8}\b/);
      if (code) bad(i, s, `"${code[0]}" looks like a task code, in "${t}" (list it in known_names only if the viewer sees that name on the screen, or in allowed_terms if it is the thing being fixed)`);
      const id = clean.match(/\b[a-z]+[A-Z][A-Za-z]*\b|\b[A-Za-z0-9]+_[A-Za-z0-9_]+\b/);
      if (id) bad(i, s, `"${id[0]}" is a technical name, in "${t}" (allowed_terms is only for the thing being fixed)`);
    }
    if (role === 'event' && s.kind !== 'title' && s.headline && !MONTH.test(s.headline)) bad(i, s, `an event scene headline starts with its date ("29 Sep: ..."), got "${s.headline}"`);
    if (role === 'fix' || role === 'after') {
      for (const t of tx) { const h = t.match(HEDGE); if (h) bad(i, s, `"${h[0]}" in a ${role} scene: a known fix is THE fix, say what it does`); }
    }
    if (role === 'fix') fixText.push(...tx);
  });

  // allowed terms = the root-cause thing being changed, so each must sit in a fix scene
  if (allowed.length && !sc.some(s => s && s.role === 'fix')) out.push('allowed_terms is set but no scene has role "fix"');
  allowed.forEach(a => { if (!fixText.some(t => t.includes(a))) out.push(`allowed term "${a}" is in no fix scene: it must be the thing being changed`); });
  known.forEach(n => { if (!sc.some(s => s && texts(s).some(t => t.includes(n)))) out.push(`known name "${n}" is used in no scene`); });
  return out;
}

module.exports = { lint, BANNED, HEDGE };

if (require.main === module) {
  const f = process.argv[2];
  if (!f) { console.error('usage: node lint.js <scenes.json>'); process.exit(2); }
  let j;
  try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(`LINT FAIL ${f}\n  cannot read JSON: ${e.message}`); process.exit(1); }
  const r = lint(j);
  if (r.length) { console.log(`LINT FAIL ${f}`); r.forEach(x => console.log('  ' + x)); process.exit(1); }
  console.log(`LINT OK ${f}: ${j.scenes.length} scenes, ${j.scenes.reduce((a, s) => a + s.seconds, 0)} s`);
}
