#!/usr/bin/env node
/**
 * redmine-recon.js — Baseline Phase-A evidence gatherer (deterministic, mechanical).
 *
 * WHY (2026-07-16, みや): Phase A was PROSE ("read the whole ticket") and I did it ad-hoc —
 * so I missed both of the failure modes みや predicted, on the SAME release:
 *   · #269802 carried attachment "#269802 sql.txt" — the fix is a SQL PATCH. Git can never
 *     show it. I called it "no branch → exclude?".
 *   · #270952 had relations → #270253, whose journal says "use common 1.0.129-MLK onward";
 *     release/1.0.9 ALREADY carries "common version increase to: 1.0.129-MLK". It was IN the
 *     release the whole time. I called it "no branch → maybe DB patch".
 * A git-only check is structurally blind to SQL fixes, common-version fixes, and fixes that
 * live under a RELATED ticket. This script reads every evidence channel Redmine exposes and
 * classifies each ticket, so the gap is surfaced as a table みや can act on — never guessed at.
 *
 * USAGE:
 *   node redmine-recon.js --tickets 269802,269939,270952,270825 [--repo <path>] [--release <ver>]
 *   node redmine-recon.js --tickets 269802 --json          # machine-readable
 *
 * EVIDENCE CHANNELS (all read, never filtered):
 *   description · EVERY journal note (full text) · attachments (filenames + .sql/.txt bodies)
 *   · relations · parent/children · fixed_version · custom fields (incl. Release Notes)
 *   · changesets (⚠️ empty on this Redmine — repo not linked; git side is the only commit truth)
 *   · git ls-remote for the tracker-derived branch + `git log --grep` for an unlabelled commit
 *   · release-branch scan for a "common version increase to: <ver>-MLK" commit
 *
 * VERDICTS (per ticket):
 *   CODE-BRANCH   → branch exists on origin → merge it (normal path)
 *   SQL-PATCH     → ⚠️ .sql attachment / SQL talk → git CANNOT carry this; needs DB delivery
 *   COMMON-VER    → fix shipped via etanah-common <ver>-MLK → verify the bump commit is on the release
 *   VIA-RELATED   → evidence lives on a related/parent ticket → follow that ticket
 *   NO-EVIDENCE   → 🚨 nothing anywhere → BA-Q row: ask before releasing
 *
 * Endpoint/key are read from redmine.local.json (GITIGNORED) — never hardcoded here.
 * Read-only: GETs only. Exports classify() so the eval tests it with zero network.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawnSync } = require('child_process');

const DEFAULT_REPO = 'E:\\Projects\\Melaka\\etanah-pelupusan';
const TRACKER_BRANCH = {
  'qa': 'mlk/qa', 'internal issue': 'mlk/internal-issue', 'internal': 'mlk/internal',
  'esokongan': 'mlk/esokongan', 'cr': 'mlk/cr', 'cr - after go live': 'mlk/cr',
  'requirement': 'mlk/requirement', 'training': 'mlk/internal', 'development': 'mlk/development',
};
// SQL evidence: an attachment that IS a script, or a journal/desc that talks about running one.
const SQL_FILE = /\.(sql|txt)$/i;
// NOTE: the UPDATE arm allows an optional table ALIAS — real scripts read
// "UPDATE ind_tgsn it SET ..." (alias `it`). The alias-less form /update\s+\w+\s+set/
// silently missed #269802's sql.txt on 2026-07-16; that false-negative is why this
// pattern is pinned by eval fixture C2.
const SQL_BODY = /\b(alter\s+table|update\s+[\w.]+(\s+\w+)?\s+set\b|insert\s+into|delete\s+from|create\s+(table|or\s+replace)|merge\s+into|commit\s*;)/i;
const SQL_TALK = /\b(sql|patch\s*script|db\s*script|script\s*db|run\s+the\s+script|jalankan\s+script)\b/i;
const COMMON_VER = /common\s*\*?\s*(\d+\.\d+\.\d+[\w.-]*-MLK)/i;
const TICKET_REF = /#(\d{5,6})\b/g;

function cfg() {
  const p = path.join(__dirname, 'redmine.local.json');
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {
    console.error(`⛔ missing ${p} — copy redmine.local.json.example and fill it (GITIGNORED).`);
    process.exit(1);
  }
}
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) { out[k] = argv[i + 1]; i++; } else out[k] = true;
    } else out._.push(argv[i]);
  }
  return out;
}
function getJson(c, p) {
  return new Promise((res, rej) => {
    http.get({ host: c.host, port: c.port || 80, path: p, headers: { 'X-Redmine-API-Key': c.apiKey } }, r => {
      let b = ''; r.on('data', d => b += d);
      r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(new Error(`HTTP ${r.statusCode} on ${p}: ${b.slice(0, 120)}`)); } });
    }).on('error', rej);
  });
}
function getText(c, url) {
  return new Promise((res) => {
    const p = url.replace(/^https?:\/\/[^/]+/, '');
    http.get({ host: c.host, port: c.port || 80, path: p, headers: { 'X-Redmine-API-Key': c.apiKey } }, r => {
      let b = ''; r.on('data', d => b += d); r.on('end', () => res(b));
    }).on('error', () => res(''));
  });
}
function git(repo, args) {
  const r = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  return r.status === 0 ? (r.stdout || '').trim() : '';
}

/**
 * classify(ev) — PURE. ev = evidence bundle; returns {verdict, action, detail}.
 * Order matters: branch is the normal path; SQL is the loudest red flag; then common-ver;
 * then related; then nothing. A ticket can carry SQL *and* a branch — SQL still surfaces
 * (that is the whole point: a code merge does not carry the DB half).
 */
