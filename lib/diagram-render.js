#!/usr/bin/env node
/**
 * lib/diagram-render.js — check and render a diagram-design HTML page to a PNG (born 2026-10-27).
 *
 * symptom: 2026-10-27 miya, on the first diagram-design picture of a flow: "Beautiful, that is really
 *          really helpful. I would like to integrate using this diagram into our workflows ... starting
 *          with replacing the current story diagram."
 * goal: every flow or structure explained to miya arrives as a checked picture, not chat box-art.
 * goal_signal: the reply carries a sent PNG whose self-check printed OK.
 * retention: none (writes only the PNG next to the HTML, in the scratchpad).
 * footprint: on-demand: 1 python self-check (~1 s) + 1 headless Edge (~5 s, ~150 MB), both exit.
 * self_audit: exit 1 when the self-check fails or the PNG is missing or under 5 KB after render.
 * state-scoped: no, state-agnostic.
 *
 * CLI: node lib/diagram-render.js <diagram.html> [--out <file.png>] [--width 1280] [--no-check]
 *      prints `DIAGRAM-RENDER: OK <png>` or `DIAGRAM-RENDER: FAIL <why>`.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PLAYWRIGHT = process.env.DIAGRAM_PLAYWRIGHT || 'E:/Dev/scripts/attendance/node_modules/playwright';

// The installed diagram-design skill folder (newest version wins).
function skillDir() {
  const base = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'diagram-design', 'diagram-design');
  try {
    const vers = fs.readdirSync(base).filter(v => fs.existsSync(path.join(base, v, 'skills', 'diagram-design', 'scripts', 'self_check.py')));
    vers.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return vers.length ? path.join(base, vers[vers.length - 1], 'skills', 'diagram-design') : null;
  } catch (_) { return null; }
}

function selfCheck(html) {
  const dir = skillDir();
  if (!dir) return { ok: false, why: 'diagram-design skill not installed (see .claude/auto-memory/project_installed_skills.md)' };
  for (const py of ['python', 'python3', 'py']) {
    const r = spawnSync(py, [path.join(dir, 'scripts', 'self_check.py'), html], { encoding: 'utf8', windowsHide: true });
    if (r.error) continue;
    const out = (r.stdout + r.stderr).trim();
    return r.status === 0 ? { ok: true, out } : { ok: false, why: 'self-check: ' + out.split(/\r?\n/).slice(0, 6).join(' | ') };
  }
  return { ok: false, why: 'no python on PATH for the self-check' };
}

async function render(html, out, width) {
  let chromium;
  try { ({ chromium } = require(PLAYWRIGHT)); } catch (e) { return { ok: false, why: 'playwright not found at ' + PLAYWRIGHT }; }
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 2 });
    await page.goto('file:///' + path.resolve(html).split(path.sep).join('/'));
    await page.waitForTimeout(1200); // web fonts
    const frame = page.locator('.frame');
    if (await frame.count()) await frame.first().screenshot({ path: out });
    else await page.screenshot({ path: out, fullPage: true });
  } finally { await browser.close(); }
  const size = fs.existsSync(out) ? fs.statSync(out).size : 0;
  return size >= 5000 ? { ok: true, size } : { ok: false, why: `PNG missing or too small (${size} bytes)` };
}

async function main(argv) {
  const flag = n => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : null; };
  const html = argv.find(a => !a.startsWith('--') && /\.html?$/i.test(a));
  if (!html || !fs.existsSync(html)) { console.log('usage: node lib/diagram-render.js <diagram.html> [--out <file.png>] [--width 1280] [--no-check]'); return 2; }
  const out = flag('out') || html.replace(/\.html?$/i, '.png');
  if (!argv.includes('--no-check')) {
    const c = selfCheck(html);
    if (!c.ok) { console.log('DIAGRAM-RENDER: FAIL ' + c.why); return 1; }
  }
  const r = await render(html, out, Number(flag('width')) || 1280);
  if (!r.ok) { console.log('DIAGRAM-RENDER: FAIL ' + r.why); return 1; }
  console.log(`DIAGRAM-RENDER: OK ${out} (${Math.round(r.size / 1024)} KB) — now Read the PNG and look before sending`);
  return 0;
}

module.exports = { skillDir, selfCheck };

if (require.main === module) {
  main(process.argv.slice(2)).then(c => process.exit(c), e => { console.log('DIAGRAM-RENDER: FAIL ' + e.message); process.exit(1); });
}
