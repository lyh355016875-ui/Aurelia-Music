// Classic-script runtime: createVinylStage is declared as a top-level
// function in ./src/vinyl-stage.js, loaded before this file, so it is
// available as a global. No ES module imports are used here.

const tracks = [
  { id: 'better-days', title: 'Better Days', artist: 'NEIKED · Mae Muller', album: 'Better Days', time: '0:36', tone: '#716044', audio: '/audio/better-days.mp3', cover: '/images/covers/better-days.jpg' },
  { id: 'sunset-lover', title: 'Sunset Lover', artist: 'Petit Biscuit', album: 'Presence', time: '0:36', tone: '#9b7650', audio: '/audio/sunset-lover.mp3', cover: '/images/covers/sunset-lover.jpg' },
  { id: 'empty-mountain', title: '空山新雨后', artist: '音阙诗听', album: '山水之间', time: '0:36', tone: '#596650', audio: '/audio/empty-mountain.mp3', cover: '/images/covers/empty-mountain.jpg' },
  { id: 'brightest-star', title: '夜空中最亮的星', artist: '逃跑计划', album: '世界', time: '0:36', tone: '#697084', audio: '/audio/brightest-star.mp3', cover: '/images/covers/brightest-star.jpg' },
  { id: 'wind-wheat', title: '风吹麦浪', artist: '李健', album: '想念你', time: '0:36', tone: '#98875b', audio: '/audio/wind-wheat.mp3', cover: '/images/covers/wind-wheat.jpg' },
  { id: 'city-stars', title: 'City of Stars', artist: 'Ryan Gosling · Emma Stone', album: 'La La Land', time: '0:36', tone: '#6d5865', audio: '/audio/city-stars.mp3', cover: '/images/covers/city-stars.jpg' },
  { id: 'starts-wind', title: '起风了', artist: '买辣椒也用券', album: '起风了', time: '0:36', tone: '#806550', audio: '/audio/starts-wind.mp3', cover: '/images/covers/starts-wind.jpg' },
  { id: 'sunny-day', title: '晴天', artist: '周杰伦', album: '叶惠美', time: '0:36', tone: '#a17c4d', audio: '/audio/sunny-day.mp3', cover: '/images/covers/sunny-day.jpg' },
  { id: 'beyond-sea', title: '海阔天空', artist: 'Beyond', album: '乐与怒', time: '0:36', tone: '#526573', audio: '/audio/beyond-sea.mp3', cover: '/images/covers/beyond-sea.jpg' }
];

// Resolve demo-audio and cover-art paths so the page works both on the Vite
// dev/build server and when index.html is opened directly via file://
// (double-click). On the server, public/ is served at the site root, so the
// original '/audio/...' and '/images/...' paths already resolve; on file://
// they would resolve to the filesystem root, so we prefix with './public' to
// stay local. The string literals in the tracks array are left unchanged.
const assetBase = location.protocol === 'file:' ? './public' : '';
for (const track of tracks) {
  track.audio = assetBase + track.audio;
  track.cover = assetBase + track.cover;
}

const recommendations = [tracks[1], tracks[2], tracks[4], tracks[5], tracks[0], tracks[7]];
const list = document.querySelector('#queue-list');
const search = document.querySelector('#track-search');
const count = document.querySelector('#track-count');
const empty = document.querySelector('#no-results');
const tabs = [...document.querySelectorAll('.queue-tab')];
const audio = document.querySelector('#audio-player');
const playButton = document.querySelector('#play-toggle');
const seekBar = document.querySelector('#seek-bar');
const progressFill = document.querySelector('#progress-fill');
const currentTimeLabel = document.querySelector('#current-time');
const totalTimeLabel = document.querySelector('#total-time');
const volumeSlider = document.querySelector('#volume-control');
const volumeButton = document.querySelector('#volume-button');
const audioStatus = document.querySelector('#audio-status');
const favoriteButton = document.querySelector('#favorite-track');
const miniPlayerReturn = document.querySelector('#mini-player-return');
const playModeButton = document.querySelector('#play-mode');
const playModeStorageKey = 'aurelia:play-mode';
const validPlayModes = new Set(['list', 'one', 'shuffle']);
let playMode = 'list';
try {
  const storedPlayMode = window.localStorage.getItem(playModeStorageKey);
  if (validPlayModes.has(storedPlayMode)) playMode = storedPlayMode;
} catch {
  playMode = 'list';
}
const favoritesStorageKey = 'aurelia:favorite-tracks';
let favoriteIds = new Set();
try {
  const storedFavorites = JSON.parse(window.localStorage.getItem(favoritesStorageKey) || '[]');
  if (Array.isArray(storedFavorites)) favoriteIds = new Set(storedFavorites.filter((id) => tracks.some((track) => track.id === id)));
} catch {
  favoriteIds = new Set();
}
const displayTransitionNodes = [
  document.querySelector('.bottom-track-title'),
  document.querySelector('.bottom-track-artist'),
  document.querySelector('#stage-song-title'),
  document.querySelector('#stage-song-artist'),
  document.querySelector('.mini-art'),
  document.querySelector('.empty-art')
];
let activeFilter = 'playing';
let currentIndex = 0;
let lastVolume = Number(volumeSlider.value);
let draggingSeek = false;
let displayTransitionId = 0;
let audioContext = null;
let mediaSource = null;
let analyser = null;

