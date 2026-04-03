#!/usr/bin/env node

/**
 * Asset size guardrail — fails if any single asset exceeds thresholds.
 * Run as part of `npm run guardrails`.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PUBLIC_DIR = new URL('../public', import.meta.url).pathname;

const IMAGE_MAX_MB = 1.5;
const VIDEO_MAX_MB = 12; // campfire.mp4 is 11 MB — baseline for existing assets

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov']);

function walkDir(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkDir(fullPath));
      } else {
        results.push(fullPath);
      }
    }
  } catch {
    // directory doesn't exist
  }
  return results;
}

const files = walkDir(PUBLIC_DIR);
const violations = [];

for (const file of files) {
  const ext = extname(file).toLowerCase();
  const stat = statSync(file);
  const sizeMB = stat.size / (1024 * 1024);
  const relPath = file.replace(PUBLIC_DIR, 'public');

  if (IMAGE_EXTS.has(ext) && sizeMB > IMAGE_MAX_MB) {
    violations.push(`  IMAGE  ${relPath} — ${sizeMB.toFixed(1)} MB (max ${IMAGE_MAX_MB} MB)`);
  }
  if (VIDEO_EXTS.has(ext) && sizeMB > VIDEO_MAX_MB) {
    violations.push(`  VIDEO  ${relPath} — ${sizeMB.toFixed(1)} MB (max ${VIDEO_MAX_MB} MB)`);
  }
}

if (violations.length > 0) {
  console.error('\n❌ Asset size violations:\n');
  violations.forEach((v) => console.error(v));
  console.error(`\n${violations.length} file(s) exceed size limits.\n`);
  process.exit(1);
} else {
  console.warn('✓ All assets within size limits.');
}
