#!/usr/bin/env node
// eval.js — the one eval of the protime-plan Feature (the scheduler AND the /protime-plan skill).
// The fixtures live in protime-plan.eval.js; this file is the name the skill gate expects.
'use strict';
const { spawnSync } = require('child_process');
const r = spawnSync(process.execPath, [require('path').join(__dirname, 'protime-plan.eval.js')], { stdio: 'inherit' });
process.exit(r.status === null ? 1 : r.status);
