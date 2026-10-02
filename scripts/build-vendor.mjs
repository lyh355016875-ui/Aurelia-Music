// Builds vendor/three.js — a single self-contained classic script that exposes the
// THREE namespace (core + WebGL + RoundedBoxGeometry addon) on window.THREE.
//
// Run with:   node scripts/build-vendor.mjs
// Requires:   three and esbuild in node_modules (npm install three esbuild --no-save)
//
// The output is committed to the repo so end users can open index.html directly
// without installing anything. Rebuild only when upgrading three.
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const here = import.meta.url;
const entry = fileURLToPath(new URL('./vendor-entry.mjs', here));
const vendorDir = fileURLToPath(new URL('../vendor/', here));
const out = fileURLToPath(new URL('../vendor/three.js', here));

mkdirSync(vendorDir, { recursive: true });

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  outfile: out,
  legalComments: 'inline',
  logLevel: 'info',
});

console.log(`\nWrote ${out}`);
