#!/usr/bin/env node
/**
 * unmerged-release-boot.js — SessionStart surfacer (built 2026-08-19, baseline-1.3.5 incident).
 *
 * THE RULE IT ENFORCES (miya, verbatim intent): "A passed baseline means merging the fixes
 * into mlk/master." A release left un-merged is a stranded release — the next baseline
 * branches off a stale master and silently DROPS its fixes (1.3.4: 5 tickets + common 1.1.17
 * were dropped; the resulting 1.3.5 regressed PROD).
 *
 * Two checks, both from GIT TRUTH (local refs — no fetch, boot stays fast; the stale-master
 * gate in release-prep.js re-checks against a fresh fetch at the next branch anyway):
 *   1. Every origin/mlk/release/<ver> branch must be an ancestor of origin/mlk/master.
 *   2. Every state/release-<ver>.json with a non-terminal phase is surfaced.
 * Advisory (never blocks boot) — the BLOCKING twin is assertMasterReflectsPrevRelease in
 * release-prep.js `branch`.
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = 'E:\\Projects\\Melaka\\etanah-pelupusan';
const STATE_DIR = path.join(__dirname, 'state');

function git(args) {
  const r = spawnSync('git', ['-C', REPO, ...args], { encoding: 'utf8' });
  return { ok: r.status === 0, out: (r.stdout || '').trim() };
}

function main() {
  if (!fs.existsSync(path.join(REPO, '.git'))) return; // repo absent on this machine — silent
  const branches = git(['branch', '-r', '--format=%(refname:short)']);
  if (!branches.ok) return;
  const releases = branches.out.split('\n').map(s => s.trim())
    .filter(b => /^origin\/mlk\/release\/\d+\.\d+\.\d+$/.test(b));
  const unmerged = [];
  for (const b of releases) {
    const anc = spawnSync('git', ['-C', REPO, 'merge-base', '--is-ancestor', b, 'origin/mlk/master'], { encoding: 'utf8' });
    if (anc.status !== 0) unmerged.push(b);
  }
  const stale = [];
  if (fs.existsSync(STATE_DIR)) {
    for (const f of fs.readdirSync(STATE_DIR).filter(f => /^release-.*\.json$/.test(f))) {
      try {
        const st = JSON.parse(fs.readFileSync(path.join(STATE_DIR, f), 'utf8'));
        if (st.phase && st.phase !== 'merged-to-master') stale.push(`${st.release} (phase=${st.phase})`);
      } catch (e) { /* unreadable state — skip */ }
    }
  }
  if (!unmerged.length && !stale.length) return; // all clean — silent
  const lines = ['🚨 UNMERGED RELEASE(S) — a passed baseline MUST end merged into mlk/master:'];
  for (const b of unmerged) lines.push(`   ${b} is NOT in origin/mlk/master — its fixes are STRANDED (the 1.3.4 failure class).`);
  for (const s of stale) lines.push(`   state ${s} — release pipeline never reached merged-to-master.`);
  lines.push('   Fix: node domain/release-mlk-plp/release-prep.js merge-to-master --release <ver> --ba-approved (after BA pass)');
  lines.push('   (last verified against local origin/* refs — run git fetch for absolute truth)');
  console.log(lines.join('\n'));
}
main();