function initializeAnalyser() {
  if (analyser) return analyser;
  // When index.html is opened directly via file:// (double-click), the <audio>
  // element's media has an opaque null origin. Routing it through a Web Audio
  // MediaElementSource taints the node and outputs silence, so the analyser is
  // skipped here and the <audio> plays through its normal output instead. Use
  // `npm run dev` (HTTP, same-origin media) to enable the live spectrum.
  if (location.protocol === 'file:') {
    audioStatus.textContent = '本地直接打开：频谱可视化不可用，音频播放正常。';
    return null;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    audioStatus.textContent = '当前浏览器不支持实时音乐可视化。';
    return null;
  }
  try {
    audioContext = new AudioContextClass();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = .86;
    analyser.minDecibels = -78;
    analyser.maxDecibels = -18;
    mediaSource = audioContext.createMediaElementSource(audio);
    mediaSource.connect(analyser);
    analyser.connect(audioContext.destination);
    window.dispatchEvent(new CustomEvent('aurelia:analyzer-ready', { detail: { analyser, audioContext } }));
    return analyser;
  } catch (error) {
    console.warn('Audio analyser could not be initialized; standard audio playback remains available.', error);
    analyser = null;
    audioStatus.textContent = '实时可视化暂不可用，播放器仍可正常使用。';
    return null;
  }
}

function playAudio() {
  initializeAnalyser();
  if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
  try {
    audio.play().catch(() => { audioStatus.textContent = '音频无法播放，请检查浏览器的音频权限。'; });
  } catch {
    audioStatus.textContent = '音频无法播放，请检查浏览器的音频权限。';
  }
}

function escapeText(value) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function updateFavoriteButton() {
  const track = tracks[currentIndex];
  const isFavorite = favoriteIds.has(track.id);
  favoriteButton.setAttribute('aria-pressed', String(isFavorite));
  favoriteButton.setAttribute('aria-label', isFavorite ? '取消收藏' : '收藏这首歌');
  favoriteButton.title = isFavorite ? '取消收藏' : '收藏这首歌';
  favoriteButton.classList.toggle('is-favorited', isFavorite);
}

function toggleFavorite() {
  const track = tracks[currentIndex];
  if (favoriteIds.has(track.id)) favoriteIds.delete(track.id);
  else favoriteIds.add(track.id);
  try {
    window.localStorage.setItem(favoritesStorageKey, JSON.stringify([...favoriteIds]));
  } catch {
    audioStatus.textContent = '收藏状态暂时仅保存在当前页面。';
  }
  updateFavoriteButton();
}

function updatePlayModeButton() {
  const label = { list: '列表循环', one: '单曲循环', shuffle: '随机播放' }[playMode];
  playModeButton.dataset.mode = playMode;
  playModeButton.setAttribute('aria-label', `播放模式：${label}`);
  playModeButton.setAttribute('aria-pressed', String(playMode !== 'list'));
  playModeButton.title = label;
  playModeButton.innerHTML = playMode === 'shuffle'
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 3 4 4-4 4M4 7h2.5c4.2 0 5.8 10 10 10H20M16 13l4 4-4 4M4 17h2.5c1.8 0 3.2-2.2 4.4-4.2M14 9c1.1-1.2 2.2-2 3.5-2H20"/></svg>'
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h12a4 4 0 0 1 4 4v.5M16 4l3 3-3 3M20 17H8a4 4 0 0 1-4-4v-.5M8 20l-3-3 3-3"/></svg>${playMode === 'one' ? '<span class="mode-one-badge" aria-hidden="true">1</span>' : ''}`;
}

