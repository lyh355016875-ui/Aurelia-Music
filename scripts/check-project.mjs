import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

for (const landmark of ['<aside class="sidebar', '<main class="main-stage"', 'class="now-playing panel"', 'class="queue-panel panel"', 'class="bottom-player panel"']) {
  assert.ok(html.includes(landmark), `Missing V0.1 layout region: ${landmark}`);
}
assert.ok(html.includes('<html lang="zh-CN">'), 'Chinese document language should be declared');
assert.ok(html.includes('name="viewport"'), 'Responsive viewport metadata should be present');
assert.ok(html.includes('aria-label="底部播放器区域预留"'), 'Reserved player area should be labeled accessibly');
assert.ok(html.includes('id="track-search" type="search"'), 'Search input should be present');
assert.ok(html.includes('data-filter="similar"'), 'Similar-recommendations tab should be present');
assert.ok(html.includes('data-page="设置"'), 'Settings navigation item should be present');
assert.ok(html.includes('Music<br /><span>Connects Us</span>'), 'V0.2 brand headline should be present');
for (const title of ['Better Days', 'Sunset Lover', '空山新雨后', '夜空中最亮的星', '风吹麦浪', 'City of Stars', '起风了', '晴天', '海阔天空']) {
  assert.ok(readFileSync(new URL('../app.js', import.meta.url), 'utf8').includes(title), `Missing sample track: ${title}`);
}
assert.ok(html.includes('href="./styles.css"'), 'Stylesheet should be linked');
assert.ok(html.includes('src="./app.js"'), 'App entry should be linked');
assert.ok(existsSync(new URL('../app.js', import.meta.url)), 'App entry file should exist');
assert.ok(css.includes('@media (max-width: 760px)'), 'Tablet/mobile layout breakpoint should exist');
assert.ok(css.includes('@media (max-width: 400px)'), 'Small-phone layout breakpoint should exist');
assert.ok(css.includes('prefers-reduced-motion: reduce'), 'Reduced-motion preference should be respected');
assert.ok(!html.includes('http://') && !html.includes('https://'), 'Page should not load remote runtime assets');
console.log('V0.1 foundation and V0.2 interface checks passed.');