function classify(ev) {
  const flags = [];
  if (ev.sqlAttachments && ev.sqlAttachments.length) flags.push(`sql-file: ${ev.sqlAttachments.join(', ')}`);
  else if (ev.sqlTalk) flags.push('sql mentioned in ticket text');
  const hasSql = flags.length > 0;

  // sheetEntry = "goes in みや's Google Sheet SQL field", NOT a question to answer.
  // askBa = a genuine unknown that blocks the release until みや/BA answers.
  if (ev.branch && hasSql) {
    return { verdict: 'CODE+SQL', action: `merge ${ev.branch} AND deliver the SQL separately`, detail: flags.join(' · '), askBa: false, sheetEntry: true };
  }
  if (ev.branch) {
    return { verdict: 'CODE-BRANCH', action: `merge ${ev.branch}`, detail: 'branch on origin', askBa: false, sheetEntry: false };
  }
  if (hasSql) {
    return { verdict: 'SQL-PATCH', action: 'NOT a git merge — SQL must be run on the target DB', detail: flags.join(' · '), askBa: false, sheetEntry: true };
  }
  if (ev.commonVersion) {
    const onRelease = ev.commonBumpOnRelease
      ? `common bump ALREADY on release (${ev.commonBumpOnRelease})`
      : 'common bump NOT found on release branch';
    return {
      verdict: 'COMMON-VER', action: ev.commonBumpOnRelease ? 'nothing to merge — already shipped via common' : `ensure common ${ev.commonVersion} bump lands on the release`,
      detail: `needs common ${ev.commonVersion} · ${onRelease}`, askBa: !ev.commonBumpOnRelease,
    };
  }
  if (ev.related && ev.related.length) {
    return { verdict: 'VIA-RELATED', action: `follow related ticket(s) ${ev.related.join(', ')}`, detail: 'no own branch; evidence points elsewhere', askBa: true };
  }
  if (ev.unlabelledCommit) {
    return { verdict: 'CODE-BRANCH', action: `merge via commit ${ev.unlabelledCommit}`, detail: 'commit found by git log --grep (no branch)', askBa: true };
  }
  return { verdict: 'NO-EVIDENCE', action: 'ASK BA before releasing', detail: 'no branch · no commit · no SQL · no common-ver · no relation', askBa: true };
}

