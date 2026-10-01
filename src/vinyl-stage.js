import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function makeGrooveTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(380, 330, 40, 512, 512, 510);
  gradient.addColorStop(0, '#25231f');
  gradient.addColorStop(.45, '#10100e');
  gradient.addColorStop(1, '#201e1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);
  for (let radius = 156; radius < 492; radius += 8) {
    ctx.beginPath();
    ctx.arc(512, 512, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(212, 201, 178, ${radius % 24 === 0 ? .17 : .075})`;
    ctx.lineWidth = radius % 24 === 0 ? 2 : 1;
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeCenterLabel() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(160, 135, 12, 256, 256, 280);
  gradient.addColorStop(0, '#ddc99d');
  gradient.addColorStop(.65, '#a88e5c');
  gradient.addColorStop(1, '#695639');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(39, 32, 23, .46)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 229, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#342c1f';
  ctx.textAlign = 'center';
  ctx.font = '44px Georgia, serif';
  ctx.fillText('AURELIA', 256, 214);
  ctx.font = '92px Georgia, serif';
  ctx.fillText('A', 256, 316);
  ctx.font = '19px Arial, sans-serif';
  ctx.fillText('33⅓ RPM  ·  SIDE A', 256, 361);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addCylinderBetween(parent, from, to, radius, material, radialSegments = 20) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments), material);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createVinylStage(canvas) {
  if (!canvas) return null;
  const mount = canvas.closest('.artwork-stage');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (error) {
    console.warn('3D scene unavailable; using the illustrated fallback.', error);
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 40);
  camera.position.set(0, 3.35, 4.55);
  camera.lookAt(0, -.04, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  scene.add(new THREE.AmbientLight(0xc9b992, 1.05));
  const key = new THREE.DirectionalLight(0xffe2ad, 2.15);
  key.position.set(-3, 5, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.bias = -.00035;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd8d2c3, 1.4);
  rim.position.set(2.5, 3, -3.2);
  scene.add(rim);
  const warmFill = new THREE.PointLight(0xb58b4d, 16, 8, 2);
  warmFill.position.set(-1.5, 2.4, 1.5);
  scene.add(warmFill);

  const baseMaterial = new THREE.MeshPhysicalMaterial({ color: 0x28251f, roughness: .3, metalness: .28, clearcoat: .42, clearcoatRoughness: .28 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x9d8458, roughness: .34, metalness: .72 });
  const darkMetal = new THREE.MeshPhysicalMaterial({ color: 0x777369, roughness: .24, metalness: .82, clearcoat: .35 });
  const rubberMaterial = new THREE.MeshStandardMaterial({ color: 0x151411, roughness: .62, metalness: .16 });

  const base = new THREE.Mesh(new RoundedBoxGeometry(3.85, .24, 2.62, 6, .085), baseMaterial);
  base.position.y = -.12;
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  const plinthInset = new THREE.Mesh(new RoundedBoxGeometry(3.68, .026, 2.45, 4, .055), new THREE.MeshStandardMaterial({ color: 0x343027, roughness: .5, metalness: .14 }));
  plinthInset.position.set(0, .012, 0);
  plinthInset.receiveShadow = true;
  scene.add(plinthInset);
  const frontTrim = new THREE.Mesh(new THREE.BoxGeometry(3.35, .012, .012), trimMaterial);
  frontTrim.position.set(0, -.055, 1.303);
  scene.add(frontTrim);

  const footGeometry = new THREE.CylinderGeometry(.14, .12, .16, 24);
  for (const x of [-1.55, 1.55]) for (const z of [-.95, .95]) {
    const foot = new THREE.Mesh(footGeometry, rubberMaterial);
    foot.position.set(x, -.285, z);
    foot.castShadow = true;
    scene.add(foot);
  }

  const platter = new THREE.Mesh(new THREE.CylinderGeometry(1.085, 1.1, .035, 128), darkMetal);
  platter.position.set(-.37, .045, .04);
  platter.castShadow = true;
  platter.receiveShadow = true;
  scene.add(platter);

  const recordGroup = new THREE.Group();
  recordGroup.position.set(-.37, .067, .04);
  scene.add(recordGroup);
  const record = new THREE.Mesh(new THREE.CylinderGeometry(1.005, 1.005, .052, 160), new THREE.MeshPhysicalMaterial({ color: 0x0a0a09, roughness: .31, metalness: .16, clearcoat: .25 }));
  record.castShadow = true;
  record.receiveShadow = true;
  recordGroup.add(record);
  const recordFace = new THREE.Mesh(new THREE.CircleGeometry(1.003, 160), new THREE.MeshStandardMaterial({ map: makeGrooveTexture(), roughness: .34, metalness: .14, side: THREE.DoubleSide }));
  recordFace.rotation.x = -Math.PI / 2;
  recordFace.position.y = .0265;
  recordFace.receiveShadow = true;
  recordGroup.add(recordFace);

  const grooveMaterial = new THREE.MeshStandardMaterial({ color: 0x605d54, roughness: .31, metalness: .25, transparent: true, opacity: .38 });
  for (let i = 0; i < 10; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.36 + i * .061, .002, 4, 100), grooveMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = .0278 + (i % 2) * .0008;
    recordGroup.add(ring);
  }

  const label = new THREE.Mesh(new THREE.CylinderGeometry(.292, .292, .015, 72), new THREE.MeshPhysicalMaterial({ map: makeCenterLabel(), roughness: .38, metalness: .2, clearcoat: .25 }));
  label.position.y = .034;
  label.castShadow = true;
  recordGroup.add(label);
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(.025, .03, .04, 24), trimMaterial);
  spindle.position.y = .056;
  recordGroup.add(spindle);

  const pivot = new THREE.Group();
  pivot.position.set(1.18, .13, -.82);
  scene.add(pivot);
  const pivotFoot = new THREE.Mesh(new THREE.CylinderGeometry(.19, .22, .09, 48), darkMetal);
  pivotFoot.position.y = .045;
  pivotFoot.castShadow = true;
  pivot.add(pivotFoot);
  const pivotCap = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, .095, 48), trimMaterial);
  pivotCap.position.y = .13;
  pivot.add(pivotCap);
  const armStart = [1.17, .31, -.82];
  const armEnd = [.37, .265, .27];
  addCylinderBetween(scene, armStart, armEnd, .027, darkMetal, 18);
  const counterweight = new THREE.Mesh(new THREE.CylinderGeometry(.078, .078, .21, 32), darkMetal);
  counterweight.rotation.x = Math.PI / 2.1;
  counterweight.position.set(1.25, .32, -.91);
  counterweight.castShadow = true;
  scene.add(counterweight);
  const headshell = new THREE.Mesh(new RoundedBoxGeometry(.12, .035, .22, 3, .015), trimMaterial);
  headshell.position.set(.36, .24, .28);
  headshell.rotation.y = -.3;
  headshell.castShadow = true;
  scene.add(headshell);
  const cartridge = new THREE.Mesh(new RoundedBoxGeometry(.085, .055, .1, 3, .012), rubberMaterial);
  cartridge.position.set(.36, .208, .35);
  cartridge.castShadow = true;
  scene.add(cartridge);
  addCylinderBetween(scene, [.36, .2, .37], [.36, .045, .42], .008, trimMaterial, 10);

  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .18 }));
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -.37;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  mount?.classList.add('has-3d');
  let width = 1;
  let height = 1;
  let targetX = 0;
  let targetY = 0;
  let playing = false;
  let speed = 0;
  let frame = 0;
  let destroyed = false;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const onPointerMove = (event) => {
    const rect = mount.getBoundingClientRect();
    targetX = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
    targetY = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
  };
  const onPointerLeave = () => { targetX = 0; targetY = 0; };
  const onPlayState = (event) => { playing = Boolean(event.detail?.playing); };
  mount?.addEventListener('pointermove', onPointerMove, { passive: true });
  mount?.addEventListener('pointerleave', onPointerLeave, { passive: true });
  window.addEventListener('aurelia:play-state', onPlayState);

  let previous = performance.now();
  const tick = (now) => {
    if (destroyed) return;
    frame = requestAnimationFrame(tick);
    const delta = Math.min((now - previous) / 1000, .05);
    previous = now;
    const targetSpeed = playing ? 1.9 : 0;
    speed = THREE.MathUtils.damp(speed, targetSpeed, 1.8, delta);
    recordGroup.rotation.y += speed * delta;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX * .12, 1.6, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 4.55 + targetY * .08, 1.6, delta);
    camera.lookAt(targetX * .035, -.04 + targetY * .025, 0);
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(tick);

  const api = {
    setPlaying(value) { playing = Boolean(value); },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      mount?.removeEventListener('pointermove', onPointerMove);
      mount?.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('aurelia:play-state', onPlayState);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      renderer.dispose();
      mount?.classList.remove('has-3d');
    }
  };
  return api;
}
