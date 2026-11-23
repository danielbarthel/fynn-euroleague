/* Synthetische Sounds per Web Audio API – keine Audiodateien nötig. */
(function () {
  "use strict";
  let ctx = null, master = null, noiseBuf = null, muted = false;

  function ensure() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(type, freq, dur, peak = 0.3, when = 0, slideTo) {
    const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    env(g, t, 0.005, peak, dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, filterType, freq, peak = 0.3, attack = 0.005, when = 0, q = 1) {
    const t = ctx.currentTime + when, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    env(g, t, attack, peak, dur); s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur + 0.05);
  }

  const SOUNDS = {
    shoot: () => noise(0.12, "bandpass", 900, 0.12),
    swish: () => { noise(0.35, "highpass", 3500, 0.35, 0.01); noise(0.25, "bandpass", 6000, 0.15, 0.02, 0.05); },
    rim: (i = 0.6) => { tone("sine", 620, 0.35, 0.25 * i + 0.05); tone("sine", 1240, 0.25, 0.12 * i + 0.03); tone("square", 310, 0.06, 0.05 * i); },
    board: (i = 0.6) => { noise(0.12, "lowpass", 500, 0.4 * i + 0.1); tone("sine", 140, 0.15, 0.25 * i + 0.05, 0, 90); },
    floor: (i = 0.5) => tone("sine", 120, 0.18, 0.35 * i + 0.05, 0, 60),
    cheer: () => { noise(2.2, "bandpass", 1400, 0.22, 0.35, 0, 0.6); noise(1.8, "bandpass", 700, 0.15, 0.3, 0.1, 0.5); },
    groan: () => { noise(1.0, "lowpass", 500, 0.12, 0.2); tone("sawtooth", 180, 0.9, 0.03, 0, 120); },
    buzzer: () => { tone("sawtooth", 233, 0.9, 0.18); tone("square", 236, 0.9, 0.08); },
    fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone("triangle", f, i > 3 ? 0.6 : 0.2, 0.25, i * 0.14)),
    unlock: () => [880, 1320].forEach((f, i) => tone("sine", f, 0.25, 0.18, i * 0.09)),
    fire: () => { noise(0.8, "lowpass", 900, 0.25, 0.05); tone("sawtooth", 90, 0.6, 0.06, 0, 200); },
    click: () => tone("sine", 700, 0.05, 0.08),
  };

  window.FYAudio = {
    unlock() { if (!muted) ensure(); },
    play(name, intensity) {
      if (muted || !SOUNDS[name]) return;
      if (!ensure()) return;
      try { SOUNDS[name](intensity); } catch (e) { /* Audio darf das Spiel nie stoppen */ }
    },
    setMuted(m) { muted = !!m; if (ctx) master.gain.value = muted ? 0 : 0.55; },
    get muted() { return muted; },
  };
})();
