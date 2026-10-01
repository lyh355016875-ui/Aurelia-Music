import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const scene = readFileSync(new URL('../src/vinyl-stage.js', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

for (const landmark of ['<aside class="sidebar', '<main class="main-stage"', 'class="now-playing panel"', 'class="queue-panel panel"', 'class="bottom-player panel"']) {
  assert.ok(html.includes(landmark), `Missing V0.1 layout region: ${landmark}`);
}
assert.ok(html.includes('<html lang="zh-CN">'), 'Chinese document language should be declared');
assert.ok(html.includes('name="viewport"'), 'Responsive viewport metadata should be present');
assert.ok(html.includes('aria-label="音乐播放器控制"'), 'Player controls should have an accessible label');
assert.ok(html.includes('id="track-search" type="search"'), 'Search input should be present');
assert.ok(html.includes('data-filter="similar"'), 'Similar-recommendations tab should be present');
assert.ok(html.includes('data-page="设置"'), 'Settings navigation item should be present');
assert.ok(html.includes('Music<br /><span>Connects Us</span>'), 'V0.2 brand headline should be present');
for (const title of ['Better Days', 'Sunset Lover', '空山新雨后', '夜空中最亮的星', '风吹麦浪', 'City of Stars', '起风了', '晴天', '海阔天空']) {
  assert.ok(readFileSync(new URL('../app.js', import.meta.url), 'utf8').includes(title), `Missing sample track: ${title}`);
}
assert.ok(html.includes('href="./styles.css"'), 'Stylesheet should be linked');
assert.ok(html.includes('src="./app.js"'), 'App entry should be linked');
assert.ok(html.includes('id="vinyl-canvas"'), '3D vinyl canvas should be present');
for (const control of ['audio-player', 'play-toggle', 'previous-track', 'next-track', 'seek-bar', 'volume-control', 'volume-button']) {
  assert.ok(html.includes(`id="${control}"`), `Missing audio control: ${control}`);
}
for (const slug of ['better-days', 'sunset-lover', 'empty-mountain', 'brightest-star', 'wind-wheat', 'city-stars', 'starts-wind', 'sunny-day', 'beyond-sea']) {
  assert.ok(existsSync(new URL(`../public/audio/${slug}.mp3`, import.meta.url)), `Missing local demo audio: ${slug}`);
  assert.ok(existsSync(new URL(`../public/images/covers/${slug}.jpg`, import.meta.url)), `Missing track cover image: ${slug}`);
  assert.ok(app.includes(`cover: '/images/covers/${slug}.jpg'`), `Track data should reference its cover: ${slug}`);
}
assert.ok(existsSync(new URL('../public/images/v05-listening-room.jpg', import.meta.url)), 'Cinematic listening-room background should exist');
assert.ok(app.includes('switchTrack(index, true)'), 'Selecting a playlist row should start its audio');
assert.ok(app.includes('setCenterLabel(track.cover)') && scene.includes('setCenterLabel'), 'Selected cover should update the 3D vinyl center label');
assert.ok(scene.includes('centerLabel.texture.needsUpdate = true'), 'CanvasTexture should refresh after the cover image loads');
assert.ok(scene.includes('getCenterLabelSource'), 'The active vinyl label source should be observable for runtime verification');
assert.ok(css.includes("/images/v05-listening-room.jpg"), 'Hero should use the reference-inspired listening-room image');
assert.ok(html.includes('并非原版录音'), 'Sample/demo recordings should be identified as non-original recordings');
assert.ok(app.includes('audio.addEventListener(\'ended\''), 'Audio end should advance to the next track');
assert.ok(app.includes('seekAtPointer') && app.includes('ArrowRight'), 'Seeking should support pointer and keyboard');
assert.ok(app.includes('createMediaElementSource(audio)') && app.includes('createAnalyser()'), 'V0.6 should connect one Web Audio media source to an analyser');
assert.ok(app.includes('analyser.fftSize = 1024') && app.includes('aurelia:analyzer-ready'), 'Analyzer setup should use a stable FFT size and notify the scene');
assert.ok(scene.includes('getByteFrequencyData(frequencyData)'), 'The scene should read live frequency data');
assert.ok(scene.includes('new THREE.InstancedMesh') && scene.includes('visualizerSegments = 56'), 'The spectrum should use a bounded 56-segment instanced ring');
assert.ok(scene.includes('aurelia:analyzer-ready'), 'The scene should subscribe to the single analyser instance');
assert.ok(scene.includes('getVisualizerState'), 'Analyzer connection and visualization state should be observable for verification');
assert.ok(html.includes('role="button" tabindex="0" aria-label="点击黑胶唱片播放或暂停"'), 'The vinyl must be keyboard accessible with a playback label');
assert.ok(scene.includes('raycaster.intersectObject(recordGroup, true)') && scene.includes('aurelia:vinyl-toggle'), 'Clicking the 3D record should dispatch the playback toggle');
assert.ok(app.includes('displayTransitionNodes') && app.includes('is-track-transitioning'), 'Track title and cover updates should crossfade');
assert.ok(scene.includes('labelTargetOpacity') && scene.includes('camera.position.y'), 'The 3D center label should fade and pointer parallax should tilt smoothly');
assert.ok(css.includes('.is-track-transitioning') && css.includes('background-color .55s ease'), 'V0.7 should include cover transitions and subtle background-tone animation');
assert.ok(css.includes(':active') && html.includes('role="button" tabindex="0"'), 'Controls should expose press state and keyboard interaction');
assert.ok(html.includes('id="mini-player-return"') && html.includes('id="favorite-track"'), 'The mini player should expose return and favorite controls');
assert.ok(app.includes('localStorage.setItem(favoritesStorageKey') && app.includes('aria-pressed'), 'Favorites should persist and expose their state accessibly');
assert.ok(app.includes('miniPlayerReturn') && app.includes("scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth'"), 'The mini player should return focus to the central player');
assert.ok(app.includes('favoriteIds.has(track.id)') && app.includes('updateFavoriteButton'), 'Favorite state should follow the active track');
assert.ok(scene.includes('RoundedBoxGeometry') && scene.includes('CylinderGeometry'), '3D scene should include the turntable plinth and disc');
assert.ok(scene.includes('aurelia:play-state'), '3D rotation should expose a playback-state hook');
assert.ok(packageJson.dependencies.three, 'Three.js should be a local project dependency');
assert.ok(packageJson.scripts.build, 'A production build command should be available');
assert.ok(existsSync(new URL('../app.js', import.meta.url)), 'App entry file should exist');
assert.ok(css.includes('@media (max-width: 760px)'), 'Tablet/mobile layout breakpoint should exist');
assert.ok(css.includes('@media (max-width: 400px)'), 'Small-phone layout breakpoint should exist');
assert.ok(css.includes('prefers-reduced-motion: reduce'), 'Reduced-motion preference should be respected');
assert.ok(!html.includes('http://') && !html.includes('https://'), 'Page should not load remote runtime assets');
console.log('V0.1–V0.8 foundation, UI, 3D, audio, artwork, analyser, interaction, and Mini Player checks passed.');