function randomNextTrackIndex() {
  return tracks.length < 2 ? currentIndex : (currentIndex + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length;
}

function advanceAfterEnd() {
  if (playMode === 'one') switchTrack(currentIndex, true);
  else switchTrack(playMode === 'shuffle' ? randomNextTrackIndex() : currentIndex + 1, true);
}

function getVisibleTracks() {
  const query = search.value.trim().toLocaleLowerCase();
  const source = activeFilter === 'similar' ? recommendations : tracks;
  return source.filter((track) => !query || [track.title, track.artist, track.album, 'playlist', '歌单'].some((field) => field.toLocaleLowerCase().includes(query)));
}

function renderTracks() {
  const visible = getVisibleTracks();
  list.innerHTML = visible.map((track, index) => {
    const isCurrent = tracks[currentIndex].id === track.id;
    const isPlaying = isCurrent && !audio.paused;
    return `
    <button class="track-row${isCurrent ? ' is-selected' : ''}${isPlaying ? ' is-playing' : ''}" type="button" data-track-id="${track.id}" aria-pressed="${isCurrent}" style="--cover-tone:${track.tone};--cover-image:url('${track.cover}')">
      <span class="track-art" aria-hidden="true"><span class="track-art-sun"></span><span class="track-art-horizon"></span><span class="track-art-disc"></span></span>
      <span class="track-copy"><span class="track-title">${escapeText(track.title)}</span><span class="track-artist">${escapeText(track.artist)} <span class="track-separator">·</span> ${escapeText(track.album)}</span></span>
      <span class="track-index">${isPlaying ? '<span class="track-playing-mark" aria-hidden="true"><i></i><i></i><i></i></span>' : String(index + 1).padStart(2, '0')}</span>
      <span class="track-duration">${track.time}</span>
    </button>`;
  }).join('');
  count.textContent = `${String(visible.length).padStart(2, '0')} TRACK${visible.length === 1 ? '' : 'S'}`;
  empty.hidden = visible.length > 0;
  list.hidden = visible.length === 0;
  list.querySelectorAll('.track-row').forEach((row) => row.addEventListener('click', () => {
    const index = tracks.findIndex((track) => track.id === row.dataset.trackId);
    if (index >= 0) switchTrack(index, true);
  }));
}

function updateTrackDisplay(track) {
  const transitionId = ++displayTransitionId;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) displayTransitionNodes.forEach((node) => node.classList.add('is-track-transitioning'));
  audioStatus.textContent = '';
  const commitDisplay = () => {
    if (transitionId !== displayTransitionId) return;
    document.querySelector('.bottom-track-title').textContent = track.title;
    document.querySelector('.bottom-track-artist').textContent = track.artist;
    document.querySelector('#stage-song-title').textContent = track.title;
    document.querySelector('#stage-song-artist').textContent = `${track.artist} · ${track.album}`;
    miniPlayerReturn.setAttribute('aria-label', `打开正在播放：${track.title}`);
    document.querySelector('#current-track-status').textContent = `ORIGINAL DEMO · ${track.time}`;
    document.querySelector('.mini-art').style.setProperty('--cover-tone', track.tone);
    document.querySelector('.empty-art').style.setProperty('--cover-tone', track.tone);
    document.querySelector('.mini-art').style.backgroundImage = `linear-gradient(145deg, rgba(15,13,10,.04), rgba(15,13,10,.28)), url("${track.cover}")`;
    document.querySelector('.empty-art').style.backgroundImage = `linear-gradient(145deg, rgba(15,13,10,.04), rgba(15,13,10,.2)), url("${track.cover}")`;
    document.documentElement.style.setProperty('--cover-tone', track.tone);
    window.aureliaVinylStage?.setCenterLabel(track.cover);
    updateFavoriteButton();
    renderTracks();
    if (!reduceMotion) requestAnimationFrame(() => requestAnimationFrame(() => {
      if (transitionId === displayTransitionId) displayTransitionNodes.forEach((node) => node.classList.remove('is-track-transitioning'));
    }));
  };
  if (reduceMotion) commitDisplay();
  else window.setTimeout(commitDisplay, 170);
}

function updatePlaybackState(isPlaying) {
  playButton.setAttribute('aria-label', isPlaying ? '暂停' : '播放');
  playButton.setAttribute('aria-pressed', String(isPlaying));
  playButton.innerHTML = isPlaying
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 10 6-10 6z"/></svg>';
  document.documentElement.dataset.playing = String(isPlaying);
  window.dispatchEvent(new CustomEvent('aurelia:play-state', { detail: { playing: isPlaying } }));
  renderTracks();
}

function updateProgress() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  const fraction = duration > 0 ? Math.min(current / duration, 1) : 0;
  currentTimeLabel.textContent = formatTime(current);
  totalTimeLabel.textContent = formatTime(duration);
  progressFill.style.width = `${fraction * 100}%`;
  seekBar.setAttribute('aria-valuemax', String(Math.round(duration)));
  seekBar.setAttribute('aria-valuenow', String(Math.round(current)));
  seekBar.setAttribute('aria-valuetext', `${formatTime(current)} / ${formatTime(duration)}`);
  if (duration > 0) tracks[currentIndex].time = formatTime(duration);
}

