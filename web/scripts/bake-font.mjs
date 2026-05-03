#!/usr/bin/env node

/**
 * Bake a TTF into the typeface.json format consumed by three FontLoader / drei Text3D.
 * One-time: produces public/fonts/Fraunces.json from public/fonts/Fraunces.ttf.
 *
 * Why: drei Text3D needs typeface.json (extruded geometry path commands),
 * not the variable .ttf used by drei MSDF Text. Phase 1 dispersive type signature
 * needs real 3D geometry for back-face thickness FBO + per-channel IOR.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';

const SRC = new URL('../public/fonts/Fraunces.ttf', import.meta.url).pathname;
const DST = new URL('../public/fonts/Fraunces.json', import.meta.url).pathname;

const RESTRICT = false; // set true to bake only the chars in INCLUDE
const INCLUDE = 'SamHerwig.,—·:0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const buffer = readFileSync(SRC);
const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

function commandsToPath(commands) {
  const out = [];
  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M':
        out.push(`m ${cmd.x} ${cmd.y}`);
        break;
      case 'L':
        out.push(`l ${cmd.x} ${cmd.y}`);
        break;
      case 'Q':
        out.push(`q ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`);
        break;
      case 'C':
        out.push(`b ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`);
        break;
      case 'Z':
        out.push('z');
        break;
      default:
        break;
    }
  }
  return out.join(' ');
}

const glyphs = {};
const allowed = RESTRICT ? new Set([...INCLUDE]) : null;

for (let i = 0; i < font.glyphs.length; i++) {
  const glyph = font.glyphs.get(i);
  if (!glyph.unicode) continue;
  const ch = String.fromCodePoint(glyph.unicode);
  if (allowed && !allowed.has(ch)) continue;

  const path = glyph.getPath(0, 0, font.unitsPerEm);
  const o = commandsToPath(path.commands);

  glyphs[ch] = {
    ha: glyph.advanceWidth,
    x_min: glyph.xMin ?? 0,
    x_max: glyph.xMax ?? 0,
    o,
  };
}

const json = {
  glyphs,
  familyName: font.names.fontFamily?.en ?? 'Fraunces',
  ascender: font.tables.os2.sTypoAscender ?? font.ascender,
  descender: font.tables.os2.sTypoDescender ?? font.descender,
  underlinePosition: font.tables.post?.underlinePosition ?? -100,
  underlineThickness: font.tables.post?.underlineThickness ?? 50,
  boundingBox: {
    yMin: font.tables.head?.yMin ?? -200,
    xMin: font.tables.head?.xMin ?? 0,
    yMax: font.tables.head?.yMax ?? 1000,
    xMax: font.tables.head?.xMax ?? 1000,
  },
  resolution: font.unitsPerEm,
  original_font_information: {
    fontFamily: font.names.fontFamily?.en,
    fontSubfamily: font.names.fontSubfamily?.en,
    fullName: font.names.fullName?.en,
    version: font.names.version?.en,
  },
  cssFontFamily: font.names.fontFamily?.en,
  cssFontStyle: 'normal',
  cssFontWeight: 'normal',
};

writeFileSync(DST, JSON.stringify(json));
console.warn(`Baked ${Object.keys(glyphs).length} glyphs → ${DST}`);
