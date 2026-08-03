/**
 * de-output-integrity-checker.js — Stop hook
 *
 * Phase 3 generalization of diary-format-gate.js. Config-driven multi-file
 * integrity checker for DE-output files. Currently:
 *
 *   - daily-diary/current/<YYYY-MM-DD>.md  → 3 H2 sections + voice signals
 *
 * Future entries to CONFIG (Phase 3+ rollouts):
 *
 *   - main/current-session.md  → AGENT_STATE required sections
 *   - system/slip-log.md         → entry shape integrity
 *   - main/post-mortems.md     → per-entry header structure
 *   - main/kpi-tracker.md      → per-entry header structure
 *
 * Trigger: presence of DE closing banner text in the Stop event payload
 * ("Domain Expansion — closed" OR "Barrier settles. Quest threads are at rest").
 *
 * Behavior: WARN-only via hookSpecificOutput.additionalContext. Never blocks
 * DE close (exit code always 0).
 *
 * Created 2026-05-28 — Phase 3 of diary redesign per
 * `~/.claude/plans/yes-very-much-catches-squishy-cake.md`.
 * Supersedes diary-format-gate.js (Phase 1).
 *
 * Voice signal thresholds calibrated via voice-signal-spike.js against past
 * entries (Phase 2 spike, 2026-05-28):
 *   - fp_rate warm-mean=1.7 vs broken-mean=1.1 → threshold 0.8 (clear gap)
 *   - closing_lines warm-mean=1.7 vs broken-mean=0.5 → threshold 3 (warm 2026-04-29 had 3)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DE_CLOSE_PATTERNS = [
  /Domain Expansion — closed/,
  /Domain Expansion -- closed/,
  /Barrier settles\. Quest threads are at rest/,
];

// Find project root by walking up
function findProjectRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(path.join(dir, '.claude'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

// Find latest matching diary file (TZ-safe — by mtime)
function findLatestDiaryFile(diaryDir) {
  if (!fs.existsSync(diaryDir)) return null;
  const files = fs.readdirSync(diaryDir)
    .filter(f => f.endsWith('.md') && /^\d{4}-\d{2}-\d{2}/.test(f))
    .map(f => ({
      name: f,
      path: path.join(diaryDir, f),
      mtime: fs.statSync(path.join(diaryDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? files[0] : null;
}

// ============ CHECKS ============

function checkStructure(content, requiredSections) {
  const lines = content.split('\n');
  const issues = [];
  for (const section of requiredSections) {
    const headerIdx = lines.findIndex(l => l.trim() === section);
    if (headerIdx === -1) {
      issues.push({ kind: 'missing', section });
      continue;
    }
    // Check non-empty content under header
    let hasContent = false;
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^## /.test(line.trim())) break;
      if (line.trim().length > 0 && !/^<.*>$/.test(line.trim())) {
        hasContent = true;
        break;
      }
    }
    if (!hasContent) issues.push({ kind: 'empty', section });
  }
  return issues;
}

function extractSection(content, h2Name) {
  const lines = content.split('\n');
  const startIdx = lines.findIndex(l => l.trim() === h2Name);
  if (startIdx === -1) return '';
  const endIdx = lines.findIndex((l, i) => i > startIdx && /^## /.test(l));
  const sectionLines = endIdx === -1 ? lines.slice(startIdx + 1) : lines.slice(startIdx + 1, endIdx);
  return sectionLines.join('\n');
}

function signal_firstPersonRate(text) {
  const wordCount = (text.match(/\b\w+\b/g) || []).length;
  if (wordCount === 0) return 0;
  const fp = (text.match(/\b(I|me|my|I'd|I'll|I'm|I've)\b/g) || []).length;
  return Math.round((fp / wordCount) * 1000) / 10;
}

function signal_closingNonEmptyLines(content) {
  const closing = extractSection(content, '## Closing');
  return closing.split('\n').filter(l => l.trim().length > 0).length;
}

function checkVoice(content, voiceRules) {
  const issues = [];
  const sessionsText = extractSection(content, '## Sessions');
  const closingText = extractSection(content, '## Closing');
  const voiceText = sessionsText + '\n' + closingText;

  if (voiceRules.fp_rate_min !== undefined) {
    const rate = signal_firstPersonRate(voiceText);
    if (rate < voiceRules.fp_rate_min) {
      issues.push({ kind: 'voice-fp-low', value: rate, threshold: voiceRules.fp_rate_min });
    }
  }
  if (voiceRules.closing_min_lines !== undefined) {
    const lines = signal_closingNonEmptyLines(content);
    if (lines < voiceRules.closing_min_lines) {
      issues.push({ kind: 'voice-closing-short', value: lines, threshold: voiceRules.closing_min_lines });
    }
  }
  return issues;
}

// ============ CONFIG ============
// Config-driven: each entry describes one DE-touched file's integrity rules.
// Add new entries here as patterns surface.

function getConfigs(projectRoot) {
  return [
    {
      name: 'daily-diary',
      // Use latest mtime in daily-diary/current/<date>.md as the file to check
      file_resolver: () => {
        const dir = path.join(projectRoot, 'daily-diary', 'current');
        const latest = findLatestDiaryFile(dir);
        return latest ? latest.path : null;
      },
      required_sections: ['## Sessions', '## Index', '## Closing'],
      voice_rules: {
        fp_rate_min: 0.8,         // per 100 words in Sessions + Closing
        closing_min_lines: 3,     // non-empty lines in ## Closing
      },
    },
    // Phase 3+ — add other files as drift patterns surface:
    // {
    //   name: 'current-session',
    //   file_resolver: () => path.join(projectRoot, 'main', 'current-session.md'),
    //   required_sections: ['## High-Level Objective (AGENT_STATE)', '## Current Progress (AGENT_STATE)', '## Immediate Next Steps (AGENT_STATE)'],
    //   voice_rules: {},
    // },
  ];
}

// ============ MAIN ============

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const payloadText = JSON.stringify(data);

    const isDEClose = DE_CLOSE_PATTERNS.some(re => re.test(payloadText));
    if (!isDEClose) process.exit(0);

    const projectRoot = findProjectRoot(process.cwd());
    if (!projectRoot) process.exit(0);

    const configs = getConfigs(projectRoot);
    const warnings = [];

    for (const cfg of configs) {
      const filePath = cfg.file_resolver();
      if (!filePath || !fs.existsSync(filePath)) {
        warnings.push(`[${cfg.name}] file not found at expected location`);
        continue;
      }
      const content = fs.readFileSync(filePath, 'utf8');
      const basename = path.basename(filePath);

      const structureIssues = checkStructure(content, cfg.required_sections);
      const voiceIssues = checkVoice(content, cfg.voice_rules || {});

      for (const issue of structureIssues) {
        if (issue.kind === 'missing') {
          warnings.push(`[${cfg.name}: ${basename}] missing required H2 section: ${issue.section}`);
        } else if (issue.kind === 'empty') {
          warnings.push(`[${cfg.name}: ${basename}] empty section (header but no content): ${issue.section}`);
        }
      }
      for (const issue of voiceIssues) {
        if (issue.kind === 'voice-fp-low') {
          warnings.push(`[${cfg.name}: ${basename}] first-person rate ${issue.value}/100 words below threshold ${issue.threshold} — voice may be drifting toward reportage`);
        } else if (issue.kind === 'voice-closing-short') {
          warnings.push(`[${cfg.name}: ${basename}] Closing has ${issue.value} non-empty lines (threshold ≥${issue.threshold}) — closing reflection thin`);
        }
      }
    }

    if (warnings.length === 0) process.exit(0);

    const reminder = [
      '',
      '⚙️  de-output-integrity-checker: issue(s) detected in DE-output file(s)',
      '',
      ...warnings.map(w => '  • ' + w),
      '',
      'These are WARNINGS, not blocks. DE close proceeds. Address on next entry or now.',
      '',
      'Rules per `daily-diary/diary-format.md` (structure) + Phase 2 voice signal',
      'spike calibrated 2026-05-28 (voice). Hook: .claude/hooks/de-output-integrity-checker.js',
      '',
    ].join('\n');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'Stop', additionalContext: reminder },
    }));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
