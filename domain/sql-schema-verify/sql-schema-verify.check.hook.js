/**
 * sql-schema-verify.check.hook.js — Stop hook. BLOCKS an unverified hand-off .sql.
 *
 * Trigger: a .sql file under a Task folder was written or edited this session.
 * Action:  BLOCK unless sql-schema-verify.js check exits 0 for that file — a stamp bound
 *          to the file's CURRENT content hash, proving every table and column was checked
 *          against a live pg_attribute catalog.
 *
 * Replay case (ESOKONGAN #274510, 2026-08-07): a 15-query evidence script reached infra
 * with `proc_inst_id_` on act_ru_deadletter_job / act_ru_job / act_ru_timer_job /
 * act_ru_suspended_job, whose real column is `process_instance_id_`. It died on their
 * first statement. stg1 carried the identical schema and was reachable the whole time.
 *
 * Why blocking and not advisory: convention-check-gate already fires on .sql writes and
 * fired on every draft of that exact file. Advisory did not help, because the gap was not
 * intent — it was that nothing required the check to have actually run. A stamp bound to
 * the content hash cannot be satisfied by a glyph, and re-arms the moment the file changes.
 *
 * Fail-OPEN on any internal error — never block on our own bug.
 * Bypass: [skip-sql-schema-verify: <reason>]
 * Nod: miya 2026-08-07 — "please fix this permanently so that you won't repeat again"
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const LOG = path.resolve(__dirname, 'log.jsonl');
const VERIFIER = path.resolve(__dirname, 'sql-schema-verify.js');
const BYPASS = /\[skip-sql-schema-verify:/i;

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail }) + '\n'); } catch (_) {}
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const transcriptPath = data.transcript_path || '';
    if (!transcriptPath || !fs.existsSync(transcriptPath)) process.exit(0);

    const raw = fs.readFileSync(transcriptPath, 'utf8');
    // current-turn assistant text only (2026-08-21 self-disarm fix)
    if ((function(){ try { return require((process.env.CLAUDE_PROJECT_DIR || require('path').resolve(__dirname, '..', '..')) + '/lib/bypass-scope.js').bypassInCurrentTurn; } catch (_) { return function () { return false; }; } })()(transcriptPath, BYPASS)) { logFire('bypass', 'token present'); process.exit(0); }

    // Every .sql this session touched that lives in a Task folder — the hand-off surface.
    const touched = new Set();
    for (const m of raw.matchAll(/"file_path"\s*:\s*"((?:[^"\\]|\\.)*\.sql)"/gi)) {
      const p = m[1].replace(/\\\\/g, '\\').replace(/\\"/g, '"');
      if (/[\\/]\d+\.\s|Tasks[\\/]/i.test(p)) touched.add(p);
    }
    if (!touched.size) process.exit(0);

    const unverified = [];
    for (const file of touched) {
      if (!fs.existsSync(file)) continue;
      try {
        execFileSync(process.execPath, [VERIFIER, 'check', file], { stdio: 'pipe' });
      } catch (_) {
        unverified.push(file);
      }
    }

    if (!unverified.length) { logFire('pass', [...touched].join(' | ')); process.exit(0); }

    logFire('block', unverified.join(' | '));
    const list = unverified.map(f => `     ${path.basename(f)}`).join('\n');
    console.error(
      `⛔ sql-schema-verify: a hand-off .sql was written this session and NEVER checked against a live catalog.\n` +
      `${list}\n\n` +
      `   Shipping unverified SQL to infra or miya is banned — that is the #274510 failure.\n` +
      `   For each file:\n` +
      `     1. node domain/sql-schema-verify/sql-schema-verify.js emit "<file>"\n` +
      `     2. Run the emitted query via a postgres MCP tool on any environment carrying that schema.\n` +
      `     3. Zero rows returned -> node domain/sql-schema-verify/sql-schema-verify.js stamp "<file>" <env>\n` +
      `        Any rows returned -> fix the script, then start again at step 1.\n\n` +
      `   The stamp binds to the file's content hash, so editing after stamping re-arms this gate.\n` +
      `   Genuinely not applicable (no schema-qualified tables)? [skip-sql-schema-verify: <reason>]`
    );
    process.exit(2);
  } catch (e) {
    logFire('error', String(e && e.message));
    process.exit(0);
  }
});
