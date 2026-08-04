/**
 * eval.js — behavioural eval for grep-rubric-gate.js v1.1 (zero-match advisory).
 *
 * Runs the real hook as a child process. Every tool_response below is the SHAPE
 * CAPTURED LIVE from the harness on 2026-08-05, not an invented string — the first
 * draft of this eval used display text and passed 11/11 against a hook that could
 * never fire. Asserts on
 * stdout. Red path included: a grep that FOUND things must stay silent, or the
 * advisory becomes noise and gets ignored — which is how a gate dies.
 *
 *   node domain/grep-zero-match/eval.js
 */
const { execFileSync } = require('child_process');
const path = require('path');

const HOOK = path.join(__dirname, '..', '..', '.claude', 'hooks', 'grep-rubric-gate.js');

function run(payload) {
  try {
    return execFileSync('node', [HOOK], { input: JSON.stringify(payload), encoding: 'utf-8' });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

const ZERO = /ZERO matches/;
const UNSCOPED = /unscoped content-mode grep/;

const cases = [
  {
    name: 'zero matches (files_with_matches) → advisory fires',
    payload: { tool_input: { pattern: 'setUrusanCode\\(' }, tool_response: { mode: 'files_with_matches', filenames: [], numFiles: 0, totalFiles: 0 } },
    expect: out => ZERO.test(out),
  },
  {
    name: 'zero matches (content mode) → advisory fires',
    payload: {
      tool_input: { pattern: 'receiveUserTask', output_mode: 'content', path: 'src' },
      tool_response: { mode: 'content', numFiles: 0, filenames: [], content: '', numLines: 0, totalLines: 0 },
    },
    expect: out => ZERO.test(out),
  },
  {
    name: 'the offending pattern is echoed back',
    payload: { tool_input: { pattern: 'setUrusanCode\\(' }, tool_response: { mode: 'files_with_matches', filenames: [], numFiles: 0, totalFiles: 0 } },
    expect: out => out.includes('setUrusanCode'),
  },
  {
    name: 'names the case-sensitivity trap',
    payload: { tool_input: { pattern: 'x' }, tool_response: { mode: 'files_with_matches', filenames: [], numFiles: 0, totalFiles: 0 } },
    expect: out => /case \(-i\)/.test(out),
  },
  {
    name: 'names the HTML-escaping trap',
    payload: { tool_input: { pattern: 'x' }, tool_response: { mode: 'files_with_matches', filenames: [], numFiles: 0, totalFiles: 0 } },
    expect: out => /HTML-escaped/.test(out),
  },
  {
    name: 'RED PATH — grep WITH results stays silent about zero-match',
    payload: {
      tool_input: { pattern: 'foo', path: 'src' },
      tool_response: 'src/a.js\nsrc/b.js',
    },
    expect: out => !ZERO.test(out),
  },
  {
    name: 'emits the hookSpecificOutput envelope (bare stdout never reaches the model)',
    payload: { tool_input: { pattern: 'x' }, tool_response: { mode: 'files_with_matches', filenames: [], numFiles: 0, totalFiles: 0 } },
    expect: out => {
      try {
        const j = JSON.parse(out);
        return j.hookSpecificOutput && j.hookSpecificOutput.hookEventName === 'PostToolUse'
          && /ZERO matches/.test(j.hookSpecificOutput.additionalContext);
      } catch { return false; }
    },
  },
  {
    name: 'RED PATH — a narrowed content grep with hits emits nothing at all',
    payload: {
      tool_input: { pattern: 'foo', output_mode: 'content', glob: '*.js' },
      tool_response: { mode: 'content', numFiles: 1, filenames: ['src/a.js'], content: 'src/a.js:12: foo()', numLines: 1, totalLines: 1 },
    },
    expect: out => out.trim() === '',
  },
  {
    name: 'v1.0 behaviour preserved — unscoped content grep still advised',
    payload: { tool_input: { pattern: 'foo', output_mode: 'content' }, tool_response: { mode: 'content', numFiles: 1, filenames: ['a.js'], content: 'a.js:1: foo', numLines: 1, totalLines: 1 } },
    expect: out => UNSCOPED.test(out),
  },
  {
    name: 'both advisories can fire together (unscoped AND zero matches)',
    payload: { tool_input: { pattern: 'foo', output_mode: 'content' }, tool_response: { mode: 'content', numFiles: 0, filenames: [], content: '', numLines: 0, totalLines: 0 } },
    expect: out => ZERO.test(out) && UNSCOPED.test(out),
  },
  {
    name: 'fail-open — malformed stdin does not throw',
    payload: null,
    expect: out => !/error/i.test(out),
    raw: 'not json at all',
  },
];

let pass = 0;
for (const c of cases) {
  let out;
  if (c.raw !== undefined) {
    try {
      out = execFileSync('node', [HOOK], { input: c.raw, encoding: 'utf-8' });
    } catch (e) {
      out = (e.stdout || '') + (e.stderr || '');
    }
  } else {
    out = run(c.payload);
  }
  const ok = c.expect(out);
  if (ok) pass++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${c.name}`);
  if (!ok) console.log(`        got: ${JSON.stringify(out.slice(0, 200))}`);
}
console.log(`\n${pass} pass / ${cases.length - pass} fail`);
process.exit(pass === cases.length ? 0 : 1);
