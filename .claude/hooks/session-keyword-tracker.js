/**
 * session-keyword-tracker.js — Stop hook
 *
 * Phase 2 of diary redesign. Auto-Index extraction throughout a session.
 *
 * On every Stop event, scans the turn payload (assistant message + tool
 * calls + tool results) for canonical-form entities matching the regex set
 * documented in `daily-diary/diary-format.md` Auto-Index section. Appends
 * new entries (deduped within session) to:
 *
 *   .claude/state/session-keywords/<YYYY-MM-DD>.jsonl
 *
 * One JSON object per line, with worktree-id tag for cross-worktree merge:
 *
 *   {"date":"2026-05-28","worktree":"modest-saha-8e8678","category":"ticket",
 *    "canonical":"QA-262869","context":"§6 placeholders shipped",
 *    "first_seen_ts":"2026-05-28T03:42:11+08:00"}
 *
 * At DE step 4, the diary builder reads the day's JSONL, dedupes across
 * worktrees, groups by category, and renders into the Auto-Index section.
 *
 * Created 2026-05-28 — Phase 2 of diary redesign per
 * `~/.claude/plans/yes-very-much-catches-squishy-cake.md`.
 */
'use strict';

const fs = require('fs');
const path = require('path');

// Regex categories per diary-format.md Auto-Index spec
const CATEGORIES = [
  {
    name: 'ticket',
    regex: /\b(?:QA|FAT(?:-OR)?|UAT(?:-CR)?)[ -]?#?\d{6}\b/g,
  },
  {
    name: 'permohonan',
    regex: /\bPT[A-Z]{3}\/\d{2}\/[A-Z]\/[A-Z]+\/\d{4}\/\d+\b/g,
  },
  {
    name: 'commit',
    // 7-10 hex chars; will further-filter by checking surrounding context
    regex: /\b[a-f0-9]{7,10}\b/g,
    contextRequired: /\b(commit|sha|merge|push|hash|HEAD)\b/i,
  },
  {
    name: 'skill',
    regex: /\.claude[\\\/]skills[\\\/]([a-z][a-z0-9-]+)/g,
    captureGroup: 1,
  },
  {
    name: 'hook',
    regex: /\.claude[\\\/]hooks[\\\/]([a-z][a-z0-9-]+\.js)/g,
    captureGroup: 1,
  },
  {
    name: 'knowledge-file',
    regex: /(?:etanah-knowledge|projects[\\\/]coding-projects)[\\\/][\w\-\/\\.]+\.md/g,
  },
  {
    name: 'slip-log',
    // Date-anchored entries in meta/slip-log.md
    regex: /meta[\\\/]slip-log\.md\s*(?:\(?\d{4}-\d{2}-\d{2}(?:\s*entry\s*#?\d*)?\)?)?/g,
  },
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

// Get worktree name from CWD
function getWorktreeName(cwd) {
  const match = cwd.match(/[\\\/]worktrees[\\\/]([^\\\/]+)/);
  return match ? match[1] : 'main';
}

// Today's date in YYYY-MM-DD (local timezone)
function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Extract canonical entities from text
function extractEntities(text) {
  const entities = [];
  for (const cat of CATEGORIES) {
    const re = new RegExp(cat.regex.source, cat.regex.flags);
    let match;
    while ((match = re.exec(text)) !== null) {
      const canonical = cat.captureGroup ? match[cat.captureGroup] : match[0];
      // Apply context filter if required (e.g., commit SHA must appear near "commit"/"sha"/etc.)
      if (cat.contextRequired) {
        const window = text.substring(Math.max(0, match.index - 80), Math.min(text.length, match.index + 80));
        if (!cat.contextRequired.test(window)) continue;
      }
      // Capture a small context snippet (5 words around the match)
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + canonical.length + 30);
      const context = text.substring(start, end).replace(/\s+/g, ' ').trim();
      entities.push({ category: cat.name, canonical, context });
    }
  }
  return entities;
}

// Read existing JSONL for the day to dedupe
function readExisting(filePath) {
  if (!fs.existsSync(filePath)) return new Set();
  const seen = new Set();
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      seen.add(`${entry.category}:${entry.canonical}`);
    } catch (e) { /* ignore malformed */ }
  }
  return seen;
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const payloadText = JSON.stringify(data);

    const projectRoot = findProjectRoot(process.cwd());
    if (!projectRoot) process.exit(0);  // can't locate — silent skip

    const stateDir = path.join(projectRoot, '.claude', 'state', 'session-keywords');
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    const date = today();
    const filePath = path.join(stateDir, `${date}.jsonl`);
    const seen = readExisting(filePath);

    const worktree = getWorktreeName(process.cwd());
    const ts = new Date().toISOString();

    const entities = extractEntities(payloadText);
    const newEntries = [];
    for (const e of entities) {
      const key = `${e.category}:${e.canonical}`;
      if (seen.has(key)) continue;
      seen.add(key);
      newEntries.push({
        date,
        worktree,
        category: e.category,
        canonical: e.canonical,
        context: e.context,
        first_seen_ts: ts,
      });
    }

    if (newEntries.length > 0) {
      const lines = newEntries.map(e => JSON.stringify(e)).join('\n') + '\n';
      fs.appendFileSync(filePath, lines, 'utf8');
    }

    process.exit(0);
  } catch (e) {
    // Never block on hook errors
    process.exit(0);
  }
});
