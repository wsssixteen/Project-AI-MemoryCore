#!/usr/bin/env node
// phrase-registry.js
//
// GENERATES a read-only registry of trigger phrases scattered across 4 homes:
//   1. .claude/skills/(name)/SKILL.md         - frontmatter description: extract quoted phrases
//   2. .claude/hooks/(name).js + domain/(x)/(x).hook.js - extract regex literals near test(/match(
//   3. .claude/CLAUDE.md                      - lines inside tables under headings containing 'Trigger'
//   4. .claude/auto-memory/feedback_(name).md - filename keywords only
//
// Output: meta/phrase-registry.md (one table: |component|layer|phrases|), sorted by component.
// Also prints a 3-line count summary to stdout.
//
// No external deps. Fails gracefully per-file (a bad file is skipped, never crashes the run).

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(__dirname, 'phrase-registry.md');

/** Recursively walk a directory, returning file paths that satisfy predicate(filePath). */
function walk(dir, predicate, results) {
  results = results || [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return results; // fail gracefully - unreadable dir, skip
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip common noise dirs
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walk(full, predicate, results);
    } else if (entry.isFile()) {
      if (predicate(full)) results.push(full);
    }
  }
  return results;
}

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null; // fail gracefully
  }
}

function relPath(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

/** Extract double- or single-quoted phrases from a text blob. */
function extractQuotedPhrases(text) {
  const phrases = [];
  // double-quoted "..."
  const dq = text.match(/"([^"\n]{2,200}?)"/g) || [];
  for (const m of dq) phrases.push(m.slice(1, -1));
  return phrases;
}

