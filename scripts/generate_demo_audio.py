#!/usr/bin/env python3
"""Generate short original instrumental demo loops (requires NumPy and ffmpeg)."""
from __future__ import annotations

import math
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "audio"
SAMPLE_RATE = 22_050
DURATION = 36.0
TRACKS = [
    ("better-days", 48, 104, 0.00),
    ("sunset-lover", 53, 108, 0.35),
    ("empty-mountain", 55, 96, 0.12),
    ("brightest-star", 50, 100, 0.48),
    ("wind-wheat", 57, 92, 0.22),
    ("city-stars", 52, 112, 0.66),
    ("starts-wind", 48, 102, 0.82),
    ("sunny-day", 55, 106, 0.56),
    ("beyond-sea", 53, 98, 0.28),
]


def hz(midi: int) -> float:
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def render_loop(root_note: int, bpm: int, phase: float) -> np.ndarray:
    samples = int(SAMPLE_RATE * DURATION)
    audio = np.zeros(samples, dtype=np.float32)
    beat = 60.0 / bpm
    bar = beat * 4
    chord_shapes = [(0, 4, 7), (9, 12, 16), (5, 9, 12), (7, 11, 14)]
    chord_roots = [root_note, root_note, root_note, root_note]

    # Warm sustained chords with a soft, rounded harmonic profile.
    for bar_index in range(round(DURATION / bar)):
        start_time = bar_index * bar
        chord_index = bar_index % 4
        lo = int(start_time * SAMPLE_RATE)
        hi = min(samples, int((start_time + bar) * SAMPLE_RATE))
        t = np.arange(hi - lo, dtype=np.float32) / SAMPLE_RATE
        envelope = np.minimum(np.minimum(t / .33, 1.0), np.maximum((bar - t) / .52, 0.0))
        envelope = np.maximum(envelope, 0.0)
        voicing = chord_shapes[chord_index]
        inversion = (bar_index // 4) % 2
        for voice, interval in enumerate(voicing):
            note = chord_roots[chord_index] + interval + (12 if voice == 2 and inversion else 0)
            frequency = hz(note)
            wobble = .0022 * np.sin(2 * np.pi * .16 * (t + start_time + phase))
            fundamental = np.sin(2 * np.pi * frequency * (1 + wobble) * t + phase + voice * .15)
            harmonic = .21 * np.sin(2 * np.pi * frequency * 2 * t + phase * .7)
            audio[lo:hi] += (.047 / (1 + voice * .14) * envelope * (fundamental + harmonic)).astype(np.float32)
        bass_frequency = hz(root_note - 12 + chord_shapes[chord_index][0])
        audio[lo:hi] += (.075 * envelope * np.sin(2 * np.pi * bass_frequency * t + phase)).astype(np.float32)

    # Delicate plucked notes keep the loop moving without becoming a busy beat.
    arp_notes = [root_note + 12 + step for shape in chord_shapes for step in shape]
    event_interval = beat / 2
    note_length = .9
    for event_index, start_time in enumerate(np.arange(0.4, DURATION - .2, event_interval)):
        note = arp_notes[event_index % len(arp_notes)]
        frequency = hz(note)
        lo = int(start_time * SAMPLE_RATE)
        hi = min(samples, lo + int(note_length * SAMPLE_RATE))
        t = np.arange(hi - lo, dtype=np.float32) / SAMPLE_RATE
        decay = np.exp(-t * (3.2 + .2 * (event_index % 3)))
        attack = np.minimum(t / .012, 1.0)
        shimmer = .19 * np.sin(2 * np.pi * frequency * 2.01 * t + phase)
        pluck = np.sin(2 * np.pi * frequency * t + phase) + shimmer
        audio[lo:hi] += (.045 * decay * attack * pluck).astype(np.float32)

    # Gentle stereo reflection and a short fade keep boundaries clean.
    delay_l = int(.115 * SAMPLE_RATE)
    delay_r = int(.173 * SAMPLE_RATE)
    left = audio.copy()
    right = audio.copy()
    left[delay_l:] += .11 * audio[:-delay_l]
    right[delay_r:] += .09 * audio[:-delay_r]
    fade = int(.7 * SAMPLE_RATE)
    fade_in = .5 - .5 * np.cos(np.linspace(0, np.pi, fade, dtype=np.float32))
    fade_out = fade_in[::-1]
    left[:fade] *= fade_in
    right[:fade] *= fade_in
    left[-fade:] *= fade_out
    right[-fade:] *= fade_out
    stereo = np.stack((left, right), axis=1)
    peak = float(np.max(np.abs(stereo)))
    if peak > 0:
        stereo *= min(.78 / peak, 1.0)
    return np.clip(stereo, -1.0, 1.0)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for slug, root_note, bpm, phase in TRACKS:
        pcm = np.int16(render_loop(root_note, bpm, phase) * 32767)
        with tempfile.NamedTemporaryFile(suffix=".wav") as wav_file:
            with wave.open(wav_file.name, "wb") as writer:
                writer.setnchannels(2)
                writer.setsampwidth(2)
                writer.setframerate(SAMPLE_RATE)
                writer.writeframes(pcm.tobytes())
            target = OUTPUT / f"{slug}.mp3"
            subprocess.run([
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", wav_file.name,
                "-codec:a", "libmp3lame", "-b:a", "96k", "-ar", str(SAMPLE_RATE), str(target)
            ], check=True)
        print(f"Generated {target.relative_to(ROOT)} ({target.stat().st_size // 1024} KiB)")


if __name__ == "__main__":
    main()
