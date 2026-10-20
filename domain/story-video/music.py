"""music.py - the quiet chill pad under a story video.
usage: python music.py <scenes.json> <out.wav>      (length = sum of scene seconds)
       python music.py --seconds 50 <out.wav>
Level: RMS about -28 dBFS, peak about -18 dBFS (ffmpeg volumedetect on the final MP4 reads mean ~-28, max ~-18)."""
import json
import sys
import wave

import numpy as np

SR = 44100
BPM = 70.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
CH = [
    (36, [60, 64, 67, 71]),   # Cmaj7
    (33, [57, 60, 64, 67]),   # Am7
    (29, [53, 57, 60, 64]),   # Fmaj7
    (31, [59, 62, 64, 67]),   # G6
]


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)


def env_adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    na = min(na, n // 2); nr = min(nr, n // 2)
    e[:na] = np.linspace(0, 1, na) ** 1.5
    e[n - nr:] = np.linspace(1, 0, nr) ** 1.5
    return e


def voice(freq, dur, detune=0.0, tri=0.35, phase=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (1 + detune)
    s = np.sin(2 * np.pi * f * t + phase)
    s += tri * (np.sin(2 * np.pi * 3 * f * t) / 9 * 3) * 0.5
    s += 0.18 * np.sin(2 * np.pi * 2 * f * t)
    s *= 1 + 0.06 * np.sin(2 * np.pi * 0.23 * t + phase)
    return s


def make_music(dur, out):
    rng = np.random.default_rng(7)
    N = int((dur + 1) * SR)
    L = np.zeros(N); R = np.zeros(N)

    def add(buf, sig, start):
        i = int(start * SR)
        if i >= len(buf):
            return
        m = min(len(sig), len(buf) - i)
        buf[i:i + m] += sig[:m]

    n_bars = int(np.ceil((dur + 1) / BAR)) + 1
    for b in range(n_bars):
        root, notes = CH[b % 4]
        t0 = b * BAR
        d = BAR + 0.9
        for k, nt in enumerate(notes):
            f = midi(nt)
            for ch, det in ((L, -0.0025), (R, 0.0025)):
                v = voice(f, d, det, phase=k) * 0.11
                v *= env_adsr(len(v), 0.9, 1.1)
                add(ch, v, t0)
        f = midi(root)
        v = np.sin(2 * np.pi * f * np.arange(int(d * SR)) / SR) * 0.22
        v *= env_adsr(len(v), 0.35, 0.9)
        add(L, v, t0); add(R, v, t0)
        pat = [0, 2, 1, 3, 2, 1, 3, 2]
        for j in range(8):
            if (b + j) % 5 == 4:
                continue
            nt = notes[pat[j]] + (12 if j % 4 == 3 else 0)
            tt = t0 + j * BEAT / 2
            f = midi(nt)
            n = int(1.1 * SR)
            t = np.arange(n) / SR
            s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6)
            s *= np.exp(-t * 3.2) * (1 - np.exp(-t * 400))
            s *= 0.085
            pan = 0.35 + 0.3 * ((j % 3) / 2)
            add(L, s * (1 - pan), tt); add(R, s * pan, tt)

    for beat in range(int((dur + 1) / BEAT) + 1):
        tt = (beat + 0.5) * BEAT
        n = int(0.09 * SR)
        x = rng.standard_normal(n)
        x = np.diff(x, prepend=0)
        x = np.convolve(x, np.ones(6) / 6, mode="same")
        x *= np.exp(-np.arange(n) / SR * 55) * 0.018 * (1.0 if beat % 2 else 0.7)
        add(L, x, tt); add(R, x * 0.9, tt + 0.004)

    def echo(buf, delays, gains):
        o = buf.copy()
        for dl, g in zip(delays, gains):
            k = int(dl * SR)
            o[k:] += buf[:-k] * g
        return o
    L = echo(L, [0.19, 0.37, 0.61], [0.30, 0.20, 0.12])
    R = echo(R, [0.23, 0.43, 0.67], [0.30, 0.20, 0.12])

    def lowpass(x, fc=3200.0):
        X = np.fft.rfft(x)
        f = np.fft.rfftfreq(len(x), 1 / SR)
        return np.fft.irfft(X * (1 / (1 + (f / fc) ** 4)), len(x))
    L = lowpass(L); R = lowpass(R)

    n = int(dur * SR)
    L = L[:n]; R = R[:n]
    fi, fo = int(2 * SR), int(3 * SR)
    fade = np.ones(n)
    fade[:fi] = np.linspace(0, 1, fi) ** 1.5
    fade[n - fo:] = np.linspace(1, 0, fo) ** 1.5
    L *= fade; R *= fade

    st = np.stack([L, R], 1)
    st *= 10 ** (-28 / 20) / np.sqrt(np.mean(st ** 2))
    peak = np.max(np.abs(st))
    target_peak = 10 ** (-18 / 20)
    if peak > target_peak:
        k = target_peak
        st = k * np.tanh(st / k * 0.85) / np.tanh(0.85)
        st *= 10 ** (-28 / 20) / np.sqrt(np.mean(st ** 2))
    pcm = (np.clip(st, -1, 1) * 32767).astype("<i2")
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return 20 * np.log10(np.max(np.abs(st))), 20 * np.log10(np.sqrt(np.mean(st ** 2)))


if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) == 3 and a[0] == '--seconds':
        secs, out = float(a[1]), a[2]
    elif len(a) == 2:
        secs = float(sum(s['seconds'] for s in json.load(open(a[0], encoding='utf-8'))['scenes']))
        out = a[1]
    else:
        sys.exit(__doc__)
    pk, rms = make_music(secs, out)
    print("music: %.1f s, peak %.1f dBFS, rms %.1f dBFS -> %s" % (secs, pk, rms, out))
