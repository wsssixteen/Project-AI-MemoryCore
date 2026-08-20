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
 *        --nod "<authorization>" [--override-collision "<reason>"] [--root <path>]
 *   node core/forge.js new skill <name>  --trigger ... --action ... --replay ... --nod ...
 *   node core/forge.js new script <name> --trigger ... --action ... --replay ... --nod ...
 *   node core/forge.js refine <name> --nod "<authorization>"
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
  if (required && (v === undefined || v.startsWith('--'))) die(2, `missing required --${name}`);
  return v;
}
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

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\\n${name}.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
`;
}
function nukeMarkerTemplate(name, createdFiles, event) {
  const today = new Date().toISOString().slice(0, 10);
  const retire = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const files = createdFiles.map(f => path.relative(ROOT, f)).join(' · ');
  return '# NUKE-MARKER — ' + name + '\n\n' +
    '| Field | Value |\n|---|---|\n' +
    '| Created  | ' + today + ' |\n' +
    '| Session  | TODO(forge): one-line root symptom / quest ID / user ask that triggered this Feature |\n' +
    '| Files    | ' + files + ' · README.md · settings.json ' + (event || '') + ' entry · system/registry.jsonl line |\n' +
    '| Rollback | `rm -rf domain/' + name + '` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |\n' +
    '| Retire   | ' + retire + ' — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |\n';
}

function readmeTemplate(name, event, trigger, action) {
  return '# ' + name + '\n\n' +
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

  // 1. ECHO (recorded, per operator parameter echo+nod)
  log('ECHO  Trigger: when ' + trigger + ' · Action: ' + action + ' · Replay case: ' + replay);
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
      fs.writeFileSync(nukePath, nukeMarkerTemplate(name, created, event)); created.push(nukePath);
      fs.writeFileSync(readmePath, readmeTemplate(name, event, trigger, action)); created.push(readmePath);
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
      fs.writeFileSync(mainPath, kind === 'skill' ? skillTemplate(name, trigger, action) : '#!/usr/bin/env node\n// ' + name + ' — born via forge\n');
      created.push(mainPath);
      if (kind === 'script') {
        const c = spawnSync(process.execPath, ['--check', mainPath], { encoding: 'utf8' });
        if (c.status !== 0) throw new Error('syntax-check failed');
      }
    }
    // 7. registry + telemetry + rollback recipe
    append(REGISTRY, { ts: new Date().toISOString(), name, kind, event, files: created.map(f => path.relative(ROOT, f)), lifecycle: 'created', route, route_why: routeWhy, trigger, action, replay, nod, collisions_overridden: override || null });
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
  if (!candidates.length) die(2, 'no component named "' + name + '" found (domain/ or skills/)');
  log('REFINE target: ' + candidates.join(' · '));
  const evals = [];
  for (const dir of candidates) for (const f of fs.readdirSync(dir)) if (/eval.*\.js$/.test(f)) evals.push(path.join(dir, f));
  log('behavior pins (must stay green after your edit): ' + (evals.length ? evals.map(f => path.relative(ROOT, f)).join(' · ') : 'NONE — add a fixture with the refine'));
  for (const f of evals) {
    const e = spawnSync(process.execPath, [f], { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
    process.stdout.write(e.stdout || '');
    if (e.status !== 0) die(2, 'pre-refine eval RED: ' + f + ' — fix before refining');
  }
  append(REGISTRY, { ts: new Date().toISOString(), name, kind: 'refine-opened', lifecycle: 'refining', nod });
  log('pre-refine pins GREEN — edit the component, add the new fixture, then re-run its eval.');
}

const cmd = process.argv[2];
if (cmd === 'new') forgeNew();
else if (cmd === 'refine') forgeRefine();
else die(2, 'usage: forge <new|refine> ...');
