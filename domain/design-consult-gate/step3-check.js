// step3-check.js — change-route step 3 rider of design-consult-gate (system/INDEX.md §The change route, step 3).
// boundary: covers Edit|Write on a new part or a highest-order path, the STEP-3 block in main/current-session.md and the session transcript · never edits a file, never asks him · stops at one deny naming the missing line
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');

let MODELS = null; try { MODELS = require(path.join(ROOT, 'lib', 'models.js')); } catch (_) { MODELS = null; }
let HW = null; try { HW = require(path.join(ROOT, 'lib', 'his-words.js')); } catch (_) { HW = null; }
// The card checker sits beside this Feature; absent (an older checkout) = the card is not required.
let CARD = null; try { CARD = require(path.join(__dirname, '..', 'change-card', 'change-card.js')); } catch (_) { CARD = null; }

// The highest order: system/INDEX.md §The change route, "Highest order" paragraph.
const HIGHEST_ORDER = [
  /[\\/]system[\\/]INDEX\.md$/i,
  /[\\/]\.claude[\\/]skills[\\/](system-rules|system-design|system-change|appraise)[\\/]SKILL\.md$/i,
  /[\\/]domain[\\/](design-consult-gate|component-birth-gate|system-change-title)[\\/][^\\/]+$/i,
  /[\\/]\.claude[\\/]hooks[\\/]system-edit-gate\.js$/i,
  /[\\/]core[\\/]forge\.js$/i,
  /[\\/]lib[\\/](his-words|models)\.js$/i,
  /[\\/]system[\\/]evolution-protocol\.md$/i,
];
// A new part: a new Feature README, hook, skill or Feature skill file.
const NEW_PART = [
  /[\\/]domain[\\/][^\\/]+[\\/]README\.md$/i,
  /[\\/]domain[\\/][^\\/]+[\\/][^\\/]+\.(hook\.js|skill\.md)$/i,
  /[\\/]\.claude[\\/]hooks[\\/][^\\/]+\.js$/i,
  /[\\/]\.claude[\\/]skills[\\/][^\\/]+[\\/]SKILL\.md$/i,
];
const EXEMPT = /[\\/](?:[^\\/]*\.eval\.js|eval\.js|eval\.workflow\.js|log\.jsonl|goal-log\.jsonl|diagram\.(html|png))$/i;
const KEYS = ['his words', 'fix or report', 'who pays', 'goal without the part', 'model', 'shown'];
const FAILURE_WORDS = /\b(down|outage|offline|cannot connect|can't connect|not connecting|broken|fail(ed|s|ing)?|not working|error|unreachable)\b/i;
const FREQUENT = /\b(per-(session|prompt|turn|tool)|always)\b/i;
const MAX_LINE = 160;

function scope(filePath) {
  if (!filePath || EXEMPT.test(filePath)) return null;
  if (HIGHEST_ORDER.some(re => re.test(filePath))) return 'highest-order';
  let exists = true; try { fs.statSync(filePath); } catch (_) { exists = false; }
  if (!exists && NEW_PART.some(re => re.test(filePath))) return 'new-part';
  return null;
}

// Last STEP-3 block whose session line names this session.
function findBlock(sessionFileText, ids) {
  const blocks = sessionFileText.split(/\r?\n(?=STEP-3:)/).filter(b => /^STEP-3:/.test(b) || /\nSTEP-3:/.test(b));
  let found = null;
  for (const raw of blocks) {
    const start = raw.indexOf('STEP-3:');
    const body = raw.slice(start).split(/\r?\n\s*\r?\n/)[0];
    const fields = {};
    for (const line of body.split(/\r?\n/).slice(1)) {
      const m = line.match(/^([a-z][a-z ]+):\s*(.*)$/i);
      if (m) fields[m[1].trim().toLowerCase()] = m[2].trim();
    }
    // the whole chunk up to the next STEP-3 header: the change card sits here (change-card rider, 2026-11-05)
    if (fields.session && ids.includes(fields.session)) found = Object.assign(fields, { __raw: raw.slice(start) });
  }
  return found;
}

function usedModel(transcriptText, id) {
  if (!id || !transcriptText) return false;
  if (transcriptText.includes('"model":"' + id + '"')) return true;
  const a = MODELS ? MODELS.alias(id) : null;
  if (!a) return false;
  return transcriptText.split('\n').some(l => l.includes('"name":"Agent"') && l.includes('"model":"' + a + '"'));
}

function hisText(transcriptPath) {
  if (!HW) return '';
  try { return HW.hisMessages(transcriptPath, { limit: 60 }).map(m => m.text).join('\n'); } catch (_) { return ''; }
}

// Returns null when the write may go ahead, else { scope, problems: [..] }.
function check(data) {
  const ti = data.tool_input || {};
  const filePath = ti.file_path || ti.path || '';
  const sc = scope(filePath);
  if (!sc) return null;
  if (!data.session_id) return null; // synthetic input with no session (older fixtures); real hooks always carry session_id
  const ids = [data.session_id, data.transcript_path ? path.basename(data.transcript_path, '.jsonl') : null].filter(Boolean);

  const his = hisText(data.transcript_path);
  if (/\[skip-step3:[^\]]+\]/i.test(his)) return { scope: sc, bypassed: true, problems: [] };

  const sessionFile = process.env.STEP3_SESSION_FILE || path.join(ROOT, 'main', 'current-session.md');
  let text = ''; try { text = fs.readFileSync(sessionFile, 'utf8'); } catch (_) { text = ''; }
  const f = findBlock(text, ids);
  if (!f) return { scope: sc, problems: ['no STEP-3 block for this session in main/current-session.md'] };

  const problems = [];
  for (const k of KEYS) {
    if (!f[k]) problems.push('missing line: ' + k + ':');
    else if (k !== 'shown' && f[k].length > MAX_LINE) problems.push(k + ': longer than ' + MAX_LINE + ' characters (short lines, no essay)');
  }
  if (f['his words'] && !/^".+"\s*\((order|question)\)$/i.test(f['his words'])) problems.push('his words: must be "<his quote>" (order|question)');
  if (f['fix or report'] && !/^(fix|report)$/i.test(f['fix or report'])) problems.push('fix or report: must be fix or report');
  if (f.shown) {
    const p = path.isAbsolute(f.shown) ? f.shown : path.join(ROOT, f.shown);
    if (!/\.png$/i.test(p) || !fs.existsSync(p)) problems.push('shown: must name a picture (.png) that exists');
  }
  if (/^report$/i.test(f['fix or report'] || '') && FAILURE_WORDS.test(f['his words'] || '')) {
    const nod = (f['alert nod'] || '').replace(/^"|"$/g, '').trim();
    if (!nod || !his.includes(nod)) problems.push('he named a failure and this only reports it: fix first, or add alert nod: "<his words asking for an alert>"');
  }
  // Change card (2026-11-05, per みや "Add it now"): a passing CHANGE-CARD (before) block under this STEP-3 block.
  if (CARD) {
    const raw = f.__raw || '';
    if (!/^CHANGE-CARD \(before\):/m.test(raw)) problems.push('no CHANGE-CARD (before) block under this STEP-3 block: five one-sentence lines What · Why · How · When · Where (skill change-card)');
    else { const c = CARD.check(raw, 'before'); if (!c.pass) problems.push('CHANGE-CARD (before) fails: ' + c.reasons.join(' · ')); }
  }
  const needsHighest = sc === 'highest-order' || FREQUENT.test(f['who pays'] || '');
  if (needsHighest) {
    const id = MODELS ? MODELS.highest() : null;
    if (!id) problems.push('no highest-model-id in system/evolution-protocol.md');
    else {
      if (f.model !== id) problems.push('model: must be ' + id + ' (highest order, or a part that runs every session, prompt, turn or tool call)');
      let t = ''; try { t = fs.readFileSync(data.transcript_path || '', 'utf8'); } catch (_) { t = ''; }
      if (f.model === id && !usedModel(t, id)) problems.push(id + ' did not run this session: send one read-only Agent with model ' + (MODELS.alias(id) || id));
    }
  }
  return problems.length ? { scope: sc, problems } : null;
}

function denyText(v) {
  return [
    '⛔ design-consult-gate (step-3 rider): this ' + (v.scope === 'highest-order' ? 'highest-order change' : 'new part') + ' needs its change-route step 3 check first.',
    ...v.problems.map(p => '   - ' + p),
    '   Write it in main/current-session.md: STEP-3: <title>, then session: · his words: · fix or report: · who pays: · goal without the part: · model: · shown:',
    '   Rule: system/INDEX.md §The change route, step 3.',
  ].join('\n');
}

module.exports = { check, denyText, scope, findBlock, usedModel };
