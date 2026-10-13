#!/usr/bin/env node
// tool-registry.eval.js — fixtures for lib/tool-registry.js. Every fixture runs in a temp root; the real
// registry is read once (F24) with homes unchecked, because a worktree lacks the untracked folders.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { main } = require('./tool-registry.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tool-registry-eval-'));
function mk(rel, text) { const p = path.join(tmp, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text === undefined ? 'x' : text); return p; }
mk('lib/a.js'); mk('lib/b.js');
mk('projects/coding-projects/active/etanah-knowledge/melaka/index.md');
mk('projects/coding-projects/active/etanah-knowledge/perak/other.md');

const GROUPS = { knowledge: 'k', code: 'c', system: 's' };
const tool = (o) => Object.assign({ id: 'a-tool', answers: 'q', call: 'c', home: 'lib/a.js', groups: ['code'], state_scope: 'none', footprint: 'none', usage: { sessions: 12, last: '2026-10-01' }, status: 'live' }, o || {});
let n = 0;
function reg(tools, groups) { const f = path.join(tmp, 'reg-' + (++n) + '.json'); fs.writeFileSync(f, typeof tools === 'string' ? tools : JSON.stringify({ groups: groups || GROUPS, tools })); return f; }
function run(args) { return main(args.concat(['--root', tmp, '--no-log'])); }
function chk(file, extra) { return run(['check', '--file', file].concat(extra || [])); }

const results = [];
function t(name, pass, detail) { results.push(pass); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (pass ? '' : '  -> ' + detail)); }
const has = (r, re) => r.out.some(l => re.test(l));

let r;
r = chk(reg([tool()]));                                                    t('F1 a valid registry passes with 0 problems', r.code === 0 && has(r, /1 rows · 0 problem/), r.out.join(' | '));
r = chk(reg('{ not json'));                                                t('F2 broken JSON is one problem, no crash', r.code === 1 && has(r, /not valid JSON/), r.out.join(' | '));
r = chk(path.join(tmp, 'absent.json'));                                    t('F3 a missing file is a problem', r.code === 1 && has(r, /not found/), r.out.join(' | '));
r = chk(reg(JSON.stringify({ groups: GROUPS, tools: {} })));               t('F4 "tools" that is not a list is a problem', r.code === 1 && has(r, /not a list/), r.out.join(' | '));
r = chk(reg([]));                                                          t('F5 an empty list is a problem', r.code === 1 && has(r, /is empty/), r.out.join(' | '));
r = chk(reg([tool({ answers: '' })]));                                     t('F6 a missing key is named', r.code === 1 && has(r, /missing "answers"/), r.out.join(' | '));
r = chk(reg([tool(), tool()]));                                            t('F7 the same id twice is a problem', r.code === 1 && has(r, /id used twice/), r.out.join(' | '));
r = chk(reg([tool({ groups: ['nope'] })]));                                t('F8 an unknown group is a problem', r.code === 1 && has(r, /unknown group "nope"/), r.out.join(' | '));
r = chk(reg([tool({ groups: [] })]));                                      t('F9 an empty group list is a problem', r.code === 1 && has(r, /non-empty list/), r.out.join(' | '));
r = chk(reg([tool({ status: 'fine' })]));                                  t('F10 a status outside live / rare / unused is a problem', r.code === 1 && has(r, /is not one of/), r.out.join(' | '));
r = chk(reg([tool({ usage: { sessions: 0, last: '' } })]));                t('F11 status "live" with 0 sessions is a mismatch', r.code === 1 && has(r, /should be "unused"/), r.out.join(' | '));
r = chk(reg([tool({ usage: { sessions: -1, last: '' } })]));               t('F12 a negative session count is a problem', r.code === 1 && has(r, /whole number/), r.out.join(' | '));
r = chk(reg([tool({ usage: { sessions: '12', last: '2026-10-01' } })]));   t('F13 a session count written as text is a problem', r.code === 1 && has(r, /whole number/), r.out.join(' | '));
r = chk(reg([tool({ home: 'lib/gone.js' })]));                             t('F14 a repo home that is not on disk is a problem', r.code === 1 && has(r, /home not found on disk: lib\/gone\.js/), r.out.join(' | '));
r = chk(reg([tool({ home: 'built in' })]));                                t('F15 a home that is a plain name is not looked up', r.code === 0, r.out.join(' | '));
r = chk(reg([tool({ home: 'projects/coding-projects/active/etanah-knowledge/<state>/index.md' })]));
                                                                           t('F16 <state> passes when one state folder holds the file', r.code === 0, r.out.join(' | '));
r = chk(reg([tool({ home: 'projects/coding-projects/active/etanah-knowledge/<state>/missing.md' })]));
                                                                           t('F17 <state> fails when no state folder holds the file', r.code === 1 && has(r, /home not found/), r.out.join(' | '));
