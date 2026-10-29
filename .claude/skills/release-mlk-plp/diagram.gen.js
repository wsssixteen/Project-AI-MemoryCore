// Phase F (master merge) as a three-lane picture: You · Ruri · Aaron or Alex.
const fs = require('fs'), path = require('path');
const lanes = ['You', 'Ruri', 'Aaron or Alex'];
const steps = [
  [0, 'Say "BA passed"', 'BAQA baseline result'],
  [1, 'Script checks the release', 'merge-to-master --ba-approved'],
  [0, 'Pick the reviewer', 'Aaron or Alex · stays for good'],
  [1, 'Fill the merge request in Edge', 'commit count · no squash · keep branch', 'focal'],
  [0, 'Confirm the filled form', 'removed later, once reliable', 'dashed'],
  [1, 'Click Create, record the link', 'read back from GitLab'],
  [2, 'Approve and merge', 'in GitLab'],
  [0, 'Say "merged"', ''],
  [1, 'Check master, then staging', 'merge-to-master --check · stag-catchup'],
];
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const COLW = 280, X0 = 24, BW = 248, BH = 56, Y0 = 56, ROW = 80;
const cx = c => X0 + c * COLW + COLW / 2;
const width = X0 * 2 + lanes.length * COLW, height = Y0 + steps.length * ROW + 10;
let svg = '';
lanes.forEach((l, i) => {
  svg += `<rect class="lane" x="${X0 + i * COLW + 4}" y="8" width="${COLW - 8}" height="${height - 12}" rx="8"/>`;
  svg += `<text class="lane-t" x="${cx(i)}" y="34" text-anchor="middle">${esc(l)}</text>`;
});
steps.forEach(([c, t, s, kind], i) => {
  const x = cx(c) - BW / 2, y = Y0 + i * ROW;
  const cls = kind === 'focal' ? 'node focal' : 'node';
  svg += `<rect class="${cls}" x="${x}" y="${y}" width="${BW}" height="${BH}" rx="6"${kind === 'dashed' ? ' stroke-dasharray="5 4"' : ''}/>`;
  svg += `<text class="num" x="${x + 9}" y="${y + 16}">${i + 1}</text>`;
  svg += `<text class="node-title${kind === 'focal' ? ' focal-t' : ''}" x="${cx(c)}" y="${y + (s ? 25 : 33)}" text-anchor="middle">${esc(t)}</text>`;
  if (s) svg += `<text class="node-sub${kind === 'focal' ? ' focal-t' : ''}" x="${cx(c)}" y="${y + 43}" text-anchor="middle">${esc(s)}</text>`;
  if (i < steps.length - 1) {
    const n = steps[i + 1][0], yb = y + BH, yt = Y0 + (i + 1) * ROW, ym = yb + 11;
    svg += `<path class="connector" d="M${cx(c)} ${yb} L${cx(c)} ${ym} L${cx(n)} ${ym} L${cx(n)} ${yt - 2}" marker-end="url(#arrow)"/>`;
  }
});
const title = 'Release to master: the merge request steps';
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--paper:#f5f5f5;--ink:#2d3142;--muted:#4f5d75;--accent:#bf4520;--accent-tint:rgba(191,69,32,.08);--node:#fff;--node-stroke:rgba(45,49,66,.3);--lane:rgba(45,49,66,.04);--sans:'Segoe UI',Arial,sans-serif;--mono:Consolas,monospace}
body{font-family:var(--sans);background:var(--paper);color:var(--ink);width:max-content}
.frame{box-sizing:content-box;padding:28px 32px;width:${width}px}
h1{font:600 20px var(--sans);margin-bottom:12px}
svg{width:${width}px;display:block}
.lane{fill:var(--lane);stroke:none}.lane-t{fill:var(--muted);font:600 14px var(--sans)}
.node{fill:var(--node);stroke:var(--node-stroke)}.node.focal{fill:var(--accent-tint);stroke:var(--accent);stroke-width:1.4}
.node-title{fill:var(--ink);font:600 13px var(--sans)}.node-sub{fill:var(--muted);font:11px var(--mono)}.focal-t{fill:var(--accent)}
.num{fill:var(--muted);font:600 11px var(--mono)}
.connector{fill:none;stroke:var(--muted);stroke-width:1.2}
</style></head><body><div class="frame">
<h1>${title}</h1>
<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="phasef-title phasef-desc">
<title id="phasef-title">${title}</title>
<desc id="phasef-desc">Nine steps across three lanes. Step 4, Ruri filling the merge request, replaces the old direct push to master. Step 5 is the confirmation to be removed later.</desc>
<defs><marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#4f5d75"/></marker></defs>
${svg}
</svg></div></body></html>`;
fs.writeFileSync(path.join(__dirname, 'diagram.html'), html);
console.log(path.join(__dirname, 'diagram.html'));
