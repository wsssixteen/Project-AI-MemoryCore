#!/usr/bin/env node
// observatory.eval.js — pins the Lapis Lazuli Observatory (lib/observatory.js + domain/observatory/server.js).
// E1-E12 inventory: every kind's count equals an INDEPENDENT disk count (+ its ghosts), every kind has rows.
// E13-E18 verdict + census agreement · E19-E20 strays · E21 cold build time · E22-E31 server routes · E32 UI wiring.
'use strict';
process.env.OBSERVATORY_NO_LOG = '1';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawnSync, execFileSync } = require('child_process');

const HERE = __dirname;
const CODE_ROOT = path.resolve(HERE, '..', '..');
const obs = require(path.join(CODE_ROOT, 'lib', 'observatory.js'));
const DATA_ROOT = obs.DATA_ROOT;

let pass = 0, fail = 0;
function check(name, ok, detail) { if (ok) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name + (detail ? '  → ' + detail : '')); } }
const ls = p => { try { return fs.readdirSync(p, { withFileTypes: true }); } catch (_) { return []; } };
const exists = p => { try { fs.statSync(p); return true; } catch (_) { return false; } };

// ── independent disk counts (written without reading lib/observatory.js) ──
function diskCounts() {
  const dom = ls(path.join(CODE_ROOT, 'domain')).filter(d => d.isDirectory() && d.name !== 'bundles');
  const hasHook = d => ls(path.join(CODE_ROOT, 'domain', d.name)).some(f => f.isFile() && f.name.endsWith('.hook.js'));
  const scripts = ['core', 'lib', 'quest', 'system'].reduce((a, d) => a + ls(path.join(CODE_ROOT, d)).filter(f => f.isFile() && f.name.endsWith('.js') && !f.name.endsWith('.eval.js') && !f.name.includes('.log.')).length, 0);
  const skills = ['.claude/skills', '.agents/skills'].reduce((a, d) => a + ls(path.join(CODE_ROOT, d)).filter(f => f.isDirectory() || f.isSymbolicLink()).length, 0);
  const docs = ['system', '.claude', ''].reduce((a, d) => a + ls(path.join(CODE_ROOT, d)).filter(f => f.isFile() && f.name.endsWith('.md') && !/-\d{4}-\d{2}-\d{2}/.test(f.name)).length, 0);
  const memory = ['main/main-memory.md', 'main/current-session.md', 'main/todo.md', '.claude/auto-memory', 'daily-diary', 'main/session-archive.md', 'quest/active.txt', 'quest/active-archive.txt', 'projects/coding-projects/active', 'system/slips.jsonl'].filter(p => exists(path.join(DATA_ROOT, p))).length;
  return {
    feature: dom.filter(hasHook).length,
    package: dom.filter(d => !hasHook(d)).length,
    'legacy-hook': ls(path.join(CODE_ROOT, '.claude', 'hooks')).filter(f => f.isFile() && f.name.endsWith('.js') && !f.name.endsWith('.eval.js')).length,
    bundle: ls(path.join(CODE_ROOT, 'domain', 'bundles')).filter(f => f.isFile() && f.name.endsWith('.json')).length,
    skill: skills,
    script: scripts,
    protocol: ls(path.join(CODE_ROOT, 'Feature')).filter(d => d.isDirectory()).length,
    workflow: ls(path.join(CODE_ROOT, '.claude', 'workflows')).filter(f => f.isFile()).length,
    knowledge: ls(path.join(DATA_ROOT, 'projects', 'coding-projects', 'active', 'etanah-knowledge')).filter(d => d.isDirectory()).length,
    project: exists(path.join(CODE_ROOT, 'etanah_atlas')) ? 1 : 0,
    memory,
    doc: docs,
  };
}

function get(port, p, method) {
  return new Promise(resolve => {
    const req = http.request({ host: '127.0.0.1', port, path: p, method: method || 'GET', timeout: 120000 }, res => { let b = ''; res.setEncoding('utf8'); res.on('data', c => { b += c; }); res.on('end', () => resolve({ code: res.statusCode, type: res.headers['content-type'] || '', body: b })); });
    req.on('error', e => resolve({ code: 0, body: String(e) }));
    req.on('timeout', () => { req.destroy(); resolve({ code: 0, body: 'timeout' }); });
    req.end();
  });
}

