const tracks = [
  { id: 'better-days', title: 'Better Days', artist: 'NEIKED · Mae Muller', album: 'Better Days', time: '3:18', tone: '#716044', group: 'playlist' },
  { id: 'sunset-lover', title: 'Sunset Lover', artist: 'Petit Biscuit', album: 'Presence', time: '3:57', tone: '#9b7650', group: 'playlist' },
  { id: 'empty-mountain', title: '空山新雨后', artist: '音阙诗听', album: '山水之间', time: '4:06', tone: '#596650', group: 'playlist' },
  { id: 'brightest-star', title: '夜空中最亮的星', artist: '逃跑计划', album: '世界', time: '4:12', tone: '#697084', group: 'playlist' },
  { id: 'wind-wheat', title: '风吹麦浪', artist: '李健', album: '想念你', time: '4:16', tone: '#98875b', group: 'playlist' },
  { id: 'city-stars', title: 'City of Stars', artist: 'Ryan Gosling · Emma Stone', album: 'La La Land', time: '2:29', tone: '#6d5865', group: 'playlist' },
  { id: 'starts-wind', title: '起风了', artist: '买辣椒也用券', album: '起风了', time: '5:10', tone: '#806550', group: 'playlist' },
  { id: 'sunny-day', title: '晴天', artist: '周杰伦', album: '叶惠美', time: '4:29', tone: '#a17c4d', group: 'playlist' },
  { id: 'beyond-sea', title: '海阔天空', artist: 'Beyond', album: '乐与怒', time: '5:24', tone: '#526573', group: 'playlist' }
];

const recommendations = [tracks[1], tracks[2], tracks[4], tracks[5], tracks[0], tracks[7]];
const list = document.querySelector('#queue-list');
const search = document.querySelector('#track-search');
const count = document.querySelector('#track-count');
const empty = document.querySelector('#no-results');
const tabs = [...document.querySelectorAll('.queue-tab')];
let activeFilter = 'playing';
let selectedTrack = null;

function escapeText(value) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function getVisibleTracks() {
  const q = search.value.trim().toLocaleLowerCase();
  const source = activeFilter === 'similar' ? recommendations : tracks;
  return source.filter((track) => !q || [track.title, track.artist, track.album, 'playlist', '歌单'].some((field) => field.toLocaleLowerCase().includes(q)));
}

function renderTracks() {
  const visible = getVisibleTracks();
  list.innerHTML = visible.map((track, index) => `
    <button class="track-row${selectedTrack === track.id ? ' is-selected' : ''}" type="button" data-track-id="${track.id}" aria-pressed="${selectedTrack === track.id}" style="--cover-tone:${track.tone}">
      <span class="track-art" aria-hidden="true"><span class="track-art-sun"></span><span class="track-art-horizon"></span><span class="track-art-disc"></span></span>
      <span class="track-copy"><span class="track-title">${escapeText(track.title)}</span><span class="track-artist">${escapeText(track.artist)} <span class="track-separator">·</span> ${escapeText(track.album)}</span></span>
      <span class="track-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="track-duration">${track.time}</span>
    </button>`).join('');
  count.textContent = `${String(visible.length).padStart(2, '0')} TRACK${visible.length === 1 ? '' : 'S'}`;
  empty.hidden = visible.length > 0;
  list.hidden = visible.length === 0;
  list.querySelectorAll('.track-row').forEach((row) => row.addEventListener('click', () => {
    selectedTrack = row.dataset.trackId;
    renderTracks();
  }));
}

search.addEventListener('input', renderTracks);
tabs.forEach((tab) => tab.addEventListener('click', () => {
  activeFilter = tab.dataset.filter;
  tabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', String(active));
  });
  renderTracks();
}));

document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach((link) => {
    const active = link === item;
    link.classList.toggle('is-current', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('.breadcrumb-page').textContent = item.dataset.page;
}));

renderTracks();
document.documentElement.dataset.ready = 'true';