function seekAtPointer(event) {
  const duration = audio.duration;
  if (!Number.isFinite(duration) || duration <= 0) return;
  const rect = seekBar.getBoundingClientRect();
  const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  audio.currentTime = fraction * duration;
  updateProgress();
}

function switchTrack(nextIndex, autoplay = !audio.paused) {
  currentIndex = (nextIndex + tracks.length) % tracks.length;
  const track = tracks[currentIndex];
  updateFavoriteButton();
  audio.pause();
  audio.src = track.audio;
  audio.load();
  updateTrackDisplay(track);
  updateProgress();
  if (autoplay) playAudio();
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

const togglePlayback = () => {
  if (audio.paused) playAudio();
  else audio.pause();
};
playButton.addEventListener('click', togglePlayback);
window.addEventListener('aurelia:vinyl-toggle', togglePlayback);
favoriteButton.addEventListener('click', toggleFavorite);
playModeButton.addEventListener('click', () => {
  playMode = ({ list: 'one', one: 'shuffle', shuffle: 'list' })[playMode];
  updatePlayModeButton();
  try { window.localStorage.setItem(playModeStorageKey, playMode); } catch { /* Current-page mode still works. */ }
  audioStatus.textContent = `播放模式：${{ list: '列表循环', one: '单曲循环', shuffle: '随机播放' }[playMode]}`;
});
miniPlayerReturn.addEventListener('click', () => {
  const playerPanel = document.querySelector('#now-playing-panel');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  playerPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  playerPanel.focus({ preventScroll: true });
});
document.querySelector('#previous-track').addEventListener('click', () => switchTrack(currentIndex - 1));
document.querySelector('#next-track').addEventListener('click', () => switchTrack(playMode === 'shuffle' ? randomNextTrackIndex() : currentIndex + 1));
audio.addEventListener('play', () => updatePlaybackState(true));
audio.addEventListener('pause', () => updatePlaybackState(false));
audio.addEventListener('ended', advanceAfterEnd);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateProgress);
audio.addEventListener('durationchange', updateProgress);
audio.addEventListener('error', () => { audioStatus.textContent = '音源加载失败，请稍后重试。'; });

seekBar.addEventListener('pointerdown', (event) => {
  draggingSeek = true;
  seekBar.setPointerCapture(event.pointerId);
  seekAtPointer(event);
});
seekBar.addEventListener('pointermove', (event) => { if (draggingSeek) seekAtPointer(event); });
seekBar.addEventListener('pointerup', () => { draggingSeek = false; });
seekBar.addEventListener('pointercancel', () => { draggingSeek = false; });
seekBar.addEventListener('keydown', (event) => {
  if (!Number.isFinite(audio.duration)) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + (event.key === 'ArrowRight' ? 5 : -5)));
  } else if (event.key === 'Home') audio.currentTime = 0;
  else if (event.key === 'End') audio.currentTime = audio.duration;
  else return;
  updateProgress();
});

volumeSlider.addEventListener('input', () => {
  audio.volume = Number(volumeSlider.value);
  volumeSlider.style.setProperty('--volume-percent', `${audio.volume * 100}%`);
  if (audio.volume > 0) lastVolume = audio.volume;
});
volumeButton.addEventListener('click', () => {
  if (audio.volume > 0) {
    lastVolume = audio.volume;
    audio.volume = 0;
    volumeSlider.value = '0';
    volumeSlider.style.setProperty('--volume-percent', '0%');
  } else {
    audio.volume = lastVolume || .72;
    volumeSlider.value = String(audio.volume);
    volumeSlider.style.setProperty('--volume-percent', `${audio.volume * 100}%`);
  }
});
audio.addEventListener('volumechange', () => {
  const muted = audio.muted || audio.volume === 0;
  volumeButton.setAttribute('aria-label', muted ? '恢复音量' : '静音');
  volumeButton.setAttribute('aria-pressed', String(muted));
  volumeButton.classList.toggle('is-muted', muted);
});

updatePlayModeButton();
renderTracks();
window.aureliaVinylStage = createVinylStage(document.querySelector('#vinyl-canvas'));
audio.volume = lastVolume;
volumeSlider.style.setProperty('--volume-percent', `${lastVolume * 100}%`);
audio.src = tracks[currentIndex].audio;
audio.load();
updateTrackDisplay(tracks[currentIndex]);
updatePlaybackState(false);
document.documentElement.dataset.ready = 'true';