(async () => {
  console.log('observatory.eval.js');
  const snap = obs.build({ days: 30 });            // also warms the telemetry cache for E21
  const disk = diskCounts();
  const byKind = k => snap.components.filter(c => c.kind === k);

  // E1-E12: per-kind count = disk count + ghosts of that kind
  for (const [kind, n] of Object.entries(disk)) {
    const got = byKind(kind); const ghosts = got.filter(c => c.ghost).length;
    check(`E count ${kind}: snapshot ${got.length} = disk ${n} + ghosts ${ghosts}`, got.length === n + ghosts, `snapshot ${got.length}, disk ${n}, ghosts ${ghosts}`);
  }
  const kinds = Object.keys(disk);
  check('every kind has rows', kinds.every(k => byKind(k).length > 0), kinds.filter(k => !byKind(k).length).join(','));
  check('no component kind outside the 12 known kinds', snap.components.every(c => kinds.includes(c.kind)), [...new Set(snap.components.map(c => c.kind))].join(','));

  // verdicts + census agreement
  const ids = snap.components.map(c => c.id);
  check('component ids are unique', new Set(ids).size === ids.length, ids.length - new Set(ids).size + ' duplicates');
  const V = ['healthy', 'gaps', 'silent', 'unregistered', 'failing', 'ghost', 'retired'];
  check('every component has a known verdict + status', snap.components.every(c => V.includes(c.verdict) && c.status), '');
  check('ghosts really have no file on disk', snap.components.filter(c => c.ghost).every(c => !exists(path.join(CODE_ROOT, c.path))), '');
  // independent ghost count: every quoted .js/.json token in settings.json commands, resolved against the checkout
  const settings = JSON.parse(fs.readFileSync(path.join(CODE_ROOT, '.claude', 'settings.json'), 'utf8'));
  const tokens = new Set();
  for (const blocks of Object.values(settings.hooks || {})) for (const b of blocks) for (const h of b.hooks || []) {
    for (const t of String(h.command).split('"')) { const s = t.trim().replace(/\$\{CLAUDE_PROJECT_DIR\}/, '').replace(/\\+/g, '/').replace(/^\/+/, ''); if (/\.(js|json)$/.test(s) && !/\s/.test(s)) tokens.add(s); }
  }
  const missing = [...tokens].filter(t => !exists(path.join(CODE_ROOT, t)));
  const snapGhosts = snap.components.filter(c => c.ghost).map(c => c.path).sort();
  check(`ghost list equals an independent settings.json scan (${missing.length} missing)`, JSON.stringify(missing.sort()) === JSON.stringify(snapGhosts), 'independent: ' + missing.join(',') + ' | snapshot: ' + snapGhosts.join(','));
  check('every bundle manifest in domain/bundles is registered', snap.components.filter(c => c.kind === 'bundle' && !c.ghost).every(c => c.registration), snap.components.filter(c => c.kind === 'bundle' && !c.registration).map(c => c.path).join(','));
  check('failing eval → verdict failing (unless ghost/retired)', snap.components.filter(c => c.evalStatus === 'fail' && !c.ghost && !c.retired).every(c => c.verdict === 'failing'), '');
  const census = require(path.join(CODE_ROOT, 'lib', 'feature-census.js')).collect();
  const censusGaps = census.filter(r => /^GAPS/.test(r.verdict) && r.name.startsWith('domain/'));
  const mapGap = g => (g === 'NOT REGISTERED (ghost)' ? 'not registered in settings.json' : g);   // same label mapping as the collector
  const mismatched = censusGaps.filter(r => { const c = snap.components.find(x => x.path === r.name); if (c && (c.retired || (c.hooks || []).every(h => h.registration || h.optOut))) return false; return !c || r.verdict.slice(6).split(', ').map(mapGap).some(g => !c.gaps.includes(g)); });
  check(`census agreement: ${censusGaps.length} domain gap rows carried into component gaps`, mismatched.length === 0, mismatched.slice(0, 3).map(r => r.name).join(', '));
  const healthyWithGaps = snap.components.filter(c => c.verdict === 'healthy' && c.gaps.length);
  check('no component is healthy while carrying gaps', healthyWithGaps.length === 0, healthyWithGaps.slice(0, 3).map(c => c.path).join(', '));

  // strays
  const reg = (execFileSync('git', ['-C', DATA_ROOT, 'worktree', 'list', '--porcelain'], { encoding: 'utf8' }).match(/^worktree .+$/gm) || []).map(l => path.resolve(l.slice(9)).toLowerCase());
  const stale = snap.strays.staleWorktrees;
  check(`stale worktrees (${stale.length}) exist on disk and are not registered with git`, stale.every(w => exists(path.join(DATA_ROOT, '.claude', 'worktrees', w.name)) && !reg.includes(path.resolve(DATA_ROOT, '.claude', 'worktrees', w.name).toLowerCase())), '');
  const onDisk = ls(path.join(DATA_ROOT, '.claude', 'worktrees')).filter(d => d.isDirectory()).length;
  const regInside = reg.filter(r => r.includes(path.join('.claude', 'worktrees').toLowerCase())).length;
  check(`stale count ${stale.length} = folders ${onDisk} − registered ${regInside} (− this checkout if unregistered)`, stale.length === onDisk - regInside || stale.length === onDisk - regInside - 1, `folders ${onDisk}, registered ${regInside}`);

  // telemetry counts each row once: independent de-duplicated recount of every file the snapshot read
  const inWindow = new Set(snap.meta.days); const seenRows = new Set(); let rawRows = 0, dedupRuns = 0;
  for (const src of snap.sources.filter(x => x.kind === 'hook telemetry')) {
    const root = src.root === 'main' ? DATA_ROOT : path.join(DATA_ROOT, '.claude', 'worktrees', src.root.slice(9));
    for (const l of fs.readFileSync(path.join(root, src.file), 'utf8').split('\n')) {
      if (l.length < 5) continue; let r; try { r = JSON.parse(l); } catch (_) { continue; }
      if (!r.ts || r.ts > snap.meta.generated) continue;
      const k = [r.ts, r.hook, r.event, r.turn_id, r.session_id, r.dur_ms, r.exit, r.blocked, r.mode].join('|');
      if (inWindow.has(r.ts.slice(0, 10))) rawRows++;
      if (seenRows.has(k)) continue; seenRows.add(k);
      if (inWindow.has(r.ts.slice(0, 10))) dedupRuns++;
    }
  }
  check(`hook runs = independent de-duplicated recount (snapshot ${snap.kpis.runs}, recount ${dedupRuns}, raw sum ${rawRows})`, Math.abs(snap.kpis.runs - dedupRuns) <= 25, 'diff ' + (snap.kpis.runs - dedupRuns));

  // cold build time (fresh process, warm telemetry cache in %TEMP%)
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(CODE_ROOT, 'lib', 'observatory.js')], { encoding: 'utf8', env: { ...process.env, OBSERVATORY_NO_LOG: '1' }, timeout: 60000 });
  const ms = Date.now() - t0;
  check(`cold snapshot in a fresh process < 5000 ms (took ${ms} ms)`, r.status === 0 && ms < 5000, (r.stderr || '').slice(0, 200));

  // server routes
  const { server } = require(path.join(HERE, 'server.js'));
  await new Promise(res => server.listen(0, '127.0.0.1', res));
  const port = server.address().port;
  const home = await get(port, '/');
  check('GET / → 200 html with the Lapis Lazuli title', home.code === 200 && /text\/html/.test(home.type) && home.body.includes('Lapis Lazuli Observatory'), home.code);
  check('GET /app.js → 200 javascript', (await get(port, '/app.js')).code === 200, '');
  check('GET /styles.css → 200 css', (await get(port, '/styles.css')).code === 200, '');
  const health = await get(port, '/api/health');
  check('GET /api/health → ok', health.code === 200 && JSON.parse(health.body).ok === true, health.body.slice(0, 120));
  const s7 = await get(port, '/api/snapshot?days=7');
  let j7 = null; try { j7 = JSON.parse(s7.body); } catch (_) {}
  check('GET /api/snapshot?days=7 → JSON with a 7-day window', s7.code === 200 && j7 && j7.meta.windowDays === 7 && j7.meta.days.length === 7, s7.code);
  check('snapshot over HTTP has the same component count', j7 && j7.components.length === snap.components.length, j7 && j7.components.length);
  const au = await get(port, '/api/audit');
  let ja = null; try { ja = JSON.parse(au.body); } catch (_) {}
  check('GET /api/audit → the four audit blocks', au.code === 200 && ja && Array.isArray(ja.notWorking) && Array.isArray(ja.rulings), (ja && ja.error) || au.code);
  check('unknown route → 404', (await get(port, '/api/nope')).code === 404, '');
  check('path traversal → 404', (await get(port, '/..%2Fserver.js')).code === 404 && (await get(port, '/%2e%2e%2fREADME.md')).code === 404, '');
  check('non-GET → 405', (await get(port, '/api/health', 'POST')).code === 405, '');
  server.close();

  // findings layer: every finding carries every layer, and nothing non-healthy is left out of one
  const SEVS = ['critical', 'serious', 'warning', 'info'];
  const bad = snap.findings.filter(f => !f.id || !SEVS.includes(f.severity) || !f.title || !f.fact || !Array.isArray(f.evidence) || !f.evidence.length || !f.context || !f.judgement || !f.justification || !f.action || !['miya', 'ruri'].includes(f.decide) || !(f.goals || []).every(g => /^G[1-7]$/.test(g)));
  check(`all ${snap.findings.length} findings carry fact, evidence, context, judgement, justification, action, decider and goals`, bad.length === 0, bad.map(f => f.id).join(', '));
  check('finding ids are unique', new Set(snap.findings.map(f => f.id)).size === snap.findings.length, '');
  const covered = new Set(snap.findings.flatMap(f => f.components || []));
  const uncovered = snap.components.filter(c => c.verdict !== 'healthy' && !covered.has(c.id));
  check(`every non-healthy component (${snap.components.filter(c => c.verdict !== 'healthy').length}) appears in a finding`, uncovered.length === 0, uncovered.slice(0, 5).map(c => c.id + ' [' + c.verdict + ']').join(', '));
  const strayMap = { staleWorktrees: ['worktrees-unsaved-work', 'worktrees-duplicates', 'worktrees-unchecked'], conflictCopies: ['conflict-copies'], looseFiles: ['loose-files'], unreferencedScripts: ['unreferenced-scripts'], evalOnlyPackages: ['eval-only-packages'], pendingOrOrphan: ['root-entries-unruled'] };
  const missingStray = Object.entries(strayMap).filter(([k, ids]) => (snap.strays[k] || []).length && !snap.findings.some(f => ids.includes(f.id)));
  check('every non-empty stray category has a finding', missingStray.length === 0, missingStray.map(x => x[0]).join(', '));
  const disabled = snap.components.filter(c => c.disabled).map(c => c.path);
  check('disabled detection: commit-gate.js is disabled, boot-load-verification.js is not', disabled.includes('.claude/hooks/commit-gate.js') && !disabled.includes('.claude/hooks/boot-load-verification.js'), disabled.join(', '));
  const sps = snap.components.find(c => c.path === 'domain/stop-point-summary');
  check('opt-out marker: domain/stop-point-summary is retired, not unregistered', !sps || sps.verdict === 'retired', sps && sps.verdict);

  // retrieval CLIs: --brief lists every finding, --finding prints one in full, --judge records a note that goes stale when evidence changes
  const cli = (args, env) => spawnSync(process.execPath, [path.join(CODE_ROOT, 'lib', 'observatory.js'), ...args], { encoding: 'utf8', env: { ...process.env, OBSERVATORY_NO_LOG: '1', ...(env || {}) }, timeout: 90000 });
  const br = cli(['--brief']);
  check('--brief exits 0 and names every finding id', br.status === 0 && snap.findings.every(f => br.stdout.includes(f.id)), (br.stderr || '').slice(0, 160));
  const one = snap.findings.slice().sort((a, b) => a.evidence.length - b.evidence.length)[0];
  const fo = cli(['--finding', one.id]);
  check(`--finding ${one.id} prints all ${one.evidence.length} evidence items`, fo.status === 0 && one.evidence.every(e => fo.stdout.includes(e.text)), (fo.stderr || '').slice(0, 160));
  const tmpLedger = path.join(require('os').tmpdir(), 'observatory-eval-judgements-' + process.pid + '.jsonl');
  try { fs.unlinkSync(tmpLedger); } catch (_) {}
  const jr = cli(['--judge', one.id, '--judgement', 'eval judgement', '--justification', 'eval because'], { OBSERVATORY_JUDGEMENTS: tmpLedger });
  const withNote = (() => { process.env.OBSERVATORY_JUDGEMENTS = tmpLedger; delete require.cache[require.resolve(path.join(CODE_ROOT, 'lib', 'observatory.js'))]; const s2 = require(path.join(CODE_ROOT, 'lib', 'observatory.js')).build({ days: 30 }); return s2.findings.find(f => f.id === one.id); })();
  check('--judge records a note that joins its finding, not stale', jr.status === 0 && withNote && withNote.notes.length === 1 && withNote.notes[0].stale === false, (jr.stderr || '') + JSON.stringify(withNote && withNote.notes));
  fs.appendFileSync(tmpLedger, JSON.stringify({ ts: new Date().toISOString(), id: one.id, judgement: 'old', justification: 'old', signature: 'not-the-current-evidence' }) + '\n');
  const s3 = require(path.join(CODE_ROOT, 'lib', 'observatory.js')).findingsFor(JSON.parse(JSON.stringify(snap))).find(f => f.id === one.id);
  check('a note written against different evidence shows as stale', s3 && s3.notes.some(n => n.stale === true), JSON.stringify(s3 && s3.notes));
  const jbad = cli(['--judge', 'no-such-finding', '--judgement', 'x', '--justification', 'y'], { OBSERVATORY_JUDGEMENTS: tmpLedger });
  check('--judge rejects an unknown id with exit 2', jbad.status === 2, jbad.status);
  delete process.env.OBSERVATORY_JUDGEMENTS; try { fs.unlinkSync(tmpLedger); } catch (_) {}

  // Feature grouping: every component lands in exactly one home, a Feature is as healthy as its worst part
  const featureIds = new Set(snap.features.map(f => f.id));
  const homes = new Map();
  const put = (id, where) => homes.set(id, (homes.get(id) || []).concat(where));
  for (const f of snap.features) for (const p of f.parts) put(p.id, f.id);
  for (const x of snap.shared) put(x.id, 'shared'); for (const x of snap.unowned) put(x.id, 'unowned'); for (const id of snap.stores) put(id, 'stores');
  const homeless = snap.components.filter(c => !c.ghost && !homes.has(c.id)).map(c => c.id);
  const twice = [...homes].filter(([, w]) => w.length > 1).map(([id, w]) => id + '→' + w.join('+'));
  check(`every component has exactly one home (${snap.features.length} Features · ${snap.shared.length} shared · ${snap.unowned.length} unowned · ${snap.stores.length} stores)`, homeless.length === 0 && twice.length === 0, homeless.slice(0, 4).concat(twice.slice(0, 4)).join(', '));
  check('partOf agrees with Feature parts', snap.features.every(f => f.parts.every(p => snap.partOf[p.id] === f.id)) && Object.entries(snap.partOf).every(([id, fid]) => featureIds.has(fid) && snap.features.find(f => f.id === fid).parts.some(p => p.id === id)), '');
  const RANK = ['ghost', 'failing', 'unregistered', 'silent', 'gaps', 'healthy', 'retired'];
  const byCid = new Map(snap.components.map(c => [c.id, c]));
  const wrongVerdict = snap.features.filter(f => { const live = f.parts.map(p => byCid.get(p.id)).filter(c => !c.retired && !c.disabled); const want = live.length ? live.map(c => c.verdict).sort((a, b) => RANK.indexOf(a) - RANK.indexOf(b))[0] : 'retired'; return f.verdict !== want; });
  check('every Feature verdict is its worst live part', wrongVerdict.length === 0, wrongVerdict.slice(0, 4).map(f => f.name + '=' + f.verdict).join(', '));
  const unlinked = snap.findings.filter(f => (f.components || []).some(id => snap.partOf[id] && !(f.features || []).includes(snap.partOf[id])));
  check('every finding names the Features its components belong to, and each Feature lists it back', unlinked.length === 0 && snap.features.every(ft => ft.findingIds.every(id => snap.findings.find(f => f.id === id).features.includes(ft.id))), unlinked.map(f => f.id).join(', '));
  check('no Feature is healthy while carrying gaps', snap.features.every(f => f.verdict !== 'healthy' || !f.gaps.length), '');

  // Map: every Feature sits in exactly one department or is reported by the org-unplaced finding; tiers follow the event rule
  const org = snap.org; const inDept = org.departments.flatMap(d => d.features.map(f => f.id));
  check(`Map: ${org.departments.length} departments in ${org.divisions.length} divisions hold ${inDept.length} of ${snap.features.length} Features, the rest are reported`, org.divisions.flatMap(v => v.departments).length === org.departments.length && inDept.length + org.unassigned.length - org.twice.length === snap.features.length && (!org.unassigned.length || snap.findings.some(f => f.id === 'org-unplaced')), `unassigned ${org.unassigned.length}, twice ${org.twice.length}`);
  const ALWAYS = ['SessionStart', 'UserPromptSubmit', 'Stop', 'SubagentStop', 'PreCompact', 'SessionEnd'];
  const badTier = org.departments.flatMap(d => d.features).filter(x => { const f = snap.features.find(y => y.id === x.id); const want = f.layout === 'Protocol' || f.events.some(e => ALWAYS.includes(e)) ? 'senior' : f.events.length ? 'mid' : 'junior'; return x.tier !== want; });
  check('every executive tier follows the event rule (always on, on action, on call)', badTier.length === 0, badTier.slice(0, 4).map(x => x.name + '=' + x.tier).join(', '));

  // UI wiring: 6 areas, a view for every area and section, a glossary and a guide
  const html = fs.readFileSync(path.join(HERE, 'public', 'index.html'), 'utf8'); const app = fs.readFileSync(path.join(HERE, 'public', 'app.js'), 'utf8');
  const navSrc = (app.match(/const NAV = \[([\s\S]*?)\n  \];/) || [])[1] || '';
  const areas = [...navSrc.matchAll(/\{ id: '(\w+)'/g)].map(m => m[1]);
  const leaves = [...navSrc.matchAll(/\{ id: '(\w+)'[^\n]*?(?:subs: \[(.*)\])? \}/g)].flatMap(m => m[2] ? [...m[2].matchAll(/\['(\w+)'/g)].map(s => m[1] + '/' + s[1]) : [m[1]]);
  const viewsSrc = (app.match(/const VIEWS = \{([^}]*)\}/) || [])[1] || '';
  const views = [...viewsSrc.matchAll(/'?([\w/]+)'?: (v[A-Z]\w+)/g)].map(m => [m[1], m[2]]);
  check(`6 areas (${areas.join(', ')}) and ${leaves.length} views, each routed to a function that exists`, areas.length === 6 && leaves.length === 11 && leaves.every(l => views.some(([k]) => k === l)) && views.every(([, fn]) => new RegExp('function ' + fn + '\\(').test(app)), 'leaves ' + leaves.join(',') + ' | views ' + views.map(v => v[0]).join(','));
  check('header carries Glossary and Guide, and the guide markup exists', ['id="glossary"', 'id="guide"', 'id="tour-card"', 'id="tour-next"'].every(s => html.includes(s)), '');
  const tourSrc = (app.match(/const TOUR = \[([\s\S]*?)\n  \];/) || [])[1] || '';
  const tourSteps = tourSrc.split('\n').filter(l => /title: '/.test(l)).length;
  const anchors = [...tourSrc.matchAll(/data-tour="([\w-]+)"/g)].map(m => m[1]);
  const unanchored = anchors.filter(a => !app.replace(tourSrc, '').includes('data-tour="' + a + '"') && !app.includes("tour: '" + a + "'"));
  check(`guide has ${tourSteps} steps; all ${anchors.length} data-tour anchors it points at are rendered by a view`, tourSteps >= 6 && anchors.length >= 5 && unanchored.length === 0, unanchored.join(', '));
  check('no dashboard label says "Feature hook" (a Feature is the whole unit, not a hook type)', !/Feature hook/i.test(app), '');
  check('no CDN or external script/style in the UI', !/(src|href)="https?:\/\//.test(html) && !/https?:\/\//.test(app.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '')), '');

  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