// ---------------------------------------------------------------------------
// Component 1: .claude/skills/*/SKILL.md frontmatter description lines
// ---------------------------------------------------------------------------
function extractFromSkills() {
  const rows = [];
  const skillsDir = path.join(ROOT, '.claude', 'skills');
  const files = walk(skillsDir, (f) => path.basename(f) === 'SKILL.md');

  for (const file of files) {
    const content = safeReadFile(file);
    if (content === null) continue;

    try {
      // frontmatter is between the first two '---' lines
      const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fmMatch) continue;
      const frontmatter = fmMatch[1];

      // description: field may be a single line or wrap; grab from 'description:' to
      // the next top-level 'key:' line (start-of-line, no leading whitespace) or end of frontmatter.
      const descMatch = frontmatter.match(/^description:\s*([\s\S]*?)(?:\n[a-zA-Z_-]+:\s|$)/m);
      if (!descMatch) continue;
      let descBlock = descMatch[1];

      const phrases = extractQuotedPhrases(descBlock);
      if (phrases.length === 0) continue;

      const componentName = path.basename(path.dirname(file));
      rows.push({
        component: `skill:${componentName}`,
        layer: 'skill-frontmatter',
        phrases: dedupe(phrases),
        source: relPath(file),
      });
    } catch (e) {
      // fail gracefully per-file
      continue;
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Component 2: .claude/hooks/*.js + domain/*/*.hook.js - regex literals near
// lines containing 'test(' or 'match(' (best-effort, cap 6 per hook)
// ---------------------------------------------------------------------------
function extractFromHooks() {
  const rows = [];
  const hookFiles = [];

  const hooksDir = path.join(ROOT, '.claude', 'hooks');
  walk(hooksDir, (f) => f.endsWith('.js'), hookFiles);

  const domainDir = path.join(ROOT, 'domain');
  walk(domainDir, (f) => f.endsWith('.hook.js'), hookFiles);

  for (const file of hookFiles) {
    const content = safeReadFile(file);
    if (content === null) continue;

    try {
      const lines = content.split(/\r?\n/);
      const regexLiterals = [];

      for (const line of lines) {
        if (regexLiterals.length >= 6) break;
        if (!/test\(|match\(/.test(line)) continue;

        // Best-effort regex-literal extractor: /pattern/flags
        // Avoid matching '//' comments and division by requiring a non-trivial body.
        const re = /\/((?:\\.|\[[^\]]*\]|[^\/\\\n])+)\/([a-z]*)/g;
        let m;
        while ((m = re.exec(line)) !== null && regexLiterals.length < 6) {
          const body = m[1];
          // skip trivial/likely-false-positive matches (e.g. paths, comments artifacts)
          if (body.length < 2) continue;
          if (body.startsWith('*')) continue; // guards against stray "/* " slipping through
          regexLiterals.push(`/${body}/${m[2]}`);
        }
      }

      if (regexLiterals.length === 0) continue;

      const componentName = path.basename(file, '.js').replace(/\.hook$/, '');
      rows.push({
        component: `hook:${componentName}`,
        layer: 'hook-regex',
        phrases: dedupe(regexLiterals),
        source: relPath(file),
      });
    } catch (e) {
      continue;
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Component 3: .claude/CLAUDE.md - lines inside tables under headings
// containing 'Trigger'
// ---------------------------------------------------------------------------
function extractFromClaudeMd() {
  const rows = [];
  const file = path.join(ROOT, '.claude', 'CLAUDE.md');
  const content = safeReadFile(file);
  if (content === null) return rows;

  try {
    const lines = content.split(/\r?\n/);
    let underTriggerHeading = false;
    let currentHeading = '';
    const collected = [];

    // Markdown '#' headings AND bold-paragraph pseudo-headings (e.g. "**Triggers** (...)")
    // both act as section markers in this file — either shape can introduce a Trigger table.
    const isHeading = (line) => /^#{1,6}\s+/.test(line);
    const isBoldPseudoHeading = (line) => /^\*\*[^*]+\*\*/.test(line.trim());
    const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);
    const isTableSeparator = (line) => /^\s*\|[\s:|-]+\|\s*$/.test(line);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (isHeading(line)) {
        underTriggerHeading = /trigger/i.test(line);
        currentHeading = line.replace(/^#+\s*/, '').trim();
        continue;
      }

      if (isBoldPseudoHeading(line)) {
        underTriggerHeading = /trigger/i.test(line);
        currentHeading = line.trim();
        continue;
      }

      if (underTriggerHeading && isTableRow(line) && !isTableSeparator(line)) {
        // skip header row (contains literal 'Trigger' as a column name only) - still fine to include,
        // dedupe + quote-extraction will naturally filter noise.
        const phrases = extractQuotedPhrases(line);
        if (phrases.length > 0) {
          collected.push({ heading: currentHeading, phrases });
        } else {
          // fallback: some trigger rows use backticks instead of quotes, e.g. `/quest start|hold|resume`
          const backticked = (line.match(/`([^`\n]{2,200}?)`/g) || []).map((s) => s.slice(1, -1));
          if (backticked.length > 0) collected.push({ heading: currentHeading, phrases: backticked });
        }
      }
    }

    // group by heading
    const byHeading = new Map();
    for (const { heading, phrases } of collected) {
      if (!byHeading.has(heading)) byHeading.set(heading, []);
      byHeading.get(heading).push(...phrases);
    }

    for (const [heading, phrases] of byHeading.entries()) {
      rows.push({
        component: `claude-md:${heading || '(untitled)'}`,
        layer: 'claude-md-table',
        phrases: dedupe(phrases),
        source: relPath(file),
      });
    }
  } catch (e) {
    // fail gracefully
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Component 4: .claude/auto-memory/feedback_*.md - filename keywords only
// ---------------------------------------------------------------------------
function extractFromFeedbackFilenames() {
  const rows = [];
  const dir = path.join(ROOT, '.claude', 'auto-memory');
  let files;
  try {
    files = fs.readdirSync(dir).filter((f) => /^feedback_.*\.md$/.test(f));
  } catch (e) {
    return rows; // fail gracefully
  }

  for (const fname of files) {
    try {
      const base = fname.replace(/^feedback_/, '').replace(/\.md$/, '');
      const keywords = base.split('_').filter(Boolean);
      if (keywords.length === 0) continue;
      rows.push({
        component: `feedback:${base}`,
        layer: 'feedback-filename',
        phrases: keywords,
        source: relPath(path.join(dir, fname)),
      });
    } catch (e) {
      continue;
    }
  }
  return rows;
}

function dedupe(arr) {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}

function escapeCell(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function buildMarkdown(allRows) {
  const sorted = [...allRows].sort((a, b) => a.component.localeCompare(b.component));

  const lines = [];
  lines.push('# Phrase Registry');
  lines.push('');
  lines.push('> AUTO-GENERATED by `meta/phrase-registry.js` - DO NOT EDIT BY HAND.');
  lines.push('> Regenerate with `node meta/phrase-registry.js`.');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('| component | layer | phrases |');
  lines.push('|---|---|---|');

  for (const row of sorted) {
    const phrasesCell = row.phrases.map((p) => `\`${escapeCell(p)}\``).join('<br>');
    lines.push(`| ${escapeCell(row.component)} | ${escapeCell(row.layer)} | ${phrasesCell} |`);
  }

  lines.push('');
  return lines.join('\n');
}

function main() {
  const skillRows = extractFromSkills();
  const hookRows = extractFromHooks();
  const claudeMdRows = extractFromClaudeMd();
  const feedbackRows = extractFromFeedbackFilenames();

  const allRows = [...skillRows, ...hookRows, ...claudeMdRows, ...feedbackRows];

  const markdown = buildMarkdown(allRows);
  fs.writeFileSync(OUT_FILE, markdown, 'utf8');

  const totalPhrases = allRows.reduce((sum, r) => sum + r.phrases.length, 0);

  console.log(`Components: ${allRows.length}  (skills=${skillRows.length}, hooks=${hookRows.length}, claude-md=${claudeMdRows.length}, feedback=${feedbackRows.length})`);
  console.log(`Total phrases extracted: ${totalPhrases}`);
  console.log(`Written: ${relPath(OUT_FILE)}`);
}

main();
