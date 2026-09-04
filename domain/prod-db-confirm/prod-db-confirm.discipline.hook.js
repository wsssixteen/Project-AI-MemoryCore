/**
 * prod-db-confirm.discipline.hook.js — PreToolUse hook
 * Power: domain/prod-db-confirm/  (hook-only — no skill, no eval)
 *
 * PURPOSE (per みや 2026-06-29 — granting Ruri PROD read-only via pgEdge):
 *
 * Every call to `mcp__postgres-mlkprod-pg__*` MUST be みや-permissioned.
 * Defence-in-depth on top of pgEdge's server-level read-only role + the
 * narrowed `et_read` DB user:
 *   (1) Forces `permissionDecision: "ask"` so the harness prompts みや
 *       on EVERY PROD touch (even if a settings.local.json `allow` slips in)
 *   (2) Audit-logs every PROD tool call (which tool · args · timestamp)
 *       to `domain/prod-db-confirm/log.jsonl` — searchable trail
 *   (3) Injects a visible `🚨 PROD DB ACCESS` banner so the call is
 *       impossible to miss in the harness UI
 *
 * SCOPE: only `mcp__postgres-mlkprod-pg__*` tools. UAT/FAT/STG/mlit are
 *   auto-allow per the existing settings — they were never gated and the
 *   blast radius is bounded (test/staging data).
 *
 * SAFETY: never blocks of its own accord (returns `permissionDecision: "ask"`
 *   — the harness asks みや). Fail-OPEN on any parse error. No state.
 *
 * Layer choice (/system-design R7): HOOK-ONLY PreToolUse. No skill (no
 *   procedure to invoke); no eval (the test = it intercepts every PROD call,
 *   verifiable by reading log.jsonl).
 * Trigger MOMENT (/system-design R8): PreToolUse — the precise point of need.
 *   Stop-side would log AFTER the call already ran; SessionStart wouldn't
 *   guard mid-session use. PreToolUse on the specific tool-name pattern is
 *   the leanest correct trigger.
 *
 * Created 2026-06-29 per みや: "please build a stophook to only check on my
 * permission" — implemented as PreToolUse permission-ask (the canonical CC
 * primitive for "gate this tool call") plus audit logging.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');

// Tool-name pattern: any tool on a PROD MCP server.
//   postgres-mlkprod-pg — Melaka PROD (pgEdge, read-only et_read role)
//   oracle-prk-prod     — Perak PROD (co-dev; DML CAPABLE — writes commit, so the
//                         WRITE_VERB ask below is a real safety gate, not defence-in-depth)
const PROD_TOOL = /^mcp__(postgres-mlkprod-pg|oracle-prk-prod)__/;
const PROD_META = {
  'postgres-mlkprod-pg': { env: 'Melaka PROD', role: 'et_read (read-only enforced at DB-user level)', host: '172.30.17.104:5444 db=etprdmlk' },
  'oracle-prk-prod': { env: 'Perak PROD', role: 'DML-capable (writes COMMIT — not read-only)', host: 'oracle-prk-prod' },
};

// v1.1 (2026-08-05, per みや): READS no longer prompt.
// The PROD MCP runs every statement in a READ-ONLY transaction as DB user
// `et_read` — a write is structurally impossible through this path, so asking
// on a SELECT bought zero safety and cost みや a click on every single query.
// He hit it repeatedly in one night: "fix this fucking behaviour of asking me
// permission on simply SELECT on prod".
// Audit logging is UNCHANGED — every PROD call still lands in log.jsonl.
// The ask survives only for statements carrying a write verb: if the server
// role is ever widened, the gate is still there.
const WRITE_VERB = /\b(INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|CREATE|GRANT|REVOKE|COPY|MERGE|VACUUM|REINDEX)\b/i;

function logFire(action, payload) {
  try {
    fs.appendFileSync(LOG, JSON.stringify({
      ts: new Date().toISOString(),
      action,
      ...payload,
    }) + '\n');
  } catch (_) {}
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    const toolName = data.tool_name || '';
    if (!PROD_TOOL.test(toolName)) {
      process.exit(0);                                  // not a PROD tool — pass through
    }

    // PROD tool detected — audit log + force harness ask
    const args = data.tool_input || {};
    const previewSql = String(args.query || args.sql || args.table || '').slice(0, 240);

    const isWrite = WRITE_VERB.test(previewSql);

    logFire('prod-tool-intercept', {
      tool: toolName,
      sql_preview: previewSql,
      decision: isWrite ? 'ask' : 'allow',
    });

    const serverKey = (toolName.match(/^mcp__([^_]+(?:-[^_]+)*)__/) || [])[1] || '';
    const meta = PROD_META[serverKey] || { env: 'PROD', role: 'unknown', host: serverKey };

    if (!isWrite) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          permissionDecisionReason: `${meta.env} read — logged, not gated`,
        },
      }));
      process.exit(0);
    }

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: [
          `🚨 ${meta.env} DB WRITE — confirm intent`,
          `   Tool:  ${toolName}`,
          `   Args:  ${previewSql || '(no query/sql/table arg)'}`,
          `   Role:  ${meta.role}`,
          `   Host:  ${meta.host}`,
          '   Audit: domain/prod-db-confirm/log.jsonl',
          '',
          '   Approve only if you intend to WRITE to LIVE PRODUCTION.',
        ].join('\n'),
      },
    }));
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-OPEN
  }
});
