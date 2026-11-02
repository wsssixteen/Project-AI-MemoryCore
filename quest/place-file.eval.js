// Eval for quest/place-file.js and the reminder in domain/attachment-context. Run: node quest/place-file.eval.js
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const p = require('./place-file');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'place-file-'));
let pass = 0, fail = 0;
const t = (name, ok) => { if (ok) pass++; else { fail++; console.log('  FAIL ' + name); } };
const model = (key, desc, extra = '') => `<definitions><process id="${key}"><documentation>${desc}</documentation>${extra}</process><bpmndi/></definitions>`;
const task = path.join(tmp, 'task'); fs.mkdirSync(path.join(task, '1. Brief'), { recursive: true }); fs.mkdirSync(path.join(task, '2. Fix'));
const dl = path.join(tmp, 'dl'); fs.mkdirSync(dl);
const write = (n, s) => { const f = path.join(dl, n); fs.writeFileSync(f, s); return f; };

// homes
let f = write('a.sql', 'x');
let r = p.place(f, { kind: 'fix', num: '1', folder: task });
t('fix lands in 2. Fix', r.code === 0 && fs.existsSync(path.join(task, '2. Fix', 'a.sql')) && !fs.existsSync(f));
f = write('b.png', 'x');
r = p.place(f, { kind: 'brief', num: '1', folder: task });
t('brief lands in 1. Brief', r.code === 0 && fs.existsSync(path.join(task, '1. Brief', 'b.png')));
fs.mkdirSync(path.join(task, '3. Rework', 'Brief'), { recursive: true });
f = write('c.sql', 'x');
r = p.place(f, { kind: 'fix', num: '1', folder: task });
t('fix follows the latest Rework', r.code === 0 && fs.existsSync(path.join(task, '3. Rework', 'c.sql')));
f = write('d.png', 'x');
r = p.place(f, { kind: 'brief', num: '1', folder: task });
t('brief follows the latest Rework Brief', r.code === 0 && fs.existsSync(path.join(task, '3. Rework', 'Brief', 'd.png')));

// never overwrites
f = write('c.sql', 'different');
r = p.place(f, { kind: 'fix', num: '1', folder: task });
t('different file refused, source kept', r.code === 1 && fs.existsSync(f) && fs.readFileSync(path.join(task, '3. Rework', 'c.sql'), 'utf8') === 'x');
t('refusal names the next step', /--replace/.test(r.msg));
r = p.place(f, { kind: 'fix', num: '1', folder: task, replace: true });
const left = fs.readdirSync(path.join(task, '3. Rework'));
t('--replace keeps the old copy', r.code === 0 && left.some(n => /^c - old /.test(n)) && fs.readFileSync(path.join(task, '3. Rework', 'c.sql'), 'utf8') === 'different');
f = write('c.sql', 'different2');
r = p.place(f, { kind: 'fix', num: '1', folder: task, replace: true });
t('a second replace the same day loses nothing', r.code === 0 && fs.readdirSync(path.join(task, '3. Rework')).filter(n => /^c - old /.test(n)).length === 2);
f = write('c.sql', 'different2');
r = p.place(f, { kind: 'fix', num: '1', folder: task });
t('same bytes: source removed, nothing rewritten', r.code === 0 && !fs.existsSync(f));

// bad input
t('missing file fails', p.place(path.join(dl, 'none'), { kind: 'fix', folder: task }).code === 1);
t('a folder is not a file', p.place(dl, { kind: 'fix', folder: task }).code === 1);
f = write('e.sql', 'x');
t('no task folder fails', p.place(f, { kind: 'fix', num: '9', folder: null }).code === 1 && fs.existsSync(f));
t('unknown kind fails', p.place(f, { kind: 'zzz', num: '9', folder: task }).code === 1 && fs.existsSync(f));
t('original refuses a non-model', p.place(f, { kind: 'original', folder: task }).code === 1 && fs.existsSync(f));
const dry = write('dry.sql', 'x');
r = p.place(dry, { kind: 'fix', num: '1', folder: task, dryRun: true });
t('dry run moves nothing', r.code === 0 && fs.existsSync(dry) && !fs.existsSync(r.dst));
r = p.place(path.join(task, '2. Fix', 'a.sql'), { kind: 'fix', num: '1', folder: path.join(tmp, 'task2') });
t('file with no folder shape: fix home is created', r.code === 0);
const home = path.join(tmp, 'home.sql'); fs.writeFileSync(home, 'x');
fs.mkdirSync(path.join(tmp, 'task3', '2. Fix'), { recursive: true });
fs.copyFileSync(home, path.join(tmp, 'task3', '2. Fix', 'home.sql'));
r = p.place(path.join(tmp, 'task3', '2. Fix', 'home.sql'), { kind: 'fix', folder: path.join(tmp, 'task3') });
t('a file already home stays', r.code === 0 && /already home/.test(r.msg));

