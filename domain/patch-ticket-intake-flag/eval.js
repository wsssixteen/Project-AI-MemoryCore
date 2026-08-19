// eval.js — executed proof for patch-intake.js.
// Lead fixture is the REAL #275501 BA note that the previous session read at intake
// and did NOT act on as a patch ticket (no script prepared, left on hold).
// Run: node eval.js

'use strict';
const { detectPatchRequest, renderPatchIntakeFlag } = require('./patch-intake');

// Verbatim from 0. Brief/History.txt (#275501, Nurul Amirah Nadiah 2026-08-14).
const NOTE_275501 =
    'Hi dev, Before this when ask dev Ridhwan to check for this issue, he said Bandar ' +
    'Berdaftar is missing, this id is from Kaunter, before this, SKM got no checking for ' +
    'Maklumat Tapak Bahan Batuan Yang Diambil, tic Internal Issue #272130, please help to ' +
    'check other information that missing as well for this id because when I simulate at STG, ' +
    'Maklumat Tapak Bahan Batuan Yang Diambil for the id is not complete, got no info for ID ' +
    'Hakmilik and Keluasan Tanah. Please help to patch maklumat that missing in STG first for ' +
    'me to simulate before u patch the maklumat in PROD.';

// The user's own relay of the same ticket (Malay short form).
const RELAY_275501 =
    'tic ralat sbb maklumat tak lengkap, nak minta patch maklumat, Internal Issue (PROD) #275501';

const cases = [
    // [name, text, expectPatch]
    ['#275501 BA History note (the miss)',        NOTE_275501,                              true],
    ['#275501 user relay (Malay)',                RELAY_275501,                             true],
    ['Data Patching tracker phrasing',            'Data patching required for id 3408179',  true],
    ['patch STG first',                           'kindly patch the STG data first please', true],
    ['plain bug — no patch language',             'Papar ralat bila klik pada tugasan di dashboard. Expected: boleh klik.', false],
    ['enhancement request',                       'Please add a new column to the Jadual for luas tanah.', false],
    ['CODE patch, not data (false-positive guard)', 'We will hotfix patch the code in MlkBorang4CeForm and redeploy.', false],
];

let pass = 0;
for (const [name, text, expect] of cases) {
    const { isPatch, signal } = detectPatchRequest(text);
    const ok = isPatch === expect;
    if (ok) pass++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  isPatch=${String(isPatch).padEnd(5)} expect=${String(expect).padEnd(5)} :: ${name}${isPatch ? '  <'+signal+'>' : ''}`);
}

console.log(`\n${pass}/${cases.length} passed`);

console.log('\n--- banner rendered for the #275501 miss ---');
console.log(renderPatchIntakeFlag(NOTE_275501, 'QA-275501'));

if (pass !== cases.length) process.exit(1);