r = chk(reg([tool({ home: 'lib/a.js + lib/gone.js' })]));                  t('F18 a two-part home fails when one part is missing', r.code === 1 && has(r, /lib\/gone\.js/), r.out.join(' | '));
r = chk(reg([tool({ home: 'projects/coding-projects/active/etanah-codemap/features.json' })]));
                                                                           t('F19 a codemap home is refused (outside project, not a Tool)', r.code === 1 && has(r, /outside project/), r.out.join(' | '));
r = chk(reg([tool({ home: 'etanah_atlas/' })]));                           t('F20 an Atlas home is refused', r.code === 1 && has(r, /outside project/), r.out.join(' | '));
r = chk(reg([tool({ home: '../outside/x.js' })]));                         t('F21 a home that climbs out of the repo is refused', r.code === 1 && has(r, /inside the repo/), r.out.join(' | '));
const two = reg([tool({ id: 'rare-one', usage: { sessions: 2, last: '2026-09-01' }, status: 'rare' }), tool({ id: 'live-one' }), tool({ id: 'dead-one', usage: { sessions: 0, last: '' }, status: 'unused' }), tool({ id: 'other', groups: ['system'] })]);
r = run(['for', 'nope', '--file', two]);                                   t('F22 "for" with an unknown group exits 1 and names the groups', r.code === 1 && has(r, /unknown group "nope"\. Groups: knowledge · code · system/), r.out.join(' | '));
r = run(['for', 'code', '--file', two]);                                   t('F23 "for" lists live, then rare, then unused, and only that group', r.code === 0 && r.out.length === 3 && /live-one/.test(r.out[0]) && /rare-one/.test(r.out[1]) && /dead-one/.test(r.out[2]), r.out.join(' | '));
r = main(['check', '--file', path.resolve(__dirname, '..', 'system', 'tools.json'), '--root', path.resolve(__dirname, '..'), '--no-homes', '--no-log']);
                                                                           t('F24 the real system/tools.json passes (homes not checked here)', r.code === 0, r.out.slice(0, 5).join(' | '));
const big = []; for (let i = 0; i < 5000; i++) big.push(tool({ id: 'tool-' + i }));
const t0 = Date.now(); r = chk(reg(big));                                  t('F25 5,000 rows finish in under 5 seconds', r.code === 0 && Date.now() - t0 < 5000, (Date.now() - t0) + ' ms · ' + r.out.slice(-1));
const bom = path.join(tmp, 'bom.json'); fs.writeFileSync(bom, '﻿' + JSON.stringify({ groups: GROUPS, tools: [tool()] }));
r = chk(bom);                                                              t('F26 a file that starts with a byte-order mark still parses', r.code === 0, r.out.join(' | '));
r = chk(reg([tool({ usage: { sessions: 12, last: '1 Oct 2026' } })]));     t('F27 a date that is not YYYY-MM-DD is a problem', r.code === 1 && has(r, /YYYY-MM-DD/), r.out.join(' | '));
r = chk(reg([tool({ id: 'Bad Name' })]));                                  t('F28 an id with a space or a capital is a problem', r.code === 1 && has(r, /lower-case words/), r.out.join(' | '));
r = chk(reg([tool({ home: 'lib/gone.js' })]), ['--no-homes']);             t('F29 --no-homes skips the disk lookup and says so', r.code === 0 && has(r, /homes not checked/), r.out.join(' | '));
r = chk(reg([null, 7, tool()]));                                           t('F30 a row that is not an object is a problem, the rest is still checked', r.code === 1 && has(r, /not an object/) && has(r, /3 rows/), r.out.join(' | '));
r = run(['nonsense']);                                                     t('F31 an unknown command prints the usage line and exits 1', r.code === 1 && has(r, /^usage:/), r.out.join(' | '));
r = chk(reg([tool({ usage: { sessions: 3, last: '' }, status: 'rare' })])); t('F32 a used Tool with no last-used date is a problem', r.code === 1 && has(r, /usage\.last is empty/), r.out.join(' | '));
const logRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tool-registry-log-'));
main(['check', '--file', reg([tool({ home: 'built in' })]), '--root', logRoot]);
let logged = ''; try { logged = fs.readFileSync(path.join(logRoot, 'system', 'telemetry', 'tool-registry.jsonl'), 'utf8'); } catch (_) {}
                                                                           t('F33 a check writes one log row with rows, problems and outcome', /"cmd":"check","rows":1,"problems":0,"outcome":"ok"/.test(logged), logged);

try { fs.rmSync(tmp, { recursive: true, force: true }); fs.rmSync(logRoot, { recursive: true, force: true }); } catch (_) {}
const passed = results.filter(Boolean).length;
console.log('\ntool-registry.eval: ' + passed + '/' + results.length + (passed === results.length ? ' green' : ' FAILED'));
process.exit(passed === results.length ? 0 : 1);
