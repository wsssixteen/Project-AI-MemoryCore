#!/usr/bin/env node
// eval.js — alias for the forge-named eval (knowledge-schema-audit.eval.js) so both naming conventions resolve.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const r = spawnSync(process.execPath, [path.join(__dirname, 'knowledge-schema-audit.eval.js')], { stdio: 'inherit', env: process.env });
process.exit(r.status === null ? 1 : r.status);
