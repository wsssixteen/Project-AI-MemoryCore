#!/usr/bin/env node
/**
 * core/forge.js — K7: the component forge (external-audit addendum §2, binding).
 * Every new hook/check/skill/script is BORN here — one atomic operation:
 *   echo → collision-check (refine-first) → scaffold → syntax-check → register
 *   → eval (must pass) → smoke-fire → registry entry + telemetry + rollback recipe.
 *
 * USAGE:
 *   node core/forge.js new check <name> --event <Event> [--matcher "<m>"] \
 *        --trigger "<when X>" --action "<flag/block Y>" --replay "<concrete case>" \
 *        --route <code|check|tool-gate|skill|prose> --route-why "<reason>" \
 *        --footprint "<per-prompt|per-tool|per-turn|per-session|always|scheduled|on-demand|none>: <processes, RAM>" \
 *        --nod "<authorization>" [--override-collision "<reason>"] [--root <path>]
 *   node core/forge.js new skill <name>  --trigger ... --action ... --replay ... --nod ...
 *   node core/forge.js new script <name> --trigger ... --action ... --replay ... --nod ...
 *   node core/forge.js refine <name> --nod "<authorization>"
 *   node core/forge.js install hook .claude/hooks/<file>.js [--name <kebab>] --symptom ... --goal ... --signal ... \
 *        --retention ... --footprint ... --nod "<authorization>" [--allow-relative] [--no-smoke]
 *        (2026-10-05: brings an EXISTING loose hook into domain/<name>/ unchanged — see forgeInstall)
 *
 * Exit codes: 0 ok · 2 hard failure (a birth step failed → nothing half-lands: files are
 * removed, settings restored) · 3 collision (refine-first: use `forge refine` or
 * --override-collision "<reason>").
 *
 * Born 2026-07-13 (sprint Day 2, pre-forge bootstrap — manual forge discipline applied
 * to the forge itself: syntax ✓ + core/forge.eval.js green before commit).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const argvRootIdx = process.argv.indexOf('--root');
const ROOT = argvRootIdx > 0 ? path.resolve(process.argv[argvRootIdx + 1])
  : (process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..'));
const SETTINGS = path.join(ROOT, '.claude', 'settings.json');
const REGISTRY = path.join(ROOT, 'system', 'registry.jsonl');
const TELEMETRY = path.join(ROOT, 'system', 'telemetry', 'hook-fires.jsonl');

function arg(name, required) {
  const i = process.argv.indexOf('--' + name);
  const v = i > 0 ? process.argv[i + 1] : undefined;
  if (required && (v === undefined || v.startsWith('--'))) die(2, `missing required --${name}\n       forge new check <name> needs ALL of: --event --trigger --action --replay --symptom --goal --signal --retention --footprint --nod  [--matcher "<m>"] [--override-collision "<reason>"] [--root <path>]`);
  return v;
}
const FOOTPRINT_RE = /^(per-prompt|per-tool|per-turn|per-session|always|scheduled|on-demand|none)\b/i;
function die(code, msg) { console.error('forge: ' + msg); process.exit(code); }
function log(msg) { console.log('forge: ' + msg); }
function append(file, row) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(row) + '\n');
}

// ---------- templates ----------
function checkTemplate(name, event, trigger, action) {
  return `#!/usr/bin/env node
// ${name}.check.hook.js — born via core/forge.js (${new Date().toISOString().slice(0, 10)})
// TRIGGER: ${trigger}
// ACTION: ${action}
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: '${name}', event: '${event}' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  // TODO(forge): implement NARROW detection for the replay case, then widen with evidence.
  const fired = false;
  if (!fired) return { fired: false };
  return { fired: true, blocked: false, contextOut: '${name}: advisory\\n' };
});
`;
}
function checkEvalTemplate(name, replay) {
  return `#!/usr/bin/env node
// ${name}.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: ${replay.replace(/\n/g, ' ')}
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, '${name}.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: TODO(forge) — replace with the CONCRETE replay-case stdin; assert fired/blocked as intended.
check('F2 replay-case fixture present (stub passes until implemented)', true, 'stub');

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12 (2026-08-21): enumerate >=10 OPPOSING /
// OUT-OF-SPEC scenarios BEFORE shipping; verdict each: handled | fixture-added | accepted-risk.
// Encode the credible ones as fixtures below. Classes to mine (invent more):
//   1. own help/bypass text appearing in the transcript (the 9-gate self-disarm bug)
//   2. malformed JSON stdin / empty transcript / plain-text transcript
//   3. worktree vs main repo path resolution (__dirname vs CLAUDE_PROJECT_DIR)
//   4. eval-sandbox copy of the hook (lib not adjacent)
//   5. bundle dispatch vs direct registration (stdout JSON forwarding)
//   6. two concurrent sessions / stale dual-copy files
//   7. dependency file deleted or renamed
//   8. bypass token in an OLD turn / echoed by another hook
//   9. huge transcript (multi-MB) — timeout / memory
//  10. the simplest user instruction the feature could invert or lose
// TODO(forge): verdicts + fixtures — ship is NOT done while this block is unresolved.

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\\n${name}.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
`;
}
function nukeMarkerTemplate(name, createdFiles, event, symptom) {
  const today = new Date().toISOString().slice(0, 10);
  const retire = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const files = createdFiles.map(f => path.relative(ROOT, f)).join(' · ');
  return '# NUKE-MARKER — ' + name + '\n\n' +
    '| Field | Value |\n|---|---|\n' +
    '| Created  | ' + today + ' |\n' +
    '| Session  | ' + (symptom || 'TODO(forge): one-line root symptom / quest ID / user ask that triggered this Feature') + ' |\n' +
    '| Files    | ' + files + ' · README.md · settings.json ' + (event || '') + ' entry · system/registry.jsonl line |\n' +
    '| Rollback | `rm -rf domain/' + name + '` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |\n' +
    '| Retire   | ' + retire + ' — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |\n';
}

function readmeTemplate(name, event, trigger, action, why) {
  why = why || {};
  // system-design Rule 13 WHY-chain (2026-09-06): machine-readable keys FIRST — the turn-ledger,
  // feature-census and housekeeping read these lines; the prose below is for humans.
  return '# ' + name + '\n\n' +
    'symptom: ' + (why.symptom || 'TODO(forge)') + '\n' +
    'goal: ' + (why.goal || 'TODO(forge)') + '\n' +
    'goal_signal: ' + (why.signal || 'TODO(forge)') + '\n' +
    (why.signalRegex ? 'goal_signal_regex: ' + why.signalRegex + '\n' : '') +
    'retention: ' + (why.retention || 'TODO(forge)') + '\n' +
    'footprint: ' + (why.footprint || 'TODO(forge)') + '\n\n' +
    '**What fires when**: ' + (event || 'n/a') + ' — ' + trigger + '\n\n' +
    '**Contract**: ' + action + '\n\n' +
    '**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.\n\n' +
    '**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.\n\n' +
    '**Observability**: every fire appends to `domain/' + name + '/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.\n\n' +
    '**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.\n';
}

function skillTemplate(name, trigger, action) {
  return `# ${name} — born via core/forge.js\n\nTRIGGER: ${trigger}\n\nACTION (procedure):\n\n1. TODO(forge): fill the procedure steps.\n\n> Fixture: see ${name}.eval.md — input scenario → expected emit shape.\n`;
}

// ---------- birth steps ----------
function collisionScan(name, trigger) {
  const hits = [];
  if (fs.existsSync(path.join(ROOT, 'domain', name))) hits.push('domain/' + name);
  if (fs.existsSync(path.join(ROOT, '.claude', 'skills', name))) hits.push('.claude/skills/' + name);
  try {
    const settings = fs.readFileSync(SETTINGS, 'utf8');
    if (settings.includes(name)) hits.push('settings.json mentions "' + name + '"');
  } catch (_) {}
  try {
    if (fs.existsSync(REGISTRY)) {
      const words = (trigger || '').toLowerCase().split(/\W+/).filter(w => w.length > 4);
      for (const line of fs.readFileSync(REGISTRY, 'utf8').split('\n').filter(Boolean)) {
        const row = JSON.parse(line);
        const rowTrig = (row.trigger || '').toLowerCase();
        if (row.name !== name && words.filter(w => rowTrig.includes(w)).length >= 3) {
          hits.push('registry trigger-overlap with "' + row.name + '"');
        }
      }
    }
  } catch (_) {}
  return hits;
}

function registerHook(event, matcher, cmdPath) {
  const settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  settings.hooks = settings.hooks || {};
  settings.hooks[event] = settings.hooks[event] || [];
  const entry = { type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}\\\\' + cmdPath.replace(/\//g, '\\\\') + '"' };
  let block = settings.hooks[event].find(b => (b.matcher || '') === (matcher || ''));
  if (!block) { block = matcher ? { matcher, hooks: [] } : { hooks: [] }; settings.hooks[event].push(block); }
  block.hooks.push(entry);
  fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2));
  JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); // re-validate or throw
  return entry.command;
}

function forgeNew() {
  const kind = process.argv[3], name = process.argv[4];
  if (!['check', 'skill', 'script'].includes(kind) || !name || name.startsWith('--')) die(2, 'usage: forge new <check|skill|script> <name> ...');
  if (!/^[a-z0-9-]+$/.test(name)) die(2, 'name must be kebab-case');
  const trigger = arg('trigger', true), action = arg('action', true), replay = arg('replay', true), nod = arg('nod', true);
  const route = arg('route') || (kind === 'check' ? 'check' : kind), routeWhy = arg('route-why') || '(not stated)';
  const event = kind === 'check' ? arg('event', true) : null;
  const matcher = arg('matcher') || '';
  // system-design Rule 13 WHY-chain (2026-09-06, per miya): a Feature is born knowing its goal.
  const why = { symptom: arg('symptom', true), goal: arg('goal', true), signal: arg('signal', true), retention: arg('retention', true), signalRegex: arg('signal-regex') };
  for (const k of ['symptom', 'goal', 'signal', 'retention']) {
    if (/^\s*$/.test(why[k]) || /\bTODO\b/i.test(why[k])) die(2, '--' + k + ' must be a real sentence (empty/TODO banned — Rule 13)');
  }
  if (!/^(keep|rotate\s+\S+|consume\s+\S+|regenerate)$/i.test(why.retention.trim())) die(2, '--retention must be one of: keep | rotate <period> | consume <into> | regenerate (system-rules Rule 6)');
  if (/^(fires?|triggers?|runs?)\b/i.test(why.goal.trim())) die(2, '--goal restates the trigger; state the OUTCOME the feature exists to produce (Rule 13)');
  // system-rules Rule 7 (2026-09-29): resource footprint declared at birth — trigger class first, then processes + RAM
  why.footprint = arg('footprint', true);
  if (!FOOTPRINT_RE.test(why.footprint.trim())) die(2, '--footprint must start with one of: per-prompt | per-tool | per-turn | per-session | always | scheduled | on-demand | none, then ": <processes, RAM>" (system-rules Rule 7)');

  // 1. ECHO (recorded, per operator parameter echo+nod)
  log('ECHO  Trigger: when ' + trigger + ' · Action: ' + action + ' · Replay case: ' + replay);
  log('WHY   symptom: ' + why.symptom + ' · goal: ' + why.goal + ' · signal: ' + why.signal + ' · retention: ' + why.retention + ' · footprint: ' + why.footprint);
  log('NOD   ' + nod + ' · ROUTE ' + route + ' (' + routeWhy + ')');

  // 2. collision → refine-first
  const collisions = collisionScan(name, trigger);
  const override = arg('override-collision');
  if (collisions.length && !override) {
    log('COLLISION: ' + collisions.join(' · '));
    log('refine-first: `node core/forge.js refine <existing>` — or pass --override-collision "<reason>"');
    process.exit(3);
  }
  if (collisions.length) log('collision OVERRIDDEN: ' + override);

  const created = [];
  const rollback = [];
  try {
    let evalPath = null, mainPath = null;
    if (kind === 'check') {
      const dir = path.join(ROOT, 'domain', name);
      fs.mkdirSync(dir, { recursive: true });
      mainPath = path.join(dir, name + '.check.hook.js');
      evalPath = path.join(dir, name + '.eval.js');
      fs.writeFileSync(mainPath, checkTemplate(name, event, trigger, action)); created.push(mainPath);
      fs.writeFileSync(evalPath, checkEvalTemplate(name, replay)); created.push(evalPath);
      // system-design Rules 9 + 11: NUKE-MARKER + README born WITH the Feature, never after
      // (2026-08-21: de-close-gate shipped without either — forge scaffolded only hook+eval,
      //  so finishing forge FELT like finishing system-design. Now the scaffold carries them.)
      const nukePath = path.join(dir, 'NUKE-MARKER.md');
      const readmePath = path.join(dir, 'README.md');
      fs.writeFileSync(nukePath, nukeMarkerTemplate(name, created, event, why.symptom)); created.push(nukePath);
      fs.writeFileSync(readmePath, readmeTemplate(name, event, trigger, action, why)); created.push(readmePath);
      // 3. syntax
      for (const f of [mainPath, evalPath]) {
        const c = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
        if (c.status !== 0) throw new Error('syntax-check failed: ' + f + '\n' + c.stderr);
      }
      // 4. register (tool-written, never by hand)
      const cmd = registerHook(event, matcher, 'domain/' + name + '/' + name + '.check.hook.js');
      rollback.push('unregister from settings.json ' + event + ': ' + cmd);
      // 5. eval must pass
      const e = spawnSync(process.execPath, [evalPath], { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
      process.stdout.write(e.stdout || '');
      if (e.status !== 0) throw new Error('eval RED — ship blocked');
      // 6. smoke-fire on clean stdin
      const s = spawnSync(process.execPath, [mainPath], { input: '{}', encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
      if (s.status !== 0) throw new Error('smoke-fire failed (exit ' + s.status + ')');
    } else {
      const dir = kind === 'skill' ? path.join(ROOT, '.claude', 'skills', name) : path.join(ROOT, 'lib');
      fs.mkdirSync(dir, { recursive: true });
      mainPath = kind === 'skill' ? path.join(dir, 'SKILL.md') : path.join(dir, name + '.js');
      const whyHeader = '// symptom: ' + why.symptom + '\n// goal: ' + why.goal + '\n// goal_signal: ' + why.signal + '\n// retention: ' + why.retention + '\n// footprint: ' + why.footprint + '\n';
      fs.writeFileSync(mainPath, kind === 'skill' ? skillTemplate(name, trigger, action) + '\n' + whyHeader.replace(/^\/\/ /gm, '') : '#!/usr/bin/env node\n// ' + name + ' — born via forge\n' + whyHeader);
      created.push(mainPath);
      if (kind === 'script') {
        const c = spawnSync(process.execPath, ['--check', mainPath], { encoding: 'utf8' });
        if (c.status !== 0) throw new Error('syntax-check failed');
      }
    }
    // 7. registry + telemetry + rollback recipe
    append(REGISTRY, { ts: new Date().toISOString(), name, kind, event, files: created.map(f => path.relative(ROOT, f)), lifecycle: 'created', route, route_why: routeWhy, trigger, action, replay, nod, symptom: why.symptom, goal: why.goal, goal_signal: why.signal, retention: why.retention, footprint: why.footprint, collisions_overridden: override || null });
    append(TELEMETRY, { ts: new Date().toISOString(), hook: 'forge', event: 'Forge', mode: 'forge-new', component: name, kind, exit: 0, blocked: false });
    // Auto-ledger the birth as a type=upgrade Slip Ledger row (weekly-audit feed) — 2026-07-19
    // scour refinement #3. Expected result: registry rows ⊆ upgrade rows, zero manual memory.
    append(path.join(ROOT, 'system', 'slips.jsonl'), { ts: new Date().toISOString(), type: 'upgrade', category: 'forge/new-' + kind, qa: null, guard_expected: null, guard_fired: null, evidence: name + ' born via forge: ' + (action || '').slice(0, 140), action: null, caught_by: 'forge' });
    log('ROLLBACK recipe: delete ' + created.map(f => path.relative(ROOT, f)).join(' + ') + (rollback.length ? ' · ' + rollback.join(' · ') : '') + ' · remove registry.jsonl line for "' + name + '"');
    log('BORN ✓ ' + name + ' (' + kind + ') — lifecycle: created');
  } catch (e) {
    for (const f of created) { try { fs.unlinkSync(f); } catch (_) {} }
    die(2, 'birth FAILED, nothing half-landed: ' + e.message);
  }
}

function forgeRefine() {
  const name = process.argv[3];
  const nod = arg('nod', true);
  if (!name) die(2, 'usage: forge refine <name> --nod "..."');
  const candidates = [path.join(ROOT, 'domain', name), path.join(ROOT, '.claude', 'skills', name)].filter(p => fs.existsSync(p));
  const flatHook = path.join(ROOT, '.claude', 'hooks', name + '.js');          // pre-forge flat hook: <name>.js + <name>.eval.js
  if (!candidates.length && !fs.existsSync(flatHook)) die(2, 'no component named "' + name + '" found (domain/, skills/ or .claude/hooks/)');
  log('REFINE target: ' + candidates.concat(fs.existsSync(flatHook) ? [flatHook] : []).join(' · '));
  const evals = [];
  for (const dir of candidates) for (const f of fs.readdirSync(dir)) if (/eval.*\.js$/.test(f)) evals.push(path.join(dir, f));
  if (fs.existsSync(flatHook.replace(/\.js$/, '.eval.js'))) evals.push(flatHook.replace(/\.js$/, '.eval.js'));
  log('behavior pins (must stay green after your edit): ' + (evals.length ? evals.map(f => path.relative(ROOT, f)).join(' · ') : 'NONE — add a fixture with the refine'));
  for (const f of evals) {
    const e = spawnSync(process.execPath, [f], { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
    process.stdout.write(e.stdout || '');
    if (e.status !== 0) die(2, 'pre-refine eval RED: ' + f + ' — fix before refining');
  }
  append(REGISTRY, { ts: new Date().toISOString(), name, kind: 'refine-opened', lifecycle: 'refining', nod });
  log('pre-refine pins GREEN — edit the component, add the new fixture, then re-run its eval.');
}

// ---------- install (2026-10-05, per みや: "start using the term Install") ----------
// Brings an EXISTING loose hook (.claude/hooks/<file>.js) into a Feature folder so it is INSTALLED
// (system/INDEX.md map, Features row): home + README goal/retention/footprint + eval + registration.
// Behaviour must not change, so install REFUSES rather than guesses:
//   - a sibling-relative reference inside the hook (require('./x'), path.join(__dirname, 'x')) would
//     break on the move → exit 2 with the lines (fix, or pass --allow-relative once checked)
//   - another .js/.json file that names the old path would break → exit 2 with the list
//     (settings.json and bundle manifests are rewritten by install itself)
// Both homes are two levels below the repo root, so `path.resolve(__dirname, '..', '..')` keeps resolving.
// The telemetry name is KEPT (passed to hook-runtime --wrap as the name argument) so the fire history
// before and after install is one series.
function kebab(s) { return String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase(); }
function whyFromArgs() {
  const why = { symptom: arg('symptom', true), goal: arg('goal', true), signal: arg('signal', true), retention: arg('retention', true), signalRegex: arg('signal-regex') };
  for (const k of ['symptom', 'goal', 'signal', 'retention']) {
    if (/^\s*$/.test(why[k]) || /\bTODO\b/i.test(why[k])) die(2, '--' + k + ' must be a real sentence (empty/TODO banned — Rule 13)');
  }
  if (!/^(keep|rotate\s+\S+|consume\s+\S+|regenerate)$/i.test(why.retention.trim())) die(2, '--retention must be one of: keep | rotate <period> | consume <into> | regenerate (system-rules Rule 6)');
  if (/^(fires?|triggers?|runs?)\b/i.test(why.goal.trim())) die(2, '--goal restates the trigger; state the OUTCOME the feature exists to produce (Rule 13)');
  why.footprint = arg('footprint', true);
  if (!FOOTPRINT_RE.test(why.footprint.trim())) die(2, '--footprint must start with one of: per-prompt | per-tool | per-turn | per-session | always | scheduled | on-demand | none, then ": <processes, RAM>" (system-rules Rule 7)');
  return why;
}
function walkFiles(dir, out) {
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return out; }
  for (const e of ents) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'worktrees') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, out); else out.push(p);
  }
  return out;
}
function installSmokeEval(name, file, oldRel) {
  return `#!/usr/bin/env node
// ${name}.eval.js — INSTALL pin (core/forge.js install, ${new Date().toISOString().slice(0, 10)}).
// The hook was moved from ${oldRel} unchanged. This pins the install itself: the file parses and is
// registered at its new home. Behaviour fixtures are still owed — add them with \`forge refine ${name}\`.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const HOOK = path.join(__dirname, '${file}');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
const c = spawnSync(process.execPath, ['--check', HOOK], { encoding: 'utf8' });
check('I1 hook file parses (node --check)', c.status === 0, (c.stderr || '').slice(0, 160));
let reg = ''; try { reg = fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'); } catch (_) {}
let bundles = ''; try { for (const f of fs.readdirSync(path.join(ROOT, 'domain', 'bundles'))) bundles += fs.readFileSync(path.join(ROOT, 'domain', 'bundles', f), 'utf8'); } catch (_) {}
const wired = (reg + bundles).replace(/\\\\+/g, '/').includes('domain/${name}/${file}');
check('I2 registered at its Feature home (settings.json or a bundle), or deliberately unregistered in README', wired || /^registration:\\s*none/mi.test(fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8')), 'not found in settings.json / bundles');
check('I3 old loose copy is gone', !fs.existsSync(path.join(ROOT, '${oldRel}'.split('/').join(path.sep))), 'old file still present');
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\\n${name}.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
`;
}

function forgeInstall() {
  const kind = process.argv[3], srcArg = process.argv[4];
  if (kind !== 'hook' || !srcArg || srcArg.startsWith('--')) die(2, 'usage: forge install hook <.claude/hooks/file.js> [--name <kebab>] --symptom --goal --signal --retention --footprint --nod [--allow-relative] [--no-smoke] [--root <path>]');
  const src = path.isAbsolute(srcArg) ? srcArg : path.join(ROOT, srcArg);
  const hooksDir = path.join(ROOT, '.claude', 'hooks');
  if (!fs.existsSync(src) || path.dirname(path.resolve(src)) !== path.resolve(hooksDir) || !src.endsWith('.js')) die(2, 'install hook: source must be an existing .js file directly under .claude/hooks/ — got ' + srcArg);
  const base = path.basename(src, '.js');
  const name = arg('name') || kebab(base);
  if (!/^[a-z0-9-]+$/.test(name)) die(2, 'name must be kebab-case (pass --name)');
  const nod = arg('nod', true);
  const why = whyFromArgs();
  const oldRel = '.claude/hooks/' + base + '.js';
  const newFile = name + '.hook.js';
  const newRel = 'domain/' + name + '/' + newFile;
  const dir = path.join(ROOT, 'domain', name);
  log('ECHO  install ' + oldRel + ' → ' + newRel + ' (telemetry name kept: ' + base + ')');
  log('WHY   symptom: ' + why.symptom + ' · goal: ' + why.goal + ' · signal: ' + why.signal + ' · retention: ' + why.retention + ' · footprint: ' + why.footprint);
  log('NOD   ' + nod);

  if (fs.existsSync(dir)) { log('COLLISION: domain/' + name + ' already exists — refine-first, or pick another --name'); process.exit(3); }

  // safety 1: sibling-relative references inside the hook
  const body = fs.readFileSync(src, 'utf8');
  // The ONLY location-independent use of __dirname is "two levels up" (= the repo root from either home).
  // Anything else — a sibling, one level up, a variable — resolves differently after the move.
  const ROOT_UP = /__dirname\s*,\s*['"]\.\.['"]\s*,\s*['"]\.\.['"]/g;
  const relLines = body.split(/\r?\n/).map((l, i) => ({ l, i: i + 1 }))
    .filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.l))
    .filter(x => /require\(\s*['"]\.\.?\/[^'"]+['"]\s*\)/.test(x.l) || /__dirname/.test(x.l.replace(ROOT_UP, '')));
  if (relLines.length && !process.argv.includes('--allow-relative')) {
    die(2, 'install REFUSED — ' + oldRel + ' has sibling-relative reference(s) that would break on the move:\n' + relLines.map(x => '       line ' + x.i + ': ' + x.l.trim().slice(0, 140)).join('\n') + '\n       fix them (resolve from the repo root), or pass --allow-relative once checked');
  }
  // safety 2: other code that names the old path (settings.json + bundle manifests are rewritten below)
  const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const PATH_SRC = '\\.claude([\\\\/]+)hooks[\\\\/]+' + esc + '\\.js';
  const PATH_RX = new RegExp(PATH_SRC);                                              // test only (no g flag: no lastIndex state)
  const JOIN_RX = new RegExp("['\"]hooks['\"]\\s*,\\s*['\"]" + esc + "\\.js['\"]");
  const settingsRel = path.join('.claude', 'settings.json');
  const codeRefs = [], docRefs = [];
  for (const top of ['domain', '.claude', 'lib', 'core', 'quest', 'system']) {
    for (const f of walkFiles(path.join(ROOT, top), [])) {
      if (path.resolve(f) === path.resolve(src)) continue;
      const rel = path.relative(ROOT, f);
      if (rel === settingsRel || /^domain[\\/]bundles[\\/]/.test(rel)) continue;
      if (!/\.(js|json|md)$/.test(f)) continue;
      if (path.resolve(f) === path.resolve(src.replace(/\.js$/, '.eval.js'))) continue;   // its own eval moves with it
      let t; try { t = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
      if (!PATH_RX.test(t) && !JOIN_RX.test(t)) continue;
      if (/\.md$/.test(f)) docRefs.push(rel);
      else if (t.split(/\r?\n/).some(l => !/^\s*(\/\/|\*|\/\*)/.test(l) && (PATH_RX.test(l) || JOIN_RX.test(l)))) codeRefs.push(rel);
    }
  }
  if (codeRefs.length) die(2, 'install REFUSED — ' + codeRefs.length + ' code file(s) name the old path and would break:\n' + codeRefs.map(r => '       ' + r).join('\n') + '\n       re-point them at ' + newRel + ' first, then install');

  // from here on: change the disk, with a full rollback on any failure
  const settingsBefore = fs.readFileSync(SETTINGS, 'utf8');
  const bundlesDir = path.join(ROOT, 'domain', 'bundles');
  const bundleBefore = {};
  try { for (const f of fs.readdirSync(bundlesDir)) if (f.endsWith('.json')) bundleBefore[f] = fs.readFileSync(path.join(bundlesDir, f), 'utf8'); } catch (_) {}
  const evalSrc = src.replace(/\.js$/, '.eval.js');
  const hadEval = fs.existsSync(evalSrc);
  const evalBefore = hadEval ? fs.readFileSync(evalSrc, 'utf8') : null;
  const created = []; let moved = false, evalMoved = false;
  const dest = path.join(dir, newFile), evalDest = path.join(dir, name + '.eval.js');
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.renameSync(src, dest); moved = true;
    if (hadEval) {
      const e = evalBefore
        .replace(new RegExp("(['\"`])\\./" + esc + "(?:\\.js)?\\1", 'g'), '$1./' + newFile + '$1')
        .replace(new RegExp("(['\"`])" + esc + "\\.js\\1", 'g'), '$1' + newFile + '$1')
        .replace(new RegExp(PATH_SRC, 'g'), newRel);
      fs.writeFileSync(evalDest, e); fs.unlinkSync(evalSrc); evalMoved = true;
    } else { fs.writeFileSync(evalDest, installSmokeEval(name, newFile, oldRel)); created.push(evalDest); }

    // registration: re-point every settings.json command + bundle child at the new home, keep the telemetry name
    const settings = JSON.parse(settingsBefore);
    let regCount = 0, event = null;
    for (const [ev, groups] of Object.entries(settings.hooks || {})) for (const g of groups || []) for (const h of (g.hooks || [])) {
      if (typeof h.command !== 'string' || !PATH_RX.test(h.command)) continue;
      h.command = h.command.replace(new RegExp(PATH_SRC, 'g'), (_m, sep) => 'domain' + sep + name + sep + newFile);   // same separator style as the entry had
      if (/hook-runtime\.js"?\s+--wrap/.test(h.command) && !new RegExp('\\s' + esc + '\\s*$').test(h.command)) h.command += ' ' + base;
      regCount++; event = event || ev;
    }
    if (regCount) { fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2)); JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); }
    let bundleCount = 0;
    for (const [f, t] of Object.entries(bundleBefore)) {
      const nt = t.replace(new RegExp(PATH_SRC, 'g'), newRel);
      if (nt !== t) { fs.writeFileSync(path.join(bundlesDir, f), nt); JSON.parse(nt); bundleCount++; }
    }
    const registration = regCount ? regCount + ' settings.json entr' + (regCount > 1 ? 'ies' : 'y') : (bundleCount ? bundleCount + ' bundle manifest(s)' : 'none');

    const readme = path.join(dir, 'README.md'), nuke = path.join(dir, 'NUKE-MARKER.md');
    fs.writeFileSync(readme,
      '# ' + name + '\n\n' +
      'symptom: ' + why.symptom + '\n' + 'goal: ' + why.goal + '\n' + 'goal_signal: ' + why.signal + '\n' +
      (why.signalRegex ? 'goal_signal_regex: ' + why.signalRegex + '\n' : '') +
      'retention: ' + why.retention + '\n' + 'footprint: ' + why.footprint + '\n' +
      'registration: ' + registration + '\n' +
      'telemetry_name: ' + base + '\n\n' +
      '**Installed** ' + new Date().toISOString().slice(0, 10) + ' via `core/forge.js install hook` — moved unchanged from `' + oldRel + '`. The telemetry name `' + base + '` is kept, so its fire history before and after the install is one series.\n\n' +
      '**Observability**: central telemetry `system/telemetry/hook-fires.jsonl`, rows with `"hook":"' + base + '"` (fired · blocked · dur_ms · quest · phase).\n\n' +
      '**Eval**: ' + (hadEval ? 'its pre-install eval moved with it (`' + name + '.eval.js`).' : '`' + name + '.eval.js` pins the INSTALL only (parses · registered · old copy gone). Behaviour fixtures are owed.') + '\n');
    created.push(readme);
    fs.writeFileSync(nuke, '# NUKE-MARKER — ' + name + '\n\n| Field | Value |\n|---|---|\n' +
      '| Created  | ' + new Date().toISOString().slice(0, 10) + ' (INSTALLED from `' + oldRel + '`, not newly built) |\n' +
      '| Session  | ' + why.symptom + ' |\n' +
      '| Files    | ' + newRel + ' · domain/' + name + '/' + name + '.eval.js · README.md · ' + registration + ' |\n' +
      '| Rollback | move `' + newRel + '` back to `' + oldRel + '` · re-point the settings.json command(s) at the old path · `rm -rf domain/' + name + '` · or `git revert <install-SHA>` |\n' +
      '| Retire   | ' + new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) + ' — remove this file if the Feature fired >=1x since install AND no rollback |\n');
    created.push(nuke);

    const c = spawnSync(process.execPath, ['--check', dest], { encoding: 'utf8' });
    if (c.status !== 0) throw new Error('syntax-check failed: ' + (c.stderr || '').slice(0, 200));
    const ev = spawnSync(process.execPath, [evalDest], { encoding: 'utf8', timeout: 600000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
    process.stdout.write(ev.stdout || '');
    if (ev.status !== 0) throw new Error('eval RED after the move — install rolled back\n' + (ev.stderr || '').slice(0, 300));
    if (!process.argv.includes('--no-smoke')) {
      const s = spawnSync(process.execPath, [dest], { input: '{}', encoding: 'utf8', timeout: 60000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
      if (s.status !== 0 && s.status !== 2) throw new Error('smoke-fire failed (exit ' + s.status + ') ' + (s.stderr || '').slice(0, 200));
    }
    append(REGISTRY, { ts: new Date().toISOString(), name, kind: 'install-hook', event, files: [newRel, 'domain/' + name + '/' + name + '.eval.js', 'domain/' + name + '/README.md', 'domain/' + name + '/NUKE-MARKER.md'], lifecycle: 'installed', installed_from: oldRel, telemetry_name: base, registration, nod, symptom: why.symptom, goal: why.goal, goal_signal: why.signal, retention: why.retention, footprint: why.footprint });
    append(TELEMETRY, { ts: new Date().toISOString(), hook: 'forge', event: 'Forge', mode: 'forge-install', component: name, kind: 'hook', exit: 0, blocked: false });
    append(path.join(ROOT, 'system', 'slips.jsonl'), { ts: new Date().toISOString(), type: 'upgrade', category: 'forge/install-hook', qa: null, guard_expected: null, guard_fired: null, evidence: name + ' installed from ' + oldRel + ' (' + registration + ')', action: null, caught_by: 'forge' });
    if (docRefs.length) log('DOCS still naming the old path (re-point by hand, they do not execute): ' + docRefs.join(' · '));
    log('INSTALLED ✓ ' + name + ' — ' + newRel + ' · ' + registration + ' · eval ' + (hadEval ? 'moved' : 'install pin'));
  } catch (e) {
    try { if (moved && fs.existsSync(dest)) fs.renameSync(dest, src); } catch (_) {}
    try { if (evalMoved) { fs.writeFileSync(evalSrc, evalBefore); if (fs.existsSync(evalDest)) fs.unlinkSync(evalDest); } } catch (_) {}
    try { fs.writeFileSync(SETTINGS, settingsBefore); } catch (_) {}
    for (const [f, t] of Object.entries(bundleBefore)) { try { fs.writeFileSync(path.join(bundlesDir, f), t); } catch (_) {} }
    for (const f of created) { try { fs.unlinkSync(f); } catch (_) {} }
    try { fs.rmdirSync(dir); } catch (_) {}
    die(2, 'install FAILED, nothing half-landed: ' + e.message);
  }
}

const cmd = process.argv[2];
if (cmd === 'new') forgeNew();
else if (cmd === 'refine') forgeRefine();
else if (cmd === 'install') forgeInstall();
else die(2, 'usage: forge <new|refine|install> ...');
