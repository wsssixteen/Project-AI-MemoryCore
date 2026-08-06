/**
 * eval.js — behavioural eval for test-scenario-login-gate
 *
 * Replay case (2026-08-05, QA-273919): a full Test Scenario was emitted — env,
 * file, two numbered steps — with NO login. みや: "You failed to give me a
 * username, please fix this for AWAM you kept failing this."
 *
 * The officer-side rule ("TEST SCENARIO = LIVE TASK STATE, give the LOGIN") is
 * driven by a tugasan query. AWAM has no tugasan, so that path never fires and
 * nothing substituted for it. This gate is login-shaped, not tugasan-shaped, so
 * it covers both sides.
 *
 * Run: node domain/test-scenario-login-gate/eval.js
 */
const { execFileSync } = require('child_process');
const path = require('path');

const HOOK = path.join(__dirname, 'test-scenario-login-gate.check.hook.js');

function run(text) {
    const payload = JSON.stringify({ last_assistant_message: text, stop_hook_active: false });
    try {
        execFileSync(process.execPath, [HOOK], { input: payload, encoding: 'utf-8' });
        return { blocked: false, out: '' };
    } catch (e) {
        return { blocked: true, out: (e.stderr || '') + (e.stdout || '') };
    }
}

const PAD = ' Extra context so the reply clears the minimum length threshold. '.repeat(6);

const CASES = [
    {
        name: 'Test Scenario WITHOUT a login → BLOCK',
        text: `## Test Scenario\n| Env | AWAM MLKSTG |\n| File | Form.xhtml:41 |\nTest 1: open PPJK, panel must read X.\nTest 2: open BPRZ, panel unchanged.${PAD}`,
        expect: true,
    },
    {
        name: 'Test Scenario WITH an email login → pass',
        text: `## Test Scenario\n| Env | AWAM MLKSTG |\n| Login | aizatmaziz@gmail.com |\nTest 1: open PPJK, panel must read X.${PAD}`,
        expect: false,
    },
    {
        name: 'Test Scenario with a gov login → pass',
        text: `## Test Scenario\n| Env | MLKSTG |\n| Login | norlina@melaka.gov.my |\nDo: klik Kemaskini, expect the spinner to clear.${PAD}`,
        expect: false,
    },
    {
        name: 'Not a hand-back (plain analysis) → no fire',
        text: `The document is 51 MB because two identical PNGs are embedded and never referenced by any part of the package.${PAD}`,
        expect: false,
    },
    {
        name: 'Bypass token honoured',
        text: `## Test Scenario\n| Env | MLKSTG |\nTest 1: open the screen.\n[skip-login-gate: no user account needed, public unauthenticated page]${PAD}`,
        expect: false,
    },
    {
        name: 'Short reply → no fire',
        text: 'test scenario: open it.',
        expect: false,
    },
];

let pass = 0;
for (const c of CASES) {
    const got = run(c.text).blocked;
    const ok = got === c.expect;
    if (ok) pass++;
    console.log(`${ok ? 'PASS' : 'FAIL'} — ${c.name}${ok ? '' : ` (expected blocked=${c.expect}, got ${got})`}`);
}
console.log(`\n${pass}/${CASES.length} passed`);
process.exit(pass === CASES.length ? 0 : 1);
