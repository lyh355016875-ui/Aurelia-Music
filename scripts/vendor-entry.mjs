// Build-time entry consumed by scripts/build-vendor.mjs to produce vendor/three.js.
//
// It bundles three.js (core + WebGL renderer) together with the RoundedBoxGeometry
// addon into ONE classic (non-module) script that exposes the THREE namespace on
// window.THREE, with THREE.RoundedBoxGeometry attached.
//
// This lets index.html run directly from a file:// URL (double-click to open)
// without a dev server or bundler at runtime: classic <script src> tags load fine
// over file://, whereas ES module imports are blocked by the browser CORS policy.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// A module namespace object is frozen, so copy it into a plain object and attach
// the addon geometry. Assigning to both window and globalThis keeps it usable in
// browsers and in any tooling that reads globalThis.
const namespace = { ...THREE, RoundedBoxGeometry };
if (typeof window !== 'undefined') window.THREE = namespace;
if (typeof globalThis !== 'undefined') globalThis.THREE = namespace;
