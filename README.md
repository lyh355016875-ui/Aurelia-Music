# Aurelia Music

Aurelia is a quiet, artful listening space inspired by premium audio equipment, vinyl records, and modern music apps.

## Releases

### V0.7 — Tactile interactions

- Hover over the 3D scene for restrained parallax; click/tap the record or focus it and press Enter/Space to play or pause.
- Track metadata and cover cards crossfade within roughly 340 ms; the 3D label fades between covers, while the hero image gains a very subtle cover-tone wash.
- Buttons include hover, pressed, and visible keyboard-focus feedback; transitions respect reduced-motion preferences.

### V0.6 — Music visualization

- Creates one Web Audio context, media-element source, and analyser only when playback is first requested; normal audio remains available when analysis is unsupported.
- Adds a restrained 56-segment warm-gold circular spectrum around the 3D record, driven by real audio frequency bins and settling when paused.

### V0.5 — Dynamic playlist and album artwork

- Clicking a queue row switches its demo audio, title, artist, duration, and cover, then starts playback.
- Track-specific generated cover art appears in the queue, now-playing card, mini player, and center label of the 3D record.
- Reframed the center listening stage around a cinematic sunset room to follow the provided visual reference.
- Current cover is highlighted; a restrained playback indicator appears only on the playing row.

### V0.4 — Audio playback

- Nine bundled, original 36-second instrumental demo loops (MP3); sample song/artist metadata is illustrative and the files are not original commercial recordings.
- Play/pause, previous/next, ended-track advance, current/total time, click/drag/keyboard seeking, volume, and mute/restore.
- Playback state synchronizes the 3D record rotation.

To regenerate the demo audio, run `python3 scripts/generate_demo_audio.py` with NumPy and `ffmpeg` installed.

### V0.3 — 3D vinyl player

- Real Three.js turntable scene with a grooved vinyl, center label, plinth, tonearm, cartridge, soft lighting, and shadows.
- Gentle pointer parallax and a rotation state hook for later audio-playback synchronization.
- Bundled local dependencies; no remote runtime assets.

### V0.2 — Premium listening-room interface

- Three-column desktop layout with navigation, central listening stage, and a dedicated queue.
- Restrained charcoal, warm-gold, and ivory visual language.
- Searchable sample catalog with playlist and similar-recommendation tabs.
- Responsive tablet and mobile layouts.
- Track selection and navigation feedback (audio playback arrives in V0.4).

### V0.1 — Project foundation

Established the page regions and responsive visual foundation without playback, search, audio analysis, or interactive 3D.

## Run locally

Requires Node.js.

```bash
npm install
npm run dev
```

Open [http://localhost:4173](http://localhost:4173).

## Verify

```bash
npm test
```