// model keys and homes, against the real registry
const realMlk = p.knowledgeHome('MLK_PLP_PPTPB.bpmn20.xml');
t('Melaka PLP goes to the flowables root', /melaka[\\/]flowables-bpmn[\\/]MLK_PLP_PPTPB\.bpmn20\.xml$/.test(realMlk));
t('Penang key goes to Penang, whatever the quest', /penang[\\/]flowables-bpmn[\\/]PNG_PLP_PRU\.bpmn20\.xml$/.test(p.knowledgeHome('PNG_PLP_PRU.bpmn20.xml')));
t('unknown state has no knowledge home', p.knowledgeHome('XXX_PLP_A.bpmn20.xml') === null);
t('a file with no key has no knowledge home', p.knowledgeHome('notes.bpmn20.xml') === null);

// auto kind
const noState = write('XXX_PLP_A.bpmn20.xml', model('A', 'd'));
t('auto asks on unknown state', !!p.autoKind(noState, '1').ask);
t('auto asks on a non-model', !!p.autoKind(write('z.sql', 'x'), '1').ask);
const realCopy = fs.existsSync(realMlk) ? fs.readFileSync(realMlk, 'utf8') : null;
if (realCopy) {
  const same = write('MLK_PLP_PPTPB.bpmn20.xml', realCopy);
  const a = p.autoKind(same, '287773');
  t('auto: same process as the knowledge copy = original', a.kind === 'original' && a.same);
  fs.writeFileSync(same, realCopy.replace('</process>', '<x/>(ESOKONGAN #287773)</process>'));
  t('auto: differs and names this ticket = fix', p.autoKind(same, '287773').kind === 'fix');
  t('auto: another ticket number does not match', !!p.autoKind(same, '28777').ask);
  fs.writeFileSync(same, realCopy.replace('</process>', '<x/></process>'));
  t('auto: differs and names no ticket = ask', !!p.autoKind(same, '287773').ask);
  fs.writeFileSync(same, 'not a model');
  t('auto: broken file = ask', !!p.autoKind(same, '287773').ask);
}

// the reminder, through the hook itself
const hook = path.join(__dirname, '..', 'domain', 'attachment-context', 'attachment-context.trigger.hook.js');
const run = prompt => cp.spawnSync(process.execPath, [hook], { input: JSON.stringify({ prompt }), encoding: 'utf8' }).stdout || '';
t('reminder fires on a Downloads path', /place-file/.test(run('@"C:\\Users\\Ridhwan\\Downloads\\MLK_PLP_PPTPB.bpmn20.xml" check my fixes')));
t('reminder names the file', /MLK_PLP_PPTPB\.bpmn20\.xml/.test(run('@"C:\\Users\\Ridhwan\\Downloads\\MLK_PLP_PPTPB.bpmn20.xml" check')));
t('reminder fires on a Desktop path', /place-file/.test(run('see C:\\Users\\Ridhwan\\Desktop\\a.sql')));
t('reminder stays silent with no file', !/place-file/.test(run('please improve pena')));
t('reminder stays silent on a Task folder file', !/place-file/.test(run('C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka\\1. x\\2. Fix\\a.sql')));
t('bad stdin does not crash the hook', cp.spawnSync(process.execPath, [hook], { input: 'not json', encoding: 'utf8' }).status === 0);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`place-file eval: ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