async function gather(c, id, repo, releaseBranch, followed) {
  const { issue } = await getJson(c, `/redmine/issues/${id}.json?include=journals,attachments,relations,changesets,children`);
  const tracker = (issue.tracker && issue.tracker.name || '').toLowerCase();
  const prefix = TRACKER_BRANCH[tracker];
  const allText = [issue.description || '', ...(issue.journals || []).map(j => j.notes || '')].join('\n');

  // attachments: filename signal + body signal for small .sql/.txt
  const sqlAttachments = [];
  for (const a of issue.attachments || []) {
    if (!SQL_FILE.test(a.filename)) continue;
    if (/\.sql$/i.test(a.filename)) { sqlAttachments.push(a.filename); continue; }
    const body = await getText(c, a.content_url || '');
    if (SQL_BODY.test(body)) sqlAttachments.push(a.filename);
  }

  // branch probe (only if the tracker maps to a known prefix)
  let branch = '';
  if (prefix) {
    for (const cand of [`${prefix}/${id}`, `${prefix}/${id}v2`, `${prefix}/${id}v3`]) {
      if (git(repo, ['ls-remote', '--heads', 'origin', cand])) branch = cand; // last match wins => latest rework
    }
  }
  const unlabelled = !branch ? (git(repo, ['log', '--all', '--grep', String(id), '--format=%h', '-1']) || '') : '';

  const related = (issue.relations || []).map(r => (r.issue_id === issue.id ? r.issue_to_id : r.issue_id));
  if (issue.parent) related.push(issue.parent.id);

  // ONE-HOP FOLLOW: the fix's evidence often lives on the RELATED ticket, not this one.
  // #270952 (2026-07-16) had zero own evidence; its relation #270253 carried
  // "Please use common 1.0.129-MLK onward" — the actual fix. Scanning only the ticket's own
  // text reports NO-EVIDENCE for a ticket that already shipped. Depth is 1 by design (no cycles).
  let relatedText = '';
  const relatedEvidence = [];
  if (!followed) {
    for (const rid of related) {
      try {
        const sub = await getJson(c, `/redmine/issues/${rid}.json?include=journals,attachments`);
        const si = sub.issue;
        const stext = [si.description || '', ...(si.journals || []).map(j => j.notes || '')].join('\n');
        relatedText += '\n' + stext;
        for (const at of si.attachments || []) {
          if (!SQL_FILE.test(at.filename)) continue;
          if (/\.sql$/i.test(at.filename)) { relatedEvidence.push(`#${rid}:${at.filename}`); continue; }
          const body = await getText(c, at.content_url || '');
          if (SQL_BODY.test(body)) relatedEvidence.push(`#${rid}:${at.filename}`);
        }
      } catch (e) { /* related unreadable — the ask-BA row still surfaces it */ }
    }
  }

  const cv = COMMON_VER.exec(allText) || COMMON_VER.exec(relatedText);
  const commonVersion = cv ? cv[1] : '';
  let commonBumpOnRelease = '';
  if (commonVersion && releaseBranch) {
    const hit = git(repo, ['log', releaseBranch, '--grep', commonVersion, '--format=%h %s', '-1']);
    if (hit) commonBumpOnRelease = hit;
  }
  const mentioned = [...new Set((allText.match(TICKET_REF) || []).map(s => s.slice(1)))]
    .filter(n => n !== String(id) && !related.includes(Number(n)));

  return {
    id, subject: issue.subject, tracker: issue.tracker.name, status: issue.status.name,
    assignee: (issue.assigned_to || {}).name || '-', fixedVersion: (issue.fixed_version || {}).name || '-',
    branch, unlabelledCommit: unlabelled,
    sqlAttachments: [...sqlAttachments, ...relatedEvidence],
    sqlTalk: SQL_TALK.test(allText),
    commonVersion, commonBumpOnRelease, related, mentioned,
    attachments: (issue.attachments || []).map(a => a.filename),
    changesetsLinked: (issue.changesets || []).length > 0,
  };
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.tickets) { console.error('usage: redmine-recon.js --tickets 1,2,3 [--repo <p>] [--release <ver>] [--json]'); process.exit(1); }
  const c = cfg();
  const repo = a.repo || DEFAULT_REPO;
  const releaseBranch = a.release ? `origin/mlk/release/${a.release}` : '';
  const ids = String(a.tickets).split(',').map(s => s.trim()).filter(Boolean);

  const rows = [];
  for (const id of ids) {
    try {
      const ev = await gather(c, id, repo, releaseBranch);
      rows.push({ ...ev, ...classify(ev) });
    } catch (e) {
      rows.push({ id, subject: '(fetch failed)', verdict: 'ERROR', action: e.message.slice(0, 80), askBa: true, detail: '', related: [], mentioned: [], sqlAttachments: [] });
    }
  }

  if (a.json) { console.log(JSON.stringify(rows, null, 2)); return; }

  console.log('\n## Baseline Phase-A — Redmine evidence recon\n');
  console.log('| # | Tracker | Verdict | Evidence | Action |');
  console.log('|---|---|---|---|---|');
  for (const r of rows) {
    const icon = { 'CODE-BRANCH': '✓', 'CODE+SQL': '⚠️', 'SQL-PATCH': '⚠️', 'COMMON-VER': 'ℹ️', 'VIA-RELATED': 'ℹ️', 'NO-EVIDENCE': '🚨', 'ERROR': '🚨' }[r.verdict] || '?';
    console.log(`| #${r.id} | ${r.tracker || '-'} | ${icon} ${r.verdict} | ${(r.detail || '').replace(/\|/g, '/')} | ${(r.action || '').replace(/\|/g, '/')} |`);
  }

  // SQL scripts → みや's Google Sheet "Developer section" line. He only needs ticket + filename;
  // he writes it up himself (みや 2026-07-16: "we only need to mention the ticket name & the
  // file name... you only need to notify if there are scripts in the ticket").
  // Sheet field format: `SQL name with ticket number:  #269802, #269802 sql.txt`
  const sqlRows = rows.filter(r => r.sqlAttachments && r.sqlAttachments.length);
  if (sqlRows.length) {
    console.log('\n## 📄 SQL scripts — for the Google Sheet\n');
    console.log('| Ticket | SQL file |');
    console.log('|---|---|');
    for (const r of sqlRows) for (const f of r.sqlAttachments) console.log(`| #${r.id} | ${f} |`);
    const line = sqlRows.flatMap(r => r.sqlAttachments.map(f => `#${r.id}, ${f}`)).join(' · ');
    console.log(`\nSheet line → \`SQL name with ticket number:  ${line}\``);
  } else {
    console.log('\n## 📄 SQL scripts — for the Google Sheet\n\n_None in this release — leave the sheet\'s SQL field empty._');
  }

  // Genuine questions only. SQL presence is NOT a question — it is a sheet entry (above).
  const asks = rows.filter(r => r.askBa);
  if (asks.length) {
    console.log('\n## 🛑 Ask BA / みや before releasing\n');
    console.log('| # | Subject | What to ask |');
    console.log('|---|---|---|');
    for (const r of asks) {
      const q = r.verdict === 'COMMON-VER' ? `Fix lives in etanah-common ${r.commonVersion} — that bump is NOT on the release branch; confirm it lands.`
        : r.verdict === 'VIA-RELATED' ? `No own branch; related to ${r.related.join(', ')} — is it covered by that ticket, or was a branch never pushed?`
        : r.verdict === 'CODE-BRANCH' ? 'Fix found only as an unlabelled commit (no branch) — confirm it is the intended fix.'
        : r.verdict === 'ERROR' ? 'Redmine fetch failed — check the ticket manually.'
        : 'No fix evidence ANYWHERE (no branch/commit/SQL/common/relation) — was this fixed without git+Redmine, or listed by mistake?';
      console.log(`| #${r.id} | ${(r.subject || '').replace(/\|/g, '/').slice(0, 60)} | ${q} |`);
    }
  }
  console.log('\n_Blind spot: this Redmine exposes no changesets (repository not linked) — commit truth comes from the git probes above, never from Redmine._');
}

module.exports = { classify, SQL_BODY, COMMON_VER, TRACKER_BRANCH };
if (require.main === module) main().catch(e => { console.error('⛔ ' + e.message); process.exit(1); });
